# Use Node.js for building and serving
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the default Vite port
EXPOSE 3000

# Start the application in dev mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
