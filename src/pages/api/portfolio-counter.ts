import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import path from 'path';

// Store counter in a JSON file in the project root
const DATA_DIR = path.join(process.cwd(), 'data');
const COUNTER_FILE = path.join(DATA_DIR, 'portfolio-counter.json');

interface CounterData {
  [key: string]: number;
}

interface CounterResponse {
  count: number;
  success: boolean;
  error?: string;
}

// Generate monthly key (e.g., portfolio_visits_2026_02)
function getMonthlyKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `portfolio_visits_${year}_${month}`;
}

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

// Read counter data from file
async function readCounterData(): Promise<CounterData> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(COUNTER_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist or is invalid, return empty object
    return {};
  }
}

// Write counter data to file
async function writeCounterData(data: CounterData): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(COUNTER_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to get count
async function getCount(): Promise<number> {
  const data = await readCounterData();
  const key = getMonthlyKey();
  return data[key] ?? 0;
}

// Helper to increment count
async function incrementCount(): Promise<number> {
  const data = await readCounterData();
  const key = getMonthlyKey();
  data[key] = (data[key] ?? 0) + 1;
  await writeCounterData(data);
  return data[key];
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
