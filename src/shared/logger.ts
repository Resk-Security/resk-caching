import pino from "pino";

let instance: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (instance) return instance;
  instance = pino({
    level: Bun.env.LOG_LEVEL ?? "info",
    transport: Bun.env.NODE_ENV === "production" ? undefined : {
      target: "pino-pretty",
      options: { translateTime: "SYS:standard", colorize: true },
    },
  });
  return instance;
}


