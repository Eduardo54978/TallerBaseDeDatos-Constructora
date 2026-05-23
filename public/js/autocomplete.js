const AC_API = 'http://localhost:3000/api';

async function acSearch(inputId, dropId, hiddenId, endpoint, idField, nameField, cbName) {
  const drop = document.getElementById(dropId);
  if (!drop) return;
  const input = document.getElementById(inputId);
  const q = input ? input.value.trim() : '';
  if (!q || q.length < 2) {
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
