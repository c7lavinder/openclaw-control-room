'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Server, HardDrive, Cpu, Clock, CheckCircle, AlertCircle, FolderOpen, GitBranch, Database, ExternalLink, RefreshCw, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBar from '../components/StatusBar';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  uptimeFormatted: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  dataSource: string;
  dataSourceConnected: boolean;
  fileCounts: {
    memory: number;
    dailyLogs: number;
    projects: number;
    decisions: number;
    people: number;
    context: number;
    tools: number;
  };
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  systemMemory: {
    total: number;
    free: number;
    usedPercent: number;
  };
  repoStats: {
    lastCommitSha: string | null;
    lastCommitMessage: string | null;
    lastCommitDate: string | null;
    totalFiles: number;
  };
  timestamp: string;
}

interface RailwayService {
  name: string;
  status: 'online' | 'offline' | 'unknown';
  url?: string;
  description: string;
}

const railwayServices: RailwayService[] = [
  { name: 'xhaka', status: 'online', description: 'Core AI agent service' },
  { name: 'xhaka-intelligence', status: 'online', description: 'Intelligence processing' },
  { name: 'xhaka-control-room', status: 'online', url: 'https://xhaka-control-room.railway.app', description: 'This dashboard' }
];

const statusConfig = {
  healthy: {
    label: 'Healthy',
    icon: CheckCircle,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30'
  },
  degraded: {
    label: 'Degraded',
    icon: AlertCircle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30'
  },
  unhealthy: {
    label: 'Unhealthy',
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  }
};

export default function SystemPage() {
  const router = useRouter();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching health:', error);
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

  const manualRefresh = () => {
    setLoading(true);
    fetchData();
  };

  if (loading || !health) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading System Health...</p>
        </div>
      </div>
    );
  }

  const config = statusConfig[health.status];
  const StatusIcon = config.icon;

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
            <Activity className="w-7 h-7 text-teal-400" />
            System Health
          </h1>
          <p className="text-slate-400">
            Real-time monitoring and diagnostics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={manualRefresh}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg 
              hover:bg-slate-700/60 transition-colors text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
          
          {/* Overall Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
            <StatusIcon className={`w-5 h-5 ${config.color}`} />
            <span className={`font-semibold ${config.color}`}>{config.label}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Uptime */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-teal-500/10">
              <Clock className="w-5 h-5 text-teal-400" />
            </div>
            <span className="text-slate-400 text-sm">Uptime</span>
          </div>
          <p className="text-2xl font-bold text-white">{health.uptimeFormatted}</p>
        </motion.div>

        {/* Node Version */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Server className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-slate-400 text-sm">Node</span>
          </div>
          <p className="text-2xl font-bold text-white">{health.nodeVersion}</p>
        </motion.div>

        {/* Heap Memory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Cpu className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-slate-400 text-sm">Heap Memory</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {health.memoryUsage.heapUsed}MB
          </p>
          <p className="text-xs text-slate-500">of {health.memoryUsage.heapTotal}MB</p>
        </motion.div>

        {/* Total Files */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-teal-500/10">
              <Database className="w-5 h-5 text-teal-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Files</span>
          </div>
          <p className="text-2xl font-bold text-white">{health.repoStats.totalFiles}</p>
          <p className="text-xs text-slate-500">in repository</p>
        </motion.div>
      </div>

      {/* GitHub Connection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          GitHub Connection
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Status</p>
            <div className="flex items-center gap-2">
              {health.dataSourceConnected ? (
                <>
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  <span className="text-teal-400 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Repository</p>
            <p className="font-mono text-white text-sm">{health.dataSource.replace('github:', '')}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Last Commit</p>
            <p className="font-mono text-white text-sm">{health.repoStats.lastCommitSha || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Commit Date</p>
            <p className="text-white text-sm">
              {health.repoStats.lastCommitDate 
                ? new Date(health.repoStats.lastCommitDate).toLocaleString()
                : 'N/A'
              }
            </p>
          </div>
        </div>
        
        {health.repoStats.lastCommitMessage && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Latest Commit Message</p>
            <p className="text-white bg-slate-900/50 px-3 py-2 rounded-lg text-sm font-mono">
              {health.repoStats.lastCommitMessage}
            </p>
          </div>
        )}
      </motion.div>

      {/* Memory File Counts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-yellow-400" />
          Memory File Counts
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: 'MEMORY.md', count: health.fileCounts.memory, icon: '🧠' },
            { label: 'Daily Logs', count: health.fileCounts.dailyLogs, icon: '📅' },
            { label: 'Projects', count: health.fileCounts.projects, icon: '📁' },
            { label: 'Decisions', count: health.fileCounts.decisions, icon: '⚖️' },
            { label: 'People', count: health.fileCounts.people, icon: '👥' },
            { label: 'Context', count: health.fileCounts.context, icon: '📚' },
            { label: 'Tool Categories', count: health.fileCounts.tools, icon: '🔧' }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="text-center p-4 bg-slate-900/30 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors"
            >
              <span className="text-2xl mb-2 block">{item.icon}</span>
              <p className="text-2xl font-bold text-white">{item.count}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Railway Services */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-400" />
            Railway Services
          </h2>
          <a
            href="https://railway.app/project/f379b683-e34d-4e0e-a91a-f64d0ab499ea"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition-colors"
          >
            View on Railway
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {railwayServices.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + index * 0.1 }}
              className={`p-4 rounded-xl border transition-colors ${
                service.status === 'online' 
                  ? 'bg-teal-500/5 border-teal-500/20 hover:border-teal-500/40'
                  : 'bg-slate-900/30 border-slate-700/30 hover:border-slate-600/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server className={`w-5 h-5 ${service.status === 'online' ? 'text-teal-400' : 'text-slate-500'}`} />
                  <h3 className="font-medium text-white">{service.name}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    service.status === 'online' ? 'bg-teal-400 animate-pulse' : 'bg-slate-500'
                  }`} />
                  <span className={`text-xs ${
                    service.status === 'online' ? 'text-teal-400' : 'text-slate-500'
                  }`}>
                    {service.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-400">{service.description}</p>
              {service.url && (
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-teal-400/70 hover:text-teal-400 flex items-center gap-1"
                >
                  {service.url.replace('https://', '')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Platform Info Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 py-4"
      >
        <span>Platform: {health.platform}</span>
        <span className="hidden md:inline">•</span>
        <span>Architecture: {health.arch}</span>
        <span className="hidden md:inline">•</span>
        <span>Last check: {lastRefresh}</span>
      </motion.div>
    </div>
  );
}
