import { NextResponse } from 'next/server';
import { fetchFromGitHub, getFileCommitDate } from '@/app/lib/github';

interface MemoryEntry {
  type: 'heading' | 'bullet' | 'table' | 'text';
  content: string;
  level?: number;
}

interface MemoryData {
  title: string;
  lineCount: number;
  entries: MemoryEntry[];
  lastModified: string;
  sections: {
    name: string;
    content: string[];
  }[];
}

/**
 * GET /api/memory
 * Reads and parses MEMORY.md from GitHub, returns structured JSON
 */
export async function GET() {
  try {
    const content = await fetchFromGitHub('MEMORY.md');
    
    if (!content) {
      return NextResponse.json({
        title: 'Memory',
        lineCount: 0,
        entries: [],
        lastModified: new Date().toISOString(),
        sections: [],
        error: 'MEMORY.md not found or empty'
      });
    }

    const lastModified = await getFileCommitDate('MEMORY.md');
    const lines = content.split('\n');
    
    const entries: MemoryEntry[] = [];
    const sections: { name: string; content: string[] }[] = [];
    let currentSection: { name: string; content: string[] } | null = null;

    for (const line of lines) {
      // Parse headings
      if (line.startsWith('# ')) {
        entries.push({ type: 'heading', content: line.replace('# ', ''), level: 1 });
        if (currentSection) sections.push(currentSection);
        currentSection = { name: line.replace('# ', ''), content: [] };
      } else if (line.startsWith('## ')) {
        entries.push({ type: 'heading', content: line.replace('## ', ''), level: 2 });
        if (currentSection) sections.push(currentSection);
        currentSection = { name: line.replace('## ', ''), content: [] };
      } else if (line.startsWith('### ')) {
        entries.push({ type: 'heading', content: line.replace('### ', ''), level: 3 });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        entries.push({ type: 'bullet', content: line.replace(/^[-*] /, '') });
        currentSection?.content.push(line.replace(/^[-*] /, ''));
      } else if (line.startsWith('|')) {
        entries.push({ type: 'table', content: line });
      } else if (line.trim()) {
        entries.push({ type: 'text', content: line });
        currentSection?.content.push(line);
      }
    }

    if (currentSection) sections.push(currentSection);

    // Extract last 3 bullet points for dashboard
    const bullets = entries.filter(e => e.type === 'bullet').slice(-3);

    const data: MemoryData = {
      title: 'MEMORY.md — The Brain of Xhaka',
      lineCount: lines.length,
      entries,
      lastModified,
      sections
    };

    return NextResponse.json({
      ...data,
      recentBullets: bullets.map(b => b.content)
    });
  } catch (error) {
    console.error('Error reading MEMORY.md:', error);
    return NextResponse.json(
      { error: 'Failed to read memory file', details: String(error) },
      { status: 500 }
    );
  }
}
