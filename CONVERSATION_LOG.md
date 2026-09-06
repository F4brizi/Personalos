# 📝 Bitácora de Conversación & Decisiones — Personal OS

**Archivo:** `CONVERSATION_LOG.md`  
**Proyecto:** Personal OS  
**Participantes:** F4brizi (Usuario) & Antigravity (Asistente de IA)  
**Inicio:** 05/09/2026 - 21:21 (Hora local)  
**Última actualización:** 06/09/2026 - 00:16 (Hora local)  

---

## 📌 Índice de Sesiones

1. [Consulta Inicial: Múltiples Sesiones y Misma API](#1-consulta-inicial-múltiples-sesiones-y-misma-api)
2. [Sesión 01: Creación del Repositorio, Estrategia de Ramas y PRD](#2-sesión-01-creación-del-repositorio-estrategia-de-ramas-y-prd)
3. [Sesión 02: Infraestructura Docker y Backend Core (FastAPI, Postgres, Redis)](#3-sesión-02-infraestructura-docker-y-backend-core)
4. [Sesión 03: Desarrollo del Frontend Web (React 19, Tailwind CSS, Conciliación y Dashboard)](#4-sesión-03-desarrollo-del-frontend-web)
5. [Registro Acumulativo de Decisiones de Arquitectura](#5-registro-acumulativo-de-decisiones-de-arquitectura)
6. [Estado Actual del Proyecto y Próximos Pasos](#6-estado-actual-del-proyecto-y-próximos-pasos)

---

## 1. Consulta Inicial: Múltiples Sesiones y Misma API
- **Pregunta:** ¿Es posible tener varias sesiones abiertas utilizando la misma API conectada?
- **Resolución:**
  - Sí, totalmente viable. Cada sesión mantiene su propio contexto e historial aislado.
  - Se comparten las cuotas de tasa del proveedor (RPM, TPM y balance de facturación/tokens).
  - Permite abrir múltiples terminales, agentes o entornos en paralelo sin colisiones de memoria.

---

## 2. Sesión 01: Creación del Repositorio, Estrategia de Ramas y PRD
- **Rama Git:** `session/01-prd-y-plan` (consolidada en `main`).
- **Acciones Realizadas:**
  1. Creación de carpeta de proyecto en `C:\Users\Principal\Documents\personal-os`.
  2. Inicialización del repositorio Git con rama base `main`.
  3. Establecimiento de la convención de ramas por sesión (`session/<id>-<descripcion>`).
  4. Redacción del **Product Requirements Document** ([`PRD.md`](./PRD.md)) y hoja de ruta ([`PLAN.md`](./PLAN.md)).
- **Definiciones Clave del PRD:**
  - **Diferenciación de Clientes:**
    - **Web (Desktop/Tablet):** Dashboards profundos, gráficos anuales/mensuales, mesa de conciliación bancaria interactiva a dos columnas y configuración.
    - **Móvil (Celular):** *Quick capture* en 3 clics, temporizador de pomodoro en pantalla y timeline diario.
  - **Integraciones:**
    - Modelo modular (`IConnector`).
    - Finanzas personales (billetera única inicial: **Mercado Pago**).
    - Enfoque y productividad (módulo nativo de **Pomodoros**).
    - Salud y Fitness (Google Fit / Strava) e Instagram Insights (fases posteriores).
    - Adición de un **Bot de Telegram** como interfaz complementaria ultrarrápida para registrar gastos y notas desde el móvil.

---

## 3. Sesión 02: Infraestructura Docker y Backend Core
- **Rama Git:** `session/02-docker-api-core` (consolidada en `main`).
- **Acciones Realizadas:**
  1. Configuración de entorno con `.env.example` y `.env` para desarrollo local.
  2. Creación del orquestador `docker-compose.yml` con servicios:
     - `personal_os_db`: PostgreSQL 16 Alpine con `healthcheck` y volumen persistente.
     - `personal_os_redis`: Redis 7 Alpine con `healthcheck` y persistencia.
     - `personal_os_api`: Contenedor FastAPI (Python 3.12) con recarga en vivo (`--reload`).
     - `personal_os_bot`: Microservicio del Bot de Telegram (perfil opcional `bot`).
  3. Desarrollo del código base de la API:
     - `app/core/config.py`: Gestión de configuración con Pydantic Settings.
     - `app/core/database.py`: Motor asíncrono con SQLAlchemy 2.0 y sesión asíncrona.
     - `app/core/redis.py`: Cliente de Redis asíncrono con connection pool.
     - Modelos de datos:
       - `Transaction`: UUID, external_id único, montos, categorías, métodos de pago, conciliación booleana y JSONB para payloads crudos.
       - `PomodoroSession`: UUID, tiempos de inicio y fin, duración, proyecto, tag, completado, interrupciones.
     - Servicios:
       - `mercadopago_parser.py`: Ingesta y normalización automática de extractos bancarios CSV y Excel de Mercado Pago con auto-categorización por palabras clave.
     - Routers de endpoints v1:
       - `/api/v1/health`: Verificación de estado y latencia de PostgreSQL y Redis.
       - `/api/v1/transactions`: CRUD, filtros, conciliación por `PATCH`, resumen financiero agregado (`/summary`) y endpoint de subida de archivos de Mercado Pago (`/upload-mercadopago`).
       - `/api/v1/pomodoro`: Registro de sesiones y métricas de enfoque del día (`/stats/today`).
  4. Pruebas y validación end-to-end:
     - Contenedores levantados exitosamente vía `docker compose up -d --build`.
     - `GET /api/v1/health` validó estado *healthy* para DB y Redis.
     - Se testeó la inserción de transacciones, cálculo de métricas financieras, conciliación en tiempo real y estadísticas de pomodoros.

---

## 4. Sesión 03: Desarrollo del Frontend Web
- **Rama Git:** `session/03-frontend-web` (consolidada en `main`).
- **Acciones Realizadas:**
  1. Selección e implementación de stack web rápido: **React 19 + Vite + TypeScript + Tailwind CSS + Lucide Icons**.
  2. Creación del cliente API tipado (`web/src/lib/api.ts`) para sincronización bidireccional con FastAPI.
  3. Desarrollo de componentes modulares y diseño UI Dark Modern:
     - **`Navbar`**: Navegación por pestañas (Dashboard, Conciliación, Enfoque), badge de transacciones pendientes e indicador en vivo de salud de Docker (PostgreSQL y Redis).
     - **`DashboardView`**:
       - Resumen diario y fecha en español.
       - 4 tarjetas KPI en tiempo real: Gastos Registrados, Ingresos Totales, Balance Neto y Enfoque de Hoy.
       - Widget de Foco en vivo: temporizador regresivo de 25m, selector de proyecto y guardado automático con la API.
       - Desglose visual de gastos por categoría con barras de progreso relativas.
     - **`ReconciliationTable` (Mesa de Conciliación Bancaria)**:
       - Filtros rápidos por estado (Pendientes, Conciliados, Todos), búsqueda textual y selector de categorías.
       - Acciones en línea: cambio de categoría instantáneo mediante desplegable y botón de un solo clic para conciliar (`[✓ Conciliar]`) o desmarcar (`[↩]`).
       - Modal drag-and-drop para cargar extractos `.csv` o `.xlsx` de Mercado Pago con informe de duplicados omitidos y filas procesadas.
       - Modal para registrar nuevos gastos o ingresos manuales.
     - **`PomodoroView`**:
       - Temporizador grande de enfoque con presets (25m Pomodoro, 50m Deep Work, 5m Pausa).
       - Selector de proyecto, etiqueta (#tag) y contador interactivo de interrupciones.
       - Tabla histórica de sesiones con detalle de fecha, proyecto y duración.
  4. Contenerización en Docker:
     - Adición del servicio `web` en `docker-compose.yml` expuesto en `http://localhost:3000`.
     - Configuración de proxy inverso interno de Vite hacia `http://api:8000` para evitar bloqueos de red en contenedores.
     - Validación exitosa de build (`npm run build` en 1.7s) y acceso verificado en `http://localhost:3000`.

---

## 5. Registro Acumulativo de Decisiones de Arquitectura

| ID | Fecha | Tema | Decisión | Motivo / Justificación |
| :--- | :---: | :--- | :--- | :--- |
| **ADR-01** | 05/09/2026 | Control de Versiones | Ramas dedicadas por sesión (`session/...`) | Permite trabajar en paralelo, probar cambios y aislar avances antes de mergear a `main`. |
| **ADR-02** | 05/09/2026 | Backend | FastAPI + Python 3.12 | Máxima compatibilidad con parsers de datos (Pandas), librerías de IA y rendimiento asíncrono. |
| **ADR-03** | 05/09/2026 | Base de Datos | PostgreSQL 16 + Redis | PostgreSQL ofrece consistencia relacional y campos `JSONB` flexibles para integraciones. Redis actúa como broker de tareas y caché. |
| **ADR-04** | 05/09/2026 | Billetera Inicial | Mercado Pago | Formato estandarizado de exportación (CSV/Excel) y alta frecuencia de uso diario en Argentina. |
| **ADR-05** | 05/09/2026 | Canal Móvil | Telegram Bot + Web PWA | El bot permite captura en 2 segundos por texto/audio sin la fricción de abrir un navegador en la calle. |
| **ADR-06** | 06/09/2026 | Frontend Web | Vite + React 19 + Tailwind v4 | Carga instantánea, consumo ligero de recursos en Docker y soporte nativo de componentes interactivos. |
| **ADR-07** | 06/09/2026 | Arquitectura Hub | Master Launcher & Service Directory | Unificar navegación para múltiples proyectos (Mapas, DataLab, OS Empresa, servicios externos) desde un panel con registro dinámico. |

---

## 6. Estado Actual del Proyecto y Próximos Pasos

### Estado de los Servicios Docker:
- 🟢 **Frontend Web & Hub:** Activo en [http://localhost:3000](http://localhost:3000).
- 🟢 **API Core:** Activa en [http://localhost:8000](http://localhost:8000) (Swagger en `/docs`).
- 🟢 **PostgreSQL 16:** Activo y conectado en puerto `5432`.
- 🟢 **Redis 7:** Activo en puerto `6379`.

---

## 7. Sesión 04: Command Center & Master Hub Launcher (06/09/2026)
- **Rama Git:** `session/04-master-hub-launcher` (consolidada en `main`).
- **Objetivo:** Crear un dashboard maestro que permita monitorear la infraestructura global y navegar hacia diversas aplicaciones independientes (mapas en tiempo real, análisis de datos, OS corporativo, servicios externos y módulos de Personal OS).
- **Entregables:**
  1. **Componente `HubView`:**
     - Encabezado con métricas de infraestructura (Total Servicios, Servicios Online, En Desarrollo, Minutos de Foco de hoy).
     - Barra de estado Docker en tiempo real (Latencias de DB, Redis y estado de red).
     - Selector de categorías: `Todos`, `Personal OS`, `Datos & Mapas`, `Empresa`, `Infraestructura`, `Externos`.
     - Buscador interactivo en vivo.
     - Grid de aplicaciones y servicios preconfigurados:
       - *Mesa de Conciliación MP* (Personal OS)
       - *Pomodoro & Deep Work* (Personal OS)
       - *GeoLive Radar* (Mapa Real-Time / GIS / WebSockets)
       - *DataLab & Business Intelligence* (Python / Polars / BI)
       - *Empresa OS / Business Suite* (CRM / ERP Corporativo)
       - *FastAPI Gateway* (Swagger API Docs)
       - *Docker Engine* (Contenedores y estado)
       - *Servicios Cloud* (Consolas externas)
     - Botón y modal *"Agregar App / URL"* que permite al usuario registrar cualquier nueva aplicación o microservicio, persistido en `localStorage`.
  2. **Actualización de Navegación (`Navbar` & `App`):**
     - `Hub Central` integrado como pestaña principal por defecto.
     - Navegación fluida hacia el Dashboard Ejecutivo, la Conciliación y el Temporizador.
  3. **Validación:**
     - Compilación limpia con `npm run build` en 2.48s.
     - Despliegue automático y verificado en `http://localhost:3000`.

