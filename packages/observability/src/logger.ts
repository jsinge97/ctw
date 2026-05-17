export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

export type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
};

function write(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = { level, message, ...context, timestamp: new Date().toISOString() };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function createLogger(defaultContext: LogContext = {}): Logger {
  return {
    debug: (message, context) => write("debug", message, { ...defaultContext, ...context }),
    info: (message, context) => write("info", message, { ...defaultContext, ...context }),
    warn: (message, context) => write("warn", message, { ...defaultContext, ...context }),
    error: (message, context) => write("error", message, { ...defaultContext, ...context })
  };
}
