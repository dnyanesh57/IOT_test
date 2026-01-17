FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./
COPY tsconfig.base.json turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm install --legacy-peer-deps

FROM base AS builder

WORKDIR /app/apps/web

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/public ./public

EXPOSE 3000

CMD ["npm","run","start"]
