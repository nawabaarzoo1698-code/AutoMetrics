import { redis } from '../config/db';
import { env } from '../config/env';

// Cache-aside: try Redis, else compute, then store. Redis failures never break the API.
export async function cached<T>(key: string, compute: () => Promise<T>): Promise<T> {
  if (redis.status === 'ready') {
    try {
      const hit = await redis.get(key);
      if (hit) return JSON.parse(hit) as T;
    } catch { /* ignore */ }
  }
  const value = await compute();
  if (redis.status === 'ready') {
    redis.set(key, JSON.stringify(value), 'EX', env.cacheTtl).catch(() => undefined);
  }
  return value;
}

export async function invalidate(pattern = 'dashboard:*') {
  if (redis.status !== 'ready') return;
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
}
