const apiMateriales = "/api/materiales";
const apiInventario = "/api/inventario";
const apiUsos = "/api/materialproyecto";
const apiAlertas = "/api/materialproyecto/alertas";

let listaMateriales = [];
let listaInventario = [];
let listaUsos = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarMateriales();
  cargarInventario();
  cargarUsos();

  const fechaUso = document.getElementById("ru-fecha");

  if (fechaUso) {
    fechaUso.value = new Date().toISOString().substring(0, 10);
  }

  const buscarMaterial = document.getElementById("buscarMaterial");
  const buscarInventarioInput = document.getElementById("buscarInventario");
  const buscarUso = document.getElementById("buscarUso");

  if (buscarMaterial) {
    buscarMaterial.addEventListener("input", e => {
      buscarMateriales(e.target.value);
    });
  }

  if (buscarInventarioInput) {
    buscarInventarioInput.addEventListener("input", e => {
      buscarInventario(e.target.value);
    });
  }

  if (buscarUso) {
    buscarUso.addEventListener("input", e => {
      buscarUsos(e.target.value);
    });
  }
});

function cambiarTab(nombre, boton) {
  document.querySelectorAll(".contenido").forEach(item => item.classList.remove("activo"));
  document.querySelectorAll(".btn-tab").forEach(item => item.classList.remove("activo"));

  const tab = document.getElementById(`tab-${nombre}`);

  if (tab) {
    tab.classList.add("activo");
  }

  if (boton) {
    boton.classList.add("activo");
  }

  if (nombre === "inventario") {
    cargarInventario();
  }

  if (nombre === "usos") {
    cargarUsos();
  }

  if (nombre === "alertas") {
    cargarAlertas();
  }

  if (nombre === "nuevo-material") {
    cargarSelectsMaterial("nm-tipo", "nm-unidad");
  }

  if (nombre === "editar-material") {
    cargarSelectsMaterial("em-tipo", "em-unidad");
  }
}

async function cargarSelectsMaterial(idTipo, idUnidad, tipoSel, unidadSel) {
  const [tipos, unidades] = await Promise.all([
    fetch(`${apiMateriales}/tipos/lista`).then(r => r.json()).catch(() => []),
    fetch(`${apiMateriales}/unidades/lista`).then(r => r.json()).catch(() => [])
  ]);
  const selT = document.getElementById(idTipo);
  const selU = document.getElementById(idUnidad);
  if (selT) selT.innerHTML = '<option value="">-- Tipo --</option>' +
    tipos.map(t => `<option value="${t.idTipoMaterial}" ${t.idTipoMaterial === tipoSel ? 'selected' : ''}>${t.nombreTipoMaterial}</option>`).join("");
  if (selU) selU.innerHTML = '<option value="">-- Unidad --</option>' +
    unidades.map(u => `<option value="${u.idUnidadMedida}" ${u.idUnidadMedida === unidadSel ? 'selected' : ''}>${u.nombreUnidadMedida}</option>`).join("");
}

function mensajeEl(id, texto, esError) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = texto;
  el.classList.toggle("error", !!esError);
}

