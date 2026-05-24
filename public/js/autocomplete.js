// ── Identidad de sesión en cada petición (para la bitácora) ──────────────────
// Envuelve fetch para adjuntar quién es el usuario logueado en las cabeceras
// X-Usuario-*. El backend usa esto para registrar quién hizo cada movimiento.
(function () {
  if (window.__fetchConSesion) return;       // evitar envolver dos veces
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = function (url, opciones) {
    opciones = opciones || {};
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || 'null');
      const esApi = typeof url === 'string' && url.includes('/api');
      if (u && esApi) {
        const headers = new Headers(opciones.headers || {});
        if (u.idUsuario != null) headers.set('X-Usuario-Id', u.idUsuario);
        if (u.username)          headers.set('X-Usuario-Username', u.username);
        if (u.rol)               headers.set('X-Usuario-Rol', u.rol);
        if (u.nombreCompleto)    headers.set('X-Usuario-Nombre', encodeURIComponent(u.nombreCompleto));
        opciones.headers = headers;
      }
    } catch (e) { /* sin sesión: se envía la petición tal cual */ }
    return fetchOriginal(url, opciones);
  };
  window.__fetchConSesion = true;
})();

// Tarjetas de estadísticas reutilizables para la cabecera de cada módulo.
// Uso: renderStatsCards('id-contenedor', [{ n: 12, l: 'Total' }, ...])
function renderStatsCards(containerId, cards) {
  const cont = document.getElementById(containerId);
  if (!cont) return;
  cont.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:18px;';
  cont.innerHTML = (cards || []).map(c => `
    <div style="background:#fff;border:1px solid #E1E6DD;border-top:4px solid ${c.color || '#2F5F2F'};
                border-radius:10px;padding:14px 16px;text-align:center;box-shadow:0 2px 8px rgba(23,63,36,.06);">
      <div style="font-size:1.6rem;font-weight:800;color:#173F24;line-height:1;">${c.n}</div>
      <div style="font-size:.72rem;color:#6b756d;text-transform:uppercase;letter-spacing:.5px;margin-top:6px;">${c.l}</div>
    </div>`).join('');
}

const AC_API = 'http://localhost:3000/api';

async function acSearch(inputId, dropId, hiddenId, endpoint, idField, nameField, cbName) {
  const drop = document.getElementById(dropId);
  if (!drop) return;
  const input = document.getElementById(inputId);
  const q = input ? input.value.trim() : '';
  if (!q) {
    drop.innerHTML = '';
    drop.style.display = 'none';
    return;
  }
  try {
    const data = await fetch(`${AC_API}/${endpoint}/search?q=${encodeURIComponent(q)}`).then(r => r.json());
    if (!Array.isArray(data) || !data.length) {
      drop.innerHTML = '<div class="ac-empty">Sin resultados</div>';
      drop.style.display = 'block';
      return;
    }
    drop.innerHTML = data.slice(0, 8).map(item => {
      const id = item[idField];
      const name = String(item[nameField] || '').replace(/'/g, '&#39;');
      const cb = cbName ? `,'${cbName}'` : '';
      return `<div class="ac-item" onmousedown="acPick('${inputId}','${dropId}','${hiddenId}',${id},'${name}'${cb})">${item[nameField]} <small>#${id}</small></div>`;
    }).join('');
    drop.style.display = 'block';
  } catch (e) {
    drop.style.display = 'none';
  }
}

function acPick(inputId, dropId, hiddenId, id, nombre, cbName) {
  const input = document.getElementById(inputId);
  const drop = document.getElementById(dropId);
  const hidden = document.getElementById(hiddenId);
  if (input) input.value = nombre;
  if (hidden) hidden.value = id;
  if (drop) { drop.innerHTML = ''; drop.style.display = 'none'; }
  if (cbName && typeof window[cbName] === 'function') window[cbName](id);
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.ac-wrap')) {
    document.querySelectorAll('.ac-drop').forEach(function(d) {
      d.innerHTML = '';
      d.style.display = 'none';
    });
  }
});
