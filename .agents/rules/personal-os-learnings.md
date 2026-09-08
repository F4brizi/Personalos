# Reglas de Proyecto: Personal OS y Entorno Docker/Windows

## Arquitectura del Frontend (React/Vite)
* **HubView vs DashboardView**: El "dashboard principal", "dashboard original", o "radar operativo/tarjeta original" del proyecto es siempre `HubView.tsx`. `DashboardView.tsx` es una vista secundaria o sección tabulada distinta. Al modificar la pantalla principal, dirígete a `HubView`.
* **TypeScript con Vite (`verbatimModuleSyntax`)**: El proyecto usa la configuración de módulos estricta de Vite. Al importar tipos o interfaces en React (ej: `TransactionSummary`, `WeatherLog`), es obligatorio usar el keyword `type`: `import type { ... } from '...'`. Si omites `type`, esbuild fallará silenciosamente durante el Hot-Reload y dejará la pantalla en blanco (error TS1484).

## Infraestructura y Entorno
* **No usar `echo` ni `cat >>` en PowerShell**: Al ejecutar comandos de terminal (run_command) en Windows PowerShell para modificar o crear archivos de código (.py, .ts, .tsx), NUNCA uses `echo` o `cat`. PowerShell genera archivos en formato UTF-16LE con BOM, lo que causa instantáneamente `[PARSE_ERROR]` en Vite o errores de sintaxis en Python. Usa herramientas nativas de edición (`replace_file_content`, `write_to_file`) o scripts de Python que especifiquen explícitamente `encoding='utf-8'`.
* **Vite Hot-Reloading en Docker Desktop (Windows)**: Si reemplazas el contenido COMPLETO de un archivo `.tsx` o `.ts` (por ejemplo, al reconstruir un archivo desde cero con Python o al hacer checkout en git), el "inodo" del archivo cambia. El watcher de archivos de Vite (Chokidar) dentro del contenedor Docker corriendo en WSL2 puede "perder" el rastro del archivo, causando que el HMR deje de funcionar en el navegador y la interfaz no se actualice.
  * **Solución Obligatoria**: Si un usuario reporta que "no cambia nada" después de una modificación estructural o reemplazo completo de un archivo, ejecuta inmediatamente `docker restart personal_os_web` para forzar a Vite a recargar los archivos desde el disco.

## Lógica del Módulo Climático
* **API vs Base de Datos (Worker ARQ)**: El worker asíncrono (ARQ) tiene configurado `forecast_days: 2` contra Open-Meteo, por lo que la base de datos *sí almacena* los datos del clima de hoy y de mañana.
* **Proyección 5 PM**: El frontend es el encargado de consultar TODOS los logs de la API (`/api/v1/weather/logs`) y filtrar cuál mostrar dependiendo de la hora local del usuario. Si es antes de las 17:00 (5 PM), filtra los logs buscando la fecha de HOY. Si es después de las 17:00, suma 1 día y busca los logs de MAÑANA. Esta lógica se debe implementar con `new Date().getHours() >= 17`.
