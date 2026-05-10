const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { connectDB } = require('./src/config/db');

const app  = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

// Conectar a SQL Server
connectDB();

// ← TODAS LAS RUTAS
const empleadosRouter   = require('./src/routes/empleados');
const proyectosRouter   = require('./src/routes/proyectos');
const materialesRouter  = require('./src/routes/materiales');
const contratosRouter   = require('./src/routes/contratos');
const proveedoresRouter = require('./src/routes/proveedores');
const inventarioRouter  = require('./src/routes/inventario');

app.use('/api/empleados',   empleadosRouter);
app.use('/api/proyectos',   proyectosRouter);
app.use('/api/materiales',  materialesRouter);
app.use('/api/contratos',   contratosRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/inventario',  inventarioRouter);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});