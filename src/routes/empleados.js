const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');
const { errorAmigable } = require('../config/sqlError');

router.get('/cargos/lista', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT *
            FROM dbo.cargo
            ORDER BY idCargo ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/cargos', async (req, res) => {
    const { nombreCargo, descripcionCargo } = req.body;
    if (!nombreCargo) return res.status(400).json({ error: 'nombreCargo es obligatorio' });
    try {
        const pool = await sql.connect(config);
        const dup = await pool.request()
            .input('nombre', sql.NVarChar, nombreCargo)
            .query(`SELECT 1 FROM dbo.cargo WHERE nombreCargo = @nombre`);
        if (dup.recordset.length > 0) return res.status(400).json({ error: 'Ya existe un cargo con ese nombre' });
        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombreCargo)
            .input('descripcion', sql.NVarChar, descripcionCargo || null)
            .query(`
                INSERT INTO dbo.cargo (nombreCargo, descripcionCargo)
                OUTPUT INSERTED.idCargo
                VALUES (@nombre, @descripcion)
            `);
        res.status(201).json({ idCargo: result.recordset[0].idCargo });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/departamentos/lista', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT *
            FROM dbo.departamento
            ORDER BY idDepartamento ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/departamentos', async (req, res) => {
    const { nombreDepartamento, descripcionDepartamento } = req.body;
    if (!nombreDepartamento) return res.status(400).json({ error: 'nombreDepartamento es obligatorio' });
    try {
        const pool = await sql.connect(config);
        const dup = await pool.request()
            .input('nombre', sql.NVarChar, nombreDepartamento)
            .query(`SELECT 1 FROM dbo.departamento WHERE nombreDepartamento = @nombre`);
        if (dup.recordset.length > 0) return res.status(400).json({ error: 'Ya existe un departamento con ese nombre' });
        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombreDepartamento)
            .input('descripcion', sql.NVarChar, descripcionDepartamento || null)
            .query(`
                INSERT INTO dbo.departamento (nombreDepartamento, descripcionDepartamento)
                OUTPUT INSERTED.idDepartamento
                VALUES (@nombre, @descripcion)
            `);
        res.status(201).json({ idDepartamento: result.recordset[0].idDepartamento });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/roles', async (req, res) => {
    const { nombreRolProyecto, descripcionRolProyecto } = req.body;
    if (!nombreRolProyecto) return res.status(400).json({ error: 'nombreRolProyecto es obligatorio' });
    try {
        const pool = await sql.connect(config);
        const dup = await pool.request()
            .input('nombre', sql.NVarChar, nombreRolProyecto)
            .query(`SELECT 1 FROM dbo.rolproyecto WHERE nombreRolProyecto = @nombre`);
        if (dup.recordset.length > 0) return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombreRolProyecto)
            .input('descripcion', sql.NVarChar, descripcionRolProyecto || null)
            .query(`
                INSERT INTO dbo.rolproyecto (nombreRolProyecto, descripcionRolProyecto)
                OUTPUT INSERTED.idRolProyecto
                VALUES (@nombre, @descripcion)
            `);
        res.status(201).json({ idRolProyecto: result.recordset[0].idRolProyecto });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/horas', async (req, res) => {
    const { idEmpleado, idProyecto, fecha, horasTrabajadas } = req.body;
    try {
        const pool = await sql.connect(config);
        const empExiste = await pool.request()
            .input('id', sql.Int, idEmpleado)
            .query(`
                SELECT e.idEmpleado, c.pagoPorHora
                FROM dbo.empleado e
                JOIN dbo.cargo c ON e.idCargo = c.idCargo
                WHERE e.idEmpleado = @id
            `);
        if (empExiste.recordset.length === 0) return res.status(400).json({ error: 'Empleado no existe' });
        const proyExiste = await pool.request()
            .input('id', sql.Int, idProyecto)
            .query(`SELECT 1 FROM dbo.proyecto WHERE idProyecto = @id`);
        if (proyExiste.recordset.length === 0) return res.status(400).json({ error: 'Proyecto no existe' });
        const pagoPorHora = Number(empExiste.recordset[0].pagoPorHora || 0);
        const totalPago = Number(horasTrabajadas || 0) * pagoPorHora;
        const result = await pool.request()
            .input('idEmpleado', sql.Int, idEmpleado)
            .input('idProyecto', sql.Int, idProyecto)
            .input('fecha', sql.Date, fecha)
            .input('horasTrabajadas', sql.Decimal(10, 2), horasTrabajadas)
            .query(`
                INSERT INTO dbo.registrohoras (idEmpleado, idProyecto, fecha, horasTrabajadas)
                VALUES (@idEmpleado, @idProyecto, @fecha, @horasTrabajadas);
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS idRegistroHoras;
            `);
        res.status(201).json({ idRegistroHoras: result.recordset[0].idRegistroHoras, pagoPorHora, totalPago });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/bonificaciones', async (req, res) => {
    const { idEmpleado, idProyecto, tipoBonificacion, aniosAntiguedad, porcentajeBono, salarioBaseProyecto, salarioBase, gestion, descripcion } = req.body;
    try {
        const idEmpleadoNum = parseInt(idEmpleado);
        const idProyectoNum = parseInt(idProyecto);
        const aniosNum = parseInt(aniosAntiguedad);
        const porcentajeNum = parseFloat(porcentajeBono);
        const salarioBaseNum = parseFloat(salarioBaseProyecto ?? salarioBase);
        const gestionNum = parseInt(gestion);
        if (!idEmpleadoNum || !idProyectoNum || Number.isNaN(aniosNum) || Number.isNaN(porcentajeNum) || Number.isNaN(salarioBaseNum) || !gestionNum) {
            return res.status(400).json({ error: 'Empleado, proyecto, años, porcentaje, salario base y gestión son obligatorios.' });
        }
        if (salarioBaseNum <= 0) return res.status(400).json({ error: 'El salario base debe ser mayor a 0.' });
        const tablaBonos = [
            { min: 0, max: 2, pct: 0 },
            { min: 3, max: 5, pct: 10 },
            { min: 6, max: 10, pct: 15 },
            { min: 11, max: 999, pct: 25 }
        ];
        const fila = tablaBonos.find(b => aniosNum >= b.min && aniosNum <= b.max);
        if (!fila) return res.status(400).json({ error: 'No existe porcentaje configurado para esa antigüedad.' });
        if (fila.pct !== porcentajeNum) return res.status(400).json({ error: `Para ${aniosNum} años de antigüedad el porcentaje debe ser ${fila.pct}%.` });
        const montoBono = (salarioBaseNum * porcentajeNum) / 100;
        const salarioFinalProyecto = salarioBaseNum + montoBono;
        const descripcionFinal = descripcion ? `${tipoBonificacion || 'Bono de antigüedad'} - ${descripcion}` : `${tipoBonificacion || 'Bono de antigüedad'}`;
        const pool = await sql.connect(config);
        const empExiste = await pool.request()
            .input('idEmpleado', sql.Int, idEmpleadoNum)
            .query(`SELECT 1 FROM dbo.empleado WHERE idEmpleado = @idEmpleado`);
        if (empExiste.recordset.length === 0) return res.status(400).json({ error: 'Empleado no existe.' });
        const proyExiste = await pool.request()
            .input('idProyecto', sql.Int, idProyectoNum)
            .query(`SELECT 1 FROM dbo.proyecto WHERE idProyecto = @idProyecto`);
        if (proyExiste.recordset.length === 0) return res.status(400).json({ error: 'Proyecto no existe.' });
        const asignado = await pool.request()
            .input('idEmpleado', sql.Int, idEmpleadoNum)
            .input('idProyecto', sql.Int, idProyectoNum)
            .query(`
                SELECT 1
                FROM dbo.empleadoproyecto
                WHERE idEmpleado = @idEmpleado
                  AND idProyecto = @idProyecto
            `);
        if (asignado.recordset.length === 0) return res.status(400).json({ error: 'El empleado no está asignado a ese proyecto.' });
        const duplicado = await pool.request()
            .input('idEmpleado', sql.Int, idEmpleadoNum)
            .input('idProyecto', sql.Int, idProyectoNum)
            .input('gestion', sql.Int, gestionNum)
            .query(`
                SELECT idBonoAntiguedadProyecto
                FROM dbo.bonoantiguedadproyecto
                WHERE idEmpleado = @idEmpleado
                  AND idProyecto = @idProyecto
                  AND gestion = @gestion
            `);
        if (duplicado.recordset.length > 0) return res.status(400).json({ error: 'Ya existe un bono registrado para este empleado, proyecto y gestión.' });
        const result = await pool.request()
            .input('idEmpleado', sql.Int, idEmpleadoNum)
            .input('idProyecto', sql.Int, idProyectoNum)
            .input('gestion', sql.Int, gestionNum)
            .input('aniosAntiguedad', sql.Int, aniosNum)
            .input('porcentajeBono', sql.Decimal(10, 2), porcentajeNum)
            .input('salarioBaseProyecto', sql.Decimal(18, 2), salarioBaseNum)
            .input('montoBono', sql.Decimal(18, 2), montoBono)
            .input('salarioFinalProyecto', sql.Decimal(18, 2), salarioFinalProyecto)
            .input('descripcion', sql.NVarChar, descripcionFinal)
            .query(`
                DECLARE @NuevoBono TABLE (idBonoAntiguedadProyecto INT);
                INSERT INTO dbo.bonoantiguedadproyecto (
                    idEmpleado, idProyecto, gestion, aniosAntiguedad, porcentajeBono,
                    salarioBaseProyecto, montoBono, salarioFinalProyecto, descripcion
                )
                OUTPUT INSERTED.idBonoAntiguedadProyecto INTO @NuevoBono
                VALUES (
                    @idEmpleado, @idProyecto, @gestion, @aniosAntiguedad, @porcentajeBono,
                    @salarioBaseProyecto, @montoBono, @salarioFinalProyecto, @descripcion
                );
                SELECT idBonoAntiguedadProyecto FROM @NuevoBono;
            `);
        res.status(201).json({ idBonoAntiguedadProyecto: result.recordset[0].idBonoAntiguedadProyecto, montoBono, salarioFinalProyecto });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('q', sql.NVarChar, `%${q}%`)
            .query(`
                SELECT TOP 10 idEmpleado, nombre, apellido, nombre + ' ' + apellido AS nombreCompleto
                FROM dbo.empleado
                WHERE nombre LIKE @q OR apellido LIKE @q OR (nombre + ' ' + apellido) LIKE @q OR CAST(idEmpleado AS NVARCHAR) LIKE @q
                ORDER BY nombre
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT TOP 200
                e.idEmpleado,
                e.nombre,
                e.apellido,
                e.email,
                e.numCelular,
                e.salarioReferencial AS salario,
                e.fechaContratacion,
                e.ci,
                c.nombreCargo,
                d.nombreDepartamento,
                ee.nombreEstadoEmpleado
            FROM dbo.empleado e
            JOIN dbo.cargo c ON e.idCargo = c.idCargo
            JOIN dbo.departamento d ON e.idDepartamento = d.idDepartamento
            JOIN dbo.estadoempleado ee ON e.idEstadoEmpleado = ee.idEstadoEmpleado
            ORDER BY e.idEmpleado ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/', async (req, res) => {
    const { nombre, apellido, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, ci, fechaNacimiento, especialidad, idCargo, idDepartamento } = req.body;
    if (!nombre || !apellido) return res.status(400).json({ error: 'nombre y apellido son obligatorios' });
    try {
        const pool = await sql.connect(config);
        if (email) {
            const dupEmail = await pool.request().input('email', sql.NVarChar, email).query(`SELECT 1 FROM dbo.empleado WHERE email = @email`);
            if (dupEmail.recordset.length > 0) return res.status(400).json({ error: 'El email ya está registrado' });
        }
        if (ci) {
            const dupCI = await pool.request().input('ci', sql.NVarChar, ci).query(`SELECT 1 FROM dbo.empleado WHERE ci = @ci`);
            if (dupCI.recordset.length > 0) return res.status(400).json({ error: 'El CI ya está registrado' });
        }
        const cargoExiste = await pool.request().input('id', sql.Int, idCargo).query(`SELECT 1 FROM dbo.cargo WHERE idCargo = @id`);
        if (cargoExiste.recordset.length === 0) return res.status(400).json({ error: 'idCargo no existe' });
        const deptExiste = await pool.request().input('id', sql.Int, idDepartamento).query(`SELECT 1 FROM dbo.departamento WHERE idDepartamento = @id`);
        if (deptExiste.recordset.length === 0) return res.status(400).json({ error: 'idDepartamento no existe' });
        const estadoExiste = await pool.request().input('id', sql.Int, idEstadoEmpleado).query(`SELECT 1 FROM dbo.estadoempleado WHERE idEstadoEmpleado = @id`);
        if (estadoExiste.recordset.length === 0) return res.status(400).json({ error: 'idEstadoEmpleado no existe' });
        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('apellido', sql.NVarChar, apellido)
            .input('numCelular', sql.NVarChar, numCelular || null)
            .input('email', sql.NVarChar, email || null)
            .input('direccion', sql.NVarChar, direccion || null)
            .input('salario', sql.Decimal(10, 2), salario || null)
            .input('fechaContratacion', sql.Date, fechaContratacion || null)
            .input('idEstadoEmpleado', sql.Int, idEstadoEmpleado)
            .input('ci', sql.NVarChar, ci || null)
            .input('fechaNacimiento', sql.Date, fechaNacimiento || null)
            .input('especialidad', sql.NVarChar, especialidad || null)
            .input('idCargo', sql.Int, idCargo)
            .input('idDepartamento', sql.Int, idDepartamento)
            .query(`
                INSERT INTO dbo.empleado (
                    nombre, apellido, numCelular, email, direccion, salarioReferencial,
                    fechaContratacion, idEstadoEmpleado, ci, fechaNacimiento, especialidad, idCargo, idDepartamento
                )
                OUTPUT INSERTED.idEmpleado
                VALUES (
                    @nombre, @apellido, @numCelular, @email, @direccion, @salario,
                    @fechaContratacion, @idEstadoEmpleado, @ci, @fechaNacimiento, @especialidad, @idCargo, @idDepartamento
                )
            `);
        res.status(201).json({ idEmpleado: result.recordset[0].idEmpleado });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/:id/asignaciones', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const existe = await pool.request().input('id', sql.Int, req.params.id).query(`SELECT 1 FROM dbo.empleado WHERE idEmpleado = @id`);
        if (existe.recordset.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT ep.idEmpleadoProyecto, ep.idProyecto, ep.fechaInicio, ep.fechaFin, p.nombreProyecto, rp.nombreRolProyecto
                FROM dbo.empleadoproyecto ep
                JOIN dbo.proyecto p ON ep.idProyecto = p.idProyecto
                JOIN dbo.rolproyecto rp ON ep.idRolProyecto = rp.idRolProyecto
                WHERE ep.idEmpleado = @id
                ORDER BY ep.idEmpleadoProyecto ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/:id/horas', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const empleado = await pool.request().input('id', sql.Int, req.params.id).query(`SELECT 1 FROM dbo.empleado WHERE idEmpleado = @id`);
        if (empleado.recordset.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT rh.idRegistroHoras, rh.fecha, rh.horasTrabajadas, rh.idProyecto, c.pagoPorHora,
                       (rh.horasTrabajadas * c.pagoPorHora) AS totalPago, p.nombreProyecto
                FROM dbo.registrohoras rh
                JOIN dbo.empleado e ON rh.idEmpleado = e.idEmpleado
                JOIN dbo.cargo c ON e.idCargo = c.idCargo
                JOIN dbo.proyecto p ON rh.idProyecto = p.idProyecto
                WHERE rh.idEmpleado = @id
                ORDER BY rh.fecha ASC
            `);
        const totalHoras = result.recordset.reduce((s, r) => s + Number(r.horasTrabajadas || 0), 0);
        const totalGanado = result.recordset.reduce((s, r) => s + Number(r.totalPago || 0), 0);
        res.json({ registros: result.recordset, totalHoras, totalGanado });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT e.*, c.nombreCargo, d.nombreDepartamento, ee.nombreEstadoEmpleado
                FROM dbo.empleado e
                JOIN dbo.cargo c ON e.idCargo = c.idCargo
                JOIN dbo.departamento d ON e.idDepartamento = d.idDepartamento
                JOIN dbo.estadoempleado ee ON e.idEstadoEmpleado = ee.idEstadoEmpleado
                WHERE e.idEmpleado = @id
            `);
        if (result.recordset.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.put('/:id/estado', async (req, res) => {
    const { idEstadoEmpleado } = req.body;
    try {
        const pool = await sql.connect(config);
        const existe = await pool.request().input('id', sql.Int, req.params.id).query(`SELECT 1 FROM dbo.empleado WHERE idEmpleado = @id`);
        if (existe.recordset.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('idEstado', sql.Int, idEstadoEmpleado)
            .query(`UPDATE dbo.empleado SET idEstadoEmpleado = @idEstado WHERE idEmpleado = @id`);
        res.json({ mensaje: 'Estado del empleado actualizado correctamente' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.delete('/horas/:idRegistro', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.idRegistro)
            .query(`DELETE FROM dbo.registrohoras WHERE idRegistroHoras = @id`);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Registro de horas no encontrado' });
        res.json({ mensaje: 'Registro de horas eliminado' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.put('/:id', async (req, res) => {
    const idEmpleado = req.params.id;
    const { nombre, apellido, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, ci, fechaNacimiento, especialidad, idCargo, idDepartamento } = req.body;
    try {
        const pool = await sql.connect(config);
        const existe = await pool.request().input('id', sql.Int, idEmpleado).query(`SELECT 1 FROM dbo.empleado WHERE idEmpleado = @id`);
        if (existe.recordset.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
        if (email) {
            const dup = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('id', sql.Int, idEmpleado)
                .query(`SELECT 1 FROM dbo.empleado WHERE email = @email AND idEmpleado <> @id`);
            if (dup.recordset.length > 0) return res.status(400).json({ error: 'El email ya está en uso' });
        }
        if (ci) {
            const dup = await pool.request()
                .input('ci', sql.NVarChar, ci)
                .input('id', sql.Int, idEmpleado)
                .query(`SELECT 1 FROM dbo.empleado WHERE ci = @ci AND idEmpleado <> @id`);
            if (dup.recordset.length > 0) return res.status(400).json({ error: 'El CI ya está en uso' });
        }
        await pool.request()
            .input('id', sql.Int, idEmpleado)
            .input('nombre', sql.NVarChar, nombre)
            .input('apellido', sql.NVarChar, apellido)
            .input('numCelular', sql.NVarChar, numCelular || null)
            .input('email', sql.NVarChar, email || null)
            .input('direccion', sql.NVarChar, direccion || null)
            .input('salario', sql.Decimal(10, 2), salario || null)
            .input('fechaContratacion', sql.Date, fechaContratacion || null)
            .input('idEstadoEmpleado', sql.Int, idEstadoEmpleado)
            .input('ci', sql.NVarChar, ci || null)
            .input('fechaNacimiento', sql.Date, fechaNacimiento || null)
            .input('especialidad', sql.NVarChar, especialidad || null)
            .input('idCargo', sql.Int, idCargo)
            .input('idDepartamento', sql.Int, idDepartamento)
            .query(`
                UPDATE dbo.empleado SET
                    nombre = @nombre,
                    apellido = @apellido,
                    numCelular = @numCelular,
                    email = @email,
                    direccion = @direccion,
                    salarioReferencial = @salario,
                    fechaContratacion = @fechaContratacion,
                    idEstadoEmpleado = @idEstadoEmpleado,
                    ci = @ci,
                    fechaNacimiento = @fechaNacimiento,
                    especialidad = @especialidad,
                    idCargo = @idCargo,
                    idDepartamento = @idDepartamento
                WHERE idEmpleado = @id
            `);
        res.json({ mensaje: 'Empleado actualizado correctamente' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

module.exports = router;
