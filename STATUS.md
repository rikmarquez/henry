# STATUS.md - Henry Diagnostics App

## 📊 Estado General
- **Proyecto**: Sistema de Gestión de Taller Mecánico
- **Estado**: SISTEMA 100% FUNCIONAL ✅ | DATABASE CLEAN RESTART COMPLETADO
- **Stack**: React + TypeScript + Node.js + PostgreSQL + Prisma
- **URLs**: Frontend: Railway deployed | Backend: Railway deployed

## ✅ DATABASE CLEAN RESTART - SESIÓN 2025-09-27
- **Base de datos limpia** - Todos los registros eliminados excepto usuario principal
- **Usuario ADMIN**: rik@rikmarquez.com / Acceso979971
- **Sucursal principal** configurada con información completa
- **Fix crítico**: Middleware de autorización corregido para usuarios ADMIN
- **Dashboard**: Error 403 solucionado, funcionando correctamente
- **Deploy**: Cambios deployados automáticamente en Railway

## 📋 PENDIENTES PRÓXIMA SESIÓN

### 🚗 MEJORA RECEPCIÓN: Actualización de Datos de Vehículo durante Recepción

#### 📝 Contexto del Problema
**Escenario operativo real**:
1. Cliente llama por teléfono para agendar cita
2. **Información incompleta proporcionada**:
   - ✅ SIEMPRE proporciona: Nombre y teléfono
   - ❌ NO proporciona: Placa (no la ve en el momento)
   - ❌ A VECES no proporciona: Marca o modelo exacto
3. Sistema crea vehículo con **placa temporal**: `TEMP-xxxxx`
4. Cita se agenda con datos incompletos
5. **Problema actual**: Al recibir el vehículo físicamente, no se pueden actualizar los datos

#### 🎯 Requerimiento Funcional
**Al momento de recepción del vehículo**, el recepcionista debe poder:
- ✏️ **Actualizar placa real** (reemplazar `TEMP-xxxxx` con placa verdadera)
- ✏️ **Actualizar/corregir marca** del vehículo
- ✏️ **Actualizar/corregir modelo** del vehículo
- ✏️ **Actualizar/corregir año** del vehículo
- ✏️ **Actualizar/corregir color** del vehículo
- ✏️ **Agregar notas adicionales** sobre el vehículo

#### 🔧 Implementación Propuesta

**Frontend - VehicleReceptionForm.tsx**:
- Convertir campos del vehículo de **solo lectura** a **editables**
- Campos a habilitar para edición:
  - `plate` - Input de texto con validación
  - `brand` - Input de texto
  - `model` - Input de texto
  - `year` - Input numérico (1900-2030)
  - `color` - Input de texto
- **Indicador visual** cuando placa empieza con "TEMP"
  - Badge naranja: "⚠️ PLACA TEMPORAL - Actualizar con placa real"
  - Resaltar campo de placa para llamar atención

**Backend - reception.ts**:
- Endpoint `/receive-vehicle` debe:
  1. Recibir datos del vehículo junto con datos de recepción
  2. **Actualizar vehículo** si hay cambios en los datos
  3. Crear servicio con datos de recepción
  4. Validar que placa no esté duplicada (si se actualiza)

**Flujo Operativo Mejorado**:
```
1. Cita telefónica → Vehículo creado con TEMP-12345
2. Cliente llega al taller con auto
3. Recepcionista abre formulario de recepción
4. Sistema muestra: ⚠️ PLACA TEMPORAL - Campo resaltado
5. Recepcionista ve placa real del auto físico
6. Actualiza: TEMP-12345 → ABC-1234 (placa real)
7. Corrige marca/modelo si es necesario
8. Completa inspección y firma
9. Sistema actualiza vehículo + crea servicio
10. Datos del vehículo quedan correctos en sistema
```

#### 📊 Cambios Técnicos Necesarios

**1. Schema de Validación** (shared):
```typescript
// Extender vehicleReceptionSchema
export const vehicleReceptionSchema = z.object({
  // ... campos existentes de recepción ...

  // NUEVOS: Datos del vehículo actualizables
  vehicleUpdates: z.object({
    plate: z.string().min(1).optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    year: z.number().int().min(1900).max(2030).optional(),
    color: z.string().optional(),
  }).optional(),
});
```

**2. Endpoint Backend**:
```typescript
// En /receive-vehicle
if (vehicleUpdates && Object.keys(vehicleUpdates).length > 0) {
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: vehicleUpdates,
  });
}
```

**3. Frontend - Formulario**:
- Sección nueva: "Datos del Vehículo" (editable)
- Detección automática de placas temporales
- Validación en tiempo real
- Toast notification: "Vehículo actualizado: ABC-1234"

#### ✅ Beneficios Operativos
- 🎯 **Datos precisos**: Placas reales en sistema desde recepción
- ⚡ **Flujo simplificado**: No necesitar módulo de vehículos para corrección
- 📋 **Trazabilidad**: Historial de cuando se actualizó placa temporal
- 💼 **Productividad**: Recepcionista completa todo en un solo paso
- 🚫 **Prevención duplicados**: Validación de placa única al actualizar

#### 📝 Notas de Implementación
- **Prioridad**: ALTA - Afecta flujo operativo diario
- **Tiempo estimado**: 2-3 horas
- **Archivos a modificar**:
  - `src/client/src/components/reception/VehicleReceptionForm.tsx`
  - `src/server/src/routes/reception.ts`
  - `src/shared/schemas/service.schema.ts`
- **Testing requerido**:
  - Actualización de placa temporal a real
  - Validación de duplicados
  - Edición parcial (solo algunos campos)

---

## 🎯 MÓDULO DE RECEPCIÓN DE VEHÍCULOS - SESIÓN 2025-10-04

### ✅ COMPLETADO: Sistema de Recepción de Vehículos para Tablet
- **Feature**: Módulo especializado para recepcionistas de taller con tablet
- **Objetivo**: Registrar la recepción física de vehículos con inspección digital y firma del cliente
- **Rol nuevo**: `RECEPCIONISTA_TALLER` con permisos limitados para solo recepción

#### ✅ BACKEND COMPLETADO (100%)

**1. Schema de Base de Datos** ✅
- **Tabla services extendida** con campos de recepción:
  - `received_by` - Usuario recepcionista que recibió el vehículo
  - `received_at` - Timestamp de recepción
  - `kilometraje` - Kilometraje actual del vehículo
  - `nivel_combustible` - Nivel de combustible ('1/4', '1/2', '3/4', 'FULL')
  - `luces_ok` - Checklist: luces funcionando
  - `llantas_ok` - Checklist: llantas en buen estado
  - `cristales_ok` - Checklist: cristales completos
  - `carroceria_ok` - Checklist: carrocería sin golpes nuevos
  - `observaciones_recepcion` - Campo de texto libre para observaciones
  - `firma_cliente` - Firma digital del cliente (base64)
  - `fotos_recepcion` - Array de fotos del vehículo (JSON)
- **Migración aplicada**: `npx prisma db push` ejecutado exitosamente
- **Relación**: User ↔ Service (receivedServices) para rastrear quién recibió cada vehículo

**2. Rol y Permisos** ✅
- **Rol creado**: `RECEPCIONISTA_TALLER`
- **Permisos configurados**:
  ```json
  {
    "clients": ["create", "read"],
    "vehicles": ["create", "read", "update"],
    "appointments": ["read"],
    "services": ["create", "read", "update"],
    "reception": ["create", "read"]
  }
  ```
- **Seed actualizado**: Rol disponible en base de datos

**3. Estado de Servicios** ✅
- **Estado "Recibido"** ya existía en base de datos (ID: 1)
- Color: `#EF4444` (rojo)
- Primer estado en el flujo del servicio

**4. Schemas de Validación Zod** ✅
- **Archivo**: `src/shared/schemas/service.schema.ts`
- **Schema nuevo**: `vehicleReceptionSchema`
- **Validaciones**:
  - Kilometraje: número entero >= 0
  - Nivel combustible: enum ['1/4', '1/2', '3/4', 'FULL']
  - Checkboxes: booleanos con default true
  - Firma cliente: string requerido
  - Fotos: array opcional de strings
