FROM node:6-alpine
RUN apk update && apk add git
ADD package.json .
RUN npm install
ADD . .
CMD ["npm","start"]
