const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

// GET /api/dashboard/balance
// Estado financiero general de la empresa:
//   - Ingresos  = pagos recibidos de clientes.
//   - Egresos   = pagos a proveedores + pagos de planilla.
//   - Balance   = ingresos - egresos  (ganancia o pérdida).
//   - Por proyecto = dónde se está ganando o perdiendo
//     (ingresos del proyecto vs. planilla + materiales del proyecto).
router.get('/balance', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const totales = await pool.request().query(`
            SELECT
                (SELECT ISNULL(SUM(monto), 0)        FROM dbo.pagocliente)            AS ingresos,
                (SELECT ISNULL(SUM(monto), 0)        FROM dbo.pagoproveedor)          AS egresosProveedores,
                (SELECT ISNULL(SUM(montoPagado), 0)  FROM dbo.pagoplanillaproyecto)   AS egresosPlanilla
        `);
        const t = totales.recordset[0];
        const ingresos = Number(t.ingresos);
        const egresosProveedores = Number(t.egresosProveedores);
        const egresosPlanilla = Number(t.egresosPlanilla);
        const egresosTotal = egresosProveedores + egresosPlanilla;
        const balance = ingresos - egresosTotal;

        // Balance por proyecto: ingresos (pagos de cliente vía contrato) contra
        // egresos atribuibles al proyecto (planilla + materiales usados).
        const porProyecto = await pool.request().query(`
            SELECT
                p.idProyecto,
                p.nombreProyecto,
                ISNULL(ing.total, 0)  AS ingresos,
                ISNULL(pla.total, 0) + ISNULL(mat.total, 0) AS egresos,
                ISNULL(ing.total, 0) - (ISNULL(pla.total, 0) + ISNULL(mat.total, 0)) AS balance
            FROM dbo.proyecto p
            LEFT JOIN (
                SELECT c.idProyecto, SUM(pc.monto) AS total
                FROM dbo.pagocliente pc
                JOIN dbo.contrato c ON pc.idContrato = c.idContrato
                GROUP BY c.idProyecto
            ) ing ON ing.idProyecto = p.idProyecto
            LEFT JOIN (
                SELECT idProyecto, SUM(montoPagado) AS total
                FROM dbo.pagoplanillaproyecto
                GROUP BY idProyecto
            ) pla ON pla.idProyecto = p.idProyecto
            LEFT JOIN (
                SELECT idProyecto, SUM(costoTotal) AS total
                FROM dbo.materialproyecto
                GROUP BY idProyecto
            ) mat ON mat.idProyecto = p.idProyecto
            ORDER BY balance ASC
        `);

        res.json({
            ingresos,
            egresosProveedores,
            egresosPlanilla,
            egresosTotal,
            balance,
            estado: balance >= 0 ? 'Ganancia' : 'Pérdida',
            porProyecto: porProyecto.recordset.map(r => ({
                idProyecto: r.idProyecto,
                nombreProyecto: r.nombreProyecto,
                ingresos: Number(r.ingresos),
                egresos: Number(r.egresos),
                balance: Number(r.balance),
            })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
