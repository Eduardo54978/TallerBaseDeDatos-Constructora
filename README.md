# Sistema de Gesti├│n ÔÇö Constructora

Sistema web para la gesti├│n integral de una empresa constructora: proyectos, materiales, inventario, compras, contratos, clientes, proveedores, recursos humanos, cotizaciones y pagos. Desarrollado como proyecto del Taller de Base de Datos.

> Las observaciones de la docente se encuentran en [`NOTAS_DOCENTE.md`](NOTAS_DOCENTE.md).

## Stack

- **Backend:** Node.js + Express (puerto `3000`)
- **Base de datos:** SQL Server (`mssql`), base `constructora` (puerto `1433`)
- **Frontend:** HTML / CSS / JavaScript est├ítico servido desde `public/`
- **Entry point:** `index.js`

## Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior
- SQL Server en ejecuci├│n (local o en Docker) accesible en `127.0.0.1:1433`

## Instalaci├│n

```bash
# 1. Clonar el repositorio
git clone https://github.com/Eduardo54978/TallerBaseDeDatos-Constructora.git
cd TallerBaseDeDatos-Constructora

# 2. Instalar dependencias
npm install
```

## Configuraci├│n de la base de datos

La conexi├│n se define en [`src/config/db.js`](src/config/db.js):

```js
const config = {
  user: 'TU_USUARIO',          // p. ej. sa
  password: 'TU_CONTRASE├æA',   // la de tu instancia de SQL Server
  server: '127.0.0.1',
  port: 1433,
  database: 'constructora',
  options: { encrypt: false, trustServerCertificate: true }
};
```

Ajusta usuario/contrase├▒a/servidor seg├║n tu entorno. **No subas tus credenciales reales al repositorio.**

### Crear el esquema

Ejecuta los scripts SQL en este orden sobre tu instancia de SQL Server:

1. **`42Tablas.sql`** ÔÇö crea la base `constructora` y todas las tablas.
2. Migraciones incrementales (sobre una BD ya existente, son idempotentes):
   - `AlterCotizacionClienteGenerada.sql` ÔÇö vincula la cotizaci├│n cliente con la interna de origen y guarda el porcentaje de utilidad.
   - `AlterManoObraPagoPorHora.sql` ÔÇö agrega el pago por hora editable por l├¡nea de mano de obra.

> Si creas la base desde cero con `42Tablas.sql` actualizado, las columnas de las migraciones ya vienen incluidas.

## Ejecuci├│n

```bash
npm run dev    # desarrollo, con recarga autom├ítica (nodemon)
npm start      # producci├│n
```

La aplicaci├│n queda disponible en **http://localhost:3000**.

## M├│dulos

| Carpeta | M├│dulo | API |
|---|---|---|
| `public/login/` | Login y control de sesi├│n por rol | `/api/login` |
| `public/index.html` | Dashboard principal | `/api/dashboard` |
| `public/modulo1/` | Proyectos | `/api/proyectos`, `/api/empleadoproyecto` |
| `public/modulo2/` | Materiales | `/api/materiales`, `/api/materialproyecto` |
| `public/modulo3/` | Pagos y Cuotas | `/api/pagos`, `/api/cuotas` |
| `public/modulo4/` | Compras | `/api/compras` |
| `public/modulo5/` | Contratos | `/api/contratos` |
| `public/modulo6/` | Proveedores | `/api/proveedores`, `/api/proveedormaterial` |
| `public/modulo7/` | Clientes | `/api/clientes` |
| `public/modulo8/` | Recursos Humanos | `/api/empleados`, `/api/horas` |
| `public/modulo9/` | Cotizaciones | `/api/cotizaciones` |
| `public/movimientos/` | Bit├ícora / registro de movimientos | `/api/bitacora` |

## Autenticaci├│n y roles

- El login (`POST /api/login`) guarda la sesi├│n en `localStorage`.
- [`public/js/auth.js`](public/js/auth.js) controla la sesi├│n y arma el men├║ seg├║n el rol.
- Roles disponibles: `rol_gerente`, `rol_contador`, `rol_jefe_obra`, `rol_rrhh`, `rol_secretaria`, `rol_logistica`, `rol_consulta`.

## Bit├ícora

Toda acci├│n de escritura sobre `/api` se registra autom├íticamente mediante el middleware [`src/middleware/bitacora.js`](src/middleware/bitacora.js) y puede consultarse en el m├│dulo de Movimientos.

## Estructura del proyecto

```
.
Ôö£ÔöÇÔöÇ index.js                 # Servidor Express y registro de rutas
Ôö£ÔöÇÔöÇ 42Tablas.sql             # Esquema completo de la base de datos
Ôö£ÔöÇÔöÇ Alter*.sql               # Migraciones incrementales
Ôö£ÔöÇÔöÇ src/
Ôöé   Ôö£ÔöÇÔöÇ config/              # Conexi├│n a BD y manejo de errores SQL
Ôöé   Ôö£ÔöÇÔöÇ middleware/          # Bit├ícora de movimientos
Ôöé   ÔööÔöÇÔöÇ routes/              # Endpoints por m├│dulo
ÔööÔöÇÔöÇ public/                  # Frontend est├ítico (un directorio por m├│dulo)
```

## Scripts npm

| Comando | Descripci├│n |
|---|---|
| `npm run dev` | Inicia con nodemon (recarga en caliente) |
| `npm start` | Inicia el servidor |
| `npm test` | Ejecuta las pruebas de integraci├│n |
