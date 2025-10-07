# ESPECIFICACION.md - Henry Diagnostics App

## 📚 Propósito
Este documento describe **funcionalidades y módulos del sistema**. Para detalles técnicos (BD, API, deployment), ver `ARQUITECTURA.md`.

---

## 1. Información General
- **Nombre del Taller:** Henry Diagnostics
- **Tipo de Sistema:** Aplicación web responsiva para gestión integral de taller mecánico
- **Plataformas:**
  - Desktop/Tablet: Operación completa del taller
  - Móvil: Interfaz adaptativa para citas + consulta de status (futuro)
- **Estado Actual:** ✅ Sistema 100% funcional con multi-taller implementado

---

## 2. Flujo de Operaciones Implementado ✅

### Proceso Principal:
1. **Cita Telefónica** - Se captura información básica del cliente
2. **Recepción del Vehículo** - Se completan datos y se marca como recibido
3. **Diagnóstico** - Mecánico evalúa el vehículo
4. **Cotización** - Se genera y envía por WhatsApp
5. **Autorización** - Cliente aprueba el trabajo
6. **Proceso de Trabajo** - Ejecución de reparaciones
7. **Finalización y Cobro** - Se termina y cobra el trabajo
8. **Creación de Oportunidades** - Para trabajos futuros/recurrentes
9. **Seguimiento** - Una semana antes de fecha pactada
10. **Nueva Cita desde Oportunidad** - Con datos pre-cargados

### Flujos de Citas:
**Flujo A - Cita Nueva (telefónica):**
- Información mínima: cliente, vehículo (marca/modelo), teléfono, fecha
- Al llegar: se completan datos del vehículo (placa) y proceso normal

**Flujo B - Cita desde Oportunidad:**
- Todos los datos ya disponibles (cliente, vehículo completo con placa)
- Al llegar: directo a "Recibido" sin captura adicional de datos
- Referencia a la oportunidad origen

**Flujo C - Walk-In (sin cita previa):**
- Cliente llega sin cita
- Recepcionista usa flujo de 3 pasos: Cliente → Vehículo → Recepción
- Se crea servicio sin cita asociada

---

## 3. Módulos del Sistema ✅

### 3.1 Módulo de Usuarios y Roles ✅
**Funcionalidades**:
- Sistema multi-sucursal con segregación por `branchId`
- 4 roles implementados: ADMIN, RECEPCIONISTA, RECEPCIONISTA_TALLER, ENCARGADO
- Permisos granulares por recurso y acción
- PermissionGate en frontend para ocultar UI no autorizada
- Middleware de autorización en backend

**Roles principales**:
- **ADMIN**: Acceso completo, gestión de usuarios, roles y sucursales
- **RECEPCIONISTA**: Dashboard, citas, clientes, vehículos, servicios, oportunidades
- **RECEPCIONISTA_TALLER**: Dashboard, recepción, citas (lectura), servicios limitados
- **ENCARGADO**: Similar a recepcionista con más permisos

---

### 3.2 Módulo de Citas ✅
**Funcionalidades implementadas**:
- ✅ Citas nuevas (telefónicas) con información básica
- ✅ Citas desde oportunidades con datos pre-cargados
- ✅ Calendario diario (8:00 AM - 7:00 PM) y vista mensual
- ✅ Creación de vehículos inline desde modal de citas
- ✅ Vista mensual muestra vehículo (marca+modelo) en lugar de cliente
- ✅ Integración completa con workflow de servicios
- ✅ Sistema de impresión y exportación Excel

**Optimización Móvil**:
- ✅ Auto-detección de dispositivo móvil (< 768px)
- ✅ Vista lista por defecto en móvil vs semana en desktop
- ✅ Componentes móviles específicos: MobileAppointmentCard, MobileNavigation
- ✅ Pull-to-refresh nativo
- ✅ Cards expandibles con información jerárquizada
- ✅ Enlaces directos para llamadas telefónicas
- ✅ Acciones rápidas: Confirmar/Cancelar/Recibir desde cards
- ✅ WhatsApp integrado en cada card

