import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import requestContext from "@fastify/request-context";
import Redis from "ioredis";
import { config } from "./config";
import { buildLogger } from "./lib/logger";
import { registerErrorHandler } from "./lib/errors";
import { createTenantResolver } from "./lib/tenant";
import { registerTenantContext } from "./lib/tenantContext";
import { registerHealthRoutes } from "./routes/health";
import { registerPublicRoutes } from "./routes/public";
import { registerChatRoutes } from "./routes/chat";
import { registerAdminRoutes } from "./routes/admin";
import { registerWebhookRoutes } from "./routes/webhooks";
import { MemoryTenantStore } from "./store/tenantStore";
import { buildSeedTenants } from "./store/seed";
import { MemoryChatSessionStore } from "./store/chatStore";

export const buildServer = () => {
  const logger = buildLogger(config.LOG_LEVEL);

  const app = Fastify({
    loggerInstance: logger,
    trustProxy: true,
    genReqId: () => crypto.randomUUID()
  });

  const corsOrigins = config.CORS_ORIGINS?.split(",").map((origin) => origin.trim());

  app.register(cors, {
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : false
  });

  app.register(helmet, {
    contentSecurityPolicy: false
  });

  app.register(sensible);
  app.register(requestContext);

  const redis = config.REDIS_URL ? new Redis(config.REDIS_URL) : undefined;

  app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    redis
  });

  if (redis) {
    app.addHook("onClose", async () => {
      await redis.quit();
    });
  }

  registerErrorHandler(app);

  const tenantStore = new MemoryTenantStore(buildSeedTenants(config));
  const resolveTenant = createTenantResolver(tenantStore, {
    hostSuffix: config.TENANT_HOST_SUFFIX
  });
  registerTenantContext(app, resolveTenant);

  const chatStore = new MemoryChatSessionStore();

  registerHealthRoutes(app);
  registerPublicRoutes(app);
  registerChatRoutes(app, chatStore);
  registerAdminRoutes(app);
  registerWebhookRoutes(app);

  return app;
};
