import React from 'react';
import { LayoutDashboard, Receipt, Timer, ShieldCheck, AlertCircle, LayoutGrid, BrainCircuit, Book, Cloud } from 'lucide-react';
import type { HealthStatus } from '../lib/api';

interface NavbarProps {
  currentTab: 'hub' | 'dashboard' | 'reconciliation' | 'pomodoro' | 'ai' | 'wiki' | 'weather';
  setCurrentTab: (tab: 'hub' | 'dashboard' | 'reconciliation' | 'pomodoro' | 'ai' | 'wiki' | 'weather') => void;
  health: HealthStatus | null;
  pendingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  health,
  pendingCount,
}) => {
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => setCurrentTab('hub')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="h-7 w-7 bg-zinc-100 flex items-center justify-center rounded-sm">
            <span className="font-bold text-zinc-950 text-xs font-mono">OS</span>
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              Personal OS
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-zinc-900 text-zinc-400 border border-zinc-800">
                Hub
              </span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-md border border-zinc-800">
          <button
            onClick={() => setCurrentTab('hub')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
              currentTab === 'hub'
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Hub Central</span>
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('reconciliation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors relative ${
              currentTab === 'reconciliation'
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Conciliación</span>
            {pendingCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-sm text-[10px] font-mono border ${
                currentTab === 'reconciliation' ? 'bg-zinc-950 text-zinc-100 border-zinc-800' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

            <button
              onClick={() => setCurrentTab('pomodoro')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm transition-colors text-xs font-mono uppercase tracking-widest ${
                currentTab === 'pomodoro'
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Enfoque</span>
            </button>

            <button
              onClick={() => setCurrentTab('ai')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm transition-colors text-xs font-mono uppercase tracking-widest ${
                currentTab === 'ai'
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>AI Lab</span>
            </button>

            <button
              onClick={() => setCurrentTab('wiki')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm transition-colors text-xs font-mono uppercase tracking-widest ${
                currentTab === 'wiki'
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Book className="w-3.5 h-3.5" />
              <span>Wiki</span>
            </button>

            <button
              onClick={() => setCurrentTab('weather')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm transition-colors text-xs font-mono uppercase tracking-widest ${
                currentTab === 'weather'
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Clima</span>
            </button>
        </nav>

        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs border ${
              isHealthy
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
            title={
              health
                ? `DB: ${health.services.database.status} (${health.services.database.latency_ms}ms) | Redis: ${health.services.redis.status} (${health.services.redis.latency_ms}ms)`
                : 'Conectando...'
            }
          >
            {isHealthy ? (
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className="font-mono text-[10px] uppercase tracking-wider">
              {isHealthy ? 'SYS_ONLINE' : 'SYS_OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
