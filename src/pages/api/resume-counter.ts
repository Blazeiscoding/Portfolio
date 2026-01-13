import type { APIRoute } from 'astro';

// In production, this would use a database or KV store
// For Vercel, you could use Vercel KV, Upstash Redis, or a simple JSON file
// This implementation uses a simple in-memory counter that persists per instance

interface CounterResponse {
  count: number;
  success: boolean;
  error?: string;
}

// Using a simple counter - in production, replace with:
// - Vercel KV: @vercel/kv
// - Upstash Redis: @upstash/redis
// - Or any database

let downloadCount = 0;

// GET - Retrieve current count
export const GET: APIRoute = async () => {
  try {
    const response: CounterResponse = {
      count: downloadCount,
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
    downloadCount += 1;
    
    const response: CounterResponse = {
      count: downloadCount,
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
      count: downloadCount,
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
