/*
 * Test de integración de la API de la Constructora.
 *
 * Recorre los endpoints de TODOS los módulos y verifica que respondan
 * correctamente. Incluye un flujo completo de "Pago de Planilla"
 * (crear con bono -> verificar -> eliminar) que comprueba el arreglo
 * del error "Cannot insert NULL into idBonoAntiguedadProyecto".
 *
 * REQUISITOS:
 *   1. El servidor debe estar corriendo:  npm start
 *   2. SQL Server con la base 'constructora' cargada (42Tablas + Datos).
 *
 * EJECUTAR:
 *   node test/test-integracion.js
 */

const API = 'http://localhost:3000/api';

let ok = 0, fail = 0;
const fallos = [];

function verde(t) { return `\x1b[32m${t}\x1b[0m`; }
function rojo(t)  { return `\x1b[31m${t}\x1b[0m`; }
function gris(t)  { return `\x1b[90m${t}\x1b[0m`; }

// Verifica una condición y la registra como prueba pasada/fallada.
function check(nombre, condicion, detalle) {
  if (condicion) {
    ok++;
    console.log(`  ${verde('PASA')}  ${nombre}`);
  } else {
    fail++;
    fallos.push(nombre + (detalle ? ` — ${detalle}` : ''));
    console.log(`  ${rojo('FALLA')} ${nombre}${detalle ? gris('  (' + detalle + ')') : ''}`);
  }
}

