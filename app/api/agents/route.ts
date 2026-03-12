import { NextResponse } from 'next/server';
import { fetchFromGitHub, getFileCommitDate } from '@/app/lib/github';

interface Agent {
  name: string;
  emoji: string;
  role: string;
  responsibility: string;
  trigger: string;
  status: 'active' | 'standby' | 'scheduled';
}

/**
 * GET /api/agents
 * Parses AGENTS.md from GitHub, returns agent roster
 */
export async function GET() {
  try {
    // Default agents if file not found
    const defaultAgents: Agent[] = [
      {
        name: 'Xhaka',
        emoji: '🧠',
        role: 'COO',
        responsibility: 'Strategic partner. Goal tracking, accountability, decision support.',
        trigger: 'Always active',
        status: 'active'
      },
      {
        name: 'The Builder',
        emoji: '👷‍♂️',
        role: 'Engineering',
        responsibility: 'Core backend logic, refactoring, database schema, API endpoints.',
        trigger: '"Spawn the Builder" or any coding task',
        status: 'standby'
      },
      {
        name: 'The Auditor',
        emoji: '👮‍♂️',
        role: 'Quality & Standards',
        responsibility: 'Code reviews, linting, enforces RULES.md.',
        trigger: 'Scheduled (every 4h) or Post-Build',
        status: 'scheduled'
      },
      {
        name: 'The Researcher',
        emoji: '🔬',
        role: 'Intelligence & Evolution',
        responsibility: 'Industry trends, tools/libraries discovery.',
        trigger: 'Daily (Morning Briefing) + On-demand',
        status: 'scheduled'
      },
      {
        name: 'The Architect',
        emoji: '🎨',
        role: 'Visuals & Dashboard',
        responsibility: 'Frontend & Data Vis. Dashboard pages, styling.',
        trigger: 'Any UI request',
        status: 'standby'
      },
      {
        name: 'The Operator',
        emoji: '⚙️',
        role: 'Systems & Config',
        responsibility: 'GHL & Infrastructure. Pulling IDs, configuring settings.',
        trigger: '"Get the ID", "Check GHL"',
        status: 'standby'
      }
    ];

    const content = await fetchFromGitHub('AGENTS.md');
    
    if (!content) {
      return NextResponse.json({
        agents: defaultAgents,
        source: 'default',
        message: 'AGENTS.md not found, using defaults'
      });
    }

    const lastModified = await getFileCommitDate('AGENTS.md');

    // Parse the agents from markdown
    const agents: Agent[] = [];
    const lines = content.split('\n');
    
    let currentAgent: Partial<Agent> | null = null;
    
    for (const line of lines) {
      // Match agent headers like "### 👷‍♂️ The Builder (Engineering)"
      const headerMatch = line.match(/^### ([^\s]+) (.+?) \((.+?)\)/);
      if (headerMatch) {
        if (currentAgent && currentAgent.name) {
          agents.push(currentAgent as Agent);
        }
        currentAgent = {
          emoji: headerMatch[1],
          name: headerMatch[2],
          role: headerMatch[3],
          responsibility: '',
          trigger: '',
          status: 'standby'
        };
      }
      
      // Also match Xhaka's special format
      if (line.includes('### 🧠 Xhaka (COO)')) {
        if (currentAgent && currentAgent.name) {
          agents.push(currentAgent as Agent);
        }
        currentAgent = {
          emoji: '🧠',
          name: 'Xhaka',
          role: 'COO',
          responsibility: 'Strategic partner. Goal tracking, accountability, decision support, memory.',
          trigger: 'Always active',
          status: 'active'
        };
      }
      
      // Parse responsibility
      if (currentAgent && line.includes('**Responsibility:**')) {
        currentAgent.responsibility = line.replace(/.*\*\*Responsibility:\*\*\s*/, '');
      }
      
      // Parse trigger
      if (currentAgent && line.includes('**Trigger:**')) {
        currentAgent.trigger = line.replace(/.*\*\*Trigger:\*\*\s*/, '');
        // Set status based on trigger
        if (currentAgent.trigger.toLowerCase().includes('always')) {
          currentAgent.status = 'active';
        } else if (currentAgent.trigger.toLowerCase().includes('scheduled') || 
                   currentAgent.trigger.toLowerCase().includes('daily')) {
          currentAgent.status = 'scheduled';
        } else {
          currentAgent.status = 'standby';
        }
      }
    }
    
    // Don't forget the last agent
    if (currentAgent && currentAgent.name) {
      agents.push(currentAgent as Agent);
    }

    // Deduplicate agents by name (keep the one with more data)
    const agentMap = new Map<string, Agent>();
    for (const agent of agents) {
      const existing = agentMap.get(agent.name);
      if (!existing || agent.responsibility.length > existing.responsibility.length) {
        agentMap.set(agent.name, agent);
      }
    }
    const deduplicatedAgents = Array.from(agentMap.values());

    // Use parsed agents if we found any, otherwise use defaults
    const finalAgents = deduplicatedAgents.length > 0 ? deduplicatedAgents : defaultAgents;

    return NextResponse.json({
      agents: finalAgents,
      source: agents.length > 0 ? 'parsed' : 'default',
      lastModified,
      rawLineCount: lines.length
    });
  } catch (error) {
    console.error('Error reading AGENTS.md:', error);
    return NextResponse.json(
      { error: 'Failed to read agents file', details: String(error) },
      { status: 500 }
    );
  }
}
