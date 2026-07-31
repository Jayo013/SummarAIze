import pinoHttp from "pino-http";
import { env } from "../config/env";

export const requestLogger = pinoHttp({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: ["req.headers.authorization"],
  transport: env.NODE_ENV !== "production" ? { target: "pino-pretty" } : undefined,
});
