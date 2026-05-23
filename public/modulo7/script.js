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

async function cargarClientes() {
  try {
    const data = await fetch(`${API}/clientes`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idCliente');

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
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(c => `<tr>
            <td>${c.idCliente}</td>
            <td><b>${c.nombre}</b></td>
            <td>${badge(c.nombreTipoCliente)}</td>
            <td>${c.documentoID || '-'}</td>
            <td>${c.numCelular || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${c.fechaRegistro ? c.fechaRegistro.substring(0, 10) : '-'}</td>
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

    ['cli-nombre', 'cli-doc', 'cli-cel', 'cli-email', 'cli-fecha', 'cli-dir'].forEach(id => {
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

cargarClientes();