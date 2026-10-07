FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Start the Node.js proxy server
CMD ["node", "server.js"]
