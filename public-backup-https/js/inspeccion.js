// Modal reutilizable para "Inspeccionar proyecto".
// Muestra datos generales + personal + materiales, con un filtro de texto.
// Se usa desde el dashboard y desde el Módulo 1.
(function () {
  if (window.inspeccionarProyecto) return;

  function fechaCorta(f) {
    return f ? String(f).substring(0, 10) : '-';
  }

  function badgeEstado(estado) {
    const t = (estado || '').toLowerCase();
    let bg = '#DBEAFE', col = '#1E40AF';
    if (t.includes('ejecuc')) { bg = '#DFEAD8'; col = '#28512B'; }
    else if (t.includes('finaliz')) { bg = '#E5E7EB'; col = '#374151'; }
    else if (t.includes('suspend') || t.includes('cancel')) { bg = '#FEE2E2'; col = '#991B1B'; }
    return `<span style="background:${bg};color:${col};padding:3px 10px;border-radius:12px;font-size:.78rem;font-weight:700;">${estado || '-'}</span>`;
  }

  window.cerrarInspeccion = function () {
    const m = document.getElementById('modal-inspeccion');
    if (m) m.remove();
  };

  // Filtra las filas de personal y materiales por texto.
  window.filtrarInspeccion = function (texto) {
    const t = (texto || '').toLowerCase();
    document.querySelectorAll('#modal-inspeccion tbody tr').forEach(tr => {
      tr.style.display = tr.innerText.toLowerCase().includes(t) ? '' : 'none';
    });
  };

  window.inspeccionarProyecto = async function (id) {
    try {
      const d = await fetch(`/api/proyectos/${id}/inspeccion`).then(r => r.json());
      if (d.error) return alert('Error: ' + d.error);

      const personalRows = (d.personal || []).map(p => `<tr>
        <td>${p.empleado}</td><td>${p.nombreCargo}</td><td>${p.nombreRolProyecto}</td>
        <td>${fechaCorta(p.fechaInicio)}</td><td>${fechaCorta(p.fechaFin)}</td>
        <td>${p.estadoAsignacion}</td></tr>`).join('') ||
        '<tr><td colspan="6" style="color:#6b756d;">Sin personal asignado.</td></tr>';

      const materialesRows = (d.materiales || []).map(m => `<tr>
        <td>${m.nombreMaterial}</td><td>${m.cantidadUtilizada}</td>
        <td>Bs ${Number(m.costoTotal).toFixed(2)}</td><td>${fechaCorta(m.fechaRegistro)}</td></tr>`).join('') ||
        '<tr><td colspan="4" style="color:#6b756d;">Sin materiales registrados.</td></tr>';

      cerrarInspeccion();
      const modal = document.createElement('div');
      modal.id = 'modal-inspeccion';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:flex-start;justify-content:center;z-index:2000;padding:36px 16px;overflow:auto;font-family:Segoe UI,sans-serif;';
      modal.onclick = (e) => { if (e.target === modal) cerrarInspeccion(); };
      modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;max-width:880px;width:100%;padding:24px;box-shadow:0 12px 44px rgba(0,0,0,.28);">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2F5F2F;padding-bottom:12px;margin-bottom:16px;">
            <h2 style="color:#173F24;margin:0;">${d.nombreProyecto}</h2>
            <button onclick="cerrarInspeccion()" style="background:#B91C1C;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;">Cerrar</button>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:10px 28px;font-size:.9rem;margin-bottom:6px;">
            <div><b>Estado:</b> ${badgeEstado(d.nombreEstadoProyecto)}</div>
            <div><b>Tipo:</b> ${d.nombreTipoProyecto || '-'}</div>
            <div><b>Cliente:</b> ${d.nombreCliente || '-'}</div>
            <div><b>Ubicación:</b> ${d.ubicacion || '-'}</div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:10px 28px;font-size:.9rem;margin-bottom:6px;">
            <div><b>Inicio:</b> ${fechaCorta(d.fechaInicio)}</div>
            <div><b>Fin estimado:</b> ${fechaCorta(d.fechaFinEstimada)}</div>
            <div><b>Fin real:</b> ${fechaCorta(d.fechaFinReal)}</div>
          </div>
          ${d.descripcion ? `<p style="font-size:.88rem;color:#445;margin:8px 0;"><b>Descripción:</b> ${d.descripcion}</p>` : ''}

          <div style="display:flex;gap:16px;flex-wrap:wrap;margin:14px 0;">
            <div style="background:#EEF4EA;border-radius:8px;padding:10px 18px;"><b style="font-size:1.3rem;color:#173F24;">${d.totalPersonal}</b><div style="font-size:.78rem;color:#6b756d;">PERSONAS</div></div>
            <div style="background:#EEF4EA;border-radius:8px;padding:10px 18px;"><b style="font-size:1.3rem;color:#173F24;">${(d.materiales||[]).length}</b><div style="font-size:.78rem;color:#6b756d;">MATERIALES</div></div>
            <div style="background:#EEF4EA;border-radius:8px;padding:10px 18px;"><b style="font-size:1.3rem;color:#173F24;">Bs ${Number(d.costoMateriales).toFixed(2)}</b><div style="font-size:.78rem;color:#6b756d;">COSTO MATERIALES</div></div>
          </div>

          <input type="text" placeholder="Filtrar personal o materiales..." oninput="filtrarInspeccion(this.value)"
                 style="width:100%;padding:9px 12px;border:1.5px solid #E1E6DD;border-radius:6px;margin-bottom:14px;">

          <h3 style="color:#173F24;margin-bottom:8px;">Personal asignado</h3>
          <div style="overflow:auto;"><table style="width:100%;border-collapse:collapse;font-size:.85rem;margin-bottom:18px;">
            <thead><tr style="background:#123823;color:#fff;">
              <th style="text-align:left;padding:7px;">Empleado</th><th style="text-align:left;padding:7px;">Cargo</th>
              <th style="text-align:left;padding:7px;">Rol</th><th style="text-align:left;padding:7px;">Inicio</th>
              <th style="text-align:left;padding:7px;">Fin</th><th style="text-align:left;padding:7px;">Estado</th>
            </tr></thead><tbody>${personalRows}</tbody>
          </table></div>

          <h3 style="color:#173F24;margin-bottom:8px;">Materiales usados</h3>
          <div style="overflow:auto;"><table style="width:100%;border-collapse:collapse;font-size:.85rem;">
            <thead><tr style="background:#123823;color:#fff;">
              <th style="text-align:left;padding:7px;">Material</th><th style="text-align:left;padding:7px;">Cantidad</th>
              <th style="text-align:left;padding:7px;">Costo</th><th style="text-align:left;padding:7px;">Fecha</th>
            </tr></thead><tbody>${materialesRows}</tbody>
          </table></div>
        </div>`;
      document.body.appendChild(modal);
    } catch (e) {
      alert('Error al cargar la inspección del proyecto.');
    }
  };
})();
