import type { FastifyInstance } from "fastify";
import type { TenantRecord } from "../store/tenantStore";

export type TenantResolver = (hostHeader: string | undefined) => Promise<TenantRecord | null>;

export const registerTenantContext = (app: FastifyInstance, resolveTenant: TenantResolver) => {
  app.addHook("preHandler", async (request) => {
    request.tenant = await resolveTenant(request.headers.host);
  });
};
