const API = '/api';

let tipoCotActual = 'cliente';

function switchTipoCot(tipo, btn) {
  tipoCotActual = tipo;
  document.querySelectorAll('#tab-lista .btn').forEach(b => {
    b.style.background = '#e2e8f0';
    b.style.color = '#2d3748';
  });
  if (btn) { btn.style.background = '#276749'; btn.style.color = '#fff'; }
  cargarListaCotizaciones();
}

async function cargarStatsCotizaciones() {
  if (typeof renderStatsCards !== 'function') return;
  try {
    const [cliente, internas] = await Promise.all([
      fetch(`${API}/cotizaciones`).then(r => r.json()).catch(() => []),
      fetch(`${API}/cotizaciones/interna`).then(r => r.json()).catch(() => []),
    ]);
    const cli = Array.isArray(cliente) ? cliente : [];
    const int = Array.isArray(internas) ? internas : [];
    const aprobadas = [...cli, ...int].filter(c => (c.nombreEstadoCotizacion || '').toLowerCase().includes('aprob')).length;
    renderStatsCards('cot-stats', [
      { n: cli.length, l: 'Cotiz. cliente' },
      { n: int.length, l: 'Cotiz. internas' },
      { n: aprobadas, l: 'Aprobadas' },
    ]);
  } catch (e) { /* sin stats */ }
}

let _rangoCot = { desde: '', hasta: '' };
let _dataCot = [];
async function cargarListaCotizaciones() {
  const cont = document.getElementById('cont-cot');
  if (!cont) return;
  const r = (typeof leerRango === 'function') ? leerRango('f-cot-desde', 'f-cot-hasta') : { desde: '', hasta: '' };
  if (!r) return;
  _rangoCot = r;
  const qs = (typeof rangoQuery === 'function') ? rangoQuery(r.desde, r.hasta) : '';
  cargarStatsCotizaciones();
  cont.innerHTML = '<p>Cargando...</p>';
  try {
    if (tipoCotActual === 'cliente') {
      const data = await fetch(`${API}/cotizaciones${qs}`).then(r => r.json());
      _dataCot = data;
      if (!data.length) { cont.innerHTML = '<p>No hay cotizaciones de cliente registradas.</p>'; return; }
      cont.innerHTML = `<table id="tbl-cot"><thead><tr>
        <th>ID</th><th>NÃºmero</th><th>Proyecto</th><th>Fecha</th><th>Total Est. (Bs)</th><th>Estado</th><th>Acciones</th>
      </tr></thead><tbody>
        ${data.map(c => `<tr>
          <td>${c.idCotizacionCliente}</td>
          <td><b>${c.numeroCotizacionCliente}</b></td>
          <td>${c.nombreProyecto}</td>
          <td>${(c.fechaCotizacion||'').substring(0,10)}</td>
          <td>${Number(c.totalEstimado||0).toFixed(2)}</td>
          <td>${badge(c.nombreEstadoCotizacion)}</td>
          <td>
            <button class="btn btn-accent" style="padding:4px 10px;font-size:.78rem;margin-right:4px;" onclick="verDetalleCotizacion('cliente', ${c.idCotizacionCliente})">Ver detalles</button>
            <button class="btn btn-accent" style="padding:4px 10px;font-size:.78rem;margin-right:4px;" onclick="imprimirCotizacionPDF('cliente', ${c.idCotizacionCliente})">Imprimir / PDF</button>
            <button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarCotizacion('cliente', ${c.idCotizacionCliente})">Eliminar</button>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
    } else {
      const data = await fetch(`${API}/cotizaciones/interna${qs}`).then(r => r.json());
      _dataCot = data;
      if (!data.length) { cont.innerHTML = '<p>No hay cotizaciones internas registradas.</p>'; return; }
      cont.innerHTML = `<table id="tbl-cot"><thead><tr>
        <th>ID</th><th>NÃºmero</th><th>Proyecto</th><th>Fecha</th><th>Total Est. (Bs)</th><th>Estado</th><th>Acciones</th>
      </tr></thead><tbody>
        ${data.map(c => `<tr>
          <td>${c.idCotizacionInterna}</td>
          <td><b>${c.numeroCotizacionInterna}</b></td>
          <td>${c.nombreProyecto}</td>
          <td>${(c.fechaCotizacion||'').substring(0,10)}</td>
          <td>${Number(c.totalEstimado||0).toFixed(2)}</td>
          <td>${badge(c.nombreEstadoCotizacion)}</td>
          <td>
            <button class="btn btn-accent" style="padding:4px 10px;font-size:.78rem;margin-right:4px;" onclick="verDetalleCotizacion('interna', ${c.idCotizacionInterna})">Ver detalles</button>
            <button class="btn btn-accent" style="padding:4px 10px;font-size:.78rem;margin-right:4px;" onclick="imprimirCotizacionPDF('interna', ${c.idCotizacionInterna})">Imprimir / PDF</button>
            <button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarCotizacion('interna', ${c.idCotizacionInterna})">Eliminar</button>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
    }
  } catch (e) {
    cont.innerHTML = '<p style="color:red">Error al cargar cotizaciones</p>';
  }
}

