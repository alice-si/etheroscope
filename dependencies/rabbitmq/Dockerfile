FROM rabbitmq

# Create app directory
WORKDIR /app

# Copy files
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

# Install dependencies
RUN npm install


