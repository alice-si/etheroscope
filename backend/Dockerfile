FROM node:8 AS projectBase

# Create app directory
WORKDIR /app

# Copy files
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm install && \
    ls && \
    echo "-----------middle container end-------------"

FROM node:8 AS microServiceEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start microservice
CMD echo "CMD start microService\n" && node ./micro-service/microService.js

FROM node:8 AS serverEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start server
CMD echo "CMD start serwer\n" && node ./server/server.js

# case node:alpine
# Download add source
#RUN apk add --no-cache --virtual .build-deps alpine-sdk python && \
#    apk update && \
#    apk upgrade && \
#    apk --no-cache add git && \
#    apk del .build-deps && \
