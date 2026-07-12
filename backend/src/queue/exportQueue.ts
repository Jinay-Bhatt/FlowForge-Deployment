import { Queue } from "bullmq";
import { config } from "../config/index.js";
import { processCompilation } from "./processor.js";

let realQueue: Queue | null = null;
let isRedisOnline = false;

export function initializeQueue(status: boolean) {
  isRedisOnline = status;
  if (isRedisOnline) {
    realQueue = new Queue("export-jobs", {
      connection: {
        url: config.redisUrl,
      },
    });

    realQueue.on("error", (err) => {
      console.error(`❌ BullMQ queue connection error: ${err.message}`);
    });
  } else {
    console.log("ℹ️ Redis is offline. Initialized Mock (In-Memory) Job Queue.");
  }
}

// Local in-memory store for fallback mode
const inMemoryJobs = new Map<string, {
  id: string;
  state: string;
  progress: number;
  failedReason?: string;
  returnvalue?: any;
  data: any;
}>();

export const exportQueue = {
  async add(name: string, data: any) {
    if (isRedisOnline && realQueue) {
      return await realQueue.add(name, data);
    }

    // In-memory fallback mode
    const jobId = `job-${Math.random().toString(36).substring(2, 11)}`;
    const jobInfo = {
      id: jobId,
      state: "active",
      progress: 0,
      data,
      returnvalue: undefined as any,
      failedReason: undefined as string | undefined,
    };
    inMemoryJobs.set(jobId, jobInfo);

    console.log(`📦 [Mock Queue] Queueing job ${jobId} in-memory`);

    // Run the job asynchronously in the background
    setTimeout(async () => {
      try {
        const result = await processCompilation(data);
        const job = inMemoryJobs.get(jobId);
        if (job) {
          job.state = "completed";
          job.progress = 100;
          job.returnvalue = result;
          console.log(`🎉 [Mock Queue] Job ${jobId} completed successfully`);
        }
      } catch (err: any) {
        const job = inMemoryJobs.get(jobId);
        if (job) {
          job.state = "failed";
          job.failedReason = err.message || "Compilation failed";
          console.error(`❌ [Mock Queue] Job ${jobId} failed: ${err.message}`);
        }
      }
    }, 100);

    return {
      id: jobId,
      getState: async () => "active",
      progress: 0,
    };
  },

  async getJob(jobId: string) {
    if (isRedisOnline && realQueue) {
      return await realQueue.getJob(jobId);
    }

    const job = inMemoryJobs.get(jobId);
    if (!job) return null;

    return {
      id: job.id,
      getState: async () => job.state,
      progress: job.progress,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
    };
  }
};
