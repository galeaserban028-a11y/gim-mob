/* ================== DOMENIUL 2: FERESTRE & UȘI (PVC / aluminiu) ==================
   Configurator de poziții → desen cu simboluri de deschidere, verificări, preț,
   ofertă PDF, debitare profile (bare de 6,5 m), listă geamuri și feronerie.
   Deducțiile de sistem sunt generice și se ajustează în „Sistem” după profilul folosit. */
const WL = (ro, en) => LANG === 'en' ? en : ro;
const WIN_DEF_RATES = {pvc: 650, al: 1350, osc: 260, bat: 190, door: 900, slide: 1400, g3: 140, color: 18, sill: 70, net: 160, roller: 380, mount: 220};
const WIN_DEF_SYS = {F: 70, M: 84, S: 78, ov: 8, gl: 5, bar: 6500, kerf: 4, miter: 10, Ug2: 1.1, Ug3: 0.6, UfP: 1.3, UfA: 1.8, psi: 0.04, Up: 1.2};
const WIN_KINDS = {
 win1: {n: WL('Fereastră 1 canat', 'Window, 1 sash'), w: 900, h: 1200, sash: ['osc-r']},
 win2: {n: WL('Fereastră 2 canate', 'Window, 2 sashes'), w: 1400, h: 1400, sash: ['bat-l', 'osc-r']},
 win3: {n: WL('Fereastră 3 canate', 'Window, 3 sashes'), w: 2100, h: 1400, sash: ['osc-l', 'fix', 'osc-r']},
 fix: {n: WL('Fereastră fixă', 'Fixed window'), w: 1000, h: 1000, sash: ['fix']},
 balc: {n: WL('Ușă balcon', 'Balcony door'), w: 800, h: 2150, sash: ['osc-r']},
 door: {n: WL('Ușă intrare', 'Entrance door'), w: 1000, h: 2150, sash: ['door-r']},
 slide: {n: WL('Glisantă (HS/PSK)', 'Sliding door (HS/PSK)'), w: 2400, h: 2200, sash: ['sl', 'fix']}};
const OPS = {fix: WL('Fix', 'Fixed'), 'bat-l': WL('Batant ⟵ balamale stânga', 'Side-hung, hinges left'), 'bat-r': WL('Batant ⟶ balamale dreapta', 'Side-hung, hinges right'),
 'osc-l': WL('Oscilobatant, balamale stânga', 'Tilt & turn, hinges left'), 'osc-r': WL('Oscilobatant, balamale dreapta', 'Tilt & turn, hinges right'),
 'door-l': WL('Ușă, balamale stânga', 'Door, hinges left'), 'door-r': WL('Ușă, balamale dreapta', 'Door, hinges right'), sl: WL('Glisant', 'Sliding')};
const COLORS = {alb: [WL('Alb', 'White'), '#f4f4f2'], antracit: [WL('Antracit RAL 7016', 'Anthracite RAL 7016'), '#383e42'], stejar: [WL('Stejar auriu (folie)', 'Golden oak (foil)'), '#a8743f'], negru: [WL('Negru', 'Black'), '#1d1d1d']};
const GLASS = {2: WL('Dublu 4-16-4 Low-E, argon', 'Double 4-16-4 Low-E, argon'), 3: WL('Triplu 4-12-4-12-4 Low-E, argon', 'Triple 4-12-4-12-4 Low-E, argon')};
let WS = null;
function winLoad() { try { WS = JSON.parse(LS.get('atelia.win') || 'null'); } catch (e) { WS = null; }
 if (!WS) WS = {name: WL('Ferestre — proiect nou', 'Windows — new project'), items: [], sel: null};
 WS.rates = Object.assign({}, WIN_DEF_RATES, WS.rates || {}); WS.sys = Object.assign({}, WIN_DEF_SYS, WS.sys || {}); }
function winSave() { LS.set('atelia.win', JSON.stringify(WS)); }
function winNew(kind) { const k = WIN_KINDS[kind]; const n = WS.items.length + 1;
 return {id: nid(), name: 'P' + n, kind, w: k.w, h: k.h, qty: 1, mat: kind === 'slide' ? 'al' : 'pvc', glass: 2, color: 'alb', sash: k.sash.slice(), transom: 0, sill: kind !== 'door' && kind !== 'balc' && kind !== 'slide', net: 0, roller: false}; }
