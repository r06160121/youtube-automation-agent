FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* bun.lock* ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["node", "server.tsx"]