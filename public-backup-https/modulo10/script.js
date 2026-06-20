// ─────────────────────────────────────────────────────────────────────────────
// Módulo 10 — Reportes / Buscador General (frontend).
// Busca proyectos/empleados/materiales/clientes por id o nombre y muestra una
// ficha completa de cada uno, lista para imprimir/PDF.
// Usa los helpers de ../js/imprimirPDF.js y ../js/reportes.js.
// ─────────────────────────────────────────────────────────────────────────────

const API = '/api';
let _tipo = '';            // filtro de tipo activo ('' = todo)
let _debounce = null;      // timer del buscador
let _detalleActual = null; // { tipo, id, data } para imprimir
let _rango = { desde: '', hasta: '' }; // filtro de fechas de la ficha abierta

// Etiquetas por tipo de resultado.
const TIPOS = {
  proyecto: { label: 'Proyecto' },
  empleado: { label: 'Empleado' },
  material: { label: 'Material' },
  cliente:  { label: 'Cliente'  },
};

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const bs = n => 'Bs ' + Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = f => f ? String(f).substring(0, 10) : '-';
// Nombre completo del cliente (nombre + apellido, soporta empresas sin apellido).
const nombreCli = c => `${c.nombre || ''} ${c.apellido || ''}`.trim();

// ── Inicio ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', cargarResumen);

async function cargarResumen() {
  try {
    const r = await fetch(`${API}/reportes/resumen`);
    const d = await r.json();
    $('rep-stats').innerHTML = `
      <div class="sb"><div class="n">${d.proyectosActivos}/${d.totalProyectos}</div><div class="l">Proyectos activos</div></div>
      <div class="sb"><div class="n">${d.totalEmpleados}</div><div class="l">Empleados</div></div>
      <div class="sb"><div class="n">${d.totalMateriales}</div><div class="l">Materiales</div></div>
      <div class="sb"><div class="n">${bs(d.valorMateriales)}</div><div class="l">Valor materiales usados</div></div>
      <div class="sb warn"><div class="n">${bs(d.totalPendiente)}</div><div class="l">Pagos pendientes</div></div>`;
  } catch (e) {
    $('rep-stats').innerHTML = '<div class="sb"><div class="l">No se pudo cargar el resumen</div></div>';
  }
}

// ── Buscador ──────────────────────────────────────────────────────────────────
function setTipo(el) {
  document.querySelectorAll('.rep-tipo').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  _tipo = el.dataset.tipo || '';
  buscarGlobal();
}

function buscarGlobal() {
  clearTimeout(_debounce);
  _debounce = setTimeout(_ejecutarBusqueda, 250);
}

