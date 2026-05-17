export type WorkerHealth = {
  ok: boolean;
  process: "worker";
  checkedAt: string;
};

export function getWorkerHealth(): WorkerHealth {
  return {
    ok: true,
    process: "worker",
    checkedAt: new Date().toISOString()
  };
}
