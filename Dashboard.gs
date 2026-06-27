/**
 * TABLERO VISUAL DE PRÓXIMOS CUMPLEAÑOS — VENTEL
 * ----------------------------------------------------------------------------
 * Panel visual pensado para el EQUIPO ORGANIZADOR: muestra de un vistazo toda
 * la información útil para planear cada festejo (qué prefiere, sabor, color,
 * comentarios y teléfono), con encabezado de marca, leyenda de urgencia por
 * colores y filas alternadas para lectura cómoda.
 *
 * Se dibuja automáticamente al ejecutar encontrarProximoCumpleaños().
 * Usa las columnas B a J de la hoja "Proximos".
 * ----------------------------------------------------------------------------
 */

// Orden y ancho de las columnas del tablero (de la columna B = 2 en adelante).
const DASH_COLUMNAS = [
  { titulo: "Nombre",          ancho: 200 },
  { titulo: "Fecha",           ancho: 175 },
  { titulo: "Faltan",          ancho: 110 },
  { titulo: "Prefiere",        ancho: 130 },
  { titulo: "Sabor del pastel",ancho: 150 },
  { titulo: "Le gustaría",     ancho: 230 },
  { titulo: "Color favorito",  ancho: 130 },
  { titulo: "Comentarios",     ancho: 240 },
  { titulo: "Teléfono",        ancho: 130 }
];

function actualizarDashboard(lista) {
  // Blindaje: esta función está pensada para llamarse desde
  // encontrarProximoCumpleaños(). Si se ejecuta sola (sin parámetro), no truena:
  // simplemente dibuja el panel vacío.
  lista = Array.isArray(lista) ? lista : [];

  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.hojas.proximos);
  if (!hoja) return;

  const c = CONFIG.marca.colores;
  const nCols = DASH_COLUMNAS.length;             // 9 columnas (B..J)
  const colFin = 1 + nCols;                        // última columna usada = J (10)
  const colFinLetra = columnaALetra(colFin);
  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd 'de' MMMM 'de' yyyy");

  // --- 1. Limpiar la zona del tablero (formato + contenido) ---
  hoja.setFrozenRows(0); // liberar antes de limpiar para evitar conflictos
  hoja.getRange(`B1:${colFinLetra}300`).clear().setBorder(false, false, false, false, false, false);

  // --- 2. Anchos de columna para que se vea ordenado ---
  DASH_COLUMNAS.forEach((col, i) => hoja.setColumnWidth(2 + i, col.ancho));

  // --- 3. Banner principal (rosa Liverpool) ---
  hoja.getRange(1, 2, 1, nCols).merge()
    .setValue("🎂  PRÓXIMOS CUMPLEAÑOS · VENTEL")
    .setBackground(c.primario).setFontColor("#FFFFFF")
    .setFontSize(16).setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  hoja.setRowHeight(1, 48);

  // --- 4. Subtítulo con fecha de actualización y conteo ---
  const hoyCount = lista.filter(p => p.diasRestantes === 0).length;
  const proximosCount = lista.length - hoyCount;
  let resumen = `Actualizado el ${fecha}`;
  if (hoyCount > 0) resumen += `   ·   🎉 ${hoyCount} cumpleaño${hoyCount === 1 ? '' : 's'} HOY`;
  resumen += `   ·   ${proximosCount} en los próximos 30 días`;

  hoja.getRange(2, 2, 1, nCols).merge()
    .setValue(resumen)
    .setBackground("#FCE7F3").setFontColor(c.secundario)
    .setFontSize(10).setFontStyle("italic")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  hoja.setRowHeight(2, 26);

  // --- 5. Leyenda visual del código de urgencia (colores explicados) ---
  dibujarLeyenda(hoja, 3, c);
  hoja.setRowHeight(3, 26);

  // --- 6. Caso sin cumpleaños próximos ---
  if (lista.length === 0) {
    hoja.getRange(5, 2, 1, nCols).merge()
      .setValue("🎈 No hay cumpleaños en los próximos 30 días. ¡Disfruta la calma!")
      .setBackground("#F9FAFB").setFontColor(c.textoCuerpo)
      .setFontSize(12).setHorizontalAlignment("center").setVerticalAlignment("middle");
    hoja.setRowHeight(5, 40);
    return;
  }

  // --- 7. Encabezados de la tabla ---
  const filaEnc = 4;
  hoja.getRange(filaEnc, 2, 1, nCols).setValues([DASH_COLUMNAS.map(col => col.titulo)])
    .setBackground(c.secundario).setFontColor("#FFFFFF")
    .setFontWeight("bold").setFontSize(11)
    .setVerticalAlignment("middle").setHorizontalAlignment("left");
  hoja.setRowHeight(filaEnc, 32);

  // --- 8. Filas de datos (escritas en lote) ---
  const valores = lista.map(p => {
    const faltan = p.diasRestantes === 0
      ? "¡HOY! 🎉"
      : `${p.diasRestantes} día${p.diasRestantes > 1 ? 's' : ''}`;
    const esPastel = p.eleccion && p.eleccion.toLowerCase().includes("pastel");
    return [
      p.nombre || "—",
      fechaConDiaSemana(p),
      faltan,
      p.eleccion || "—",
      esPastel ? (p.sabor || "—") : "—", // el sabor solo aplica si prefiere pastel
      p.dinamica || "—",
      p.color || "—",
      p.comentario ? `“${p.comentario}”` : "—",
      (p.telefono === "" || p.telefono == null) ? "—" : p.telefono
    ];
  });

  const inicio = 5;
  const tabla = hoja.getRange(inicio, 2, lista.length, nCols);
  tabla.setValues(valores)
    .setFontSize(11).setVerticalAlignment("middle")
    .setWrap(true) // ajustar texto largo (dinámica y comentarios)
    .setBorder(true, true, true, true, true, true, "#E5E7EB", SpreadsheetApp.BorderStyle.SOLID);

  // Teléfono como número entero (sin notación científica ni decimales).
  hoja.getRange(inicio, colFin, lista.length, 1).setNumberFormat("0");

  // --- 9. Formato por fila: zebra + color de urgencia en "Faltan" ---
  const colFaltan = 4;   // columna D
  const colNombre = 2;   // columna B
  lista.forEach((p, i) => {
    const fila = inicio + i;
    hoja.setRowHeight(fila, 38);

    // Rayado tipo "zebra" muy sutil para lectura cómoda
    if (i % 2 === 1) hoja.getRange(fila, 2, 1, nCols).setBackground("#FCFCFC");

    // Color de urgencia en la celda "Faltan"
    const u = colorUrgencia(p.diasRestantes, c);
    hoja.getRange(fila, colFaltan)
      .setBackground(u.bg).setFontColor(u.fg)
      .setFontWeight("bold").setHorizontalAlignment("center");

    // El nombre del festejado de HOY resalta en rosa
    if (p.diasRestantes === 0) {
      hoja.getRange(fila, colNombre).setFontWeight("bold").setFontColor(c.primario);
    }
  });

  // --- 10. Congelar encabezados para que la tabla sea cómoda al desplazarse ---
  hoja.setFrozenRows(filaEnc);
}

