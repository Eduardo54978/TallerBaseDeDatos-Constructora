
const API = '/api';

const PAG_SIZE = 10;

function mostrarCarga(id) {
  const el = document.getElementById(id);

  if (el) {
    el.innerHTML = '<div class="cargando">Cargando datos...</div>';
  }
}

function aplicarPaginacion(tablaId) {
  const tabla = document.getElementById(tablaId);

  if (!tabla) return;

  const filas = Array.from(
    tabla.querySelectorAll('tbody tr')
  );

  if (filas.length <= PAG_SIZE) return;

  let pagina = 1;

  const totalPags = Math.ceil(
    filas.length / PAG_SIZE
  );

  function render() {
    const ini = (pagina - 1) * PAG_SIZE;

    filas.forEach((fila, indice) => {
      fila.style.display =
        indice >= ini &&
        indice < ini + PAG_SIZE
          ? ''
          : 'none';
    });

    let nav = document.getElementById(
      'nav-' + tablaId
    );

    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'nav-' + tablaId;
      nav.className = 'pag-nav';

      tabla.parentNode.insertBefore(
        nav,
        tabla.nextSibling
      );
    }

    nav.innerHTML = `
      <button id="prev-${tablaId}">
        ← Anterior
      </button>

      <span>
        Página ${pagina} / ${totalPags}
        &nbsp;·&nbsp;
        ${filas.length} registros
      </span>

      <button id="next-${tablaId}">
        Siguiente →
      </button>
    `;

    const botonAnterior = document.getElementById(
      'prev-' + tablaId
    );

    const botonSiguiente = document.getElementById(
      'next-' + tablaId
    );

    botonAnterior.disabled = pagina === 1;

    botonSiguiente.disabled =
      pagina === totalPags;

    botonAnterior.onclick = () => {
      pagina--;
      render();
    };

    botonSiguiente.onclick = () => {
      pagina++;
      render();
    };
  }

  render();
}

function confirmarAccion(mensaje) {
  return confirm(mensaje);
}

function ordenarPorNumero(datos, campo) {
  return [...(datos || [])].sort(
    (a, b) =>
      Number(a[campo] || 0) -
      Number(b[campo] || 0)
  );
}

function ordenarHoras(datos) {
  return [...(datos || [])].sort(
    (a, b) => {
      const fechaA = a.fecha
        ? new Date(a.fecha).getTime()
        : 0;

      const fechaB = b.fecha
        ? new Date(b.fecha).getTime()
        : 0;

      return fechaA - fechaB;
    }
  );
}

function switchTab(name, btn) {
  document
    .querySelectorAll('.tab-content')
    .forEach(tab => {
      tab.classList.remove('active');
    });

  document
    .querySelectorAll('.tab-btn')
    .forEach(boton => {
      boton.classList.remove('active');
    });

  const tab = document.getElementById(
    'tab-' + name
  );

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
  const tabla = document.getElementById(id);

  if (!tabla) return;

  tabla
    .querySelectorAll('tbody tr')
    .forEach(fila => {
      fila.style.display =
        fila.innerText
          .toLowerCase()
          .includes(texto.toLowerCase())
          ? ''
          : 'none';
    });
}

function badge(texto) {
  const estado = (texto || '').toLowerCase();

  if (estado.includes('inactivo')) {
    return `
      <span class="badge badge-red">
        ${texto}
      </span>
    `;
  }

  if (estado.includes('activo')) {
    return `
      <span class="badge badge-green">
        ${texto}
      </span>
    `;
  }

  return `
    <span class="badge badge-blue">
      ${texto}
    </span>
  `;
}

function msg(id, texto, tipo) {
  const elemento = document.getElementById(id);

  if (!elemento) return;

  elemento.className = 'msg ' + tipo;
  elemento.textContent = texto;

  setTimeout(() => {
    elemento.className = 'msg';
  }, 4000);
}

const tablaBonos = [
  {
    min: 0,
    max: 2,
    pct: 0
  },
  {
    min: 3,
    max: 5,
    pct: 10
  },
  {
    min: 6,
    max: 10,
    pct: 15
  },
  {
    min: 11,
    max: 999,
    pct: 25
  }
];

function sugerirPorcentaje() {
  const anios = parseInt(
    document.getElementById('b-anios').value
  );

  const fila = tablaBonos.find(
    bono =>
      anios >= bono.min &&
      anios <= bono.max
  );

  if (fila) {
    document.getElementById('b-pct').value =
      fila.pct;
  } else {
    document.getElementById('b-pct').value =
      '';
  }

  calcularMonto();
}

