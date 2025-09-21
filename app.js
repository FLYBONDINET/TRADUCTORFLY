// PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  });
}

const $ = (sel) => document.querySelector(sel);
const flightNumber = $('#flightNumber');
const destinationSel = $('#destination');
const gateNumber = $('#gateNumber');
const gateNumber2 = $('#gateNumber2');
const langMode = $('#langMode');
const templateType = $('#templateType');
const customTextWrap = $('#customTextWrap');
const customText = $('#customText');
const greeting = $('#greeting');
const altDestWrap = $('#altDestWrap');
const altDestinationSel = $('#altDestination');

const voiceES = $('#voiceES');
const voiceEN = $('#voiceEN');
const voicePT = $('#voicePT');

const pitch = $('#pitch');
const rate = $('#rate');
const volume = $('#volume');

const malePref = $('#malePref');
const femalePref = $('#femalePref');
const queueMode = $('#queueMode');

const chimeSel = $('#chime');
const selectAllGroupsBtn = document.getElementById('selectAllGroups');
const clearGroupsBtn = document.getElementById('clearGroups');
const delayReasonWrap = document.getElementById('delayReasonWrap');
const delayReason = document.getElementById('delayReason');
const pauseMs = $('#pauseMs');

const outES = $('#outES');
const outEN = $('#outEN');
const outPT = $('#outPT');

const previewBtn = $('#previewBtn');
const stopBtn = $('#stopBtn');
const copyBtn = $('#copyBtn');
const voicesRefresh = $('#voicesRefresh');

// Load destinations (both selects)
fetch('data/destinations.json').then(r => r.json()).then(list => {
  const opts = list.map(d => `<option value="${d}">${d}</option>`).join('');
  destinationSel.innerHTML = opts;
  altDestinationSel.innerHTML = opts;
}).catch(err => {
  console.warn('No destinations loaded', err);
  destinationSel.innerHTML = '<option value="EZE - Buenos Aires Ezeiza">Buenos Aires Ezeiza</option>';
  altDestinationSel.innerHTML = destinationSel.innerHTML;
});

function numWord(lang, n) {
  const EN = ['', 'one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','twenty-one','twenty-two','twenty-three','twenty-four','twenty-five','twenty-six','twenty-seven','twenty-eight','twenty-nine','thirty','thirty-one','thirty-two'];
  const ES = ['', 'uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidós','veintitrés','veinticuatro','veinticinco','veintiséis','veintisiete','veintiocho','veintinueve','treinta','treinta y uno','treinta y dos'];
  const PT = ['', 'um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','catorze','quinze','dezesseis','dezessete','dezoito','dezenove','vinte','vinte e um','vinte e dois','vinte e três','vinte e quatro','vinte e cinco','vinte e seis','vinte e sete','vinte e oito','vinte e nove','trinta','trinta e um','trinta e dois'];
  if (lang === 'EN') return EN[n] || String(n);
  if (lang === 'PT') return PT[n] || String(n);
  return ES[n] || String(n);
}

const GROUP_ROWS = { '1':[1,8], '2':[9,16], '3':[17,24], '4':[25,32] };

function selectedGroups() {
  const all = Array.from(document.querySelectorAll('#boardingGroups input[type=checkbox]'));
  const values = all.filter(i => i.checked).map(i => i.value);
  if (values.includes('ALL')) return ['1','2','3','4'];
  return values.filter(v => ['1','2','3','4'].includes(v));
}

function groupsWithRows(lang, groups) {
  const joiner = lang === 'EN' ? ' and ' : (lang === 'PT' ? ' e ' : ' y ');
  const label = (g) => {
    const [a, b] = GROUP_ROWS[g];
    const gW = numWord(lang, parseInt(g, 10));
    const aW = numWord(lang, a);
    const bW = numWord(lang, b);
    if (lang === 'EN') return `Group ${gW} (rows ${aW} to ${bW})`;
    if (lang === 'PT') return `Grupo ${gW} (fileiras ${aW} a ${bW})`;
    return `Grupo ${gW} (filas ${aW} a ${bW})`;
  };
  return groups.map(label).join(joiner);
}

function groupPhrase(lang, groups) {
  if (!groups.length) {
    return lang==='EN' ? 'no groups' : (lang==='PT' ? 'nenhum grupo' : 'ningún grupo');
  }
  if (groups.length===4) {
    return lang==='EN' ? 'all groups' : (lang==='PT' ? 'todos os grupos' : 'todos los grupos');
  } 
  return groupsWithRows(lang, groups);
}

