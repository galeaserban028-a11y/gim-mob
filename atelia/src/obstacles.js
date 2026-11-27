/* ================== UNIC 4: OBSTACOLE PE PERETE + VERIFICARE CONFLICTE ==================
   Prize, întrerupătoare, apă, scurgere, gaz, calorifere, ferestre, uși, tablou electric, aerisire —
   puse pe pereți după măsurători (cu poza peretelui ca referință), afișate în 3D și verificate
   automat față de corpuri: ce rămâne acoperit, ce nu mai e accesibil, ce intră în fereastră. */
const OBST = {
 priza:   {n: WL('Priză', 'Socket'), c: '#e0b23c', w: 80, h: 80, e: 1100},
 intrer:  {n: WL('Întrerupător', 'Switch'), c: '#c9c9c9', w: 80, h: 80, e: 1200},
 apa:     {n: WL('Apă (robinet colțar)', 'Water (angle valve)'), c: '#3c8ee0', w: 120, h: 60, e: 500},
 scurg:   {n: WL('Scurgere', 'Drain'), c: '#2b5d8f', w: 60, h: 60, e: 450},
 gaz:     {n: WL('Robinet gaz', 'Gas valve'), c: '#e05a3c', w: 80, h: 80, e: 600},
 calor:   {n: WL('Calorifer', 'Radiator'), c: '#9a9a9a', w: 800, h: 600, e: 150},
 fereastra: {n: WL('Fereastră', 'Window'), c: '#8fd0ff', w: 1200, h: 1400, e: 900},
 usa:     {n: WL('Ușă', 'Door'), c: '#b88a5a', w: 900, h: 2050, e: 0},
 tablou:  {n: WL('Tablou electric', 'Electrical panel'), c: '#7a3ce0', w: 300, h: 400, e: 1500},
 aerisire:{n: WL('Aerisire / ventilație', 'Air vent'), c: '#5ac08a', w: 150, h: 150, e: 2200}};
