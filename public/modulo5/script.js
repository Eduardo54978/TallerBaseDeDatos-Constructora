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
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-contratos').innerHTML = '<p style="color:red">Error al cargar contratos</p>';
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
    fechaVencimiento: document.getElementById('c-fechav').value || null
  };

  if (!body.numeroContrato || !body.montoTotal || !body.idProyecto || !body.fechaContrato) {
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

  if (!idContrato || !body.numeroCuotas) {
    return msg('msg-cuotas', 'Ingrese ID Contrato y número de cuotas', 'err');
  }

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
  } catch (e) {
    msg('msg-cuotas', 'Error de conexión', 'err');
  }
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

cargarContratos();