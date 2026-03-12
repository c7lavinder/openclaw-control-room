/**
 * GitHub API utilities for fetching workspace files from c7lavinder/xhaka
 */

const GITHUB_API = 'https://api.github.com';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  size?: number;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    committer: {
      date: string;
    };
  };
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
      next: { revalidate: 60 }
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
    
    if (!Array.isArray(files)) {
      return [];
    }

    return files.map((f: { name: string; path: string; type: string; sha: string; size?: number }) => ({
      name: f.name,
      path: f.path,
      type: f.type as 'file' | 'dir',
      sha: f.sha,
      size: f.size
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
      next: { revalidate: 300 }
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

/**
 * Get repository statistics
 */
export async function getRepoStats(): Promise<{
  lastCommit: GitHubCommit | null;
  totalFiles: number;
  connected: boolean;
}> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'c7lavinder/xhaka';

  if (!token) {
    return { lastCommit: null, totalFiles: 0, connected: false };
  }

  try {
    // Get latest commit
    const commitsRes = await fetch(`${GITHUB_API}/repos/${repo}/commits?per_page=1`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'xhaka-control-room'
      },
      next: { revalidate: 60 }
    });

    let lastCommit: GitHubCommit | null = null;
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        lastCommit = commits[0];
      }
    }

    // Get repo info for file count (approximate via tree)
    const treeRes = await fetch(`${GITHUB_API}/repos/${repo}/git/trees/main?recursive=1`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'xhaka-control-room'
      },
      next: { revalidate: 300 }
    });

    let totalFiles = 0;
    if (treeRes.ok) {
      const tree = await treeRes.json();
      totalFiles = tree.tree?.filter((t: { type: string }) => t.type === 'blob').length || 0;
    }

    return { lastCommit, totalFiles, connected: true };
  } catch {
    return { lastCommit: null, totalFiles: 0, connected: false };
  }
}

/**
 * Count files in a directory (recursive option)
 */
export async function countFilesInDir(dirPath: string, fileExtension = '.md'): Promise<number> {
  const files = await listGitHubDir(dirPath);
  return files.filter(f => f.name.endsWith(fileExtension) && !f.name.startsWith('.')).length;
}

/**
 * Get tool categories from memory/context/tools
 */
export async function getToolCategories(): Promise<{
  name: string;
  path: string;
  toolCount: number;
  tools: { name: string; path: string }[];
}[]> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'c7lavinder/xhaka';

  if (!token) return [];

  try {
    const categories = await listGitHubDir('memory/context/tools');
    const dirs = categories.filter(c => c.type === 'dir');

    const results = await Promise.all(
      dirs.map(async (dir) => {
        const tools = await listGitHubDir(`memory/context/tools/${dir.name}`);
        const mdTools = tools.filter(t => t.name.endsWith('.md') && !t.name.startsWith('.'));
        return {
          name: dir.name,
          path: dir.path,
          toolCount: mdTools.length,
          tools: mdTools.map(t => ({ name: t.name.replace('.md', ''), path: t.path }))
        };
      })
    );

    return results;
  } catch {
    return [];
  }
}
