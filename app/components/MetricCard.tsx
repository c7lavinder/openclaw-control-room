'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: 'teal' | 'purple' | 'red' | 'yellow';
  trend?: 'up' | 'down' | 'neutral';
  index?: number;
}

const colorClasses = {
  teal: {
    icon: 'text-teal-400',
    glow: 'shadow-teal-500/10',
    border: 'hover:border-teal-500/30',
    bg: 'bg-teal-500/10'
  },
  purple: {
    icon: 'text-purple-400',
    glow: 'shadow-purple-500/10',
    border: 'hover:border-purple-500/30',
    bg: 'bg-purple-500/10'
  },
  red: {
    icon: 'text-red-400',
    glow: 'shadow-red-500/10',
    border: 'hover:border-red-500/30',
    bg: 'bg-red-500/10'
  },
  yellow: {
    icon: 'text-yellow-400',
    glow: 'shadow-yellow-500/10',
    border: 'hover:border-yellow-500/30',
    bg: 'bg-yellow-500/10'
  }
};

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  accentColor = 'teal',
  index = 0 
}: MetricCardProps) {
  const colors = colorClasses[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 
        transition-all duration-300 hover:shadow-lg ${colors.glow} ${colors.border} cursor-default`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
      
      <div>
        <p className="text-slate-400 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
