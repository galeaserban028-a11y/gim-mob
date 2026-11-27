/* ================== UNIC 1: INSTRUCȚIUNI DE MONTAJ AUTOMATE ==================
   Din proiect → PDF pas cu pas pentru fiecare corp, cu aceleași coduri ca etichetele QR (C3-1, C3-2…).
   Pentru atelier, montator și clientul care montează singur. */
const ASM_GROUPS = [
 {k: 'carcass', re: /^(Lateral|Bază|Separator)/, n: () => WL('Asamblează carcasa', 'Assemble the carcass')},
 {k: 'top', re: /^(Capac|Legătură)/, n: () => WL('Montează capacul / legăturile de sus', 'Fit the top / top rails')},
 {k: 'back', re: /^Spate/, n: () => WL('Montează spatele', 'Fit the back panel')},
 {k: 'shelf', re: /^Poliță/, n: () => WL('Montează polițele', 'Fit the shelves')},
 {k: 'drawer', re: /^Sertar/, n: () => WL('Asamblează sertarele', 'Assemble the drawers')},
 {k: 'plinth', re: /^Soclu/, n: () => WL('Picioare și soclu', 'Legs and plinth')},
 {k: 'fronts', re: /^(Ușă|Front|Panou orb)/, n: () => WL('Montează fronturile', 'Fit the fronts')}];
