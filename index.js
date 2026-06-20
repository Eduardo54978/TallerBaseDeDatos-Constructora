const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');

const { connectDB } = require('./src/config/db');

const app = express();
const PORT = 3000;

// Archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares generales
app.use(cors());
app.use(express.json());

// Conexión con la base de datos
connectDB();

// Bitácora: registra automáticamente toda acción de escritura sobre /api.
const { bitacoraMiddleware } = require('./src/middleware/bitacora');
app.use(bitacoraMiddleware);

// Importación de rutas
const empleadosRouter = require('./src/routes/empleados');
const proyectosRouter = require('./src/routes/proyectos');
const materialesRouter = require('./src/routes/materiales');
const contratosRouter = require('./src/routes/contratos');
const proveedoresRouter = require('./src/routes/proveedores');
const inventarioRouter = require('./src/routes/inventario');
const clientesRouter = require('./src/routes/clientes');
const horasRouter = require('./src/routes/registrohoras');
const cotizacionesRouter = require('./src/routes/cotizaciones');
const loginRouter = require('./src/routes/login');
const pagosRouter = require('./src/routes/pagos');
const comprasRouter = require('./src/routes/compras');
const cuotasRouter = require('./src/routes/cuotas');
const empleadoproyectoRouter = require('./src/routes/empleadoproyecto');
const materialproyectoRouter = require('./src/routes/materialproyecto');
const proveedormaterialRouter = require('./src/routes/proveedormaterial');
const bitacoraRouter = require('./src/routes/bitacora');
const dashboardRouter = require('./src/routes/dashboard');
const reportesRouter = require('./src/routes/reportes');

// Registro de rutas
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reportes', reportesRouter);
app.use('/api/bitacora', bitacoraRouter);
app.use('/api/empleadoproyecto', empleadoproyectoRouter);
app.use('/api/materialproyecto', materialproyectoRouter);
app.use('/api/pagos', pagosRouter);
app.use('/api/compras', comprasRouter);
app.use('/api/cuotas', cuotasRouter);
app.use('/api/login', loginRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/horas', horasRouter);
app.use('/api/cotizaciones', cotizacionesRouter);
app.use('/api/empleados', empleadosRouter);
app.use('/api/proyectos', proyectosRouter);
app.use('/api/materiales', materialesRouter);
app.use('/api/contratos', contratosRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/proveedormaterial', proveedormaterialRouter);

// Certificado HTTPS local
const sslOptions = {
    key: fs.readFileSync(
        path.join(__dirname, 'certs', 'localhost-key.pem')
    ),
    cert: fs.readFileSync(
        path.join(__dirname, 'certs', 'localhost.pem')
    )
};

// Inicio del servidor HTTPS
https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`Servidor HTTPS corriendo en https://localhost:${PORT}`);
});


