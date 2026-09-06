import React, { useState, useEffect } from 'react';
import {
  Map,
  BarChart3,
  Building2,
  ExternalLink,
  Server,
  Activity,
  Cpu,
  Plus,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  Terminal,
  Globe,
  Receipt,
  Timer,
  X,
  DollarSign,
} from 'lucide-react';
import type { HealthStatus, TransactionSummary, PomodoroTodayStats } from '../lib/api';

export interface EcosystemApp {
  id: string;
  name: string;
  category: 'personal' | 'business' | 'data' | 'infra' | 'external';
  description: string;
  status: 'online' | 'development' | 'external' | 'planning';
  statusText: string;
  url?: string;
  internalTab?: 'dashboard' | 'reconciliation' | 'pomodoro';
  tags: string[];
  icon: string;
  gradient: string;
}

const DEFAULT_APPS: EcosystemApp[] = [
  {
    id: 'mp-reconciliation',
    name: 'Mesa de Conciliación MP',
    category: 'personal',
    description: 'Conciliación bancaria en 1 clic, categorización y carga de extractos de Mercado Pago.',
    status: 'online',
    statusText: 'Localhost:3000',
    internalTab: 'reconciliation',
    tags: ['Finanzas', 'Mercado Pago', 'FastAPI'],
    icon: 'Receipt',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'pomodoro-focus',
    name: 'Pomodoro & Deep Work',
    category: 'personal',
    description: 'Gestor de enfoque, bloques de productividad y registro de interrupciones sincronizado.',
    status: 'online',
    statusText: 'Localhost:3000',
    internalTab: 'pomodoro',
    tags: ['Productividad', 'Postgres', 'Focus'],
    icon: 'Timer',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'realtime-map',
    name: 'GeoLive Radar (Mapa Real-Time)',
    category: 'data',
    description: 'Visualización geoespacial en tiempo real de nodos, flota o ubicaciones con WebSockets.',
    status: 'development',
    statusText: 'En Desarrollo',
    url: 'http://localhost:3001',
    tags: ['GIS', 'Leaflet', 'WebSockets', 'Real-Time'],
    icon: 'Map',
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    id: 'datalab-analytics',
    name: 'DataLab & Business Intelligence',
    category: 'data',
    description: 'Pipelines de procesamiento masivo, análisis exploratorio con Polars y visualización BI.',
    status: 'development',
    statusText: 'En Desarrollo',
    url: 'http://localhost:8501',
    tags: ['Python', 'Polars', 'Dashboards', 'DuckDB'],
    icon: 'BarChart3',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'enterprise-os',
    name: 'Empresa OS / Business Suite',
    category: 'business',
    description: 'Sistema operativo corporativo: gestión de clientes, contratos, obras y facturación centralizada.',
    status: 'planning',
    statusText: 'En Planeación',
    url: '#',
    tags: ['CRM/ERP', 'Operaciones', 'Empresas'],
    icon: 'Building2',
    gradient: 'from-violet-500 to-purple-700',
  },
  {
    id: 'fastapi-backend',
    name: 'FastAPI Core API Gateway',
    category: 'infra',
    description: 'Documentación interactiva Swagger de la API Core en Docker con PostgreSQL y Redis.',
    status: 'online',
    statusText: 'Localhost:8000/docs',
    url: 'http://localhost:8000/docs',
    tags: ['Swagger', 'FastAPI', 'Python 3.12'],
    icon: 'Terminal',
    gradient: 'from-cyan-500 to-blue-700',
  },
  {
    id: 'docker-infrastructure',
    name: 'Docker Engine & Contenedores',
    category: 'infra',
    description: 'Gestión y estado de salud de contenedores (API, PostgreSQL 16, Redis 7, Web).',
    status: 'online',
    statusText: '4 Contenedores Up',
    url: '#docker-status',
    tags: ['Docker Compose', 'PostgreSQL', 'Redis'],
    icon: 'Server',
    gradient: 'from-blue-600 to-indigo-800',
  },
  {
    id: 'cloud-console',
    name: 'Servicios Cloud & Producción',
    category: 'external',
    description: 'Acceso directo a consolas cloud, bases de datos remotas y paneles de despliegue.',
    status: 'external',
    statusText: 'Servicio Externo',
    url: 'https://github.com',
    tags: ['Cloud', 'DevOps', 'Deploy'],
    icon: 'Globe',
    gradient: 'from-rose-500 to-pink-600',
  },
];

