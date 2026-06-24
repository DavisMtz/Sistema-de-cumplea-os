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

  const primerNombre = (persona.nombre || "").toString().trim().split(/\s+/)[0] || persona.nombre;
  const mesAbrev = (persona.mesTexto || "").toString().slice(0, 3).toUpperCase();

  return envolturaLiverpool({
    preheader: `Tu registro de cumpleaños quedó guardado, ${primerNombre}.`,
    pie: "Tu registro quedó guardado correctamente.",
    contenido: `
        <div style="text-align:center;">
          ${pill("Registro confirmado")}
          <h2 style="font-family:${FUENTE}; color:${C.textoTitulo}; margin:18px 0 8px 0; font-size:26px; font-weight:700; line-height:1.3; letter-spacing:-0.4px;">
            ¡Gracias, ${primerNombre}!
          </h2>
          <p style="font-family:${FUENTE}; color:${C.textoCuerpo}; font-size:15px; margin:0 0 32px 0; line-height:1.7;">
            Tu respuesta quedó registrada. Este es el resumen de tu
            información en el sistema de cumpleaños de VENTEL.
          </p>
        </div>

        <!-- Fecha en círculo (forma + juego de tamaños) -->
        ${circulo(String(persona.dia), mesAbrev, { tam: 132 })}
        <p style="font-family:${FUENTE}; text-align:center; margin:16px 0 0; font-size:13px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#9A9A9A;">Tu cumpleaños</p>

        <!-- Preferencias dentro de tarjeta -->
        <div style="margin-top:36px;">
          ${tarjeta(`
            ${etiquetaSeccion("Tus preferencias registradas")}
            ${detalles}
          `, { bg: C.neutroTinte, padding: "20px 24px" })}
        </div>

        <p style="font-family:${FUENTE}; font-size:14px; color:${C.textoCuerpo}; margin:28px 0 0; line-height:1.7; text-align:center;">
          ¿Necesitas corregir algo? Acércate con una supervisora o apoyo en turno
          y con gusto lo actualizamos.
        </p>
    `
  });
}
