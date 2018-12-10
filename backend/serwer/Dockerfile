FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Copy files
COPY . ./

# Install dependencies
RUN npm install

# Start server
CMD node ./server.js