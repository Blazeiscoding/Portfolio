import type { APIRoute } from 'astro';

interface GitHubUser {
  login: string;
  id: number;
  followers: number;
  following: number;
  public_repos: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  private: boolean;
  stargazers_count: number;
}

interface GitHubStatsResponse {
  repos: number;
  followers: number;
  following: number;
  stars: number;
  privateRepos: number;
  publicRepos: number;
  hasToken: boolean;
  error?: string;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const username = url.searchParams.get('username') || 'Blazeiscoding';
  // Use import.meta.env - works in both dev and production (Vercel)
  const token = import.meta.env.GITHUB_TOKEN;
  
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
    const userData: GitHubUser = await userRes.json();
    
    if (!userRes.ok) {
      throw new Error((userData as unknown as { message?: string }).message || 'Failed to fetch user data');
    }
    
    const reposUrl = token 
      ? `https://api.github.com/user/repos?per_page=100&affiliation=owner&visibility=all`
      : `https://api.github.com/users/${username}/repos?per_page=100`;
    
    const reposRes = await fetch(reposUrl, { headers });
    const reposData: GitHubRepo[] = await reposRes.json();
    
    const allRepos = Array.isArray(reposData) ? reposData : [];
    const privateRepos = allRepos.filter((repo) => repo.private === true).length;
    const publicRepos = allRepos.filter((repo) => repo.private === false).length;
    const totalStars = allRepos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
    
    const response: GitHubStatsResponse = {
      repos: allRepos.length,
      followers: userData.followers || 0,
      following: userData.following || 0,
      stars: totalStars,
      privateRepos,
      publicRepos,
      hasToken: !!token,
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Edge caching: CDN caches for 1 hour, browser for 5 min, stale content served while revalidating
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch GitHub data';
    
    const errorResponse: GitHubStatsResponse = {
      error: errorMessage,
      repos: 0,
      followers: 0,
      following: 0,
      stars: 0,
      privateRepos: 0,
      publicRepos: 0,
      hasToken: !!token,
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
