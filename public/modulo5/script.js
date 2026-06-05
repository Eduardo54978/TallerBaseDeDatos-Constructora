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

async function cargarContratos() {
  try {
    const data = await fetch(`${API}/contratos`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idContrato');

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

async function registrarContrato() {
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