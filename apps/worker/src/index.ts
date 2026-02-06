import { Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";
import pino from "pino";
import { config } from "./config";

const logger = pino({ level: config.LOG_LEVEL });

const connection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "jobs",
  async (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, "Processing job");

    switch (job.name) {
      case "process_calcom_webhook":
      case "process_stripe_webhook":
      case "send_sms":
      case "schedule_booking_reminders":
        return { ok: true };
      default:
        logger.warn({ jobName: job.name }, "Unknown job name");
        return { skipped: true };
    }
  },
  {
    connection,
    prefix: config.QUEUE_PREFIX
  }
);

const events = new QueueEvents("jobs", { connection, prefix: config.QUEUE_PREFIX });

worker.on("completed", (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, "Job completed");
});

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, jobName: job?.name, error }, "Job failed");
});

events.on("waiting", ({ jobId }) => {
  logger.debug({ jobId }, "Job waiting");
});

const shutdown = async () => {
  logger.info("Shutting down worker");
  await worker.close();
  await events.close();
  await connection.quit();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
