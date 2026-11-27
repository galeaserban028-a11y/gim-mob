/* ================== 4. LISTE DE PREȚURI FURNIZORI (Atelia) ==================
   Liste salvate în browser (atelia.prices), importate din CSV/Excel-ul furnizorului.
   Prețul pe decor (cod Egger) înlocuiește prețul general pe m² pentru acel decor.
   Proiectul păstrează o copie a prețurilor aplicate (S.priceList) → oferta rămâne reproductibilă. */
const RATE_KEYS = {pal: 'PAL corp (lei/m²)', front: 'Fronturi (lei/m²)', hdf: 'HDF (lei/m²)', blat: 'Blat (lei/m²)', cant: 'Cant (lei/ml)', bal: 'Balama (lei/buc)', glis: 'Glisiere (lei/set)', man: 'Mâner (lei/buc)', pic: 'Picior (lei/buc)', rab: 'Rabatabil (lei/set)', bara: 'Bară umeraș (lei/buc)', manop: 'Manoperă (%)', foaie: 'Foaie PAL (lei/foaie)'};
function priceLists() { try { return JSON.parse(LS.get('atelia.prices') || '[]'); } catch (e) { return []; } }
function savePriceLists(l) { LS.set('atelia.prices', JSON.stringify(l)); }
function parsePriceCSV(txt) {
 const rates = {}, decors = {}, bad = [];
 String(txt).split(/\r?\n/).forEach((line, i) => {
  const t = line.trim(); if (!t || /^#/.test(t)) return;
  const c = t.split(/[;\t]|,(?=\s*\d)/).map(s => s.trim().replace(/^"|"$/g, ''));
  if (c.length < 2) { bad.push(i + 1); return; }
  const key = c[0].toLowerCase(), val = parseFloat(String(c[1]).replace(/\s/g, '').replace(',', '.')), kind = (c[2] || '').toLowerCase();
  if (!isFinite(val) || val < 0) { if (i > 0) bad.push(i + 1); return; }   // prima linie poate fi antet
  if (RATE_KEYS[key]) { rates[key] = val; return; }
  const code = c[0].toUpperCase().match(/^[WUHF]\d{3,4}(?:\s*ST\d+)?$/);
  if (code) { const k = normCode(code[0]) || code[0].replace(/\s+/g, ''); decors[k] = Object.assign(decors[k] || {}, kind.startsWith('blat') ? {blat: val} : {m2: val}); return; }
  bad.push(i + 1);
 });
 return {rates, decors, bad};
}
/* prețul pe decor în calculul ofertei (numai la calcul pe m²) */
{
 const _prod = production;
 production = function (filterId) {
  const P = _prod(filterId), pl = S.priceList;
  if (!pl || !pl.decors || S.rates.mode === 'foaie') return P;
  const R = S.rates; let delta = 0;
  for (const p of P.parts) { const d = pl.decors[p.dec && p.dec.id]; if (!d) continue; const a = p.L * p.W / 1e6;
   if (p.mat === 'counter' && d.blat != null) delta += a * (d.blat - R.blat);
   else if (p.mat !== 'counter' && p.mat !== 'back' && d.m2 != null) delta += a * (d.m2 - (p.mat === 'front' ? R.front : R.pal)); }
  if (!delta) return P;
  const mat = P.mat + delta, man = (mat + P.hw) * R.manop / 100;
  return Object.assign(P, {mat, man, total: mat + P.hw + man, priceListDelta: delta});
 };
}
function applyPriceList(l) {
 mutate(() => { S.rates = Object.assign({}, S.rates, l.rates); S.priceList = {id: l.id, name: l.name, updated: l.updated, decors: l.decors}; });
 if (typeof prodCache !== 'undefined') prodCache = null;
 toast(`Aplicat: ${l.name}`);
}
function priceListCSV(l) {
 const rows = ['cod_sau_tip;pret;tip'].concat(Object.entries(l.rates).map(([k, v]) => `${k};${v};`), Object.entries(l.decors).flatMap(([k, d]) => [d.m2 != null ? `${k};${d.m2};m2` : null, d.blat != null ? `${k};${d.blat};blat` : null].filter(Boolean)));
 return '﻿' + rows.join('\n') + '\n';
}
const PRICE_EX = `# cod sau tip ; preț ; (opțional) blat
pal;92
front;118
cant;3.8
bal;14
glis;72
H1145;135
W1000;98
F186;310;blat`;
function openPrices() {
 const lists = priceLists(), cur = S.priceList;
 modalState = {prices: 1};
 const age = d => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
 openModal(`${mhead('Liste de prețuri furnizori', cur ? `Proiectul folosește: ${esc(cur.name)}` : 'Proiectul folosește prețurile generale')}
 ${lists.length ? `<div class="plist">${lists.map(l => `<div class="pitem"><span style="flex:1"><b>${esc(l.name)}</b><small style="display:block;color:${age(l.updated) > 30 ? '#f59e0b' : 'var(--mut)'}">${Object.keys(l.rates).length} prețuri generale · ${Object.keys(l.decors).length} decoruri · actualizată ${new Date(l.updated).toLocaleDateString('ro-RO')}${age(l.updated) > 30 ? ' — veche, verifică prețurile' : ''}</small></span>
  <button class="ckb" data-pa="${l.id}">Aplică</button><button class="ckb" data-px="${l.id}">CSV</button><button class="ckb" data-pd="${l.id}">Șterge</button></div>`).join('')}</div>` : '<div class="note">Nu ai încă liste. Adaugă lista furnizorului tău mai jos.</div>'}
 <div class="sec" style="margin-top:12px"><div class="lab">Listă nouă</div>
 <input class="inp" id="plName" placeholder="Numele furnizorului (ex: Egger – depozit Cluj, nov. 2026)" style="width:100%">
 <textarea class="inp" id="plTxt" rows="7" style="width:100%;margin-top:8px;font:13px/1.4 ui-monospace,Menlo,monospace" placeholder="${esc(PRICE_EX)}"></textarea>
 <div class="ckbtns" style="margin-top:8px"><label class="ckb" style="text-align:center">Încarcă CSV<input type="file" id="plFile" accept=".csv,.txt" hidden></label><button class="ckb" id="plEx">Pune exemplul</button><button class="btn gold" id="plSave">Salvează lista</button></div>
 <div class="note" style="margin-top:8px">Format: o linie = <code>cod;preț</code>. Coduri: decor Egger (ex. <code>H1145</code>, lei/m²; adaugă <code>;blat</code> pentru blat) sau tip general (${Object.keys(RATE_KEYS).join(', ')}). Din Excel: Salvează ca → CSV.</div>
 <div id="plMsg"></div></div>
 <div class="legal-links">Prețurile sunt cele introduse de tine. Verifică-le la furnizor înainte de ofertare.</div>`, true);
 $$('[data-pa]').forEach(b => b.onclick = () => { applyPriceList(priceLists().find(l => l.id === b.dataset.pa)); openPrices(); });
 $$('[data-px]').forEach(b => b.onclick = () => { const l = priceLists().find(x => x.id === b.dataset.px); saveFile(`Atelia_preturi_${l.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_')}.csv`, priceListCSV(l)); });
 $$('[data-pd]').forEach(b => b.onclick = () => { savePriceLists(priceLists().filter(l => l.id !== b.dataset.pd)); openPrices(); });
 $('#plEx').onclick = () => { $('#plTxt').value = PRICE_EX; };
 $('#plFile').onchange = async e => { const f = e.target.files[0]; if (f) { $('#plTxt').value = await f.text(); if (!$('#plName').value) $('#plName').value = f.name.replace(/\.\w+$/, ''); } };
 $('#plSave').onclick = () => {
  const name = $('#plName').value.trim(), r = parsePriceCSV($('#plTxt').value);
  if (!name) { toast('Scrie numele furnizorului'); return; }
  if (!Object.keys(r.rates).length && !Object.keys(r.decors).length) { toast('Nu am găsit niciun preț valid'); return; }
  const l = {id: nid(), name: name.slice(0, 80), updated: new Date().toISOString(), rates: r.rates, decors: r.decors};
  savePriceLists(priceLists().concat(l));
  toast(`Salvat: ${Object.keys(r.rates).length} prețuri generale, ${Object.keys(r.decors).length} decoruri${r.bad.length ? ` · ${r.bad.length} linii ignorate (${r.bad.slice(0, 5).join(', ')})` : ''}`);
  openPrices();
 };
}
/* butonul apare în tab-ul Preț din Producție și în mod Simplu în Export */
{
 const _draw = drawProd;
 drawProd = function () {
  _draw();
  if (prodTab === 'price' && !$('#bPrices')) { const ref = $('#cpOffer'); if (ref) { const b = document.createElement('button'); b.id = 'bPrices'; b.className = 'btn wide'; b.style.marginBottom = '8px';
   b.textContent = S.priceList ? `Prețuri: ${S.priceList.name} — schimbă` : 'Liste de prețuri furnizori'; b.onclick = openPrices; ref.parentNode.insertBefore(b, ref); } }
 };
}
EXPORTS.push({id: 'prices', ic: '🏷️', n: 'Liste de prețuri furnizori', d: 'Importă prețurile furnizorului (CSV/Excel) și aplică-le pe proiect — pe decor și pe accesorii.', roles: ['mobila', 'designer', 'constructor', 'arhitect'], fn: openPrices, pro: 1});
