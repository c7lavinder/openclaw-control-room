'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, CheckCircle2, AlertCircle, Compass, ChevronDown, ChevronUp,
  Send, Bot, User, Loader2
} from 'lucide-react';
import StatusBar from '../components/StatusBar';

// ── TYPES ──────────────────────────────────────────────────────────────────
type ToolTier = 'live' | 'not-wired' | 'explore';

interface ToolDef {
  name: string;
  icon: string;
  category: string;
  desc: string;
  context: string;
  keyHint: string;
  ghPath: string | null;
  tier: ToolTier;
}

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
}

// ── TOOL DATA ──────────────────────────────────────────────────────────────
const LIVE_TOOLS: ToolDef[] = [
  {
    name: 'Railway', icon: '🚂', category: 'Infrastructure',
    desc: 'Deploys xhaka-intelligence, xhaka-control-room, and Gunner V2. Auto-deploys on every main commit.',
    context: '✅ Connected to: xhaka-intelligence · xhaka-control-room · gunner-v2 · gunner-postgres',
    keyHint: 'API Token: 107983f5…', ghPath: 'memory/context/tools/railway', tier: 'live'
  },
  {
    name: 'GitHub', icon: '🐙', category: 'Source Control',
    desc: 'Repo c7lavinder/xhaka is the source of truth for all Xhaka intelligence, memory, and config.',
    context: '✅ Connected to: Control Room (live commits) · Agent memory files · Tool knowledge base',
    keyHint: 'Token: ghp_KKin…', ghPath: 'memory/context/tools/dev-infrastructure', tier: 'live'
  },
  {
    name: 'OpenAI', icon: '🤖', category: 'AI / LLM',
    desc: 'GPT-4o and GPT-4o-mini power all intelligence jobs — Researcher, Scribe, Analyzer, Digital Twins.',
    context: '✅ Connected to: All agent jobs · Gunner call grading · Whisper voice-ingest',
    keyHint: 'Via ENV: OPENAI_API_KEY', ghPath: 'memory/context/tools/openai', tier: 'live'
  },
  {
    name: 'Telegram', icon: '✈️', category: 'Command Channel',
    desc: 'Primary command channel. Corey messages Xhaka here. All job completions + alerts route back.',
    context: '✅ Connected to: Xhaka COO interface · Agent job notifications · Urgent alerts',
    keyHint: 'Bot ID: 7583931248', ghPath: null, tier: 'live'
  },
  {
    name: 'GoHighLevel', icon: '🏠', category: 'CRM',
    desc: 'NAH deal pipeline. All leads, contacts, opportunities, and call dispositions live here.',
    context: '✅ Connected to: KPI capture job · Gunner call pull · Digital Twins data feed',
    keyHint: 'READ ONLY · xhakalavinder@gmail.com', ghPath: 'memory/context/tools/gohighlevel', tier: 'live'
  },
  {
    name: 'BatchDialer', icon: '📞', category: 'Calling Platform',
    desc: 'Cold calling platform for NAH outbound. API pulls call metrics for daily KPI tracking.',
    context: '✅ Connected to: KPI Entry job · Daily calling metrics · Team performance dashboard',
    keyHint: 'API Key: d98ac867…', ghPath: 'memory/context/tools/crm-external', tier: 'live'
  },
  {
    name: 'BatchLeads', icon: '💬', category: 'SMS Platform',
    desc: 'SMS outreach platform. API pulls messaging metrics for daily KPI entry.',
    context: '✅ Connected to: KPI Entry job · SMS volume metrics · Lead response tracking',
    keyHint: 'API Key: 06b81a7c…', ghPath: 'memory/context/tools/crm-external', tier: 'live'
  },
  {
    name: 'CallRail', icon: '📻', category: 'Call Tracking',
    desc: 'Inbound call tracking and voicemail management. Voicemail Bot pulls and processes recordings.',
    context: '✅ Connected to: Voicemail Bot job · Call log ingestion · NAH inbound tracking',
    keyHint: 'API Key: 267bcdd6…', ghPath: 'memory/context/tools/crm-external', tier: 'live'
  }
];

