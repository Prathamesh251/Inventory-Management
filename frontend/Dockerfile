# Use the official Node image to build the app
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Vite project (outputs to the 'dist' folder)
RUN npm run build

# Use Nginx to serve the built static files
FROM nginx:alpine

# Copy the built files from the builder stage to Nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 inside the container
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
