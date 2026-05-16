const express = require('express');
const router  = express.Router();
const { sql } = require('../config/db');

// ── GET todos los empleados ────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT TOP 200
                e.idEmpleado, e.nombre, e.apellido, e.email, e.numCelular,
                e.salario, e.fechaContratacion,
                c.nombreCargo, d.nombreDepartamento, ee.nombreEstadoEmpleado
            FROM dbo.empleado e
            JOIN dbo.cargo          c  ON e.idCargo          = c.idCargo
            JOIN dbo.departamento   d  ON e.idDepartamento   = d.idDepartamento
            JOIN dbo.estadoempleado ee ON e.idEstadoEmpleado = ee.idEstadoEmpleado
            ORDER BY e.apellido
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET empleado por id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT e.*, c.nombreCargo, d.nombreDepartamento, ee.nombreEstadoEmpleado
                FROM dbo.empleado e
                JOIN dbo.cargo          c  ON e.idCargo          = c.idCargo
                JOIN dbo.departamento   d  ON e.idDepartamento   = d.idDepartamento
                JOIN dbo.estadoempleado ee ON e.idEstadoEmpleado = ee.idEstadoEmpleado
                WHERE e.idEmpleado = @id
            `);
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Empleado no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST registrar cargo ───────────────────────────────────────────────────
router.post('/cargos', async (req, res) => {
    const { nombreCargo, descripcionCargo } = req.body;
    if (!nombreCargo)
        return res.status(400).json({ error: 'nombreCargo es obligatorio' });
    try {
        const pool = await sql.connect();
        const dup  = await pool.request()
            .input('nombre', sql.NVarChar, nombreCargo)
            .query(`SELECT 1 FROM dbo.cargo WHERE nombreCargo = @nombre`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'Ya existe un cargo con ese nombre' });

        const result = await pool.request()
            .input('nombre',      sql.NVarChar, nombreCargo)
            .input('descripcion', sql.NVarChar, descripcionCargo || null)
            .query(`
                INSERT INTO dbo.cargo (nombreCargo, descripcionCargo)
                OUTPUT INSERTED.idCargo
                VALUES (@nombre, @descripcion)
            `);
        res.status(201).json({ idCargo: result.recordset[0].idCargo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET lista de cargos ────────────────────────────────────────────────────
router.get('/cargos/lista', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`SELECT * FROM dbo.cargo ORDER BY nombreCargo`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST registrar departamento ────────────────────────────────────────────
router.post('/departamentos', async (req, res) => {
    const { nombreDepartamento, descripcionDepartamento } = req.body;
    if (!nombreDepartamento)
        return res.status(400).json({ error: 'nombreDepartamento es obligatorio' });
    try {
        const pool = await sql.connect();
        const dup  = await pool.request()
            .input('nombre', sql.NVarChar, nombreDepartamento)
            .query(`SELECT 1 FROM dbo.departamento WHERE nombreDepartamento = @nombre`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'Ya existe un departamento con ese nombre' });

        const result = await pool.request()
            .input('nombre',      sql.NVarChar, nombreDepartamento)
            .input('descripcion', sql.NVarChar, descripcionDepartamento || null)
            .query(`
                INSERT INTO dbo.departamento (nombreDepartamento, descripcionDepartamento)
                OUTPUT INSERTED.idDepartamento
                VALUES (@nombre, @descripcion)
            `);
        res.status(201).json({ idDepartamento: result.recordset[0].idDepartamento });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET lista de departamentos ─────────────────────────────────────────────
router.get('/departamentos/lista', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`SELECT * FROM dbo.departamento ORDER BY nombreDepartamento`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST registrar empleado ────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const { nombre, apellido, numCelular, email, direccion, salario,
            fechaContratacion, idEstadoEmpleado, ci, fechaNacimiento,
            especialidad, idCargo, idDepartamento } = req.body;

    if (!nombre || !apellido)
        return res.status(400).json({ error: 'nombre y apellido son obligatorios' });

    try {
        const pool = await sql.connect();

        // Validar email único
        if (email) {
            const dupEmail = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(`SELECT 1 FROM dbo.empleado WHERE email = @email`);
            if (dupEmail.recordset.length > 0)
                return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Validar CI único
        if (ci) {
            const dupCI = await pool.request()
                .input('ci', sql.NVarChar, ci)
                .query(`SELECT 1 FROM dbo.empleado WHERE ci = @ci`);
            if (dupCI.recordset.length > 0)
                return res.status(400).json({ error: 'El CI ya está registrado' });
        }

        // Validar que idCargo exista
        const cargoExiste = await pool.request()
            .input('id', sql.Int, idCargo)
            .query(`SELECT 1 FROM dbo.cargo WHERE idCargo = @id`);
        if (cargoExiste.recordset.length === 0)
            return res.status(400).json({ error: 'idCargo no existe' });

        // Validar que idDepartamento exista
        const deptExiste = await pool.request()
            .input('id', sql.Int, idDepartamento)
            .query(`SELECT 1 FROM dbo.departamento WHERE idDepartamento = @id`);
        if (deptExiste.recordset.length === 0)
            return res.status(400).json({ error: 'idDepartamento no existe' });

        // Validar que idEstadoEmpleado exista
        const estadoExiste = await pool.request()
            .input('id', sql.Int, idEstadoEmpleado)
            .query(`SELECT 1 FROM dbo.estadoempleado WHERE idEstadoEmpleado = @id`);
        if (estadoExiste.recordset.length === 0)
            return res.status(400).json({ error: 'idEstadoEmpleado no existe' });

        const result = await pool.request()
            .input('nombre',            sql.NVarChar, nombre)
            .input('apellido',          sql.NVarChar, apellido)
            .input('numCelular',        sql.NVarChar, numCelular         || null)
            .input('email',             sql.NVarChar, email              || null)
            .input('direccion',         sql.NVarChar, direccion          || null)
            .input('salario',           sql.Decimal,  salario            || null)
            .input('fechaContratacion', sql.Date,     fechaContratacion  || null)
            .input('idEstadoEmpleado',  sql.Int,      idEstadoEmpleado)
            .input('ci',                sql.NVarChar, ci                 || null)
            .input('fechaNacimiento',   sql.Date,     fechaNacimiento    || null)
            .input('especialidad',      sql.NVarChar, especialidad       || null)
            .input('idCargo',           sql.Int,      idCargo)
            .input('idDepartamento',    sql.Int,      idDepartamento)
            .query(`
                INSERT INTO dbo.empleado
                    (nombre, apellido, numCelular, email, direccion, salario,
                     fechaContratacion, idEstadoEmpleado, ci, fechaNacimiento,
                     especialidad, idCargo, idDepartamento)
                OUTPUT INSERTED.idEmpleado
                VALUES
                    (@nombre, @apellido, @numCelular, @email, @direccion, @salario,
                     @fechaContratacion, @idEstadoEmpleado, @ci, @fechaNacimiento,
                     @especialidad, @idCargo, @idDepartamento)
            `);
        res.status(201).json({ idEmpleado: result.recordset[0].idEmpleado });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT actualizar empleado ────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
    const idEmpleado = req.params.id;
    const { nombre, apellido, numCelular, email, direccion, salario,
            fechaContratacion, idEstadoEmpleado, ci, fechaNacimiento,
            especialidad, idCargo, idDepartamento } = req.body;
    try {
        const pool = await sql.connect();

        const existe = await pool.request()
            .input('id', sql.Int, idEmpleado)
            .query(`SELECT 1 FROM dbo.empleado WHERE idEmpleado = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Empleado no encontrado' });

        // Validar email único en otro empleado
        if (email) {
            const dup = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('id',    sql.Int,      idEmpleado)
                .query(`SELECT 1 FROM dbo.empleado WHERE email = @email AND idEmpleado <> @id`);
            if (dup.recordset.length > 0)
                return res.status(400).json({ error: 'El email ya está en uso' });
        }

        // Validar CI único en otro empleado
        if (ci) {
            const dup = await pool.request()
                .input('ci', sql.NVarChar, ci)
                .input('id', sql.Int,      idEmpleado)
                .query(`SELECT 1 FROM dbo.empleado WHERE ci = @ci AND idEmpleado <> @id`);
            if (dup.recordset.length > 0)
                return res.status(400).json({ error: 'El CI ya está en uso' });
        }

        await pool.request()
            .input('id',                sql.Int,      idEmpleado)
            .input('nombre',            sql.NVarChar, nombre)
            .input('apellido',          sql.NVarChar, apellido)
            .input('numCelular',        sql.NVarChar, numCelular         || null)
            .input('email',             sql.NVarChar, email              || null)
            .input('direccion',         sql.NVarChar, direccion          || null)
            .input('salario',           sql.Decimal,  salario            || null)
            .input('fechaContratacion', sql.Date,     fechaContratacion  || null)
            .input('idEstadoEmpleado',  sql.Int,      idEstadoEmpleado)
            .input('ci',                sql.NVarChar, ci                 || null)
            .input('fechaNacimiento',   sql.Date,     fechaNacimiento    || null)
            .input('especialidad',      sql.NVarChar, especialidad       || null)
            .input('idCargo',           sql.Int,      idCargo)
            .input('idDepartamento',    sql.Int,      idDepartamento)
            .query(`
                UPDATE dbo.empleado SET
                    nombre = @nombre, apellido = @apellido, numCelular = @numCelular,
                    email = @email, direccion = @direccion, salario = @salario,
                    fechaContratacion = @fechaContratacion, idEstadoEmpleado = @idEstadoEmpleado,
                    ci = @ci, fechaNacimiento = @fechaNacimiento, especialidad = @especialidad,
                    idCargo = @idCargo, idDepartamento = @idDepartamento
                WHERE idEmpleado = @id
            `);
        res.json({ mensaje: 'Empleado actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST registrar rol de proyecto ─────────────────────────────────────────
router.post('/roles', async (req, res) => {
    const { nombreRolProyecto, descripcionRolProyecto } = req.body;
    if (!nombreRolProyecto)
        return res.status(400).json({ error: 'nombreRolProyecto es obligatorio' });
    try {
        const pool = await sql.connect();
        const dup  = await pool.request()
            .input('nombre', sql.NVarChar, nombreRolProyecto)
            .query(`SELECT 1 FROM dbo.rolproyecto WHERE nombreRolProyecto = @nombre`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });

        const result = await pool.request()
            .input('nombre',      sql.NVarChar, nombreRolProyecto)
            .input('descripcion', sql.NVarChar, descripcionRolProyecto || null)
            .query(`
                INSERT INTO dbo.rolproyecto (nombreRolProyecto, descripcionRolProyecto)
                OUTPUT INSERTED.idRolProyecto
                VALUES (@nombre, @descripcion)
            `);
        res.status(201).json({ idRolProyecto: result.recordset[0].idRolProyecto });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET asignaciones de un empleado ───────────────────────────────────────
router.get('/:id/asignaciones', async (req, res) => {
    try {
        const pool = await sql.connect();

        const existe = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM dbo.empleado WHERE idEmpleado = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Empleado no encontrado' });

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    ep.idEmpleadoProyecto,
                    ep.fechaInicio,
                    ep.fechaFin,
                    p.nombreProyecto,
                    rp.nombreRolProyecto
                FROM dbo.empleadoproyecto ep
                JOIN dbo.proyecto    p  ON ep.idProyecto     = p.idProyecto
                JOIN dbo.rolproyecto rp ON ep.idRolProyecto  = rp.idRolProyecto
                WHERE ep.idEmpleado = @id
                ORDER BY ep.fechaInicio DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST registrar horas trabajadas ───────────────────────────────────────
router.post('/horas', async (req, res) => {
    const { idEmpleado, idProyecto, fecha, horasTrabajadas, pagoPorHora } = req.body;
    try {
        const pool = await sql.connect();

        const empExiste = await pool.request()
            .input('id', sql.Int, idEmpleado)
            .query(`SELECT 1 FROM dbo.empleado WHERE idEmpleado = @id`);
        if (empExiste.recordset.length === 0)
            return res.status(400).json({ error: 'Empleado no existe' });

        const proyExiste = await pool.request()
            .input('id', sql.Int, idProyecto)
            .query(`SELECT 1 FROM dbo.proyecto WHERE idProyecto = @id`);
        if (proyExiste.recordset.length === 0)
            return res.status(400).json({ error: 'Proyecto no existe' });

        const totalPago = horasTrabajadas * pagoPorHora;

        const result = await pool.request()
            .input('idEmpleado',      sql.Int,     idEmpleado)
            .input('idProyecto',      sql.Int,     idProyecto)
            .input('fecha',           sql.Date,    fecha)
            .input('horasTrabajadas', sql.Decimal, horasTrabajadas)
            .input('pagoPorHora',     sql.Decimal, pagoPorHora)
            .input('totalPago',       sql.Decimal, totalPago)
            .query(`
                INSERT INTO dbo.registrohoras (idEmpleado, idProyecto, fecha, horasTrabajadas, pagoPorHora, totalPago)
                OUTPUT INSERTED.idRegistroHoras
                VALUES (@idEmpleado, @idProyecto, @fecha, @horasTrabajadas, @pagoPorHora, @totalPago)
            `);
        res.status(201).json({ idRegistroHoras: result.recordset[0].idRegistroHoras, totalPago });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET horas trabajadas por empleado ─────────────────────────────────────
router.get('/:id/horas', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    rh.idRegistroHoras,
                    rh.fecha,
                    rh.horasTrabajadas,
                    rh.pagoPorHora,
                    rh.totalPago,
                    p.nombreProyecto
                FROM dbo.registrohoras rh
                JOIN dbo.proyecto p ON rh.idProyecto = p.idProyecto
                WHERE rh.idEmpleado = @id
                ORDER BY rh.fecha DESC
            `);
        const totalHoras = result.recordset.reduce((s, r) => s + r.horasTrabajadas, 0);
        const totalGanado = result.recordset.reduce((s, r) => s + r.totalPago, 0);
        res.json({ registros: result.recordset, totalHoras, totalGanado });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST registrar bonificación ────────────────────────────────────────────
router.post('/bonificaciones', async (req, res) => {
    const { idEmpleado, tipoBonificacion, aniosAntiguedad,
            porcentajeBono, salarioBase, gestion, descripcion } = req.body;
    try {
        const pool = await sql.connect();

        const empExiste = await pool.request()
            .input('id', sql.Int, idEmpleado)
            .query(`SELECT 1 FROM dbo.empleado WHERE idEmpleado = @id`);
        if (empExiste.recordset.length === 0)
            return res.status(400).json({ error: 'Empleado no existe' });

        // Tabla de porcentajes según antigüedad (ley boliviana)
        const tablaBonos = [
            { min: 2,  max: 4,  pct: 5  },
            { min: 5,  max: 7,  pct: 11 },
            { min: 8,  max: 10, pct: 18 },
            { min: 11, max: 14, pct: 26 },
            { min: 15, max: 19, pct: 34 },
            { min: 20, max: 24, pct: 42 },
            { min: 25, max: Infinity, pct: 50 },
        ];
        const fila = tablaBonos.find(b => aniosAntiguedad >= b.min && aniosAntiguedad <= b.max);
        if (fila && fila.pct !== porcentajeBono)
            return res.status(400).json({ error: `Para ${aniosAntiguedad} años el porcentaje debe ser ${fila.pct}%` });

        const montoCalculado = (salarioBase * porcentajeBono) / 100;

        const result = await pool.request()
            .input('idEmpleado',       sql.Int,      idEmpleado)
            .input('tipoBonificacion', sql.NVarChar, tipoBonificacion)
            .input('aniosAntiguedad',  sql.Int,      aniosAntiguedad)
            .input('porcentajeBono',   sql.Decimal,  porcentajeBono)
            .input('salarioBase',      sql.Decimal,  salarioBase)
            .input('montoCalculado',   sql.Decimal,  montoCalculado)
            .input('gestion',          sql.Int,      gestion)
            .input('descripcion',      sql.NVarChar, descripcion || null)
            .query(`
                INSERT INTO dbo.bonificacionempleado
                    (idEmpleado, tipoBonificacion, aniosAntiguedad, porcentajeBono,
                     salarioBase, montoCalculado, gestion, descripcion)
                OUTPUT INSERTED.idBonificacion
                VALUES
                    (@idEmpleado, @tipoBonificacion, @aniosAntiguedad, @porcentajeBono,
                     @salarioBase, @montoCalculado, @gestion, @descripcion)
            `);
        res.status(201).json({ idBonificacion: result.recordset[0].idBonificacion, montoCalculado });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;