/**
 * CORREO DE CONFIRMACIÓN DE REGISTRO — VENTEL
 * ----------------------------------------------------------------------------
 * Se ejecuta cuando una persona llena el formulario. Confirma su registro y le
 * muestra un resumen de las preferencias que capturó, con diseño Liverpool.
 * Toma la ÚLTIMA fila de respuestas (la más reciente).
 * ----------------------------------------------------------------------------
 */

function enviarConfirmacionCumple() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.hojas.respuestas);
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return;

  // Leemos B..N de la última fila en una sola llamada
  const fila = hoja.getRange(ultimaFila, 2, 1, 13).getValues()[0];
  const persona = {
    nombre: fila[0],                      // B
    color: fila[2],                       // D
    eleccion: fila[3],                    // E
    sabor: fila[4],                       // F
    dinamica: fila[6],                    // H
    comentario: fila[8],                  // J
    dia: fila[9],                         // K
    mes: parseInt(fila[10], 10),          // L
    correo: fila[12]                      // N
  };
  persona.mesTexto = CONFIG.meses[persona.mes - 1] || persona.mes;

  if (!persona.correo) return;

  MailApp.sendEmail({
    to: persona.correo,
    subject: "🎉 Confirmación de registro – Cumpleaños en VENTEL",
    htmlBody: construirCorreoConfirmacion(persona),
    name: CONFIG.marca.nombreRemitente
  });
}

/**
 * Construye el HTML de confirmación.
 * Separado para poder generar vistas previas sin enviar correos.
 */
function construirCorreoConfirmacion(persona) {
  const C = CONFIG.marca.colores;
  const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd 'de' MMMM 'de' yyyy");

  // Reutilizamos la tarjeta de preferencias compartida (mismos iconos que el equipo)
  const detalles = generarDetallesHTML({
    telefono: "",
    color: persona.color,
    eleccion: persona.eleccion,
    sabor: persona.sabor,
    dinamica: persona.dinamica,
    comentario: persona.comentario
  });

  return envolturaLiverpool({
    pie: "Tu registro quedó guardado correctamente ✅",
    contenido: `
        <p style="text-align: right; font-size: 12px; color: #9CA3AF; margin: 0 0 20px 0;">📅 Confirmado el ${fechaHoy}</p>

        <h2 style="color: ${C.textoTitulo}; text-align: center; margin: 0 0 8px 0; font-size: 22px; font-weight: 700;">
          ¡Gracias, ${persona.nombre}! ✅
        </h2>
        <p style="text-align: center; color: ${C.textoCuerpo}; font-size: 15px; margin: 0 0 30px 0; line-height: 1.6;">
          Tu respuesta fue registrada con éxito. Este es el resumen de la
          información que capturaste en el sistema de cumpleaños de VENTEL.
        </p>

        <!-- Fecha de cumpleaños destacada -->
        <div style="background-color: #FFF1F2; border-left: 4px solid ${C.primario}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 10px;">
          <p style="margin: 0; font-size: 16px; color: ${C.textoTitulo};">
            🎂 Tu cumpleaños: <strong>${persona.dia} de ${persona.mesTexto}</strong>
          </p>
        </div>

        <h3 style="font-size: 15px; color: ${C.textoTitulo}; margin: 25px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">Tus preferencias registradas</h3>
        ${detalles}

        <p style="font-size: 14px; color: ${C.textoCuerpo}; margin-top: 25px; line-height: 1.6;">
          ¿Necesitas corregir algo? Acércate con alguna <strong>supervisora</strong>
          o <strong>apoyo</strong> en turno y con gusto lo actualizamos.
        </p>

        ${cintilloDegradado()}
    `
  });
}
