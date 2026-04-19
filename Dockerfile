# Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Production Stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
COPY --from=builder /app ./ 

EXPOSE 8080
USER node
CMD ["node", "server.js"]
