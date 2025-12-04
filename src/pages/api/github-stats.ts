import type { APIRoute } from 'astro';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const username = url.searchParams.get('username') || 'Blazeiscoding';
  const token = process.env.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN;
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Portfolio-Site',
  };
  
  if (token) {
    const authPrefix = token.startsWith('github_pat_') ? 'Bearer' : 'token';
    headers['Authorization'] = `${authPrefix} ${token}`;
  }
  
  try {
    const userUrl = token 
      ? 'https://api.github.com/user' 
      : `https://api.github.com/users/${username}`;
    
    const userRes = await fetch(userUrl, { headers });
    const userData = await userRes.json();
    
    if (!userRes.ok) {
      throw new Error(userData.message || 'Failed to fetch user data');
    }
    
    const reposUrl = token 
      ? `https://api.github.com/user/repos?per_page=100&affiliation=owner&visibility=all`
      : `https://api.github.com/users/${username}/repos?per_page=100`;
    
    const reposRes = await fetch(reposUrl, { headers });
    const reposData = await reposRes.json();
    
    const allRepos = Array.isArray(reposData) ? reposData : [];
    const privateRepos = allRepos.filter((r: any) => r.private === true).length;
    const publicRepos = allRepos.filter((r: any) => r.private === false).length;
    const totalStars = allRepos.reduce((acc: number, r: any) => acc + (r.stargazers_count || 0), 0);
    
    return new Response(JSON.stringify({
      repos: allRepos.length,
      followers: userData.followers || 0,
      following: userData.following || 0,
      stars: totalStars,
      privateRepos,
      publicRepos,
      hasToken: !!token,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message || 'Failed to fetch GitHub data',
      repos: 0,
      followers: 0,
      following: 0,
      stars: 0,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
