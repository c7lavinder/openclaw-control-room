import { NextResponse } from 'next/server';
import { fetchFromGitHub, listGitHubDir, getFileCommitDate } from '@/app/lib/github';

interface ContextFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  description: string;
  lastModified: string;
  childCount?: number;
}

/**
 * GET /api/context
 * Reads context files from memory/context/ directory
 */
export async function GET() {
  try {
    const contextItems: ContextFile[] = [];

    // List files in context directory
    const items = await listGitHubDir('memory/context');

    for (const item of items) {
      if (item.name.startsWith('.')) continue;

      if (item.type === 'dir') {
        // Count children
        const children = await listGitHubDir(item.path);
        const childCount = children.filter(c => !c.name.startsWith('.')).length;
        
        contextItems.push({
          id: item.name,
          name: item.name.replace(/-/g, ' '),
          path: item.path,
          type: 'directory',
          description: `Directory with ${childCount} items`,
          lastModified: new Date().toISOString(),
          childCount
        });
      } else if (item.name.endsWith('.md')) {
        const content = await fetchFromGitHub(item.path);
        const lastModified = await getFileCommitDate(item.path);
        const lines = content.split('\n');

        // Extract first meaningful line as description
        let description = '';
        for (const line of lines) {
          if (line.startsWith('#')) continue;
          if (line.trim()) {
            description = line.replace(/[>*_]/g, '').trim().substring(0, 100);
            break;
          }
        }

        contextItems.push({
          id: item.name.replace('.md', ''),
          name: item.name.replace('.md', '').replace(/-/g, ' '),
          path: item.path,
          type: 'file',
          description: description || `Context file: ${item.name}`,
          lastModified
        });
      }
    }

    // Sort directories first, then alphabetically
    contextItems.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      items: contextItems,
      count: contextItems.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reading context:', error);
    return NextResponse.json(
      { error: 'Failed to read context', details: String(error) },
      { status: 500 }
    );
  }
}