function greetingText(lang, g) {
  if (!g || g==='none') return '';
  if (lang==='EN') return g==='morning' ? 'Good morning. ' : (g==='afternoon' ? 'Good afternoon. ' : 'Good evening. ');
  if (lang==='PT') return g==='morning' ? 'Bom dia. ' : (g==='afternoon' ? 'Boa tarde. ' : 'Boa noite. ');
  return g==='morning' ? 'Buenos días. ' : (g==='afternoon' ? 'Buenas tardes. ' : 'Buenas noches. ');
}

function nowGateSuffix(lang, gate2) {
  if (!gate2) return '';
  if (lang==='EN') return ` Now boarding at gate ${gate2}.`;
  if (lang==='PT') return ` Agora embarque pelo portão ${gate2}.`;
  return ` Ahora por la puerta ${gate2}.`;
}

function gateSuffix(lang, gate) {
  // Standard gate mention

  if (!gate) return '';
  if (lang==='EN') return ` Boarding at gate ${gate}.`;
  if (lang==='PT') return ` Embarque pelo portão ${gate}.`;
  return ` Embarque por la puerta ${gate}.`;
}

function gateChangeSuffix(lang, oldGate, newGate) {
  if (!newGate || newGate === oldGate) return '';
  if (lang==='EN') return ` Attention: now boarding at gate ${newGate}.`;
  if (lang==='PT') return ` Atenção: agora no portão ${newGate}.`;
  return ` Atención: ahora por la puerta ${newGate}.`;
}

const TEMPLATES = {
  preboarding: {
    ES: ({flight, dest}) => `Atención pasajeros del vuelo ${flight} con destino a ${dest}. Realizaremos el pre-embarque en minutos. Por favor, preparen documentos y tarjetas de embarque.`,
    EN: ({flight, dest}) => `Attention passengers on flight ${flight} to ${dest}. Pre-boarding will begin shortly. Please have your documents and boarding passes ready.`,
    PT: ({flight, dest}) => `Atenção, passageiros do voo ${flight} com destino a ${dest}. O pré-embarque começará em instantes. Tenham seus documentos e cartões de embarque em mãos.`
  },
  start: {
    ES: ({flight, dest}) => `Informamos el inicio del embarque del vuelo ${flight} con destino a ${dest}. Embarque por la puerta indicada.`,
    EN: ({flight, dest}) => `Boarding has started for flight ${flight} to ${dest}. Please proceed to the assigned gate.`,
    PT: ({flight, dest}) => `Iniciamos o embarque do voo ${flight} com destino a ${dest}. Dirijam-se ao portão indicado.`
  },
  groups: {
    ES: ({flight, dest}) => `Invitamos a ${groupPhrase('ES', selectedGroups())} a embarcar para el vuelo ${flight} con destino a ${dest}.`,
    EN: ({flight, dest}) => `We now invite ${groupPhrase('EN', selectedGroups())} to board flight ${flight} to ${dest}.`,
    PT: ({flight, dest}) => `Convidamos ${groupPhrase('PT', selectedGroups())} a embarcar no voo ${flight} com destino a ${dest}.`
  },
  lastcall: {
    ES: ({flight, dest}) => `Último aviso de embarque para el vuelo ${flight} con destino a ${dest}. Pasajeros pendientes, por favor presentarse de inmediato.`,
    EN: ({flight, dest}) => `This is the final call for flight ${flight} to ${dest}. Remaining passengers, please board immediately.`,
    PT: ({flight, dest}) => `Última chamada para o voo ${flight} com destino a ${dest}. Passageiros pendentes, embarquem imediatamente.`
  },
  delay: {
    ES: ({flight, dest}) => {
      const reason = (delayReason && delayReason.value && delayReason.value.trim()) ? ` Motivo: ${delayReason.value.trim()}.` : '';
      return `Informamos una demora en el vuelo ${flight} con destino a ${dest}. Les pedimos disculpas y les solicitamos mantenerse atentos a los próximos anuncios.` + reason;
    },
    EN: ({flight, dest}) => {
      const reason = (delayReason && delayReason.value && delayReason.value.trim()) ? ` Reason: ${delayReason.value.trim()}.` : '';
      return `We inform a delay on flight ${flight} to ${dest}. We apologize and ask you to stay tuned for further announcements.` + reason;
    },
    PT: ({flight, dest}) => {
      const reason = (delayReason && delayReason.value && delayReason.value.trim()) ? ` Motivo: ${delayReason.value.trim()}.` : '';
      return `Informamos um atraso no voo ${flight} com destino a ${dest}. Pedimos desculpas e solicitamos que aguardem novos anúncios.` + reason;
    }
  },
  cancel: {
    ES: ({flight, dest}) => `Lamentamos informar la cancelación del vuelo ${flight} con destino a ${dest}. Diríjanse al mostrador para recibir asistencia.`,
    EN: ({flight, dest}) => `We regret to announce the cancellation of flight ${flight} to ${dest}. Please proceed to the counter for assistance.`,
    PT: ({flight, dest}) => `Lamentamos informar o cancelamento do voo ${flight} com destino a ${dest}. Dirijam-se ao balcão para assistência.`
  },
  conditional: {
    ES: ({flight, dest, alt}) => `El vuelo ${flight} con destino a ${dest} opera de manera condicional. En caso de no poder aterrizar en destino, alternará a ${alt}.`,
    EN: ({flight, dest, alt}) => `Flight ${flight} to ${dest} is operating under conditional status. If unable to land at destination, the alternate airport will be ${alt}.`,
    PT: ({flight, dest, alt}) => `O voo ${flight} com destino a ${dest} opera de forma condicional. Caso não seja possível pousar no destino, o aeroporto alternativo será ${alt}.`
  },
  custom: {
    ES: ({text}) => text || ''
  }
};