const NOT_WIRED_TOOLS: ToolDef[] = [
  {
    name: 'Sentry', icon: '🛡️', category: 'Error Tracking',
    desc: 'Production error tracking. Catches exceptions, creates GitHub issues automatically when Gunner breaks.',
    context: '🟡 Missing: DSN not added to gunner-v2 env vars. Unlocks: instant prod error alerts + auto issue creation.',
    keyHint: 'DSN: bf7b317b…', ghPath: 'memory/context/tools/observability', tier: 'not-wired'
  },
  {
    name: 'PostHog', icon: '📊', category: 'Product Analytics',
    desc: 'User behavior analytics for Gunner. Tracks feature usage, drop-offs, and team engagement patterns.',
    context: '🟡 Missing: Project token not in codebase. Unlocks: which features teams use, where they drop off.',
    keyHint: 'Token: phc_FEpR…', ghPath: 'memory/context/tools/posthog', tier: 'not-wired'
  },
  {
    name: 'LangSmith', icon: '🔬', category: 'AI Observability',
    desc: 'Traces every OpenAI call across all agent jobs. Debug slow prompts, track token costs.',
    context: '🟡 Missing: API key not wired into intelligence service. Unlocks: full AI call observability, cost tracking.',
    keyHint: 'API Key: lsv2_pt_…', ghPath: 'memory/context/tools/observability', tier: 'not-wired'
  },
  {
    name: 'Supabase', icon: '🗄️', category: 'Database',
    desc: 'Postgres + pgvector for Gunner V2. Migration from current setup not complete.',
    context: '🟡 Missing: Schema migration not run · pgvector extension not initialized. Unlocks: Gunner V2 full data layer.',
    keyHint: 'Project: tvjkgumckwap…', ghPath: 'memory/context/tools/database-storage', tier: 'not-wired'
  },
  {
    name: 'Google Gemini', icon: '💎', category: 'AI / LLM',
    desc: 'gemini-1.5-flash as fallback. 1,500 req/day free. Key-only setup for fragility hardening.',
    context: '🟡 Status: Fallback only · Not integrated into production call path. Unlocks: OpenAI failure resilience.',
    keyHint: 'API Key: AIzaSyChM6…', ghPath: 'memory/context/tools/ai-llm', tier: 'not-wired'
  }
];

