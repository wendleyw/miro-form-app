import Redis from 'ioredis';
import Bull from 'bull';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
  lazyConnect: true,
};

// Create Redis client for general use (with error handling)
export const redisClient = new Redis(redisConfig);
redisClient.on('error', (err) => {
  console.warn('Redis client error (continuing without Redis):', err.message);
});

// Create Redis client for Bull queues (with error handling)
export const redisQueue = new Redis(redisConfig);
redisQueue.on('error', (err) => {
  console.warn('Redis queue error (continuing without Redis):', err.message);
});

// Job queue configurations (with error handling)
let syncQueue: Bull.Queue | null = null;
let notificationQueue: Bull.Queue | null = null;

try {
  syncQueue = new Bull('sync operations', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });

  notificationQueue = new Bull('notifications', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 25,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });
} catch (error) {
  console.warn('Failed to initialize Bull queues (continuing without queues):', (error as Error).message);
}

export { syncQueue, notificationQueue };

// Queue event handlers (only if queues are available)
if (syncQueue) {
  syncQueue.on('completed', (job) => {
    console.log(`Sync job ${job.id} completed successfully`);
  });

  syncQueue.on('failed', (job, err) => {
    console.error(`Sync job ${job.id} failed:`, err.message);
  });
}

if (notificationQueue) {
  notificationQueue.on('completed', (job) => {
    console.log(`Notification job ${job.id} completed successfully`);
  });

  notificationQueue.on('failed', (job, err) => {
    console.error(`Notification job ${job.id} failed:`, err.message);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing Redis connections...');
  try {
    if (syncQueue) await syncQueue.close();
    if (notificationQueue) await notificationQueue.close();
    redisClient.disconnect();
    redisQueue.disconnect();
  } catch (error) {
    console.warn('Error during Redis shutdown:', (error as Error).message);
  }
});

export default {
  redisClient,
  redisQueue,
  syncQueue,
  notificationQueue,
};