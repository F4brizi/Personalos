import React, { useState, useEffect, useMemo } from 'react';
import { Cloud, Droplets, MapPin, Map, Sun, Calendar, Link as LinkIcon, Database } from 'lucide-react';
import { api } from '../lib/api';
import type { WeatherLog } from '../lib/api';

export const WeatherView: React.FC = () => {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros Históricos
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await api.getWeatherLogs();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  // Agrupar logs por location name (Solo para las tarjetas superiores)
  const latestLogsByLocation = useMemo(() => {
    return logs.reduce((acc, curr) => {
      if (!acc[curr.location.name]) {
        acc[curr.location.name] = curr;
      }
      return acc;
    }, {} as Record<string, WeatherLog>);
  }, [logs]);

  // Obtener nombres de locaciones únicas para el filtro
  const uniqueLocations = useMemo(() => {
    const locs = new Set(logs.map(l => l.location.name));
    return Array.from(locs).sort();
  }, [logs]);

  // Filtrar logs para la tabla histórica
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedLocation !== 'all' && log.location.name !== selectedLocation) return false;
      if (startDate && log.log_date < startDate) return false;
      if (endDate && log.log_date > endDate) return false;
      return true;
    });
  }, [logs, selectedLocation, startDate, endDate]);

  if (loading) {
    return <div className="text-zinc-500 font-mono text-sm p-4">Sincronizando radares meteorológicos...</div>;
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-zinc-100" />
          <h2 className="font-mono text-lg font-bold tracking-widest uppercase text-zinc-100">Estado Meteorológico</h2>
        </div>
        <div className="flex gap-4 items-center">
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors">
            <LinkIcon className="w-3 h-3" />
            Powered by Open-Meteo API
          </a>
          <div className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-sm border border-emerald-500/20 flex items-center gap-2">
            <Database className="w-3 h-3" />
            ARQ WORKER: ONLINE
          </div>
        </div>
      </div>

      {/* RADARES ACTUALES (TARJETAS) */}
      <div className="space-y-3">
        <h3 className="font-mono text-sm text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Clima de Hoy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(latestLogsByLocation).map((log) => (
            <div key={`card-${log.id}`} className="bg-zinc-900 border border-zinc-800 p-5 rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sun className="w-16 h-16" />
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono text-sm font-bold text-zinc-100 uppercase tracking-wider">{log.location.name}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-zinc-500 font-mono uppercase">Temperatura Max</div>
                  <div className="text-2xl font-bold text-zinc-100">{log.temperature_max}°C</div>
                  <div className="text-xs text-zinc-500 font-mono">Min: {log.temperature_min}°C</div>
                </div>
                
                <div>
                  <div className="text-xs text-zinc-500 font-mono uppercase">Prob. Lluvia</div>
                  <div className="text-2xl font-bold text-blue-400 flex items-baseline gap-1">
                    {log.precipitation_probability}%
                  </div>
                  <div className="text-xs text-zinc-500 font-mono flex items-center gap-1 mt-1">
                    <Droplets className="w-3 h-3" /> Precipitación
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-400 uppercase bg-zinc-950 px-2 py-1 rounded-sm border border-zinc-800">
                  {log.weather_condition}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {log.log_date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* TABLA HISTÓRICA */}
      <div className="space-y-4 pt-6">
        <h3 className="font-mono text-sm text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Historial Climático por Zona
        </h3>
        
        {/* Controles de Filtro */}
        <div className="flex flex-wrap items-center gap-4 bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase">Ubicación</label>
            <select 
              value={selectedLocation} 
              onChange={e => setSelectedLocation(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">TODAS LAS ZONAS</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase">Desde</label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase">Hasta</label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          
          <div className="flex flex-col gap-1 ml-auto">
            <label className="text-[10px] font-mono text-zinc-500 uppercase opacity-0">Reset</label>
            <button 
              onClick={() => { setSelectedLocation('all'); setStartDate(''); setEndDate(''); }}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-100 bg-zinc-800 px-3 py-1.5 rounded-sm transition-colors border border-zinc-700 hover:border-zinc-500"
            >
              LIMPIAR FILTROS
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto border border-zinc-800 rounded-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800 font-mono">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">T. Max</th>
                <th className="px-4 py-3 text-right">T. Min</th>
                <th className="px-4 py-3 text-right">Lluvia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 font-mono text-xs">
                    No se encontraron registros para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-2 font-mono text-zinc-300 text-xs">{log.log_date}</td>
                    <td className="px-4 py-2 font-mono text-zinc-100 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      {log.location.name}
                    </td>
                    <td className="px-4 py-2 text-zinc-400 text-xs">
                      <span className="bg-zinc-800 px-2 py-0.5 rounded-sm font-mono">{log.weather_condition}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-300 text-xs">{log.temperature_max}°C</td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-500 text-xs">{log.temperature_min}°C</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">
                      <span className={log.precipitation_probability > 30 ? 'text-blue-400' : 'text-zinc-500'}>
                        {log.precipitation_probability}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Botón para LUSAT */}
      <div className="flex justify-end pt-4 border-t border-zinc-800">
         <a href="http://localhost:8085" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-400 hover:text-emerald-400 transition-colors">
            <Map className="w-4 h-4" />
            Abrir radar en LUSAT
         </a>
      </div>
    </div>
  );
};
