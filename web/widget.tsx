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
                const year = targetObj.getFullYear();
                const month = String(targetObj.getMonth() + 1).padStart(2, '0');
                const day = String(targetObj.getDate()).padStart(2, '0');
                const targetDateStr = `${year}-${month}-${day}`;
                
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
