/**
 * ============================================================================
 *  VENTEL · Bot de recordatorio de cumpleaños en Google Chat
 *  ---------------------------------------------------------------------------
 *  Publica todos los días —en el espacio de Google Chat del equipo— el mismo
 *  tablero de "Próximos cumpleaños" que muestra la webapp de actualización de
 *  datos, y deja un botón que lleva directo a esa sección.
 *
 *  ¿Por qué una tarjeta y no una captura de pantalla?
 *    Google Chat no renderiza HTML ni CSS, y Apps Script no puede fotografiar
 *    una página web. La forma fiel de llevar ese diseño a Chat es reconstruirlo
 *    con `cardsV2`, el formato nativo de tarjetas: se respetan el marcador, los
 *    tramos por cercanía, el semáforo de colores y los gustos de cada persona,
 *    con la ventaja de que la tarjeta queda viva (botones que abren la webapp)
 *    en vez de ser una imagen plana.
 *
 *  Puesta en marcha (una sola vez, desde el editor de Apps Script):
 *    1. Ejecuta  configurarWebhookChat('https://chat.googleapis.com/v1/spaces/…')
 *       con la URL del webhook del espacio. Se guarda en las propiedades del
 *       script para que la credencial NO viva en el código ni en el repositorio.
 *    2. Ejecuta  instalarBotChat()   → crea el activador diario.
 *    3. Ejecuta  probarBotChat()     → publica una tarjeta de prueba al momento.
 *
 *  Funciones de uso diario:
 *    · enviarResumenCumplesChat()  Lo que corre el activador.
 *    · probarBotChat()             Publica ahora, ignorando filtros y candado.
 *    · instalarBotChat()           Crea/reemplaza el activador diario.
 *    · quitarBotChat()             Elimina el activador.
 *    · estadoBotChat()             Diagnóstico rápido en el registro.
 *
 *  Este archivo es autónomo: no redeclara nada de los demás .gs. Si vive en el
 *  mismo proyecto que la webapp reutiliza su función `proximosCumpleanos()`;
 *  si no, lee la hoja de respuestas por su cuenta.
 * ============================================================================
 */

/** -------------------------------------------------------------------------
 *  CONFIGURACIÓN DEL BOT
 *  ------------------------------------------------------------------------- */
var BOT_CHAT = {
  /**
   * La URL del webhook NO se escribe aquí: contiene una llave y un token que
   * dan permiso de publicar en el espacio. Se guarda con
   * `configurarWebhookChat(url)` en las propiedades del script.
   * Si de plano prefieres dejarla fija, pégala aquí — pero entonces no subas
   * este archivo a un repositorio público.
   */
  WEBHOOK_URL: '',
  PROP_WEBHOOK: 'WEBHOOK_CHAT_CUMPLES',

  /** Webapp de actualización de datos (la implementación /exec). */
  URL_WEBAPP: 'https://script.google.com/a/macros/liverpool.com.mx/s/' +
              'AKfycbzltj22MwEtdoL-XzUVzthiO99hUVsj24PpWcdPH49IzSIymkD1AtZClAqYGjAj38YC/exec',

  /** Parámetro que abre la webapp directamente en "Próximos cumpleaños". */
  PARAM_VISTA: 'vista=proximos',

  /** Ventana del tablero, igual que la de la webapp. */
  DIAS_PROXIMOS: 30,

  /** Hasta cuántos días de cercanía se despliegan los gustos completos. */
  DIAS_DETALLE: 7,

  /** Cuántas personas se listan como máximo (evita tarjetas kilométricas). */
  MAX_PERSONAS: 25,

  /**
   * Si no hay ningún cumpleaños en la ventana, no publica nada.
   * Ponlo en false si prefieres el aviso diario aunque venga vacío.
   */
  SILENCIO_SI_VACIO: true,

  /**
   * Candado del día: evita publicar dos veces la misma fecha si el activador
   * se dispara de más o si alguien corre la función a mano.
   */
  UNA_VEZ_AL_DIA: true,
  PROP_ULTIMO_ENVIO: 'ULTIMO_ENVIO_CHAT_CUMPLES',

  /** Hora del activador diario (0–23, zona horaria del script). */
  HORA_ENVIO: 8,

  ORGANIZACION: 'VENTEL',

  /** Semáforo de urgencia: los mismos colores que la hoja "Proximos". */
  COLORES: {
    hoy:     '#E10098',  // Rosa Liverpool
    urgente: '#C62828',  // ≤ 3 días
    semana:  '#B26A00',  // ≤ 7 días
    mes:     '#2E7D32',  // el resto del mes
    tenue:   '#5A5560'   // texto secundario
  }
};

