import type { FastifyReply } from "fastify";

export const initSse = (reply: FastifyReply) => {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  reply.raw.write("");
};

export const sendSseEvent = (reply: FastifyReply, event: string, data: unknown) => {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  reply.raw.write(`event: ${event}\n`);
  reply.raw.write(`data: ${payload}\n\n`);
};

export const closeSse = (reply: FastifyReply) => {
  reply.raw.end();
};
