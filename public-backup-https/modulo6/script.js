
// Se usa una ruta relativa para que funcione tanto con HTTP como con HTTPS.
const API = '/api';

// Información del último catálogo consultado.
// Se utiliza posteriormente para generar el archivo PDF.
let catalogoActual = [];
let proveedorCatalogoActual = '';
let idProveedorCatalogoActual = null;

function ordenarPorNumero(datos, campo) {
  return [...(datos || [])].sort(
    (a, b) => Number(a[campo] || 0) - Number(b[campo] || 0)
  );
}

function escaparHTML(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatearMoneda(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  document.querySelectorAll('.tab-btn').forEach(button => {
    button.classList.remove('active');
  });

  const tab = document.getElementById('tab-' + name);

  if (tab) {
    tab.classList.add('active');
  }

  if (btn) {
    btn.classList.add('active');
  }

  if (name === 'lista') {
    cargarProveedores();
  }
}

function filtrarTabla(id, texto) {
  const tabla = document.getElementById(id);

  if (!tabla) return;

  const consulta = String(texto || '').toLowerCase();

  tabla.querySelectorAll('tbody tr').forEach(fila => {
    const coincide = fila.innerText.toLowerCase().includes(consulta);
    fila.style.display = coincide ? '' : 'none';
  });
}

function msg(id, texto, tipo) {
  const elemento = document.getElementById(id);

  if (!elemento) return;

  elemento.className = 'msg ' + tipo;
  elemento.textContent = texto;

  setTimeout(() => {
    elemento.className = 'msg';
    elemento.textContent = '';
  }, 4000);
}

async function obtenerJSON(url, opciones = {}) {
  const respuesta = await fetch(url, opciones);

  let datos;

  try {
    datos = await respuesta.json();
  } catch {
    datos = {};
  }

  if (!respuesta.ok) {
    throw new Error(
      datos.error ||
      datos.message ||
      `Error HTTP ${respuesta.status}`
    );
  }

  return datos;
}

// =====================================================
// LISTA DE PROVEEDORES
// =====================================================

async function cargarProveedores() {
  const contenedor = document.getElementById('cont-proveedores');

  try {
    const data = await obtenerJSON(`${API}/proveedores`);
    const ordenados = ordenarPorNumero(data, 'idProveedor');

    const ciudades = new Set(
      ordenados
        .map(proveedor => proveedor.ciudad)
        .filter(Boolean)
    );

    const conEmail = ordenados.filter(
      proveedor => proveedor.email
    ).length;

    if (typeof renderStatsCards === 'function') {
      renderStatsCards('prov-stats', [
        {
          n: ordenados.length,
          l: 'Proveedores'
        },
        {
          n: ciudades.size,
          l: 'Ciudades'
        },
        {
          n: conEmail,
          l: 'Con email'
        }
      ]);
    }

    if (ordenados.length === 0) {
      contenedor.innerHTML = '<p>No existen proveedores registrados.</p>';
      return;
    }

    contenedor.innerHTML = `
      <table id="tbl-prov">
        <thead>
          <tr>
            <th>ID</th>
            <th>Proveedor</th>
            <th>Celular</th>
            <th>Email</th>
            <th>Ubicación</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          ${ordenados.map(proveedor => {
            const ubicacion = proveedor.ciudad
              ? `${proveedor.ciudad}, ${proveedor.pais || ''}`
              : proveedor.pais || '-';

            return `
              <tr>
                <td>${proveedor.idProveedor}</td>

                <td>
                  <b>${escaparHTML(proveedor.nombreProveedor)}</b>
                </td>

                <td>
                  ${escaparHTML(proveedor.numCelular || '-')}
                </td>

                <td>
                  ${escaparHTML(proveedor.email || '-')}
                </td>

                <td>
                  ${escaparHTML(ubicacion)}
                </td>

                <td>
                  <button
                    class="btn btn-red"
                    style="padding:5px 10px;font-size:.75rem;"
                    onclick="eliminarProveedor(${proveedor.idProveedor})"
                  >
                    Desactivar
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    contenedor.innerHTML = `
      <p style="color:#922b21;">
        Error al cargar proveedores: ${escaparHTML(error.message)}
      </p>
    `;
  }
}

// =====================================================
// REGISTRAR PROVEEDOR
// =====================================================

async function registrarProveedor() {
  const body = {
    nombreProveedor:
      document.getElementById('p-nombre').value.trim(),

    numCelular:
      document.getElementById('p-cel').value.trim(),

    email:
      document.getElementById('p-email').value.trim(),

    ciudad:
      document.getElementById('p-ciudad').value.trim(),

    pais:
      document.getElementById('p-pais').value.trim(),

    direccion:
      document.getElementById('p-dir').value.trim()
  };

  if (!body.nombreProveedor) {
    msg(
      'msg-prov',
      'El nombre del proveedor es obligatorio.',
      'err'
    );

    return;
  }

  try {
    const data = await obtenerJSON(`${API}/proveedores`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(body)
    });

    msg(
      'msg-prov',
      `Proveedor registrado exitosamente con ID: ${data.idProveedor}`,
      'ok'
    );

    document
      .querySelectorAll('#tab-registrar input')
      .forEach(input => {
        input.value = '';
      });

    cargarProveedores();
  } catch (error) {
    msg(
      'msg-prov',
      `Error: ${error.message}`,
      'err'
    );
  }
}