---

### 3.3 Módulo de Clientes ✅
**Funcionalidades**:
- ✅ CRUD completo de clientes
- ✅ Frontend-Only Filtering (búsqueda sin pérdida de foco)
- ✅ Información: nombre, teléfono, WhatsApp, email, dirección
- ✅ Historial completo de servicios por cliente
- ✅ Paginación local con límite 1000 registros
- ✅ **GLOBALES**: Disponibles en todas las sucursales
- ✅ Búsqueda inteligente en dashboard para prevenir duplicados

---

### 3.4 Módulo de Vehículos ✅
**Funcionalidades**:
- ✅ CRUD completo de vehículos
- ✅ Frontend-Only Filtering (búsqueda sin pérdida de foco)
- ✅ Campos: placa, marca, modelo, año, color, tipo combustible, transmisión
- ✅ Campos técnicos: número motor, número chasis
- ✅ Cliente propietario con relación cascada
- ✅ Historial completo de servicios
- ✅ Notas especiales por vehículo
- ✅ **GLOBALES**: Vehículos disponibles en todas las sucursales
- ✅ Soporte para placas temporales (TEMP-xxxxx)

---

### 3.5 Módulo de Servicios/Trabajos ✅
**Funcionalidades**:
- ✅ CRUD completo de servicios
- ✅ Sistema de estados con workflow: Recibido → Cotizado → Proceso → Terminado
- ✅ Estado adicional: Rechazado (para cotizaciones no aprobadas)
- ✅ **Movimiento libre entre estados** - Sin restricciones de transición (forward/backward)
- ✅ Vista Kanban con drag & drop entre estados (excluye Rechazado)
- ✅ Vista lista con dropdown de todos los estados disponibles
- ✅ Sistema de pricing completo: labor_price, parts_price, parts_cost, total_amount, truput
- ✅ Mecánico asignado con cálculo automático de comisiones
- ✅ Problema, diagnóstico, cotización detallada
- ✅ Timestamps automáticos (started_at, completed_at)
- ✅ Segregación por sucursal (branchId)
- ✅ Integración con citas y recepción
- ✅ Campos de recepción: kilometraje, combustible, checklist actualizado, firma, fotos

