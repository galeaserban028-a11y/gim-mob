/* ================== 2. EXPORTURI PE MESERII (Atelia) ==================
   Același proiect → ce îi trebuie fiecăruia:
   arhitect: plan + elevații DXF · constructor/instalator: plan instalații + listă materiale
   client/designer: prezentare-ofertă PDF cu logo și loc de semnătură */
const fileSafe = () => S.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_');
const cabsAll = () => S.items.filter(i => i.kind === 'cab' && !i.hidden);
const asciiTxt = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '?');

/* ---------- DXF (R12, mm) ---------- */
/* DXF minimal (fără tabele): straturile se creează din entități, culoarea e pe fiecare entitate → compatibil cu orice CAD */
const DXF_COL = {ROOM: 7, BASE: 2, WALL: 5, TALL: 3, COUNTER: 8, TEXT: 7, POINTS: 1};
function dxfDoc(ents) { return '0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n' + ents.join('') + '0\nENDSEC\n0\nEOF\n'; }
const dLine = (l, x1, y1, x2, y2) => `0\nLINE\n8\n${l}\n62\n${DXF_COL[l] || 7}\n10\n${x1.toFixed(1)}\n20\n${y1.toFixed(1)}\n30\n0\n11\n${x2.toFixed(1)}\n21\n${y2.toFixed(1)}\n31\n0\n`;
const dRect = (l, x0, y0, x1, y1) => dLine(l, x0, y0, x1, y0) + dLine(l, x1, y0, x1, y1) + dLine(l, x1, y1, x0, y1) + dLine(l, x0, y1, x0, y0);
const dText = (x, y, h, t, l = 'TEXT') => `0\nTEXT\n8\n${l}\n62\n${DXF_COL[l] || 7}\n10\n${x.toFixed(1)}\n20\n${y.toFixed(1)}\n30\n0\n40\n${h}\n1\n${asciiTxt(t)}\n`;
const layerOf = c => { const k = (TYPES[c.type] || {}).cat; return c.type === 'counter' ? 'COUNTER' : k === 'wall' ? 'WALL' : (k === 'tall' || k === 'ward') ? 'TALL' : 'BASE'; };
function exportPlanDXF() {
 const R = S.room, E = [], cabs = cabsAll();
 // plan (vedere de sus): x → dreapta, adâncimea camerei → în jos (y = -z)
 E.push(dRect('ROOM', 0, -R.d, R.w, 0));
 E.push(dText(0, 250, 120, `${S.name} - PLAN (mm)`), dText(R.w / 2 - 200, 80, 80, `${R.w}`), dText(-450, -R.d / 2, 80, `${R.d}`));
 cabs.forEach((c, i) => { const b = bbox(c); E.push(dRect(layerOf(c), b.x0, -b.z1, b.x1, -b.z0));
  if (c.type !== 'counter') E.push(dText((b.x0 + b.x1) / 2 - 60, -(b.z0 + b.z1) / 2, 60, cabCode(c), layerOf(c))); });
 // elevații: fiecare perete văzut din față, așezate sub plan
 let oy = -R.d - 1200;
 for (const w of ['back', 'left', 'right']) {
  if (w === 'left' && !R.left || w === 'right' && !R.right) continue;
  const list = cabs.filter(c => c.wall === w), len = w === 'back' ? R.w : R.d;
  const X = s => w === 'left' ? len - s : s; // peretele stâng văzut din cameră: colțul spate e în dreapta
  E.push(dText(0, oy + R.h + 200, 100, `ELEVATIE ${w === 'back' ? 'PERETE SPATE' : w === 'left' ? 'PERETE STANGA' : 'PERETE DREAPTA'}`), dRect('ROOM', 0, oy, len, oy + R.h));
  list.forEach(c => { const x0 = X(c.s - c.w / 2), x1 = X(c.s + c.w / 2); E.push(dRect(layerOf(c), Math.min(x0, x1), oy + c.e, Math.max(x0, x1), oy + c.e + c.h));
   if (c.type !== 'counter') E.push(dText(Math.min(x0, x1) + 20, oy + c.e + c.h / 2, 50, `${cabCode(c)} ${Math.round(c.w)}x${Math.round(c.h)}`, layerOf(c))); });
  oy -= R.h + 1200;
 }
 installPoints().forEach(p => { const x = p.wall === 'back' ? p.s : (p.wall === 'left' ? 0 : R.w), y = p.wall === 'back' ? 0 : -p.s;
  E.push(dLine('POINTS', x - 40, y - 40, x + 40, y + 40) + dLine('POINTS', x - 40, y + 40, x + 40, y - 40), dText(x + 50, y - 60, 40, p.short, 'POINTS')); });
 saveFile(`Atelia_${fileSafe()}_plan_elevatii.dxf`, dxfDoc(E));
}

