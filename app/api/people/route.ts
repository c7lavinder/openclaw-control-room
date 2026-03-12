import { NextResponse } from 'next/server';
import { fetchFromGitHub, listGitHubDir, getFileCommitDate } from '@/app/lib/github';

interface Person {
  id: string;
  name: string;
  role: string;
  description: string;
  details: string[];
  source: string;
  lastModified: string;
}

/**
 * GET /api/people
 * Reads people profiles from memory/people/ directory
 */
export async function GET() {
  try {
    const people: Person[] = [];

    // List files in people directory
    const files = await listGitHubDir('memory/people');
    const mdFiles = files.filter(f => f.name.endsWith('.md') && !f.name.startsWith('.'));

    for (const file of mdFiles) {
      const content = await fetchFromGitHub(file.path);
      const lastModified = await getFileCommitDate(file.path);
      const lines = content.split('\n');

      // Extract name from title or filename
      let name = file.name.replace('.md', '').replace(/-/g, ' ');
      const titleMatch = content.match(/^#\s+(.+)/m);
      if (titleMatch) {
        name = titleMatch[1].replace(/[*_]/g, '');
      }

      // Extract role (look for Role: or first line after title)
      let role = '';
      const roleMatch = content.match(/\*\*Role:\*\*\s*(.+)/i) || content.match(/Role:\s*(.+)/i);
      if (roleMatch) {
        role = roleMatch[1].trim();
      }

      // Extract description (first paragraph)
      let description = '';
      const descLines = lines.filter(l => !l.startsWith('#') && !l.startsWith('-') && l.trim());
      if (descLines.length > 0) {
        description = descLines[0].replace(/[*_]/g, '').substring(0, 150);
      }

      // Extract bullet points as details
      const details = lines
        .filter(l => l.startsWith('- ') || l.startsWith('* '))
        .map(l => l.replace(/^[-*]\s+/, '').replace(/[*_]/g, ''))
        .slice(0, 5);

      people.push({
        id: file.name.replace('.md', ''),
        name,
        role,
        description,
        details,
        source: file.name,
        lastModified
      });
    }

    // If no people directory exists, check MEMORY.md for people mentions
    if (people.length === 0) {
      const memoryContent = await fetchFromGitHub('MEMORY.md');
      if (memoryContent) {
        // Try to extract team members mentioned
        const teamMatch = memoryContent.match(/team|people|staff/gi);
        if (teamMatch) {
          people.push({
            id: 'corey',
            name: 'Corey',
            role: 'CEO',
            description: 'Founder and CEO. The decision maker.',
            details: ['Leads strategy', 'Final authority on all decisions'],
            source: 'MEMORY.md (inferred)',
            lastModified: new Date().toISOString()
          });
        }
      }
    }

    return NextResponse.json({
      people,
      count: people.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reading people:', error);
    return NextResponse.json(
      { error: 'Failed to read people', details: String(error) },
      { status: 500 }
    );
  }
}
