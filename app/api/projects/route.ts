import { NextResponse } from 'next/server';
import { fetchFromGitHub, listGitHubDir, getFileCommitDate } from '@/app/lib/github';

interface Project {
  name: string;
  filename: string;
  status: 'active' | 'completed' | 'paused' | 'planned';
  description: string;
  content: string;
  lastModified: string;
  highlights: string[];
}

/**
 * GET /api/projects
 * Reads memory/projects/*.md files from GitHub
 */
export async function GET() {
  try {
    // List files in the projects directory
    const files = await listGitHubDir('memory/projects');
    
    if (files.length === 0) {
      return NextResponse.json({
        projects: [],
        count: 0,
        message: 'Projects directory not found or empty'
      });
    }

    // Filter markdown files
    const mdFiles = files.filter(f => f.name.endsWith('.md') && !f.name.startsWith('.'));

    // Fetch and parse each project file
    const projects: Project[] = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await fetchFromGitHub(`memory/projects/${file.name}`);
        const lastModified = await getFileCommitDate(`memory/projects/${file.name}`);
        const lines = content.split('\n');
        
        // Extract project name from first heading or filename
        let name = file.name.replace('.md', '').replace(/-/g, ' ');
        const titleMatch = content.match(/^#\s+(.+)/m);
        if (titleMatch) {
          name = titleMatch[1];
        }

        // Determine status from content
        let status: Project['status'] = 'active';
        const contentLower = content.toLowerCase();
        if (contentLower.includes('status: completed') || contentLower.includes('✅ completed')) {
          status = 'completed';
        } else if (contentLower.includes('status: paused') || contentLower.includes('⏸️ paused')) {
          status = 'paused';
        } else if (contentLower.includes('status: planned') || contentLower.includes('📋 planned')) {
          status = 'planned';
        } else if (contentLower.includes('status: active') || contentLower.includes('🔄 active') || contentLower.includes('✅ live')) {
          status = 'active';
        }

        // Extract description (first paragraph after title)
        let description = '';
        const descMatch = content.match(/^#[^\n]+\n+([^#\n][^\n]+)/m);
        if (descMatch) {
          description = descMatch[1].replace(/[>*_]/g, '').trim();
        }

        // Extract key bullet points as highlights
        const bullets = lines
          .filter(l => l.startsWith('- ') || l.startsWith('* '))
          .map(l => l.replace(/^[-*]\s+/, ''))
          .slice(0, 5);

        return {
          name,
          filename: file.name,
          status,
          description: description || `Project file: ${file.name}`,
          content,
          lastModified,
          highlights: bullets
        };
      })
    );

    return NextResponse.json({
      projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Error reading projects:', error);
    return NextResponse.json(
      { error: 'Failed to read projects', details: String(error) },
      { status: 500 }
    );
  }
}
