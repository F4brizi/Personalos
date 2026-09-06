import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle2,
  Tag,
  Clock,
  Briefcase,
  Flame,
} from 'lucide-react';
import { api } from '../lib/api';
import type { PomodoroSession, PomodoroTodayStats } from '../lib/api';

interface PomodoroViewProps {
  sessions: PomodoroSession[];
  todayStats: PomodoroTodayStats | null;
  onRefresh: () => void;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  sessions,
  todayStats,
  onRefresh,
}) => {
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [project, setProject] = useState('Personal OS');
  const [tag, setTag] = useState('desarrollo');
  const [interruptions, setInterruptions] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      handleSaveSession();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const handleSelectPreset = (mins: number) => {
    setIsActive(false);
    setTargetMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const handleSaveSession = async () => {
    setIsSaving(true);
    try {
      await api.createPomodoro({
        start_time: new Date(Date.now() - targetMinutes * 60 * 1000).toISOString(),
        duration_minutes: targetMinutes,
        project_name: project,
        tag: tag || undefined,
        completed: true,
        interruptions,
      });
      setSecondsLeft(targetMinutes * 60);
      setInterruptions(0);
      onRefresh();
    } catch (err) {
      console.error('Error saving pomodoro:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.round(
    ((targetMinutes * 60 - secondsLeft) / (targetMinutes * 60)) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Timer className="w-6 h-6 text-purple-400" />
          Módulo de Enfoque & Deep Work
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Técnica Pomodoro sincronizada en la nube de Personal OS.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timer Display */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Progress background bar */}
          <div
            className="absolute bottom-0 left-0 h-1 bg-purple-500/50 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 mb-8">
            <button
              onClick={() => handleSelectPreset(25)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                targetMinutes === 25
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              25m Pomodoro
            </button>
            <button
              onClick={() => handleSelectPreset(50)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                targetMinutes === 50
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              50m Deep Work
            </button>
            <button
              onClick={() => handleSelectPreset(5)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                targetMinutes === 5
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              5m Pausa Corta
            </button>
          </div>

          {/* Big Clock */}
          <div className="text-7xl sm:text-8xl font-black font-mono tracking-widest text-white drop-shadow-md my-4">
            {formatTime(secondsLeft)}
          </div>

          {/* Project & Tag selectors */}
          <div className="flex flex-wrap items-center justify-center gap-3 my-4">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="Personal OS" className="bg-slate-900">Personal OS</option>
                <option value="Trabajo" className="bg-slate-900">Trabajo</option>
                <option value="Estudio" className="bg-slate-900">Estudio</option>
                <option value="Lectura" className="bg-slate-900">Lectura</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <input
                type="text"
                placeholder="Etiqueta (ej. frontend)"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="bg-transparent text-white focus:outline-none w-28 text-xs"
              />
            </div>

            <button
              onClick={() => setInterruptions((prev) => prev + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-amber-400 transition-all"
              title="Registrar distracción o interrupción"
            >
              <span>Interrupción:</span>
              <span className="font-bold font-mono">{interruptions}</span>
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold text-sm shadow-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
              }`}
            >
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isActive ? 'Pausar' : 'Comenzar'}</span>
            </button>

            <button
              onClick={() => {
                setIsActive(false);
                setSecondsLeft(targetMinutes * 60);
              }}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Reiniciar reloj"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              disabled={isSaving}
              onClick={handleSaveSession}
              className="px-4 py-3 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/80 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Completar y Guardar'}</span>
            </button>
          </div>
        </div>

        {/* Today Summary & Project Breakdown */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
              <Flame className="w-4 h-4" />
              <span>Resumen de Productividad de Hoy</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <div className="text-2xl font-black font-mono text-white">
                  {todayStats?.total_pomodoros || 0}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Pomodoros</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <div className="text-2xl font-black font-mono text-purple-400">
                  {todayStats?.total_minutes || 0}m
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Tiempo Total</div>
              </div>
            </div>

            {/* Breakdown by project */}
            <div className="mt-5 space-y-2">
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Por Proyecto
              </div>
              {todayStats && Object.keys(todayStats.by_project).length > 0 ? (
                Object.entries(todayStats.by_project).map(([proj, mins]) => (
                  <div
                    key={proj}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-950/40 border border-slate-800/50"
                  >
                    <span className="text-slate-300 font-medium">{proj}</span>
                    <span className="text-purple-400 font-mono font-semibold">{mins} min</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-2">
                  Aún no completaste pomodoros hoy.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Historial de Sesiones Recientes
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-4">Fecha & Hora</th>
                <th className="py-2.5 px-4">Proyecto</th>
                <th className="py-2.5 px-4">Etiqueta</th>
                <th className="py-2.5 px-4 text-center">Duración</th>
                <th className="py-2.5 px-4 text-center">Interrupciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {sessions.length > 0 ? (
                sessions.map((s) => {
                  const sDate = new Date(s.start_time).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{sDate}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-200">{s.project_name}</td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {s.tag ? (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono">
                            #{s.tag}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-white font-semibold">
                        {s.duration_minutes} min
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-slate-400">
                        {s.interruptions}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No hay sesiones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
