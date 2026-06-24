/**
 * PLANTILLAS DE CORREO COMPARTIDAS — LIVERPOOL / VENTEL
 * ----------------------------------------------------------------------------
 * Sistema visual MINIMALISTA inspirado en el lenguaje de Apple y Google:
 * tipografía elegante, espaciado preciso, paleta muy restringida (rosa
 * Liverpool + tinta + grises) y una sola jerarquía clara por correo.
 *
 * OPTIMIZADO PARA GMAIL (se envían por Gmail):
 *   - Maquetado 100% con TABLAS (role="presentation") y CSS 100% INLINE.
 *     Gmail elimina los <style> del <head> en sus apps; aquí no usamos ninguno.
 *   - SIN SVG inline en el cuerpo (Gmail no lo renderiza). Los íconos del cuerpo
 *     solo aparecen si defines imágenes PNG/JPG alojadas en CONFIG.marca.iconosURL.
 *   - Stack de fuentes que Gmail sí rinde (Google Sans / Roboto) con respaldos.
 *   - Preheader (texto de vista previa) y layout fluido de una sola columna.
 *   - Colores con buen contraste para sobrevivir al modo oscuro de Gmail.
 *
 * El header rosa con el logo de Liverpool se conserva intacto.
 * Depende de la constante global CONFIG definida en Automatizacion.gs.
 * ----------------------------------------------------------------------------
 */

// Stack de fuentes seguro para Gmail (rinde Google Sans/Roboto; cae a Arial).
const FUENTE = "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

// ============================================================================
// ENVOLTURA ESTÁNDAR (tabla bulletproof: header rosa + cuerpo + pie)
// ============================================================================
/**
 * Construye el "marco" Liverpool alrededor de cualquier contenido.
 * @param {Object} opciones
 * @param {string} opciones.contenido     HTML del cuerpo (inline styles).
 * @param {string} [opciones.headerExtra] HTML extra dentro del header rosa.
 * @param {string} [opciones.pie]         Mensaje del pie de página.
 * @param {string} [opciones.preheader]   Texto de vista previa en la bandeja.
 * @param {string} [opciones.paddingHeader] Relleno del header.
 * @param {string} [opciones.bgHeader]    Color del header (default rosa marca).
 * @return {string} HTML completo listo para enviar.
 */
function envolturaLiverpool(opciones) {
  const c = CONFIG.marca.colores;
  const contenido = opciones.contenido || "";
  const headerExtra = opciones.headerExtra || "";
  const paddingHeader = opciones.paddingHeader || "40px 24px";
  const bgHeader = opciones.bgHeader || c.primario;
  const pre = opciones.preheader || "";

  // Preheader oculto + relleno para que no se "cuele" el cuerpo en el snippet.
  const preheader = pre
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${c.fondo};opacity:0;">${pre}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : "";

  return `
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.fondo}; margin:0; padding:0; width:100%;">
  <tr>
    <td align="center" style="padding:44px 12px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #EEEEEE; box-shadow:0 1px 2px rgba(17,24,39,0.04), 0 12px 32px -16px rgba(17,24,39,0.12);">

        <!-- Header Institucional Liverpool (intacto) -->
        <tr>
          <td align="center" style="background-color:${bgHeader}; padding:${paddingHeader};">
            <img src="${CONFIG.marca.logoURL}" alt="Liverpool" width="120" style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;">
            ${headerExtra}
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:46px 42px; font-family:${FUENTE}; color:${c.textoCuerpo}; -webkit-font-smoothing:antialiased;">
            ${contenido}
          </td>
        </tr>

        ${piePagina(opciones.pie)}

      </table>

    </td>
  </tr>
</table>`;
}

// ============================================================================
// PIE DE PÁGINA ESTÁNDAR (discreto)
// ============================================================================
function piePagina(mensaje) {
  const c = CONFIG.marca.colores;
  const r = CONFIG.marca.responsable;
  const msg = mensaje || "Gracias por mantener viva nuestra cultura.";
  return `
        <tr>
          <td style="padding:26px 42px 32px; border-top:1px solid #EFEFEF; font-family:${FUENTE}; text-align:center;">
            <p style="margin:0 0 6px 0; color:${c.textoCuerpo}; font-size:12px; line-height:1.6;">${msg}</p>
            <p style="margin:0; color:#A9A9A9; font-size:11px; line-height:1.7;">
              Mensaje automático del sistema de cumpleaños VENTEL<br>
              ${r.nombre} · ${r.rol}
            </p>
          </td>
        </tr>`;
}

