'use client';

import { motion } from 'framer-motion';
import { FolderKanban, CheckCircle2, Circle, PauseCircle, Clock } from 'lucide-react';

interface ProjectCardProps {
  name: string;
  status: 'active' | 'completed' | 'paused' | 'planned';
  description: string;
  highlights?: string[];
  lastModified?: string;
  index?: number;
}

const statusConfig = {
  active: {
    label: 'Active',
    icon: Circle,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  paused: {
    label: 'Paused',
    icon: PauseCircle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30'
  },
  planned: {
    label: 'Planned',
    icon: Clock,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  }
};

export default function ProjectCard({ 
  name, 
  status, 
  description, 
  highlights = [],
  lastModified,
  index = 0 
}: ProjectCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
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
          <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">{name}</h3>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
        {description}
      </p>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {highlights.slice(0, 3).map((highlight, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 flex-shrink-0" />
              <span className="text-xs text-slate-500 line-clamp-1">{highlight}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {lastModified && (
        <div className="pt-3 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">
            Updated {new Date(lastModified).toLocaleDateString()}
          </span>
        </div>
      )}
    </motion.div>
  );
}
