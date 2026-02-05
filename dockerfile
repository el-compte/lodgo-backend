# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- PRODUCTION STAGE ----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# 🚀 Key fix: ignore scripts so husky doesn't run
RUN npm ci --omit=dev --ignore-scripts

EXPOSE 4000

CMD ["node", "dist/main.js"]
