import { Worker } from "bullmq";
import { config } from "../config/index.js";
import { processCompilation } from "./processor.js";

let workerInstance: Worker | null = null;
let isRedisOnline = false;

export function setRedisStatus(status: boolean) {
  isRedisOnline = status;
}

export function startWorker() {
  if (!isRedisOnline) {
    console.log("ℹ️ Redis is offline. Running compilation worker in Mock (In-Memory) mode.");
    return null;
  }

  if (workerInstance) return workerInstance;

  workerInstance = new Worker(
    "export-jobs",
    async (job) => {
      return await processCompilation(job.data);
    },
    {
      connection: {
        url: config.redisUrl,
      },
    }
  );

  workerInstance.on("completed", (job) => {
    console.log(`🎉 Job ${job.id} completed successfully`);
  });

  workerInstance.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed: ${err.message}`);
  });

  workerInstance.on("error", (err) => {
    console.error(`❌ BullMQ worker connection error: ${err.message}`);
  });

  return workerInstance;
}
