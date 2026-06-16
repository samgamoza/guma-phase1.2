FROM node:20-slim
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY . .
RUN mkdir -p logs
# Run the HTTP API in the foreground and the BullMQ worker in the background.
CMD ["sh", "-c", "node src/queue/worker.js & node src/api.js"]
