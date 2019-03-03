FROM node:8 AS projectBase

# Create app directory
WORKDIR /app

# Copy files
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm install && \
    ls && \
    echo "-----------middle container end-------------"

FROM node:8 AS dataPointsServiceEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start microservice
CMD echo "CMD start dataPointsService\n" && node ./data-points-service/service.js

FROM node:8 AS serverEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start server
CMD echo "CMD start serwer\n" && node ./server/service.js

FROM node:8 AS databaseInitiatorEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start microservice
CMD echo "CMD start database initiator\n" && node ./database-initiator/setupNewDatabase.js

FROM node:8 AS contractInfoServiceEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start server
CMD echo "CMD start contract info service\n" && node ./contract-info-service/service.js

FROM node:8 AS blockTimestampServiceEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start server
CMD echo "CMD start block timestamp service\n" && node ./block-timestamp-service/service.js

FROM node:8 AS transactionListServiceEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start server
CMD echo "CMD start transaction list service\n" && node ./transaction-list-service/service.js
# case node:alpine
# Download add source
#RUN apk add --no-cache --virtual .build-deps alpine-sdk python && \
#    apk update && \
#    apk upgrade && \
#    apk --no-cache add git && \
#    apk del .build-deps && \
