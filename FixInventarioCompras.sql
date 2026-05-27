USE constructora;
GO

/*
    FIX: el inventario subia con ordenes de compra Pendientes y se duplicaba al Entregar.

    Causa:
      - trg_actualizar_inventario_compra sumaba al inventario al INSERTAR el detalle
        de compra, sin importar el estado de la orden (incluso Pendiente).
      - Ademas, el backend (src/routes/compras.js) vuelve a sumar al pasar a Entregada,
        provocando doble conteo.
      - trg_revertir_inventario_orden_cancelada restaba stock al cancelar, pero como
        solo se cancelan ordenes Pendientes (que nunca sumaron stock) dejaba el stock
        en negativo.

    Regla de negocio acordada:
      El stock SOLO se actualiza cuando la orden pasa a "Entregada".
      Esa logica vive en el backend; la BD no debe tocar el inventario en compras.

    Este script elimina ambos triggers. Es idempotente.
*/

DROP TRIGGER IF EXISTS dbo.trg_actualizar_inventario_compra;
GO

DROP TRIGGER IF EXISTS dbo.trg_revertir_inventario_orden_cancelada;
GO

PRINT 'Triggers de inventario sobre compras eliminados. El stock ahora solo cambia al marcar Entregada.';
GO
