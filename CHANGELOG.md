# Changelog: Personal OS

Todas las actualizaciones y cambios notables de este proyecto serán documentados en este archivo.

## [2026-09-07] - Módulo Climático & Refactor del Hub

### Añadido (Added)
* **Backend (FastAPI)**: Endpoint `DELETE /locations/{id}` para eliminar zonas climáticas, con opción de retener o eliminar en cascada el historial de datos.
* **Worker (ARQ / Open-Meteo)**: Se expandió la petición a la API de Open-Meteo para solicitar 2 días de pronóstico (`forecast_days=2`), permitiendo almacenar el clima de mañana en la base de datos.
* **Worker (Lógica Histórica)**: Los registros climáticos pasados ahora almacenan los milímetros exactos de lluvia caídos (`precipitation_mm`), mientras que los días actuales y futuros mantienen el porcentaje de probabilidad (`precipitation_probability`).
* **Frontend (WeatherView)**: Función de exportación a CSV para descargar los datos históricos filtrados del módulo climático.

### Modificado (Changed)
* **Frontend (HubView)**: Se reemplazó el "Widget 6" estático (Radar Meteorológico) por una tabla dinámica conectada a la API que muestra hasta 2 ubicaciones.
* **Lógica de Proyección (HubView & WeatherView)**: Si la hora local del usuario es anterior a las 17:00, el widget y las tablas operativas muestran los datos del clima de **Hoy**. Si es posterior a las 17:00, muestran automáticamente la proyección de **Mañana**.
* **Frontend (WeatherView)**: Se rediseñaron las tarjetas gigantes de clima actuales para convertirlas en una tabla operativa compacta (Clima Operativo), mejorando el uso del espacio.
* **UX/UI (WeatherView)**: Se implementó un "staggered polling" (actualización escalonada mediante timeouts) al agregar una zona nueva, para que la interfaz se refresque automáticamente apenas el worker en segundo plano termine de popular los datos históricos.

### Arreglado (Fixed)
* Solucionados los problemas de pérdida de sincronización de archivos (Vite HMR) en el contenedor de Docker para Windows al realizar modificaciones completas sobre componentes de React.
* Eliminados imports sin uso y solucionados errores de compilación estricta de TypeScript (`verbatimModuleSyntax`).