// =====================================================
// ELIMINAR O DESACTIVAR PROVEEDOR
// =====================================================

async function eliminarProveedor(id) {
  const confirmar = confirm(
    `¿Está seguro de desactivar/eliminar el proveedor ID ${id}?`
  );

  if (!confirmar) return;

  try {
    await obtenerJSON(`${API}/proveedores/${id}`, {
      method: 'DELETE'
    });

    msg(
      'msg-lista',
      'Proveedor desactivado correctamente.',
      'ok'
    );

    cargarProveedores();
  } catch (error) {
    msg(
      'msg-lista',
      `Error: ${error.message}`,
      'err'
    );
  }
}

// =====================================================
// ASIGNAR MATERIAL AL PROVEEDOR
// =====================================================

async function asignarMaterial() {
  const body = {
    idProveedor: parseInt(
      document.getElementById('pm-idprov').value,
      10
    ),

    idMaterial: parseInt(
      document.getElementById('pm-idmat').value,
      10
    ),

    precioProveedor: parseFloat(
      document.getElementById('pm-precio').value
    ),

    tiempoEntrega:
      parseInt(
        document.getElementById('pm-tiempo').value,
        10
      ) || null
  };

  if (!body.idProveedor) {
    msg(
      'msg-pm',
      'Seleccione un proveedor de la lista.',
      'err'
    );

    return;
  }

  if (!body.idMaterial) {
    msg(
      'msg-pm',
      'Seleccione un material de la lista.',
      'err'
    );

    return;
  }

  if (
    Number.isNaN(body.precioProveedor) ||
    body.precioProveedor <= 0
  ) {
    msg(
      'msg-pm',
      'Ingrese un precio válido mayor a cero.',
      'err'
    );

    return;
  }

  try {
    await obtenerJSON(`${API}/proveedormaterial`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(body)
    });

    msg(
      'msg-pm',
      'Material asignado exitosamente al catálogo.',
      'ok'
    );

    document.getElementById('pm-idmat').value = '';
    document.getElementById('pm-precio').value = '';
    document.getElementById('pm-tiempo').value = '';

    const nombreMaterial =
      document.getElementById('pm-mat-nom');

    if (nombreMaterial) {
      nombreMaterial.value = '';
    }

    const referencia =
      document.getElementById('pm-mat-ref');

    if (referencia) {
      referencia.textContent = '';
    }
  } catch (error) {
    msg(
      'msg-pm',
      `Error: ${error.message}`,
      'err'
    );
  }
}

// =====================================================
// PRECIO DE REFERENCIA DEL MATERIAL
// =====================================================

