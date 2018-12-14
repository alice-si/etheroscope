FROM node:alpine

# Create app directory
WORKDIR /app

# Download add source
RUN apk update && \
    apk upgrade && \
    apk --no-cache add git

# Copy files
COPY . ./

# Install dependencies
RUN npm install

# Start microservice
CMD node ./microService.js