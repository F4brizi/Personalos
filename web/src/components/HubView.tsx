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
    gradient: 'from-zinc-800 to-zinc-700',
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
    gradient: 'from-zinc-800 to-zinc-700',
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
    gradient: 'from-zinc-800 to-zinc-700',
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
    gradient: 'from-zinc-800 to-zinc-700',
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
    gradient: 'from-zinc-800 to-zinc-700',
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
    gradient: 'from-zinc-800 to-zinc-700',
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
    gradient: 'from-zinc-800 to-zinc-700',
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
    gradient: 'from-zinc-800 to-zinc-700',
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
      gradient: 'from-zinc-800 to-zinc-700',
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
        return <Map className="w-5 h-5 text-zinc-100" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5 text-zinc-100" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-zinc-100" />;
      case 'Server':
        return <Server className="w-5 h-5 text-zinc-100" />;
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-zinc-100" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-zinc-100" />;
      case 'Receipt':
        return <Receipt className="w-5 h-5 text-zinc-100" />;
      case 'Timer':
        return <Timer className="w-5 h-5 text-zinc-100" />;
      default:
        return <Layers className="w-5 h-5 text-zinc-100" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header & Global Infrastructure Metrics */}
      <div className="relative overflow-hidden rounded-md bg-zinc-900 border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono uppercase tracking-widest mb-3">
              <Activity className="w-4 h-4" />
              <span>Infraestructura & Hub Central</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-100 tracking-tight uppercase">
              Command Center
            </h1>
            <p className="text-sm text-zinc-500 max-w-xl mt-2 leading-relaxed">
              Navega y gestiona tus aplicaciones, módulos en desarrollo, pipelines de datos, mapas en tiempo real y servicios externos desde un único panel centralizado.
            </p>
          </div>

          {/* Quick Global Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-3.5 text-center">
              <div className="text-xl font-bold font-mono text-zinc-100">{apps.length}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-mono">Servicios</div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-3.5 text-center">
              <div className="text-xl font-bold font-mono text-green-400">{onlineCount}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-mono">Online</div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-3.5 text-center">
              <div className="text-xl font-bold font-mono text-amber-400">{devCount}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-mono">En Build</div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-3.5 text-center">
              <div className="text-xl font-bold font-mono text-zinc-100">
                {pomodoroStats?.total_minutes || 0}<span className="text-xs text-zinc-500 ml-0.5">m</span>
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-mono">Foco Hoy</div>
            </div>
          </div>
        </div>

        {/* Realtime Status Pill Bar */}
        <div className="mt-8 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono uppercase tracking-wider">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border ${health?.status === 'healthy' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} text-[10px]`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {health?.status === 'healthy'
                ? `DB (${health.services.database.latency_ms}ms) & Redis (${health.services.redis.latency_ms}ms)`
                : 'Servicios Docker Offline'}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px]">
              <Cpu className="w-3.5 h-3.5" />
              Docker Network: Bridge activo
            </span>
            {summary && summary.pending_reconciliation_count > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                <DollarSign className="w-3.5 h-3.5" />
                {summary.pending_reconciliation_count} movimientos MP por conciliar
              </span>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('dashboard')}
            className="text-[10px] text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"
          >
            <span>Ver Dashboard Personal</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Toolbar: Category Filter & Search & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900 p-1 rounded-md border border-zinc-800 font-mono text-[11px] uppercase tracking-wider">
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
              className={`px-3.5 py-1.5 rounded-sm transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & New App Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="BUSCAR APP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-sm pl-8 pr-3 py-2 text-[11px] font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-48 sm:w-60 transition-colors uppercase tracking-wider"
            />
          </div>

          <button
            onClick={() => setIsNewAppModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 text-[11px] font-mono uppercase tracking-wider font-bold transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>AGREGAR APP</span>
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
              className="group bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-600 rounded-md p-5 flex flex-col justify-between transition-colors cursor-pointer relative"
            >
              <div>
                {/* Header: Icon + Status badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="h-10 w-10 rounded-sm bg-zinc-800 flex items-center justify-center border border-zinc-700">
                    {renderIcon(app.icon)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[9px] font-medium border font-mono uppercase tracking-widest ${
                        app.status === 'online'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : app.status === 'development'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : app.status === 'external'
                          ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          app.status === 'online'
                            ? 'bg-green-400'
                            : app.status === 'development'
                            ? 'bg-amber-400'
                            : app.status === 'external'
                            ? 'bg-zinc-400'
                            : 'bg-zinc-600'
                        }`}
                      />
                      {app.statusText}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors flex items-center justify-between uppercase tracking-wider">
                  <span>{app.name}</span>
                  {isExternal ? (
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  )}
                </h3>

                <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed font-sans">
                  {app.description}
                </p>
              </div>

              {/* Footer: Tags & Category */}
              <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                <div className="flex flex-wrap gap-1">
                  {app.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-800 rounded-sm"
                    >
                      {t}
                    </span>
                  ))}
                  {app.tags.length > 2 && (
                    <span className="px-1.5 py-0.5 text-zinc-600">
                      +{app.tags.length - 2}
                    </span>
                  )}
                </div>

                <span className="text-zinc-400 font-bold group-hover:text-zinc-100 transition-colors">
                  {isInternal ? 'ABRIR →' : isExternal ? 'LINK ↗' : 'INFO →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Registrar Nuevo Servicio */}
      {isNewAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Plus className="w-4 h-4 text-zinc-400" />
                Registrar Nuevo Servicio
              </h2>
              <button
                onClick={() => setIsNewAppModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 p-1 rounded-sm hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Agrega una aplicación independiente, un microservicio local o una URL externa al Hub Central.
            </p>

            <form onSubmit={handleAddApp} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Nombre de la App / Servicio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mapa Flota GPS, Grafana"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Descripción Breve</label>
                <input
                  type="text"
                  placeholder="¿Para qué sirve?"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono uppercase text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    <option value="data">DATOS & MAPAS</option>
                    <option value="business">EMPRESA</option>
                    <option value="personal">PERSONAL OS</option>
                    <option value="infra">INFRAESTRUCTURA</option>
                    <option value="external">EXTERNO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Estado</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs font-mono uppercase text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    <option value="development">EN DESARROLLO</option>
                    <option value="online">ONLINE / ACTIVO</option>
                    <option value="external">SERVICIO EXTERNO</option>
                    <option value="planning">EN PLANEACIÓN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">URL o Puerto (Opcional)</label>
                <input
                  type="text"
                  placeholder="http://localhost:3001"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Etiquetas (CSV)</label>
                <input
                  type="text"
                  placeholder="Python, Cloud, WebSockets"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono uppercase"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewAppModalOpen(false)}
                  className="px-4 py-2 bg-zinc-950 text-zinc-400 text-xs font-mono uppercase hover:text-zinc-200 border border-zinc-800"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-mono font-bold uppercase hover:bg-white flex items-center gap-2"
                >
                  REGISTRAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
