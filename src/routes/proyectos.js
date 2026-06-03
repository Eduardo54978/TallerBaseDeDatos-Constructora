const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                p.idProyecto,
                p.nombreProyecto,
                p.descripcion,
                p.ubicacion,
                p.fechaInicio,
                p.fechaFinEstimada,
                p.fechaFinReal,
                tp.nombreTipoProyecto,
                ep.nombreEstadoProyecto,
                c.nombre AS cliente
            FROM proyecto p
            JOIN tipoproyecto tp ON p.idTipoProyecto = tp.idTipoProyecto
            JOIN estadoproyecto ep ON p.idEstadoProyecto = ep.idEstadoProyecto
            JOIN cliente c ON p.idCliente = c.idCliente
            ORDER BY p.idProyecto
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('q', sql.NVarChar, `%${q}%`)
            .query(`SELECT TOP 10 idProyecto, nombreProyecto FROM dbo.proyecto WHERE nombreProyecto LIKE @q OR CAST(idProyecto AS NVARCHAR) LIKE @q ORDER BY nombreProyecto`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/form/opciones', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const tipos = await pool.request().query(`
            SELECT idTipoProyecto, nombreTipoProyecto
            FROM dbo.tipoproyecto
            ORDER BY idTipoProyecto
        `);

        const estados = await pool.request().query(`
            SELECT idEstadoProyecto, nombreEstadoProyecto
            FROM dbo.estadoproyecto
            ORDER BY idEstadoProyecto
        `);

        const clientes = await pool.request().query(`
            SELECT TOP 300 *
            FROM dbo.cliente
            ORDER BY idCliente
        `);

        res.json({
            tipos: tipos.recordset,
            estados: estados.recordset,
            clientes: clientes.recordset
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/registrar', async (req, res) => {
    try {
        const {
            nombreProyecto,
            descripcion,
            idTipoProyecto,
            ubicacion,
            fechaInicio,
            fechaFinEstimada,
            idEstadoProyecto,
            idCliente
        } = req.body;

        if (!nombreProyecto || !idTipoProyecto || !ubicacion || !fechaInicio || !fechaFinEstimada || !idEstadoProyecto || !idCliente) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        const pool = await sql.connect(config);

        await pool.request()
            .input('nombreProyecto', sql.NVarChar(150), nombreProyecto)
            .input('descripcion', sql.NVarChar(255), descripcion || '')
            .input('idTipoProyecto', sql.Int, Number(idTipoProyecto))
            .input('ubicacion', sql.NVarChar(150), ubicacion)
            .input('fechaInicio', sql.Date, fechaInicio)
            .input('fechaFinEstimada', sql.Date, fechaFinEstimada)
            .input('idEstadoProyecto', sql.Int, Number(idEstadoProyecto))
            .input('idCliente', sql.Int, Number(idCliente))
            .query(`
                INSERT INTO dbo.proyecto
                    (nombreProyecto, descripcion, idTipoProyecto, ubicacion, fechaInicio, fechaFinEstimada, fechaFinReal, idEstadoProyecto, idCliente)
                VALUES
                    (@nombreProyecto, @descripcion, @idTipoProyecto, @ubicacion, @fechaInicio, @fechaFinEstimada, NULL, @idEstadoProyecto, @idCliente)
            `);

        res.json({ message: 'Proyecto registrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/estado', async (req, res) => {
    try {
        const idProyecto = Number(req.params.id);
        const idEstadoProyecto = Number(req.body.idEstadoProyecto);

        if (!idProyecto || !idEstadoProyecto) {
            return res.status(400).json({ error: 'Datos invalidos' });
        }

        const pool = await sql.connect(config);

        const proyecto = await pool.request()
            .input('idProyecto', sql.Int, idProyecto)
            .query(`
                SELECT 1
                FROM dbo.proyecto
                WHERE idProyecto = @idProyecto
            `);

        if (proyecto.recordset.length === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        const estado = await pool.request()
            .input('idEstadoProyecto', sql.Int, idEstadoProyecto)
            .query(`
                SELECT 1
                FROM dbo.estadoproyecto
                WHERE idEstadoProyecto = @idEstadoProyecto
            `);

        if (estado.recordset.length === 0) {
            return res.status(400).json({ error: 'Estado no encontrado' });
        }

        await pool.request()
            .input('idProyecto', sql.Int, idProyecto)
            .input('idEstadoProyecto', sql.Int, idEstadoProyecto)
            .query(`
                UPDATE dbo.proyecto
                SET idEstadoProyecto = @idEstadoProyecto
                WHERE idProyecto = @idProyecto
            `);

        res.json({ message: 'Estado actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/parametros/tipos', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const result = await pool.request().query(`
            SELECT idTipoProyecto, nombreTipoProyecto
            FROM dbo.tipoproyecto
            ORDER BY idTipoProyecto
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/parametros/tipos', async (req, res) => {
    try {
        const { nombreTipoProyecto } = req.body;

        if (!nombreTipoProyecto) {
            return res.status(400).json({ error: 'Debe ingresar el tipo de proyecto' });
        }

        const pool = await sql.connect(config);

        const existe = await pool.request()
            .input('nombreTipoProyecto', sql.NVarChar(100), nombreTipoProyecto)
            .query(`
                SELECT COUNT(*) AS total
                FROM dbo.tipoproyecto
                WHERE nombreTipoProyecto = @nombreTipoProyecto
            `);

        if (existe.recordset[0].total > 0) {
            return res.status(400).json({ error: 'Ese tipo de proyecto ya existe' });
        }

        await pool.request()
            .input('nombreTipoProyecto', sql.NVarChar(100), nombreTipoProyecto)
            .query(`
                INSERT INTO dbo.tipoproyecto (nombreTipoProyecto)
                VALUES (@nombreTipoProyecto)
            `);

        res.json({ message: 'Tipo registrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/parametros/estados', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const result = await pool.request().query(`
            SELECT idEstadoProyecto, nombreEstadoProyecto
            FROM dbo.estadoproyecto
            ORDER BY idEstadoProyecto
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/parametros/estados', async (req, res) => {
    try {
        const { nombreEstadoProyecto } = req.body;

        if (!nombreEstadoProyecto) {
            return res.status(400).json({ error: 'Debe ingresar el estado de proyecto' });
        }

        const pool = await sql.connect(config);

        const existe = await pool.request()
            .input('nombreEstadoProyecto', sql.NVarChar(100), nombreEstadoProyecto)
            .query(`
                SELECT COUNT(*) AS total
                FROM dbo.estadoproyecto
                WHERE nombreEstadoProyecto = @nombreEstadoProyecto
            `);

        if (existe.recordset[0].total > 0) {
            return res.status(400).json({ error: 'Ese estado ya existe' });
        }

        await pool.request()
            .input('nombreEstadoProyecto', sql.NVarChar(100), nombreEstadoProyecto)
            .query(`
                INSERT INTO dbo.estadoproyecto (nombreEstadoProyecto)
                VALUES (@nombreEstadoProyecto)
            `);

        res.json({ message: 'Estado registrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT idProyecto, nombreProyecto, descripcion, idTipoProyecto, ubicacion,
                       fechaInicio, fechaFinEstimada, fechaFinReal, idEstadoProyecto, idCliente
                FROM dbo.proyecto
                WHERE idProyecto = @id
            `);
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /:id/inspeccion — todo lo del proyecto en una sola respuesta:
// datos generales + personal asignado + materiales usados. Para "Inspeccionar".
router.get('/:id/inspeccion', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const cab = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT p.idProyecto, p.nombreProyecto, p.descripcion, p.ubicacion,
                       p.fechaInicio, p.fechaFinEstimada, p.fechaFinReal,
                       tp.nombreTipoProyecto, ep.nombreEstadoProyecto,
                       cl.nombre AS nombreCliente
                FROM dbo.proyecto p
                JOIN dbo.tipoproyecto tp ON p.idTipoProyecto = tp.idTipoProyecto
                JOIN dbo.estadoproyecto ep ON p.idEstadoProyecto = ep.idEstadoProyecto
                LEFT JOIN dbo.cliente cl ON p.idCliente = cl.idCliente
                WHERE p.idProyecto = @id
            `);
        if (cab.recordset.length === 0)
            return res.status(404).json({ error: 'Proyecto no encontrado' });

        const personal = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT e.nombre + ' ' + e.apellido AS empleado, c.nombreCargo,
                       rp.nombreRolProyecto, ep.fechaInicio, ep.fechaFin,
                       CASE WHEN ep.fechaFin IS NULL OR ep.fechaFin > CAST(GETDATE() AS DATE)
                            THEN 'Activo' ELSE 'Finalizado' END AS estadoAsignacion
                FROM dbo.empleadoproyecto ep
                JOIN dbo.empleado e ON ep.idEmpleado = e.idEmpleado
                JOIN dbo.cargo c ON e.idCargo = c.idCargo
                JOIN dbo.rolproyecto rp ON ep.idRolProyecto = rp.idRolProyecto
                WHERE ep.idProyecto = @id
                ORDER BY e.nombre, e.apellido
            `);

        const materiales = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT m.nombreMaterial, mp.cantidadUtilizada, mp.costoTotal, mp.fechaRegistro
                FROM dbo.materialproyecto mp
                JOIN dbo.material m ON mp.idMaterial = m.idMaterial
                WHERE mp.idProyecto = @id
                ORDER BY mp.fechaRegistro DESC
            `);

        const costoMateriales = materiales.recordset.reduce((s, m) => s + Number(m.costoTotal || 0), 0);
        res.json({
            ...cab.recordset[0],
            personal: personal.recordset,
            materiales: materiales.recordset,
            totalPersonal: personal.recordset.length,
            costoMateriales: Number(costoMateriales.toFixed(2)),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { nombreProyecto, descripcion, idTipoProyecto, ubicacion, fechaInicio, fechaFinEstimada, idEstadoProyecto, idCliente } = req.body;

    if (!nombreProyecto || !idTipoProyecto || !idEstadoProyecto || !idCliente)
        return res.status(400).json({ error: 'Nombre, tipo, estado y cliente son obligatorios' });

    if (fechaInicio && fechaFinEstimada && fechaFinEstimada <= fechaInicio)
        return res.status(400).json({ error: 'La fecha fin estimada debe ser posterior a la fecha de inicio' });

    try {
        const pool = await sql.connect(config);

        const actual = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT idEstadoProyecto FROM dbo.proyecto WHERE idProyecto = @id`);
        if (actual.recordset.length === 0)
            return res.status(404).json({ error: 'Proyecto no encontrado' });

        const estadoActual = actual.recordset[0].idEstadoProyecto;

        // Reglas por estado: 1=Planificación, 2=Ejecución, 3=Finalizado, 4=Suspendido
        if (estadoActual === 3) {
            return res.status(400).json({ error: 'Un proyecto Finalizado no se puede editar.' });
        }

        if (estadoActual === 2) {
            // En ejecución: solo se permite editar la fecha fin estimada
            await pool.request()
                .input('id', sql.Int, req.params.id)
                .input('fechaFinEstimada', sql.Date, fechaFinEstimada || null)
                .query(`UPDATE dbo.proyecto SET fechaFinEstimada = @fechaFinEstimada WHERE idProyecto = @id`);
            return res.json({ mensaje: 'Fecha fin estimada actualizada (proyecto en ejecución).' });
        }

        // Planificación o Suspendido: edición completa
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombreProyecto', sql.NVarChar(150), nombreProyecto)
            .input('descripcion', sql.NVarChar(255), descripcion || '')
            .input('idTipoProyecto', sql.Int, Number(idTipoProyecto))
            .input('ubicacion', sql.NVarChar(150), ubicacion || null)
            .input('fechaInicio', sql.Date, fechaInicio || null)
            .input('fechaFinEstimada', sql.Date, fechaFinEstimada || null)
            .input('idEstadoProyecto', sql.Int, Number(idEstadoProyecto))
            .input('idCliente', sql.Int, Number(idCliente))
            .query(`
                UPDATE dbo.proyecto SET
                    nombreProyecto   = @nombreProyecto,
                    descripcion      = @descripcion,
                    idTipoProyecto   = @idTipoProyecto,
                    ubicacion        = @ubicacion,
                    fechaInicio      = @fechaInicio,
                    fechaFinEstimada = @fechaFinEstimada,
                    idEstadoProyecto = @idEstadoProyecto,
                    idCliente        = @idCliente
                WHERE idProyecto = @id
            `);
        res.json({ mensaje: 'Proyecto actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const idProyecto = Number(req.params.id);

        if (!idProyecto) {
            return res.status(400).json({ error: 'ID de proyecto inválido' });
        }

        const pool = await sql.connect(config);

        const existe = await pool.request()
            .input('idProyecto', sql.Int, idProyecto)
            .query(`
                SELECT idProyecto
                FROM dbo.proyecto
                WHERE idProyecto = @idProyecto
            `);

        if (existe.recordset.length === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        const result = await pool.request()
            .input('idProyecto', sql.Int, idProyecto)
            .query(`
                DELETE FROM dbo.proyecto
                WHERE idProyecto = @idProyecto
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'No se pudo eliminar el proyecto' });
        }

        res.json({ mensaje: 'Proyecto eliminado correctamente' });

    } catch (err) {
        console.error('ERROR AL ELIMINAR PROYECTO:', err.message);

        res.status(400).json({
            error: 'No se puede eliminar este proyecto porque tiene datos relacionados.'
        });
    }
});
module.exports = router;