/* ---- geometrie (mm) ---- */
function winGeom(it) {
 const s = WS.sys, n = it.sash.length, F = s.F, M = s.M, T = it.transom > 0 ? it.transom : 0;
 const innerW = it.w - 2 * F, innerH = it.h - 2 * F - (T ? T + M - F : 0);
 const ow = (innerW - (n - 1) * M) / n;
 const cells = it.sash.map((op, i) => ({op, x: F + i * (ow + M), y: F + (T ? T + M - F : 0), w: ow, h: innerH}));
 return {F, M, T, cells, top: T ? {x: F, y: F, w: innerW, h: T - F} : null};
}
/* ---- desen (canvas) cu simbolurile standard de deschidere ---- */
function drawWin(x, it, X, Y, k, opt = {}) {
 const g = winGeom(it), col = COLORS[it.color] ? COLORS[it.color][1] : '#eee', dark = it.color === 'antracit' || it.color === 'negru';
 const R = (a, b, c, d, f, st) => { x.fillStyle = f; x.fillRect(X + a * k, Y + b * k, c * k, d * k); if (st) { x.strokeStyle = st; x.lineWidth = 1; x.strokeRect(X + a * k, Y + b * k, c * k, d * k); } };
 const line = '#333';
 R(0, 0, it.w, it.h, col, line);
 const pane = (c, sashed) => { const inset = sashed ? WS.sys.S - WS.sys.ov : 0; if (sashed) R(c.x - WS.sys.ov, c.y - WS.sys.ov, c.w + 2 * WS.sys.ov, c.h + 2 * WS.sys.ov, col, line);
  const gx = c.x + inset, gy = c.y + inset, gw = c.w - 2 * inset, gh = c.h - 2 * inset; R(gx, gy, gw, gh, (c.op || '').startsWith('door') ? (dark ? '#4b5055' : '#d9d2c4') : '#cfe4f2', line);
  return {gx, gy, gw, gh}; };
 const sym = (r, op) => { const ink = op.startsWith('door') && dark ? '#e9e9e9' : '#4a5560'; x.strokeStyle = ink; x.lineWidth = Math.max(1, k * 6); x.setLineDash([]); x.beginPath();
  const L = X + r.gx * k, T = Y + r.gy * k, W = r.gw * k, H = r.gh * k;
  const side = op.endsWith('-l') ? 'l' : 'r';
  if (op.startsWith('bat') || op.startsWith('osc') || op.startsWith('door')) { if (side === 'l') { x.moveTo(L + W, T); x.lineTo(L, T + H / 2); x.lineTo(L + W, T + H); } else { x.moveTo(L, T); x.lineTo(L + W, T + H / 2); x.lineTo(L, T + H); } }
  if (op.startsWith('osc')) { x.moveTo(L, T); x.lineTo(L + W / 2, T + H); x.lineTo(L + W, T); }
  x.stroke();
  if (op === 'sl') { x.beginPath(); x.moveTo(L + W * .2, T + H / 2); x.lineTo(L + W * .8, T + H / 2); x.moveTo(L + W * .65, T + H / 2 - H * .05); x.lineTo(L + W * .8, T + H / 2); x.lineTo(L + W * .65, T + H / 2 + H * .05); x.stroke(); }
  if (op === 'fix') { x.fillStyle = ink; x.font = `600 ${Math.max(10, k * 90)}px Inter,Arial`; x.textAlign = 'center'; x.fillText('F', L + W / 2, T + H / 2 + k * 30); x.textAlign = 'left'; }
  if (op.startsWith('door') || op.startsWith('bat') || op.startsWith('osc') || op === 'sl') { const hx = side === 'l' ? L + W - k * 40 : L + k * 25; x.fillStyle = '#888'; x.fillRect(hx, T + H / 2 - k * 60, k * 15, k * 120); } };
 if (g.top) { const r = pane(g.top, false); sym(r, 'fix'); }
 g.cells.forEach(c => { const r = pane(c, c.op !== 'fix'); sym(r, c.op); });
 if (opt.dims) { x.fillStyle = '#ddd'; x.strokeStyle = '#888'; x.lineWidth = 1; x.font = `500 ${opt.fs || 12}px Inter,Arial`; x.textAlign = 'center';
  const yy = Y + it.h * k + 16; x.beginPath(); x.moveTo(X, yy); x.lineTo(X + it.w * k, yy); x.stroke(); x.fillStyle = opt.dimCol || '#ccc'; x.fillText(`${it.w}`, X + it.w * k / 2, yy + 14);
  x.save(); x.translate(X - 16, Y + it.h * k / 2); x.rotate(-Math.PI / 2); x.fillText(`${it.h}`, 0, -4); x.restore(); x.textAlign = 'left'; }
}
/* ---- verificări ---- */
function winChecks(it) {
 const out = [], g = winGeom(it), isAl = it.mat === 'al';
 if (it.w < 400 || it.h < 400) out.push(['err', WL('Dimensiuni prea mici pentru un toc (min. 400 mm)', 'Too small for a frame (min. 400 mm)')]);
 if (it.w > 6000 || it.h > 3000) out.push(['err', WL('Element prea mare — împarte-l în mai multe poziții', 'Element too large — split it into several positions')]);
 g.cells.forEach((c, i) => { const sw = c.w + 2 * WS.sys.ov, sh = c.h + 2 * WS.sys.ov, area = sw * sh / 1e6, nm = WL('Canat ', 'Sash ') + (i + 1);
  if (c.w < 250) out.push(['err', `${nm}: ${WL('prea îngust', 'too narrow')} (${Math.round(c.w)} mm)`]);
  if (c.op.startsWith('osc') && (sw > (isAl ? 1600 : 1300) || sh > (isAl ? 2600 : 2400) || area > (isAl ? 3 : 2.5))) out.push(['warn', `${nm}: ${WL('oscilobatant mare', 'large tilt & turn')} ${Math.round(sw)}×${Math.round(sh)} mm — ${WL('verifică limitele feroneriei și ale profilului', 'check hardware and profile limits')}`]);
  if (c.op.startsWith('bat') && sw / sh > 1.6) out.push(['warn', `${nm}: ${WL('canat batant mai lat decât înalt — se poate lăsa', 'side-hung sash wider than tall — may sag')}`]);
  if (c.op.startsWith('door') && sw > 1100) out.push(['warn', `${nm}: ${WL('ușă peste 1100 mm lățime — folosește balamale pentru uși grele', 'door over 1100 mm wide — use heavy-duty hinges')}`]);
  if (c.op === 'fix' && c.w * c.h / 1e6 > 4.5) out.push(['warn', `${nm}: ${WL('geam fix peste 4,5 m² — verifică grosimea sticlei și transportul', 'fixed glass over 4.5 m² — check glass thickness and handling')}`]); });
 if ((it.kind === 'balc' || it.kind === 'door' || it.kind === 'slide') && it.h < 1950) out.push(['warn', WL('Ușă sub 1950 mm înălțime — verifică golul de trecere', 'Door under 1950 mm high — check the clear opening')]);
 if (it.kind === 'door' || it.kind === 'balc' || it.kind === 'slide') out.push(['info', WL('Geam de siguranță (securizat/laminat) recomandat la uși și zonele joase', 'Safety glass (toughened/laminated) recommended for doors and low zones')]);
 if (it.h > 1800 && it.kind.startsWith('win')) out.push(['info', WL('Verifică înălțimea parapetului și siguranța la cădere conform normelor locale', 'Check sill height and fall protection against local regulations')]);
 return out;
}
/* ---- Uw: transfer termic al ferestrei, metoda simplificată EN ISO 10077-1 ----
   Uw = (Ag·Ug + Af·Uf + Ap·Up + lg·Ψg) / (Ag + Af + Ap); valori Ug/Uf/Ψ editabile în „Sistem”. */
