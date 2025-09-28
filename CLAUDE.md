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
- **⚠️ CRÍTICO RAILWAY:** Siempre compilar TypeScript antes del deploy (`npm run build`)
  - Ver DEPLOYMENT.md para guía completa de deployment
  - Railway NO compila TypeScript automáticamente

---
*Archivo creado: 2025-08-20*