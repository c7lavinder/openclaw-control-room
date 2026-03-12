'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBar from '../components/StatusBar';
import ProjectCard from '../components/ProjectCard';

interface Project {
  name: string;
  filename: string;
  status: 'active' | 'completed' | 'paused' | 'planned';
  description: string;
  highlights: string[];
  lastModified: string;
}

type StatusFilter = 'all' | 'active' | 'completed' | 'paused' | 'planned';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
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
    <div className="max-w-7xl mx-auto">
      <StatusBar />

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
          {projects.length} project{projects.length !== 1 ? 's' : ''} tracked
        </p>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          {(['all', 'active', 'completed', 'paused', 'planned'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filter === status 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 text-xs opacity-70">({statusCounts[status]})</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.filename}
              name={project.name}
              status={project.status}
              description={project.description}
              highlights={project.highlights}
              lastModified={project.lastModified}
              index={index}
            />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center"
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
