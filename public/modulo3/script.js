const API = 'http://localhost:3000/api';

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
    filas.forEach((f, i) => { f.style.display = (i >= ini && i < ini + PAG_SIZE) ? '' : 'none'; });
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
    document.getElementById('prev-' + tablaId).onclick = () => { pagina--; render(); };
    document.getElementById('next-' + tablaId).onclick = () => { pagina++; render(); };
  }
  render();
}

function confirmarAccion(mensaje) {
  return confirm(mensaje);
}

function ordenarPorNumero(datos, campo) {
  return [...(datos || [])].sort((a, b) => {
    return Number(a[campo] || 0) - Number(b[campo] || 0);
  });
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

  if (name === 'pagos-clientes') cargarPagosClientes();
  if (name === 'pagos-proveedores') cargarPagosProveedores();
  if (name === 'pagos-planilla') cargarPagosPlanilla();
  if (name === 'cuotas') cargarCuotas('todas');
  if (name === 'registrar-pago-prov') cargarSelectMetodosEn('pp-idmetodo');
  if (name === 'registrar-pago-plan') {
    cargarSelectMetodosEn('pl-idmetodo');
    cargarSelectEstadosPagoEn('pl-idestado');
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

  if (t.includes('pagado') || t.includes('completado') || t.includes('verificado')) {
    return `<span class="badge badge-green">${texto}</span>`;
  }

  if (t.includes('vencido') || t.includes('cancelado')) {
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
  }, 4000);
}

