# Pendiente para reunion de equipo

## Problema: ningún endpoint devuelve datos (error mssql v12)

El error que aparecia en todos los módulos:
```
Cannot read properties of undefined (reading 'port')
```

### Causa
`mssql v12` (la versión instalada) cambió la forma de conectarse.
El patrón `sql.connect()` sin argumentos ya no funciona en esta versión.

### Fix listo en rama `manuel`
Se modificaron dos cosas:

**1. `src/config/db.js`** — exporta un `poolPromise` en vez de llamar a `connectDB()`:
```js
// ANTES
const connectDB = async () => { await sql.connect(config); };
module.exports = { sql, connectDB };

// DESPUÉS
const poolPromise = new sql.ConnectionPool(config).connect();
module.exports = { sql, poolPromise };
```

**2. Todos los `src/routes/*.js`** — usan `poolPromise` en vez de `sql.connect()`:
```js
// ANTES
const { sql } = require('../config/db');
const pool = await sql.connect();

// DESPUÉS
const { sql, poolPromise } = require('../config/db');
const pool = await poolPromise;
```

### Archivos afectados (todos los routers)
- src/config/db.js
- src/routes/empleados.js
- src/routes/proyectos.js
- src/routes/materiales.js
- src/routes/contratos.js
- src/routes/proveedores.js
- src/routes/inventario.js
- src/routes/pagos.js
- src/routes/compras.js
- src/routes/cuotas.js
- src/routes/clientes.js
- src/routes/registrohoras.js
- src/routes/cotizaciones.js
- index.js (ya no llama a connectDB)

### Estado
- Fix probado localmente: **funciona** (pagos, cuotas y compras devuelven datos)
- Commit hecho en rama `manuel` pero **NO pusheado** — espera aprobación del equipo
- El commit del fix es: `08439a3`

### Para aplicar el fix en master
Acordar en reunion y hacer merge de rama `manuel` a `master`, o aplicar
el mismo cambio directamente en `master`.
