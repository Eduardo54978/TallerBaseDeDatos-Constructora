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
    tabla.innerHTML = `<tr><td colspan="6">No se encontraron materiales.</td></tr>`;
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
    `;

    tabla.appendChild(fila);
  });
}

function mostrarInventario(datos) {
  const tabla = document.getElementById("tablaInventario");

  if (!tabla) return;

  tabla.innerHTML = "";

  if (!datos || datos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">No se encontraron registros.</td></tr>`;
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

    document.getElementById("ru-idproyecto").value = "";
    document.getElementById("ru-idmaterial").value = "";
    document.getElementById("ru-cantidad").value = "";
    document.getElementById("ru-costo").value = "";
    document.getElementById("ru-fecha").value = new Date().toISOString().substring(0, 10);

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