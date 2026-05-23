const API = 'http://localhost:3000/api';

function ordenarPorNumero(datos, campo) {
  return [...(datos || [])].sort((a, b) => Number(a[campo] || 0) - Number(b[campo] || 0));
}

function ordenarCotizacionesCliente(datos) {
  return [...(datos || [])].sort((a, b) => {
    const idA = Number(a.idCotizacionCliente || extraerNumero(a.numeroCotizacionCliente));
    const idB = Number(b.idCotizacionCliente || extraerNumero(b.numeroCotizacionCliente));
    return idA - idB;
  });
}

function ordenarCotizacionesInternas(datos) {
  return [...(datos || [])].sort((a, b) => {
    const idA = Number(a.idCotizacionInterna || extraerNumero(a.numeroCotizacionInterna));
    const idB = Number(b.idCotizacionInterna || extraerNumero(b.numeroCotizacionInterna));
    return idA - idB;
  });
}

function extraerNumero(valor) {
  const texto = String(valor || '');
  const encontrados = texto.match(/\d+/g);
  if (!encontrados || encontrados.length === 0) return 0;
  return Number(encontrados[encontrados.length - 1]);
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  const tab = document.getElementById('tab-' + name);

  if (tab) {
    tab.classList.add('active');
  }

  if (btn) {
    btn.classList.add('active');
  }

  if (name === 'lista') {
    cargarCotizaciones();
  }
}

function filtrarTabla(id, texto) {
  const t = document.getElementById(id);

  if (!t) return;

  t.querySelectorAll('tbody tr').forEach(r => {
    r.style.display = r.innerText.toLowerCase().includes(texto.toLowerCase()) ? '' : 'none';
  });
}

function badge(texto) {
  const t = (texto || '').toLowerCase();

  if (t.includes('aprobad')) {
    return `<span class="badge badge-green">${texto}</span>`;
  }

  if (t.includes('rechazad')) {
    return `<span class="badge badge-red">${texto}</span>`;
  }

  if (t.includes('pendiente')) {
    return `<span class="badge badge-yellow">${texto}</span>`;
  }

  return `<span class="badge badge-blue">${texto}</span>`;
}

function msg(id, texto, tipo) {
  const el = document.getElementById(id);

  if (!el) return;

  el.className = 'msg ' + tipo;
  el.textContent = texto;

  setTimeout(() => {
    el.className = 'msg';
  }, 4000);
}

function calcDetalleCliente() {
  const c = parseFloat(document.getElementById('dc-cantidad').value) || 0;
  const p = parseFloat(document.getElementById('dc-precio').value) || 0;
  const prev = document.getElementById('dc-preview');

  if (c && p && prev) {
    prev.textContent = `Subtotal: Bs ${(c * p).toFixed(2)}`;
  }
}

function calcManoObra() {
  const pers = parseFloat(document.getElementById('mo-pers').value) || 0;
  const horas = parseFloat(document.getElementById('mo-horas').value) || 0;
  const pago = parseFloat(document.getElementById('mo-pago').value) || 0;
  const prev = document.getElementById('mo-preview');

  if (pers && horas && pago && prev) {
    prev.textContent = `Total estimado: Bs ${(pers * horas * pago).toFixed(2)}`;
  }
}

async function cargarCotizaciones() {
  try {
    const data = await fetch(`${API}/cotizaciones`).then(r => r.json());
    const ordenados = ordenarCotizacionesCliente(data);

    document.getElementById('cont-cotizaciones').innerHTML = `
      <table id="tbl-cot">
        <thead>
          <tr>
            <th>Número</th>
            <th>Proyecto</th>
            <th>Fecha</th>
            <th>Validez</th>
            <th>Observaciones</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados.map(c => `<tr>
            <td><b>${c.numeroCotizacionCliente || '-'}</b></td>
            <td>${c.nombreProyecto || '-'}</td>
            <td>${c.fechaCotizacion ? c.fechaCotizacion.substring(0, 10) : '-'}</td>
            <td>${c.fechaValidez ? c.fechaValidez.substring(0, 10) : '-'}</td>
            <td>${c.observaciones || '-'}</td>
            <td>${badge(c.nombreEstadoCotizacion)}</td>
            <td><button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarCotizacion('cliente', ${c.idCotizacionCliente})">Eliminar</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('cont-cotizaciones').innerHTML = '<p style="color:red">Error al cargar cotizaciones</p>';
  }
}

