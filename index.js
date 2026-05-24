const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { connectDB } = require('./src/config/db');

const app  = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

connectDB();

// Bitácora: registra automáticamente toda acción de escritura sobre /api.
const { bitacoraMiddleware } = require('./src/middleware/bitacora');
app.use(bitacoraMiddleware);

const empleadosRouter   = require('./src/routes/empleados');
const proyectosRouter   = require('./src/routes/proyectos');
const materialesRouter  = require('./src/routes/materiales');
const contratosRouter   = require('./src/routes/contratos');
const proveedoresRouter = require('./src/routes/proveedores');
const inventarioRouter  = require('./src/routes/inventario');
const clientesRouter     = require('./src/routes/clientes');
const horasRouter        = require('./src/routes/registrohoras');
const cotizacionesRouter = require('./src/routes/cotizaciones');
const loginRouter = require('./src/routes/login');
const pagosRouter   = require('./src/routes/pagos');
const comprasRouter = require('./src/routes/compras');
const cuotasRouter  = require('./src/routes/cuotas');
const empleadoproyectoRouter = require('./src/routes/empleadoproyecto');
const materialproyectoRouter = require('./src/routes/materialproyecto');
const proveedormaterialRouter = require('./src/routes/proveedormaterial');
const bitacoraRouter = require('./src/routes/bitacora');
const dashboardRouter = require('./src/routes/dashboard');

app.use('/api/dashboard', dashboardRouter);
app.use('/api/bitacora', bitacoraRouter);
app.use('/api/empleadoproyecto', empleadoproyectoRouter);
app.use('/api/materialproyecto', materialproyectoRouter);
app.use('/api/pagos',   pagosRouter);
app.use('/api/compras', comprasRouter);
app.use('/api/cuotas',  cuotasRouter);
app.use('/api/login', loginRouter);
app.use('/api/clientes',     clientesRouter);
app.use('/api/horas',        horasRouter);
app.use('/api/cotizaciones', cotizacionesRouter);
app.use('/api/empleados',   empleadosRouter);
app.use('/api/proyectos',   proyectosRouter);
app.use('/api/materiales',  materialesRouter);
app.use('/api/contratos',   contratosRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/inventario',  inventarioRouter);
app.use('/api/proveedormaterial', proveedormaterialRouter);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});