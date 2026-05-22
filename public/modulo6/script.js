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
    cargarProveedores();
  }
}

function filtrarTabla(id, texto) {
  const t = document.getElementById(id);

  if (!t) return;

  t.querySelectorAll('tbody tr').forEach(r => {
    r.style.display = r.innerText.toLowerCase().includes(texto.toLowerCase()) ? '' : 'none';
  });
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

async function cargarProveedores() {
  try {
    const data = await fetch(`${API}/proveedores`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idProveedor');

    document.getElementById('cont-proveedores').innerHTML = `
      <table id="tbl-prov">
        <thead>
          <tr>
            <th>ID</th>
            <th>Proveedor</th>
            <th>Celular</th>
            <th>Email</th>
            <th>Ubicación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(p => `<tr>
            <td>${p.idProveedor}</td>
            <td><b>${p.nombreProveedor}</b></td>
            <td>${p.numCelular || '-'}</td>
            <td>${p.email || '-'}</td>
            <td>${p.ciudad ? p.ciudad + ', ' + (p.pais || '') : (p.pais || '-')}</td>
            <td>
              <button class="btn btn-red" style="padding: 5px 10px; font-size: 0.75rem;" onclick="eliminarProveedor(${p.idProveedor})">Desactivar</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-proveedores').innerHTML = '<p style="color:red">Error al cargar proveedores</p>';
  }
}

async function registrarProveedor() {
  const body = {
    nombreProveedor: document.getElementById('p-nombre').value.trim(),
    numCelular: document.getElementById('p-cel').value.trim(),
    email: document.getElementById('p-email').value.trim(),
    ciudad: document.getElementById('p-ciudad').value.trim(),
    pais: document.getElementById('p-pais').value.trim(),
    direccion: document.getElementById('p-dir').value.trim()
  };

  if (!body.nombreProveedor) {
    return msg('msg-prov', 'El nombre del proveedor es obligatorio', 'err');
  }

  try {
    const res = await fetch(`${API}/proveedores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-prov', 'Error: ' + data.error, 'err');
    }

    msg('msg-prov', `Proveedor registrado exitosamente con ID: ${data.idProveedor}`, 'ok');

    document.querySelectorAll('#tab-registrar input').forEach(input => {
      input.value = '';
    });

    cargarProveedores();
  } catch (e) {
    msg('msg-prov', 'Error de conexión', 'err');
  }
}

async function eliminarProveedor(id) {
  if (!confirm(`¿Está seguro de desactivar/eliminar el proveedor ID ${id}?`)) return;

  try {
    const res = await fetch(`${API}/proveedores/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) {
      return msg('msg-lista', 'Error: ' + data.error, 'err');
    }

    msg('msg-lista', 'Proveedor desactivado correctamente', 'ok');
    cargarProveedores();
  } catch (e) {
    msg('msg-lista', 'Error de conexión', 'err');
  }
}

async function asignarMaterial() {
  const body = {
    idProveedor: parseInt(document.getElementById('pm-idprov').value),
    idMaterial: parseInt(document.getElementById('pm-idmat').value),
    precioProveedor: parseFloat(document.getElementById('pm-precio').value),
    tiempoEntrega: parseInt(document.getElementById('pm-tiempo').value) || null
  };

  if (!body.idProveedor || !body.idMaterial || isNaN(body.precioProveedor)) {
    return msg('msg-pm', 'Proveedor, material y precio son obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/proveedormaterial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-pm', 'Error: ' + data.error, 'err');
    }

    msg('msg-pm', 'Material asignado exitosamente al catálogo', 'ok');

    document.getElementById('pm-idmat').value = '';
    document.getElementById('pm-precio').value = '';
    document.getElementById('pm-tiempo').value = '';
  } catch (e) {
    msg('msg-pm', 'Error de conexión', 'err');
  }
}

async function consultarMateriales() {
  const idProv = document.getElementById('con-idprov').value;

  if (!idProv) return;

  try {
    const data = await fetch(`${API}/proveedores/${idProv}/materiales`).then(r => r.json());

    if (data.error) {
      document.getElementById('cont-catalogo').innerHTML = `<p style="color:red">${data.error}</p>`;
      return;
    }

    if (data.length === 0) {
      document.getElementById('cont-catalogo').innerHTML = '<p>El proveedor no tiene materiales en su catálogo.</p>';
      return;
    }

    const ordenados = ordenarPorNumero(data, 'idProveedorMaterial');

    document.getElementById('cont-catalogo').innerHTML = `
      <table id="tbl-catalogo">
        <thead>
          <tr>
            <th>ID Catálogo</th>
            <th>Material</th>
            <th>Precio (Bs)</th>
            <th>Tiempo entrega</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(m => `<tr>
            <td>${m.idProveedorMaterial}</td>
            <td><b>${m.nombreMaterial}</b></td>
            <td>${m.precioProveedor}</td>
            <td>${m.tiempoEntrega ? m.tiempoEntrega + ' días' : '-'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-catalogo').innerHTML = '<p style="color:red">Error de conexión</p>';
  }
}

cargarProveedores();
