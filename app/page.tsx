'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, GitBranch, FolderKanban, Users, FileText, Zap, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBar from './components/StatusBar';
import MetricCard from './components/MetricCard';
import ProjectCard from './components/ProjectCard';

interface MemoryData {
  lineCount: number;
  recentBullets: string[];
}

interface Project {
  name: string;
  status: 'active' | 'completed' | 'paused' | 'planned';
  description: string;
  highlights: string[];
  lastModified: string;
}

interface Decision {
  id: string;
  title: string;
  date: string;
  context: string;
  source: string;
}

interface ActivityItem {
  id: string;
  type: 'check' | 'alert' | 'info';
  message: string;
  time?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [agentsCount, setAgentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [memoryRes, projectsRes, healthRes, decisionsRes, agentsRes] = await Promise.all([
        fetch('/api/memory'),
        fetch('/api/projects'),
        fetch('/api/health'),
        fetch('/api/decisions'),
        fetch('/api/agents')
      ]);

      const [memoryJson, projectsJson, healthJson, decisionsJson, agentsJson] = await Promise.all([
        memoryRes.json(),
        projectsRes.json(),
        healthRes.json(),
        decisionsRes.json(),
        agentsRes.json()
      ]);

      setMemoryData({
        lineCount: memoryJson.lineCount || 0,
        recentBullets: memoryJson.recentBullets || []
      });

      setProjects(projectsJson.projects || []);
      setDecisions(decisionsJson.decisions?.slice(0, 3) || []);
      setAgentsCount(agentsJson.agents?.length || 6);

      // Build activity items from health data
      const activities: ActivityItem[] = [];
      
      if (healthJson.dataSourceConnected) {
        activities.push({
          id: '1',
          type: 'check',
          message: 'GitHub data source connected',
          time: 'Just now'
        });
      } else {
        activities.push({
          id: '1',
          type: 'alert',
          message: 'GitHub connection failed',
          time: 'Just now'
        });
      }

      if (healthJson.repoStats?.lastCommitMessage) {
        activities.push({
          id: '2',
          type: 'info',
          message: `Latest: ${healthJson.repoStats.lastCommitMessage.substring(0, 50)}...`,
          time: healthJson.repoStats.lastCommitDate ? new Date(healthJson.repoStats.lastCommitDate).toLocaleDateString() : undefined
        });
      }

      if (healthJson.fileCounts?.dailyLogs > 0) {
        activities.push({
          id: '3',
          type: 'info',
          message: `${healthJson.fileCounts.dailyLogs} daily log(s) in memory`
        });
      }

      if (healthJson.fileCounts?.projects > 0) {
        activities.push({
          id: '4',
          type: 'check',
          message: `${healthJson.fileCounts.projects} project(s) tracked`
        });
      }

      activities.push({
        id: '5',
        type: 'check',
        message: `System uptime: ${healthJson.uptimeFormatted || 'Unknown'}`
      });
      
      setActivityItems(activities);
    } catch (error) {
      console.error('Error fetching data:', error);
      setActivityItems([{
        id: 'error',
        type: 'alert',
        message: 'Failed to fetch some data from workspace'
      }]);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-3xl mb-4 mx-auto shadow-lg shadow-teal-500/30"
          >
            🧠
          </motion.div>
          <p className="text-slate-400">Loading Control Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 md:pb-0">
      {/* Status Banner */}
      <StatusBar agentName="Xhaka 🧠" model="Claude Sonnet 4.6" role="COO / AI Partner" />

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <MetricCard
          title="Memory Lines"
          value={memoryData?.lineCount || 0}
          subtitle="in MEMORY.md"
          icon={Brain}
          accentColor="teal"
          index={0}
        />
        <MetricCard
          title="Active Projects"
          value={projects.filter(p => p.status === 'active').length}
          subtitle="currently tracked"
          icon={FolderKanban}
          accentColor="purple"
          index={1}
        />
        <MetricCard
          title="Decisions Filed"
          value={decisions.length}
          subtitle="documented"
          icon={GitBranch}
          accentColor="yellow"
          index={2}
        />
        <MetricCard
          title="Agents Active"
          value={agentsCount}
          subtitle="in roster"
          icon={Users}
          accentColor="teal"
          index={3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Decisions */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-yellow-400" />
            Recent Decisions
          </h2>
          <div className="grid gap-3">
            {decisions.length > 0 ? (
              decisions.map((decision, index) => (
                <motion.div
                  key={decision.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:border-yellow-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white line-clamp-1">{decision.title}</h3>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-2">{decision.date}</span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{decision.context}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded">{decision.source}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center">
                <GitBranch className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">No decisions documented yet</p>
                <p className="text-xs text-slate-500 mt-1">Add entries to memory/decisions/</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-teal-400" />
            System Status
          </h2>
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4">
            <div className="space-y-3">
              {activityItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  {item.type === 'check' && <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />}
                  {item.type === 'alert' && <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                  {item.type === 'info' && <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 line-clamp-2">{item.message}</p>
                    {item.time && <p className="text-xs text-slate-500 mt-0.5">{item.time}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-purple-400" />
          Active Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length > 0 ? (
            projects.slice(0, 6).map((project, index) => (
              <ProjectCard
                key={project.name}
                name={project.name}
                status={project.status}
                description={project.description}
                highlights={project.highlights}
                lastModified={project.lastModified}
                index={index}
              />
            ))
          ) : (
            <div className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
              <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No projects found</p>
              <p className="text-xs text-slate-500 mt-1">Add .md files to memory/projects/</p>
            </div>
          )}
        </div>
      </div>

      {/* Today's Context (Recent Memory) */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-400" />
          Recent Memory Entries
        </h2>
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
          {memoryData?.recentBullets && memoryData.recentBullets.length > 0 ? (
            <ul className="space-y-3">
              {memoryData.recentBullets.map((bullet, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
                  <span className="text-slate-300">{bullet}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-400">No recent entries</p>
              <p className="text-xs text-slate-500 mt-1">Check if MEMORY.md exists</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
