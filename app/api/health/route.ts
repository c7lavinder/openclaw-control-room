import { NextResponse } from 'next/server';
import { fetchFromGitHub, listGitHubDir } from '@/app/lib/github';

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
  };
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
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

    // Fetch file counts in parallel
    const [dailyLogs, projects, decisions] = await Promise.all([
      countFiles('memory/daily'),
      countFiles('memory/projects'),
      countFiles('memory/decisions')
    ]);

    const fileCounts = {
      memory: dataSourceConnected ? 1 : 0,
      dailyLogs,
      projects,
      decisions
    };

    // Determine overall health status
    let status: HealthData['status'] = 'healthy';
    if (!dataSourceConnected) {
      status = 'unhealthy';
    } else if (fileCounts.memory === 0) {
      status = 'degraded';
    }

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
