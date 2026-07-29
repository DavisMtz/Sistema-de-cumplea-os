/**
 * ============================================================================
 *  VENTEL · Actualización de datos de cumpleaños
 *  ---------------------------------------------------------------------------
 *  Webapp de autoservicio para que cada asesor corrija sus propias respuestas.
 *
 *  Flujo:
 *    1. El asesor se identifica eligiendo su NOMBRE (nunca su correo).
 *    2. Se cargan sus datos y puede editarlos libremente (nada se guarda aún).
 *    3. Al pulsar "Guardar", el servidor genera una clave dinámica de 6 dígitos
 *       y la envía al correo REGISTRADO en la hoja (que el cliente nunca ve
 *       completo). Sólo quien recibe ese correo puede confirmar el cambio.
 *    4. Confirmado el código, se escriben los cambios y se registra la fecha.
 *    5. A partir de ese momento el registro queda bloqueado DIAS_BLOQUEO días.
 *
 *  Hojas que usa:
 *    · "Respuestas de formulario 1"  → datos (columnas A:N, no se altera su forma)
 *    · "_Control Actualizaciones"    → bitácora, se crea sola y queda oculta
 *
 *  Instalación:
 *    1. Abre el Google Sheets → Extensiones → Apps Script.
 *    2. Pega este archivo como "actualizaciones.gs" y el HTML como
 *       "actualizaciones.html" (Archivo → Nuevo → Archivo HTML, sin la extensión).
 *    3. Implementar → Nueva implementación → Aplicación web.
 *         Ejecutar como: Yo   ·   Quién tiene acceso: según convenga.
 *    4. Ejecuta una vez `instalar()` desde el editor para autorizar permisos.
 * ============================================================================
 */

/** -------------------------------------------------------------------------
 *  CONFIGURACIÓN
 *  ------------------------------------------------------------------------- */
var CONFIG = {
  // Deja '' para usar la hoja a la que está vinculado el script.
  // Si el script es independiente, pega aquí el ID del Google Sheets.
  SPREADSHEET_ID: '',

  HOJA_DATOS: 'Respuestas de formulario 1',
  HOJA_CONTROL: '_Control Actualizaciones',

  // Días que deben pasar entre una actualización y la siguiente.
  DIAS_BLOQUEO: 30,

  // Ventana del tablero de próximos cumpleaños.
  DIAS_PROXIMOS: 30,

  // Vigencia de la clave dinámica (minutos) y límites antiabuso.
  MINUTOS_VIGENCIA_CODIGO: 10,
  MAX_INTENTOS_CODIGO: 5,
  SEGUNDOS_ESPERA_REENVIO: 60,

  // Si lo pones en true, se exige el código ANTES de mostrar los datos.
  // Más privado, pero añade un paso extra antes de ver la información.
  VERIFICAR_ANTES_DE_CARGAR: false,

  ORGANIZACION: 'VENTEL',
  TITULO_APP: 'Actualiza tus datos de cumpleaños'
};

/** Encabezados esperados (se buscan de forma flexible, sin acentos ni mayúsculas). */
var COLUMNAS = {
  marca:     'marca temporal',
  nombre:    'cual es tu nombre',
  fecha:     'cuando es tu cumpleanos',
  color:     'cual es tu color favorito',
  pastel:    'pastel o comida al gusto',
  sabor:     'sabor de pastel',
  otro1:     'otro',
  regalo:    'te gustaria regalo',
  otro2:     'otroo',
  detalles:  'detalles de tus gustos',
  auxDia:    'auxiliar de dia',
  auxMes:    'auxiliar de mes',
  telefono:  'numero telefonico',
  correo:    'correo electronico'
};

var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
             'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** Opciones sugeridas en los campos de selección (el resto entra como "Otro"). */
var OPCIONES = {
  pastel: ['Pastel', 'Comida', 'Ambos', 'Sin preferencia'],
  regalo: ['Regalo', 'Pastel o comida', 'Convivio', 'Ambos']
};


/* ==========================================================================
 *  1. PUNTO DE ENTRADA DE LA WEBAPP
 * ========================================================================== */

/** Plantilla con la configuración que necesita el cliente. */
function construirPlantilla() {
  var t = HtmlService.createTemplateFromFile('actualizaciones');
  t.CFG = {
    organizacion: CONFIG.ORGANIZACION,
    titulo: CONFIG.TITULO_APP,
    diasBloqueo: CONFIG.DIAS_BLOQUEO,
    diasProximos: CONFIG.DIAS_PROXIMOS,
    minutosCodigo: CONFIG.MINUTOS_VIGENCIA_CODIGO,
    esperaReenvio: CONFIG.SEGUNDOS_ESPERA_REENVIO,
    verificarAntes: CONFIG.VERIFICAR_ANTES_DE_CARGAR,
    opciones: OPCIONES,
    meses: MESES
  };
  return t;
}

