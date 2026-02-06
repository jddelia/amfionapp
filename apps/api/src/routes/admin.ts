import type { FastifyInstance } from "fastify";
import { AppError } from "../lib/errors";

export const registerAdminRoutes = (app: FastifyInstance) => {
  app.get("/v1/admin/me", async () => {
    throw new AppError("UNAUTHENTICATED", "Auth required", 401);
  });
};
