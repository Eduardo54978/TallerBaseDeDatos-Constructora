const API = '/api';

const PAG_SIZE = 10;

function mostrarCarga(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = '<div class="cargando">Cargando datos...</div>';
}

function aplicarPaginacion(tablaId) {
  const tabla = document.getElementById(tablaId);
  if (!tabla) return;
  const filas = Array.from(tabla.querySelectorAll('tbody tr'));
  if (filas.length <= PAG_SIZE) return;

  let pagina = 1;
  const totalPags = Math.ceil(filas.length / PAG_SIZE);

  function render() {
    const ini = (pagina - 1) * PAG_SIZE;

    filas.forEach((f, i) => {
      f.style.display = (i >= ini && i < ini + PAG_SIZE) ? '' : 'none';
    });

    let nav = document.getElementById('nav-' + tablaId);

    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'nav-' + tablaId;
      nav.className = 'pag-nav';
      tabla.parentNode.insertBefore(nav, tabla.nextSibling);
    }

    nav.innerHTML = `
      <button id="prev-${tablaId}">← Anterior</button>
      <span>Página ${pagina} / ${totalPags} &nbsp;·&nbsp; ${filas.length} registros</span>
      <button id="next-${tablaId}">Siguiente →</button>`;

    document.getElementById('prev-' + tablaId).disabled = pagina === 1;
    document.getElementById('next-' + tablaId).disabled = pagina === totalPags;

    document.getElementById('prev-' + tablaId).onclick = () => {
      pagina--;
      render();
    };

    document.getElementById('next-' + tablaId).onclick = () => {
      pagina++;
      render();
    };
  }

  render();
}

function confirmarAccion(mensaje) {
  return confirm(mensaje);
}

function ordenarPorNumero(datos, campo) {
  return [...(datos || [])].sort((a, b) => Number(a[campo] || 0) - Number(b[campo] || 0));
}