// ============================================================================
// ETIQUETA DE SECCIÓN (eyebrow en mayúsculas, estilo Apple/Google)
// ============================================================================
function etiquetaSeccion(texto) {
  return `<p style="margin:0; font-family:${FUENTE}; font-size:11px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase; color:#9A9A9A;">${texto}</p>`;
}

// ============================================================================
// ÍCONO DE CUERPO (solo imagen alojada; Gmail no rinde SVG)
// ----------------------------------------------------------------------------
// Devuelve un <img> SOLO si defines CONFIG.marca.iconosURL[nombre] con una
// imagen PNG/JPG alojada (como el logo). Si no, devuelve "" y la lista de
// preferencias se ve limpia y tipográfica (estilo Apple). Los SVG de
// /assets/icons quedan como set de marca reutilizable.
// ============================================================================
function iconoEmail(nombre, tam) {
  const urls = (CONFIG.marca && CONFIG.marca.iconosURL) || {};
  if (!urls[nombre]) return "";
  const s = tam || 18;
  return `<img src="${urls[nombre]}" alt="" width="${s}" height="${s}" style="display:block; border:0;">`;
}

// ============================================================================
// LISTA DE PREFERENCIAS (tipográfica, líneas finas — estilo recibo de Apple)
// ============================================================================
/**
 * Lista limpia de preferencias. Etiqueta gris pequeña sobre valor en tinta,
 * separadas por hairline. Solo muestra filas con información.
 */
function generarDetallesHTML(persona) {
  const c = CONFIG.marca.colores;
  let filas = "";

  const addRow = (icono, label, value) => {
    if (!value) return;
    const ic = iconoEmail(icono);
    const celdaIcono = ic
      ? `<td width="30" valign="top" style="padding:15px 12px 15px 0;">${ic}</td>`
      : "";
    filas += `<tr>
                ${celdaIcono}
                <td valign="top" style="padding:15px 0; border-bottom:1px solid #F0F0F0; font-family:${FUENTE};">
                  <div style="font-size:11px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#9A9A9A; margin:0 0 4px 0;">${label}</div>
                  <div style="font-size:15px; color:${c.textoTitulo}; line-height:1.5;">${value}</div>
                </td>
               </tr>`;
  };

  const esPastel = persona.eleccion && persona.eleccion.toLowerCase().includes("pastel");
  let comidaVal = persona.eleccion;
  if (esPastel && persona.sabor) comidaVal += ` · Sabor ${persona.sabor}`;
  const iconoComida = esPastel ? "pastel" : "comida";

  addRow("telefono", "Teléfono", persona.telefono);
  addRow("color", "Color favorito", persona.color);
  addRow(iconoComida, "Prefiere", comidaVal);
  addRow("regalo", "Le gustaría", persona.dinamica);
  addRow("comentario", "Comentarios", persona.comentario ? `<em style="color:${c.textoCuerpo};">“${persona.comentario}”</em>` : "");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">${filas}</table>`;
}

// ============================================================================
// BLOQUE DE FECHA (tipográfico, sin caja: etiqueta + fecha en rosa)
// ============================================================================
function bloqueFecha(label, valor) {
  const c = CONFIG.marca.colores;
  return `
    <div style="margin:4px 0 8px;">
      ${etiquetaSeccion(label)}
      <div style="font-family:${FUENTE}; font-size:22px; font-weight:600; color:${c.primario}; line-height:1.3; margin-top:4px;">${valor}</div>
    </div>`;
}

// ============================================================================
// DIVISORES (Gmail-safe: hairline o motivo de destellos con glifos de texto)
// ============================================================================
/** Línea fina neutra. */
function reglaFina(margen) {
  const m = margen || "38px 0 4px";
  return `<div style="border-top:1px solid #ECECEC; line-height:1px; font-size:1px; margin:${m};">&nbsp;</div>`;
}

/** Motivo de destellos en rosa (glifos de texto: se ven en Gmail, no son emoji). */
function sparkleDivisor(margen) {
  const c = CONFIG.marca.colores;
  const m = margen || "34px 0 6px";
  return `<div style="text-align:center; margin:${m}; font-family:${FUENTE}; color:${c.primario}; font-size:14px; letter-spacing:8px; line-height:1;">&#10022;&nbsp;&#10022;&nbsp;&#10022;</div>`;
}