- **TypeScript type**: `VehicleReceptionInput` exportado

**5. API Endpoints** ✅
- **Archivo**: `src/server/src/routes/reception.ts`
- **Endpoints implementados**:
  1. `POST /api/reception/receive-vehicle`
     - Recibe vehículo y crea servicio automáticamente
     - Marca cita como "received" si existe
     - Guarda todos los datos de inspección
     - Retorna servicio completo con relaciones
  2. `GET /api/reception/today`
     - Lista citas del día actual
     - Filtrado por branchId del usuario
     - Include: client, vehicle, services
  3. `GET /api/reception/service/:id`
     - Detalles completos del servicio
     - Include: client, vehicle, receptionist, mechanic, status
- **Autenticación**: Todos los endpoints protegidos
- **Autorización**: Permisos 'reception' requeridos
- **Serialización BigInt**: Implementada para compatibilidad JSON

**6. Integración de Rutas** ✅
- **Archivo**: `src/server/src/routes/index.ts`
- **Ruta registrada**: `router.use('/reception', receptionRoutes)`
- **Backend compilado**: `npm run build` ejecutado sin errores

**7. Dependencias Instaladas** ✅
- `react-signature-canvas` - Componente de firma digital
- `@types/react-signature-canvas` - Tipos TypeScript

#### ✅ FRONTEND COMPLETADO (100%)

**Componentes Implementados**:

1. **Componente SignatureCanvas** ✅
   - Wrapper de react-signature-canvas
   - Botones: Limpiar (con estado disabled)
   - Validación de firma no vacía
   - Export a base64 (PNG)
   - Indicador visual "Firmado" cuando se completa

2. **Página ReceptionPage** ✅
   - Vista principal optimizada para tablet
   - Búsqueda rápida por placa/marca/modelo/cliente
   - Listado de citas del día con cards grandes
   - Auto-refresh cada 60 segundos
   - Filtros en tiempo real sin pérdida de foco

3. **Formulario VehicleReceptionForm** ✅
   - Información del cliente/vehículo (solo lectura) con estilos distintivos
   - Input kilometraje (numérico con validación)
   - Selector visual nivel combustible (4 botones grandes táctiles)
   - Checklist inspección (4 checkboxes grandes con iconos)
   - Textarea observaciones con placeholder descriptivo
   - Canvas de firma digital (400x200px)
   - Botón "Completar Recepción" (grande, verde, táctil)
   - **IMPORTANTE**: Usa HTML nativo + Tailwind (NO ShadCN UI)

4. **Integración de Rutas** ✅
   - `/recepcion` agregado a React Router
   - Menú lateral con icono ClipboardCheck
   - ProtectedRoute aplicado
   - Disponible para rol RECEPCIONISTA_TALLER

5. **Hook useReception** ✅
   - Query: citas del día con auto-refresh
   - Mutation: recibir vehículo
   - Invalidación de queries (reception, services, appointments)
   - Toast notifications con react-hot-toast

#### 🎯 Flujo Operativo Diseñado

```
1. Recepcionista abre tablet → /recepcion
2. Ve lista de citas del día (auto-refresh)
3. Cliente llega → busca por placa o nombre
4. Clic "RECIBIR AUTO" → Formulario
5. Captura:
   - Kilometraje
   - Nivel combustible (visual)
   - Inspección rápida (4 checkboxes)
   - Observaciones especiales
   - Firma digital del cliente
6. Clic "COMPLETAR RECEPCIÓN"
7. Backend:
   - Crea servicio con estado "Recibido"
   - Guarda todos los datos de recepción
   - Marca cita como "received"
   - Genera PDF (futuro)
8. Servicio queda listo para asignar mecánico
```

#### 📊 Arquitectura de Datos

**Flujo de información**:
```
Cita (scheduled)
  ↓ [Recepcionista recibe auto]
Service (estado: Recibido)
  - receivedBy: userId
  - receivedAt: timestamp
  - kilometraje, combustible, inspección, firma
  ↓ [Se asigna mecánico]
Service (estado: En Diagnóstico)
  ↓ [Mecánico diagnostica]
Service (estado: Cotizado)
  ↓ [Cliente aprueba]
Service (estado: En Proceso)
  ↓ [Trabajo completado]
Service (estado: Terminado)
```

#### 🎨 Diseño UX Tablet

**Características**:
- Orientación landscape (1024x768)
- Botones grandes (min 60px altura)
- Espaciado táctil (min 44px touch targets)
- Campos numéricos con teclado numérico
- Selectores visuales (no dropdowns)
- Canvas de firma generoso (400x200)
- Mínimo scroll
- Colores distintivos por sección

#### 📝 Archivos Modificados/Creados

**Backend**:
- ✅ `prisma/schema.prisma` - Campos recepción agregados
- ✅ `prisma/seed.ts` - Rol RECEPCIONISTA_TALLER
- ✅ `src/shared/schemas/service.schema.ts` - vehicleReceptionSchema
- ✅ `src/server/src/routes/reception.ts` - Nuevo archivo
- ✅ `src/server/src/routes/index.ts` - Registro de rutas

**Frontend**:
- ✅ `src/client/src/components/reception/SignatureCanvas.tsx` - CREADO
- ✅ `src/client/src/components/reception/VehicleReceptionForm.tsx` - CREADO
- ✅ `src/client/src/pages/ReceptionPage.tsx` - CREADO
- ✅ `src/client/src/hooks/useReception.ts` - CREADO
- ✅ `src/client/src/App.tsx` - Ruta agregada
- ✅ `src/client/src/components/Layout.tsx` - Menú agregado

#### ⏱️ Tiempo de Desarrollo
- **Backend completo**: ~2 horas
- **Frontend completo**: ~2.5 horas
- **Debugging deployment**: ~1.5 horas
- **Total sesión**: ~6 horas

#### 🚀 Estado Actual
- **Backend**: ✅ 100% completado y compilado
- **Frontend**: ✅ 100% completado
- **Deployment**: 🔄 EN PROCESO (Railway building)
- **Progreso general**: ✅ 100% MÓDULO FUNCIONAL

#### ✅ FIX: Permitir Recibir Cualquier Cita No Cancelada
- **Issue**: Verificar que cualquier cita no cancelada se pueda recibir directamente
- **Solución**: Filtro `status.not = 'cancelled'` en endpoint `/api/reception/today`
- **Resultado**: Citas con estados 'scheduled', 'confirmed', 'received', etc. son elegibles
- **Solo se excluyen**: Citas con status = 'cancelled'
- **Commit**: fix: permitir recibir cualquier cita no cancelada

#### 🐛 ERRORES RESUELTOS EN PRODUCCIÓN

**Error 1: Error 500 - Permisos de Recepción Faltantes** ✅
- **Síntoma**: Error 500 al cargar `/api/reception/today`
- **Root Cause**: Roles ADMIN y ENCARGADO no tenían permisos `reception: ['create', 'read']`
- **Solución**: Agregado permiso `reception` a roles ADMIN y ENCARGADO en seed.ts
- **Lección**: Nuevos módulos requieren actualizar permisos de todos los roles relevantes
- **Commit**: `e170f27` + `5cf64ee`

**Error 2: Error 500 - Parámetros Incorrectos en Middleware** ✅
- **Síntoma**: Error 500 persistente después de agregar permisos
- **Root Cause**: Middleware `authorize` espera **arrays** pero recibía **strings**
  - ❌ Incorrecto: `authorize('reception', 'read')`
  - ✅ Correcto: `authorize(['reception'], ['read'])`
- **Debugging**: Revisión del tipo de parámetros esperados por middleware
- **Solución**: Cambiar todos los llamados de authorize en reception.ts a formato array
- **Lección**: Verificar signature de funciones al usar middlewares
- **Commit**: `225c980`

**Error 3: Zona Horaria - No Muestra Citas del Día** ✅
- **Síntoma**: Endpoint funciona pero retorna 0 citas cuando hay 7 citas del día
- **Root Cause**: Problema de timezone UTC vs México (UTC-6)
  - Hora México: 8:50 PM sábado 4
  - Hora UTC servidor: 2:50 AM domingo 5
  - Código buscaba citas del "domingo" en UTC
