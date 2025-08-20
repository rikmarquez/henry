# 🚀 DEPLOYMENT.md - Henry Diagnostics

## ⚠️ Railway Deployment Requirements

### 🔴 IMPORTANTE: Railway necesita código precompilado
**Basado en experiencia de despliegues anteriores**

Railway NO ejecuta builds de TypeScript durante el deployment. Debe desplegarse código JavaScript ya compilado.

### 📋 Requerimientos críticos para Railway:

#### 1. **Build antes del deployment**
```bash
# Compilar TypeScript a JavaScript
npm run build

# Verificar que existe la carpeta dist/
ls src/server/dist/
```

#### 2. **Estructura esperada después del build**
```
src/server/
├── dist/           # ✅ REQUERIDO - Código compilado JS
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── services/
├── src/            # Código fuente TS (no se usa en producción)
├── package.json
├── prisma/
└── .env
```

#### 3. **Scripts de package.json configurados correctamente**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",  // ⚠️ Debe apuntar a JS compilado
    "dev": "tsx watch src/server.ts"
  },
  "main": "dist/server.js"  // ⚠️ Entry point en JS compilado
}
```

#### 4. **Variables de entorno en Railway**
- ✅ `DATABASE_URL` - Proporcionada automáticamente por Railway
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET` - Configurar manualmente
- ✅ `JWT_REFRESH_SECRET` - Configurar manualmente
- ✅ Todas las demás variables del `.env`

#### 5. **Archivos que Railway necesita**
- ✅ `package.json` con scripts de build y start
- ✅ `package-lock.json` 
- ✅ Código compilado en `dist/`
- ✅ `prisma/schema.prisma`
- ⚠️ **NO incluir** `node_modules/` (se instala automáticamente)
- ⚠️ **NO incluir** archivos `.env` (usar Railway UI)

### 🔧 Proceso de deployment recomendado:

#### Paso 1: Preparar build local
```bash
# 1. Compilar TypeScript
cd src/server
npm run build

# 2. Verificar que el build funciona
npm start

# 3. Probar endpoints
curl http://localhost:3000/api/health
```

#### Paso 2: Configurar Railway
1. Conectar repositorio GitHub
2. Seleccionar `src/server` como root directory
3. Configurar variables de entorno
4. Railway automáticamente ejecutará:
   ```bash
   npm install
   npm run build  # Si está configurado
   npm start
   ```

#### Paso 3: Post-deployment
```bash
# Railway ejecutará automáticamente:
npx prisma migrate deploy  # Si está en postinstall
npx prisma generate
```

### 🐛 Problemas comunes y soluciones:

#### Error: "Cannot find module './dist/server.js'"
**Causa:** Código TypeScript no compilado
**Solución:** 
```bash
npm run build
git add dist/
git commit -m "Add compiled code for Railway deployment"
```

#### Error: "Prisma client not generated"
**Solución:** Agregar a `package.json`:
```json
{
  "scripts": {
    "postinstall": "npx prisma generate && npx prisma migrate deploy"
  }
}
```

#### Error: "Port already in use"
**Solución:** Railway asigna puerto dinámicamente:
```javascript
const PORT = process.env.PORT || 3000;
```

### 📚 Recursos útiles:
- [Railway Docs - Build Configuration](https://docs.railway.app/deploy/builds)
- [Railway Docs - Environment Variables](https://docs.railway.app/develop/variables)
- [Prisma Railway Guide](https://www.prisma.io/docs/guides/deployment/railway)

### ✅ Checklist de pre-deployment:
- [ ] TypeScript compilado a JavaScript (`dist/` existe)
- [ ] `package.json` tiene script `"start": "node dist/server.js"`
- [ ] Variables de entorno configuradas en Railway UI
- [ ] Prisma schema presente
- [ ] Build local funciona correctamente
- [ ] Endpoints responden correctamente

---
**📝 Nota:** Esta documentación está basada en experiencia real de deployments fallidos por falta de precompilación.

*Última actualización: 2025-08-20*