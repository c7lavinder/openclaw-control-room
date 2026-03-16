import { NextResponse } from 'next/server';
import { fetchFromGitHub, listGitHubDir } from '@/app/lib/github';

/**
 * GET /api/stack/tool-file?path=memory/context/tools/observability
 * Returns concatenated .md file content from the given GitHub path
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path || !path.startsWith('memory/context/tools')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    // List the directory
    const files = await listGitHubDir(path);
    const mdFiles = files.filter(f => f.type === 'file' && f.name.endsWith('.md') && f.name !== '.gitkeep');

    if (mdFiles.length === 0) {
      return NextResponse.json({ content: 'No tool files found in this directory.' });
    }

    // Fetch first 2 .md files
    const results: string[] = [];
    for (const f of mdFiles.slice(0, 2)) {
      const content = await fetchFromGitHub(f.path);
      if (content) {
        results.push(`── ${f.name} ──\n\n${content}`);
      }
    }

    return NextResponse.json({ content: results.join('\n\n') || 'No content found.' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
