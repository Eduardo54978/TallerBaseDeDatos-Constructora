const API = 'http://localhost:3000/api';

function ordenarPorNumero(datos, campo) {
  return [...(datos || [])].sort((a, b) => Number(a[campo] || 0) - Number(b[campo] || 0));
}

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

  if (name === 'lista') {
    cargarContratos();
  }

  if (name === 'estado') {
    cargarEstadosContrato();
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
  const t = (texto || '').toLowerCase();

  if (t.includes('vigente')) {
    return `<span class="badge badge-green">${texto}</span>`;
  }

  if (t.includes('rescindido') || t.includes('cancelado')) {
    return `<span class="badge badge-red">${texto}</span>`;
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
  }, 4000);
}

let _rangoContratos = { desde: '', hasta: '' };
let _dataContratos = [];
async function cargarContratos() {
  const r = (typeof leerRango === 'function') ? leerRango('f-con-desde', 'f-con-hasta') : { desde: '', hasta: '' };
  if (!r) return;
  _rangoContratos = r;
  try {
    const data = await fetch(`${API}/contratos${typeof rangoQuery === 'function' ? rangoQuery(r.desde, r.hasta) : ''}`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idContrato');
    _dataContratos = ordenados;

    const activos = ordenados.filter(c => {
      const s = (c.nombreEstadoContrato || '').toLowerCase();
      return s.includes('vigente') || s.includes('activo');
    }).length;
    const montoTotal = ordenados.reduce((s, c) => s + Number(c.montoTotal || 0), 0);
    renderStatsCards('cont-stats', [
      { n: ordenados.length, l: 'Contratos' },
      { n: activos, l: 'Vigentes' },
      { n: 'Bs ' + montoTotal.toLocaleString('es-BO'), l: 'Monto total' },
    ]);

    document.getElementById('cont-contratos').innerHTML = `
      <table id="tbl-contratos">
        <thead>
          <tr>
            <th>ID</th>
            <th>Contrato</th>
            <th>Proyecto</th>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Fecha contrato</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(c => `<tr>
            <td>${c.idContrato}</td>
            <td><b>${c.numeroContrato}</b></td>
            <td>${c.nombreProyecto || '-'}</td>
            <td>${c.nombreCliente || '-'}</td>
            <td>${c.montoTotal} Bs</td>
            <td>${c.fechaContrato ? c.fechaContrato.substring(0, 10) : '-'}</td>
            <td>${badge(c.nombreEstadoContrato)}</td>
            <td>
              <button class="btn btn-accent" style="padding:4px 10px;font-size:.78rem;margin-right:4px;" onclick="imprimirContratoPDF(${c.idContrato})">Imprimir / PDF</button>
              <button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarContrato(${c.idContrato})">Eliminar</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-contratos').innerHTML = '<p style="color:red">Error al cargar contratos</p>';
  }
}

// ── Imprimir un contrato en PDF ──────────────────────────────────────────────
async function imprimirContratoPDF(id) {
  const win = nuevaVentanaPDF();
  try {
    const c = await fetch(`${API}/contratos/${id}`).then(r => r.json());
    if (c.error) { if (win) win.close(); return alert('Error: ' + c.error); }

    let cuerpo = `<h1>Contrato — ${c.numeroContrato}</h1>`;
    cuerpo += pdfDatos([
      ['Tipo', c.nombreTipoContrato],
      ['Estado', c.nombreEstadoContrato],
      ['Proyecto', c.nombreProyecto],
      ['Cliente', c.nombreCliente],
      ['Fecha contrato', (c.fechaContrato || '').substring(0, 10)],
      ['Firma', (c.fechaFirma || '').substring(0, 10)],
      ['Inicio', (c.fechaInicio || '').substring(0, 10)],
      ['Vencimiento', (c.fechaVencimiento || '').substring(0, 10)],
    ]);
    cuerpo += pdfTabla('Cuotas', ['#', 'Monto (Bs)', 'Saldo pend. (Bs)', 'Vencimiento', 'Estado'],
      (c.cuotas || []).map(q => [
        q.numeroCuota,
        Number(q.montoCuota).toFixed(2),
        Number(q.saldoPendiente).toFixed(2),
        (q.fechaVencimiento || '').substring(0, 10),
        q.nombreEstadoPago,
      ]));
    cuerpo += `<div class="total">Monto total del contrato: Bs ${Number(c.montoTotal).toFixed(2)}</div>`;

    escribirImpresionPDF(win, `Contrato ${c.numeroContrato}`, cuerpo);
  } catch (e) {
    if (win) win.close();
    alert('Error al generar el PDF del contrato');
  }
}

// Estado de la preparación del contrato del proyecto seleccionado.
let _prepContrato = null;
const _bs = n => 'Bs ' + Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Se dispara al elegir un proyecto en el autocompletado: carga la cotización
// cliente asociada y el detalle de la obra (material + personal con costos).
async function onProyectoContrato(idProyecto) {
  const cont = document.getElementById('c-preparacion');
  const btn = document.getElementById('c-btn-crear');
  cont.innerHTML = '<p style="color:#718096;">Cargando cotización y detalle de la obra...</p>';
  try {
    const data = await fetch(`${API}/contratos/proyecto/${idProyecto}/preparacion`).then(r => r.json());
    _prepContrato = data;
    const cot = data.cotizacion;
    const t = data.totales;

    // Aviso de la cotización según su estado.
    let aviso, puede = false;
    if (!cot.existe) {
      aviso = `<div style="background:#fde8e8;color:#922b21;border-radius:8px;padding:12px 14px;font-weight:600;">
        El proyecto no tiene una cotización cliente asociada. No se puede generar el contrato.</div>`;
    } else if (!cot.aprobada) {
      aviso = `<div style="background:#fde8e8;color:#922b21;border-radius:8px;padding:12px 14px;font-weight:600;">
        Cotización N° ${cot.numero} está en estado "${cot.estado}". Debe estar APROBADA para generar el contrato.</div>`;
    } else {
      puede = true;
      aviso = `<div style="background:#DFEAD8;color:#28512B;border-radius:8px;padding:12px 14px;">
        <b>Cotización N° ${cot.numero}</b> — Monto total: <b>${_bs(cot.total)}</b>
        <span style="background:#28512B;color:#fff;border-radius:12px;padding:2px 10px;font-size:.72rem;margin-left:6px;">APROBADA</span></div>`;
      // Sugerir el monto de la cotización como monto del contrato.
      const inputMonto = document.getElementById('c-monto');
      if (inputMonto && !inputMonto.value) inputMonto.value = Number(cot.total).toFixed(2);
    }

    const tablaMat = data.materiales.length
      ? `<table style="width:100%;border-collapse:collapse;font-size:.84rem;margin-top:4px;">
          <thead><tr style="background:#173F24;color:#fff;">
            <th style="padding:6px 8px;text-align:left;">Material</th>
            <th style="padding:6px 8px;text-align:right;">Cantidad</th>
            <th style="padding:6px 8px;text-align:right;">Costo</th></tr></thead>
          <tbody>${data.materiales.map(m => `<tr>
            <td style="padding:5px 8px;border-bottom:1px solid #e1e6dd;">${m.nombreMaterial}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #e1e6dd;text-align:right;">${m.cantidadUtilizada}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #e1e6dd;text-align:right;">${_bs(m.costoTotal)}</td></tr>`).join('')}</tbody></table>`
      : '<p style="color:#718096;font-size:.84rem;">Sin materiales registrados para este proyecto.</p>';

    const tablaPer = data.personal.length
      ? `<table style="width:100%;border-collapse:collapse;font-size:.84rem;margin-top:4px;">
          <thead><tr style="background:#173F24;color:#fff;">
            <th style="padding:6px 8px;text-align:left;">Empleado</th>
            <th style="padding:6px 8px;text-align:left;">Cargo</th>
            <th style="padding:6px 8px;text-align:left;">Rol</th>
            <th style="padding:6px 8px;text-align:right;">Costo</th></tr></thead>
          <tbody>${data.personal.map(p => `<tr>
            <td style="padding:5px 8px;border-bottom:1px solid #e1e6dd;">${p.empleado}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #e1e6dd;">${p.nombreCargo}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #e1e6dd;">${p.nombreRolProyecto}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #e1e6dd;text-align:right;">${_bs(p.costo)}</td></tr>`).join('')}</tbody></table>`
      : '<p style="color:#718096;font-size:.84rem;">Sin personal asignado para este proyecto.</p>';

    cont.innerHTML = `${aviso}
      <h4 style="color:#173F24;margin:16px 0 4px;">Detalle de la obra — Material a comprar</h4>${tablaMat}
      <h4 style="color:#173F24;margin:16px 0 4px;">Detalle de la obra — Personal asignado</h4>${tablaPer}
      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:14px;">
        <div style="background:#EEF4EA;border-radius:8px;padding:10px 16px;">
          <div style="font-weight:800;color:#173F24;">${_bs(t.costoMaterial)}</div>
          <div style="font-size:.7rem;color:#6b756d;text-transform:uppercase;">Costo material</div></div>
        <div style="background:#EEF4EA;border-radius:8px;padding:10px 16px;">
          <div style="font-weight:800;color:#173F24;">${_bs(t.costoPersonal)}</div>
          <div style="font-size:.7rem;color:#6b756d;text-transform:uppercase;">Costo personal</div></div>
        <div style="background:#DFEAD8;border-radius:8px;padding:10px 16px;">
          <div style="font-weight:800;color:#173F24;">${_bs(t.costoTotal)}</div>
          <div style="font-size:.7rem;color:#6b756d;text-transform:uppercase;">Costo total de la obra</div></div>
      </div>`;

    if (btn) { btn.disabled = !puede; btn.style.opacity = puede ? '1' : '.5'; btn.style.cursor = puede ? 'pointer' : 'not-allowed'; }
  } catch (e) {
    cont.innerHTML = '<p style="color:#922b21;">No se pudo cargar la cotización del proyecto.</p>';
  }
}

async function registrarContrato() {
  // Regla de negocio: requiere cotización cliente APROBADA asociada al proyecto.
  if (!_prepContrato || !_prepContrato.cotizacion.aprobada) {
    return msg('msg-contrato',
      'No se puede generar el contrato: el proyecto debe tener una cotización cliente en estado APROBADA.', 'err');
  }

  const body = {
    idProyecto: parseInt(document.getElementById('c-idproyecto').value),
    idTipoContrato: parseInt(document.getElementById('c-idtipo').value),
    numeroContrato: document.getElementById('c-numero').value.trim(),
    montoTotal: parseFloat(document.getElementById('c-monto').value),
    fechaContrato: document.getElementById('c-fechac').value,
    fechaInicio: document.getElementById('c-fechai').value || null,
    fechaVencimiento: document.getElementById('c-fechav').value || null,
    fechaFirma: document.getElementById('c-fechaf').value || null
  };

  if (!body.idProyecto) return msg('msg-contrato', 'Seleccione un proyecto de la lista.', 'err');
  if (!body.numeroContrato || !body.montoTotal || !body.fechaContrato) {
    return msg('msg-contrato', 'Llene todos los campos obligatorios (*)', 'err');
  }

  try {
    const res = await fetch(`${API}/contratos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-contrato', 'Error: ' + data.error, 'err');
    }

    msg('msg-contrato', `Contrato registrado exitosamente con ID: ${data.idContrato}`, 'ok');

    document.querySelectorAll('#tab-registrar input').forEach(input => {
      input.value = '';
    });
    document.getElementById('c-preparacion').innerHTML = '';
    _prepContrato = null;

    cargarContratos();
  } catch (e) {
    msg('msg-contrato', 'Error de conexión', 'err');
  }
}

async function generarCuotas() {
  const idContrato = document.getElementById('cu-idcontrato').value;

  const body = {
    numeroCuotas: parseInt(document.getElementById('cu-cantidad').value),
    frecuenciaPago: document.getElementById('cu-frecuencia').value
  };

  if (!idContrato) return msg('msg-cuotas', 'Seleccione un contrato de la lista.', 'err');
  if (!body.numeroCuotas) return msg('msg-cuotas', 'Ingrese el número de cuotas.', 'err');

  try {
    const res = await fetch(`${API}/contratos/${idContrato}/cuotas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-cuotas', 'Error: ' + data.error, 'err');
    }

    msg('msg-cuotas', data.mensaje, 'ok');

    document.getElementById('cu-idcontrato').value = '';
    document.getElementById('cu-cantidad').value = '';
    document.getElementById('cu-cont-nom').value = '';
    _montoContratoCuotas = 0;
    const ci = document.getElementById('cu-cont-info'); if (ci) ci.textContent = '';
    const cp = document.getElementById('cu-preview'); if (cp) cp.textContent = '';
  } catch (e) {
    msg('msg-cuotas', 'Error de conexión', 'err');
  }
}

// Al elegir el contrato, guarda su monto total para previsualizar las cuotas.
let _montoContratoCuotas = 0;
async function onSelContratoCuotas(idContrato) {
  const info = document.getElementById('cu-cont-info');
  _montoContratoCuotas = 0;
  if (!info) return;
  if (!idContrato) { info.textContent = ''; return; }
  info.textContent = 'Buscando monto del contrato...';
  try {
    const c = await fetch(`${API}/contratos/${idContrato}`).then(r => r.json());
    _montoContratoCuotas = Number(c.montoTotal || 0);
    info.style.color = '#276749';
    info.textContent = `Monto total del contrato: Bs ${_montoContratoCuotas.toFixed(2)}`;
    calcCuotaPreview();
  } catch (e) {
    info.textContent = '';
  }
}

// Muestra cuánto saldría cada cuota (monto total / número de cuotas).
function calcCuotaPreview() {
  const out = document.getElementById('cu-preview');
  if (!out) return;
  const n = parseInt(document.getElementById('cu-cantidad').value);
  if (!_montoContratoCuotas || Number.isNaN(n) || n <= 0) { out.textContent = ''; return; }
  out.textContent = `Cada cuota será de aprox. Bs ${(_montoContratoCuotas / n).toFixed(2)}`;
}

async function consultarPorCliente() {
  const idCliente = document.getElementById('cli-id').value;

  if (!idCliente) return;

  try {
    const data = await fetch(`${API}/contratos/cliente/${idCliente}`).then(r => r.json());

    if (data.error) {
      document.getElementById('cont-contratos-cliente').innerHTML = `<p style="color:red">${data.error}</p>`;
      return;
    }

    if (data.length === 0) {
      document.getElementById('cont-contratos-cliente').innerHTML = '<p>No se encontraron contratos para este cliente.</p>';
      return;
    }

    const ordenados = ordenarPorNumero(data, 'idContrato');

    document.getElementById('cont-contratos-cliente').innerHTML = `
      <table id="tbl-contratos-cliente">
        <thead>
          <tr>
            <th>ID</th>
            <th>Contrato</th>
            <th>Proyecto</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(c => `<tr>
            <td>${c.idContrato}</td>
            <td><b>${c.numeroContrato}</b></td>
            <td>${c.nombreProyecto || '-'}</td>
            <td>${c.montoTotal} Bs</td>
            <td>${badge(c.nombreEstadoContrato)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-contratos-cliente').innerHTML = '<p style="color:red">Error de conexión</p>';
  }
}

async function cargarTiposContrato() {
  const data = await fetch(`${API}/contratos/tipos/lista`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById('c-idtipo');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Tipo de contrato --</option>' +
    data.map(t => `<option value="${t.idTipoContrato}">${t.nombreTipoContrato}</option>`).join('');
}

async function cargarEstadosContrato() {
  const data = await fetch(`${API}/contratos/estados/lista`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById('es-idestado');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Nuevo estado --</option>' +
    data.map(e => `<option value="${e.idEstadoContrato}">${e.nombreEstadoContrato}</option>`).join('');
}

async function cambiarEstadoContrato() {
  const id = document.getElementById('es-idcontrato').value;
  const idEstadoContrato = parseInt(document.getElementById('es-idestado').value);
  if (!id) return msg('msg-estado', 'Seleccione un contrato de la lista.', 'err');
  if (!idEstadoContrato) return msg('msg-estado', 'Seleccione el nuevo estado.', 'err');
  try {
    const res = await fetch(`${API}/contratos/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idEstadoContrato })
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-estado', 'Error: ' + data.error, 'err');
    msg('msg-estado', 'Estado del contrato actualizado correctamente', 'ok');
    document.getElementById('es-cont-nom').value = '';
    document.getElementById('es-idcontrato').value = '';
    cargarContratos();
  } catch (e) {
    msg('msg-estado', 'Error de conexión', 'err');
  }
}

async function cargarFormEditarContrato(idContrato) {
  try {
    const data = await fetch(`${API}/contratos/${idContrato}`).then(r => r.json());
    if (data.error) return msg('msg-editar-contrato', data.error, 'err');
    if (data.idEstadoContrato !== 1) {
      document.getElementById('form-editar-contrato').style.display = 'none';
      return msg('msg-editar-contrato', 'Este contrato no está Vigente, no se puede editar. Usa Rescindir/Renovar.', 'err');
    }
    document.getElementById('ec-numero').value = data.numeroContrato || '';
    document.getElementById('ec-monto').value = data.montoTotal || '';
    await cargarTiposContratoEditar(data.idTipoContrato);
    document.getElementById('form-editar-contrato').style.display = 'block';
  } catch (e) {
    msg('msg-editar-contrato', 'Error al cargar el contrato', 'err');
  }
}

async function cargarTiposContratoEditar(idSeleccionado) {
  const data = await fetch(`${API}/contratos/tipos/lista`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById('ec-idtipo');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Tipo de contrato --</option>' +
    data.map(t => `<option value="${t.idTipoContrato}" ${t.idTipoContrato === idSeleccionado ? 'selected' : ''}>${t.nombreTipoContrato}</option>`).join('');
}

async function guardarEdicionContrato() {
  const id = document.getElementById('ec-idcontrato').value;
  if (!id) return msg('msg-editar-contrato', 'Busque un contrato primero.', 'err');
  const body = {
    numeroContrato: document.getElementById('ec-numero').value.trim(),
    montoTotal: parseFloat(document.getElementById('ec-monto').value),
    idTipoContrato: parseInt(document.getElementById('ec-idtipo').value)
  };
  if (!body.numeroContrato || Number.isNaN(body.montoTotal) || body.montoTotal <= 0 || !body.idTipoContrato) {
    return msg('msg-editar-contrato', 'Complete número, monto válido y tipo.', 'err');
  }
  try {
    const res = await fetch(`${API}/contratos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-editar-contrato', 'Error: ' + data.error, 'err');
    msg('msg-editar-contrato', 'Contrato actualizado correctamente', 'ok');
    cargarContratos();
  } catch (e) {
    msg('msg-editar-contrato', 'Error de conexión', 'err');
  }
}

async function prefillRenovar(idContrato) {
  try {
    const data = await fetch(`${API}/contratos/${idContrato}`).then(r => r.json());
    if (data && data.montoTotal != null) {
      document.getElementById('rn-monto').value = data.montoTotal;
    }
  } catch (e) {}
}

async function rescindirRenovar() {
  const id = document.getElementById('rn-idcontrato').value;
  const numeroContrato = document.getElementById('rn-numero').value.trim();
  const montoTotal = parseFloat(document.getElementById('rn-monto').value);
  if (!id) return msg('msg-renovar', 'Seleccione el contrato a rescindir.', 'err');
  if (!numeroContrato) return msg('msg-renovar', 'Ingrese el número del nuevo contrato.', 'err');
  if (Number.isNaN(montoTotal) || montoTotal <= 0) return msg('msg-renovar', 'Ingrese un monto válido.', 'err');
  if (!confirm('Esto rescindirá el contrato actual y creará uno nuevo Vigente. ¿Continuar?')) return;
  try {
    const res = await fetch(`${API}/contratos/${id}/rescindir-renovar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroContrato, montoTotal })
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-renovar', 'Error: ' + data.error, 'err');
    msg('msg-renovar', `${data.mensaje} Nuevo contrato Nº interno ${data.idContratoNuevo}.`, 'ok');
    ['rn-cont-nom', 'rn-idcontrato', 'rn-numero', 'rn-monto'].forEach(i => {
      const el = document.getElementById(i);
      if (el) el.value = '';
    });
    cargarContratos();
  } catch (e) {
    msg('msg-renovar', 'Error de conexión', 'err');
  }
}

async function eliminarContrato(id) {
  if (!confirm(`¿Eliminar el contrato ID ${id}? Esta acción no se puede deshacer.`)) return;
  try {
    const res = await fetch(`${API}/contratos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return alert('Error: ' + data.error);
    cargarContratos();
  } catch (e) {
    alert('Error de conexión');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarTiposContrato();
});

cargarContratos();
// Imprime el listado de contratos (respeta el rango de fechas).
function imprimirContratos() {
  if (!_dataContratos.length) return alert('No hay contratos para imprimir.');
  const win = nuevaVentanaPDF();
  const f = v => v ? String(v).substring(0, 10) : '-';
  const n = v => Number(v || 0).toFixed(2);
  const total = _dataContratos.reduce((s, c) => s + Number(c.montoTotal || 0), 0);
  const filas = _dataContratos.map(c => [
    c.numeroContrato, c.nombreProyecto || '-', c.nombreCliente || '-',
    n(c.montoTotal), f(c.fechaContrato), f(c.fechaVencimiento), c.nombreEstadoContrato || '-',
  ]);
  const cuerpo =
    pdfTabla('Contratos', ['Número', 'Proyecto', 'Cliente', 'Monto (Bs)', 'Fecha', 'Vencimiento', 'Estado'], filas) +
    `<div class="total">Monto total: Bs ${n(total)}</div>`;
  imprimirReporte(win, 'Reporte de Contratos',
    etiquetaRango(_rangoContratos.desde, _rangoContratos.hasta), [cuerpo]);
}
