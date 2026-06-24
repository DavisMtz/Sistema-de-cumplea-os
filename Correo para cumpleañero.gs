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

  return envolturaLiverpool({
    paddingHeader: "40px 20px 34px",
    pie: "Feliz cumpleaños de parte de todo el equipo.",
    headerExtra: `
        <div style="color: rgba(255,255,255,0.85); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 26px 0 12px;">Tu día especial</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 600; line-height: 1.25;">
          Feliz cumpleaños, ${nombre}
        </h1>`,
    contenido: `
        <p style="font-size: 16px; color: ${C.textoCuerpo}; margin: 0 0 28px 0; line-height: 1.7;">
          En VENTEL no solo celebramos un año más de tu vida, sino todo lo que
          representas para el equipo. <strong style="color: ${C.textoTitulo}; font-weight: 600;">Hoy eres el corazón de nuestras felicitaciones.</strong>
        </p>

        <!-- Frase destacada: línea fina, sin caja -->
        <p style="margin: 0; padding-left: 18px; border-left: 2px solid ${C.primario}; font-size: 16px; color: ${C.textoTitulo}; line-height: 1.6;">
          ${nombre}, este día es para ti, por ti y contigo.
        </p>
        <p style="font-size: 15px; color: ${C.textoCuerpo}; margin: 18px 0 0; padding-left: 18px; line-height: 1.7;">
          Todo el equipo te reconoce como una parte esencial de nuestro éxito en ventas.
        </p>

        <!-- Frase inspiradora -->
        <p style="font-size: 15px; color: ${C.textoCuerpo}; font-style: italic; margin: 36px 0; line-height: 1.7;">
          “Un cumpleaños no solo celebra el paso del tiempo, sino la huella que
          dejas en quienes te rodean.”
        </p>

        <!-- Tu camino en VENTEL -->
        ${etiquetaSeccion("Tu camino en VENTEL")}
        <p style="margin: 6px 0 0; font-size: 15px; color: ${C.textoCuerpo}; line-height: 1.7;">
          Cada año suma experiencia, fortalece tu talento y te acerca más a tus
          metas. Sigue adelante: estamos contigo en cada paso.
        </p>

        ${divisorMinimal()}
    `
  });
}
