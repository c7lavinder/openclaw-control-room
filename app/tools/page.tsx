'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Search, Package, CheckCircle, AlertCircle, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBar from '../components/StatusBar';

interface Tool {
  name: string;
  category: string;
  path: string;
  description: string;
  status: 'healthy' | 'stale' | 'unknown';
}

interface ToolCategory {
  name: string;
  displayName: string;
  emoji: string;
  path: string;
  toolCount: number;
  tools: Tool[];
}

interface ToolsData {
  categories: ToolCategory[];
  totalCategories: number;
  totalTools: number;
  lastScan: string | null;
}

export default function ToolsPage() {
  const router = useRouter();
  const [toolsData, setToolsData] = useState<ToolsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/tools');
      const data = await res.json();
      setToolsData(data);
      
      // Auto-expand categories with tools
      const withTools = new Set(data.categories?.filter((c: ToolCategory) => c.toolCount > 0).map((c: ToolCategory) => c.name) || []);
      if (withTools.size <= 4) {
        setExpandedCategories(withTools);
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      router.refresh();
      fetchData();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchData, router]);

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // Filter categories and tools based on search
  const filteredCategories = toolsData?.categories.filter(cat => {
    if (searchQuery === '') return true;
    const query = searchQuery.toLowerCase();
    return cat.displayName.toLowerCase().includes(query) ||
      cat.tools.some(t => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
  }) || [];

  const statusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-teal-400" />;
      case 'stale':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Wrench className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 md:pb-0">
      <StatusBar compact />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <Wrench className="w-7 h-7 text-teal-400" />
          Tool Registry
        </h1>
        <p className="text-slate-400">
          {toolsData?.totalTools || 0} tools across {toolsData?.totalCategories || 0} categories
          {toolsData?.lastScan && (
            <span className="ml-2 text-slate-500">
              • Last scan: {new Date(toolsData.lastScan).toLocaleDateString()}
            </span>
          )}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tools and categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl 
              pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50
              transition-colors"
          />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4"
        >
          <p className="text-2xl font-bold text-white">{toolsData?.totalTools || 0}</p>
          <p className="text-sm text-slate-400">Total Tools</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4"
        >
          <p className="text-2xl font-bold text-white">{toolsData?.totalCategories || 0}</p>
          <p className="text-sm text-slate-400">Categories</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4"
        >
          <p className="text-2xl font-bold text-teal-400">
            {toolsData?.categories.filter(c => c.toolCount > 0).length || 0}
          </p>
          <p className="text-sm text-slate-400">Active Categories</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-400" />
            <p className="text-lg font-bold text-teal-400">Healthy</p>
          </div>
          <p className="text-sm text-slate-400">Registry Status</p>
        </motion.div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category, index) => {
            const isExpanded = expandedCategories.has(category.name);
            const hasTools = category.toolCount > 0;
            
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-slate-800/60 backdrop-blur-xl border rounded-2xl overflow-hidden transition-colors ${
                  hasTools ? 'border-slate-700/50 hover:border-teal-500/30' : 'border-slate-700/30'
                }`}
              >
                {/* Category Header */}
                <button
                  onClick={() => hasTools && toggleCategory(category.name)}
                  disabled={!hasTools}
                  className={`w-full flex items-center justify-between p-5 text-left ${
                    hasTools ? 'cursor-pointer' : 'cursor-default opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      hasTools ? 'bg-teal-500/20' : 'bg-slate-700/50'
                    }`}>
                      {category.emoji}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        {category.displayName}
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          hasTools ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700/50 text-slate-500'
                        }`}>
                          {category.toolCount} {category.toolCount === 1 ? 'tool' : 'tools'}
                        </span>
                      </h3>
                      <p className="text-sm text-slate-500">{category.path}</p>
                    </div>
                  </div>
                  {hasTools && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </motion.div>
                  )}
                </button>

                {/* Tools List */}
                <AnimatePresence>
                  {isExpanded && hasTools && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700/50"
                    >
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.tools.map((tool) => (
                          <div
                            key={tool.name}
                            className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-purple-400" />
                                <h4 className="font-medium text-white">{tool.name}</h4>
                              </div>
                              {statusIcon(tool.status)}
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-2">{tool.description}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        ) : (
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
            <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No tools found</p>
            <p className="text-xs text-slate-500 mt-1">Add tool docs to memory/context/tools/</p>
          </div>
        )}
      </div>
    </div>
  );
}