function doGet() {
  return construirPlantilla().evaluate()
    .setTitle(CONFIG.TITULO_APP + ' · ' + CONFIG.ORGANIZACION)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Ejecuta esto una vez desde el editor para conceder permisos y crear la bitácora. */
function instalar() {
  var ss = abrirLibro();
  obtenerHojaControl(ss);
  obtenerPepper();
  Logger.log('Listo. Hoja de datos: "%s". Bitácora: "%s".',
             CONFIG.HOJA_DATOS, CONFIG.HOJA_CONTROL);
}

/** Menú opcional dentro del Sheets. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎂 Cumpleaños')
    .addItem('Abrir actualización de datos', 'mostrarDialogo')
    .addSeparator()
    .addItem('Liberar bloqueo de 30 días…', 'liberarBloqueoManual')
    .addToUi();
}

function mostrarDialogo() {
  SpreadsheetApp.getUi().showModalDialog(
    construirPlantilla().evaluate().setWidth(940).setHeight(700), CONFIG.TITULO_APP);
}


/* ==========================================================================
 *  2. API QUE CONSUME EL CLIENTE
 * ========================================================================== */

/**
 * Devuelve la lista de asesores para el buscador.
 * Sólo expone nombre + un identificador opaco. Nunca correos ni teléfonos.
 */
function listarAsesores() {
  return protegido(function () {
    var ctx = leerHoja();
    var lista = [];

    for (var i = 0; i < ctx.filas.length; i++) {
      var fila = ctx.filas[i];
      var nombre = texto(fila[ctx.col.nombre]);
      var correo = texto(fila[ctx.col.correo]).toLowerCase();
      if (!nombre && !correo) continue;

      lista.push({
        id: idOpaco(correo || ('fila:' + (i + 2))),
        nombre: nombre || '(sin nombre)',
        // Pista mínima para desambiguar homónimos, sin revelar el correo.
        pista: correo ? pistaCorreo(correo) : '',
        sinCorreo: !correo
      });
    }

    lista.sort(function (a, b) {
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
    return { ok: true, asesores: lista };
  });
}

/**
 * Tablero de cumpleaños dentro de la ventana configurada (30 días por defecto).
 *
 * Devuelve lo necesario para organizar el festejo — nombre, fecha, gustos —
 * pero NUNCA el teléfono ni el correo: esos datos sólo viven en la hoja, a la
 * que llega quien tiene permisos, no cualquiera con el enlace de la webapp.
 */
function proximosCumpleanos(dias) {
  return protegido(function () {
    var limite = parseInt(dias, 10) || CONFIG.DIAS_PROXIMOS;
    var ctx = leerHoja();

    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    var lista = [];
    for (var i = 0; i < ctx.filas.length; i++) {
      var v = extraerValores(ctx.filas[i], ctx.col);
      if (!v.dia || !v.mes || !v.nombre) continue;

      var faltan = diasHastaCumple(v.dia, v.mes, hoy);
      if (faltan > limite) continue;

      lista.push({
        nombre:   v.nombre,
        fecha:    fechaLegible(v.dia, v.mes),
        dia:      v.dia,
        mes:      v.mes,
        faltan:   faltan,
        prefiere: v.pastel,
        sabor:    v.sabor,
        regalo:   v.regalo,
        color:    v.color,
        detalles: v.detalles
      });
    }

    lista.sort(function (a, b) {
      return a.faltan - b.faltan || a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });

    return {
      ok: true,
      dias: limite,
      hoy: formatearFecha(hoy),
      total: lista.length,
      lista: lista
    };
  });
}

/**
 * Días que faltan para el próximo cumpleaños, ignorando el año de nacimiento.
 * Un 29 de febrero en año no bisiesto se celebra el 28.
 */
function diasHastaCumple(dia, mes, hoy) {
  function construir(anio) {
    var d = new Date(anio, mes - 1, dia);
    // Si el día no existe en ese mes, JS desborda al mes siguiente: lo corregimos.
    if (d.getMonth() !== mes - 1) d = new Date(anio, mes, 0);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  var fecha = construir(hoy.getFullYear());
  if (fecha.getTime() < hoy.getTime()) fecha = construir(hoy.getFullYear() + 1);

  return Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
}

/**
 * Carga los datos de un asesor a partir del identificador opaco.
 * El teléfono se devuelve enmascarado; el correo, sólo parcialmente.
 */
function cargarAsesor(id) {
  return protegido(function () {
    var reg = localizarPorId(id);
    if (!reg) return { ok: false, error: 'No encontramos ese registro. Vuelve a elegir tu nombre.' };

    var bloqueo = estadoBloqueo(reg.correo);

    return {
      ok: true,
      id: id,
      datos: {
        nombre:   reg.valores.nombre,
        dia:      reg.valores.dia,
        mes:      reg.valores.mes,
        color:    reg.valores.color,
        pastel:   reg.valores.pastel,
        sabor:    reg.valores.sabor,
        regalo:   reg.valores.regalo,
        detalles: reg.valores.detalles
      },
      correoMask: enmascararCorreo(reg.correo),
      telefonoMask: enmascararTelefono(reg.valores.telefono),
      tieneTelefono: !!reg.valores.telefono,
      tieneCorreo: !!reg.correo,
      bloqueo: bloqueo
    };
  });
}

/**
 * Valida los cambios, guarda la solicitud en el servidor y envía la clave
 * dinámica al correo registrado. Devuelve un token de sesión (no el código).
 */
function solicitarClave(id, cambios) {
  return protegido(function () {
    var reg = localizarPorId(id);
    if (!reg) return { ok: false, error: 'No encontramos ese registro. Vuelve a empezar.' };
    if (!reg.correo) {
      return { ok: false, error: 'Tu registro no tiene un correo asociado, así que no podemos verificar tu identidad. Solicita el cambio a Recursos Humanos.' };
    }

    var bloqueo = estadoBloqueo(reg.correo);
    if (bloqueo.bloqueado) {
      return { ok: false, error: bloqueo.mensaje, bloqueo: bloqueo };
    }

    var norm = normalizarCambios(cambios);
    if (norm.errores.length) {
      return { ok: false, error: norm.errores[0], errores: norm.errores };
    }

    var diff = calcularDiferencias(reg.valores, norm.valores);
    if (!diff.length) {
      return { ok: false, error: 'No detectamos ningún cambio. Modifica al menos un dato antes de guardar.' };
    }

    var codigo = generarCodigo();
    var token = Utilities.getUuid();

    guardarSesion(token, {
      correo: reg.correo,
      nombre: reg.valores.nombre,
      valores: norm.valores,
      diff: diff,
      hash: hashCodigo(codigo, token),
      intentos: 0,
      creado: Date.now(),
      ultimoEnvio: Date.now()
    });

    enviarCorreoClave(reg.correo, reg.valores.nombre, codigo, diff);

    return {
      ok: true,
      token: token,
      correoMask: enmascararCorreo(reg.correo),
      cambios: diff,
      expiraEn: CONFIG.MINUTOS_VIGENCIA_CODIGO * 60
    };
  });
}

/** Reenvía la clave de la sesión vigente, respetando el tiempo de espera. */
function reenviarClave(token) {
  return protegido(function () {
    var s = leerSesion(token);
    if (!s) return { ok: false, error: 'La sesión expiró. Vuelve a pulsar "Guardar cambios".', expirado: true };

    var esperados = CONFIG.SEGUNDOS_ESPERA_REENVIO * 1000;
    var transcurrido = Date.now() - s.ultimoEnvio;
    if (transcurrido < esperados) {
      return {
        ok: false,
        error: 'Espera unos segundos antes de pedir otra clave.',
        restante: Math.ceil((esperados - transcurrido) / 1000)
      };
    }

    var codigo = generarCodigo();
    s.hash = hashCodigo(codigo, token);
    s.intentos = 0;
    s.ultimoEnvio = Date.now();
    guardarSesion(token, s);

    enviarCorreoClave(s.correo, s.nombre, codigo, s.diff);

    return { ok: true, correoMask: enmascararCorreo(s.correo), expiraEn: CONFIG.MINUTOS_VIGENCIA_CODIGO * 60 };
  });
}

/**
 * Confirma la clave y aplica los cambios.
 * Los valores provienen de la sesión del servidor, nunca del cliente, así que
 * no es posible alterar el destino de la escritura después de verificar.
 */
function confirmarClave(token, codigo) {
  return protegido(function () {
    var s = leerSesion(token);
    if (!s) return { ok: false, error: 'La clave expiró. Vuelve a pulsar "Guardar cambios".', expirado: true };

    if (s.intentos >= CONFIG.MAX_INTENTOS_CODIGO) {
      borrarSesion(token);
      return { ok: false, error: 'Demasiados intentos fallidos. Vuelve a solicitar una clave nueva.', expirado: true };
    }

    var limpio = String(codigo || '').replace(/\D/g, '');
    if (hashCodigo(limpio, token) !== s.hash) {
      s.intentos++;
      guardarSesion(token, s);
      var restantes = CONFIG.MAX_INTENTOS_CODIGO - s.intentos;
      if (restantes <= 0) {
        borrarSesion(token);
        return { ok: false, error: 'Clave incorrecta. Se agotaron los intentos, solicita una nueva.', expirado: true };
      }
      return { ok: false, error: 'La clave no coincide. Te ' + (restantes === 1 ? 'queda 1 intento' : 'quedan ' + restantes + ' intentos') + '.', restantes: restantes };
    }

    // Verificado. A partir de aquí, escritura serializada.
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (e) {
      return { ok: false, error: 'El sistema está ocupado. Inténtalo de nuevo en unos segundos.' };
    }

    try {
      var reg = localizarPorCorreo(s.correo);
      if (!reg) return { ok: false, error: 'Tu registro ya no está disponible. Contacta a Recursos Humanos.' };

      // Revalidación del bloqueo por si alguien guardó mientras tanto.
      var bloqueo = estadoBloqueo(s.correo);
      if (bloqueo.bloqueado) {
        borrarSesion(token);
        return { ok: false, error: bloqueo.mensaje, bloqueo: bloqueo };
      }

      var diffReal = calcularDiferencias(reg.valores, s.valores);
      if (!diffReal.length) {
        borrarSesion(token);
        return { ok: false, error: 'Los datos ya estaban actualizados; no se registró ningún cambio.' };
      }

      aplicarCambios(reg, s.valores);
      registrarBitacora(reg, diffReal);
      borrarSesion(token);
      refrescarProximos();

      var proxima = new Date();
      proxima.setDate(proxima.getDate() + CONFIG.DIAS_BLOQUEO);

      return {
        ok: true,
        cambios: diffReal,
        proximaActualizacion: formatearFecha(proxima),
        correoMask: enmascararCorreo(s.correo)
      };
    } finally {
      lock.releaseLock();
    }
  });
}


/* ==========================================================================
 *  3. LECTURA Y ESCRITURA EN LA HOJA
 * ========================================================================== */

function abrirLibro() {
  if (CONFIG.SPREADSHEET_ID) return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No hay una hoja vinculada. Define CONFIG.SPREADSHEET_ID.');
  return ss;
}

function obtenerHojaDatos() {
  var ss = abrirLibro();
  var hoja = ss.getSheetByName(CONFIG.HOJA_DATOS);
  if (!hoja) throw new Error('No existe la hoja "' + CONFIG.HOJA_DATOS + '".');
  return hoja;
}

/** Localiza las columnas por encabezado normalizado, tolerando acentos y espacios. */
function mapearColumnas(encabezados) {
  var normalizados = encabezados.map(function (h) { return normalizar(h); });
  var col = {};

  Object.keys(COLUMNAS).forEach(function (clave) {
    var busca = COLUMNAS[clave];
    var idx = -1;
    for (var i = 0; i < normalizados.length; i++) {
      if (normalizados[i].indexOf(busca) !== -1) {
        // "otro" también coincidiría con "otroo": exigimos igualdad exacta ahí.
        if (clave === 'otro1' && normalizados[i] !== 'otro') continue;
        idx = i;
        break;
      }
    }
    col[clave] = idx;
  });

  if (col.nombre === -1 || col.correo === -1) {
    throw new Error('No se reconocen las columnas de nombre y correo en "' + CONFIG.HOJA_DATOS + '".');
  }
  return col;
}

function leerHoja() {
  var hoja = obtenerHojaDatos();
  var rango = hoja.getDataRange().getValues();
  if (rango.length < 2) return { hoja: hoja, col: {}, filas: [], encabezados: [] };

  var encabezados = rango[0];
  var col = mapearColumnas(encabezados);
  return { hoja: hoja, col: col, encabezados: encabezados, filas: rango.slice(1) };
}

/** Convierte una fila cruda en un objeto de valores normalizados. */
function extraerValores(fila, col) {
  var fecha = col.fecha >= 0 ? fila[col.fecha] : '';
  var dia = 0, mes = 0, anio = 0;

  if (fecha instanceof Date && !isNaN(fecha.getTime())) {
    dia = fecha.getDate();
    mes = fecha.getMonth() + 1;
    anio = fecha.getFullYear();
  } else {
    // Respaldo: columnas auxiliares de día y mes.
    dia = parseInt(col.auxDia >= 0 ? fila[col.auxDia] : 0, 10) || 0;
    mes = parseInt(col.auxMes >= 0 ? fila[col.auxMes] : 0, 10) || 0;
  }

  return {
    nombre:   texto(col.nombre >= 0 ? fila[col.nombre] : ''),
    dia:      dia,
    mes:      mes,
    anio:     anio,
    color:    texto(col.color >= 0 ? fila[col.color] : ''),
    pastel:   texto(col.pastel >= 0 ? fila[col.pastel] : ''),
    sabor:    texto(col.sabor >= 0 ? fila[col.sabor] : ''),
    regalo:   texto(col.regalo >= 0 ? fila[col.regalo] : ''),
    detalles: texto(col.detalles >= 0 ? fila[col.detalles] : ''),
    telefono: soloDigitos(col.telefono >= 0 ? fila[col.telefono] : '')
  };
}

function localizarPorId(id) {
  var ctx = leerHoja();
  for (var i = 0; i < ctx.filas.length; i++) {
    var correo = texto(ctx.filas[i][ctx.col.correo]).toLowerCase();
    var clave = correo || ('fila:' + (i + 2));
    if (idOpaco(clave) === id) {
      return {
        hoja: ctx.hoja,
        col: ctx.col,
        fila: i + 2,
        correo: correo,
        valores: extraerValores(ctx.filas[i], ctx.col)
      };
    }
  }
  return null;
}

function localizarPorCorreo(correo) {
  var objetivo = String(correo || '').toLowerCase().trim();
  if (!objetivo) return null;

  var ctx = leerHoja();
  for (var i = 0; i < ctx.filas.length; i++) {
    if (texto(ctx.filas[i][ctx.col.correo]).toLowerCase() === objetivo) {
      return {
        hoja: ctx.hoja,
        col: ctx.col,
        fila: i + 2,
        correo: objetivo,
        valores: extraerValores(ctx.filas[i], ctx.col)
      };
    }
  }
  return null;
}

/** Escribe sólo las celdas que cambiaron, para no tocar formato ni fórmulas ajenas. */
function aplicarCambios(reg, nuevos) {
  var hoja = reg.hoja, col = reg.col, f = reg.fila, ant = reg.valores;

  function set(indice, valor) {
    if (indice >= 0) hoja.getRange(f, indice + 1).setValue(valor);
  }

  if (nuevos.nombre !== ant.nombre) set(col.nombre, nuevos.nombre);
  if (nuevos.color !== ant.color) set(col.color, nuevos.color);
  if (nuevos.pastel !== ant.pastel) set(col.pastel, nuevos.pastel);
  if (nuevos.sabor !== ant.sabor) set(col.sabor, nuevos.sabor);
  if (nuevos.regalo !== ant.regalo) set(col.regalo, nuevos.regalo);
  if (nuevos.detalles !== ant.detalles) set(col.detalles, nuevos.detalles);
  if (nuevos.telefono && nuevos.telefono !== ant.telefono) set(col.telefono, nuevos.telefono);

  if (nuevos.dia !== ant.dia || nuevos.mes !== ant.mes) {
    var anio = ant.anio || new Date().getFullYear();
    // 29 de febrero necesita un año bisiesto para poder representarse.
    if (nuevos.mes === 2 && nuevos.dia === 29 && !esBisiesto(anio)) anio = 2024;

    set(col.fecha, new Date(anio, nuevos.mes - 1, nuevos.dia));
    set(col.auxDia, nuevos.dia);
    set(col.auxMes, nuevos.mes);
  }

  SpreadsheetApp.flush();
}

/** Si el libro ya tiene un generador de la hoja "Proximos", lo dispara. */
function refrescarProximos() {
  try {
    if (typeof actualizarProximos === 'function') { actualizarProximos(); return; }
    if (typeof generarProximos === 'function') { generarProximos(); return; }
  } catch (e) {
    Logger.log('No se pudo refrescar "Proximos": ' + e.message);
  }
}


/* ==========================================================================
 *  4. BLOQUEO DE 30 DÍAS Y BITÁCORA
 * ========================================================================== */

function obtenerHojaControl(ss) {
  ss = ss || abrirLibro();
  var hoja = ss.getSheetByName(CONFIG.HOJA_CONTROL);
  if (hoja) return hoja;

  hoja = ss.insertSheet(CONFIG.HOJA_CONTROL);
  hoja.getRange(1, 1, 1, 6).setValues([[
    'Fecha de actualización', 'Correo', 'Nombre', 'Fila', 'Campos modificados', 'Detalle'
  ]]);
  hoja.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f1f3f5');
  hoja.setFrozenRows(1);
  hoja.setColumnWidth(1, 170);
  hoja.setColumnWidth(2, 240);
  hoja.setColumnWidth(3, 220);
  hoja.setColumnWidth(6, 420);
  hoja.hideSheet();
  return hoja;
}

/** Fecha de la última actualización registrada para un correo, o null. */
function ultimaActualizacion(correo) {
  var hoja = obtenerHojaControl();
  var ultimo = hoja.getLastRow();
  if (ultimo < 2) return null;

  var datos = hoja.getRange(2, 1, ultimo - 1, 2).getValues();
  var objetivo = String(correo || '').toLowerCase().trim();
  var mejor = null;

  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][1]).toLowerCase().trim() !== objetivo) continue;
    var f = datos[i][0];
    if (f instanceof Date && !isNaN(f.getTime())) {
      if (!mejor || f.getTime() > mejor.getTime()) mejor = f;
    }
  }
  return mejor;
}

