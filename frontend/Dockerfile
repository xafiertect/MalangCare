# ── Stage 1: Build Vite ──────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL = /api (relatif) agar request lewat Nginx, bukan langsung ke backend
ARG VITE_API_URL=/api
ARG VITE_MAP_DEFAULT_LAT=-8.1654
ARG VITE_MAP_DEFAULT_LNG=112.6208
ARG VITE_MAP_DEFAULT_ZOOM=11
ARG VITE_GOOGLE_CLIENT_ID=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAP_DEFAULT_LAT=$VITE_MAP_DEFAULT_LAT
ENV VITE_MAP_DEFAULT_LNG=$VITE_MAP_DEFAULT_LNG
ENV VITE_MAP_DEFAULT_ZOOM=$VITE_MAP_DEFAULT_ZOOM
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# ── Stage 2: Serve dengan Nginx ──────────────────────────────
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Hapus default config nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy hasil build
COPY --from=builder /app/dist .

# Config nginx untuk SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
