const API = 'http://localhost:3000/api';

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  if (name === 'ordenes') cargarOrdenes();
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
  if (t.includes('completado') || t.includes('aprobado')) return `<span class="badge badge-green">${texto}</span>`;
  if (t.includes('cancelado') || t.includes('rechazado')) return `<span class="badge badge-red">${texto}</span>`;
  if (t.includes('pendiente'))                             return `<span class="badge badge-yellow">${texto}</span>`;
  return `<span class="badge badge-blue">${texto}</span>`;
}

function msg(id, texto, tipo) {
  const el = document.getElementById(id);
  el.className = 'msg ' + tipo;
  el.textContent = texto;
  setTimeout(() => el.className = 'msg', 4000);
}

async function cargarOrdenes() {
  try {
    const data = await fetch(`${API}/compras`).then(r => r.json());
    document.getElementById('cont-ordenes').innerHTML = `
      <table id="tbl-ordenes">
        <thead>
          <tr>
            <th>ID Orden</th><th>Fecha Orden</th><th>Proveedor</th>
            <th>Monto Total (Bs)</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(o => `<tr>
            <td>${o.idOrdenCompra}</td>
            <td>${o.fechaOrden ? o.fechaOrden.substring(0, 10) : '-'}</td>
            <td>${o.nombreProveedor || '-'}</td>
            <td>${o.montoTotal}</td>
            <td>${badge(o.estadoOrden)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-ordenes').innerHTML = '<p style="color:red">Error al cargar ordenes de compra</p>';
  }
}

async function crearOrden() {
  const body = {
    fechaOrden:    document.getElementById('no-fecha').value,
    idEstadoOrden: parseInt(document.getElementById('no-idestado').value),
    idProveedor:   parseInt(document.getElementById('no-idproveedor').value),
    montoTotal:    parseFloat(document.getElementById('no-monto').value)
  };

  if (!body.fechaOrden || !body.idEstadoOrden || !body.idProveedor || !body.montoTotal) {
    return msg('msg-orden', 'Llene todos los campos obligatorios (*)', 'err');
  }

  try {
    const res = await fetch(`${API}/compras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-orden', 'Error: ' + data.error, 'err');
    msg('msg-orden', `Orden creada con ID: ${data.idOrdenCompra}`, 'ok');
    document.querySelectorAll('#tab-nueva-orden input').forEach(i => i.value = '');
  } catch (e) {
    msg('msg-orden', 'Error de conexion', 'err');
  }
}

async function buscarDetalle() {
  const idOrden = document.getElementById('do-idorden').value.trim();
  if (!idOrden) return;
  try {
    const data = await fetch(`${API}/compras/${idOrden}/detalle`).then(r => r.json());
    if (data.error) {
      document.getElementById('cont-detalle-orden').innerHTML = `<p style="color:red">${data.error}</p>`;
      return;
    }
    if (data.length === 0) {
      document.getElementById('cont-detalle-orden').innerHTML = '<p>No hay items en esta orden.</p>';
      return;
    }
    document.getElementById('cont-detalle-orden').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID Detalle</th><th>Material</th><th>Cantidad</th>
            <th>Precio Unitario (Bs)</th><th>Total (Bs)</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(d => `<tr>
            <td>${d.idDetalleCompra}</td>
            <td>${d.nombreMaterial || '-'}</td>
            <td>${d.cantidad}</td>
            <td>${d.precioUnitario}</td>
            <td>${d.total}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-detalle-orden').innerHTML = '<p style="color:red">Error de conexion</p>';
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
      document.getElementById('cont-por-proveedor').innerHTML = '<p>No se encontraron ordenes para este proveedor.</p>';
      return;
    }
    document.getElementById('cont-por-proveedor').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID Orden</th><th>Fecha Orden</th><th>Proveedor</th>
            <th>Monto Total (Bs)</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(o => `<tr>
            <td>${o.idOrdenCompra}</td>
            <td>${o.fechaOrden ? o.fechaOrden.substring(0, 10) : '-'}</td>
            <td>${o.nombreProveedor || '-'}</td>
            <td>${o.montoTotal}</td>
            <td>${badge(o.estadoOrden)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-por-proveedor').innerHTML = '<p style="color:red">Error de conexion</p>';
  }
}

// Carga inicial
cargarOrdenes();
