FROM oven/bun:latest

WORKDIR /app

COPY package.json package-lock.json* bun.lock* ./
RUN bun install

COPY . .
RUN bunx prisma generate
RUN bun run build

EXPOSE 3001

CMD ["bun", "run", "start"]