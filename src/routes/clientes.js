const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

// â”€â”€ GET todos los clientes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                c.idCliente,
                c.nombre,
                c.documentoID,
                c.numCelular,
                c.email,
                c.direccion,
                c.fechaRegistro,
                tc.nombreTipoCliente
            FROM dbo.cliente c
            JOIN dbo.tipocliente tc ON c.idTipoCliente = tc.idTipoCliente
            ORDER BY c.nombre
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ GET consultar cliente por id o documentoID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/:id', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    c.idCliente,
                    c.nombre,
                    c.documentoID,
                    c.numCelular,
                    c.email,
                    c.direccion,
                    c.fechaRegistro,
                    tc.idTipoCliente,
                    tc.nombreTipoCliente
                FROM dbo.cliente c
                JOIN dbo.tipocliente tc ON c.idTipoCliente = tc.idTipoCliente
                WHERE c.idCliente = @id
            `);
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST registrar tipo de cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/tipos', async (req, res) => {
    const { nombreTipoCliente, descripcionTipoCliente } = req.body;
    if (!nombreTipoCliente)
        return res.status(400).json({ error: 'nombreTipoCliente es obligatorio' });
    try {
        const pool = await sql.connect(config);

        // Validar duplicado
        const dup = await pool.request()
            .input('nombre', sql.NVarChar, nombreTipoCliente)
            .query(`SELECT 1 FROM dbo.tipocliente WHERE nombreTipoCliente = @nombre`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'Ya existe un tipo de cliente con ese nombre' });

        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombreTipoCliente)
            .input('descripcion', sql.NVarChar, descripcionTipoCliente || null)
            .query(`
                INSERT INTO dbo.tipocliente (nombreTipoCliente, descripcionTipoCliente)
                OUTPUT INSERTED.idTipoCliente
                VALUES (@nombre, @descripcion)
            `);
        res.status(201).json({ idTipoCliente: result.recordset[0].idTipoCliente });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ GET todos los tipos de cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/tipos/lista', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`SELECT * FROM dbo.tipocliente ORDER BY nombreTipoCliente`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST registrar cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/', async (req, res) => {
    const { nombre, idTipoCliente, documentoID, numCelular, email, direccion, fechaRegistro } = req.body;

    if (!nombre || !documentoID)
        return res.status(400).json({ error: 'nombre y documentoID son obligatorios' });

    try {
        const pool = await sql.connect(config);

        // Validar documentoID duplicado
        const dupDoc = await pool.request()
            .input('doc', sql.NVarChar, documentoID)
            .query(`SELECT 1 FROM dbo.cliente WHERE documentoID = @doc`);
        if (dupDoc.recordset.length > 0)
            return res.status(400).json({ error: 'Ya existe un cliente con ese documentoID' });

        // Validar email duplicado
        if (email) {
            const dupEmail = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(`SELECT 1 FROM dbo.cliente WHERE email = @email`);
            if (dupEmail.recordset.length > 0)
                return res.status(400).json({ error: 'Ya existe un cliente con ese email' });
        }

        // Validar que idTipoCliente exista
        const tipoExiste = await pool.request()
            .input('idTipo', sql.Int, idTipoCliente)
            .query(`SELECT 1 FROM dbo.tipocliente WHERE idTipoCliente = @idTipo`);
        if (tipoExiste.recordset.length === 0)
            return res.status(400).json({ error: 'idTipoCliente no existe' });

        const result = await pool.request()
            .input('nombre',        sql.NVarChar,  nombre)
            .input('idTipo',        sql.Int,        idTipoCliente)
            .input('documentoID',   sql.NVarChar,  documentoID)
            .input('numCelular',    sql.NVarChar,  numCelular    || null)
            .input('email',         sql.NVarChar,  email         || null)
            .input('direccion',     sql.NVarChar,  direccion     || null)
            .input('fechaRegistro', sql.Date,       fechaRegistro || null)
            .query(`
                INSERT INTO dbo.cliente (nombre, idTipoCliente, documentoID, numCelular, email, direccion, fechaRegistro)
                OUTPUT INSERTED.idCliente
                VALUES (@nombre, @idTipo, @documentoID, @numCelular, @email, @direccion, @fechaRegistro)
            `);
        res.status(201).json({ idCliente: result.recordset[0].idCliente });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ PUT actualizar cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.put('/:id', async (req, res) => {
    const { nombre, idTipoCliente, documentoID, numCelular, email, direccion, fechaRegistro } = req.body;
    const idCliente = req.params.id;

    try {
        const pool = await sql.connect(config);

        // Validar que el cliente exista
        const existe = await pool.request()
            .input('id', sql.Int, idCliente)
            .query(`SELECT 1 FROM dbo.cliente WHERE idCliente = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Cliente no encontrado' });

        // Validar documentoID duplicado en otro cliente
        if (documentoID) {
            const dupDoc = await pool.request()
                .input('doc', sql.NVarChar, documentoID)
                .input('id',  sql.Int,      idCliente)
                .query(`SELECT 1 FROM dbo.cliente WHERE documentoID = @doc AND idCliente <> @id`);
            if (dupDoc.recordset.length > 0)
                return res.status(400).json({ error: 'documentoID ya estÃ¡ en uso por otro cliente' });
        }

        // Validar email duplicado en otro cliente
        if (email) {
            const dupEmail = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('id',    sql.Int,      idCliente)
                .query(`SELECT 1 FROM dbo.cliente WHERE email = @email AND idCliente <> @id`);
            if (dupEmail.recordset.length > 0)
                return res.status(400).json({ error: 'email ya estÃ¡ en uso por otro cliente' });
        }

        // Validar idTipoCliente
        if (idTipoCliente) {
            const tipoExiste = await pool.request()
                .input('idTipo', sql.Int, idTipoCliente)
                .query(`SELECT 1 FROM dbo.tipocliente WHERE idTipoCliente = @idTipo`);
            if (tipoExiste.recordset.length === 0)
                return res.status(400).json({ error: 'idTipoCliente no existe' });
        }

        await pool.request()
            .input('id',            sql.Int,       idCliente)
            .input('nombre',        sql.NVarChar,  nombre)
            .input('idTipo',        sql.Int,        idTipoCliente)
            .input('documentoID',   sql.NVarChar,  documentoID)
            .input('numCelular',    sql.NVarChar,  numCelular    || null)
            .input('email',         sql.NVarChar,  email         || null)
            .input('direccion',     sql.NVarChar,  direccion     || null)
            .input('fechaRegistro', sql.Date,       fechaRegistro || null)
            .query(`
                UPDATE dbo.cliente SET
                    nombre        = @nombre,
                    idTipoCliente = @idTipo,
                    documentoID   = @documentoID,
                    numCelular    = @numCelular,
                    email         = @email,
                    direccion     = @direccion,
                    fechaRegistro = @fechaRegistro
                WHERE idCliente = @id
            `);
        res.json({ mensaje: 'Cliente actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