// ============================================================================
// FORMAS (todas Gmail-safe: tablas + border-radius + background-color)
// ============================================================================

/**
 * Tarjeta redondeada con fondo de color (tinte). Aporta "forma" sin imágenes.
 * @param {string} contenido HTML interno.
 * @param {Object} [o] { bg, padding, radius, borde, align }
 */
function tarjeta(contenido, o) {
  o = o || {};
  const bg = o.bg || CONFIG.marca.colores.neutroTinte;
  const padding = o.padding || "24px 26px";
  const radius = o.radius || "18px";
  const borde = o.borde ? `border:1px solid ${o.borde};` : "";
  const align = o.align || "left";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;">
      <tr>
        <td align="${align}" bgcolor="${bg}" style="background-color:${bg}; border-radius:${radius}; ${borde} padding:${padding}; font-family:${FUENTE};">
          ${contenido}
        </td>
      </tr>
    </table>`;
}

/**
 * Pastilla (pill) redondeada para etiquetas cortas.
 * @param {string} texto
 * @param {Object} [o] { bg, color }
 */
function pill(texto, o) {
  o = o || {};
  const c = CONFIG.marca.colores;
  const bg = o.bg || c.rosaTinte;
  const color = o.color || c.rosaProfundo;
  return `<span style="display:inline-block; background-color:${bg}; color:${color}; font-family:${FUENTE}; font-size:11px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; padding:7px 15px; border-radius:999px; line-height:1;">${texto}</span>`;
}

/**
 * Círculo con un número grande y un subtítulo pequeño (juego de tamaños).
 * @param {string} grande Texto/numeral principal.
 * @param {string} chico  Subtítulo pequeño.
 * @param {Object} [o] { tam, bg, fg, fgChico }
 */
function circulo(grande, chico, o) {
  o = o || {};
  const c = CONFIG.marca.colores;
  const tam = o.tam || 132;
  const bg = o.bg || c.rosaTinte;
  const fg = o.fg || c.primario;
  const fgChico = o.fgChico || c.rosaProfundo;
  const radio = Math.round(tam / 2);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td width="${tam}" height="${tam}" align="center" valign="middle" bgcolor="${bg}" style="width:${tam}px; height:${tam}px; background-color:${bg}; border-radius:${radio}px; text-align:center; vertical-align:middle;">
          <div style="font-family:${FUENTE}; font-size:${Math.round(tam*0.42)}px; font-weight:700; color:${fg}; line-height:1; letter-spacing:-1px;">${grande}</div>
          ${chico ? `<div style="font-family:${FUENTE}; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:${fgChico}; margin-top:6px;">${chico}</div>` : ""}
        </td>
      </tr>
    </table>`;
}

/** Tres puntos decorativos de tamaños distintos (motivo de formas). */
function puntosDecorativos(o) {
  o = o || {};
  const c = CONFIG.marca.colores;
  const grande = o.grande || c.primario;
  const chico = o.chico || c.rosaTinte2;
  const margen = o.margen || "30px 0";
  const cel = (d, color) => `<td style="padding:0 6px;"><div style="width:${d}px; height:${d}px; background-color:${color}; border-radius:${Math.round(d/2)}px; line-height:${d}px; font-size:1px;">&nbsp;</div></td>`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:${margen};">
      <tr>${cel(8, chico)}${cel(13, grande)}${cel(8, chico)}</tr>
    </table>`;
}

/**
 * Botón redondeado bulletproof (CTA).
 * @param {string} texto
 * @param {string} href
 * @param {Object} [o] { bg, color }
 */
function botonRedondeado(texto, href, o) {
  o = o || {};
  const c = CONFIG.marca.colores;
  const bg = o.bg || c.primario;
  const color = o.color || "#ffffff";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" bgcolor="${bg}" style="background-color:${bg}; border-radius:999px;">
          <a href="${href}" style="display:inline-block; padding:15px 34px; font-family:${FUENTE}; font-size:15px; font-weight:600; color:${color}; text-decoration:none; border-radius:999px;">${texto}</a>
        </td>
      </tr>
    </table>`;
}

// Compatibilidad hacia atrás.
function divisorMinimal() { return reglaFina(); }
function cintilloDegradado() { return reglaFina(); }
