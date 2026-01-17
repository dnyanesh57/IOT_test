# Stage 1: Base image
FROM node:20-alpine AS base

WORKDIR /app

# Copy root package.json and package-lock.json
COPY package.json package-lock.json* .npmrc* ./
COPY tsconfig.base.json turbo.json ./

# Copy workspace folders
COPY apps ./apps
COPY packages ./packages

# Install all dependencies, ignoring peer dependency conflicts
RUN npm install --legacy-peer-deps

# Stage 2: Builder for production
FROM base AS builder

WORKDIR /app/apps/web

# Build Next.js app
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS prod

WORKDIR /app

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/public ./public

EXPOSE 3000

CMD ["npm", "start"]
