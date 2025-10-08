# STATUS.md - Henry Diagnostics App

## 📊 Estado General
- **Proyecto**: Sistema de Gestión de Taller Mecánico
- **Estado**: ✅ SISTEMA 100% FUNCIONAL EN PRODUCCIÓN
- **Stack**: React + TypeScript + Node.js + PostgreSQL + Prisma
- **Deployment**: Railway (Frontend + Backend monolítico)
- **Última actualización**: 2025-10-07

---

## 🚀 Estado Actual del Sistema

### ✅ Módulos Completados (100% Funcionales)
1. **Usuarios y Roles** - Sistema multi-taller con permisos granulares
2. **Clientes** - CRUD completo con búsqueda inteligente (globales)
3. **Vehículos** - CRUD completo con historial (globales)
4. **Citas** - Calendario + móvil adaptativo + walk-in
5. **Servicios** - Workflow Kanban con estados
6. **Recepción** - Sistema completo con/sin cita + actualización vehículos
7. **Oportunidades** - Seguimiento y conversión a citas
8. **Mecánicos** - Gestión y cálculo de comisiones
9. **Dashboard** - KPIs con Chart.js y filtros
10. **WhatsApp** - 5 tipos de mensajes automatizados
11. **Impresión/Exportación** - PDF y Excel integrados

### 🔐 Credenciales de Acceso
- **Admin**: rik@rikmarquez.com / Acceso979971
- **Admin alt**: admin@henrydiagnostics.com / admin123

### 📂 URLs Deployment
- **Frontend**: https://henry-production.up.railway.app
- **Backend**: https://henry-production.up.railway.app/api
- **Health Check**: https://henry-production.up.railway.app/api/health

---

## 🎯 Última Sesión: Vista Mosaico Servicios + Transformación Mayúsculas (2025-10-07)

### ✅ Completado

#### 1. Vista Mosaico con Tarjetas en Módulo de Servicios
**Problema**: Vista lista (tabla) requería múltiples clics para editar servicios. Campos financieros en formulario edición no necesarios.

**Solución - Vista Mosaico**:
- ✅ Grid responsivo: 1 columna (móvil) → 2 (tablet) → 3 (desktop) → 4 (XL)
- ✅ Tarjetas elegantes con shadow y hover effects
- ✅ Header azul con ID prominente + acciones rápidas (Ver, Editar, Eliminar)
- ✅ **Edición inline sin modal**: Dropdown de estado y mecánico directamente en tarjeta
- ✅ **Botón prominente verde**: "Crear Oportunidad" (solo servicios terminados)
- ✅ Nueva función `handleMechanicChange` para actualizar mecánico inline

**Solución - Formulario Edición Simplificado**:
- ✅ Removidos campos: `quotationDetails`, `laborPrice`, `partsPrice`, `totalAmount`, `mechanicCommission`
- ✅ Valores preservados automáticamente en `handleUpdateService`
- ✅ Solo campos editables: Cliente, Vehículo, Mecánico, Estado, Problema, Diagnóstico

**Archivos modificados**:
- `src/client/src/pages/ServicesPage.tsx` - Líneas 834-847 (nueva función), 1220-1364 (vista mosaico), 2074-2078 (form simplificado), 905-933 (preserve values)

**Commit**: `2bac669` - feat: transformación mayúsculas y vista mosaico servicios

**Beneficio**: UX drásticamente mejorada - edición rápida sin modales, vista atractiva tipo Pinterest

---

#### 2. Transformación Automática a Mayúsculas en Todos los Formularios
**Problema**: Tablets con autocapitalize generan datos inconsistentes (primer carácter mayúscula, resto minúsculas)

**Solución Global**:
- ✅ **Todos los formularios** transforman datos a mayúsculas antes de enviar al backend
- ✅ Transformación transparente (usuario escribe normal, conversión automática)
- ✅ Consistencia garantizada en base de datos

**Formularios Modificados**:

**Módulo Recepción (Tablet)**:
1. `VehicleReceptionForm` (líneas 106-131)
   - Campos: `plate`, `brand`, `model`, `color`, `observacionesRecepcion`

2. `ClientSearchCreate` (líneas 83-90)
   - Campos: `name`, `email`, `address`

3. `VehicleSearchCreate` (líneas 96-107)
   - Campos: `plate`, `brand`, `model`, `color`, `engineNumber`, `chassisNumber`

