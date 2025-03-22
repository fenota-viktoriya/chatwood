FROM node:23-alpine

RUN mkdir -p /app/
RUN chown node:node /app/


COPY ./  /app/
COPY ./.env.default /app/.env

WORKDIR /app

RUN npm install

RUN chown -R node:node /app
USER node:node
EXPOSE 3000

WORKDIR /app/

CMD npm run add-document && npm start