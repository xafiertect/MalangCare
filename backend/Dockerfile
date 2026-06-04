# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Stage 2: Production
FROM node:24-alpine
WORKDIR /app

# Tambah non-root user demi keamanan
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

# Jalankan deploy migrations kemudian nyalakan server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
