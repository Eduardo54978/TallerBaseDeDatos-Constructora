
// =====================================================
// MÓDULO 10 - REPORTES GENERALES
// =====================================================
//
// Permite buscar y generar reportes de:
// - Proyectos
// - Empleados
// - Materiales
// - Clientes
// - Proveedores
// - Catálogos de proveedores
//
// Usa:
// ../js/imprimirPDF.js
// ../js/reportes.js
// =====================================================

const API = '/api';

let _tipo = '';
let _debounce = null;
let _detalleActual = null;

let _rango = {
  desde: '',
  hasta: ''
};

let _proveedoresCache = null;

// Etiquetas que se muestran en los resultados.
const TIPOS = {
  proyecto: {
    label: 'Proyecto'
  },

  empleado: {
    label: 'Empleado'
  },

  material: {
    label: 'Material'
  },

  cliente: {
    label: 'Cliente'
  },

  proveedor: {
    label: 'Proveedor'
  }
};

// =====================================================
// FUNCIONES GENERALES
// =====================================================

const $ = id => document.getElementById(id);

const arreglo = valor =>
  Array.isArray(valor)
    ? valor
    : [];

const esc = valor =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const bs = numero =>
  'Bs ' +
  Number(numero || 0).toLocaleString(
    'es-BO',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );

const fecha = valor => {
  if (!valor) {
    return '-';
  }

  return String(valor).substring(0, 10);
};

const nombreCli = cliente =>
  `${cliente?.nombre || ''} ${cliente?.apellido || ''}`
    .trim() || 'Cliente';

function construirRangoQuery(desde, hasta) {
  if (typeof rangoQuery === 'function') {
    return rangoQuery(desde, hasta);
  }

  const parametros = new URLSearchParams();

  if (desde) {
    parametros.set('desde', desde);
  }

  if (hasta) {
    parametros.set('hasta', hasta);
  }

  const query = parametros.toString();

  return query
    ? `?${query}`
    : '';
}

function validarFechas(desde, hasta) {
  if (typeof validarRangoFechas === 'function') {
    return validarRangoFechas(desde, hasta);
  }

  if (
    desde &&
    hasta &&
    desde > hasta
  ) {
    return {
      ok: false,
      error:
        'La fecha inicial no puede ser posterior a la fecha final.'
    };
  }

  return {
    ok: true
  };
}

function mostrarEtiquetaRango(desde, hasta) {
  if (typeof etiquetaRango === 'function') {
    return etiquetaRango(desde, hasta);
  }

  if (desde && hasta) {
    return `Del ${desde} al ${hasta}`;
  }

  if (desde) {
    return `Desde ${desde}`;
  }

  if (hasta) {
    return `Hasta ${hasta}`;
  }

  return '';
}