/* ---------- puncte de instalații (orientative) ---------- */
function installPoints() {
 const pts = [], cabs = cabsAll();
 const add = (c, kind, h, note, short) => pts.push({wall: c.wall, s: Math.round(c.s), h, kind, note, short, code: cabCode(c)});
 for (const c of cabs) {
  const t = TYPES[c.type] || {};
  if (t.sink) { add(c, 'Apă rece + caldă', 500, 'robinete coltar în corpul chiuvetei', 'APA'); add(c, 'Scurgere Ø50', 450, 'în corpul chiuvetei', 'SC'); }
  if (t.dish) add(c, 'Priză mașină de vase', 400, 'în corpul vecin (chiuvetă), nu în spatele mașinii', 'PR-MV');
  if (c.type === 'base_hob' || c.type === 'base_oven') add(c, 'Circuit dedicat plită' + (c.type === 'base_oven' ? ' + cuptor' : ''), 600, 'cablu conform puterii aparatului — confirmă cu electricianul', 'CIRC');
  if (t.oven && (t.cat === 'tall')) add(c, 'Priză / circuit cuptor', 700, 'în coloana cuptorului', 'PR-C');
  if (t.fridge) add(c, 'Priză frigider', 2050, 'deasupra frigiderului, în coloană', 'PR-F');
  if (c.type === 'wall_hood') { add(c, 'Priză hotă', c.e + c.h + 100, 'deasupra corpului de hotă', 'PR-H'); add(c, 'Evacuare hotă Ø125/150', c.e + c.h + 150, 'dacă hota are evacuare exterioară', 'EV'); }
  if (c.type === 'counter') { const n = Math.max(1, Math.floor(c.w / 1200)); for (let i = 0; i < n; i++) pts.push({wall: c.wall, s: Math.round(c.s - c.w / 2 + (i + 0.5) * c.w / n), h: c.e + c.h + 200, kind: 'Priză dublă blat', note: 'deasupra blatului', short: 'PR', code: cabCode(c)}); }
 }
 return pts;
}
const WALLN = {back: 'spate', left: 'stânga', right: 'dreapta'};
function exportInstallCSV() {
 const pts = installPoints(); if (!pts.length) { toast('Nu am găsit puncte de instalații în proiect'); return; }
 const rows = [['Perete', 'Distanță din colțul stânga/spate (mm)', 'Înălțime de la pardoseală (mm)', 'Tip', 'Corp', 'Observații']]
  .concat(pts.map(p => [WALLN[p.wall], p.s, p.h, p.kind, p.code, p.note]));
 const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n') + '\n"ORIENTATIV — confirmă cotele cu instalatorul, electricianul și manualele aparatelor înainte de execuție."\n';
 saveFile(`Atelia_${fileSafe()}_plan_instalatii.csv`, csv);
}
function exportMaterialsCSV() {
 const P = production(), rows = [['Categorie', 'Material / articol', 'Cantitate', 'U.M.']];
 const nest = P.nest && P.nest.groups ? P.nest.groups : [];
 nest.forEach(g => rows.push([g.kind === 'blat' ? 'Blat' : g.kind === 'hdf' ? 'HDF' : 'PAL', `${g.dec.n || g.dec.id || ''} · ${g.th} mm`, g.sheets.length, g.kind === 'blat' ? 'bucăți blat' : 'foi']));
 rows.push(['Suprafețe', 'PAL corp', P.area.pal.toFixed(2), 'm²'], ['Suprafețe', 'Fronturi', P.area.front.toFixed(2), 'm²'], ['Suprafețe', 'HDF', P.area.hdf.toFixed(2), 'm²'], ['Suprafețe', 'Blat', P.area.blat.toFixed(2), 'm²']);
 rows.push(['Cant', 'Cant total', (P.cant / 1000).toFixed(1), 'ml']);
 const hwN = {bal: 'Balamale', glis: 'Glisiere (set)', man: 'Mânere', pic: 'Picioare', rab: 'Sisteme rabatabile', bara: 'Bare umeraș'};
 for (const k in hwN) if (P.acc[k]) rows.push(['Accesorii', hwN[k], P.acc[k], 'buc']);
 const pts = installPoints(); const cnt = {}; pts.forEach(p => cnt[p.kind] = (cnt[p.kind] || 0) + 1);
 for (const k in cnt) rows.push(['Instalații (orientativ)', k, cnt[k], 'puncte']);
 rows.push(['Montaj', 'Feronerie anti-răsturnare corpuri înalte', cabsAll().filter(c => ['tall', 'ward'].includes((TYPES[c.type] || {}).cat) && c.h >= 1500).length, 'seturi']);
 const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n') + '\n';
 saveFile(`Atelia_${fileSafe()}_lista_materiale.csv`, csv);
}

