# Multi-stage Dockerfile: build frontend, install server deps, run server
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY package-lock.json ./
COPY server/package*.json ./server/
# Install root dev deps for building frontend
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS runtime
WORKDIR /app
# Copy only what's needed
COPY --from=builder /app/dist ./dist
COPY server/package*.json ./server/
COPY server/index.js ./server/index.js
COPY .env.example ./
# Install server deps
WORKDIR /app/server
RUN npm ci --only=production --legacy-peer-deps
WORKDIR /app
EXPOSE 3001
ENV NODE_ENV=production
ENV STATIC_DIR=/app/dist
CMD ["node", "server/index.js"]
