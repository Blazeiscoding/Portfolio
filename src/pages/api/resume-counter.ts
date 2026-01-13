import type { APIRoute } from 'astro';
import { kv } from '@vercel/kv';

const COUNTER_KEY = 'resume_downloads';

interface CounterResponse {
  count: number;
  success: boolean;
  error?: string;
}

// Fallback in-memory counter (for local dev without KV)
let fallbackCount = 0;

// Helper to get count (with fallback)
async function getCount(): Promise<number> {
  try {
    const count = await kv.get<number>(COUNTER_KEY);
    return count ?? 0;
  } catch {
    // Fallback for local dev or if KV is not configured
    return fallbackCount;
  }
}

// Helper to increment count (with fallback)
async function incrementCount(): Promise<number> {
  try {
    const newCount = await kv.incr(COUNTER_KEY);
    return newCount;
  } catch {
    // Fallback for local dev or if KV is not configured
    fallbackCount += 1;
    return fallbackCount;
  }
}

// GET - Retrieve current count
export const GET: APIRoute = async () => {
  try {
    const count = await getCount();
    
    const response: CounterResponse = {
      count,
      success: true,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get counter';
    
    return new Response(JSON.stringify({
      count: 0,
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST - Increment counter
export const POST: APIRoute = async () => {
  try {
    const count = await incrementCount();
    
    const response: CounterResponse = {
      count,
      success: true,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to increment counter';
    
    return new Response(JSON.stringify({
      count: 0,
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
