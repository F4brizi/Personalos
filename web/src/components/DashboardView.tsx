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
  Cloud,
  Droplets,
} from 'lucide-react';
import { api } from '../lib/api';
import type { TransactionSummary, PomodoroTodayStats, WeatherLog } from '../lib/api';

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
  
  // Weather
  const [weatherLogs, setWeatherLogs] = useState<WeatherLog[]>([]);

  useEffect(() => {
    api.getWeatherLogs().then(setWeatherLogs).catch(console.error);
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-md p-6">
        <div>
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centro de Control Personal</span>
          </div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight mt-2 capitalize">
            {todayDateFormatted}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Resumen diario de finanzas, productividad y conciliación de Mercado Pago.
          </p>
        </div>

        {summary && summary.pending_reconciliation_count > 0 && (
          <button
            onClick={onNavigateToReconciliation}
            className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
          >
            <span className="font-mono">{summary.pending_reconciliation_count}</span>
            <span>movimientos pendientes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gastos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <span>Gastos Registrados</span>
            <TrendingDown className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-mono text-zinc-100 mt-3">
            ${(summary?.total_expense || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono uppercase">
            Mercado Pago & manuales
          </div>
        </div>

        {/* Card 2: Ingresos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <span>Ingresos Totales</span>
            <TrendingUp className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-mono text-zinc-100 mt-3">
            ${(summary?.total_income || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono uppercase">
            Entradas y cobros
          </div>
        </div>

        {/* Card 3: Balance Neto */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <span>Balance Neto</span>
            <DollarSign className="w-4 h-4 text-zinc-500" />
          </div>
          <div
            className={`text-2xl font-mono mt-3 ${
              (summary?.net_balance || 0) >= 0 ? 'text-zinc-100' : 'text-zinc-400'
            }`}
          >
            ${(summary?.net_balance || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono uppercase">Ingresos menos gastos</div>
        </div>

        {/* Card 4: Pomodoro de Hoy */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <span>Enfoque de Hoy</span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-mono text-zinc-100 mt-3 flex items-baseline gap-1">
            {pomodoroStats?.total_minutes || 0} <span className="text-xs font-sans text-zinc-500">MIN</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono uppercase">
            {pomodoroStats?.total_pomodoros || 0} bloques completados
          </div>
        </div>
      </div>

      {/* Main Grid: Focus Widget + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Focus Widget */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                Temporizador
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-sm bg-zinc-800 text-zinc-300 font-mono uppercase">
                {activeProject}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Sesión de enfoque. Guardado automático.
            </p>
          </div>

          <div className="my-8 text-center">
            <div className="text-6xl font-mono tracking-tight text-zinc-100">
              {formatTime(timerSeconds)}
            </div>
            <div className="mt-4 flex items-center justify-center">
              <select
                value={activeProject}
                onChange={(e) => setActiveProject(e.target.value)}
                className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-zinc-700"
              >
                <option value="Personal OS">Personal OS</option>
                <option value="Trabajo">Trabajo</option>
                <option value="Estudio">Estudio</option>
                <option value="Lectura">Lectura</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-5 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-colors border ${
                isActive
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700'
                  : 'bg-zinc-100 hover:bg-white text-zinc-950 border-zinc-100'
              }`}
            >
              {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isActive ? 'PAUSAR' : 'INICIAR'}</span>
            </button>

            <button
              onClick={() => {
                setIsActive(false);
                setTimerSeconds(25 * 60);
              }}
              className="p-2 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              disabled={isSavingPomo}
              onClick={handleCompletePomodoro}
              className="px-4 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono uppercase tracking-wider hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>GUARDAR</span>
            </button>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-md p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-zinc-400" />
              Distribución de Gastos
            </h2>
            <p className="text-xs text-zinc-500 mt-2">
              Desglose acumulado de gastos asignados en Mercado Pago.
            </p>
          </div>

          <div className="my-6 space-y-4">
            {summary && Object.keys(summary.by_category).length > 0 ? (
              Object.entries(summary.by_category).map(([cat, amount]) => {
                const total = summary.total_expense || 1;
                const percentage = Math.round((amount / total) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono uppercase tracking-wider">
                      <span className="text-zinc-400">{cat}</span>
                      <span className="text-zinc-300">
                        ${amount.toLocaleString('es-AR')} <span className="text-zinc-500 ml-1">[{percentage}%]</span>
                      </span>
                    </div>
                    <div className="h-1 w-full bg-zinc-950 rounded-none overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-zinc-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-zinc-600 text-xs font-mono uppercase tracking-widest">
                SIN DATOS DE CATEGORÍAS
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono uppercase tracking-wider">
            <span>Auto-conciliación ACTIVA</span>
            <button
              onClick={onNavigateToReconciliation}
              className="text-zinc-300 hover:text-zinc-100 font-medium flex items-center gap-1 transition-colors"
            >
              <span>IR A MESA</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Weather Widget */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <Cloud className="w-4 h-4 text-zinc-400" />
            Pronóstico Operativo
          </h2>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            {new Date().getHours() >= 17 ? (
              <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-sm border border-blue-500/20">Proyección: Mañana</span>
            ) : (
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-sm border border-emerald-500/20">Proyección: Hoy</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-zinc-800 rounded-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-950 font-mono border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Obra / Zona</th>
                <th className="px-4 py-3 text-right">Prob. Lluvia</th>
                <th className="px-4 py-3 text-right">T. Min</th>
                <th className="px-4 py-3 text-right">T. Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {(() => {
                const now = new Date();
                const isAfter5PM = now.getHours() >= 17;
                const targetObj = new Date(now);
                if (isAfter5PM) {
                  targetObj.setDate(targetObj.getDate() + 1);
                }
                const targetDateStr = targetObj.toLocaleDateString('en-CA');
                
                // Get logs for target date, limited to 2 unique locations
                const logsForDate = weatherLogs.filter(l => l.log_date === targetDateStr);
                const uniqueLocs = Array.from(new Set(logsForDate.map(l => l.location.name))).slice(0, 2);
                
                const tableRows = uniqueLocs.map(locName => logsForDate.find(l => l.location.name === locName)!);

                if (tableRows.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 font-mono text-xs">
                        Sin datos meteorológicos para {isAfter5PM ? 'mañana' : 'hoy'}. (Worker procesando...)
                      </td>
                    </tr>
                  );
                }

                return tableRows.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-zinc-100 text-xs font-bold uppercase">{log.location.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span className={`flex items-center justify-end gap-1 ${log.precipitation_probability && log.precipitation_probability > 30 ? 'text-blue-400 font-bold' : 'text-zinc-500'}`}>
                        {log.precipitation_probability !== null ? `${log.precipitation_probability}%` : '-'}
                        {log.precipitation_probability && log.precipitation_probability > 30 && <Droplets className="w-3 h-3" />}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400 text-xs">{log.temperature_min}°C</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-200 text-xs">{log.temperature_max}°C</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
