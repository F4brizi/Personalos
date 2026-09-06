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
4. [Registro Acumulativo de Decisiones de Arquitectura](#4-registro-acumulativo-de-decisiones-de-arquitectura)
5. [Estado Actual del Proyecto y Próximos Pasos](#5-estado-actual-del-proyecto-y-próximos-pasos)

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

## 4. Registro Acumulativo de Decisiones de Arquitectura

| ID | Fecha | Tema | Decisión | Motivo / Justificación |
| :--- | :---: | :--- | :--- | :--- |
| **ADR-01** | 05/09/2026 | Control de Versiones | Ramas dedicadas por sesión (`session/...`) | Permite trabajar en paralelo, probar cambios y aislar avances antes de mergear a `main`. |
| **ADR-02** | 05/09/2026 | Backend | FastAPI + Python 3.12 | Máxima compatibilidad con parsers de datos (Pandas), librerías de IA y rendimiento asíncrono. |
| **ADR-03** | 05/09/2026 | Base de Datos | PostgreSQL 16 + Redis | PostgreSQL ofrece consistencia relacional y campos `JSONB` flexibles para integraciones. Redis actúa como broker de tareas y caché. |
| **ADR-04** | 05/09/2026 | Billetera Inicial | Mercado Pago | Formato estandarizado de exportación (CSV/Excel) y alta frecuencia de uso diario en Argentina. |
| **ADR-05** | 05/09/2026 | Canal Móvil | Telegram Bot + Web PWA | El bot permite captura en 2 segundos por texto/audio sin la fricción de abrir un navegador en la calle. |

---

## 5. Estado Actual del Proyecto y Próximos Pasos

### Estado de los Servicios:
- 🟢 **API Core:** Activa en `http://localhost:8000` (Documentación Swagger en `/docs`).
- 🟢 **PostgreSQL:** Activo en puerto `5432`.
- 🟢 **Redis:** Activo en puerto `6379`.

### Próximas Opciones a Ejecutar:
- [ ] **Opción 1:** Construcción del Frontend Web (Dashboard en Next.js / Vite + React + Tailwind + shadcn/ui).
- [ ] **Opción 2:** Conexión y prueba en vivo del Bot de Telegram mediante token de `@BotFather`.
- [ ] **Opción 3:** Prueba de ingesta de un extracto real de Mercado Pago vía endpoint `/upload-mercadopago`.

*(Este documento continuará actualizándose periódicamente con los nuevos hitos y decisiones).*
