-- ===============================================
-- SCRIPT DEFINITIVO: Agregar campos de pricing a tabla services
-- ===============================================
-- Ejecutar en pgAdmin Railway database
-- Database: henry
-- Schema: public
-- Tabla: services

-- Verificar estructura actual
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===============================================
-- AGREGAR CAMPOS DE PRICING
-- ===============================================

-- 1. Labor Price (Precio Mano de Obra)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS labor_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 2. Parts Price (Precio Refacciones - venta)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS parts_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 3. Parts Cost (Costo Refacciones - compra)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS parts_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 4. Truput (Ganancia neta)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS truput DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- ===============================================
-- VERIFICAR COLUMNAS CREADAS
-- ===============================================
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND column_name IN ('labor_price', 'parts_price', 'parts_cost', 'truput');

-- ===============================================
-- CONFIRMAR ÉXITO
-- ===============================================
SELECT 'PRICING FIELDS ADDED SUCCESSFULLY' as status;