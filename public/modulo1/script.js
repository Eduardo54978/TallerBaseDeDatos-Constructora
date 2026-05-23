const apiProyectos = "/api/proyectos";
const apiPersonal = "/api/empleadoproyecto";
const apiOpcionesProyecto = "/api/proyectos/form/opciones";
const apiRegistrarProyecto = "/api/proyectos/registrar";
const apiTiposProyecto = "/api/proyectos/parametros/tipos";
const apiEstadosProyecto = "/api/proyectos/parametros/estados";

let listaProyectos = [];
let listaPersonal = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarProyectos();
  cargarPersonal();
  cargarOpcionesProyecto();
  cargarParametrosProyecto();

  const buscarProyecto = document.getElementById("buscarProyecto");
  const buscarPersonal = document.getElementById("buscarPersonal");
  const formProyecto = document.getElementById("formProyecto");
  const formTipoProyecto = document.getElementById("formTipoProyecto");
  const formEstadoProyecto = document.getElementById("formEstadoProyecto");
  const formCambiarEstadoProyecto = document.getElementById("formCambiarEstadoProyecto");

  if (buscarProyecto) {
    buscarProyecto.addEventListener("input", e => {
      buscarProyectos(e.target.value);
    });
  }

  if (buscarPersonal) {
    buscarPersonal.addEventListener("input", e => {
      buscarPersonalAsignado(e.target.value);
    });
  }

  if (formProyecto) {
    formProyecto.addEventListener("submit", guardarProyecto);
  }

  if (formTipoProyecto) {
    formTipoProyecto.addEventListener("submit", guardarTipoProyecto);
  }

  if (formEstadoProyecto) {
    formEstadoProyecto.addEventListener("submit", guardarEstadoProyecto);
  }

  if (formCambiarEstadoProyecto) {
    formCambiarEstadoProyecto.addEventListener("submit", guardarCambioEstadoProyecto);
  }
});

function cambiarTab(nombre, boton) {
  document.querySelectorAll(".contenido").forEach(item => {
    item.classList.remove("activo");
  });

  document.querySelectorAll(".btn-tab").forEach(item => {
    item.classList.remove("activo");
  });

  const tab = document.getElementById(`tab-${nombre}`);

  if (tab) {
    tab.classList.add("activo");
  }

  if (boton) {
    boton.classList.add("activo");
  }

  if (nombre === "proyectos") {
    cargarProyectos();
  }

  if (nombre === "personal") {
    cargarPersonal();
  }

  if (nombre === "cambiar-estado") {
    cargarOpcionesProyecto();
  }
}

function ordenarProyectosPorId(datos) {
  return [...(datos || [])].sort((a, b) => Number(a.idProyecto) - Number(b.idProyecto));
}

function ordenarPersonalPorId(datos) {
  return [...(datos || [])].sort((a, b) => Number(a.idEmpleadoProyecto) - Number(b.idEmpleadoProyecto));
}

function ordenarTiposProyectoPorId(datos) {
  return [...(datos || [])].sort((a, b) => Number(a.idTipoProyecto) - Number(b.idTipoProyecto));
}

function ordenarEstadosProyectoPorId(datos) {
  return [...(datos || [])].sort((a, b) => Number(a.idEstadoProyecto) - Number(b.idEstadoProyecto));
}

async function cargarProyectos() {
  const mensaje = document.getElementById("mensajeProyectos");
  const tabla = document.getElementById("tablaProyectos");

  try {
    const respuesta = await fetch(apiProyectos);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudieron cargar los proyectos");
    }

    const datosOrdenados = ordenarProyectosPorId(datos);

    listaProyectos = datosOrdenados;
    mostrarProyectos(datosOrdenados);
    contarProyectos(datosOrdenados);

    if (mensaje) {
      mensaje.textContent = "";
      mensaje.classList.remove("error");
    }
  } catch (error) {
    if (tabla) {
      tabla.innerHTML = "";
    }

    if (mensaje) {
      mensaje.textContent = "Error al cargar proyectos";
      mensaje.classList.add("error");
    }
  }
}

