# ARQUITECTURA.md - Detalles Técnicos Henry Diagnostics

## 📚 Propósito
Este documento contiene **detalles técnicos de implementación**: base de datos, API endpoints, deployment, configuración y esquemas. Para información funcional de módulos, ver `ESPECIFICACION.md`.

---

## 🗄️ Base de Datos PostgreSQL

### Conexión Railway
```
postgresql://postgres:uFXiUmoRNqxdKctJesvlRiLiOXuWTQac@shortline.proxy.rlwy.net:52806/henry
```

### Diagrama de Relaciones ER

```mermaid
erDiagram
    BRANCHES ||--o{ USERS : assigns
    BRANCHES ||--o{ APPOINTMENTS : schedules
    BRANCHES ||--o{ SERVICES : provides
    BRANCHES ||--o{ OPPORTUNITIES : tracks
    BRANCHES ||--o{ MECHANICS : employs
    BRANCHES ||--o{ SETTINGS : configures

    ROLES ||--o{ USERS : has
    USERS ||--o{ APPOINTMENTS : creates
    USERS ||--o{ SERVICES : creates
    USERS ||--o{ SERVICES : receives_vehicle
    USERS ||--o{ OPPORTUNITIES : creates
    USERS ||--o{ STATUS_LOGS : logs

    CLIENTS ||--o{ VEHICLES : owns
    CLIENTS ||--o{ APPOINTMENTS : schedules
    CLIENTS ||--o{ SERVICES : receives
    CLIENTS ||--o{ OPPORTUNITIES : has

    VEHICLES ||--o{ APPOINTMENTS : scheduled_for
    VEHICLES ||--o{ SERVICES : serviced
    VEHICLES ||--o{ OPPORTUNITIES : related_to

    MECHANICS ||--o{ SERVICES : works_on

    WORK_STATUSES ||--o{ SERVICES : current_status

    APPOINTMENTS ||--o{ SERVICES : generates
    OPPORTUNITIES ||--o{ APPOINTMENTS : creates
    SERVICES ||--o{ OPPORTUNITIES : generates

    BRANCHES {
        int id PK
        string name
        string code UK
        string address
        string phone
        string city
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ROLES {
        int id PK
        string name UK
        json permissions
        timestamp created_at
    }

    USERS {
        int id PK
        string name
        string email UK
        string phone
        string password_hash
        int role_id FK
        int branch_id FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    CLIENTS {
        int id PK
        string name
        string phone
        string whatsapp
        string email
        text address
        timestamp created_at
        timestamp updated_at
    }

    VEHICLES {
        int id PK
        string plate UK
        string brand
        string model
        int year
        string color
        string fuel_type
        string transmission
        string engine_number
        string chassis_number
        int client_id FK
        text notes
        timestamp created_at
        timestamp updated_at
    }

    MECHANICS {
        int id PK
        string name
        string phone
        decimal commission_percentage
        boolean is_active
        int branch_id FK
        timestamp created_at
        timestamp updated_at
    }

    WORK_STATUSES {
        int id PK
        string name
        int order_index
        string color
        timestamp created_at
    }

    APPOINTMENTS {
        int id PK
        int client_id FK
        int vehicle_id FK
        int opportunity_id FK
        timestamp scheduled_date
        string status
        text notes
        boolean is_from_opportunity
        int created_by FK
        int branch_id FK
        timestamp created_at
        timestamp updated_at
    }

    SERVICES {
        int id PK
        int appointment_id FK
        int client_id FK
        int vehicle_id FK
        int mechanic_id FK
        int status_id FK
        text problem_description
        text diagnosis
        text quotation_details
        decimal labor_price
        decimal parts_price
        decimal parts_cost
        decimal total_amount
        decimal truput
        decimal mechanic_commission
        int received_by FK
        timestamp received_at
        int kilometraje
        string nivel_combustible
        boolean luces_ok
        boolean llantas_ok
        boolean cristales_ok
        boolean carroceria_ok
        text observaciones_recepcion
        text firma_cliente
        json fotos_recepcion
        timestamp started_at
        timestamp completed_at
        int created_by FK
        int branch_id FK
        timestamp created_at
        timestamp updated_at
    }

    OPPORTUNITIES {
        int id PK
        int client_id FK
        int vehicle_id FK
        int service_id FK
        string type
        text description
        date follow_up_date
        string status
        text notes
        int created_by FK
        int branch_id FK
        timestamp created_at
        timestamp updated_at
    }

    SETTINGS {
        int id PK
        int branch_id FK
        string type
        json data
        timestamp created_at
        timestamp updated_at
    }
```

