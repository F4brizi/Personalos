import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HubView } from './components/HubView';
import { DashboardView } from './components/DashboardView';
import { ReconciliationTable } from './components/ReconciliationTable';
import { PomodoroView } from './components/PomodoroView';
import { AiAnalyticsView } from './components/AiAnalyticsView';
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
  const [currentTab, setCurrentTab] = useState<'hub' | 'dashboard' | 'reconciliation' | 'pomodoro' | 'ai'>('hub');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pomodoros, setPomodoros] = useState<PomodoroSession[]>([]);
  const [pomodoroStats, setPomodoroStats] = useState<PomodoroTodayStats | null>(null);
  const [aiStats, setAiStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [hData, txData, sumData, pomoData, pomoStatsData, aiData] = await Promise.allSettled([
        api.getHealth(),
        api.getTransactions({ limit: 100 }),
        api.getSummary(),
        api.getPomodoros(30),
        api.getTodayPomodoroStats(),
        api.getAiStats(30),
      ]);

      if (hData.status === 'fulfilled') setHealth(hData.value);
      if (txData.status === 'fulfilled') setTransactions(txData.value);
      if (sumData.status === 'fulfilled') setSummary(sumData.value);
      if (pomoData.status === 'fulfilled') setPomodoros(pomoData.value);
      if (pomoStatsData.status === 'fulfilled') setPomodoroStats(pomoStatsData.value);
      if (aiData.status === 'fulfilled') setAiStats(aiData.value);
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        health={health}
        pendingCount={pendingCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Iniciando sistemas OS...</span>
          </div>
        ) : (
          <>
            {currentTab === 'hub' && (
              <HubView
                summary={summary}
                aiStats={aiStats}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

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

            {currentTab === 'ai' && (
              <AiAnalyticsView />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
        Personal OS // Tactical Command Center // React 19
      </footer>
    </div>
  );
}

export default App;