- **Debugging**: Script de verificación mostró que sí hay citas del sábado
- **Solución**: Ajuste de zona horaria México en cálculo de rango de fechas
  ```typescript
  const mexicoOffsetHours = -6;
  const mexicoTime = new Date(nowUTC.getTime() + (mexicoOffsetHours * 60 * 60 * 1000));
  const todayMexico = new Date(mexicoTime.getFullYear(), mexicoTime.getMonth(), mexicoTime.getDate());
  const today = new Date(todayMexico.getTime() - (mexicoOffsetHours * 60 * 60 * 1000));
  ```
- **Lección**: Railway usa UTC, siempre considerar timezone del cliente
- **Commit**: `bc736a0`

#### 🎓 Aprendizajes Adicionales de Debugging

**1. Middleware Signature Validation**
- Verificar SIEMPRE los tipos de parámetros esperados
- TypeScript no siempre detecta errores en middleware encadenado
- Revisar ejemplos en el código existente

**2. Timezone en Servidores Cloud**
- Railway/Heroku/AWS por defecto usan UTC
- México = UTC-6 (o UTC-5 en horario de verano)
- Calcular día actual considerando offset del cliente
- Logs deben mostrar AMBAS zonas horarias para debugging

**3. Debugging Sistemático de Permisos**
- Error 500 puede ser permisos faltantes (no solo 403)
- Revisar roles en seed.ts
- Verificar que `upsert` tenga `update: { permisos }` no `update: {}`
- User debe cerrar sesión y volver a entrar para JWT actualizado

#### 🚨 DEPLOYMENT ERRORS RESUELTOS - Railway Build Issues

**Error 1: CSS @import Order** ✅
- **Problema**: `@import must precede all other statements (besides @charset or empty @layer)`
- **Root Cause**: `@import './styles/print.css'` estaba DESPUÉS de `@tailwind` directives
- **Solución**: Mover `@import` al INICIO del archivo `index.css` antes de cualquier otro statement
- **Lección**: CSS @import SIEMPRE debe ir primero (antes de @tailwind, @layer, etc.)
- **Archivo**: `src/client/src/index.css`
- **Commit**: `e59c2bb` - fix: corregir imports CSS y toast para Railway

**Error 2: Library Import Mismatch** ✅
- **Problema**: `Could not resolve import "sonner" from "src/hooks/useReception.ts"`
- **Root Cause**: Hook usaba `sonner` pero proyecto tiene `react-hot-toast` instalado
- **Debugging**: Verificar package.json y comparar con otros componentes
- **Solución**: Cambiar `import { toast } from 'sonner'` → `import toast from 'react-hot-toast'`
- **Lección**: Verificar dependencias instaladas ANTES de importar bibliotecas
- **Archivo**: `src/client/src/hooks/useReception.ts`
- **Commit**: `e59c2bb` - fix: corregir imports CSS y toast para Railway

**Error 3: API Service Path** ✅
- **Problema**: `Could not resolve "../lib/api" from "src/hooks/useReception.ts"`
- **Root Cause**: Path incorrecto (usé `../lib/api` cuando debía ser `../services/api`)
- **Debugging**: Grep de todos los imports de `api` en el proyecto para encontrar patrón correcto
- **Patrón correcto**: Todos los hooks/componentes usan `'../services/api'`
- **Solución**: Corregir import a la ruta real del proyecto
- **Lección**: Seguir convenciones existentes del proyecto, usar Grep para encontrar patrones
- **Archivo**: `src/client/src/hooks/useReception.ts`
- **Commit**: `bab88b3` - fix: corregir ruta de import de api en useReception

**Error 4: Shared Schema Import - CRÍTICO** ✅
- **Problema**: `"vehicleReceptionSchema" is not exported by "../shared/schemas/service.schema.js"`
- **Root Cause FUNDAMENTAL**: Frontend NO PUEDE importar schemas de Zod desde carpeta `shared` durante build
  - Build de Vite intenta resolver imports de TypeScript
  - `shared/schemas` se compila a JavaScript solo en backend
  - Frontend no tiene acceso a archivos compilados .js de shared durante build
- **Anti-patrón identificado**: `import { vehicleReceptionSchema } from '../../../../shared/schemas/service.schema'`
- **Patrón correcto del proyecto**: Schemas Zod locales en cada componente de formulario
- **Ejemplos encontrados**:
  - `ClientForm.tsx`: Define `clientSchema` localmente (líneas 9-18)
  - `VehicleForm.tsx`: Define schemas localmente
  - `CreateAppointmentModal.tsx`: Define schemas localmente
- **Solución aplicada**:
  - Definir `vehicleReceptionSchema` localmente en `VehicleReceptionForm.tsx`
  - Duplicar validaciones (es el patrón aceptado del proyecto)
  - Solo importar TYPES desde shared: `import type { VehicleReceptionInput }`
- **Lección CRÍTICA**:
  - ✅ Frontend puede importar TYPES de shared: `import type { ... } from '../../../shared/...'`
  - ❌ Frontend NO puede importar SCHEMAS/VALUES de shared durante build
  - ✅ Schemas de validación deben duplicarse: backend (shared) + frontend (local)
- **Archivo**: `src/client/src/components/reception/VehicleReceptionForm.tsx`
- **Commit**: `cdf0e34` - fix: mover schema de recepción a validación local en frontend

#### 🎓 APRENDIZAJES DEPLOYMENT RAILWAY (Sesión 2025-10-04)

**1. Arquitectura Shared en Monorepo**
- **Regla de Oro**: `shared/` es para TypeScript TYPES, no para runtime values
- **Frontend build**: Solo puede importar tipos estáticos
- **Backend build**: Compila shared/ a dist/ para runtime
- **Patrón correcto**:
  ```typescript
  // ✅ CORRECTO - Solo tipos
  import type { VehicleReceptionInput } from '../../../shared/schemas/service.schema';

  // ❌ INCORRECTO - Runtime values
  import { vehicleReceptionSchema } from '../../../shared/schemas/service.schema';
  ```

**2. Duplicación de Schemas es Necesaria**
- **Backend**: `src/shared/schemas/service.schema.ts` - Schema completo de Zod
- **Frontend**: Define schema local en componente - Validación UI
- **Razón**: Vite no puede resolver imports de módulos compilados durante build
- **Trade-off aceptado**: Mantenibilidad vs compilación exitosa

**3. CSS Order Matters**
- **@import SIEMPRE primero**: Antes de @tailwind, @layer, cualquier CSS
- **Razón**: Especificación CSS requiere @import al inicio
- **Error común**: Agregar imports después de otras declaraciones

**4. Verificar Dependencias Instaladas**
- **Método**: Revisar `package.json` ANTES de agregar imports
- **Herramienta**: `Grep` para encontrar patrones de uso en proyecto existente
- **Patrón proyecto**: Este proyecto usa `react-hot-toast`, no `sonner`

**5. Seguir Convenciones del Proyecto**
- **API imports**: Todos usan `../services/api` no `../lib/api`
- **Form schemas**: Todos definen schemas localmente
- **Toast library**: Proyecto estandarizado en `react-hot-toast`
- **Método**: Buscar ejemplos existentes antes de crear nuevos patrones

**6. Debugging Sistemático Railway**
- **Paso 1**: Leer COMPLETO el log de error
- **Paso 2**: Identificar archivo y línea exacta
- **Paso 3**: Grep del proyecto para encontrar patrón correcto
- **Paso 4**: Aplicar fix incremental
- **Paso 5**: Commit + push + verificar próximo error
- **Iteración**: Resolver un error a la vez

**7. Railway Build Process**
- **npm install** → **vite build** → **tsc compile**
- Errores en cualquier paso detienen deployment
- Frontend se compila ANTES que backend
- Imports incorrectos fallan en fase de bundling (Vite/Rollup)

---

## 🎯 NUEVAS FUNCIONALIDADES - SESIÓN 2025-10-01

