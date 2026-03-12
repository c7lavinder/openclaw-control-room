'use client';

import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'check' | 'alert' | 'info';
  message: string;
  timestamp?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
}

const iconConfig = {
  check: {
    icon: CheckCircle,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10'
  },
  alert: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10'
  },
  info: {
    icon: Clock,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10'
  }
};

export default function ActivityFeed({ items, title = 'Activity Feed' }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-teal-400" />
        <h3 className="font-semibold text-white">{title}</h3>
      </div>

      {/* Feed Items */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No recent activity</p>
        ) : (
          items.map((item, index) => {
            const config = iconConfig[item.type];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className={`p-1.5 rounded-lg ${config.bgColor} flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 line-clamp-2">{item.message}</p>
                  {item.timestamp && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.timestamp}</p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
