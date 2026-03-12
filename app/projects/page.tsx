'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban, Filter, Calendar, Target, ArrowRight, CheckCircle2, Circle, PauseCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBar from '../components/StatusBar';

interface Project {
  name: string;
  filename: string;
  status: 'active' | 'completed' | 'paused' | 'planned';
  description: string;
  content: string;
  highlights: string[];
  lastModified: string;
  goal?: string;
  currentState?: string;
  nextSteps?: string[];
}

type StatusFilter = 'all' | 'active' | 'completed' | 'paused' | 'planned';

const statusConfig = {
  active: {
    label: 'Active',
    icon: Circle,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    dotColor: 'bg-teal-400'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    dotColor: 'bg-green-400'
  },
  paused: {
    label: 'Paused',
    icon: PauseCircle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    dotColor: 'bg-yellow-400'
  },
  planned: {
    label: 'Planned',
    icon: Clock,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    dotColor: 'bg-purple-400'
  }
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      
      // Enrich projects with parsed content
      const enrichedProjects = (data.projects || []).map((project: Project) => {
        const lines = project.content.split('\n');
        
        // Extract goal
        let goal = '';
        const goalMatch = project.content.match(/\*\*Goal:\*\*\s*(.+)/i) || 
                          project.content.match(/Goal:\s*(.+)/i);
        if (goalMatch) {
          goal = goalMatch[1].trim();
        }
        
        // Extract current state
        let currentState = '';
        const stateMatch = project.content.match(/\*\*Current State:\*\*\s*(.+)/i) ||
                           project.content.match(/\*\*Status:\*\*\s*(.+)/i);
        if (stateMatch) {
          currentState = stateMatch[1].trim();
        }
        
        // Extract next steps (look for "Next:" or "Next Steps:" section)
        const nextSteps: string[] = [];
        let inNextSection = false;
        for (const line of lines) {
          if (line.toLowerCase().includes('next:') || line.toLowerCase().includes('next steps:')) {
            inNextSection = true;
            continue;
          }
          if (inNextSection && line.startsWith('- ')) {
            nextSteps.push(line.replace(/^-\s+/, ''));
          }
          if (inNextSection && line.startsWith('#')) {
            break;
          }
        }
        
        return {
          ...project,
          goal,
          currentState,
          nextSteps: nextSteps.slice(0, 3)
        };
      });
      
      setProjects(enrichedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
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

  const toggleProject = (filename: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter);

  const statusCounts = {
    all: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    paused: projects.filter(p => p.status === 'paused').length,
    planned: projects.filter(p => p.status === 'planned').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FolderKanban className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Projects...</p>
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
          <FolderKanban className="w-7 h-7 text-purple-400" />
          Projects
        </h1>
        <p className="text-slate-400">
          {projects.length} project{projects.length !== 1 ? 's' : ''} tracked •{' '}
          {projects.filter(p => p.status === 'active').length} active
        </p>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 overflow-x-auto"
      >
        <div className="flex items-center gap-2 min-w-max">
          <Filter className="w-4 h-4 text-slate-400" />
          {(['all', 'active', 'completed', 'paused', 'planned'] as StatusFilter[]).map((status) => {
            const config = status === 'all' ? null : statusConfig[status];
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${filter === status 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                    : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                  }`}
              >
                {config && <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />}
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-1 text-xs opacity-70">({statusCounts[status]})</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project, index) => {
            const config = statusConfig[project.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedProjects.has(project.filename);
            
            return (
              <motion.div
                key={project.filename}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-slate-800/60 backdrop-blur-xl border rounded-2xl overflow-hidden transition-colors
                  ${isExpanded ? config.borderColor : 'border-slate-700/50 hover:border-slate-600/50'}`}
              >
                {/* Project Header */}
                <button
                  onClick={() => toggleProject(project.filename)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                      <FolderKanban className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white">{project.name}</h3>
                        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${config.bgColor}`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
                          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-1">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 hidden md:block">
                      Updated {new Date(project.lastModified).toLocaleDateString()}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700/50"
                    >
                      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Goal */}
                        <div className="bg-slate-900/40 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-teal-400" />
                            <h4 className="font-semibold text-white text-sm">Goal</h4>
                          </div>
                          <p className="text-sm text-slate-400">
                            {project.goal || project.description || 'No goal specified'}
                          </p>
                        </div>

                        {/* Current State */}
                        <div className="bg-slate-900/40 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Circle className={`w-4 h-4 ${config.color}`} />
                            <h4 className="font-semibold text-white text-sm">Current State</h4>
                          </div>
                          <p className="text-sm text-slate-400">
                            {project.currentState || `Status: ${project.status}`}
                          </p>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-slate-900/40 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowRight className="w-4 h-4 text-purple-400" />
                            <h4 className="font-semibold text-white text-sm">Next Steps</h4>
                          </div>
                          {project.nextSteps && project.nextSteps.length > 0 ? (
                            <ul className="space-y-1">
                              {project.nextSteps.map((step, i) => (
                                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                                  <span className="line-clamp-1">{step}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-500">No next steps defined</p>
                          )}
                        </div>
                      </div>

                      {/* Highlights */}
                      {project.highlights.length > 0 && (
                        <div className="px-5 pb-5">
                          <h4 className="font-semibold text-white text-sm mb-3">Key Points</h4>
                          <div className="flex flex-wrap gap-2">
                            {project.highlights.map((highlight, i) => (
                              <span
                                key={i}
                                className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center"
          >
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {filter === 'all' ? 'No projects found' : `No ${filter} projects`}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {filter === 'all' 
                ? 'Add .md files to memory/projects/' 
                : 'Try a different filter'
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
