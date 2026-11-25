FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# ---------- Development ----------
FROM base AS development
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install --include=dev
COPY . .
EXPOSE 3000
EXPOSE 19302-19312/udp
CMD ["npm", "run", "dev", "--workspace=server"]

# ---------- Build ----------
FROM base AS build
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install
COPY tsconfig.base.json ./
COPY shared ./shared
COPY server ./server
RUN npx tsc -b -f shared server

# ---------- Production ----------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install --omit=dev --workspace=server --workspace=shared
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/src/persistence/postgres/migrations ./server/dist/persistence/postgres/migrations
USER node
EXPOSE 3000
EXPOSE 19302-19312/udp
CMD ["node", "server/dist/index.js"]