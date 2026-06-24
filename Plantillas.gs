/**
 * PLANTILLAS DE CORREO COMPARTIDAS — LIVERPOOL / VENTEL
 * ----------------------------------------------------------------------------
 * Un solo lugar para el diseño visual de TODOS los correos del sistema.
 * Estética: MINIMALISTA y elegante. Monocromática (rosa Liverpool + grises),
 * mucho espacio en blanco, líneas finas en vez de cajas de color, tipografía
 * mesurada e íconos de línea SVG.
 *
 * El header rosa con el logo de Liverpool se conserva intacto.
 *
 * Depende de la constante global CONFIG definida en Automatizacion.gs.
 * ----------------------------------------------------------------------------
 */

// ============================================================================
// ENVOLTURA ESTÁNDAR (header rosa con logo + cuerpo aireado + pie discreto)
// ============================================================================
/**
 * Construye el "marco" Liverpool alrededor de cualquier contenido.
 * @param {Object} opciones
 * @param {string} opciones.contenido    HTML del cuerpo del correo.
 * @param {string} [opciones.headerExtra] HTML extra dentro del header rosa (debajo del logo).
 * @param {string} [opciones.pie]         Mensaje personalizado del pie de página.
 * @param {string} [opciones.paddingHeader] Relleno del header.
 * @return {string} HTML completo listo para enviar.
 */
function envolturaLiverpool(opciones) {
  const c = CONFIG.marca.colores;
  const contenido = opciones.contenido || "";
  const headerExtra = opciones.headerExtra || "";
  const paddingHeader = opciones.paddingHeader || "38px 20px";
  // Sombra única, muy suave: la elegancia viene del aire, no del relieve.
  const sombra = "0 1px 3px rgba(17,24,39,0.06), 0 8px 24px -12px rgba(17,24,39,0.10)";

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${c.fondo}; padding: 48px 12px; color: ${c.textoCuerpo}; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: ${sombra};">

      <!-- Header Institucional Liverpool (intacto) -->
      <div style="background-color: ${c.primario}; padding: ${paddingHeader}; text-align: center;">
        <img src="${CONFIG.marca.logoURL}" alt="Liverpool" width="124" style="display: block; margin: 0 auto;">
        ${headerExtra}
      </div>

      <!-- Cuerpo: padding generoso, contenido respirando -->
      <div style="padding: 48px 44px;">
        ${contenido}
      </div>

      ${piePagina(opciones.pie)}
    </div>
  </div>`;
}

// ============================================================================
// PIE DE PÁGINA ESTÁNDAR (discreto, sin emojis)
// ============================================================================
function piePagina(mensaje) {
  const c = CONFIG.marca.colores;
  const r = CONFIG.marca.responsable;
  const msg = mensaje || "Gracias por mantener viva nuestra cultura.";
  return `
      <div style="padding: 26px 44px 30px; border-top: 1px solid #EFEFEF; text-align: center;">
        <p style="margin: 0 0 6px 0; color: ${c.textoCuerpo}; font-size: 12px; letter-spacing: 0.2px;">${msg}</p>
        <p style="margin: 0; color: #B6B6B6; font-size: 11px; line-height: 1.6;">
          Mensaje automático del sistema de cumpleaños VENTEL<br>
          ${r.nombre} · ${r.rol}
        </p>
      </div>`;
}

// ============================================================================
// ÍCONOS DE LÍNEA (SVG)
// ----------------------------------------------------------------------------
// Devuelve un ícono minimalista de trazo. Por defecto inline (se ve en Apple
// Mail y similares; Gmail/Outlook lo omiten y el diseño sigue intacto porque
// el ícono es decorativo). Si defines CONFIG.marca.iconosURL[nombre] con una
// imagen alojada (igual que el logo), se usará esa para compatibilidad total.
// ============================================================================
function iconoSVG(nombre, color, tam) {
  const c = color || CONFIG.marca.colores.primario;
  const s = tam || 20;

  // Compatibilidad total: si hay URL alojada, usar <img>.
  const urls = (CONFIG.marca && CONFIG.marca.iconosURL) || {};
  if (urls[nombre]) {
    return `<img src="${urls[nombre]}" alt="" width="${s}" height="${s}" style="display:block;">`;
  }

  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">`;
  const trazos = {
    telefono: `<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><line x1="10.5" y1="18.5" x2="13.5" y2="18.5"/>`,
    color: `<path d="M12 3s6 6.4 6 10.5a6 6 0 0 1-12 0C6 9.4 12 3 12 3Z"/>`,
    pastel: `<path d="M4.5 21h15"/><path d="M5.5 21v-7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v7"/><path d="M4.5 16.5h15"/><line x1="12" y1="6" x2="12" y2="9"/><circle cx="12" cy="4.3" r="0.7"/>`,
    comida: `<path d="M7 3v6a2 2 0 0 0 2 2v10"/><path d="M7 3v5M9 3v5"/><path d="M16 3c-1.4 0-2.3 2-2.3 4.8 0 2.4 1 3.5 2.3 3.7V21"/>`,
    regalo: `<rect x="4" y="9" width="16" height="11.5" rx="1.5"/><line x1="4" y1="13" x2="20" y2="13"/><line x1="12" y1="9" x2="12" y2="20.5"/><path d="M12 9S11.2 5 8.7 5A2 2 0 0 0 8.7 9Z"/><path d="M12 9s.8-4 3.3-4A2 2 0 0 1 15.3 9Z"/>`,
    comentario: `<path d="M5 5.5h14a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9.5L5 20V6.5a1 1 0 0 1 1-1Z"/>`,
    calendario: `<rect x="4" y="5.5" width="16" height="15" rx="2"/><line x1="4" y1="9.5" x2="20" y2="9.5"/><line x1="8" y1="3.5" x2="8" y2="6.5"/><line x1="16" y1="3.5" x2="16" y2="6.5"/>`
  };
  return open + (trazos[nombre] || "") + `</svg>`;
}

