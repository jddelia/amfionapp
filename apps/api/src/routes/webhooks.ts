import type { FastifyInstance } from "fastify";

export const registerWebhookRoutes = (app: FastifyInstance) => {
  app.post("/v1/webhooks/calcom", async (request, reply) => {
    app.log.info(
      {
        provider: "calcom",
        eventType: (request.body as { triggerEvent?: string } | null)?.triggerEvent ?? null,
        hasSignature: Boolean(request.headers["x-cal-signature-256"])
      },
      "Received Cal.com webhook"
    );

    return reply.status(202).send({ received: true });
  });

  app.post("/v1/webhooks/stripe", async (request, reply) => {
    app.log.info(
      {
        provider: "stripe",
        eventType:
          (request.body as { type?: string } | null)?.type ??
          (request.body as { event_type?: string } | null)?.event_type ??
          null,
        hasSignature: Boolean(request.headers["stripe-signature"])
      },
      "Received Stripe webhook"
    );

    return reply.status(202).send({ received: true });
  });
};