async function cargarPagosClientes() {
  mostrarCarga('cont-pagos-clientes');
  try {
    const data = await fetch(`${API}/pagos/clientes`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idPagoCliente');

    document.getElementById('cont-pagos-clientes').innerHTML = `
      <table id="tbl-pagos-cli">
        <thead>
          <tr>
            <th>ID Pago</th>
            <th>Cliente</th>
            <th>Proyecto</th>
            <th>Contrato</th>
            <th>Cuota</th>
            <th>Fecha Pago</th>
            <th>Monto (Bs)</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(p => `<tr>
            <td>${p.idPagoCliente}</td>
            <td><b>${p.nombreCliente || '-'}</b></td>
            <td>${p.nombreProyecto || '-'}</td>
            <td>${p.numeroContrato || '-'}</td>
            <td>${p.numeroCuota != null ? 'Cuota ' + p.numeroCuota : '-'}</td>
            <td>${p.fechaPago ? p.fechaPago.substring(0, 10) : '-'}</td>
            <td>${p.monto}</td>
            <td>${p.metodoPago || '-'}</td>
            <td>${badge(p.estadoPago)}</td>
            <td>
              <button class="btn btn-accent" style="padding:4px 10px;font-size:.78rem;" onclick="editarPago('clientes', ${p.idPagoCliente})">Editar</button>
              <button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarPago('clientes', ${p.idPagoCliente})">Eliminar</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    aplicarPaginacion('tbl-pagos-cli');
  } catch (e) {
    document.getElementById('cont-pagos-clientes').innerHTML = '<p style="color:red">Error al cargar pagos de clientes</p>';
  }
}

async function cargarPagosProveedores() {
  mostrarCarga('cont-pagos-proveedores');
  try {
    const data = await fetch(`${API}/pagos/proveedores`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idPagoProveedor');

    document.getElementById('cont-pagos-proveedores').innerHTML = `
      <table id="tbl-pagos-prov">
        <thead>
          <tr>
            <th>ID Pago</th>
            <th>Proveedor</th>
            <th>ID Orden Compra</th>
            <th>Fecha Pago</th>
            <th>Monto (Bs)</th>
            <th>Método</th>
            <th>Factura</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(p => `<tr>
            <td>${p.idPagoProveedor}</td>
            <td>${p.nombreProveedor || '-'}</td>
            <td>${p.idOrdenCompra || '-'}</td>
            <td>${p.fechaPago ? p.fechaPago.substring(0, 10) : '-'}</td>
            <td>${p.monto}</td>
            <td>${p.metodoPago || '-'}</td>
            <td>${p.factura || '-'}</td>
            <td>
              <button class="btn btn-accent" style="padding:4px 10px;font-size:.78rem;" onclick="editarPago('proveedores', ${p.idPagoProveedor})">Editar</button>
              <button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarPago('proveedores', ${p.idPagoProveedor})">Eliminar</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    aplicarPaginacion('tbl-pagos-prov');
  } catch (e) {
    document.getElementById('cont-pagos-proveedores').innerHTML = '<p style="color:red">Error al cargar pagos de proveedores</p>';
  }
}

async function cargarPagosPlanilla() {
  mostrarCarga('cont-pagos-planilla');
  try {
    const data = await fetch(`${API}/pagos/planilla`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idPagoPlanillaProyecto');

    document.getElementById('cont-pagos-planilla').innerHTML = `
      <table id="tbl-pagos-plan">
        <thead>
          <tr>
            <th>ID Pago</th>
            <th>Empleado</th>
            <th>Proyecto</th>
            <th>Fecha Pago</th>
            <th>Monto (Bs)</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(p => `<tr>
            <td>${p.idPagoPlanillaProyecto}</td>
            <td>${p.empleado || '-'}</td>
            <td>${p.proyecto || '-'}</td>
            <td>${p.fechaPago ? p.fechaPago.substring(0, 10) : '-'}</td>
            <td>${p.montoPagado}</td>
            <td>${p.metodoPago || '-'}</td>
            <td>${badge(p.estadoPago)}</td>
            <td>
              <button class="btn btn-accent" style="padding:4px 10px;font-size:.78rem;" onclick="editarPago('planilla', ${p.idPagoPlanillaProyecto})">Editar</button>
              <button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarPago('planilla', ${p.idPagoPlanillaProyecto})">Eliminar</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    aplicarPaginacion('tbl-pagos-plan');
  } catch (e) {
    document.getElementById('cont-pagos-planilla').innerHTML = '<p style="color:red">Error al cargar pagos de planilla</p>';
  }
}

async function cargarCuotas(filtro) {
  mostrarCarga('cont-cuotas');
  const endpoints = {
    todas: `${API}/cuotas`,
    pendientes: `${API}/cuotas/pendientes`,
    vencidas: `${API}/cuotas/vencidas`
  };

  try {
    const data = await fetch(endpoints[filtro]).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idCuota');

    document.getElementById('cont-cuotas').innerHTML = `
      <table id="tbl-cuotas">
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Proyecto</th>
            <th>Cliente</th>
            <th>Cuota</th>
            <th>Vencimiento</th>
            <th>Monto (Bs)</th>
            <th>Saldo pendiente</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(c => `<tr>
            <td><b>${c.numeroContrato || '-'}</b></td>
            <td>${c.nombreProyecto || '-'}</td>
            <td>${c.nombreCliente || '-'}</td>
            <td>Cuota ${c.numeroCuota}</td>
            <td>${c.fechaVencimiento ? c.fechaVencimiento.substring(0, 10) : '-'}</td>
            <td>${c.montoCuota}</td>
            <td>${c.saldoPendiente}</td>
            <td>${badge(c.estadoPago)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    aplicarPaginacion('tbl-cuotas');
  } catch (e) {
    document.getElementById('cont-cuotas').innerHTML = '<p style="color:red">Error al cargar cuotas</p>';
  }
}

async function buscarCuotasContrato() {
  const txtVal = (document.getElementById('cc-cont-nom') || {}).value || '';
  const idContrato = document.getElementById('cc-idcontrato').value.trim() || (/^\d+$/.test(txtVal.trim()) ? txtVal.trim() : '');

  if (!idContrato) return;

  try {
    const data = await fetch(`${API}/cuotas/contrato/${idContrato}`).then(r => r.json());

    if (data.error) {
      document.getElementById('cont-cuotas-contrato').innerHTML = `<p style="color:red">${data.error}</p>`;
      return;
    }

    if (data.length === 0) {
      document.getElementById('cont-cuotas-contrato').innerHTML = '<p>No se encontraron cuotas para este contrato.</p>';
      return;
    }

    const ordenados = ordenarPorNumero(data, 'idCuota');

    document.getElementById('cont-cuotas-contrato').innerHTML = `
      <table id="tbl-cuotas-contrato">
        <thead>
          <tr>
            <th>Cuota</th>
            <th>Vencimiento</th>
            <th>Monto (Bs)</th>
            <th>Saldo pendiente</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(c => `<tr>
            <td>Cuota ${c.numeroCuota}</td>
            <td>${c.fechaVencimiento ? c.fechaVencimiento.substring(0, 10) : '-'}</td>
            <td>${c.montoCuota}</td>
            <td>${c.saldoPendiente}</td>
            <td>${badge(c.estadoPago)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    aplicarPaginacion('tbl-cuotas-contrato');
  } catch (e) {
    document.getElementById('cont-cuotas-contrato').innerHTML = '<p style="color:red">Error de conexión</p>';
  }
}

// ── Edición de pagos ─────────────────────────────────────────────────────────
let editPagoCli = null;
let editPagoProv = null;
let editPagoPlan = null;

function activarTabPago(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => (b.getAttribute('onclick') || '').includes(`'${name}'`));
  if (btn) btn.classList.add('active');
}

async function editarPago(tipo, id) {
  try {
    const d = await fetch(`${API}/pagos/${tipo}/${id}`).then(r => r.json());
    if (d.error) return alert('Error: ' + d.error);

    if (tipo === 'clientes') {
      activarTabPago('registrar-pago');
      cargarSelectMetodos();
      cargarSelectEstadosPago();
      document.getElementById('rp-cont-nom').value = d.contratoDisplay || '';
      document.getElementById('rp-idcontrato').value = d.idContrato;
      await cargarCuotasSelect(d.idContrato);
      document.getElementById('rp-idcuota').value = d.idCuota;
      document.getElementById('rp-fechapago').value = d.fechaPago ? d.fechaPago.substring(0, 10) : '';
      document.getElementById('rp-monto').value = d.monto;
      document.getElementById('rp-idmetodo').value = d.idMetodoPago;
      document.getElementById('rp-idestado').value = d.idEstadoPago;
      editPagoCli = id;
      document.getElementById('btn-pago-cli').textContent = 'Guardar cambios';
      document.getElementById('btn-cancelar-edit-cli').style.display = 'inline-block';
    } else if (tipo === 'proveedores') {
      activarTabPago('registrar-pago-prov');
      await cargarSelectMetodosEn('pp-idmetodo');
      document.getElementById('pp-prov-nom').value = d.nombreProveedor || '';
      document.getElementById('pp-idprov').value = d.idProveedor;
      document.getElementById('pp-fecha').value = d.fechaPago ? d.fechaPago.substring(0, 10) : '';
      document.getElementById('pp-monto').value = d.monto;
      document.getElementById('pp-idmetodo').value = d.idMetodoPago;
      document.getElementById('pp-factura').value = d.factura || '';
      editPagoProv = id;
      document.getElementById('btn-pago-prov').textContent = 'Guardar cambios';
      document.getElementById('btn-cancelar-edit-prov').style.display = 'inline-block';
    } else if (tipo === 'planilla') {
      activarTabPago('registrar-pago-plan');
      await cargarSelectMetodosEn('pl-idmetodo');
      await cargarSelectEstadosPagoEn('pl-idestado');
      document.getElementById('pl-emp-nom').value = d.empleado || '';
      document.getElementById('pl-idempleado').value = d.idEmpleado;
      document.getElementById('pl-proy-nom').value = d.proyecto || '';
      document.getElementById('pl-idproyecto').value = d.idProyecto;
      document.getElementById('pl-fecha').value = d.fechaPago ? d.fechaPago.substring(0, 10) : '';
      document.getElementById('pl-monto').value = d.montoPagado;
      document.getElementById('pl-idmetodo').value = d.idMetodoPago;
      document.getElementById('pl-idestado').value = d.idEstadoPago;
      editPagoPlan = id;
      document.getElementById('btn-pago-plan').textContent = 'Guardar cambios';
      document.getElementById('btn-cancelar-edit-plan').style.display = 'inline-block';
    }
  } catch (e) {
    alert('Error al cargar el pago');
  }
}

function cancelarEdicionPago(tipo) {
  if (tipo === 'clientes') {
    editPagoCli = null;
    document.getElementById('btn-pago-cli').textContent = 'Registrar Pago';
    document.getElementById('btn-cancelar-edit-cli').style.display = 'none';
    document.querySelectorAll('#tab-registrar-pago input').forEach(i => i.value = '');
  } else if (tipo === 'proveedores') {
    editPagoProv = null;
    document.getElementById('btn-pago-prov').textContent = 'Registrar Pago';
    document.getElementById('btn-cancelar-edit-prov').style.display = 'none';
    ['pp-prov-nom', 'pp-idprov', 'pp-fecha', 'pp-monto', 'pp-factura'].forEach(i => document.getElementById(i).value = '');
  } else if (tipo === 'planilla') {
    editPagoPlan = null;
    document.getElementById('btn-pago-plan').textContent = 'Registrar Pago';
    document.getElementById('btn-cancelar-edit-plan').style.display = 'none';
    ['pl-emp-nom', 'pl-idempleado', 'pl-proy-nom', 'pl-idproyecto', 'pl-fecha', 'pl-monto'].forEach(i => document.getElementById(i).value = '');
  }
}

async function registrarPago() {
  const body = {
    idContrato: parseInt(document.getElementById('rp-idcontrato').value),
    idCuota: parseInt(document.getElementById('rp-idcuota').value),
    fechaPago: document.getElementById('rp-fechapago').value,
    monto: parseFloat(document.getElementById('rp-monto').value),
    idMetodoPago: parseInt(document.getElementById('rp-idmetodo').value),
    idEstadoPago: parseInt(document.getElementById('rp-idestado').value)
  };

  if (!body.idContrato) return msg('msg-pago', 'Seleccione un contrato de la lista.', 'err');

  if (!body.idContrato || !body.idCuota || !body.fechaPago || !body.monto || !body.idMetodoPago || !body.idEstadoPago) {
    return msg('msg-pago', 'Llene todos los campos obligatorios (*)', 'err');
  }

  try {
    const url = editPagoCli ? `${API}/pagos/clientes/${editPagoCli}` : `${API}/pagos/clientes`;
    const method = editPagoCli ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-pago', 'Error: ' + data.error, 'err');
    }

    if (editPagoCli) {
      msg('msg-pago', 'Pago actualizado correctamente', 'ok');
      cancelarEdicionPago('clientes');
    } else {
      const contratoNom = document.getElementById('rp-cont-nom').value;
      msg('msg-pago', `Pago exitoso (Nº ${data.idPagoCliente}): se registró el pago de Bs ${body.monto.toFixed(2)} del contrato ${contratoNom}.`, 'ok');
      document.querySelectorAll('#tab-registrar-pago input').forEach(i => {
        i.value = '';
      });
    }

    cargarPagosClientes();
  } catch (e) {
    msg('msg-pago', 'Error de conexión', 'err');
  }
}

async function cargarSelectMetodos() {
  const data = await fetch(`${API}/pagos/metodos`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById('rp-idmetodo');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Método de pago --</option>' +
    data.map(m => `<option value="${m.idMetodoPago}">${m.nombreMetodoPago}</option>`).join('');
}

async function cargarSelectEstadosPago() {
  const data = await fetch(`${API}/pagos/estados`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById('rp-idestado');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Estado de pago --</option>' +
    data.map(e => `<option value="${e.idEstadoPago}">${e.nombreEstadoPago}</option>`).join('');
}

async function cargarCuotasSelect(idContrato) {
  const sel = document.getElementById('rp-idcuota');
  if (!sel) return;
  if (!idContrato) { sel.innerHTML = '<option value="">-- Selecciona un contrato primero --</option>'; return; }
  sel.innerHTML = '<option value="">Cargando...</option>';
  try {
    const data = await fetch(`${API}/cuotas/contrato/${idContrato}`).then(r => r.json());
    if (!data.length) { sel.innerHTML = '<option value="">Sin cuotas pendientes</option>'; return; }
    sel.innerHTML = '<option value="">-- Seleccionar cuota --</option>' +
      data.map(c => `<option value="${c.idCuota}">Cuota ${c.numeroCuota} — Bs ${c.montoCuota} (${c.estadoPago})</option>`).join('');
  } catch (e) {
    sel.innerHTML = '<option value="">Error al cargar cuotas</option>';
  }
}

async function cargarSelectMetodosEn(selectId) {
  const data = await fetch(`${API}/pagos/metodos`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Método de pago --</option>' +
    data.map(m => `<option value="${m.idMetodoPago}">${m.nombreMetodoPago}</option>`).join('');
}

async function cargarSelectEstadosPagoEn(selectId) {
  const data = await fetch(`${API}/pagos/estados`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Estado de pago --</option>' +
    data.map(e => `<option value="${e.idEstadoPago}">${e.nombreEstadoPago}</option>`).join('');
}

async function registrarPagoProveedor() {
  const body = {
    idProveedor: parseInt(document.getElementById('pp-idprov').value),
    fechaPago: document.getElementById('pp-fecha').value,
    monto: parseFloat(document.getElementById('pp-monto').value),
    idMetodoPago: parseInt(document.getElementById('pp-idmetodo').value),
    factura: document.getElementById('pp-factura').value.trim() || null
  };
  if (!body.idProveedor) return msg('msg-pago-prov', 'Seleccione un proveedor de la lista.', 'err');
  if (!body.fechaPago || Number.isNaN(body.monto) || !body.idMetodoPago) {
    return msg('msg-pago-prov', 'Fecha, monto y método son obligatorios.', 'err');
  }
  try {
    const url = editPagoProv ? `${API}/pagos/proveedores/${editPagoProv}` : `${API}/pagos/proveedores`;
    const method = editPagoProv ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-pago-prov', 'Error: ' + data.error, 'err');
    if (editPagoProv) {
      msg('msg-pago-prov', 'Pago actualizado correctamente', 'ok');
      cancelarEdicionPago('proveedores');
    } else {
      const nombreProv = document.getElementById('pp-prov-nom').value;
      msg('msg-pago-prov', `Pago exitoso (Nº ${data.idPagoProveedor}): se registró el pago de Bs ${body.monto.toFixed(2)} al proveedor ${nombreProv}.`, 'ok');
      ['pp-prov-nom', 'pp-idprov', 'pp-fecha', 'pp-monto', 'pp-factura'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      document.getElementById('pp-idmetodo').value = '';
    }
    cargarPagosProveedores();
  } catch (e) {
    msg('msg-pago-prov', 'Error de conexión', 'err');
  }
}

async function registrarPagoPlanilla() {
  const body = {
    idEmpleado: parseInt(document.getElementById('pl-idempleado').value),
    idProyecto: parseInt(document.getElementById('pl-idproyecto').value),
    idBonoAntiguedadProyecto: null,
    fechaPago: document.getElementById('pl-fecha').value,
    montoPagado: parseFloat(document.getElementById('pl-monto').value),
    idMetodoPago: parseInt(document.getElementById('pl-idmetodo').value),
    idEstadoPago: parseInt(document.getElementById('pl-idestado').value)
  };
  if (!body.idEmpleado) return msg('msg-pago-plan', 'Seleccione un empleado de la lista.', 'err');
  if (!body.idProyecto) return msg('msg-pago-plan', 'Seleccione un proyecto de la lista.', 'err');
  if (!body.fechaPago || Number.isNaN(body.montoPagado) || !body.idMetodoPago || !body.idEstadoPago) {
    return msg('msg-pago-plan', 'Complete fecha, monto, método y estado.', 'err');
  }
  try {
    const url = editPagoPlan ? `${API}/pagos/planilla/${editPagoPlan}` : `${API}/pagos/planilla`;
    const method = editPagoPlan ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-pago-plan', 'Error: ' + data.error, 'err');
    if (editPagoPlan) {
      msg('msg-pago-plan', 'Pago actualizado correctamente', 'ok');
      cancelarEdicionPago('planilla');
    } else {
      const nombreEmp = document.getElementById('pl-emp-nom').value;
      const nombreProy = document.getElementById('pl-proy-nom').value;
      msg('msg-pago-plan', `Pago exitoso (Nº ${data.idPagoPlanillaProyecto}): se pagó Bs ${body.montoPagado.toFixed(2)} al empleado ${nombreEmp} por el proyecto ${nombreProy}.`, 'ok');
      ['pl-emp-nom', 'pl-idempleado', 'pl-proy-nom', 'pl-idproyecto', 'pl-fecha', 'pl-monto'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      document.getElementById('pl-idmetodo').value = '';
      document.getElementById('pl-idestado').value = '';
    }
    cargarPagosPlanilla();
  } catch (e) {
    msg('msg-pago-plan', 'Error de conexión', 'err');
  }
}

function imprimirPagosClientes() {
  const tabla = document.getElementById('tbl-pagos-cli');
  if (!tabla) return alert('No hay pagos para imprimir.');
  const fecha = new Date().toLocaleString();
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Comprobante de Pagos de Clientes</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color:#222; }
      h1 { font-size: 18px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
      th { background: #eef4ea; }
      .pie { margin-top: 16px; font-size: 11px; color:#666; }
      button { display:none; }
    </style></head><body>
    <h1>Constructora — Comprobante de Pagos de Clientes</h1>
    <p>Generado: ${fecha}</p>
    ${tabla.outerHTML}
    <p class="pie">Documento generado por el sistema. Use la opción "Guardar como PDF" del diálogo de impresión.</p>
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

async function eliminarPago(tipo, id) {
  if (!confirmarAccion(`¿Eliminar el pago ID ${id}? Esta acción no se puede deshacer.`)) return;
  try {
    const res = await fetch(`${API}/pagos/${tipo}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return alert('Error: ' + data.error);
    if (tipo === 'clientes') cargarPagosClientes();
    if (tipo === 'proveedores') cargarPagosProveedores();
    if (tipo === 'planilla') cargarPagosPlanilla();
  } catch (e) {
    alert('Error de conexión');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarSelectMetodos();
  cargarSelectEstadosPago();
});

cargarPagosClientes();