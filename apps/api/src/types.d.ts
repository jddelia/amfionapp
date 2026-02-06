import "fastify";
import type { TenantRecord } from "./store/tenantStore";

declare module "fastify" {
  interface FastifyRequest {
    tenant?: TenantRecord | null;
  }
}
