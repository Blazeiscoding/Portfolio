const COUNTER_KEY = 'portfolio_visits';
const REQUEST_TIMEOUT_MS = 1500;
let fallbackCount = 0;

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

  try {
    const upstash = getUpstashConfig();
    if (!upstash) {
      if (mode === 'hit') fallbackCount += 1;
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('X-Counter-Source', 'fallback');
      const payload = { value: fallbackCount, warning: 'Upstash env vars are not set' };
      if (debug) payload.details = 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel env vars';
      return res.status(200).json(payload);
    }

    const value = mode === 'hit'
      ? await callUpstash(upstash, `incr/${COUNTER_KEY}`)
      : await callUpstash(upstash, `get/${COUNTER_KEY}`);

    const normalized = normalizeCount(value);
    fallbackCount = normalized;

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Counter-Source', 'upstash');
    return res.status(200).json({ value: normalized });
  } catch (error) {
    if (mode === 'hit') fallbackCount += 1;
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Counter-Source', 'fallback');
    const payload = { value: fallbackCount, error: 'Counter storage unavailable' };
    if (debug) {
      payload.details = error instanceof Error ? error.message : 'Unknown Redis error';
    }
    return res.status(200).json(payload);
  }
}