const WALLS = {back: WL('Spate', 'Back'), left: WL('Stânga', 'Left'), right: WL('Dreapta', 'Right')};
let obstGroup = null;
function obstBuild() {
 if (!obstGroup) { obstGroup = new THREE.Group(); scene.add(obstGroup); }
 while (obstGroup.children.length) { const c = obstGroup.children.pop(); c.geometry && c.geometry.dispose(); c.material && c.material.dispose(); }
 const R = S.room;
 (S.obstacles || []).forEach(o => { const t = OBST[o.type]; if (!t) return;
  const m = new THREE.Mesh(new THREE.BoxGeometry(o.w * MM, o.h * MM, 0.012), new THREE.MeshBasicMaterial({color: t.c, transparent: true, opacity: o.type === 'fereastra' ? 0.45 : 0.85}));
  m.raycast = () => {}; const y = (o.e + o.h / 2) * MM;
  if (o.wall === 'left') { m.position.set(0.007, y, o.s * MM); m.rotation.y = Math.PI / 2; }
  else if (o.wall === 'right') { m.position.set(R.w * MM - 0.007, y, o.s * MM); m.rotation.y = -Math.PI / 2; }
  else m.position.set(o.s * MM, y, 0.007);
  obstGroup.add(m); });
}
{ const _rb = rebuildAll; rebuildAll = function () { _rb(); try { obstBuild(); } catch (e) {} }; }
setTimeout(() => { try { obstBuild(); } catch (e) {} }, 600);
/* verificări */
{
 const _rc = runChecks;
 runChecks = function () {
  const out = _rc(), cabs = S.items.filter(i => i.kind === 'cab' && !i.hidden);
  for (const o of S.obstacles || []) {
   const t = OBST[o.type]; if (!t) continue; const nm = `${t.n} (${WALLS[o.wall]}, ${o.s} mm)`;
   const hits = cabs.filter(c => c.wall === o.wall && (c.off || 0) < 100 && Math.abs(c.s - o.s) < (c.w + o.w) / 2 - 5 && c.e < o.e + o.h - 5 && c.e + c.h > o.e + 5);
   const cat = c => (TYPES[c.type] || {}).cat, inSink = hits.some(c => TYPES[c.type].sink || TYPES[c.type].dish);
   if (!hits.length) { if ((o.type === 'apa' || o.type === 'scurg') && !cabs.some(c => TYPES[c.type].sink && c.wall === o.wall && Math.abs(c.s - o.s) < c.w / 2 + 300)) out.push({lvl: 'info', id: null, msg: `${nm}: ${WL('nu e în dreptul corpului chiuvetă — verifică traseul', 'is not behind the sink unit — check the route')}`}); continue; }
   const h = hits[0], code = cabCode(h);
   if (o.type === 'fereastra' || o.type === 'usa') out.push({lvl: 'err', id: h.id, msg: `${code} ${WL('acoperă', 'covers')} ${nm.toLowerCase()}`});
   else if (o.type === 'calor') out.push({lvl: 'err', id: h.id, msg: `${code} ${WL('stă peste calorifer', 'sits over the radiator')} — ${WL('mută corpul sau caloriferul', 'move the cabinet or the radiator')}`});
   else if (o.type === 'tablou') out.push({lvl: 'err', id: h.id, msg: `${code} ${WL('acoperă tabloul electric — trebuie să rămână accesibil', 'covers the electrical panel — it must stay accessible')}`});
   else if (o.type === 'aerisire') out.push({lvl: 'err', id: h.id, msg: `${code} ${WL('blochează aerisirea', 'blocks the air vent')}`});
   else if (o.type === 'gaz') out.push({lvl: 'warn', id: h.id, msg: `${code}: ${WL('robinetul de gaz trebuie să rămână accesibil — lasă ușă sau decupaj în spate', 'the gas valve must stay accessible — keep a door or a cut-out in the back')}`});
   else if (o.type === 'priza' || o.type === 'intrer') { if (inSink) out.push({lvl: 'info', id: h.id, msg: `${code}: ${nm} ${WL('în corp — fă decupaj în spate și protejează de apă', 'inside the unit — cut out the back and protect from water')}`});
    else if (cat(h) === 'tall' || cat(h) === 'ward') out.push({lvl: 'warn', id: h.id, msg: `${code} ${WL('acoperă', 'covers')} ${nm.toLowerCase()} — ${WL('mut-o (ex. deasupra coloanei) sau fă decupaj', 'move it (e.g. above the tall unit) or make a cut-out')}`});
    else out.push({lvl: 'warn', id: h.id, msg: `${code} ${WL('acoperă', 'covers')} ${nm.toLowerCase()} — ${WL('decupaj în spate sau mut-o deasupra blatului', 'cut out the back or move it above the worktop')}`}); }
   else if ((o.type === 'apa' || o.type === 'scurg') && !inSink) out.push({lvl: 'warn', id: h.id, msg: `${nm} ${WL('e în spatele lui', 'is behind')} ${code}, ${WL('nu al chiuvetei', 'not the sink unit')}`});
  }
  return out;
 };
}
function wallPhotoKey(w) { return 'atelia.wallphoto.' + w; }
function openObstacles() {
 const list = S.obstacles || [], R = S.room;
 modalState = {obst: 1};
 const wallOpts = Object.entries(WALLS).filter(([k]) => k === 'back' || (k === 'left' && R.left) || (k === 'right' && R.right));
 openModal(`${mhead(WL('Perete: prize, țevi, ferestre', 'Wall: sockets, pipes, windows'), WL('Pune ce există pe pereți — verific automat ce acoperă mobila', 'Add what is on the walls — I check automatically what the cabinets cover'))}
 ${list.length ? `<div class="plist">${list.map(o => `<div class="pitem"><i style="width:12px;height:12px;border-radius:3px;background:${OBST[o.type].c};flex:none"></i><span style="flex:1">${esc(OBST[o.type].n)} · ${esc(WALLS[o.wall])} · ${WL('la', 'at')} ${o.s} mm · h ${o.e} mm · ${o.w}×${o.h}</span><button class="ckb" data-odel="${o.id}">${WL('Șterge', 'Delete')}</button></div>`).join('')}</div>` : `<div class="note">${WL('Niciun obstacol încă. Măsoară de la colțul din stânga al peretelui (sau colțul cu peretele din spate, pe pereții laterali) până la mijlocul obiectului.', 'No items yet. Measure from the left corner of the wall (or from the back-wall corner on side walls) to the centre of the item.')}</div>`}
 <div class="sec" style="margin-top:12px"><div class="lab">${WL('Adaugă', 'Add')}</div><div class="pfgrid">
 <label class="pf"><span>${WL('Ce', 'What')}</span><select class="inp" id="obT">${Object.entries(OBST).map(([k, t]) => `<option value="${k}">${esc(t.n)}</option>`).join('')}</select></label>
 <label class="pf"><span>${WL('Perete', 'Wall')}</span><select class="inp" id="obW">${wallOpts.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select></label>
 <label class="pf"><span>${WL('Distanța din colț până la mijloc (mm)', 'Distance from corner to centre (mm)')}</span><input class="inp" type="number" id="obS" value="1000"></label>
 <label class="pf"><span>${WL('Înălțime de la pardoseală până jos (mm)', 'Height from floor to bottom (mm)')}</span><input class="inp" type="number" id="obE"></label>
 <label class="pf"><span>${WL('Lățime (mm)', 'Width (mm)')}</span><input class="inp" type="number" id="obWd"></label><label class="pf"><span>${WL('Înălțime (mm)', 'Height (mm)')}</span><input class="inp" type="number" id="obH"></label></div>
 <button class="btn gold wide" id="obAdd" style="margin-top:8px">${WL('Adaugă pe perete', 'Add to wall')}</button></div>
 <div class="sec" style="margin-top:12px"><div class="lab">${WL('Poza peretelui (referință)', 'Wall photo (reference)')}</div>
 <div class="ckbtns">${wallOpts.map(([k, n]) => `<label class="ckb" style="text-align:center">${esc(n)}: ${LS.get(wallPhotoKey(k)) ? '✓ ' : ''}${WL('poză', 'photo')}<input type="file" accept="image/*" capture="environment" data-wph="${k}" hidden></label>`).join('')}</div>
 <div id="obPh" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${wallOpts.map(([k]) => LS.get(wallPhotoKey(k)) ? `<img src="${LS.get(wallPhotoKey(k))}" alt="" style="height:110px;border-radius:8px;border:1px solid var(--line)">` : '').join('')}</div>
 <div class="note" style="margin-top:6px">${WL('Fă poza drept, cu ruleta întinsă pe perete — o folosești ca să citești cotele. Poza rămâne doar pe acest dispozitiv.', 'Take the photo straight on, with a tape measure along the wall — use it to read the dimensions. The photo stays on this device only.')}</div></div>
 <div class="legal-links">${WL('Pozițiile reale ale instalațiilor se verifică la fața locului; detectează țevile și cablurile înainte de a găuri.', 'Verify real service positions on site; detect pipes and cables before drilling.')}</div>`, true);
 const fill = () => { const t = OBST[$('#obT').value]; $('#obE').value = t.e; $('#obWd').value = t.w; $('#obH').value = t.h; }; fill(); $('#obT').onchange = fill;
 $('#obAdd').onclick = () => { const o = {id: nid(), type: $('#obT').value, wall: $('#obW').value, s: Math.round(+$('#obS').value || 0), e: Math.round(+$('#obE').value || 0), w: Math.max(20, Math.round(+$('#obWd').value || 0)), h: Math.max(20, Math.round(+$('#obH').value || 0))};
  mutate(() => { S.obstacles = (S.obstacles || []).concat(o); }); obstBuild(); openObstacles(); toast(WL('Adăugat — apasă Verifică', 'Added — press Check')); };
 $$('[data-odel]').forEach(b => b.onclick = () => { mutate(() => { S.obstacles = (S.obstacles || []).filter(o => o.id !== b.dataset.odel); }); obstBuild(); openObstacles(); });
 $$('[data-wph]').forEach(inp => inp.onchange = async e => { const f = e.target.files[0]; if (!f) return; try {
  const url = await readAs(f, 'readAsDataURL'), [iw, ih] = await imageSize(url), k = Math.min(1, 1400 / Math.max(iw, ih)), c = document.createElement('canvas'); c.width = Math.round(iw * k); c.height = Math.round(ih * k);
  const im = new Image(); im.src = url; await im.decode(); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  try { localStorage.setItem(wallPhotoKey(inp.dataset.wph), c.toDataURL('image/jpeg', 0.8)); } catch (er) { toast(WL('Poza nu încape în memorie', 'Photo does not fit in storage')); }
  openObstacles(); } catch (er) { toast(er.message); } });
}
(() => {
 const nav = $('#tools'), ref = $('#tRoom'); if (!nav) return;
 const b = document.createElement('button'); b.id = 'tObst';
 b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8v4M13 10h4M7 17h10"/></svg><span>' + WL('Perete', 'Wall') + '</span>';
 b.onclick = openObstacles; nav.insertBefore(b, ref);
})();
