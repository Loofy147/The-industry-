# --- 1. Build Stage ---
# Use a Node.js version that includes npm.
FROM node:18-alpine AS build

# Set the working directory in the container.
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker's layer caching.
COPY package*.json ./

# Install all dependencies, including devDependencies for building/testing.
RUN npm install

# Copy the rest of the application source code.
COPY . .

# (Optional) Here you could run tests or a linter to ensure code quality
# RUN npm test

# --- 2. Production Stage ---
# Start from a clean, minimal Node.js image for the final artifact.
FROM node:18-alpine

WORKDIR /app

# Copy only the necessary files from the build stage.
COPY package*.json ./

# Install *only* production dependencies.
RUN npm ci --only=production

# Copy the application code from the build stage.
COPY --from=build /app .

# Expose the ports the application will run on.
EXPOSE 3000
EXPOSE 8080

# The command to run the application.
CMD ["node", "server.js"]
