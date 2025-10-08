# APRENDIZAJES.md - Lecciones Técnicas Henry Diagnostics

## 📚 Propósito
Este documento contiene **lecciones técnicas críticas** aprendidas durante el desarrollo del proyecto Henry Diagnostics. Cada aprendizaje está documentado con el problema, la causa raíz, la solución y la lección aprendida.

---

## 🚨 REGLAS CRÍTICAS RAILWAY DEPLOYMENT

### 1. Arquitectura Shared - Imports en Frontend
**REGLA DE ORO**: Frontend NO puede importar runtime values de `shared/` durante build

**✅ PERMITIDO**:
```typescript
import type { TypeName } from '../../../shared/schemas/...'
```

**❌ PROHIBIDO**:
```typescript
import { schemaName } from '../../../shared/schemas/...'
```

**Razón**:
- Vite no puede resolver imports de módulos TypeScript compilados
- `shared/schemas` se compila a JavaScript solo en backend
- Frontend no tiene acceso a archivos compilados .js durante build

**Solución**:
- Duplicar schemas de validación Zod en componentes de formulario
- Ver ejemplos: `ClientForm.tsx`, `VehicleForm.tsx`

**Commit**: `cdf0e34` - fix: mover schema de recepción a validación local

---

### 2. CSS @import Order
**REGLA**: `@import` SIEMPRE debe ir primero en archivos CSS

**Orden correcto en `index.css`**:
```css
/* 1. IMPORTS primero */
@import './styles/print.css';

/* 2. Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 3. Layers y resto de CSS */
@layer components { ... }
```

**Error común**: Poner `@import` después de `@tailwind` → Build failure

**Commit**: `e59c2bb` - fix: corregir imports CSS

---

### 3. Verificar Dependencias Instaladas
**Problema**: Importar bibliotecas no instaladas causa errores en build

**Método preventivo**:
1. Revisar `package.json` ANTES de agregar imports
2. Usar `Grep` para encontrar patrones del proyecto
3. Seguir convenciones existentes

**Ejemplo real**:
- ❌ `import { toast } from 'sonner'` (no instalado)
- ✅ `import toast from 'react-hot-toast'` (instalado en proyecto)

**Commit**: `e59c2bb` - fix: corregir imports toast

---

### 4. Rutas de Imports del Proyecto
**Convenciones establecidas**:
- API imports: `../services/api` (NO `../lib/api`)
- Form schemas: Definir localmente en componentes
- Toast library: `react-hot-toast` (NO `sonner`)

**Método**: Grep proyecto para encontrar patrón correcto antes de importar

**Commit**: `bab88b3` - fix: corregir ruta de import de api

---

### 5. Debugging Sistemático Railway
**Proceso recomendado**:
1. Leer log completo de error de Railway
2. Identificar archivo y línea exacta
3. Grep proyecto para encontrar patrón correcto
4. Aplicar fix incremental
5. Commit → Push → Verificar próximo error
6. **Un error a la vez** - NO múltiples cambios simultáneos

---

## 🐛 BUGS CRÍTICOS Y SOLUCIONES

### Bug 1: React Hook Form - Validación Silenciosa
**Síntoma**: Click en botón submit no hace nada

**Causa**: `handleSubmit` NO ejecuta `onSubmit` si hay errores de validación Zod

**Solución**:
```typescript
handleSubmit(
  onSubmit,
  (errors) => console.log('Errores:', errors)  // ← CRÍTICO para debugging
)
```

**Lección**: Siempre agregar handler de errores como segundo parámetro

**Commit**: `fffd81a`

---

### Bug 2: Axios Interceptors en Producción
**Síntoma**: Requests sin token en producción (funcionaban en dev)

**Causa**: `api.defaults.headers.common['Authorization']` no persiste en builds
- Webpack/Vite puede crear múltiples instancias del objeto `api`

**Solución**: Interceptor que lee token de localStorage en CADA request
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('henry-auth');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Lección**: No confiar en `defaults.headers`, usar interceptors request

**Commit**: `d13f965`

---

### Bug 3: JWT Payload - req.user.id vs req.user.userId
**Síntoma**: Error 401 "Usuario no autenticado" en endpoint específico

**Causa**: Middleware asigna `req.user.userId` pero endpoint leía `req.user.id`

**Por qué otros módulos funcionaban**: No verificaban userId manualmente

**Solución**: Cambiar `req.user?.id` a `req.user?.userId`

**Lección**:
- Documentar estructura exacta de `req.user` en tipos TypeScript
- Usar tipos estrictos y logging en desarrollo

**Commit**: `5ad02dd`

---

