const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

// GET /api/bitacora
// Lista los movimientos del sistema, del más reciente al más antiguo.
// Filtros opcionales por query string: ?rol=  ?modulo=  ?accion=  ?q=  ?limite=
router.get('/', async (req, res) => {
    try {
        const { rol, modulo, accion, q } = req.query;
        const limite = Math.min(parseInt(req.query.limite) || 200, 1000);

        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('rol',    sql.NVarChar(50), rol || null)
            .input('modulo', sql.NVarChar(50), modulo || null)
            .input('accion', sql.NVarChar(20), accion || null)
            .input('q',      sql.NVarChar(150), q ? `%${q}%` : null)
            .input('limite', sql.Int, limite)
            .query(`
                SELECT TOP (@limite)
                    idBitacora, idUsuario, username, rol, nombreCompleto,
                    accion, modulo, descripcion, metodoHttp, ruta, exito, fechaHora
                FROM dbo.bitacora
                WHERE (@rol    IS NULL OR rol    = @rol)
                  AND (@modulo IS NULL OR modulo = @modulo)
                  AND (@accion IS NULL OR accion = @accion)
                  AND (@q      IS NULL OR nombreCompleto LIKE @q OR username LIKE @q OR descripcion LIKE @q)
                ORDER BY fechaHora DESC, idBitacora DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/bitacora/resumen — conteo por usuario y por módulo (para tarjetas).
router.get('/resumen', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const porUsuario = await pool.request().query(`
            SELECT TOP 10 nombreCompleto, rol, COUNT(*) AS total
            FROM dbo.bitacora
            GROUP BY nombreCompleto, rol
            ORDER BY total DESC
        `);
        const porModulo = await pool.request().query(`
            SELECT modulo, COUNT(*) AS total
            FROM dbo.bitacora
            GROUP BY modulo
            ORDER BY total DESC
        `);
        res.json({ porUsuario: porUsuario.recordset, porModulo: porModulo.recordset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/bitacora — limpia la bitácora (solo el gerente).
// No es un borrado "a ciegas": después de limpiar deja UN registro indicando
// quién la limpió y cuántos movimientos se borraron, para mantener la traza.
// Con ?dias=30 borra solo lo más antiguo que ese número de días.
router.delete('/', async (req, res) => {
    const rol = req.headers['x-usuario-rol'];
    if (rol !== 'rol_gerente')
        return res.status(403).json({ error: 'Solo el gerente puede limpiar la bitácora.' });

    const dias = parseInt(req.query.dias);
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('dias', sql.Int, Number.isInteger(dias) && dias > 0 ? dias : null)
            .query(`
                DELETE FROM dbo.bitacora
                WHERE @dias IS NULL OR fechaHora < DATEADD(DAY, -@dias, GETDATE())
            `);
        const borrados = result.rowsAffected[0] || 0;

        // Dejar constancia de la limpieza.
        const nombre = req.headers['x-usuario-nombre']
            ? decodeURIComponent(req.headers['x-usuario-nombre']) : null;
        await pool.request()
            .input('idUsuario',      sql.Int,           req.headers['x-usuario-id'] ? parseInt(req.headers['x-usuario-id']) : null)
            .input('username',       sql.NVarChar(50),  req.headers['x-usuario-username'] || null)
            .input('rol',            sql.NVarChar(50),  rol)
            .input('nombreCompleto', sql.NVarChar(150), nombre)
            .input('desc',           sql.NVarChar(500), `Bitácora limpiada: ${borrados} movimiento(s) eliminado(s)${dias ? ` (anteriores a ${dias} días)` : ''}`)
            .query(`
                INSERT INTO dbo.bitacora
                    (idUsuario, username, rol, nombreCompleto, accion, modulo, descripcion, metodoHttp, ruta, exito, fechaHora)
                VALUES
                    (@idUsuario, @username, @rol, @nombreCompleto, 'LIMPIAR', 'bitacora', @desc, 'DELETE', '/api/bitacora', 1, GETDATE())
            `);

        res.json({ mensaje: `Se limpiaron ${borrados} movimiento(s).`, borrados });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