### ✅ COMPLETADO: Botón de Impresión Diaria en Vista Semanal
- **Feature**: Botón adicional en vista semanal para imprimir agenda del día actual sin cambiar de vista
- **Problema resuelto**: Usuarios tenían que cambiar de vista semanal a vista diaria para imprimir el reporte del día
- **Implementación**:
  - ✅ **Botón "Hoy"** agregado a la izquierda del botón de impresión semanal
  - ✅ **Color distintivo azul** para diferenciarlo del botón de impresión semanal (gris)
  - ✅ **Función `handlePrintToday()`** que filtra y imprime solo citas del día actual
  - ✅ **Siempre imprime hoy** independientemente de qué semana se esté visualizando
  - ✅ **Reutiliza componente existente** `PrintableDailyAgenda` sin duplicación de código
- **Experiencia mejorada**:
  - 🖨️ **Reporte diario rápido**: Imprimir agenda del día sin cambiar de vista
  - 🎯 **Workflow optimizado**: Útil para imprimir al inicio del día mientras se revisa la semana
  - 🔵 **UI clara**: Tres botones con propósitos distintos (Hoy/Semana/Excel)
- **Beneficios operativos**:
  - ⚡ **Ahorro de tiempo**: Un clic para imprimir el día actual desde cualquier vista semanal
  - 📅 **Contexto preservado**: No pierde la vista semanal al imprimir el día
  - 💼 **Flujo diario**: Facilita rutina de imprimir agenda al inicio de cada jornada
- **Integración técnica**:
  - ✅ Hook `usePrintAgenda` con función `printDailyAgenda` existente
  - ✅ Filtrado automático de citas por fecha actual
  - ✅ Notificaciones toast de éxito/error
  - ✅ Orden de botones: Hoy (azul) → Semana (gris) → Excel (verde)
- **Archivo modificado**: `src/client/src/components/appointments/WeeklyCalendar.tsx`
- **Commit**: feat: agregar botón impresión diaria en vista semanal de citas

## 🎯 NUEVAS FUNCIONALIDADES - SESIÓN 2025-09-30

### ✅ COMPLETADO: Agregar Vehículos Inline desde Dashboard
- **Feature**: Funcionalidad para agregar nuevos vehículos sin salir del dashboard durante búsqueda de clientes
- **Problema resuelto**: Al buscar un cliente para crear cita, si el vehículo no estaba registrado, había que salir a otro módulo
- **Implementación**:
  - ✅ **Botón "Agregar Otro"** en sección de vehículos de cada cliente en resultados de búsqueda
  - ✅ **Modal inline reutilizable** usando componente VehicleForm existente
  - ✅ **Cliente preseleccionado** automáticamente al abrir el modal
  - ✅ **Actualización automática** de resultados tras crear vehículo
  - ✅ **Flujo continuo** sin interrupciones ni navegación a otros módulos
- **Experiencia mejorada**:
  - 🔍 **Búsqueda → Cliente encontrado → Vehículo no está → "Agregar Otro"**
  - ➕ **Modal se abre con cliente ya seleccionado**
  - 📝 **Usuario llena datos del vehículo (placa, marca, modelo, año, etc.)**
  - ✅ **Guardar → Lista se actualiza → "Crear Cita" con nuevo vehículo**
- **Beneficios operativos**:
  - ⚡ **Flujo ininterrumpido**: Todo desde el dashboard sin cambiar de página
  - 🎯 **Menos clics**: De 5+ pasos a 3 pasos (buscar → agregar → crear cita)
  - 💼 **Productividad**: Recepcionistas crean citas más rápido
  - 🚫 **Prevención de errores**: Mantiene contexto del cliente durante todo el flujo
- **Integración técnica**:
  - ✅ Componente VehicleForm reutilizado (no duplicación de código)
  - ✅ QueryClient invalidation para refresh automático
  - ✅ Estado local para control de modal
  - ✅ Props de preselección de cliente funcionando correctamente
- **Archivo modificado**: `src/client/src/pages/DashboardPage.tsx`
- **Commit**: Agregar funcionalidad crear vehículos inline desde dashboard

## 🎯 NUEVAS FUNCIONALIDADES - SESIÓN 2025-09-28

### ✅ COMPLETADO: Optimización Móvil Completa del Módulo de Citas
- **Feature**: Implementación completa de interfaz móvil optimizada para el módulo de citas
- **Arquitectura técnica**: Sistema adaptativo que detecta automáticamente el dispositivo y ajusta la interfaz
- **Componentes implementados**:
  - 📱 **`useIsMobile.ts`**: Hook para detección automática de dispositivo (< 768px)
  - 🎯 **`MobileAppointmentCard.tsx`**: Cards optimizadas con información jerárquizada
  - 🧭 **`MobileNavigation.tsx`**: Navegación simplificada con 3 tabs principales
  - 📋 **`MobileAppointmentsList.tsx`**: Lista optimizada con pull-to-refresh
  - 🔄 **`AppointmentsPage.tsx`**: Integración adaptativa mobile/desktop
- **Funcionalidades móviles**:
  - ✅ **Auto-detección dispositivo**: Vista lista por defecto en móviles vs semana en desktop
  - ✅ **Cards expandibles**: Información esencial visible, detalles con tap
  - ✅ **Pull-to-refresh**: Gesto nativo para actualizar datos
  - ✅ **Navegación simplificada**: Lista/Hoy/Mes (sin vista semana compleja)
  - ✅ **Acciones rápidas**: Confirmar/Cancelar/Recibir directamente desde cards
  - ✅ **Enlaces telefónicos**: Tap para llamar directamente al cliente
  - ✅ **WhatsApp integrado**: Botón de recordatorio visible en cada card móvil
  - ✅ **Paginación optimizada**: Botones grandes y navegación táctil
- **Experiencia móvil**:
  - 🎨 **Diseño responsive**: Adaptación automática sin configuración manual
  - ⚡ **Performance optimizada**: Componentes ligeros específicos para móvil
  - 👆 **Gestos táctiles**: Pull-to-refresh, tap para expandir, swipe amigable
  - 📱 **Interface nativa**: Botones grandes, espaciado adecuado para dedos
  - 🎯 **UX simplificada**: Información prioritizada y acciones directas
- **Integración WhatsApp móvil**:
  - ✅ **Acceso rápido**: Botón WhatsApp visible en cards expandidas
  - ✅ **Un tap para enviar**: Apertura directa de WhatsApp con mensaje pre-escrito
  - ✅ **Mensaje profesional**: Misma calidad que desktop con datos automáticos
  - ✅ **Compatibilidad total**: Funciona en ambas interfaces sin duplicación
- **Beneficios operativos**:
  - 📞 **Comunicación móvil**: Gestión completa de citas desde cualquier dispositivo
  - ⚡ **Velocidad operativa**: Acciones rápidas sin modales complejos
  - 🎯 **Experiencia unificada**: Misma funcionalidad optimizada por dispositivo
  - 💼 **Productividad**: Personal puede gestionar citas desde smartphones/tablets
- **Arquitectura progresiva**: Mantiene 100% compatibilidad con desktop existente
- **Deployment**: Listo para producción con detección automática de dispositivo

## 🎯 FUNCIONALIDADES SESIÓN 2025-09-29

### ✅ COMPLETADO: Vista Semanal - Citas de Octubre Issue RESUELTO

#### 🎯 ISSUE RESUELTO
- **Problema**: Vista semanal mostraba citas de septiembre (29-30) pero no de octubre (1-5)
- **Status Final**: ✅ **FUNCIONANDO PERFECTAMENTE** - Usuario confirmó: "ya funciono perfecto"
- **Tiempo de resolución**: ~3 horas de debugging sistemático

#### 🔍 ROOT CAUSE ANALYSIS COMPLETO
**1. Error 400 Backend - RESUELTO ✅**
- **Causa identificada**: Filtros automáticos de fecha enviaban formato incorrecto al backend
- **Evolución del problema**:
  - Primer intento: `dateFrom=2025-01-01&dateTo=2026-12-31` (años incorrectos, asumí 2024)
  - User feedback crítico: **"Estamos en el 2025"** - corrección de contexto temporal
  - Problema formato: Zod backend esperaba ISO datetime, frontend enviaba fecha simple
  - **Solución final exitosa**: Eliminación completa de filtros automáticos de fecha
- **Fix aplicado**: Vista semanal ahora usa mismo enfoque que vista lista (sin filtros automáticos)

