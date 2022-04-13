FROM node:17-alpine
RUN apk add --update --no-cache git python3 make g++
WORKDIR /usr/src/app
COPY . .
RUN echo 'API_HOST=http://127.0.0.1:8080' >> .env \
  && echo 'CONTENT_HOST=http://127.0.0.1:8080' >> .env \
  && echo 'SSE_HOST=http://127.0.0.1:8080/sse' >> .env
RUN yarn install \
  && yarn build
EXPOSE 9000
CMD ["yarn", "start"]
