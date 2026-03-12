import { NextResponse } from 'next/server';
import { fetchFromGitHub, listGitHubDir, getRepoStats } from '@/app/lib/github';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  uptimeFormatted: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  dataSource: string;
  dataSourceConnected: boolean;
  fileCounts: {
    memory: number;
    dailyLogs: number;
    projects: number;
    decisions: number;
    people: number;
    context: number;
    tools: number;
  };
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  systemMemory: {
    total: number;
    free: number;
    usedPercent: number;
  };
  repoStats: {
    lastCommitSha: string | null;
    lastCommitMessage: string | null;
    lastCommitDate: string | null;
    totalFiles: number;
  };
  timestamp: string;
}

/**
 * GET /api/health
 * System health (uptime, file counts, GitHub connection status)
 */
export async function GET() {
  try {
    const repo = process.env.GITHUB_REPO || 'c7lavinder/xhaka';
    
    // Check GitHub connectivity by fetching MEMORY.md
    const memoryContent = await fetchFromGitHub('MEMORY.md');
    const dataSourceConnected = memoryContent.length > 0;

    // Count files in various directories
    const countFiles = async (dirPath: string): Promise<number> => {
      const files = await listGitHubDir(dirPath);
      return files.filter(f => f.name.endsWith('.md') && !f.name.startsWith('.')).length;
    };

    // Count tool categories
    const countToolCategories = async (): Promise<number> => {
      const tools = await listGitHubDir('memory/context/tools');
      return tools.filter(f => f.type === 'dir').length;
    };

    // Format uptime to human readable
    const formatUptime = (seconds: number): string => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      return parts.join(' ') || '< 1m';
    };

    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    // Fetch file counts and repo stats in parallel
    const [dailyLogs, projects, decisions, people, context, tools, repoStats] = await Promise.all([
      countFiles('memory/daily'),
      countFiles('memory/projects'),
      countFiles('memory/decisions'),
      countFiles('memory/people'),
      countFiles('memory/context'),
      countToolCategories(),
      getRepoStats()
    ]);

    const fileCounts = {
      memory: dataSourceConnected ? 1 : 0,
      dailyLogs,
      projects,
      decisions,
      people,
      context,
      tools
    };

    // Determine overall health status
    let status: HealthData['status'] = 'healthy';
    if (!dataSourceConnected) {
      status = 'unhealthy';
    } else if (fileCounts.memory === 0) {
      status = 'degraded';
    }

    // System memory (simulated for serverless)
    const systemMemory = {
      total: 1024,
      free: 512,
      usedPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    };

    const data: HealthData = {
      status,
      uptime,
      uptimeFormatted: formatUptime(uptime),
      nodeVersion: process.version,
      platform: 'railway',
      arch: process.arch,
      dataSource: `github:${repo}`,
      dataSourceConnected,
      fileCounts,
      memoryUsage: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      systemMemory,
      repoStats: {
        lastCommitSha: repoStats.lastCommit?.sha?.substring(0, 7) || null,
        lastCommitMessage: repoStats.lastCommit?.commit?.message?.split('\n')[0] || null,
        lastCommitDate: repoStats.lastCommit?.commit?.committer?.date || null,
        totalFiles: repoStats.totalFiles
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting health status:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Failed to get health status', 
        details: String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