async function _ejecutarBusqueda() {
  const q = $('rep-q').value.trim();
  const cont = $('rep-resultados');
  if (!q) { cont.innerHTML = ''; return; }
  cont.innerHTML = '<p class="rep-vacio">Buscando…</p>';
  try {
    const params = new URLSearchParams({ q });
    if (_tipo) params.set('tipo', _tipo);
    const r = await fetch(`${API}/reportes/buscar?${params}`);
    const lista = await r.json();
    if (!Array.isArray(lista) || !lista.length) {
      cont.innerHTML = '<p class="rep-vacio">Sin resultados.</p>';
      return;
    }
    cont.innerHTML = lista.map(it => {
      const t = TIPOS[it.tipo] || { label: it.tipo };
      return `<div class="rep-item" onclick="abrirDetalle('${it.tipo}', ${it.id})">
        <span class="chip">${t.label}</span>
        <div class="info">
          <div class="t">${esc(it.titulo)} <span style="color:var(--text-muted);font-weight:400;">#${it.id}</span></div>
          <div class="s">${esc(it.subtitulo || '')}</div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    cont.innerHTML = '<p class="rep-vacio">Error al buscar.</p>';
  }
}

// ── Detalle / ficha ───────────────────────────────────────────────────────────
async function abrirDetalle(tipo, id, conservarRango) {
  if (!conservarRango) _rango = { desde: '', hasta: '' };
  const cont = $('rep-detalle');
  cont.style.display = 'block';
  cont.innerHTML = '<p class="rep-vacio">Cargando ficha…</p>';
  cont.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    const base = tipo === 'proyecto'
      ? `${API}/proyectos/${id}/reporte`
      : `${API}/reportes/${tipo}/${id}`;
    const url = base + rangoQuery(_rango.desde, _rango.hasta);
    const r = await fetch(url);
    if (!r.ok) throw new Error('No encontrado');
    const data = await r.json();
    _detalleActual = { tipo, id, data };
    ({ proyecto: renderProyecto, empleado: renderEmpleado,
       material: renderMaterial, cliente: renderCliente }[tipo])(cont, data);
  } catch (e) {
    cont.innerHTML = '<p class="rep-vacio">No se pudo cargar la ficha.</p>';
  }
}

function cabecera(titulo, sub) {
  const etq = (_rango.desde || _rango.hasta) ? ` · ${etiquetaRango(_rango.desde, _rango.hasta)}` : '';
  return `<div class="ficha-head">
    <div><h3 style="border:none;margin:0;">${esc(titulo)}</h3>
      <div style="color:var(--text-muted);font-size:.85rem;">${esc(sub || '')}${esc(etq)}</div></div>
    <button class="btn btn-accent" style="padding:8px 16px;" onclick="imprimirDetalle()">Imprimir / PDF</button>
  </div>
  <div class="rango-fechas">
    <div class="form-group"><label>Desde</label>
      <input type="date" id="rep-desde" value="${_rango.desde}" onchange="aplicarRango()"></div>
    <div class="form-group"><label>Hasta</label>
      <input type="date" id="rep-hasta" value="${_rango.hasta}" onchange="aplicarRango()"></div>
    <button class="btn btn-accent" style="padding:8px 14px;" onclick="limpiarRango()">Quitar fechas</button>
  </div>`;
}

// Relee el rango de fechas y recarga la ficha abierta filtrando las secciones
// con fecha (horas, pagos, materiales usados, contratos, etc.).
function aplicarRango() {
  const desde = $('rep-desde')?.value || '';
  const hasta = $('rep-hasta')?.value || '';
  const v = validarRangoFechas(desde, hasta);
  if (!v.ok) { alert(v.error); return; }
  _rango = { desde, hasta };
  if (_detalleActual) abrirDetalle(_detalleActual.tipo, _detalleActual.id, true);
}

function limpiarRango() {
  _rango = { desde: '', hasta: '' };
  if (_detalleActual) abrirDetalle(_detalleActual.tipo, _detalleActual.id, true);
}
function datos(pares) {
  return `<div class="ficha-datos">${pares.filter(p => p[1] != null && p[1] !== '')
    .map(([k, v]) => `<div><span class="k">${esc(k)}:</span> <span class="v">${esc(v)}</span></div>`).join('')}</div>`;
}
function tabla(enc, filas) {
  if (!filas.length) return '<p class="rep-vacio">Sin registros.</p>';
  return `<table class="rep-tabla"><thead><tr>${
    enc.map((h, i) => `<th class="${i === 0 ? '' : 'num'}">${esc(h)}</th>`).join('')
  }</tr></thead><tbody>${
    filas.map(f => `<tr>${f.map((c, i) => `<td class="${i === 0 ? '' : 'num'}">${esc(c)}</td>`).join('')}</tr>`).join('')
  }</tbody></table>`;
}
const seccion = (t, html) => `<div class="rep-seccion"><h4>${esc(t)}</h4>${html}</div>`;

// ── Proyecto (reusa /api/proyectos/:id/reporte) ─────────────────────────────
function renderProyecto(cont, d) {
  const p = d.proyecto;
  cont.innerHTML = cabecera(p.nombreProyecto, `Expediente de proyecto #${p.idProyecto}`)
    + datos([
        ['Cliente', p.nombreCliente], ['Tipo', p.nombreTipoProyecto], ['Estado', p.nombreEstadoProyecto],
        ['Ubicación', p.ubicacion], ['Inicio', fecha(p.fechaInicio)],
        ['Fin estimado', fecha(p.fechaFinEstimada)], ['Fin real', fecha(p.fechaFinReal)],
      ])
    + seccion('Personal asignado', tabla(['Empleado', 'Cargo', 'Rol', 'Inicio', 'Fin'],
        d.personal.map(x => [x.empleado, x.nombreCargo, x.nombreRolProyecto, fecha(x.fechaInicio), fecha(x.fechaFin)])))
    + seccion('Materiales usados', tabla(['Material', 'Cantidad', 'Costo'],
        d.materiales.map(x => [x.nombreMaterial, x.cantidadUtilizada, bs(x.costoTotal)])))
    + seccion('Contratos', tabla(['N° Contrato', 'Tipo', 'Firma', 'Vence', 'Monto'],
        d.contratos.map(x => [x.numeroContrato, x.nombreTipoContrato, fecha(x.fechaFirma), fecha(x.fechaVencimiento), bs(x.montoTotal)])))
    + seccion('Cotizaciones', tabla(['Número', 'Tipo', 'Fecha', 'Estado'],
        d.cotizaciones.map(x => [x.numero, x.tipo, fecha(x.fechaCotizacion), x.nombreEstadoCotizacion])))
    + totales([
        ['Costo materiales', bs(d.totales.costoMateriales)],
        ['Planilla pagada', bs(d.totales.totalPlanilla)],
        ['Pagos de cliente', bs(d.totales.totalPagosCliente)],
        ['Horas registradas', d.totales.totalHoras],
      ]);
}

// ── Empleado ────────────────────────────────────────────────────────────────
function renderEmpleado(cont, d) {
  const e = d.empleado, t = d.totales;
  cont.innerHTML = cabecera(`${e.nombre} ${e.apellido}`, `Ficha de empleado #${e.idEmpleado}`)
    + datos([
        ['CI', e.ci], ['Cargo', e.nombreCargo], ['Departamento', e.nombreDepartamento],
        ['Estado', e.nombreEstadoEmpleado], ['Especialidad', e.especialidad],
        ['Email', e.email], ['Celular', e.numCelular], ['Dirección', e.direccion],
        ['Contratación', fecha(e.fechaContratacion)], ['Pago por hora', bs(e.pagoPorHora)],
      ])
    + seccion('Proyectos asignados', tabla(['Proyecto', 'Rol', 'Inicio', 'Fin', 'Estado'],
        d.asignaciones.map(x => [x.nombreProyecto, x.nombreRolProyecto, fecha(x.fechaInicio), fecha(x.fechaFin), x.estado])))
    + seccion('Horas trabajadas', tabla(['Fecha', 'Proyecto', 'Horas', 'Total'],
        d.horas.map(x => [fecha(x.fecha), x.nombreProyecto, x.horasTrabajadas, bs(x.totalPago)])))
    + seccion('Pagos de planilla', tabla(['Proyecto', 'Fecha', 'Monto', 'Método', 'Estado'],
        d.pagos.map(x => [x.nombreProyecto, fecha(x.fechaPago), bs(x.montoPagado), x.nombreMetodoPago, x.nombreEstadoPago])))
    + totales([
        ['Horas totales', t.totalHoras],
        ['Ganado (horas)', bs(t.totalGanado)],
        ['Planilla pagada', bs(t.totalPagado)],
        [`Pendiente (${t.cantidadPendientes})`, bs(t.totalPendiente), true],
      ]);
}

// ── Material ────────────────────────────────────────────────────────────────
function renderMaterial(cont, d) {
  const m = d.material, t = d.totales;
  cont.innerHTML = cabecera(m.nombreMaterial, `Ficha de material #${m.idMaterial}`)
    + datos([
        ['Unidad', m.nombreUnidadMedida], ['Precio unitario', bs(m.precioUnitario)],
        ['Descripción', m.descripcion],
      ])
    + seccion('Proyectos donde se usó', tabla(['Proyecto', 'Cantidad', 'Costo', 'Fecha'],
        d.usos.map(x => [x.nombreProyecto, x.cantidadUtilizada, bs(x.costoTotal), fecha(x.fechaRegistro)])))
    + totales([
        ['Proyectos', t.proyectos],
        ['Cantidad total usada', t.totalCantidad],
        ['Costo total', bs(t.totalCosto)],
      ]);
}

// ── Cliente ─────────────────────────────────────────────────────────────────
function renderCliente(cont, d) {
  const c = d.cliente, t = d.totales;
  cont.innerHTML = cabecera(nombreCli(c), `Ficha de cliente #${c.idCliente}`)
    + datos([
        ['Tipo', c.nombreTipoCliente], ['Documento', c.documentoID], ['Email', c.email],
        ['Celular', c.numCelular], ['Dirección', c.direccion], ['Registro', fecha(c.fechaRegistro)],
      ])
    + seccion('Proyectos', tabla(['Proyecto', 'Estado', 'Inicio', 'Fin estimado'],
        d.proyectos.map(x => [x.nombreProyecto, x.nombreEstadoProyecto, fecha(x.fechaInicio), fecha(x.fechaFinEstimada)])))
    + seccion('Contratos', tabla(['N° Contrato', 'Proyecto', 'Firma', 'Monto', 'Estado'],
        d.contratos.map(x => [x.numeroContrato, x.nombreProyecto, fecha(x.fechaFirma), bs(x.montoTotal), x.nombreEstadoContrato])))
    + totales([
        ['Proyectos', t.proyectos],
        ['Contratos', t.contratos],
        ['Monto en contratos', bs(t.montoContratos)],
      ]);
}

// Fila de totales en pantalla. Cada par: [label, valor, esAlerta?].
function totales(pares) {
  return `<div class="rep-totales">${pares.map(([l, v, warn]) =>
    `<div class="tt ${warn ? 'warn' : ''}"><div class="n">${esc(v)}</div><div class="l">${esc(l)}</div></div>`
  ).join('')}</div>`;
}

// ── Impresión ─────────────────────────────────────────────────────────────────
function imprimirDetalle() {
  if (!_detalleActual) return;
  const { tipo, data } = _detalleActual;
  const win = nuevaVentanaPDF();
  if (tipo === 'proyecto') imprimirProyecto(win, data);
  else if (tipo === 'empleado') imprimirEmpleado(win, data);
  else if (tipo === 'material') imprimirMaterial(win, data);
  else if (tipo === 'cliente') imprimirCliente(win, data);
}

function imprimirProyecto(win, d) {
  const p = d.proyecto;
  const cuerpo = pdfDatos([
      ['Cliente', p.nombreCliente], ['Tipo', p.nombreTipoProyecto], ['Estado', p.nombreEstadoProyecto],
      ['Ubicación', p.ubicacion], ['Inicio', fecha(p.fechaInicio)], ['Fin estimado', fecha(p.fechaFinEstimada)],
    ])
    + pdfTabla('Personal asignado', ['Empleado', 'Cargo', 'Rol', 'Inicio', 'Fin'],
        d.personal.map(x => [x.empleado, x.nombreCargo, x.nombreRolProyecto, fecha(x.fechaInicio), fecha(x.fechaFin)]))
    + pdfTabla('Materiales usados', ['Material', 'Cantidad', 'Costo'],
        d.materiales.map(x => [x.nombreMaterial, x.cantidadUtilizada, bs(x.costoTotal)]))
    + pdfTabla('Contratos', ['N° Contrato', 'Tipo', 'Firma', 'Vence', 'Monto'],
        d.contratos.map(x => [x.numeroContrato, x.nombreTipoContrato, fecha(x.fechaFirma), fecha(x.fechaVencimiento), bs(x.montoTotal)]))
    + pdfTabla('Cotizaciones', ['Número', 'Tipo', 'Fecha', 'Estado'],
        d.cotizaciones.map(x => [x.numero, x.tipo, fecha(x.fechaCotizacion), x.nombreEstadoCotizacion]))
    + `<div class="total">Costo materiales: ${bs(d.totales.costoMateriales)} · Planilla: ${bs(d.totales.totalPlanilla)} · Pagos cliente: ${bs(d.totales.totalPagosCliente)}</div>`;
  imprimirReporte(win, `Expediente de Proyecto — ${p.nombreProyecto}`, '', [cuerpo]);
}

function imprimirEmpleado(win, d) {
  const e = d.empleado, t = d.totales;
  const cuerpo = pdfDatos([
      ['CI', e.ci], ['Cargo', e.nombreCargo], ['Departamento', e.nombreDepartamento],
      ['Estado', e.nombreEstadoEmpleado], ['Email', e.email], ['Celular', e.numCelular],
      ['Contratación', fecha(e.fechaContratacion)], ['Pago por hora', bs(e.pagoPorHora)],
    ])
    + pdfTabla('Proyectos asignados', ['Proyecto', 'Rol', 'Inicio', 'Fin', 'Estado'],
        d.asignaciones.map(x => [x.nombreProyecto, x.nombreRolProyecto, fecha(x.fechaInicio), fecha(x.fechaFin), x.estado]))
    + pdfTabla('Horas trabajadas', ['Fecha', 'Proyecto', 'Horas', 'Total'],
        d.horas.map(x => [fecha(x.fecha), x.nombreProyecto, x.horasTrabajadas, bs(x.totalPago)]))
    + pdfTabla('Pagos de planilla', ['Proyecto', 'Fecha', 'Monto', 'Método', 'Estado'],
        d.pagos.map(x => [x.nombreProyecto, fecha(x.fechaPago), bs(x.montoPagado), x.nombreMetodoPago, x.nombreEstadoPago]))
    + `<div class="total">Pagos pendientes (${t.cantidadPendientes}): ${bs(t.totalPendiente)}</div>`;
  imprimirReporte(win, `Ficha de Empleado — ${e.nombre} ${e.apellido}`, '', [cuerpo]);
}

function imprimirMaterial(win, d) {
  const m = d.material, t = d.totales;
  const cuerpo = pdfDatos([
      ['Unidad', m.nombreUnidadMedida], ['Precio unitario', bs(m.precioUnitario)], ['Descripción', m.descripcion],
    ])
    + pdfTabla('Proyectos donde se usó', ['Proyecto', 'Cantidad', 'Costo', 'Fecha'],
        d.usos.map(x => [x.nombreProyecto, x.cantidadUtilizada, bs(x.costoTotal), fecha(x.fechaRegistro)]))
    + `<div class="total">Cantidad total: ${t.totalCantidad} · Costo total: ${bs(t.totalCosto)}</div>`;
  imprimirReporte(win, `Ficha de Material — ${m.nombreMaterial}`, '', [cuerpo]);
}

function imprimirCliente(win, d) {
  const c = d.cliente, t = d.totales;
  const cuerpo = pdfDatos([
      ['Tipo', c.nombreTipoCliente], ['Documento', c.documentoID], ['Email', c.email],
      ['Celular', c.numCelular], ['Dirección', c.direccion],
    ])
    + pdfTabla('Proyectos', ['Proyecto', 'Estado', 'Inicio', 'Fin estimado'],
        d.proyectos.map(x => [x.nombreProyecto, x.nombreEstadoProyecto, fecha(x.fechaInicio), fecha(x.fechaFinEstimada)]))
    + pdfTabla('Contratos', ['N° Contrato', 'Proyecto', 'Firma', 'Monto', 'Estado'],
        d.contratos.map(x => [x.numeroContrato, x.nombreProyecto, fecha(x.fechaFirma), bs(x.montoTotal), x.nombreEstadoContrato]))
    + `<div class="total">Contratos: ${t.contratos} · Monto: ${bs(t.montoContratos)}</div>`;
  imprimirReporte(win, `Ficha de Cliente — ${nombreCli(c)}`, '', [cuerpo]);
}