// ============================================================================
// LISTA DE PREFERENCIAS (líneas finas, etiqueta gris / valor negro, ícono SVG)
// ============================================================================
/**
 * Genera la lista limpia con las preferencias registradas de la persona.
 * Solo muestra las filas que tienen información. Sin cajas ni fondos: solo
 * divisores hairline y aire.
 */
function generarDetallesHTML(persona) {
  const c = CONFIG.marca.colores;
  let html = `<table style="width: 100%; border-collapse: collapse; margin-top: 8px;">`;

  const addRow = (icono, label, value) => {
    if (!value) return;
    html += `<tr>
                <td style="padding: 16px 14px 16px 0; border-bottom: 1px solid #F0F0F0; width: 20px; vertical-align: top;">${iconoSVG(icono)}</td>
                <td style="padding: 16px 0; border-bottom: 1px solid #F0F0F0; vertical-align: top;">
                  <div style="font-size: 11px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #9CA3AF; margin-bottom: 4px;">${label}</div>
                  <div style="font-size: 15px; color: ${c.textoTitulo}; line-height: 1.5;">${value}</div>
                </td>
               </tr>`;
  };

  // Pre-calcular el valor de "comida" (incluye sabor si es pastel)
  const esPastel = persona.eleccion && persona.eleccion.toLowerCase().includes("pastel");
  let comidaVal = persona.eleccion;
  if (esPastel && persona.sabor) comidaVal += ` · Sabor ${persona.sabor}`;
  const iconoComida = esPastel ? "pastel" : "comida";

  addRow("telefono", "Teléfono", persona.telefono);
  addRow("color", "Color favorito", persona.color);
  addRow(iconoComida, "Prefiere", comidaVal);
  addRow("regalo", "Le gustaría", persona.dinamica);
  addRow("comentario", "Comentarios", persona.comentario ? `<em style="color:${c.textoCuerpo};">“${persona.comentario}”</em>` : "");

  html += `</table>`;
  return html;
}

// ============================================================================
// ETIQUETA DE SECCIÓN (rótulo discreto en mayúsculas)
// ============================================================================
function etiquetaSeccion(texto) {
  return `<div style="font-size: 11px; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase; color: #9CA3AF; margin: 0 0 4px 0;">${texto}</div>`;
}

// ============================================================================
// BLOQUE DE FECHA (tipográfico, sin caja: etiqueta pequeña + fecha en rosa)
// ============================================================================
function bloqueFecha(label, valor) {
  const c = CONFIG.marca.colores;
  return `
    <div style="margin: 4px 0 8px;">
      ${etiquetaSeccion(label)}
      <div style="font-size: 22px; font-weight: 600; color: ${c.primario}; line-height: 1.3;">${valor}</div>
    </div>`;
}

// ============================================================================
// DIVISOR MINIMALISTA (línea fina con un pequeño pastel de trazo al centro)
// ----------------------------------------------------------------------------
// Sustituye al antiguo cintillo degradado. Inline SVG; si se omite en algún
// cliente, simplemente no se ve (no rompe nada).
// ============================================================================
function divisorMinimal() {
  const c = CONFIG.marca.colores;
  const urls = (CONFIG.marca && CONFIG.marca.iconosURL) || {};
  if (urls.divisor) {
    return `<div style="text-align:center; margin: 40px 0 4px;"><img src="${urls.divisor}" alt="" height="20" style="display:inline-block;"></div>`;
  }
  return `
    <div style="text-align:center; margin: 40px 0 4px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="20" viewBox="0 0 220 24" fill="none" stroke="${c.primario}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;">
        <line x1="0" y1="12" x2="86" y2="12" opacity="0.30"/>
        <line x1="134" y1="12" x2="220" y2="12" opacity="0.30"/>
        <path d="M100 17h20"/>
        <path d="M101.5 17v-4.2a1.6 1.6 0 0 1 1.6-1.6h13.8a1.6 1.6 0 0 1 1.6 1.6V17"/>
        <path d="M100 14.2h20"/>
        <line x1="110" y1="6.5" x2="110" y2="9.2"/>
        <circle cx="110" cy="5.2" r="0.7"/>
      </svg>
    </div>`;
}

// Compatibilidad hacia atrás: algún código viejo podría llamar cintilloDegradado().
function cintilloDegradado() {
  return divisorMinimal();
}
