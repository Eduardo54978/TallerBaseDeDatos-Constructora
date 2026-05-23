const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

// ÔöÇÔöÇ GET todos los proveedores ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT idProveedor, nombreProveedor, numCelular, email, direccion, ciudad, pais
            FROM dbo.proveedor
            ORDER BY nombreProveedor
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
            .query(`SELECT TOP 10 idProveedor, nombreProveedor FROM dbo.proveedor WHERE nombreProveedor LIKE @q OR CAST(idProveedor AS NVARCHAR) LIKE @q ORDER BY nombreProveedor`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT * FROM dbo.proveedor WHERE idProveedor = @id`);
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ÔöÇÔöÇ POST registrar proveedor ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.post('/', async (req, res) => {
    // Nota: El documento pide NIT y TipoProveedor, pero la DB en 42Tablas.sql 
    // no contiene dichas columnas en dbo.proveedor.
    const { nombreProveedor, numCelular, email, direccion, ciudad, pais } = req.body;
    
    if (!nombreProveedor) return res.status(400).json({ error: 'nombreProveedor es obligatorio' });

    try {
        const pool = await sql.connect(config);

        // Validar nombre duplicado (sustituye la validaci├│n de NIT duplicado)
        const dup = await pool.request()
            .input('nombre', sql.NVarChar, nombreProveedor)
            .query(`SELECT 1 FROM dbo.proveedor WHERE nombreProveedor = @nombre`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'Ya existe un proveedor registrado con ese nombre' });

        const result = await pool.request()
            .input('nombre',    sql.NVarChar, nombreProveedor)
            .input('celular',   sql.NVarChar, numCelular || null)
            .input('email',     sql.NVarChar, email      || null)
            .input('direccion', sql.NVarChar, direccion  || null)
            .input('ciudad',    sql.NVarChar, ciudad     || null)
            .input('pais',      sql.NVarChar, pais       || null)
            .query(`
                INSERT INTO dbo.proveedor (nombreProveedor, numCelular, email, direccion, ciudad, pais)
                OUTPUT INSERTED.idProveedor
                VALUES (@nombre, @celular, @email, @direccion, @ciudad, @pais)
            `);
        res.status(201).json({ idProveedor: result.recordset[0].idProveedor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ÔöÇÔöÇ PUT actualizar proveedor ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.put('/:id', async (req, res) => {
    const idProveedor = req.params.id;
    const { nombreProveedor, numCelular, email, direccion, ciudad, pais } = req.body;

    try {
        const pool = await sql.connect(config);
        const existe = await pool.request()
            .input('id', sql.Int, idProveedor)
            .query(`SELECT 1 FROM dbo.proveedor WHERE idProveedor = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Proveedor no encontrado' });

        if (nombreProveedor) {
            const dup = await pool.request()
                .input('nombre', sql.NVarChar, nombreProveedor)
                .input('id', sql.Int, idProveedor)
                .query(`SELECT 1 FROM dbo.proveedor WHERE nombreProveedor = @nombre AND idProveedor <> @id`);
            if (dup.recordset.length > 0)
                return res.status(400).json({ error: 'El nombre ya est├í en uso por otro proveedor' });
        }

        await pool.request()
            .input('id',        sql.Int,      idProveedor)
            .input('nombre',    sql.NVarChar, nombreProveedor)
            .input('celular',   sql.NVarChar, numCelular || null)
            .input('email',     sql.NVarChar, email      || null)
            .input('direccion', sql.NVarChar, direccion  || null)
            .input('ciudad',    sql.NVarChar, ciudad     || null)
            .input('pais',      sql.NVarChar, pais       || null)
            .query(`
                UPDATE dbo.proveedor SET 
                    nombreProveedor = @nombre, numCelular = @celular, email = @email,
                    direccion = @direccion, ciudad = @ciudad, pais = @pais
                WHERE idProveedor = @id
            `);
        res.json({ mensaje: 'Proveedor actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ÔöÇÔöÇ DELETE desactivar/eliminar proveedor ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.delete('/:id', async (req, res) => {
    // Al ejecutar DELETE, el Trigger "trg_validar_desactivacion_proveedor" 
    // verificar├í si tiene ├│rdenes de compra pendientes y abortar├í si es as├¡.
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM dbo.proveedor WHERE idProveedor = @id`);
            
        res.json({ mensaje: 'Proveedor desactivado/eliminado correctamente' });
    } catch (err) {
        // El trigger bloquea si el proveedor tiene órdenes de compra pendientes
        const msg = (err.message || '').toLowerCase();
        let amigable = 'No se pudo desactivar el proveedor.';
        if (msg.includes('orden') || msg.includes('pendiente') || msg.includes('trg')) {
            amigable = 'No se puede desactivar este proveedor porque tiene órdenes de compra pendientes. Primero entregue o cancele esas órdenes.';
        } else if (msg.includes('reference') || msg.includes('fk_') || msg.includes('constraint')) {
            amigable = 'No se puede desactivar este proveedor porque tiene registros asociados (órdenes o catálogo de materiales).';
        }
        res.status(400).json({ error: amigable });
    }
});

// ÔöÇÔöÇ GET materiales de un proveedor espec├¡fico ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.get('/:id/materiales', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    pm.idProveedorMaterial, m.idMaterial, m.nombreMaterial,
                    pm.precioProveedor, pm.tiempoEntrega
                FROM dbo.proveedormaterial pm
                JOIN dbo.material m ON pm.idMaterial = m.idMaterial
                WHERE pm.idProveedor = @id
                ORDER BY m.nombreMaterial
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