**Estados de Trabajo** (5 estados exactos):
1. **Recibido** (#EF4444 azul) - Vehículo recibido en taller
2. **Cotizado** (#F59E0B amarillo) - Cotización generada
3. **Proceso** (#8B5CF6 morado) - Trabajo en ejecución
4. **Terminado** (#10B981 verde) - Trabajo completado (genera ingresos)
5. **Rechazado** (#DC2626 rojo) - Cotización rechazada (NO genera ingresos)

**IMPORTANTE**:
- NO hay restricciones de transición entre estados
- Dropdown muestra TODOS los estados ordenados por orderIndex
- Usuario puede mover servicios hacia adelante o hacia atrás libremente
- Tabla status_logs eliminada - sin logs de auditoría de estados

---

### 3.6 Módulo de Búsqueda y Consultas ✅
**Funcionalidades**:
- ✅ Frontend-Only Filtering en clientes y vehículos
- ✅ Búsqueda por nombre de cliente
- ✅ Búsqueda por placa de vehículo
- ✅ Búsqueda por marca/modelo del vehículo
- ✅ Búsqueda por teléfono del cliente
- ✅ Filtros por fecha de servicio en dashboard
- ✅ Historial completo por cliente/vehículo
- ✅ Autocompletado inteligente para grandes DBs
- ✅ Sección prominente en dashboard para prevenir duplicados

---

### 3.7 Módulo de Oportunidades ✅
**Funcionalidades**:
- ✅ CRUD completo de oportunidades
- ✅ Tipos: MANTENIMIENTO, TRABAJO_PENDIENTE
- ✅ Fecha de seguimiento (follow_up_date)
- ✅ Estados: pending, contacted, scheduled, closed
- ✅ Conversión directa a citas con datos pre-cargados
- ✅ Referencia bidireccional oportunidad ↔ cita
- ✅ Segregación por sucursal (branchId)
- ✅ Modal de detalles con vista completa
- ✅ WhatsApp integrado para seguimiento

---

### 3.8 Módulo de Recepción de Vehículos ✅
**Estado**: Sistema completo implementado (2025-10-04 + 2025-10-05 + 2025-10-06)

**Funcionalidades con Cita**:
- ✅ Listado de citas del día (zona horaria México UTC-6)
- ✅ Inspección digital completa
- ✅ Checklist visual operativo del taller:
  - Aire acondicionado funcionando
  - Cristales completos sin daños
  - Candado de llanta presente
  - Pertenencias en cajuela verificadas
  - Manijas de puertas funcionando
- ✅ Captura de kilometraje y nivel de combustible
- ✅ Firma digital del cliente (canvas)
- ✅ Observaciones especiales
- ✅ Creación automática de servicio en estado "Recibido"
- ✅ Actualización de cita a status "received"

**Funcionalidades Walk-In (sin cita)**:
- ✅ Botón "Recibir Auto SIN Cita"
- ✅ Flujo de 3 pasos: Cliente → Vehículo → Recepción
- ✅ Búsqueda/creación inline de clientes
- ✅ Búsqueda/creación inline de vehículos
- ✅ Stepper visual con indicadores de progreso
- ✅ Mismo formulario de inspección que con cita

**Actualización de Vehículos**:
- ✅ Campos editables: placa, marca, modelo, año, color
- ✅ Badge naranja para placas temporales (TEMP-xxxxx)
- ✅ Detección automática de placas duplicadas
- ✅ 3 flujos operativos:
  1. Actualización simple (sin conflicto)
  2. Merge mismo cliente (modal confirmación)
  3. Bloqueo cliente diferente (alerta error)
- ✅ Endpoint merge para fusionar vehículos

**Tabs de Visualización**:
- ✅ **Tab Pendientes**: Citas del día sin recibir (status ≠ received/cancelled)
- ✅ **Tab Recibidos**: Servicios recibidos hoy (con o sin cita, cualquier status)
- ✅ Cards muestran: ID servicio, status actual, hora recepción, recepcionista
- ✅ Búsqueda funciona en ambos tabs

**Permisos**:
- Roles: ADMIN, ENCARGADO, RECEPCIONISTA_TALLER
- Permisos: `reception.create`, `reception.read`

---

### 3.9 Módulo de Comisiones ✅ PARCIALMENTE IMPLEMENTADO
**Funcionalidades implementadas**:
- ✅ Registro de mecánicos con porcentaje personalizable
- ✅ Cálculo automático en servicios (mechanic_commission)
- ✅ Segregación por sucursal (branchId)

**Pendiente**:
- ⏳ Reportes detallados de comisiones por período
- ⏳ Estados de pago
- ⏳ Exportación de reportes

---

### 3.10 Sistema de Impresión y Exportación ✅
**Estado**: Funcionalidad completa implementada para módulo de citas

**Características**:
- ✅ Impresión optimizada con CSS específico (@media print)
- ✅ Vista diaria: Orientación vertical carta, horarios 8AM-7PM
- ✅ Vista semanal: Orientación horizontal carta, grid 7 días
- ✅ Exportación Excel: Archivos .xlsx nativos con múltiples hojas
- ✅ Integración UX: Botones integrados en vistas diaria/semanal
- ✅ Arquitectura: Hooks personalizados y componentes especializados
- ✅ Dependencia: xlsx v0.18+

**Beneficio**: Un clic para imprimir/exportar exactamente lo que está en pantalla

---

### 3.11 Sistema de Comunicaciones WhatsApp ✅
**Estado**: Sistema completo implementado (2025-09-29)

**Arquitectura**:
- ✅ Enlaces wa.me con plantillas personalizadas (sin APIs complejas)
- ✅ Integración modular en todos los módulos principales
- ✅ Componente base reutilizable con variantes

**Tipos de Mensajes**:
1. **Recordatorio de citas** - Fecha, hora, vehículo, solicitud de confirmación
2. **Cotización lista** - Monto, diagnóstico, solicitud de autorización
3. **Vehículo listo** - Notificación de trabajo completado
4. **Seguimiento oportunidades** - Recordatorios de mantenimiento
5. **Contacto general** - Comunicación flexible personalizada

**Componentes Técnicos**:
- `WhatsAppButton.tsx` - Componente base reutilizable
- `whatsapp.ts` - Utilidades de formateo y validación
- Componentes especializados por tipo de mensaje

**Características Avanzadas**:
- Validación automática números México (+52)
- Plantillas con marca "Henry's Diagnostics"
- Condicionales inteligentes por estado
- Variantes visuales (outline, primary, secondary)
- Responsive design con tooltips

**Ubicación de Botones**:
- Modal detalles de citas (recordatorios)
- Modal detalles de servicios (cotización/listo)
- Modal detalles de oportunidades (seguimiento)

**Beneficio**: Un clic abre WhatsApp con mensaje profesional pre-escrito

---

### 3.12 Dashboard Principal ✅
**Funcionalidades**:
- ✅ **Búsqueda Inteligente de Clientes** - Sección prominente azul
  - Búsqueda por nombre, teléfono, WhatsApp, placa, marca, modelo
  - Información completa: datos cliente + vehículos + servicios recientes
  - Navegación directa a citas con preselección automática
  - Botón "Crear Cliente Nuevo" si no se encuentra
  - Agregar vehículos inline desde resultados de búsqueda
- ✅ **Resumen del día** - Citas, trabajos en proceso, servicios completados
- ✅ **KPIs con Chart.js** - Ingresos, servicios por estado, productividad mecánicos
- ✅ **Vista Kanban** - Servicios organizados por estado con drag & drop
- ✅ **Formato mexicano** - MXN, fechas es-MX
- ✅ **Filtrado por sucursal** - Datos segregados automáticamente
- ✅ **Gráficos interactivos** - Estadísticas visuales en tiempo real

---

### 3.13 Módulo Móvil para Propietarios ⏳ NO IMPLEMENTADO
**Estado**: Fase futura de desarrollo

**Pendiente**:
- ⏳ API móvil específica
- ⏳ Autenticación por teléfono
- ⏳ Consulta de status
- ⏳ Notificaciones push
- ⏳ Interface móvil optimizada

---

## 4. Características Técnicas Clave

### Autenticación y Seguridad ✅
- JWT con refresh tokens + branchId para multi-taller
- Bcrypt para hash de passwords (12 salt rounds)
- Validación de datos con Zod (frontend y backend)
- Sistema de permisos granular con PermissionGate
- Middleware de autorización por rol/recurso
- CORS configurado para Railway

### Performance ✅
- Frontend-Only Filtering (carga única de 500-1000 registros)
- Lazy loading en componentes React
- Queries optimizadas con Prisma includes
- Paginación local en frontend para mejor UX
- Índices en campos críticos de BD

### Estados y Workflow ✅
- **Movimiento libre entre estados** - Sin restricciones de transición
- Timestamps automáticos (started_at, completed_at)
- Vista Kanban con drag & drop entre estados (excluye Rechazado)
- Dropdown muestra TODOS los estados disponibles
- Sin logs de auditoría de estados (tabla status_logs removida)

---

## 5. Interfaces de Usuario

### 5.1 Desktop/Tablet (Operación Principal)
- Sidebar con navegación principal
- Dashboard con widgets personalizables
- Tablas con paginación, ordenamiento y filtros
- Modales para formularios de creación/edición
- Notificaciones toast para feedback
- Vista Kanban para servicios

### 5.2 Móvil (Citas Adaptativas)
- Auto-detección de dispositivo (< 768px)
- Vista lista optimizada por defecto
- Cards expandibles con información jerárquizada
- Pull-to-refresh para actualizar
- Botones grandes optimizados para dedos
- Enlaces directos para llamadas (tel:)
- WhatsApp integrado en cards

### 5.3 Móvil (Propietarios) - Futuro
- Bottom navigation para funciones principales
- Cards para mostrar vehículos y servicios
- Timeline para seguimiento de estados
- Notificaciones push nativas

---

## 6. Fases de Desarrollo

### Fase 1 - Core (MVP) ✅ COMPLETADA
- Setup Railway monolítico + PostgreSQL
- Autenticación y sistema de usuarios/roles
- CRUD básico: clientes, vehículos, mecánicos
- Sistema de citas con calendario
- Estados de trabajo con workflow
- Dashboard con KPIs

### Fase 2 - Operaciones ✅ COMPLETADA
- Gestión completa de servicios con workflow
- Sistema de transiciones de estado
- Búsqueda unificada
- Sistema de oportunidades
- Logs de auditoría
- Dashboard avanzado con métricas

### Fase 3 - Avanzado ✅ COMPLETADA
- Sistema de comisiones para mecánicos
- Reportes y exportación (PDF/Excel)
- Sistema de comunicaciones WhatsApp
- Recepción de vehículos con/sin cita
- Optimización móvil de citas

### Fase 4 - Futuro ⏳ PENDIENTE
- App móvil para propietarios
- Notificaciones en tiempo real (WebSocket)
- Sistema de notificaciones push
- WhatsApp API avanzado
- Tests automatizados
- Merge automático de clientes duplicados

---

## 7. Consideraciones Operativas

### Backup y Recuperación
- Backups automáticos diarios en Railway
- Export manual de datos críticos
- Procedimientos de recuperación documentados

### Monitoreo
- Logs centralizados en Railway
- Monitoreo de performance con métricas integradas
- Alertas por email para errores críticos
- Health checks automáticos (`/api/health`)

### Escalabilidad
- Arquitectura preparada para crecimiento
- Índices de base de datos optimizados
- Paginación en todas las listas
- Lazy loading para mejor UX
- Frontend-Only Filtering para operaciones moderadas

### Seguridad
- Validación exhaustiva de inputs
- Protección contra SQL injection (usando ORM)
- Rate limiting para prevenir ataques (opcional)
- Logs de seguridad para auditoría
- CORS configurado correctamente

---

## ✅ ESTADO FINAL: SISTEMA 100% FUNCIONAL

**Henry Diagnostics v1.0** - COMPLETAMENTE IMPLEMENTADO
- ✅ **Deployment**: Monolítico en Railway + PostgreSQL ACTIVO
- ✅ **Stack**: React + Node.js + TypeScript + Prisma COMPLETO
- ✅ **Multi-taller**: Arquitectura enterprise implementada
- ✅ **Permisos**: Sistema granular user-friendly
- ✅ **UX avanzado**: Frontend-Only Filtering, Kanban, Chart.js
- ✅ **WhatsApp**: Sistema completo de comunicaciones
- ✅ **Recepción**: Sistema avanzado con walk-in y merge inteligente
- ✅ **Móvil**: Interfaz adaptativa para citas
- ✅ **Exportación**: PDF y Excel integrados

**Última actualización**: 2025-10-06
**Credenciales**: rik@rikmarquez.com / Acceso979971
**Deployment**: https://henry-production.up.railway.app

**🎉 SISTEMA COMPLETAMENTE LISTO PARA PRODUCCIÓN**

---

## 📖 Documentación Relacionada

- **ARQUITECTURA.md** - Detalles técnicos (BD, API, deployment)
- **STATUS.md** - Estado actual y última sesión
- **APRENDIZAJES.md** - Lecciones técnicas y debugging
- **CLAUDE.md** - Memoria del proyecto y protocolo
- **DEPLOYMENT.md** - Guía de deployment Railway
