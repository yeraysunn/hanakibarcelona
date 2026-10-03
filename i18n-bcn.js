(function () {
  if (window.HanakiI18n) return;
  const IX = { ca: 0, en: 1, fr: 2 };
  const D = {
    'Cómo va': ['Com va', 'How it works'],
    'Carta': ['Carta', 'Menu'],
    'Precios': ['Preus', 'Prices'],
    'Galería': ['Galeria', 'Gallery'],
    'Para llevar': ['Per emportar', 'Takeaway'],
    'A domicilio': ['A domicili', 'Delivery'],
    'Dónde': ['On som', 'Find us'],
    'Reservar': ['Reservar', 'Book'],
    'Reservar mesa': ['Reservar taula', 'Book a table'],
    'Reservar mesa →': ['Reservar taula →', 'Book a table →'],
    'Reservar mesa ✿': ['Reservar taula ✿', 'Book a table ✿'],
    'Ver carta': ['Veure la carta', 'See the menu'],
    '✿ Buffet libre japonés': ['✿ Bufet lliure japonès', '✿ Japanese all-you-can-eat'],
    'Sushi, nigiris y plancha hechos al momento. Tú pides, nosotros seguimos sacando. Así hasta que digas basta.': ['Sushi, nigiris i planxa fets al moment. Tu demanes, nosaltres anem traient. Així fins que diguis prou.', 'Sushi, nigiri and grill, made to order. You order, we keep it coming. Until you say stop.'],
    '2.342 reseñas en Google': ['2.342 ressenyes a Google', '2,342 Google reviews'],
    'Desde las 12:00': ['Des de les 12:00', 'From 12:00'],
    'sushi sin fin~': ['sushi sense fi~', 'endless sushi~'],
    'hecho al momento': ['fet al moment', 'made to order'],
    'Hecho al momento': ['Fet al moment', 'Made to order'],
    'LIBRE': ['LLIURE', 'BUFFET'], 'BUFFET': ['BUFET', 'FREE'],
    'Buffet libre': ['Bufet lliure', 'All-you-can-eat'],
    'Sushi sin fin': ['Sushi sense fi', 'Endless sushi'],
    '✿ Cómo va esto': ['✿ Com funciona', '✿ How it works'],
    'Fácil.': ['Fàcil.', 'Easy.'], 'Muy fácil.': ['Molt fàcil.', 'Really easy.'],
    'Siéntate': ['Seu', 'Sit down'], 'Pide': ['Demana', 'Order'], 'Repite ✿': ['Repeteix ✿', 'Repeat ✿'],
    'Te buscamos sitio. Tú solo trae hambre (y amigos, si quieres).': ['Et busquem lloc. Tu només porta gana (i amics, si vols).', 'We find you a seat. Just bring your appetite (and friends, if you like).'],
    'Sushi, nigiris, uramakis, plancha, fritos. Lo que te pida el cuerpo.': ['Sushi, nigiris, uramakis, planxa, fregits. El que et demani el cos.', 'Sushi, nigiri, uramaki, grill, fried bites. Whatever you’re craving.'],
    '¿Otra ronda? Claro. Aquí la cinta no se para.': ['Una altra ronda? És clar. Aquí la cinta no para.', 'Another round? Sure. The belt never stops here.'],
    '✿ La carta': ['✿ La carta', '✿ The menu'],
    'La carta': ['La carta', 'The menu'], 'da vueltas': ['fa voltes', 'goes round'],
    'Pasa el ratón y la cinta se para. En el móvil, deslízala con el dedo.': ['Passa el ratolí i la cinta s’atura. Al mòbil, llisca-la amb el dit.', 'Hover and the belt stops. On your phone, swipe it.'],
    'Todo': ['Tot', 'All'], 'Entrantes': ['Entrants', 'Starters'], 'Plancha': ['Planxa', 'Grill'], 'Fritos': ['Fregits', 'Fried'], 'Postres': ['Postres', 'Desserts'], 'Bebidas': ['Begudes', 'Drinks'],
    'Filtra:': ['Filtra:', 'Filter:'], 'Veggie': ['Veggie', 'Veggie'], 'Picante': ['Picant', 'Spicy'], 'Sin gluten': ['Sense gluten', 'Gluten-free'],
    '✿ veggie': ['✿ veggie', '✿ veggie'], 'picante': ['picant', 'spicy'], 'sin gluten': ['sense gluten', 'gluten-free'],
    'Nada con esos filtros. Prueba a quitar alguno ✿': ['Res amb aquests filtres. Prova de treure’n algun ✿', 'Nothing with those filters. Try removing one ✿'],
    'Alérgenos: pregunta a nuestro equipo antes de pedir.': ['Al·lèrgens: pregunta al nostre equip abans de demanar.', 'Allergens: ask our team before ordering.'],
    '✿ Precios del buffet': ['✿ Preus del bufet', '✿ Buffet prices'],
    'Pagas una vez.': ['Pagues un cop.', 'Pay once.'], 'Comes mil.': ['Menges mil.', 'Eat loads.'],
    'Mediodía': ['Migdia', 'Lunch'], 'Noche': ['Nit', 'Dinner'],
    'Lunes a viernes': ['Dilluns a divendres', 'Monday to Friday'],
    'Fines de semana y festivos': ['Caps de setmana i festius', 'Weekends & holidays'],
    'Adulto': ['Adult', 'Adult'], 'Infantil': ['Infantil', 'Kids'],
    'Nº 001 · LABORABLE': ['Nº 001 · FEINER', 'Nº 001 · WEEKDAY'], 'Nº 002 · LABORABLE': ['Nº 002 · FEINER', 'Nº 002 · WEEKDAY'],
    'Nº 003 · FINDE': ['Nº 003 · CAP DE SETMANA', 'Nº 003 · WEEKEND'], 'Nº 004 · FINDE': ['Nº 004 · CAP DE SETMANA', 'Nº 004 · WEEKEND'],
    'Horario: [MARCADOR]': ['Horari: [MARCADOR]', 'Hours: [MARCADOR]'],
    '✿ Galería': ['✿ Galeria', '✿ Gallery'], 'Se come': ['Es menja', 'You eat'], 'con los ojos': ['amb els ulls', 'with your eyes'],
    'mood: segunda ronda ✿': ['mood: segona ronda ✿', 'mood: round two ✿'], 'recién hecho': ['acabat de fer', 'fresh out'], 'uno más y paro': ['un més i prou', 'one more, then I stop'],
    'Síguenos en Instagram →': ['Segueix-nos a Instagram →', 'Follow us on Instagram →'],
    '✿ Para llevar y a domicilio': ['✿ Per emportar i a domicili', '✿ Takeaway & delivery'],
    '¿Sofá?': ['Sofà?', 'Couch?'], 'Te lo llevamos.': ['Te’l portem.', 'We’ll bring it.'],
    'Llama, encarga y pasa a recogerlo por Joan Güell.': ['Truca, encarrega i passa a recollir-ho per Joan Güell.', 'Call, order and pick it up on Joan Güell.'],
    'Lo pides, llega a casa. Tú decides si en el sofá o en la mesa.': ['Ho demanes i arriba a casa. Tu decideixes: sofà o taula.', 'Order it, it lands at home. Couch or table, your call.'],
    'PARA': ['PER', 'TAKE'], 'LLEVAR': ['EMPORTAR', 'AWAY'], 'takoyaki o nada': ['takoyaki o res', 'takoyaki or nothing'],
    '✿ Reseñas': ['✿ Ressenyes', '✿ Reviews'], 'Lo dice': ['Ho diu', 'Says'], 'Leerlas en Google →': ['Llegir-les a Google →', 'Read them on Google →'],
    '✿ Reservas': ['✿ Reserves', '✿ Bookings'], 'Pilla': ['Agafa', 'Grab a'], 'mesa': ['taula', 'table'],
    'Rellena esto en un minuto. ¿Grupo grande o prisa? Mejor llámanos.': ['Omple això en un minut. Grup gran o pressa? Millor truca’ns.', 'Fill this in a minute. Big group or in a rush? Just call us.'],
    'TE': ['T’', 'SEE'], 'ESPERAMOS': ['ESPEREM', 'YOU SOON'],
    'Fecha': ['Data', 'Date'], 'Hora': ['Hora', 'Time'], 'Adultos': ['Adults', 'Adults'], 'Niños': ['Nens', 'Kids'], 'Bebés': ['Nadons', 'Babies'],
    'Nombre': ['Nom', 'Name'], 'Teléfono': ['Telèfon', 'Phone'], 'Comentarios': ['Comentaris', 'Notes'],
    'Cómo te llamas': ['Com et dius', 'Your name'], 'Alergias, trona, cumpleaños…': ['Al·lèrgies, trona, aniversari…', 'Allergies, high chair, birthday…'],
    'Elige un día': ['Tria un dia', 'Pick a day'], 'Elige una hora': ['Tria una hora', 'Pick a time'], 'Falta tu nombre': ['Falta el teu nom', 'Your name is missing'], 'Falta tu teléfono': ['Falta el teu telèfon', 'Your phone is missing'], 'Todo listo ✿': ['Tot a punt ✿', 'All set ✿'],
    'Al reservar aceptas la política de privacidad.': ['En reservar acceptes la política de privacitat.', 'By booking you accept the privacy policy.'],
    '¡Apuntado!': ['Apuntat!', 'Got it!'], '☎ Llamar': ['☎ Trucar', '☎ Call'], 'Cambiar datos': ['Canviar dades', 'Edit details'],
    '✿ Dónde estamos': ['✿ On som', '✿ Find us'], 'Estamos en': ['Som a', 'We’re in'],
    'Dirección': ['Adreça', 'Address'], 'Horario': ['Horari', 'Hours'], 'Cómo llegar': ['Com arribar', 'Getting here'], 'Extras': ['Extres', 'Extras'],
    'Cómo llegar →': ['Com arribar →', 'Directions →'],
    'Desde las 12:00 · [HORARIO]': ['Des de les 12:00 · [HORARIO]', 'From 12:00 · [HORARIO]'],
    'Horario: [HORARIO]': ['Horari: [HORARIO]', 'Hours: [HORARIO]'],
    'Restaurante Sushi Hanaki · Sushi sin fin en Les Corts.': ['Restaurant Sushi Hanaki · Sushi sense fi a Les Corts.', 'Restaurante Sushi Hanaki · Endless sushi in Les Corts.'],
    'Visítanos': ['Visita’ns', 'Visit us'], 'Llámanos': ['Truca’ns', 'Call us'], 'Redes': ['Xarxes', 'Social'], 'Idioma': ['Idioma', 'Language'],
    'Aviso legal · Privacidad · Cookies': ['Avís legal · Privacitat · Galetes', 'Legal notice · Privacy · Cookies']
  };
  Object.assign(D, {"Importante:":["Important:","Important:","Important :"],"tu reserva solo nos llega si envías el mensaje en WhatsApp. Si no se envía, no podemos verla. Después espera nuestra confirmación.":["la teva reserva només ens arriba si envies el missatge per WhatsApp. Si no s’envia, no la podem veure. Després espera la nostra confirmació.","your booking only reaches us if you send the message on WhatsApp. If it isn’t sent, we can’t see it. Then wait for our confirmation.","votre réservation ne nous parvient que si vous envoyez le message sur WhatsApp. S’il n’est pas envoyé, nous ne pouvons pas la voir. Attendez ensuite notre confirmation."],"¿No se abre WhatsApp? Escríbenos directamente al WhatsApp":["No s’obre WhatsApp? Escriu-nos directament al WhatsApp","WhatsApp won’t open? Message us directly on WhatsApp","WhatsApp ne s’ouvre pas ? Écrivez-nous directement sur WhatsApp"],"¿Se te complica? Llámanos y te hacemos la reserva por teléfono.":["Se’t complica? Truca’ns i et fem la reserva per telèfon.","Having trouble? Call us and we’ll book it for you by phone.","Un souci ? Appelez-nous et nous faisons la réservation par téléphone."],"LLAMAR · 931 94 22 61":["TRUCAR · 931 94 22 61","CALL · 931 94 22 61","APPELER · 931 94 22 61"],"Comprueba si se ha enviado en WhatsApp":["Comprova si s’ha enviat per WhatsApp","Check that it was sent on WhatsApp","Vérifiez que le message a bien été envoyé sur WhatsApp"],"Y una vez hecho, ¡gracias por su reserva!":["I un cop fet, gràcies per la vostra reserva!","And once that’s done, thank you for your booking!","Et une fois fait, merci pour votre réservation !"],"Si el mensaje no se envía, no podemos ver la reserva. Espere nuestra confirmación.":["Si el missatge no s’envia, no podem veure la reserva. Espereu la nostra confirmació.","If the message isn’t sent, we can’t see the booking. Please wait for our confirmation.","Si le message n’est pas envoyé, nous ne pouvons pas voir la réservation. Attendez notre confirmation."],"ENVIAR MI RESERVA POR WHATSAPP":["ENVIAR LA MEVA RESERVA PER WHATSAPP","SEND MY BOOKING ON WHATSAPP","ENVOYER MA RÉSERVATION PAR WHATSAPP"],"Si no, copia y pega este mensaje a 931 94 22 61 en WhatsApp:":["Si no, copia i enganxa aquest missatge al 931 94 22 61 a WhatsApp:","Otherwise, copy and paste this message to 931 94 22 61 on WhatsApp:","Sinon, copiez-collez ce message au 931 94 22 61 sur WhatsApp :"],"COPIAR MENSAJE":["COPIAR MISSATGE","COPY MESSAGE","COPIER LE MESSAGE"],"✓ MENSAJE COPIADO":["✓ MISSATGE COPIAT","✓ MESSAGE COPIED","✓ MESSAGE COPIÉ"],"TU RESERVA":["LA TEVA RESERVA","YOUR BOOKING","VOTRE RÉSERVATION"],"Reservas":["Reserves","Bookings","Réservations"],"Reserva tu mesa":["Reserva la teva taula","Book your table","Réservez votre table"],"Elige cuántos sois, el día y la hora. Al confirmar se abrirá WhatsApp con tu reserva ya escrita.":["Tria quants sou, el dia i l’hora. En confirmar s’obrirà WhatsApp amb la reserva ja escrita.","Choose how many of you, the day and the time. When you confirm, WhatsApp opens with your booking already written.","Choisissez le nombre de personnes, le jour et l’heure. En confirmant, WhatsApp s’ouvrira avec votre réservation déjà rédigée."],"¿Cuántos sois?":["Quants sou?","How many?","Combien êtes-vous ?"],"¿Qué día?":["Quin dia?","Which day?","Quel jour ?"],"¿A qué hora?":["A quina hora?","What time?","À quelle heure ?"],"Tus datos":["Les teves dades","Your details","Vos coordonnées"],"Normal":["Normal","Adult","Adulte"],"Desde 9 años":["Des de 9 anys","9 and over","Dès 9 ans"],"Infantil":["Infantil","Child","Enfant"],"De 3 a 8 años":["De 3 a 8 anys","Ages 3 to 8","De 3 à 8 ans"],"Bebés":["Nadons","Babies","Bébés"],"Menores de 3 · gratis":["Menors de 3 · gratis","Under 3 · free","Moins de 3 ans · gratuit"],"¿Más de 12 personas?":["Més de 12 persones?","More than 12 people?","Plus de 12 personnes ?"],"Llámanos":["Truca’ns","Call us","Appelez-nous"],"y lo organizamos.":["i ho organitzem.","and we’ll arrange it.","et nous nous en occupons."],"Abierto todos los días.":["Obert cada dia.","Open every day.","Ouvert tous les jours."],"MEDIODÍA":["MIGDIA","LUNCH","MIDI"],"NOCHE":["NIT","DINNER","SOIR"],"NOMBRE *":["NOM *","NAME *","NOM *"],"TELÉFONO *":["TELÈFON *","PHONE *","TÉLÉPHONE *"],"(OPCIONAL)":["(OPCIONAL)","(OPTIONAL)","(FACULTATIF)"],"COMENTARIOS":["COMENTARIS","COMMENTS","COMMENTAIRES"],"Tu nombre":["El teu nom","Your name","Votre nom"],"Alergias, preferencias de mesa…":["Al·lèrgies, preferències de taula…","Allergies, table preferences…","Allergies, préférences de table…"],"Personas":["Persones","Guests","Personnes"],"Día":["Dia","Day","Jour"],"Hora":["Hora","Time","Heure"],"Sin elegir":["Sense triar","Not chosen","Non choisi"],"CONFIRMAR LA RESERVA":["CONFIRMAR LA RESERVA","CONFIRM BOOKING","CONFIRMER LA RÉSERVATION"],"Elige un día":["Tria un dia","Choose a day","Choisissez un jour"],"Elige una hora":["Tria una hora","Choose a time","Choisissez une heure"],"Falta tu nombre":["Falta el teu nom","Name missing","Nom manquant"],"Falta tu teléfono":["Falta el teu telèfon","Phone missing","Téléphone manquant"],"Todo listo":["Tot a punt","All set","Tout est prêt"],"VOLVER AL INICIO":["TORNAR A L’INICI","BACK TO HOME","RETOUR À L’ACCUEIL"],"NUEVA RESERVA":["NOVA RESERVA","NEW BOOKING","NOUVELLE RÉSERVATION"],"CARTA":["CARTA","MENU","CARTE"],"UBICACIÓN":["UBICACIÓ","LOCATION","ACCÈS"]});
  const W = { adulto: ['adult', 'adult'], adultos: ['adults', 'adults'], 'niño': ['nen', 'kid'], 'niños': ['nens', 'kids'], 'bebé': ['nadó', 'baby'], 'bebés': ['nadons', 'babies'] };
  const P = [[/^\d+ (adultos?|niños?|bebés?)( · \d+ (adultos?|niños?|bebés?))*$/, (m, i) => m[0].replace(/(\d+) (\S+)/g, (x, n, w) => n + ' ' + (W[w] ? W[w][i] : w))]];
  let lang = 'es';
  try { lang = localStorage.getItem('hanaki-bcn-lang') || 'es'; } catch (e) {}
  const tr = s => {
    if (lang === 'es' || !s) return s;
    const k = s.trim(); if (!k) return s;
    const i = IX[lang]; if (i === undefined) return s;
    const r = D[k]; if (r && r[i] != null) return s.replace(k, r[i]);
    for (const [re, f] of P) { const m = k.match(re); if (m) return s.replace(k, f(m, i)); }
    return s;
  };
  const doText = n => {
    const p = n.parentNode; if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') return;
    if (n.__t === undefined || n.nodeValue !== n.__t) n.__o = n.nodeValue;
    const t = tr(n.__o); n.__t = t; if (n.nodeValue !== t) n.nodeValue = t;
  };
  const doAttr = el => {
    const v = el.getAttribute('placeholder'); if (v == null) return;
    if (el.__pt === undefined || v !== el.__pt) el.__po = v;
    const t = tr(el.__po); el.__pt = t; if (v !== t) el.setAttribute('placeholder', t);
  };
  const walk = root => {
    if (!root) return;
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) doText(n);
    if (root.hasAttribute && root.hasAttribute('placeholder')) doAttr(root);
    root.querySelectorAll && root.querySelectorAll('[placeholder]').forEach(doAttr);
  };
  const mo = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttr(m.target);
      else m.addedNodes.forEach(walk);
    }
  });
  const start = () => {
    mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder'] });
    document.documentElement.lang = lang; walk(document.body);
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.HanakiI18n = {
    get: () => lang,
    set: l => {
      lang = (l || 'es').toLowerCase();
      try { localStorage.setItem('hanaki-bcn-lang', lang); } catch (e) {}
      document.documentElement.lang = lang; walk(document.body);
      window.dispatchEvent(new CustomEvent('hanaki-lang', { detail: lang }));
    }
  };
})();