async function cargarPersonal() {
  const mensaje = document.getElementById("mensajePersonal");
  const tabla = document.getElementById("tablaPersonal");

  try {
    const respuesta = await fetch(apiPersonal);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudo cargar el personal");
    }

    const datosOrdenados = ordenarPersonalPorId(datos);

    listaPersonal = datosOrdenados;
    mostrarPersonal(datosOrdenados);
    contarPersonal(datosOrdenados);

    if (mensaje) {
      mensaje.textContent = "";
      mensaje.classList.remove("error");
    }
  } catch (error) {
    if (tabla) {
      tabla.innerHTML = "";
    }

    if (mensaje) {
      mensaje.textContent = "Error al cargar personal";
      mensaje.classList.add("error");
    }
  }
}

function mostrarProyectos(datos) {
  const tabla = document.getElementById("tablaProyectos");

  if (!tabla) return;

  tabla.innerHTML = "";

  if (!datos || datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="8">No se encontraron proyectos.</td></tr>`;
    return;
  }

  datos.forEach(p => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${p.idProyecto}</td>
      <td>
        <strong>${p.nombreProyecto || "-"}</strong><br>
        <small>${p.descripcion || ""}</small>
      </td>
      <td>${p.cliente || p.nombreCliente || "-"}</td>
      <td>${p.nombreTipoProyecto || "-"}</td>
      <td>${p.ubicacion || "-"}</td>
      <td>${fecha(p.fechaInicio)}</td>
      <td>${fecha(p.fechaFinEstimada)}</td>
      <td>${estadoProyecto(p.nombreEstadoProyecto)}</td>
    `;

    tabla.appendChild(fila);
  });
}

function mostrarPersonal(datos) {
  const tabla = document.getElementById("tablaPersonal");

  if (!tabla) return;

  tabla.innerHTML = "";

  if (!datos || datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="10">No se encontraron registros.</td></tr>`;
    return;
  }

  datos.forEach(p => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${p.idEmpleadoProyecto}</td>
      <td><strong>${p.empleado || "-"}</strong></td>
      <td>${p.ci || "-"}</td>
      <td>${p.nombreCargo || "-"}</td>
      <td>${p.nombreProyecto || "-"}</td>
      <td>${p.nombreTipoProyecto || "-"}</td>
      <td>${p.nombreRolProyecto || "-"}</td>
      <td>${fecha(p.fechaInicio)}</td>
      <td>${fecha(p.fechaFin)}</td>
      <td>${estadoAsignacion(p.estadoAsignacion)}</td>
    `;

    tabla.appendChild(fila);
  });
}

function contarProyectos(datos) {
  const total = document.getElementById("totalProyectos");
  const ejecucion = document.getElementById("proyectosEjecucion");

  const enEjecucion = datos.filter(p => {
    const estado = (p.nombreEstadoProyecto || "").toLowerCase();
    return estado.includes("ejec") || estado.includes("activo") || estado.includes("proceso");
  }).length;

  if (total) total.textContent = datos.length;
  if (ejecucion) ejecucion.textContent = enEjecucion;
}

function contarPersonal(datos) {
  const total = document.getElementById("totalAsignaciones");
  const activosTexto = document.getElementById("asignacionesActivas");

  const activos = datos.filter(p => {
    return (p.estadoAsignacion || "").toLowerCase().includes("activo");
  }).length;

  if (total) total.textContent = datos.length;
  if (activosTexto) activosTexto.textContent = activos;
}

function buscarProyectos(texto) {
  const valor = texto.toLowerCase();

  const filtrados = listaProyectos.filter(p => {
    return (
      String(p.idProyecto).includes(valor) ||
      (p.nombreProyecto || "").toLowerCase().includes(valor) ||
      (p.descripcion || "").toLowerCase().includes(valor) ||
      (p.cliente || "").toLowerCase().includes(valor) ||
      (p.nombreCliente || "").toLowerCase().includes(valor) ||
      (p.nombreTipoProyecto || "").toLowerCase().includes(valor) ||
      (p.nombreEstadoProyecto || "").toLowerCase().includes(valor) ||
      (p.ubicacion || "").toLowerCase().includes(valor)
    );
  });

  mostrarProyectos(ordenarProyectosPorId(filtrados));
}

