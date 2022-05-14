FROM icr.io/codeengine/node:12-alpine
RUN npm install
COPY dist/ieam-action.js .
EXPOSE 8080
CMD [ "node", "ieam-action.js" ]
