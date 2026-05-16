const API = 'http://localhost:3000/api';

function show(name, el) {
    event.preventDefault();
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
    el.classList.add('active');
    const titles = {
        dashboard:'Principal', empleados:'Empleados', proyectos:'Proyectos',
        materiales:'Materiales', contratos:'Contratos', proveedores:'Proveedores', inventario:'Inventario'
    };
    document.getElementById('page-title').textContent = titles[name];
    if (name === 'empleados')   cargarEmpleados();
    if (name === 'proyectos')   cargarProyectos();
    if (name === 'materiales')  cargarMateriales();
    if (name === 'contratos')   cargarContratos();
    if (name === 'proveedores') cargarProveedores();
    if (name === 'inventario')  cargarInventario();
    if (name === 'clientes')     cargarClientes();
    if (name === 'horas')        cargarHoras();
    if (name === 'cotizaciones') cargarCotizaciones();
}

function filtrar(id, texto) {
    const t = document.getElementById(id);
    if (!t) return;
    t.querySelectorAll('tbody tr').forEach(r => {
        r.style.display = r.innerText.toLowerCase().includes(texto.toLowerCase()) ? '' : 'none';
    });
}

function badge(texto) {
    const t = (texto||'').toLowerCase();
    if (t.includes('ejecuci'))  return `<span class="badge badge-blue">${texto}</span>`;
    if (t.includes('finaliz'))  return `<span class="badge badge-green">${texto}</span>`;
    if (t.includes('suspendid'))return `<span class="badge badge-red">${texto}</span>`;
    if (t.includes('planif'))   return `<span class="badge badge-yellow">${texto}</span>`;
    if (t.includes('activo'))   return `<span class="badge badge-green">${texto}</span>`;
    if (t.includes('inactivo')) return `<span class="badge badge-red">${texto}</span>`;
    if (t.includes('vigente'))  return `<span class="badge badge-blue">${texto}</span>`;
    if (t.includes('pendiente'))return `<span class="badge badge-yellow">${texto}</span>`;
    if (t.includes('bajo'))     return `<span class="badge badge-red">${texto}</span>`;
    return `<span class="badge badge-green">${texto}</span>`;
}

async function cargarDashboard() {
    try {
        const [emp, proy, cont, prov] = await Promise.all([
            fetch(`${API}/empleados`).then(r=>r.json()),
            fetch(`${API}/proyectos`).then(r=>r.json()),
            fetch(`${API}/contratos`).then(r=>r.json()),
            fetch(`${API}/proveedores`).then(r=>r.json()),
        ]);
        document.getElementById('s-emp').textContent  = emp.length;
        document.getElementById('s-proy').textContent = proy.length;
        document.getElementById('s-cont').textContent = cont.length;
        document.getElementById('s-prov').textContent = prov.length;

        const activos = proy.filter(p => p.nombreEstadoProyecto && p.nombreEstadoProyecto.includes('ejecuci'));
        document.getElementById('dash-proyectos').innerHTML = `
        <table><thead><tr><th>Proyecto</th><th>Tipo</th><th>Cliente</th><th>Inicio</th><th>Estado</th></tr></thead>
        <tbody>${activos.map(p=>`
            <tr>
                <td>${p.nombreProyecto}</td>
                <td>${p.nombreTipoProyecto||''}</td>
                <td>${p.cliente||''}</td>
                <td>${p.fechaInicio?p.fechaInicio.substring(0,10):''}</td>
                <td>${badge(p.nombreEstadoProyecto)}</td>
            </tr>`).join('')}
        </tbody></table>`;
    } catch(e) { console.error(e); }
}

async function cargarEmpleados() {
    try {
        const data = await fetch(`${API}/empleados`).then(r=>r.json());
        document.getElementById('cont-empleados').innerHTML = `
        <table id="tbl-emp"><thead><tr>
            <th>#</th><th>Nombre</th><th>Apellido</th><th>Cargo</th>
            <th>Departamento</th><th>Salario</th><th>Estado</th>
        </tr></thead><tbody>
        ${data.map(e=>`<tr>
            <td>${e.idEmpleado}</td>
            <td>${e.nombre}</td>
            <td>${e.apellido}</td>
            <td>${e.nombreCargo||''}</td>
            <td>${e.nombreDepartamento||''}</td>
            <td>Bs ${Number(e.salario||0).toLocaleString()}</td>
            <td>${badge(e.nombreEstadoEmpleado)}</td>
        </tr>`).join('')}
        </tbody></table>`;
    } catch(e) {
        document.getElementById('cont-empleados').innerHTML = '<p style="color:red">Error al cargar empleados</p>';
    }
}

