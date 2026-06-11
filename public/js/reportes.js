// ─────────────────────────────────────────────────────────────────────────────
// Utilidades compartidas para los reportes con filtro de fechas.
// Se apoya en imprimirPDF.js (nuevaVentanaPDF / escribirImpresionPDF / pdfTabla /
// pdfDatos). Incluye este archivo DESPUÉS de imprimirPDF.js.
// ─────────────────────────────────────────────────────────────────────────────

// Valida un rango "desde / hasta". Ambas opcionales: si vienen las dos, la final
// no puede ser anterior a la inicial. Devuelve { ok, error }.
function validarRangoFechas(desde, hasta) {
  if (desde && hasta && hasta < desde)
    return { ok: false, error: 'La fecha final no puede ser anterior a la fecha inicial.' };
  return { ok: true };
}

// Construye el querystring del rango (?desde=&hasta=) más parámetros extra.
// Omite los valores vacíos. Ej: rangoQuery('2025-01-01','', { idProyecto: 5 })
function rangoQuery(desde, hasta, extra = {}) {
  const p = new URLSearchParams();
  if (desde) p.set('desde', desde);
  if (hasta) p.set('hasta', hasta);
  for (const [k, v] of Object.entries(extra))
    if (v != null && v !== '') p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
}

// Texto legible del rango para el encabezado del reporte ("Todos" / "desde X" /
// "X a Y").
function etiquetaRango(desde, hasta) {
  if (desde && hasta) return `${desde} a ${hasta}`;
  if (desde) return `desde ${desde}`;
  if (hasta) return `hasta ${hasta}`;
  return 'Todos los registros';
}

// Lee los inputs de un módulo y valida. Devuelve { desde, hasta } o null (y avisa).
// idDesde/idHasta son los ids de los <input type="date">.
function leerRango(idDesde, idHasta) {
  const desde = (document.getElementById(idDesde)?.value || '').trim();
  const hasta = (document.getElementById(idHasta)?.value || '').trim();
  const v = validarRangoFechas(desde, hasta);
  if (!v.ok) { alert(v.error); return null; }
  return { desde, hasta };
}

// Imprime un reporte ya armado (varias secciones) usando la ventana del clic.
// secciones: arreglo de strings HTML (usar pdfTabla / pdfDatos para generarlos).
function imprimirReporte(win, titulo, subtitulo, secciones) {
  const cuerpo = `<h1>${titulo}</h1>` +
    (subtitulo ? `<div class="datos"><div><span class="k">Rango:</span> <span class="v">${subtitulo}</span></div></div>` : '') +
    secciones.join('');
  escribirImpresionPDF(win, titulo, cuerpo);
}
