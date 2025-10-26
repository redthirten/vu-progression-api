# Use an official Node.js runtime as the base image
FROM node:22-alpine

LABEL author="David Wolfe (Red-Thirten)" maintainer="red_thirten@yahoo.com"
LABEL version="0.1.4"
LABEL description="VU Progression API Docker image"
LABEL org.opencontainers.image.source="https://github.com/redthirten/vu-progression-api"
LABEL org.opencontainers.image.license="AGPL-3.0-or-later"

# Set working directory
WORKDIR /usr/src/app

# Install tzdata for timezone support
RUN apk add --no-cache tzdata

# Allow container timezone to be set via environment variable (default: UTC)
ENV TZ=UTC

# Copy package files first for efficient Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the source code
COPY . .

# Setup healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --start-interval=1s --retries=3 \
    CMD ["node", "healthcheck.js"]

# Start the app
CMD ["npm", "start"]