---

## 📊 Esquema SQL Completo

### Tabla: branches (Multi-Taller)
```sql
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    city VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: roles (Sistema de Permisos)
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) NOT NULL,
    branch_id INTEGER REFERENCES branches(id) DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: clients (GLOBALES)
```sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: vehicles (GLOBALES)
```sql
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER,
    color VARCHAR(30),
    fuel_type VARCHAR(20),
    transmission VARCHAR(20),
    engine_number VARCHAR(50),
    chassis_number VARCHAR(50),
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: mechanics (POR SUCURSAL)
```sql
CREATE TABLE mechanics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    branch_id INTEGER REFERENCES branches(id) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: work_statuses
```sql
CREATE TABLE work_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estados implementados (5 exactos - sin restricciones de transición)
INSERT INTO work_statuses (id, name, order_index, color) VALUES
(1, 'Recibido', 1, '#EF4444'),
(2, 'Cotizado', 2, '#F59E0B'),
(3, 'Proceso', 3, '#8B5CF6'),
(4, 'Terminado', 4, '#10B981'),
(5, 'Rechazado', 5, '#DC2626');

-- IMPORTANTE: Sin restricciones de transición - Movimiento libre entre estados
```

### Tabla: appointments (POR SUCURSAL)
```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(id) NOT NULL,
    opportunity_id INTEGER REFERENCES opportunities(id),
    scheduled_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    is_from_opportunity BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) NOT NULL,
    branch_id INTEGER REFERENCES branches(id) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: services (POR SUCURSAL)
```sql
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    -- Relaciones básicas
    appointment_id INTEGER REFERENCES appointments(id),
    client_id INTEGER REFERENCES clients(id) NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(id) NOT NULL,
    mechanic_id INTEGER REFERENCES mechanics(id),
    status_id INTEGER REFERENCES work_statuses(id) DEFAULT 1,

    -- Descripción del servicio
    problem_description TEXT,
    diagnosis TEXT,
    quotation_details TEXT,

    -- Sistema de pricing
    labor_price DECIMAL(10,2) DEFAULT 0.00,
    parts_price DECIMAL(10,2) DEFAULT 0.00,
    parts_cost DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    truput DECIMAL(10,2) DEFAULT 0.00,
    mechanic_commission DECIMAL(10,2) DEFAULT 0.00,

    -- Campos de recepción de vehículos
    received_by INTEGER REFERENCES users(id),
    received_at TIMESTAMP,
    kilometraje INTEGER,
    nivel_combustible VARCHAR(10),
    aire_acondicionado_ok BOOLEAN DEFAULT true,
    cristales_ok BOOLEAN DEFAULT true,
    candado_llanta_ok BOOLEAN DEFAULT true,
    pertenencias_cajuela_ok BOOLEAN DEFAULT true,
    manijas_ok BOOLEAN DEFAULT true,
    observaciones_recepcion TEXT,
    firma_cliente TEXT,
    fotos_recepcion JSON,

    -- Timestamps
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id) NOT NULL,
    branch_id INTEGER REFERENCES branches(id) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: opportunities (POR SUCURSAL)
