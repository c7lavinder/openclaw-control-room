'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBar from '../components/StatusBar';
import AgentCard from '../components/AgentCard';

interface Agent {
  name: string;
  emoji: string;
  role: string;
  responsibility: string;
  trigger: string;
  status: 'active' | 'standby' | 'scheduled';
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data.agents || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching agents:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Users className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Agents...</p>
        </div>
      </div>
    );
  }

  // Separate Xhaka (leadership) from specialists
  const leadership = agents.filter(a => a.name === 'Xhaka');
  const specialists = agents.filter(a => a.name !== 'Xhaka');

  return (
    <div className="max-w-7xl mx-auto">
      <StatusBar />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
            <Users className="w-7 h-7 text-teal-400" />
            Agent Roster
          </h1>
          <p className="text-slate-400">
            {agents.length} agents • {agents.filter(a => a.status === 'active').length} active
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw className="w-4 h-4" />
          <span>Updated {lastUpdated}</span>
        </div>
      </motion.div>

      {/* Leadership Section */}
      {leadership.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">👑</span>
            Leadership
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {leadership.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl 
                  border border-teal-500/30 rounded-2xl p-6 shadow-lg shadow-teal-500/10"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 
                    flex items-center justify-center text-3xl shadow-lg shadow-teal-500/20">
                    {agent.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium">
                        {agent.role}
                      </span>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <span className="text-xs text-teal-400">Active</span>
                      </div>
                    </div>
                    <p className="text-slate-400 mb-3">{agent.responsibility}</p>
                    <p className="text-xs text-slate-500">
                      <span className="text-slate-400">Trigger:</span> {agent.trigger}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Specialists Section */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🔧</span>
          The Specialists
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialists.length > 0 ? (
            specialists.map((agent, index) => (
              <AgentCard
                key={agent.name}
                name={agent.name}
                emoji={agent.emoji}
                role={agent.role}
                responsibility={agent.responsibility}
                trigger={agent.trigger}
                status={agent.status}
                index={index}
              />
            ))
          ) : (
            <div className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
              <p className="text-slate-400">No specialist agents found</p>
              <p className="text-xs text-slate-500 mt-1">Check AGENTS.md configuration</p>
            </div>
          )}
        </div>
      </section>

      {/* Workflow Info */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
      >
        <h3 className="font-semibold text-white mb-4">Workflow Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
          {[
            { step: '1', label: 'CEO gives objective', icon: '👤' },
            { step: '2', label: 'Xhaka writes Spec', icon: '📝' },
            { step: '3', label: 'Xhaka spawns Specialist', icon: '🚀' },
            { step: '4', label: 'Specialist executes', icon: '⚡' },
            { step: '5', label: 'Xhaka updates CEO', icon: '✅' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-lg mb-2">
                {item.icon}
              </div>
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
