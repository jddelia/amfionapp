import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ApiError } from "@amfion/shared";

export type ErrorCode = ApiError["code"];

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errorHandler = (error: Error, _request: FastifyRequest, reply: FastifyReply) => {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  reply.status(500).send({
    error: {
      code: "INTERNAL",
      message: "Unexpected error"
    }
  });
};

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler(errorHandler);
};