function calcularMonto() {
  const salario = parseFloat(
    document.getElementById('b-salario').value
  );

  const porcentaje = parseFloat(
    document.getElementById('b-pct').value
  );

  const preview = document.getElementById(
    'b-preview'
  );

  if (!preview) return;

  if (
    Number.isNaN(salario) ||
    Number.isNaN(porcentaje) ||
    salario <= 0
  ) {
    preview.style.display = 'none';
    preview.innerHTML = '';
    return;
  }

  const monto =
    (salario * porcentaje) / 100;

  const salarioFinal =
    salario + monto;

  preview.style.display = 'block';

  preview.innerHTML = `
    <p>
      Monto bono:
      <b>Bs ${monto.toFixed(2)}</b>
    </p>

    <p>
      Salario base Bs ${salario.toFixed(2)}
      x ${porcentaje}%
    </p>

    <p>
      Salario final del proyecto:
      <b>Bs ${salarioFinal.toFixed(2)}</b>
    </p>
  `;
}

document.addEventListener('input', () => {
  const horas = parseFloat(
    document.getElementById('h-horas')?.value
  ) || 0;

  const pago = parseFloat(
    document.getElementById('h-pago')?.value
  ) || 0;

  const preview = document.getElementById(
    'h-preview'
  );

  if (preview && horas && pago) {
    preview.textContent =
      `Total: Bs ${(horas * pago).toFixed(2)}`;
  }
});

let _empleados = [];
let _empleadosFiltrados = [];

// idEmpleado -> nombres de proyectos activos
let _empProyectos = {};

async function cargarEmpleados() {
  mostrarCarga('cont-empleados');

  try {
    const [
      empleados,
      asignaciones,
      proyectos
    ] = await Promise.all([
      fetch(`${API}/empleados`)
        .then(respuesta => respuesta.json()),

      fetch(`${API}/empleadoproyecto`)
        .then(respuesta => respuesta.json())
        .catch(() => []),

      fetch(`${API}/proyectos`)
        .then(respuesta => respuesta.json())
        .catch(() => [])
    ]);

    _empleados = ordenarPorNumero(
      empleados,
      'idEmpleado'
    );

    // Mapa empleado -> proyectos activos.
    _empProyectos = {};

    (
      Array.isArray(asignaciones)
        ? asignaciones
        : []
    ).forEach(asignacion => {
      if (
        asignacion.estadoAsignacion &&
        asignacion.estadoAsignacion !== 'Activo'
      ) {
        return;
      }

      _empProyectos[asignacion.idEmpleado] =
        _empProyectos[asignacion.idEmpleado] ||
        [];

      _empProyectos[
        asignacion.idEmpleado
      ].push(asignacion.nombreProyecto);
    });

    // Llenar filtros con valores únicos.
    const cargos = [
      ...new Set(
        _empleados
          .map(empleado => empleado.nombreCargo)
          .filter(Boolean)
      )
    ].sort();

    const departamentos = [
      ...new Set(
        _empleados
          .map(
            empleado =>
              empleado.nombreDepartamento
          )
          .filter(Boolean)
      )
    ].sort();

    llenarFiltro(
      'emp-f-cargo',
      cargos
    );

    llenarFiltro(
      'emp-f-depto',
      departamentos
    );

    const proyectosOrdenados = (
      Array.isArray(proyectos)
        ? proyectos
        : []
    )
      .map(proyecto => proyecto.nombreProyecto)
      .filter(Boolean)
      .sort();

    llenarFiltro(
      'emp-f-proyecto',
      proyectosOrdenados
    );

    renderEmpleados();
  } catch (error) {
    document.getElementById(
      'cont-empleados'
    ).innerHTML = `
      <p style="color:red;">
        Error al cargar empleados
      </p>
    `;
  }
}

function llenarFiltro(id, valores) {
  const select = document.getElementById(id);

  if (!select) return;

  const valorActual = select.value;

  select.innerHTML =
    '<option value="">— Todos —</option>' +
    valores
      .map(valor => `
        <option value="${valor}">
          ${valor}
        </option>
      `)
      .join('');

  select.value = valorActual;
}

function esEmpleadoActivo(empleado) {
  const estado = (
    empleado.nombreEstadoEmpleado || ''
  ).toLowerCase();

  return (
    estado.includes('activo') &&
    !estado.includes('inactivo')
  );
}

