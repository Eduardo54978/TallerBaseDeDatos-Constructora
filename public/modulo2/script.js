const apiMateriales = "/api/materiales";
const apiInventario = "/api/inventario";
const apiUsos       = "/api/materialproyecto";

let listaMateriales = [];
let listaInventario = [];
let listaUsos       = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarMateriales();
  cargarInventario();
  cargarUsos();

  document.getElementById("buscarMaterial").addEventListener("input", e => {
    buscarMateriales(e.target.value);
  });

  document.getElementById("buscarInventario").addEventListener("input", e => {
    buscarInventario(e.target.value);
  });

  document.getElementById("buscarUso").addEventListener("input", e => {
    buscarUsos(e.target.value);
  });
});

function cambiarTab(nombre, boton) {
  document.querySelectorAll(".contenido").forEach(item => item.classList.remove("activo"));
  document.querySelectorAll(".btn-tab").forEach(item => item.classList.remove("activo"));
  document.getElementById(`tab-${nombre}`).classList.add("activo");
  boton.classList.add("activo");
}

async function cargarMateriales() {
  const mensaje = document.getElementById("mensajeMateriales");
  const tabla   = document.getElementById("tablaMateriales");
  try {
    const respuesta = await fetch(apiMateriales);
    const datos     = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || "No se pudieron cargar los materiales");
    listaMateriales = datos;
    mostrarMateriales(datos);
    document.getElementById("totalMateriales").textContent = datos.length;
    mensaje.textContent = `Se cargaron ${datos.length} materiales correctamente.`;
    mensaje.classList.remove("error");
  } catch (error) {
    tabla.innerHTML = "";
    mensaje.textContent = "Error al cargar materiales: " + error.message;
    mensaje.classList.add("error");
  }
}

async function cargarInventario() {
  const mensaje = document.getElementById("mensajeInventario");
  const tabla   = document.getElementById("tablaInventario");
  try {
    const respuesta = await fetch(apiInventario);
    const datos     = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || "No se pudo cargar el inventario");
    listaInventario = datos;
    mostrarInventario(datos);
    contarInventario(datos);
    mensaje.textContent = `Se cargaron ${datos.length} registros correctamente.`;
    mensaje.classList.remove("error");
  } catch (error) {
    tabla.innerHTML = "";
    mensaje.textContent = "Error al cargar inventario: " + error.message;
    mensaje.classList.add("error");
  }
}

async function cargarUsos() {
  const mensaje = document.getElementById("mensajeUsos");
  const tabla   = document.getElementById("tablaUsos");
  try {
    const respuesta = await fetch(apiUsos);
    const datos     = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || "No se pudieron cargar los registros");
    listaUsos = datos;
    mostrarUsos(datos);
    document.getElementById("totalUsos").textContent = datos.length;
    mensaje.textContent = `Se cargaron ${datos.length} usos correctamente.`;
    mensaje.classList.remove("error");
  } catch (error) {
    tabla.innerHTML = "";
    mensaje.textContent = "Error al cargar registros: " + error.message;
    mensaje.classList.add("error");
  }
}

function mostrarMateriales(datos) {
  const tabla = document.getElementById("tablaMateriales");
  tabla.innerHTML = "";
  if (datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="6">No se encontraron materiales.</td></tr>`;
    return;
  }
  datos.forEach(m => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${m.idMaterial}</td>
      <td><strong>${m.nombreMaterial || "-"}</strong></td>
      <td>${m.nombreTipoMaterial  || "-"}</td>
      <td>${m.nombreUnidadMedida  || "-"}</td>
      <td>${moneda(m.precioUnitario)}</td>
      <td>${m.descripcion         || "-"}</td>
    `;
    tabla.appendChild(fila);
  });
}

function mostrarInventario(datos) {
  const tabla = document.getElementById("tablaInventario");
  tabla.innerHTML = "";
  if (datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">No se encontraron registros.</td></tr>`;
    return;
  }
  datos.forEach(i => {
    const actual = Number(i.stockActual || 0);
    const minimo = Number(i.stockMinimo || 0);
    const fila   = document.createElement("tr");
    fila.innerHTML = `
      <td>${i.idInventario}</td>
      <td><strong>${i.nombreMaterial || "-"}</strong></td>
      <td>${actual}</td>
      <td>${minimo}</td>
      <td>${i.ubicacion || "-"}</td>
      <td>${fecha(i.fechaActualizacion)}</td>
      <td>${estadoStock(actual, minimo)}</td>
    `;
    tabla.appendChild(fila);
  });
}

function mostrarUsos(datos) {
  const tabla = document.getElementById("tablaUsos");
  tabla.innerHTML = "";
  if (datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="8">No se encontraron registros.</td></tr>`;
    return;
  }
  datos.forEach(u => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${u.idMaterialProyecto}</td>
      <td><strong>${u.nombreProyecto    || "-"}</strong></td>
      <td>${u.nombreMaterial            || "-"}</td>
      <td>${u.nombreTipoMaterial        || "-"}</td>
      <td>${u.nombreUnidadMedida        || "-"}</td>
      <td>${u.cantidadUtilizada         || 0}</td>
      <td>${fecha(u.fechaRegistro)}</td>
      <td>${moneda(u.costoTotal)}</td>
    `;
    tabla.appendChild(fila);
  });
}

function contarInventario(datos) {
  const bajos = datos.filter(i =>
    Number(i.stockActual || 0) <= Number(i.stockMinimo || 0)
  ).length;
  document.getElementById("totalInventario").textContent = datos.length;
  document.getElementById("stockBajo").textContent       = bajos;
}

function buscarMateriales(texto) {
  const valor    = texto.toLowerCase();
  const filtrados = listaMateriales.filter(m =>
    String(m.idMaterial).includes(valor) ||
    (m.nombreMaterial    || "").toLowerCase().includes(valor) ||
    (m.nombreTipoMaterial || "").toLowerCase().includes(valor) ||
    (m.nombreUnidadMedida || "").toLowerCase().includes(valor) ||
    (m.descripcion        || "").toLowerCase().includes(valor)
  );
  mostrarMateriales(filtrados);
}

function buscarInventario(texto) {
  const valor    = texto.toLowerCase();
  const filtrados = listaInventario.filter(i =>
    String(i.idInventario).includes(valor) ||
    (i.nombreMaterial || "").toLowerCase().includes(valor) ||
    (i.ubicacion      || "").toLowerCase().includes(valor)
  );
  mostrarInventario(filtrados);
}

function buscarUsos(texto) {
  const valor    = texto.toLowerCase();
  const filtrados = listaUsos.filter(u =>
    String(u.idMaterialProyecto).includes(valor) ||
    (u.nombreProyecto     || "").toLowerCase().includes(valor) ||
    (u.nombreMaterial     || "").toLowerCase().includes(valor) ||
    (u.nombreTipoMaterial || "").toLowerCase().includes(valor) ||
    (u.nombreUnidadMedida || "").toLowerCase().includes(valor)
  );
  mostrarUsos(filtrados);
}

function estadoStock(actual, minimo) {
  if (actual <= minimo)
    return `<span class="estado rojo-estado">Stock bajo</span>`;
  return `<span class="estado verde">Disponible</span>`;
}

function fecha(valor) {
  if (!valor) return "-";
  return String(valor).substring(0, 10);
}

function moneda(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  return `${Number(valor).toFixed(2)} Bs`;
}