```sql
CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(id) NOT NULL,
    service_id INTEGER REFERENCES services(id),
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    follow_up_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_by INTEGER REFERENCES users(id) NOT NULL,
    branch_id INTEGER REFERENCES branches(id) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: status_logs (ELIMINADA 2025-10-06)
```sql
-- NOTA: Esta tabla fue eliminada para permitir movimiento libre entre estados
-- DROP TABLE IF EXISTS status_logs CASCADE; (aplicado en migración 20251006184548)
-- Sin logs de auditoría de cambios de estado
```

### Tabla: settings (POR SUCURSAL)
```sql
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, type)
);
```

### Índices para Performance
```sql
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_client ON vehicles(client_id);
CREATE INDEX idx_services_client ON services(client_id);
CREATE INDEX idx_services_vehicle ON services(vehicle_id);
CREATE INDEX idx_services_status ON services(status_id);
CREATE INDEX idx_services_branch ON services(branch_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_branch ON appointments(branch_id);
CREATE INDEX idx_opportunities_follow_up ON opportunities(follow_up_date);
CREATE INDEX idx_opportunities_branch ON opportunities(branch_id);
CREATE INDEX idx_mechanics_branch ON mechanics(branch_id);
CREATE INDEX idx_users_branch ON users(branch_id);
```

---

## 🔌 API Endpoints Completos

### Autenticación ✅
```
POST /api/auth/login              # Login con email/phone y password
POST /api/auth/logout             # Logout
POST /api/auth/register           # Registrar nuevo usuario (auth requerido)
POST /api/auth/refresh            # Refresh token
POST /api/auth/change-password    # Cambiar contraseña
GET  /api/auth/profile            # Obtener perfil usuario actual
```

### Usuarios y Roles ✅
```
GET    /api/users                 # Listar usuarios (filtrado por branch)
POST   /api/users                 # Crear usuario (permisos: users.create)
GET    /api/users/:id             # Obtener usuario (permisos: users.read)
PUT    /api/users/:id             # Actualizar usuario (permisos: users.update)
PUT    /api/users/:id/password    # Actualizar contraseña (permisos: users.update)
DELETE /api/users/:id             # Eliminar usuario (permisos: users.delete)
GET    /api/users/roles           # Listar roles disponibles
```

### Clientes ✅ (GLOBALES)
```
GET    /api/clients               # Listar clientes con paginación
POST   /api/clients               # Crear cliente
GET    /api/clients/:id           # Obtener cliente con detalles
PUT    /api/clients/:id           # Actualizar cliente
DELETE /api/clients/:id           # Eliminar cliente
POST   /api/clients/:id/activate  # Activar/desactivar cliente
```

### Vehículos ✅ (GLOBALES)
```
GET    /api/vehicles                  # Listar vehículos con paginación
POST   /api/vehicles                  # Crear vehículo
GET    /api/vehicles/:id              # Obtener vehículo con detalles
PUT    /api/vehicles/:id              # Actualizar vehículo
DELETE /api/vehicles/:id              # Eliminar vehículo
POST   /api/vehicles/:id/activate     # Activar/desactivar vehículo
GET    /api/vehicles/by-client/:clientId  # Vehículos de un cliente específico
```

### Citas ✅ (POR SUCURSAL)
```
GET    /api/appointments                      # Listar citas con filtros
POST   /api/appointments                      # Crear cita nueva
POST   /api/appointments/from-opportunity     # Crear cita desde oportunidad
GET    /api/appointments/:id                  # Obtener cita con detalles
PUT    /api/appointments/:id                  # Actualizar/reagendar cita
DELETE /api/appointments/:id                  # Cancelar cita
POST   /api/appointments/:id/confirm          # Confirmar cita
POST   /api/appointments/:id/complete         # Marcar cita como completada
```

### Servicios ✅ (POR SUCURSAL)
```
GET    /api/services                      # Listar servicios con filtros
POST   /api/services                      # Crear servicio
GET    /api/services/:id                  # Obtener servicio con detalles completos
PUT    /api/services/:id                  # Actualizar servicio (info general)
PUT    /api/services/:id/status           # Cambiar estado (con log automático)
DELETE /api/services/:id                  # Eliminar servicio
POST   /api/services/:id/activate         # Activar/desactivar servicio
POST   /api/services/:id/assign-mechanic  # Asignar mecánico a servicio
GET    /api/services/vehicle/:vehicleId   # Historial servicios de un vehículo
GET    /api/services/client/:clientId     # Historial servicios de un cliente
```

### Recepción de Vehículos ✅ (POR SUCURSAL)
```
POST   /api/reception/receive-vehicle     # Recibir vehículo con inspección completa
POST   /api/reception/merge-vehicle       # Fusionar vehículo temporal con existente
GET    /api/reception/today               # Citas del día (pendientes de recibir)
GET    /api/reception/received-today      # Servicios recibidos hoy (con o sin cita)
GET    /api/reception/service/:id         # Detalles completos de servicio recibido
```

### Oportunidades ✅ (POR SUCURSAL)
```
GET    /api/opportunities                 # Listar oportunidades con filtros
POST   /api/opportunities                 # Crear oportunidad manualmente
POST   /api/opportunities/from-service    # Crear oportunidad desde servicio completado
GET    /api/opportunities/:id             # Obtener oportunidad con detalles
PUT    /api/opportunities/:id             # Actualizar oportunidad
DELETE /api/opportunities/:id             # Eliminar oportunidad
POST   /api/opportunities/:id/schedule    # Convertir oportunidad en cita
POST   /api/opportunities/:id/contact     # Marcar como contactada
GET    /api/opportunities/due             # Oportunidades próximas a follow-up
```

### Mecánicos ✅ (POR SUCURSAL)
```
GET    /api/mechanics                     # Listar mecánicos de la sucursal
POST   /api/mechanics                     # Crear mecánico
GET    /api/mechanics/:id                 # Obtener mecánico con estadísticas
PUT    /api/mechanics/:id                 # Actualizar mecánico
DELETE /api/mechanics/:id                 # Eliminar mecánico
POST   /api/mechanics/:id/activate        # Activar/desactivar mecánico
```

### Dashboard y Reportes ✅ (POR SUCURSAL)
```
GET    /api/reports/dashboard             # KPIs completos (ingresos, servicios, gráficos)
```

### Sucursales ✅ (SOLO ADMIN)
```
GET    /api/branches                      # Listar todas las sucursales
GET    /api/branches/active               # Listar solo sucursales activas
POST   /api/branches                      # Crear nueva sucursal
GET    /api/branches/:id                  # Obtener sucursal específica
PUT    /api/branches/:id                  # Actualizar sucursal
DELETE /api/branches/:id                  # Eliminar sucursal
```

### Configuración ✅ (POR SUCURSAL)
```
GET    /api/settings                      # Obtener configuración por branch y type
POST   /api/settings                      # Guardar/actualizar configuración
PUT    /api/settings/:id                  # Actualizar configuración específica
```

### Estados de Trabajo ✅
```
GET    /api/workstatus                    # Listar todos los estados con colores
GET    /api/workstatus/:id                # Obtener estado específico
POST   /api/workstatus                    # Crear estado personalizado
PUT    /api/workstatus/:id                # Actualizar estado
DELETE /api/workstatus/:id                # Eliminar estado

NOTA: Sin restricciones de transición - Movimiento libre entre todos los estados
```

### Logs de Auditoría ❌ (ELIMINADOS 2025-10-06)
```
-- Endpoints removidos - tabla status_logs eliminada
-- Sin logs de auditoría de cambios de estado
```

### Utilidades ✅
```
GET    /api/health                        # Health check
GET    /api/debug                         # Debug completo (DB connection, counts)
```

---

## 🚀 Deployment Railway

### Configuración railway.json
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "healthcheckPath": "/api/health",
  "healthcheckTimeout": 100
}
```

### Scripts package.json (Raíz)
```json
{
  "name": "henry-diagnostics",
  "version": "1.0.0",
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd src/client && npm install && npm run build",
    "build:server": "cd src/server && npm install && npm run build",
    "start": "cd src/server && npm start",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd src/server && npm run dev",
    "dev:client": "cd src/client && npm run dev",
    "postinstall": "cd src/server && npm install && npx prisma generate && npx prisma migrate deploy"
  }
}
```

### Variables de Entorno Railway
```env
# Automáticamente proporcionadas por Railway
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/railway

# Configurar manualmente en Railway Dashboard
NODE_ENV=production
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS y Frontend
ALLOWED_ORIGINS=https://your-app.up.railway.app

# Configuraciones opcionales
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Estructura de Deployment
```
Railway Project: henry-diagnostics
├── Service 1: henry-diagnostics-app (Monolítico)
│   ├── Build: Nixpacks auto-detect
│   ├── Start: npm start
│   ├── Port: 3000
│   ├── Domain: henry-production.up.railway.app
│   └── Environment Variables: [configuradas arriba]
└── Service 2: PostgreSQL
    ├── Auto-managed PostgreSQL 15
    ├── Automatic backups
    ├── Connection string: $DATABASE_URL
    └── Metrics included
```

---

## 📁 Estructura de Carpetas

```
henry/
├── prisma/
│   ├── schema.prisma           # Esquema multi-taller con Branch
│   └── seed.ts                # Datos iniciales completos
├── src/
│   ├── client/                 # Frontend React completo
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/     # Componentes UI (shadcn/ui + móviles)
│   │   │   ├── pages/          # Todas las páginas implementadas
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── context/        # Context API
│   │   │   ├── utils/          # Utilidades
│   │   │   ├── types/          # Tipos TypeScript
│   │   │   ├── App.tsx         # Router principal
│   │   │   └── main.tsx        # Punto de entrada
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── server/                 # Backend Express completo
│   │   ├── src/
│   │   │   ├── routes/         # Todas las rutas implementadas
│   │   │   ├── services/       # Lógica de negocio
│   │   │   ├── middleware/     # Auth, permisos, validación
│   │   │   ├── utils/          # Utilidades backend
│   │   │   ├── app.ts          # App Express configurada
│   │   │   └── server.ts       # Servidor principal
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                 # Tipos compartidos (NO schemas)
├── package.json                # Scripts de build Railway
├── CLAUDE.md                   # Memoria del proyecto
├── STATUS.md                   # Estado actualizado
├── ESPECIFICACION.md           # Funcionalidades y módulos
├── ARQUITECTURA.md             # Este archivo
├── APRENDIZAJES.md             # Lecciones técnicas
└── DEPLOYMENT.md               # Guía de deployment
```

---

## 🔐 Sistema de Permisos

### Estructura de Permisos en JSON
```typescript
{
  "resource": ["action1", "action2", ...]
}
```

### Acciones Disponibles
- `create` - Crear nuevos registros
- `read` - Leer/consultar registros
- `update` - Actualizar registros existentes
- `delete` - Eliminar registros

### Recursos del Sistema
- `users` - Gestión de usuarios
- `clients` - Gestión de clientes
- `vehicles` - Gestión de vehículos
- `appointments` - Gestión de citas
- `services` - Gestión de servicios/trabajos
- `opportunities` - Gestión de oportunidades
- `mechanics` - Gestión de mecánicos
- `branches` - Gestión de sucursales (solo ADMIN)
- `reports` - Acceso a reportes y dashboard
- `reception` - Módulo de recepción de vehículos
- `settings` - Configuración del sistema

### Roles Implementados

**ADMIN**:
```json
{
  "users": ["create", "read", "update", "delete"],
  "clients": ["create", "read", "update", "delete"],
  "vehicles": ["create", "read", "update", "delete"],
  "appointments": ["create", "read", "update", "delete"],
  "services": ["create", "read", "update", "delete"],
  "opportunities": ["create", "read", "update", "delete"],
  "mechanics": ["create", "read", "update", "delete"],
  "branches": ["create", "read", "update", "delete"],
  "reports": ["read"],
  "reception": ["create", "read"]
}
```

**RECEPCIONISTA**:
```json
{
  "clients": ["create", "read", "update"],
  "vehicles": ["create", "read", "update"],
  "appointments": ["create", "read", "update", "delete"],
  "services": ["create", "read", "update"],
  "opportunities": ["create", "read", "update"],
  "mechanics": ["read"],
  "reports": ["read"]
}
```

**RECEPCIONISTA_TALLER**:
```json
{
  "clients": ["create", "read"],
  "vehicles": ["create", "read", "update"],
  "appointments": ["read"],
  "services": ["create", "read", "update"],
  "reception": ["create", "read"],
  "reports": ["read"]
}
```

**ENCARGADO**:
```json
{
  "clients": ["create", "read", "update", "delete"],
  "vehicles": ["create", "read", "update", "delete"],
  "appointments": ["create", "read", "update", "delete"],
  "services": ["create", "read", "update", "delete"],
  "opportunities": ["create", "read", "update", "delete"],
  "mechanics": ["read"],
  "reports": ["read"],
  "reception": ["create", "read"]
}
```

---

## 🛠️ Stack Tecnológico Detallado

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript 5+
- **Build Tool**: Vite 5+
- **Styling**: Tailwind CSS 3+
- **UI Components**: shadcn/ui
- **State Management**: Zustand + React Context
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod
- **Date Handling**: date-fns (locale es-MX)
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Lucide React
- **Toast Notifications**: react-hot-toast
- **Excel Export**: xlsx
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript 5+
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **CORS**: cors middleware
- **Logging**: Custom middleware

### Database
- **DBMS**: PostgreSQL 15+
- **Hosting**: Railway
- **Migrations**: Prisma Migrate
- **Seeding**: Prisma Seed

### DevOps
- **Hosting**: Railway
- **CI/CD**: GitHub integration
- **Monorepo**: Single service deployment
- **Health Checks**: Express endpoints
- **Environment**: dotenv

---

## 📊 Consideraciones de Escalabilidad

### Performance
- Frontend-Only Filtering para búsquedas (500-1000 registros en memoria)
- Índices en campos críticos (plate, phone, name, dates)
- Lazy loading en componentes React
- Queries optimizadas con Prisma includes
- Paginación en endpoints de listado

### Seguridad
- JWT con refresh tokens
- Bcrypt con 12 salt rounds
- Validación Zod en frontend y backend
- CORS configurado para Railway
- Rate limiting (opcional)
- SQL injection prevention (Prisma ORM)

### Backup y Recuperación
- Backups automáticos diarios en Railway
- Export manual de datos críticos
- Procedimientos de recuperación documentados

### Monitoreo
- Logs centralizados en Railway
- Métricas integradas de Railway
- Health checks automáticos (`/api/health`)
- Alertas por email para errores críticos (opcional)

---

**Última actualización**: 2025-10-06
**Mantenido por**: Claude Code + Rik Marquez
**Propósito**: Referencia técnica completa para desarrollo y debugging
