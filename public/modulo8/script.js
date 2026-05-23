const API = 'http://localhost:3000/api';

function ordenarPorNumero(datos, campo) {
  return [...(datos || [])].sort((a, b) => Number(a[campo] || 0) - Number(b[campo] || 0));
}

function ordenarHoras(datos) {
  return [...(datos || [])].sort((a, b) => {
    const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
    const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
    return fechaA - fechaB;
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

  if (name === 'lista') {
    cargarEmpleados();
  }

  if (name === 'registrar') {
    cargarSelectCargos();
    cargarSelectDeptos();
    cargarSelectEstados();
  }

  if (name === 'maestras') {
    cargarCargos();
    cargarDeptos();
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

  if (t.includes('inactivo')) {
    return `<span class="badge badge-red">${texto}</span>`;
  }

  if (t.includes('activo')) {
    return `<span class="badge badge-green">${texto}</span>`;
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

const tablaBonos = [
  { min: 2, max: 4, pct: 5 },
  { min: 5, max: 7, pct: 11 },
  { min: 8, max: 10, pct: 18 },
  { min: 11, max: 14, pct: 26 },
  { min: 15, max: 19, pct: 34 },
  { min: 20, max: 24, pct: 42 },
  { min: 25, max: 999, pct: 50 }
];

function sugerirPorcentaje() {
  const anios = parseInt(document.getElementById('b-anios').value);
  const fila = tablaBonos.find(b => anios >= b.min && anios <= b.max);

  if (fila) {
    document.getElementById('b-pct').value = fila.pct;
    calcularMonto();
  }
}

function calcularMonto() {
  const salario = parseFloat(document.getElementById('b-salario').value) || 0;
  const pct = parseFloat(document.getElementById('b-pct').value) || 0;
  const monto = (salario * pct) / 100;
  const prev = document.getElementById('b-preview');

  if (salario && pct && prev) {
    prev.style.display = 'block';
    prev.innerHTML = `<p>Monto calculado: <b>Bs ${monto.toFixed(2)}</b></p>
                      <p>Salario base Bs ${salario.toFixed(2)} x ${pct}%</p>`;
  }
}

document.addEventListener('input', () => {
  const h = parseFloat(document.getElementById('h-horas')?.value) || 0;
  const p = parseFloat(document.getElementById('h-pago')?.value) || 0;
  const prev = document.getElementById('h-preview');

  if (prev && h && p) {
    prev.textContent = `Total: Bs ${(h * p).toFixed(2)}`;
  }
});

async function cargarEmpleados() {
  try {
    const data = await fetch(`${API}/empleados`).then(r => r.json());
    const ordenados = ordenarPorNumero(data, 'idEmpleado');

    document.getElementById('cont-empleados').innerHTML = `
      <table id="tbl-emp">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Cargo</th>
            <th>Departamento</th>
            <th>Salario</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(e => `<tr>
            <td>${e.idEmpleado}</td>
            <td>${e.nombre}</td>
            <td>${e.apellido}</td>
            <td>${e.nombreCargo || '-'}</td>
            <td>${e.nombreDepartamento || '-'}</td>
            <td>Bs ${Number(e.salario || 0).toLocaleString()}</td>
            <td>${badge(e.nombreEstadoEmpleado)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-empleados').innerHTML = '<p style="color:red">Error al cargar empleados</p>';
  }
}

async function cargarSelectCargos() {
  const data = await fetch(`${API}/empleados/cargos/lista`).then(r => r.json()).catch(() => []);
  const ordenados = ordenarPorNumero(data, 'idCargo');
  const select = document.getElementById('emp-cargo');

  if (!select) return;

  select.innerHTML =
    '<option value="">-- Cargo --</option>' +
    ordenados.map(c => `<option value="${c.idCargo}">${c.nombreCargo}</option>`).join('');
}

async function cargarSelectDeptos() {
  const data = await fetch(`${API}/empleados/departamentos/lista`).then(r => r.json()).catch(() => []);
  const ordenados = ordenarPorNumero(data, 'idDepartamento');
  const select = document.getElementById('emp-depto');

  if (!select) return;

  select.innerHTML =
    '<option value="">-- Departamento --</option>' +
    ordenados.map(d => `<option value="${d.idDepartamento}">${d.nombreDepartamento}</option>`).join('');
}

function cargarSelectEstados() {
  const select = document.getElementById('emp-estado');

  if (!select) return;

  select.innerHTML = `
    <option value="">-- Estado --</option>
    <option value="1">Activo</option>
    <option value="2">Inactivo</option>`;
}

async function registrarEmpleado() {
  const body = {
    nombre: document.getElementById('emp-nombre').value.trim(),
    apellido: document.getElementById('emp-apellido').value.trim(),
    ci: document.getElementById('emp-ci').value.trim(),
    email: document.getElementById('emp-email').value.trim(),
    numCelular: document.getElementById('emp-cel').value.trim(),
    salario: parseFloat(document.getElementById('emp-salario').value) || null,
    fechaContratacion: document.getElementById('emp-contrat').value || null,
    fechaNacimiento: document.getElementById('emp-nacim').value || null,
    idCargo: parseInt(document.getElementById('emp-cargo').value),
    idDepartamento: parseInt(document.getElementById('emp-depto').value),
    idEstadoEmpleado: parseInt(document.getElementById('emp-estado').value),
    especialidad: document.getElementById('emp-esp').value.trim(),
    direccion: document.getElementById('emp-dir').value.trim()
  };

  if (!body.nombre || !body.apellido || !body.idCargo || !body.idDepartamento || !body.idEstadoEmpleado) {
    return msg('msg-emp', 'Nombre, apellido, cargo, departamento y estado son obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/empleados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-emp', 'Error: ' + data.error, 'err');
    }

    msg('msg-emp', 'Empleado registrado con ID: ' + data.idEmpleado, 'ok');

    document.querySelectorAll('#tab-registrar input').forEach(input => {
      input.value = '';
    });

    const cargo = document.getElementById('emp-cargo');
    const depto = document.getElementById('emp-depto');
    const estado = document.getElementById('emp-estado');

    if (cargo) cargo.value = '';
    if (depto) depto.value = '';
    if (estado) estado.value = '';

    cargarEmpleados();
  } catch (e) {
    msg('msg-emp', 'Error de conexión', 'err');
  }
}

async function registrarHoras() {
  const body = {
    idEmpleado: parseInt(document.getElementById('h-empleado').value),
    idProyecto: parseInt(document.getElementById('h-proyecto').value),
    fecha: document.getElementById('h-fecha').value,
    horasTrabajadas: parseFloat(document.getElementById('h-horas').value),
    pagoPorHora: parseFloat(document.getElementById('h-pago').value)
  };

  if (!body.idEmpleado || !body.idProyecto || !body.fecha || !body.horasTrabajadas || !body.pagoPorHora) {
    return msg('msg-horas', 'Todos los campos son obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/empleados/horas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-horas', 'Error: ' + data.error, 'err');
    }

    msg('msg-horas', `Horas registradas. Total: Bs ${data.totalPago}`, 'ok');

    ['h-empleado', 'h-proyecto', 'h-fecha', 'h-horas', 'h-pago'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });

    const prev = document.getElementById('h-preview');
    if (prev) prev.textContent = '';
  } catch (e) {
    msg('msg-horas', 'Error de conexión', 'err');
  }
}

async function consultarHoras() {
  const id = document.getElementById('ch-id').value;

  if (!id) return;

  try {
    const data = await fetch(`${API}/empleados/${id}/horas`).then(r => r.json());

    if (data.error) {
      document.getElementById('resumen-horas').innerHTML = `<p style="color:red">${data.error}</p>`;
      document.getElementById('cont-horas-emp').innerHTML = '';
      return;
    }

    const registros = Array.isArray(data)
      ? data
      : data.registros || data.horas || data.registrosHoras || data.detalle || [];

    const ordenados = ordenarHoras(registros);

    const totalHoras = data.totalHoras !== undefined
      ? Number(data.totalHoras)
      : ordenados.reduce((suma, h) => suma + Number(h.horasTrabajadas || h.horas || 0), 0);

    const totalGanado = data.totalGanado !== undefined
      ? Number(data.totalGanado)
      : ordenados.reduce((suma, h) => {
          const horas = Number(h.horasTrabajadas || h.horas || 0);
          const pago = Number(h.pagoPorHora || h.precioHora || 0);
          const total = h.totalPago !== undefined ? Number(h.totalPago) : horas * pago;
          return suma + total;
        }, 0);

    document.getElementById('resumen-horas').innerHTML = `
      <div class="resumen-box">
        <p>Total horas: <b>${totalHoras}</b></p>
        <p>Total ganado: <b>Bs ${totalGanado.toFixed(2)}</b></p>
      </div>`;

    if (ordenados.length === 0) {
      document.getElementById('cont-horas-emp').innerHTML = '<p>No se encontraron horas registradas para este empleado.</p>';
      return;
    }

    document.getElementById('cont-horas-emp').innerHTML = `
      <table id="tbl-horas-emp">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Proyecto</th>
            <th>Horas</th>
            <th>Bs/Hora</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(h => {
            const horas = Number(h.horasTrabajadas || h.horas || 0);
            const pago = Number(h.pagoPorHora || h.precioHora || 0);
            const total = h.totalPago !== undefined ? Number(h.totalPago) : horas * pago;

            return `<tr>
              <td>${h.fecha ? h.fecha.substring(0, 10) : '-'}</td>
              <td>${h.nombreProyecto || h.proyecto || '-'}</td>
              <td>${horas}</td>
              <td>Bs ${pago.toFixed(2)}</td>
              <td>Bs ${total.toFixed(2)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('resumen-horas').innerHTML = '<p style="color:red">Error o empleado no encontrado</p>';
    document.getElementById('cont-horas-emp').innerHTML = '';
  }
}

async function registrarBonificacion() {
  const body = {
    idEmpleado: parseInt(document.getElementById('b-emp').value),
    tipoBonificacion: document.getElementById('b-tipo').value.trim(),
    aniosAntiguedad: parseInt(document.getElementById('b-anios').value),
    porcentajeBono: parseFloat(document.getElementById('b-pct').value),
    salarioBase: parseFloat(document.getElementById('b-salario').value),
    gestion: parseInt(document.getElementById('b-gestion').value),
    descripcion: document.getElementById('b-desc').value.trim()
  };

  if (!body.idEmpleado || !body.tipoBonificacion || !body.salarioBase || !body.gestion) {
    return msg('msg-bono', 'Completa todos los campos obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/empleados/bonificaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-bono', 'Error: ' + data.error, 'err');
    }

    msg('msg-bono', `Bonificación registrada. Monto: Bs ${data.montoCalculado}`, 'ok');

    ['b-emp', 'b-tipo', 'b-anios', 'b-pct', 'b-salario', 'b-gestion', 'b-desc'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });

    const prev = document.getElementById('b-preview');
    if (prev) {
      prev.style.display = 'none';
      prev.innerHTML = '';
    }
  } catch (e) {
    msg('msg-bono', 'Error de conexión', 'err');
  }
}

async function cargarCargos() {
  const data = await fetch(`${API}/empleados/cargos/lista`).then(r => r.json()).catch(() => []);
  const ordenados = ordenarPorNumero(data, 'idCargo');

  document.getElementById('cont-cargos').innerHTML = `
    <table id="tbl-cargos">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cargo</th>
          <th>Descripción</th>
        </tr>
      </thead>
      <tbody>
        ${ordenados.map(c => `<tr>
          <td>${c.idCargo}</td>
          <td>${c.nombreCargo}</td>
          <td>${c.descripcionCargo || '-'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

async function cargarDeptos() {
  const data = await fetch(`${API}/empleados/departamentos/lista`).then(r => r.json()).catch(() => []);
  const ordenados = ordenarPorNumero(data, 'idDepartamento');

  document.getElementById('cont-deptos').innerHTML = `
    <table id="tbl-deptos">
      <thead>
        <tr>
          <th>ID</th>
          <th>Departamento</th>
          <th>Descripción</th>
        </tr>
      </thead>
      <tbody>
        ${ordenados.map(d => `<tr>
          <td>${d.idDepartamento}</td>
          <td>${d.nombreDepartamento}</td>
          <td>${d.descripcionDepartamento || '-'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

async function registrarCargo() {
  const body = {
    nombreCargo: document.getElementById('c-nombre').value.trim(),
    descripcionCargo: document.getElementById('c-desc').value.trim()
  };

  if (!body.nombreCargo) {
    return msg('msg-cargo', 'Nombre obligatorio', 'err');
  }

  const res = await fetch(`${API}/empleados/cargos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    return msg('msg-cargo', 'Error: ' + data.error, 'err');
  }

  msg('msg-cargo', 'Cargo registrado', 'ok');

  document.getElementById('c-nombre').value = '';
  document.getElementById('c-desc').value = '';

  cargarCargos();
  cargarSelectCargos();
}

async function registrarDepto() {
  const body = {
    nombreDepartamento: document.getElementById('d-nombre').value.trim(),
    descripcionDepartamento: document.getElementById('d-desc').value.trim()
  };

  if (!body.nombreDepartamento) {
    return msg('msg-depto', 'Nombre obligatorio', 'err');
  }

  const res = await fetch(`${API}/empleados/departamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    return msg('msg-depto', 'Error: ' + data.error, 'err');
  }

  msg('msg-depto', 'Departamento registrado', 'ok');

  document.getElementById('d-nombre').value = '';
  document.getElementById('d-desc').value = '';

  cargarDeptos();
  cargarSelectDeptos();
}

cargarEmpleados();