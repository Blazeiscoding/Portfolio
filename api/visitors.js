import { createClient } from 'redis';

const COUNTER_KEY = 'portfolio_visits';
const CONNECT_TIMEOUT_MS = 1200;
const COMMAND_TIMEOUT_MS = 1200;
let fallbackCount = 0;
let client = null;
let connectPromise = null;

function normalizeCount(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function sanitizeRedisUrl(value) {
  const trimmed = String(value ?? '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

async function resetRedisClient() {
  const existing = client;
  client = null;
  connectPromise = null;

  if (!existing) return;
  try {
    if (existing.isOpen) {
      await existing.quit();
    }
  } catch {
    // Ignore cleanup failures.
  }
}

async function getRedisClient() {
  const redisUrl = sanitizeRedisUrl(process.env.REDIS_URL);
  if (!redisUrl) return null;

  if (!client) {
    client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: CONNECT_TIMEOUT_MS,
        reconnectStrategy: () => false
      }
    });
    client.on('error', () => {
      // Requests already handle failures by falling back.
    });
  }

  if (!connectPromise) {
    connectPromise = withTimeout(
      client.connect(),
      CONNECT_TIMEOUT_MS + 300,
      'Redis connect timeout'
    ).catch(async (error) => {
      await resetRedisClient();
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
      res.setHeader('X-Counter-Source', 'fallback');
      return res.status(200).json({ value: fallbackCount, warning: 'REDIS_URL is not set' });
    }

    const value = mode === 'hit'
      ? await withTimeout(redis.incr(COUNTER_KEY), COMMAND_TIMEOUT_MS, 'Redis incr timeout')
      : await withTimeout(redis.get(COUNTER_KEY), COMMAND_TIMEOUT_MS, 'Redis get timeout');

    const normalized = normalizeCount(value);
    fallbackCount = normalized;

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Counter-Source', 'redis');
    return res.status(200).json({ value: normalized });
  } catch {
    await resetRedisClient();
    if (mode === 'hit') fallbackCount += 1;
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Counter-Source', 'fallback');
    return res.status(200).json({ value: fallbackCount, error: 'Counter storage unavailable' });
  }
}