async function crearCotizacionCliente() {
  const body = {
    idProyecto: parseInt(document.getElementById('cc-proyecto').value),
    numeroCotizacion: document.getElementById('cc-num').value.trim(),
    fechaCotizacion: document.getElementById('cc-fecha').value,
    fechaValidez: document.getElementById('cc-validez').value || null,
    observaciones: document.getElementById('cc-obs').value.trim()
  };

  if (!body.idProyecto || !body.numeroCotizacion || !body.fechaCotizacion) {
    return msg('msg-cc', 'Proyecto, número y fecha son obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/cotizaciones/cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-cc', 'Error: ' + data.error, 'err');
    }

    msg('msg-cc', `Cotización creada con ID: ${data.idCotizacionCliente}. Úsalo para agregar detalles.`, 'ok');

    ['cc-proy-nom', 'cc-proyecto', 'cc-num', 'cc-fecha', 'cc-validez', 'cc-obs'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });

    cargarCotizaciones();
  } catch (e) {
    msg('msg-cc', 'Error de conexión', 'err');
  }
}

async function agregarDetalleCliente() {
  const id = document.getElementById('dc-idcot').value;

  const body = {
    concepto: document.getElementById('dc-concepto').value.trim(),
    descripcion: document.getElementById('dc-desc').value.trim(),
    cantidad: parseFloat(document.getElementById('dc-cantidad').value),
    precioUnitario: parseFloat(document.getElementById('dc-precio').value)
  };

  if (!id || !body.concepto || !body.cantidad || !body.precioUnitario) {
    return msg('msg-dc', 'Todos los campos marcados son obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/cotizaciones/cliente/${id}/detalle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-dc', 'Error: ' + data.error, 'err');
    }

    msg('msg-dc', 'Detalle agregado correctamente', 'ok');

    ['dc-concepto', 'dc-desc', 'dc-cantidad', 'dc-precio'].forEach(i => {
      document.getElementById(i).value = '';
    });

    const prev = document.getElementById('dc-preview');

    if (prev) {
      prev.textContent = '';
    }
  } catch (e) {
    msg('msg-dc', 'Error de conexión', 'err');
  }
}

async function crearCotizacionInterna() {
  const body = {
    idProyecto: parseInt(document.getElementById('ci-proyecto').value),
    numeroCotizacion: document.getElementById('ci-num').value.trim(),
    fechaCotizacion: document.getElementById('ci-fecha').value,
    observaciones: document.getElementById('ci-obs').value.trim()
  };

  if (!body.idProyecto || !body.numeroCotizacion || !body.fechaCotizacion) {
    return msg('msg-ci', 'Proyecto, número y fecha son obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/cotizaciones/interna`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-ci', 'Error: ' + data.error, 'err');
    }

    msg('msg-ci', `Cotización interna creada con ID: ${data.idCotizacionInterna}`, 'ok');

    ['ci-proy-nom', 'ci-proyecto', 'ci-num', 'ci-fecha', 'ci-obs'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
  } catch (e) {
    msg('msg-ci', 'Error de conexión', 'err');
  }
}

async function agregarMateriales() {
  const id = document.getElementById('dm-idcot').value;

  const body = {
    idMaterial: parseInt(document.getElementById('dm-mat').value),
    cantidadEstimada: parseFloat(document.getElementById('dm-cant').value),
    costoUnitarioEstimado: parseFloat(document.getElementById('dm-costo').value)
  };

  if (!id || !body.idMaterial || !body.cantidadEstimada || !body.costoUnitarioEstimado) {
    return msg('msg-dm', 'Todos los campos son obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/cotizaciones/interna/${id}/materiales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-dm', 'Error: ' + data.error, 'err');
    }

    msg('msg-dm', 'Material agregado correctamente', 'ok');

    ['dm-mat-nom', 'dm-mat', 'dm-cant', 'dm-costo'].forEach(idInput => {
      const input = document.getElementById(idInput);
      if (input) input.value = '';
    });
  } catch (e) {
    msg('msg-dm', 'Error de conexión', 'err');
  }
}

