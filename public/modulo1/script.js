const apiProyectos = "/api/proyectos";
const apiPersonal  = "/api/empleadoproyecto";

let listaProyectos = [];
let listaPersonal  = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarProyectos();
  cargarPersonal();

  document.getElementById("buscarProyecto").addEventListener("input", e => {
    buscarProyectos(e.target.value);
  });

  document.getElementById("buscarPersonal").addEventListener("input", e => {
    buscarPersonal(e.target.value);
  });
});

function cambiarTab(nombre, boton) {
  document.querySelectorAll(".contenido").forEach(item => item.classList.remove("activo"));
  document.querySelectorAll(".btn-tab").forEach(item => item.classList.remove("activo"));
  document.getElementById(`tab-${nombre}`).classList.add("activo");
  boton.classList.add("activo");
}

async function cargarProyectos() {
  const mensaje = document.getElementById("mensajeProyectos");
  const tabla   = document.getElementById("tablaProyectos");
  try {
    const respuesta = await fetch(apiProyectos);
    const datos     = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || "No se pudieron cargar los proyectos");
    listaProyectos = datos;
    mostrarProyectos(datos);
    contarProyectos(datos);
    mensaje.textContent = `Se cargaron ${datos.length} proyectos correctamente.`;
    mensaje.classList.remove("error");
  } catch (error) {
    tabla.innerHTML = "";
    mensaje.textContent = "Error al cargar proyectos: " + error.message;
    mensaje.classList.add("error");
  }
}

async function cargarPersonal() {
  const mensaje = document.getElementById("mensajePersonal");
  const tabla   = document.getElementById("tablaPersonal");
  try {
    const respuesta = await fetch(apiPersonal);
    const datos     = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || "No se pudo cargar el personal");
    listaPersonal = datos;
    mostrarPersonal(datos);
    contarPersonal(datos);
    mensaje.textContent = `Se cargaron ${datos.length} registros correctamente.`;
    mensaje.classList.remove("error");
  } catch (error) {
    tabla.innerHTML = "";
    mensaje.textContent = "Error al cargar personal: " + error.message;
    mensaje.classList.add("error");
  }
}

function mostrarProyectos(datos) {
  const tabla = document.getElementById("tablaProyectos");
  tabla.innerHTML = "";
  if (datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="8">No se encontraron proyectos.</td></tr>`;
    return;
  }
  datos.forEach(p => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${p.idProyecto}</td>
      <td><strong>${p.nombreProyecto || "-"}</strong><br><small>${p.descripcion || ""}</small></td>
      <td>${p.cliente || "-"}</td>
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
  tabla.innerHTML = "";
  if (datos.length === 0) {
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
  const enEjecucion = datos.filter(p => {
    const estado = (p.nombreEstadoProyecto || "").toLowerCase();
    return estado.includes("ejec") || estado.includes("activo") || estado.includes("proceso");
  }).length;
  document.getElementById("totalProyectos").textContent    = datos.length;
  document.getElementById("proyectosEjecucion").textContent = enEjecucion;
}

function contarPersonal(datos) {
  const activos = datos.filter(p =>
    (p.estadoAsignacion || "").toLowerCase().includes("activo")
  ).length;
  document.getElementById("totalAsignaciones").textContent  = datos.length;
  document.getElementById("asignacionesActivas").textContent = activos;
}

function buscarProyectos(texto) {
  const valor    = texto.toLowerCase();
  const filtrados = listaProyectos.filter(p =>
    String(p.idProyecto).includes(valor) ||
    (p.nombreProyecto       || "").toLowerCase().includes(valor) ||
    (p.descripcion          || "").toLowerCase().includes(valor) ||
    (p.cliente              || "").toLowerCase().includes(valor) ||
    (p.nombreTipoProyecto   || "").toLowerCase().includes(valor) ||
    (p.nombreEstadoProyecto || "").toLowerCase().includes(valor) ||
    (p.ubicacion            || "").toLowerCase().includes(valor)
  );
  mostrarProyectos(filtrados);
}

function buscarPersonal(texto) {
  const valor    = texto.toLowerCase();
  const filtrados = listaPersonal.filter(p =>
    String(p.idEmpleadoProyecto).includes(valor) ||
    (p.empleado           || "").toLowerCase().includes(valor) ||
    (p.ci                 || "").toLowerCase().includes(valor) ||
    (p.nombreCargo        || "").toLowerCase().includes(valor) ||
    (p.nombreProyecto     || "").toLowerCase().includes(valor) ||
    (p.nombreTipoProyecto || "").toLowerCase().includes(valor) ||
    (p.nombreRolProyecto  || "").toLowerCase().includes(valor) ||
    (p.estadoAsignacion   || "").toLowerCase().includes(valor)
  );
  mostrarPersonal(filtrados);
}

function fecha(valor) {
  if (!valor) return "-";
  return String(valor).substring(0, 10);
}

function estadoProyecto(valor) {
  const texto  = valor || "Sin estado";
  const estado = texto.toLowerCase();
  if (estado.includes("ejec") || estado.includes("activo") || estado.includes("proceso"))
    return `<span class="estado azul">${texto}</span>`;
  if (estado.includes("final") || estado.includes("termin") || estado.includes("conclu"))
    return `<span class="estado verde">${texto}</span>`;
  return `<span class="estado amarillo">${texto}</span>`;
}

function estadoAsignacion(valor) {
  const texto  = valor || "Sin estado";
  const estado = texto.toLowerCase();
  if (estado.includes("activo"))
    return `<span class="estado azul">${texto}</span>`;
  return `<span class="estado verde">${texto}</span>`;
}