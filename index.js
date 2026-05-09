const express = require('express');
const cors    = require('cors');
const { connectDB } = require('./src/config/db');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Conectar a SQL Server
connectDB();

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'API Empresa Constructora funcionando ' });
});

app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
});