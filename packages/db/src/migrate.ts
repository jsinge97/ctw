export function migrationCommandSummary() {
  return "Run `pnpm --filter @ctw/db prisma:generate` then apply Prisma migrations in the target environment.";
}