async function cargarProyectos() {
    try {
        const data = await fetch(`${API}/proyectos`).then(r=>r.json());
        document.getElementById('cont-proyectos').innerHTML = `
        <table id="tbl-proy"><thead><tr>
            <th>#</th><th>Proyecto</th><th>Tipo</th><th>Cliente</th>
            <th>Inicio</th><th>Fin Estimado</th><th>Estado</th>
        </tr></thead><tbody>
        ${data.map(p=>`<tr>
            <td>${p.idProyecto}</td>
            <td>${p.nombreProyecto}</td>
            <td>${p.nombreTipoProyecto||''}</td>
            <td>${p.cliente||''}</td>
            <td>${p.fechaInicio?p.fechaInicio.substring(0,10):''}</td>
            <td>${p.fechaFinEstimada?p.fechaFinEstimada.substring(0,10):''}</td>
            <td>${badge(p.nombreEstadoProyecto)}</td>
        </tr>`).join('')}
        </tbody></table>`;
    } catch(e) {
        document.getElementById('cont-proyectos').innerHTML = '<p style="color:red">Error al cargar proyectos</p>';
    }
}

async function cargarMateriales() {
    try {
        const data = await fetch(`${API}/materiales`).then(r=>r.json());
        document.getElementById('cont-materiales').innerHTML = `
        <table id="tbl-mat"><thead><tr>
            <th>#</th><th>Material</th><th>Tipo</th><th>Unidad</th><th>Precio</th>
        </tr></thead><tbody>
        ${data.map(m=>`<tr>
            <td>${m.idMaterial}</td>
            <td>${m.nombreMaterial}</td>
            <td>${m.nombreTipoMaterial||''}</td>
            <td>${m.nombreUnidadMedida||''}</td>
            <td>Bs ${Number(m.precioUnitario||0).toFixed(2)}</td>
        </tr>`).join('')}
        </tbody></table>`;
    } catch(e) {
        document.getElementById('cont-materiales').innerHTML = '<p style="color:red">Error al cargar materiales</p>';
    }
}

async function cargarContratos() {
    try {
        const data = await fetch(`${API}/contratos`).then(r=>r.json());
        document.getElementById('cont-contratos').innerHTML = `
        <table id="tbl-cont"><thead><tr>
            <th>Numero</th><th>Proyecto</th><th>Tipo</th>
            <th>Monto Total</th><th>Vencimiento</th><th>Estado</th>
        </tr></thead><tbody>
        ${data.map(c=>`<tr>
            <td>${c.numeroContrato}</td>
            <td>${c.nombreProyecto||''}</td>
            <td>${c.nombreTipoContrato||''}</td>
            <td>Bs ${Number(c.montoTotal||0).toLocaleString()}</td>
            <td>${c.fechaVencimiento?c.fechaVencimiento.substring(0,10):''}</td>
            <td>${badge(c.nombreEstadoContrato)}</td>
        </tr>`).join('')}
        </tbody></table>`;
    } catch(e) {
        document.getElementById('cont-contratos').innerHTML = '<p style="color:red">Error al cargar contratos</p>';
    }
}

async function cargarProveedores() {
    try {
        const data = await fetch(`${API}/proveedores`).then(r=>r.json());
        document.getElementById('cont-proveedores').innerHTML = `
        <table id="tbl-prov"><thead><tr>
            <th>#</th><th>Proveedor</th><th>Ciudad</th><th>Telefono</th><th>Email</th>
        </tr></thead><tbody>
        ${data.map(p=>`<tr>
            <td>${p.idProveedor}</td>
            <td>${p.nombreProveedor}</td>
            <td>${p.ciudad||''}</td>
            <td>${p.numCelular||''}</td>
            <td>${p.email||''}</td>
        </tr>`).join('')}
        </tbody></table>`;
    } catch(e) {
        document.getElementById('cont-proveedores').innerHTML = '<p style="color:red">Error al cargar proveedores</p>';
    }
}