### Bug 4: Zona Horaria UTC vs Local
**Síntoma**: Citas del día no aparecían o mostraban datos incorrectos

**Causa**: Backend usa UTC, frontend usa timezone local del navegador

**Solución**:
- Calcular día actual considerando offset del cliente
- En México: UTC-6 (o UTC-5 en horario de verano)
- Logs deben mostrar AMBAS zonas horarias para debugging

**Lección**: Siempre considerar zonas horarias en filtros de fecha

---

### Bug 5: Permisos y Error 500 vs 403
**Síntoma**: Error 500 en lugar de 403 para permisos faltantes

**Causa**: Permisos faltantes en definición de rol en seed.ts

**Solución**:
- Revisar roles en `seed.ts`
- Verificar que `upsert` tenga `update: { permissions }` no `update: {}`
- Usuario debe cerrar sesión y volver a entrar para JWT actualizado

**Lección**: Debugging sistemático de permisos incluye verificar seed

**Commit**: `825c609` - fix: agregar permiso reports.read

---

## 🔬 TÉCNICAS DE DEBUGGING EFECTIVAS

### Debugging de Errores Silenciosos
**Proceso sistemático**:
1. Agregar logging en `onClick` del botón
2. Agregar logging al inicio de `onSubmit`
3. Agregar handler de errores en `handleSubmit`
4. Agregar logging en interceptor de API
5. Agregar logging en middleware del backend

**Lección**: Logging en cada capa hasta encontrar dónde falla

---

### Verificación de localStorage
**Método**: No confiar solo en el estado de la app

**Comando útil**:
```javascript
localStorage.getItem('henry-auth')
```

**Estructura correcta de Zustand Persist**:
```json
{
  "state": {
    "token": "...",
    "user": {...}
  },
  "version": 0
}
```

**Lección**: Siempre verificar localStorage directamente para debugging

---

### Debugging Frontend-Only Filtering
**Aprendizajes**:
1. **Vista lista como referencia**: Replicar lo que funciona vs crear nueva lógica
2. **Evitar over-engineering**: Filtros automáticos "inteligentes" causan más problemas
3. **User feedback crucial**: Contexto temporal es crítico
4. **Límites realistas**: Considerar volumen operativo real (ej: 15 citas/día)
5. **Console debugging**: Logs temporales esenciales para identificar issue
6. **Frontend-only approach**: Eliminar filtros automáticos simplifica arquitectura

---

## 🔐 SEGURIDAD Y VALIDACIÓN

### Validación de Merge de Datos
**Implementación correcta**:
- Validación de mismo cliente antes de merge
- Respuesta diferenciada según escenario
- Modal de confirmación con comparación visual

**Lección**: Nunca permitir merge automático sin validación y confirmación del usuario

---

### Sistema de Permisos Granular
**Aprendizajes**:
- Definir permisos por recurso y acción: `resource: ['create', 'read', 'update', 'delete']`
- Segregación multi-tenant automática con `branchId` en JWT
- PermissionGate en frontend para ocultar UI no autorizada
- Middleware de autorización en backend para validar permisos

---

## 📊 ARQUITECTURA Y DISEÑO

### Duplicación de Schemas es Necesaria
**Trade-off aceptado**: Mantenibilidad vs compilación exitosa

**Patrón**:
- **Backend**: `src/shared/schemas/service.schema.ts` - Schema completo de Zod
- **Frontend**: Define schema local en componente - Validación UI

**Razón**: Vite no puede resolver imports de módulos compilados durante build

---

### Frontend-Only Filtering
**Patrón recomendado**:
- Cargar 500-1000 registros en memoria
- Filtrado y búsqueda en cliente sin llamadas API
- Paginación local para mejor UX
- Sin pérdida de foco en inputs

**Beneficios**:
- Búsqueda instantánea
- Mejor experiencia de usuario
- Menos carga en servidor

**Límites**: Adecuado para operaciones con volumen moderado

---

### Validación de Transiciones de Estado
**Implementación**:
- Dropdown inteligente muestra solo transiciones válidas
- Prevención de saltos ilógicos
- Validación en backend adicional

**Flujo implementado**:
```
1. Recibido → Cotizado
2. Cotizado → {En Proceso, Rechazado}
3. En Proceso → Terminado
4. Terminado (final, genera ingresos)
5. Rechazado (final, NO genera ingresos)
```

---

## 🎯 MEJORES PRÁCTICAS IDENTIFICADAS

### 1. Convenciones del Proyecto
**Método**: Buscar ejemplos existentes antes de crear nuevos patrones
- API imports: Grep para encontrar patrón correcto
- Form components: Ver componentes similares existentes
- Libraries: Verificar package.json antes de importar

---

