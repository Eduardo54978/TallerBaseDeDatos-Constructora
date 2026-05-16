const API = 'http://localhost:3000/api';

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  if (name === 'lista')     cargarEmpleados();
  if (name === 'registrar') { cargarSelectCargos(); cargarSelectDeptos(); cargarSelectEstados(); }
  if (name === 'maestras')  { cargarCargos(); cargarDeptos(); }
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
  if (t.includes('activo'))   return `<span class="badge badge-green">${texto}</span>`;
  if (t.includes('inactivo')) return `<span class="badge badge-red">${texto}</span>`;
  return `<span class="badge badge-blue">${texto}</span>`;
}

function msg(id, texto, tipo) {
  const el = document.getElementById(id);
  el.className = 'msg ' + tipo;
  el.textContent = texto;
  setTimeout(() => el.className = 'msg', 4000);
}

const tablaBonos = [
  { min: 2,  max: 4,   pct: 5  },
  { min: 5,  max: 7,   pct: 11 },
  { min: 8,  max: 10,  pct: 18 },
  { min: 11, max: 14,  pct: 26 },
  { min: 15, max: 19,  pct: 34 },
  { min: 20, max: 24,  pct: 42 },
  { min: 25, max: 999, pct: 50 },
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
  const pct     = parseFloat(document.getElementById('b-pct').value)     || 0;
  const monto   = (salario * pct) / 100;
  const prev    = document.getElementById('b-preview');
  if (salario && pct) {
    prev.style.display = 'block';
    prev.innerHTML = `<p>Monto calculado: <b>Bs ${monto.toFixed(2)}</b></p>
                      <p>Salario base Bs ${salario.toFixed(2)} x ${pct}%</p>`;
  }
}

document.addEventListener('input', () => {
  const h    = parseFloat(document.getElementById('h-horas')?.value) || 0;
  const p    = parseFloat(document.getElementById('h-pago')?.value)  || 0;
  const prev = document.getElementById('h-preview');
  if (prev && h && p) prev.textContent = `Total: Bs ${(h * p).toFixed(2)}`;
});

async function cargarEmpleados() {
  try {
    const data = await fetch(`${API}/empleados`).then(r => r.json());
    document.getElementById('cont-empleados').innerHTML = `
      <table id="tbl-emp">
        <thead>
          <tr>
            <th>#</th><th>Nombre</th><th>Apellido</th><th>Cargo</th>
            <th>Departamento</th><th>Salario</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(e => `<tr>
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
    document.getElementById('cont-empleados').innerHTML = '<p style="color:red">Error al cargar</p>';
  }
}

async function cargarSelectCargos() {
  const data = await fetch(`${API}/empleados/cargos/lista`).then(r => r.json()).catch(() => []);
  document.getElementById('emp-cargo').innerHTML =
    '<option value="">-- Cargo --</option>' +
    data.map(c => `<option value="${c.idCargo}">${c.nombreCargo}</option>`).join('');
}

async function cargarSelectDeptos() {
  const data = await fetch(`${API}/empleados/departamentos/lista`).then(r => r.json()).catch(() => []);
  document.getElementById('emp-depto').innerHTML =
    '<option value="">-- Departamento --</option>' +
    data.map(d => `<option value="${d.idDepartamento}">${d.nombreDepartamento}</option>`).join('');
}

function cargarSelectEstados() {
  document.getElementById('emp-estado').innerHTML = `
    <option value="">-- Estado --</option>
    <option value="1">Activo</option>
    <option value="2">Inactivo</option>`;
}

