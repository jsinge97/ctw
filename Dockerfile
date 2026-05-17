FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm prisma:generate
RUN pnpm build

CMD ["pnpm", "--filter", "@ctw/api", "start"]