async function agregarManoObra() {
  const id = document.getElementById('mo-idcot').value;

  const body = {
    idCargo: parseInt(document.getElementById('mo-cargo').value),
    cantidadPersonas: parseInt(document.getElementById('mo-pers').value),
    horasEstimadas: parseFloat(document.getElementById('mo-horas').value),
    pagoPorHora: parseFloat(document.getElementById('mo-pago').value)
  };

  if (!id || !body.idCargo || !body.cantidadPersonas || !body.horasEstimadas || !body.pagoPorHora) {
    return msg('msg-mo', 'Todos los campos son obligatorios', 'err');
  }

  try {
    const res = await fetch(`${API}/cotizaciones/interna/${id}/manodeobra`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-mo', 'Error: ' + data.error, 'err');
    }

    msg('msg-mo', `Mano de obra agregada. Total estimado: Bs ${data.totalEstimado}`, 'ok');

    ['mo-cargo', 'mo-pers', 'mo-horas', 'mo-pago'].forEach(idInput => {
      const input = document.getElementById(idInput);
      if (input) input.value = '';
    });

    const prev = document.getElementById('mo-preview');

    if (prev) {
      prev.textContent = '';
    }
  } catch (e) {
    msg('msg-mo', 'Error de conexión', 'err');
  }
}

async function buscarPorProyecto() {
  const id = document.getElementById('pp-id').value;

  if (!id) return;

  try {
    const data = await fetch(`${API}/cotizaciones/proyecto/${id}`).then(r => r.json());
    const cont = document.getElementById('cont-por-proyecto');

    if (data.error) {
      cont.innerHTML = `<p style="color:red">${data.error}</p>`;
      return;
    }

    const clienteOrdenadas = ordenarCotizacionesCliente(data.cotizacionesCliente || []);
    const internasOrdenadas = ordenarCotizacionesInternas(data.cotizacionesInternas || []);

    const tablaCliente = clienteOrdenadas.length
      ? `<h4 style="margin-bottom:10px; color:var(--primary);">Cotizaciones Cliente (${clienteOrdenadas.length})</h4>
         <table id="tbl-cotizaciones-cliente-proyecto">
           <thead>
             <tr>
               <th>ID</th>
               <th>Número</th>
               <th>Fecha</th>
               <th>Validez</th>
               <th>Estado</th>
               <th>Acciones</th>
             </tr>
           </thead>
           <tbody>
             ${clienteOrdenadas.map(c => `<tr>
               <td>${c.idCotizacionCliente}</td>
               <td>${c.numeroCotizacionCliente || '-'}</td>
               <td>${c.fechaCotizacion ? c.fechaCotizacion.substring(0, 10) : '-'}</td>
               <td>${c.fechaValidez ? c.fechaValidez.substring(0, 10) : '-'}</td>
               <td>${badge(c.nombreEstadoCotizacion)}</td>
               <td><button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarCotizacion('cliente', ${c.idCotizacionCliente})">Eliminar</button></td>
             </tr>`).join('')}
           </tbody>
         </table>`
      : `<p style="color:#718096;">No hay cotizaciones cliente para este proyecto.</p>`;

    const tablaInterna = internasOrdenadas.length
      ? `<h4 style="margin:16px 0 10px; color:var(--primary);">Cotizaciones Internas (${internasOrdenadas.length})</h4>
         <table id="tbl-cotizaciones-internas-proyecto">
           <thead>
             <tr>
               <th>ID</th>
               <th>Número</th>
               <th>Fecha</th>
               <th>Estado</th>
               <th>Acciones</th>
             </tr>
           </thead>
           <tbody>
             ${internasOrdenadas.map(c => `<tr>
               <td>${c.idCotizacionInterna}</td>
               <td>${c.numeroCotizacionInterna || '-'}</td>
               <td>${c.fechaCotizacion ? c.fechaCotizacion.substring(0, 10) : '-'}</td>
               <td>${badge(c.nombreEstadoCotizacion)}</td>
               <td><button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarCotizacion('interna', ${c.idCotizacionInterna})">Eliminar</button></td>
             </tr>`).join('')}
           </tbody>
         </table>`
      : `<p style="color:#718096; margin-top:12px;">No hay cotizaciones internas para este proyecto.</p>`;

    cont.innerHTML = tablaCliente + tablaInterna;
  } catch (e) {
    document.getElementById('cont-por-proyecto').innerHTML = '<p style="color:red">Error al buscar</p>';
  }
}

