FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ src/
COPY public/ public/

EXPOSE 8990

USER node

CMD ["node", "src/server.js"]
