import type { FastifyInstance } from "fastify";
import { config } from "../config";
import { parseWebhookJson, verifyCalcomSignature } from "../lib/signature";

export const registerWebhookRoutes = (app: FastifyInstance) => {
  app.register(async (webhooks) => {
    // Cal.com signature verification must use the exact raw request bytes.
    webhooks.removeContentTypeParser("application/json");
    webhooks.addContentTypeParser(
      "application/json",
      { parseAs: "buffer" },
      (_request, payload, done) => done(null, payload)
    );
    webhooks.addContentTypeParser(
      "application/*+json",
      { parseAs: "buffer" },
      (_request, payload, done) => done(null, payload)
    );

    webhooks.post("/v1/webhooks/calcom", async (request, reply) => {
      if (!config.CAL_WEBHOOK_SECRET) {
        app.log.error("CAL_WEBHOOK_SECRET is missing; refusing Cal.com webhook request");
        return reply.status(500).send({
          error: {
            code: "INTERNAL",
            message: "Webhook endpoint is not configured"
          }
        });
      }

      const rawBody = Buffer.isBuffer(request.body) ? request.body : null;
      if (!rawBody) {
        app.log.error(
          {
            provider: "calcom",
            receivedBodyType: typeof request.body
          },
          "Webhook parser misconfigured: expected raw buffer body"
        );
        return reply.status(500).send({
          error: {
            code: "INTERNAL",
            message: "Webhook parser misconfigured"
          }
        });
      }
      const signatureHeader = request.headers["x-cal-signature-256"];
      const isSignatureValid = verifyCalcomSignature(rawBody, signatureHeader, config.CAL_WEBHOOK_SECRET);

      if (!isSignatureValid) {
        app.log.warn(
          {
            provider: "calcom",
            hasSignature: Boolean(signatureHeader)
          },
          "Rejected Cal.com webhook with invalid signature"
        );

        return reply.status(401).send({
          error: {
            code: "UNAUTHENTICATED",
            message: "Invalid webhook signature"
          }
        });
      }

      const payload = parseWebhookJson<{ triggerEvent?: string }>(rawBody);
      if (!payload) {
        return reply.status(400).send({
          error: {
            code: "INVALID_ARGUMENT",
            message: "Invalid JSON payload"
          }
        });
      }

      app.log.info(
        {
          provider: "calcom",
          eventType: payload.triggerEvent ?? null,
          webhookVersion: request.headers["x-cal-webhook-version"] ?? null
        },
        "Accepted Cal.com webhook"
      );

      return reply.status(202).send({ received: true });
    });

    webhooks.post("/v1/webhooks/stripe", async (request, reply) => {
      const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.from("");
      const payload = parseWebhookJson<{ type?: string; event_type?: string }>(rawBody);

      app.log.info(
        {
          provider: "stripe",
          eventType: payload?.type ?? payload?.event_type ?? null,
          hasSignature: Boolean(request.headers["stripe-signature"])
        },
        "Received Stripe webhook"
      );

      return reply.status(202).send({ received: true });
    });
  });
};
