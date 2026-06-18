const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');
const { registrarAccion } = require('../middleware/bitacora');

// QuÃ© mÃ³dulos puede ver cada rol
const permisosPorRol = {
    rol_gerente:    ['dashboard','proyectos','materiales','contratos','proveedores',
                     'inventario','clientes','empleados','horas','cotizaciones',
                     'pagos','compras','reportes'],
    rol_contador:   ['dashboard','contratos','pagos','reportes'],
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
        return res.status(400).json({ error: 'Usuario y contraseÃ±a son obligatorios' });

    try {
        const pool   = await sql.connect(config);
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
            return res.status(401).json({ error: 'Usuario o contraseÃ±a incorrectos' });

        const usuario = result.recordset[0];
        const modulos = permisosPorRol[usuario.rol] || ['dashboard'];

        // Bitácora: dejar registrado el inicio de sesión.
        pool.request()
            .input('idUsuario',      sql.Int,           usuario.idUsuario)
            .input('username',       sql.NVarChar(50),  usuario.username)
            .input('rol',            sql.NVarChar(50),  usuario.rol)
            .input('nombreCompleto', sql.NVarChar(150), usuario.nombreCompleto)
            .query(`
                INSERT INTO dbo.bitacora
                    (idUsuario, username, rol, nombreCompleto, accion, modulo, descripcion, metodoHttp, ruta, exito, fechaHora)
                VALUES
                    (@idUsuario, @username, @rol, @nombreCompleto, 'LOGIN', 'login',
                     'Inicio de sesión', 'POST', '/api/login', 1, GETDATE())
            `)
            .catch(e => console.error('[bitacora] login:', e.message));

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
