'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, GitBranch, FolderKanban, FileText } from 'lucide-react';
import StatusBar from './components/StatusBar';
import MetricCard from './components/MetricCard';
import MemoryCard from './components/MemoryCard';
import ProjectCard from './components/ProjectCard';
import ActivityFeed from './components/ActivityFeed';

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

interface ActivityItem {
  id: string;
  type: 'check' | 'alert' | 'info';
  message: string;
}

export default function HomePage() {
  const router = useRouter();
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [decisionsCount, setDecisionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch memory data
      const memoryRes = await fetch('/api/memory');
      const memoryJson = await memoryRes.json();
      setMemoryData({
        lineCount: memoryJson.lineCount || 0,
        recentBullets: memoryJson.recentBullets || []
      });

      // Fetch projects
      const projectsRes = await fetch('/api/projects');
      const projectsJson = await projectsRes.json();
      setProjects(projectsJson.projects || []);

      // Fetch health for activity
      const healthRes = await fetch('/api/health');
      const healthJson = await healthRes.json();
      
      // Build activity items from health data
      const activities: ActivityItem[] = [];
      if (healthJson.workspaceExists) {
        activities.push({
          id: '1',
          type: 'check',
          message: 'Workspace connected and accessible'
        });
      }
      if (healthJson.fileCounts?.memory > 0) {
        activities.push({
          id: '2',
          type: 'check',
          message: 'MEMORY.md loaded successfully'
        });
      }
      if (healthJson.fileCounts?.dailyLogs > 0) {
        activities.push({
          id: '3',
          type: 'info',
          message: `${healthJson.fileCounts.dailyLogs} daily log(s) available`
        });
      }
      if (healthJson.fileCounts?.projects > 0) {
        activities.push({
          id: '4',
          type: 'info',
          message: `${healthJson.fileCounts.projects} project file(s) tracked`
        });
      }
      activities.push({
        id: '5',
        type: 'check',
        message: `System uptime: ${healthJson.uptimeFormatted || 'Unknown'}`
      });
      
      setActivityItems(activities);
      setDecisionsCount(healthJson.fileCounts?.decisions || 0);
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
    
    // Auto-refresh every 30 seconds
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-2xl mb-4 mx-auto animate-pulse">
            🧠
          </div>
          <p className="text-slate-400">Loading Control Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Status Banner */}
      <StatusBar agentName="Xhaka" model="Claude Sonnet" />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Memory Health"
          value={memoryData?.lineCount || 0}
          subtitle="lines in MEMORY.md"
          icon={Brain}
          accentColor="teal"
          index={0}
        />
        <MetricCard
          title="Decisions"
          value={decisionsCount}
          subtitle="documented decisions"
          icon={GitBranch}
          accentColor="purple"
          index={1}
        />
        <MetricCard
          title="Active Projects"
          value={projects.filter(p => p.status === 'active').length}
          subtitle="currently tracked"
          icon={FolderKanban}
          accentColor="yellow"
          index={2}
        />
        <MetricCard
          title="Memory Entries"
          value={memoryData?.recentBullets?.length || 0}
          subtitle="recent items"
          icon={FileText}
          accentColor="teal"
          index={3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Memory Entries */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-teal-400" />
            Recent Memory Entries
          </h2>
          <div className="grid gap-4">
            {memoryData?.recentBullets && memoryData.recentBullets.length > 0 ? (
              memoryData.recentBullets.map((bullet, index) => (
                <MemoryCard
                  key={index}
                  title={`Entry ${index + 1}`}
                  content={bullet}
                  index={index}
                  variant="compact"
                />
              ))
            ) : (
              <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 text-center">
                <p className="text-slate-400">No recent memory entries found</p>
                <p className="text-xs text-slate-500 mt-1">Check if MEMORY.md exists in workspace</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <ActivityFeed items={activityItems} title="System Status" />
        </div>
      </div>

      {/* Projects Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-purple-400" />
          Active Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length > 0 ? (
            projects.slice(0, 3).map((project, index) => (
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
            <div className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 text-center">
              <p className="text-slate-400">No projects found</p>
              <p className="text-xs text-slate-500 mt-1">Add .md files to memory/projects/</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
