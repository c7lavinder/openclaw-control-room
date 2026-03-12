import { NextResponse } from 'next/server';
import { fetchFromGitHub, listGitHubDir, getFileCommitDate } from '@/app/lib/github';

interface Decision {
  id: string;
  title: string;
  date: string;
  context: string;
  outcome?: string;
  source: string;
}

/**
 * GET /api/decisions
 * Reads decisions from memory/decisions/ and MEMORY.md KEY DECISIONS section
 */
export async function GET() {
  try {
    const decisions: Decision[] = [];

    // Try to read key-decisions.md
    const keyDecisionsContent = await fetchFromGitHub('memory/decisions/key-decisions.md');
    if (keyDecisionsContent) {
      const lines = keyDecisionsContent.split('\n');
      let currentDecision: Partial<Decision> | null = null;
      
      for (const line of lines) {
        // Match decision headers like "## [2026-03-08] Decision Title"
        const headerMatch = line.match(/^##\s+\[(\d{4}-\d{2}-\d{2})\]\s+(.+)/);
        if (headerMatch) {
          if (currentDecision && currentDecision.title) {
            decisions.push(currentDecision as Decision);
          }
          currentDecision = {
            id: `decision-${decisions.length + 1}`,
            date: headerMatch[1],
            title: headerMatch[2],
            context: '',
            source: 'key-decisions.md'
          };
        } else if (currentDecision && line.startsWith('- ')) {
          currentDecision.context += (currentDecision.context ? '\n' : '') + line.replace(/^-\s+/, '');
        }
      }
      if (currentDecision && currentDecision.title) {
        decisions.push(currentDecision as Decision);
      }
    }

    // Also try to read decisions from MEMORY.md
    const memoryContent = await fetchFromGitHub('MEMORY.md');
    if (memoryContent) {
      const lines = memoryContent.split('\n');
      let inDecisionsSection = false;
      
      for (const line of lines) {
        if (line.includes('KEY DECISIONS') || line.includes('Key Decisions')) {
          inDecisionsSection = true;
          continue;
        }
        if (inDecisionsSection && line.startsWith('##')) {
          inDecisionsSection = false;
          continue;
        }
        if (inDecisionsSection && line.startsWith('- ')) {
          const text = line.replace(/^-\s+/, '');
          // Try to extract date if present
          const dateMatch = text.match(/\((\d{4}-\d{2}-\d{2})\)/);
          decisions.push({
            id: `memory-decision-${decisions.length + 1}`,
            title: text.replace(/\(\d{4}-\d{2}-\d{2}\)/, '').trim(),
            date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
            context: text,
            source: 'MEMORY.md'
          });
        }
      }
    }

    // List any additional decision files
    const decisionFiles = await listGitHubDir('memory/decisions');
    const mdFiles = decisionFiles.filter(f => f.name.endsWith('.md') && f.name !== 'key-decisions.md');

    for (const file of mdFiles) {
      const content = await fetchFromGitHub(file.path);
      const lastModified = await getFileCommitDate(file.path);
      const lines = content.split('\n');
      const title = lines.find(l => l.startsWith('#'))?.replace(/^#+\s+/, '') || file.name;
      
      decisions.push({
        id: `file-${file.name}`,
        title,
        date: lastModified.split('T')[0],
        context: lines.filter(l => !l.startsWith('#')).slice(0, 3).join(' ').substring(0, 200),
        source: file.name
      });
    }

    // Sort by date descending
    decisions.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      decisions,
      count: decisions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reading decisions:', error);
    return NextResponse.json(
      { error: 'Failed to read decisions', details: String(error) },
      { status: 500 }
    );
  }
}