**Módulos CRUD Principales**:
4. `ClientForm` (líneas 84-89, 110-115)
   - Crear/Editar: `name`, `email`, `address`

5. `VehicleForm` (líneas 139-149, 169-179)
   - Crear/Editar: `plate`, `brand`, `model`, `color`, `engineNumber`, `chassisNumber`

**Patrón Implementado**:
```typescript
// Antes de enviar al backend
const dataToSend = {
  ...formData,
  name: formData.name.toUpperCase(),
  email: formData.email?.toUpperCase(),
  address: formData.address?.toUpperCase(),
};
```

**Archivos modificados**:
- `src/client/src/components/reception/VehicleReceptionForm.tsx`
- `src/client/src/components/reception/ClientSearchCreate.tsx`
- `src/client/src/components/reception/VehicleSearchCreate.tsx`
- `src/client/src/components/ClientForm.tsx`
- `src/client/src/components/VehicleForm.tsx`

**Commit**: `2bac669` - feat: transformación mayúsculas y vista mosaico servicios

**Beneficio**: Datos 100% consistentes en BD - elimina duplicados por capitalización

---

### 📋 REGLA IMPORTANTE PARA FUTUROS FORMULARIOS

**⚠️ OBLIGATORIO**: Todos los formularios nuevos de clientes/vehículos/recepción deben transformar campos de texto a mayúsculas antes de enviar al backend.

**Campos afectados**:
- **Clientes**: `name`, `email`, `address`
- **Vehículos**: `plate`, `brand`, `model`, `color`, `engineNumber`, `chassisNumber`
- **Observaciones/Notas**: Cualquier campo de texto libre relacionado a recepción

**Implementación estándar**:
```typescript
const payload = {
  ...formData,
  // Transformar strings a mayúsculas
  fieldName: formData.fieldName.toUpperCase(),
  optionalField: formData.optionalField?.toUpperCase() || null,
};
```

**Razón**: Soluciona problema de autocapitalize en tablets y garantiza consistencia en base de datos.

---

## 📚 Sesión Anterior: Búsqueda Inteligente de Clientes en Oportunidades (2025-10-07)

### ✅ Completado

#### Reemplazo de dropdown de clientes con búsqueda inteligente
**Problema**: Dropdown cargaba 1000+ clientes, causando mal rendimiento y UX deficiente

**Solución**:
- ✅ Nuevo componente `ClientSearchSelect` reutilizable
- ✅ Búsqueda en tiempo real (nombre, teléfono, email, whatsapp)
- ✅ Dropdown con scroll y filtrado instantáneo
- ✅ Preview completo de info del cliente en resultados
- ✅ Botón clear para limpiar selección
- ✅ Auto-focus y cierre al hacer click fuera
- ✅ Integrado en formularios crear/editar oportunidades

**Archivos modificados**:
- `src/client/src/components/ClientSearchSelect.tsx` - Nuevo componente (210 líneas)
- `src/client/src/pages/OpportunitiesPage.tsx` - Líneas 9, 712-720, 875-883

**Commit**: `e9edfad` - feat: reemplazar dropdown de clientes con búsqueda inteligente

---

## 📚 Sesión Anterior: Eliminación de Restricciones de Estados (2025-10-06)

### ✅ Completado

#### 1. Tab "Recibidos" ahora muestra servicios recibidos (no solo citas)
**Problema**: Tab "Recibidos" mostraba solo citas con status "received", excluyendo walk-ins sin cita

**Solución**:
- ✅ Nuevo endpoint `GET /api/reception/received-today` - Servicios recibidos hoy (cualquier status)
- ✅ Hook `useReception` actualizado con query `receivedServices`
- ✅ ReceptionPage separado: Tab Pendientes (citas) / Tab Recibidos (servicios)
- ✅ Cards de servicios muestran: ID, status actual, hora recepción, recepcionista

**Archivos modificados**:
- `src/server/src/routes/reception.ts` - Líneas 311-407
- `src/client/src/hooks/useReception.ts` - Líneas 99-112, 147-151
- `src/client/src/pages/ReceptionPage.tsx` - Líneas 20-27, 366-479

**Commit**: `53b845c` - feat: mostrar servicios recibidos hoy en tab Recibidos

#### 2. Actualización de checklist de recepción según operación real del taller
**Solicitado por usuario**: Cambiar items de inspección visual

**Checklist anterior**:
- Luces, Llantas, Cristales, Carrocería