function estadoBloqueo(correo) {
  var ultima = ultimaActualizacion(correo);
  if (!ultima) {
    return { bloqueado: false, primeraVez: true, mensaje: '' };
  }

  var msDia = 24 * 60 * 60 * 1000;
  var transcurridos = Math.floor((Date.now() - ultima.getTime()) / msDia);
  var restantes = CONFIG.DIAS_BLOQUEO - transcurridos;

  if (restantes <= 0) {
    return {
      bloqueado: false,
      primeraVez: false,
      ultimaActualizacion: formatearFecha(ultima),
      mensaje: ''
    };
  }

  var libera = new Date(ultima.getTime() + CONFIG.DIAS_BLOQUEO * msDia);
  return {
    bloqueado: true,
    primeraVez: false,
    diasRestantes: restantes,
    ultimaActualizacion: formatearFecha(ultima),
    disponibleDesde: formatearFecha(libera),
    mensaje: 'Ya actualizaste tus datos el ' + formatearFecha(ultima) +
             '. Sólo se permite un cambio cada ' + CONFIG.DIAS_BLOQUEO +
             ' días, así que podrás volver a editarlos el ' + formatearFecha(libera) +
             ' (faltan ' + restantes + (restantes === 1 ? ' día' : ' días') + ').'
  };
}

