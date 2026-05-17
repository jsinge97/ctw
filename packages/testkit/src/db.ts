import { getPrismaClient, resetSeedData, seedDatabase, seedIds } from "@ctw/db";

export async function resetAndSeedE2eDatabase() {
  const prisma = getPrismaClient();
  try {
    return await seedDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

export async function resetE2eDatabase() {
  const prisma = getPrismaClient();
  try {
    await resetSeedData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

export { seedIds };

async function main() {
  const result = await resetAndSeedE2eDatabase();
  console.log(`Seeded e2e database for ${result.organizationId}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
