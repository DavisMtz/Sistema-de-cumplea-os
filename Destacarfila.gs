/**
 * RESALTAR EL CUMPLEAÑOS MÁS PRÓXIMO EN LA HOJA — VENTEL
 * ----------------------------------------------------------------------------
 * Pinta la fila de la persona cuyo cumpleaños está más cerca, usando el rosa
 * institucional Liverpool (antes era azul marino, fuera de marca).
 * ----------------------------------------------------------------------------
 */

function resaltarCumpleañosMasProximo() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.hojas.respuestas);
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return;

  const dias = hoja.getRange("K2:K" + ultimaFila).getValues();
  const meses = hoja.getRange("L2:L" + ultimaFila).getValues();

  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  let menorDiferencia = null;
  let filaProxima = null;

  // Buscar la fila con la menor diferencia de días
  for (let i = 0; i < dias.length; i++) {
    const diaNum = parseInt(dias[i][0], 10);
    const mesNum = parseInt(meses[i][0], 10) - 1;
    if (isNaN(diaNum) || isNaN(mesNum)) continue;

    let cumple = new Date(hoy.getFullYear(), mesNum, diaNum);
    if (cumple < hoySinHora) cumple.setFullYear(hoy.getFullYear() + 1);

    const diferencia = Math.ceil((cumple - hoySinHora) / (1000 * 60 * 60 * 24));

    if (menorDiferencia === null || diferencia < menorDiferencia) {
      menorDiferencia = diferencia;
      filaProxima = i + 2; // +2 porque los datos inician en la fila 2
    }
  }

  if (filaProxima === null) return;

  // Limpiar colores anteriores y resaltar la fila más próxima en rosa Liverpool
  hoja.getRange("2:" + ultimaFila).setBackground(null).setFontColor("black");
  hoja.getRange(filaProxima, 1, 1, hoja.getLastColumn())
      .setBackground(CONFIG.marca.colores.primario) // Rosa institucional Liverpool
      .setFontColor("#FFFFFF")
      .setFontWeight("bold");
}
