const API = '/api';

// Solo el gerente puede ver la bitácora.
(function guardarAcceso() {
  const u = JSON.parse(
    localStorage.getItem('usuario') || 'null'
  );

  if (!u) {
    window.location.href = '../login/index.html';
    return;
  }

  if (u.rol !== 'rol_gerente') {
    document.body.innerHTML =
      '<div style="max-width:600px;margin:80px auto;text-align:center;font-family:Segoe UI,sans-serif;color:#173F24;">' +
        '<h2>Acceso restringido</h2>' +
        '<p>La bitácora solo está disponible para el rol Gerente.</p>' +
        '<a href="../index.html">Volver al sistema</a>' +
      '</div>';

    throw new Error('Acceso restringido');
  }
})();

function fecha(f) {
  if (!f) return '-';

  const d = new Date(f);

  return d.toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function rolCorto(r) {
  return (r || '')
    .replace('rol_', '')
    .replace('_', ' ');
}

function renderStats(registros) {
  const cont = document.getElementById('stat-grid');

  if (!cont) return;

  const cuenta = accion =>
    registros.filter(
      registro => registro.accion === accion
    ).length;

  const stats = [
    {
      cls: 'total',
      num: registros.length,
      lbl: 'Movimientos'
    },
    {
      cls: 'login',
      num: cuenta('LOGIN'),
      lbl: 'Inicios de sesión'
    },
    {
      cls: 'crear',
      num: cuenta('CREAR'),
      lbl: 'Creados'
    },
    {
      cls: 'editar',
      num: cuenta('EDITAR'),
      lbl: 'Editados'
    },
    {
      cls: 'eliminar',
      num: cuenta('ELIMINAR'),
      lbl: 'Eliminados'
    }
  ];

  cont.innerHTML = stats
    .map(stat => `
      <div class="stat ${stat.cls}">
        <div class="num">
          ${stat.num}
        </div>

        <div class="lbl">
          ${stat.lbl}
        </div>
      </div>
    `)
    .join('');
}

async function cargarResumen() {
  try {
    const data = await fetch(
      `${API}/bitacora/resumen`
    ).then(respuesta => respuesta.json());

    const cont =
      document.getElementById('cards-resumen');

    const usuarios = (
      data.porUsuario || []
    )
      .map(usuario => `
        <div class="linea">
          <span>
            ${
              usuario.nombreCompleto ||
              rolCorto(usuario.rol) ||
              '—'
            }
          </span>

          <span class="pill">
            ${usuario.total}
          </span>
        </div>
      `)
      .join('') ||
      '<div class="linea">Sin datos</div>';

    const modulos = (
      data.porModulo || []
    )
      .map(modulo => `
        <div class="linea">
          <span>
            ${modulo.modulo || '—'}
          </span>

          <span class="pill">
            ${modulo.total}
          </span>
        </div>
      `)
      .join('') ||
      '<div class="linea">Sin datos</div>';

    cont.innerHTML = `
      <div class="mini-card">
        <div class="mc-head">
          <span class="ico"></span>
          <h4>Acciones por usuario</h4>
        </div>

        <div class="mc-body">
          ${usuarios}
        </div>
      </div>

      <div class="mini-card">
        <div class="mc-head">
          <span class="ico"></span>
          <h4>Acciones por módulo</h4>
        </div>

        <div class="mc-body">
          ${modulos}
        </div>
      </div>
    `;
  } catch (e) {
    const cont =
      document.getElementById('cards-resumen');

    if (cont) {
      cont.innerHTML = '';
    }
  }
}

async function limpiarBitacora() {
  const dias =
    parseInt(
      document.getElementById('limpiar-rango').value
    ) || 0;

  const texto =
    dias > 0
      ? `¿Eliminar los movimientos anteriores a ${dias} días?`
      : '¿Eliminar TODOS los movimientos de la bitácora? Esta acción no se puede deshacer.';

  if (!confirm(texto)) return;

  try {
    const url =
      dias > 0
        ? `${API}/bitacora?dias=${dias}`
        : `${API}/bitacora`;

    const res = await fetch(url, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (!res.ok) {
      alert(
        'Error: ' +
        (
          data.error ||
          'No se pudo limpiar la bitácora.'
        )
      );

      return;
    }

    alert(
      data.mensaje ||
      'Bitácora limpiada correctamente.'
    );

    cargarResumen();
    cargarBitacora();
  } catch (e) {
    alert(
      'Error de conexión al limpiar la bitácora.'
    );
  }
}

async function cargarBitacora() {
  const cont =
    document.getElementById('cont-bitacora');

  cont.innerHTML =
    '<p>Cargando movimientos...</p>';

  const params =
    new URLSearchParams();

  const q =
    document
      .getElementById('f-q')
      .value
      .trim();

  const rol =
    document.getElementById('f-rol').value;

  const accion =
    document.getElementById('f-accion').value;

  const modulo =
    document.getElementById('f-modulo').value;

  if (q) {
    params.set('q', q);
  }

  if (rol) {
    params.set('rol', rol);
  }

  if (accion) {
    params.set('accion', accion);
  }

  if (modulo) {
    params.set('modulo', modulo);
  }

  try {
    const data = await fetch(
      `${API}/bitacora?${params.toString()}`
    ).then(respuesta => respuesta.json());

    const registros =
      Array.isArray(data)
        ? data
        : [];

    renderStats(registros);

    if (!registros.length) {
      cont.innerHTML = `
        <p style="color:#6b756d;">
          No hay movimientos que coincidan con el filtro.
        </p>
      `;

      return;
    }

    cont.innerHTML = `
      <p style="color:#6b756d;margin-bottom:8px;">
        ${registros.length} movimiento(s)
      </p>

      <table id="tbl-bitacora">
        <thead>
          <tr>
            <th>Fecha y hora</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Acción</th>
            <th>Módulo</th>
            <th>Detalle</th>
            <th>Resultado</th>
          </tr>
        </thead>

        <tbody>
          ${registros
            .map(registro => `
              <tr>
                <td>
                  ${fecha(registro.fechaHora)}
                </td>

                <td>
                  <b>
                    ${
                      registro.nombreCompleto ||
                      registro.username ||
                      '—'
                    }
                  </b>
                </td>

                <td>
                  ${rolCorto(registro.rol) || '—'}
                </td>

                <td>
                  <span
                    class="acc acc-${registro.accion}"
                  >
                    ${registro.accion}
                  </span>
                </td>

                <td>
                  ${registro.modulo || '—'}
                </td>

                <td
                  style="
                    font-size:.82rem;
                    color:#445;
                  "
                >
                  ${registro.descripcion || '—'}
                </td>

                <td>
                  ${
                    registro.exito
                      ? '<span class="acc acc-CREAR">OK</span>'
                      : '<span class="acc acc-ELIMINAR">Error</span>'
                  }
                </td>
              </tr>
            `)
            .join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    cont.innerHTML = `
      <p style="color:red;">
        Error al cargar la bitácora.
      </p>
    `;
  }
}

document.addEventListener(
  'DOMContentLoaded',
  () => {
    cargarResumen();
    cargarBitacora();
  }
);