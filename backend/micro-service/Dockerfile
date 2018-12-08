FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Copy files
COPY . ./

# Install dependencies
RUN npm install

# Start microservice
CMD node ./microService.js