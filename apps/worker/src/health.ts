import PgBoss from "pg-boss";
import { assertProductionRuntimeSafety } from "@ctw/config";
import { jobNames } from "@ctw/jobs";

export type WorkerHealth = {
  ok: boolean;
  process: "worker";
  queueMode: "memory" | "pgboss";
  registeredHandlerCount: number;
  queueConnection: "ok" | "skipped" | "failed";
  checkedAt: string;
  error?: string;
};

export function getWorkerHealth(input: { queueMode?: "memory" | "pgboss"; registeredHandlerCount?: number } = {}): WorkerHealth {
  return {
    ok: true,
    process: "worker",
    queueMode: input.queueMode ?? (process.env.CTW_JOBS_MODE === "pgboss" ? "pgboss" : "memory"),
    registeredHandlerCount: input.registeredHandlerCount ?? 0,
    queueConnection: "skipped",
    checkedAt: new Date().toISOString()
  };
}

export async function getWorkerReadiness(source: NodeJS.ProcessEnv = process.env): Promise<WorkerHealth> {
  const checkedAt = new Date().toISOString();
  try {
    const runtime = assertProductionRuntimeSafety(source);
    const queueMode = runtime.CTW_JOBS_MODE === "pgboss" ? "pgboss" : "memory";
    const queueConnection = queueMode === "pgboss" ? await checkPgBossConnection(source.DATABASE_URL) : "skipped";
    return {
      ok: true,
      process: "worker",
      queueMode,
      registeredHandlerCount: Object.values(jobNames).length,
      queueConnection,
      checkedAt
    };
  } catch (error) {
    return {
      ok: false,
      process: "worker",
      queueMode: source.CTW_JOBS_MODE === "pgboss" ? "pgboss" : "memory",
      registeredHandlerCount: Object.values(jobNames).length,
      queueConnection: "failed",
      checkedAt,
      error: error instanceof Error ? error.message : "worker readiness failed"
    };
  }
}

async function checkPgBossConnection(databaseUrl: string | undefined): Promise<"ok"> {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for pg-boss worker mode");
  const boss = new PgBoss({ connectionString: databaseUrl });
  await boss.start();
  await boss.stop({ graceful: true, wait: true });
  return "ok";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const health = await getWorkerReadiness();
  console.log(JSON.stringify(health));
  if (!health.ok) process.exit(1);
}
