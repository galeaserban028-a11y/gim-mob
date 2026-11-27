/* ================== 6. PROIECT GENERAT DIN DESCRIERE (Atelia) ==================
   1) Dacă config.js are aiUrl → textul merge la serverul nostru (Cloudflare Workers AI, plan gratuit).
   2) Altfel sau dacă AI-ul nu răspunde → interpretor local (fără internet, fără cost).
   Rezultatul e un „spec” validat, din care construim proiectul cu corpurile din catalog. */
const AI_URL = ((window.ATELIA_CONFIG || {}).aiUrl || '').trim();
const eggBy = (re, fb) => { const e = EGGER.find(x => re.test(x[1])); return e ? e[0] : fb; };
const COLOR_WORDS = [
 [/\b(alb\w*|white)\b/i, () => 'W1000'], [/\b(negr\w*|neagr\w*|black)\b/i, () => eggBy(/^Black$/, 'U999')],
 [/\b(antracit\w*|grafit\w*|graphite|anthracite)\b/i, () => eggBy(/Graphite/, 'U961')], [/\b(gri|grey|gray)\b/i, () => eggBy(/^Light Grey$/, 'U708')],
 [/\b(nuc|walnut)\b/i, () => eggBy(/Walnut/, 'H1714')], [/\b(stejar\w*|oak|lemn\w*)\b/i, () => 'H1145'],
 [/\b(beton\w*|concrete)\b/i, () => 'F186'], [/\b(marmur\w*|marble)\b/i, () => eggBy(/Marble/, 'F812')],
 [/\b(bej|beige|crem)\b/i, () => eggBy(/Beige/, 'U156')]];
/* culorile găsite în text, în ordinea în care apar */
const colorsIn = s => COLOR_WORDS.map(([re, f]) => { const m = String(s).match(re); return m ? [m.index, f()] : null; }).filter(Boolean).sort((a, b) => a[0] - b[0]).map(x => x[1]);
function colorFrom(txt) {
 if (!txt) return null; const s = String(txt);
 const code = s.toUpperCase().match(/\b[WUHF]\d{3,4}\b/); if (code && EGGER.some(e => e[0] === code[0])) return code[0];
 return colorsIn(s)[0] || null;
}
const toMM = (n, u) => { n = parseFloat(String(n).replace(',', '.')); if (!isFinite(n)) return null;
 if (u === 'mm') return n; if (u === 'cm') return n * 10; if (u === 'm') return n * 1000; return n < 20 ? n * 1000 : (n < 1000 ? n * 10 : n); };
const clampN = (v, a, b, d) => { v = Math.round(+v); return isFinite(v) && v > 0 ? Math.min(b, Math.max(a, v)) : d; };

