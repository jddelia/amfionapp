import type { FastifyInstance } from "fastify";
import { AppError } from "../lib/errors";

export const registerPublicRoutes = (app: FastifyInstance) => {
  app.get("/v1/public/tenant", async (request) => {
    const tenant = request.tenant;
    if (!tenant) {
      throw new AppError("NOT_FOUND", "Tenant not found", 404);
    }

    return {
      tenantId: tenant.tenantId,
      slug: tenant.slug,
      profile: tenant.profile,
      branding: tenant.branding,
      services: tenant.services.filter((service) => service.active),
      faqs: tenant.faqs.filter((faq) => faq.active),
      policies: tenant.policies
    };
  });

  app.get("/v1/public/services", async (request) => {
    const tenant = request.tenant;
    if (!tenant) {
      throw new AppError("NOT_FOUND", "Tenant not found", 404);
    }
    return { services: tenant.services.filter((service) => service.active) };
  });

  app.get("/v1/public/availability", async (request) => {
    const tenant = request.tenant;
    if (!tenant) {
      throw new AppError("NOT_FOUND", "Tenant not found", 404);
    }

    const query = request.query as { service_id?: string; date?: string };

    return {
      serviceId: query.service_id ?? null,
      date: query.date ?? null,
      slots: []
    };
  });
};
