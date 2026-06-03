const API = 'http://localhost:3000/api';

// Solo el gerente puede ver la bitácora.
(function guardarAcceso() {
  const u = JSON.parse(localStorage.getItem('usuario') || 'null');
  if (!u) { window.location.href = '../login/index.html'; return; }
  if (u.rol !== 'rol_gerente') {
    document.body.innerHTML =
      '<div style="max-width:600px;margin:80px auto;text-align:center;font-family:Segoe UI,sans-serif;color:#173F24;">' +
      '<h2>Acceso restringido</h2><p>La bitácora solo está disponible para el rol Gerente.</p>' +
      '<a href="../index.html">Volver al sistema</a></div>';
    throw new Error('acceso restringido');
  }
})();

function fecha(f) {
  if (!f) return '-';
  const d = new Date(f);
  return d.toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

function rolCorto(r) {
  return (r || '').replace('rol_', '').replace('_', ' ');
}

function renderStats(registros) {
  const cont = document.getElementById('stat-grid');
  if (!cont) return;
  const cuenta = a => registros.filter(r => r.accion === a).length;
  const stats = [
    { cls: 'total',    num: registros.length, lbl: 'Movimientos' },
    { cls: 'login',    num: cuenta('LOGIN'),    lbl: 'Inicios sesión' },
    { cls: 'crear',    num: cuenta('CREAR'),    lbl: 'Creados' },
    { cls: 'editar',   num: cuenta('EDITAR'),   lbl: 'Editados' },
    { cls: 'eliminar', num: cuenta('ELIMINAR'), lbl: 'Eliminados' },
  ];
  cont.innerHTML = stats.map(s =>
    `<div class="stat ${s.cls}"><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>`).join('');
}

async function cargarResumen() {
  try {
    const data = await fetch(`${API}/bitacora/resumen`).then(r => r.json());
    const cont = document.getElementById('cards-resumen');
    const usuarios = (data.porUsuario || []).map(u =>
      `<div class="linea"><span>${u.nombreCompleto || rolCorto(u.rol) || '—'}</span><span class="pill">${u.total}</span></div>`).join('')
      || '<div class="linea">Sin datos</div>';
    const modulos = (data.porModulo || []).map(m =>
      `<div class="linea"><span>${m.modulo || '—'}</span><span class="pill">${m.total}</span></div>`).join('')
      || '<div class="linea">Sin datos</div>';
    cont.innerHTML = `
      <div class="mini-card">
        <div class="mc-head"><span class="ico"></span><h4>Acciones por usuario</h4></div>
        <div class="mc-body">${usuarios}</div>
      </div>
      <div class="mini-card">
        <div class="mc-head"><span class="ico"></span><h4>Acciones por módulo</h4></div>
        <div class="mc-body">${modulos}</div>
      </div>`;
  } catch (e) {
    document.getElementById('cards-resumen').innerHTML = '';
  }
}

async function limpiarBitacora() {
  const dias = parseInt(document.getElementById('limpiar-rango').value) || 0;
  const texto = dias > 0
    ? `¿Eliminar los movimientos anteriores a ${dias} días?`
    : '¿Eliminar TODOS los movimientos de la bitácora? Esta acción no se puede deshacer.';
  if (!confirm(texto)) return;
  try {
    const url = dias > 0 ? `${API}/bitacora?dias=${dias}` : `${API}/bitacora`;
    const res = await fetch(url, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return alert('Error: ' + data.error);
    alert(data.mensaje || 'Bitácora limpiada.');
    cargarResumen();
    cargarBitacora();
  } catch (e) {
    alert('Error de conexión al limpiar la bitácora.');
  }
}

async function cargarBitacora() {
  const cont = document.getElementById('cont-bitacora');
  cont.innerHTML = '<p>Cargando movimientos...</p>';
  const params = new URLSearchParams();
  const q = document.getElementById('f-q').value.trim();
  const rol = document.getElementById('f-rol').value;
  const accion = document.getElementById('f-accion').value;
  const modulo = document.getElementById('f-modulo').value;
  if (q) params.set('q', q);
  if (rol) params.set('rol', rol);
  if (accion) params.set('accion', accion);
  if (modulo) params.set('modulo', modulo);

  try {
    const data = await fetch(`${API}/bitacora?${params.toString()}`).then(r => r.json());
    renderStats(Array.isArray(data) ? data : []);
    if (!Array.isArray(data) || !data.length) {
      cont.innerHTML = '<p style="color:#6b756d;">No hay movimientos que coincidan con el filtro.</p>';
      return;
    }
    cont.innerHTML = `
      <p style="color:#6b756d; margin-bottom:8px;">${data.length} movimiento(s)</p>
      <table id="tbl-bitacora">
        <thead><tr>
          <th>Fecha y hora</th>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Acción</th>
          <th>Módulo</th>
          <th>Detalle</th>
          <th>Resultado</th>
        </tr></thead>
        <tbody>
          ${data.map(r => `<tr>
            <td>${fecha(r.fechaHora)}</td>
            <td><b>${r.nombreCompleto || r.username || '—'}</b></td>
            <td>${rolCorto(r.rol) || '—'}</td>
            <td><span class="acc acc-${r.accion}">${r.accion}</span></td>
            <td>${r.modulo || '—'}</td>
            <td style="font-size:.82rem; color:#445;">${r.descripcion || '—'}</td>
            <td>${r.exito ? '<span class="acc acc-CREAR">OK</span>' : '<span class="acc acc-ELIMINAR">Error</span>'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    cont.innerHTML = '<p style="color:red">Error al cargar la bitácora.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarResumen();
  cargarBitacora();
});