/** Tramos de cercanía, en el mismo orden que la webapp. */
var TRAMOS_CHAT = [
  { clave: 'hoy',     titulo: '🎉 Hoy',                 max: 0,   emoji: '🎉' },
  { clave: 'urgente', titulo: '🔴 En 3 días o menos',   max: 3,   emoji: '🔴' },
  { clave: 'semana',  titulo: '🟡 Esta semana',         max: 7,   emoji: '🟡' },
  { clave: 'mes',     titulo: '🟢 Más adelante',        max: 1e9, emoji: '🟢' }
];

var MESES_CHAT = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];


/* ==========================================================================
 *  1. FUNCIÓN PRINCIPAL (la que dispara el activador diario)
 * ========================================================================== */

/**
 * Revisa qué cumpleaños vienen y publica la tarjeta en el espacio de Chat.
 * @param {boolean} forzar  true = ignora el candado del día y el silencio.
 * @return {Object} resumen de lo ocurrido, útil al ejecutarla a mano.
 */
function enviarResumenCumplesChat(forzar) {
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  var sello = Utilities.formatDate(hoy, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  if (!forzar && BOT_CHAT.UNA_VEZ_AL_DIA) {
    var previo = PropertiesService.getScriptProperties().getProperty(BOT_CHAT.PROP_ULTIMO_ENVIO);
    if (previo === sello) {
      Logger.log('El resumen de hoy (%s) ya se había publicado. Nada que hacer.', sello);
      return { ok: true, enviado: false, motivo: 'ya se publicó hoy' };
    }
  }

  var agenda = obtenerAgendaChat(BOT_CHAT.DIAS_PROXIMOS);
  if (!agenda.ok) throw new Error('No se pudo leer la agenda de cumpleaños: ' + agenda.error);

  if (!agenda.lista.length && BOT_CHAT.SILENCIO_SI_VACIO && !forzar) {
    Logger.log('Nadie cumple años en los próximos %s días. No se publica nada.', agenda.dias);
    return { ok: true, enviado: false, motivo: 'sin cumpleaños en la ventana' };
  }

  var respuesta = publicarEnChat(construirMensajeChat(agenda));

  PropertiesService.getScriptProperties().setProperty(BOT_CHAT.PROP_ULTIMO_ENVIO, sello);
  Logger.log('Resumen publicado en Chat: %s cumpleaños en %s días.', agenda.total, agenda.dias);

  return { ok: true, enviado: true, total: agenda.total, codigo: respuesta };
}

/** Publica ahora mismo, sin candado ni silencios. Ideal para probar. */
function probarBotChat() {
  return enviarResumenCumplesChat(true);
}


/* ==========================================================================
 *  2. DATOS · de dónde salen los cumpleaños
 * ========================================================================== */

/**
 * Devuelve la misma estructura que `proximosCumpleanos()` de la webapp.
 * Si esa función existe en el proyecto, la reutiliza (así el bot y la webapp
 * nunca se contradicen). Si no, lee la hoja de respuestas directamente.
 */
function obtenerAgendaChat(dias) {
  if (typeof proximosCumpleanos === 'function') {
    var r = proximosCumpleanos(dias);
    if (r && r.ok) return r;
    return { ok: false, error: (r && r.error) || 'respuesta vacía de proximosCumpleanos()' };
  }
  return leerAgendaDesdeHoja(dias);
}

/**
 * Lector de respaldo: usa las mismas columnas que `Automatizacion.gs`
 * (B nombre, D color, E prefiere, F sabor, H le gustaría, J detalles,
 *  K día, L mes) sobre la hoja "Respuestas de formulario 1".
 */
function leerAgendaDesdeHoja(dias) {
  try {
    var limite = parseInt(dias, 10) || BOT_CHAT.DIAS_PROXIMOS;
    var libro = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = libro.getSheetByName('Respuestas de formulario 1');
    if (!hoja) return { ok: false, error: 'no encontré la hoja "Respuestas de formulario 1"' };

    var ultima = hoja.getLastRow();
    if (ultima < 2) return { ok: true, dias: limite, total: 0, lista: [], hoy: '' };

    var filas = hoja.getRange(2, 2, ultima - 1, 12).getValues();
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    var lista = [];
    for (var i = 0; i < filas.length; i++) {
      var f = filas[i];
      var nombre = String(f[0] || '').trim();
      var dia = parseInt(f[9], 10);
      var mes = parseInt(f[10], 10);
      if (!nombre || !dia || !mes) continue;

      var faltan = diasHastaCumpleChat(dia, mes, hoy);
      if (faltan > limite) continue;

      lista.push({
        nombre:   nombre,
        dia:      dia,
        mes:      mes,
        fecha:    dia + ' de ' + (MESES_CHAT[mes - 1] || ''),
        faltan:   faltan,
        color:    String(f[2] || '').trim(),
        prefiere: String(f[3] || '').trim(),
        sabor:    String(f[4] || '').trim(),
        regalo:   String(f[6] || '').trim(),
        detalles: String(f[8] || '').trim()
      });
    }

    lista.sort(function (a, b) {
      return a.faltan - b.faltan || a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });

    return {
      ok: true,
      dias: limite,
      total: lista.length,
      hoy: Utilities.formatDate(hoy, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
      lista: lista
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/** Días que faltan para el próximo cumpleaños, ignorando el año de nacimiento. */
function diasHastaCumpleChat(dia, mes, hoy) {
  function construir(anio) {
    var d = new Date(anio, mes - 1, dia);
    // Si el día no existe en ese mes, JS desborda: lo devolvemos al último día.
    if (d.getMonth() !== mes - 1) d = new Date(anio, mes, 0);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  var fecha = construir(hoy.getFullYear());
  if (fecha.getTime() < hoy.getTime()) fecha = construir(hoy.getFullYear() + 1);
  return Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
}


/* ==========================================================================
 *  3. LA TARJETA · el tablero de la webapp, traducido a Google Chat
 * ========================================================================== */

/** Arma el cuerpo completo del mensaje (texto de respaldo + tarjeta). */
function construirMensajeChat(r) {
  return {
    text: resumenPlano(r),
    cardsV2: [{
      cardId: 'proximos-cumpleanos',
      card: {
        header: {
          title: '🎂 Próximos cumpleaños · ' + BOT_CHAT.ORGANIZACION,
          subtitle: subtituloTarjeta(r)
        },
        sections: construirSecciones(r)
      }
    }]
  };
}

function subtituloTarjeta(r) {
  if (!r.lista.length) return 'Ventana de ' + r.dias + ' días · sin festejos a la vista';
  var siguiente = r.lista[0].faltan === 0 ? 'hoy mismo' : etiquetaFalta(r.lista[0].faltan).toLowerCase();
  return r.total + (r.total === 1 ? ' cumpleaños' : ' cumpleaños') +
         ' en ' + r.dias + ' días · el próximo, ' + siguiente;
}

function construirSecciones(r) {
  var secciones = [];

  if (!r.lista.length) {
    secciones.push({
      widgets: [{
        textParagraph: {
          text: '<b>Ningún cumpleaños a la vista.</b><br>' +
                '<font color="' + BOT_CHAT.COLORES.tenue + '">Nadie cumple años en los ' +
                'próximos ' + r.dias + ' días.</font>'
        }
      }]
    });
    secciones.push(seccionBotones());
    return secciones;
  }

  // --- Marcador superior (total · próximo · esta semana) ---
  var estaSemana = r.lista.filter(function (p) { return p.faltan <= 7; }).length;
  var proximo = r.lista[0].faltan === 0 ? 'Hoy' : r.lista[0].faltan + ' d';

  secciones.push({
    widgets: [{
      decoratedText: {
        topLabel: 'Resumen',
        text: '<b>' + r.total + '</b> cumpleaños   ·   próximo en <b>' + proximo +
              '</b>   ·   <b>' + estaSemana + '</b> esta semana',
        bottomLabel: r.hoy ? 'Al ' + r.hoy : '',
        wrapText: true
      }
    }]
  });

  // --- Un bloque por tramo de cercanía, como en la webapp ---
  var mostrados = 0;
  for (var t = 0; t < TRAMOS_CHAT.length; t++) {
    var tramo = TRAMOS_CHAT[t];
    var previo = t === 0 ? -1 : TRAMOS_CHAT[t - 1].max;

    var grupo = r.lista.filter(function (p) {
      return p.faltan > previo && p.faltan <= tramo.max;
    });
    if (!grupo.length) continue;

    var cupo = Math.max(0, BOT_CHAT.MAX_PERSONAS - mostrados);
    var visibles = grupo.slice(0, cupo);
    mostrados += visibles.length;

    var widgets = visibles.map(function (p) { return widgetPersona(p, tramo); });
    if (grupo.length > visibles.length) {
      widgets.push({
        textParagraph: {
          text: '<font color="' + BOT_CHAT.COLORES.tenue + '">y ' +
                (grupo.length - visibles.length) + ' más…</font>'
        }
      });
    }

    var seccion = {
      header: tramo.titulo,
      widgets: widgets
    };

    // "Más adelante" llega plegado: lo urgente se ve sin desplazar la tarjeta.
    if (tramo.clave === 'mes' && visibles.length > 3) {
      seccion.collapsible = true;
      seccion.uncollapsibleWidgetsCount = 3;
    }

    secciones.push(seccion);
    if (mostrados >= BOT_CHAT.MAX_PERSONAS) break;
  }

  secciones.push(seccionBotones());
  return secciones;
}

/**
 * Una persona = un `decoratedText`: fecha arriba, nombre y cuánto falta en el
 * cuerpo, y los gustos abajo. A los cumpleaños cercanos se les despliega todo;
 * a los lejanos sólo lo esencial, igual que el acordeón de la webapp.
 */
function widgetPersona(p, tramo) {
  var color = BOT_CHAT.COLORES[tramo.clave] || BOT_CHAT.COLORES.mes;
  var falta = etiquetaFalta(p.faltan);
  var fecha = p.fecha || (p.dia + ' de ' + (MESES_CHAT[p.mes - 1] || ''));

  var linea = tramo.emoji + ' <b>' + limpiarChat(p.nombre) + '</b>   ' +
              '<font color="' + color + '"><b>' + falta + '</b></font>';

  var gustos = [];
  if (p.faltan <= BOT_CHAT.DIAS_DETALLE) {
    if (p.prefiere) gustos.push('Prefiere: ' + limpiarChat(p.prefiere));
    if (p.sabor)    gustos.push('Sabor: ' + limpiarChat(p.sabor));
    if (p.regalo)   gustos.push('Le gustaría: ' + limpiarChat(p.regalo));
    if (p.color)    gustos.push('Color: ' + limpiarChat(p.color));
    if (p.detalles) gustos.push('Detalles: ' + recortarChat(p.detalles, 140));
  } else {
    if (p.prefiere) gustos.push(limpiarChat(p.prefiere));
    if (p.sabor)    gustos.push(limpiarChat(p.sabor));
  }

  return {
    decoratedText: {
      topLabel: capitalizar(fecha),
      text: linea,
      bottomLabel: gustos.length ? gustos.join(' · ') : 'Sin preferencias registradas',
      wrapText: true
    }
  };
}

/** Botones al pie: el principal abre la webapp justo en "Próximos cumpleaños". */
function seccionBotones() {
  return {
    widgets: [{
      buttonList: {
        buttons: [
          {
            text: 'Ver próximos cumpleaños',
            onClick: { openLink: { url: urlProximosWebapp() } },
            color: { red: 0.882, green: 0.0, blue: 0.596, alpha: 1 }  // #E10098
          },
          {
            text: 'Actualizar mis datos',
            onClick: { openLink: { url: BOT_CHAT.URL_WEBAPP } }
          }
        ]
      }
    }]
  };
}

/** URL de la webapp con el parámetro que la abre en la vista de próximos. */
function urlProximosWebapp() {
  var base = BOT_CHAT.URL_WEBAPP;
  if (!base) return '';
  return base + (base.indexOf('?') === -1 ? '?' : '&') + BOT_CHAT.PARAM_VISTA;
}

/** Texto llano: es lo que se ve en la notificación del celular. */
function resumenPlano(r) {
  if (!r.lista.length) {
    return '🎂 Sin cumpleaños en los próximos ' + r.dias + ' días.';
  }
  var hoy = r.lista.filter(function (p) { return p.faltan === 0; });
  if (hoy.length) {
    return '🎉 Hoy cumple años ' +
      hoy.map(function (p) { return p.nombre; }).join(', ') +
      '. ' + r.total + ' cumpleaños en los próximos ' + r.dias + ' días.';
  }
  var s = r.lista[0];
  return '🎂 Próximo cumpleaños: ' + s.nombre + ' ' +
         etiquetaFalta(s.faltan).toLowerCase() + ' (' + s.fecha + '). ' +
         r.total + ' en los próximos ' + r.dias + ' días.';
}


/* ==========================================================================
 *  4. ENVÍO AL WEBHOOK
 * ========================================================================== */

/**
 * Publica el mensaje en el espacio de Chat.
 * Reintenta una vez ante fallos de red o respuestas 5xx del servicio.
 */
function publicarEnChat(payload) {
  var url = obtenerWebhookChat();
  if (!url) {
    throw new Error('Falta la URL del webhook. Ejecuta una vez: ' +
                    'configurarWebhookChat(\'https://chat.googleapis.com/v1/spaces/…\')');
  }

  var opciones = {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var ultimoError = '';
  for (var intento = 1; intento <= 2; intento++) {
    try {
      var res = UrlFetchApp.fetch(url, opciones);
      var codigo = res.getResponseCode();
      if (codigo >= 200 && codigo < 300) return codigo;

      ultimoError = 'HTTP ' + codigo + ' · ' + res.getContentText().slice(0, 300);
      // 4xx no se arregla reintentando (webhook mal escrito, revocado o payload inválido).
      if (codigo < 500) break;
    } catch (e) {
      ultimoError = e.message;
    }
    if (intento === 1) Utilities.sleep(2000);
  }

  throw new Error('Google Chat rechazó el mensaje: ' + ultimoError);
}

/** Guarda la URL del webhook fuera del código. Ejecútalo una sola vez. */
function configurarWebhookChat(url) {
  url = String(url || '').trim();
  if (url.indexOf('https://chat.googleapis.com/') !== 0) {
    throw new Error('Esa no parece una URL de webhook de Google Chat.');
  }
  PropertiesService.getScriptProperties().setProperty(BOT_CHAT.PROP_WEBHOOK, url);
  Logger.log('Webhook guardado. Ya puedes ejecutar instalarBotChat().');
  return true;
}

function obtenerWebhookChat() {
  return BOT_CHAT.WEBHOOK_URL ||
         PropertiesService.getScriptProperties().getProperty(BOT_CHAT.PROP_WEBHOOK) || '';
}

/** Borra el webhook guardado (por si hay que rotarlo). */
function olvidarWebhookChat() {
  PropertiesService.getScriptProperties().deleteProperty(BOT_CHAT.PROP_WEBHOOK);
  Logger.log('Webhook eliminado de las propiedades del script.');
}


/* ==========================================================================
 *  5. ACTIVADOR DIARIO
 * ========================================================================== */

/** Crea (o reemplaza) el activador que publica el resumen todos los días. */
function instalarBotChat() {
  quitarBotChat();

  ScriptApp.newTrigger('enviarResumenCumplesChat')
    .timeBased()
    .everyDays(1)
    .atHour(BOT_CHAT.HORA_ENVIO)
    .create();

  Logger.log('Activador diario creado: enviarResumenCumplesChat, alrededor de las %s h (%s).',
             BOT_CHAT.HORA_ENVIO, Session.getScriptTimeZone());
  return true;
}

/** Elimina el activador diario del bot. */
function quitarBotChat() {
  var borrados = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'enviarResumenCumplesChat') {
      ScriptApp.deleteTrigger(t);
      borrados++;
    }
  });
  if (borrados) Logger.log('Activadores eliminados: %s', borrados);
  return borrados;
}

/** Diagnóstico rápido: qué está configurado y qué se publicaría hoy. */
function estadoBotChat() {
  var props = PropertiesService.getScriptProperties();
  var agenda = obtenerAgendaChat(BOT_CHAT.DIAS_PROXIMOS);
  var activadores = ScriptApp.getProjectTriggers().filter(function (t) {
    return t.getHandlerFunction() === 'enviarResumenCumplesChat';
  }).length;

  var info = {
    webhookConfigurado: !!obtenerWebhookChat(),
    activadoresActivos: activadores,
    ultimoEnvio: props.getProperty(BOT_CHAT.PROP_ULTIMO_ENVIO) || '(nunca)',
    enlaceBoton: urlProximosWebapp(),
    cumpleanosEnVentana: agenda.ok ? agenda.total : 'error: ' + agenda.error
  };

  Logger.log(JSON.stringify(info, null, 2));
  return info;
}


/* ==========================================================================
 *  6. UTILIDADES
 * ========================================================================== */

/** El texto de las tarjetas admite HTML: neutralizamos lo que venga de la hoja. */
function limpiarChat(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .trim();
}

function recortarChat(s, max) {
  var t = limpiarChat(s);
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function etiquetaFalta(faltan) {
  if (faltan === 0) return 'Hoy';
  if (faltan === 1) return 'Mañana';
  return 'En ' + faltan + ' días';
}

function capitalizar(s) {
  s = String(s || '');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
