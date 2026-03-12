'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, RefreshCw, Zap, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBar from '../components/StatusBar';

interface Agent {
  name: string;
  emoji: string;
  role: string;
  responsibility: string;
  trigger: string;
  status: 'active' | 'standby' | 'scheduled';
  toolCount?: number;
}

const statusConfig = {
  active: {
    label: 'Active',
    dotColor: 'bg-teal-400',
    textColor: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    pulse: true
  },
  standby: {
    label: 'Standby',
    dotColor: 'bg-yellow-400',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    pulse: false
  },
  scheduled: {
    label: 'Scheduled',
    dotColor: 'bg-purple-400',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    pulse: false
  }
};

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, toolsRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/tools')
      ]);
      const [agentsData, toolsData] = await Promise.all([
        agentsRes.json(),
        toolsRes.json()
      ]);
      
      // Enrich agents with tool counts where relevant
      const enrichedAgents = (agentsData.agents || []).map((agent: Agent) => {
        // Assign tool counts based on agent role
        let toolCount = 0;
        if (agent.name === 'The Builder' || agent.name === 'Builder') {
          toolCount = toolsData.totalTools || 0;
        } else if (agent.name === 'The Operator' || agent.name === 'Operator') {
          // Count CRM tools
          toolCount = toolsData.categories?.find((c: { name: string }) => c.name === 'crm-external')?.toolCount || 0;
        }
        return { ...agent, toolCount };
      });
      
      setAgents(enrichedAgents);
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
    <div className="max-w-7xl mx-auto pb-20 md:pb-0">
      <StatusBar compact />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
            <Users className="w-7 h-7 text-teal-400" />
            Agent Roster
          </h1>
          <p className="text-slate-400">
            {agents.length} agents • {agents.filter(a => a.status === 'active').length} active • {agents.filter(a => a.status === 'standby').length} on standby
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-800/40 px-3 py-2 rounded-lg">
          <RefreshCw className="w-4 h-4" />
          <span>Updated {lastUpdated}</span>
        </div>
      </motion.div>

      {/* Leadership Section - Xhaka */}
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
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 
                      flex items-center justify-center text-3xl shadow-lg shadow-teal-500/20">
                      {agent.emoji}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal-400 border-2 border-slate-900 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium">
                        {agent.role}
                      </span>
                    </div>
                    <p className="text-slate-400 mb-3">{agent.responsibility}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-slate-400">{agent.trigger}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Specialists Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🔧</span>
          The Specialists
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialists.length > 0 ? (
            specialists.map((agent, index) => {
              const config = statusConfig[agent.status];
              return (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5
                    transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 hover:${config.borderColor}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl">
                        {agent.emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{agent.name}</h3>
                        <p className="text-sm text-slate-400">{agent.role}</p>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}>
                      <div className={`w-2 h-2 rounded-full ${config.dotColor} ${config.pulse ? 'animate-pulse' : ''}`} />
                      <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {agent.responsibility}
                  </p>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{agent.trigger}</span>
                    </div>
                    {agent.toolCount !== undefined && agent.toolCount > 0 && (
                      <span className="text-xs text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                        {agent.toolCount} tools
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No specialist agents found</p>
              <p className="text-xs text-slate-500 mt-1">Check AGENTS.md configuration</p>
            </div>
          )}
        </div>
      </section>

      {/* Workflow Diagram */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
      >
        <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Workflow Rules
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { step: '1', label: 'CEO gives objective', icon: '👤', color: 'teal' },
            { step: '2', label: 'Xhaka writes Spec', icon: '📝', color: 'purple' },
            { step: '3', label: 'Xhaka spawns Specialist', icon: '🚀', color: 'yellow' },
            { step: '4', label: 'Specialist executes', icon: '⚡', color: 'teal' },
            { step: '5', label: 'Xhaka updates CEO', icon: '✅', color: 'green' }
          ].map((item, i, arr) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex flex-col items-center relative"
            >
              <div className={`w-14 h-14 rounded-xl bg-${item.color}-500/10 border border-${item.color}-500/30 flex items-center justify-center text-2xl mb-3`}>
                {item.icon}
              </div>
              <span className="text-xs text-slate-400 text-center">{item.label}</span>
              {i < arr.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-5 -right-2 w-4 h-4 text-slate-600" />
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Key Rule */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <span className="text-2xl">🚨</span>
            <div>
              <h4 className="font-semibold text-red-400 mb-1">Xhaka&apos;s Hard Limit</h4>
              <p className="text-sm text-slate-400">
                Xhaka does NOT build, code, debug, or deploy. When a technical task comes up, Xhaka spawns the appropriate specialist.
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
