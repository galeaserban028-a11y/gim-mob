/* ================== UNIC 3: PROIECT PARTAJAT ÎNTRE MESERII + APROBARE CLIENT ==================
   Fără server: proiectul e comprimat în link, după „#” — partea asta nu e trimisă niciunui server.
   Note pe meserii (arhitect → atelier → instalator → client) și aprobare cu amprentă SHA-256:
   dacă proiectul se schimbă după aprobare, amprenta nu mai corespunde. */
const b64u = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); }; const _b64uFix = s => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
async function zip(str) { const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(new TextEncoder().encode(str)); w.close(); return _b64uFix(b64u(await new Response(cs.readable).arrayBuffer())); }
async function unzip(s) { const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter(); w.write(unb64u(s)); w.close(); return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer()); }
/* amprenta proiectului: tot ce contează pentru execuție (fără note și aprobări) */
async function projHash() {
 const o = JSON.parse(ser()); delete o.notes; delete o.approvals; delete o.pid;
 const bytes = new TextEncoder().encode(JSON.stringify(o));
 if (window.crypto && crypto.subtle) { const d = await crypto.subtle.digest('SHA-256', bytes); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join(''); }
 return sha256Fallback(bytes);
}

/* SHA-256 de rezervă (pentru contexte fără crypto.subtle, ex. fișier deschis local) */
function sha256Fallback(m) {
 const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
 const l = m.length, n = ((l + 9 + 63) >> 6) << 6, b = new Uint8Array(n); b.set(m); b[l] = 0x80; const dv = new DataView(b.buffer); dv.setUint32(n - 4, l * 8 >>> 0); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
 const w = new Uint32Array(64), r = (x, k) => (x >>> k) | (x << (32 - k));
 for (let o = 0; o < n; o += 64) {
  for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
  for (let i = 16; i < 64; i++) { const s0 = r(w[i-15], 7) ^ r(w[i-15], 18) ^ (w[i-15] >>> 3), s1 = r(w[i-2], 17) ^ r(w[i-2], 19) ^ (w[i-2] >>> 10); w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0; }
  let [a, b2, c, d, e, f, g, h] = H;
  for (let i = 0; i < 64; i++) { const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b2) ^ (a & c) ^ (b2 & c))) >>> 0;
   h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b2; b2 = a; a = (t1 + t2) >>> 0; }
  H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b2) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0; H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
 }
 return H.map(x => x.toString(16).padStart(8, '0')).join('');
}
const roleName = r => (ROLES[r] ? ROLES[r].n : WL('utilizator', 'user'));
function openShare() {
 const pf = getProfile() || {}, notes = S.notes || [];
 modalState = {share: 1};
 openModal(`${mhead(WL('Trimite proiectul', 'Send the project'), WL('Arhitect → atelier → instalator → client, pe același proiect', 'Architect → workshop → installer → client, on the same project'))}
 <div class="pfgrid"><label class="pf"><span>${WL('Către', 'To')}</span><select class="inp" id="shTo">${Object.entries(ROLES).map(([k, r]) => `<option value="${k}">${esc(r.n)}</option>`).join('')}</select></label>
 <label class="pf" style="grid-column:1/-1"><span>${WL('Notă pentru destinatar (rămâne în proiect)', 'Note for the recipient (stays in the project)')}</span><textarea class="inp" id="shMsg" rows="3" maxlength="600" placeholder="${WL('ex: priza de la frigider trebuie mutată la 2050 mm; vă rog confirmați culorile', 'e.g. the fridge socket must move to 2050 mm; please confirm the colours')}"></textarea></label></div>
 ${notes.length ? `<div class="lab" style="margin-top:10px">${WL('Istoric note', 'Note history')}</div><div class="plist">${notes.slice(-8).map(n => `<div class="pitem"><span><b>${esc(n.by || '')}</b> <small style="color:var(--mut)">(${esc(roleName(n.role))} → ${esc(roleName(n.to))}, ${new Date(n.at).toLocaleString(LANG === 'en' ? 'en-GB' : 'ro-RO')})</small><br>${esc(n.text)}</span></div>`).join('')}</div>` : ''}
 <div class="ckbtns" style="margin-top:12px"><button class="btn gold" id="shGo">${WL('Creează link', 'Create link')}</button><button class="ckb" id="shApr">${WL('Verifică o aprobare primită', 'Verify a received approval')}</button></div>
 <div id="shOut"></div>
 <div class="legal-links">${WL('Proiectul călătorește în link, nu pe un server. Oricine are linkul poate vedea proiectul — trimite-l doar persoanelor potrivite.', 'The project travels inside the link, not on a server. Anyone with the link can see the project — send it only to the right people.')}</div>`, true);
 $('#shGo').onclick = async () => {
  const to = $('#shTo').value, text = $('#shMsg').value.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, 600);
  if (text) mutate(() => { S.notes = (S.notes || []).concat({by: pf.company || pf.name || '', role: pf.role || '', to, text, at: new Date().toISOString()}).slice(-30); });
  const payload = JSON.stringify({v: 1, s: JSON.parse(ser()), from: {name: pf.name || '', company: pf.company || '', role: pf.role || ''}, to, at: new Date().toISOString()});
  const z = await zip(payload), url = location.origin + location.pathname + '#p=' + z;
  if (url.length > 60000) { $('#shOut').innerHTML = `<div class="note" style="margin-top:10px">${WL('Proiectul e prea mare pentru un link. Trimite fișierul proiectului (Proiecte → Descarcă fișier proiect).', 'The project is too large for a link. Send the project file instead (Projects → Download project file).')}</div>`; return; }
  const msg = WL(`Proiect „${S.name}” trimis din Atelia Build${text ? ': ' + text : ''}\n`, `Project “${S.name}” sent from Atelia Build${text ? ': ' + text : ''}\n`) + url;
  $('#shOut').innerHTML = `<div class="legalbox" style="margin-top:10px;word-break:break-all"><small>${url.length.toLocaleString()} ${WL('caractere', 'characters')}</small><div class="ckbtns" style="margin-top:8px"><button class="ckb" id="shCopy">${WL('Copiază linkul', 'Copy link')}</button><a class="ckb" id="shWa" target="_blank" rel="noopener" style="text-align:center;text-decoration:none">WhatsApp</a><a class="ckb" id="shMail" style="text-align:center;text-decoration:none">E-mail</a></div></div>`;
  $('#shWa').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
  $('#shMail').href = `mailto:?subject=${encodeURIComponent('Atelia Build — ' + S.name)}&body=${encodeURIComponent(msg)}`;
  $('#shCopy').onclick = async () => { try { await navigator.clipboard.writeText(url); toast(WL('Link copiat', 'Link copied')); } catch (e) { $('#shOut').insertAdjacentHTML('beforeend', `<textarea class="inp" rows="3" style="width:100%;margin-top:8px" readonly>${esc(url)}</textarea>`); } };
 };
 $('#shApr').onclick = openVerifyApproval;
}
function openVerifyApproval() {
 modalState = {verify: 1};
 openModal(`${mhead(WL('Verifică aprobarea clientului', 'Verify the client approval'), WL('Lipește mesajul de aprobare primit', 'Paste the approval message you received'))}
 <textarea class="inp" id="vaTxt" rows="5" style="width:100%"></textarea><button class="btn gold wide" id="vaGo" style="margin-top:8px">${WL('Verifică', 'Verify')}</button><div id="vaOut"></div>`, true);
 $('#vaGo').onclick = async () => {
  const m = $('#vaTxt').value.match(/\b([0-9a-f]{16,64})\b/i); const h = await projHash();
  const ok = m && h.startsWith(m[1].toLowerCase());
  $('#vaOut').innerHTML = `<div class="legalbox" style="margin-top:10px;border-color:${ok ? '#2f7d4f' : '#7d2f2f'}">${!m ? WL('Nu am găsit codul de aprobare în text.', 'No approval code found in the text.') : ok ? WL('✅ Aprobarea corespunde exact versiunii curente a proiectului.', '✅ The approval matches the current project version exactly.') : WL('⚠️ Proiectul a fost modificat după aprobare (sau aprobarea e pentru alt proiect). Cere o nouă aprobare.', '⚠️ The project changed after approval (or the approval is for another project). Ask for a new approval.')}</div>`;
  if (ok) mutate(() => { S.approvals = (S.approvals || []).concat({text: $('#vaTxt').value.replace(/[<>]/g, '').slice(0, 500), hash: h, at: new Date().toISOString()}).slice(-10); });
 };
}
async function openApprove(from) {
 const h = await projHash(), P = production(), V = vatInfo(P.total), pf = getProfile() || {};
 modalState = {approve: 1};
 openModal(`${mhead(WL('Aprobă proiectul', 'Approve the project'), esc(S.name))}
 <div class="legalbox">${WL('Verifică proiectul în 3D (rotește, deschide fronturile). Dacă totul e în regulă, aprobă-l — trimiți înapoi un cod care arată exact ce versiune ai aprobat.', 'Check the project in 3D (rotate, open the fronts). If everything is right, approve it — you send back a code proving exactly which version you approved.')}
 <div style="margin-top:8px"><b>${WL('Preț estimat', 'Estimated price')}: ${money(V.gross)}</b>${V.payer ? ` ${WL('cu TVA', 'incl. VAT')}` : ''}</div></div>
 <label class="pf" style="margin-top:10px"><span>${WL('Numele tău', 'Your name')}</span><input class="inp" id="apN" value="${esc(pf.name || '')}"></label>
 <label class="chk"><input type="checkbox" id="apOk"><span>${WL('Am verificat proiectul (dimensiuni, culori, preț estimat) și îl aprob. Înțeleg că prețul final se confirmă după măsurători.', 'I have checked the project (dimensions, colours, estimated price) and approve it. I understand the final price is confirmed after measurement.')}</span></label>
 <button class="btn gold wide" id="apGo" disabled style="margin-top:10px">${WL('Aprob și trimit codul', 'Approve and send the code')}</button><div id="apOut"></div>`, true);
 $('#apOk').onchange = () => { $('#apGo').disabled = !$('#apOk').checked; };
 $('#apGo').onclick = () => {
  const name = $('#apN').value.replace(/[<>]/g, '').trim().slice(0, 80); if (!name) { toast(WL('Scrie-ți numele', 'Enter your name')); return; }
  const when = new Date().toLocaleString(LANG === 'en' ? 'en-GB' : 'ro-RO');
  const txt = WL(`APROBARE PROIECT — Atelia Build\nProiect: ${S.name}\nAprob versiunea cu codul: ${h.slice(0, 24)}\nPreț estimat: ${money(V.gross)}\nNume: ${name}\nData: ${when}`, `PROJECT APPROVAL — Atelia Build\nProject: ${S.name}\nI approve the version with code: ${h.slice(0, 24)}\nEstimated price: ${money(V.gross)}\nName: ${name}\nDate: ${when}`);
  mutate(() => { S.approvals = (S.approvals || []).concat({text: txt, hash: h, at: new Date().toISOString()}).slice(-10); });
  $('#apOut').innerHTML = `<div class="legalbox" style="margin-top:10px;white-space:pre-wrap">${esc(txt)}<div class="ckbtns" style="margin-top:8px"><a class="ckb" target="_blank" rel="noopener" style="text-align:center;text-decoration:none" href="https://wa.me/?text=${encodeURIComponent(txt)}">WhatsApp</a><a class="ckb" style="text-align:center;text-decoration:none" href="mailto:?subject=${encodeURIComponent(WL('Aprobare proiect', 'Project approval') + ' — ' + S.name)}&body=${encodeURIComponent(txt)}">E-mail</a></div></div>`;
 };
}
/* la deschiderea unui link primit */
async function handleIncoming() {
 const m = location.hash.match(/^#p=([A-Za-z0-9_-]+)$/); if (!m) return;
 let data; try { data = JSON.parse(await unzip(m[1])); if (!data || !data.s || !data.s.items) throw 0; } catch (e) { toast(WL('Link de proiect invalid sau incomplet', 'Invalid or incomplete project link')); return; }
 let quiet = 0; const wait = () => { const md = $('#modal'), busy = !termsOk() || !LS.get('atelia.welcome') || (md && !md.hidden); quiet = busy ? 0 : quiet + 1; if (quiet < 2) { setTimeout(wait, 600); return; }
  const f = data.from || {}, notes = (data.s.notes || []).slice(-3);
  modalState = {incoming: 1};
  openModal(`${mhead(WL('Ai primit un proiect', 'You received a project'), esc(data.s.name || ''))}
  <div class="legalbox">${WL('De la', 'From')}: <b>${esc(f.company || f.name || WL('necunoscut', 'unknown'))}</b> (${esc(roleName(f.role))}) · ${WL('pentru', 'for')}: ${esc(roleName(data.to))}
  ${notes.length ? `<div style="margin-top:8px">${notes.map(n => `<div style="margin-top:4px">💬 ${esc(n.text)}</div>`).join('')}</div>` : ''}</div>
  <div class="note" style="margin-top:8px">${WL('Proiectul tău curent rămâne salvat — îl poți redeschide din Proiecte sau cu Anulează.', 'Your current project stays saved — reopen it from Projects or with Undo.')}</div>
  <div class="ckbtns" style="margin-top:10px"><button class="ckb" id="inNo">${WL('Renunță', 'Cancel')}</button><button class="btn gold" id="inYes">${WL('Deschide proiectul', 'Open the project')}</button>${data.to === 'client' ? `<button class="btn gold" id="inApr">${WL('Deschide și aprobă', 'Open and approve')}</button>` : ''}</div>`, true);
  const open = () => { undoS.push(ser()); data.s.pid = data.s.pid || nid(); load(JSON.stringify(data.s)); setCam('3d'); closeModal(true); history.replaceState(null, '', location.pathname); toast(WL('Proiect deschis: ', 'Project opened: ') + S.name); };
  $('#inYes').onclick = open; $('#inNo').onclick = () => { closeModal(true); history.replaceState(null, '', location.pathname); };
  $('#inApr') && ($('#inApr').onclick = () => { open(); setTimeout(() => openApprove(f), 400); });
 };
 wait();
}
setTimeout(handleIncoming, 900);
window.addEventListener('hashchange', handleIncoming);
(() => {
 const tb = $('#top .tb'), ref = $('#bProfile'); if (!tb || !ref) return;
 const b = document.createElement('button'); b.id = 'bShare'; b.className = 'ib'; b.title = WL('Trimite proiectul / aprobare', 'Send project / approval');
 b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>';
 b.onclick = openShare; tb.insertBefore(b, ref);
})();
EXPORTS.push({id: 'share', ic: '🔗', n: WL('Trimite proiectul / aprobare client', 'Send project / client approval'), d: WL('Link cu proiectul pentru arhitect, atelier, instalator sau client, cu note. Clientul aprobă cu un cod care dovedește versiunea aprobată.', 'Link with the project for architect, workshop, installer or client, with notes. The client approves with a code proving the approved version.'), roles: ['mobila', 'arhitect', 'designer', 'constructor', 'client'], fn: openShare});
