'use client';

import { motion } from 'framer-motion';
import { Clock, Cpu, Zap, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatusBarProps {
  agentName?: string;
  model?: string;
  role?: string;
  compact?: boolean;
}

export default function StatusBar({ 
  agentName = 'Xhaka', 
  model = 'Claude Sonnet 4.6',
  role = 'COO / AI Partner',
  compact = false 
}: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [uptime, setUptime] = useState<string>('Loading...');
  const [status, setStatus] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Fetch uptime from health endpoint
    const fetchUptime = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setUptime(data.uptimeFormatted || 'Unknown');
        setStatus(data.status || 'healthy');
      } catch {
        setUptime('N/A');
        setStatus('degraded');
      }
    };
    fetchUptime();
    const uptimeInterval = setInterval(fetchUptime, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(uptimeInterval);
    };
  }, []);

  const statusColors = {
    healthy: 'bg-teal-400',
    degraded: 'bg-yellow-400',
    unhealthy: 'bg-red-400'
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 text-sm"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`} />
          <span className="text-slate-400">{agentName} • {model}</span>
        </div>
        <span className="text-slate-500 font-mono">{currentTime}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 md:p-5 mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Agent Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-teal-500/20">
              🧠
            </div>
            {/* Pulse ring */}
            <div className={`absolute -inset-1 rounded-xl ${statusColors[status]} opacity-20 animate-ping`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              {agentName}
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]} animate-pulse`} />
                <span className="text-xs font-normal text-slate-400 capitalize">{status}</span>
              </div>
            </h2>
            <p className="text-sm text-slate-400">
              <span className="text-purple-400 font-medium">{model}</span>
              <span className="mx-2">•</span>
              <span>{role}</span>
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-2 rounded-lg">
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="text-slate-300">Active</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-2 rounded-lg">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300">{uptime}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300 font-mono">{currentTime}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
