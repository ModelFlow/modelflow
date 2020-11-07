FROM node:10

COPY package*.json ./

RUN npm install

COPY . . 

ARG REACT_APP_API_URL
RUN npm run build --production
RUN npm install -g serve

EXPOSE 3000
CMD serve -l 3000 -s --no-etag build
