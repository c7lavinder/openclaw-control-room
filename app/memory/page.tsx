'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Search, Calendar, FileText, Users, GitBranch, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBar from '../components/StatusBar';

interface MemorySection {
  name: string;
  content: string[];
}

interface MemoryData {
  title: string;
  lineCount: number;
  sections: MemorySection[];
  lastModified: string;
}

interface DailyLog {
  date: string;
  filename: string;
  content: string;
  preview: string;
  lineCount: number;
  lastModified: string;
}

interface Decision {
  id: string;
  title: string;
  date: string;
  context: string;
  source: string;
}

interface Person {
  id: string;
  name: string;
  role: string;
  description: string;
  details: string[];
  source: string;
}

interface ContextItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  description: string;
  childCount?: number;
}

type TabType = 'overview' | 'decisions' | 'people' | 'daily' | 'context';

export default function MemoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [memoryRes, logsRes, decisionsRes, peopleRes, contextRes] = await Promise.all([
        fetch('/api/memory'),
        fetch('/api/daily-logs'),
        fetch('/api/decisions'),
        fetch('/api/people'),
        fetch('/api/context')
      ]);
      
      const [memoryJson, logsJson, decisionsJson, peopleJson, contextJson] = await Promise.all([
        memoryRes.json(),
        logsRes.json(),
        decisionsRes.json(),
        peopleRes.json(),
        contextRes.json()
      ]);
      
      setMemoryData(memoryJson);
      setDailyLogs(logsJson.logs || []);
      setDecisions(decisionsJson.decisions || []);
      setPeople(peopleJson.people || []);
      setContextItems(contextJson.items || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      router.refresh();
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, router]);

  const toggleLog = (filename: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  // Filter based on search
  const filteredSections = memoryData?.sections.filter(section => 
    searchQuery === '' || 
    section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const filteredDecisions = decisions.filter(d =>
    searchQuery === '' ||
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.context.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPeople = people.filter(p =>
    searchQuery === '' ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = dailyLogs.filter(log =>
    searchQuery === '' ||
    log.date.includes(searchQuery) ||
    log.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Brain, count: filteredSections.length },
    { id: 'decisions' as const, label: 'Decisions', icon: GitBranch, count: filteredDecisions.length },
    { id: 'people' as const, label: 'People', icon: Users, count: filteredPeople.length },
    { id: 'daily' as const, label: 'Daily', icon: Calendar, count: filteredLogs.length },
    { id: 'context' as const, label: 'Context', icon: FolderOpen, count: contextItems.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Brain className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Memory Bank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 md:pb-0">
      <StatusBar compact />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <Brain className="w-7 h-7 text-teal-400" />
          Memory Bank
        </h1>
        <p className="text-slate-400">
          {memoryData?.lineCount || 0} lines in MEMORY.md • {dailyLogs.length} daily logs • {decisions.length} decisions
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search memory, decisions, people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl 
              pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50
              transition-colors"
          />
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 overflow-x-auto"
      >
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                    : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-white'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded text-xs ${isActive ? 'bg-teal-500/30' : 'bg-slate-700/50'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSections.length > 0 ? (
                filteredSections.map((section, index) => (
                  <motion.div
                    key={section.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5
                      hover:border-teal-500/30 transition-colors"
                  >
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-400" />
                      {section.name}
                    </h3>
                    <ul className="space-y-2">
                      {section.content.slice(0, 5).map((item, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                          <span className="line-clamp-2">{item}</span>
                        </li>
                      ))}
                      {section.content.length > 5 && (
                        <li className="text-xs text-slate-500">
                          +{section.content.length - 5} more items
                        </li>
                      )}
                    </ul>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
                  <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No sections found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Decisions Tab */}
        {activeTab === 'decisions' && (
          <motion.div
            key="decisions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDecisions.length > 0 ? (
                filteredDecisions.map((decision, index) => (
                  <motion.div
                    key={decision.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5
                      hover:border-yellow-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-yellow-400" />
                        {decision.title}
                      </h3>
                      <span className="text-xs text-slate-500 bg-slate-900/50 px-2 py-1 rounded">
                        {decision.date}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{decision.context}</p>
                    <span className="text-xs text-slate-600">{decision.source}</span>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
                  <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No decisions documented yet</p>
                  <p className="text-xs text-slate-500 mt-1">Add to memory/decisions/key-decisions.md</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* People Tab */}
        {activeTab === 'people' && (
          <motion.div
            key="people"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeople.length > 0 ? (
                filteredPeople.map((person, index) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5
                      hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{person.name}</h3>
                        <p className="text-sm text-purple-400">{person.role || 'Team Member'}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{person.description}</p>
                    {person.details.length > 0 && (
                      <ul className="space-y-1">
                        {person.details.slice(0, 3).map((detail, i) => (
                          <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-slate-500 mt-1.5" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No people profiles found</p>
                  <p className="text-xs text-slate-500 mt-1">Add .md files to memory/people/</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Daily Logs Tab */}
        {activeTab === 'daily' && (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="space-y-3">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => {
                  const isExpanded = expandedLogs.has(log.filename);
                  return (
                    <motion.div
                      key={log.filename}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden
                        hover:border-slate-600/50 transition-colors"
                    >
                      <button
                        onClick={() => toggleLog(log.filename)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-yellow-400" />
                          <div>
                            <h3 className="font-semibold text-white">{log.date}</h3>
                            <p className="text-xs text-slate-500">{log.lineCount} lines</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-700/50"
                          >
                            <pre className="p-4 text-sm text-slate-400 whitespace-pre-wrap font-mono overflow-x-auto">
                              {log.content}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              ) : (
                <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No daily logs found</p>
                  <p className="text-xs text-slate-500 mt-1">Add .md files to memory/daily/</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Context Tab */}
        {activeTab === 'context' && (
          <motion.div
            key="context"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contextItems.length > 0 ? (
                contextItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5
                      hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.type === 'directory' ? 'bg-purple-500/20' : 'bg-slate-700/50'
                      }`}>
                        {item.type === 'directory' ? (
                          <FolderOpen className="w-5 h-5 text-purple-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white capitalize">{item.name}</h3>
                        <p className="text-xs text-slate-500">
                          {item.type === 'directory' ? `${item.childCount} items` : 'File'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
                  <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No context files found</p>
                  <p className="text-xs text-slate-500 mt-1">Add files to memory/context/</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