async function cargarInventario() {
    try {
        const data = await fetch(`${API}/inventario`).then(r=>r.json());
        document.getElementById('cont-inventario').innerHTML = `
        <table id="tbl-inv"><thead><tr>
            <th>Material</th><th>Stock Actual</th><th>Stock Minimo</th><th>Ubicacion</th><th>Estado</th>
        </tr></thead><tbody>
        ${data.map(i=>{
            const bajo = parseFloat(i.stockActual) < parseFloat(i.stockMinimo);
            return `<tr>
                <td>${i.nombreMaterial}</td>
                <td>${i.stockActual}</td>
                <td>${i.stockMinimo}</td>
                <td>${i.ubicacion||''}</td>
                <td>${badge(bajo ? 'STOCK BAJO' : 'OK')}</td>
            </tr>`;
        }).join('')}
        </tbody></table>`;
    } catch(e) {
        document.getElementById('cont-inventario').innerHTML = '<p style="color:red">Error al cargar inventario</p>';
    }
}
// MODULO 7: CLIENTES
async function cargarClientes() {
    try {
        const data = await fetch(`${API}/clientes`).then(r=>r.json());
        document.getElementById('cont-clientes').innerHTML = `
        <table id="tbl-cli"><thead><tr>
            <th>#</th><th>Nombre</th><th>Tipo</th><th>Documento</th>
            <th>Celular</th><th>Email</th><th>Fecha Registro</th>
        </tr></thead><tbody>
        ${data.map(c=>`<tr>
            <td>${c.idCliente}</td>
            <td>${c.nombre}</td>
            <td>${badge(c.nombreTipoCliente)}</td>
            <td>${c.documentoID||''}</td>
            <td>${c.numCelular||''}</td>
            <td>${c.email||''}</td>
            <td>${c.fechaRegistro?c.fechaRegistro.substring(0,10):''}</td>
        </tr>`).join('')}
        </tbody></table>`;
    } catch(e) {
        document.getElementById('cont-clientes').innerHTML = '<p style="color:red">Error al cargar clientes</p>';
    }
}

// MODULO 8: REGISTRO DE HORAS
async function cargarHoras() {
    try {
        const data = await fetch(`${API}/horas`).then(r=>r.json());
        document.getElementById('cont-horas').innerHTML = `
        <table id="tbl-horas"><thead><tr>
            <th>#</th><th>Empleado</th><th>Proyecto</th>
            <th>Fecha</th><th>Horas</th><th>Pago/Hora</th><th>Total</th>
        </tr></thead><tbody>
        ${data.map(h=>`<tr>
            <td>${h.idRegistroHoras}</td>
            <td>${h.nombre} ${h.apellido}</td>
            <td>${h.nombreProyecto||''}</td>
            <td>${h.fecha?h.fecha.substring(0,10):''}</td>
            <td>${h.horasTrabajadas}</td>
            <td>Bs ${Number(h.pagoPorHora||0).toFixed(2)}</td>
            <td>Bs ${Number(h.totalPago||0).toFixed(2)}</td>
        </tr>`).join('')}
        </tbody></table>`;
    } catch(e) {
        document.getElementById('cont-horas').innerHTML = '<p style="color:red">Error al cargar horas</p>';
    }
}

// MODULO 9: COTIZACIONES
async function cargarCotizaciones() {
    try {
        const data = await fetch(`${API}/cotizaciones`).then(r=>r.json());
        document.getElementById('cont-cotizaciones').innerHTML = `
        <table id="tbl-cot"><thead><tr>
            <th>Número</th><th>Proyecto</th><th>Fecha</th>
            <th>Validez</th><th>Observaciones</th><th>Estado</th>
        </tr></thead><tbody>
        ${data.map(c=>`<tr>
            <td>${c.numeroCotizacionCliente}</td>
            <td>${c.nombreProyecto||''}</td>
            <td>${c.fechaCotizacion?c.fechaCotizacion.substring(0,10):''}</td>
            <td>${c.fechaValidez?c.fechaValidez.substring(0,10):''}</td>
            <td>${c.observaciones||''}</td>
            <td>${badge(c.nombreEstadoCotizacion)}</td>
        </tr>`).join('')}
        </tbody></table>`;
    } catch(e) {
        document.getElementById('cont-cotizaciones').innerHTML = '<p style="color:red">Error al cargar cotizaciones</p>';
    }
}
function toggleMenu() {
    const menu = document.getElementById('menu-items');
    menu.classList.toggle('oculto');
}
cargarDashboard();