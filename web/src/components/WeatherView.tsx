import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, MapPin, Map, Sun } from 'lucide-react';
import { api } from '../lib/api';

interface WeatherLog {
  id: string;
  location_id: string;
  log_date: string;
  temperature_max: number;
  temperature_min: number;
  precipitation_probability: number;
  weather_condition: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  }
}

export const WeatherView: React.FC = () => {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/weather/logs`);
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  // Agrupar logs por location name
  const latestLogsByLocation = logs.reduce((acc, curr) => {
    if (!acc[curr.location.name]) {
      acc[curr.location.name] = curr;
    }
    return acc;
  }, {} as Record<string, WeatherLog>);

  if (loading) {
    return <div className="text-zinc-500 font-mono text-sm p-4">Sincronizando radares meteorológicos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-zinc-100" />
          <h2 className="font-mono text-lg font-bold tracking-widest uppercase text-zinc-100">Estado Meteorológico</h2>
        </div>
        <div className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-sm border border-emerald-500/20">
          ARQ WORKER: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(latestLogsByLocation).map((log) => (
          <div key={log.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-sm relative overflow-hidden group">
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
      
      {/* Botón para abrir LUSAT por si quieren ver el mapa entero */}
      <div className="mt-6 flex justify-end">
         <a href="http://localhost:8085" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-400 hover:text-emerald-400 transition-colors">
            <Map className="w-4 h-4" />
            Abrir radar completo en LUSAT
         </a>
      </div>
    </div>
  );
};