function normalizarEstado(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function esPendiente(estado) {
  return normalizarEstado(estado).includes('pendiente');
}

function esEntregada(estado) {
  return normalizarEstado(estado).includes('entregad');
}

function esCancelada(estado) {
  return normalizarEstado(estado).includes('cancel');
}

async function cargarEstadosOrden() {
  const data = await fetch(`${API}/compras/estados`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById('no-idestado');

  if (!sel) return;

  sel.innerHTML = '<option value="">-- Estado de orden --</option>' +
    data.map(e => `<option value="${e.idEstadoOrden}">${e.nombreEstadoOrden}</option>`).join('');

  const pendiente = data.find(e => esPendiente(e.nombreEstadoOrden));

  if (pendiente) {
    sel.value = pendiente.idEstadoOrden;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const fecha = document.getElementById('no-fecha');

  if (fecha) {
    fecha.value = new Date().toISOString().substring(0, 10);
  }

  cargarEstadosOrden();
});

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  const tab = document.getElementById('tab-' + name);

  if (tab) {
    tab.classList.add('active');
  }

  if (btn) {
    btn.classList.add('active');
  }

  if (name === 'ordenes') {
    cargarOrdenes();
  }
}

function filtrarTabla(id, texto) {
  const t = document.getElementById(id);

  if (!t) return;

  t.querySelectorAll('tbody tr').forEach(r => {
    r.style.display = r.innerText.toLowerCase().includes(texto.toLowerCase()) ? '' : 'none';
  });
}

function badge(texto) {
  const t = normalizarEstado(texto);

  if (t.includes('entregada') || t.includes('completado') || t.includes('aprobado')) {
    return `<span class="badge badge-green">${texto}</span>`;
  }

  if (t.includes('cancelado') || t.includes('cancelada') || t.includes('rechazado')) {
    return `<span class="badge badge-red">${texto}</span>`;
  }

  if (t.includes('pendiente')) {
    return `<span class="badge badge-yellow">${texto}</span>`;
  }

  return `<span class="badge badge-blue">${texto}</span>`;
}

function msg(id, texto, tipo) {
  const el = document.getElementById(id);

  if (!el) return;

  el.className = 'msg ' + tipo;
  el.textContent = texto;

  setTimeout(() => {
    el.className = 'msg';
  }, 5000);
}

// Nota: el resumen usa renderStatsCards() de ../js/autocomplete.js (tarjetas con
// estilo en grid). Antes había aquí una versión local que generaba .stat-box sin
// estilos en styles.css, por eso el resumen se veía roto.

let _rangoOrdenes = { desde: '', hasta: '' };
let _dataOrdenes = [];
async function cargarOrdenes() {
  const r = (typeof leerRango === 'function') ? leerRango('f-ord-desde', 'f-ord-hasta') : { desde: '', hasta: '' };
  if (!r) return;
  _rangoOrdenes = r;
  mostrarCarga('cont-ordenes');

  try {
    const data = await fetch(`${API}/compras${typeof rangoQuery === 'function' ? rangoQuery(r.desde, r.hasta) : ''}`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idOrdenCompra');
    _dataOrdenes = ordenados;

    const pendientes = ordenados.filter(o => esPendiente(o.estadoOrden)).length;
    const montoTotal = ordenados.reduce((s, o) => s + Number(o.montoTotal || 0), 0);

    renderStatsCards('ord-stats', [
      { n: ordenados.length, l: 'Órdenes' },
      { n: pendientes, l: 'Pendientes' },
      { n: 'Bs ' + montoTotal.toLocaleString('es-BO'), l: 'Monto total' },
    ]);

    document.getElementById('cont-ordenes').innerHTML = `
      <table id="tbl-ordenes">
        <thead>
          <tr>
            <th>ID Orden</th>
            <th>Fecha Orden</th>
            <th>Proveedor</th>
            <th>Monto Total (Bs)</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(o => {
            const pendiente = esPendiente(o.estadoOrden);
            const entregada = esEntregada(o.estadoOrden);

            return `<tr>
              <td>${o.idOrdenCompra}</td>
              <td>${o.fechaOrden ? o.fechaOrden.substring(0, 10) : '-'}</td>
              <td>${o.nombreProveedor || '-'}</td>
              <td>${moneda(o.montoTotal)}</td>
              <td>${badge(o.estadoOrden)}</td>
              <td>
                ${pendiente ? `<button class="btn" style="padding:4px 10px;font-size:.78rem;background:#b7791f;color:#fff;" onclick="cancelarOrden(${o.idOrdenCompra})">Cancelar compra</button>` : ''}
                ${!entregada ? `<button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarOrden(${o.idOrdenCompra})">Eliminar</button>` : '<span style="color:#6B756D;">Bloqueada</span>'}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;

    aplicarPaginacion('tbl-ordenes');

  } catch (e) {
    document.getElementById('cont-ordenes').innerHTML = '<p style="color:red">Error al cargar órdenes de compra</p>';
  }
}

async function crearOrden() {
  const idCot = document.getElementById('no-idcot').value;
  const body = {
    fechaOrden: document.getElementById('no-fecha').value,
    idEstadoOrden: parseInt(document.getElementById('no-idestado').value),
    idProveedor: parseInt(document.getElementById('no-idproveedor').value),
    montoTotal: parseFloat(document.getElementById('no-monto').value),
    idCotizacionInterna: idCot ? parseInt(idCot) : null
  };

  if (!body.fechaOrden || !body.idEstadoOrden || Number.isNaN(body.montoTotal)) {
    return msg('msg-orden', 'Llene todos los campos obligatorios (*)', 'err');
  }

  if (!body.idProveedor) {
    return msg('msg-orden', 'Seleccione un proveedor de la lista.', 'err');
  }

  const hoy = new Date().toISOString().substring(0, 10);

  if (body.fechaOrden > hoy) {
    return msg('msg-orden', 'La fecha de la orden no puede ser futura.', 'err');
  }

  try {
    const res = await fetch(`${API}/compras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-orden', 'Error: ' + data.error, 'err');
    }

    const aviso = idCot
      ? ` Está basada en una cotización: ve a "Agregar Detalle" para confirmar y registrar sus materiales.`
      : ` Para cargar materiales ve a "Agregar Detalle".`;
    msg('msg-orden', `Orden creada con ID: ${data.idOrdenCompra}.${aviso}`, 'ok');

    document.querySelectorAll('#tab-nueva-orden input').forEach(i => {
      i.value = '';
    });
    const cotPrev = document.getElementById('no-cot-preview');
    if (cotPrev) { cotPrev.style.display = 'none'; cotPrev.innerHTML = ''; }

    const refPanel = document.getElementById('no-catalogo-ref');

    if (refPanel) {
      refPanel.style.display = 'none';
      refPanel.innerHTML = '';
    }

    const montoHint = document.getElementById('no-monto-hint');

    if (montoHint) {
      montoHint.textContent = '';
    }

    const fecha = document.getElementById('no-fecha');

    if (fecha) {
      fecha.value = new Date().toISOString().substring(0, 10);
    }

    cargarEstadosOrden();
    cargarOrdenes();

  } catch (e) {
    msg('msg-orden', 'Error de conexión', 'err');
  }
}

async function onSelProveedorOrden(idProveedor) {
  const panel = document.getElementById('no-catalogo-ref');
  const hint = document.getElementById('no-monto-hint');

  if (!panel) return;

  if (!idProveedor) {
    panel.style.display = 'none';
    if (hint) hint.textContent = '';
    return;
  }

  panel.style.display = 'block';
  panel.innerHTML = 'Cargando catálogo del proveedor...';

  try {
    const cat = await fetch(`${API}/proveedores/${idProveedor}/materiales`).then(r => r.json());

    if (!Array.isArray(cat) || !cat.length) {
      panel.innerHTML = '<b>Este proveedor no tiene materiales en su catálogo todavía.</b> Puedes registrar la orden igual y agregarlos luego.';
      if (hint) hint.textContent = '';
      return;
    }

    const precios = cat.map(m => Number(m.precioProveedor || 0));
    const min = Math.min(...precios);
    const max = Math.max(...precios);

    if (hint) {
      hint.textContent = `Precios del proveedor: entre Bs ${min.toFixed(2)} y Bs ${max.toFixed(2)} por material.`;
    }

    panel.innerHTML = `
      <b style="color:#173F24;">Catálogo de referencia (${cat.length} materiales)</b>
      <table style="width:100%;border-collapse:collapse;font-size:.84rem;margin-top:8px;">
        <thead>
          <tr style="background:#123823;color:#fff;">
            <th style="text-align:left;padding:6px;">Material</th>
            <th style="text-align:right;padding:6px;">Precio (Bs)</th>
            <th style="text-align:left;padding:6px;">Entrega</th>
          </tr>
        </thead>
        <tbody>
          ${cat.map(m => `<tr>
            <td style="padding:6px;border-bottom:1px solid #e1e6dd;">${m.nombreMaterial}</td>
            <td style="padding:6px;border-bottom:1px solid #e1e6dd;text-align:right;">${Number(m.precioProveedor).toFixed(2)}</td>
            <td style="padding:6px;border-bottom:1px solid #e1e6dd;">${m.tiempoEntrega != null ? m.tiempoEntrega + ' días' : '-'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <small style="color:#6b756d;">Usa estos precios para estimar el monto acordado de la orden.</small>
    `;

    // Si ya hay una cotización elegida, refrescar su preview contra este proveedor.
    cargarPreviewCotizacion();

  } catch (e) {
    panel.innerHTML = 'No se pudo cargar el catálogo del proveedor.';
  }
}

// ── Cotización interna en Nueva Orden (la orden se crea BASADA en ella) ───────
// Solo es una consulta: muestra qué materiales se podrían migrar. El detalle se
// confirma luego en "Agregar Detalle".
function onSelCotizacionOrden(idCot) {
  cargarPreviewCotizacion();
}

async function cargarPreviewCotizacion() {
  const prev = document.getElementById('no-cot-preview');
  const idCot = document.getElementById('no-idcot').value;
  const idProv = document.getElementById('no-idproveedor').value;
  if (!prev) return;
  if (!idCot) { prev.style.display = 'none'; prev.innerHTML = ''; return; }
  prev.style.display = 'block';
  if (!idProv) {
    prev.innerHTML = '<b>Elige primero el proveedor</b> para ver qué materiales de la cotización se podrían migrar.';
    return;
  }
  prev.innerHTML = 'Cargando materiales de la cotización...';
  try {
    const d = await fetch(`${API}/compras/preparacion-cotizacion?idCotizacionInterna=${idCot}&idProveedor=${idProv}`).then(r => r.json());
    if (d.error) { prev.innerHTML = 'Error: ' + d.error; return; }

    const filas = d.migrables.map(m => `<tr>
      <td style="padding:6px;border-bottom:1px solid #e1e6dd;">${m.nombreMaterial}</td>
      <td style="padding:6px;border-bottom:1px solid #e1e6dd;text-align:right;">${m.cantidad}</td>
      <td style="padding:6px;border-bottom:1px solid #e1e6dd;text-align:right;">${m.precioUnitario.toFixed(2)}</td>
      <td style="padding:6px;border-bottom:1px solid #e1e6dd;text-align:right;">${m.subtotal.toFixed(2)}</td></tr>`).join('');

    const omit = d.omitidos.length
      ? `<small style="color:#922b21;display:block;margin-top:6px;">No los provee este proveedor (no se migrarán): ${d.omitidos.map(o => o.nombreMaterial).join(', ')}.</small>`
      : '';

    prev.innerHTML = `
      <b style="color:#173F24;">Materiales de la cotización para esta orden (${d.migrables.length})</b>
      ${d.migrables.length ? `<table style="width:100%;border-collapse:collapse;font-size:.84rem;margin-top:8px;">
        <thead><tr style="background:#123823;color:#fff;">
          <th style="text-align:left;padding:6px;">Material</th>
          <th style="text-align:right;padding:6px;">Cantidad</th>
          <th style="text-align:right;padding:6px;">Precio prov. (Bs)</th>
          <th style="text-align:right;padding:6px;">Subtotal (Bs)</th></tr></thead>
        <tbody>${filas}</tbody></table>
        <div style="text-align:right;font-weight:700;color:#173F24;margin-top:8px;">Total estimado: Bs ${d.total.toFixed(2)}</div>`
        : '<p style="color:#922b21;margin-top:6px;">Ningún material de la cotización está en el catálogo de este proveedor.</p>'}
      ${omit}
      <small style="color:#6b756d;display:block;margin-top:4px;">Estos materiales se confirmarán y registrarán después en "Agregar Detalle".</small>`;

    // Sugerir el monto de la orden con el total a migrar (si está vacío).
    const monto = document.getElementById('no-monto');
    if (monto && !monto.value && d.total > 0) monto.value = d.total.toFixed(2);
  } catch (e) {
    prev.innerHTML = 'No se pudo cargar la cotización.';
  }
}

// ── Confirmar/registrar detalle desde cotización (pestaña Agregar Detalle) ────
// Proveedor de la orden seleccionada actualmente (se setea en cargarMaterialesDeOrden).
let _provOrdenActual = null;

// Se dispara al elegir una cotización interna: muestra qué materiales se migrarán.
function onSelCotizacionDetalle(idCot) {
  previewCotizacionDetalle();
}

async function previewCotizacionDetalle() {
  const prev = document.getElementById('ad-cot-preview');
  const idCot = document.getElementById('ad-idcot').value;
  if (!prev) return;
  if (!idCot) { prev.style.display = 'none'; prev.innerHTML = ''; return; }
  prev.style.display = 'block';
  if (!_provOrdenActual) {
    prev.innerHTML = '<b>Elige primero la orden de compra</b> (arriba) para ver qué materiales se pueden migrar.';
    return;
  }
  prev.innerHTML = 'Cargando materiales de la cotización...';
  try {
    const d = await fetch(`${API}/compras/preparacion-cotizacion?idCotizacionInterna=${idCot}&idProveedor=${_provOrdenActual}`).then(r => r.json());
    if (d.error) { prev.innerHTML = 'Error: ' + d.error; return; }

    const filas = d.migrables.map(m => `<tr>
      <td style="padding:6px;border-bottom:1px solid #e1e6dd;">${m.nombreMaterial}</td>
      <td style="padding:6px;border-bottom:1px solid #e1e6dd;text-align:right;">${m.cantidad}</td>
      <td style="padding:6px;border-bottom:1px solid #e1e6dd;text-align:right;">${m.precioUnitario.toFixed(2)}</td>
      <td style="padding:6px;border-bottom:1px solid #e1e6dd;text-align:right;">${m.subtotal.toFixed(2)}</td></tr>`).join('');

    const omit = d.omitidos.length
      ? `<small style="color:#922b21;display:block;margin-top:6px;">No los provee este proveedor (se omiten): ${d.omitidos.map(o => o.nombreMaterial).join(', ')}.</small>`
      : '';

    prev.innerHTML = `
      <b style="color:#173F24;">Materiales que se migrarán (${d.migrables.length})</b>
      ${d.migrables.length ? `<table style="width:100%;border-collapse:collapse;font-size:.84rem;margin-top:8px;">
        <thead><tr style="background:#123823;color:#fff;">
          <th style="text-align:left;padding:6px;">Material</th>
          <th style="text-align:right;padding:6px;">Cantidad</th>
          <th style="text-align:right;padding:6px;">Precio prov. (Bs)</th>
          <th style="text-align:right;padding:6px;">Subtotal (Bs)</th></tr></thead>
        <tbody>${filas}</tbody></table>
        <div style="text-align:right;font-weight:700;color:#173F24;margin-top:8px;">Total a migrar: Bs ${d.total.toFixed(2)}</div>`
        : '<p style="color:#922b21;margin-top:6px;">Ningún material de la cotización está en el catálogo del proveedor de esta orden.</p>'}
      ${omit}
      <small style="color:#6b756d;display:block;margin-top:4px;">Revisa y pulsa "Migrar materiales al detalle" para agregarlos.</small>`;
  } catch (e) {
    prev.innerHTML = 'No se pudo cargar la cotización.';
  }
}

// Inserta los materiales de la cotización en el detalle de la orden seleccionada.
async function migrarCotizacionEnDetalle() {
  const idOrden = document.getElementById('ad-idorden').value;
  const idCot = document.getElementById('ad-idcot').value;
  if (!idOrden) return msg('msg-agregar-detalle', 'Elige primero la orden de compra.', 'err');
  if (!idCot) return msg('msg-agregar-detalle', 'Elige una cotización interna.', 'err');
  try {
    const res = await fetch(`${API}/compras/${idOrden}/detalle/desde-cotizacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idCotizacionInterna: parseInt(idCot) })
    });
    const d = await res.json();
    if (!res.ok) return msg('msg-agregar-detalle', 'Error: ' + d.error, 'err');
    const omit = d.omitidos && d.omitidos.length ? ` Omitidos (fuera de catálogo): ${d.omitidos.join(', ')}.` : '';
    msg('msg-agregar-detalle', `${d.insertados} material(es) migrado(s) al detalle.${omit}`, 'ok');
    // Refrescar la consulta del detalle de la orden.
    await renderPresupuestoOrden(idOrden);
  } catch (e) {
    msg('msg-agregar-detalle', 'Error de conexión al migrar.', 'err');
  }
}

async function buscarDetalle() {
  const idOrden = document.getElementById('do-idorden').value.trim() ||
    (/^\d+$/.test((document.getElementById('do-orden-nom') || {}).value || '')
      ? (document.getElementById('do-orden-nom') || {}).value.trim()
      : '');

  if (!idOrden) return;

  try {
    const [orden, data] = await Promise.all([
      fetch(`${API}/compras/${idOrden}`).then(r => r.json()),
      fetch(`${API}/compras/${idOrden}/detalle`).then(r => r.json())
    ]);

    if (orden.error) {
      document.getElementById('cont-detalle-orden').innerHTML = `<p style="color:red">${orden.error}</p>`;
      return;
    }

    if (data.error) {
      document.getElementById('cont-detalle-orden').innerHTML = `<p style="color:red">${data.error}</p>`;
      return;
    }

    if (data.length === 0) {
      document.getElementById('cont-detalle-orden').innerHTML = '<p>No hay ítems en esta orden.</p>';
      return;
    }

    const ordenados = ordenarPorNumero(data, 'idDetalleCompra');
    const puedeEliminar = esPendiente(orden.estadoOrden);

    document.getElementById('cont-detalle-orden').innerHTML = `
      <p style="color:#6B756D;margin-bottom:8px;">
        Estado de la orden: ${badge(orden.estadoOrden)}
        ${!puedeEliminar ? '<br><b style="color:#991B1B;">Los detalles están bloqueados porque la orden ya no está Pendiente.</b>' : ''}
      </p>

      <table id="tbl-detalle-orden">
        <thead>
          <tr>
            <th>ID Detalle</th>
            <th>Material</th>
            <th>Cantidad</th>
            <th>Precio Unitario (Bs)</th>
            <th>Total (Bs)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(d => `<tr>
            <td>${d.idDetalleCompra}</td>
            <td>${d.nombreMaterial || '-'}</td>
            <td>${d.cantidad}</td>
            <td>${moneda(d.precioUnitario)}</td>
            <td>${moneda(d.total)}</td>
            <td>
              ${puedeEliminar
                ? `<button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarDetalle(${d.idDetalleCompra})">Eliminar</button>`
                : '<span style="color:#6B756D;">Bloqueado</span>'}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    `;

    aplicarPaginacion('tbl-detalle-orden');

  } catch (e) {
    document.getElementById('cont-detalle-orden').innerHTML = '<p style="color:red">Error de conexión</p>';
  }
}

let catalogoOrden = [];
let _montoOrdenActual = 0;

async function cargarMaterialesDeOrden(idOrden) {
  const sel = document.getElementById('ad-idmaterial');

  if (!sel) return;

  sel.innerHTML = '<option value="">Cargando catálogo...</option>';
  catalogoOrden = [];

  try {
    const orden = await fetch(`${API}/compras/${idOrden}`).then(r => r.json());

    if (!orden || !orden.idProveedor) {
      sel.innerHTML = '<option value="">No se pudo obtener el proveedor</option>';
      return;
    }

    if (!esPendiente(orden.estadoOrden)) {
      sel.innerHTML = '<option value="">Solo se pueden agregar materiales a órdenes Pendientes</option>';

      const panel = document.getElementById('ad-presupuesto');

      if (panel) {
        panel.style.display = 'block';
        panel.innerHTML = `
          <div style="color:#991B1B;font-weight:700;">
            Esta orden está en estado ${orden.estadoOrden}. No se pueden agregar nuevos materiales.
          </div>
        `;
      }

      const cont = document.getElementById('ad-items-actuales');

      if (cont) {
        cont.innerHTML = '';
      }

      return;
    }

    _montoOrdenActual = Number(orden.montoTotal || 0);
    _provOrdenActual = orden.idProveedor;

    // Si la orden se creó basada en una cotización interna, cargarla automáticamente
    // para la confirmación (doble verificación).
    const status = document.getElementById('ad-cot-status');
    const inCot = document.getElementById('ad-cot-nom');
    const hidCot = document.getElementById('ad-idcot');
    if (orden.idCotizacionInterna) {
      if (hidCot) hidCot.value = orden.idCotizacionInterna;
      if (inCot) inCot.value = `${orden.numeroCotizacionInterna || 'Cotización'} — ${orden.proyectoCotizacion || ''}`.trim();
      if (status) status.innerHTML = `Esta orden está basada en la cotización <b>${orden.numeroCotizacionInterna || '#' + orden.idCotizacionInterna}</b>. Revisa abajo y confirma el detalle.`;
      previewCotizacionDetalle();
    } else {
      if (status) status.innerHTML = 'Esta orden no se basó en una cotización. Puedes elegir una abajo o cargar materiales manualmente arriba.';
      if (hidCot) hidCot.value = '';
      if (inCot) inCot.value = '';
      const prev = document.getElementById('ad-cot-preview');
      if (prev) { prev.style.display = 'none'; prev.innerHTML = ''; }
    }

    const catalogo = await fetch(`${API}/proveedores/${orden.idProveedor}/materiales`).then(r => r.json());
    catalogoOrden = Array.isArray(catalogo) ? catalogo : [];

    if (!catalogoOrden.length) {
      sel.innerHTML = '<option value="">El proveedor no tiene materiales en su catálogo</option>';
    } else {
      sel.innerHTML = '<option value="">-- Seleccionar material --</option>' +
        catalogoOrden.map(m => `<option value="${m.idMaterial}" data-precio="${m.precioProveedor}">${m.nombreMaterial} (Bs ${m.precioProveedor})</option>`).join('');
    }

    await renderPresupuestoOrden(idOrden);

  } catch (e) {
    sel.innerHTML = '<option value="">Error al cargar catálogo</option>';
  }
}

async function renderPresupuestoOrden(idOrden) {
  const panel = document.getElementById('ad-presupuesto');
  const cont = document.getElementById('ad-items-actuales');

  if (!panel) return;

  try {
    const detalle = await fetch(`${API}/compras/${idOrden}/detalle`).then(r => r.json());
    const items = Array.isArray(detalle) ? detalle : [];
    const gastado = items.reduce((s, d) => s + Number(d.total || 0), 0);
    const disponible = _montoOrdenActual - gastado;
    const colorDisp = disponible < 0 ? '#b91c1c' : '#28512b';

    panel.style.display = 'flex';
    panel.style.cssText += 'display:flex;flex-wrap:wrap;gap:16px;';
    panel.innerHTML = `
      <div>
        <div style="font-size:.72rem;color:#6b756d;text-transform:uppercase;">Monto acordado</div>
        <b style="font-size:1.2rem;color:#173F24;">${moneda(_montoOrdenActual)}</b>
      </div>

      <div>
        <div style="font-size:.72rem;color:#6b756d;text-transform:uppercase;">Gastado en detalle</div>
        <b style="font-size:1.2rem;color:#173F24;">${moneda(gastado)}</b>
      </div>

      <div>
        <div style="font-size:.72rem;color:#6b756d;text-transform:uppercase;">Disponible</div>
        <b style="font-size:1.2rem;color:${colorDisp};">${moneda(disponible)}</b>
      </div>
    `;

    if (cont) {
      cont.innerHTML = items.length
        ? `<b style="color:#173F24;">Materiales ya cargados en esta orden (${items.length})</b>
           <table style="width:100%;border-collapse:collapse;font-size:.84rem;margin-top:8px;">
             <thead>
               <tr style="background:#123823;color:#fff;">
                 <th style="text-align:left;padding:6px;">Material</th>
                 <th style="text-align:right;padding:6px;">Cantidad</th>
                 <th style="text-align:right;padding:6px;">P. Unit</th>
                 <th style="text-align:right;padding:6px;">Total</th>
               </tr>
             </thead>
             <tbody>
               ${items.map(d => `<tr>
                 <td style="padding:6px;border-bottom:1px solid #e1e6dd;">${d.nombreMaterial || '-'}</td>
                 <td style="padding:6px;border-bottom:1px solid #e1e6dd;text-align:right;">${d.cantidad}</td>
                 <td style="padding:6px;border-bottom:1px solid #e1e6dd;text-align:right;">${moneda(d.precioUnitario)}</td>
                 <td style="padding:6px;border-bottom:1px solid #e1e6dd;text-align:right;">${moneda(d.total)}</td>
               </tr>`).join('')}
             </tbody>
           </table>`
        : '<p style="color:#6b756d;">Esta orden aún no tiene materiales cargados.</p>';
    }

  } catch (e) {
    panel.style.display = 'none';
  }
}

function autoPrecioMaterial() {
  const sel = document.getElementById('ad-idmaterial');
  const opt = sel.options[sel.selectedIndex];
  const precio = opt ? opt.getAttribute('data-precio') : null;

  if (precio) {
    document.getElementById('ad-precio').value = precio;
  }

  calcularSubtotalDetalle();
}

function calcularSubtotalDetalle() {
  const out = document.getElementById('ad-subtotal');

  if (!out) return;

  const cant = parseFloat(document.getElementById('ad-cantidad').value);
  const precio = parseFloat(document.getElementById('ad-precio').value);

  if (Number.isNaN(cant) || Number.isNaN(precio)) {
    out.textContent = '';
    return;
  }

  const subtotal = cant * precio;
  out.style.color = '#28512b';
  out.textContent = `Subtotal: ${moneda(subtotal)}`;
}

async function agregarDetalleOrden() {
  const idOrden = document.getElementById('ad-idorden').value.trim();

  if (!idOrden) {
    return msg('msg-agregar-detalle', 'Seleccione una orden de la lista.', 'err');
  }

  const orden = await fetch(`${API}/compras/${idOrden}`).then(r => r.json()).catch(() => null);

  if (!orden || orden.error) {
    return msg('msg-agregar-detalle', 'No se pudo validar la orden seleccionada.', 'err');
  }

  if (!esPendiente(orden.estadoOrden)) {
    return msg('msg-agregar-detalle', 'Solo se pueden agregar materiales a órdenes Pendientes.', 'err');
  }

  const body = {
    idMaterial: parseInt(document.getElementById('ad-idmaterial').value),
    cantidad: parseFloat(document.getElementById('ad-cantidad').value),
    precioUnitario: parseFloat(document.getElementById('ad-precio').value)
  };

  if (!body.idMaterial || Number.isNaN(body.cantidad) || Number.isNaN(body.precioUnitario)) {
    return msg('msg-agregar-detalle', 'Seleccione material y complete cantidad y precio.', 'err');
  }

  try {
    const res = await fetch(`${API}/compras/${idOrden}/detalle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-agregar-detalle', 'Error: ' + data.error, 'err');
    }

    msg('msg-agregar-detalle', `Detalle agregado con ID: ${data.idDetalleCompra}`, 'ok');

    document.getElementById('ad-idmaterial').value = '';
    document.getElementById('ad-cantidad').value = '';
    document.getElementById('ad-precio').value = '';

    const sub = document.getElementById('ad-subtotal');

    if (sub) {
      sub.textContent = '';
    }

    cargarOrdenes();
    renderPresupuestoOrden(idOrden);

    const detalleInput = document.getElementById('do-idorden');

    if (detalleInput) {
      detalleInput.value = idOrden;
    }

  } catch (e) {
    msg('msg-agregar-detalle', 'Error de conexión', 'err');
  }
}

async function cancelarOrden(idOrden) {
  if (!idOrden) return;

  if (!confirmarAccion(`¿Seguro que quieres cancelar la compra (orden #${idOrden})? Solo se pueden cancelar órdenes pendientes.`)) {
    return;
  }

  try {
    const res = await fetch(`${API}/compras/${idOrden}/cancelar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();

    if (!res.ok) {
      return alert('Error: ' + data.error);
    }

    cargarOrdenes();

  } catch (e) {
    alert('Error de conexión');
  }
}

async function buscarPorProveedor() {
  const idProveedor = document.getElementById('pp-idproveedor').value.trim();

  if (!idProveedor) return;

  try {
    const data = await fetch(`${API}/compras/proveedor/${idProveedor}`).then(r => r.json());

    if (data.error) {
      document.getElementById('cont-por-proveedor').innerHTML = `<p style="color:red">${data.error}</p>`;
      return;
    }

    if (data.length === 0) {
      document.getElementById('cont-por-proveedor').innerHTML = '<p>No se encontraron órdenes para este proveedor.</p>';
      return;
    }

    const ordenados = ordenarPorNumero(data, 'idOrdenCompra');

    document.getElementById('cont-por-proveedor').innerHTML = `
      <table id="tbl-por-proveedor">
        <thead>
          <tr>
            <th>ID Orden</th>
            <th>Fecha Orden</th>
            <th>Proveedor</th>
            <th>Monto Total (Bs)</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(o => `<tr>
            <td>${o.idOrdenCompra}</td>
            <td>${o.fechaOrden ? o.fechaOrden.substring(0, 10) : '-'}</td>
            <td>${o.nombreProveedor || '-'}</td>
            <td>${moneda(o.montoTotal)}</td>
            <td>${badge(o.estadoOrden)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    `;

    aplicarPaginacion('tbl-por-proveedor');

  } catch (e) {
    document.getElementById('cont-por-proveedor').innerHTML = '<p style="color:red">Error de conexión</p>';
  }
}

async function cargarFormEditarOrden(idOrden) {
  try {
    const data = await fetch(`${API}/compras/${idOrden}`).then(r => r.json());

    if (data.error) {
      alert('Orden no encontrada');
      return;
    }

    document.getElementById('eo-fecha').value = data.fechaOrden ? data.fechaOrden.substring(0, 10) : '';
    document.getElementById('eo-monto').value = data.montoTotal || '';
    document.getElementById('eo-prov-nom').value = data.nombreProveedor || '';
    document.getElementById('eo-idproveedor').value = data.idProveedor || '';

    await cargarEstadosOrdenEditar(data.idEstadoOrden);

    const form = document.getElementById('form-editar-orden');
    const msgEditar = document.getElementById('msg-editar-orden');

    if (form) {
      form.style.display = 'block';
    }

    if (msgEditar) {
      if (esEntregada(data.estadoOrden) || esCancelada(data.estadoOrden)) {
        msgEditar.className = 'msg err';
        msgEditar.textContent = `Esta orden está ${data.estadoOrden}. No se puede editar.`;
      } else {
        msgEditar.className = 'msg';
        msgEditar.textContent = '';
      }
    }

  } catch (e) {
    alert('Error al cargar datos de la orden');
  }
}

async function cargarEstadosOrdenEditar(idSeleccionado) {
  const data = await fetch(`${API}/compras/estados`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById('eo-idestado');

  if (!sel) return;

  sel.innerHTML = '<option value="">-- Estado --</option>' +
    data.map(e => `<option value="${e.idEstadoOrden}" ${e.idEstadoOrden === idSeleccionado ? 'selected' : ''}>${e.nombreEstadoOrden}</option>`).join('');
}

async function guardarEdicionOrden() {
  const id = document.getElementById('eo-idorden').value;

  if (!id) {
    return msg('msg-editar-orden', 'Seleccione una orden de la lista.', 'err');
  }

  const body = {
    fechaOrden: document.getElementById('eo-fecha').value,
    idEstadoOrden: parseInt(document.getElementById('eo-idestado').value) || null,
    idProveedor: parseInt(document.getElementById('eo-idproveedor').value) || null,
    montoTotal: parseFloat(document.getElementById('eo-monto').value) || null
  };

  if (!body.fechaOrden || !body.idEstadoOrden || !body.idProveedor || !body.montoTotal) {
    return msg('msg-editar-orden', 'Todos los campos son obligatorios.', 'err');
  }

  try {
    const res = await fetch(`${API}/compras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-editar-orden', 'Error: ' + data.error, 'err');
    }

    msg('msg-editar-orden', data.mensaje || 'Orden actualizada correctamente', 'ok');
    cargarOrdenes();

  } catch (e) {
    msg('msg-editar-orden', 'Error de conexión', 'err');
  }
}

async function eliminarOrden(id) {
  if (!confirmarAccion(`¿Eliminar la orden de compra ID ${id}? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    const res = await fetch(`${API}/compras/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) {
      return alert('Error: ' + data.error);
    }

    cargarOrdenes();

  } catch (e) {
    alert('Error de conexión');
  }
}

async function eliminarDetalle(idDetalle) {
  if (!confirmarAccion(`¿Eliminar el ítem de detalle ID ${idDetalle}?`)) {
    return;
  }

  try {
    const res = await fetch(`${API}/compras/detalle/${idDetalle}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) {
      return alert('Error: ' + data.error);
    }

    buscarDetalle();

  } catch (e) {
    alert('Error de conexión');
  }
}

function moneda(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  return `${Number(valor).toFixed(2)} Bs`;
}

cargarOrdenes();
// Imprime el listado de órdenes de compra (respeta el rango de fechas).
function imprimirOrdenes() {
  if (!_dataOrdenes.length) return alert('No hay órdenes para imprimir.');
  const win = nuevaVentanaPDF();
  const f = v => v ? String(v).substring(0, 10) : '-';
  const n = v => Number(v || 0).toFixed(2);
  const total = _dataOrdenes.reduce((s, o) => s + Number(o.montoTotal || 0), 0);
  const filas = _dataOrdenes.map(o => [
    o.idOrdenCompra, f(o.fechaOrden), o.nombreProveedor || '-', n(o.montoTotal), o.estadoOrden || '-',
  ]);
  const cuerpo =
    pdfTabla('Órdenes de Compra', ['ID', 'Fecha', 'Proveedor', 'Monto (Bs)', 'Estado'], filas) +
    `<div class="total">Monto total: Bs ${n(total)}</div>`;
  imprimirReporte(win, 'Reporte de Órdenes de Compra',
    etiquetaRango(_rangoOrdenes.desde, _rangoOrdenes.hasta), [cuerpo]);
}

