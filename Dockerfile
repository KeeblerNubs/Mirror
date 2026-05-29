FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV PORT=8788
EXPOSE 8788

CMD ["npx", "wrangler", "pages", "dev", "public", "--ip", "0.0.0.0", "--port", "8788"]
