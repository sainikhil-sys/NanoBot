import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  browser: {
    asObject: true,
  },
  base: {
    env: process.env.NODE_ENV,
  },
});