function generateTexts() {
  const flight = (flightNumber.value || '').trim().toUpperCase();
  const dest = (destinationSel.value || '').trim();
  const groups = selectedGroups();
  const t = templateType.value;
  const g = greeting.value;
  const alt = (altDestinationSel && altDestinationSel.value) ? altDestinationSel.value.trim() : '';

  let es='', en='', pt='';

  if (t === 'custom') {
    es = TEMPLATES.custom.ES({text: customText.value.trim()});
    en = ''; pt = '';
  } else {
    es = TEMPLATES[t].ES({flight, dest, groups, alt});
    en = TEMPLATES[t].EN({flight, dest, groups, alt});
    pt = TEMPLATES[t].PT({flight, dest, groups, alt});
  }

  const gate = (gateNumber && gateNumber.value) ? gateNumber.value.trim() : '';
const gate2 = (gateNumber2 && gateNumber2.value) ? gateNumber2.value.trim() : '';
const withGate = ['preboarding','start','groups','lastcall'];
if (gate && withGate.includes(t)) { es = es + gateSuffix('ES', gate); en = en + gateSuffix('EN', gate); pt = pt + gateSuffix('PT', gate); }
if (gate2 && withGate.includes(t)) { es = es + nowGateSuffix('ES', gate2); en = en + nowGateSuffix('EN', gate2); pt = pt + nowGateSuffix('PT', gate2); }

// Greeting prefix
  if (es) es = greetingText('ES', g) + es;
  if (en) en = greetingText('EN', g) + en;
  if (pt) pt = greetingText('PT', g) + pt;

  outES.textContent = es ? 'ES: ' + es : '';
  outEN.textContent = en ? 'EN: ' + en : '';
  outPT.textContent = pt ? 'PT: ' + pt : '';

  const mode = langMode.value;
  if (mode === 'ES') { outEN.textContent=''; outPT.textContent=''; }
  if (mode === 'ES_EN') { outPT.textContent=''; }
  if (mode === 'ES_PT') { outEN.textContent=''; }
}

templateType.addEventListener('change', () => {
  customTextWrap.style.display = templateType.value === 'custom' ? 'block' : 'none';
  altDestWrap.style.display = templateType.value === 'conditional' ? 'block' : 'none';
  delayReasonWrap.style.display = templateType.value === 'delay' ? 'block' : 'none';
  generateTexts();
});
['input','change'].forEach(ev => {
  [flightNumber, destinationSel, gateNumber, gateNumber2, langMode, customText, pitch, rate, volume, malePref, femalePref, chimeSel, pauseMs, greeting, altDestinationSel, delayReason]
  .forEach(el => el.addEventListener(ev, generateTexts));
});
generateTexts();

// Voices
let voices = [];
function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  function fillSelect(sel, langStarts) {
    const filtered = voices.filter(v => langStarts.some(ls => v.lang && v.lang.toLowerCase().startsWith(ls)));
    sel.innerHTML = filtered.map(v => `<option value="${v.name}">${v.name} — ${v.lang}</option>`).join('');
  }
  fillSelect(voiceES, ['es', 'es-']);
  fillSelect(voiceEN, ['en', 'en-']);
  fillSelect(voicePT, ['pt', 'pt-']);
}
loadVoices();
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = loadVoices;
}
voicesRefresh.addEventListener('click', loadVoices);

