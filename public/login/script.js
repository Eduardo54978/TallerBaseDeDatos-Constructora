const API = 'http://localhost:3000/api';

// Elementos del DOM
const btnLogin  = document.getElementById('btn-login');
const errEl     = document.getElementById('error-msg');
const loadEl    = document.getElementById('loading');
const inputUser = document.getElementById('username');
const inputPass = document.getElementById('password');

// Iniciar sesión al presionar Enter
inputPass.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') iniciarSesion();
});

inputUser.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') iniciarSesion();
});

// Iniciar sesión al click
btnLogin.addEventListener('click', iniciarSesion);

async function iniciarSesion() {
    const username = inputUser.value.trim();
    const password = inputPass.value.trim();

    // Limpiar mensajes
    errEl.style.display  = 'none';
    loadEl.style.display = 'none';

    // Validar campos
    if (!username || !password) {
        mostrarError('⚠️ Ingresa usuario y contraseña');
        return;
    }

    // Mostrar cargando
    loadEl.style.display = 'block';
    btnLogin.disabled    = true;

    try {
        const res  = await fetch(`${API}/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ username, password })
        });

        const data = await res.json();
        loadEl.style.display = 'none';
        btnLogin.disabled    = false;

        if (!res.ok) {
            mostrarError('❌ ' + data.error);
            return;
        }

        // Guardar sesión
        localStorage.setItem('usuario', JSON.stringify(data));

        // Redirigir al sistema
        window.location.href = '../index.html';

    } catch (e) {
        loadEl.style.display = 'none';
        btnLogin.disabled    = false;
        mostrarError('❌ Error de conexión con el servidor');
    }
}

function mostrarError(texto) {
    errEl.textContent   = texto;
    errEl.style.display = 'block';
}