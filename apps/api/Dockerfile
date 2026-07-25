# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Build shared package first
RUN npm run build:shared

# Build API (TypeScript → JavaScript)
RUN npm run build -w apps/api

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy package files for production install
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built shared package
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

USER appuser

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --sp http://localhost:3000/api/health || exit 1

# Start the API
CMD ["node", "apps/api/dist/app.js"]
