'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Search, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBar from '../components/StatusBar';
import MemoryCard from '../components/MemoryCard';

interface MemorySection {
  name: string;
  content: string[];
}

interface MemoryData {
  title: string;
  lineCount: number;
  sections: MemorySection[];
  lastModified: string;
}

interface DailyLog {
  date: string;
  filename: string;
  preview: string;
  lineCount: number;
  lastModified: string;
}

export default function MemoryPage() {
  const router = useRouter();
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [memoryRes, logsRes] = await Promise.all([
        fetch('/api/memory'),
        fetch('/api/daily-logs')
      ]);
      
      const memoryJson = await memoryRes.json();
      const logsJson = await logsRes.json();
      
      setMemoryData(memoryJson);
      setDailyLogs(logsJson.logs || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  // Filter sections based on search
  const filteredSections = memoryData?.sections.filter(section => 
    searchQuery === '' || 
    section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Filter logs based on search
  const filteredLogs = dailyLogs.filter(log =>
    searchQuery === '' ||
    log.date.includes(searchQuery) ||
    log.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Brain className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Memory...</p>
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
          <Brain className="w-7 h-7 text-teal-400" />
          Memory Bank
        </h1>
        <p className="text-slate-400">
          MEMORY.md ({memoryData?.lineCount || 0} lines) + Daily Logs
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
            placeholder="Search memory and logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl 
              pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50
              transition-colors"
          />
        </div>
      </motion.div>

      {/* MEMORY.md Sections */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          MEMORY.md Sections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSections.length > 0 ? (
            filteredSections.map((section, index) => (
              <motion.div
                key={section.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5
                  hover:border-slate-600/50 transition-colors"
              >
                <h3 className="font-semibold text-white mb-3">{section.name}</h3>
                <ul className="space-y-2">
                  {section.content.slice(0, 5).map((item, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                  {section.content.length > 5 && (
                    <li className="text-xs text-slate-500">
                      +{section.content.length - 5} more items
                    </li>
                  )}
                </ul>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
              <p className="text-slate-400">No sections found</p>
            </div>
          )}
        </div>
      </section>

      {/* Daily Logs */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-yellow-400" />
          Daily Logs (Last 7 Days)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => (
              <MemoryCard
                key={log.filename}
                title={log.date}
                content={log.preview}
                date={new Date(log.lastModified).toLocaleDateString()}
                lineCount={log.lineCount}
                index={index}
              />
            ))
          ) : (
            <div className="col-span-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
              <p className="text-slate-400">No daily logs found</p>
              <p className="text-xs text-slate-500 mt-1">Add .md files to memory/daily/</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
