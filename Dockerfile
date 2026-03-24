# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS development
ENV NODE_ENV=development
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci && npx prisma generate
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM base AS build
ENV NODE_ENV=development
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS migration
ENV NODE_ENV=development
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS production-deps
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