// GET que esperamos devuelva un arreglo (lista). Pasa si responde 200 y es array.
async function getLista(nombre, ruta) {
  try {
    const res = await fetch(`${API}${ruta}`);
    const data = await res.json().catch(() => null);
    check(nombre, res.ok && Array.isArray(data), `HTTP ${res.status}`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    check(nombre, false, e.message);
    return [];
  }
}

async function seccion(titulo) {
  console.log(`\n${'='.repeat(60)}\n  ${titulo}\n${'='.repeat(60)}`);
}

async function main() {
  console.log('\nTest de integración — Sistema Constructora');
  console.log(gris(`API: ${API}\n`));

  // Comprobar que el servidor está vivo antes de seguir.
  try {
    await fetch(`${API}/pagos/metodos`);
  } catch (e) {
    console.log(rojo('\nNo se pudo conectar al servidor en ' + API));
    console.log(rojo('Inicia el servidor con "npm start" y vuelve a ejecutar el test.\n'));
    process.exit(1);
  }

  await seccion('Catálogos y datos base');
  await getLista('GET /pagos/metodos (métodos de pago)', '/pagos/metodos');
  await getLista('GET /pagos/estados (estados de pago)', '/pagos/estados');
  await getLista('GET /clientes/tipos/lista', '/clientes/tipos/lista');
  await getLista('GET /contratos/tipos/lista', '/contratos/tipos/lista');
  await getLista('GET /contratos/estados/lista', '/contratos/estados/lista');
  await getLista('GET /materiales/tipos/lista', '/materiales/tipos/lista');
  await getLista('GET /materiales/unidades/lista', '/materiales/unidades/lista');
  await getLista('GET /empleados/cargos/lista', '/empleados/cargos/lista');
  await getLista('GET /empleados/departamentos/lista', '/empleados/departamentos/lista');
  await getLista('GET /empleadoproyecto/roles/lista', '/empleadoproyecto/roles/lista');
  await getLista('GET /proyectos/parametros/tipos', '/proyectos/parametros/tipos');
  await getLista('GET /proyectos/parametros/estados', '/proyectos/parametros/estados');

  await seccion('Panel principal — Balance financiero');
  try {
    const res = await fetch(`${API}/dashboard/balance`);
    const d = await res.json().catch(() => null);
    check('GET /dashboard/balance devuelve ingresos, egresos y por proyecto',
      res.ok && d && typeof d.balance === 'number' && Array.isArray(d.porProyecto), `HTTP ${res.status}`);
  } catch (e) {
    check('GET /dashboard/balance responde', false, e.message);
  }

  await seccion('Módulo 1 — Proyectos / Empleado-Proyecto');
  await getLista('GET /proyectos', '/proyectos');
  await getLista('GET /proyectos/search?q=a', '/proyectos/search?q=a');
  await getLista('GET /empleadoproyecto', '/empleadoproyecto');
  await getLista('GET /empleadoproyecto/empleados-estado', '/empleadoproyecto/empleados-estado');
  // Inspección de proyecto (datos + personal + materiales)
  try {
    const proyectos = await (await fetch(`${API}/proyectos`)).json();
    if (Array.isArray(proyectos) && proyectos.length) {
      const res = await fetch(`${API}/proyectos/${proyectos[0].idProyecto}/inspeccion`);
      const d = await res.json().catch(() => null);
      check('GET /proyectos/:id/inspeccion devuelve personal y materiales',
        res.ok && d && Array.isArray(d.personal) && Array.isArray(d.materiales), `HTTP ${res.status}`);
    }
  } catch (e) {
    check('GET /proyectos/:id/inspeccion responde', false, e.message);
  }

  await seccion('Módulo 2 — Materiales / Inventario');
  await getLista('GET /materiales', '/materiales');
  await getLista('GET /materiales/search?q=a', '/materiales/search?q=a');
  await getLista('GET /inventario', '/inventario');
  await getLista('GET /materialproyecto', '/materialproyecto');
  await getLista('GET /materialproyecto/alertas', '/materialproyecto/alertas');

  await seccion('Módulo 3 — Pagos y Cuotas');
  await getLista('GET /pagos/clientes', '/pagos/clientes');
  await getLista('GET /pagos/proveedores', '/pagos/proveedores');
  await getLista('GET /pagos/planilla', '/pagos/planilla');
  await getLista('GET /pagos/bonos (NUEVO)', '/pagos/bonos');
  await getLista('GET /cuotas', '/cuotas');
  await getLista('GET /cuotas/pendientes', '/cuotas/pendientes');
  await getLista('GET /cuotas/vencidas', '/cuotas/vencidas');

  await seccion('Módulo 4 — Compras');
  await getLista('GET /compras', '/compras');
  await getLista('GET /compras/estados', '/compras/estados');
  await getLista('GET /compras/search?q=a', '/compras/search?q=a');

  await seccion('Módulo 5 — Contratos');
  await getLista('GET /contratos', '/contratos');
  await getLista('GET /contratos/search?q=a', '/contratos/search?q=a');

  await seccion('Módulo 6 — Proveedores');
  await getLista('GET /proveedores', '/proveedores');
  await getLista('GET /proveedores/search?q=a', '/proveedores/search?q=a');

  await seccion('Módulo 7 — Clientes');
  await getLista('GET /clientes', '/clientes');
  await getLista('GET /clientes/search?q=a', '/clientes/search?q=a');

  await seccion('Módulo 8 — RR.HH. / Empleados');
  await getLista('GET /empleados', '/empleados');
  await getLista('GET /empleados/search?q=a', '/empleados/search?q=a');
  await getLista('GET /horas (registro de horas)', '/horas');

  await seccion('Bitácora / Movimientos (logs)');
  await getLista('GET /bitacora (lista de movimientos)', '/bitacora?limite=5');
  try {
    const res = await fetch(`${API}/bitacora/resumen`);
    const data = await res.json().catch(() => null);
    check('GET /bitacora/resumen responde con porUsuario y porModulo',
      res.ok && data && Array.isArray(data.porUsuario) && Array.isArray(data.porModulo), `HTTP ${res.status}`);
  } catch (e) {
    check('GET /bitacora/resumen responde', false, e.message);
  }

  await seccion('Módulo 9 — Cotizaciones');
  await getLista('GET /cotizaciones', '/cotizaciones');
  await getLista('GET /cotizaciones/interna', '/cotizaciones/interna');

  // ── Flujo crítico: Pago de Planilla con bono (el bug reportado) ───────────
  await seccion('FLUJO CRÍTICO — Pago de Planilla con bono de antigüedad');

  const bonos = await getLista('GET /pagos/bonos devuelve bonos para el flujo', '/pagos/bonos');
  const metodos = await (await fetch(`${API}/pagos/metodos`)).json().catch(() => []);
  const estados = await (await fetch(`${API}/pagos/estados`)).json().catch(() => []);

  if (!bonos.length || !metodos.length || !estados.length) {
    check('Datos suficientes para probar el pago de planilla', false,
      'Faltan bonos, métodos o estados precargados');
  } else {
    const bono = bonos[0];

    // 1) Comprobar que SIN bono el backend responde error controlado (400), no se cae (500).
    try {
      const resNull = await fetch(`${API}/pagos/planilla`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idEmpleado: bono.idEmpleado,
          idProyecto: bono.idProyecto,
          idBonoAntiguedadProyecto: null,
          fechaPago: '2026-05-24',
          montoPagado: 100,
          idMetodoPago: metodos[0].idMetodoPago,
          idEstadoPago: estados[0].idEstadoPago
        })
      });
      check('POST /pagos/planilla sin bono devuelve error controlado (no 500)',
        resNull.status >= 400 && resNull.status < 500, `HTTP ${resNull.status}`);
    } catch (e) {
      check('POST /pagos/planilla sin bono devuelve error controlado', false, e.message);
    }

    // 2) Crear un pago de planilla CON bono (debe funcionar tras el arreglo).
    let nuevoId = null;
    try {
      const resPost = await fetch(`${API}/pagos/planilla`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idEmpleado: bono.idEmpleado,
          idProyecto: bono.idProyecto,
          idBonoAntiguedadProyecto: bono.idBonoAntiguedadProyecto,
          fechaPago: '2026-05-24',
          montoPagado: bono.salarioFinalProyecto || 1000,
          idMetodoPago: metodos[0].idMetodoPago,
          idEstadoPago: estados[0].idEstadoPago
        })
      });
      const dataPost = await resPost.json().catch(() => ({}));
      nuevoId = dataPost.idPagoPlanillaProyecto;
      check('POST /pagos/planilla CON bono crea el registro', resPost.ok && nuevoId > 0,
        `HTTP ${resPost.status} ${dataPost.error || ''}`);
    } catch (e) {
      check('POST /pagos/planilla CON bono crea el registro', false, e.message);
    }

    // 3) Verificar que aparece en el listado.
    if (nuevoId) {
      const lista = await (await fetch(`${API}/pagos/planilla`)).json().catch(() => []);
      const encontrado = Array.isArray(lista) && lista.some(p => p.idPagoPlanillaProyecto === nuevoId);
      check('El pago creado aparece en GET /pagos/planilla', encontrado);

      // 4) Limpieza: eliminar el registro de prueba.
      try {
        const resDel = await fetch(`${API}/pagos/planilla/${nuevoId}`, { method: 'DELETE' });
        check('DELETE /pagos/planilla limpia el registro de prueba', resDel.ok, `HTTP ${resDel.status}`);
      } catch (e) {
        check('DELETE /pagos/planilla limpia el registro de prueba', false, e.message);
      }
    }
  }

  // ── Flujos de escritura (crear y borrar) en módulos con CRUD limpio ───────
  await seccion('FLUJOS DE ESCRITURA — crear y borrar (con limpieza)');

  const sello = Date.now().toString().slice(-6); // sufijo único para no chocar con duplicados

  // POST genérico que crea, verifica y luego borra el registro de prueba.
  async function crearYBorrar(nombre, rutaPost, payload, campoId, rutaDelete) {
    let id = null;
    try {
      const res = await fetch(`${API}${rutaPost}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      id = data[campoId];
      check(`POST ${rutaPost} crea (${nombre})`, res.ok && id > 0,
        `HTTP ${res.status} ${data.error || ''}`);
    } catch (e) {
      check(`POST ${rutaPost} crea (${nombre})`, false, e.message);
    }
    if (id) {
      try {
        const resDel = await fetch(`${API}${rutaDelete(id)}`, { method: 'DELETE' });
        check(`DELETE limpia el ${nombre} de prueba`, resDel.ok, `HTTP ${resDel.status}`);
      } catch (e) {
        check(`DELETE limpia el ${nombre} de prueba`, false, e.message);
      }
    }
  }

  // Clientes (necesita un tipo de cliente válido)
  const tiposCli = await (await fetch(`${API}/clientes/tipos/lista`)).json().catch(() => []);
  if (tiposCli.length) {
    await crearYBorrar('cliente', '/clientes', {
      nombre: `TEST Cliente ${sello}`,
      idTipoCliente: tiposCli[0].idTipoCliente,
      documentoID: `TEST-${sello}`
    }, 'idCliente', id => `/clientes/${id}`);
  } else {
    check('Hay tipos de cliente para probar creación de cliente', false);
  }

  // Proveedores (solo requiere nombre)
  await crearYBorrar('proveedor', '/proveedores', {
    nombreProveedor: `TEST Proveedor ${sello}`
  }, 'idProveedor', id => `/proveedores/${id}`);

  // Materiales (necesita tipo y unidad de medida válidos)
  const tiposMat = await (await fetch(`${API}/materiales/tipos/lista`)).json().catch(() => []);
  const unidades = await (await fetch(`${API}/materiales/unidades/lista`)).json().catch(() => []);
  if (tiposMat.length && unidades.length) {
    await crearYBorrar('material', '/materiales', {
      nombreMaterial: `TEST Material ${sello}`,
      idTipoMaterial: tiposMat[0].idTipoMaterial,
      idUnidadMedida: unidades[0].idUnidadMedida,
      precioUnitario: 99.99
    }, 'idMaterial', id => `/materiales/${id}`);
  } else {
    check('Hay tipos/unidades para probar creación de material', false);
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  RESUMEN:  ${verde(ok + ' pasaron')}   ${fail ? rojo(fail + ' fallaron') : '0 fallaron'}`);
  console.log('='.repeat(60));
  if (fallos.length) {
    console.log('\nPruebas que fallaron:');
    fallos.forEach(f => console.log(`  - ${f}`));
  }
  console.log('');
  process.exit(fail ? 1 : 0);
}

main();
