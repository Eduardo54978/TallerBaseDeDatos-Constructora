const API = 'http://localhost:3000/api';

// Nombre completo del cliente (nombre + apellido; las empresas no tienen apellido).
const nomCli = c => `${c.nombre || ''} ${c.apellido || ''}`.trim();

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
    cargarClientes();
  }

  if (name === 'tipos') {
    cargarTipos();
  }

  if (name === 'registrar') {
    cargarSelectTipos();
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
  return `<span class="badge badge-blue">${texto || ''}</span>`;
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

let _dataClientes = [];
async function cargarClientes() {
  try {
    const data = await fetch(`${API}/clientes`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idCliente');
    _dataClientes = ordenados;

    const tipos = new Set(ordenados.map(c => c.nombreTipoCliente).filter(Boolean));
    const conEmail = ordenados.filter(c => c.email).length;
    renderStatsCards('cli-stats', [
      { n: ordenados.length, l: 'Clientes' },
      { n: tipos.size, l: 'Tipos de cliente' },
      { n: conEmail, l: 'Con email' },
    ]);

    document.getElementById('cont-clientes').innerHTML = `
      <table id="tbl-cli">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Documento</th>
            <th>Celular</th>
            <th>Email</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(c => `<tr>
            <td>${c.idCliente}</td>
            <td><b>${nomCli(c)}</b></td>
            <td>${badge(c.nombreTipoCliente)}</td>
            <td>${c.documentoID || '-'}</td>
            <td>${c.numCelular || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${c.fechaRegistro ? c.fechaRegistro.substring(0, 10) : '-'}</td>
            <td><button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarCliente(${c.idCliente})">Eliminar</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-clientes').innerHTML = '<p style="color:red">Error al cargar clientes</p>';
  }
}

async function cargarTipos() {
  try {
    const data = await fetch(`${API}/clientes/tipos/lista`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idTipoCliente');

    document.getElementById('cont-tipos').innerHTML = `
      <table id="tbl-tipos">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(t => `<tr>
            <td>${t.idTipoCliente}</td>
            <td><b>${t.nombreTipoCliente}</b></td>
            <td>${t.descripcionTipoCliente || '-'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-tipos').innerHTML = '<p style="color:red">Error al cargar tipos de cliente</p>';
  }
}

async function cargarSelectTipos() {
  try {
    const data = await fetch(`${API}/clientes/tipos/lista`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idTipoCliente');
    const sel = document.getElementById('cli-tipo');

    if (!sel) return;

    sel.innerHTML = '<option value="">-- Seleccionar --</option>' +
      ordenados.map(t => `<option value="${t.idTipoCliente}">${t.nombreTipoCliente}</option>`).join('');
  } catch (e) {}
}

async function registrarCliente() {
  const body = {
    nombre: document.getElementById('cli-nombre').value.trim(),
    apellido: document.getElementById('cli-apellido').value.trim(),
    documentoID: document.getElementById('cli-doc').value.trim(),
    idTipoCliente: parseInt(document.getElementById('cli-tipo').value),
    numCelular: document.getElementById('cli-cel').value.trim(),
    email: document.getElementById('cli-email').value.trim(),
    fechaRegistro: document.getElementById('cli-fecha').value,
    direccion: document.getElementById('cli-dir').value.trim()
  };

  if (!body.nombre || !body.documentoID || !body.idTipoCliente) {
    return msg('msg-cliente', 'Nombre, documento y tipo son obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-cliente', 'Error: ' + data.error, 'err');
    }

    msg('msg-cliente', 'Cliente registrado con ID: ' + data.idCliente, 'ok');

    ['cli-nombre', 'cli-apellido', 'cli-doc', 'cli-cel', 'cli-email', 'cli-fecha', 'cli-dir'].forEach(id => {
      document.getElementById(id).value = '';
    });

    document.getElementById('cli-tipo').value = '';

    cargarClientes();
  } catch (e) {
    msg('msg-cliente', 'Error de conexión', 'err');
  }
}

async function registrarTipo() {
  const body = {
    nombreTipoCliente: document.getElementById('tipo-nombre').value.trim(),
    descripcionTipoCliente: document.getElementById('tipo-desc').value.trim()
  };

  if (!body.nombreTipoCliente) {
    return msg('msg-tipo', 'El nombre es obligatorio', 'err');
  }

  try {
    const res = await fetch(`${API}/clientes/tipos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-tipo', 'Error: ' + data.error, 'err');
    }

    msg('msg-tipo', 'Tipo registrado con ID: ' + data.idTipoCliente, 'ok');

    document.getElementById('tipo-nombre').value = '';
    document.getElementById('tipo-desc').value = '';

    cargarTipos();
    cargarSelectTipos();
  } catch (e) {
    msg('msg-tipo', 'Error de conexión', 'err');
  }
}

async function cargarFormEditarCliente(idCliente) {
  try {
    const data = await fetch(`${API}/clientes/${idCliente}`).then(r => r.json());
    document.getElementById('ec-nombre').value = data.nombre || '';
    document.getElementById('ec-apellido').value = data.apellido || '';
    document.getElementById('ec-doc').value = data.documentoID || '';
    document.getElementById('ec-cel').value = data.numCelular || '';
    document.getElementById('ec-email').value = data.email || '';
    document.getElementById('ec-dir').value = data.direccion || '';
    await cargarSelectTiposEditar(data.idTipoCliente);
    document.getElementById('form-editar-cliente').style.display = 'block';
  } catch (e) {
    alert('Error al cargar datos del cliente');
  }
}

async function cargarSelectTiposEditar(idSeleccionado) {
  const data = await fetch(`${API}/clientes/tipos/lista`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById('ec-tipo');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Seleccionar --</option>' +
    data.map(t => `<option value="${t.idTipoCliente}" ${t.idTipoCliente === idSeleccionado ? 'selected' : ''}>${t.nombreTipoCliente}</option>`).join('');
}

async function guardarEdicionCliente() {
  const id = document.getElementById('ec-idcliente').value;
  if (!id) return msg('msg-editar-cli', 'Seleccione un cliente de la lista.', 'err');
  const body = {
    nombre: document.getElementById('ec-nombre').value.trim(),
    apellido: document.getElementById('ec-apellido').value.trim(),
    documentoID: document.getElementById('ec-doc').value.trim(),
    idTipoCliente: parseInt(document.getElementById('ec-tipo').value) || null,
    numCelular: document.getElementById('ec-cel').value.trim(),
    email: document.getElementById('ec-email').value.trim(),
    direccion: document.getElementById('ec-dir').value.trim()
  };
  if (!body.nombre) return msg('msg-editar-cli', 'El nombre es obligatorio.', 'err');
  try {
    const res = await fetch(`${API}/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-editar-cli', 'Error: ' + data.error, 'err');
    msg('msg-editar-cli', 'Cliente actualizado correctamente', 'ok');
    cargarClientes();
  } catch (e) {
    msg('msg-editar-cli', 'Error de conexión', 'err');
  }
}

async function eliminarCliente(id) {
  if (!confirm(`¿Eliminar el cliente ID ${id}? Esta acción no se puede deshacer.`)) return;
  try {
    const res = await fetch(`${API}/clientes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return alert('Error: ' + data.error);
    cargarClientes();
  } catch (e) {
    alert('Error de conexión');
  }
}

cargarClientes();
// Imprime el listado de clientes.
function imprimirClientes() {
  if (!_dataClientes.length) return alert('No hay clientes para imprimir.');
  const win = nuevaVentanaPDF();
  const f = v => v ? String(v).substring(0, 10) : '-';
  const filas = _dataClientes.map(c => [
    nomCli(c), c.nombreTipoCliente || '-', c.documentoID || '-',
    c.numCelular || '-', c.email || '-', f(c.fechaRegistro),
  ]);
  const cuerpo = pdfTabla('Clientes', ['Nombre', 'Tipo', 'Documento', 'Celular', 'Email', 'Registro'], filas) +
    `<div class="total">Total: ${_dataClientes.length} clientes</div>`;
  imprimirReporte(win, 'Reporte de Clientes', '', [cuerpo]);
}
