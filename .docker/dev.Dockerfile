FROM node:18.17.0-alpine3.18 as build

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

CMD [ "npm", "run", "start:dev" ]