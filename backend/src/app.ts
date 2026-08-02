import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { apiRateLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import apiRouter from "./routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  // /api/v1 is canonical; /api stays mounted on the same router as a backward-compatible
  // alias so existing frontend builds (NEXT_PUBLIC_API_BASE=.../api) keep working unchanged.
  app.use("/api/v1", apiRateLimiter, apiRouter);
  app.use("/api", apiRateLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
