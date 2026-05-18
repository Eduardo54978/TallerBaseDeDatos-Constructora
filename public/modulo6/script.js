const API = 'http://localhost:3000/api';

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  if (name === 'lista') cargarProveedores();
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
  el.className = 'msg ' + tipo;
  el.textContent = texto;
  setTimeout(() => el.className = 'msg', 4000);
}

async function cargarProveedores() {
  try {
    const data = await fetch(`${API}/proveedores`).then(r => r.json());
    document.getElementById('cont-proveedores').innerHTML = `
      <table id="tbl-prov">
        <thead>
          <tr>
            <th>ID</th><th>Proveedor</th><th>Celular</th><th>Email</th>
            <th>Ubicaci├│n</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(p => `<tr>
            <td>${p.idProveedor}</td>
            <td><b>${p.nombreProveedor}</b></td>
            <td>${p.numCelular || '-'}</td>
            <td>${p.email || '-'}</td>
            <td>${p.ciudad ? p.ciudad+', '+ (p.pais||'') : (p.pais||'-')}</td>
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

  if (!body.nombreProveedor) return msg('msg-prov', 'El Nombre del Proveedor es obligatorio', 'err');

  try {
    const res = await fetch(`${API}/proveedores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-prov', 'Error: ' + data.error, 'err');
    
    msg('msg-prov', `Proveedor registrado exitosamente con ID: ${data.idProveedor}`, 'ok');
    document.querySelectorAll('#tab-registrar input').forEach(input => input.value = '');
  } catch (e) {
    msg('msg-prov', 'Error de conexi├│n', 'err');
  }
}

async function eliminarProveedor(id) {
  if(!confirm(`┬┐Est├í seguro de desactivar/eliminar el proveedor ID ${id}?`)) return;
  try {
    const res = await fetch(`${API}/proveedores/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return msg('msg-lista', 'Error: ' + data.error, 'err');
    
    msg('msg-lista', 'Proveedor desactivado correctamente', 'ok');
    cargarProveedores(); // Recargar tabla
  } catch (e) {
    msg('msg-lista', 'Error de conexi├│n', 'err');
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
    return msg('msg-pm', 'Proveedor, Material y Precio son obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/proveedormaterial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-pm', 'Error: ' + data.error, 'err');
    
    msg('msg-pm', `Material asignado exitosamente al cat├ílogo`, 'ok');
    document.getElementById('pm-idmat').value = '';
    document.getElementById('pm-precio').value = '';
    document.getElementById('pm-tiempo').value = '';
  } catch (e) {
    msg('msg-pm', 'Error de conexi├│n', 'err');
  }
}

async function consultarMateriales() {
  const idProv = document.getElementById('con-idprov').value;
  if (!idProv) return;
  
  try {
    const data = await fetch(`${API}/proveedores/${idProv}/materiales`).then(r => r.json());
    if (data.error) return document.getElementById('cont-catalogo').innerHTML = `<p style="color:red">${data.error}</p>`;
    
    if(data.length === 0) {
      return document.getElementById('cont-catalogo').innerHTML = `<p>El proveedor no tiene materiales en su cat├ílogo.</p>`;
    }

    document.getElementById('cont-catalogo').innerHTML = `
      <table>
        <thead><tr><th>ID Cat├ílogo</th><th>Material</th><th>Precio (Bs)</th><th>Tiempo Entrega</th></tr></thead>
        <tbody>
          ${data.map(m => `<tr>
            <td>${m.idProveedorMaterial}</td>
            <td><b>${m.nombreMaterial}</b></td>
            <td>${m.precioProveedor}</td>
            <td>${m.tiempoEntrega ? m.tiempoEntrega + ' d├¡as' : '-'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    document.getElementById('cont-catalogo').innerHTML = '<p style="color:red">Error de conexi├│n</p>';
  }
}

// Carga Inicial
cargarProveedores();
