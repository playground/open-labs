FROM node:12.20.0-alpine3.10
RUN apk update
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npx", "serverless", "offline", "--host", "0.0.0.0" ]
