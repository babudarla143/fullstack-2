# Stage 1: Build React App
FROM node:19 as build
WORKDIR /app
COPY . .

# Inject backend URL for Kubernetes
ENV REACT_APP_API_BASE_URL=http://192.168.49.2:31500

RUN npm install
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