async function onSelMaterialProv(idMaterial) {
  const referencia =
    document.getElementById('pm-mat-ref');

  if (!referencia) return;

  if (!idMaterial) {
    referencia.textContent = '';
    return;
  }

  referencia.textContent =
    'Buscando precio de referencia...';

  try {
    const material = await obtenerJSON(
      `${API}/materiales/${idMaterial}`
    );

    const precio = Number(
      material.precioUnitario || 0
    );

    referencia.style.color = '#276749';

    referencia.textContent =
      `Precio base de catálogo: Bs ${formatearMoneda(precio)} ` +
      '(referencia).';

    const inputPrecio =
      document.getElementById('pm-precio');

    if (inputPrecio && !inputPrecio.value) {
      inputPrecio.value = precio.toFixed(2);
    }
  } catch {
    referencia.textContent = '';
  }
}

// =====================================================
// LIMPIAR CATÁLOGO AL CAMBIAR PROVEEDOR
// =====================================================

function limpiarCatalogoSeleccionado() {
  catalogoActual = [];
  proveedorCatalogoActual = '';
  idProveedorCatalogoActual = null;

  const botonPDF =
    document.getElementById('btn-descargar-catalogo');

  if (botonPDF) {
    botonPDF.style.display = 'none';
  }

  const contenedor =
    document.getElementById('cont-catalogo');

  if (contenedor) {
    contenedor.innerHTML = '';
  }
}

// =====================================================
// CONSULTAR MATERIALES DEL PROVEEDOR
// =====================================================

async function consultarMateriales() {
  const idProveedor = document
    .getElementById('con-idprov')
    .value
    .trim();

  const nombreProveedor = document
    .getElementById('con-prov-nom')
    .value
    .trim();

  const contenedor =
    document.getElementById('cont-catalogo');

  const botonPDF =
    document.getElementById('btn-descargar-catalogo');

  botonPDF.style.display = 'none';

  catalogoActual = [];
  proveedorCatalogoActual = '';
  idProveedorCatalogoActual = null;

  if (!idProveedor) {
    contenedor.innerHTML = '';

    msg(
      'msg-catalogo',
      'Seleccione un proveedor de las opciones mostradas.',
      'err'
    );

    return;
  }

  contenedor.innerHTML = '<p>Consultando catálogo...</p>';

  try {
    const data = await obtenerJSON(
      `${API}/proveedores/${idProveedor}/materiales`
    );

    if (!Array.isArray(data) || data.length === 0) {
      contenedor.innerHTML = `
        <div class="catalog-summary">
          <div>
            <h4>${escaparHTML(nombreProveedor || 'Proveedor')}</h4>

            <p>
              El proveedor todavía no tiene materiales en su catálogo.
            </p>
          </div>

          <span class="catalog-count">0 materiales</span>
        </div>
      `;

      return;
    }

    const ordenados = ordenarPorNumero(
      data,
      'idProveedorMaterial'
    );

    catalogoActual = ordenados;
    proveedorCatalogoActual =
      nombreProveedor || `Proveedor ${idProveedor}`;

    idProveedorCatalogoActual = Number(idProveedor);

    botonPDF.style.display = 'inline-block';

    contenedor.innerHTML = `
      <div class="catalog-summary">
        <div>
          <h4>
            Catálogo de
            ${escaparHTML(proveedorCatalogoActual)}
          </h4>

          <p>
            Información disponible para consulta y descarga en PDF.
          </p>
        </div>

        <span class="catalog-count">
          ${ordenados.length}
          ${ordenados.length === 1 ? 'material' : 'materiales'}
        </span>
      </div>

      <table id="tbl-catalogo">
        <thead>
          <tr>
            <th>ID Catálogo</th>
            <th>Material</th>
            <th>Precio (Bs)</th>
            <th>Tiempo de entrega</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          ${ordenados.map(material => `
            <tr>
              <td>
                ${material.idProveedorMaterial}
              </td>

              <td>
                <b>
                  ${escaparHTML(material.nombreMaterial)}
                </b>
              </td>

              <td>
                Bs ${formatearMoneda(material.precioProveedor)}
              </td>

              <td>
                ${
                  material.tiempoEntrega
                    ? `${material.tiempoEntrega} días`
                    : '-'
                }
              </td>

              <td>
                <button
                  class="btn btn-accent"
                  style="padding:4px 10px;font-size:.78rem;"
                  onclick="editarCatalogo(
                    ${material.idProveedorMaterial},
                    ${Number(material.precioProveedor || 0)},
                    ${Number(material.tiempoEntrega || 0)}
                  )"
                >
                  Editar
                </button>

                <button
                  class="btn btn-red"
                  style="padding:4px 10px;font-size:.78rem;"
                  onclick="quitarCatalogo(
                    ${material.idProveedorMaterial}
                  )"
                >
                  Quitar
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    contenedor.innerHTML = `
      <p style="color:#922b21;">
        Error al consultar el catálogo:
        ${escaparHTML(error.message)}
      </p>
    `;
  }
}

