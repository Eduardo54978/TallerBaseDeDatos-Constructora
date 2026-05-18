const express = require('express');
const router  = express.Router();
const { sql } = require('../config/db');

// Qué módulos puede ver cada rol
const permisosPorRol = {
    rol_gerente:    ['dashboard','proyectos','materiales','contratos','proveedores',
                     'inventario','clientes','empleados','horas','cotizaciones',
                     'pagos','compras'],
    rol_contador:   ['dashboard','contratos','pagos'],
    rol_jefe_obra:  ['dashboard','proyectos','empleados','materiales','horas','inventario'],
    rol_rrhh:       ['dashboard','empleados','horas','cotizaciones'],
    rol_secretaria: ['dashboard','clientes','contratos'],
    rol_logistica:  ['dashboard','compras','inventario','proveedores','materiales'],
    rol_consulta:   ['dashboard','proyectos','materiales','contratos','proveedores',
                     'inventario','clientes','empleados','cotizaciones'],
};

// POST /api/login
router.post('/', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });

    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .query(`
                SELECT idUsuario, username, rol, nombreCompleto
                FROM dbo.usuarios
                WHERE username = @username
                  AND passwordHash = @password
                  AND activo = 1
            `);

        if (result.recordset.length === 0)
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

        const usuario = result.recordset[0];
        const modulos = permisosPorRol[usuario.rol] || ['dashboard'];

        res.json({
            idUsuario:      usuario.idUsuario,
            username:       usuario.username,
            rol:            usuario.rol,
            nombreCompleto: usuario.nombreCompleto,
            modulos,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;