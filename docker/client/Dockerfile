# syntax=docker/dockerfile:1.7

# ---------- Build ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install
COPY tsconfig.base.json ./
COPY shared ./shared
COPY client ./client
RUN npx tsc -b -f shared client && npm --workspace=client exec vite build

# ---------- Development ----------
FROM node:24-alpine AS development
WORKDIR /app
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--workspace=client", "--", "--host", "0.0.0.0"]

# ---------- Production ----------
FROM nginx:1.27-alpine AS production
COPY docker/client/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]