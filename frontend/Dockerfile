FROM node:8 AS frontendBase

# Create app directory
WORKDIR /app

# Copy files
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

# Install dependencies
RUN npm install

FROM node:8 AS frontendEtheroscope
WORKDIR /app
# Copy files
COPY --from=frontendBase /app/node_modules ./node_modules
COPY ./ ./
# Start frontend
CMD ./node_modules/@angular/cli/bin/ng serve --prod --host 0.0.0.0 --port 8090 --disable-host-check