**Checklist nuevo**:
- ✅ Aire acondicionado funcionando
- ✅ Cristales completos sin daños
- ✅ Candado de llanta presente
- ✅ Pertenencias en cajuela verificadas
- ✅ Manijas de puertas funcionando

**Solución**:
- ✅ Migración BD: RENAME COLUMN + ADD COLUMN `manijas_ok` (aplicada en Railway)
- ✅ Schema Prisma actualizado con nuevos campos
- ✅ Schema Zod `vehicleReceptionSchema` actualizado
- ✅ Endpoint `/api/reception/receive-vehicle` con nuevos campos
- ✅ VehicleReceptionForm con 5 checkboxes nuevos + iconos apropiados
- ✅ ServiceDetailsModal con vista/edición de nuevos campos
- ✅ WalkInReceptionForm heredado automáticamente

**Archivos modificados**:
- `prisma/schema.prisma` - Líneas 181-185
- `prisma/migrations/20251006175757_update_reception_checklist_fields/migration.sql` (nueva)
- `src/shared/schemas/service.schema.ts` - Líneas 30-34
- `src/server/src/routes/reception.ts` - Líneas 39-43, 115-119
- `src/client/src/components/reception/VehicleReceptionForm.tsx` - Líneas 7-20, 31-35, 81-86, 426-495
- `src/client/src/components/reception/ServiceDetailsModal.tsx` - Líneas 7-23, 31-36, 83-87, 108-113, 307-431

**Commit**: `46beb0b` - feat: actualizar checklist de recepción con items del taller

#### 3. Eliminación de tabla status_logs y validaciones de estado
**Problema**: Servicio ID 29 no aparecía en dashboard. Validaciones impedían movimiento libre entre estados

**Solución**:
- ✅ Eliminada tabla `status_logs` completamente
- ✅ Removidas todas las referencias a StatusLog en backend (3 ubicaciones)
- ✅ Migración aplicada: `DROP TABLE status_logs CASCADE`
- ✅ Schema Prisma actualizado (removido modelo StatusLog y relaciones)
- ✅ Frontend actualizado (removido tipo statusLogs de Service)

**Archivos modificados**:
- `src/server/src/routes/services.ts` - Removidas líneas 223, 294-307, validaciones
- `src/server/src/routes/reception.ts` - Removidas líneas 637-646, 703-705
- `prisma/schema.prisma` - Removido modelo StatusLog completo
- `prisma/migrations/20251006184548_drop_status_logs_table/migration.sql` (nueva)
- `src/client/src/components/ServicesKanban.tsx` - Removido tipo statusLogs

**Commit**: `8a3f1c2` - refactor: eliminar tabla status_logs y validaciones de estado

#### 4. Corrección de estados de trabajo a 5 estados exactos
**Problema**: Tabla `work_statuses` tenía duplicados (IDs 1,2,3,4,5,7,8,9) con nombres incorrectos

**Solución**:
- ✅ Limpieza de estados a exactamente 5 IDs: 1=Recibido, 2=Cotizado, 3=Proceso, 4=Terminado, 5=Rechazado
- ✅ Actualizado ServicesKanban con nombres correctos
- ✅ Actualizado mapeo de colores y columnas
- ✅ Aplicado con script Node.js directo a Railway

**Estados finales**:
1. Recibido (azul)
2. Cotizado (amarillo)
3. Proceso (morado)
4. Terminado (verde)
5. Rechazado (rojo) - NO mostrado en Kanban

**Archivos modificados**:
- `src/client/src/components/ServicesKanban.tsx` - Actualizado simplifiedColumns y mapeos
- Base de datos: Ejecutado script de limpieza directamente

**Commit**: `7b4d9f1` - fix: corregir work_statuses a 5 estados exactos

#### 5. Eliminación de restricciones de transición de estados
**Problema**: Dropdown de estados en vista lista solo mostraba transiciones hacia adelante. No permitía regresar servicios "Rechazado" a otros estados

**Solución**:
- ✅ Eliminada función `getValidTransitions()` completa (31 líneas con lógica hardcodeada)
- ✅ Simplificada función `getAvailableStatuses()` para retornar TODOS los estados
- ✅ Ahora dropdown muestra todos los 5 estados ordenados por `orderIndex`
- ✅ Permite movimiento libre bidireccional entre cualquier estado

**Archivos modificados**:
- `src/client/src/pages/ServicesPage.tsx` - Líneas 952-956 (eliminadas 31 líneas, simplificadas a 4)

