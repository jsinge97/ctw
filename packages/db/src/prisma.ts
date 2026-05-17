import { PrismaClient } from "./generated/client/index.js";

let prisma: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  prisma ??= new PrismaClient();
  return prisma;
}

export type PrismaTransaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
