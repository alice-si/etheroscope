FROM node:alpine

# Create app directory
WORKDIR /app

# Download add source
RUN apk update && \
    apk upgrade && \
    apk --no-cache add git

# Copy files
COPY ../../backend/server ./

# Install dependencies
RUN npm install

# Start server
CMD node ./server.js