async function registrarEmpleado() {
  const body = {
    nombre:           document.getElementById('emp-nombre').value.trim(),
    apellido:         document.getElementById('emp-apellido').value.trim(),
    ci:               document.getElementById('emp-ci').value.trim(),
    email:            document.getElementById('emp-email').value.trim(),
    numCelular:       document.getElementById('emp-cel').value.trim(),
    salario:          parseFloat(document.getElementById('emp-salario').value) || null,
    fechaContratacion: document.getElementById('emp-contrat').value || null,
    fechaNacimiento:  document.getElementById('emp-nacim').value || null,
    idCargo:          parseInt(document.getElementById('emp-cargo').value),
    idDepartamento:   parseInt(document.getElementById('emp-depto').value),
    idEstadoEmpleado: parseInt(document.getElementById('emp-estado').value),
    especialidad:     document.getElementById('emp-esp').value.trim(),
    direccion:        document.getElementById('emp-dir').value.trim(),
  };
  if (!body.nombre || !body.apellido || !body.idCargo || !body.idDepartamento || !body.idEstadoEmpleado)
    return msg('msg-emp', 'Nombre, apellido, cargo, departamento y estado son obligatorios', 'err');
  try {
    const res = await fetch(`${API}/empleados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-emp', 'Error: ' + data.error, 'err');
    msg('msg-emp', 'Empleado registrado con ID: ' + data.idEmpleado, 'ok');
  } catch (e) {
    msg('msg-emp', 'Error de conexion', 'err');
  }
}

async function registrarHoras() {
  const body = {
    idEmpleado:      parseInt(document.getElementById('h-empleado').value),
    idProyecto:      parseInt(document.getElementById('h-proyecto').value),
    fecha:           document.getElementById('h-fecha').value,
    horasTrabajadas: parseFloat(document.getElementById('h-horas').value),
    pagoPorHora:     parseFloat(document.getElementById('h-pago').value),
  };
  if (!body.idEmpleado || !body.idProyecto || !body.fecha || !body.horasTrabajadas || !body.pagoPorHora)
    return msg('msg-horas', 'Todos los campos son obligatorios', 'err');
  try {
    const res = await fetch(`${API}/empleados/horas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-horas', 'Error: ' + data.error, 'err');
    msg('msg-horas', `Horas registradas. Total: Bs ${data.totalPago}`, 'ok');
  } catch (e) {
    msg('msg-horas', 'Error de conexion', 'err');
  }
}

async function consultarHoras() {
  const id = document.getElementById('ch-id').value;
  if (!id) return;
  try {
    const data = await fetch(`${API}/empleados/${id}/horas`).then(r => r.json());
    document.getElementById('resumen-horas').innerHTML = `
      <div class="resumen-box">
        <p>Total horas: <b>${data.totalHoras}</b></p>
        <p>Total ganado: <b>Bs ${Number(data.totalGanado).toFixed(2)}</b></p>
      </div>`;
    document.getElementById('cont-horas-emp').innerHTML = `
      <table>
        <thead>
          <tr><th>Fecha</th><th>Proyecto</th><th>Horas</th><th>Bs/Hora</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${data.registros.map(h => `<tr>
            <td>${h.fecha ? h.fecha.substring(0, 10) : ''}</td>
            <td>${h.nombreProyecto || ''}</td>
            <td>${h.horasTrabajadas}</td>
            <td>Bs ${Number(h.pagoPorHora).toFixed(2)}</td>
            <td>Bs ${Number(h.totalPago).toFixed(2)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('resumen-horas').innerHTML = '<p style="color:red">Error o empleado no encontrado</p>';
  }
}

async function registrarBonificacion() {
  const body = {
    idEmpleado:       parseInt(document.getElementById('b-emp').value),
    tipoBonificacion: document.getElementById('b-tipo').value.trim(),
    aniosAntiguedad:  parseInt(document.getElementById('b-anios').value),
    porcentajeBono:   parseFloat(document.getElementById('b-pct').value),
    salarioBase:      parseFloat(document.getElementById('b-salario').value),
    gestion:          parseInt(document.getElementById('b-gestion').value),
    descripcion:      document.getElementById('b-desc').value.trim(),
  };
  if (!body.idEmpleado || !body.tipoBonificacion || !body.salarioBase || !body.gestion)
    return msg('msg-bono', 'Completa todos los campos obligatorios', 'err');
  try {
    const res = await fetch(`${API}/empleados/bonificaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-bono', 'Error: ' + data.error, 'err');
    msg('msg-bono', `Bonificacion registrada. Monto: Bs ${data.montoCalculado}`, 'ok');
  } catch (e) {
    msg('msg-bono', 'Error de conexion', 'err');
  }
}

async function cargarCargos() {
  const data = await fetch(`${API}/empleados/cargos/lista`).then(r => r.json()).catch(() => []);
  document.getElementById('cont-cargos').innerHTML = `
    <table>
      <thead><tr><th>#</th><th>Cargo</th><th>Descripcion</th></tr></thead>
      <tbody>
        ${data.map(c => `<tr>
          <td>${c.idCargo}</td>
          <td>${c.nombreCargo}</td>
          <td>${c.descripcionCargo || '-'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

async function cargarDeptos() {
  const data = await fetch(`${API}/empleados/departamentos/lista`).then(r => r.json()).catch(() => []);
  document.getElementById('cont-deptos').innerHTML = `
    <table>
      <thead><tr><th>#</th><th>Departamento</th><th>Descripcion</th></tr></thead>
      <tbody>
        ${data.map(d => `<tr>
          <td>${d.idDepartamento}</td>
          <td>${d.nombreDepartamento}</td>
          <td>${d.descripcionDepartamento || '-'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

async function registrarCargo() {
  const body = {
    nombreCargo:      document.getElementById('c-nombre').value.trim(),
    descripcionCargo: document.getElementById('c-desc').value.trim(),
  };
  if (!body.nombreCargo) return msg('msg-cargo', 'Nombre obligatorio', 'err');
  const res = await fetch(`${API}/empleados/cargos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return msg('msg-cargo', 'Error: ' + data.error, 'err');
  msg('msg-cargo', 'Cargo registrado', 'ok');
  document.getElementById('c-nombre').value = '';
  document.getElementById('c-desc').value = '';
  cargarCargos();
}

async function registrarDepto() {
  const body = {
    nombreDepartamento:      document.getElementById('d-nombre').value.trim(),
    descripcionDepartamento: document.getElementById('d-desc').value.trim(),
  };
  if (!body.nombreDepartamento) return msg('msg-depto', 'Nombre obligatorio', 'err');
  const res = await fetch(`${API}/empleados/departamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return msg('msg-depto', 'Error: ' + data.error, 'err');
  msg('msg-depto', 'Departamento registrado', 'ok');
  document.getElementById('d-nombre').value = '';
  document.getElementById('d-desc').value = '';
  cargarDeptos();
}

// Carga inicial
cargarEmpleados();