function asmData(it) {
 const parts = allParts(it.id), cut = parts.filter(p => !p.hw), hw = {}; parts.filter(p => p.hw).forEach(p => hw[p.hw] = (hw[p.hw] || 0) + 1);
 const groups = ASM_GROUPS.map(g => ({...g, parts: cut.filter(p => g.re.test(p.name))})).filter(g => g.parts.length);
 const other = cut.filter(p => !ASM_GROUPS.some(g => g.re.test(p.name)));
 if (other.length) groups.splice(groups.length - 1, 0, {k: 'other', n: () => WL('Alte piese', 'Other parts'), parts: other});
 return {cut, hw, groups, code: cut[0] ? cut[0].code : cabCode(it)};
}
function asmStepText(g, it, hw) {
 const st = S.std, join = {confirmat: WL('șuruburi confirmat (pre-găurite)', 'confirmat screws (pre-drilled)'), excentric: WL('excentrice + bolțuri', 'cam locks + dowels'), dibluri: WL('dibluri + adeziv', 'dowels + glue')}[st.join] || st.join;
 const cat = (TYPES[it.type] || {}).cat;
 switch (g.k) {
  case 'carcass': return WL(`Așază baza pe o suprafață curată. Prinde lateralele de bază cu ${join}. Verifică unghiul drept cu echerul sau măsurând diagonalele (trebuie să fie egale).`, `Lay the bottom on a clean surface. Fix the sides to the bottom with ${join}. Check it is square with a set square or by measuring the diagonals (they must be equal).`);
  case 'top': return WL(`Montează capacul sau legăturile de sus cu ${join}. Nu strânge complet până nu e montat spatele.`, `Fit the top or top rails with ${join}. Do not fully tighten until the back is fitted.`);
  case 'back': return st.back === 'aplicat' ? WL('Pune spatele HDF pe carcasă, aliniază-l la un colț și verifică diagonalele. Prinde-l cu cuie sau capse la 100–150 mm.', 'Place the HDF back on the carcass, align it to one corner and re-check the diagonals. Fix with nails or staples every 100–150 mm.')
   : WL('Glisează spatele HDF în canal înainte de a închide carcasa.', 'Slide the HDF back into the groove before closing the carcass.');
  case 'shelf': return WL('Pune suporții de poliță în găurile de 5 mm la înălțimea dorită și așază polițele.', 'Insert the shelf supports into the 5 mm holes at the height you want and place the shelves.');
  case 'drawer': return WL(`Asamblează cutiile sertarelor (laterale, spate, față interioară, fund). Montează glisierele în corp pe găurile pregătite${hw.glis ? ` (${hw.glis} ${WL('perechi', 'pairs')})` : ''} și introdu sertarele.`, `Assemble the drawer boxes (sides, back, inner front, bottom). Fit the runners in the carcass on the pre-drilled holes${hw.glis ? ` (${hw.glis} pairs)` : ''} and insert the drawers.`);
  case 'plinth': return WL(`Montează ${hw.pic || 4} picioare reglabile sub bază. Soclul se prinde după ce toate corpurile sunt aliniate și nivelate.`, `Fit ${hw.pic || 4} adjustable legs under the bottom. The plinth is clipped on after all cabinets are aligned and level.`);
  case 'fronts': return WL(`${hw.bal ? `Montează ${hw.bal} balamale: cupa Ø35 în ușă, talpa pe lateral. ` : ''}${hw.rab ? 'Montează sistemul rabatabil după instrucțiunile producătorului. ' : ''}Agață fronturile și reglează rosturile de ${st.gap} mm (șuruburile balamalei: sus-jos, stânga-dreapta, adâncime).${hw.man ? ` Montează ${hw.man} mânere.` : ''}`,
   `${hw.bal ? `Fit ${hw.bal} hinges: the Ø35 cup in the door, the plate on the side. ` : ''}${hw.rab ? 'Fit the lift-up system following the manufacturer instructions. ' : ''}Hang the fronts and adjust the gaps to ${st.gap} mm (hinge screws: up-down, left-right, depth).${hw.man ? ` Fit ${hw.man} handles.` : ''}`);
  default: return WL('Montează piesele rămase conform desenului.', 'Fit the remaining parts as shown in the drawing.');
 }
}
function asmFixing(it) {
 const cat = (TYPES[it.type] || {}).cat;
 if (cat === 'wall') return WL('Fixare pe perete: șină sau agățători reglabili, cu dibluri potrivite peretelui (beton, cărămidă, gips-carton). Verifică țevile și cablurile din perete înainte de a da găuri.', 'Wall fixing: rail or adjustable hangers, with plugs suited to the wall (concrete, brick, plasterboard). Check for pipes and cables before drilling.');
 if (cat === 'tall' || cat === 'ward') return WL('Corp înalt: prinde-l OBLIGATORIU de perete cu feronerie anti-răsturnare, după nivelare.', 'Tall unit: you MUST fix it to the wall with anti-tip hardware after levelling.');
 if (cat === 'base') return WL('Nivelează pe picioare, aliniază cu corpurile vecine și prinde-le între ele cu șuruburi de legătură prin laterale.', 'Level on the legs, align with neighbouring cabinets and join them through the sides with connecting screws.');
 return '';
}
function asmDrawFront(x, it, X, Y, k) {
 const parts = partsFor(it), W = it.w, H = it.h;
 x.strokeStyle = '#222'; x.lineWidth = 2; x.fillStyle = '#f4f1ea'; x.fillRect(X, Y, W * k, H * k); x.strokeRect(X, Y, W * k, H * k);
 parts.filter(p => /door|dfront|lift|front/.test(p.role)).forEach(p => {
  const px = X + (p.x0 + W / 2) * k, py = Y + (H - p.y1) * k, pw = (p.x1 - p.x0) * k, ph = (p.y1 - p.y0) * k;
  x.fillStyle = '#e4dccb'; x.fillRect(px, py, pw, ph); x.strokeStyle = '#555'; x.lineWidth = 1.5; x.strokeRect(px, py, pw, ph);
  if (p.role === 'door') { x.setLineDash([6, 5]); x.beginPath(); const hl = it.o && it.o.hinge === 'R' ? 1 : 0; // triunghi spre balamale
   if (hl) { x.moveTo(px, py); x.lineTo(px + pw, py + ph / 2); x.lineTo(px, py + ph); } else { x.moveTo(px + pw, py); x.lineTo(px, py + ph / 2); x.lineTo(px + pw, py + ph); } x.stroke(); x.setLineDash([]); }
 });
 x.fillStyle = '#333'; x.font = `500 ${Math.max(11, 22)}px Inter,Arial`; x.textAlign = 'center';
 x.fillText(`${Math.round(W)}`, X + W * k / 2, Y + H * k + 26); x.save(); x.translate(X - 14, Y + H * k / 2); x.rotate(-Math.PI / 2); x.fillText(`${Math.round(H)}`, 0, 0); x.restore(); x.textAlign = 'left';
}
async function exportAssemblyPDF() {
 const cabs = S.items.filter(i => i.kind === 'cab' && !i.hidden && !['panel', 'decor'].includes((TYPES[i.type] || {}).cat));
 if (!cabs.length) { toast(WL('Proiectul nu are corpuri', 'The project has no cabinets')); return; }
 const pf = getProfile() || {}, firm = pf.company || pf.name || 'Atelia Build', pages = [];
 /* copertă: ordinea montajului, scule, siguranță */
 let pg = newPage(false), x = pg.x, m = pg.mm, W = pg.c.width, y = m(20); pages.push(pg);
 x.fillStyle = '#111'; x.font = `700 ${m(9)}px Inter,Arial`; x.fillText(WL('Instrucțiuni de montaj', 'Assembly instructions'), m(15), y + m(6)); y += m(14);
 x.font = `400 ${m(4)}px Inter,Arial`; x.fillStyle = '#444'; x.fillText(`${S.name} · ${cabs.length} ${WL('corpuri', 'cabinets')} · ${firm}`, m(15), y); y += m(12);
 const block = (title, lines) => { x.fillStyle = '#111'; x.font = `700 ${m(4.8)}px Inter,Arial`; x.fillText(title, m(15), y); y += m(7); x.font = `400 ${m(3.6)}px Inter,Arial`; x.fillStyle = '#333';
  lines.forEach(t => { const words = t.split(' '); let line = ''; for (const w of words) { const test = line ? line + ' ' + w : w; if (x.measureText(test).width > W - m(36)) { x.fillText(line, m(20), y); y += m(5.2); line = w; } else line = test; } x.fillText(line, m(20), y); y += m(6.5); }); y += m(4); };
 block(WL('Scule necesare', 'Tools you need'), [WL('• Șurubelniță electrică cu bit PZ2 și bit hexagonal pentru confirmat', '• Cordless driver with PZ2 bit and hex bit for confirmat screws'), WL('• Nivelă, ruletă, echer, creion', '• Spirit level, tape measure, set square, pencil'), WL('• Bormașină și dibluri potrivite peretelui (pentru fixare)', '• Drill and wall plugs suited to your wall (for fixing)')]);
 block(WL('Ordinea recomandată în cameră', 'Recommended order in the room'), [WL('1. Măsoară camera și trasează pe perete linia de nivel a blatului și a corpurilor suspendate.', '1. Measure the room and mark the worktop level line and the wall-unit line on the wall.'),
  WL('2. Asamblează toate corpurile după paginile următoare (fiecare pagină = un corp, piesele au codul de pe etichetă).', '2. Assemble every cabinet following the next pages (one page per cabinet; parts carry the code from their label).'),
  WL('3. Montează corpurile suspendate, apoi corpurile jos și coloanele. Nivelează și prinde-le între ele.', '3. Install the wall units, then the base units and tall units. Level them and join them together.'),
  WL('4. Montează blatul, decupajele pentru chiuvetă și plită, apoi electrocasnicele.', '4. Fit the worktop, sink and hob cut-outs, then the appliances.'), WL('5. La final: fronturi, reglaje, mânere, soclu.', '5. Finally: fronts, adjustments, handles, plinth.')]);
 block(WL('Siguranță', 'Safety'), [WL('• Corpurile înalte și suspendate se prind obligatoriu de perete.', '• Tall and wall-mounted units must always be fixed to the wall.'), WL('• Înainte de a găuri peretele, verifică traseul țevilor și al cablurilor.', '• Before drilling, check where pipes and cables run.'),
  WL('• Racordurile de apă, gaz și electrice se fac doar de personal autorizat.', '• Water, gas and electrical connections must be made by qualified professionals.'), WL('• Instrucțiunile sunt generate automat din proiect; urmează și instrucțiunile producătorilor de feronerie și electrocasnice.', '• These instructions are generated from the project; also follow the hardware and appliance manufacturer instructions.')]);
 /* o pagină pe corp */
 for (const it of cabs) {
  const d = asmData(it); if (!d.cut.length) continue;
  pg = newPage(false); pages.push(pg); x = pg.x; m = pg.mm; W = pg.c.width; y = m(16);
  x.fillStyle = '#a8823c'; x.fillRect(m(15), y, m(18), m(10)); x.fillStyle = '#fff'; x.font = `700 ${m(5.5)}px Inter,Arial`; x.textAlign = 'center'; x.fillText(d.code, m(24), y + m(7.3)); x.textAlign = 'left';
  x.fillStyle = '#111'; x.font = `700 ${m(5.5)}px Inter,Arial`; x.fillText(T(TYPES[it.type].n), m(37), y + m(5)); x.font = `400 ${m(3.4)}px Inter,Arial`; x.fillStyle = '#555';
  x.fillText(`${Math.round(it.w)} × ${Math.round(it.h)} × ${Math.round(it.d)} mm · ${d.cut.length} ${WL('piese', 'parts')} · ${S.name}`, m(37), y + m(10)); y += m(16);
  const dk = Math.min(m(55) / it.w, m(60) / it.h); asmDrawFront(x, it, m(20), y, dk);
  /* tabel piese */
  let ty = y; const tx = m(85); x.font = `700 ${m(3.2)}px Inter,Arial`; x.fillStyle = '#111';
  [WL('Cod', 'Code'), WL('Piesă', 'Part'), 'mm'].forEach((h, i) => x.fillText(h, tx + [0, m(20), m(70)][i], ty)); ty += m(5);
  x.font = `400 ${m(3)}px Inter,Arial`; x.fillStyle = '#333';
  d.cut.slice(0, 22).forEach(p => { x.fillText(p.pid, tx, ty); x.fillText(T(p.name), tx + m(20), ty); x.fillText(`${p.L}×${p.W}×${p.th}`, tx + m(70), ty); ty += m(4.4); });
  if (d.cut.length > 22) { x.fillText(`+ ${d.cut.length - 22} ${WL('piese (vezi lista de debitare)', 'parts (see cut list)')}`, tx, ty); ty += m(4.4); }
  y = Math.max(y + it.h * dk + m(12), ty + m(4));
  const hwN = {bal: WL('balamale', 'hinges'), glis: WL('perechi glisiere', 'runner pairs'), man: WL('mânere', 'handles'), pic: WL('picioare', 'legs'), rab: WL('sisteme rabatabile', 'lift-up systems'), bara: WL('bare umeraș', 'hanging rails')};
  const hwTxt = Object.entries(d.hw).map(([k, v]) => `${v} ${hwN[k] || k}`).join(' · ');
  if (hwTxt) { x.fillStyle = '#f6f1e6'; x.fillRect(m(15), y - m(5), W - m(30), m(9)); x.fillStyle = '#111'; x.font = `600 ${m(3.4)}px Inter,Arial`; x.fillText(`${WL('Feronerie', 'Hardware')}: ${hwTxt}`, m(19), y + m(1)); y += m(11); }
  let n = 1;
  for (const g of d.groups) {
   if (y > pg.c.height - m(30)) { pg = newPage(false); pages.push(pg); x = pg.x; y = m(20); x.fillStyle = '#555'; x.font = `600 ${m(3.4)}px Inter,Arial`; x.fillText(`${d.code} · ${WL('continuare', 'continued')}`, m(15), y); y += m(10); }
   x.fillStyle = '#a8823c'; x.beginPath(); x.arc(m(19), y - m(1.3), m(3.2), 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.font = `700 ${m(3.4)}px Inter,Arial`; x.textAlign = 'center'; x.fillText(String(n++), m(19), y); x.textAlign = 'left';
   x.fillStyle = '#111'; x.font = `700 ${m(3.8)}px Inter,Arial`; x.fillText(g.n(), m(25), y); y += m(5.5);
   x.font = `400 ${m(3.2)}px Inter,Arial`; x.fillStyle = '#555'; x.fillText(`${WL('Piese', 'Parts')}: ${g.parts.map(p => p.pid).join(', ')}`.slice(0, 120), m(25), y); y += m(5);
   x.fillStyle = '#333'; const words = asmStepText(g, it, d.hw).split(' '); let line = '';
   for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > W - m(45)) { x.fillText(line, m(25), y); y += m(4.6); line = w; } else line = t; } x.fillText(line, m(25), y); y += m(8);
  }
  const fx = asmFixing(it); if (fx && y > pg.c.height - m(32)) { pg = newPage(false); pages.push(pg); x = pg.x; y = m(24); }
  if (fx) { x.fillStyle = '#2a1212'; x.fillRect(m(15), y - m(4), W - m(30), m(10)); x.fillStyle = '#fff'; x.font = `600 ${m(3.2)}px Inter,Arial`;
   const words = fx.split(' '); let line = '', yy = y + m(1.2); for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > W - m(40)) { x.fillText(line, m(19), yy); yy += m(4.4); line = w; } else line = t; } x.fillText(line, m(19), yy); }
  x.fillStyle = '#aaa'; x.font = `400 ${m(2.6)}px Inter,Arial`; x.fillText(`${firm} · ${WL('Generat cu Atelia Build', 'Generated with Atelia Build')}`, m(15), pg.c.height - m(10));
 }
 await pagesToPDF(pages, `Atelia_${fileSafe()}_${WL('instructiuni_montaj', 'assembly_instructions')}.pdf`);
}
EXPORTS.push({id: 'asm', ic: '🔧', n: WL('Instrucțiuni de montaj (PDF)', 'Assembly instructions (PDF)'), d: WL('Pas cu pas pentru fiecare corp, cu codurile de pe etichete, feronerie, ordinea în cameră și siguranță. Pentru atelier, montator sau client.', 'Step by step for every cabinet, with label codes, hardware, room order and safety. For the workshop, installer or client.'), roles: ['mobila', 'client', 'designer', 'constructor', 'arhitect'], fn: exportAssemblyPDF});