/* ---------- prezentare + ofertă pentru client (PDF) ---------- */
async function exportClientPDF() {
 const pf = getProfile() || {}, P = production(), pg = newPage(false), x = pg.x, m = pg.mm, W = pg.c.width;
 const firm = pf.company || pf.name || 'Atelia Build', gold = '#a8823c';
 let y = m(18);
 if (pf.logo) { try { const im = new Image(); im.src = pf.logo; await im.decode(); const h = m(16), w = h * im.width / im.height; x.drawImage(im, m(15), y - m(4), Math.min(w, m(60)), h); } catch (e) {} }
 x.fillStyle = '#111'; x.font = `700 ${m(7)}px Inter,Arial`; x.textAlign = 'right'; x.fillText(firm, W - m(15), y + m(3));
 x.font = `400 ${m(3.2)}px Inter,Arial`; x.fillStyle = '#555'; x.fillText([pf.company && pf.name, pf.cui && ('CUI ' + pf.cui), pf.phone, pf.email, pf.city].filter(Boolean).join(' · '), W - m(15), y + m(9)); x.textAlign = 'left';
 y += m(22); x.fillStyle = gold; x.fillRect(m(15), y, W - m(30), m(0.6)); y += m(12);
 x.fillStyle = '#111'; x.font = `700 ${m(8)}px Inter,Arial`; x.fillText('Ofertă și prezentare proiect', m(15), y);
 y += m(7); x.font = `400 ${m(4)}px Inter,Arial`; x.fillStyle = '#444';
 x.fillText(`${S.name} · ${new Date().toLocaleDateString('ro-RO')} · valabilă 30 de zile`, m(15), y); y += m(6);
 try { const sel = selId; selId = null; refreshOverlay(); renderer.render(scene, camera); const url = renderer.domElement.toDataURL('image/jpeg', .9); selId = sel; refreshOverlay();
  const im = new Image(); im.src = url; await im.decode(); const w = W - m(30), h = Math.min(m(110), w * im.height / im.width); x.drawImage(im, m(15), y, w, h); x.strokeStyle = '#ddd'; x.strokeRect(m(15), y, w, h); y += h + m(10);
 } catch (e) { y += m(4); }
 x.fillStyle = '#111'; x.font = `700 ${m(4.6)}px Inter,Arial`; x.fillText('Ce conține', m(15), y); y += m(7);
 const corp = {}; cabsAll().filter(c => c.type !== 'counter').forEach(c => { const k = TYPES[c.type].n; corp[k] = (corp[k] || 0) + 1; });
 x.font = `400 ${m(3.6)}px Inter,Arial`; x.fillStyle = '#333';
 const items = Object.entries(corp); const half = Math.ceil(items.length / 2);
 items.forEach(([k, v], i) => x.fillText(`• ${v} × ${k}`, m(i < half ? 15 : 108), y + m(5.2) * (i < half ? i : i - half)));
 y += m(5.2) * half + m(6);
 x.fillStyle = '#111'; x.font = `700 ${m(4.6)}px Inter,Arial`; x.fillText('Materiale', m(15), y); y += m(7);
 x.font = `400 ${m(3.6)}px Inter,Arial`; x.fillStyle = '#333';
 [['Fronturi', S.mat.front], ['Corp', S.mat.body], ['Blat', S.mat.counter]].forEach(([l, c]) => { const d = DEC[c]; x.fillStyle = d.c || '#ccc'; x.fillRect(m(15), y - m(3.4), m(5), m(5)); x.strokeStyle = '#999'; x.strokeRect(m(15), y - m(3.4), m(5), m(5)); x.fillStyle = '#333'; x.fillText(`${l}: ${d.n}`, m(23), y); y += m(6.5); });
 y += m(4); x.fillStyle = '#f6f1e6'; x.fillRect(m(15), y, W - m(30), m(16)); x.fillStyle = '#111'; x.font = `700 ${m(5.5)}px Inter,Arial`;
 x.fillText('Preț estimat', m(20), y + m(10)); x.textAlign = 'right'; x.fillText(lei(P.total), W - m(20), y + m(10)); x.textAlign = 'left'; y += m(24);
 x.font = `400 ${m(3)}px Inter,Arial`; x.fillStyle = '#666';
 ['Prețul este estimativ și se confirmă după măsurătorile la fața locului. Culorile pot diferi față de mostrele fizice.', 'Montajul, transportul și instalațiile se ofertează separat, dacă nu sunt menționate.'].forEach(t => { x.fillText(t, m(15), y); y += m(4.6); });
 y = Math.max(y + m(10), pg.c.height - m(40));
 x.strokeStyle = '#999'; x.beginPath(); x.moveTo(m(15), y); x.lineTo(m(85), y); x.moveTo(W - m(85), y); x.lineTo(W - m(15), y); x.stroke();
 x.fillStyle = '#555'; x.font = `400 ${m(3.2)}px Inter,Arial`; x.fillText(`Ofertant: ${firm}`, m(15), y + m(5)); x.fillText('Client — semnătură și dată (accept oferta)', W - m(85), y + m(5));
 x.fillStyle = '#aaa'; x.font = `400 ${m(2.6)}px Inter,Arial`; x.fillText('Generat cu Atelia Build', m(15), pg.c.height - m(10));
 await pagesToPDF([pg], `Atelia_${fileSafe()}_oferta_client.pdf`);
}

