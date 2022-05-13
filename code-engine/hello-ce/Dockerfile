FROM icr.io/codeengine/node:12-alpine
RUN npm install
COPY dist/hello-ce.js .
EXPOSE 8080
CMD [ "node", "hello-ce.js" ]