function buscarPersonalAsignado(texto) {
  const valor = texto.toLowerCase();

  const filtrados = listaPersonal.filter(p => {
    return (
      String(p.idEmpleadoProyecto).includes(valor) ||
      (p.empleado || "").toLowerCase().includes(valor) ||
      (p.ci || "").toLowerCase().includes(valor) ||
      (p.nombreCargo || "").toLowerCase().includes(valor) ||
      (p.nombreProyecto || "").toLowerCase().includes(valor) ||
      (p.nombreTipoProyecto || "").toLowerCase().includes(valor) ||
      (p.nombreRolProyecto || "").toLowerCase().includes(valor) ||
      (p.estadoAsignacion || "").toLowerCase().includes(valor)
    );
  });

  mostrarPersonal(ordenarPersonalPorId(filtrados));
}

async function cargarOpcionesProyecto() {
  try {
    const respuesta = await fetch(apiOpcionesProyecto);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudieron cargar las opciones");
    }

    const tiposOrdenados = ordenarTiposProyectoPorId(datos.tipos);
    const estadosOrdenados = ordenarEstadosProyectoPorId(datos.estados);

    llenarSelect("nuevoTipoProyecto", tiposOrdenados, "idTipoProyecto", "nombreTipoProyecto");
    llenarSelect("nuevoEstadoProyecto", estadosOrdenados, "idEstadoProyecto", "nombreEstadoProyecto");
    llenarSelect("cambioEstadoProyecto", estadosOrdenados, "idEstadoProyecto", "nombreEstadoProyecto");
    llenarClientes(datos.clientes);
  } catch (error) {}
}

function llenarSelect(id, datos, valor, texto) {
  const select = document.getElementById(id);

  if (!select) return;

  select.innerHTML = `<option value="">Seleccione...</option>`;

  datos.forEach(item => {
    select.innerHTML += `<option value="${item[valor]}">${item[texto]}</option>`;
  });
}

function llenarClientes(datos) {
  const select = document.getElementById("nuevoCliente");

  if (!select) return;

  select.innerHTML = `<option value="">Seleccione...</option>`;

  datos.forEach(item => {
    const nombre =
      item.nombreCliente ||
      item.razonSocial ||
      item.nombreCompleto ||
      item.nombre ||
      item.cliente ||
      `Cliente ${item.idCliente}`;

    select.innerHTML += `<option value="${item.idCliente}">${nombre}</option>`;
  });
}

async function guardarProyecto(e) {
  e.preventDefault();

  const datos = {
    nombreProyecto: document.getElementById("nuevoNombreProyecto").value.trim(),
    descripcion: document.getElementById("nuevoDescripcion").value.trim(),
    idTipoProyecto: document.getElementById("nuevoTipoProyecto").value,
    ubicacion: document.getElementById("nuevoUbicacion").value.trim(),
    fechaInicio: document.getElementById("nuevoFechaInicio").value,
    fechaFinEstimada: document.getElementById("nuevoFechaFin").value,
    idEstadoProyecto: document.getElementById("nuevoEstadoProyecto").value,
    idCliente: document.getElementById("nuevoCliente").value
  };

  try {
    const respuesta = await fetch(apiRegistrarProyecto, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo guardar el proyecto");
    }

    document.getElementById("formProyecto").reset();

    await cargarProyectos();
    alert("Proyecto registrado");
  } catch (error) {
    alert(error.message);
  }
}

