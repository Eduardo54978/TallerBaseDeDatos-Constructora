// Traduce errores de SQL Server (sobre todo de triggers) a mensajes
// entendibles para el usuario que gestiona el sistema.

function errorAmigable(err) {
    const raw = (err && err.message) ? String(err.message) : '';

    // Mapa de fragmentos conocidos -> mensaje limpio
    const mapa = [
        { busca: 'cotizacion que ya fue aprobada', msg: 'No se puede modificar una cotización que ya fue aprobada.' },
        { busca: 'no coincide con el contrato de la cuota', msg: 'La cuota seleccionada no pertenece a ese contrato.' },
        { busca: 'total pagado no puede superar el monto de la cuota', msg: 'El pago supera el monto pendiente de la cuota.' },
        { busca: 'saldo pendiente no puede ser mayor', msg: 'El saldo pendiente no puede ser mayor al monto de la cuota.' },
        { busca: 'suma de cuotas no puede superar el monto', msg: 'La suma de las cuotas supera el monto total del contrato.' },
        { busca: 'maximo 8 por registro', msg: 'Las horas deben ser mayores a 0 y máximo 8 por registro.' },
        { busca: 'fecha futura', msg: 'No se pueden registrar horas con fecha futura.' },
        { busca: 'no esta asignado al proyecto', msg: 'El empleado no está asignado a ese proyecto en la fecha indicada.' },
        { busca: 'mas de 8 horas trabajadas en un mismo dia', msg: 'El empleado no puede tener más de 8 horas registradas en un mismo día.' },
        { busca: 'excede el monto total pendiente de la orden', msg: 'El pago excede el monto pendiente de la orden de compra.' },
        { busca: 'contrato que ya tiene pagos registrados', msg: 'No se puede rescindir un contrato que ya tiene pagos registrados.' },
        { busca: 'ordenes de compra pendientes', msg: 'No se puede eliminar el proveedor porque tiene órdenes de compra pendientes.' },
        { busca: 'no esta registrado en el catalogo del proveedor', msg: 'Ese material no está en el catálogo del proveedor de la orden.' },
        { busca: 'excede en mas del 10% el precio acordado', msg: 'El precio supera en más del 10% el precio acordado con el proveedor.' },
        { busca: 'stock insuficiente', msg: 'Stock insuficiente para cubrir la cantidad usada en el proyecto.' }
    ];

    const lower = raw.toLowerCase();
    for (const item of mapa) {
        if (lower.includes(item.busca)) return item.msg;
    }

    // Si el mensaje ya es legible (viene de un trigger con texto claro), lo limpiamos
    if (/^(ERROR|ACCESO DENEGADO|ERROR FINANCIERO)/i.test(raw)) {
        return raw.replace(/^(ERROR FINANCIERO|ACCESO DENEGADO|ERROR)\s*:?\s*/i, '').trim();
    }

    // Errores técnicos comunes -> mensaje genérico
    if (lower.includes('foreign key') || lower.includes('reference') || lower.includes('constraint')) {
        return 'No se puede completar la operación porque hay datos relacionados que lo impiden.';
    }

    return raw || 'Ocurrió un error al procesar la solicitud.';
}

module.exports = { errorAmigable };
