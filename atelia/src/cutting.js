/* ================== UNIC 2: COMANDĂ DEBITARE + COMPARARE CENTRE ==================
   Pachet standard pentru orice centru de debitare (lista piese + cant + fibră),
   calcul cost și termen pentru fiecare centru salvat, trimitere pe e-mail / WhatsApp. */
function cutters() { try { return JSON.parse(LS.get('atelia.cutters') || '[]'); } catch (e) { return []; } }
function saveCutters(l) { LS.set('atelia.cutters', JSON.stringify(l)); }
function cutStats() {
 const P = production(), parts = P.parts;
 const cutML = parts.reduce((a, p) => a + (p.L + p.W), 0) / 1000;           // ~ o tăietură pe fiecare latură comună
 const sheets = (P.nest && P.nest.groups ? P.nest.groups : []).filter(g => g.kind !== 'blat').reduce((a, g) => a + g.sheets.length, 0);
 const blat = (P.nest && P.nest.groups ? P.nest.groups : []).filter(g => g.kind === 'blat').reduce((a, g) => a + g.sheets.length, 0);
 return {P, parts, cutML, cantML: P.cant / 1000, sheets, blat, pieces: parts.length};
}
function cutCost(c, st) { const sheet = st.sheets * (+c.sheet || 0), cut = st.cutML * (+c.cut || 0), cant = st.cantML * (+c.cant || 0), extra = +c.fee || 0; return {sheet, cut, cant, extra, total: sheet + cut + cant + extra}; }
function cutCSV() {
 const st = cutStats(), rows = [[WL('Nr', 'No'), WL('Cod piesă', 'Part code'), WL('Denumire', 'Name'), WL('Decor', 'Decor'), WL('Grosime', 'Thickness'), WL('Lungime', 'Length'), WL('Lățime', 'Width'), WL('Buc', 'Qty'), WL('Fibră pe lungime', 'Grain along length'), 'Cant L1', 'Cant L2', 'Cant W1', 'Cant W2', WL('Grosime cant', 'Edge thickness')]];
 const g = {}; st.parts.forEach(p => { const k = [p.dec.n, p.th, p.L, p.W, p.grain, p.edges.L1, p.edges.L2, p.edges.W1, p.edges.W2].join('|'); (g[k] = g[k] || {p, n: 0, codes: []}).n++; g[k].codes.push(p.pid); });
 Object.values(g).forEach((r, i) => { const p = r.p; rows.push([i + 1, r.codes.join(' '), T(p.name), p.dec.n, p.th, p.L, p.W, r.n, p.grain ? WL('da', 'yes') : WL('nu', 'no'), p.edges.L1, p.edges.L2, p.edges.W1, p.edges.W2, p.thin]); });
 return '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n') + '\n';
}
function cutMessage(st) {
 const pf = getProfile() || {};
 return WL(`Bună ziua,\n\nVă rog o ofertă pentru debitare${st.cantML ? ' și cant' : ''}:\n• Proiect: ${S.name}\n• ${st.pieces} piese, ~${st.sheets} foi${st.blat ? `, ${st.blat} blat` : ''}\n• Cant: ~${st.cantML.toFixed(1)} ml\nAtașez lista de piese (CSV) și planurile de debitare (PDF). Fibra este marcată pe fiecare piesă.\n\nMulțumesc,\n${[pf.name, pf.company, pf.phone].filter(Boolean).join(' · ')}`,
  `Hello,\n\nPlease quote for cutting${st.cantML ? ' and edge banding' : ''}:\n• Project: ${S.name}\n• ${st.pieces} parts, ~${st.sheets} sheets${st.blat ? `, ${st.blat} worktop` : ''}\n• Edging: ~${st.cantML.toFixed(1)} m\nI attach the parts list (CSV) and cutting plans (PDF). Grain direction is marked on each part.\n\nThank you,\n${[pf.name, pf.company, pf.phone].filter(Boolean).join(' · ')}`);
}
function openCutting() {
 const st = cutStats(), list = cutters(), cur = CUR();
 const rows = list.map(c => ({c, k: cutCost(c, st)})).sort((a, b) => a.k.total - b.k.total);
 modalState = {cutting: 1};
 openModal(`${mhead(WL('Comandă debitare', 'Order cutting'), `${st.pieces} ${WL('piese', 'parts')} · ~${st.sheets} ${WL('foi', 'sheets')} · ${st.cutML.toFixed(0)} ${WL('ml tăiere', 'm of cuts')} · ${st.cantML.toFixed(1)} ${WL('ml cant', 'm edging')}`)}
 <div class="ckbtns"><button class="ckb" id="ctCsv">${WL('Descarcă lista pentru debitare (CSV)', 'Download cutting list (CSV)')}</button><button class="ckb" id="ctPdf">${WL('Planuri de debitare (PDF)', 'Cutting plans (PDF)')}</button></div>
 ${rows.length ? `<div class="lab" style="margin-top:12px">${WL('Comparație centre de debitare (cel mai ieftin primul)', 'Cutting centre comparison (cheapest first)')}</div>
 <div class="plist">${rows.map(({c, k}, i) => `<div class="pitem" style="flex-wrap:wrap"><span style="flex:1 1 200px"><b>${i === 0 ? '🏆 ' : ''}${esc(c.name)}</b><small style="display:block;color:var(--mut)">${esc(c.city || '')}${c.days ? ` · ${WL('termen', 'lead time')} ${esc(String(c.days))} ${WL('zile', 'days')}` : ''} · ${WL('foi', 'sheets')} ${money(k.sheet)} · ${WL('tăiere', 'cutting')} ${money(k.cut)} · cant ${money(k.cant)}${k.extra ? ` · ${WL('taxe', 'fees')} ${money(k.extra)}` : ''}</small></span>
  <b style="color:var(--gold)">${money(k.total)}</b><button class="ckb" data-ctm="${c.id}">${WL('E-mail', 'Email')}</button><button class="ckb" data-ctw="${c.id}">WhatsApp</button><button class="ckb" data-ctd="${c.id}">${WL('Șterge', 'Delete')}</button></div>`).join('')}</div>` : `<div class="note" style="margin-top:12px">${WL('Adaugă centrele de debitare cu care lucrezi și prețurile lor — aplicația îți spune unde e cel mai ieftin pentru fiecare proiect.', 'Add the cutting centres you work with and their prices — the app tells you which is cheapest for each project.')}</div>`}
 <div class="sec" style="margin-top:12px"><div class="lab">${WL('Adaugă centru de debitare', 'Add cutting centre')}</div><div class="pfgrid">
  <input class="inp" id="ctN" placeholder="${WL('Nume (ex: Depozit PAL Cluj)', 'Name (e.g. Board Depot)')}"><input class="inp" id="ctC" placeholder="${WL('Oraș', 'City')}"><input class="inp" id="ctE" type="email" placeholder="E-mail"><input class="inp" id="ctP" type="tel" placeholder="${WL('Telefon WhatsApp (ex: 40712345678)', 'WhatsApp phone (e.g. 447700900123)')}">
  <label class="pf"><span>${WL('Foaie PAL cu material', 'Board sheet incl. material')} (${cur}/${WL('foaie', 'sheet')})</span><input class="inp" type="number" id="ctS" value="0"></label><label class="pf"><span>${WL('Tăiere', 'Cutting')} (${cur}/${WL('ml', 'm')})</span><input class="inp" type="number" id="ctX" value="0"></label>
  <label class="pf"><span>Cant (${cur}/${WL('ml', 'm')})</span><input class="inp" type="number" id="ctK" value="0"></label><label class="pf"><span>${WL('Taxe fixe / transport', 'Fixed fees / delivery')} (${cur})</span><input class="inp" type="number" id="ctF" value="0"></label><label class="pf"><span>${WL('Termen (zile)', 'Lead time (days)')}</span><input class="inp" type="number" id="ctD" value="3"></label></div>
  <button class="btn gold wide" id="ctAdd" style="margin-top:8px">${WL('Salvează centrul', 'Save centre')}</button></div>
 <div class="legal-links">${WL('Costurile sunt estimate din prețurile introduse de tine; oferta fermă o dă centrul de debitare. Atașează manual fișierele descărcate în e-mail.', 'Costs are estimated from the prices you entered; the cutting centre gives the firm quote. Attach the downloaded files to the email yourself.')}</div>`, true);
 $('#ctCsv').onclick = () => saveFile(`Atelia_${fileSafe()}_debitare_centru.csv`, cutCSV());
 $('#ctPdf').onclick = async () => { const P = production(); if (P.nest) await pagesToPDF(nestPages(P.nest), `Atelia_${fileSafe()}_optimizare.pdf`); };
 $('#ctAdd').onclick = () => { const n = $('#ctN').value.trim(); if (!n) { toast(WL('Scrie numele centrului', 'Enter the centre name')); return; }
  const c = {id: nid(), name: n.replace(/[<>]/g, '').slice(0, 60), city: $('#ctC').value.replace(/[<>]/g, '').slice(0, 40), email: $('#ctE').value.trim().slice(0, 80), phone: $('#ctP').value.replace(/[^\d]/g, '').slice(0, 15),
   sheet: +$('#ctS').value || 0, cut: +$('#ctX').value || 0, cant: +$('#ctK').value || 0, fee: +$('#ctF').value || 0, days: Math.max(0, Math.round(+$('#ctD').value || 0))};
  saveCutters(cutters().concat(c)); openCutting(); };
 $$('[data-ctd]').forEach(b => b.onclick = () => { saveCutters(cutters().filter(c => c.id !== b.dataset.ctd)); openCutting(); });
 const msg = cutMessage(st), subj = `${WL('Cerere ofertă debitare', 'Cutting quote request')} — ${S.name}`;
 $$('[data-ctm]').forEach(b => b.onclick = () => { const c = cutters().find(x => x.id === b.dataset.ctm); if (!c.email) { toast(WL('Centrul nu are e-mail salvat', 'No email saved for this centre')); return; }
  saveFile(`Atelia_${fileSafe()}_debitare_centru.csv`, cutCSV()); location.href = `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(msg)}`; });
 $$('[data-ctw]').forEach(b => b.onclick = () => { const c = cutters().find(x => x.id === b.dataset.ctw); if (!c.phone) { toast(WL('Centrul nu are telefon salvat', 'No phone saved for this centre')); return; }
  window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener'); });
}
EXPORTS.push({id: 'cut', ic: '🪚', n: WL('Comandă debitare (compară centre)', 'Order cutting (compare centres)'), d: WL('Lista pentru orice centru de debitare, cost și termen calculate pentru fiecare centru salvat, trimitere pe e-mail sau WhatsApp.', 'A list any cutting centre accepts, cost and lead time for each saved centre, send by email or WhatsApp.'), roles: ['mobila', 'client', 'designer'], fn: openCutting});
