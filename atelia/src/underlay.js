/* ================== 3. IMPORT PLAN (Atelia) ==================
   Pui planul existent sub proiect, la scară reală, și desenezi peste el.
   - DXF (din AutoCAD / ArchiCAD): scară automată din unități, poți seta camera la dimensiunile planului
   - Imagine (JPG/PNG, poză sau captură din PDF): introduci lățimea reală a imaginii în mm */
let ulMesh = null, ulState = null;
function ulKey() { return 'atelia.underlay'; }
function parseDXF(txt) {
 const L = txt.split(/\r?\n/).map(s => s.trim()); const pairs = [];
 for (let i = 0; i + 1 < L.length; i += 2) pairs.push([parseInt(L[i], 10), L[i + 1]]);
 let unit = 1; const segs = [];
 const ui = pairs.findIndex(p => p[0] === 9 && p[1] === '$INSUNITS');
 if (ui >= 0) { const u = +(pairs[ui + 1] || [])[1]; unit = {1: 25.4, 2: 304.8, 4: 1, 5: 10, 6: 1000}[u] || 1; }
 let i = pairs.findIndex(p => p[0] === 2 && p[1] === 'ENTITIES'); if (i < 0) i = 0;
 while (i < pairs.length) {
  const [c, v] = pairs[i];
  if (c === 0 && (v === 'LINE' || v === 'LWPOLYLINE' || v === 'POLYLINE' || v === 'CIRCLE' || v === 'ARC')) {
   const ent = {type: v, xs: [], ys: [], flags: 0}; i++;
   while (i < pairs.length && pairs[i][0] !== 0) { const [cc, vv] = pairs[i]; const n = parseFloat(vv);
    if (cc === 10) ent.xs.push(n); else if (cc === 20) ent.ys.push(n); else if (cc === 11) ent.x2 = n; else if (cc === 21) ent.y2 = n; else if (cc === 70) ent.flags = n; else if (cc === 40) ent.r = n; else if (cc === 50) ent.a1 = n; else if (cc === 51) ent.a2 = n; i++; }
   if (v === 'POLYLINE') { while (i < pairs.length && !(pairs[i][0] === 0 && pairs[i][1] === 'SEQEND')) { if (pairs[i][0] === 10) ent.xs.push(parseFloat(pairs[i][1])); if (pairs[i][0] === 20) ent.ys.push(parseFloat(pairs[i][1])); i++; } }
   if (v === 'LINE' && ent.xs.length) segs.push([ent.xs[0], ent.ys[0], ent.x2, ent.y2]);
   if ((v === 'LWPOLYLINE' || v === 'POLYLINE') && ent.xs.length > 1) { const n = Math.min(ent.xs.length, ent.ys.length);
    for (let k = 0; k < n - 1; k++) segs.push([ent.xs[k], ent.ys[k], ent.xs[k + 1], ent.ys[k + 1]]);
    if (ent.flags & 1) segs.push([ent.xs[n - 1], ent.ys[n - 1], ent.xs[0], ent.ys[0]]); }
   if ((v === 'CIRCLE' || v === 'ARC') && ent.xs.length && ent.r) { const a1 = v === 'ARC' ? ent.a1 * Math.PI / 180 : 0, a2 = v === 'ARC' ? ent.a2 * Math.PI / 180 : Math.PI * 2; let span = a2 - a1; if (span <= 0) span += Math.PI * 2;
    const N = 24; for (let k = 0; k < N; k++) { const t0 = a1 + span * k / N, t1 = a1 + span * (k + 1) / N; segs.push([ent.xs[0] + ent.r * Math.cos(t0), ent.ys[0] + ent.r * Math.sin(t0), ent.xs[0] + ent.r * Math.cos(t1), ent.ys[0] + ent.r * Math.sin(t1)]); } }
   continue;
  }
  i++;
 }
 const ok = segs.filter(s => s.every(Number.isFinite)); if (!ok.length) throw new Error('Nu am găsit linii în DXF');
 let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
 ok.forEach(s => { x0 = Math.min(x0, s[0], s[2]); x1 = Math.max(x1, s[0], s[2]); y0 = Math.min(y0, s[1], s[3]); y1 = Math.max(y1, s[1], s[3]); });
 const wmm = (x1 - x0) * unit, dmm = (y1 - y0) * unit;
 if (wmm < 300 || dmm < 300 || wmm > 100000 || dmm > 100000) throw new Error(`Dimensiuni neobișnuite (${Math.round(wmm)} × ${Math.round(dmm)} mm) — verifică unitățile DXF`);
 const k = Math.min(1, 2048 / Math.max(wmm, dmm)) * 1, c = document.createElement('canvas'); c.width = Math.max(64, Math.round(wmm * k)); c.height = Math.max(64, Math.round(dmm * k));
 const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = '#1d3fbf'; g.lineWidth = Math.max(1.5, c.width / 900);
 g.beginPath(); ok.forEach(s => { g.moveTo((s[0] - x0) * unit * k, (y1 - s[1]) * unit * k); g.lineTo((s[2] - x0) * unit * k, (y1 - s[3]) * unit * k); }); g.stroke();
 return {url: c.toDataURL('image/png'), w: Math.round(wmm), d: Math.round(dmm), lines: ok.length};
}
function applyUnderlay(st) {
 if (ulMesh) { scene.remove(ulMesh); ulMesh.geometry && ulMesh.geometry.dispose && ulMesh.geometry.dispose(); ulMesh.material && ulMesh.material.dispose && ulMesh.material.dispose(); ulMesh = null; }
 ulState = st || null;
 if (!st) { try { localStorage.removeItem(ulKey()); } catch (e) {} return; }
 try { LS.set(ulKey(), JSON.stringify(st)); } catch (e) {}
 const tex = new THREE.TextureLoader().load(st.url); tex.colorSpace = THREE.SRGBColorSpace;
 const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true, opacity: st.op ?? 0.8, depthWrite: false});
 ulMesh = new THREE.Mesh(new THREE.PlaneGeometry(st.w * MM, st.d * MM), mat);
 ulMesh.rotation.x = -Math.PI / 2; ulMesh.position.set((st.x + st.w / 2) * MM, 0.003, (st.z + st.d / 2) * MM); ulMesh.renderOrder = 1; ulMesh.raycast = () => {};
 scene.add(ulMesh);
}
function imageSize(url) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res([im.width, im.height]); im.onerror = () => rej(new Error('Imagine invalidă')); im.src = url; }); }
function readAs(file, how) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r[how](file); }); }
function openUnderlay() {
 const st = ulState;
 modalState = {underlay: 1};
 openModal(`${mhead('Importă plan', 'Pune planul existent sub proiect, la scară reală')}
 <div class="note" style="margin-bottom:10px"><b>DXF</b> (din AutoCAD, ArchiCAD, Revit): scara se citește automat. <b>Imagine</b> (JPG/PNG — poză, scanare sau captură din PDF): scrii cât măsoară în realitate lățimea imaginii.</div>
 <label class="ckb" style="display:block;text-align:center">Alege fișier DXF sau imagine<input type="file" id="ulFile" accept=".dxf,image/*" hidden></label>
 <div id="ulCfg"></div>
 ${st ? `<div class="sec" style="margin-top:12px"><div class="lab">Plan curent: ${st.w} × ${st.d} mm</div>
 <label class="fld"><span>Mută stânga/dreapta</span><input type="number" id="ulX" value="${st.x}"><i>mm</i></label>
 <label class="fld"><span>Mută față/spate</span><input type="number" id="ulZ" value="${st.z}"><i>mm</i></label>
 <label class="fld"><span>Opacitate</span><input type="range" id="ulOp" min="0.2" max="1" step="0.05" value="${st.op ?? 0.8}"><i></i></label>
 <div class="ckbtns" style="margin-top:8px"><button class="ckb" id="ulRoom">Camera = dimensiunile planului</button><button class="ckb" id="ulDel">Scoate planul</button></div></div>` : ''}
 <div class="legal-links">Planul rămâne doar în browserul tău. Verifică întotdeauna cotele importate cu măsurători la fața locului.</div>`, true);
 const upd = () => { const s = Object.assign({}, ulState, {x: +$('#ulX').value || 0, z: +$('#ulZ').value || 0, op: +$('#ulOp').value}); applyUnderlay(s); };
 if (st) { $('#ulX').onchange = upd; $('#ulZ').onchange = upd; $('#ulOp').oninput = upd;
  $('#ulDel').onclick = () => { applyUnderlay(null); toast('Plan scos'); closeModal(true); };
  $('#ulRoom').onclick = () => { mutate(() => { S.room.w = Math.max(1200, ulState.w); S.room.d = Math.max(1200, ulState.d); }); rebuildAll(); applyUnderlay(Object.assign({}, ulState, {x: 0, z: 0})); toast(`Camera: ${S.room.w} × ${S.room.d} mm`); closeModal(true); }; }
 $('#ulFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
   if (/\.dxf$/i.test(f.name)) {
    if (f.size > 15e6) throw new Error('DXF prea mare (max 15 MB)');
    const r = parseDXF(await readAs(f, 'readAsText'));
    $('#ulCfg').innerHTML = `<div class="legalbox" style="margin-top:10px">Am citit <b>${r.lines}</b> linii · plan de <b>${r.w} × ${r.d} mm</b>.</div><div class="ckbtns" style="margin-top:8px"><button class="ckb" id="ulPut">Pune sub proiect</button><button class="btn gold" id="ulPutRoom">Pune + camera la aceste dimensiuni</button></div>`;
    const put = room => { if (room) { mutate(() => { S.room.w = r.w; S.room.d = r.d; }); rebuildAll(); } applyUnderlay({url: r.url, w: r.w, d: r.d, x: 0, z: 0, op: 0.8}); setCam('top'); closeModal(true); toast('Plan importat — desenează peste el cu Spațiu'); };
    $('#ulPut').onclick = () => put(false); $('#ulPutRoom').onclick = () => put(true);
   } else {
    if (f.size > 12e6) throw new Error('Imagine prea mare (max 12 MB)');
    const url = await readAs(f, 'readAsDataURL'); const [iw, ih] = await imageSize(url);
    $('#ulCfg').innerHTML = `<label class="fld" style="margin-top:10px"><span>Lățimea reală a imaginii</span><input type="number" id="ulW" value="${S.room.w}"><i>mm</i></label><div class="note">Sfat: decupează imaginea exact pe pereții camerei, apoi scrie lățimea camerei.</div><button class="btn gold wide" id="ulPutImg" style="margin-top:8px">Pune sub proiect</button>`;
    $('#ulPutImg').onclick = () => { const w = Math.round(+$('#ulW').value); if (!(w >= 300 && w <= 100000)) { toast('Lățime invalidă'); return; }
     const d = Math.round(w * ih / iw); applyUnderlay({url, w, d, x: 0, z: 0, op: 0.8}); setCam('top'); closeModal(true); toast(`Plan pus: ${w} × ${d} mm`); };
   }
  } catch (er) { toast(er.message); }
 };
}
(() => {
 try { const s = JSON.parse(LS.get(ulKey()) || 'null'); if (s && s.url) setTimeout(() => applyUnderlay(s), 500); } catch (e) {}
 const nav = $('#tools'), ref = $('#tRoom'); if (!nav) return;
 const b = document.createElement('button'); b.id = 'tPlan';
 b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 12h7v9M14 3v8h7"/></svg><span>Plan</span>';
 b.onclick = openUnderlay; nav.insertBefore(b, ref);
})();
