import type { FastifyInstance } from "fastify";

export const registerHealthRoutes = (app: FastifyInstance) => {
  app.get("/healthz", async () => ({ status: "ok" }));
  app.get("/readyz", async () => ({ status: "ready" }));
};