const EXPLORE_TOOLS: ToolDef[] = [
  {
    name: 'Zep Cloud', icon: '🧠', category: 'Agent Memory',
    desc: 'Long-term memory layer for AI agents. Persistent memory across sessions with semantic search.',
    context: "🔵 Why it matters: MiroFish Digital Twins need long-term memory to simulate realistic behavior. Flat files won't scale.",
    keyHint: 'zep.ai · Managed service', ghPath: null, tier: 'explore'
  },
  {
    name: 'GraphRAG', icon: '🕸️', category: 'AI Knowledge',
    desc: "Microsoft's graph-based RAG. Upgrades flat .md knowledge files to relational entity graphs.",
    context: '🔵 Why it matters: At 500+ memory files, flat keyword search breaks. GraphRAG = answers about relationships.',
    keyHint: 'github.com/microsoft/graphrag · OSS', ghPath: null, tier: 'explore'
  },
  {
    name: 'Whisper API', icon: '🎙️', category: 'Audio / Voice',
    desc: 'OpenAI speech-to-text. Voice ingest job already built — just needs to be activated.',
    context: '🔵 Status: Voice-ingest job already coded. No new account needed — uses existing OpenAI key. One config flag away.',
    keyHint: 'Via existing OPENAI_API_KEY', ghPath: 'memory/context/tools/audio-media', tier: 'explore'
  },
  {
    name: 'MiroFish / OASIS', icon: '🌊', category: 'Simulation',
    desc: 'Agent-based simulation engine. Run full NAH team simulations before making operational changes.',
    context: '🔵 Deferred until: Gunner hits 100 users. Needs stable Digital Twins data first.',
    keyHint: 'Research phase · Not a product yet', ghPath: null, tier: 'explore'
  },
  {
    name: 'Retell AI / Bland AI', icon: '🤙', category: 'Voice AI',
    desc: 'AI-powered voice calling for lead qualification. Scale NAH outreach without adding headcount.',
    context: "🔵 Why it matters: #1 NAH bottleneck is phone hours. AI callers = 10x lead touches. Retell = quality; Bland = price.",
    keyHint: 'retellai.com · bland.ai', ghPath: null, tier: 'explore'
  },
  {
    name: 'n8n (self-hosted)', icon: '⚙️', category: 'Workflow Automation',
    desc: 'Visual workflow automation. Connect GHL + BatchDialer + BatchLeads without custom code.',
    context: '🔵 Why it matters: Every integration job was hand-coded. n8n = same power, 10x less maintenance. Self-hosted = $0/mo.',
    keyHint: 'n8n.io · OSS self-hosted', ghPath: null, tier: 'explore'
  },
  {
    name: 'Firecrawl', icon: '🔥', category: 'Web Scraping',
    desc: "Web scraping API with clean markdown output. Researcher job gets headlines only — Firecrawl gets full articles.",
    context: "🔵 Why it matters: Researcher pulls RSS headlines but can't read articles. Firecrawl = real VC/wholesale intelligence.",
    keyHint: 'firecrawl.dev · $19/mo starter', ghPath: null, tier: 'explore'
  }
];

const ALL_TOOLS = [...LIVE_TOOLS, ...NOT_WIRED_TOOLS, ...EXPLORE_TOOLS];

// ── KEYWORD MAP ────────────────────────────────────────────────────────────
const KEYWORD_MAP: Record<string, string[]> = {
  'Railway': ['railway', 'deploy', 'deployment'],
  'GitHub': ['github', 'repo', 'commits', 'source', 'git'],
  'OpenAI': ['openai', 'gpt', 'gpt-4', 'gpt4', 'llm', 'ai model', 'chatgpt'],
  'Telegram': ['telegram', 'bot', 'command channel'],
  'GoHighLevel': ['ghl', 'gohighlevel', 'go high level', 'crm', 'pipeline'],
  'BatchDialer': ['batchdialer', 'batch dialer', 'calling', 'cold call', 'dialer'],
  'BatchLeads': ['batchleads', 'batch leads', 'sms', 'text message'],
  'CallRail': ['callrail', 'call rail', 'voicemail', 'inbound'],
  'Sentry': ['sentry', 'error tracking', 'errors', 'exceptions', 'crash'],
  'PostHog': ['posthog', 'analytics', 'user behavior', 'feature usage'],
  'LangSmith': ['langsmith', 'observability', 'traces', 'tracing'],
  'Supabase': ['supabase', 'database', 'postgres', 'pgvector', 'migration'],
  'Google Gemini': ['gemini', 'google ai', 'fallback', 'fragility'],
  'Zep Cloud': ['zep', 'agent memory', 'long-term memory'],
  'GraphRAG': ['graphrag', 'knowledge graph', 'rag'],
  'Whisper API': ['whisper', 'speech', 'transcribe', 'audio'],
  'MiroFish / OASIS': ['mirofish', 'oasis', 'simulation', 'digital twin'],
  'Retell AI / Bland AI': ['retell', 'bland', 'voice calling', 'ai calling'],
  'n8n (self-hosted)': ['n8n', 'workflow', 'automation', 'no-code'],
  'Firecrawl': ['firecrawl', 'scraping', 'web scrape', 'researcher', 'articles']
};

