import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import type { TransactionSummary, PomodoroTodayStats } from '../lib/api';

interface DashboardViewProps {
  summary: TransactionSummary | null;
  pomodoroStats: PomodoroTodayStats | null;
  onNavigateToReconciliation: () => void;
  onRefreshStats: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  pomodoroStats,
  onNavigateToReconciliation,
  onRefreshStats,
}) => {
  // Mini live Pomodoro timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeProject, setActiveProject] = useState('Personal OS');
  const [isSavingPomo, setIsSavingPomo] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isActive) {
      setIsActive(false);
      handleCompletePomodoro();
    }
    return () => clearInterval(interval);
  }, [isActive, timerSeconds]);

  const handleCompletePomodoro = async () => {
    setIsSavingPomo(true);
    try {
      await api.createPomodoro({
        start_time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        duration_minutes: 25,
        project_name: activeProject,
        tag: 'deep-work',
        completed: true,
      });
      setTimerSeconds(25 * 60);
      onRefreshStats();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPomo(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const todayDateFormatted = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Centro de Control Personal</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 capitalize">
            {todayDateFormatted}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Resumen diario de finanzas, productividad y conciliación de Mercado Pago.
          </p>
        </div>

        {summary && summary.pending_reconciliation_count > 0 && (
          <button
            onClick={onNavigateToReconciliation}
            className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <span>{summary.pending_reconciliation_count} movimientos pendientes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gastos */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Gastos Registrados</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ${(summary?.total_expense || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total en Mercado Pago & manuales
          </div>
        </div>

        {/* Card 2: Ingresos */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Ingresos Totales</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ${(summary?.total_income || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Entradas y cobros acreditados
          </div>
        </div>

        {/* Card 3: Balance Neto */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Balance Neto</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold mt-2 ${
              (summary?.net_balance || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            ${(summary?.net_balance || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ingresos menos gastos</div>
        </div>

        {/* Card 4: Pomodoro de Hoy */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Enfoque de Hoy</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {pomodoroStats?.total_minutes || 0} <span className="text-sm font-normal text-slate-400">min</span>
          </div>
          <div className="text-[11px] text-purple-400 mt-1">
            {pomodoroStats?.total_pomodoros || 0} bloques de 25m completados
          </div>
        </div>
      </div>

      {/* Main Grid: Focus Widget + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Focus Widget */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Temporizador de Foco
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {activeProject}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sesión de Pomodoro rápida. Al completarla se guarda automáticamente.
            </p>
          </div>

          <div className="my-8 text-center">
            <div className="text-6xl font-extrabold font-mono tracking-wider text-white">
              {formatTime(timerSeconds)}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <select
                value={activeProject}
                onChange={(e) => setActiveProject(e.target.value)}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="Personal OS">Personal OS</option>
                <option value="Trabajo">Trabajo</option>
                <option value="Estudio">Estudio</option>
                <option value="Lectura">Lectura</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs shadow-lg transition-all ${
                isActive
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isActive ? 'Pausar' : 'Iniciar Sesión'}</span>
            </button>

            <button
              onClick={() => {
                setIsActive(false);
                setTimerSeconds(25 * 60);
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              disabled={isSavingPomo}
              onClick={handleCompletePomodoro}
              className="px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium hover:bg-emerald-900/60 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              Distribución de Gastos por Categoría
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Desglose acumulado de gastos asignados en Mercado Pago.
            </p>
          </div>

          <div className="my-4 space-y-3.5">
            {summary && Object.keys(summary.by_category).length > 0 ? (
              Object.entries(summary.by_category).map(([cat, amount]) => {
                const total = summary.total_expense || 1;
                const percentage = Math.round((amount / total) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{cat}</span>
                      <span className="text-slate-400">
                        ${amount.toLocaleString('es-AR')} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                No hay movimientos categorizados aún. Carga un extracto o registra un gasto.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Conciliación automática activada</span>
            <button
              onClick={onNavigateToReconciliation}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Ir a la mesa de conciliación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