### 2. Commits Incrementales
**Práctica recomendada**:
- Un fix a la vez
- Mensajes descriptivos con contexto
- Incluir archivo y línea modificada
- Referencias a issues o síntomas

**Ejemplo**:
```
fix: corregir ruta de import de api en useReception

- Cambiar '../lib/api' a '../services/api'
- Seguir convención del proyecto
- Archivo: src/client/src/hooks/useReception.ts
```

---

### 3. Testing en Producción (Railway)
**Aprendizaje**: Algunos errores solo aparecen en build de producción

**Estrategia**:
- Probar localmente primero (`npm run build`)
- Push incremental a Railway
- Verificar un error a la vez
- Mantener logs en Railway para debugging

---

### 4. Documentación de Aprendizajes
**Este archivo es evidencia de que**:
- Documentar errores ahorra tiempo futuro
- Contexto del problema es tan importante como la solución
- Lecciones aprendidas previenen repetir errores
- Estructura clara facilita búsqueda rápida

---

### 5. Transformación de Datos a Mayúsculas
**⚠️ REGLA OBLIGATORIA PARA TODOS LOS FORMULARIOS**

**Problema identificado**:
- Tablets con autocapitalize generan datos inconsistentes
- Primer carácter mayúscula, resto minúsculas
- Duplicados en BD por capitalización diferente
- Búsquedas y matching de datos problemáticos

**Solución implementada**:
- Transformación automática a mayúsculas antes de enviar al backend
- Usuario escribe normal, conversión transparente
- Consistencia garantizada en base de datos

**Campos que SIEMPRE deben transformarse**:
- **Clientes**: `name`, `email`, `address`
- **Vehículos**: `plate`, `brand`, `model`, `color`, `engineNumber`, `chassisNumber`
- **Observaciones**: Cualquier campo de texto libre relacionado a recepción

**Patrón estándar a seguir**:
```typescript
// En mutationFn o onSubmit, antes del POST/PUT
const payload = {
  ...formData,
  // Campos obligatorios
  fieldName: formData.fieldName.toUpperCase(),
  // Campos opcionales
  optionalField: formData.optionalField?.toUpperCase() || null,
};

await api.post('/endpoint', payload);
```

**Formularios ya implementados** (usar como referencia):
1. `VehicleReceptionForm` - Líneas 106-131
2. `ClientSearchCreate` - Líneas 83-90
3. `VehicleSearchCreate` - Líneas 96-107
4. `ClientForm` - Líneas 84-89, 110-115
5. `VehicleForm` - Líneas 139-149, 169-179

**Beneficios**:
- Elimina duplicados por capitalización
- Mejora búsquedas y filtros
- Datos consistentes en reportes
- Soluciona problema específico de tablets

**Commit de referencia**: `2bac669`

---

## 📈 MÉTRICAS DE SESIONES RELEVANTES

### Sesión MEJORA RECEPCIÓN 2 (2025-10-05)
- **Tiempo total debugging**: ~4 horas
- **Bugs críticos encontrados**: 3
- **Commits realizados**: 10
- **Archivos modificados**: 4
- **Líneas agregadas**: ~280
- **Resultado**: Sistema funcional completo

### Sesión Calendar Fixes (2025-09-28)
- **Tiempo total debugging**: ~3 horas
- **Commits realizados**: 11 iteraciones
- **Archivos modificados**: 3 componentes calendario
- **User interactions**: 8 mensajes feedback crucial
- **Resultado**: Confirmación funcional del usuario

---

## 🧹 MANTENIMIENTO

### Cleanup Periódico Recomendado
- [ ] Remover logs temporales de debugging
- [ ] Consolidar aprendizajes en este archivo
- [ ] Actualizar STATUS.md solo con estado actual
- [ ] Revisar y actualizar ESPECIFICACION.md con cambios arquitectónicos

---

## 📖 REFERENCIAS

### Archivos Relacionados
- `CLAUDE.md` - Instrucciones y memoria del proyecto
- `STATUS.md` - Estado actual del desarrollo
- `ESPECIFICACION.md` - Especificación técnica completa
- `DEPLOYMENT.md` - Guía de deployment Railway

### Commits Clave Referenciados
- `cdf0e34` - Schema import fix (shared → local)
- `e59c2bb` - CSS imports + toast library fix
- `bab88b3` - API path correction
- `fffd81a` - React Hook Form validation
- `d13f965` - Axios interceptor fix
- `5ad02dd` - JWT userId fix
- `825c609` - Permisos reports.read

---

**Última actualización**: 2025-10-07
**Mantenido por**: Claude Code + Rik Marquez
**Propósito**: Evitar repetir errores y acelerar debugging futuro
