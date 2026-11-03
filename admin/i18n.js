// Idioma del panel de admin (español / chino). Solo se usa en /admin/, /reservas/admin.html y /fidelidad/admin.html.
(function(){
  var CLAVE = 'hk_admin_lang';
  var lang = 'es';
  try { lang = localStorage.getItem(CLAVE) === 'zh' ? 'zh' : 'es'; } catch(e){}
  window.HK_LANG = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'es';

  var ZH = {
    // bienvenida
    'Admin · Hanaki': '管理 · Hanaki',
    'Panel Hanaki': 'Hanaki 管理面板',
    'Bienvenido': '欢迎',
    'admin': '管理员',
    'Comprobando…': '正在检查…',
    'Pon la contraseña para entrar a reservas y fidelización.': '请输入密码，进入预订和会员管理。',
    'CONTRASEÑA': '密码',
    'ENTRAR': '进入',
    'Este dispositivo se queda conectado 30 días.': '此设备将保持登录 30 天。',
    'No se pudo entrar.': '无法登录。',
    'Contraseña incorrecta.': '密码错误。',
    'Sesión caducada. Vuelve a entrar.': '登录已过期，请重新登录。',
    'Sesión caducada': '登录已过期',
    'Error': '出错了',
    // comunes
    'SALIR': '退出',
    'RESERVAS': '预订',
    'FIDELIZACIÓN': '会员卡',
    // fidelización
    'Panel de sellos · Hanaki': '会员印章 · Hanaki',
    'SOCIOS': '会员',
    'SELLOS HOY': '今日印章',
    'PREMIOS LISTOS': '可兑换奖励',
    'por canjear': '待兑换',
    'CANJEADOS': '已兑换',
    'ESCANEAR TARJETA': '扫描会员卡',
    'Buscar por nombre, teléfono o código': '按姓名、电话或代码搜索',
    'Descargar CSV': '下载 CSV',
    'Apunta al QR de la tarjeta del cliente': '请对准顾客会员卡上的二维码',
    'CERRAR': '关闭',
    '+{n} esta semana': '本周 +{n}',
    '{n} en total': '共 {n} 个',
    '{n} hoy': '今日 {n} 次',
    'Nadie coincide con «{q}».': '没有找到与「{q}」匹配的会员。',
    'Todavía no hay socios. Comparte el enlace <b>hanakisushi.com/fidelidad</b>.': '还没有会员。分享链接 <b>hanakisushi.com/fidelidad</b>。',
    'PREMIO LISTO': '奖励已满',
    'último sello:': '最近盖章：',
    'nunca': '从未',
    '{n} premio': '{n} 次奖励',
    '{n} premios': '{n} 次奖励',
    'CANJEAR PREMIO': '兑换奖励',
    '+1 SELLO': '+1 印章',
    'ENLACE': '链接',
    '¿Quitar un sello a {n}?': '要给 {n} 减去一个印章吗？',
    '¿Canjear el buffet gratis de {n}? La tarjeta vuelve a 0.': '要为 {n} 兑换免费自助餐吗？会员卡将归零。',
    '✓ Sello para {n} · {s}/{o}': '✓ 已为 {n} 盖章 · {s}/{o}',
    ' — ¡PREMIO CONSEGUIDO!': ' — 已获得奖励！',
    '✓ Premio canjeado. {n} empieza de nuevo.': '✓ 奖励已兑换。{n} 重新开始集章。',
    'Sello quitado. {n} · {s}/{o}': '已减去印章。{n} · {s}/{o}',
    'Enlace copiado. Envíaselo por WhatsApp.': '链接已复制，请通过 WhatsApp 发给顾客。',
    'Enlace de la tarjeta:': '会员卡链接：',
    'No se pudo abrir la cámara. Busca al cliente por nombre, teléfono o código.': '无法打开相机。请按姓名、电话或代码搜索顾客。',
    'Ese QR no es una tarjeta Hanaki.': '这个二维码不是 Hanaki 会员卡。',
    '{n} tiene el BUFFET GRATIS listo. ¿Canjearlo ahora?': '{n} 已集满，可兑换免费自助餐。现在兑换吗？',
    '¿Poner un sello a {n}? ({s}/{o})': '要给 {n} 盖一个章吗？（{s}/{o}）',
    'FICHA': '详情',
    'Ficha del cliente': '顾客详情',
    'Cerrar': '关闭',
    'TELÉFONO': '电话',
    'EMAIL': '邮箱',
    'ALTA': '注册日期',
    'CÓDIGO': '代码',
    'SELLOS': '印章',
    'PREMIOS': '奖励',
    'PROMOS': '接收优惠',
    'Sí': '是',
    'No': '否',
    'Historial de sellos': '印章记录',
    '+1 sello': '+1 印章',
    '−1 sello': '−1 印章',
    'Premio canjeado': '已兑换奖励',
    'Todavía no tiene sellos.': '还没有印章。',
    // tres tipos de sello
    'Buffet mediodía': '午市自助',
    'Buffet noche': '晚市自助',
    'Menú': '套餐',
    'MENÚ': '套餐',
    'CANJEAR': '兑换',
    'Sellar tarjeta': '盖章',
    'Elige qué ha tomado el cliente': '请选择顾客吃的类型',
    'Corregir sellos': '修改印章',
    '✓ Sello de {t} para {n} · {s}/{o}': '✓ 已为 {n} 盖「{t}」章 · {s}/{o}',
    'Sello de {t} quitado. {n} · {s}/{o}': '已减去「{t}」印章。{n} · {s}/{o}',
    '¿Quitar un sello de {t} a {n}?': '要给 {n} 减去一个「{t}」印章吗？',
    '¿Canjear {t} de {n}? Ese contador vuelve a 0.': '要为 {n} 兑换「{t}」奖励吗？该项印章将归零。',
    'BORRAR CLIENTE': '删除顾客',
    '¿Borrar a {n} y todo su historial? No se puede deshacer.': '要删除 {n} 及其全部记录吗？此操作无法撤销。',
    '{n} borrado.': '已删除 {n}。',
    // reservas
    'Reservas · Panel Hanaki': '预订 · Hanaki 管理面板',
    'Día anterior': '前一天',
    'Día siguiente': '后一天',
    'Día': '日期',
    'HOY': '今天',
    'Hoy · ': '今天 · ',
    'Mañana · ': '明天 · ',
    '{n} reserva · {p} personas': '{n} 个预订 · {p} 人',
    '{n} reservas · {p} personas': '{n} 个预订 · {p} 人',
    'Pendientes de confirmar en otros días: ': '其他日期待确认：',
    'MEDIODÍA': '午餐',
    'NOCHE': '晚餐',
    '{p} personas': '{p} 人',
    'No hay reservas este día.': '这一天没有预订。',
    'PENDIENTE': '待确认',
    'CONFIRMADA': '已确认',
    'CANCELADA': '已取消',
    'HA LLEGADO': '已到店',
    'NO VINO': '未到店',
    'CONFIRMAR': '确认',
    'CANCELAR': '取消',
    'DESHACER': '撤销',
    '{n} adulto': '{n} 位成人',
    '{n} adultos': '{n} 位成人',
    '{n} niño': '{n} 位儿童',
    '{n} niños': '{n} 位儿童',
    '{n} bebé': '{n} 位婴儿',
    '{n} bebés': '{n} 位婴儿',
    'pers.': '人',
    'CUMPLEAÑOS': '生日',
    'TRONA': '儿童椅',
    'CARRITO': '婴儿车',
    '¿Cancelar la reserva de {n}?': '要取消 {n} 的预订吗？',
    ' Se le enviará un email.': '系统会给顾客发送邮件。',
    ' · email enviado': ' · 邮件已发送',
    ' · no se pudo enviar el email': ' · 邮件发送失败',
    'Nueva reserva ({n})': '新预订（{n}）'
  };

  // Traduce un texto en español (con {variables}) al idioma actual
  window.T = function(es, vars){
    var s = (lang === 'zh' && ZH[es] != null) ? ZH[es] : es;
    if (vars) s = s.replace(/\{(\w+)\}/g, function(m, k){ return vars[k] != null ? vars[k] : m; });
    return s;
  };

  window.HK_FECHA = function(fe){ // 'AAAA-MM-DD' → texto largo del día
    var p = fe.split('-').map(Number), d = new Date(p[0], p[1]-1, p[2]);
    if (lang === 'zh') return p[1] + '月' + p[2] + '日 ' + ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getDay()];
    var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'], MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return DIAS[d.getDay()] + ' ' + p[2] + ' de ' + MESES[p[1]-1];
  };
  window.HK_LOCALE = lang === 'zh' ? 'zh-CN' : 'es-ES';

  // Texto fijo de la página: se traduce al cargar
  function traducirPagina(){
    if (lang !== 'zh') return;
    document.title = T(document.title);
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, lista = [];
    while ((n = w.nextNode())) lista.push(n);
    lista.forEach(function(t){
      var v = t.nodeValue, k = v.trim();
      if (k && ZH[k] != null) t.nodeValue = v.replace(k, ZH[k]);
    });
    document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(function(el){
      ['placeholder', 'title', 'aria-label'].forEach(function(a){ var v = el.getAttribute(a); if (v && ZH[v] != null) el.setAttribute(a, ZH[v]); });
    });
  }

  // Botón para cambiar de idioma (va dentro de #idioma)
  function boton(){
    var b = document.getElementById('idioma'); if (!b) return;
    var globo = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>';
    b.innerHTML = globo + '<span>' + (lang === 'zh' ? 'ES' : '中文') + '</span>';
    b.title = lang === 'zh' ? 'Cambiar a español' : '切换到中文';
    b.setAttribute('aria-label', lang === 'zh' ? 'Español' : '中文');
    b.onclick = function(){ try { localStorage.setItem(CLAVE, lang === 'zh' ? 'es' : 'zh'); } catch(e){} location.reload(); };
  }

  document.addEventListener('DOMContentLoaded', function(){ traducirPagina(); boton(); });
})();
