'use client';

import { motion } from 'framer-motion';

interface AgentCardProps {
  name: string;
  emoji: string;
  role: string;
  responsibility: string;
  trigger: string;
  status: 'active' | 'standby' | 'scheduled';
  index?: number;
}

const statusConfig = {
  active: {
    label: 'Active',
    dotColor: 'bg-teal-400',
    textColor: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    pulse: true
  },
  standby: {
    label: 'Standby',
    dotColor: 'bg-yellow-400',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    pulse: false
  },
  scheduled: {
    label: 'Scheduled',
    dotColor: 'bg-purple-400',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    pulse: false
  }
};

export default function AgentCard({ 
  name, 
  emoji, 
  role, 
  responsibility, 
  trigger, 
  status,
  index = 0 
}: AgentCardProps) {
  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5
        transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 hover:border-slate-600/50"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl">
            {emoji}
          </div>
          <div>
            <h3 className="font-bold text-white">{name}</h3>
            <p className="text-sm text-slate-400">{role}</p>
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
        {responsibility}
      </p>

      {/* Trigger */}
      <div className="pt-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500">
          <span className="text-slate-400">Trigger:</span> {trigger}
        </p>
      </div>
    </motion.div>
  );
}