/**
 * Dibuja, en una fila, la leyenda del código de urgencia con celdas de color
 * para que el equipo entienda de inmediato qué significa cada tono.
 */
function dibujarLeyenda(hoja, fila, c) {
  const items = [
    { texto: "🎉 Hoy",            bg: c.primario,  fg: "#FFFFFF", span: 2 },
    { texto: "🔴 3 días o menos", bg: "#FEE2E2",   fg: "#B91C1C", span: 2 },
    { texto: "🟡 Hasta 7 días",   bg: "#FEF3C7",   fg: "#B45309", span: 2 },
    { texto: "🟢 Resto del mes",  bg: "#DCFCE7",   fg: "#15803D", span: 3 }
  ];
  let col = 2;
  items.forEach(item => {
    const rango = hoja.getRange(fila, col, 1, item.span);
    if (item.span > 1) rango.merge();
    rango.setValue(item.texto)
      .setBackground(item.bg).setFontColor(item.fg)
      .setFontSize(10).setFontWeight("bold")
      .setHorizontalAlignment("center").setVerticalAlignment("middle");
    col += item.span;
  });
}

/**
 * Devuelve la fecha del cumpleaños con su día de la semana, p. ej.
 * "Domingo 28 de junio" — útil para que el equipo sepa qué día planear.
 */
function fechaConDiaSemana(p) {
  let diaSemana = "";
  try {
    diaSemana = p.fechaObject.toLocaleString('es-ES', { weekday: 'long' });
    diaSemana = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1) + " ";
  } catch (e) {
    diaSemana = "";
  }
  return `${diaSemana}${p.dia} de ${p.mesTexto}`;
}

/**
 * Devuelve los colores (fondo/texto) según qué tan cerca está el cumpleaños.
 * Código tipo semáforo, fácil de leer para quien organiza:
 *  - HOY        → rosa Liverpool sólido 🎉
 *  - ≤ 3 días   → rojo (urgente)
 *  - ≤ 7 días   → amarillo (esta semana)
 *  - resto      → verde (con tiempo de planear)
 */
function colorUrgencia(dias, c) {
  if (dias === 0)  return { bg: c.primario, fg: "#FFFFFF" };
  if (dias <= 3)   return { bg: "#FEE2E2", fg: "#B91C1C" };
  if (dias <= 7)   return { bg: "#FEF3C7", fg: "#B45309" };
  return { bg: "#DCFCE7", fg: "#15803D" };
}

/** Convierte un número de columna (1-based) a su letra (1→A, 27→AA). */
function columnaALetra(col) {
  let letra = "";
  while (col > 0) {
    const resto = (col - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    col = Math.floor((col - 1) / 26);
  }
  return letra;
}