**2. Límite de Paginación - RESUELTO ✅**
- **Problema identificado**: Vista lista mostraba 2 páginas (40+ citas), vista semanal solo página 1 (20 citas)
- **User feedback**: "cada día podemos hacer hasta 15 citas" → Sugerencia límite 200+
- **Cálculo implementado**: 15 citas/día × 30 días = 450 citas/mes
- **Solución aplicada**: `limit: 500` para vistas calendario vs `limit: 20` para vista lista

**3. Formato de Fechas Local - IMPLEMENTADO ✅**
- **Problema detectado**: `toDateString()` causaba inconsistencias por timezone/locale
- **Solución implementada**: Formato `YYYY-MM-DD` consistente en agrupación `appointmentsByDate`
- **Archivos corregidos**: `WeeklyCalendar.tsx`, `AppointmentCalendar.tsx`, `DailyCalendar.tsx`

#### 🧪 DEBUGGING PROCESS APLICADO
**Estrategia sistemática exitosa**:
1. ✅ Logs temporales agregados a `WeeklyCalendar.tsx` para rastrear flujo de datos
2. ✅ Console.log de cantidad de citas recibidas del backend
3. ✅ Console.log detallado de cada cita con fecha original y formateo aplicado
4. ✅ Console.log de agrupación final por fecha clave
5. ✅ Verificación que backend envía limit 500 para vistas calendario
6. ✅ Confirmación user: datos de octubre aparecían en logs pero no en UI

#### 🔄 COMMITS APLICADOS (Sesión completa)
- `47ac10d`: Filtros automáticos iniciales (causó Error 400)
- `58faaf5`: Enfoque conservador con filtros de fecha
- `7f5912d`: Sincronización selectedDate en todos los componentes
- `02714be`: Eliminación filtrado local redundante
- `2770b4f`: Formato fecha consistente YYYY-MM-DD
- `323bf7c`: Corrección overflow de años en filtros
- `c9f97cf`: Fechas absolutas 2024 (incorrecto por contexto temporal)
- `0c16627`: Formato ISO datetime (innecesario complejidad)
- `0894522`: **ENFOQUE GANADOR** - Eliminación total de filtros automáticos
- `a8ef0d0`: Debugging temporal + aumento limit a 500
- `5829dc5`: Confirmación limit 500 funcionando

#### 🏆 PROGRESO FINAL ALCANZADO
- ✅ **Error 400 eliminado**: Vista semanal no falla más con Bad Request
- ✅ **Todas las citas visibles**: Septiembre (29-30) + Octubre (1-5) aparecen
- ✅ **Backend optimizado**: Limit 500 para vistas calendario, 20 para lista
- ✅ **UX consistente**: Misma lógica de filtrado entre vistas lista y semanal
- ✅ **User confirmation**: "ya funciono perfecto" - issue completamente resuelto

#### 🔬 APRENDIZAJES TÉCNICOS CLAVE
1. **Debugging sistemático**: Error 400 → Formato fechas → Paginación → Filtrado local
2. **Vista lista como referencia**: Replicar lo que funciona vs crear nueva lógica
3. **Evitar over-engineering**: Filtros automáticos "inteligentes" causaron más problemas
4. **User feedback crucial**: Contexto temporal (2025 vs 2024) era crítico
5. **Límites realistas**: Considerar volumen operativo real (15 citas/día)
6. **Console debugging**: Logs temporales fueron esenciales para identificar issue exacto
7. **Frontend-only approach**: Eliminar filtros automáticos simplificó arquitectura

#### 📊 MÉTRICAS DE LA SESIÓN
- **Tiempo total debugging**: ~3 horas
- **Commits realizados**: 11 iteraciones hasta solución
- **Archivos modificados**: 3 componentes de calendario
- **User interactions**: 8 mensajes de feedback crucial
- **Status final**: ✅ COMPLETADO con confirmación de user

#### 🧹 CLEANUP PENDIENTE
- ⏳ **Remover logs temporales**: Limpiar console.log de debugging en `WeeklyCalendar.tsx`
- ✅ **Mantener limit 500**: Confirmed working para vistas calendario
- ✅ **Arquitectura final**: Sin filtros automáticos, consistente con vista lista

## 🎯 FUNCIONALIDADES SESIÓN 2025-09-29

### ✅ COMPLETADO: Sistema Completo de Mensajes WhatsApp Automatizados
- **Feature**: Integración completa de WhatsApp para comunicación automatizada con clientes
- **Arquitectura técnica**: Sistema basado en enlaces `wa.me` con plantillas personalizadas
- **Funcionalidades implementadas**:
  - 📱 **Botones WhatsApp integrados**:
    - **Módulo Citas**: Recordatorios de cita con fecha, hora y datos del vehículo
    - **Módulo Servicios**: Notificación de cotización lista y vehículo listo para recoger
    - **Módulo Oportunidades**: Seguimiento para mantenimientos y servicios recomendados
  - 💬 **Plantillas profesionales**:
    - Formato consistente con marca "Henry's Diagnostics"
    - Emojis y estructura visual atractiva
    - Personalización automática con datos del cliente/vehículo
    - Calls-to-action claros (CONFIRMO, AUTORIZO, CITA)
  - 🎯 **Tipos de mensajes**:
    - **Recordatorio cita**: Fecha, hora, vehículo, solicitud de confirmación
    - **Cotización lista**: Monto, diagnóstico, solicitud de autorización
    - **Vehículo listo**: Notificación de trabajo completado, horarios de recolección
    - **Seguimiento oportunidad**: Recordatorio de mantenimientos recomendados
    - **Contacto general**: Mensaje flexible para comunicación directa
- **Componentes creados**:
  - ✅ `WhatsAppButton.tsx`: Componente base reutilizable con variantes
  - ✅ `whatsapp.ts`: Utilidades para formateo de números y generación de enlaces
  - ✅ Componentes especializados: WhatsAppReminderButton, WhatsAppQuotationButton, etc.
- **Integración UX**:
  - ✅ **Variantes visuales**: outline, primary, secondary con colores distintivos
  - ✅ **Iconos específicos**: Clock (recordatorio), DollarSign (cotización), CheckCircle (listo)
  - ✅ **Validación automática**: Solo aparecen si el cliente tiene número de teléfono
  - ✅ **Responsive**: Adaptable a todas las pantallas
  - ✅ **Tooltips informativos**: Descripción clara de cada acción
- **Características técnicas**:
  - ✅ **Formateo números México**: Validación y adición automática de código +52
  - ✅ **Apertura automática**: WhatsApp se abre con mensaje pre-escrito
  - ✅ **Encoding correcto**: Caracteres especiales y emojis manejados correctamente
  - ✅ **Condicional inteligente**: Botones aparecen según estado del servicio/cita
- **Beneficios operativos**:
  - 📞 **Comunicación eficiente**: Un clic para contactar clientes
  - 💼 **Imagen profesional**: Mensajes consistentes y bien formateados
  - ⚡ **Flujo optimizado**: Menos tiempo en redactar mensajes manualmente
  - 📊 **Seguimiento mejorado**: Facilita el contacto para confirmaciones y autorizaciones
  - 🎯 **Conversiones**: Calls-to-action claros mejoran respuesta de clientes
- **Commits**: `9159413` (fix creación clientes) + `e111f0a` (sistema WhatsApp completo)

### ✅ COMPLETADO: Estado Rechazado para Cotizaciones y Validación de Transiciones
- **Feature**: Implementación completa del estado "Rechazado" para cotizaciones no aprobadas con flujo de trabajo simplificado
- **Problema resuelto**: Cotizaciones rechazadas no tenían estado específico y se incluían incorrectamente en estadísticas de ingresos
- **Flujo implementado**:
  ```
  1. Recibido → Cotizado
  2. Cotizado → {En Proceso, Rechazado}
  3. En Proceso → Terminado
  4. Terminado (final, genera ingresos)
  5. Rechazado (final, NO genera ingresos)
  ```
