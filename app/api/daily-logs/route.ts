import { NextResponse } from 'next/server';
import { fetchFromGitHub, listGitHubDir, getFileCommitDate } from '@/app/lib/github';

interface DailyLog {
  date: string;
  filename: string;
  content: string;
  preview: string;
  lineCount: number;
  lastModified: string;
}

/**
 * GET /api/daily-logs
 * Reads memory/daily/*.md from GitHub, returns last 7 days
 */
export async function GET() {
  try {
    // List files in the daily directory
    const files = await listGitHubDir('memory/daily');
    
    if (files.length === 0) {
      return NextResponse.json({
        logs: [],
        count: 0,
        message: 'Daily logs directory not found or empty'
      });
    }

    // Filter and sort markdown files
    const mdFiles = files
      .filter(f => f.name.endsWith('.md') && !f.name.startsWith('.'))
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(0, 7); // Last 7 days

    // Fetch content for each file
    const logs: DailyLog[] = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await fetchFromGitHub(`memory/daily/${file.name}`);
        const lastModified = await getFileCommitDate(`memory/daily/${file.name}`);
        const lines = content.split('\n');
        
        // Extract date from filename (e.g., 2026-03-11.md -> 2026-03-11)
        const date = file.name.replace('.md', '');
        
        // Create preview (first 200 chars or first 5 lines)
        const preview = lines.slice(0, 5).join('\n').substring(0, 200) + '...';

        return {
          date,
          filename: file.name,
          content,
          preview,
          lineCount: lines.length,
          lastModified
        };
      })
    );

    return NextResponse.json({
      logs,
      count: logs.length,
      totalFilesInDirectory: mdFiles.length
    });
  } catch (error) {
    console.error('Error reading daily logs:', error);
    return NextResponse.json(
      { error: 'Failed to read daily logs', details: String(error) },
      { status: 500 }
    );
  }
}
