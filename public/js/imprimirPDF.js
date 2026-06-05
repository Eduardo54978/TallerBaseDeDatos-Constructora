// ─────────────────────────────────────────────────────────────────────────────
// Utilidad compartida para imprimir documentos en PDF.
// Abre una ventana con un formato limpio y lanza el diálogo de impresión del
// navegador; desde ahí el usuario elige "Guardar como PDF".
// ─────────────────────────────────────────────────────────────────────────────

const EMPRESA_PDF = {
  nombre: 'Constructora',
  subtitulo: 'Sistema de Gestión',
};

// Escapa texto para evitar romper el HTML del documento.
function _pdfEsc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Bloque de pares clave/valor (Proyecto, Cliente, Fecha, etc.).
function pdfDatos(pares) {
  return `<div class="datos">${pares
    .filter(p => p && p[1] != null && p[1] !== '')
    .map(([k, v]) => `<div><span class="k">${_pdfEsc(k)}:</span> <span class="v">${_pdfEsc(v)}</span></div>`)
    .join('')}</div>`;
}

// Tabla con cabecera; la primera columna va a la izquierda, el resto a la derecha.
function pdfTabla(titulo, encabezados, filas) {
  if (!filas || !filas.length)
    return `<h3>${_pdfEsc(titulo)}</h3><p class="vacio">Sin ${_pdfEsc(titulo.toLowerCase())}.</p>`;
  return `
    <h3>${_pdfEsc(titulo)}</h3>
    <table>
      <thead><tr>${encabezados.map((h, i) => `<th class="${i === 0 ? '' : 'num'}">${_pdfEsc(h)}</th>`).join('')}</tr></thead>
      <tbody>${filas.map(f => `<tr>${f.map((c, i) => `<td class="${i === 0 ? '' : 'num'}">${_pdfEsc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
}

// Abre la ventana de inmediato, dentro del gesto del clic, para que el navegador
// no la bloquee como pop-up. Devuelve la referencia para escribir el contenido
// más tarde (p. ej. después de un fetch). Muestra un aviso de "generando".
function nuevaVentanaPDF() {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) {
    win.document.write('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">' +
      '<title>Generando documento…</title></head>' +
      '<body style="font-family:\'Segoe UI\',Arial,sans-serif;color:#555;padding:48px;">' +
      'Generando documento…</body></html>');
  }
  return win;
}

// Escribe el documento final en la ventana ya abierta y lanza el diálogo de impresión.
function escribirImpresionPDF(win, titulo, cuerpoHTML) {
  if (!win) {
    alert('Tu navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para generar el PDF.');
    return;
  }
  const fechaImpresion = new Date().toLocaleString('es-BO');
  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${_pdfEsc(titulo)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 32px 36px; }
  .doc-header { display:flex; justify-content:space-between; align-items:flex-start;
    border-bottom: 3px solid #2F5F2F; padding-bottom: 14px; margin-bottom: 20px; }
  .doc-header .empresa { font-size: 1.5rem; font-weight: 700; color: #173F24; }
  .doc-header .empresa small { display:block; font-size:.8rem; font-weight:400; color:#555; }
  .doc-header .meta { text-align:right; font-size:.8rem; color:#555; }
  h1 { font-size: 1.15rem; color:#173F24; margin: 0 0 14px; }
  h3 { font-size: .95rem; color:#2F5F2F; margin: 18px 0 6px; }
  .datos { display:flex; flex-wrap:wrap; gap:6px 28px; font-size:.85rem; margin-bottom: 8px; }
  .datos .k { color:#555; }
  .datos .v { font-weight:600; }
  table { width:100%; border-collapse:collapse; font-size:.82rem; margin-top:4px; }
  th { background:#173F24; color:#fff; padding:7px 8px; text-align:left; }
  th.num, td.num { text-align:right; }
  td { padding:6px 8px; border-bottom:1px solid #e1e6dd; }
  tbody tr:nth-child(even) { background:#f6f8f5; }
  .total { margin-top: 18px; padding-top: 12px; border-top: 2px solid #2F5F2F;
    text-align:right; font-size:1.05rem; font-weight:700; color:#173F24; }
  .vacio { color:#888; font-size:.85rem; }
  .pie { margin-top: 40px; font-size:.72rem; color:#999; text-align:center;
    border-top:1px solid #ddd; padding-top:8px; }
  @page { margin: 18mm; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <div class="doc-header">
    <div class="empresa">${_pdfEsc(EMPRESA_PDF.nombre)}<small>${_pdfEsc(EMPRESA_PDF.subtitulo)}</small></div>
    <div class="meta">Emitido: ${_pdfEsc(fechaImpresion)}</div>
  </div>
  ${cuerpoHTML}
  <div class="pie">Documento generado por el Sistema de Gestión — Constructora</div>
  <script>window.onload=function(){window.focus();setTimeout(function(){window.print();},250);};<\/script>
</body></html>`);
  win.document.close();
}
