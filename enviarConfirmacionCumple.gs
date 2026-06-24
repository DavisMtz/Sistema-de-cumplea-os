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
    subject: "Confirmación de registro · Cumpleaños VENTEL",
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
    preheader: `Tu registro de cumpleaños quedó guardado, ${(persona.nombre || "").toString().split(/\s+/)[0]}.`,
    pie: "Tu registro quedó guardado correctamente.",
    contenido: `
        ${etiquetaSeccion("Confirmado el " + fechaHoy)}
        <h2 style="color: ${C.textoTitulo}; margin: 12px 0 8px 0; font-size: 24px; font-weight: 600; line-height: 1.3;">
          Gracias, ${persona.nombre}
        </h2>
        <p style="color: ${C.textoCuerpo}; font-size: 15px; margin: 0 0 32px 0; line-height: 1.7;">
          Tu respuesta fue registrada con éxito. Este es el resumen de la
          información que capturaste en el sistema de cumpleaños de VENTEL.
        </p>

        <!-- Fecha de cumpleaños: bloque tipográfico, sin caja -->
        ${bloqueFecha("Tu cumpleaños", persona.dia + " de " + persona.mesTexto)}

        <div style="margin-top: 32px;">
          ${etiquetaSeccion("Tus preferencias registradas")}
        </div>
        ${detalles}

        <p style="font-size: 14px; color: ${C.textoCuerpo}; margin-top: 28px; line-height: 1.7;">
          ¿Necesitas corregir algo? Acércate con alguna supervisora o apoyo en
          turno y con gusto lo actualizamos.
        </p>

        ${divisorMinimal()}
    `
  });
}
