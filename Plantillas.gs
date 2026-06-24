/**
 * PLANTILLAS DE CORREO COMPARTIDAS — LIVERPOOL / VENTEL
 * ----------------------------------------------------------------------------
 * Un solo lugar para el diseño visual de TODOS los correos del sistema.
 * Si quieres cambiar el aspecto (logo, colores, pie de página), edítalo aquí
 * y todos los correos se actualizan al mismo tiempo.
 *
 * Depende de la constante global CONFIG definida en Automatizacion.gs.
 * ----------------------------------------------------------------------------
 */

// ============================================================================
// ENVOLTURA ESTÁNDAR (header rosa con logo + cuerpo + pie de página)
// ============================================================================
/**
 * Construye el "marco" Liverpool alrededor de cualquier contenido.
 * @param {Object} opciones
 * @param {string} opciones.contenido    HTML del cuerpo del correo.
 * @param {string} [opciones.headerExtra] HTML extra dentro del header rosa (debajo del logo).
 * @param {string} [opciones.pie]         Mensaje personalizado del pie de página.
 * @param {boolean}[opciones.sombraFuerte] Sombra más marcada (para correos festivos).
 * @param {string} [opciones.paddingHeader] Relleno del header.
 * @return {string} HTML completo listo para enviar.
 */
function envolturaLiverpool(opciones) {
  const c = CONFIG.marca.colores;
  const contenido = opciones.contenido || "";
  const headerExtra = opciones.headerExtra || "";
  const paddingHeader = opciones.paddingHeader || "25px 20px";
  const sombra = opciones.sombraFuerte
    ? "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
    : "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)";

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${c.fondo}; padding: 40px 10px; color: ${c.textoCuerpo}; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: ${sombra};">

      <!-- Header Institucional Liverpool -->
      <div style="background-color: ${c.primario}; padding: ${paddingHeader}; text-align: center;">
        <img src="${CONFIG.marca.logoURL}" alt="Liverpool" width="130" style="display: block; margin: 0 auto;">
        ${headerExtra}
      </div>

      <!-- Cuerpo -->
      <div style="padding: 40px 35px;">
        ${contenido}
      </div>

      ${piePagina(opciones.pie)}
    </div>
  </div>`;
}

// ============================================================================
// PIE DE PÁGINA ESTÁNDAR
// ============================================================================
function piePagina(mensaje) {
  const c = CONFIG.marca.colores;
  const r = CONFIG.marca.responsable;
  const msg = mensaje || "Gracias por mantener viva nuestra cultura 🧡";
  return `
      <div style="background-color: #F9FAFB; padding: 25px 35px; border-top: 1px solid #E5E7EB; text-align: center;">
        <p style="margin: 0 0 8px 0; color: ${c.secundario}; font-size: 13px; font-weight: 500;">${msg}</p>
        <p style="margin: 0; color: #9CA3AF; font-size: 12px; line-height: 1.5;">
          Mensaje generado automáticamente por el sistema de cumpleaños VENTEL.<br>
          Responsable: ${r.nombre} — ${r.rol}
        </p>
      </div>`;
}

// ============================================================================
// TARJETA DE PREFERENCIAS (tabla con iconos: color, comida, regalo, etc.)
// ============================================================================
/**
 * Genera la tarjeta visual con las preferencias registradas de la persona.
 * Solo muestra las filas que tienen información.
 */
function generarDetallesHTML(persona) {
  const c = CONFIG.marca.colores;
  let html = `
  <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 15px 20px; margin-top: 15px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">`;

  const addRow = (icon, label, value, isLast) => {
    if (!value) return;
    const borderStyle = isLast ? "" : "border-bottom: 1px solid #F3F4F6;";
    html += `<tr>
                <td style="padding: 12px 0; ${borderStyle} width: 35px; text-align: center; font-size: 18px; color: ${c.primario};">${icon}</td>
                <td style="padding: 12px 0; ${borderStyle} color: ${c.textoCuerpo}; line-height: 1.5;">
                  <strong style="color: ${c.textoTitulo}; font-weight: 600;">${label}:</strong><br>
                  ${value}
                </td>
               </tr>`;
  };

  // Pre-calcular el valor de "comida" (incluye sabor si es pastel)
  let comidaVal = persona.eleccion;
  if (persona.eleccion && persona.sabor && persona.eleccion.toLowerCase().includes("pastel")) {
    comidaVal += ` (Sabor: ${persona.sabor})`;
  }
  const iconoComida = persona.eleccion && persona.eleccion.toLowerCase().includes("pastel") ? "🍰" : "🍽️";

  addRow("📱", "Teléfono", persona.telefono);
  addRow("🎨", "Color favorito", persona.color);
  addRow(iconoComida, "Prefiere", comidaVal);
  addRow("🎁", "Le gustaría", persona.dinamica);
  addRow("✏️", "Comentarios adicionales", persona.comentario ? `<em>"${persona.comentario}"</em>` : "", true);

  html += `</table></div>`;
  return html;
}

// ============================================================================
// CINTILLO DE COLOR (franja decorativa rosa Liverpool)
// ============================================================================
function cintilloDegradado() {
  const c = CONFIG.marca.colores;
  return `<div style="margin-top: 40px; width: 100%; height: 6px; background: linear-gradient(to right, ${c.primario}, ${c.acento}); border-radius: 10px;"></div>`;
}
