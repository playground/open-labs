FROM node:14.15.1-alpine
WORKDIR /server
ADD common /server/common
ADD src /server/src
COPY tsconfig.json /server
COPY webpack.config.js /server
COPY package.json /server
RUN npm install &&\
    apk update &&\
    apk upgrade
RUN ls /server/common
RUN ls /server/src
RUN npm run bundle    
EXPOSE  8080
CMD node dist/index.js