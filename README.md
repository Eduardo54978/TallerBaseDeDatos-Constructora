# Sistema de Gestión — Constructora

Sistema web para la gestión integral de una empresa constructora: proyectos, materiales, inventario, compras, contratos, clientes, proveedores, recursos humanos, cotizaciones y pagos. Desarrollado como proyecto del Taller de Base de Datos.

> Las observaciones de la docente se encuentran en [`NOTAS_DOCENTE.md`](NOTAS_DOCENTE.md).

## Stack

- **Backend:** Node.js + Express (puerto `3000`)
- **Base de datos:** SQL Server (`mssql`), base `constructora` (puerto `1433`)
- **Frontend:** HTML / CSS / JavaScript estático servido desde `public/`
- **Entry point:** `index.js`

## Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior
- SQL Server en ejecución (local o en Docker) accesible en `127.0.0.1:1433`

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Eduardo54978/TallerBaseDeDatos-Constructora.git
cd TallerBaseDeDatos-Constructora

# 2. Instalar dependencias
npm install
```

## Configuración de la base de datos

La conexión se define en [`src/config/db.js`](src/config/db.js):

```js
const config = {
  user: 'sa',
  password: 'Constructora2026!',
  server: '127.0.0.1',
  port: 1433,
  database: 'constructora',
  options: { encrypt: false, trustServerCertificate: true }
};
```

Ajusta usuario/contraseña/servidor según tu entorno.

### Crear el esquema

Ejecuta los scripts SQL en este orden sobre tu instancia de SQL Server:

1. **`42Tablas.sql`** — crea la base `constructora` y todas las tablas.
2. Migraciones incrementales (sobre una BD ya existente, son idempotentes):
   - `AlterCotizacionClienteGenerada.sql` — vincula la cotización cliente con la interna de origen y guarda el porcentaje de utilidad.
   - `AlterManoObraPagoPorHora.sql` — agrega el pago por hora editable por línea de mano de obra.

> Si creas la base desde cero con `42Tablas.sql` actualizado, las columnas de las migraciones ya vienen incluidas.

## Ejecución

```bash
npm run dev    # desarrollo, con recarga automática (nodemon)
npm start      # producción
```

La aplicación queda disponible en **http://localhost:3000**.

## Módulos

| Carpeta | Módulo | API |
|---|---|---|
| `public/login/` | Login y control de sesión por rol | `/api/login` |
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
| `public/movimientos/` | Bitácora / registro de movimientos | `/api/bitacora` |

## Autenticación y roles

- El login (`POST /api/login`) guarda la sesión en `localStorage`.
- [`public/js/auth.js`](public/js/auth.js) controla la sesión y arma el menú según el rol.
- Roles disponibles: `rol_gerente`, `rol_contador`, `rol_jefe_obra`, `rol_rrhh`, `rol_secretaria`, `rol_logistica`, `rol_consulta`.

## Bitácora

Toda acción de escritura sobre `/api` se registra automáticamente mediante el middleware [`src/middleware/bitacora.js`](src/middleware/bitacora.js) y puede consultarse en el módulo de Movimientos.

## Estructura del proyecto

```
.
├── index.js                 # Servidor Express y registro de rutas
├── 42Tablas.sql             # Esquema completo de la base de datos
├── Alter*.sql               # Migraciones incrementales
├── src/
│   ├── config/              # Conexión a BD y manejo de errores SQL
│   ├── middleware/          # Bitácora de movimientos
│   └── routes/              # Endpoints por módulo
└── public/                  # Frontend estático (un directorio por módulo)
```

## Scripts npm

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia con nodemon (recarga en caliente) |
| `npm start` | Inicia el servidor |
| `npm test` | Ejecuta las pruebas de integración |