// ── TOOL CARD ──────────────────────────────────────────────────────────────
function ToolCard({ tool, index }: { tool: ToolDef; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    if (!expanded && tool.ghPath && !fileContent) {
      setLoading(true);
      try {
        const res = await fetch(`/api/stack?path=${encodeURIComponent(tool.ghPath)}`);
        const data = await res.json() as { content?: string; error?: string };
        setFileContent(data.content || data.error || 'No content found.');
      } catch (e) {
        setFileContent(`Error: ${(e as Error).message}`);
      }
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  const tierColors = {
    'live': {
      border: 'border-teal-500/20 hover:border-teal-500/40',
      badge: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
      bar: 'from-teal-900/40 to-teal-500/10',
      ctx: 'bg-teal-500/5 border border-teal-500/10 text-teal-300/80',
      dot: 'bg-teal-400',
    },
    'not-wired': {
      border: 'border-yellow-500/20 hover:border-yellow-500/40',
      badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      bar: 'from-yellow-900/40 to-yellow-500/10',
      ctx: 'bg-yellow-500/5 border border-yellow-500/10 text-yellow-300/80',
      dot: 'bg-yellow-400',
    },
    'explore': {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      bar: 'from-blue-900/40 to-blue-500/10',
      ctx: 'bg-blue-500/5 border border-blue-500/10 text-blue-300/80',
      dot: 'bg-blue-400',
    }
  };

  const colors = tierColors[tool.tier];
  const badgeText = tool.tier === 'live' ? 'LIVE' : tool.tier === 'not-wired' ? 'NOT WIRED' : 'EXPLORE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-slate-800/60 backdrop-blur-xl border ${colors.border} rounded-xl overflow-hidden transition-all duration-200`}
    >
      <div className={`h-0.5 bg-gradient-to-r ${colors.bar}`} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-2xl flex-shrink-0">{tool.icon}</span>
            <div className="min-w-0">
              <div className="font-bold text-white text-sm truncate">{tool.name}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{tool.category}</div>
            </div>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-md flex-shrink-0 flex items-center gap-1.5 ${colors.badge}`}>
            {tool.tier === 'live' && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />}
            {badgeText}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed mb-3">{tool.desc}</p>

        {/* Context */}
        <div className={`text-xs px-3 py-2 rounded-lg leading-relaxed mb-3 ${colors.ctx}`}>
          {tool.context}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <code className="text-xs text-slate-500 bg-slate-900/60 px-2 py-1 rounded border border-slate-700/50 truncate max-w-[160px]">
            {tool.keyHint}
          </code>
          {tool.ghPath ? (
            <button
              onClick={handleExpand}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-700/40 flex-shrink-0"
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Hide</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Details</>
              )}
            </button>
          ) : (
            <span className="text-xs text-slate-600">No file yet</span>
          )}
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Fetching from GitHub…
                  </div>
                ) : (
                  <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
                    {fileContent}
                  </pre>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── CHAT PANEL ─────────────────────────────────────────────────────────────
function formatText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="text-teal-400 bg-slate-900/60 px-1 py-0.5 rounded text-xs font-mono border border-slate-700/50">$1</code>')
    .replace(/\n/g, '<br/>');
}

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: "Hey. I have access to the tool knowledge files in this repo. Ask me anything about the stack — credentials, what's wired, what it would take to connect something, or what's worth prioritizing next.\n\n**Try:** \"What tools are not connected?\" or \"Which tools power NAH?\""
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMsg = (text: string, role: 'ai' | 'user') => {
    setMessages(prev => [...prev, { role, text }]);
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    await processQuestion(q);
  };

  const processQuestion = async (question: string) => {
    addMsg(question, 'user');
    setLoading(true);
    const lq = question.toLowerCase();

    // Meta queries
    if (lq.includes('not connected') || lq.includes('not wired') || (lq.includes('what tools') && lq.includes('not'))) {
      const list = NOT_WIRED_TOOLS.map(t => `• **${t.icon} ${t.name}** (${t.category}) — ${t.context.replace(/🟡 Missing: /, '')}`).join('\n');
      addMsg(`5 tools with credentials not yet connected:\n\n${list}\n\n**Priority:** Sentry first (5 min) → LangSmith → PostHog`, 'ai');
      setLoading(false);
      return;
    }

    if (lq.includes('worth building') || lq.includes('building next') || lq.includes("whats next") || lq.includes('next step') || lq.includes("what's next")) {
      addMsg(`**Quick wins (keys already exist):**\n• 🛡️ **Sentry** — one env var, immediate prod error visibility\n• 🔬 **LangSmith** — every GPT call gets traced\n• 📊 **PostHog** — know which Gunner features teams use\n\n**Infrastructure moves:**\n• 🗄️ **Supabase** — Gunner V2 data layer migration\n• 🎙️ **Whisper** — already coded, one config flag away\n\n**Scale plays:**\n• 🤙 **Retell / Bland AI** — AI callers for NAH volume\n• 🔥 **Firecrawl** — upgrade Researcher from headlines to full articles`, 'ai');
      setLoading(false);
      return;
    }

    if (lq.includes('power nah') || lq.includes('nah tools') || (lq.includes('nah') && lq.includes('tool'))) {
      addMsg(`**NAH (New Again Houses) is powered by:**\n\n• 🏠 **GoHighLevel** — deal pipeline, all leads + contacts\n• 📞 **BatchDialer** — cold calling metrics\n• 💬 **BatchLeads** — SMS outreach metrics\n• 📻 **CallRail** — inbound calls + voicemail processing\n• 🤖 **OpenAI** — Gunner call grading for Kyle, Chris, Daniel\n• ✈️ **Telegram** — Xhaka command channel\n\n**Scale plays:** Retell AI / Bland AI for AI voice calling. Firecrawl for market intel.`, 'ai');
      setLoading(false);
      return;
    }

    // Tool-specific keyword match
    const matched: ToolDef[] = [];
    for (const [toolName, keywords] of Object.entries(KEYWORD_MAP)) {
      if (keywords.some(kw => lq.includes(kw))) {
        const tool = ALL_TOOLS.find(t => t.name === toolName);
        if (tool && !matched.find(m => m.name === tool.name)) matched.push(tool);
      }
    }

    if (matched.length > 0) {
      let response = matched.map(t => {
        const tier = t.tier === 'live' ? '✅ LIVE' : t.tier === 'not-wired' ? '🟡 NOT WIRED' : '🔵 EXPLORE';
        return `**${t.icon} ${t.name}** — ${tier}\n${t.desc}\n${t.context}\nCredentials: \`${t.keyHint}\``;
      }).join('\n\n');

      // Try fetching file content for first matched tool with path
      const toolWithPath = matched.find(t => t.ghPath);
      if (toolWithPath?.ghPath) {
        try {
          const res = await fetch(`/api/stack?path=${encodeURIComponent(toolWithPath.ghPath)}`);
          const data = await res.json() as { content?: string };
          if (data.content && data.content !== 'No content found.') {
            const preview = data.content.slice(0, 500).trim();
            response += `\n\n📄 **From knowledge files:**\n\`${preview}${data.content.length > 500 ? '…' : ''}\``;
          }
        } catch { /* ignore */ }
      }

      addMsg(response, 'ai');
    } else {
      addMsg(`No direct match for "${question}" in the tool knowledge files.\n\nAsk about a specific tool: Railway, GitHub, OpenAI, Telegram, GoHighLevel, BatchDialer, BatchLeads, CallRail, Sentry, PostHog, LangSmith, Supabase, Gemini, Zep, Whisper, Firecrawl, n8n, or Retell AI.\n\nOr ask: **"What tools are not connected?"** or **"What's worth building next?"**`, 'ai');
    }

    setLoading(false);
  };

  const CHIPS = [
    'What tools are not connected?',
    'What would Sentry unlock?',
    'BatchDialer API?',
    'Which tools power NAH?',
    "What's worth building next?"
  ];

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Messages */}
      <div className="p-5 space-y-4 min-h-[200px] max-h-[420px] overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'ai' ? 'bg-teal-500/20 border border-teal-500/30' : 'bg-purple-500/20 border border-purple-500/30'
            }`}>
              {msg.role === 'ai' ? <Bot className="w-3.5 h-3.5 text-teal-400" /> : <User className="w-3.5 h-3.5 text-purple-400" />}
            </div>
            <div className={`max-w-[85%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
              msg.role === 'ai'
                ? 'bg-slate-900/60 border border-slate-700/50 text-slate-300 rounded-tl-sm'
                : 'bg-purple-500/10 border border-purple-500/20 text-white rounded-tr-sm'
            }`}
              dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
            />
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-teal-500/20 border border-teal-500/30">
              <Bot className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 rounded-tl-sm">
              <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chips */}
      <div className="px-5 py-3 flex gap-2 flex-wrap border-t border-slate-700/50 bg-slate-900/30">
        {CHIPS.map(chip => (
          <button
            key={chip}
            onClick={() => processQuestion(chip)}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-700/50 bg-slate-800/60 text-slate-400 hover:text-teal-400 hover:border-teal-500/40 transition-colors whitespace-nowrap"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3 p-4 border-t border-slate-700/50 bg-slate-900/40">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about any tool..."
          className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function StackPage() {
  return (
    <div className="max-w-7xl mx-auto pb-24 md:pb-8">
      <StatusBar compact />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <Layers className="w-7 h-7 text-teal-400" />
          Stack Intelligence
        </h1>
        <p className="text-slate-400 text-sm max-w-xl">
          Every tool in the stack. Live status, credentials map, and what&apos;s worth building next.
        </p>

        {/* Stats */}
        <div className="flex gap-3 mt-5 flex-wrap">
          {[
            { num: '8', label: 'Live & Wired', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', icon: <CheckCircle2 className="w-4 h-4 text-teal-400" /> },
            { num: '5', label: 'Have Keys, Not Connected', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: <AlertCircle className="w-4 h-4 text-yellow-400" /> },
            { num: '7', label: 'Worth Exploring', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: <Compass className="w-4 h-4 text-blue-400" /> },
          ].map(stat => (
            <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${stat.bg} backdrop-blur-xl`}>
              {stat.icon}
              <div>
                <div className={`text-xl font-black leading-none ${stat.color}`}>{stat.num}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* TIER 1: LIVE */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">✅ Live — Actively Used</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-700/50 to-transparent" />
          <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-700/50 font-mono">8</span>
        </div>
        <p className="text-xs text-slate-500 mb-4 pl-1">These tools are wired in and running. Every data point in the Control Room flows through one of these.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {LIVE_TOOLS.map((tool, i) => <ToolCard key={tool.name} tool={tool} index={i} />)}
        </div>
      </section>

      {/* TIER 2: NOT WIRED */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">🟡 Known — Not Wired</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-700/50 to-transparent" />
          <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-700/50 font-mono">5</span>
        </div>
        <p className="text-xs text-slate-500 mb-4 pl-1">Accounts created, keys in hand. Not connected yet. Each one unlocks a specific capability gap.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {NOT_WIRED_TOOLS.map((tool, i) => <ToolCard key={tool.name} tool={tool} index={i} />)}
        </div>
      </section>

      {/* TIER 3: EXPLORE */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">🔵 Worth Exploring</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-700/50 to-transparent" />
          <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-700/50 font-mono">7</span>
        </div>
        <p className="text-xs text-slate-500 mb-4 pl-1">Curated. Opinionated. Each one addresses a specific bottleneck in NAH operations or the Gunner roadmap.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {EXPLORE_TOOLS.map((tool, i) => <ToolCard key={tool.name} tool={tool} index={i} />)}
        </div>
      </section>

      {/* CHAT PANEL */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-teal-400" />
            Ask About Any Tool
          </h2>
          <span className="text-xs text-slate-500">· Searches GitHub knowledge files · Keyword match</span>
        </div>
        <ChatPanel />
      </section>
    </div>
  );
}
