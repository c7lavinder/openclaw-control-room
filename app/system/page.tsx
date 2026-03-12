'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Server, HardDrive, Cpu, Clock, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBar from '../components/StatusBar';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  uptimeFormatted: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  workspacePath: string;
  workspaceExists: boolean;
  fileCounts: {
    memory: number;
    dailyLogs: number;
    projects: number;
    decisions: number;
    people: number;
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
  timestamp: string;
}

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

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
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
            <Activity className="w-7 h-7 text-teal-400" />
            System Health
          </h1>
          <p className="text-slate-400">
            Real-time monitoring and diagnostics
          </p>
        </div>
        
        {/* Overall Status Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
          <StatusIcon className={`w-5 h-5 ${config.color}`} />
          <span className={`font-semibold ${config.color}`}>{config.label}</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <span className="text-slate-400 text-sm">Node Version</span>
          </div>
          <p className="text-2xl font-bold text-white">{health.nodeVersion}</p>
        </motion.div>

        {/* Memory Usage */}
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
            <span className="text-sm text-slate-500 font-normal ml-1">
              / {health.memoryUsage.heapTotal}MB
            </span>
          </p>
        </motion.div>

        {/* System Memory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <HardDrive className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-slate-400 text-sm">System Memory</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {health.systemMemory.usedPercent}%
            <span className="text-sm text-slate-500 font-normal ml-1">used</span>
          </p>
          <div className="mt-2 h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                health.systemMemory.usedPercent > 80 ? 'bg-red-400' : 
                health.systemMemory.usedPercent > 60 ? 'bg-yellow-400' : 'bg-teal-400'
              }`}
              style={{ width: `${health.systemMemory.usedPercent}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Workspace Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-purple-400" />
          Workspace
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-1">Path</p>
            <p className="font-mono text-white bg-slate-900/50 px-3 py-2 rounded-lg text-sm">
              {health.workspacePath}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Status</p>
            <div className="flex items-center gap-2">
              {health.workspaceExists ? (
                <>
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  <span className="text-teal-400">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">Not Found</span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* File Counts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">File Counts</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'MEMORY.md', count: health.fileCounts.memory, icon: '🧠' },
            { label: 'Daily Logs', count: health.fileCounts.dailyLogs, icon: '📅' },
            { label: 'Projects', count: health.fileCounts.projects, icon: '📁' },
            { label: 'Decisions', count: health.fileCounts.decisions, icon: '⚖️' },
            { label: 'People', count: health.fileCounts.people, icon: '👥' }
          ].map((item, i) => (
            <div key={i} className="text-center p-4 bg-slate-900/30 rounded-xl">
              <span className="text-2xl mb-2 block">{item.icon}</span>
              <p className="text-2xl font-bold text-white">{item.count}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Platform Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-500"
      >
        <span>Platform: {health.platform}</span>
        <span>•</span>
        <span>Arch: {health.arch}</span>
        <span>•</span>
        <span>Last check: {new Date(health.timestamp).toLocaleTimeString()}</span>
      </motion.div>
    </div>
  );
}