function renderEmpleados() {
  const contenedor =
    document.getElementById('cont-empleados');

  if (!contenedor) return;

  const texto = (
    document.getElementById(
      'emp-buscar'
    )?.value || ''
  ).toLowerCase();

  const filtroCargo =
    document.getElementById(
      'emp-f-cargo'
    )?.value || '';

  const filtroDepartamento =
    document.getElementById(
      'emp-f-depto'
    )?.value || '';

  const filtroEstado =
    document.getElementById(
      'emp-f-estado'
    )?.value || '';

  const filtroProyecto =
    document.getElementById(
      'emp-f-proyecto'
    )?.value || '';

  const filtrados = _empleados.filter(
    empleado => {
      const informacionEmpleado =
        `${empleado.nombre} ` +
        `${empleado.apellido} ` +
        `${empleado.ci || ''}`;

      if (
        texto &&
        !informacionEmpleado
          .toLowerCase()
          .includes(texto)
      ) {
        return false;
      }

      if (
        filtroCargo &&
        empleado.nombreCargo !== filtroCargo
      ) {
        return false;
      }

      if (
        filtroDepartamento &&
        empleado.nombreDepartamento !==
          filtroDepartamento
      ) {
        return false;
      }

      if (
        filtroEstado === 'activo' &&
        !esEmpleadoActivo(empleado)
      ) {
        return false;
      }

      if (
        filtroEstado === 'inactivo' &&
        esEmpleadoActivo(empleado)
      ) {
        return false;
      }

      if (
        filtroProyecto &&
        !(
          _empProyectos[
            empleado.idEmpleado
          ] || []
        ).includes(filtroProyecto)
      ) {
        return false;
      }

      return true;
    }
  );

  _empleadosFiltrados = filtrados;

  const stats =
    document.getElementById('emp-stats');

  if (stats) {
    const activos =
      _empleados.filter(
        esEmpleadoActivo
      ).length;

    const enProyecto =
      Object.keys(_empProyectos).length;

    stats.innerHTML = `
      <div class="sb">
        <div class="n">
          ${_empleados.length}
        </div>

        <div class="l">
          Empleados
        </div>
      </div>

      <div class="sb">
        <div class="n">
          ${activos}
        </div>

        <div class="l">
          Activos
        </div>
      </div>

      <div class="sb">
        <div class="n">
          ${_empleados.length - activos}
        </div>

        <div class="l">
          De baja
        </div>
      </div>

      <div class="sb">
        <div class="n">
          ${enProyecto}
        </div>

        <div class="l">
          En proyecto
        </div>
      </div>
    `;
  }

  if (!filtrados.length) {
    contenedor.innerHTML = `
      <p style="color:#6b756d;">
        No hay empleados que coincidan con los filtros.
      </p>
    `;

    return;
  }

  contenedor.innerHTML = `
    <p
      style="
        color:#6b756d;
        margin-bottom:8px;
      "
    >
      ${filtrados.length}
      de
      ${_empleados.length}
      empleado(s)
    </p>

    <table id="tbl-emp">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Apellido</th>
          <th>Cargo</th>
          <th>Departamento</th>
          <th>Proyecto(s)</th>
          <th>Salario</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        ${filtrados
          .map(empleado => {
            const accion =
              esEmpleadoActivo(empleado)
                ? `
                  <button
                    class="btn btn-red"
                    style="
                      padding:4px 10px;
                      font-size:.78rem;
                    "
                    onclick="
                      cambiarEstadoEmpleado(
                        ${empleado.idEmpleado},
                        2
                      )
                    "
                  >
                    Dar de baja
                  </button>
                `
                : `
                  <button
                    class="btn btn-green"
                    style="
                      padding:4px 10px;
                      font-size:.78rem;
                    "
                    onclick="
                      cambiarEstadoEmpleado(
                        ${empleado.idEmpleado},
                        1
                      )
                    "
                  >
                    Activar
                  </button>
                `;

            const proyectosEmpleado = (
              _empProyectos[
                empleado.idEmpleado
              ] || []
            ).join(', ') ||
            '<span style="color:#bbb;">—</span>';

            return `
              <tr>
                <td>
                  ${empleado.idEmpleado}
                </td>

                <td>
                  ${empleado.nombre}
                </td>

                <td>
                  ${empleado.apellido}
                </td>

                <td>
                  ${empleado.nombreCargo || '-'}
                </td>

                <td>
                  ${
                    empleado.nombreDepartamento ||
                    '-'
                  }
                </td>

                <td style="font-size:.82rem;">
                  ${proyectosEmpleado}
                </td>

                <td>
                  Bs ${
                    Number(
                      empleado.salario || 0
                    ).toLocaleString()
                  }
                </td>

                <td>
                  ${
                    badge(
                      empleado.nombreEstadoEmpleado
                    )
                  }
                </td>

                <td>
                  ${accion}
                </td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

async function cargarSelectCargos() {
  const data = await fetch(
    `${API}/empleados/cargos/lista`
  )
    .then(respuesta => respuesta.json())
    .catch(() => []);

  const ordenados = ordenarPorNumero(
    data,
    'idCargo'
  );

  const select =
    document.getElementById('emp-cargo');

  if (!select) return;

  select.innerHTML =
    '<option value="">-- Cargo --</option>' +
    ordenados
      .map(cargo => `
        <option value="${cargo.idCargo}">
          ${cargo.nombreCargo}
        </option>
      `)
      .join('');
}

async function cargarSelectDeptos() {
  const data = await fetch(
    `${API}/empleados/departamentos/lista`
  )
    .then(respuesta => respuesta.json())
    .catch(() => []);

  const ordenados = ordenarPorNumero(
    data,
    'idDepartamento'
  );

  const select =
    document.getElementById('emp-depto');

  if (!select) return;

  select.innerHTML =
    '<option value="">-- Departamento --</option>' +
    ordenados
      .map(departamento => `
        <option
          value="${departamento.idDepartamento}"
        >
          ${departamento.nombreDepartamento}
        </option>
      `)
      .join('');
}

function cargarSelectEstados() {
  const select =
    document.getElementById('emp-estado');

  if (!select) return;

  select.innerHTML = `
    <option value="">
      -- Estado --
    </option>

    <option value="1">
      Activo
    </option>

    <option value="2">
      Inactivo
    </option>
  `;
}

async function registrarEmpleado() {
  const body = {
    nombre:
      document
        .getElementById('emp-nombre')
        .value
        .trim(),

    apellido:
      document
        .getElementById('emp-apellido')
        .value
        .trim(),

    ci:
      document
        .getElementById('emp-ci')
        .value
        .trim(),

    email:
      document
        .getElementById('emp-email')
        .value
        .trim(),

    numCelular:
      document
        .getElementById('emp-cel')
        .value
        .trim(),

    salario:
      parseFloat(
        document.getElementById(
          'emp-salario'
        ).value
      ) || null,

    fechaContratacion:
      document.getElementById(
        'emp-contrat'
      ).value || null,

    fechaNacimiento:
      document.getElementById(
        'emp-nacim'
      ).value || null,

    idCargo:
      parseInt(
        document.getElementById(
          'emp-cargo'
        ).value
      ),

    idDepartamento:
      parseInt(
        document.getElementById(
          'emp-depto'
        ).value
      ),

    idEstadoEmpleado:
      parseInt(
        document.getElementById(
          'emp-estado'
        ).value
      ),

    especialidad:
      document
        .getElementById('emp-esp')
        .value
        .trim(),

    direccion:
      document
        .getElementById('emp-dir')
        .value
        .trim()
  };

  if (
    !body.nombre ||
    !body.apellido ||
    !body.idCargo ||
    !body.idDepartamento ||
    !body.idEstadoEmpleado
  ) {
    return msg(
      'msg-emp',
      'Nombre, apellido, cargo, departamento y estado son obligatorios',
      'err'
    );
  }

  try {
    const respuesta = await fetch(
      `${API}/empleados`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(body)
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return msg(
        'msg-emp',
        'Error: ' + data.error,
        'err'
      );
    }

    msg(
      'msg-emp',
      'Empleado registrado con ID: ' +
        data.idEmpleado,
      'ok'
    );

    document
      .querySelectorAll(
        '#tab-registrar input'
      )
      .forEach(input => {
        input.value = '';
      });

    const cargo =
      document.getElementById('emp-cargo');

    const departamento =
      document.getElementById('emp-depto');

    const estado =
      document.getElementById('emp-estado');

    if (cargo) {
      cargo.value = '';
    }

    if (departamento) {
      departamento.value = '';
    }

    if (estado) {
      estado.value = '';
    }

    cargarEmpleados();
  } catch (error) {
    msg(
      'msg-emp',
      'Error de conexión',
      'err'
    );
  }
}

// Al elegir un empleado, muestra a qué proyectos está
// asignado para registrar las horas en el proyecto correcto.
async function onSelEmpleadoHoras() {
  const hint = document.getElementById(
    'h-emp-proyectos'
  );

  if (!hint) return;

  const id = document.getElementById(
    'h-empleado'
  ).value;

  if (!id) {
    hint.textContent = '';
    return;
  }

  hint.textContent =
    'Buscando proyectos del empleado...';

  try {
    const data = await fetch(
      `${API}/empleados/${id}/asignaciones`
    ).then(respuesta => respuesta.json());

    const activos = (
      Array.isArray(data)
        ? data
        : []
    ).filter(asignacion => !asignacion.fechaFin);

    if (!activos.length) {
      hint.style.color = '#b45309';

      hint.textContent =
        'Este empleado no tiene proyectos activos: ' +
        'no podrás registrarle horas hasta asignarlo a uno.';

      return;
    }

    hint.style.color = '#276749';

    hint.textContent =
      'Asignado a: ' +
      activos
        .map(asignacion =>
          asignacion.nombreProyecto
        )
        .join(', ');
  } catch (error) {
    hint.textContent = '';
  }
}

async function registrarHoras() {
  const body = {
    idEmpleado:
      parseInt(
        document.getElementById(
          'h-empleado'
        ).value
      ),

    idProyecto:
      parseInt(
        document.getElementById(
          'h-proyecto'
        ).value
      ),

    fecha:
      document.getElementById(
        'h-fecha'
      ).value,

    horasTrabajadas:
      parseFloat(
        document.getElementById(
          'h-horas'
        ).value
      ),

    pagoPorHora:
      parseFloat(
        document.getElementById(
          'h-pago'
        ).value
      )
  };

  if (
    !body.idEmpleado ||
    !body.idProyecto ||
    !body.fecha ||
    !body.horasTrabajadas ||
    !body.pagoPorHora
  ) {
    return msg(
      'msg-horas',
      'Todos los campos son obligatorios',
      'err'
    );
  }

  const hoy = new Date()
    .toISOString()
    .substring(0, 10);

  if (body.fecha > hoy) {
    return msg(
      'msg-horas',
      'La fecha no puede ser futura.',
      'err'
    );
  }

  try {
    const respuesta = await fetch(
      `${API}/empleados/horas`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(body)
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return msg(
        'msg-horas',
        'Error: ' + data.error,
        'err'
      );
    }

    msg(
      'msg-horas',
      `Horas registradas. Total: Bs ${data.totalPago}`,
      'ok'
    );

    [
      'h-emp-nom',
      'h-empleado',
      'h-proy-nom',
      'h-proyecto',
      'h-fecha',
      'h-horas',
      'h-pago'
    ].forEach(id => {
      const input =
        document.getElementById(id);

      if (input) {
        input.value = '';
      }
    });

    const preview =
      document.getElementById('h-preview');

    if (preview) {
      preview.textContent = '';
    }
  } catch (error) {
    msg(
      'msg-horas',
      'Error de conexión',
      'err'
    );
  }
}

async function consultarHoras() {
  const id =
    document.getElementById('ch-id').value;

  if (!id) return;

  try {
    const data = await fetch(
      `${API}/empleados/${id}/horas`
    ).then(respuesta => respuesta.json());

    if (data.error) {
      document.getElementById(
        'resumen-horas'
      ).innerHTML = `
        <p style="color:red;">
          ${data.error}
        </p>
      `;

      document.getElementById(
        'cont-horas-emp'
      ).innerHTML = '';

      return;
    }

    const registros = Array.isArray(data)
      ? data
      : (
          data.registros ||
          data.horas ||
          data.registrosHoras ||
          data.detalle ||
          []
        );

    const ordenados =
      ordenarHoras(registros);

    const totalHoras =
      data.totalHoras !== undefined
        ? Number(data.totalHoras)
        : ordenados.reduce(
            (suma, registro) =>
              suma +
              Number(
                registro.horasTrabajadas ||
                registro.horas ||
                0
              ),
            0
          );

    const totalGanado =
      data.totalGanado !== undefined
        ? Number(data.totalGanado)
        : ordenados.reduce(
            (suma, registro) => {
              const horas = Number(
                registro.horasTrabajadas ||
                registro.horas ||
                0
              );

              const pago = Number(
                registro.pagoPorHora ||
                registro.precioHora ||
                0
              );

              const total =
                registro.totalPago !== undefined
                  ? Number(registro.totalPago)
                  : horas * pago;

              return suma + total;
            },
            0
          );

    document.getElementById(
      'resumen-horas'
    ).innerHTML = `
      <div class="resumen-box">
        <p>
          Total horas:
          <b>${totalHoras}</b>
        </p>

        <p>
          Total ganado:
          <b>Bs ${totalGanado.toFixed(2)}</b>
        </p>
      </div>
    `;

    if (ordenados.length === 0) {
      document.getElementById(
        'cont-horas-emp'
      ).innerHTML = `
        <p>
          No se encontraron horas registradas
          para este empleado.
        </p>
      `;

      return;
    }

    document.getElementById(
      'cont-horas-emp'
    ).innerHTML = `
      <table id="tbl-horas-emp">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Proyecto</th>
            <th>Horas</th>
            <th>Bs/Hora</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          ${ordenados
            .map(registro => {
              const horas = Number(
                registro.horasTrabajadas ||
                registro.horas ||
                0
              );

              const pago = Number(
                registro.pagoPorHora ||
                registro.precioHora ||
                0
              );

              const total =
                registro.totalPago !== undefined
                  ? Number(registro.totalPago)
                  : horas * pago;

              const idRegistro =
                registro.idRegistroHoras;

              const botonEliminar =
                idRegistro
                  ? `
                    <button
                      class="btn btn-red"
                      style="
                        padding:4px 10px;
                        font-size:.78rem;
                      "
                      onclick="
                        eliminarRegistroHoras(
                          ${idRegistro}
                        )
                      "
                    >
                      Eliminar
                    </button>
                  `
                  : '-';

              return `
                <tr>
                  <td>
                    ${
                      registro.fecha
                        ? registro.fecha.substring(
                            0,
                            10
                          )
                        : '-'
                    }
                  </td>

                  <td>
                    ${
                      registro.nombreProyecto ||
                      registro.proyecto ||
                      '-'
                    }
                  </td>

                  <td>
                    ${horas}
                  </td>

                  <td>
                    Bs ${pago.toFixed(2)}
                  </td>

                  <td>
                    Bs ${total.toFixed(2)}
                  </td>

                  <td>
                    ${botonEliminar}
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    `;

    aplicarPaginacion(
      'tbl-horas-emp'
    );
  } catch (error) {
    document.getElementById(
      'resumen-horas'
    ).innerHTML = `
      <p style="color:red;">
        Error o empleado no encontrado
      </p>
    `;

    document.getElementById(
      'cont-horas-emp'
    ).innerHTML = '';
  }
}

async function registrarBonificacion() {
  const body = {
    idEmpleado:
      parseInt(
        document.getElementById(
          'b-emp'
        ).value
      ),

    idProyecto:
      parseInt(
        document.getElementById(
          'b-proyecto'
        ).value
      ),

    tipoBonificacion:
      document
        .getElementById('b-tipo')
        .value
        .trim(),

    aniosAntiguedad:
      parseInt(
        document.getElementById(
          'b-anios'
        ).value
      ),

    porcentajeBono:
      parseFloat(
        document.getElementById(
          'b-pct'
        ).value
      ),

    salarioBaseProyecto:
      parseFloat(
        document.getElementById(
          'b-salario'
        ).value
      ),

    gestion:
      parseInt(
        document.getElementById(
          'b-gestion'
        ).value
      ),

    descripcion:
      document
        .getElementById('b-desc')
        .value
        .trim()
  };

  if (!body.idEmpleado) {
    return msg(
      'msg-bono',
      'Seleccione un empleado de la lista.',
      'err'
    );
  }

  if (!body.idProyecto) {
    return msg(
      'msg-bono',
      'Seleccione un proyecto de la lista.',
      'err'
    );
  }

  if (!body.tipoBonificacion) {
    return msg(
      'msg-bono',
      'Ingrese el tipo de bonificación.',
      'err'
    );
  }

  if (
    Number.isNaN(body.aniosAntiguedad)
  ) {
    return msg(
      'msg-bono',
      'Ingrese los años de antigüedad.',
      'err'
    );
  }

  if (
    Number.isNaN(body.porcentajeBono)
  ) {
    return msg(
      'msg-bono',
      'Ingrese el porcentaje del bono.',
      'err'
    );
  }

  if (
    Number.isNaN(
      body.salarioBaseProyecto
    ) ||
    body.salarioBaseProyecto <= 0
  ) {
    return msg(
      'msg-bono',
      'Ingrese un salario base válido.',
      'err'
    );
  }

  if (!body.gestion) {
    return msg(
      'msg-bono',
      'Ingrese la gestión.',
      'err'
    );
  }

  try {
    const respuesta = await fetch(
      `${API}/empleados/bonificaciones`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(body)
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return msg(
        'msg-bono',
        'Error: ' + data.error,
        'err'
      );
    }

    msg(
      'msg-bono',
      `Bono registrado. ` +
      `Monto bono: Bs ${
        Number(data.montoBono).toFixed(2)
      } | ` +
      `Salario final: Bs ${
        Number(
          data.salarioFinalProyecto
        ).toFixed(2)
      }`,
      'ok'
    );

    [
      'b-emp-nom',
      'b-emp',
      'b-proy-nom',
      'b-proyecto',
      'b-tipo',
      'b-anios',
      'b-pct',
      'b-salario',
      'b-gestion',
      'b-desc'
    ].forEach(id => {
      const input =
        document.getElementById(id);

      if (input) {
        input.value = '';
      }
    });

    const preview =
      document.getElementById('b-preview');

    if (preview) {
      preview.style.display = 'none';
      preview.innerHTML = '';
    }
  } catch (error) {
    msg(
      'msg-bono',
      'Error de conexión',
      'err'
    );
  }
}

async function cargarCargos() {
  const data = await fetch(
    `${API}/empleados/cargos/lista`
  )
    .then(respuesta => respuesta.json())
    .catch(() => []);

  const ordenados = ordenarPorNumero(
    data,
    'idCargo'
  );

  document.getElementById(
    'cont-cargos'
  ).innerHTML = `
    <table id="tbl-cargos">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cargo</th>
          <th>Descripción</th>
        </tr>
      </thead>

      <tbody>
        ${ordenados
          .map(cargo => `
            <tr>
              <td>
                ${cargo.idCargo}
              </td>

              <td>
                ${cargo.nombreCargo}
              </td>

              <td>
                ${
                  cargo.descripcionCargo ||
                  '-'
                }
              </td>
            </tr>
          `)
          .join('')}
      </tbody>
    </table>
  `;
}

async function cargarDeptos() {
  const data = await fetch(
    `${API}/empleados/departamentos/lista`
  )
    .then(respuesta => respuesta.json())
    .catch(() => []);

  const ordenados = ordenarPorNumero(
    data,
    'idDepartamento'
  );

  document.getElementById(
    'cont-deptos'
  ).innerHTML = `
    <table id="tbl-deptos">
      <thead>
        <tr>
          <th>ID</th>
          <th>Departamento</th>
          <th>Descripción</th>
        </tr>
      </thead>

      <tbody>
        ${ordenados
          .map(departamento => `
            <tr>
              <td>
                ${departamento.idDepartamento}
              </td>

              <td>
                ${departamento.nombreDepartamento}
              </td>

              <td>
                ${
                  departamento.descripcionDepartamento ||
                  '-'
                }
              </td>
            </tr>
          `)
          .join('')}
      </tbody>
    </table>
  `;
}

async function registrarCargo() {
  const body = {
    nombreCargo:
      document
        .getElementById('c-nombre')
        .value
        .trim(),

    descripcionCargo:
      document
        .getElementById('c-desc')
        .value
        .trim()
  };

  if (!body.nombreCargo) {
    return msg(
      'msg-cargo',
      'Nombre obligatorio',
      'err'
    );
  }

  try {
    const respuesta = await fetch(
      `${API}/empleados/cargos`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(body)
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return msg(
        'msg-cargo',
        'Error: ' + data.error,
        'err'
      );
    }

    msg(
      'msg-cargo',
      'Cargo registrado',
      'ok'
    );

    document.getElementById(
      'c-nombre'
    ).value = '';

    document.getElementById(
      'c-desc'
    ).value = '';

    cargarCargos();
    cargarSelectCargos();
  } catch (error) {
    msg(
      'msg-cargo',
      'Error de conexión',
      'err'
    );
  }
}

async function registrarDepto() {
  const body = {
    nombreDepartamento:
      document
        .getElementById('d-nombre')
        .value
        .trim(),

    descripcionDepartamento:
      document
        .getElementById('d-desc')
        .value
        .trim()
  };

  if (!body.nombreDepartamento) {
    return msg(
      'msg-depto',
      'Nombre obligatorio',
      'err'
    );
  }

  try {
    const respuesta = await fetch(
      `${API}/empleados/departamentos`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(body)
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return msg(
        'msg-depto',
        'Error: ' + data.error,
        'err'
      );
    }

    msg(
      'msg-depto',
      'Departamento registrado',
      'ok'
    );

    document.getElementById(
      'd-nombre'
    ).value = '';

    document.getElementById(
      'd-desc'
    ).value = '';

    cargarDeptos();
    cargarSelectDeptos();
  } catch (error) {
    msg(
      'msg-depto',
      'Error de conexión',
      'err'
    );
  }
}

async function cargarFormEditarEmp(
  idEmpleado
) {
  try {
    const data = await fetch(
      `${API}/empleados/${idEmpleado}`
    ).then(respuesta => respuesta.json());

    const empleado =
      data.empleado || data;

    document.getElementById(
      'ee-nombre'
    ).value = empleado.nombre || '';

    document.getElementById(
      'ee-apellido'
    ).value = empleado.apellido || '';

    document.getElementById(
      'ee-email'
    ).value = empleado.email || '';

    document.getElementById(
      'ee-cel'
    ).value = empleado.numCelular || '';

    document.getElementById(
      'ee-salario'
    ).value = empleado.salario || '';

    document.getElementById(
      'ee-dir'
    ).value = empleado.direccion || '';

    await cargarSelectsEditorEmp(
      empleado.idCargo,
      empleado.idDepartamento
    );

    const estadoSelect =
      document.getElementById('ee-estado');

    if (estadoSelect) {
      estadoSelect.value =
        empleado.idEstadoEmpleado || 1;
    }

    document.getElementById(
      'form-editar-emp'
    ).style.display = 'block';
  } catch (error) {
    alert(
      'Error al cargar datos del empleado'
    );
  }
}

async function cargarSelectsEditorEmp(
  idCargo,
  idDepartamento
) {
  const [
    cargos,
    departamentos
  ] = await Promise.all([
    fetch(
      `${API}/empleados/cargos/lista`
    )
      .then(respuesta => respuesta.json())
      .catch(() => []),

    fetch(
      `${API}/empleados/departamentos/lista`
    )
      .then(respuesta => respuesta.json())
      .catch(() => [])
  ]);

  const selectCargo =
    document.getElementById('ee-cargo');

  const selectDepartamento =
    document.getElementById('ee-depto');

  if (selectCargo) {
    selectCargo.innerHTML =
      '<option value="">-- Seleccionar --</option>' +
      cargos
        .map(cargo => `
          <option
            value="${cargo.idCargo}"
            ${
              cargo.idCargo === idCargo
                ? 'selected'
                : ''
            }
          >
            ${cargo.nombreCargo}
          </option>
        `)
        .join('');
  }

  if (selectDepartamento) {
    selectDepartamento.innerHTML =
      '<option value="">-- Seleccionar --</option>' +
      departamentos
        .map(departamento => `
          <option
            value="${departamento.idDepartamento}"
            ${
              departamento.idDepartamento ===
              idDepartamento
                ? 'selected'
                : ''
            }
          >
            ${departamento.nombreDepartamento}
          </option>
        `)
        .join('');
  }
}

async function guardarEdicionEmpleado() {
  const id = document.getElementById(
    'ee-idemplrado'
  ).value;

  if (!id) {
    return msg(
      'msg-editar-emp',
      'Seleccione un empleado de la lista.',
      'err'
    );
  }

  const body = {
    nombre:
      document
        .getElementById('ee-nombre')
        .value
        .trim(),

    apellido:
      document
        .getElementById('ee-apellido')
        .value
        .trim(),

    email:
      document
        .getElementById('ee-email')
        .value
        .trim(),

    numCelular:
      document
        .getElementById('ee-cel')
        .value
        .trim(),

    salario:
      parseFloat(
        document.getElementById(
          'ee-salario'
        ).value
      ) || null,

    idCargo:
      parseInt(
        document.getElementById(
          'ee-cargo'
        ).value
      ) || null,

    idDepartamento:
      parseInt(
        document.getElementById(
          'ee-depto'
        ).value
      ) || null,

    idEstadoEmpleado:
      parseInt(
        document.getElementById(
          'ee-estado'
        ).value
      ) || 1,

    direccion:
      document
        .getElementById('ee-dir')
        .value
        .trim()
  };

  if (!body.nombre || !body.apellido) {
    return msg(
      'msg-editar-emp',
      'Nombre y apellido son obligatorios.',
      'err'
    );
  }

  try {
    const respuesta = await fetch(
      `${API}/empleados/${id}`,
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(body)
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return msg(
        'msg-editar-emp',
        'Error: ' + data.error,
        'err'
      );
    }

    msg(
      'msg-editar-emp',
      'Empleado actualizado correctamente',
      'ok'
    );

    cargarEmpleados();
  } catch (error) {
    msg(
      'msg-editar-emp',
      'Error de conexión',
      'err'
    );
  }
}

async function cambiarEstadoEmpleado(
  id,
  idEstado
) {
  const accion =
    idEstado === 2
      ? 'dar de baja'
      : 'reactivar';

  if (
    !confirmarAccion(
      `¿Seguro que quieres ${accion} al empleado ID ${id}?`
    )
  ) {
    return;
  }

  try {
    const respuesta = await fetch(
      `${API}/empleados/${id}/estado`,
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          idEstadoEmpleado: idEstado
        })
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      alert(
        'Error: ' + data.error
      );

      return;
    }

    cargarEmpleados();
  } catch (error) {
    alert(
      'Error de conexión'
    );
  }
}

async function eliminarRegistroHoras(
  idRegistro
) {
  if (
    !confirmarAccion(
      `¿Eliminar el registro de horas ID ${idRegistro}?`
    )
  ) {
    return;
  }

  try {
    const respuesta = await fetch(
      `${API}/empleados/horas/${idRegistro}`,
      {
        method: 'DELETE'
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      alert(
        'Error: ' + data.error
      );

      return;
    }

    consultarHoras();
  } catch (error) {
    alert(
      'Error de conexión'
    );
  }
}

// Imprime la lista de empleados respetando
// los filtros aplicados en pantalla.
function imprimirEmpleados() {
  const lista =
    _empleadosFiltrados.length
      ? _empleadosFiltrados
      : _empleados;

  if (!lista.length) {
    alert(
      'No hay empleados para imprimir.'
    );

    return;
  }

  if (
    typeof nuevaVentanaPDF !== 'function' ||
    typeof pdfTabla !== 'function' ||
    typeof imprimirReporte !== 'function'
  ) {
    alert(
      'No se cargaron las funciones para imprimir el reporte.'
    );

    return;
  }

  const ventana =
    nuevaVentanaPDF();

  const filas = lista.map(empleado => [
    `${empleado.nombre} ${empleado.apellido}`,
    empleado.ci || '-',
    empleado.nombreCargo || '-',
    empleado.nombreDepartamento || '-',
    empleado.nombreEstadoEmpleado || '-',
    empleado.email || '-',
    empleado.numCelular || '-'
  ]);

  const cuerpo =
    pdfTabla(
      'Empleados',
      [
        'Empleado',
        'CI',
        'Cargo',
        'Departamento',
        'Estado',
        'Email',
        'Celular'
      ],
      filas
    ) +
    `
      <div class="total">
        Total: ${lista.length} empleados
      </div>
    `;

  imprimirReporte(
    ventana,
    'Reporte de Empleados',
    '',
    [cuerpo]
  );
}

cargarEmpleados();
