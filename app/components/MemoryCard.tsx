'use client';

import { motion } from 'framer-motion';
import { FileText, Calendar } from 'lucide-react';

interface MemoryCardProps {
  title: string;
  content: string;
  date?: string;
  lineCount?: number;
  index?: number;
  variant?: 'default' | 'compact';
}

export default function MemoryCard({ 
  title, 
  content, 
  date, 
  lineCount,
  index = 0,
  variant = 'default'
}: MemoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl 
        transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 hover:border-slate-600/50
        ${variant === 'compact' ? 'p-4' : 'p-5'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-400" />
          <h3 className={`font-semibold text-white ${variant === 'compact' ? 'text-sm' : ''}`}>
            {title}
          </h3>
        </div>
        {date && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            <span>{date}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <p className={`text-slate-400 ${variant === 'compact' ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'}`}>
        {content}
      </p>

      {/* Footer */}
      {lineCount !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">{lineCount} lines</span>
        </div>
      )}
    </motion.div>
  );
}
