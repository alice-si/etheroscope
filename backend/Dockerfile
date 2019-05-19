FROM node:8 AS projectBase

# Create app directory
WORKDIR /app

# Copy files
COPY package.json ./package.json

RUN npm install && \
    ls && \
    echo "-----------middle container end-------------"

FROM node:8 AS microServiceEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start microservice
CMD echo "CMD start microService\n" && node ./data-points-service/dataPointsService.js

FROM node:8 AS serverEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start server
CMD echo "CMD start serwer\n" && node ./server/server.js

FROM node:8 AS databaseInitiatorEtheroscope
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start microservice
CMD echo "CMD start database initiator\n" && node ./database-initiator/setupNewDatabase.js

FROM node:8 AS processContractService
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start microservice
CMD echo "CMD start processContractService\\n" && node ./process-contract-service/server.js

FROM node:8 AS delegateContractService
WORKDIR /app
# Copy files
COPY --from=projectBase /app/node_modules ./node_modules
COPY ./ ./
# Start microservice
CMD echo "CMD start delegateContractService\\n" && cd delegate-contract-service && ./range-delegator.sh