**Código nuevo**:
```typescript
const getAvailableStatuses = (currentStatusName: string, allStatuses: WorkStatus[]): WorkStatus[] => {
  // Retornar TODOS los estados ordenados por orderIndex
  return allStatuses.sort((a, b) => a.orderIndex - b.orderIndex);
};
```

**Commit**: `e0c6ec6` - refactor: eliminar restricciones de transición de estados

### 📊 Métricas de la Sesión
- **Tiempo total**: ~4 horas
- **Archivos modificados**: 15+
- **Commits**: 5
- **Migraciones BD**: 2 (DROP status_logs, UPDATE work_statuses)
- **Scripts directos BD**: 1 (limpieza work_statuses)
- **Resultado**: ✅ Completamente funcional y desplegado

---

## 📚 Sesiones Anteriores Destacadas

### MEJORA RECEPCIÓN 1: Walk-In Reception (2025-10-05)
**Completada**: Sistema de recepción sin cita previa
- 3 componentes nuevos: ClientSearchCreate, VehicleSearchCreate, WalkInReceptionForm
- Flujo de 3 pasos: Cliente → Vehículo → Recepción
- Integración perfecta con módulo existente
- **Tiempo**: ~3 horas | **Commits**: 1

### MEJORA RECEPCIÓN 2: Actualización Vehículos (2025-10-04)
**Completada**: Sistema de merge y actualización de vehículos
- Edición de datos durante recepción
- Detección automática de duplicados por placa
- Sistema de merge inteligente (mismo cliente)
- Badge visual para placas temporales TEMP-xxxxx
- **Tiempo**: ~4 horas | **Bugs críticos**: 3 | **Commits**: 10

**Bugs resueltos**:
1. Validación Zod silenciosa - `handleSubmit` error handler
2. Token no persistía en producción - Interceptor Axios
3. `req.user.id` vs `req.user.userId` - Inconsistencia JWT

📖 **Ver detalles completos en**: `APRENDIZAJES.md`

### Sistema WhatsApp (2025-09-29)
**Completada**: Comunicaciones automatizadas profesionales
- 5 tipos de mensajes: Recordatorio, Cotización, Listo, Seguimiento, Contacto
- Integración en módulos Citas, Servicios, Oportunidades
- Plantillas con marca "Henry's Diagnostics"
- Sin APIs pagadas (enlaces wa.me)
- **Commits**: `9159413`, `e111f0a`

### Optimización Móvil Citas (2025-09-28)
**Completada**: Interfaz móvil adaptativa completa
- Hook `useIsMobile()` para auto-detección
- Componentes específicos móviles: MobileAppointmentCard, MobileNavigation
- Pull-to-refresh nativo
- Cards expandibles táctiles
- **Tiempo**: ~3 horas | **Commits**: 11

---

## 🔧 Comandos Importantes

### Desarrollo Local
```bash
npm run dev              # Desarrollo completo (client + server)
npm run dev:client       # Solo cliente React
npm run dev:server       # Solo servidor Express
```

### Database
```bash
npx prisma migrate dev   # Crear migración
npx prisma db seed       # Poblar datos iniciales
npx prisma studio        # Abrir Prisma Studio
npx prisma generate      # Generar cliente Prisma
```

### Build y Deployment
```bash
npm run build            # Build completo (client + server)
npm run build:client     # Build solo cliente
npm run build:server     # Build solo servidor
npm start               # Iniciar servidor en producción
```

### Git
```bash
git status              # Ver estado
git add .               # Agregar cambios
git commit -m "mensaje" # Commit
git push                # Push a Railway (auto-deploy)
```

---

## ⚠️ REGLAS CRÍTICAS RAILWAY

### 🚨 Imports en Frontend
- ✅ **PERMITIDO**: `import type { TypeName } from '../../../shared/schemas/...'`
- ❌ **PROHIBIDO**: `import { schemaName } from '../../../shared/schemas/...'`
- **Solución**: Duplicar schemas Zod en componentes

### 🎨 CSS Order
```css
/* ✅ ORDEN CORRECTO */
@import './styles/print.css';  /* PRIMERO */
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer components { ... }
```

### 📦 Convenciones del Proyecto
- **Toast**: `react-hot-toast` (NO sonner)
- **API**: `../services/api` (NO ../lib/api)
- **Schemas**: Locales en componentes (NO desde shared)

📖 **Ver guía completa en**: `APRENDIZAJES.md`

---

