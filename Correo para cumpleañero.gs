function enviarFelicitacionCumpleanero() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respuestas de formulario 1");
  const hoy = new Date();
  const diaHoy = hoy.getDate();
  const mesHoy = hoy.getMonth() + 1;
  const ultimaFila = hoja.getLastRow();
  const dias = hoja.getRange("K2:K" + ultimaFila).getValues();
  const meses = hoja.getRange("L2:L" + ultimaFila).getValues();
  const nombres = hoja.getRange("B2:B" + ultimaFila).getValues();
  const correos = hoja.getRange("N2:N" + ultimaFila).getValues();

  const logoURL = "https://assetspwa.liverpool.com.mx/assets/digital/mailings/img/liv_w.png";
  const mesesES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fechaHoy = `${hoy.getDate()} de ${mesesES[hoy.getMonth()]}`;

  for (let i = 0; i < nombres.length; i++) {
    const nombre = nombres[i][0];
    const dia = parseInt(dias[i][0]);
    const mes = parseInt(meses[i][0]);
    const correo = correos[i][0] ? correos[i][0].toString().trim() : "";

    if (isNaN(dia) || isNaN(mes) || correo === "") continue;
    if (dia === diaHoy && mes === mesHoy) {

      const asunto = `🎈 ¡Hoy celebramos a ${nombre}! 🎉 – VENTEL`;

      const mensajeHTML = `
        <div style="font-family: Arial, sans-serif; background-color: #fffdf8; padding: 20px;">
          <div style="background-color: #ec008c; padding: 15px; text-align: center;">
            <img src="${logoURL}" alt="Liverpool" width="160">
          </div>

          <h2 style="color: #d50032; text-align: center; margin-top: 30px;">🎉 ¡HOY TODO GIRA EN TORNO A TI, ${nombre}! 🎉</h2>

          <p style="font-size: 16px; color: #333; text-align: center; margin-bottom: 20px;">
            En VENTEL, no solo celebramos un año más de tu vida,<br>
            sino todo lo que representas para el equipo.<br>
            <strong>Hoy eres el corazón de nuestras felicitaciones. 💖</strong>
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <span style="background-color: #d50032; color: white; padding: 14px 28px; border-radius: 30px; font-weight: bold; display: inline-block;">
              ¡Esperamos que tu día esté lleno de sonrisas! 😊
            </span>
          </div>

          <div style="background-color:#fff3cd; border-left:5px solid #ffc107; padding:16px; margin:30px auto; max-width:520px; border-radius:6px;">
            🌟 <strong>${nombre}, este día es para ti, por ti y contigo.</strong><br>
            ¡Todo el equipo te reconoce como una parte esencial de nuestro éxito en ventas!
          </div>

          <p style="font-size: 15px; color: #444; text-align: center; font-style: italic; margin-top: 30px;">
            “Un cumpleaños no solo celebra el paso del tiempo, sino la huella que dejas en quienes te rodean.”
          </p>

          <div style="background-color: #f1f8ff; border-left: 5px solid #007bff; padding: 16px; margin: 30px auto; max-width: 500px; border-radius: 6px;">
            💼 <strong>Tu camino en VENTEL sigue creciendo:</strong><br>
            Cada año suma experiencia, fortalece tu talento y te acerca más a tus metas.<br>
            ¡Sigue adelante, estamos contigo en cada paso!
          </div>

          <div style="margin-top: 40px; width: 100%; height: 6px; background: linear-gradient(to right, #ec008c, #d50032); border-radius: 10px;"></div>

          <p style="color: #888; font-size: 11px; text-align: center; margin-top: 30px;">
            Este correo fue enviado automáticamente por el sistema de cumpleaños del área VENTEL.
          </p>

          <div style="font-size: 10px; color: #999; text-align: center; margin-bottom: 20px;">
            Responsable técnico:<br>
            David Martínez Arredondo – Apoyo / Asesor de Ventas – VENTEL
          </div>
        </div>
      `;

      MailApp.sendEmail({
        to: correo,
        subject: asunto,
        htmlBody: mensajeHTML,
        name: "Notificaciones VENTEL"
      });
    }
  }
}
/*******************************************************
 * SCRIPT DE AUTOMATIZACIÓN DE CUMPLEAÑOS – EQUIPO VENTEL
 *
 * Versión: 0.7 (beta)
 * Estado: Entorno de pruebas avanzado
 *
 * Descripción:
 * Este script gestiona de forma automática la identificación,
 * seguimiento y notificación de los cumpleaños del personal
 * del área de Ventas Telefónicas (VENTEL). Genera correos
 * personalizados 10, 3, 1 días antes del cumpleaños y el mismo
 * día, tanto para el equipo organizador como para el cumpleañero.
 *
 * Además, el sistema personaliza los mensajes con base en las
 * preferencias registradas (color favorito, dinámica, tipo de pastel, etc.),
 * y actualiza la celda B4 con un resumen visual tipo agenda de
 * los cumpleaños próximos (≤30 días).
 *
 * Cambios realizados en esta versión (0.7):
 * - Se integró la detección avanzada para personalizar mensajes según el rango de filas.
 * - Se diferenció el contenido del correo para el “Equipo Alejandra Castro”.
 * - Se reactivaron todos los destinatarios oficiales.
 * - Se mejoró la legibilidad visual de los correos y la estructura de datos mostrados.
 * - Se añadió integración del correo de confirmación y correo motivador para el cumpleañero.
 *
 * Autor: David Martínez Arredondo
 * Rol: Apoyo / Asesor de Ventas – VENTEL
 * Correo: dmartineza02@liverpool.com.mx
 *
 * Frase inspiradora:
 * “Automatizar no es reemplazar el detalle humano... es amplificarlo con propósito.”
 *******************************************************/

