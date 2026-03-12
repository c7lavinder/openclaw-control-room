'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Brain, Users, FolderKanban, Activity, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/memory', label: 'Memory', icon: Brain },
  { href: '/agents', label: 'Agents', icon: Users },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/system', label: 'System', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 p-6 flex-col z-50">
        {/* Logo/Brand */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">Xhaka</h1>
              <p className="text-xs text-slate-400">Control Room</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon 
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-teal-400'
                      }`} 
                    />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-2 h-2 rounded-full bg-teal-400"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* Status Footer */}
        <div className="pt-6 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>System Online</span>
          </div>
          <p className="text-xs text-slate-600 mt-2">v0.2.0 • Enriched</p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 z-50">
        <ul className="flex justify-around py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-1 ${
                    isActive ? 'text-teal-400' : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
