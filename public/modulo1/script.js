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
  const formEditarProyecto = document.getElementById("formEditarProyecto");

  if (formEditarProyecto) {
    formEditarProyecto.addEventListener("submit", guardarEdicionProyecto);
  }

  const formAsignar = document.getElementById("formAsignar");
  if (formAsignar) {
    formAsignar.addEventListener("submit", asignarEmpleado);
  }

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
    cargarTablaProyectosEstado();
  }

  if (nombre === "editar") {
    cargarOpcionesEditarProyecto();
  }

  if (nombre === "asignar") {
    cargarRolesAsignar();
    cargarDisponibilidad();
  }
}

async function cargarRolesAsignar() {
  const data = await fetch("/api/empleadoproyecto/roles/lista").then(r => r.json()).catch(() => []);
  const sel = document.getElementById("as-rol");
  if (!sel) return;
  sel.innerHTML = `<option value="">Seleccione...</option>` +
    data.map(r => `<option value="${r.idRolProyecto}">${r.nombreRolProyecto}</option>`).join("");
}

async function cargarDisponibilidad() {
  const data = await fetch("/api/empleadoproyecto/empleados-estado").then(r => r.json()).catch(() => []);
  const tbody = document.getElementById("tablaDisponibilidad");
  if (!tbody) return;
  if (!data.length) { tbody.innerHTML = `<tr><td colspan="4">Sin empleados activos.</td></tr>`; return; }
  tbody.innerHTML = data.map(e => `
    <tr>
      <td>${e.idEmpleado}</td>
      <td>${e.nombreCompleto}</td>
      <td>${e.nombreCargo || '-'}</td>
      <td>${e.disponible ? '<span class="estado verde">Disponible</span>' : '<span class="estado amarillo">Ocupado</span>'}</td>
    </tr>`).join("");
}

