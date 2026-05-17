export type WorkerHealth = {
  ok: boolean;
  process: "worker";
  queueMode: "memory" | "pgboss";
  registeredHandlerCount: number;
  checkedAt: string;
};

export function getWorkerHealth(input: { queueMode?: "memory" | "pgboss"; registeredHandlerCount?: number } = {}): WorkerHealth {
  return {
    ok: true,
    process: "worker",
    queueMode: input.queueMode ?? (process.env.CTW_JOBS_MODE === "pgboss" ? "pgboss" : "memory"),
    registeredHandlerCount: input.registeredHandlerCount ?? 0,
    checkedAt: new Date().toISOString()
  };
}
