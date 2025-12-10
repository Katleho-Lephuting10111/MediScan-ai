# Use the official Node.js image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package files first (this makes rebuilding faster)
COPY package*.json ./

# Install all the Node.js dependencies
RUN npm install

# Copy the rest of the application code (server.js, app/, public/, etc.)
COPY . .

# The application will run on port 5000 (check server.js to confirm)
EXPOSE 3000

# The command to start the application
CMD ["node", "server.js"]