# STATUS.md - Henry Diagnostics App

## 📊 Estado General
- **Proyecto**: Sistema de Gestión de Taller Mecánico
- **Estado**: MVP + Multi-Taller + Dashboard COMPLETADOS ✅ | PRICING SYSTEM 95% (Issue crítico pendiente)
- **Stack**: React + TypeScript + Node.js + PostgreSQL + Prisma
- **URLs**: Frontend: Railway deployed | Backend: Railway deployed

## 🚨 ISSUE CRÍTICO - SESIÓN 2025-08-25
- **Error 500 en creación de servicios** - Railway no sincroniza campos pricing
- **Causa**: Campos `labor_price`, `parts_price`, `parts_cost`, `truput` no existen en tabla `services`  
- **Solución**: Script manual preparado en `fix_pricing_fields.sql` + `ISSUE_SERVICIOS_500.md`
- **Estado**: PENDIENTE ejecución script en pgAdmin Railway database

## ✅ Funcionalidades Completadas (100%)

### Core MVP
- Backend APIs completas (auth, clients, vehicles, appointments, services)
- Frontend: Dashboard, Login, Layout, módulos CRUD
- Autenticación JWT con rutas protegidas
- UX avanzado: autocompletado, modales inline, filtros

### Sistema Multi-Taller
- Arquitectura multi-tenant con segregación por `branchId`
- Gestión sucursales (ADMIN) + context global
- JWT extendido con asignación automática
- Usuarios solo ven datos de su sucursal

### Dashboard y Reportes
- Dashboard completo con Chart.js y múltiples KPIs
- Vista Kanban para servicios con drag & drop
- Gráficos: servicios por estado, productividad mecánicos
- Formato mexicano (MXN, es-MX) consistente

### Configuración Sistema
- Módulo configuración general (información taller, horarios, fiscales)
- Arquitectura preparada para 5 secciones adicionales
- Settings por sucursal con validación completa

## 🎓 Aprendizajes Clave

### Multi-Tenant Architecture
- JWT con `branchId` para segregación automática
- Context pattern para estado global de sucursales
- Route protection declarativa con `AdminRoute`
- **🌍 IMPORTANTE**: Clientes y vehículos son GLOBALES (sin branchId)
  - Cualquier cliente puede ser atendido en cualquier taller
  - Solo mecánicos y servicios están segregados por sucursal

### Prisma Architecture
- **📁 UN SOLO SCHEMA**: `/prisma/schema.prisma` (raíz del proyecto)
- ❌ NO hay schema en `/src/server/prisma/` (eliminado)
- Railway usa `--schema=../../prisma/schema.prisma`

### Performance & UX
- Autocompletado inteligente para grandes DBs
- Sistema Kanban con drag & drop
- Modales inline con creación sin interrupciones

### Debugging Sistemático
- PostgreSQL BigInt serialization fixes
- CORS y proceso zombie resolution
- Validación campos opcionales con Zod

## 🚀 Credenciales y URLs
- **Email**: admin@henrydiagnostics.com
- **Password**: admin123
- **Frontend**: http://localhost:5178
- **Backend**: http://localhost:3002
- **Producción**: Railway deployment activo

## 📋 Pendientes Next Session
### 🔥 PRIORIDAD CRÍTICA:
1. **Ejecutar script pricing fields en Railway database**
2. **Probar creación servicios en production** 
3. **Verificar sistema pricing end-to-end**

### 📱 Sistema Pricing Implementado (Ready to deploy):
- ✅ Dashboard mobile-first reorganizado (3+2 KPIs layout)
- ✅ 4 campos pricing: labor_price, parts_price, parts_cost, truput  
- ✅ Reportes avanzados con breakdown financiero completo
- ✅ Filtros temporales: Hoy, Semana (Lun-Dom), Mes, Año, Custom
- ✅ Formularios UX optimizados (create=básico, edit=pricing)
- ✅ Fallback system para migración gradual
- ✅ Data cleanup completado

### 🔧 Pendientes Menores:
- Implementar 5 secciones adicionales configuración
- Testing final flujo servicios completo  
- Optimizaciones UX menores

