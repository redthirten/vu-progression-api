# Use an official Node.js runtime as the base image
FROM node:22-alpine

LABEL author="David Wolfe (Red-Thirten)" maintainer="red_thirten@yahoo.com"
LABEL version="0.1.1"
LABEL description="VU Progression API Docker image"
LABEL org.opencontainers.image.source="https://github.com/redthirten/vu-progression-api"
LABEL org.opencontainers.image.license="AGPL-3.0-or-later"

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