// =====================================================
// DESCARGAR CATÁLOGO EN PDF
// =====================================================

function descargarCatalogoPDF() {
  if (!catalogoActual.length) {
    msg(
      'msg-catalogo',
      'Primero debe consultar un proveedor con materiales.',
      'err'
    );

    return;
  }

  if (
    !window.jspdf ||
    !window.jspdf.jsPDF
  ) {
    msg(
      'msg-catalogo',
      'No se pudo cargar la librería para generar el PDF.',
      'err'
    );

    return;
  }

  const { jsPDF } = window.jspdf;

  const documento = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  if (typeof documento.autoTable !== 'function') {
    msg(
      'msg-catalogo',
      'No se pudo cargar el generador de tablas PDF.',
      'err'
    );

    return;
  }

  const fecha = new Date();

  const fechaFormateada = fecha.toLocaleDateString(
    'es-BO',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  );

  const horaFormateada = fecha.toLocaleTimeString(
    'es-BO',
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );

  // Encabezado principal
  documento.setFillColor(18, 56, 35);
  documento.rect(0, 0, 210, 32, 'F');

  documento.setTextColor(255, 255, 255);
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(17);

  documento.text(
    'GESTIÓN DE CONSTRUCTORA',
    14,
    14
  );

  documento.setFontSize(11);
  documento.setFont('helvetica', 'normal');

  documento.text(
    'Catálogo de materiales del proveedor',
    14,
    23
  );

  // Información del proveedor
  documento.setTextColor(31, 42, 36);
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(12);

  documento.text(
    `Proveedor: ${proveedorCatalogoActual}`,
    14,
    43
  );

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(9);

  documento.text(
    `Fecha de generación: ${fechaFormateada} - ${horaFormateada}`,
    14,
    50
  );

  documento.text(
    `Cantidad de materiales: ${catalogoActual.length}`,
    14,
    56
  );

  if (idProveedorCatalogoActual) {
    documento.text(
      `Código del proveedor: ${idProveedorCatalogoActual}`,
      140,
      50
    );
  }

  const filas = catalogoActual.map(material => [
    String(material.idProveedorMaterial || '-'),

    String(material.nombreMaterial || '-'),

    `Bs ${formatearMoneda(material.precioProveedor)}`,

    material.tiempoEntrega
      ? `${material.tiempoEntrega} días`
      : '-'
  ]);

  documento.autoTable({
    startY: 64,

    head: [[
      'ID Catálogo',
      'Material',
      'Precio ofertado',
      'Tiempo de entrega'
    ]],

    body: filas,

    theme: 'grid',

    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [31, 42, 36],
      lineColor: [225, 230, 221],
      lineWidth: 0.2
    },

    headStyles: {
      fillColor: [18, 56, 35],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },

    alternateRowStyles: {
      fillColor: [238, 244, 234]
    },

    columnStyles: {
      0: {
        cellWidth: 25
      },

      1: {
        cellWidth: 75
      },

      2: {
        cellWidth: 40
      },

      3: {
        cellWidth: 42
      }
    },

    didDrawPage: function () {
      const numeroPagina =
        documento.internal.getNumberOfPages();

      documento.setFontSize(8);
      documento.setTextColor(107, 117, 109);

      documento.text(
        `Página ${numeroPagina}`,
        180,
        290
      );
    }
  });

  const nombreSeguro = proveedorCatalogoActual
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');

  documento.save(
    `Catalogo_${nombreSeguro || 'Proveedor'}.pdf`
  );

  msg(
    'msg-catalogo',
    'El catálogo se descargó correctamente en formato PDF.',
    'ok'
  );
}

// =====================================================
// CARGAR FORMULARIO DE EDICIÓN
// =====================================================

