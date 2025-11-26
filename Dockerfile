# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create logs directory and set permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Change ownership of the app directory to the nodejs user
RUN chown -R nodejs:nodejs /usr/src/app

# Stay as root user to avoid permission issues with volume mounts
USER root

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=production

 

# Start the application
CMD ["npm", "start"]
