const COUNTER_KEY_PREFIX = 'portfolio_visits';
const REQUEST_TIMEOUT_MS = 1500;
const COUNTER_TIME_ZONE = 'Asia/Kolkata';
const fallbackCounts = new Map();

function normalizeCount(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function sanitizeEnvValue(value) {
  const trimmed = String(value ?? '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getCurrentCounterKey(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COUNTER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  return `${COUNTER_KEY_PREFIX}_${year}_${month}`;
}

function getFallbackCount(counterKey) {
  const value = fallbackCounts.get(counterKey);
  return normalizeCount(value);
}

function setFallbackCount(counterKey, value) {
  fallbackCounts.set(counterKey, normalizeCount(value));
}

function getUpstashConfig() {
  const url = sanitizeEnvValue(process.env.UPSTASH_REDIS_REST_URL).replace(/\/+$/, '');
  const token = sanitizeEnvValue(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url || !token) return null;
  return { url, token };
}

async function callUpstash(config, commandPath) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.url}/${commandPath}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.token}`
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Upstash HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (payload?.error) {
      throw new Error(String(payload.error));
    }

    return payload?.result;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const modeParam = Array.isArray(req.query?.mode) ? req.query.mode[0] : req.query?.mode;
  const mode = modeParam === 'hit' || req.method === 'POST' ? 'hit' : 'get';
  const debugParam = Array.isArray(req.query?.debug) ? req.query.debug[0] : req.query?.debug;
  const debug = debugParam === '1';
  const counterKey = getCurrentCounterKey();

  try {
    const upstash = getUpstashConfig();
    if (!upstash) {
      const nextFallbackValue = mode === 'hit'
        ? getFallbackCount(counterKey) + 1
        : getFallbackCount(counterKey);
      setFallbackCount(counterKey, nextFallbackValue);
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('X-Counter-Source', 'fallback');
      const payload = { value: nextFallbackValue, warning: 'Upstash env vars are not set' };
      if (debug) payload.details = 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel env vars';
      return res.status(200).json(payload);
    }

    const value = mode === 'hit'
      ? await callUpstash(upstash, `incr/${counterKey}`)
      : await callUpstash(upstash, `get/${counterKey}`);

    const normalized = normalizeCount(value);
    setFallbackCount(counterKey, normalized);

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Counter-Source', 'upstash');
    return res.status(200).json({ value: normalized });
  } catch (error) {
    const nextFallbackValue = mode === 'hit'
      ? getFallbackCount(counterKey) + 1
      : getFallbackCount(counterKey);
    setFallbackCount(counterKey, nextFallbackValue);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Counter-Source', 'fallback');
    const payload = { value: nextFallbackValue, error: 'Counter storage unavailable' };
    if (debug) {
      payload.details = error instanceof Error ? error.message : 'Unknown Redis error';
    }
    return res.status(200).json(payload);
  }
}
