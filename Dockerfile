# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm ci

# Web build
RUN npm run build:web

# Runtime stage for web
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/web/dist /app/dist

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