function winUw(it) {
 const s = WS.sys, g = winGeom(it), A = it.w * it.h / 1e6, Ug = it.glass == 3 ? s.Ug3 : s.Ug2, Uf = it.mat === 'al' ? s.UfA : s.UfP;
 let Ag = 0, Ap = 0, lg = 0;
 const cells = (g.top ? [Object.assign({op: 'fix'}, g.top)] : []).concat(g.cells);
 cells.forEach(c => { const inset = c.op === 'fix' ? 0 : s.S - s.ov, w = Math.max(0, c.w - 2 * inset) / 1000, h = Math.max(0, c.h - 2 * inset) / 1000;
  if (c.op.startsWith('door')) Ap += w * h; else { Ag += w * h; lg += 2 * (w + h); } });
 const Af = Math.max(0, A - Ag - Ap);
 return {Uw: (Ag * Ug + Af * Uf + Ap * s.Up + lg * s.psi) / A, Ug, Uf, Ag, Af, glassShare: Ag / A};
}
/* ---- preț ---- */
function winPrice(it) {
 const r = WS.rates, a = it.w * it.h / 1e6, base = (it.mat === 'al' ? r.al : r.pvc) * a;
 let open = 0; it.sash.forEach(o => { if (o.startsWith('osc')) open += r.osc; else if (o.startsWith('bat')) open += r.bat; else if (o.startsWith('door')) open += r.door; else if (o === 'sl') open += r.slide; });
 const glass = it.glass == 3 ? r.g3 * a : 0, color = it.color !== 'alb' ? (base + open) * r.color / 100 : 0;
 const acc = (it.sill ? r.sill * it.w / 1000 : 0) + (it.net || 0) * r.net + (it.roller ? r.roller * a : 0) + r.mount;
 const one = base + open + glass + color + acc;
 return {one, total: one * (it.qty || 1), area: a};
}
/* ---- debitare profile + geamuri ---- */
function winCuts() {
 const s = WS.sys, bars = {}, glass = [], hw = {osc: 0, bat: 0, door: 0, sl: 0, handle: 0};
 const add = (type, len, n, note) => { (bars[type] = bars[type] || []); for (let i = 0; i < n; i++) bars[type].push({len: Math.round(len), note}); };
 for (const it of WS.items) for (let q = 0; q < (it.qty || 1); q++) {
  const g = winGeom(it), tag = `${it.name}`;
  add(WL('Toc', 'Frame'), it.w + s.miter, 2, tag); add(WL('Toc', 'Frame'), it.h + s.miter, 2, tag);
  if (it.sash.length > 1) add(WL('Montant', 'Mullion'), g.cells[0].h, it.sash.length - 1, tag);
  if (g.top) { add(WL('Traversă', 'Transom'), it.w - 2 * s.F, 1, tag); glass.push({pos: tag, w: Math.round(g.top.w - 2 * s.gl), h: Math.round(g.top.h - 2 * s.gl), type: it.glass}); }
  g.cells.forEach(c => {
   if (c.op === 'fix') { glass.push({pos: tag, w: Math.round(c.w - 2 * s.gl), h: Math.round(c.h - 2 * s.gl), type: it.glass}); return; }
   const sw = c.w + 2 * s.ov, sh = c.h + 2 * s.ov, prof = c.op.startsWith('door') ? WL('Cercevea ușă', 'Door sash') : WL('Cercevea', 'Sash');
   add(prof, sw + s.miter, 2, tag); add(prof, sh + s.miter, 2, tag);
   glass.push({pos: tag, w: Math.round(sw - 2 * (s.S - s.ov) - 2 * s.gl), h: Math.round(sh - 2 * (s.S - s.ov) - 2 * s.gl), type: it.glass});
   if (c.op.startsWith('osc')) hw.osc++; else if (c.op.startsWith('bat')) hw.bat++; else if (c.op.startsWith('door')) hw.door++; else hw.sl++; hw.handle++;
  });
 }
 /* optimizare 1D: first-fit decreasing pe bare */
 const plan = {};
 for (const [type, list] of Object.entries(bars)) {
  const L = s.bar, used = [];
  list.slice().sort((a, b) => b.len - a.len).forEach(p => { if (p.len > L) { used.push({left: 0, parts: [p], over: 1}); return; }
   const b = used.find(b => !b.over && b.left >= p.len + s.kerf); if (b) { b.parts.push(p); b.left -= p.len + s.kerf; } else used.push({left: L - p.len - s.kerf, parts: [p]}); });
  const tot = list.reduce((a, p) => a + p.len, 0); plan[type] = {bars: used, n: used.length, total: tot, yield: used.length ? tot / (used.length * L) : 0};
 }
 return {plan, glass, hw};
}
/* ---- interfață ---- */
function openWindows() {
 winLoad(); closeModal(true);
 let ov = $('#winApp'); if (!ov) { ov = document.createElement('div'); ov.id = 'winApp'; document.body.appendChild(ov); }
 ov.hidden = false; winRender();
}
function winRender() {
 const ov = $('#winApp'), it = WS.items.find(i => i.id === WS.sel) || WS.items[0] || null; if (it) WS.sel = it.id;
 const total = WS.items.reduce((a, i) => a + winPrice(i).total, 0), V = vatInfo(total);
 ov.innerHTML = `<div class="wtop"><button class="ckb" id="wBack">← ${WL('Mobilă', 'Furniture')}</button><input class="inp" id="wName" value="${esc(WS.name)}"><div class="wtot">${WL('Total', 'Total')}: <b>${lei(V.gross)}</b>${V.payer ? ` <small>${WL('cu TVA', 'incl. VAT')}</small>` : ''}</div>
  <button class="ckb" id="wSys">${WL('Prețuri & sistem', 'Prices & system')}</button><button class="ckb" id="wCut">${WL('Debitare profile', 'Profile cutting')}</button><button class="btn gold" id="wOffer">${WL('Ofertă PDF', 'Quote PDF')}</button></div>
 <div class="wbody"><div class="wlist">${WS.items.map(i => { const p = winPrice(i); return `<button class="witem${i === it ? ' on' : ''}" data-wi="${i.id}"><canvas width="64" height="64" data-wc="${i.id}"></canvas><span><b>${esc(i.name)} · ${esc(WIN_KINDS[i.kind].n)}</b><small>${i.w}×${i.h} · ${i.qty} ${WL('buc', 'pcs')} · ${lei(p.total)}</small></span></button>`; }).join('')}
  <div class="wadd">${Object.entries(WIN_KINDS).map(([k, v]) => `<button class="ckb" data-wk="${k}">+ ${esc(v.n)}</button>`).join('')}</div></div>
 <div class="wedit">${it ? winEditor(it) : `<div class="note">${WL('Adaugă prima poziție din stânga: fereastră, ușă de balcon, ușă de intrare sau glisantă.', 'Add your first position on the left: window, balcony door, entrance door or sliding door.')}</div>`}</div></div>`;
 $('#wBack').onclick = () => { ov.hidden = true; };
 $('#wName').onchange = e => { WS.name = e.target.value.replace(/[<>]/g, '').slice(0, 80); winSave(); };
 $$('[data-wk]').forEach(b => b.onclick = () => { const n = winNew(b.dataset.wk); WS.items.push(n); WS.sel = n.id; winSave(); winRender(); });
 $$('[data-wi]').forEach(b => b.onclick = () => { WS.sel = b.dataset.wi; winRender(); });
 $$('[data-wc]').forEach(c => { const i = WS.items.find(x => x.id === c.dataset.wc), x = c.getContext('2d'), k = 56 / Math.max(i.w, i.h); drawWin(x, i, (64 - i.w * k) / 2, (64 - i.h * k) / 2, k); });
 $('#wSys').onclick = winSettings; $('#wCut').onclick = winCutView; $('#wOffer').onclick = () => winOfferPDF().catch(e => toast(e.message));
 if (it) winBindEditor(it);
}
function winEditor(it) {
 const num = (k, l, u) => `<label class="pf"><span>${l}</span><input class="inp" type="number" inputmode="numeric" data-wf="${k}" value="${it[k]}"></label>`;
 const sel = (k, l, opts) => `<label class="pf"><span>${l}</span><select class="inp" data-wf="${k}">${Object.entries(opts).map(([v, t]) => `<option value="${v}"${String(it[k]) === v ? ' selected' : ''}>${esc(Array.isArray(t) ? t[0] : t)}</option>`).join('')}</select></label>`;
 const p = winPrice(it), chk = winChecks(it), col = {err: '#ef4444', warn: '#f59e0b', info: '#60a5fa'};
 return `<div class="wcanvas"><canvas id="wDraw" width="520" height="460"></canvas></div>
 <div class="pfgrid">${`<label class="pf"><span>${WL('Poziție', 'Position')}</span><input class="inp" data-wf="name" value="${esc(it.name)}"></label>`}${num('w', WL('Lățime toc (mm)', 'Frame width (mm)'))}${num('h', WL('Înălțime toc (mm)', 'Frame height (mm)'))}${num('qty', WL('Bucăți', 'Quantity'))}
 ${sel('mat', WL('Material', 'Material'), {pvc: 'PVC', al: WL('Aluminiu cu rupere termică', 'Thermally broken aluminium')})}${sel('glass', WL('Geam', 'Glazing'), GLASS)}${sel('color', WL('Culoare', 'Colour'), COLORS)}${num('transom', WL('Fix sus (mm, 0 = fără)', 'Top fixed light (mm, 0 = none)'))}</div>
 <div class="lab" style="margin:12px 0 6px">${WL('Canate (de la stânga la dreapta)', 'Sashes (left to right)')}</div>
 <div class="wsash">${it.sash.map((o, i) => `<select class="inp" data-ws="${i}">${Object.entries(OPS).filter(([v]) => it.kind === 'door' ? v.startsWith('door') || v === 'fix' : it.kind === 'slide' ? v === 'sl' || v === 'fix' : !v.startsWith('door') && v !== 'sl').map(([v, t]) => `<option value="${v}"${o === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`).join('')}
 ${it.sash.length < 4 ? `<button class="ckb" id="wAddS">+ ${WL('canat', 'sash')}</button>` : ''}${it.sash.length > 1 ? `<button class="ckb" id="wDelS">− ${WL('canat', 'sash')}</button>` : ''}</div>
 <div class="lab" style="margin:12px 0 6px">${WL('Accesorii', 'Accessories')}</div>
 <div class="wacc"><label class="chk"><input type="checkbox" data-wb="sill"${it.sill ? ' checked' : ''}><span>${WL('Glaf exterior', 'External sill')}</span></label><label class="chk"><input type="checkbox" data-wb="roller"${it.roller ? ' checked' : ''}><span>${WL('Rulou exterior', 'External roller shutter')}</span></label>
 <label class="pf" style="max-width:160px"><span>${WL('Plase insecte (buc)', 'Insect screens (pcs)')}</span><input class="inp" type="number" data-wf="net" value="${it.net || 0}"></label></div>
 ${chk.length ? `<div class="plist" style="margin-top:10px">${chk.map(([l, m]) => `<div class="pitem"><i style="width:10px;height:10px;border-radius:50%;background:${col[l]};flex:none"></i><span>${esc(m)}</span></div>`).join('')}</div>` : ''}
 <div class="sec" style="margin-top:10px"><div class="tog"><span>${WL('Suprafață', 'Area')}</span><b>${p.area.toFixed(2).replace('.', ',')} m²</b></div><div class="tog"><span title="EN ISO 10077-1">${WL('Uw estimat (izolare termică)', 'Estimated Uw (thermal)')}</span><b>${winUw(it).Uw.toFixed(2).replace('.', LANG === 'en' ? '.' : ',')} W/m²K</b></div><div class="tog"><span>${WL('Preț / buc (fără TVA)', 'Price / pc (excl. VAT)')}</span><b>${lei(p.one)}</b></div><div class="tog"><span style="color:var(--gold)">${WL('Total poziție', 'Position total')}</span><b style="color:var(--gold)">${lei(p.total)}</b></div></div>
 <div class="ckbtns" style="margin-top:10px"><button class="ckb" id="wDup">${WL('Duplică', 'Duplicate')}</button><button class="ckb" id="wDel">${WL('Șterge poziția', 'Delete position')}</button></div>`;
}
function winBindEditor(it) {
 const cv = $('#wDraw'), x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height);
 const k = Math.min((cv.width - 60) / it.w, (cv.height - 50) / it.h); drawWin(x, it, 40 + (cv.width - 60 - it.w * k) / 2, 10, k, {dims: true});
 const upd = () => { winSave(); winRender(); };
 $$('[data-wf]').forEach(e => e.onchange = () => { const f = e.dataset.wf; let v = e.value;
  if (['w', 'h', 'qty', 'transom', 'net', 'glass'].includes(f)) v = Math.max(0, Math.round(+v || 0)); else v = String(v).replace(/[<>]/g, '').slice(0, 40);
  if (f === 'qty') v = Math.max(1, v); if (f === 'transom' && v && v < 250) v = 250; it[f] = v; upd(); });
 $$('[data-wb]').forEach(e => e.onchange = () => { it[e.dataset.wb] = e.checked; upd(); });
 $$('[data-ws]').forEach(e => e.onchange = () => { it.sash[+e.dataset.ws] = e.value; upd(); });
 $('#wAddS') && ($('#wAddS').onclick = () => { it.sash.push(it.kind === 'slide' ? 'sl' : it.kind === 'door' ? 'fix' : 'fix'); upd(); });
 $('#wDelS') && ($('#wDelS').onclick = () => { it.sash.pop(); upd(); });
 $('#wDup').onclick = () => { const c = JSON.parse(JSON.stringify(it)); c.id = nid(); c.name = 'P' + (WS.items.length + 1); WS.items.push(c); WS.sel = c.id; upd(); };
 $('#wDel').onclick = () => { WS.items = WS.items.filter(i => i !== it); WS.sel = null; upd(); };
}
function winSettings() {
 const r = WS.rates, s = WS.sys;
 const f = (o, k, l) => `<label class="pf"><span>${l}</span><input class="inp" type="number" data-${o}="${k}" value="${(o === 'wr' ? r : s)[k]}"></label>`;
 modalState = {winset: 1};
 openModal(`${mhead(WL('Prețuri & sistem', 'Prices & system'), WL('Valorile implicite sunt exemple — pune-le pe ale tale', 'Defaults are examples — enter your own'))}
 <div class="lab">${WL('Prețuri', 'Prices')} (${CUR()}, ${WL('fără TVA', 'excl. VAT')})</div><div class="pfgrid">${f('wr', 'pvc', WL('PVC / m²', 'PVC / m²'))}${f('wr', 'al', WL('Aluminiu / m²', 'Aluminium / m²'))}${f('wr', 'osc', WL('Canat oscilobatant / buc', 'Tilt & turn sash / pc'))}${f('wr', 'bat', WL('Canat batant / buc', 'Side-hung sash / pc'))}${f('wr', 'door', WL('Ușă (feronerie, prag) / buc', 'Door (hardware, threshold) / pc'))}${f('wr', 'slide', WL('Canat glisant / buc', 'Sliding sash / pc'))}${f('wr', 'g3', WL('Supliment geam triplu / m²', 'Triple glazing extra / m²'))}${f('wr', 'color', WL('Supliment culoare (%)', 'Colour surcharge (%)'))}${f('wr', 'sill', WL('Glaf / ml', 'Sill / m'))}${f('wr', 'net', WL('Plasă insecte / buc', 'Insect screen / pc'))}${f('wr', 'roller', WL('Rulou / m²', 'Roller shutter / m²'))}${f('wr', 'mount', WL('Montaj / element', 'Installation / element'))}</div>
 <div class="lab" style="margin-top:12px">${WL('Sistem de profile (mm) — după fișa tehnică a profilului tău', 'Profile system (mm) — from your profile data sheet')}</div><div class="pfgrid">${f('ws', 'F', WL('Lățime vizibilă toc', 'Frame face width'))}${f('ws', 'M', WL('Lățime montant', 'Mullion width'))}${f('ws', 'S', WL('Lățime vizibilă cercevea', 'Sash face width'))}${f('ws', 'ov', WL('Suprapunere cercevea pe toc', 'Sash overlap'))}${f('ws', 'gl', WL('Joc geam (pe latură)', 'Glass clearance (per side)'))}${f('ws', 'bar', WL('Lungime bară', 'Bar length'))}${f('ws', 'kerf', WL('Tăietură', 'Kerf'))}${f('ws', 'miter', WL('Adaos tăiere 45°', '45° cut allowance'))}</div>
 <div class="lab" style="margin-top:12px">${WL('Valori termice (W/m²K) — din fișele producătorilor de profil și geam', 'Thermal values (W/m²K) — from profile and glass data sheets')}</div><div class="pfgrid">${f('ws', 'Ug2', 'Ug ' + WL('geam dublu', 'double glazing'))}${f('ws', 'Ug3', 'Ug ' + WL('geam triplu', 'triple glazing'))}${f('ws', 'UfP', 'Uf PVC')}${f('ws', 'UfA', 'Uf ' + WL('aluminiu', 'aluminium'))}${f('ws', 'psi', WL('Ψ distanțier (W/mK)', 'Ψ spacer (W/mK)'))}${f('ws', 'Up', 'Up ' + WL('panou ușă', 'door panel'))}</div>
 <div class="note" style="margin-top:10px">${WL('Deducțiile diferă de la un sistem la altul (Rehau, Salamander, Veka, Schüco etc.). Verifică-le pe fișa producătorului înainte de debitare.', 'Deductions differ between systems (Rehau, Salamander, Veka, Schüco, etc.). Check them against the manufacturer data sheet before cutting.')}</div>
 <button class="btn gold wide" id="wsOk" style="margin-top:10px">${WL('Salvează', 'Save')}</button>`, true);
 $('#wsOk').onclick = () => { $$('[data-wr]').forEach(e => r[e.dataset.wr] = Math.max(0, +e.value || 0)); $$('[data-ws]').forEach(e => s[e.dataset.ws] = Math.max(0, parseFloat(String(e.value).replace(',', '.')) || 0)); winSave(); closeModal(true); winRender(); toast(WL('Salvat', 'Saved')); };
}
function winCutView() {
 if (!WS.items.length) { toast(WL('Adaugă întâi o poziție', 'Add a position first')); return; }
 const C = winCuts(); modalState = {wincut: 1};
 openModal(`${mhead(WL('Debitare profile, geamuri, feronerie', 'Profile cutting, glass, hardware'), `${WL('Bare de', 'Bars of')} ${WS.sys.bar} mm · ${WL('tăietură', 'kerf')} ${WS.sys.kerf} mm`)}
 <div class="plist">${Object.entries(C.plan).map(([t, p]) => `<div class="pitem"><span style="flex:1"><b>${esc(t)}</b><small style="display:block;color:var(--mut)">${p.bars.reduce((a, b) => a + b.parts.length, 0)} ${WL('bucăți', 'pieces')} · ${(p.total / 1000).toFixed(1)} m</small></span><b>${p.n} ${WL('bare', 'bars')} · ${Math.round(p.yield * 100)}%</b></div>`).join('')}</div>
 <div class="lab" style="margin-top:10px">${WL('Geamuri', 'Glass units')}: ${C.glass.length} · ${(C.glass.reduce((a, g) => a + g.w * g.h, 0) / 1e6).toFixed(2).replace('.', ',')} m²</div>
 <div class="lab">${WL('Feronerie', 'Hardware')}: ${C.hw.osc} ${WL('oscilobatant', 'tilt & turn')} · ${C.hw.bat} ${WL('batant', 'side-hung')} · ${C.hw.door} ${WL('uși', 'doors')} · ${C.hw.sl} ${WL('glisant', 'sliding')} · ${C.hw.handle} ${WL('mânere', 'handles')}</div>
 <div class="ckbtns" style="margin-top:10px"><button class="ckb" id="wcCsv">${WL('Debitare profile (CSV)', 'Profile cutting (CSV)')}</button><button class="ckb" id="wcGl">${WL('Comandă geamuri (CSV)', 'Glass order (CSV)')}</button></div>
 <div class="note" style="margin-top:8px">${WL('Cotele de debitare folosesc deducțiile din „Prețuri & sistem”. Verifică-le pe fișa sistemului tău și fă o probă înainte de producție.', 'Cutting sizes use the deductions in “Prices & system”. Check them against your system data sheet and make a test piece before production.')}</div>`, true);
 const q = v => `"${String(v).replace(/"/g, '""')}"`, csv = rows => '﻿' + rows.map(r => r.map(q).join(';')).join('\n') + '\n';
 const safe = WS.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_');
 $('#wcCsv').onclick = () => { const rows = [[WL('Profil', 'Profile'), WL('Bara', 'Bar'), WL('Lungime (mm)', 'Length (mm)'), WL('Poziție', 'Position'), WL('Rest bară (mm)', 'Bar offcut (mm)')]];
  Object.entries(C.plan).forEach(([t, p]) => p.bars.forEach((b, i) => b.parts.forEach(x => rows.push([t, i + 1, x.len, x.note, b.over ? WL('PESTE BARĂ', 'LONGER THAN BAR') : b.left]))));
  saveFile(`Atelia_${safe}_debitare_profile.csv`, csv(rows)); };
 $('#wcGl').onclick = () => { const rows = [[WL('Poziție', 'Position'), WL('Lățime (mm)', 'Width (mm)'), WL('Înălțime (mm)', 'Height (mm)'), WL('Tip', 'Type'), 'm²']].concat(C.glass.map(g => [g.pos, g.w, g.h, GLASS[g.type], (g.w * g.h / 1e6).toFixed(3)]));
  saveFile(`Atelia_${safe}_debitare_geamuri.csv`, csv(rows)); };
}
async function winOfferPDF() {
 if (!WS.items.length) { toast(WL('Adaugă întâi o poziție', 'Add a position first')); return; }
 const pf = getProfile() || {}, firm = pf.company || pf.name || 'Atelia Build', pages = [];
 let pg, x, m, y, W;
 const np = () => { pg = newPage(false); pages.push(pg); x = pg.x; m = pg.mm; W = pg.c.width; y = m(18);
  x.fillStyle = '#111'; x.font = `700 ${m(6)}px Inter,Arial`; x.textAlign = 'right'; x.fillText(firm, W - m(15), y + m(2)); x.font = `400 ${m(3)}px Inter,Arial`; x.fillStyle = '#555';
  x.fillText([pf.company && pf.name, pf.cui && ('CUI ' + pf.cui), pf.phone, pf.email, pf.city].filter(Boolean).join(' · '), W - m(15), y + m(8)); x.textAlign = 'left';
  y += m(14); x.fillStyle = '#a8823c'; x.fillRect(m(15), y, W - m(30), m(0.6)); y += m(10); };
 np();
 x.fillStyle = '#111'; x.font = `700 ${m(7)}px Inter,Arial`; x.fillText(WL('Ofertă tâmplărie', 'Windows & doors quote'), m(15), y); y += m(6);
 x.font = `400 ${m(3.8)}px Inter,Arial`; x.fillStyle = '#444'; x.fillText(`${WS.name} · ${new Date().toLocaleDateString(LANG === 'en' ? 'en-GB' : 'ro-RO')} · ${WL('valabilă 30 de zile', 'valid for 30 days')}`, m(15), y); y += m(8);
 let sum = 0;
 for (const it of WS.items) {
  if (y > pg.c.height - m(70)) np();
  const p = winPrice(it); sum += p.total; const box = m(48), k = Math.min(box / it.w, box / it.h);
  x.strokeStyle = '#e5e5e5'; x.strokeRect(m(15), y, W - m(30), m(56));
  drawWin(x, it, m(20) + (box - it.w * k) / 2, y + m(4), k);
  x.fillStyle = '#111'; x.font = `700 ${m(4.2)}px Inter,Arial`; x.fillText(`${it.name} · ${WIN_KINDS[it.kind].n}`, m(75), y + m(9));
  x.font = `400 ${m(3.3)}px Inter,Arial`; x.fillStyle = '#333';
  [`${it.w} × ${it.h} mm · ${it.qty} ${WL('buc', 'pcs')} · ${it.mat === 'al' ? WL('Aluminiu cu rupere termică', 'Thermally broken aluminium') : 'PVC'}`, `${WL('Geam', 'Glazing')}: ${GLASS[it.glass]}`, `${WL('Culoare', 'Colour')}: ${COLORS[it.color][0]} · Uw ≈ ${winUw(it).Uw.toFixed(2)} W/m²K`,
   it.sash.map(o => OPS[o]).join(' | '), [it.sill && WL('glaf', 'sill'), it.roller && WL('rulou', 'roller shutter'), it.net && `${it.net} ${WL('plase', 'screens')}`, WL('montaj inclus', 'installation included')].filter(Boolean).join(' · ')]
   .forEach((t, i) => x.fillText(t, m(75), y + m(16 + 6 * i)));
  x.font = `700 ${m(4.2)}px Inter,Arial`; x.fillStyle = '#111'; x.textAlign = 'right'; x.fillText(lei(p.total), W - m(20), y + m(9)); x.textAlign = 'left';
  y += m(60);
 }
 if (y > pg.c.height - m(80)) np();
 const V = vatInfo(sum), rows = V.payer ? [[WL('Total fără TVA', 'Total excl. VAT'), V.net, 0], [`${WL('TVA', 'VAT')} ${VAT_RATE}%`, V.vat, 0], [WL('Total cu TVA', 'Total incl. VAT'), V.gross, 1]] : [[WL('Total (neplătitor de TVA)', 'Total (not VAT-registered)'), V.gross, 1]];
 x.fillStyle = '#f6f1e6'; x.fillRect(m(15), y, W - m(30), m(8 + 8 * rows.length));
 rows.forEach(([l, v, big], i) => { x.fillStyle = big ? '#111' : '#444'; x.font = `${big ? 700 : 400} ${m(big ? 5.2 : 4)}px Inter,Arial`; const yy = y + m(10 + 8 * i); x.textAlign = 'left'; x.fillText(l, m(20), yy); x.textAlign = 'right'; x.fillText(lei(v), W - m(20), yy); });
 x.textAlign = 'left'; y += m(16 + 8 * rows.length);
 x.font = `400 ${m(3)}px Inter,Arial`; x.fillStyle = '#666';
 [WL('Dimensiunile sunt de toc și se confirmă după măsurătorile la fața locului. Desenele sunt văzute din interior.', 'Sizes are frame sizes, confirmed after on-site measurement. Drawings are viewed from inside.'),
  WL('Simboluri: triunghiul indică partea balamalelor; F = fix.', 'Symbols: the triangle points to the hinge side; F = fixed.'), WL('Uw: valoare estimată prin metoda simplificată EN ISO 10077-1, din datele de catalog; valoarea certificată este cea din declarația de performanță a producătorului.', 'Uw: estimated with the simplified EN ISO 10077-1 method from catalogue data; the certified value is the one in the manufacturer declaration of performance.')].forEach(t => { x.fillText(t, m(15), y); y += m(4.6); });
 y = Math.max(y + m(10), pg.c.height - m(35));
 x.strokeStyle = '#999'; x.beginPath(); x.moveTo(m(15), y); x.lineTo(m(85), y); x.moveTo(W - m(85), y); x.lineTo(W - m(15), y); x.stroke();
 x.fillStyle = '#555'; x.font = `400 ${m(3.2)}px Inter,Arial`; x.fillText(`${WL('Ofertant', 'Supplier')}: ${firm}`, m(15), y + m(5)); x.fillText(WL('Client — semnătură și dată (accept oferta)', 'Client — signature and date (quote accepted)'), W - m(85), y + m(5));
 const safe = WS.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_');
 await pagesToPDF(pages, `Atelia_${safe}_${WL('oferta_tamplarie', 'windows_quote')}.pdf`);
}
/* activează domeniul în lista de domenii */
{
 const d = DOMAINS.find(x => x.id === 'win'); if (d) d.on = 1;
 const _od = openDomains;
 openDomains = function () { _od(); const b = $('.dcard[data-d="win"]'); if (b) b.onclick = () => { LS.set('atelia.welcome', '1'); openWindows(); }; };
 const st = document.createElement('style'); st.textContent = `
#winApp{position:fixed;inset:0;z-index:55;background:var(--bg,#0d0d0d);color:var(--txt);display:flex;flex-direction:column;font-family:Inter,Arial}
#winApp[hidden]{display:none}
.wtop{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.wtop .inp{flex:1 1 200px;max-width:340px}.wtop .ckb{flex:0 0 auto}.wtot{margin-left:auto;font-size:14px}.wtot b{color:var(--gold)}
.wbody{flex:1;display:grid;grid-template-columns:300px 1fr;min-height:0}
.wlist{border-right:1px solid var(--line);overflow:auto;padding:10px;display:flex;flex-direction:column;gap:6px}
.witem{display:flex;gap:10px;align-items:center;text-align:left;background:#161616;border:1px solid var(--line);border-radius:12px;padding:8px;color:var(--txt);cursor:pointer}
.witem.on{border-color:var(--gold);background:#1c1810}.witem canvas{background:#0e0e0e;border-radius:8px;flex:none}.witem b{display:block;font-size:13px}.witem small{color:var(--mut);font-size:11px}
.wadd{display:flex;flex-direction:column;gap:6px;margin-top:8px}.wadd .ckb{text-align:left}
.wedit{overflow:auto;padding:14px}.wcanvas{display:flex;justify-content:center;background:#101010;border:1px solid var(--line);border-radius:14px;margin-bottom:12px}
.wcanvas canvas{max-width:100%;height:auto}
#winApp select.inp{height:42px;padding:8px 10px;appearance:auto}.wsash{display:flex;gap:6px;flex-wrap:wrap}.wsash .inp{flex:1 1 180px}
.wacc{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}.wacc .chk{margin-top:0}
@media(max-width:860px){.wbody{grid-template-columns:1fr;grid-template-rows:auto 1fr}.wlist{max-height:34vh;border-right:0;border-bottom:1px solid var(--line)}.wtot{margin-left:0}}`;
 document.head.appendChild(st);
}
