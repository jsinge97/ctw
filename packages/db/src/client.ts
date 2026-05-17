export type DatabaseMode = "prisma" | "memory";

export type DatabaseClient = {
  mode: DatabaseMode;
};

export const databaseClient: DatabaseClient = {
  mode: process.env.CTW_DB_MODE === "prisma" ? "prisma" : "memory"
};
