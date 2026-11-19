# Stage 1: build the React app
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve it with nginx; /api is proxied to the backend
FROM nginx:1.27-alpine
ENV BACKEND_HOST=backend
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD nginx -t >/dev/null 2>&1 && kill -0 1
