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
        <h1 className="text-xl font-semibold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
          <Timer className="w-5 h-5 text-zinc-400" />
          Módulo de Enfoque
        </h1>
        <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-widest">
          Sincronización de Sesiones & Deep Work
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timer Display */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-md p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Progress background bar */}
          <div
            className="absolute bottom-0 left-0 h-1 bg-zinc-300 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-sm border border-zinc-800 mb-8 font-mono uppercase tracking-wider">
            <button
              onClick={() => handleSelectPreset(25)}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-medium transition-colors ${
                targetMinutes === 25
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              25M POMODORO
            </button>
            <button
              onClick={() => handleSelectPreset(50)}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-medium transition-colors ${
                targetMinutes === 50
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              50M DEEP WORK
            </button>
            <button
              onClick={() => handleSelectPreset(5)}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-medium transition-colors ${
                targetMinutes === 5
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              5M PAUSA
            </button>
          </div>

          {/* Big Clock */}
          <div className="text-7xl sm:text-8xl font-mono tracking-tight text-zinc-100 my-4">
            {formatTime(secondsLeft)}
          </div>

          {/* Project & Tag selectors */}
          <div className="flex flex-wrap items-center justify-center gap-3 my-4">
            <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-sm border border-zinc-800 text-xs text-zinc-400">
              <Briefcase className="w-3 h-3" />
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer font-mono uppercase tracking-wider"
              >
                <option value="Personal OS" className="bg-zinc-900">Personal OS</option>
                <option value="Trabajo" className="bg-zinc-900">Trabajo</option>
                <option value="Estudio" className="bg-zinc-900">Estudio</option>
                <option value="Lectura" className="bg-zinc-900">Lectura</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-sm border border-zinc-800 text-xs text-zinc-400">
              <Tag className="w-3 h-3" />
              <input
                type="text"
                placeholder="TAG"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="bg-transparent text-zinc-200 focus:outline-none w-24 text-[10px] font-mono uppercase tracking-wider"
              />
            </div>

            <button
              onClick={() => setInterruptions((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs transition-colors text-zinc-500 hover:text-zinc-300"
              title="Registrar distracción o interrupción"
            >
              <span className="font-mono uppercase tracking-wider">INT:</span>
              <span className="font-bold font-mono text-zinc-300">{interruptions}</span>
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-mono text-xs uppercase tracking-widest font-bold transition-colors border ${
                isActive
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700'
                  : 'bg-zinc-100 hover:bg-white text-zinc-950 border-zinc-100'
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isActive ? 'PAUSAR' : 'INICIAR'}</span>
            </button>

            <button
              onClick={() => {
                setIsActive(false);
                setSecondsLeft(targetMinutes * 60);
              }}
              className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              disabled={isSaving}
              onClick={handleSaveSession}
              className="px-4 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-mono uppercase tracking-wider hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>GUARDAR</span>
            </button>
          </div>
        </div>

        {/* Today Summary & Project Breakdown */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-5">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-mono uppercase tracking-widest border-b border-zinc-800 pb-2">
              <Flame className="w-3.5 h-3.5 text-zinc-500" />
              <span>Resumen Productividad</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-3">
                <div className="text-2xl font-mono text-zinc-100">
                  {todayStats?.total_pomodoros || 0}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Bloques</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-3">
                <div className="text-2xl font-mono text-zinc-100">
                  {todayStats?.total_minutes || 0}<span className="text-xs text-zinc-500 ml-0.5">m</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Total</div>
              </div>
            </div>

            {/* Breakdown by project */}
            <div className="mt-6 space-y-2">
              <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                Distribución por Proyecto
              </div>
              {todayStats && Object.keys(todayStats.by_project).length > 0 ? (
                Object.entries(todayStats.by_project).map(([proj, mins]) => (
                  <div
                    key={proj}
                    className="flex items-center justify-between text-[11px] py-1.5 px-2 rounded-sm bg-zinc-950 border border-zinc-800 font-mono uppercase"
                  >
                    <span className="text-zinc-300 font-semibold">{proj}</span>
                    <span className="text-zinc-400">{mins} MIN</span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest text-center py-2">
                  SIN DATOS
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-md p-5">
        <h2 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2 font-mono uppercase tracking-wider border-b border-zinc-800 pb-2">
          <Clock className="w-4 h-4 text-zinc-500" />
          Historial de Sesiones
        </h2>
        <div className="overflow-x-auto rounded-sm border border-zinc-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 text-zinc-500 border-b border-zinc-800 font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-normal">Fecha & Hora</th>
                <th className="py-3 px-4 font-normal">Proyecto</th>
                <th className="py-3 px-4 font-normal">Etiqueta</th>
                <th className="py-3 px-4 text-center font-normal">Duración</th>
                <th className="py-3 px-4 text-center font-normal">Interrupciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900">
              {sessions.length > 0 ? (
                sessions.map((s) => {
                  const sDate = new Date(s.start_time).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <tr key={s.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-400 uppercase text-[11px]">{sDate}</td>
                      <td className="py-3 px-4 font-medium text-zinc-200 uppercase font-mono text-[11px]">{s.project_name}</td>
                      <td className="py-3 px-4 text-zinc-400">
                        {s.tag ? (
                          <span className="px-2 py-0.5 rounded-sm bg-zinc-950 text-zinc-400 border border-zinc-800 text-[10px] font-mono uppercase tracking-wider">
                            {s.tag}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-zinc-100 text-sm">
                        {s.duration_minutes}<span className="text-[10px] text-zinc-500 ml-1">MIN</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-zinc-400">
                        {s.interruptions}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500 font-mono uppercase text-xs tracking-widest">
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
