import mongoose from 'mongoose';
import Redis from 'ioredis';
import { env } from './env';

export async function connectMongo() {
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');
}

// Redis is optional: if it is down, the API still works, just without caching.
export const redis = new Redis(env.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});

export async function connectRedis() {
  try {
    await redis.connect();
    console.log('Redis connected');
  } catch {
    console.warn('Redis unavailable - running without cache');
  }
}
