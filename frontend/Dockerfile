FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Copy files
COPY . ./

# Install dependencies
RUN npm install

# Start frontend
CMD ./node_modules/@angular/cli/bin/ng serve --host 0.0.0.0 --port 8090