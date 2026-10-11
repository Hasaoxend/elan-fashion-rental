# Backend Dockerfile — production build
# Lưu ý: file này chưa được build thử trên máy dev (môi trường không có Docker).
# Cần đổi Prisma datasource sang "postgresql" trước khi dùng với docker-compose.

FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
RUN npm ci --omit=dev --workspace=apps/backend --include-workspace-root

FROM base AS build
COPY package.json package-lock.json* ./
COPY apps/backend apps/backend
RUN npm ci --workspace=apps/backend --include-workspace-root \
  && npx prisma generate --schema apps/backend/prisma/schema.prisma \
  && npm run build --workspace=apps/backend

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
EXPOSE 4000
WORKDIR /app/apps/backend
CMD ["node", "dist/index.js"]