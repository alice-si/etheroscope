FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Download add source
RUN git clone https://github.com/alice-si/etheroscope -b ZPP

WORKDIR /usr/src/app/etheroscope

# Install yarn
RUN npm install

# Bundle app source
CMD git pull && npm install && ./node_modules/@angular/cli/bin/ng serve --host 0.0.0.0 --port 8090