async function guardarCambioEstadoProyecto(e) {
  e.preventDefault();

  const idProyecto = document.getElementById("cambioIdProyecto").value;
  const idEstadoProyecto = document.getElementById("cambioEstadoProyecto").value;
  const mensaje = document.getElementById("mensajeCambioEstado");

  if (!idProyecto || !idEstadoProyecto) {
    if (mensaje) {
      mensaje.textContent = "Complete los datos.";
      mensaje.classList.add("error");
    }
    return;
  }

  try {
    const respuesta = await fetch(`${apiProyectos}/${idProyecto}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ idEstadoProyecto })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo cambiar el estado");
    }

    if (mensaje) {
      mensaje.textContent = "Estado actualizado correctamente.";
      mensaje.classList.remove("error");
    }

    document.getElementById("formCambiarEstadoProyecto").reset();

    await cargarProyectos();
  } catch (error) {
    if (mensaje) {
      mensaje.textContent = "Error: " + error.message;
      mensaje.classList.add("error");
    }
  }
}

async function cargarParametrosProyecto() {
  try {
    const tiposResp = await fetch(apiTiposProyecto);
    const estadosResp = await fetch(apiEstadosProyecto);

    const tipos = await tiposResp.json();
    const estados = await estadosResp.json();

    if (!tiposResp.ok) {
      throw new Error(tipos.error || "No se pudieron cargar los tipos");
    }

    if (!estadosResp.ok) {
      throw new Error(estados.error || "No se pudieron cargar los estados");
    }

    mostrarTiposProyecto(ordenarTiposProyectoPorId(tipos));
    mostrarEstadosProyecto(ordenarEstadosProyectoPorId(estados));
  } catch (error) {}
}

function mostrarTiposProyecto(datos) {
  const tabla = document.getElementById("tablaTiposProyecto");

  if (!tabla) return;

  tabla.innerHTML = "";

  if (!datos || datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="2">Sin registros</td></tr>`;
    return;
  }

  datos.forEach(item => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${item.idTipoProyecto}</td>
      <td>${item.nombreTipoProyecto}</td>
    `;

    tabla.appendChild(fila);
  });
}

function mostrarEstadosProyecto(datos) {
  const tabla = document.getElementById("tablaEstadosProyecto");

  if (!tabla) return;

  tabla.innerHTML = "";

  if (!datos || datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="2">Sin registros</td></tr>`;
    return;
  }

  datos.forEach(item => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${item.idEstadoProyecto}</td>
      <td>${item.nombreEstadoProyecto}</td>
    `;

    tabla.appendChild(fila);
  });
}

async function guardarTipoProyecto(e) {
  e.preventDefault();

  const nombreTipoProyecto = document.getElementById("nombreTipoProyecto").value.trim();

  try {
    const respuesta = await fetch(apiTiposProyecto, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombreTipoProyecto })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo guardar el tipo");
    }

    document.getElementById("formTipoProyecto").reset();

    await cargarParametrosProyecto();
    await cargarOpcionesProyecto();

    alert("Tipo registrado");
  } catch (error) {
    alert(error.message);
  }
}

async function guardarEstadoProyecto(e) {
  e.preventDefault();

  const nombreEstadoProyecto = document.getElementById("nombreEstadoProyecto").value.trim();

  try {
    const respuesta = await fetch(apiEstadosProyecto, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombreEstadoProyecto })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo guardar el estado");
    }

    document.getElementById("formEstadoProyecto").reset();

    await cargarParametrosProyecto();
    await cargarOpcionesProyecto();

    alert("Estado registrado");
  } catch (error) {
    alert(error.message);
  }
}

function fecha(valor) {
  if (!valor) return "-";
  return String(valor).substring(0, 10);
}

function estadoProyecto(valor) {
  const texto = valor || "Sin estado";
  const estado = texto.toLowerCase();

  if (estado.includes("ejec") || estado.includes("activo") || estado.includes("proceso")) {
    return `<span class="estado azul">${texto}</span>`;
  }

  if (estado.includes("final") || estado.includes("termin") || estado.includes("conclu")) {
    return `<span class="estado verde">${texto}</span>`;
  }

  return `<span class="estado amarillo">${texto}</span>`;
}

function estadoAsignacion(valor) {
  const texto = valor || "Sin estado";
  const estado = texto.toLowerCase();

  if (estado.includes("activo")) {
    return `<span class="estado azul">${texto}</span>`;
  }

  return `<span class="estado verde">${texto}</span>`;
}