import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ReconciliationTable } from './components/ReconciliationTable';
import { PomodoroView } from './components/PomodoroView';
import { api } from './lib/api';
import type {
  HealthStatus,
  Transaction,
  TransactionSummary,
  PomodoroSession,
  PomodoroTodayStats,
} from './lib/api';
import { Loader2 } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'reconciliation' | 'pomodoro'>('dashboard');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pomodoros, setPomodoros] = useState<PomodoroSession[]>([]);
  const [pomodoroStats, setPomodoroStats] = useState<PomodoroTodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [hData, txData, sumData, pomoData, pomoStatsData] = await Promise.allSettled([
        api.getHealth(),
        api.getTransactions({ limit: 100 }),
        api.getSummary(),
        api.getPomodoros(30),
        api.getTodayPomodoroStats(),
      ]);

      if (hData.status === 'fulfilled') setHealth(hData.value);
      if (txData.status === 'fulfilled') setTransactions(txData.value);
      if (sumData.status === 'fulfilled') setSummary(sumData.value);
      if (pomoData.status === 'fulfilled') setPomodoros(pomoData.value);
      if (pomoStatsData.status === 'fulfilled') setPomodoroStats(pomoStatsData.value);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      api.getHealth().then(setHealth).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const pendingCount = transactions.filter((t) => !t.is_reconciled).length;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        health={health}
        pendingCount={pendingCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs">Cargando datos de Personal OS...</span>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                summary={summary}
                pomodoroStats={pomodoroStats}
                onNavigateToReconciliation={() => setCurrentTab('reconciliation')}
                onRefreshStats={loadData}
              />
            )}

            {currentTab === 'reconciliation' && (
              <ReconciliationTable
                transactions={transactions}
                onRefresh={loadData}
              />
            )}

            {currentTab === 'pomodoro' && (
              <PomodoroView
                sessions={pomodoros}
                todayStats={pomodoroStats}
                onRefresh={loadData}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/40 py-4 text-center text-xs text-slate-600">
        Personal OS · Desarrollado con FastAPI, PostgreSQL, Redis, React 19 & Tailwind CSS
      </footer>
    </div>
  );
}

export default App;