function registrarBitacora(reg, diff) {
  var hoja = obtenerHojaControl();
  var campos = diff.map(function (d) { return d.campo; }).join(', ');
  var detalle = diff.map(function (d) {
    return d.campo + ': "' + d.antes + '" → "' + d.despues + '"';
  }).join('\n');

  hoja.appendRow([new Date(), reg.correo, reg.valores.nombre, reg.fila, campos, detalle]);
}

/** Utilidad para administradores: quita el bloqueo de un asesor concreto. */
function liberarBloqueoManual() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Liberar bloqueo',
    'Escribe el correo del asesor al que quieres permitir una actualización inmediata:',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;

  var correo = r.getResponseText().toLowerCase().trim();
  if (!correo) return;

  var hoja = obtenerHojaControl();
  var ultimo = hoja.getLastRow();
  if (ultimo < 2) { ui.alert('No hay registros en la bitácora.'); return; }

  var datos = hoja.getRange(2, 1, ultimo - 1, 2).getValues();
  var borradas = 0;
  for (var i = datos.length - 1; i >= 0; i--) {
    if (String(datos[i][1]).toLowerCase().trim() === correo) {
      hoja.deleteRow(i + 2);
      borradas++;
    }
  }
  ui.alert(borradas
    ? 'Listo. Se eliminaron ' + borradas + ' registro(s) y ' + correo + ' ya puede actualizar.'
    : 'No se encontraron registros para ' + correo + '.');
}


