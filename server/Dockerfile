# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the API port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
