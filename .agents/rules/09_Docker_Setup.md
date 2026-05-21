# 🐳 Docker & Container Setup
## LAPOR MALANG — Containerization Guide
**Versi:** 1.0.0 | **Stack:** Docker + Docker Compose

---

## 1. Arsitektur Container

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Network: lapor-network                 │
│                                                                   │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────┐  │
│  │  frontend   │   │   backend    │   │   postgres           │  │
│  │  (Nginx)    │   │  (Express)   │   │   (PostgreSQL 15)    │  │
│  │  Port: 3000 │   │  Port: 5000  │   │   Port: 5432         │  │
│  │             │   │              │   │   Volume: pg_data     │  │
│  └──────┬──────┘   └──────┬───────┘   └──────────────────────┘  │
│         │                 │                                        │
│         │ /api/* proxy    │           ┌──────────────────────┐    │
│         └─────────────────►           │   redis              │    │
│                           │           │   Port: 6379         │    │
│  ┌─────────────┐          │           │   Volume: redis_data  │    │
│  │   nginx     │          ├──────────►│                      │    │
│  │ (Prod Rev.  │          │           └──────────────────────┘    │
│  │  Proxy)     │          │                                        │
│  │  Port:80/443│          │           ┌──────────────────────┐    │
│  └─────────────┘          └──────────►│   minio              │    │
│                                       │   Port: 9000 (API)   │    │
│                                       │   Port: 9001 (UI)    │    │
│                                       │   Volume: minio_data  │    │
│                                       └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Struktur File Docker

```
lapor-malang/
├── docker-compose.yml           # Development
├── docker-compose.prod.yml      # Production override
├── docker-compose.test.yml      # Testing
├── .env                         # Root env (shared secrets)
├── .env.example
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf               # Nginx config untuk SPA
│   └── ...
│
├── backend/
│   ├── Dockerfile
│   └── ...
│
└── nginx/                       # Production reverse proxy
    ├── Dockerfile
    ├── nginx.conf
    └── ssl/                     # SSL certificates
        ├── cert.pem
        └── key.pem
```

---

## 3. docker-compose.yml (Development)

```yaml
# docker-compose.yml

version: '3.9'

services:

  # ─────────────────────────────────────
  # FRONTEND — React (Vite dev server)
  # ─────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev           # Dev Dockerfile (vite dev server)
    container_name: lapor_frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src            # Hot reload — mount source
      - ./frontend/public:/app/public
      - /app/node_modules                  # Exclude node_modules dari mount
    environment:
      - VITE_API_URL=http://localhost:5000/api
      - VITE_MAP_DEFAULT_LAT=-8.1654
      - VITE_MAP_DEFAULT_LNG=112.6208
      - VITE_MAP_DEFAULT_ZOOM=11
    depends_on:
      - backend
    networks:
      - lapor-network

  # ─────────────────────────────────────
  # BACKEND — Express.js API
  # ─────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: lapor_backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - ./backend/src:/app/src             # Hot reload dengan nodemon
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=5000
      - FRONTEND_URL=http://localhost:3000
      - DATABASE_URL=postgresql://lapor_user:lapor_pass@postgres:5432/lapor_malang
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - JWT_EXPIRES_IN=15m
      - JWT_REFRESH_EXPIRES_IN=7d
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET_NAME=lapor-malang
      - MINIO_USE_SSL=false
      - MINIO_PUBLIC_URL=http://localhost:9000
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_started
    networks:
      - lapor-network

  # ─────────────────────────────────────
  # DATABASE — PostgreSQL 15
  # ─────────────────────────────────────
  postgres:
    image: postgres:15-alpine
    container_name: lapor_postgres
    restart: unless-stopped
    ports:
      - "5432:5432"                        # Expose untuk dev tools (DBeaver, etc)
    environment:
      POSTGRES_DB: lapor_malang
      POSTGRES_USER: lapor_user
      POSTGRES_PASSWORD: lapor_pass
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./backend/prisma/init.sql:/docker-entrypoint-initdb.d/init.sql  # Optional init script
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lapor_user -d lapor_malang"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - lapor-network

  # ─────────────────────────────────────
  # REDIS — Cache & Token Store
  # ─────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: lapor_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - lapor-network

  # ─────────────────────────────────────
  # MINIO — Object Storage (S3-compatible)
  # ─────────────────────────────────────
  minio:
    image: minio/minio:latest
    container_name: lapor_minio
    restart: unless-stopped
    ports:
      - "9000:9000"   # S3 API
      - "9001:9001"   # Web Console
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - lapor-network

  # ─────────────────────────────────────
  # MINIO INIT — Buat bucket otomatis
  # ─────────────────────────────────────
  minio-init:
    image: minio/mc:latest
    container_name: lapor_minio_init
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc alias set myminio http://minio:9000 ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY};
      /usr/bin/mc mb --ignore-existing myminio/lapor-malang;
      /usr/bin/mc anonymous set download myminio/lapor-malang/public;
      echo 'MinIO bucket initialized';
      exit 0;
      "
    networks:
      - lapor-network

# ─────────────────────────────────────
# VOLUMES
# ─────────────────────────────────────
volumes:
  pg_data:
    name: lapor_pg_data
  redis_data:
    name: lapor_redis_data
  minio_data:
    name: lapor_minio_data

# ─────────────────────────────────────
# NETWORKS
# ─────────────────────────────────────
networks:
  lapor-network:
    name: lapor-network
    driver: bridge
```

---

## 4. docker-compose.prod.yml (Production Override)

```yaml
# docker-compose.prod.yml

version: '3.9'

services:

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile                # Production Dockerfile (multi-stage build)
      args:
        - VITE_API_URL=${VITE_API_URL}
        - VITE_MAP_DEFAULT_LAT=-8.1654
        - VITE_MAP_DEFAULT_LNG=112.6208
    environment:
      - NODE_ENV=production
    restart: always
    volumes: []                             # Tidak ada volume mount di production

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile                # Production Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - FRONTEND_URL=${FRONTEND_URL}
    restart: always
    volumes: []

  postgres:
    ports: []                              # Tidak expose port ke host di production
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}    # Password lebih kuat di production

  redis:
    ports: []                              # Tidak expose port ke host

  minio:
    ports:
      - "9000:9000"
    # Console (9001) tidak di-expose di production

  # Nginx Reverse Proxy (hanya production)
  nginx:
    image: nginx:alpine
    container_name: lapor_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot
    depends_on:
      - frontend
      - backend
    networks:
      - lapor-network

volumes:
  certbot_data:
```

---

## 5. Dockerfile.dev — Frontend

```dockerfile
# frontend/Dockerfile.dev

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

---

## 6. Dockerfile — Frontend (Production)

```dockerfile
# frontend/Dockerfile

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL
ARG VITE_MAP_DEFAULT_LAT
ARG VITE_MAP_DEFAULT_LNG
ARG VITE_MAP_DEFAULT_ZOOM=11

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAP_DEFAULT_LAT=$VITE_MAP_DEFAULT_LAT
ENV VITE_MAP_DEFAULT_LNG=$VITE_MAP_DEFAULT_LNG
ENV VITE_MAP_DEFAULT_ZOOM=$VITE_MAP_DEFAULT_ZOOM

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

---

## 7. Dockerfile.dev — Backend

```dockerfile
# backend/Dockerfile.dev

FROM node:20-alpine

WORKDIR /app

# Install nodemon untuk hot reload
RUN npm install -g nodemon

COPY package*.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 5000

# Nodemon watch + migrate on start
CMD ["sh", "-c", "npx prisma migrate dev && nodemon src/index.js"]
```

---

## 8. Dockerfile — Backend (Production)

```dockerfile
# backend/Dockerfile

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Production stage
FROM node:20-alpine
WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD wget -q --spider http://localhost:5000/health || exit 1

# Migrate lalu start
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
```

---

## 9. Nginx Reverse Proxy (Production)

```nginx
# nginx/nginx.conf

worker_processes auto;
error_log /var/log/nginx/error.log warn;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile        on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    client_max_body_size 25M;              # Untuk upload foto (max 5 foto x 5MB)

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # HTTP → HTTPS redirect
    server {
        listen 80;
        server_name lapormalang.id www.lapormalang.id;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS — Main server
    server {
        listen 443 ssl http2;
        server_name lapormalang.id www.lapormalang.id;

        ssl_certificate     /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy "strict-origin-when-cross-origin";

        # Frontend — serve static dari Nginx container
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Backend API
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://backend:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 30s;
        }

        # Login endpoint — rate limit lebih ketat
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # MinIO public files (foto)
        location /storage/ {
            proxy_pass http://minio:9000/lapor-malang/;
            proxy_set_header Host $host;
            proxy_buffering off;
        }

        # Health check
        location /health {
            proxy_pass http://backend:5000/health;
        }
    }
}
```

---

## 10. .env Root (Template)

```env
# .env.example — Copy ke .env dan isi nilainya

# ─── JWT ───────────────────────────────────
JWT_SECRET=ganti_dengan_min_32_karakter_random_string
JWT_REFRESH_SECRET=ganti_dengan_min_32_karakter_random_string_berbeda

# ─── Database ──────────────────────────────
DB_PASSWORD=password_kuat_postgres
DATABASE_URL=postgresql://lapor_user:${DB_PASSWORD}@postgres:5432/lapor_malang

# ─── Redis ─────────────────────────────────
REDIS_PASSWORD=password_kuat_redis
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# ─── MinIO ─────────────────────────────────
MINIO_ACCESS_KEY=minioadmin_ganti_ini
MINIO_SECRET_KEY=miniosecret_ganti_ini_min_8_char

# ─── Encryption (NIK) ──────────────────────
# Generate: node -e "require('crypto').randomBytes(32).toString('hex') |> console.log"
ENCRYPTION_KEY=64_karakter_hex_string

# ─── Frontend URL ──────────────────────────
FRONTEND_URL=https://lapormalang.id
VITE_API_URL=https://lapormalang.id/api
```

---

## 11. Perintah Docker Penting

```bash
# ─── DEVELOPMENT ──────────────────────────────────────────────

# Start semua services (development)
docker compose up -d

# Lihat log semua service
docker compose logs -f

# Lihat log spesifik service
docker compose logs -f backend
docker compose logs -f postgres

# Masuk ke container
docker compose exec backend sh
docker compose exec postgres psql -U lapor_user -d lapor_malang

# Stop semua service
docker compose down

# Stop + hapus volume (HATI-HATI: data hilang)
docker compose down -v


# ─── DATABASE OPERATIONS ──────────────────────────────────────

# Jalankan migration
docker compose exec backend npx prisma migrate dev --name nama_migration

# Jalankan seed
docker compose exec backend npx prisma db seed

# Buka Prisma Studio (database GUI)
docker compose exec backend npx prisma studio

# Backup database manual
docker compose exec postgres pg_dump -U lapor_user lapor_malang > backup_$(date +%Y%m%d).sql

# Restore database
docker compose exec -T postgres psql -U lapor_user lapor_malang < backup.sql


# ─── PRODUCTION ───────────────────────────────────────────────

# Build dan start production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Rolling update (zero downtime untuk backend)
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --no-deps --build backend

# Cek health semua container
docker compose ps

# Resource usage
docker stats


# ─── CLEANUP ──────────────────────────────────────────────────

# Hapus image yang tidak terpakai
docker image prune -f

# Hapus semua resource tidak terpakai
docker system prune -f
```

---

## 12. Health Checks & Monitoring

```yaml
# Setiap service memiliki healthcheck:

postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U lapor_user -d lapor_malang"]
    interval: 10s      # Cek setiap 10 detik
    timeout: 5s        # Timeout 5 detik
    retries: 5         # 5x gagal = unhealthy

redis:
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5

backend:
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://localhost:5000/health"]
    interval: 30s
    timeout: 5s
    start_period: 30s  # Tunggu 30 detik sebelum mulai cek (waktu startup)
    retries: 3

frontend:
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://localhost/health"]
    interval: 30s
    timeout: 3s
    retries: 3

minio:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 20s
    retries: 3
```

---

## 13. Service Dependencies & Startup Order

```
minio ──────────────────────────────────┐
                                        │
postgres (healthy) ──┐                  │
                     ├──► backend ──────┼──► frontend
redis (healthy) ─────┘                  │
                                        │
minio-init (after minio healthy) ───────┘
                                        │
nginx ──────────────────────────────────┘
(depends on frontend + backend)
```