async function asignarEmpleado(e) {
  e.preventDefault();
  const mensaje = document.getElementById("mensajeAsignar");
  const body = {
    idProyecto: document.getElementById("as-idproyecto").value,
    idEmpleado: document.getElementById("as-idempleado").value,
    idRolProyecto: document.getElementById("as-rol").value,
    fechaInicio: document.getElementById("as-fechaInicio").value || null,
    fechaFin: document.getElementById("as-fechaFin").value || null
  };
  if (!body.idProyecto) { mensaje.textContent = "Seleccione un proyecto."; mensaje.classList.add("error"); return; }
  if (!body.idEmpleado) { mensaje.textContent = "Seleccione un empleado disponible."; mensaje.classList.add("error"); return; }
  if (!body.idRolProyecto) { mensaje.textContent = "Seleccione el rol."; mensaje.classList.add("error"); return; }
  try {
    const res = await fetch("/api/empleadoproyecto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) { mensaje.textContent = "Error: " + data.error; mensaje.classList.add("error"); return; }
    mensaje.textContent = "Empleado asignado correctamente.";
    mensaje.classList.remove("error");
    document.getElementById("formAsignar").reset();
    ["as-proy-nom", "as-idproyecto", "as-emp-nom", "as-idempleado"].forEach(id => { document.getElementById(id).value = ""; });
    cargarDisponibilidad();
    cargarPersonal();
  } catch (error) {
    mensaje.textContent = "Error de conexion";
    mensaje.classList.add("error");
  }
}

async function cargarTablaProyectosEstado() {
  const tbody = document.getElementById("tablaProyectosEstado");
  if (!tbody) return;
  const datos = ordenarProyectosPorId(listaProyectos);
  if (!datos.length) { tbody.innerHTML = `<tr><td colspan="5">Sin proyectos.</td></tr>`; return; }
  tbody.innerHTML = datos.map(p => `
    <tr>
      <td>${p.idProyecto}</td>
      <td>${p.nombreProyecto || '-'}</td>
      <td>${p.cliente || p.nombreCliente || '-'}</td>
      <td>${estadoProyecto(p.nombreEstadoProyecto)}</td>
      <td><button type="button" class="btn-tab" style="padding:4px 10px;font-size:.78rem;" onclick="seleccionarProyectoEstado(${p.idProyecto}, '${(p.nombreProyecto || '').replace(/'/g, "&#39;")}')">Seleccionar</button></td>
    </tr>`).join("");
}

function seleccionarProyectoEstado(id, nombre) {
  document.getElementById("cambioIdProyecto").value = id;
  document.getElementById("cambio-proy-nom").value = nombre;
  document.getElementById("cambio-proy-nom").scrollIntoView({ behavior: "smooth", block: "center" });
}

let opcionesEditarCargadas = false;

async function cargarOpcionesEditarProyecto() {
  try {
    const respuesta = await fetch(apiOpcionesProyecto);
    const datos = await respuesta.json();
    if (!respuesta.ok) return;

    const tiposOrdenados = ordenarTiposProyectoPorId(datos.tipos);
    const estadosOrdenados = ordenarEstadosProyectoPorId(datos.estados);

    llenarSelect("ep-tipo", tiposOrdenados, "idTipoProyecto", "nombreTipoProyecto");
    llenarSelect("ep-estado", estadosOrdenados, "idEstadoProyecto", "nombreEstadoProyecto");

    const selCliente = document.getElementById("ep-cliente");
    if (selCliente) {
      selCliente.innerHTML = `<option value="">Seleccione...</option>`;
      (datos.clientes || []).forEach(item => {
        const nombre = item.nombreCliente || item.nombre || `Cliente ${item.idCliente}`;
        selCliente.innerHTML += `<option value="${item.idCliente}">${nombre}</option>`;
      });
    }
    opcionesEditarCargadas = true;
  } catch (error) {}
}

async function cargarFormEditarProyecto(idProyecto) {
  if (!opcionesEditarCargadas) {
    await cargarOpcionesEditarProyecto();
  }
  try {
    const respuesta = await fetch(`${apiProyectos}/${idProyecto}`);
    const p = await respuesta.json();
    if (!respuesta.ok) {
      document.getElementById("mensajeEditarProyecto").textContent = p.error || "Error al cargar el proyecto";
      document.getElementById("mensajeEditarProyecto").classList.add("error");
      return;
    }
    document.getElementById("ep-idproyecto").value = p.idProyecto;
    document.getElementById("ep-proy-nom").value = p.nombreProyecto || "";
    document.getElementById("ep-nombre").value = p.nombreProyecto || "";
    document.getElementById("ep-descripcion").value = p.descripcion || "";
    document.getElementById("ep-ubicacion").value = p.ubicacion || "";
    document.getElementById("ep-fechaInicio").value = p.fechaInicio ? String(p.fechaInicio).substring(0, 10) : "";
    document.getElementById("ep-fechaFin").value = p.fechaFinEstimada ? String(p.fechaFinEstimada).substring(0, 10) : "";
    document.getElementById("ep-tipo").value = p.idTipoProyecto || "";
    document.getElementById("ep-cliente").value = p.idCliente || "";
    document.getElementById("ep-estado").value = p.idEstadoProyecto || "";
    document.getElementById("formEditarProyecto").style.display = "grid";
    aplicarReglasEdicion(Number(p.idEstadoProyecto));
  } catch (error) {
    document.getElementById("mensajeEditarProyecto").textContent = "Error de conexion";
    document.getElementById("mensajeEditarProyecto").classList.add("error");
  }
}

function aplicarReglasEdicion(idEstado) {
  const form = document.getElementById("formEditarProyecto");
  const regla = document.getElementById("ep-regla");
  const campos = ["ep-nombre", "ep-tipo", "ep-cliente", "ep-estado", "ep-descripcion", "ep-ubicacion", "ep-fechaInicio", "ep-fechaFin"];
  const btn = form.querySelector("button[type=submit]");

  // Habilitar todo por defecto
  campos.forEach(c => { const el = document.getElementById(c); if (el) el.disabled = false; });
  if (btn) btn.disabled = false;

  if (idEstado === 3) { // Finalizado
    form.style.display = "none";
    regla.textContent = "Este proyecto está FINALIZADO y no se puede editar.";
    regla.style.color = "#c0392b";
    return;
  }

  if (idEstado === 2) { // En ejecución → solo fecha fin estimada
    campos.forEach(c => {
      if (c !== "ep-fechaFin") { const el = document.getElementById(c); if (el) el.disabled = true; }
    });
    regla.textContent = "Proyecto En ejecución: solo puedes modificar la fecha fin estimada.";
    regla.style.color = "#b7791f";
    return;
  }

  // Planificación (1) o Suspendido (4): edición completa
  regla.textContent = "Proyecto editable por completo.";
  regla.style.color = "#276749";
}

async function guardarEdicionProyecto(e) {
  e.preventDefault();
  const id = document.getElementById("ep-idproyecto").value;
  const mensaje = document.getElementById("mensajeEditarProyecto");
  if (!id) {
    mensaje.textContent = "Busque un proyecto primero.";
    mensaje.classList.add("error");
    return;
  }
  const datos = {
    nombreProyecto: document.getElementById("ep-nombre").value.trim(),
    descripcion: document.getElementById("ep-descripcion").value.trim(),
    idTipoProyecto: document.getElementById("ep-tipo").value,
    ubicacion: document.getElementById("ep-ubicacion").value.trim(),
    fechaInicio: document.getElementById("ep-fechaInicio").value || null,
    fechaFinEstimada: document.getElementById("ep-fechaFin").value || null,
    idEstadoProyecto: document.getElementById("ep-estado").value,
    idCliente: document.getElementById("ep-cliente").value
  };
  if (datos.fechaInicio && datos.fechaFinEstimada && datos.fechaFinEstimada <= datos.fechaInicio) {
    mensaje.textContent = "La fecha fin estimada debe ser posterior a la fecha de inicio.";
    mensaje.classList.add("error");
    return;
  }
  try {
    const respuesta = await fetch(`${apiProyectos}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      mensaje.textContent = "Error: " + (resultado.error || "No se pudo actualizar");
      mensaje.classList.add("error");
      return;
    }
    mensaje.textContent = "Proyecto actualizado correctamente.";
    mensaje.classList.remove("error");
    await cargarProyectos();
  } catch (error) {
    mensaje.textContent = "Error de conexion";
    mensaje.classList.add("error");
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
    tabla.innerHTML = `<tr><td colspan="11">No se encontraron registros.</td></tr>`;
    return;
  }

  datos.forEach(p => {
    const fila = document.createElement("tr");
    const activo = (p.estadoAsignacion || "").toLowerCase().includes("activo");
    const accion = activo
      ? `<button class="btn-tab" style="padding:5px 12px;font-size:.78rem;background:#b7791f;color:#fff;border-color:#b7791f;" onclick="finalizarAsignacion(${p.idEmpleadoProyecto}, '${(p.empleado || '').replace(/'/g, "&#39;")}')">Finalizar</button>`
      : '<span style="color:#6B756D;">—</span>';

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
      <td>${accion}</td>
    `;

    tabla.appendChild(fila);
  });
}

async function finalizarAsignacion(id, empleado) {
  if (!confirm(`¿Finalizar la asignación de ${empleado}? Quedará disponible para un nuevo proyecto.`)) return;
  try {
    const res = await fetch(`/api/empleadoproyecto/${id}/finalizar`, { method: "PUT" });
    const data = await res.json();
    if (!res.ok) return alert("Error: " + data.error);
    await cargarPersonal();
    if (typeof cargarDisponibilidad === "function") cargarDisponibilidad();
  } catch (e) {
    alert("Error de conexión");
  }
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

  if (datos.fechaInicio && datos.fechaFinEstimada && datos.fechaFinEstimada < datos.fechaInicio) {
    return alert('La fecha fin estimada no puede ser anterior a la fecha de inicio.');
  }

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
    const nomEl = document.getElementById('cambio-proy-nom');
    if (nomEl) nomEl.value = '';

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