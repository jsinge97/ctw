FROM node:22-slim AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm prisma:generate
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "--filter", "@ctw/api", "start"]
