const API = 'http://localhost:3000/api';

function ordenarPorNumero(datos, campo) {
  return [...(datos || [])].sort((a, b) => Number(a[campo] || 0) - Number(b[campo] || 0));
}

document.addEventListener('DOMContentLoaded', () => {
  const fecha = document.getElementById('no-fecha');

  if (fecha) {
    fecha.value = new Date().toISOString().substring(0, 10);
  }
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
  const t = (texto || '').toLowerCase();

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

async function cargarOrdenes() {
  try {
    const data = await fetch(`${API}/compras`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idOrdenCompra');

    document.getElementById('cont-ordenes').innerHTML = `
      <table id="tbl-ordenes">
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
      </table>`;
  } catch (e) {
    document.getElementById('cont-ordenes').innerHTML = '<p style="color:red">Error al cargar órdenes de compra</p>';
  }
}

async function crearOrden() {
  const body = {
    fechaOrden: document.getElementById('no-fecha').value,
    idEstadoOrden: parseInt(document.getElementById('no-idestado').value),
    idProveedor: parseInt(document.getElementById('no-idproveedor').value),
    montoTotal: parseFloat(document.getElementById('no-monto').value)
  };

  if (!body.fechaOrden || !body.idEstadoOrden || !body.idProveedor || Number.isNaN(body.montoTotal)) {
    return msg('msg-orden', 'Llene todos los campos obligatorios (*)', 'err');
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

    msg('msg-orden', `Orden creada con ID: ${data.idOrdenCompra}`, 'ok');

    document.querySelectorAll('#tab-nueva-orden input').forEach(i => {
      i.value = '';
    });

    const fecha = document.getElementById('no-fecha');

    if (fecha) {
      fecha.value = new Date().toISOString().substring(0, 10);
    }

    cargarOrdenes();
  } catch (e) {
    msg('msg-orden', 'Error de conexión', 'err');
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
      document.getElementById('cont-detalle-orden').innerHTML = '<p>No hay ítems en esta orden.</p>';
      return;
    }

    const ordenados = ordenarPorNumero(data, 'idDetalleCompra');

    document.getElementById('cont-detalle-orden').innerHTML = `
      <table id="tbl-detalle-orden">
        <thead>
          <tr>
            <th>ID Detalle</th>
            <th>Material</th>
            <th>Cantidad</th>
            <th>Precio Unitario (Bs)</th>
            <th>Total (Bs)</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(d => `<tr>
            <td>${d.idDetalleCompra}</td>
            <td>${d.nombreMaterial || '-'}</td>
            <td>${d.cantidad}</td>
            <td>${moneda(d.precioUnitario)}</td>
            <td>${moneda(d.total)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-detalle-orden').innerHTML = '<p style="color:red">Error de conexión</p>';
  }
}

async function agregarDetalleOrden() {
  const idOrden = document.getElementById('ad-idorden').value.trim();

  const body = {
    idMaterial: parseInt(document.getElementById('ad-idmaterial').value),
    cantidad: parseFloat(document.getElementById('ad-cantidad').value),
    precioUnitario: parseFloat(document.getElementById('ad-precio').value)
  };

  if (!idOrden || !body.idMaterial || Number.isNaN(body.cantidad) || Number.isNaN(body.precioUnitario)) {
    return msg('msg-agregar-detalle', 'Complete todos los campos.', 'err');
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

    cargarOrdenes();

    const detalleInput = document.getElementById('do-idorden');

    if (detalleInput) {
      detalleInput.value = idOrden;
    }
  } catch (e) {
    msg('msg-agregar-detalle', 'Error de conexión', 'err');
  }
}

async function cancelarOrden() {
  const idOrden = document.getElementById('co-idorden').value.trim();

  if (!idOrden) {
    return msg('msg-cancelar-orden', 'Ingrese el ID de la orden.', 'err');
  }

  if (!confirm(`¿Seguro que quieres cancelar la orden ${idOrden}?`)) {
    return;
  }

  try {
    const res = await fetch(`${API}/compras/${idOrden}/cancelar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-cancelar-orden', 'Error: ' + data.error, 'err');
    }

    msg('msg-cancelar-orden', data.mensaje || 'Orden cancelada correctamente', 'ok');

    document.getElementById('co-idorden').value = '';

    cargarOrdenes();
  } catch (e) {
    msg('msg-cancelar-orden', 'Error de conexión', 'err');
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
      </table>`;
  } catch (e) {
    document.getElementById('cont-por-proveedor').innerHTML = '<p style="color:red">Error de conexión</p>';
  }
}

function moneda(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  return `${Number(valor).toFixed(2)} Bs`;
}

cargarOrdenes();