function parseBrief(txt) {
 const t = ' ' + String(txt || '').toLowerCase() + ' ', notes = [];
 const kind = /dulap|dressing|șifonier|sifonier|garderob/.test(t) ? 'dulap' : 'bucatarie';
 const hm = t.match(/(?:înălțime|inaltime|tavan)\D{0,12}(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/);
 const height = hm ? toMM(hm[1], hm[2]) : null;
 const nums = [...t.replace(hm ? hm[0] : '§', ' ').matchAll(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?(?![\wăâîșț])/g)].map(m => toMM(m[1], m[2])).filter(v => v && v >= 300 && v <= 9000);
 let layout = 'I'; const W = '[a-zăâîșț0-9]';
 const letter = c => new RegExp(`(?<!${W})${c}(?!${W})`);
 if (kind === 'bucatarie') { if (letter('u').test(t)) layout = 'U'; else if (letter('l').test(t) || /colț|colt/.test(t)) layout = 'L'; }
 if (/paralel|două rânduri|doua randuri/.test(t)) notes.push('Bucătăria pe două rânduri paralele nu e încă suportată — am făcut un singur rând.');
 if (/insul/.test(t)) notes.push('Insula nu e încă suportată — o poți adăuga manual cu unealta Spațiu.');
 const tall = [];
 if (/frigider|combin/.test(t) && !/fără frigider|fara frigider/.test(t)) tall.push('fridge');
 const ovenTall = /cuptor\D{0,25}(coloan|sus|înalt|inalt)|coloan\D{0,15}cuptor/.test(t);
 if (ovenTall) tall.push('oven');
 if (/cămar|camar/.test(t)) tall.push('pantry');
 const colors = {}; const fm = t.match(/front\w*\s+([a-zăâîșț ]{2,25})/); const bm = t.match(/blat\w*\s+(?:din\s+)?([a-zăâîșț0-9 ]{2,25})/); const cm = t.match(/corp\w*\s+([a-zăâîșț ]{2,20})/);
 if (fm) colors.front = colorFrom(fm[1]); if (bm) colors.counter = colorFrom(bm[1]); if (cm) colors.body = colorFrom(cm[1]);
 const loose = colorsIn(t).filter(c => c !== colors.front && c !== colors.counter);
 if (!colors.front && loose[0]) colors.front = loose[0];
 if (!colors.counter && loose[1]) colors.counter = loose[1];
 return {
  kind, name: '', layout,
  runs: {back: nums[0] || (kind === 'dulap' ? 2000 : 3000), left: layout !== 'I' ? (nums[1] || 2000) : 0, right: layout === 'U' ? (nums[2] || nums[1] || 2000) : 0},
  height: height || null, tall, ovenUnder: /cuptor/.test(t) && !ovenTall,
  sink: !/fără chiuvet|fara chiuvet/.test(t), hob: !/fără plit|fara plit/.test(t),
  dishwasher: /(mașin|masin)[a-zăâîșț]*\s+de\s+(spălat\s+|spalat\s+)?vase|dishwasher/.test(t),
  upper: !/fără corpuri sus|fara corpuri sus|fără sus|fara sus|fără suspendate|fara suspendate/.test(t),
  colors, notes
 };
}
function normSpec(sp, src) {
 const s = Object.assign({}, sp || {}); s.kind = s.kind === 'dulap' ? 'dulap' : 'bucatarie';
 s.layout = ['I', 'L', 'U'].includes(String(s.layout).toUpperCase()) ? String(s.layout).toUpperCase() : 'I';
 const r = s.runs || {};
 s.runs = {back: clampN(r.back, 1200, 8000, 3000), left: s.layout !== 'I' ? clampN(r.left, 1200, 6000, 2000) : 0, right: s.layout === 'U' ? clampN(r.right, 1200, 6000, 2000) : 0};
 s.height = clampN(s.height, 2200, 3600, 2600);
 s.tall = (Array.isArray(s.tall) ? s.tall : []).filter(x => ['fridge', 'oven', 'pantry'].includes(x)).slice(0, 3);
 for (const k of ['sink', 'hob', 'upper']) s[k] = s[k] !== false; s.dishwasher = !!s.dishwasher; s.ovenUnder = !!s.ovenUnder;
 const c = s.colors || {}; s.colors = {body: colorFrom(c.body) || 'W1000', front: colorFrom(c.front) || 'H1145', counter: colorFrom(c.counter) || 'F186'};
 s.notes = Array.isArray(s.notes) ? s.notes.slice(0, 5).map(String) : [];
 s.name = String(s.name || '').slice(0, 60) || (s.kind === 'dulap' ? 'Dulap generat' : `Bucătărie ${s.layout === 'I' ? 'liniară' : 'în ' + s.layout}`);
 s.src = src; return s;
}
/* împarte o lungime în module de ~600 mm */
function modules(len, target = 600) { let n = Math.max(1, Math.round(len / target)); let w = Math.floor(len / n); while (n > 1 && w < 300) { n--; w = Math.floor(len / n); } const a = Array(n).fill(w); a[n - 1] = len - w * (n - 1); return a; }
function kitchenRun(items, wall, start, len, sp, opts) {
 if (len < 300) return;
 const ws = modules(len), n = ws.length, types = Array(n).fill(null);
 if (opts.sink && n >= 2) types[Math.min(1, n - 1)] = 'base_sink';
 if (opts.sink && opts.dishwasher && n >= 3) types[2] = 'base_dish';
 if (opts.hob && n >= 3) { let h = n >= 5 ? n - 2 : n - 1; if (types[h]) h = types.findIndex((x, i) => !x && i > 0);
  if (h === n - 1 && opts.tallAfter) { if (opts.canDefer) h = -1; /* nu lipi plita de coloană — o mutăm pe latură */
   else { const alt = types.findIndex((x, i) => !x && i > 0 && i < n - 1); if (alt >= 0) h = alt; } }
  if (h >= 0) types[h] = sp.ovenUnder ? 'base_oven' : 'base_hob'; }
 let x = start;
 ws.forEach((w, i) => { const tp = types[i] || (i === 0 ? 'base_drawer3' : (w > 600 ? (i % 2 ? 'base_drawer2' : 'base_door2') : (i % 2 ? 'base_drawer2' : 'base_door1')));
  items.push(makeCab(tp, {wall, w, s: x + w / 2})); x += w; });
 items.push(makeCab('counter', {wall, w: len, s: start + len / 2, h: 38, d: 600, e: 820}));
 if (sp.upper) { let xu = start; ws.forEach((w, i) => { const tp = types[i] === 'base_hob' || types[i] === 'base_oven' ? 'wall_hood' : (w > 600 ? 'wall_door2' : 'wall_door1');
  items.push(makeCab(tp, {wall, w, s: xu + w / 2})); xu += w; }); }
 return types;
}
function buildFromSpec(sp) {
 const items = [], R = sp.runs;
 const room = {w: Math.max(R.back, 1500), d: Math.max(R.left, R.right, 2500), h: sp.height, left: sp.layout !== 'I', right: sp.layout === 'U'};
 if (sp.kind === 'dulap') {
  const h = Math.min(2400, room.h - 80);
  const space = makeSpace({wall: 'back', s: R.back / 2, w: R.back, h, d: 600, e: 0});
  items.push(...fillPlan(space));
 } else {
  const tallMap = {fridge: 'tall_fridge', oven: 'tall_oven', pantry: 'tall_pantry'};
  let tallN = sp.tall.length; while (tallN && R.back - tallN * 600 < 1200) tallN--;
  const baseLen = R.back - tallN * 600;
  const opts = {sink: sp.sink, hob: sp.hob, dishwasher: sp.dishwasher, tallAfter: tallN > 0, canDefer: sp.layout !== 'I'};
  const tb = kitchenRun(items, 'back', 0, baseLen, sp, opts);
  sp.tall.slice(0, tallN).forEach((k, i) => items.push(makeCab(tallMap[k], {wall: 'back', s: baseLen + 600 * i + 300})));
  if (tallN < sp.tall.length) sp.notes.push('Peretele e prea scurt pentru toate coloanele — am pus doar ' + tallN + '.');
  const hasHob = tb && tb.some(x => x === 'base_hob' || x === 'base_oven');
  const side = {sink: false, hob: sp.hob && !hasHob, dishwasher: false};
  if (sp.layout !== 'I') kitchenRun(items, 'left', 600, R.left - 600, sp, side);
  if (sp.layout === 'U') kitchenRun(items, 'right', 600, R.right - 600, sp, {sink: false, hob: false, dishwasher: false});
 }
 return {v: 3, pid: nid(), name: sp.name, room, mat: {...sp.colors}, custom: {}, rates: {...DEFAULT_RATES}, std: {...STD_DEF}, items};
}
async function aiSpec(text) {
 const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 20000);
 try {
  const r = await fetch(AI_URL, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text}), signal: ctl.signal});
  const j = await r.json(); if (!r.ok || !j.spec) throw new Error(j.error || 'AI indisponibil'); return j.spec;
 } finally { clearTimeout(tm); }
}
const AI_EX = ['Bucătărie în L, 3,2 m pe 2,4 m, cu frigider în coloană, mașină de vase, fronturi albe și blat stejar',
 'Bucătărie liniară 2800 mm, fără corpuri sus, fronturi gri, blat beton', 'Bucătărie în U 3 m x 2,5 m x 2,5 m, cuptor în coloană și cămară, fronturi nuc',
 'Dulap dormitor 2400 mm lățime, înălțime tavan 2,6 m'];
