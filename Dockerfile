# Stage 1: Build the frontend
FROM node:22-slim AS client-builder
WORKDIR /app/client
COPY package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the server
FROM node:22-slim AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 3: Final image
FROM node:22-slim
WORKDIR /app

# Copy server dist + node_modules
COPY --from=server-builder /app/dist ./dist
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/package*.json ./
COPY --from=server-builder /app/.env .env

# Copy frontend build to server/public
COPY --from=client-builder /app/client/dist ./server/public

EXPOSE 5000
CMD ["node", "--max-old-space-size=2048", "dist/index.js"]