function preferVoice(sel) {
  const wantMale = malePref.checked && !femalePref.checked;
  const wantFemale = femalePref.checked && !malePref.checked;
  if (!wantMale && !wantFemale) return sel.value;
  const options = Array.from(sel.options).map(o => o.value.toLowerCase());
  const gendered = options.find(n => (wantMale ? /male|man|m1|m2/.test(n) : /female|woman|f1|f2/.test(n)));
  return gendered || sel.value;
}

// Audio
let speakingQueue = [];
function playChime(kind) {
  if (kind === 'none') return Promise.resolve();
  return new Promise(res => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    if (kind === 'ding') { o.frequency.setValueAtTime(880, ctx.currentTime); }
    if (kind === 'dingdong') { o.frequency.setValueAtTime(784, ctx.currentTime); }
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    o.start();
    setTimeout(() => { g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2); o.stop(ctx.currentTime + 0.22); setTimeout(res, 150); }, 220);
  });
}

function speak(text, voiceName) {
  return new Promise((resolve) => {
    if (!text) return resolve();
    const utter = new SpeechSynthesisUtterance(text);
    const v = voices.find(v => v.name === voiceName) || voices[0];
    utter.voice = v;
    utter.pitch = parseFloat(pitch.value);
    utter.rate = parseFloat(rate.value);
    utter.volume = parseFloat(volume.value);
    utter.onend = resolve;
    utter.onerror = (e) => { console.warn('TTS error', e); resolve(); };
    speechSynthesis.speak(utter);
  });
}

function stopAll() {
  speechSynthesis.cancel();
  speakingQueue = [];
}
stopBtn.addEventListener('click', stopAll);

previewBtn.addEventListener('click', async () => {
  generateTexts();
  stopAll();

  const texts = [];
  if (outES.textContent) texts.push({lang:'ES', text: outES.textContent.replace(/^ES:\s*/,'')});
  if (outEN.textContent) texts.push({lang:'EN', text: outEN.textContent.replace(/^EN:\s*/,'')});
  if (outPT.textContent) texts.push({lang:'PT', text: outPT.textContent.replace(/^PT:\s*/,'')});

  if (!texts.length) return;

  await playChime(chimeSel.value);

  const pause = Math.max(0, parseInt(pauseMs.value||'0',10));
  const vES = preferVoice(voiceES);
  const vEN = preferVoice(voiceEN);
  const vPT = preferVoice(voicePT);

  if (queueMode.checked) {
    for (const t of texts) {
      const v = t.lang==='ES' ? vES : t.lang==='EN' ? vEN : vPT;
      await speak(t.text, v);
      if (pause) await new Promise(r => setTimeout(r, pause));
    }
  } else {
    const t0 = texts[0];
    const v0 = t0.lang==='ES' ? vES : t0.lang==='EN' ? vEN : vPT;
    await speak(t0.text, v0);
  }
});

copyBtn.addEventListener('click', async () => {
  const parts = [outES.textContent, outEN.textContent, outPT.textContent].filter(Boolean);
  const txt = parts.join('\n');
  try { await navigator.clipboard.writeText(txt); copyBtn.textContent = '✅ Copiado'; }
  catch(e) { copyBtn.textContent = '❌ Error'; }
  setTimeout(() => copyBtn.textContent = '📋 Copiar texto', 1200);
});

// Init
altDestWrap.style.display = templateType.value === 'conditional' ? 'block' : 'none';

// Init delay reason visibility
if (delayReasonWrap) { delayReasonWrap.style.display = templateType.value === 'delay' ? 'block' : 'none'; }


function setAllGroups(checked) {
  const boxes = Array.from(document.querySelectorAll('#boardingGroups input[type=checkbox]'));
  for (const b of boxes) {
    if (b.value !== 'ALL') b.checked = checked;
  }
  // sync "Todos"
  const allBox = boxes.find(b => b.value === 'ALL');
  if (allBox) allBox.checked = checked;
  generateTexts();
}

if (selectAllGroupsBtn) selectAllGroupsBtn.addEventListener('click', (e) => { e.preventDefault(); setAllGroups(true); });
if (clearGroupsBtn) clearGroupsBtn.addEventListener('click', (e) => { e.preventDefault(); setAllGroups(false); });

// Keep "Todos" in sync when user toggles it directly
document.addEventListener('change', (e) => {
  if (e.target && e.target.closest('#boardingGroups')) {
    const t = e.target;
    if (t.value === 'ALL') {
      setAllGroups(t.checked);
    }
  }
});
