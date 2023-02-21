# Base image
FROM node:19 AS dependencies
WORKDIR /katrade
COPY package*.json ./
RUN npm install

FROM node:19 AS builder
WORKDIR /katrade
COPY . .
COPY --from=dependencies /katrade/node_modules ./node_modules
ENV NODE_OPTIONS=--max_old_space_size=16384
RUN npm run build

FROM node:19 AS runner
WORKDIR /katrade
COPY --from=builder /katrade/dist ./dist

CMD [ "node", "dist/main.js" ]