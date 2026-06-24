function resaltarCumpleañosMasProximo() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respuestas de formulario 1");
  const ultimaFila = hoja.getLastRow();

  // Obtener días y meses de las columnas K y L
  const dias = hoja.getRange("K2:K" + ultimaFila).getValues();
  const meses = hoja.getRange("L2:L" + ultimaFila).getValues();

  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  let menorDiferencia = null;
  let filaProxima = null;

  // Buscar la fila con la menor diferencia de días
  for (let i = 0; i < dias.length; i++) {
    const dia = dias[i][0];
    const mes = meses[i][0];

    if (!dia || !mes) continue;

    const diaNum = parseInt(dia, 10);
    const mesNum = parseInt(mes, 10) - 1;
    if (isNaN(diaNum) || isNaN(mesNum)) continue;

    let cumple = new Date(hoy.getFullYear(), mesNum, diaNum);
    if (cumple < hoySinHora) cumple.setFullYear(hoy.getFullYear() + 1);

    const diferencia = Math.ceil((cumple - hoySinHora) / (1000 * 60 * 60 * 24));

    if (menorDiferencia === null || diferencia < menorDiferencia) {
      menorDiferencia = diferencia;
      filaProxima = i + 2; // +2 porque los datos inician en fila 2
    }
  }

  if (filaProxima !== null) {
    // Limpiar colores anteriores en el rango de respuestas
    hoja.getRange("2:" + ultimaFila).setBackground(null).setFontColor("black");

    // Aplicar formato visual a la fila más próxima
    hoja.getRange(filaProxima, 1, 1, hoja.getLastColumn())
        .setBackground("#003366")  // Azul marino
        .setFontColor("#ffffff");  // Blanco
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
