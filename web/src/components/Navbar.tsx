import React from 'react';
import { LayoutDashboard, Receipt, Timer, ShieldCheck, AlertCircle } from 'lucide-react';
import type { HealthStatus } from '../lib/api';

interface NavbarProps {
  currentTab: 'dashboard' | 'reconciliation' | 'pomodoro';
  setCurrentTab: (tab: 'dashboard' | 'reconciliation' | 'pomodoro') => void;
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
    <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-white text-base">OS</span>
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
              Personal OS
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0
              </span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('reconciliation')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
              currentTab === 'reconciliation'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Conciliación</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('pomodoro')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'pomodoro'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>Enfoque</span>
          </button>
        </nav>

        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
              isHealthy
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
            }`}
            title={
              health
                ? `DB: ${health.services.database.status} (${health.services.database.latency_ms}ms) | Redis: ${health.services.redis.status} (${health.services.redis.latency_ms}ms)`
                : 'Conectando...'
            }
          >
            {isHealthy ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="font-mono text-[11px]">
              {isHealthy ? 'Docker: Healthy' : 'Docker: Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
