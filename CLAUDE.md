# CLAUDE.md - Memory de Henry Diagnostics App

## 📋 Context inicial importante
**OBLIGATORIO AL INICIO DE CADA SESIÓN:**
1. **Leer STATUS.md** - Estado actual y última sesión
2. **Leer ESPECIFICACION.md** - Funcionalidades y módulos
3. **Leer APRENDIZAJES.md** - Lecciones técnicas y errores a evitar
4. **Opcional: ARQUITECTURA.md** - Solo si necesitas detalles técnicos (BD, API, deployment)

**OBLIGATORIO AL FINAL DE CADA SESIÓN:**
1. **Actualizar STATUS.md** - Última sesión y cambios realizados
2. **Actualizar APRENDIZAJES.md** - Si se encontraron bugs o lecciones nuevas
3. **Actualizar ESPECIFICACION.md** - Si hay nuevos módulos o funcionalidades
4. **Actualizar ARQUITECTURA.md** - Si hay cambios en BD, API o deployment

## 🎯 Objetivo del Proyecto
Sistema de gestión de taller mecánico "Henry Diagnostics" - Aplicación web completa para gestionar clientes, vehículos, servicios, mecánicos y operaciones del taller.

## 📊 Estado Actual
- **Fase:** Sistema 100% Funcional en Producción ✅
- **Progreso General:** 100% completado
- **Deployment:** Railway activo
- **Últimas actualizaciones:** Ver STATUS.md

## 🛠️ Stack Tecnológico
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** PostgreSQL (Railway)
- **ORM:** Prisma
- **Arquitectura:** Monolítica (client/server/shared)

## 🗄️ Base de Datos
- **Estado:** Configurada en Railway ✅
- **Connection:** `postgresql://postgres:uFXiUmoRNqxdKctJesvlRiLiOXuWTQac@shortline.proxy.rlwy.net:52806/henry`
- **Esquema Prisma:** Completo y configurado ✅

## 🚀 Comandos importantes
- `npm run dev` - Desarrollo (client + server)
- `npm run dev:client` - Solo cliente React
- `npm run dev:server` - Solo servidor Express
- `npm run build` - Build completo
- `npx prisma migrate dev` - Migración de desarrollo
- `npx prisma db seed` - Poblar datos iniciales

## 🎯 Módulos Completados
1. ✅ Usuarios y Roles (multi-taller)
2. ✅ Clientes y Vehículos (globales)
3. ✅ Citas (calendario + móvil)
4. ✅ Servicios (workflow Kanban)
5. ✅ Recepción (con/sin cita + walk-in)
6. ✅ Oportunidades
7. ✅ Mecánicos y Comisiones
8. ✅ Dashboard con KPIs
9. ✅ WhatsApp (5 tipos mensajes)
10. ✅ Impresión/Exportación

## 📝 Notas importantes
- **PROTOCOLO SESIONES:** Leer STATUS.md + ESPECIFICACION.md + APRENDIZAJES.md al inicio
- **Actualizar al final:** STATUS.md (siempre) + APRENDIZAJES.md (si hay bugs/lecciones)
- **APRENDIZAJES.md:** Contiene bugs resueltos y técnicas de debugging - LEER antes de deployment
- Seguir la especificación detallada en ESPECIFICACION.md como referencia técnica
- Mantener la estructura monolítica para simplicidad en Railway

## ⚠️ REGLAS CRÍTICAS RAILWAY DEPLOYMENT

### 🚨 Arquitectura Shared - Imports en Frontend
- **REGLA DE ORO**: Frontend NO puede importar runtime values de `shared/` durante build
- **✅ PERMITIDO**: `import type { TypeName } from '../../../shared/schemas/...'`
- **❌ PROHIBIDO**: `import { schemaName } from '../../../shared/schemas/...'`
- **Razón**: Vite no puede resolver imports de módulos TypeScript compilados
- **Solución**: Duplicar schemas de validación Zod en componentes de formulario
- **Patrón del proyecto**: Ver `ClientForm.tsx`, `VehicleForm.tsx` - schemas locales

### 🎨 CSS Rules
- **@import SIEMPRE primero**: Antes de @tailwind, @layer, cualquier CSS
- **Orden correcto** en `index.css`:
  1. @import statements
  2. @tailwind directives
  3. @layer definitions
  4. Resto de CSS

### 📦 Dependencias y Convenciones
- **Verificar package.json** antes de agregar imports
- **Usar Grep** para encontrar patrones del proyecto
- **Toast library**: `react-hot-toast` (NO sonner)
- **API imports**: `../services/api` (NO ../lib/api)
- **Form validation**: Schemas Zod locales en componentes

### 🔍 Debugging Railway Sistemático
1. Leer log completo de error
2. Identificar archivo y línea exacta
3. Grep proyecto para encontrar patrón correcto
4. Aplicar fix incremental
5. Commit → Push → Verificar próximo error
6. **Un error a la vez** - no múltiples cambios simultáneos

### 📚 Aprendizajes Documentados
- **APRENDIZAJES.md** ⭐ NUEVO - Archivo dedicado a lecciones técnicas y debugging
- Contiene todos los bugs críticos resueltos con causa raíz y solución
- Técnicas de debugging sistemático
- Mejores prácticas identificadas
- **Leer APRENDIZAJES.md antes de deployment** para evitar errores conocidos

## 📖 Sistema de Documentación (4 archivos principales)
- **CLAUDE.md** - Este archivo (memoria y protocolo del proyecto)
- **STATUS.md** - Estado actual y última sesión (simplificado, 292 líneas)
- **ESPECIFICACION.md** - Funcionalidades y módulos (simplificado, 443 líneas)
- **ARQUITECTURA.md** - Detalles técnicos: BD, API, deployment ⭐ NUEVO
- **APRENDIZAJES.md** - Lecciones técnicas y debugging ⭐ NUEVO
- **DEPLOYMENT.md** - Guía de deployment Railway (legacy)

---
*Archivo creado: 2025-08-20*
*Última actualización: 2025-10-05*