async function leerJSON(respuesta) {
  let datos = {};

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
// INICIO DEL MÓDULO
// =====================================================

document.addEventListener(
  'DOMContentLoaded',
  () => {
    cargarResumen();
  }
);

// =====================================================
// RESUMEN GENERAL
// =====================================================

async function cargarResumen() {
  try {
    const [
      respuestaResumen,
      respuestaProveedores
    ] = await Promise.all([
      fetch(`${API}/reportes/resumen`),
      fetch(`${API}/proveedores`)
    ]);

    const resumen =
      await leerJSON(respuestaResumen);

    let proveedores = [];

    if (respuestaProveedores.ok) {
      proveedores =
        arreglo(
          await respuestaProveedores.json()
        );

      _proveedoresCache = proveedores;
    }

    $('rep-stats').innerHTML = `
      <div class="sb">
        <div class="n">
          ${resumen.proyectosActivos || 0}/
          ${resumen.totalProyectos || 0}
        </div>

        <div class="l">
          Proyectos activos
        </div>
      </div>

      <div class="sb">
        <div class="n">
          ${resumen.totalEmpleados || 0}
        </div>

        <div class="l">
          Empleados
        </div>
      </div>

      <div class="sb">
        <div class="n">
          ${resumen.totalMateriales || 0}
        </div>

        <div class="l">
          Materiales
        </div>
      </div>

      <div class="sb proveedor">
        <div class="n">
          ${proveedores.length}
        </div>

        <div class="l">
          Proveedores
        </div>
      </div>

      <div class="sb">
        <div class="n">
          ${bs(resumen.valorMateriales)}
        </div>

        <div class="l">
          Valor materiales usados
        </div>
      </div>

      <div class="sb warn">
        <div class="n">
          ${bs(resumen.totalPendiente)}
        </div>

        <div class="l">
          Pagos pendientes
        </div>
      </div>
    `;
  } catch (error) {
    console.error(
      'Error al cargar el resumen:',
      error
    );

    $('rep-stats').innerHTML = `
      <div class="sb">
        <div class="l">
          No se pudo cargar el resumen general.
        </div>
      </div>
    `;
  }
}

// =====================================================
// FILTROS DEL BUSCADOR
// =====================================================

function setTipo(elemento) {
  document
    .querySelectorAll('.rep-tipo')
    .forEach(tipo => {
      tipo.classList.remove('active');
    });

  elemento.classList.add('active');

  _tipo =
    elemento.dataset.tipo || '';

  buscarGlobal();
}

function buscarGlobal() {
  clearTimeout(_debounce);

  _debounce = setTimeout(
    _ejecutarBusqueda,
    250
  );
}

// =====================================================
// BÚSQUEDA DE PROVEEDORES
// =====================================================

async function obtenerProveedores() {
  if (Array.isArray(_proveedoresCache)) {
    return _proveedoresCache;
  }

  const respuesta =
    await fetch(`${API}/proveedores`);

  const proveedores =
    arreglo(await leerJSON(respuesta));

  _proveedoresCache = proveedores;

  return proveedores;
}

async function buscarProveedores(consulta) {
  const proveedores =
    await obtenerProveedores();

  const texto =
    String(consulta || '')
      .trim()
      .toLowerCase();

  return proveedores
    .filter(proveedor => {
      const campos = [
        proveedor.idProveedor,
        proveedor.nombreProveedor,
        proveedor.email,
        proveedor.numCelular,
        proveedor.ciudad,
        proveedor.pais,
        proveedor.direccion
      ];

      return campos.some(campo =>
        String(campo ?? '')
          .toLowerCase()
          .includes(texto)
      );
    })
    .slice(0, 30)
    .map(proveedor => {
      const ubicacion = [
        proveedor.ciudad,
        proveedor.pais
      ]
        .filter(Boolean)
        .join(', ');

      const subtitulo = [
        proveedor.email,
        proveedor.numCelular,
        ubicacion
      ]
        .filter(Boolean)
        .join(' · ');

      return {
        tipo: 'proveedor',
        id: proveedor.idProveedor,
        titulo:
          proveedor.nombreProveedor ||
          `Proveedor ${proveedor.idProveedor}`,
        subtitulo
      };
    });
}

// =====================================================
// EJECUTAR BÚSQUEDA GENERAL
// =====================================================

async function _ejecutarBusqueda() {
  const consulta =
    $('rep-q').value.trim();

  const contenedor =
    $('rep-resultados');

  if (!consulta) {
    contenedor.innerHTML = '';
    return;
  }

  contenedor.innerHTML = `
    <p class="rep-vacio">
      Buscando...
    </p>
  `;

  try {
    let resultados = [];

    // Búsqueda exclusiva de proveedores.
    if (_tipo === 'proveedor') {
      resultados =
        await buscarProveedores(consulta);
    } else {
      const parametros =
        new URLSearchParams({
          q: consulta
        });

      if (_tipo) {
        parametros.set(
          'tipo',
          _tipo
        );
      }

      const respuesta =
        await fetch(
          `${API}/reportes/buscar?${parametros.toString()}`
        );

      if (respuesta.ok) {
        const datos =
          await respuesta.json();

        resultados =
          arreglo(datos);
      }

      // En el filtro "Todo" también se buscan proveedores.
      if (!_tipo) {
        const proveedores =
          await buscarProveedores(consulta);

        resultados = [
          ...resultados,
          ...proveedores
        ];
      }
    }

    if (!resultados.length) {
      contenedor.innerHTML = `
        <p class="rep-vacio">
          No se encontraron resultados.
        </p>
      `;

      return;
    }

    contenedor.innerHTML =
      resultados
        .map(resultado => {
          const tipo =
            TIPOS[resultado.tipo] || {
              label:
                resultado.tipo ||
                'Registro'
            };

          const clase =
            resultado.tipo === 'proveedor'
              ? 'proveedor'
              : '';

          return `
            <article
              class="rep-item ${clase}"
              tabindex="0"
              onclick="
                abrirDetalle(
                  '${resultado.tipo}',
                  ${Number(resultado.id)}
                )
              "
              onkeydown="
                if (
                  event.key === 'Enter' ||
                  event.key === ' '
                ) {
                  abrirDetalle(
                    '${resultado.tipo}',
                    ${Number(resultado.id)}
                  );
                }
              "
            >
              <span class="chip">
                ${esc(tipo.label)}
              </span>

              <div class="info">
                <div class="t">
                  ${esc(resultado.titulo)}

                  <span
                    style="
                      color:var(--text-muted);
                      font-weight:400;
                    "
                  >
                    #${esc(resultado.id)}
                  </span>
                </div>

                <div class="s">
                  ${esc(
                    resultado.subtitulo || ''
                  )}
                </div>
              </div>
            </article>
          `;
        })
        .join('');
  } catch (error) {
    console.error(
      'Error en la búsqueda:',
      error
    );

    contenedor.innerHTML = `
      <p class="rep-vacio">
        Ocurrió un error al realizar la búsqueda.
      </p>
    `;
  }
}

// =====================================================
// ABRIR DETALLE
// =====================================================

async function abrirDetalle(
  tipo,
  id,
  conservarRango = false
) {
  if (!conservarRango) {
    _rango = {
      desde: '',
      hasta: ''
    };
  }

  const contenedor =
    $('rep-detalle');

  contenedor.style.display = 'block';

  contenedor.innerHTML = `
    <p class="rep-vacio">
      Cargando ficha...
    </p>
  `;

  contenedor.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  try {
    let datosDetalle;

    // Los proveedores utilizan las rutas
    // que ya existen en el módulo 6.
    if (tipo === 'proveedor') {
      const [
        respuestaProveedor,
        respuestaCatalogo
      ] = await Promise.all([
        fetch(
          `${API}/proveedores/${id}`
        ),

        fetch(
          `${API}/proveedores/${id}/materiales`
        )
      ]);

      const proveedor =
        await leerJSON(respuestaProveedor);

      let catalogo = [];

      if (respuestaCatalogo.ok) {
        catalogo =
          arreglo(
            await respuestaCatalogo.json()
          );
      }

      datosDetalle = {
        proveedor,
        catalogo
      };
    } else {
      const base =
        tipo === 'proyecto'
          ? `${API}/proyectos/${id}/reporte`
          : `${API}/reportes/${tipo}/${id}`;

      const url =
        base +
        construirRangoQuery(
          _rango.desde,
          _rango.hasta
        );

      const respuesta =
        await fetch(url);

      datosDetalle =
        await leerJSON(respuesta);
    }

    _detalleActual = {
      tipo,
      id,
      data: datosDetalle
    };

    const renderizadores = {
      proyecto: renderProyecto,
      empleado: renderEmpleado,
      material: renderMaterial,
      cliente: renderCliente,
      proveedor: renderProveedor
    };

    const renderizador =
      renderizadores[tipo];

    if (!renderizador) {
      throw new Error(
        'El tipo de reporte no es válido.'
      );
    }

    renderizador(
      contenedor,
      datosDetalle
    );
  } catch (error) {
    console.error(
      'Error al abrir la ficha:',
      error
    );

    contenedor.innerHTML = `
      <p class="rep-vacio">
        No se pudo cargar la ficha seleccionada.
      </p>
    `;
  }
}

// =====================================================
// CABECERA DE LA FICHA
// =====================================================

function cabecera(
  titulo,
  subtitulo,
  mostrarRango = true,
  botonesExtra = ''
) {
  const etiqueta =
    mostrarRango &&
    (_rango.desde || _rango.hasta)
      ? ` · ${mostrarEtiquetaRango(
          _rango.desde,
          _rango.hasta
        )}`
      : '';

  let html = `
    <div class="ficha-head">

      <div>
        <h3>
          ${esc(titulo)}
        </h3>

        <div class="ficha-subtitulo">
          ${esc(subtitulo || '')}
          ${esc(etiqueta)}
        </div>
      </div>

      <div class="ficha-acciones">
        <button
          type="button"
          class="btn btn-accent"
          onclick="imprimirDetalle()"
        >
          Imprimir ficha / PDF
        </button>

        ${botonesExtra}
      </div>

    </div>
  `;

  if (!mostrarRango) {
    return html;
  }

  html += `
    <div class="rango-fechas">

      <div class="form-group">
        <label for="rep-desde">
          Desde
        </label>

        <input
          type="date"
          id="rep-desde"
          value="${esc(_rango.desde)}"
          onchange="aplicarRango()"
        >
      </div>

      <div class="form-group">
        <label for="rep-hasta">
          Hasta
        </label>

        <input
          type="date"
          id="rep-hasta"
          value="${esc(_rango.hasta)}"
          onchange="aplicarRango()"
        >
      </div>

      <button
        type="button"
        class="btn btn-outline"
        onclick="limpiarRango()"
      >
        Quitar fechas
      </button>

    </div>
  `;

  return html;
}

// =====================================================
// RANGO DE FECHAS
// =====================================================

function aplicarRango() {
  const desde =
    $('rep-desde')?.value || '';

  const hasta =
    $('rep-hasta')?.value || '';

  const validacion =
    validarFechas(desde, hasta);

  if (!validacion.ok) {
    alert(validacion.error);
    return;
  }

  _rango = {
    desde,
    hasta
  };

  if (_detalleActual) {
    abrirDetalle(
      _detalleActual.tipo,
      _detalleActual.id,
      true
    );
  }
}

function limpiarRango() {
  _rango = {
    desde: '',
    hasta: ''
  };

  if (_detalleActual) {
    abrirDetalle(
      _detalleActual.tipo,
      _detalleActual.id,
      true
    );
  }
}

// =====================================================
// COMPONENTES DE LA FICHA
// =====================================================

function datos(pares) {
  const contenido =
    pares
      .filter(par =>
        par[1] !== null &&
        par[1] !== undefined &&
        par[1] !== ''
      )
      .map(([clave, valor]) => `
        <div>
          <span class="k">
            ${esc(clave)}:
          </span>

          <span class="v">
            ${esc(valor)}
          </span>
        </div>
      `)
      .join('');

  return `
    <div class="ficha-datos">
      ${contenido}
    </div>
  `;
}

function tabla(encabezados, filas) {
  const registros =
    arreglo(filas);

  if (!registros.length) {
    return `
      <p class="rep-vacio">
        Sin registros.
      </p>
    `;
  }

  return `
    <div class="tabla-responsive">

      <table class="rep-tabla">

        <thead>
          <tr>
            ${encabezados
              .map((encabezado, indice) => `
                <th
                  class="${indice === 0 ? '' : 'num'}"
                >
                  ${esc(encabezado)}
                </th>
              `)
              .join('')}
          </tr>
        </thead>

        <tbody>
          ${registros
            .map(fila => `
              <tr>
                ${fila
                  .map((celda, indice) => `
                    <td
                      class="${indice === 0 ? '' : 'num'}"
                    >
                      ${esc(celda)}
                    </td>
                  `)
                  .join('')}
              </tr>
            `)
            .join('')}
        </tbody>

      </table>

    </div>
  `;
}

function seccion(titulo, contenido) {
  return `
    <section class="rep-seccion">

      <h4>
        ${esc(titulo)}
      </h4>

      ${contenido}

    </section>
  `;
}

function totales(pares) {
  return `
    <div class="rep-totales">

      ${pares
        .map(([etiqueta, valor, alerta]) => `
          <div class="tt ${alerta ? 'warn' : ''}">

            <div class="n">
              ${esc(valor)}
            </div>

            <div class="l">
              ${esc(etiqueta)}
            </div>

          </div>
        `)
        .join('')}

    </div>
  `;
}

// =====================================================
// RENDERIZAR PROYECTO
// =====================================================

function renderProyecto(contenedor, datosProyecto) {
  const proyecto =
    datosProyecto.proyecto || {};

  const personal =
    arreglo(datosProyecto.personal);

  const materiales =
    arreglo(datosProyecto.materiales);

  const contratos =
    arreglo(datosProyecto.contratos);

  const cotizaciones =
    arreglo(datosProyecto.cotizaciones);

  const resumen =
    datosProyecto.totales || {};

  contenedor.innerHTML =
    cabecera(
      proyecto.nombreProyecto ||
        'Proyecto',
      `Expediente de proyecto #${proyecto.idProyecto || ''}`
    )

    + datos([
      [
        'Cliente',
        proyecto.nombreCliente
      ],
      [
        'Tipo',
        proyecto.nombreTipoProyecto
      ],
      [
        'Estado',
        proyecto.nombreEstadoProyecto
      ],
      [
        'Ubicación',
        proyecto.ubicacion
      ],
      [
        'Inicio',
        fecha(proyecto.fechaInicio)
      ],
      [
        'Fin estimado',
        fecha(proyecto.fechaFinEstimada)
      ],
      [
        'Fin real',
        fecha(proyecto.fechaFinReal)
      ]
    ])

    + seccion(
      'Personal asignado',

      tabla(
        [
          'Empleado',
          'Cargo',
          'Rol',
          'Inicio',
          'Fin'
        ],

        personal.map(persona => [
          persona.empleado,
          persona.nombreCargo,
          persona.nombreRolProyecto,
          fecha(persona.fechaInicio),
          fecha(persona.fechaFin)
        ])
      )
    )

    + seccion(
      'Materiales usados',

      tabla(
        [
          'Material',
          'Cantidad',
          'Costo'
        ],

        materiales.map(material => [
          material.nombreMaterial,
          material.cantidadUtilizada,
          bs(material.costoTotal)
        ])
      )
    )

    + seccion(
      'Contratos',

      tabla(
        [
          'N.° contrato',
          'Tipo',
          'Firma',
          'Vencimiento',
          'Monto'
        ],

        contratos.map(contrato => [
          contrato.numeroContrato,
          contrato.nombreTipoContrato,
          fecha(contrato.fechaFirma),
          fecha(contrato.fechaVencimiento),
          bs(contrato.montoTotal)
        ])
      )
    )

    + seccion(
      'Cotizaciones',

      tabla(
        [
          'Número',
          'Tipo',
          'Fecha',
          'Estado'
        ],

        cotizaciones.map(cotizacion => [
          cotizacion.numero,
          cotizacion.tipo,
          fecha(cotizacion.fechaCotizacion),
          cotizacion.nombreEstadoCotizacion
        ])
      )
    )

    + totales([
      [
        'Costo materiales',
        bs(resumen.costoMateriales)
      ],
      [
        'Planilla pagada',
        bs(resumen.totalPlanilla)
      ],
      [
        'Pagos de cliente',
        bs(resumen.totalPagosCliente)
      ],
      [
        'Horas registradas',
        resumen.totalHoras || 0
      ]
    ]);
}

// =====================================================
// RENDERIZAR EMPLEADO
// =====================================================

function renderEmpleado(contenedor, datosEmpleado) {
  const empleado =
    datosEmpleado.empleado || {};

  const asignaciones =
    arreglo(datosEmpleado.asignaciones);

  const horas =
    arreglo(datosEmpleado.horas);

  const pagos =
    arreglo(datosEmpleado.pagos);

  const resumen =
    datosEmpleado.totales || {};

  contenedor.innerHTML =
    cabecera(
      `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim() ||
        'Empleado',

      `Ficha de empleado #${empleado.idEmpleado || ''}`
    )

    + datos([
      [
        'CI',
        empleado.ci
      ],
      [
        'Cargo',
        empleado.nombreCargo
      ],
      [
        'Departamento',
        empleado.nombreDepartamento
      ],
      [
        'Estado',
        empleado.nombreEstadoEmpleado
      ],
      [
        'Especialidad',
        empleado.especialidad
      ],
      [
        'Email',
        empleado.email
      ],
      [
        'Celular',
        empleado.numCelular
      ],
      [
        'Dirección',
        empleado.direccion
      ],
      [
        'Contratación',
        fecha(empleado.fechaContratacion)
      ],
      [
        'Pago por hora',
        bs(empleado.pagoPorHora)
      ]
    ])

    + seccion(
      'Proyectos asignados',

      tabla(
        [
          'Proyecto',
          'Rol',
          'Inicio',
          'Fin',
          'Estado'
        ],

        asignaciones.map(asignacion => [
          asignacion.nombreProyecto,
          asignacion.nombreRolProyecto,
          fecha(asignacion.fechaInicio),
          fecha(asignacion.fechaFin),
          asignacion.estado
        ])
      )
    )

    + seccion(
      'Horas trabajadas',

      tabla(
        [
          'Fecha',
          'Proyecto',
          'Horas',
          'Total'
        ],

        horas.map(registro => [
          fecha(registro.fecha),
          registro.nombreProyecto,
          registro.horasTrabajadas,
          bs(registro.totalPago)
        ])
      )
    )

    + seccion(
      'Pagos de planilla',

      tabla(
        [
          'Proyecto',
          'Fecha',
          'Monto',
          'Método',
          'Estado'
        ],

        pagos.map(pago => [
          pago.nombreProyecto,
          fecha(pago.fechaPago),
          bs(pago.montoPagado),
          pago.nombreMetodoPago,
          pago.nombreEstadoPago
        ])
      )
    )

    + totales([
      [
        'Horas totales',
        resumen.totalHoras || 0
      ],
      [
        'Ganado por horas',
        bs(resumen.totalGanado)
      ],
      [
        'Planilla pagada',
        bs(resumen.totalPagado)
      ],
      [
        `Pendiente (${resumen.cantidadPendientes || 0})`,
        bs(resumen.totalPendiente),
        true
      ]
    ]);
}

// =====================================================
// RENDERIZAR MATERIAL
// =====================================================

function renderMaterial(contenedor, datosMaterial) {
  const material =
    datosMaterial.material || {};

  const usos =
    arreglo(datosMaterial.usos);

  const resumen =
    datosMaterial.totales || {};

  contenedor.innerHTML =
    cabecera(
      material.nombreMaterial ||
        'Material',

      `Ficha de material #${material.idMaterial || ''}`
    )

    + datos([
      [
        'Unidad',
        material.nombreUnidadMedida
      ],
      [
        'Precio unitario',
        bs(material.precioUnitario)
      ],
      [
        'Descripción',
        material.descripcion
      ]
    ])

    + seccion(
      'Proyectos donde se utilizó',

      tabla(
        [
          'Proyecto',
          'Cantidad',
          'Costo',
          'Fecha'
        ],

        usos.map(uso => [
          uso.nombreProyecto,
          uso.cantidadUtilizada,
          bs(uso.costoTotal),
          fecha(uso.fechaRegistro)
        ])
      )
    )

    + totales([
      [
        'Proyectos',
        resumen.proyectos || 0
      ],
      [
        'Cantidad total usada',
        resumen.totalCantidad || 0
      ],
      [
        'Costo total',
        bs(resumen.totalCosto)
      ]
    ]);
}

// =====================================================
// RENDERIZAR CLIENTE
// =====================================================

function renderCliente(contenedor, datosCliente) {
  const cliente =
    datosCliente.cliente || {};

  const proyectos =
    arreglo(datosCliente.proyectos);

  const contratos =
    arreglo(datosCliente.contratos);

  const resumen =
    datosCliente.totales || {};

  contenedor.innerHTML =
    cabecera(
      nombreCli(cliente),

      `Ficha de cliente #${cliente.idCliente || ''}`
    )

    + datos([
      [
        'Tipo',
        cliente.nombreTipoCliente
      ],
      [
        'Documento',
        cliente.documentoID
      ],
      [
        'Email',
        cliente.email
      ],
      [
        'Celular',
        cliente.numCelular
      ],
      [
        'Dirección',
        cliente.direccion
      ],
      [
        'Registro',
        fecha(cliente.fechaRegistro)
      ]
    ])

    + seccion(
      'Proyectos',

      tabla(
        [
          'Proyecto',
          'Estado',
          'Inicio',
          'Fin estimado'
        ],

        proyectos.map(proyecto => [
          proyecto.nombreProyecto,
          proyecto.nombreEstadoProyecto,
          fecha(proyecto.fechaInicio),
          fecha(proyecto.fechaFinEstimada)
        ])
      )
    )

    + seccion(
      'Contratos',

      tabla(
        [
          'N.° contrato',
          'Proyecto',
          'Firma',
          'Monto',
          'Estado'
        ],

        contratos.map(contrato => [
          contrato.numeroContrato,
          contrato.nombreProyecto,
          fecha(contrato.fechaFirma),
          bs(contrato.montoTotal),
          contrato.nombreEstadoContrato
        ])
      )
    )

    + totales([
      [
        'Proyectos',
        resumen.proyectos || 0
      ],
      [
        'Contratos',
        resumen.contratos || 0
      ],
      [
        'Monto en contratos',
        bs(resumen.montoContratos)
      ]
    ]);
}

// =====================================================
// RENDERIZAR PROVEEDOR Y CATÁLOGO
// =====================================================

function renderProveedor(contenedor, datosProveedor) {
  const proveedor =
    datosProveedor.proveedor || {};

  const catalogo =
    arreglo(datosProveedor.catalogo);

  const totalPrecios =
    catalogo.reduce(
      (acumulado, material) =>
        acumulado +
        Number(
          material.precioProveedor || 0
        ),
      0
    );

  const precioPromedio =
    catalogo.length
      ? totalPrecios / catalogo.length
      : 0;

  const ubicacion = [
    proveedor.ciudad,
    proveedor.pais
  ]
    .filter(Boolean)
    .join(', ');

  const botonCatalogo = `
    <button
      type="button"
      class="btn btn-primary"
      onclick="imprimirSoloCatalogoProveedor()"
    >
      Imprimir solo catálogo
    </button>
  `;

  const contenidoCatalogo =
    catalogo.length
      ? tabla(
          [
            'Material',
            'Precio ofertado',
            'Tiempo de entrega'
          ],

          catalogo.map(material => [
            material.nombreMaterial,
            bs(material.precioProveedor),

            material.tiempoEntrega
              ? `${material.tiempoEntrega} días`
              : '-'
          ])
        )
      : `
          <div class="catalogo-vacio">
            Este proveedor todavía no tiene materiales
            asignados en su catálogo.
          </div>
        `;

  contenedor.innerHTML =
    cabecera(
      proveedor.nombreProveedor ||
        'Proveedor',

      `Ficha y catálogo del proveedor #${proveedor.idProveedor || ''}`,

      false,

      botonCatalogo
    )

    + datos([
      [
        'Código',
        proveedor.idProveedor
      ],
      [
        'Proveedor',
        proveedor.nombreProveedor
      ],
      [
        'Celular',
        proveedor.numCelular || '-'
      ],
      [
        'Email',
        proveedor.email || '-'
      ],
      [
        'Ciudad',
        proveedor.ciudad || '-'
      ],
      [
        'País',
        proveedor.pais || '-'
      ],
      [
        'Dirección',
        proveedor.direccion || '-'
      ]
    ])

    + (
      ubicacion
        ? `
          <div class="catalogo-proveedor-info">
            <strong>Ubicación del proveedor:</strong>
            ${esc(ubicacion)}
          </div>
        `
        : ''
    )

    + seccion(
      'Catálogo de materiales',
      contenidoCatalogo
    )

    + totales([
      [
        'Materiales ofrecidos',
        catalogo.length
      ],
      [
        'Precio promedio',
        bs(precioPromedio)
      ]
    ]);
}

// =====================================================
// IMPRESIÓN GENERAL
// =====================================================

function imprimirDetalle() {
  if (!_detalleActual) {
    alert(
      'Primero seleccione un registro.'
    );

    return;
  }

  if (
    typeof nuevaVentanaPDF !== 'function'
  ) {
    alert(
      'No se encontró el generador de impresión.'
    );

    return;
  }

  const {
    tipo,
    data
  } = _detalleActual;

  const ventana =
    nuevaVentanaPDF();

  if (!ventana) {
    alert(
      'El navegador bloqueó la ventana de impresión.'
    );

    return;
  }

  if (tipo === 'proyecto') {
    imprimirProyecto(
      ventana,
      data
    );
  } else if (tipo === 'empleado') {
    imprimirEmpleado(
      ventana,
      data
    );
  } else if (tipo === 'material') {
    imprimirMaterial(
      ventana,
      data
    );
  } else if (tipo === 'cliente') {
    imprimirCliente(
      ventana,
      data
    );
  } else if (tipo === 'proveedor') {
    imprimirProveedor(
      ventana,
      data
    );
  }
}

// =====================================================
// IMPRIMIR PROYECTO
// =====================================================

function imprimirProyecto(ventana, datosProyecto) {
  const proyecto =
    datosProyecto.proyecto || {};

  const personal =
    arreglo(datosProyecto.personal);

  const materiales =
    arreglo(datosProyecto.materiales);

  const contratos =
    arreglo(datosProyecto.contratos);

  const cotizaciones =
    arreglo(datosProyecto.cotizaciones);

  const resumen =
    datosProyecto.totales || {};

  const cuerpo =
    pdfDatos([
      [
        'Cliente',
        proyecto.nombreCliente
      ],
      [
        'Tipo',
        proyecto.nombreTipoProyecto
      ],
      [
        'Estado',
        proyecto.nombreEstadoProyecto
      ],
      [
        'Ubicación',
        proyecto.ubicacion
      ],
      [
        'Inicio',
        fecha(proyecto.fechaInicio)
      ],
      [
        'Fin estimado',
        fecha(proyecto.fechaFinEstimada)
      ]
    ])

    + pdfTabla(
      'Personal asignado',

      [
        'Empleado',
        'Cargo',
        'Rol',
        'Inicio',
        'Fin'
      ],

      personal.map(persona => [
        persona.empleado,
        persona.nombreCargo,
        persona.nombreRolProyecto,
        fecha(persona.fechaInicio),
        fecha(persona.fechaFin)
      ])
    )

    + pdfTabla(
      'Materiales usados',

      [
        'Material',
        'Cantidad',
        'Costo'
      ],

      materiales.map(material => [
        material.nombreMaterial,
        material.cantidadUtilizada,
        bs(material.costoTotal)
      ])
    )

    + pdfTabla(
      'Contratos',

      [
        'N.° contrato',
        'Tipo',
        'Firma',
        'Vencimiento',
        'Monto'
      ],

      contratos.map(contrato => [
        contrato.numeroContrato,
        contrato.nombreTipoContrato,
        fecha(contrato.fechaFirma),
        fecha(contrato.fechaVencimiento),
        bs(contrato.montoTotal)
      ])
    )

    + pdfTabla(
      'Cotizaciones',

      [
        'Número',
        'Tipo',
        'Fecha',
        'Estado'
      ],

      cotizaciones.map(cotizacion => [
        cotizacion.numero,
        cotizacion.tipo,
        fecha(cotizacion.fechaCotizacion),
        cotizacion.nombreEstadoCotizacion
      ])
    )

    + `
      <div class="total">
        Costo de materiales:
        ${bs(resumen.costoMateriales)}
        · Planilla:
        ${bs(resumen.totalPlanilla)}
        · Pagos del cliente:
        ${bs(resumen.totalPagosCliente)}
      </div>
    `;

  imprimirReporte(
    ventana,

    `Expediente de Proyecto — ${proyecto.nombreProyecto || 'Proyecto'}`,

    mostrarEtiquetaRango(
      _rango.desde,
      _rango.hasta
    ),

    [cuerpo]
  );
}

// =====================================================
// IMPRIMIR EMPLEADO
// =====================================================

function imprimirEmpleado(ventana, datosEmpleado) {
  const empleado =
    datosEmpleado.empleado || {};

  const asignaciones =
    arreglo(datosEmpleado.asignaciones);

  const horas =
    arreglo(datosEmpleado.horas);

  const pagos =
    arreglo(datosEmpleado.pagos);

  const resumen =
    datosEmpleado.totales || {};

  const cuerpo =
    pdfDatos([
      [
        'CI',
        empleado.ci
      ],
      [
        'Cargo',
        empleado.nombreCargo
      ],
      [
        'Departamento',
        empleado.nombreDepartamento
      ],
      [
        'Estado',
        empleado.nombreEstadoEmpleado
      ],
      [
        'Email',
        empleado.email
      ],
      [
        'Celular',
        empleado.numCelular
      ],
      [
        'Contratación',
        fecha(empleado.fechaContratacion)
      ],
      [
        'Pago por hora',
        bs(empleado.pagoPorHora)
      ]
    ])

    + pdfTabla(
      'Proyectos asignados',

      [
        'Proyecto',
        'Rol',
        'Inicio',
        'Fin',
        'Estado'
      ],

      asignaciones.map(asignacion => [
        asignacion.nombreProyecto,
        asignacion.nombreRolProyecto,
        fecha(asignacion.fechaInicio),
        fecha(asignacion.fechaFin),
        asignacion.estado
      ])
    )

    + pdfTabla(
      'Horas trabajadas',

      [
        'Fecha',
        'Proyecto',
        'Horas',
        'Total'
      ],

      horas.map(registro => [
        fecha(registro.fecha),
        registro.nombreProyecto,
        registro.horasTrabajadas,
        bs(registro.totalPago)
      ])
    )

    + pdfTabla(
      'Pagos de planilla',

      [
        'Proyecto',
        'Fecha',
        'Monto',
        'Método',
        'Estado'
      ],

      pagos.map(pago => [
        pago.nombreProyecto,
        fecha(pago.fechaPago),
        bs(pago.montoPagado),
        pago.nombreMetodoPago,
        pago.nombreEstadoPago
      ])
    )

    + `
      <div class="total">
        Pagos pendientes
        (${resumen.cantidadPendientes || 0}):
        ${bs(resumen.totalPendiente)}
      </div>
    `;

  imprimirReporte(
    ventana,

    `Ficha de Empleado — ${
      `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim()
    }`,

    mostrarEtiquetaRango(
      _rango.desde,
      _rango.hasta
    ),

    [cuerpo]
  );
}

// =====================================================
// IMPRIMIR MATERIAL
// =====================================================

function imprimirMaterial(ventana, datosMaterial) {
  const material =
    datosMaterial.material || {};

  const usos =
    arreglo(datosMaterial.usos);

  const resumen =
    datosMaterial.totales || {};

  const cuerpo =
    pdfDatos([
      [
        'Unidad',
        material.nombreUnidadMedida
      ],
      [
        'Precio unitario',
        bs(material.precioUnitario)
      ],
      [
        'Descripción',
        material.descripcion
      ]
    ])

    + pdfTabla(
      'Proyectos donde se utilizó',

      [
        'Proyecto',
        'Cantidad',
        'Costo',
        'Fecha'
      ],

      usos.map(uso => [
        uso.nombreProyecto,
        uso.cantidadUtilizada,
        bs(uso.costoTotal),
        fecha(uso.fechaRegistro)
      ])
    )

    + `
      <div class="total">
        Cantidad total:
        ${resumen.totalCantidad || 0}
        · Costo total:
        ${bs(resumen.totalCosto)}
      </div>
    `;

  imprimirReporte(
    ventana,

    `Ficha de Material — ${material.nombreMaterial || 'Material'}`,

    mostrarEtiquetaRango(
      _rango.desde,
      _rango.hasta
    ),

    [cuerpo]
  );
}

// =====================================================
// IMPRIMIR CLIENTE
// =====================================================

function imprimirCliente(ventana, datosCliente) {
  const cliente =
    datosCliente.cliente || {};

  const proyectos =
    arreglo(datosCliente.proyectos);

  const contratos =
    arreglo(datosCliente.contratos);

  const resumen =
    datosCliente.totales || {};

  const cuerpo =
    pdfDatos([
      [
        'Tipo',
        cliente.nombreTipoCliente
      ],
      [
        'Documento',
        cliente.documentoID
      ],
      [
        'Email',
        cliente.email
      ],
      [
        'Celular',
        cliente.numCelular
      ],
      [
        'Dirección',
        cliente.direccion
      ]
    ])

    + pdfTabla(
      'Proyectos',

      [
        'Proyecto',
        'Estado',
        'Inicio',
        'Fin estimado'
      ],

      proyectos.map(proyecto => [
        proyecto.nombreProyecto,
        proyecto.nombreEstadoProyecto,
        fecha(proyecto.fechaInicio),
        fecha(proyecto.fechaFinEstimada)
      ])
    )

    + pdfTabla(
      'Contratos',

      [
        'N.° contrato',
        'Proyecto',
        'Firma',
        'Monto',
        'Estado'
      ],

      contratos.map(contrato => [
        contrato.numeroContrato,
        contrato.nombreProyecto,
        fecha(contrato.fechaFirma),
        bs(contrato.montoTotal),
        contrato.nombreEstadoContrato
      ])
    )

    + `
      <div class="total">
        Contratos:
        ${resumen.contratos || 0}
        · Monto:
        ${bs(resumen.montoContratos)}
      </div>
    `;

  imprimirReporte(
    ventana,

    `Ficha de Cliente — ${nombreCli(cliente)}`,

    mostrarEtiquetaRango(
      _rango.desde,
      _rango.hasta
    ),

    [cuerpo]
  );
}

// =====================================================
// IMPRIMIR FICHA COMPLETA DEL PROVEEDOR
// =====================================================

function imprimirProveedor(ventana, datosProveedor) {
  const proveedor =
    datosProveedor.proveedor || {};

  const catalogo =
    arreglo(datosProveedor.catalogo);

  const ubicacion = [
    proveedor.ciudad,
    proveedor.pais
  ]
    .filter(Boolean)
    .join(', ');

  const cuerpo =
    pdfDatos([
      [
        'Código',
        proveedor.idProveedor
      ],
      [
        'Proveedor',
        proveedor.nombreProveedor
      ],
      [
        'Celular',
        proveedor.numCelular || '-'
      ],
      [
        'Email',
        proveedor.email || '-'
      ],
      [
        'Ubicación',
        ubicacion || '-'
      ],
      [
        'Dirección',
        proveedor.direccion || '-'
      ]
    ])

    + pdfTabla(
      'Catálogo de materiales',

      [
        'Material',
        'Precio ofertado',
        'Tiempo de entrega'
      ],

      catalogo.map(material => [
        material.nombreMaterial,
        bs(material.precioProveedor),

        material.tiempoEntrega
          ? `${material.tiempoEntrega} días`
          : '-'
      ])
    )

    + `
      <div class="total">
        Cantidad de materiales ofrecidos:
        ${catalogo.length}
      </div>
    `;

  imprimirReporte(
    ventana,

    `Proveedor — ${
      proveedor.nombreProveedor ||
      'Proveedor'
    }`,

    'Información general y catálogo de materiales',

    [cuerpo]
  );
}

// =====================================================
// IMPRIMIR ÚNICAMENTE EL CATÁLOGO
// =====================================================

function imprimirSoloCatalogoProveedor() {
  if (
    !_detalleActual ||
    _detalleActual.tipo !== 'proveedor'
  ) {
    alert(
      'Primero seleccione un proveedor.'
    );

    return;
  }

  const catalogo =
    arreglo(
      _detalleActual.data.catalogo
    );

  if (!catalogo.length) {
    alert(
      'El proveedor no tiene materiales en su catálogo.'
    );

    return;
  }

  if (
    typeof nuevaVentanaPDF !== 'function'
  ) {
    alert(
      'No se encontró el generador de impresión.'
    );

    return;
  }

  const ventana =
    nuevaVentanaPDF();

  if (!ventana) {
    alert(
      'El navegador bloqueó la ventana de impresión.'
    );

    return;
  }

  imprimirCatalogoProveedor(
    ventana,
    _detalleActual.data
  );
}

function imprimirCatalogoProveedor(
  ventana,
  datosProveedor
) {
  const proveedor =
    datosProveedor.proveedor || {};

  const catalogo =
    arreglo(datosProveedor.catalogo);

  const cuerpo =
    pdfTabla(
      'Materiales ofrecidos',

      [
        'Material',
        'Precio ofertado',
        'Tiempo de entrega'
      ],

      catalogo.map(material => [
        material.nombreMaterial,
        bs(material.precioProveedor),

        material.tiempoEntrega
          ? `${material.tiempoEntrega} días`
          : '-'
      ])
    )

    + `
      <div class="total">
        Total de materiales:
        ${catalogo.length}
      </div>
    `;

  imprimirReporte(
    ventana,

    `Catálogo — ${
      proveedor.nombreProveedor ||
      'Proveedor'
    }`,

    `Código del proveedor: ${
      proveedor.idProveedor || '-'
    }`,

    [cuerpo]
  );
}
