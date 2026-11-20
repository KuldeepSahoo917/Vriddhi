
# Stage 1: Build React application
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build


# Stage 2: Serve React application using Nginx
FROM nginx:alpine

# Substitute only APP_ALB_DNS in Nginx templates
ENV NGINX_ENVSUBST_FILTER=APP_ALB_DNS

COPY --from=build /app/dist /usr/share/nginx/html

# Copy dynamic Nginx configuration template
COPY default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
