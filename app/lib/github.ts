/**
 * GitHub API utilities for fetching workspace files from c7lavinder/xhaka
 */

const GITHUB_API = 'https://api.github.com';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
}

/**
 * Fetch raw file content from GitHub
 */
export async function fetchFromGitHub(filePath: string): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'c7lavinder/xhaka';
  
  if (!token) {
    console.error('GITHUB_TOKEN not set');
    return '';
  }

  try {
    const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${filePath}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'xhaka-control-room'
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!res.ok) {
      console.error(`GitHub API error for ${filePath}: ${res.status} ${res.statusText}`);
      return '';
    }

    return await res.text();
  } catch (error) {
    console.error(`Error fetching ${filePath} from GitHub:`, error);
    return '';
  }
}

/**
 * List files in a GitHub directory
 */
export async function listGitHubDir(dirPath: string): Promise<GitHubFile[]> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'c7lavinder/xhaka';

  if (!token) {
    console.error('GITHUB_TOKEN not set');
    return [];
  }

  try {
    const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${dirPath}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'xhaka-control-room'
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      console.error(`GitHub API error listing ${dirPath}: ${res.status} ${res.statusText}`);
      return [];
    }

    const files = await res.json();
    
    // Handle case where it's a single file, not a directory
    if (!Array.isArray(files)) {
      return [];
    }

    return files.map((f: { name: string; path: string; type: string; sha: string }) => ({
      name: f.name,
      path: f.path,
      type: f.type as 'file' | 'dir',
      sha: f.sha
    }));
  } catch (error) {
    console.error(`Error listing ${dirPath} from GitHub:`, error);
    return [];
  }
}

/**
 * Get file metadata (for lastModified simulation - uses commit date)
 */
export async function getFileCommitDate(filePath: string): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'c7lavinder/xhaka';

  if (!token) {
    return new Date().toISOString();
  }

  try {
    const res = await fetch(`${GITHUB_API}/repos/${repo}/commits?path=${filePath}&per_page=1`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'xhaka-control-room'
      },
      next: { revalidate: 300 } // Cache commit info for 5 minutes
    });

    if (!res.ok) {
      return new Date().toISOString();
    }

    const commits = await res.json();
    if (Array.isArray(commits) && commits.length > 0) {
      return commits[0].commit?.committer?.date || new Date().toISOString();
    }
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}
