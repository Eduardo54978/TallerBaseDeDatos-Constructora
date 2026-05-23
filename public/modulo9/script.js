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

    ['cc-proyecto', 'cc-num', 'cc-fecha', 'cc-validez', 'cc-obs'].forEach(id => {
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

    ['ci-proyecto', 'ci-num', 'ci-fecha', 'ci-obs'].forEach(id => {
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

    ['dm-mat', 'dm-cant', 'dm-costo'].forEach(idInput => {
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
             </tr>
           </thead>
           <tbody>
             ${clienteOrdenadas.map(c => `<tr>
               <td>${c.idCotizacionCliente}</td>
               <td>${c.numeroCotizacionCliente || '-'}</td>
               <td>${c.fechaCotizacion ? c.fechaCotizacion.substring(0, 10) : '-'}</td>
               <td>${c.fechaValidez ? c.fechaValidez.substring(0, 10) : '-'}</td>
               <td>${badge(c.nombreEstadoCotizacion)}</td>
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
             </tr>
           </thead>
           <tbody>
             ${internasOrdenadas.map(c => `<tr>
               <td>${c.idCotizacionInterna}</td>
               <td>${c.numeroCotizacionInterna || '-'}</td>
               <td>${c.fechaCotizacion ? c.fechaCotizacion.substring(0, 10) : '-'}</td>
               <td>${badge(c.nombreEstadoCotizacion)}</td>
             </tr>`).join('')}
           </tbody>
         </table>`
      : `<p style="color:#718096; margin-top:12px;">No hay cotizaciones internas para este proyecto.</p>`;

    cont.innerHTML = tablaCliente + tablaInterna;
  } catch (e) {
    document.getElementById('cont-por-proyecto').innerHTML = '<p style="color:red">Error al buscar</p>';
  }
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

    cargarCotizaciones();
  } catch (e) {
    msg('msg-est', 'Error de conexión', 'err');
  }
}

cargarCotizaciones();