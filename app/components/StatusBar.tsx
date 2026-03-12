'use client';

import { motion } from 'framer-motion';
import { Clock, Cpu, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatusBarProps {
  agentName?: string;
  model?: string;
}

export default function StatusBar({ agentName = 'Xhaka', model = 'Claude Sonnet' }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [uptime, setUptime] = useState<string>('Loading...');

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
      } catch {
        setUptime('N/A');
      }
    };
    fetchUptime();
    const uptimeInterval = setInterval(fetchUptime, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(uptimeInterval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        {/* Agent Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-teal-500/20">
            🧠
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {agentName}
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            </h2>
            <p className="text-sm text-slate-400">
              <span className="text-purple-400">{model}</span> • COO
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Cpu className="w-4 h-4 text-teal-400" />
            <span className="text-sm">Active</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">{uptime}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-mono">{currentTime}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