async function cargarFormEditar(idProveedor) {
  try {
    const data = await obtenerJSON(
      `${API}/proveedores/${idProveedor}`
    );

    document.getElementById('ed-nombre').value =
      data.nombreProveedor || '';

    document.getElementById('ed-cel').value =
      data.numCelular || '';

    document.getElementById('ed-email').value =
      data.email || '';

    document.getElementById('ed-ciudad').value =
      data.ciudad || '';

    document.getElementById('ed-pais').value =
      data.pais || '';

    document.getElementById('ed-dir').value =
      data.direccion || '';

    document.getElementById(
      'form-editar-prov'
    ).style.display = 'block';
  } catch (error) {
    alert(
      `Error al cargar datos del proveedor: ${error.message}`
    );
  }
}

// =====================================================
// GUARDAR EDICIÓN DEL PROVEEDOR
// =====================================================

async function guardarEdicionProveedor() {
  const id =
    document.getElementById('ed-idprov').value;

  if (!id) {
    msg(
      'msg-editar',
      'Seleccione un proveedor.',
      'err'
    );

    return;
  }

  const body = {
    nombreProveedor:
      document.getElementById('ed-nombre').value.trim(),

    numCelular:
      document.getElementById('ed-cel').value.trim(),

    email:
      document.getElementById('ed-email').value.trim(),

    ciudad:
      document.getElementById('ed-ciudad').value.trim(),

    pais:
      document.getElementById('ed-pais').value.trim(),

    direccion:
      document.getElementById('ed-dir').value.trim()
  };

  if (!body.nombreProveedor) {
    msg(
      'msg-editar',
      'El nombre es obligatorio.',
      'err'
    );

    return;
  }

  try {
    await obtenerJSON(`${API}/proveedores/${id}`, {
      method: 'PUT',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(body)
    });

    msg(
      'msg-editar',
      'Proveedor actualizado correctamente.',
      'ok'
    );

    cargarProveedores();
  } catch (error) {
    msg(
      'msg-editar',
      `Error: ${error.message}`,
      'err'
    );
  }
}

// =====================================================
// EDITAR PRECIO Y TIEMPO DEL CATÁLOGO
// =====================================================

async function editarCatalogo(
  id,
  precioActual,
  tiempoActual
) {
  const nuevoPrecio = prompt(
    'Nuevo precio (Bs):',
    precioActual
  );

  if (nuevoPrecio === null) return;

  const precio = parseFloat(nuevoPrecio);

  if (
    Number.isNaN(precio) ||
    precio <= 0
  ) {
    alert('El precio ingresado no es válido.');
    return;
  }

  const nuevoTiempo = prompt(
    'Tiempo de entrega en días (opcional):',
    tiempoActual || ''
  );

  if (nuevoTiempo === null) return;

  let tiempo = null;

  if (nuevoTiempo.trim() !== '') {
    tiempo = parseInt(nuevoTiempo, 10);

    if (
      Number.isNaN(tiempo) ||
      tiempo < 0
    ) {
      alert(
        'El tiempo de entrega debe ser un número válido.'
      );

      return;
    }
  }

  try {
    await obtenerJSON(
      `${API}/proveedormaterial/${id}`,
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          precioProveedor: precio,
          tiempoEntrega: tiempo
        })
      }
    );

    msg(
      'msg-catalogo',
      'Catálogo actualizado correctamente.',
      'ok'
    );

    consultarMateriales();
  } catch (error) {
    msg(
      'msg-catalogo',
      `Error: ${error.message}`,
      'err'
    );
  }
}

// =====================================================
// QUITAR MATERIAL DEL CATÁLOGO
// =====================================================

async function quitarCatalogo(id) {
  const confirmar = confirm(
    `¿Quitar el material del catálogo con ID ${id}?`
  );

  if (!confirmar) return;

  try {
    await obtenerJSON(
      `${API}/proveedormaterial/${id}`,
      {
        method: 'DELETE'
      }
    );

    msg(
      'msg-catalogo',
      'Material quitado del catálogo.',
      'ok'
    );

    consultarMateriales();
  } catch (error) {
    msg(
      'msg-catalogo',
      `Error: ${error.message}`,
      'err'
    );
  }
}

// Carga inicial de proveedores.
cargarProveedores();