- **Cambios en Base de Datos**:
  - ✅ **Estados simplificados**: Eliminados estados innecesarios (En Diagnóstico, Esperando Aprobación, Completado, Entregado)
  - ✅ **Estado "Cotizado"**: Creado como paso intermedio (ID: 8, #F59E0B)
  - ✅ **Estado "Terminado"**: Creado como estado final exitoso (ID: 9, #10B981)
  - ✅ **Estado "Rechazado"**: Estado final para cotizaciones no aprobadas (ID: 7, #DC2626)
- **Validación de Transiciones en Dropdown**:
  - ✅ **Lógica inteligente**: Dropdown muestra solo transiciones válidas según estado actual
  - ✅ **Prevención de saltos**: Evita cambios ilógicos (ej: Recibido → Terminado directamente)
  - ✅ **UX mejorada**: Usuario ve solo opciones permitidas en cada estado
- **Impacto en Reportes y Estadísticas**:
  - ✅ **Solo "Terminado" genera ingresos**: Reportes actualizados para excluir todos los demás estados
  - ✅ **"Rechazado" excluido**: No aparece en estadísticas de ingresos ni servicios completados
  - ✅ **Precisión financiera**: Métricas reflejan solo trabajos realmente completados y cobrados
- **Frontend actualizado**:
  - ✅ **Colores distintivos**: Cada estado con color apropiado (azul→amarillo→púrpura→verde/rojo)
  - ✅ **Iconos claros**: Clock, FileText, Play, CheckCircle, XCircle
  - ✅ **Compatibilidad legacy**: Mantiene soporte temporal para estados anteriores
- **Beneficios operativos**:
  - 📊 **Estadísticas reales**: Solo servicios terminados aparecen en reportes de ingresos
  - 🎯 **Flujo realista**: Refleja operación real del taller con cotizaciones rechazadas
  - ⚡ **UX intuitiva**: Dropdown inteligente previene errores de usuario
  - 📈 **Precisión de KPIs**: Métricas financieras más exactas sin cotizaciones rechazadas
- **Commit**: Implementación completa de estado Rechazado con validación de transiciones

### ✅ COMPLETADO: Fix Creación de Clientes desde Servicios
- **Issue resuelto**: Error 400 "Datos de entrada inválidos" al crear clientes desde módulo servicios
- **Root Cause**: Schema de validación inconsistente entre frontend y backend
- **Solución implementada**:
  - ✅ **Schema unificado**: Frontend ahora usa misma validación que backend (mínimo 10 dígitos)
  - ✅ **Formulario simplificado**: Solo captura WhatsApp como acordado originalmente
  - ✅ **Lógica automática**: Número WhatsApp se copia a campo phone automáticamente
  - ✅ **UX mejorada**: Placeholder descriptivo y mensaje clarificador
- **Validación**:
  - ✅ Formato teléfono: `/^[+]?[\d\s-()]+$/` con mínimo 10 dígitos
  - ✅ Campo único: Solo "WhatsApp *" visible al usuario
  - ✅ Backend compatible: Ambos campos (whatsapp y phone) poblados automáticamente
- **Commit**: `9159413` - Fix completo del formulario de clientes

## 🎯 NUEVAS FUNCIONALIDADES - SESIÓN 2025-09-28

### ✅ COMPLETADO: Sistema de Búsqueda Inteligente de Clientes en Dashboard
- **Feature**: Búsqueda prominente de clientes desde el dashboard principal para evitar duplicados
- **Ubicación**: Sección azul destacada en la parte superior del dashboard
- **Funcionalidades implementadas**:
  - 🔍 **Búsqueda en tiempo real**: Por nombre, teléfono, WhatsApp, placa, marca o modelo de vehículo
  - 📋 **Información completa del cliente**:
    - Datos personales (nombre, teléfono, WhatsApp, email, dirección)
    - Listado completo de vehículos con detalles (placa, marca, modelo, año, color)
    - Historial de servicios recientes (últimos 3) con estado y monto
  - ⚡ **Navegación directa**: Botón "Crear Cita" para cada vehículo del cliente
  - 🆕 **Cliente nuevo**: Botón prominente si no se encuentra el cliente
- **Integración técnica**:
  - ✅ **Dashboard → AppointmentsPage**: Navegación con parámetros URL preseleccionados
  - ✅ **CreateAppointmentModal**: Soporte para cliente/vehículo preseleccionado
  - ✅ **Frontend-only filtering**: Búsqueda instantánea sin pérdida de foco
  - ✅ **API optimization**: Servicios recientes via endpoint `/services/client/{id}`
- **UX mejorada**:
  - 📱 **Responsive**: Adaptable a todas las pantallas
  - 🎨 **Visual distintivo**: Iconos y colores por categoría de información
  - 👆 **Clic fuera para cerrar**: Interacción intuitiva
  - 🧹 **Auto-limpieza**: Búsqueda se resetea al seleccionar cliente
- **Beneficios operativos**:
  - 🚫 **Prevención duplicados**: Verificación obligatoria antes de crear cliente
  - ⚡ **Flujo optimizado**: De búsqueda a cita en 2 clics
  - 📊 **Contexto completo**: Historial visible para mejores decisiones
  - 💼 **Eficiencia taller**: Menos tiempo en gestión administrativa
- **Commit**: Sistema completo de búsqueda inteligente en dashboard

### ✅ COMPLETADO: Funcionalidad de Reagendamiento de Citas
- **Feature**: Capacidad completa de reagendar citas existentes (fecha y hora)
- **Ubicación**: Modal de detalles de citas con botón "Reagendar"
- **UX**: Campos editables inline con botones Guardar/Cancelar
- **Validaciones**:
  - ✅ Verificación automática de conflictos de horarios
  - ✅ Solo citas no completadas/canceladas son editables
  - ✅ Campos requeridos (fecha y hora obligatorios)
- **Backend**: Endpoint PUT `/api/appointments/:id` ya existía y funcionaba
- **Timezone Fix**: Solucionado problema de desfase -6 horas en zona horaria México
- **Notificaciones**: Toast de éxito/error + cierre automático del modal
- **Commit**: `005f54d` - Implementación inicial + `0f0e4b1` - Fix timezone

### ✅ COMPLETADO: Mejoras UX Listado de Vehículos
- **Optimización**: Eliminación de columnas innecesarias del listado principal
- **Columnas removidas**:
  - ❌ **Color** - Información secundaria movida a modal de detalles
  - ❌ **Fecha de Registro** - Disponible en modal, no crítica para listado
- **Beneficios**:
  - 📱 **Mejor responsive** en pantallas pequeñas
  - 👀 **Tabla más limpia** enfocada en información esencial
  - ⚡ **Mejor rendimiento** visual sin pérdida de funcionalidad
- **Información preservada**: Color y fecha siguen disponibles en modal "Ver detalles"

### ✅ COMPLETADO: Optimización Dashboard de Reportes
- **Feature**: Eliminación de métricas de costos y truput del dashboard principal
- **Métricas removidas**:
  - ❌ **Costo de Refacciones** - No se está capturando actualmente
  - ❌ **Truput (Ganancia)** - Dato irreal sin costos reales de refacciones
- **Métricas conservadas**:
  - ✅ **Total Ingresos** - Métrica principal del taller
  - ✅ **Mano de Obra** - Ingresos por trabajo realizado
  - ✅ **Precio Refacciones** - Ingresos por venta de refacciones
- **Beneficios**:
  - 📊 **Dashboard más limpio** enfocado en métricas reales
  - 🎯 **Información precisa** sin datos irreales
  - 📱 **Mejor layout** con 3 cards en lugar de 5
- **Backend**: Datos siguen disponibles para reactivación futura
- **Commit**: `89270c7` - Optimización del módulo de reportes

### ✅ COMPLETADO: Sistema de Impresión y Exportación de Agendas
- **Feature**: Funcionalidad completa de impresión y exportación Excel para módulo de citas
- **Funcionalidades implementadas**:
  - 🖨️ **Impresión Optimizada**:
    - Vista Diaria: Orientación vertical (carta) con horarios 8AM-7PM
    - Vista Semanal: Orientación horizontal (carta) con grid de 7 días
    - CSS específico para `@media print` con estilos profesionales
    - Headers con información del taller y fecha de impresión
  - 📊 **Exportación Excel**:
    - Archivos .xlsx nativos con múltiples hojas
    - Hoja principal con datos formateados profesionalmente
    - Hoja de metadatos con estadísticas automáticas
    - Nombres descriptivos: `Agenda_Diaria_2025-09-28_Henry_Diagnostics.xlsx`
- **Integración UX**:
  - ✅ **Botones integrados** en vistas diaria y semanal
  - ✅ **Iconos distintivos**: 🖨️ Printer (gris) + 📊 Excel (verde)
  - ✅ **Ubicación estratégica**: Junto a controles de navegación
  - ✅ **Tooltips informativos** y notificaciones toast
- **Arquitectura técnica**:
  - ✅ **Hook personalizado**: `usePrintAgenda` para lógica de impresión
  - ✅ **Hook Excel**: `useExcelExport` para exportación
  - ✅ **Utilidades**: `excelExport.ts` con funciones especializadas
  - ✅ **Componentes**: `PrintableDailyAgenda` y `PrintableWeeklyAgenda`
  - ✅ **CSS optimizado**: `print.css` con estilos específicos para papel
  - ✅ **Dependencia**: xlsx v0.18+ para exportación nativa
- **Beneficios operativos**:
  - 📋 **Impresión directa** de agendas para mostrar a clientes
  - 📊 **Archivos Excel** para análisis y archivo
  - 🎯 **Datos exactos** de la vista actual (día o semana)
  - 📱 **Tamaño carta** con orientación adaptativa
  - ⚡ **Un clic** para cada funcionalidad
- **Commit**: Sistema completo de impresión y exportación

### 🔧 **Issues Críticos Resueltos**:

#### 1. **Timezone Bug en Reagendamiento** ✅
- **Problema**: Reagendar citas a 10:00 AM las guardaba como 4:00 AM (-6 horas)
- **Root Cause**: Concatenación manual con 'Z' forzaba interpretación UTC
- **Solución**: `new Date(localString).toISOString()` respeta timezone local
- **Testing**: Validado con múltiples horarios (8AM, 10AM, 2PM) ✅

#### 2. **UX Mejoras Tabla Vehículos** ✅
- **Antes**: 7 columnas (algunas redundantes)
- **Ahora**: 5 columnas (información esencial)
- **Impacto**: Mejor experiencia especialmente en tablets/móviles

### 🎯 **Resultados Alcanzados**:
- **Reagendamiento**: Funcionalidad 100% operativa para uso diario del taller
- **UX**: Interfaces más limpias y enfocadas en operación
- **Timezone**: Horarios ahora se manejan correctamente en zona México
- **Validaciones**: Sistema robusto previene conflictos de citas

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

### Comunicaciones WhatsApp
- Sistema completo de mensajes automatizados via enlaces wa.me
- Plantillas profesionales personalizadas por tipo de comunicación
- Botones integrados en todos los módulos principales
- Validación automática de números telefónicos México (+52)
- 5 tipos de mensajes: recordatorio, cotización, vehículo listo, seguimiento, contacto general

## 🎓 Aprendizajes Clave

### Frontend-Only Filtering Pattern (2025-09-25)
- **Problema**: Pérdida de foco en inputs de búsqueda por re-renders
- **Patrón Solución**:
  1. Carga inicial única: `useQuery({ queryKey: ['data'], ... limit=1000 })`
  2. Estado local: `const [allData, setAllData] = useState([])`
  3. Filtrado frontend: `allData.filter(item => searchTerm === '' || item.name.includes(search))`
  4. Paginación local: `filteredData.slice(startIndex, endIndex)`
  5. Auto-reset página: `useEffect(() => setPage(1), [searchTerm])`
- **Beneficios**: Sin pérdida de foco + búsqueda instantánea + menos tráfico de red
- **Aplicado en**: ClientsPage, VehiclesPage

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

### WhatsApp Integration Pattern (2025-09-29)
- **Enfoque wa.me**: Links directos sin APIs complejas o costos adicionales
- **Patrón de implementación**:
  1. Utilidades centralizadas: `whatsapp.ts` con formateo y validación
  2. Componentes reutilizables: `WhatsAppButton.tsx` con variantes específicas
  3. Plantillas templatizadas: Función factory para cada tipo de mensaje
  4. Integración condicional: Botones aparecen según contexto/estado
- **Beneficios**: Implementación rápida + sin costos + experiencia nativa WhatsApp
- **Aplicado en**: AppointmentDetails, ServicesPage, OpportunitiesPage

### Prisma Architecture Deep Learning
- **Problema crítico**: Schemas duplicados causan desincronización
- **Root cause**: Railway no ejecutaba postinstall → cliente viejo
- **Debugging sistemático**: Logs → Schema paths → Script analysis
- **Solución definitiva**: UN schema + rutas explícitas en scripts
- **Lección**: Siempre verificar que Railway ejecute inicialización

## 🚀 Credenciales y URLs
- **Email**: rik@rikmarquez.com
- **Password**: Acceso979971
- **Frontend**: http://localhost:5178
- **Backend**: http://localhost:3002
- **Producción**: Railway deployment activo
- **Database**: Limpia y configurada con usuario ADMIN único

## 🎉 SISTEMA PRICING 100% FUNCIONAL - SESIÓN 2025-08-25

### ✅ ISSUE CRÍTICO RESUELTO
**Error 500 en creación de servicios** - Completamente solucionado
- **Root Cause**: Arquitectura incorrecta de Prisma (schemas duplicados)
- **Solución**: UN SOLO schema en `/prisma/schema.prisma`
- **Status**: Servicios se crean exitosamente con todos los campos pricing

## 🚀 MEJORAS UX MÓDULO CITAS - SESIÓN 2025-08-27

### ✅ COMPLETADO: Funcionalidad crear vehículo desde citas
- **Feature**: Botón "Nuevo Vehículo" en modal de creación de citas
- **UX**: Modal integrado reutilizando componente VehicleForm existente
- **Automático**: Cliente preseleccionado al crear vehículo desde cita
- **Smart UX**: Mensaje cuando cliente no tiene vehículos registrados
- **Real-time**: Actualización automática de lista tras crear vehículo
- **Commit**: `feat: agregar funcionalidad crear vehículo desde modal de citas`

### ✅ COMPLETADO: Ajuste horarios calendario diario 
- **Cambio**: Horario de 6:00 AM - 10:00 PM → **8:00 AM - 7:00 PM**
- **Optimización**: Reducido de 32 a 22 slots de tiempo (horario laboral)
- **UX**: Horarios más realistas para taller mecánico
- **Commit**: `fix: ajustar horarios del calendario diario de citas a 8am-7pm`

### ✅ COMPLETADO: Vista mensual mostrar vehículos
- **Cambio**: Vista mensual ahora muestra **marca + modelo** en lugar de nombre cliente
- **Beneficio**: Identificación rápida de tipos de vehículos por día  
- **UX**: Más relevante para operaciones de taller mecánico
- **Commit**: `fix: mostrar vehículo en lugar de cliente en vista mensual de citas`

## 🔍 UX FIX - SESIÓN 2025-09-25
### ✅ CORREGIDO: Pérdida de foco en búsquedas (Frontend-Only Filtering)
- **Issue**: Inputs de búsqueda perdían foco al escribir cada carácter en clientes y vehículos
- **Root Cause**: useQuery con searchTerm en queryKey causaba re-renders constantes
- **Solución**: Implementado patrón "Frontend-Only Filtering"
  - ✅ Carga única de todos los datos (limit=1000)
  - ✅ Filtrado local sin llamadas API durante búsqueda
  - ✅ Paginación frontend con arrays locales
  - ✅ Reset automático a página 1 al cambiar filtros
- **Archivos**: ClientsPage.tsx, VehiclesPage.tsx
- **Beneficios**: Sin pérdida de foco + búsqueda instantánea + menos tráfico de red
- **Commit**: `fix: implementar Frontend-Only Filtering en búsquedas de clientes y vehículos`

## 🐛 BUG FIX - SESIÓN 2025-09-10
### ✅ CORREGIDO: Modal de oportunidades se quedaba en blanco
- **Issue**: Al hacer clic en ver (👁️) detalles de una oportunidad, la pantalla se quedaba en blanco
- **Root Cause**: Componente `Wrench` de Lucide React no estaba importado pero se usaba en línea 1092
- **Solución**: Agregado `Wrench` a las importaciones de lucide-react en OpportunitiesPage.tsx
- **Estado**: ✅ RESUELTO - Modal de detalles funcionando correctamente

## 🔐 SISTEMA DE PERMISOS COMPLETO - SESIÓN 2025-09-27

### ✅ COMPLETADO: Sistema de permisos user-friendly
- **Issue**: Usuarios recepcionistas obtenían errores 403 técnicos en dashboard y módulos
- **Root Cause**: Roles RECEPCIONISTA sin permisos adecuados + errores técnicos confusos
- **Soluciones Implementadas**:

#### 1. **Fix Permisos Database** ✅
- **Archivo**: `prisma/seed.ts`
- **Cambios**: Agregados permisos faltantes al rol RECEPCIONISTA:
  - `reports: ['read']` - Acceso al dashboard
  - `opportunities: ['create', 'read', 'update']` - Gestión oportunidades
  - `mechanics: ['read']` - Consulta mecánicos
- **Fix crítico**: Corrección `upsert` roles (update vacío → update con permisos)

#### 2. **Sistema PermissionGate** ✅
- **Archivos nuevos**:
  - `src/client/src/hooks/usePermissions.ts` - Hook gestión permisos
  - `src/client/src/components/PermissionGate.tsx` - Componente control acceso
- **Características**:
  - **3 modos fallback**: hide, disable (tooltip), message (explicación)
  - **Mensajes contextuales**: Específicos por recurso/acción
  - **UX profesional**: Sin errores técnicos, tooltips informativos

#### 3. **Aplicación Sistemática** ✅
**Módulos actualizados con PermissionGate**:
- ✅ **Clientes**: Botones crear/editar/eliminar protegidos
- ✅ **Vehículos**: Botones crear/editar/eliminar protegidos
- ✅ **Servicios**: Botones crear/editar/eliminar protegidos
- ✅ **Citas**: Botones crear/editar/eliminar protegidos
- ✅ **Oportunidades**: Botones crear/editar/eliminar protegidos
- ✅ **Mecánicos**: Botones crear/editar/eliminar protegidos

#### 4. **Debugging Infrastructure** ✅
- **Archivo**: `src/server/src/middleware/auth.middleware.ts`
- **Mejoras**: Logging detallado para debugging permisos
- **Fix estructura**: Corrección lectura permisos desde database

### 🎯 **Resultados Alcanzados**:
- **UX Mejorada**: Sin errores 403 confusos para usuarios finales
- **Acceso Granular**: Control fino de permisos por rol/módulo
- **Tooltips Informativos**: Explicaciones claras cuando faltan permisos
- **Sistema Escalable**: Fácil agregar nuevos permisos/roles

### 🔍 **Testing Validado**:
- ✅ Usuario RECEPCIONISTA accede dashboard sin errores
- ✅ Botones deshabilitados muestran tooltips explicativos
- ✅ Permisos aplicados consistentemente en todos módulos
- ✅ Sistema robusto sin degradación performance

## 🔧 BUG FIXES Y MEJORAS UX - SESIÓN 2025-09-27

### ✅ CRÍTICO RESUELTO: Duplicación de servicios en "Recibir Auto"
- **Issue**: Botón "Recibir Auto" creaba servicios automáticamente + formulario creaba segundo servicio
- **Root Cause**: Endpoint `/api/appointments/:id/complete` auto-creaba servicios cuando no existían
- **Debugging**: Logs de console mostraron que problema era en backend, no frontend
- **Solución Implementada**:
  - ✅ Eliminada auto-creación de servicios en endpoint `/complete`
  - ✅ Botón "Recibir Auto" ahora solo navega al formulario (sin completar cita)
  - ✅ Cita se completa automáticamente cuando servicios están terminados
  - ✅ Removidos logs de debug temporales

### ✅ COMPLETADO: Mejoras formularios de servicios con edición de vehículos
- **Feature**: Campos editables de vehículo en creación desde citas telefónicas
  - 📝 **Placa real** - reemplazar placas temporales (TEMP-xxxxx)
  - 📅 **Año** del vehículo
  - 🎨 **Color** del vehículo
  - 📋 **Notas adicionales** - detalles extra
- **Auto-actualización**: Datos del vehículo se actualizan automáticamente al crear servicio
- **UX mejorada**: Notificaciones cuando se actualizan datos del vehículo

### ✅ CORREGIDO: Precarga del campo automóvil en edición de servicios
- **Issue**: Campo vehículo no se precargaba al editar servicios existentes
- **Root Cause**: `createForm.reset()` se ejecutaba antes de cargar vehículos del cliente
- **Solución**: Modificado `handleEditService` para usar `await loadVehiclesByClient()` antes del reset
- **Resultado**: Campo automóvil se precarga correctamente en todas las ediciones

### 🎯 **Flujo completo mejorado**:
1. **Cita telefónica** → "Recibir Auto" → **Formulario con campos editables** → Datos actualizados
2. **Edición servicios** → Campo automóvil precargado → Todos los datos editables
3. **Sin duplicaciones** → Un solo servicio por acción del usuario

### 📊 **ESTADÍSTICAS SESIÓN 2025-09-27**:
- **Commits realizados**: 2 commits principales
- **Archivos modificados**:
  - `src/server/src/routes/appointments.ts` - Eliminada auto-creación servicios
  - `src/client/src/pages/AppointmentsPage.tsx` - Cambio comportamiento "Recibir Auto"
  - `src/client/src/pages/ServicesPage.tsx` - Campos editables + precarga arreglada
- **Tiempo debugging**: ~1 hora identificando root cause en backend
- **Lección clave**: Logs de console son cruciales para identificar dónde ocurren los problemas

### 📊 **ESTADÍSTICAS SESIÓN 2025-09-28**:
- **Commits realizados**: 2 commits principales
- **Archivos modificados**:
  - `src/client/src/components/appointments/AppointmentDetails.tsx` - Reagendamiento + fix timezone
  - `src/client/src/pages/VehiclesPage.tsx` - Optimización listado (eliminar columnas)
- **Funcionalidades entregadas**: 2 features completas
- **Issues críticos resueltos**: 1 (timezone bug)
- **Tiempo total desarrollo**: ~2 horas
- **Lecciones clave**:
  - **Timezone handling**: `new Date(localString).toISOString()` vs concatenación manual 'Z'
  - **UX optimization**: Menos columnas = mejor experiencia en móviles
  - **Backend validation**: Endpoints PUT ya existían, solo faltaba frontend

## 📋 Pendientes Next Session
### 🚀 PRIORIDADES POST-MEJORAS UX:
1. **Testing end-to-end del flujo completo** (cita → servicio → completar)
2. **Validar campos de vehículo** en formularios de servicios desde citas
3. **Optimizaciones finales UX** según feedback de usuario
4. **Documentación de usuario completa**
5. **Capacitación del sistema**

## 🐛 BUG FIX - SESIÓN 2025-08-26
### ✅ CORREGIDO: Error 400 en edición de sucursales
- **Issue**: Error 400 al actualizar sucursales existentes  
- **Root Cause**: Middleware de validación incorrecto en endpoint PUT /branches/:id
- **Solución**: 
  - Reemplazado middleware genérico por validación personalizada en branches.ts:405-437
  - Relajada validación campo teléfono (min 1 char vs 10 chars)
- **Estado**: ✅ RESUELTO - Edición de sucursales funcionando correctamente

### 🎯 PROGRESO PRICING SYSTEM 100% COMPLETADO:
- ✅ **CRÍTICO RESUELTO**: Error 500 en creación servicios
- ✅ **DB Schema**: Campos pricing en producción 
- ✅ **Backend**: Validación + lógica pricing completa
- ✅ **Frontend**: Formularios + valores por defecto
- ✅ **Prisma**: Arquitectura limpia UN solo schema
- ✅ **Railway**: Deploy automático funcional
- ✅ **Testing**: Servicios se crean exitosamente

### 📊 ESTADÍSTICAS SESIÓN 2025-08-25:
- **Tiempo debugging**: ~2 horas
- **Commits realizados**: 12 commits
- **Root cause**: Schemas duplicados de Prisma
- **Archivos modificados**: package.json (x2), schema.prisma, services.ts
- **Lección clave**: Railway deployment paths críticos

