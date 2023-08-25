FROM node:18-alpine as build
WORKDIR /app

RUN apk update && apk upgrade

COPY package.json yarn.lock ./
RUN yarn

COPY /src src/
RUN yarn build

FROM node:18-alpine
WORKDIR /app

COPY --from=build /app/package.json /app/yarn.lock ./
RUN yarn --prod

COPY --from=build /app/dist dist/
COPY /public public/

ENTRYPOINT [ "node", "dist/ff-bot.js" ]