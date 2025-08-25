-- ===============================================
-- MIGRACIÓN MANUAL: Agregar campos de pricing a tabla services
-- ===============================================
-- Ejecutar este script en pgAdmin para Railway database
-- Database: henry
-- Schema: public
-- Tabla: services

-- Verificar estructura actual de la tabla
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===============================================
-- STEP 1: Agregar las nuevas columnas de pricing
-- ===============================================

-- 1. Precio Mano de Obra
ALTER TABLE services 
ADD COLUMN labor_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 2. Precio Refacciones (venta)
ALTER TABLE services 
ADD COLUMN parts_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 3. Costo Refacciones (compra/costo real)
ALTER TABLE services 
ADD COLUMN parts_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 4. Truput (Ganancia neta)
ALTER TABLE services 
ADD COLUMN truput DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- ===============================================
-- STEP 2: Verificar que las columnas se crearon
-- ===============================================
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND column_name IN ('labor_price', 'parts_price', 'parts_cost', 'truput');

-- ===============================================
-- STEP 3: Datos de ejemplo para testing (OPCIONAL)
-- ===============================================
-- Solo ejecutar si quieres datos de prueba

-- Actualizar algunos servicios existentes con valores ejemplo
UPDATE services 
SET 
  labor_price = 1500.00,
  parts_price = 800.00, 
  parts_cost = 600.00,
  truput = (labor_price + parts_price - parts_cost)
WHERE id IN (SELECT id FROM services LIMIT 3);

-- ===============================================
-- STEP 4: Verificar datos actualizados
-- ===============================================
SELECT 
  id,
  total_amount,
  labor_price,
  parts_price, 
  parts_cost,
  truput,
  created_at
FROM services 
WHERE labor_price > 0 OR parts_price > 0 OR parts_cost > 0
ORDER BY id DESC
LIMIT 5;

-- ===============================================
-- STEP 5: Información final
-- ===============================================
SELECT 
  COUNT(*) as total_services,
  COUNT(CASE WHEN labor_price > 0 THEN 1 END) as with_labor_price,
  COUNT(CASE WHEN parts_price > 0 THEN 1 END) as with_parts_price,
  COUNT(CASE WHEN parts_cost > 0 THEN 1 END) as with_parts_cost
FROM services;

-- ===============================================
-- NOTAS IMPORTANTES:
-- ===============================================
-- 1. Todos los campos son DECIMAL(10,2) - soporta hasta $99,999,999.99
-- 2. DEFAULT 0.00 - registros existentes tendrán valor 0
-- 3. NOT NULL - garantiza integridad de datos
-- 4. Nombres en snake_case para consistencia con Prisma
-- ===============================================