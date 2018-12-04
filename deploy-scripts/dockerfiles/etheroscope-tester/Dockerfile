FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Download add source
RUN git clone https://github.com/alice-si/etheroscope -b ZPP

WORKDIR /usr/src/app/etheroscope

RUN npm install

CMD git pull && npm install && node ./backend/tester.js
