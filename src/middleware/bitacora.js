// Middleware de bitácora.
// Registra automáticamente en dbo.bitacora cada acción de escritura
// (POST / PUT / DELETE) de CUALQUIER módulo, junto con el usuario que la
// ejecutó. La identidad del usuario llega en cabeceras que el frontend
// agrega desde el localStorage de la sesión (ver public/js/autocomplete.js).
const { sql, config } = require('../config/db');

// HTTP -> acción legible
const ACCION_POR_METODO = { POST: 'CREAR', PUT: 'EDITAR', PATCH: 'EDITAR', DELETE: 'ELIMINAR' };

// Saca el nombre del módulo de la ruta: /api/pagos/planilla -> "pagos"
function moduloDeRuta(ruta) {
    const m = /^\/api\/([^/?]+)/.exec(ruta || '');
    return m ? m[1] : null;
}

// Inserta el registro sin bloquear la respuesta al usuario.
async function guardarLog(datos) {
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('idUsuario',      sql.Int,           datos.idUsuario || null)
            .input('username',       sql.NVarChar(50),  datos.username || null)
            .input('rol',            sql.NVarChar(50),  datos.rol || null)
            .input('nombreCompleto', sql.NVarChar(150), datos.nombreCompleto || null)
            .input('accion',         sql.NVarChar(20),  datos.accion)
            .input('modulo',         sql.NVarChar(50),  datos.modulo || null)
            .input('descripcion',    sql.NVarChar(500), datos.descripcion || null)
            .input('metodoHttp',     sql.NVarChar(10),  datos.metodoHttp || null)
            .input('ruta',           sql.NVarChar(300), datos.ruta || null)
            .input('exito',          sql.Bit,           datos.exito ? 1 : 0)
            .query(`
                INSERT INTO dbo.bitacora
                    (idUsuario, username, rol, nombreCompleto, accion, modulo,
                     descripcion, metodoHttp, ruta, exito, fechaHora)
                VALUES
                    (@idUsuario, @username, @rol, @nombreCompleto, @accion, @modulo,
                     @descripcion, @metodoHttp, @ruta, @exito, GETDATE())
            `);
    } catch (e) {
        // La bitácora nunca debe tumbar la operación principal; solo se avisa.
        console.error('[bitacora] no se pudo registrar:', e.message);
    }
}

// Helper para registrar acciones puntuales desde una ruta (ej: LOGIN).
function registrarAccion(req, { accion, modulo, descripcion, exito = true }) {
    guardarLog({
        idUsuario:      req.headers['x-usuario-id'] ? parseInt(req.headers['x-usuario-id']) : null,
        username:       req.headers['x-usuario-username'] || null,
        rol:            req.headers['x-usuario-rol'] || null,
        nombreCompleto: req.headers['x-usuario-nombre']
            ? decodeURIComponent(req.headers['x-usuario-nombre']) : null,
        accion,
        modulo,
        descripcion,
        metodoHttp: req.method,
        ruta: req.originalUrl,
        exito,
    });
}

// Middleware global: se engancha al final de la respuesta.
function bitacoraMiddleware(req, res, next) {
    const accion = ACCION_POR_METODO[req.method];
    // Solo registramos escrituras sobre /api (las lecturas GET no generan log).
    if (!accion || !req.originalUrl.startsWith('/api')) return next();
    // El login se registra aparte (con acción LOGIN) dentro de su propia ruta.
    if (req.originalUrl.startsWith('/api/login')) return next();
    // La gestión de la propia bitácora (ej: limpiar) se registra dentro de su ruta.
    if (req.originalUrl.startsWith('/api/bitacora')) return next();

    res.on('finish', () => {
        const exito = res.statusCode < 400;
        const modulo = moduloDeRuta(req.originalUrl);
        const nombre = req.headers['x-usuario-nombre']
            ? decodeURIComponent(req.headers['x-usuario-nombre']) : null;
        guardarLog({
            idUsuario:      req.headers['x-usuario-id'] ? parseInt(req.headers['x-usuario-id']) : null,
            username:       req.headers['x-usuario-username'] || null,
            rol:            req.headers['x-usuario-rol'] || null,
            nombreCompleto: nombre,
            accion,
            modulo,
            descripcion: `${accion} en ${modulo || 'sistema'} (${req.method} ${req.originalUrl})`,
            metodoHttp: req.method,
            ruta: req.originalUrl,
            exito,
        });
    });
    next();
}

module.exports = { bitacoraMiddleware, registrarAccion };
