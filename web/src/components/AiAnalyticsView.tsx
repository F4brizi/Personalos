import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { AiUsageStats, AiQuota } from '../lib/api';
import { 
  Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BrainCircuit, Target, CalendarDays, RefreshCw } from 'lucide-react';

export const AiAnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<AiUsageStats | null>(null);
  const [quotas, setQuotas] = useState<AiQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, qData] = await Promise.all([
        api.getAiStats(days),
        api.getAiQuotas()
      ]);
      setStats(sData);
      setQuotas(qData);
    } catch (err) {
      console.error("Error loading AI analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [days]);

  // Preparar datos para Recharts
  const pieData = stats ? Object.entries(stats.by_model).map(([name, value]) => ({
    name: name.replace('claude-', 'c-').replace('gpt-', 'g-'),
    value
  })) : [];
  
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6 text-zinc-100" />
          <h1 className="text-xl font-bold font-mono uppercase tracking-widest text-zinc-100">AI Intelligence Lab</h1>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-800 rounded-sm px-3 py-1.5 text-xs font-mono uppercase text-zinc-300 focus:outline-none focus:border-zinc-600"
          >
            <option value={7}>ÚLTIMOS 7 DÍAS</option>
            <option value={30}>ÚLTIMOS 30 DÍAS</option>
            <option value={90}>ÚLTIMOS 90 DÍAS</option>
          </select>
          <button onClick={loadData} className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 rounded-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-md">
          <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Gasto Total ({days}D)</div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">${stats?.total_cost_usd?.toFixed(3) || '0.000'}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-md">
          <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Tokens Procesados</div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            {stats ? ((stats.total_prompt_tokens + stats.total_completion_tokens) / 1000).toFixed(1) : 0}k
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-md">
          <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Input / Output Ratio</div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            {stats && stats.total_completion_tokens > 0 
              ? (stats.total_prompt_tokens / stats.total_completion_tokens).toFixed(1) 
              : 0}x
          </div>
          <div className="text-[9px] text-zinc-600 font-mono uppercase">Lectura vs Escritura</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-md">
          <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Total Peticiones</div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">{stats?.total_requests || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* QUOTAS & LIMITS */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Target className="w-4 h-4" /> Límites y Cuotas del Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotas.map(quota => {
              const overLimit = quota.percent_used >= 100;
              const nearLimit = quota.percent_used >= 80;
              const barColor = overLimit ? 'bg-red-500' : nearLimit ? 'bg-amber-500' : 'bg-green-500';
              
              return (
                <div key={quota.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-md flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-zinc-100 uppercase">{quota.provider}</span>
                      <span className="text-[9px] font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400">
                        {quota.account_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-zinc-100">${quota.current_usage_usd.toFixed(2)} / ${quota.limit_usd}</div>
                      <div className="text-[9px] font-mono text-zinc-500">CONSUMIDO</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-950 h-3 rounded-sm overflow-hidden border border-zinc-800 mb-3 relative">
                    <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(quota.percent_used, 100)}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold font-mono text-white drop-shadow-md">
                      {quota.percent_used.toFixed(1)}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3" /> 
                      Resetea en {quota.days_until_reset} días
                    </div>
                    <div>Día {quota.reset_day_of_month} del mes</div>
                  </div>
                </div>
              );
            })}
            
            {quotas.length === 0 && (
              <div className="col-span-2 text-center py-8 text-zinc-600 font-mono text-xs uppercase border border-dashed border-zinc-800 rounded-md">
                No hay cuotas registradas
              </div>
            )}
          </div>
        </div>

        {/* DISTRIBUCIÓN DE MODELOS */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <PieChart className="w-4 h-4" /> Uso por Modelo (Peticiones)
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-md h-[250px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#f4f4f5' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-zinc-600 font-mono text-xs uppercase">Sin Datos</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
