import { NextResponse } from 'next/server';
import { listGitHubDir, fetchFromGitHub } from '@/app/lib/github';

interface Tool {
  name: string;
  category: string;
  path: string;
  description: string;
  status: 'healthy' | 'stale' | 'unknown';
}

interface ToolCategory {
  name: string;
  displayName: string;
  emoji: string;
  path: string;
  toolCount: number;
  tools: Tool[];
}

const categoryMeta: Record<string, { displayName: string; emoji: string }> = {
  'ai-llm': { displayName: 'AI & LLM', emoji: '🤖' },
  'api-layer': { displayName: 'API Layer', emoji: '🔌' },
  'audio-media': { displayName: 'Audio & Media', emoji: '🎧' },
  'auth-security': { displayName: 'Auth & Security', emoji: '🔐' },
  'crm-external': { displayName: 'CRM & External', emoji: '📞' },
  'database-storage': { displayName: 'Database & Storage', emoji: '🗄️' },
  'dev-infrastructure': { displayName: 'Dev & Infrastructure', emoji: '🏗️' },
  'email': { displayName: 'Email', emoji: '📧' },
  'observability': { displayName: 'Observability', emoji: '📊' },
  'payments': { displayName: 'Payments', emoji: '💳' },
  'ui-frontend': { displayName: 'UI & Frontend', emoji: '🎨' }
};

/**
 * GET /api/tools
 * Reads memory/context/tools/ structure from GitHub
 */
export async function GET() {
  try {
    // List tool category directories
    const categories = await listGitHubDir('memory/context/tools');
    const dirs = categories.filter(c => c.type === 'dir');

    // Also try to get last scan data
    let lastScanData: { lastScan: string | null; knownVersions: Record<string, string> } = {
      lastScan: null,
      knownVersions: {}
    };
    const scanJson = await fetchFromGitHub('memory/context/tools/.last-scan.json');
    if (scanJson) {
      try {
        lastScanData = JSON.parse(scanJson);
      } catch {
        // ignore parse errors
      }
    }

    // Fetch tools for each category
    const toolCategories: ToolCategory[] = await Promise.all(
      dirs.map(async (dir) => {
        const meta = categoryMeta[dir.name] || { displayName: dir.name, emoji: '📦' };
        const toolFiles = await listGitHubDir(`memory/context/tools/${dir.name}`);
        const mdTools = toolFiles.filter(t => t.name.endsWith('.md') && !t.name.startsWith('.'));

        // Fetch basic info from each tool file
        const tools: Tool[] = await Promise.all(
          mdTools.map(async (toolFile) => {
            const content = await fetchFromGitHub(toolFile.path);
            const lines = content.split('\n');
            
            // Extract first line as description (after title)
            let description = '';
            for (const line of lines) {
              if (line.startsWith('#')) continue;
              if (line.trim()) {
                description = line.replace(/[>*_]/g, '').trim().substring(0, 100);
                break;
              }
            }

            return {
              name: toolFile.name.replace('.md', ''),
              category: dir.name,
              path: toolFile.path,
              description: description || `Tool: ${toolFile.name.replace('.md', '')}`,
              status: 'healthy' as const
            };
          })
        );

        return {
          name: dir.name,
          displayName: meta.displayName,
          emoji: meta.emoji,
          path: dir.path,
          toolCount: tools.length,
          tools
        };
      })
    );

    // Sort categories by tool count (most tools first)
    toolCategories.sort((a, b) => b.toolCount - a.toolCount);

    const totalTools = toolCategories.reduce((sum, cat) => sum + cat.toolCount, 0);

    return NextResponse.json({
      categories: toolCategories,
      totalCategories: toolCategories.length,
      totalTools,
      lastScan: lastScanData.lastScan,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reading tools:', error);
    return NextResponse.json(
      { error: 'Failed to read tools', details: String(error) },
      { status: 500 }
    );
  }
}
