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
      subject: `🎈 ¡Hoy te celebramos, ${nombre}! 🎉 – VENTEL`,
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
    sombraFuerte: true,
    paddingHeader: "35px 20px",
    pie: "¡Feliz cumpleaños de parte de todo el equipo! 🧡",
    headerExtra: `
        <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 30px; padding: 6px 16px; margin: 25px 0 15px;">
          <span style="color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Tu día especial</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 800; line-height: 1.2;">
          ¡Feliz cumpleaños,<br>${nombre}! 🎂
        </h1>`,
    contenido: `
        <p style="font-size: 16px; text-align: center; color: ${C.textoCuerpo}; margin: 0 0 30px 0; line-height: 1.6;">
          En VENTEL no solo celebramos un año más de tu vida, sino todo lo que
          representas para el equipo. <strong style="color: ${C.textoTitulo};">Hoy eres el corazón de nuestras felicitaciones.</strong> 💖
        </p>

        <!-- Mensaje destacado -->
        <div style="background-color: #FFF1F2; border-left: 4px solid ${C.primario}; padding: 18px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
          <p style="margin: 0; font-size: 15px; color: ${C.textoTitulo}; line-height: 1.6;">
            🌟 <strong>${nombre}, este día es para ti, por ti y contigo.</strong><br>
            Todo el equipo te reconoce como una parte esencial de nuestro éxito en ventas.
          </p>
        </div>

        <!-- Frase inspiradora -->
        <p style="font-size: 15px; color: ${C.textoCuerpo}; text-align: center; font-style: italic; margin: 30px 0; line-height: 1.6;">
          “Un cumpleaños no solo celebra el paso del tiempo, sino la huella que
          dejas en quienes te rodean.”
        </p>

        <!-- Tu camino en VENTEL -->
        <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 18px 20px;">
          <p style="margin: 0; font-size: 14px; color: ${C.textoCuerpo}; line-height: 1.6;">
            💼 <strong style="color: ${C.textoTitulo};">Tu camino en VENTEL sigue creciendo:</strong><br>
            Cada año suma experiencia, fortalece tu talento y te acerca más a tus
            metas. ¡Sigue adelante, estamos contigo en cada paso!
          </p>
        </div>

        ${cintilloDegradado()}
    `
  });
}