interface HubViewProps {
  health: HealthStatus | null;
  summary: TransactionSummary | null;
  pomodoroStats: PomodoroTodayStats | null;
  onNavigateTab: (tab: 'dashboard' | 'reconciliation' | 'pomodoro') => void;
}

export const HubView: React.FC<HubViewProps> = ({
  health,
  summary,
  pomodoroStats,
  onNavigateTab,
}) => {
  const [apps, setApps] = useState<EcosystemApp[]>(() => {
    const saved = localStorage.getItem('personal_os_ecosystem_apps');
    return saved ? JSON.parse(saved) : DEFAULT_APPS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);

  // Formulario nuevo servicio
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<'personal' | 'business' | 'data' | 'infra' | 'external'>('data');
  const [formUrl, setFormUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'online' | 'development' | 'external' | 'planning'>('development');
  const [formTags, setFormTags] = useState('');

  useEffect(() => {
    localStorage.setItem('personal_os_ecosystem_apps', JSON.stringify(apps));
  }, [apps]);

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const gradients = {
      personal: 'from-emerald-500 to-teal-600',
      business: 'from-violet-500 to-purple-700',
      data: 'from-sky-500 to-blue-600',
      infra: 'from-cyan-500 to-indigo-700',
      external: 'from-rose-500 to-pink-600',
    };

    const newApp: EcosystemApp = {
      id: `custom-${Date.now()}`,
      name: formName,
      category: formCategory,
      description: formDesc || 'Servicio registrado en la suite de Personal OS.',
      status: formStatus,
      statusText: formStatus === 'online' ? 'Online' : formStatus === 'development' ? 'En Desarrollo' : formStatus === 'external' ? 'Externo' : 'En Planeación',
      url: formUrl || '#',
      tags: formTags ? formTags.split(',').map((t) => t.trim()) : ['Custom'],
      icon: formCategory === 'data' ? 'BarChart3' : formCategory === 'infra' ? 'Server' : formCategory === 'business' ? 'Building2' : 'Globe',
      gradient: gradients[formCategory] || 'from-indigo-500 to-purple-600',
    };

    setApps([newApp, ...apps]);
    setIsNewAppModalOpen(false);
    setFormName('');
    setFormDesc('');
    setFormUrl('');
    setFormTags('');
  };

  const filteredApps = apps.filter((app) => {
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const onlineCount = apps.filter((a) => a.status === 'online').length;
  const devCount = apps.filter((a) => a.status === 'development').length;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Map':
        return <Map className="w-5 h-5 text-white" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5 text-white" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-white" />;
      case 'Server':
        return <Server className="w-5 h-5 text-white" />;
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-white" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-white" />;
      case 'Receipt':
        return <Receipt className="w-5 h-5 text-white" />;
      case 'Timer':
        return <Timer className="w-5 h-5 text-white" />;
      default:
        return <Layers className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header & Global Infrastructure Metrics */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Activity className="w-4 h-4" />
              <span>Infraestructura & Hub Central</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Command Center
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mt-1.5 leading-relaxed">
              Navega y gestiona tus aplicaciones, módulos en desarrollo, pipelines de datos, mapas en tiempo real y servicios externos desde un único panel centralizado.
            </p>
          </div>

          {/* Quick Global Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-bold font-mono text-white">{apps.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Servicios</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-bold font-mono text-emerald-400">{onlineCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Online</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-bold font-mono text-sky-400">{devCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">En Build</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-bold font-mono text-purple-400">
                {pomodoroStats?.total_minutes || 0}m
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Foco Hoy</div>
            </div>
          </div>
        </div>

        {/* Realtime Status Pill Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              {health?.status === 'healthy'
                ? `DB (${health.services.database.latency_ms}ms) & Redis (${health.services.redis.latency_ms}ms)`
                : 'Servicios Docker'}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px]">
              <Cpu className="w-3.5 h-3.5" />
              Docker Network: Bridge activo
            </span>
            {summary && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[11px]">
                <DollarSign className="w-3.5 h-3.5" />
                {summary.pending_reconciliation_count} movimientos MP por conciliar
              </span>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('dashboard')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 group cursor-pointer"
          >
            <span>Ver dashboard personal completo</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Toolbar: Category Filter & Search & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'personal', label: 'Personal OS' },
            { id: 'data', label: 'Datos & Mapas' },
            { id: 'business', label: 'Empresa' },
            { id: 'infra', label: 'Infraestructura' },
            { id: 'external', label: 'Externos' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & New App Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar app o servicio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64 transition-all"
            />
          </div>

          <button
            onClick={() => setIsNewAppModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar App / URL</span>
          </button>
        </div>
      </div>

      {/* App & Services Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredApps.map((app) => {
          const isInternal = Boolean(app.internalTab);
          const isExternal = Boolean(app.url && app.url !== '#');

          const handleLaunch = () => {
            if (app.internalTab) {
              onNavigateTab(app.internalTab);
            } else if (app.url && app.url !== '#') {
              window.open(app.url, '_blank', 'noopener,noreferrer');
            }
          };

          return (
            <div
              key={app.id}
              onClick={handleLaunch}
              className="group bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer relative overflow-hidden"
            >
              {/* Subtle top glow on hover */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Header: Icon + Status badge */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div
                    className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${app.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}
                  >
                    {renderIcon(app.icon)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border font-mono ${
                        app.status === 'online'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : app.status === 'development'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : app.status === 'external'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          app.status === 'online'
                            ? 'bg-emerald-400 animate-pulse'
                            : app.status === 'development'
                            ? 'bg-sky-400'
                            : app.status === 'external'
                            ? 'bg-rose-400'
                            : 'bg-slate-400'
                        }`}
                      />
                      {app.statusText}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>{app.name}</span>
                  {isExternal ? (
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  )}
                </h3>

                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {app.description}
                </p>
              </div>

              {/* Footer: Tags & Category */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                <div className="flex flex-wrap gap-1">
                  {app.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800/80 font-mono"
                    >
                      {t}
                    </span>
                  ))}
                  {app.tags.length > 2 && (
                    <span className="px-1 py-0.5 text-slate-500 font-mono">
                      +{app.tags.length - 2}
                    </span>
                  )}
                </div>

                <span className="text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  {isInternal ? 'Abrir Módulo →' : isExternal ? 'Abrir Link ↗' : 'Detalles →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Registrar Nuevo Servicio */}
      {isNewAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Registrar Nuevo Servicio o Aplicación
              </h2>
              <button
                onClick={() => setIsNewAppModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Agrega una aplicación independiente, un microservicio local (ej. mapa en tiempo real, herramienta de datos) o una URL externa para tenerla siempre a mano.
            </p>

            <form onSubmit={handleAddApp} className="space-y-3.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nombre del Servicio / App</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Mapa Flota GPS, Notebook de Ventas, Grafana"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Descripción Breve</label>
                <input
                  type="text"
                  placeholder="¿Para qué sirve o qué información muestra?"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="data">Datos & Mapas</option>
                    <option value="business">Empresa</option>
                    <option value="personal">Personal OS</option>
                    <option value="infra">Infraestructura</option>
                    <option value="external">Servicio Externo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Estado</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="development">En Desarrollo</option>
                    <option value="online">Online / Activo</option>
                    <option value="external">Servicio Externo</option>
                    <option value="planning">En Planeación</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">URL o Puerto (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej. http://localhost:3001 o https://mi-app.com"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  placeholder="ej. WebSockets, Python, Cloud, GPS"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewAppModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                >
                  Guardar en el Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
