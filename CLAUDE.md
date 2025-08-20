# CLAUDE.md - Memory de Henry Diagnostics App

## 📋 Context inicial importante
**SIEMPRE leer STATUS.md al inicio de cada sesión para ponerse al tanto del desarrollo de la app.**

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
- Siempre actualizar STATUS.md al final de cada sesión
- Seguir la especificación detallada en ESPECIFICACION.md
- Mantener la estructura monolítica para simplicidad en Railway
- Priorizar MVP funcional antes que funciones avanzadas
- **⚠️ CRÍTICO RAILWAY:** Siempre compilar TypeScript antes del deploy (`npm run build`)
  - Ver DEPLOYMENT.md para guía completa de deployment
  - Railway NO compila TypeScript automáticamente

---
*Archivo creado: 2025-08-20*