let edTimer = null;
function resetBuscadorEditar() {
  document.getElementById('ed-nom').value = '';
  document.getElementById('ed-id').value = '';
  document.getElementById('form-editar-cot').style.display = 'none';
  const drop = document.getElementById('ac-ed');
  if (drop) { drop.innerHTML = ''; drop.style.display = 'none'; }
}

function buscarCotizacionEditar() {
  clearTimeout(edTimer);
  edTimer = setTimeout(async () => {
    const tipo = document.getElementById('ed-tipo').value;
    const q = document.getElementById('ed-nom').value.trim();
    const drop = document.getElementById('ac-ed');
    if (!q || q.length < 2) { drop.innerHTML = ''; drop.style.display = 'none'; return; }
    try {
      const data = await fetch(`${API}/cotizaciones/${tipo}/search?q=${encodeURIComponent(q)}`).then(r => r.json());
      if (!Array.isArray(data) || !data.length) {
        drop.innerHTML = '<div class="ac-empty">Sin resultados</div>';
        drop.style.display = 'block';
        return;
      }
      const idField = tipo === 'cliente' ? 'idCotizacionCliente' : 'idCotizacionInterna';
      drop.innerHTML = data.slice(0, 8).map(item => {
        const id = item[idField];
        const name = String(item.display || '').replace(/'/g, '&#39;');
        return `<div class="ac-item" onmousedown="cargarFormEditarCotizacion(${id}, '${name}')">${item.display}</div>`;
      }).join('');
      drop.style.display = 'block';
    } catch (e) { drop.style.display = 'none'; }
  }, 200);
}

async function cargarFormEditarCotizacion(id, nombre) {
  const tipo = document.getElementById('ed-tipo').value;
  document.getElementById('ed-id').value = id;
  document.getElementById('ed-nom').value = nombre;
  const drop = document.getElementById('ac-ed');
  if (drop) { drop.innerHTML = ''; drop.style.display = 'none'; }
  try {
    const data = await fetch(`${API}/cotizaciones/${tipo}/${id}`).then(r => r.json());
    if (data.error) return msg('msg-editar-cot', data.error, 'err');
    document.getElementById('ed-numero').value = (tipo === 'cliente' ? data.numeroCotizacionCliente : data.numeroCotizacionInterna) || '';
    document.getElementById('ed-fecha').value = data.fechaCotizacion ? data.fechaCotizacion.substring(0, 10) : '';
    document.getElementById('ed-obs').value = data.observaciones || '';
    const validezGroup = document.getElementById('ed-validez-group');
    if (tipo === 'cliente') {
      validezGroup.style.display = '';
      document.getElementById('ed-validez').value = data.fechaValidez ? data.fechaValidez.substring(0, 10) : '';
    } else {
      validezGroup.style.display = 'none';
    }
    document.getElementById('form-editar-cot').style.display = 'block';
  } catch (e) {
    msg('msg-editar-cot', 'Error al cargar la cotización', 'err');
  }
}

async function guardarEdicionCotizacion() {
  const tipo = document.getElementById('ed-tipo').value;
  const id = document.getElementById('ed-id').value;
  if (!id) return msg('msg-editar-cot', 'Busque una cotización primero.', 'err');
  const body = {
    numeroCotizacion: document.getElementById('ed-numero').value.trim(),
    fechaCotizacion: document.getElementById('ed-fecha').value,
    observaciones: document.getElementById('ed-obs').value.trim()
  };
  if (tipo === 'cliente') body.fechaValidez = document.getElementById('ed-validez').value || null;
  if (!body.numeroCotizacion || !body.fechaCotizacion) {
    return msg('msg-editar-cot', 'Número y fecha son obligatorios.', 'err');
  }
  try {
    const res = await fetch(`${API}/cotizaciones/${tipo}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-editar-cot', 'Error: ' + data.error, 'err');
    msg('msg-editar-cot', 'Cotización actualizada correctamente', 'ok');
    cargarCotizaciones();
  } catch (e) {
    msg('msg-editar-cot', 'Error de conexión', 'err');
  }
}

let estTimer = null;
function resetBuscadorEstado() {
  document.getElementById('est-nom').value = '';
  document.getElementById('est-id').value = '';
  const drop = document.getElementById('ac-est');
  if (drop) { drop.innerHTML = ''; drop.style.display = 'none'; }
}

function buscarCotizacionEstado() {
  clearTimeout(estTimer);
  estTimer = setTimeout(async () => {
    const tipo = document.getElementById('est-tipo').value;
    const q = document.getElementById('est-nom').value.trim();
    const drop = document.getElementById('ac-est');
    if (!q || q.length < 2) { drop.innerHTML = ''; drop.style.display = 'none'; return; }
    try {
      const data = await fetch(`${API}/cotizaciones/${tipo}/search?q=${encodeURIComponent(q)}`).then(r => r.json());
      if (!Array.isArray(data) || !data.length) {
        drop.innerHTML = '<div class="ac-empty">Sin resultados</div>';
        drop.style.display = 'block';
        return;
      }
      const idField = tipo === 'cliente' ? 'idCotizacionCliente' : 'idCotizacionInterna';
      drop.innerHTML = data.slice(0, 8).map(item => {
        const id = item[idField];
        const name = String(item.display || '').replace(/'/g, '&#39;');
        return `<div class="ac-item" onmousedown="seleccionarCotizacionEstado(${id}, '${name}')">${item.display}</div>`;
      }).join('');
      drop.style.display = 'block';
    } catch (e) { drop.style.display = 'none'; }
  }, 200);
}

function seleccionarCotizacionEstado(id, nombre) {
  document.getElementById('est-id').value = id;
  document.getElementById('est-nom').value = nombre;
  const drop = document.getElementById('ac-est');
  if (drop) { drop.innerHTML = ''; drop.style.display = 'none'; }
}

async function cambiarEstado() {
  const body = {
    idCotizacion: parseInt(document.getElementById('est-id').value),
    tipo: document.getElementById('est-tipo').value,
    nuevoEstado: document.getElementById('est-nuevo').value
  };

  if (!body.idCotizacion) {
    return msg('msg-est', 'ID es obligatorio', 'err');
  }

  try {
    const res = await fetch(`${API}/cotizaciones/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return msg('msg-est', 'Error: ' + data.error, 'err');
    }

    msg('msg-est', 'Estado actualizado correctamente', 'ok');

    resetBuscadorEstado();
    cargarCotizaciones();
  } catch (e) {
    msg('msg-est', 'Error de conexión', 'err');
  }
}

async function cargarSelectCargos9() {
  const data = await fetch(`${API}/empleados/cargos/lista`).then(r => r.json()).catch(() => []);
  const sel = document.getElementById('mo-cargo');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Cargo --</option>' +
    data.map(c => `<option value="${c.idCargo}">${c.nombreCargo}</option>`).join('');
}

async function eliminarCotizacion(tipo, id) {
  if (!confirm(`¿Eliminar la cotización ${tipo} ID ${id}? Se borrarán también sus detalles. Esta acción no se puede deshacer.`)) return;
  try {
    const res = await fetch(`${API}/cotizaciones/${tipo}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return alert('Error: ' + data.error);
    cargarCotizaciones();
    const ppId = document.getElementById('pp-id');
    if (ppId && ppId.value) buscarPorProyecto();
  } catch (e) {
    alert('Error de conexión');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarSelectCargos9();
});

cargarCotizaciones();