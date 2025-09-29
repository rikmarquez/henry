-- Migración: Agregar estado "Rechazado" para cotizaciones no aprobadas

-- 1. Insertar el nuevo estado "Rechazado" al final como estado terminal
INSERT INTO work_statuses (name, order_index, color) VALUES ('Rechazado', 5, '#DC2626');

-- Verificar estados finales
-- SELECT id, name, order_index, color FROM work_statuses ORDER BY order_index;

-- Estados resultantes:
-- 1. Recibido (#EF4444)
-- 2. Cotizado (#F59E0B) -> {En Proceso, Rechazado}
-- 3. En Proceso (#8B5CF6) -> Terminado
-- 4. Terminado (#10B981) [ESTADO TERMINAL EXITOSO]
-- 5. Rechazado (#DC2626) [ESTADO TERMINAL SIN INGRESOS] <- NUEVO

-- Flujo de transiciones:
-- Cotizado -> {En Proceso (aprobado), Rechazado (no aprobado)}
-- En Proceso -> Terminado
-- Rechazado = Estado terminal (no genera ingresos)
-- Terminado = Estado terminal (genera ingresos)