function openAI() {
 modalState = {ai: 1};
 openModal(`${mhead('Proiect din descriere', AI_URL ? 'AI + reguli de proiectare' : 'Interpretor local — funcționează fără internet')}
 <textarea class="inp" id="aiTxt" rows="4" maxlength="600" style="width:100%;resize:vertical;font:15px/1.45 Inter,Arial" placeholder="Descrie ce vrei, cu dimensiuni. Ex: bucătărie în L, 3,2 m pe 2,4 m, frigider în coloană, fronturi albe, blat stejar"></textarea>
 <div class="aiex">${AI_EX.map((e, i) => `<button class="ckb" data-ex="${i}">${esc(e)}</button>`).join('')}</div>
 <div id="aiOut"></div>
 <button class="btn gold wide" id="aiGo" style="margin-top:10px;padding:13px">Interpretează</button>
 <div class="legal-links">Nu scrie date personale în descriere. Rezultatul e un punct de plecare — verifică-l înainte de ofertă sau producție.</div>`, true);
 $$('[data-ex]').forEach(b => b.onclick = () => { $('#aiTxt').value = AI_EX[+b.dataset.ex]; });
 $('#aiGo').onclick = async () => {
  const text = $('#aiTxt').value.trim(); if (text.length < 8) { toast('Scrie o descriere mai detaliată'); return; }
  const go = $('#aiGo'); go.disabled = true; go.textContent = 'Mă gândesc…';
  let spec, src = 'local', warn = '';
  if (AI_URL) { try { spec = await aiSpec(text); src = 'ai'; } catch (e) { warn = 'AI-ul nu a răspuns, am folosit interpretorul local.'; } }
  if (!spec) spec = parseBrief(text);
  spec = normSpec(spec, src);
  const proj = buildFromSpec(spec);
  const L = {I: 'liniară', L: 'în L', U: 'în U'}, T = {fridge: 'frigider', oven: 'cuptor', pantry: 'cămară'};
  const nCab = proj.items.filter(i => i.kind === 'cab' && i.type !== 'counter').length;
  $('#aiOut').innerHTML = `<div class="legalbox" style="margin-top:10px"><b>Am înțeles:</b><ul style="margin:6px 0 0;padding-left:18px;line-height:1.6">
   <li>${spec.kind === 'dulap' ? 'Dulap' : 'Bucătărie ' + L[spec.layout]} · perete principal ${spec.runs.back} mm${spec.runs.left ? ` · stânga ${spec.runs.left} mm` : ''}${spec.runs.right ? ` · dreapta ${spec.runs.right} mm` : ''} · tavan ${spec.height} mm</li>
   ${spec.kind === 'dulap' ? '' : `<li>Coloane: ${spec.tall.map(x => T[x]).join(', ') || 'niciuna'} · ${spec.dishwasher ? 'cu' : 'fără'} mașină de vase · ${spec.upper ? 'cu' : 'fără'} corpuri sus${spec.ovenUnder ? ' · cuptor sub plită' : ''}</li>`}
   <li>Fronturi ${esc(DEC[spec.colors.front].n)} · corp ${esc(DEC[spec.colors.body].n)} · blat ${esc(DEC[spec.colors.counter].n)}</li>
   <li>${nCab} corpuri generate</li></ul>
   ${[warn, ...spec.notes].filter(Boolean).map(n => `<div style="color:#f59e0b;margin-top:6px">⚠ ${esc(n)}</div>`).join('')}
   <div style="color:var(--mut);font-size:12px;margin-top:6px">Sursă: ${src === 'ai' ? 'AI (Cloudflare Workers AI)' : 'interpretor local'}</div></div>`;
  go.disabled = false; go.textContent = 'Creează proiectul';
  go.onclick = () => { undoS.push(ser()); load(JSON.stringify(proj)); setCam('3d'); closeModal(true);
   const res = runChecks(); const ne = res.filter(r => r.lvl === 'err').length, nw = res.filter(r => r.lvl === 'warn').length;
   toast(`Proiect creat · ${ne} erori · ${nw} atenționări — apasă Verifică`); };
 };
 setTimeout(() => $('#aiTxt') && $('#aiTxt').focus(), 50);
}
(() => {
 const nav = $('#tools'), ref = $('#tRoom'); if (!nav) return;
 const b = document.createElement('button'); b.id = 'tAI';
 b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg><span>Generează</span>';
 b.onclick = openAI; nav.insertBefore(b, nav.firstChild ? nav.children[2] || null : null);
 const st = document.createElement('style'); st.textContent = `.aiex{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.aiex .ckb{flex:1 1 220px;text-align:left;font-weight:500;font-size:12px;line-height:1.35}`; document.head.appendChild(st);
})();
