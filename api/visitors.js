import { createClient } from 'redis';

const COUNTER_KEY = 'portfolio_visits';
let fallbackCount = 0;
let client = null;
let connectPromise = null;

function normalizeCount(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  if (!client) {
    client = createClient({ url: redisUrl });
    client.on('error', () => {
      // Requests already handle failures by falling back.
    });
  }

  if (!connectPromise) {
    connectPromise = client.connect().catch((error) => {
      connectPromise = null;
      throw error;
    });
  }

  await connectPromise;
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const modeParam = Array.isArray(req.query?.mode) ? req.query.mode[0] : req.query?.mode;
  const mode = modeParam === 'hit' || req.method === 'POST' ? 'hit' : 'get';

  try {
    const redis = await getRedisClient();
    if (!redis) {
      if (mode === 'hit') fallbackCount += 1;
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.status(200).json({ value: fallbackCount, warning: 'REDIS_URL is not set' });
    }

    const value = mode === 'hit'
      ? await redis.incr(COUNTER_KEY)
      : await redis.get(COUNTER_KEY);

    const normalized = normalizeCount(value);
    fallbackCount = normalized;

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({ value: normalized });
  } catch {
    if (mode === 'hit') fallbackCount += 1;
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({ value: fallbackCount, error: 'Counter storage unavailable' });
  }
}
