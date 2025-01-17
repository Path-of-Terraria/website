# production stage
FROM nginx:alpine as production-stage

COPY nginx.conf /etc/nginx/nginx.conf
WORKDIR /usr/share/nginx/html

COPY build/ .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]