const EXPORTS = [
 {id: 'client', ic: '🧾', n: 'Ofertă și prezentare pentru client (PDF)', d: 'Imagine 3D, ce conține, materiale, preț, loc de semnătură. Cu logo-ul și datele tale.', roles: ['client', 'mobila', 'designer', 'arhitect', 'constructor'], fn: exportClientPDF},
 {id: 'dxf', ic: '📐', n: 'Plan + elevații DXF (AutoCAD, ArchiCAD, Revit)', d: 'Plan de sus și fiecare perete din față, pe straturi, în mm. Include punctele de instalații.', roles: ['arhitect', 'designer', 'mobila', 'constructor'], fn: exportPlanDXF, pro: 1},
 {id: 'inst', ic: '🔌', n: 'Plan instalații (CSV / Excel)', d: 'Apă, scurgere, prize, circuite, hotă — perete, distanță, înălțime. Orientativ, pentru instalator și electrician.', roles: ['constructor', 'arhitect', 'mobila', 'designer', 'client'], fn: exportInstallCSV},
 {id: 'mat', ic: '🧱', n: 'Listă materiale și cantități (CSV / Excel)', d: 'Foi PAL/HDF/blat după optimizare, m², cant, accesorii, puncte de instalații, feronerie montaj.', roles: ['constructor', 'mobila', 'arhitect'], fn: exportMaterialsCSV, pro: 1}];
function openExports() {
 const role = (getProfile() || {}).role || 'mobila', simple = curMode() === 'simple';
 const list = EXPORTS.filter(e => !(simple && e.pro)).sort((a, b) => a.roles.indexOf(role) < 0 ? 1 : b.roles.indexOf(role) < 0 ? -1 : a.roles.indexOf(role) - b.roles.indexOf(role));
 modalState = {exports: 1};
 openModal(`${mhead('Exporturi', `Pentru ${ROLES[role] ? ROLES[role].n.toLowerCase() : 'tine'} — același proiect, formatul de care ai nevoie`)}
 <div class="plist">${list.map(e => `<button class="excard" data-ex="${e.id}"><span>${e.ic}</span><div><b>${e.n}</b><small>${e.d}</small></div></button>`).join('')}</div>
 <div class="legal-links">Exporturile sunt generate automat din proiect. Verifică-le înainte de a le folosi (Termeni, pct. 4).</div>`, true);
 $$('.excard').forEach(b => b.onclick = async () => { const e = EXPORTS.find(x => x.id === b.dataset.ex); try { toast('Generez…'); await e.fn(); } catch (er) { console.error(er); toast('Nu am putut genera: ' + er.message); } });
}
(() => {
 const nav = $('#tools'), ref = $('#tRoom'); if (!nav) return;
 const b = document.createElement('button'); b.id = 'tExp';
 b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg><span>Export</span>';
 b.onclick = openExports; nav.insertBefore(b, ref);
 const st = document.createElement('style'); st.textContent = `.excard{display:flex;gap:12px;align-items:flex-start;text-align:left;width:100%;background:#181818;border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--txt);cursor:pointer;font-family:Inter,Arial;margin-bottom:8px}.excard:hover{border-color:var(--gold)}.excard>span{font-size:24px}.excard b{display:block;font-size:14px}.excard small{color:var(--mut);font-size:12px;line-height:1.4}`; document.head.appendChild(st);
})();
