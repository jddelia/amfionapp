import pino from "pino";

export const buildLogger = (level: string) =>
  pino({
    level,
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie", "req.headers['x-api-key']"],
      remove: true
    }
  });