function ordenarPorNumero(datos, campo) {
  return [...(datos || [])].sort((a, b) => Number(a[campo] || 0) - Number(b[campo] || 0));
}

// Imprime la lista completa de cotizaciones (del tipo y rango actuales).
function imprimirListaCotizaciones() {
  if (!Array.isArray(_dataCot) || !_dataCot.length) return alert('No hay cotizaciones para imprimir.');
  const win = nuevaVentanaPDF();
  const f = v => v ? String(v).substring(0, 10) : '-';
  const n = v => Number(v || 0).toFixed(2);
  const esCliente = tipoCotActual === 'cliente';
  const total = _dataCot.reduce((s, c) => s + Number(c.totalEstimado || 0), 0);
  const filas = _dataCot.map(c => [
    esCliente ? c.numeroCotizacionCliente : c.numeroCotizacionInterna,
    c.nombreProyecto || '-', f(c.fechaCotizacion), n(c.totalEstimado), c.nombreEstadoCotizacion || '-',
  ]);
  const titulo = esCliente ? 'Cotizaciones de Cliente' : 'Cotizaciones Internas';
  const cuerpo =
    pdfTabla(titulo, ['NÃºmero', 'Proyecto', 'Fecha', 'Total Est. (Bs)', 'Estado'], filas) +
    `<div class="total">Total estimado: Bs ${n(total)}</div>`;
  imprimirReporte(win, `Reporte de ${titulo}`,
    etiquetaRango(_rangoCot.desde, _rangoCot.hasta), [cuerpo]);
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
    cargarListaCotizaciones();
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

async function onMatDmPicked(idMaterial) {
  const hint = document.getElementById('dm-precio-hint');
  if (!hint) return;
  hint.textContent = 'Cargando referencias...';
  try {
    const res = await fetch(`${API}/materiales/${idMaterial}/precio-referencia`);
    const data = await res.json();
    if (!res.ok) { hint.textContent = ''; return; }

    const partes = [`CatÃ¡logo: Bs ${parseFloat(data.precioCatalogo).toFixed(2)}`];
    if (data.ultimaCompra) {
      const fecha = new Date(data.ultimaCompra.fecha).toLocaleDateString('es-BO');
      partes.push(`Ãšltima compra: Bs ${parseFloat(data.ultimaCompra.precio).toFixed(2)} (${fecha})`);
    } else {
      partes.push('Sin compras registradas');
    }
    hint.textContent = partes.join(' Â· ');
  } catch (e) {
    hint.textContent = '';
  }
}

function calcMaterialInterno() {
  const c = parseFloat(document.getElementById('dm-cant').value) || 0;
  const p = parseFloat(document.getElementById('dm-costo').value) || 0;
  const prev = document.getElementById('dm-preview');
  if (prev) prev.textContent = (c && p) ? `Subtotal: Bs ${(c * p).toFixed(2)}` : '';
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

function cargarCotizaciones() {
  cargarListaCotizaciones();
}

async function crearCotizacionInterna() {
  const body = {
    idProyecto: parseInt(document.getElementById('ci-proyecto').value),
    numeroCotizacion: document.getElementById('ci-num').value.trim(),
    fechaCotizacion: document.getElementById('ci-fecha').value,
    observaciones: document.getElementById('ci-obs').value.trim()
  };

  if (!body.idProyecto || !body.numeroCotizacion || !body.fechaCotizacion) {
    return msg('msg-ci', 'Proyecto, nÃºmero y fecha son obligatorios', 'err');
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

    msg('msg-ci', `CotizaciÃ³n interna creada con ID: ${data.idCotizacionInterna}`, 'ok');

    ['ci-proy-nom', 'ci-proyecto', 'ci-num', 'ci-fecha', 'ci-obs'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
  } catch (e) {
    msg('msg-ci', 'Error de conexiÃ³n', 'err');
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
    const prevDm = document.getElementById('dm-preview');
    if (prevDm) prevDm.textContent = '';
    const hintDm = document.getElementById('dm-precio-hint');
    if (hintDm) hintDm.textContent = '';
  } catch (e) {
    msg('msg-dm', 'Error de conexiÃ³n', 'err');
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
    msg('msg-mo', 'Error de conexiÃ³n', 'err');
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
               <th>NÃºmero</th>
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
               <td>
                 <button class="btn btn-accent" style="padding:4px 10px;font-size:.78rem;margin-right:4px;" onclick="verDetalleCotizacion('cliente', ${c.idCotizacionCliente})">Ver detalles</button>
                 <button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarCotizacion('cliente', ${c.idCotizacionCliente})">Eliminar</button>
               </td>
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
               <th>NÃºmero</th>
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
               <td>
                 <button class="btn btn-accent" style="padding:4px 10px;font-size:.78rem;margin-right:4px;" onclick="verDetalleCotizacion('interna', ${c.idCotizacionInterna})">Ver detalles</button>
                 <button class="btn btn-red" style="padding:4px 10px;font-size:.78rem;" onclick="eliminarCotizacion('interna', ${c.idCotizacionInterna})">Eliminar</button>
               </td>
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
    if (!q) { drop.innerHTML = ''; drop.style.display = 'none'; return; }
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
    msg('msg-editar-cot', 'Error al cargar la cotizaciÃ³n', 'err');
  }
}

async function guardarEdicionCotizacion() {
  const tipo = document.getElementById('ed-tipo').value;
  const id = document.getElementById('ed-id').value;
  if (!id) return msg('msg-editar-cot', 'Busque una cotizaciÃ³n primero.', 'err');
  const body = {
    numeroCotizacion: document.getElementById('ed-numero').value.trim(),
    fechaCotizacion: document.getElementById('ed-fecha').value,
    observaciones: document.getElementById('ed-obs').value.trim()
  };
  if (tipo === 'cliente') body.fechaValidez = document.getElementById('ed-validez').value || null;
  if (!body.numeroCotizacion || !body.fechaCotizacion) {
    return msg('msg-editar-cot', 'NÃºmero y fecha son obligatorios.', 'err');
  }
  try {
    const res = await fetch(`${API}/cotizaciones/${tipo}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-editar-cot', 'Error: ' + data.error, 'err');
    msg('msg-editar-cot', 'CotizaciÃ³n actualizada correctamente', 'ok');
    cargarCotizaciones();
  } catch (e) {
    msg('msg-editar-cot', 'Error de conexiÃ³n', 'err');
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
    if (!q) { drop.innerHTML = ''; drop.style.display = 'none'; return; }
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
    msg('msg-est', 'Error de conexiÃ³n', 'err');
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
  if (!confirm(`Â¿Eliminar la cotizaciÃ³n ${tipo} ID ${id}? Se borrarÃ¡n tambiÃ©n sus detalles. Esta acciÃ³n no se puede deshacer.`)) return;
  try {
    const res = await fetch(`${API}/cotizaciones/${tipo}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return alert('Error: ' + data.error);
    cargarCotizaciones();
    const ppId = document.getElementById('pp-id');
    if (ppId && ppId.value) buscarPorProyecto();
  } catch (e) {
    alert('Error de conexiÃ³n');
  }
}

// â”€â”€ Ver detalles de una cotizaciÃ³n (monto total, proyecto, Ã­tems, personal) â”€â”€
function cerrarModalCot() {
  const m = document.getElementById('modal-cot');
  if (m) m.remove();
}

function tablaSimple(titulo, encabezados, filas) {
  if (!filas.length) return `<p style="color:#718096;">Sin ${titulo.toLowerCase()}.</p>`;
  return `<h4 style="margin:14px 0 8px;color:var(--primary);">${titulo}</h4>
    <table style="width:100%;border-collapse:collapse;font-size:.85rem;">
      <thead><tr>${encabezados.map(h => `<th style="text-align:left;border-bottom:2px solid #123823;padding:6px;">${h}</th>`).join('')}</tr></thead>
      <tbody>${filas.map(f => `<tr>${f.map(c => `<td style="border-bottom:1px solid #e1e6dd;padding:6px;">${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
}

async function verDetalleCotizacion(tipo, id) {
  try {
    const d = await fetch(`${API}/cotizaciones/${tipo}/${id}/detalle`).then(r => r.json());
    if (d.error) return alert('Error: ' + d.error);

    const numero = d.numeroCotizacionCliente || d.numeroCotizacionInterna || ('#' + id);
    let cuerpo = `
      <div style="display:flex;flex-wrap:wrap;gap:8px 24px;margin-bottom:10px;font-size:.9rem;">
        <div><b>Proyecto:</b> ${d.nombreProyecto || '-'}</div>
        ${d.nombreCliente ? `<div><b>Cliente:</b> ${d.nombreCliente}</div>` : ''}
        <div><b>Estado:</b> ${d.estado || '-'}</div>
        <div><b>Fecha:</b> ${(d.fechaCotizacion || '').substring(0, 10) || '-'}</div>
        ${d.numeroInterna ? `<div><b>Generada de interna:</b> ${d.numeroInterna} (+${Number(d.porcentajeUtilidad || 0).toFixed(0)}% utilidad)</div>` : ''}
      </div>`;

    if (tipo === 'cliente') {
      cuerpo += tablaSimple('Ãtems cotizados', ['Concepto', 'Cantidad', 'P. Unit (Bs)', 'Subtotal (Bs)'],
        (d.items || []).map(i => [i.concepto, i.cantidad, Number(i.precioUnitario).toFixed(2), Number(i.subtotal).toFixed(2)]));
    } else {
      cuerpo += tablaSimple('Materiales', ['Material', 'Cantidad', 'Costo Unit (Bs)', 'Subtotal (Bs)'],
        (d.materiales || []).map(i => [i.nombreMaterial, i.cantidadEstimada, Number(i.costoUnitarioEstimado).toFixed(2), Number(i.subtotal).toFixed(2)]));
      cuerpo += tablaSimple('Personal asignado (mano de obra)', ['Cargo', 'Personas', 'Horas', 'Pago/Hora (Bs)', 'Subtotal (Bs)'],
        (d.personal || []).map(i => [i.nombreCargo, i.cantidadPersonas, i.horasEstimadas, Number(i.pagoPorHora).toFixed(2), Number(i.subtotal).toFixed(2)]));
      cuerpo += `<div style="margin-top:10px;font-size:.85rem;color:#445;">
        Materiales: <b>Bs ${Number(d.totalMateriales).toFixed(2)}</b> &nbsp;Â·&nbsp;
        Mano de obra: <b>Bs ${Number(d.totalManoObra).toFixed(2)}</b></div>`;
    }

    cuerpo += `<div style="margin-top:16px;padding-top:12px;border-top:2px solid #123823;font-size:1.05rem;">
      <b>Monto total estimado: Bs ${Number(d.montoTotal).toFixed(2)}</b></div>`;

    cerrarModalCot();
    const modal = document.createElement('div');
    modal.id = 'modal-cot';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:flex-start;justify-content:center;z-index:1000;padding:40px 16px;overflow:auto;';
    modal.onclick = (e) => { if (e.target === modal) cerrarModalCot(); };
    modal.innerHTML = `
      <div style="background:#fff;border-radius:10px;max-width:760px;width:100%;padding:24px;box-shadow:0 10px 40px rgba(0,0,0,.25);">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2F5F2F;padding-bottom:10px;margin-bottom:14px;">
          <h3 style="color:#173F24;">Detalle de cotizaciÃ³n ${tipo === 'cliente' ? 'cliente' : 'interna'} â€” ${numero}</h3>
          <div style="display:flex;gap:8px;">
            <button onclick="imprimirCotizacionPDF('${tipo}', ${id})" style="background:#2F5F2F;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;">Imprimir / PDF</button>
            <button onclick="cerrarModalCot()" style="background:#B91C1C;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;">Cerrar</button>
          </div>
        </div>
        ${cuerpo}
      </div>`;
    document.body.appendChild(modal);
  } catch (e) {
    alert('Error al cargar el detalle de la cotizaciÃ³n');
  }
}

// â”€â”€ Imprimir una cotizaciÃ³n (interna o cliente) en PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function imprimirCotizacionPDF(tipo, id) {
  const win = nuevaVentanaPDF();
  try {
    const d = await fetch(`${API}/cotizaciones/${tipo}/${id}/detalle`).then(r => r.json());
    if (d.error) { if (win) win.close(); return alert('Error: ' + d.error); }

    const numero = d.numeroCotizacionCliente || d.numeroCotizacionInterna || ('#' + id);
    const esCliente = tipo === 'cliente';

    let cuerpo = `<h1>CotizaciÃ³n ${esCliente ? 'Cliente' : 'Interna'} â€” ${numero}</h1>`;
    cuerpo += pdfDatos([
      ['Proyecto', d.nombreProyecto],
      ['Cliente', d.nombreCliente],
      ['Estado', d.estado],
      ['Fecha', (d.fechaCotizacion || '').substring(0, 10)],
      ['Validez', (d.fechaValidez || '').substring(0, 10)],
      esCliente && d.numeroInterna
        ? ['Generada de interna', `${d.numeroInterna} (+${Number(d.porcentajeUtilidad || 0).toFixed(0)}% utilidad)`]
        : null,
      ['Observaciones', d.observaciones],
    ]);

    if (esCliente) {
      cuerpo += pdfTabla('Ãtems cotizados', ['Concepto', 'Cantidad', 'P. Unit (Bs)', 'Subtotal (Bs)'],
        (d.items || []).map(i => [i.concepto, i.cantidad, Number(i.precioUnitario).toFixed(2), Number(i.subtotal).toFixed(2)]));
    } else {
      cuerpo += pdfTabla('Materiales', ['Material', 'Cantidad', 'Costo Unit (Bs)', 'Subtotal (Bs)'],
        (d.materiales || []).map(i => [i.nombreMaterial, i.cantidadEstimada, Number(i.costoUnitarioEstimado).toFixed(2), Number(i.subtotal).toFixed(2)]));
      cuerpo += pdfTabla('Personal asignado (mano de obra)', ['Cargo', 'Personas', 'Horas', 'Pago/Hora (Bs)', 'Subtotal (Bs)'],
        (d.personal || []).map(i => [i.nombreCargo, i.cantidadPersonas, i.horasEstimadas, Number(i.pagoPorHora).toFixed(2), Number(i.subtotal).toFixed(2)]));
      cuerpo += pdfDatos([
        ['Materiales', `Bs ${Number(d.totalMateriales).toFixed(2)}`],
        ['Mano de obra', `Bs ${Number(d.totalManoObra).toFixed(2)}`],
      ]);
    }
    cuerpo += `<div class="total">Monto total: Bs ${Number(d.montoTotal).toFixed(2)}</div>`;

    escribirImpresionPDF(win, `CotizaciÃ³n ${numero}`, cuerpo);
  } catch (e) {
    if (win) win.close();
    alert('Error al generar el PDF de la cotizaciÃ³n');
  }
}

// â”€â”€ Generar cotizaciÃ³n cliente a partir de una interna aprobada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let gcInternaData = null;

async function onInternaGcPicked(idInterna) {
  try {
    const d = await fetch(`${API}/cotizaciones/interna/${idInterna}/detalle`).then(r => r.json());
    if (d.error) { gcInternaData = null; document.getElementById('gc-resumen').innerHTML = ''; return msg('msg-gc', d.error, 'err'); }
    gcInternaData = d;
    calcPreviewGenerar();
  } catch (e) {
    gcInternaData = null;
    document.getElementById('gc-resumen').innerHTML = '';
    msg('msg-gc', 'Error al cargar la cotizaciÃ³n interna', 'err');
  }
}

function calcPreviewGenerar() {
  const cont = document.getElementById('gc-resumen');
  if (!cont) return;
  if (!gcInternaData) { cont.innerHTML = ''; return; }

  const pct = parseFloat(document.getElementById('gc-pct').value) || 0;
  const mult = 1 + pct / 100;
  const mat = Number(gcInternaData.totalMateriales || 0);
  const mo  = Number(gcInternaData.totalManoObra || 0);
  const matCli = mat * mult, moCli = mo * mult;
  const estado = gcInternaData.estado || '-';
  const aprobada = estado.toLowerCase() === 'aprobada';

  const fila = (concepto, costo, cliente) => `<tr>
      <td style="padding:5px;">${concepto}</td>
      <td style="text-align:right;padding:5px;">Bs ${costo.toFixed(2)}</td>
      <td style="text-align:right;padding:5px;"><b>Bs ${cliente.toFixed(2)}</b></td>
    </tr>`;

  cont.innerHTML = `
    <div style="background:#f7f8f6;border:1px solid var(--border);border-radius:8px;padding:14px;font-size:.88rem;">
      <div style="margin-bottom:8px;">
        <b>Interna:</b> ${gcInternaData.numeroCotizacionInterna || ''} Â· ${gcInternaData.nombreProyecto || ''} Â· Estado: ${badge(estado)}
      </div>
      ${aprobada ? '' : '<div style="color:#991B1B;font-weight:600;margin-bottom:8px;">âš  La interna no estÃ¡ Aprobada; no se podrÃ¡ generar hasta que lo estÃ©.</div>'}
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:2px solid #123823;">
          <th style="text-align:left;padding:5px;">Concepto</th>
          <th style="text-align:right;padding:5px;">Costo interno</th>
          <th style="text-align:right;padding:5px;">+${pct}% â†’ Cliente</th>
        </tr></thead>
        <tbody>
          ${fila('Materiales', mat, matCli)}
          ${fila('Mano de obra', mo, moCli)}
        </tbody>
        <tfoot><tr style="border-top:2px solid #123823;">
          <td style="padding:5px;"><b>Total</b></td>
          <td style="text-align:right;padding:5px;">Bs ${(mat + mo).toFixed(2)}</td>
          <td style="text-align:right;padding:5px;"><b>Bs ${(matCli + moCli).toFixed(2)}</b></td>
        </tr></tfoot>
      </table>
    </div>`;
}

async function generarCotizacionCliente() {
  const idInterna = document.getElementById('gc-int').value;
  const body = {
    porcentaje: parseFloat(document.getElementById('gc-pct').value),
    numeroCotizacion: document.getElementById('gc-num').value.trim(),
    fechaCotizacion: document.getElementById('gc-fecha').value,
    fechaValidez: document.getElementById('gc-validez').value || null,
    observaciones: document.getElementById('gc-obs').value.trim()
  };

  if (!idInterna) return msg('msg-gc', 'Selecciona una cotizaciÃ³n interna', 'err');
  if (isNaN(body.porcentaje) || body.porcentaje < 0) return msg('msg-gc', 'Indica un porcentaje vÃ¡lido (â‰¥ 0)', 'err');
  if (!body.numeroCotizacion || !body.fechaCotizacion) return msg('msg-gc', 'NÃºmero y fecha son obligatorios', 'err');

  try {
    const res = await fetch(`${API}/cotizaciones/interna/${idInterna}/generar-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return msg('msg-gc', 'Error: ' + data.error, 'err');

    msg('msg-gc', `CotizaciÃ³n cliente generada (ID ${data.idCotizacionCliente}). Total: Bs ${Number(data.montoTotal).toFixed(2)}`, 'ok');
    ['gc-int-nom', 'gc-int', 'gc-num', 'gc-validez', 'gc-obs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    gcInternaData = null;
    document.getElementById('gc-resumen').innerHTML = '';
    cargarCotizaciones();
  } catch (e) {
    msg('msg-gc', 'Error de conexiÃ³n', 'err');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarSelectCargos9();
  const hoy = new Date().toISOString().substring(0, 10);
  const gcFecha = document.getElementById('gc-fecha');
  if (gcFecha && !gcFecha.value) gcFecha.value = hoy;
});

cargarListaCotizaciones();
