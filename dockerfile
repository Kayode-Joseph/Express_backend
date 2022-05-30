FROM node:latest

WORKDIR /app

ADD . /app

RUN npm i


CMD node app.js

