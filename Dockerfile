# Use an official Node.js runtime as the base image
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for efficient Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the source code
COPY . .

# Start the app
CMD ["npm", "start"]
