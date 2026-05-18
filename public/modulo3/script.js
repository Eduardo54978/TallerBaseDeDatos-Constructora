const API = 'http://localhost:3000/api';

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  if (name === 'pagos-clientes')    cargarPagosClientes();
  if (name === 'pagos-proveedores') cargarPagosProveedores();
  if (name === 'pagos-planilla')    cargarPagosPlanilla();
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
  if (t.includes('pagado') || t.includes('completado')) return `<span class="badge badge-green">${texto}</span>`;
  if (t.includes('vencido') || t.includes('cancelado'))  return `<span class="badge badge-red">${texto}</span>`;
  if (t.includes('pendiente'))                            return `<span class="badge badge-yellow">${texto}</span>`;
  return `<span class="badge badge-blue">${texto}</span>`;
}

function msg(id, texto, tipo) {
  const el = document.getElementById(id);
  el.className = 'msg ' + tipo;
  el.textContent = texto;
  setTimeout(() => el.className = 'msg', 4000);
}

async function cargarPagosClientes() {
  try {
    const data = await fetch(`${API}/pagos/clientes`).then(r => r.json());
    document.getElementById('cont-pagos-clientes').innerHTML = `
      <table id="tbl-pagos-cli">
        <thead>
          <tr>
            <th>ID Pago</th><th>ID Contrato</th><th>ID Cuota</th>
            <th>Fecha Pago</th><th>Monto (Bs)</th><th>Metodo</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(p => `<tr>
            <td>${p.idPagoCliente}</td>
            <td>${p.idContrato}</td>
            <td>${p.idCuota}</td>
            <td>${p.fechaPago ? p.fechaPago.substring(0, 10) : '-'}</td>
            <td>${p.monto}</td>
            <td>${p.metodoPago || '-'}</td>
            <td>${badge(p.estadoPago)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-pagos-clientes').innerHTML = '<p style="color:red">Error al cargar pagos de clientes</p>';
  }
}

async function cargarPagosProveedores() {
  try {
    const data = await fetch(`${API}/pagos/proveedores`).then(r => r.json());
    document.getElementById('cont-pagos-proveedores').innerHTML = `
      <table id="tbl-pagos-prov">
        <thead>
          <tr>
            <th>ID Pago</th><th>Proveedor</th><th>ID Orden Compra</th>
            <th>Fecha Pago</th><th>Monto (Bs)</th><th>Metodo</th><th>Factura</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(p => `<tr>
            <td>${p.idPagoProveedor}</td>
            <td>${p.nombreProveedor || '-'}</td>
            <td>${p.idOrdenCompra}</td>
            <td>${p.fechaPago ? p.fechaPago.substring(0, 10) : '-'}</td>
            <td>${p.monto}</td>
            <td>${p.metodoPago || '-'}</td>
            <td>${p.factura || '-'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-pagos-proveedores').innerHTML = '<p style="color:red">Error al cargar pagos de proveedores</p>';
  }
}

async function cargarPagosPlanilla() {
  try {
    const data = await fetch(`${API}/pagos/planilla`).then(r => r.json());
    document.getElementById('cont-pagos-planilla').innerHTML = `
      <table id="tbl-pagos-plan">
        <thead>
          <tr>
            <th>ID Pago</th><th>Empleado</th><th>Proyecto</th>
            <th>Fecha Pago</th><th>Monto (Bs)</th><th>Metodo</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(p => `<tr>
            <td>${p.idPagoPlanillaProyecto}</td>
            <td>${p.empleado || '-'}</td>
            <td>${p.proyecto || '-'}</td>
            <td>${p.fechaPago ? p.fechaPago.substring(0, 10) : '-'}</td>
            <td>${p.montoPagado}</td>
            <td>${p.metodoPago || '-'}</td>
            <td>${badge(p.estadoPago)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-pagos-planilla').innerHTML = '<p style="color:red">Error al cargar pagos de planilla</p>';
  }
}

async function cargarCuotas(filtro) {
  const endpoints = {
    todas:      `${API}/cuotas`,
    pendientes: `${API}/cuotas/pendientes`,
    vencidas:   `${API}/cuotas/vencidas`
  };
  try {
    const data = await fetch(endpoints[filtro]).then(r => r.json());
    document.getElementById('cont-cuotas').innerHTML = `
      <table id="tbl-cuotas">
        <thead>
          <tr>
            <th>ID Cuota</th><th>ID Contrato</th><th>N┬║ Cuota</th>
            <th>Vencimiento</th><th>Monto (Bs)</th><th>Saldo Pendiente</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(c => `<tr>
            <td>${c.idCuota}</td>
            <td>${c.idContrato}</td>
            <td>${c.numeroCuota}</td>
            <td>${c.fechaVencimiento ? c.fechaVencimiento.substring(0, 10) : '-'}</td>
            <td>${c.montoCuota}</td>
            <td>${c.saldoPendiente}</td>
            <td>${badge(c.estadoPago)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-cuotas').innerHTML = '<p style="color:red">Error al cargar cuotas</p>';
  }
}

async function buscarCuotasContrato() {
  const idContrato = document.getElementById('cc-idcontrato').value.trim();
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
    document.getElementById('cont-cuotas-contrato').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID Cuota</th><th>N┬║ Cuota</th><th>Vencimiento</th>
            <th>Monto (Bs)</th><th>Saldo Pendiente</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(c => `<tr>
            <td>${c.idCuota}</td>
            <td>${c.numeroCuota}</td>
            <td>${c.fechaVencimiento ? c.fechaVencimiento.substring(0, 10) : '-'}</td>
            <td>${c.montoCuota}</td>
            <td>${c.saldoPendiente}</td>
            <td>${badge(c.estadoPago)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-cuotas-contrato').innerHTML = '<p style="color:red">Error de conexion</p>';
  }
}

async function registrarPago() {
  const body = {
    idContrato:   parseInt(document.getElementById('rp-idcontrato').value),
    idCuota:      parseInt(document.getElementById('rp-idcuota').value),
    fechaPago:    document.getElementById('rp-fechapago').value,
    monto:        parseFloat(document.getElementById('rp-monto').value),
    idMetodoPago: parseInt(document.getElementById('rp-idmetodo').value),
    idEstadoPago: parseInt(document.getElementById('rp-idestado').value)
  };

  if (!body.idContrato || !body.idCuota || !body.fechaPago || !body.monto || !body.idMetodoPago || !body.idEstadoPago) {
    return msg('msg-pago', 'Llene todos los campos obligatorios (*)', 'err');
  }

  try {
    const res = await fetch(`${API}/pagos/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-pago', 'Error: ' + data.error, 'err');
    msg('msg-pago', `Pago registrado con ID: ${data.idPagoCliente}`, 'ok');
    document.querySelectorAll('#tab-registrar-pago input').forEach(i => i.value = '');
  } catch (e) {
    msg('msg-pago', 'Error de conexion', 'err');
  }
}

// Carga inicial
cargarPagosClientes();
