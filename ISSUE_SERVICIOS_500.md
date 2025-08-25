# 🚨 ISSUE CRÍTICO: Error 500 en Creación de Servicios

## 📅 Fecha: 2025-08-25
## 🎯 Estado: PENDIENTE RESOLUCIÓN

---

## 🔍 PROBLEMA IDENTIFICADO

**Error:** `api/services:1 Failed to load resource: the server responded with a status of 500 ()`

**Ubicación:** Formulario de creación de servicios en frontend

**Causa Raíz:** Los campos de pricing (`laborPrice`, `partsPrice`, `partsCost`, `truput`) NO se están creando en la tabla `services` de la base de datos Railway, a pesar de:
- ✅ Schema Prisma correcto con campos de pricing
- ✅ Cliente Prisma regenerado 
- ✅ Deploy exitoso
- ✅ Script manual ejecutado

---

## 🧪 DIAGNÓSTICO REALIZADO

### Lo que funciona:
- ✅ Aplicación se despliega sin errores
- ✅ Dashboard carga correctamente
- ✅ Reportes funcionan con sistema de fallback
- ✅ Otras funcionalidades intactas

### Lo que falla:
- ❌ Creación de servicios = Error 500
- ❌ Campos de pricing no existen en tabla `services` 
- ❌ `npx prisma db push --accept-data-loss` no sincroniza schema

### Error específico detectado previamente:
```
Unknown argument `laborPrice`. Available options are marked with ?.
```

---

## 🛠️ SOLUCIÓN IDENTIFICADA (PENDIENTE EJECUCIÓN)

### Paso 1: Verificar campos en pgAdmin
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

### Paso 2: Si faltan campos, ejecutar script completo:
```sql
-- AGREGAR CAMPOS DE PRICING
ALTER TABLE services ADD COLUMN IF NOT EXISTS labor_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE services ADD COLUMN IF NOT EXISTS parts_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE services ADD COLUMN IF NOT EXISTS parts_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE services ADD COLUMN IF NOT EXISTS truput DECIMAL(10,2) NOT NULL DEFAULT 0.00;
```

### Paso 3: Verificar campos creados:
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND column_name IN ('labor_price', 'parts_price', 'parts_cost', 'truput');
```

---

## 📋 INVESTIGACIÓN ADICIONAL REQUERIDA

Si los campos YA EXISTEN pero sigue el error 500:

### 1. Verificar Cliente Prisma en Railway
- Railway puede no estar regenerando el cliente Prisma correctamente
- Verificar logs de deploy de Railway
- Posible need de forzar regeneración

### 2. Verificar Validación Zod
Revisar: `src/shared/schemas/service.schema.ts`
- Confirmar que createServiceSchema incluye campos de pricing
- Verificar que tipos coinciden con Prisma schema

### 3. Verificar Backend Service Route
Revisar: `src/server/src/routes/services.ts`
- Confirmar que CREATE endpoint maneja campos de pricing
- Verificar cálculos automáticos funcionan correctamente
- Revisar logs de backend para error específico

### 4. Alternative: Regenerar Prisma en Railway
Si campos existen pero cliente no los reconoce:
```bash
# Ejecutar en Railway CLI o deploy hook
npx prisma generate --force
```

---

## 🎯 PLAN DE ACCIÓN PRÓXIMA SESIÓN

### Prioridad 1: Database Fix
1. Conectar pgAdmin a Railway
2. Verificar existencia de campos pricing en tabla services
3. Ejecutar script manual si faltan campos
4. Probar creación servicio inmediatamente

### Prioridad 2: Si campos existen pero persiste error
1. Revisar logs específicos de Railway backend
2. Verificar que cliente Prisma fue regenerado en Railway
3. Forzar regeneración si es necesario
4. Verificar schemas Zod en frontend/backend

### Prioridad 3: Validación completa
1. Probar creación servicio en Railway deployed
2. Probar edición servicio con pricing fields
3. Verificar reportes con datos reales
4. Confirmar dashboard funcionando correctamente

---

## 📁 ARCHIVOS RELEVANTES

### Schema & Database
- `prisma/schema.prisma` - ✅ Schema correcto con pricing fields
- `fix_pricing_fields.sql` - Script manual para Railway

### Backend
- `src/server/src/routes/services.ts` - Service creation endpoint
- `src/shared/schemas/service.schema.ts` - Validation schemas
- `src/server/src/config/config.ts` - Server configuration

### Frontend  
- `src/client/src/pages/ServicesPage.tsx` - Service creation form

---

## 🔄 COMMITS RELACIONADOS
- `b0dfd82` - fix: corregir seed file y regenerar cliente Prisma con campos de pricing
- `a4b10bc` - redeploy: forzar sincronización de schema con campos de pricing
- `420525e` - feat: simplificar formulario de creación de servicios

---

## ⚡ SOLUCIÓN RÁPIDA TEMPORAL
Si urge funcionalidad, remover temporalmente campos pricing del create:
```typescript
// En service.schema.ts - quitar pricing fields de createServiceSchema
// Permitiría crear servicios básicos mientras se resuelve DB issue
```

---

**💡 Nota:** El sistema tiene fallbacks implementados, por lo que otras funcionalidades siguen operativas. Solo la creación de servicios está afectada por este issue específico.