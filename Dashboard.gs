/**
 * TABLERO VISUAL DE PRÓXIMOS CUMPLEAÑOS — VENTEL
 * ----------------------------------------------------------------------------
 * Reemplaza el antiguo "bloque de texto" de la celda B4 por un panel visual
 * con encabezado de marca, código de colores por urgencia y filas alternadas.
 *
 * Se dibuja automáticamente al ejecutar encontrarProximoCumpleaños().
 * Usa las columnas B a F de la hoja "Proximos".
 * ----------------------------------------------------------------------------
 */

function actualizarDashboard(lista) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.hojas.proximos);
  if (!hoja) return;

  const c = CONFIG.marca.colores;
  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd 'de' MMMM 'de' yyyy");

  // --- 1. Limpiar la zona del tablero (formato + contenido) ---
  hoja.getRange("B1:F200").clear().setBorder(false, false, false, false, false, false);

  // --- 2. Anchos de columna para que se vea ordenado ---
  hoja.setColumnWidth(2, 230); // Nombre
  hoja.setColumnWidth(3, 130); // Fecha
  hoja.setColumnWidth(4, 110); // Faltan
  hoja.setColumnWidth(5, 260); // Le gustaría
  hoja.setColumnWidth(6, 140); // Teléfono

  // --- 3. Banner principal (rosa Liverpool) ---
  hoja.getRange("B1:F1").merge()
    .setValue("🎂  PRÓXIMOS CUMPLEAÑOS · VENTEL")
    .setBackground(c.primario).setFontColor("#FFFFFF")
    .setFontSize(16).setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  hoja.setRowHeight(1, 48);

  // --- 4. Subtítulo con fecha de actualización y conteo ---
  hoja.getRange("B2:F2").merge()
    .setValue(`Actualizado el ${fecha}   ·   ${lista.length} cumpleaño${lista.length === 1 ? '' : 's'} en los próximos 30 días`)
    .setBackground("#FCE7F3").setFontColor(c.secundario)
    .setFontSize(10).setFontStyle("italic")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  hoja.setRowHeight(2, 26);

  // --- 5. Caso sin cumpleaños próximos ---
  if (lista.length === 0) {
    hoja.getRange("B4:F4").merge()
      .setValue("🎈 No hay cumpleaños en los próximos 30 días. ¡Disfruta la calma!")
      .setBackground("#F9FAFB").setFontColor(c.textoCuerpo)
      .setFontSize(12).setHorizontalAlignment("center").setVerticalAlignment("middle");
    hoja.setRowHeight(4, 40);
    return;
  }

  // --- 6. Encabezados de la tabla ---
  const encabezados = ["Nombre", "Fecha", "Faltan", "Le gustaría", "Teléfono"];
  hoja.getRange(4, 2, 1, 5).setValues([encabezados])
    .setBackground(c.secundario).setFontColor("#FFFFFF")
    .setFontWeight("bold").setFontSize(11)
    .setVerticalAlignment("middle");
  hoja.setRowHeight(4, 32);

  // --- 7. Filas de datos (escritas en lote) ---
  const valores = lista.map(p => {
    const faltan = p.diasRestantes === 0 ? "¡HOY! 🎉" : `${p.diasRestantes} día${p.diasRestantes > 1 ? 's' : ''}`;
    return [
      p.nombre,
      `${p.dia} de ${p.mesTexto}`,
      faltan,
      p.dinamica || "—",
      p.telefono || "—"
    ];
  });

  const inicio = 5;
  const tabla = hoja.getRange(inicio, 2, lista.length, 5);
  tabla.setValues(valores)
    .setFontSize(11).setVerticalAlignment("middle")
    .setBorder(true, true, true, true, true, true, "#E5E7EB", SpreadsheetApp.BorderStyle.SOLID);

  // --- 8. Formato por fila: zebra + color de urgencia en "Faltan" ---
  lista.forEach((p, i) => {
    const fila = inicio + i;
    hoja.setRowHeight(fila, 30);

    // Rayado tipo "zebra" para lectura cómoda
    if (i % 2 === 1) hoja.getRange(fila, 2, 1, 5).setBackground("#FAFAFA");

    // Color de urgencia en la celda "Faltan" (columna D = 4)
    const u = colorUrgencia(p.diasRestantes, c);
    hoja.getRange(fila, 4)
      .setBackground(u.bg).setFontColor(u.fg)
      .setFontWeight("bold").setHorizontalAlignment("center");

    // El nombre del festejado de HOY resalta en rosa
    if (p.diasRestantes === 0) {
      hoja.getRange(fila, 2).setFontWeight("bold").setFontColor(c.primario);
    }
  });
}

/**
 * Devuelve los colores (fondo/texto) según qué tan cerca está el cumpleaños.
 *  - HOY        → rosa Liverpool
 *  - ≤ 3 días   → rojo
 *  - ≤ 10 días  → morado
 *  - más lejano → azul suave
 */
function colorUrgencia(dias, c) {
  if (dias === 0)  return { bg: c.primario, fg: "#FFFFFF" };
  if (dias <= 3)   return { bg: "#FEF2F2", fg: "#B91C1C" };
  if (dias <= 10)  return { bg: "#F5F3FF", fg: "#6D28D9" };
  return { bg: "#EFF6FF", fg: "#1D4ED8" };
}
