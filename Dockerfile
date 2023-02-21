# Base image
FROM --platform=linux/amd64 node:19-alpine AS dependencies
WORKDIR /katrade
COPY package*.json ./
RUN npm install

FROM --platform=linux/amd64 node:19-alpine AS builder
WORKDIR /katrade
COPY . .
COPY --from=dependencies /katrade/node_modules ./node_modules
RUN npm run build

EXPOSE 8080

CMD [ "node", "dist/main.js" ]