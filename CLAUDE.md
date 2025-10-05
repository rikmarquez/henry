# CLAUDE.md - Memory de Henry Diagnostics App

## 📋 Context inicial importante
**OBLIGATORIO AL INICIO DE CADA SESIÓN:**
1. **Leer STATUS.md** - Para ponerse al tanto del desarrollo actual de la app
2. **Leer ESPECIFICACION.md** - Para conocer el estado de implementación de cada módulo

**OBLIGATORIO AL FINAL DE CADA SESIÓN:**
1. **Actualizar STATUS.md** - Con los cambios, logros y aprendizajes de la sesión
2. **Actualizar ESPECIFICACION.md** - Si se implementaron nuevas funcionalidades o cambios en la arquitectura

## 🎯 Objetivo del Proyecto
Sistema de gestión de taller mecánico "Henry Diagnostics" - Aplicación web completa para gestionar clientes, vehículos, servicios, mecánicos y operaciones del taller.

## 📊 Estado Actual
- **Fase:** Transición a Fase 1 (Core MVP)
- **Progreso General:** 15% completado
- **Estructura:** Base técnica completada
- **Próximo:** Implementar autenticación y CRUD básico

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

## ⏳ Pendientes Inmediatos
1. Ejecutar primera migración de Prisma
2. Ejecutar seed de datos iniciales
3. Crear esquemas de validación Zod compartidos
4. Implementar sistema de autenticación JWT
5. Crear middlewares de autenticación
6. Implementar CRUD básico de usuarios y roles

## 📝 Notas importantes
- **PROTOCOLO SESIONES:** Leer STATUS.md + ESPECIFICACION.md al inicio, actualizarlos al final
- Seguir la especificación detallada en ESPECIFICACION.md como referencia técnica
- Mantener la estructura monolítica para simplicidad en Railway
- Priorizar funcionalidades basadas en el estado actual documentado

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
- **STATUS.md** contiene sección completa "DEPLOYMENT ERRORS RESUELTOS"
- **Leer antes de deployment** para evitar errores conocidos
- **Actualizar STATUS.md** con nuevos aprendizajes de deployment

---
*Archivo creado: 2025-08-20*