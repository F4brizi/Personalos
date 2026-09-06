# 📋 Plan de Implementación — Personal OS

Plan de desarrollo modular estructurado por fases y sesiones de Git, sincronizado con el [PRD.md](./PRD.md).

---

## 🎯 Visión General
Construir un centro de control personal y agregador de datos modular (Personal Operating System) desplegado en Docker, con backend en FastAPI, base de datos PostgreSQL, interfaz Web para escritorio y experiencia ligera optimizada para dispositivos móviles (*Quick Capture*).

---

## 🌿 Hoja de Ruta de Ramas y Sesiones

| Sesión / Rama | Objetivo Principal | Estado | Entregable Clave |
| :--- | :--- | :---: | :--- |
| `session/01-prd-y-plan` | Definición de PRD, arquitectura y plan de trabajo | 🟢 Completado | `PRD.md`, `PLAN.md`, estructura Git |
| `session/02-docker-api-core` | Infraestructura Docker + Core FastAPI + Postgres | 🟢 Completado | `docker-compose.yml`, FastAPI base, Redis, DB Models |
| `session/03-modulo-pomodoro` | Módulo nativo de Pomodoro / Enfoque | 🟡 En curso / Siguiente | Endpoints CRUD, métricas de productividad diarias |
| `session/04-finanzas-extractos` | Motor de Finanzas y Conciliación Bancaria | ⚪ Pendiente | Ingesta de CSV/Excel bancarios, asignación y conciliación |
| `session/05-frontend-web` | Frontend Web (Desktop & Tablet) | ⚪ Pendiente | Dashboard principal, gráficos Tremor/Recharts, mesa de conciliación |
| `session/06-frontend-mobile` | Experiencia Móvil (PWA / Quick Capture) | ⚪ Pendiente | Captura de gastos en 3 clics, temporizador de foco, timeline diario |
| `session/07-bot-telegram-quickcapture`| Bot complementario para celular | ⚪ Pendiente | Registro por chat / audio sin abrir la aplicación |
| `session/08-conectores-fitness` | Integración Fitness (Google Fit / Strava) | ⚪ Pendiente | Conector OAuth, ingesta de pasos y entrenamientos |
| `session/09-conectores-instagram` | Integración Instagram Insights | ⚪ Pendiente | Conector de métricas y guardados |
