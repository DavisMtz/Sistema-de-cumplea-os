function enviarConfirmacionCumple() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respuestas de formulario 1");
  const ultimaFila = hoja.getLastRow();

  const nombre = hoja.getRange("B" + ultimaFila).getValue();
  const dia = hoja.getRange("K" + ultimaFila).getValue();
  const numeroMes = hoja.getRange("L" + ultimaFila).getValue();
  const mesesES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mesTexto = mesesES[parseInt(numeroMes, 10) - 1] || numeroMes;

  const color = hoja.getRange("D" + ultimaFila).getValue();
  const eleccion = hoja.getRange("E" + ultimaFila).getValue();
  const sabor = hoja.getRange("F" + ultimaFila).getValue();
  const dinamica = hoja.getRange("H" + ultimaFila).getValue();
  const comentario = hoja.getRange("J" + ultimaFila).getValue();
  const correo = hoja.getRange("N" + ultimaFila).getValue();

  if (!correo) return;

  const logoURL = "https://assetspwa.liverpool.com.mx/assets/digital/mailings/img/liv_w.png";
  const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd 'de' MMMM 'de' yyyy");
  const asunto = "🎉 Confirmación de registro – Cumpleaños en VENTEL";

  const detallesTabla = `
    <table style="width:100%; font-size: 14px; border-collapse: collapse; margin-top: 10px;">
      <tbody>
        <tr><td style="padding:6px;">📅 <strong>Fecha de cumpleaños:</strong></td><td>${dia} de ${mesTexto}</td></tr>
        ${color ? `<tr><td style="padding:6px;">🎨 <strong>Color favorito:</strong></td><td>${color}</td></tr>` : ""}
        ${eleccion ? `<tr><td style="padding:6px;">${eleccion.toLowerCase().includes("pastel") ? "🍰" : "🍽️"} <strong>Prefiere:</strong></td><td>${eleccion}${(eleccion.toLowerCase().includes("pastel") && sabor) ? ` (sabor: ${sabor})` : ""}</td></tr>` : ""}
        <tr><td style="padding:6px;">🎁 <strong>Le gustaría:</strong></td><td>${dinamica}</td></tr>
        ${comentario ? `<tr><td style="padding:6px;">✏️ <strong>Comentario adicional:</strong></td><td>"${comentario}"</td></tr>` : ""}
      </tbody>
    </table>
  `;

  const mensajeHTML = `
    <div style="font-family: Arial, sans-serif; background-color: #fdfdfd; padding: 20px;">
      <div style="background-color: #ec008c; padding: 15px; text-align: center;">
        <img src="${logoURL}" alt="Liverpool" width="160">
      </div>

      <p style="text-align:right; font-size:12px; color:#777; margin-top: 10px;">
        📅 Fecha de confirmación: ${fechaHoy}
      </p>

      <div style="background-color: #f1f1f1; padding: 20px; border-radius: 6px; margin-top: 20px;">
        <h2 style="color: #d50032; text-align: center; margin: 0;">
          Gracias, ${nombre}.<br>Tu respuesta ha sido registrada con éxito.
        </h2>
      </div>

      <p style="font-size: 16px; color: #333; text-align: center; margin: 25px 0 15px;">
        A continuación, te compartimos el resumen de la información que registraste
        en el sistema de cumpleaños del área VENTEL.
      </p>

      <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 16px; border-radius: 6px; margin: 0 auto; max-width: 550px;">
        ${detallesTabla}
      </div>

      <p style="font-size: 14px; color: #444; margin-top: 30px;">
        Si necesitas realizar alguna modificación o corrección, por favor acércate con alguna <strong>supervisora</strong> o <strong>apoyo</strong> en turno.
      </p>

      <div style="margin-top: 40px; width: 100%; height: 6px; background: linear-gradient(to right, #ec008c, #d50032); border-radius: 10px;"></div>

      <p style="color: #999; font-size: 11px; text-align: center; margin-top: 25px;">
        Este correo fue generado automáticamente por el sistema de cumpleaños del área VENTEL.
      </p>

      <div style="font-size: 12px; color: #444; text-align: center; padding: 10px 30px; margin-top: 5px; background: #f2f2f2; border-radius: 5px;">
        Responsable técnico:<br>
        <strong>David Martínez Arredondo</strong><br>
        Apoyo / Asesor de Ventas – VENTEL<br>
        <a href="mailto:dmartineza02@liverpool.com.mx">dmartineza02@liverpool.com.mx</a>
      </div>
    </div>
  `;

MailApp.sendEmail({
  to: correo,
  subject: asunto,
  htmlBody: mensajeHTML,
  name: "Notificaciones VENTEL" // El from será tu cuenta, pero con este nombre
});
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
