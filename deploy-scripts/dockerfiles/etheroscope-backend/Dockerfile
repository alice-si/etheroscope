FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Download add source
RUN git clone https://github.com/alice-si/etheroscope -b ZPP

WORKDIR /usr/src/app/etheroscope

# Install yarn
RUN npm install

# Bundle app source
#CMD ./node_modules/.bin/forever start ./deploy-scripts/deploy.json

CMD git pull && npm install && node ./backend/server.js
# & node ./backend/microService.js
