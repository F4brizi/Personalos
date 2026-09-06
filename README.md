# Personal OS

Sistema operativo personal para centralizar productividad, gestión de conocimiento, automatizaciones y asistentes de IA.

---

## 🌿 Estrategia de Ramas (Git Branching por Sesión)

Para mantener el trabajo ordenado y permitir iteraciones independientes o múltiples sesiones en paralelo, utilizaremos la siguiente convención de Git:

- **`main`**: Código estable y funcional ya verificado.
- **`session/<id>-<descripcion>`**: Rama dedicada a cada sesión o módulo de trabajo (ejemplo: `session/01-arquitectura-base`, `session/02-dashboard-ui`).

### Flujo de trabajo por sesión:

1. **Iniciar sesión:**
   ```bash
   git checkout -b session/01-setup-inicial
   ```
2. **Desarrollar y comitear cambios:**
   ```bash
   git add .
   git commit -m "feat: implementar módulo X"
   ```
3. **Consolidar en `main` al finalizar la sesión:**
   ```bash
   git checkout main
   git merge session/01-setup-inicial
   ```

---

## 🗺️ Plan de Implementación

Consulta el archivo [`PLAN.md`](./PLAN.md) para ver la hoja de ruta modular detallada y el estado de cada fase.
