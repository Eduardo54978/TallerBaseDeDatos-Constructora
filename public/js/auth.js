const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

// Si no hay sesión, redirigir al login
if (!usuario) {
    window.location.href = 'login/index.html';
}

// Módulos que puede ver cada rol
const MODULOS_POR_ROL = {
    rol_gerente:    ['dashboard','proyectos','materiales','pagos','compras',
                     'contratos','proveedores','clientes','empleados','cotizaciones'],
    rol_jefe_obra:  ['dashboard','proyectos','empleados','materiales'],
    rol_rrhh:       ['dashboard','empleados','cotizaciones'],
    rol_logistica:  ['dashboard','proveedores','materiales','compras'],
    rol_secretaria: ['dashboard','clientes','contratos'],
    rol_contador:   ['dashboard','contratos','pagos'],
    rol_consulta:   ['dashboard','proyectos','materiales','contratos',
                     'proveedores','clientes','empleados','cotizaciones'],
};

// Nombres para mostrar en el sidebar
const NOMBRES_MODULOS = {
    dashboard:    'Panel Principal',
    proyectos:    'M1 - Proyectos',
    materiales:   'M2 - Materiales',
    pagos:        'M3 - Pagos',
    compras:      'M4 - Compras',
    contratos:    'M5 - Contratos',
    proveedores:  'M6 - Proveedores',
    clientes:     'M7 - Clientes',
    empleados:    'M8 - Empleados',
    cotizaciones: 'M9 - Cotizaciones',
    horas:        'Registro de Horas',
    inventario:   'Inventario',
};

// Links de módulos con página propia
const LINKS_MODULOS = {
    proyectos:    'modulo1/index.html',
    materiales:   'modulo2/index.html',
    pagos:        'modulo3/index.html',
    compras:      'modulo4/index.html',
    contratos:    'modulo5/index.html',
    proveedores:  'modulo6/index.html',
    clientes:     'modulo7/index.html',
    empleados:    'modulo8/index.html',
    cotizaciones: 'modulo9/index.html',
};

function inicializarSistema() {
    if (!usuario) return;

    const modulosPermitidos = MODULOS_POR_ROL[usuario.rol] || ['dashboard'];

    // Mostrar nombre y rol en topbar
    const topbar = document.getElementById('topbar-usuario');
    if (topbar) {
        topbar.innerHTML = `
            <span style="font-size:0.85rem; opacity:0.85;">
                ${usuario.nombreCompleto}
                <span style="background:#f0a500; color:#1a2e4a; padding:2px 8px;
                             border-radius:10px; font-size:0.75rem; font-weight:700; margin-left:6px;">
                    ${usuario.rol.replace('rol_','').toUpperCase()}
                </span>
            </span>
            <button onclick="cerrarSesion()" style="background:transparent; border:1px solid rgba(255,255,255,0.4);
                    color:white; padding:4px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem; margin-left:12px;">
                Cerrar sesión
            </button>`;
    }

    // Generar menú dinámico según rol
    const menuEl = document.getElementById('menu-items');
    if (menuEl) {
        menuEl.innerHTML = modulosPermitidos.map(mod => {
            const link   = LINKS_MODULOS[mod];
            const nombre = NOMBRES_MODULOS[mod] || mod;
            if (link) {
                return `<a href="${link}">${nombre}</a>`;
            }
            return `<a href="#" onclick="show('${mod}',this)">${nombre}</a>`;
        }).join('');
    }

    // Ocultar secciones y mostrar solo las permitidas
    document.querySelectorAll('.section').forEach(sec => {
        sec.style.display = 'none';
    });
    modulosPermitidos.forEach(mod => {
        const sec = document.getElementById('section-' + mod);
        if (sec) sec.style.display = 'block';
    });

    // Mostrar dashboard por defecto
document.querySelectorAll('.section').forEach(sec => {
    sec.style.display = 'none';
});
const dash = document.getElementById('section-dashboard');
if (dash) {
    dash.style.display = 'block';
    dash.classList.add('active');
}
cargarDashboard();
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    window.location.href = 'login/index.html';
}

document.addEventListener('DOMContentLoaded', inicializarSistema);