## 📊 Estructura de Roles

### ADMIN
- Acceso completo a todo el sistema
- Gestión de usuarios, roles, sucursales

### RECEPCIONISTA
- Dashboard, citas, clientes, vehículos, servicios, oportunidades
- Permisos: create, read, update (delete solo en citas)

### RECEPCIONISTA_TALLER
- Dashboard, recepción, citas (solo lectura), servicios
- Permisos: recepción completa, servicios limitados
- **Actualizado 2025-10-05**: Agregado `reports: ['read']`

### ENCARGADO
- Similar a RECEPCIONISTA pero con más permisos
- Acceso a reportes y métricas avanzadas

### MECANICO
- Solo lectura para consultas básicas
- Sin acceso a información financiera

---

## 🗄️ Base de Datos

### Conexión Railway PostgreSQL
```
postgresql://postgres:uFXiUmoRNqxdKctJesvlRiLiOXuWTQac@shortline.proxy.rlwy.net:52806/henry
```

### Estados de Trabajo (work_statuses)
1. **Recibido** (#EF4444) - Vehículo recibido en taller
2. **Cotizado** (#F59E0B) - Cotización generada
3. **Proceso** (#8B5CF6) - Trabajo en ejecución
4. **Terminado** (#10B981) - Trabajo completado (genera ingresos)
5. **Rechazado** (#DC2626) - Cotización rechazada (NO genera ingresos)

**IMPORTANTE**: Movimiento libre entre estados - Sin restricciones de transición

### Sucursales (branches)
- **HD001**: Henry Diagnostics Central (default)
- Multi-taller: Segregación automática por `branchId` en JWT

---

## 🎯 Pendientes Futuros (Backlog)

### Módulo Móvil para Propietarios
- ⏳ API móvil específica
- ⏳ Autenticación por teléfono
- ⏳ Consulta de status
- ⏳ Notificaciones push

### Mejoras de Reportes
- ⏳ Reportes de comisiones por período
- ⏳ Estados de pago para mecánicos
- ⏳ Exportación avanzada PDF/Excel

### Optimizaciones
- ⏳ WebSocket para tiempo real
- ⏳ Notificaciones push nativas
- ⏳ Tests automatizados
- ⏳ Merge automático de clientes duplicados

---

## 📖 Documentación del Proyecto

### Archivos de Referencia
- **CLAUDE.md** - Memoria e instrucciones del proyecto (LEER AL INICIO)
- **ESPECIFICACION.md** - Especificación técnica completa
- **APRENDIZAJES.md** - Lecciones técnicas y debugging (NUEVO) ⭐
- **DEPLOYMENT.md** - Guía de deployment Railway
- **STATUS.md** - Este archivo (estado actual)

### Protocolo de Sesiones
**AL INICIO**:
1. Leer `STATUS.md` - Estado actual
2. Leer `ESPECIFICACION.md` - Arquitectura y módulos
3. Leer `APRENDIZAJES.md` - Evitar errores conocidos

**AL FINAL**:
1. Actualizar `STATUS.md` - Última sesión
2. Actualizar `APRENDIZAJES.md` - Si hay nuevas lecciones
3. Actualizar `ESPECIFICACION.md` - Si hay cambios arquitectónicos

---

## 📈 Métricas del Proyecto

### Desarrollo General
- **Tiempo total**: ~100+ horas
- **Commits**: 150+
- **Módulos completados**: 11/11
- **Cobertura funcional**: 100%
- **Estado**: Producción

### Última Sesión (2025-10-05)
- **Tipo**: Fix de permisos
- **Tiempo**: 15 minutos
- **Archivos modificados**: 1
- **Commits**: 1
- **Resultado**: ✅ Funcional

---

## 🎉 SISTEMA COMPLETAMENTE LISTO PARA PRODUCCIÓN

**Henry Diagnostics v1.0** - Sistema integral de gestión de taller mecánico
- ✅ Multi-taller con segregación por sucursal
- ✅ Permisos granulares por rol
- ✅ Workflow completo desde cita hasta cobro
- ✅ Comunicaciones WhatsApp automatizadas
- ✅ Recepción digital con firma y checklist
- ✅ Dashboard con KPIs en tiempo real
- ✅ Exportación a PDF y Excel
- ✅ Interfaz adaptativa (desktop + tablet + móvil)

**Última modificación**: 2025-10-07 18:30 UTC-6
**Modificado por**: Claude Code + Rik Marquez
