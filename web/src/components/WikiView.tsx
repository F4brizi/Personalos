import React, { useState } from 'react';
import { Book, Server, Database, Cuboid, Map as MapIcon, GitMerge, CheckCircle2, Clock } from 'lucide-react';

export const WikiView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'modules' | 'workflow' | 'roadmap'>('architecture');

  const tabs = [
    { id: 'architecture', label: 'Arquitectura Base', icon: <Server className="w-4 h-4" /> },
    { id: 'schema', label: 'Esquema de Datos', icon: <Database className="w-4 h-4" /> },
    { id: 'modules', label: 'Módulos Activos', icon: <Cuboid className="w-4 h-4" /> },
    { id: 'workflow', label: 'Mapa Mental (Flujos)', icon: <GitMerge className="w-4 h-4" /> },
    { id: 'roadmap', label: 'Roadmap & Tareas', icon: <MapIcon className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <Book className="w-5 h-5 text-zinc-100" />
          <h2 className="font-mono text-sm font-bold tracking-widest uppercase text-zinc-100">Wiki del Sistema</h2>
        </div>
        <div className="p-2 flex-1 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono uppercase tracking-wider transition-colors ${
                activeTab === tab.id 
                  ? 'bg-zinc-800 text-zinc-100 border-l-2 border-zinc-400' 
                  : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 border-l-2 border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-zinc-950 text-zinc-300">
        
        {/* ARQUITECTURA */}
        {activeTab === 'architecture' && (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold font-mono text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-4">Arquitectura del Ecosistema</h1>
            
            <p className="text-sm leading-relaxed">
              El Personal OS est&aacute; construido sobre una arquitectura de microservicios contenerizada con Docker. 
              Sigue el principio de <strong>desacoplamiento total</strong>, donde el frontend, el backend y los bots operan de manera independiente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-sm">
                <div className="font-bold text-emerald-400 font-mono text-sm mb-2">Frontend (Web)</div>
                <ul className="text-xs space-y-2 list-disc list-inside text-zinc-400">
                  <li><strong>Stack:</strong> React 18, Vite, TypeScript, TailwindCSS</li>
                  <li><strong>Dise&ntilde;o:</strong> Tactical Engineering & Sober Sci-Fi</li>
                  <li><strong>Estado:</strong> React State, Fetch API</li>
                  <li><strong>Puertos:</strong> Expuesto en :3000 (HMR polling activo)</li>
                </ul>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-sm">
                <div className="font-bold text-blue-400 font-mono text-sm mb-2">Backend (Core API)</div>
                <ul className="text-xs space-y-2 list-disc list-inside text-zinc-400">
                  <li><strong>Stack:</strong> FastAPI (Python 3.12), SQLAlchemy Async</li>
                  <li><strong>Patr&oacute;n:</strong> RESTful API v1</li>
                  <li><strong>Concurrencia:</strong> Operaciones I/O no bloqueantes (async/await)</li>
                  <li><strong>Puertos:</strong> Expuesto en :8000</li>
                </ul>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-sm">
                <div className="font-bold text-indigo-400 font-mono text-sm mb-2">Capa de Datos</div>
                <ul className="text-xs space-y-2 list-disc list-inside text-zinc-400">
                  <li><strong>Base Principal:</strong> PostgreSQL 16 (Almacenamiento persistente)</li>
                  <li><strong>Cach&eacute; & Colas:</strong> Redis 7 (Para Background Tasks y rate limiting)</li>
                  <li><strong>Explorador:</strong> PGWeb montado en el puerto :8081</li>
                </ul>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-sm">
                <div className="font-bold text-amber-400 font-mono text-sm mb-2">Ingesta M&oacute;vil (Bot)</div>
                <ul className="text-xs space-y-2 list-disc list-inside text-zinc-400">
                  <li><strong>Stack:</strong> Python-Telegram-Bot (v21+)</li>
                  <li><strong>Flujo:</strong> Long-polling (seguro, no requiere webhook p&uacute;blico)</li>
                  <li><strong>Seguridad:</strong> Bloqueado por TELEGRAM_ALLOWED_USER_ID</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ESQUEMA DE DATOS */}
        {activeTab === 'schema' && (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold font-mono text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-4">Modelos de Base de Datos</h1>
            
            <div className="space-y-8 mt-6">
              {/* Table: Transactions */}
              <div>
                <h3 className="text-sm font-bold font-mono text-zinc-200 uppercase mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" /> transactions
                </h3>
                <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-950 text-zinc-500 border-b border-zinc-800">
                      <tr><th className="p-3">Columna</th><th className="p-3">Tipo</th><th className="p-3">Descripción</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                      <tr><td className="p-3 font-bold">id</td><td className="p-3">UUID (PK)</td><td className="p-3">Identificador único</td></tr>
                      <tr><td className="p-3 font-bold">date</td><td className="p-3">DateTime</td><td className="p-3">Fecha del gasto/ingreso</td></tr>
                      <tr><td className="p-3 font-bold">amount</td><td className="p-3">Float</td><td className="p-3">Negativo=Gasto, Positivo=Ingreso</td></tr>
                      <tr><td className="p-3 font-bold">category</td><td className="p-3">String</td><td className="p-3">Ej: Almuerzo, Suscripción</td></tr>
                      <tr><td className="p-3 font-bold">is_reconciled</td><td className="p-3">Boolean</td><td className="p-3">Verificado vs Banco</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table: AI Usage */}
              <div>
                <h3 className="text-sm font-bold font-mono text-zinc-200 uppercase mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" /> ai_usage_logs
                </h3>
                <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-950 text-zinc-500 border-b border-zinc-800">
                      <tr><th className="p-3">Columna</th><th className="p-3">Tipo</th><th className="p-3">Descripción</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                      <tr><td className="p-3 font-bold">account_name</td><td className="p-3">String</td><td className="p-3">gemini_advanced, openai_work</td></tr>
                      <tr><td className="p-3 font-bold">model_name</td><td className="p-3">String</td><td className="p-3">Ej: gemini-1.5-pro</td></tr>
                      <tr><td className="p-3 font-bold">prompt_tokens</td><td className="p-3">Integer</td><td className="p-3">Volumen de lectura</td></tr>
                      <tr><td className="p-3 font-bold">cost_usd</td><td className="p-3">Float</td><td className="p-3">Costo calculado por request</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* WORKFLOW / MAPA MENTAL */}
        {activeTab === 'workflow' && (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold font-mono text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-4">Mapa de Flujos (Workflows)</h1>
            
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm font-mono text-xs text-zinc-300 leading-loose">
              <pre className="whitespace-pre-wrap">
{`[ USUARIO ]
    │
    ├── (Vía Teléfono) ──> [ TELEGRAM BOT ] 
    │                           │ (Interpreta texto)
    │                           ▼
    │                      [ FAST API ] ──> Guarda en [ POSTGRES DB ]
    │
    ├── (Vía Terminal) ──> [ ANTIGRAVITY AGENT ]
    │                           │ (Ejecuta código/CLI)
    │                           ├──> Usa API de Gemini
    │                           └──> [ Hook .agents/log_tokens.py ]
    │                                     │
    │                                     ▼
    │                                [ FAST API ] ──> Guarda en [ POSTGRES DB ]
    │
    └── (Vía Web) ───────> [ REACT FRONTEND ]
                                │ (Peticiones HTTP/Fetch)
                                ▼
                           [ FAST API ] <── Lee de ── [ POSTGRES DB ]
                                │
                                └──> (Futuro) [ ARQ/CELERY WORKER ]
                                          (Procesos asíncronos en 2do plano)
`}
              </pre>
            </div>
          </div>
        )}

        {/* ROADMAP */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold font-mono text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-4">Hoja de Ruta (Roadmap)</h1>
            
            <div className="space-y-3 mt-6">
              
              <div className="flex items-start gap-3 p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-400 uppercase font-mono">Fase 1: Fundaciones</h4>
                  <p className="text-xs text-zinc-400 mt-1">Dockerización, FastAPI, BD Postgres, Interfaz Tactical UI. Módulo de Finanzas y Módulo Pomodoro creados.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-400 uppercase font-mono">Fase 2: Ingreso de Datos y Telemetría</h4>
                  <p className="text-xs text-zinc-400 mt-1">Bot de Telegram funcional. Hook de Antigravity (IA) leyendo tokens consumidos automáticamente.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-sm">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-400 uppercase font-mono">Fase 3: Procesos Asíncronos (En Cola)</h4>
                  <p className="text-xs text-zinc-400 mt-1">Integración de Celery o ARQ. Creación de Cron Jobs diarios (ej: resúmenes matutinos) y alertas financieras.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-sm">
                <Clock className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-zinc-300 uppercase font-mono">Fase 4: Agentes Nativos (MCP)</h4>
                  <p className="text-xs text-zinc-500 mt-1">Habilitar Model Context Protocol en FastAPI para que agentes externos puedan leer/modificar las tablas de forma segura y razonar sobre la data del usuario.</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MÓDULOS */}
        {activeTab === 'modules' && (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold font-mono text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-4">Módulos Desarrollados</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm border-l-4 border-l-emerald-500">
                <h3 className="font-bold text-sm text-zinc-100 uppercase font-mono">AI Intelligence Lab</h3>
                <p className="text-xs text-zinc-400 mt-2">Dashboard de consumo y costos de LLMs. Cuotas por proveedor y registro automático vía CLI.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm border-l-4 border-l-blue-500">
                <h3 className="font-bold text-sm text-zinc-100 uppercase font-mono">Control Financiero</h3>
                <p className="text-xs text-zinc-400 mt-2">Conciliación de gastos e ingresos. Parseo de archivos de Mercado Pago y captura rápida por Telegram.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm border-l-4 border-l-amber-500">
                <h3 className="font-bold text-sm text-zinc-100 uppercase font-mono">Focus / Pomodoro</h3>
                <p className="text-xs text-zinc-400 mt-2">Temporizador de concentración con registro histórico de sesiones y etiquetado de proyectos.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm border-l-4 border-l-purple-500">
                <h3 className="font-bold text-sm text-zinc-100 uppercase font-mono">Data Studio (PGWeb)</h3>
                <p className="text-xs text-zinc-400 mt-2">Explorador de base de datos Postgres incorporado directamente en la infraestructura Docker (Puerto 8081).</p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
