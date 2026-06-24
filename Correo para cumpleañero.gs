/**
 * CORREO FESTIVO PARA EL CUMPLEAÑERO — VENTEL
 * ----------------------------------------------------------------------------
 * Se ejecuta el día del cumpleaños y envía una felicitación directa a la
 * persona (columna N). Usa el diseño Liverpool compartido (Plantillas.gs).
 * ----------------------------------------------------------------------------
 */

function enviarFelicitacionCumpleanero() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.hojas.respuestas);
  const hoy = new Date();
  const diaHoy = hoy.getDate();
  const mesHoy = hoy.getMonth() + 1;
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return;

  const dias = hoja.getRange("K2:K" + ultimaFila).getValues();
  const meses = hoja.getRange("L2:L" + ultimaFila).getValues();
  const nombres = hoja.getRange("B2:B" + ultimaFila).getValues();
  const correos = hoja.getRange("N2:N" + ultimaFila).getValues();

  for (let i = 0; i < nombres.length; i++) {
    const nombre = nombres[i][0];
    const dia = parseInt(dias[i][0]);
    const mes = parseInt(meses[i][0]);
    const correo = correos[i][0] ? correos[i][0].toString().trim() : "";

    if (isNaN(dia) || isNaN(mes) || correo === "") continue;
    if (dia !== diaHoy || mes !== mesHoy) continue;

    MailApp.sendEmail({
      to: correo,
      subject: `Hoy te celebramos, ${nombre} · VENTEL`,
      htmlBody: construirCorreoCumpleanero(nombre),
      name: CONFIG.marca.nombreRemitente
    });
  }
}

/**
 * Construye el HTML festivo dirigido al cumpleañero.
 * Separado para poder generar vistas previas sin enviar correos.
 */
function construirCorreoCumpleanero(nombre) {
  const C = CONFIG.marca.colores;
  // Solo el primer nombre para un tono más cercano y personal.
  const primerNombre = (nombre || "").toString().trim().split(/\s+/)[0] || nombre;

  return envolturaLiverpool({
    preheader: `Hoy todo el equipo VENTEL celebra contigo, ${primerNombre}.`,
    // Header más alto y expresivo: este correo debe sentirse especial.
    paddingHeader: "52px 28px 46px",
    pie: "Con cariño, todo el equipo VENTEL.",
    headerExtra: `
        <div style="font-family:${FUENTE}; color:rgba(255,255,255,0.92); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:3px; margin:30px 0 16px;">Feliz cumpleaños</div>
        <h1 style="font-family:${FUENTE}; color:#ffffff; margin:0; font-size:40px; font-weight:700; line-height:1.1; letter-spacing:-0.5px;">
          ${primerNombre}
        </h1>
        <div style="margin-top:18px; color:rgba(255,255,255,0.9); font-size:13px; letter-spacing:8px; line-height:1;">&#10022;&nbsp;&#10022;&nbsp;&#10022;</div>`,
    contenido: `
        <div style="text-align:center;">
          <p style="font-family:${FUENTE}; font-size:22px; color:${C.textoTitulo}; margin:0 0 10px 0; line-height:1.4; font-weight:700; letter-spacing:-0.3px;">
            Hoy es tu día, ${primerNombre}.
          </p>
          <p style="font-family:${FUENTE}; font-size:16px; color:${C.textoCuerpo}; margin:0; line-height:1.75;">
            No solo celebramos un año más de tu vida, sino todo lo que
            representas para nosotros.
          </p>
        </div>

        ${puntosDecorativos({ margen: "32px 0" })}

        <!-- Frase destacada dentro de tarjeta rosa (forma) -->
        ${tarjeta(`
          <p style="font-family:${FUENTE}; margin:0; font-size:20px; color:${C.rosaProfundo}; line-height:1.45; text-align:center; font-weight:700; letter-spacing:-0.3px;">
            Eres el corazón de<br>nuestras felicitaciones.
          </p>
        `, { bg: C.rosaTinte, padding: "30px 28px", radius: "20px" })}

        <!-- Frase inspiradora -->
        <p style="font-family:${FUENTE}; font-size:15px; color:${C.textoCuerpo}; font-style:italic; margin:36px 0; line-height:1.8; text-align:center;">
          “Un cumpleaños no solo celebra el paso del tiempo,<br>sino la huella que
          dejas en quienes te rodean.”
        </p>

        <!-- Tu camino en VENTEL: tarjeta neutra -->
        ${tarjeta(`
          ${etiquetaSeccion("Tu camino en VENTEL")}
          <p style="font-family:${FUENTE}; margin:10px 0 0; font-size:15px; color:${C.textoCuerpo}; line-height:1.75;">
            Cada año suma experiencia, fortalece tu talento y te acerca más a tus
            metas. Sigue adelante: estamos contigo en cada paso.
          </p>
        `, { bg: C.neutroTinte, padding: "24px 26px" })}

        <p style="font-family:${FUENTE}; margin:34px 0 0; font-size:15px; color:${C.textoTitulo}; line-height:1.6; text-align:center;">
          Con cariño,<br><strong style="font-weight:700; color:${C.primario};">tu equipo VENTEL</strong>
        </p>
    `
  });
}
