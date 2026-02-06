import type { FastifyInstance } from "fastify";
import { chatStreamRequestSchema } from "@amfion/shared";
import { AppError } from "../lib/errors";
import { initSse, sendSseEvent, closeSse } from "../lib/sse";
import type { ChatSessionStore } from "../store/chatStore";

export const registerChatRoutes = (app: FastifyInstance, store: ChatSessionStore) => {
  app.post("/v1/chat/session", async (request) => {
    const tenant = request.tenant;
    if (!tenant) {
      throw new AppError("NOT_FOUND", "Tenant not found", 404);
    }

    const session = await store.create(tenant.tenantId);
    return { sessionId: session.id };
  });

  app.post("/v1/chat/stream", async (request, reply) => {
    const tenant = request.tenant;
    if (!tenant) {
      throw new AppError("NOT_FOUND", "Tenant not found", 404);
    }

    const parsed = chatStreamRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("INVALID_ARGUMENT", "Invalid chat payload", 400, parsed.error.flatten());
    }

    const session = await store.get(parsed.data.sessionId);
    if (!session) {
      throw new AppError("NOT_FOUND", "Chat session not found", 404);
    }

    await store.touch(session.id);

    initSse(reply);

    sendSseEvent(reply, "message", {
      type: "text",
      text: "Thanks! Our assistant is being set up. We'll be live shortly."
    });

    sendSseEvent(reply, "done", { ok: true });
    closeSse(reply);

    return reply;
  });
};