async function registrarMaterial() {
  const body = {
    nombreMaterial: document.getElementById("nm-nombre").value.trim(),
    idTipoMaterial: parseInt(document.getElementById("nm-tipo").value),
    idUnidadMedida: parseInt(document.getElementById("nm-unidad").value),
    precioUnitario: parseFloat(document.getElementById("nm-precio").value),
    descripcion: document.getElementById("nm-desc").value.trim()
  };
  if (!body.nombreMaterial || !body.idTipoMaterial || !body.idUnidadMedida || Number.isNaN(body.precioUnitario)) {
    return mensajeEl("msg-nuevo-material", "Complete nombre, tipo, unidad y precio.", true);
  }
  try {
    const res = await fetch(apiMateriales, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return mensajeEl("msg-nuevo-material", "Error: " + data.error, true);
    mensajeEl("msg-nuevo-material", "Material registrado con ID: " + data.idMaterial, false);
    ["nm-nombre", "nm-precio", "nm-desc"].forEach(id => { document.getElementById(id).value = ""; });
    document.getElementById("nm-tipo").value = "";
    document.getElementById("nm-unidad").value = "";
    await cargarMateriales();
  } catch (e) {
    mensajeEl("msg-nuevo-material", "Error de conexion", true);
  }
}

function editarMaterialDesdeTabla(id) {
  document.querySelectorAll(".contenido").forEach(s => s.classList.remove("activo"));
  document.querySelectorAll(".btn-tab").forEach(b => b.classList.remove("activo"));
  document.getElementById("tab-editar-material").classList.add("activo");
  const btn = Array.from(document.querySelectorAll(".btn-tab")).find(b => b.getAttribute("onclick") && b.getAttribute("onclick").includes("editar-material"));
  if (btn) btn.classList.add("activo");
  cargarFormEditarMaterial(id);
}

async function cargarFormEditarMaterial(id) {
  try {
    const data = await fetch(`${apiMateriales}/${id}`).then(r => r.json());
    if (data.error) { mensajeEl("msg-editar-material", data.error, true); return; }
    document.getElementById("em-idmaterial").value = data.idMaterial;
    document.getElementById("em-mat-nom").value = data.nombreMaterial || "";
    document.getElementById("em-nombre").value = data.nombreMaterial || "";
    document.getElementById("em-precio").value = data.precioUnitario || "";
    document.getElementById("em-desc").value = data.descripcion || "";
    await cargarSelectsMaterial("em-tipo", "em-unidad", data.idTipoMaterial, data.idUnidadMedida);
    document.getElementById("form-editar-material").style.display = "block";
  } catch (e) {
    mensajeEl("msg-editar-material", "Error al cargar el material", true);
  }
}

async function guardarEdicionMaterial() {
  const id = document.getElementById("em-idmaterial").value;
  if (!id) return mensajeEl("msg-editar-material", "Busque un material primero.", true);
  const body = {
    nombreMaterial: document.getElementById("em-nombre").value.trim(),
    idTipoMaterial: parseInt(document.getElementById("em-tipo").value),
    idUnidadMedida: parseInt(document.getElementById("em-unidad").value),
    precioUnitario: parseFloat(document.getElementById("em-precio").value),
    descripcion: document.getElementById("em-desc").value.trim()
  };
  if (!body.nombreMaterial || !body.idTipoMaterial || !body.idUnidadMedida || Number.isNaN(body.precioUnitario)) {
    return mensajeEl("msg-editar-material", "Complete nombre, tipo, unidad y precio.", true);
  }
  try {
    const res = await fetch(`${apiMateriales}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return mensajeEl("msg-editar-material", "Error: " + data.error, true);
    mensajeEl("msg-editar-material", "Material actualizado correctamente", false);
    await cargarMateriales();
  } catch (e) {
    mensajeEl("msg-editar-material", "Error de conexion", true);
  }
}

async function eliminarMaterialDesdeForm() {
  const id = document.getElementById("em-idmaterial").value;
  if (!id) return mensajeEl("msg-editar-material", "Busque un material primero.", true);
  await eliminarMaterial(id, "msg-editar-material");
  document.getElementById("form-editar-material").style.display = "none";
  document.getElementById("em-mat-nom").value = "";
  document.getElementById("em-idmaterial").value = "";
}

async function eliminarMaterial(id, msgId) {
  if (!confirm(`Esta seguro de eliminar el material ID ${id}? Esta accion no se puede deshacer.`)) return;
  try {
    const res = await fetch(`${apiMateriales}/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      if (msgId) mensajeEl(msgId, "Error: " + data.error, true);
      else alert("Error: " + data.error);
      return;
    }
    if (msgId) mensajeEl(msgId, "Material eliminado correctamente", false);
    await cargarMateriales();
  } catch (e) {
    if (msgId) mensajeEl(msgId, "Error de conexion", true);
    else alert("Error de conexion");
  }
}

async function crearInventario() {
  const body = {
    idMaterial: parseInt(document.getElementById("ni-idmaterial").value),
    stockActual: parseFloat(document.getElementById("ni-stock").value),
    stockMinimo: parseFloat(document.getElementById("ni-minimo").value),
    ubicacion: document.getElementById("ni-ubicacion").value.trim()
  };
  if (!body.idMaterial || Number.isNaN(body.stockActual) || Number.isNaN(body.stockMinimo)) {
    return mensajeEl("msg-nuevo-inv", "Seleccione material e ingrese stock actual y minimo.", true);
  }
  try {
    const res = await fetch(apiInventario, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return mensajeEl("msg-nuevo-inv", "Error: " + data.error, true);
    mensajeEl("msg-nuevo-inv", "Registro creado con ID: " + data.idInventario, false);
    ["ni-mat-nom", "ni-idmaterial", "ni-stock", "ni-minimo", "ni-ubicacion"].forEach(id => { document.getElementById(id).value = ""; });
    await cargarInventario();
  } catch (e) {
    mensajeEl("msg-nuevo-inv", "Error de conexion", true);
  }
}

function ajustarInventario(idInv, nombre, stock, minimo, ubicacion) {
  document.querySelectorAll(".contenido").forEach(s => s.classList.remove("activo"));
  document.querySelectorAll(".btn-tab").forEach(b => b.classList.remove("activo"));
  document.getElementById("tab-gestionar-stock").classList.add("activo");
  const btn = Array.from(document.querySelectorAll(".btn-tab")).find(b => b.getAttribute("onclick") && b.getAttribute("onclick").includes("gestionar-stock"));
  if (btn) btn.classList.add("activo");
  document.getElementById("ei-idinv").value = idInv;
  document.getElementById("ei-mat-nom").value = nombre;
  document.getElementById("ei-stock").value = stock;
  document.getElementById("ei-minimo").value = minimo;
  document.getElementById("ei-ubicacion").value = ubicacion;
  document.getElementById("form-editar-inv").style.display = "block";
  document.getElementById("hint-editar-inv").style.display = "none";
}

async function cargarComparativo(idProyecto) {
  const cont = document.getElementById("contenedorComparativo");
  const mensaje = document.getElementById("mensajeComparativo");
  if (!idProyecto) return;
  try {
    const data = await fetch(`${apiUsos}/comparativo/${idProyecto}`).then(r => r.json());
    if (!Array.isArray(data) || data.length === 0) {
      mensaje.textContent = "Este proyecto no tiene materiales cotizados ni usados.";
      cont.innerHTML = "";
      return;
    }
    mensaje.textContent = "";
    cont.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Cant. cotizada</th>
            <th>Costo cotizado</th>
            <th>Cant. gastada</th>
            <th>Costo gastado</th>
            <th>Diferencia costo</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(r => {
            const dif = Number(r.diferenciaCosto || 0);
            const color = dif > 0 ? "#c0392b" : (dif < 0 ? "#276749" : "#6b756d");
            const signo = dif > 0 ? "+" : "";
            const etiqueta = dif > 0 ? " (excedido)" : (dif < 0 ? " (ahorro)" : "");
            return `<tr>
              <td><strong>${r.nombreMaterial}</strong></td>
              <td>${Number(r.cantidadCotizada).toFixed(2)}</td>
              <td>${moneda(r.costoCotizado)}</td>
              <td>${Number(r.cantidadGastada).toFixed(2)}</td>
              <td>${moneda(r.costoGastado)}</td>
              <td style="color:${color};font-weight:600;">${signo}${moneda(dif)}${etiqueta}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>`;
  } catch (e) {
    mensaje.textContent = "Error al cargar el comparativo.";
    mensaje.classList.add("error");
    cont.innerHTML = "";
  }
}

async function guardarEdicionInventario() {
  const id = document.getElementById("ei-idinv").value;
  if (!id) return mensajeEl("msg-editar-inv", "Seleccione un registro de la tabla.", true);
  const body = {
    stockActual: parseFloat(document.getElementById("ei-stock").value),
    stockMinimo: parseFloat(document.getElementById("ei-minimo").value),
    ubicacion: document.getElementById("ei-ubicacion").value.trim()
  };
  if (Number.isNaN(body.stockActual) || Number.isNaN(body.stockMinimo)) {
    return mensajeEl("msg-editar-inv", "Ingrese stock actual y minimo.", true);
  }
  try {
    const res = await fetch(`${apiInventario}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return mensajeEl("msg-editar-inv", "Error: " + data.error, true);
    mensajeEl("msg-editar-inv", "Inventario actualizado correctamente", false);
    await cargarInventario();
    await cargarAlertas();
  } catch (e) {
    mensajeEl("msg-editar-inv", "Error de conexion", true);
  }
}

function ordenarMaterialesPorId(datos) {
  return [...(datos || [])].sort((a, b) => Number(a.idMaterial) - Number(b.idMaterial));
}

function ordenarInventarioPorId(datos) {
  return [...(datos || [])].sort((a, b) => Number(a.idInventario) - Number(b.idInventario));
}

function ordenarUsosPorId(datos) {
  return [...(datos || [])].sort((a, b) => Number(a.idMaterialProyecto) - Number(b.idMaterialProyecto));
}

async function cargarMateriales() {
  const mensaje = document.getElementById("mensajeMateriales");
  const tabla = document.getElementById("tablaMateriales");

  try {
    const respuesta = await fetch(apiMateriales);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudieron cargar los materiales");
    }

    const datosOrdenados = ordenarMaterialesPorId(datos);

    listaMateriales = datosOrdenados;
    mostrarMateriales(datosOrdenados);

    const totalMateriales = document.getElementById("totalMateriales");

    if (totalMateriales) {
      totalMateriales.textContent = datosOrdenados.length;
    }

    if (mensaje) {
      mensaje.textContent = `Se cargaron ${datosOrdenados.length} materiales correctamente.`;
      mensaje.classList.remove("error");
    }
  } catch (error) {
    if (tabla) {
      tabla.innerHTML = "";
    }

    if (mensaje) {
      mensaje.textContent = "Error al cargar materiales: " + error.message;
      mensaje.classList.add("error");
    }
  }
}

async function cargarInventario() {
  const mensaje = document.getElementById("mensajeInventario");
  const tabla = document.getElementById("tablaInventario");

  try {
    const respuesta = await fetch(apiInventario);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudo cargar el inventario");
    }

    const datosOrdenados = ordenarInventarioPorId(datos);

    listaInventario = datosOrdenados;
    mostrarInventario(datosOrdenados);
    contarInventario(datosOrdenados);

    if (mensaje) {
      mensaje.textContent = `Se cargaron ${datosOrdenados.length} registros correctamente.`;
      mensaje.classList.remove("error");
    }
  } catch (error) {
    if (tabla) {
      tabla.innerHTML = "";
    }

    if (mensaje) {
      mensaje.textContent = "Error al cargar inventario: " + error.message;
      mensaje.classList.add("error");
    }
  }
}

async function cargarUsos() {
  const mensaje = document.getElementById("mensajeUsos");
  const tabla = document.getElementById("tablaUsos");

  try {
    const respuesta = await fetch(apiUsos);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudieron cargar los registros");
    }

    const datosOrdenados = ordenarUsosPorId(datos);

    listaUsos = datosOrdenados;
    mostrarUsos(datosOrdenados);

    const totalUsos = document.getElementById("totalUsos");

    if (totalUsos) {
      totalUsos.textContent = datosOrdenados.length;
    }

    if (mensaje) {
      mensaje.textContent = `Se cargaron ${datosOrdenados.length} usos correctamente.`;
      mensaje.classList.remove("error");
    }
  } catch (error) {
    if (tabla) {
      tabla.innerHTML = "";
    }

    if (mensaje) {
      mensaje.textContent = "Error al cargar registros: " + error.message;
      mensaje.classList.add("error");
    }
  }
}

async function cargarAlertas() {
  const mensaje = document.getElementById("mensajeAlertas");
  const contenedor = document.getElementById("contenedorAlertas");

  try {
    const respuesta = await fetch(apiAlertas);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudieron cargar las alertas");
    }

    if (!datos || datos.length === 0) {
      if (mensaje) {
        mensaje.textContent = "No hay alertas registradas.";
      }

      if (contenedor) {
        contenedor.innerHTML = "";
      }

      return;
    }

    const columnas = Object.keys(datos[0]);

    if (mensaje) {
      mensaje.textContent = `Se cargaron ${datos.length} alertas.`;
      mensaje.classList.remove("error");
    }

    if (contenedor) {
      contenedor.innerHTML = `
        <table>
          <thead>
            <tr>
              ${columnas.map(c => `<th>${c}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${datos.map(item => `<tr>
              ${columnas.map(c => `<td>${formatearValor(item[c])}</td>`).join("")}
            </tr>`).join("")}
          </tbody>
        </table>
      `;
    }
  } catch (error) {
    if (mensaje) {
      mensaje.textContent = "Error al cargar alertas: " + error.message;
      mensaje.classList.add("error");
    }

    if (contenedor) {
      contenedor.innerHTML = "";
    }
  }
}

function mostrarMateriales(datos) {
  const tabla = document.getElementById("tablaMateriales");

  if (!tabla) return;

  tabla.innerHTML = "";

  if (!datos || datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">No se encontraron materiales.</td></tr>`;
    return;
  }

  datos.forEach(m => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${m.idMaterial}</td>
      <td><strong>${m.nombreMaterial || "-"}</strong></td>
      <td>${m.nombreTipoMaterial || "-"}</td>
      <td>${m.nombreUnidadMedida || "-"}</td>
      <td>${moneda(m.precioUnitario)}</td>
      <td>${m.descripcion || "-"}</td>
      <td>
        <button class="btn btn-accent" style="padding:5px 12px;font-size:.78rem;" onclick="editarMaterialDesdeTabla(${m.idMaterial})">Editar</button>
        <button class="btn btn-red" style="padding:5px 12px;font-size:.78rem;" onclick="eliminarMaterial(${m.idMaterial})">Eliminar</button>
      </td>
    `;

    tabla.appendChild(fila);
  });
}

function mostrarInventario(datos) {
  const tabla = document.getElementById("tablaInventario");

  if (!tabla) return;

  tabla.innerHTML = "";

  if (!datos || datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="8">No se encontraron registros.</td></tr>`;
    return;
  }

  datos.forEach(i => {
    const actual = Number(i.stockActual || 0);
    const minimo = Number(i.stockMinimo || 0);
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${i.idInventario}</td>
      <td><strong>${i.nombreMaterial || "-"}</strong></td>
      <td>${actual}</td>
      <td>${minimo}</td>
      <td>${i.ubicacion || "-"}</td>
      <td>${fecha(i.fechaActualizacion)}</td>
      <td>${estadoStock(actual, minimo)}</td>
      <td>
        <button class="btn btn-accent" style="padding:5px 12px;font-size:.78rem;" onclick="ajustarInventario(${i.idInventario}, '${(i.nombreMaterial || '').replace(/'/g, "&#39;")}', ${actual}, ${minimo}, '${(i.ubicacion || '').replace(/'/g, "&#39;")}')">Ajustar</button>
      </td>
    `;

    tabla.appendChild(fila);
  });
}

function mostrarUsos(datos) {
  const tabla = document.getElementById("tablaUsos");

  if (!tabla) return;

  tabla.innerHTML = "";

  if (!datos || datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="8">No se encontraron registros.</td></tr>`;
    return;
  }

  datos.forEach(u => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${u.idMaterialProyecto}</td>
      <td><strong>${u.nombreProyecto || "-"}</strong></td>
      <td>${u.nombreMaterial || "-"}</td>
      <td>${u.nombreTipoMaterial || "-"}</td>
      <td>${u.nombreUnidadMedida || "-"}</td>
      <td>${u.cantidadUtilizada || 0}</td>
      <td>${fecha(u.fechaRegistro)}</td>
      <td>${moneda(u.costoTotal)}</td>
    `;

    tabla.appendChild(fila);
  });
}

// Ayuda en "Registrar uso": al elegir el material muestra su precio unitario
// y el stock disponible, y sugiere el costo total (cantidad × precio).
let _matUsoPrecio = 0;

async function onSelMaterialUso(idMaterial) {
  const info = document.getElementById("ru-mat-info");
  _matUsoPrecio = 0;
  if (!info) return;
  if (!idMaterial) { info.textContent = ""; return; }
  info.textContent = "Buscando precio y stock...";
  try {
    const [mat, inventario] = await Promise.all([
      fetch(`${API}/materiales/${idMaterial}`).then(r => r.json()),
      fetch(`${API}/inventario`).then(r => r.json()).catch(() => []),
    ]);
    _matUsoPrecio = Number(mat.precioUnitario || 0);
    const inv = (Array.isArray(inventario) ? inventario : []).find(i => i.idMaterial === Number(idMaterial));
    const stock = inv ? Number(inv.stockActual) : null;
    info.style.color = "#276749";
    info.textContent = `Precio unitario: Bs ${_matUsoPrecio.toFixed(2)}` +
      (stock != null ? ` · Stock disponible: ${stock}` : ' · Sin registro de inventario');
    sugerirCostoUso();
  } catch (e) {
    info.textContent = "";
  }
}

function sugerirCostoUso() {
  const cant = parseFloat(document.getElementById("ru-cantidad").value);
  const costoEl = document.getElementById("ru-costo");
  const aviso = document.getElementById("ru-stock-aviso");
  if (!Number.isNaN(cant) && _matUsoPrecio > 0 && costoEl) {
    costoEl.value = (cant * _matUsoPrecio).toFixed(2);
  }
  // Aviso de stock si la cantidad supera lo disponible.
  if (aviso) {
    const info = document.getElementById("ru-mat-info")?.textContent || "";
    const m = /Stock disponible: ([\d.]+)/.exec(info);
    if (m && !Number.isNaN(cant) && cant > Number(m[1])) {
      aviso.style.color = "#b91c1c";
      aviso.textContent = `Atención: la cantidad supera el stock disponible (${m[1]}).`;
    } else {
      aviso.textContent = "";
    }
  }
}

async function registrarUsoMaterial() {
  const idProyecto = parseInt(document.getElementById("ru-idproyecto").value);
  const idMaterial = parseInt(document.getElementById("ru-idmaterial").value);
  const cantidadUtilizada = parseFloat(document.getElementById("ru-cantidad").value);
  const costoTotal = parseFloat(document.getElementById("ru-costo").value);
  const fechaRegistro = document.getElementById("ru-fecha").value;

  const mensaje = document.getElementById("msg-registrar-uso");

  if (!idProyecto || !idMaterial || Number.isNaN(cantidadUtilizada) || Number.isNaN(costoTotal) || !fechaRegistro) {
    if (mensaje) {
      mensaje.textContent = "Complete todos los campos.";
      mensaje.classList.add("error");
    }
    return;
  }

  try {
    const respuesta = await fetch(apiUsos, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idProyecto,
        idMaterial,
        cantidadUtilizada,
        fechaRegistro,
        costoTotal
      })
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.error || "No se pudo registrar el uso");
    }

    if (mensaje) {
      mensaje.textContent = `Uso registrado con ID: ${data.idMaterialProyecto}`;
      mensaje.classList.remove("error");
    }

    document.getElementById("ru-proy-nom").value = "";
    document.getElementById("ru-idproyecto").value = "";
    document.getElementById("ru-mat-nom").value = "";
    document.getElementById("ru-idmaterial").value = "";
    document.getElementById("ru-cantidad").value = "";
    document.getElementById("ru-costo").value = "";
    document.getElementById("ru-fecha").value = new Date().toISOString().substring(0, 10);
    _matUsoPrecio = 0;
    const ruInfo = document.getElementById("ru-mat-info"); if (ruInfo) ruInfo.textContent = "";
    const ruAviso = document.getElementById("ru-stock-aviso"); if (ruAviso) ruAviso.textContent = "";

    await cargarInventario();
    await cargarUsos();
    await cargarAlertas();
  } catch (error) {
    if (mensaje) {
      mensaje.textContent = "Error: " + error.message;
      mensaje.classList.add("error");
    }
  }
}

function contarInventario(datos) {
  const bajos = datos.filter(i => Number(i.stockActual || 0) <= Number(i.stockMinimo || 0)).length;

  const totalInventario = document.getElementById("totalInventario");
  const stockBajo = document.getElementById("stockBajo");

  if (totalInventario) {
    totalInventario.textContent = datos.length;
  }

  if (stockBajo) {
    stockBajo.textContent = bajos;
  }
}

function buscarMateriales(texto) {
  const valor = texto.toLowerCase();

  const filtrados = listaMateriales.filter(m => {
    return (
      String(m.idMaterial).includes(valor) ||
      (m.nombreMaterial || "").toLowerCase().includes(valor) ||
      (m.nombreTipoMaterial || "").toLowerCase().includes(valor) ||
      (m.nombreUnidadMedida || "").toLowerCase().includes(valor) ||
      (m.descripcion || "").toLowerCase().includes(valor)
    );
  });

  mostrarMateriales(ordenarMaterialesPorId(filtrados));
}

function buscarInventario(texto) {
  const valor = texto.toLowerCase();

  const filtrados = listaInventario.filter(i => {
    return (
      String(i.idInventario).includes(valor) ||
      (i.nombreMaterial || "").toLowerCase().includes(valor) ||
      (i.ubicacion || "").toLowerCase().includes(valor)
    );
  });

  mostrarInventario(ordenarInventarioPorId(filtrados));
}

function buscarUsos(texto) {
  const valor = texto.toLowerCase();

  const filtrados = listaUsos.filter(u => {
    return (
      String(u.idMaterialProyecto).includes(valor) ||
      (u.nombreProyecto || "").toLowerCase().includes(valor) ||
      (u.nombreMaterial || "").toLowerCase().includes(valor) ||
      (u.nombreTipoMaterial || "").toLowerCase().includes(valor) ||
      (u.nombreUnidadMedida || "").toLowerCase().includes(valor)
    );
  });

  mostrarUsos(ordenarUsosPorId(filtrados));
}

function estadoStock(actual, minimo) {
  if (actual <= minimo) {
    return `<span class="estado rojo-estado">Stock bajo</span>`;
  }

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

function formatearValor(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";

  if (typeof valor === "string" && valor.includes("T")) {
    return valor.substring(0, 10);
  }

  return valor;
}