/* ==========================================================================
 *  5. CLAVE DINÁMICA (OTP)
 * ========================================================================== */

/** Secreto del servidor que se mezcla con el código antes de guardar su hash. */
function obtenerPepper() {
  var props = PropertiesService.getScriptProperties();
  var p = props.getProperty('OTP_PEPPER');
  if (!p) {
    p = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('OTP_PEPPER', p);
  }
  return p;
}

/** Código de 6 dígitos derivado de material aleatorio del propio Apps Script. */
function generarCodigo() {
  var semilla = Utilities.getUuid() + Date.now() + Math.random();
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, semilla);
  var n = 0;
  for (var i = 0; i < 6; i++) n = (n * 256 + (bytes[i] & 0xff)) % 1000000;
  return ('000000' + n).slice(-6);
}

function hashCodigo(codigo, token) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(codigo) + '|' + token + '|' + obtenerPepper()
  );
  return bytes.map(function (b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
}

function guardarSesion(token, datos) {
  CacheService.getScriptCache().put(
    'otp:' + token,
    JSON.stringify(datos),
    CONFIG.MINUTOS_VIGENCIA_CODIGO * 60
  );
}

function leerSesion(token) {
  if (!token) return null;
  var raw = CacheService.getScriptCache().get('otp:' + String(token));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function borrarSesion(token) {
  CacheService.getScriptCache().remove('otp:' + String(token));
}

function enviarCorreoClave(correo, nombre, codigo, diff) {
  var nom = (nombre || '').split(' ')[0] || 'Hola';
  var filas = diff.map(function (d) {
    return '<tr>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #e9ecef;color:#5b6572;font-size:13px;">' + escapar(d.campo) + '</td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #e9ecef;color:#8a94a1;font-size:13px;text-decoration:line-through;">' + escapar(d.antes || '—') + '</td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #e9ecef;color:#14181f;font-size:13px;font-weight:600;">' + escapar(d.despues || '—') + '</td>' +
      '</tr>';
  }).join('');

  var html =
  '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f8fa;padding:32px 16px;">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3e6ea;border-radius:16px;overflow:hidden;">' +
      '<div style="padding:24px 32px;border-bottom:1px solid #e3e6ea;">' +
        '<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a94a1;font-weight:600;">' + escapar(CONFIG.ORGANIZACION) + '</div>' +
        '<div style="font-size:20px;font-weight:700;color:#14181f;margin-top:4px;">Confirma tus cambios</div>' +
      '</div>' +
      '<div style="padding:32px;">' +
        '<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#14181f;">' +
          escapar(nom) + ', alguien (esperamos que tú) pidió actualizar tus datos de cumpleaños. ' +
          'Usa esta clave para confirmarlo:</p>' +
        '<div style="text-align:center;margin:0 0 20px;">' +
          '<div style="display:inline-block;background:#f7f8fa;border:1px solid #e3e6ea;border-radius:12px;padding:16px 28px;' +
                      'font-size:34px;font-weight:700;letter-spacing:.34em;color:#14181f;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">' +
            escapar(codigo) +
          '</div>' +
        '</div>' +
        '<p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#5b6572;text-align:center;">' +
          'La clave vence en ' + CONFIG.MINUTOS_VIGENCIA_CODIGO + ' minutos.</p>' +
        '<div style="font-size:13px;font-weight:600;color:#14181f;margin-bottom:8px;">Esto es lo que se guardará:</div>' +
        '<table style="width:100%;border-collapse:collapse;border:1px solid #e9ecef;border-radius:8px;">' +
          '<tr style="background:#f7f8fa;">' +
            '<th style="text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#5b6572;">Campo</th>' +
            '<th style="text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#5b6572;">Antes</th>' +
            '<th style="text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#5b6572;">Ahora</th>' +
          '</tr>' + filas +
        '</table>' +
        '<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;">' +
          'Si no fuiste tú, ignora este mensaje: sin la clave no se guarda nada.</p>' +
      '</div>' +
      '<div style="padding:16px 32px;background:#f7f8fa;border-top:1px solid #e3e6ea;font-size:12px;color:#8a94a1;">' +
        'Recuerda que sólo puedes actualizar tus datos una vez cada ' + CONFIG.DIAS_BLOQUEO + ' días.' +
      '</div>' +
    '</div>' +
  '</div>';

  MailApp.sendEmail({
    to: correo,
    subject: 'Tu clave de confirmación: ' + codigo,
    htmlBody: html,
    body: nom + ', tu clave para confirmar la actualización de tus datos es ' + codigo +
          '. Vence en ' + CONFIG.MINUTOS_VIGENCIA_CODIGO + ' minutos. Si no fuiste tú, ignora este correo.',
    name: CONFIG.ORGANIZACION + ' · Cumpleaños'
  });
}


/* ==========================================================================
 *  6. VALIDACIÓN Y COMPARACIÓN
 * ========================================================================== */

function normalizarCambios(c) {
  c = c || {};
  var errores = [];

  var nombre = recortar(c.nombre, 120);
  if (!nombre) errores.push('El nombre no puede quedar vacío.');
  else if (nombre.length < 3) errores.push('El nombre es demasiado corto.');

  var dia = parseInt(c.dia, 10) || 0;
  var mes = parseInt(c.mes, 10) || 0;
  if (mes < 1 || mes > 12) errores.push('Elige un mes válido para tu cumpleaños.');
  else if (dia < 1 || dia > diasDelMes(mes)) {
    errores.push('El día ' + dia + ' no existe en ' + MESES[mes - 1] + '.');
  }

  // El campo "otro" sustituye a la opción cuando el asesor elige "Otro".
  var pastel = (c.pastel === '__otro__') ? recortar(c.pastelOtro, 200) : recortar(c.pastel, 200);
  if (c.pastel === '__otro__' && !pastel) errores.push('Escribe qué prefieres en "Pastel o comida al gusto".');

  var regalo = (c.regalo === '__otro__') ? recortar(c.regaloOtro, 200) : recortar(c.regalo, 200);
  if (c.regalo === '__otro__' && !regalo) errores.push('Escribe qué prefieres en "¿Te gustaría un regalo o un aperitivo?".');

  var telefono = soloDigitos(c.telefono);
  if (telefono && telefono.length !== 10) {
    errores.push('El teléfono debe tener 10 dígitos (o déjalo vacío para conservar el actual).');
  }

  return {
    errores: errores,
    valores: {
      nombre: nombre,
      dia: dia,
      mes: mes,
      color: recortar(c.color, 120),
      pastel: pastel,
      sabor: recortar(c.sabor, 250),
      regalo: regalo,
      detalles: recortar(c.detalles, 1000),
      telefono: telefono
    }
  };
}

var ETIQUETAS = {
  nombre:   'Nombre',
  fecha:    'Fecha de cumpleaños',
  color:    'Color favorito',
  pastel:   'Pastel o comida al gusto',
  sabor:    'Sabor de pastel',
  regalo:   'Regalo o aperitivo',
  detalles: 'Detalles de tus gustos',
  telefono: 'Teléfono'
};

function calcularDiferencias(antes, despues) {
  var diff = [];

  ['nombre', 'color', 'pastel', 'sabor', 'regalo', 'detalles'].forEach(function (k) {
    if (String(antes[k] || '') !== String(despues[k] || '')) {
      diff.push({ clave: k, campo: ETIQUETAS[k], antes: antes[k] || '', despues: despues[k] || '' });
    }
  });

  if (antes.dia !== despues.dia || antes.mes !== despues.mes) {
    diff.push({
      clave: 'fecha',
      campo: ETIQUETAS.fecha,
      antes: fechaLegible(antes.dia, antes.mes),
      despues: fechaLegible(despues.dia, despues.mes)
    });
  }

  // El teléfono vacío significa "no lo cambies".
  if (despues.telefono && despues.telefono !== antes.telefono) {
    diff.push({
      clave: 'telefono',
      campo: ETIQUETAS.telefono,
      antes: enmascararTelefono(antes.telefono),
      despues: enmascararTelefono(despues.telefono)
    });
  }

  return diff;
}


/* ==========================================================================
 *  7. UTILIDADES
 * ========================================================================== */

/** Envuelve cada llamada para que el cliente reciba siempre un objeto usable. */
function protegido(fn) {
  try {
    return fn();
  } catch (e) {
    Logger.log('Error: ' + e.stack);
    return { ok: false, error: 'Ocurrió un problema: ' + e.message };
  }
}

var RE_DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');

function normalizar(s) {
  return String(s || '')
    .normalize('NFD').replace(RE_DIACRITICOS, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function texto(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return formatearFecha(v);
  return String(v).trim();
}

function recortar(v, max) {
  return String(v === null || v === undefined ? '' : v).trim().slice(0, max || 250);
}

function soloDigitos(v) {
  if (v === null || v === undefined || v === '') return '';
  // Los teléfonos guardados como número pueden llegar en notación científica.
  if (typeof v === 'number') v = v.toFixed(0);
  return String(v).replace(/\D/g, '');
}

/** Identificador estable y no reversible para no exponer correos en el cliente. */
function idOpaco(clave) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, String(clave) + '|id|' + obtenerPepper());
  var hex = '';
  for (var i = 0; i < 12; i++) hex += ('0' + (bytes[i] & 0xff).toString(16)).slice(-2);
  return hex;
}

function enmascararCorreo(correo) {
  correo = String(correo || '');
  var p = correo.split('@');
  if (p.length !== 2) return '···';
  var u = p[0];
  var visible = u.length <= 2 ? u.charAt(0) : u.slice(0, 2);
  return visible + '·'.repeat(Math.max(3, u.length - visible.length)) + '@' + p[1];
}

function enmascararTelefono(tel) {
  tel = soloDigitos(tel);
  if (!tel) return '';
  if (tel.length <= 4) return '···' + tel;
  return '··· ··· ' + tel.slice(-4);
}

/** Pista para distinguir homónimos sin revelar el correo completo. */
function pistaCorreo(correo) {
  var u = String(correo || '').split('@')[0];
  if (!u) return '';
  return u.charAt(0).toUpperCase() + '·' + u.slice(-1).toUpperCase();
}

function esBisiesto(a) {
  return (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
}

function diasDelMes(mes) {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1] || 31;
}

function fechaLegible(dia, mes) {
  if (!dia || !mes) return '—';
  return dia + ' de ' + MESES[mes - 1];
}

function formatearFecha(d) {
  if (!(d instanceof Date)) return '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function escapar(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
