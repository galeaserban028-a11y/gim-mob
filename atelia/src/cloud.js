/* ================== CONTURI ONLINE (Supabase, opțional) ==================
   Pornește doar când atelia/config.js are supabase.url + supabase.anon.
   Folosește direct API-ul REST (fără bibliotecă externă). */
const CLOUD_CFG = (window.ATELIA_CONFIG || {}).supabase || null;
const cloudOn = () => !!(CLOUD_CFG && CLOUD_CFG.url && CLOUD_CFG.anon);
let atSession = null;
try { atSession = JSON.parse(LS.get('atelia.session') || 'null'); } catch (e) { atSession = null; }
function saveSession(s) { atSession = s; if (s) LS.set('atelia.session', JSON.stringify(s)); else { try { localStorage.removeItem('atelia.session'); } catch (e) {} } }
async function sbFetch(path, opt = {}, retry = true) {
 if (!cloudOn()) throw new Error('Conturile online nu sunt încă activate');
 if (atSession && atSession.expires_at && atSession.expires_at * 1000 < Date.now() + 60000 && retry && !/grant_type=refresh_token/.test(path)) await sbRefresh();
 const h = Object.assign({apikey: CLOUD_CFG.anon, 'Content-Type': 'application/json'}, opt.headers || {});
 if (atSession && atSession.access_token) h.Authorization = 'Bearer ' + atSession.access_token;
 const r = await fetch(CLOUD_CFG.url.replace(/\/$/, '') + path, Object.assign({}, opt, {headers: h}));
 const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
 if (r.status === 401 && retry && atSession && atSession.refresh_token) { await sbRefresh(); return sbFetch(path, opt, false); }
 if (!r.ok) throw new Error((j && (j.msg || j.message || j.error_description || j.error)) || ('Eroare server ' + r.status));
 return j;
}
async function sbRefresh() {
 try { const j = await sbFetch('/auth/v1/token?grant_type=refresh_token', {method: 'POST', body: JSON.stringify({refresh_token: atSession.refresh_token})}, false); saveSession(j); }
 catch (e) { saveSession(null); }
}
const cloudUser = () => atSession && atSession.user;
async function cloudSignUp(email, password) {
 const j = await sbFetch('/auth/v1/signup', {method: 'POST', body: JSON.stringify({email, password})});
 if (j && j.access_token) { saveSession(j); return 'in'; }
 return 'confirm';
}
async function cloudSignIn(email, password) {
 const j = await sbFetch('/auth/v1/token?grant_type=password', {method: 'POST', body: JSON.stringify({email, password})});
 saveSession(j); await cloudPullProfile(); return j;
}
async function cloudSignOut() { try { await sbFetch('/auth/v1/logout', {method: 'POST'}); } catch (e) {} saveSession(null); }
async function cloudPushProfile(p) {
 if (!cloudOn() || !cloudUser()) return;
 const row = {id: cloudUser().id, role: p.role, name: p.name, company: p.company, cui: p.cui, phone: p.phone, email: p.email, city: p.city, logo: p.logo, mode: p.mode, updated_at: new Date().toISOString()};
 await sbFetch('/rest/v1/profiles', {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates,return=minimal'}, body: JSON.stringify(row)});
}
async function cloudPullProfile() {
 if (!cloudUser()) return;
 const rows = await sbFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(cloudUser().id)}&select=*`);
 if (rows && rows[0]) { const r = rows[0]; const p = {role: r.role, name: r.name, company: r.company, cui: r.cui, phone: r.phone, email: r.email, city: r.city, logo: r.logo, mode: r.mode};
  LS.set('atelia.profile', JSON.stringify(p)); applyMode(); }
 else { const p = getProfile(); if (p) await cloudPushProfile(p); }
}
async function cloudSaveProject() {
 const row = {id: S.pid, owner: cloudUser().id, name: S.name, data: ser(), updated_at: new Date().toISOString()};
 await sbFetch('/rest/v1/projects', {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates,return=minimal'}, body: JSON.stringify(row)});
}
async function cloudListProjects() { return sbFetch('/rest/v1/projects?select=id,name,updated_at&order=updated_at.desc&limit=100'); }
async function cloudOpenProject(id) {
 const rows = await sbFetch(`/rest/v1/projects?id=eq.${encodeURIComponent(id)}&select=data`);
 if (!rows || !rows[0]) throw new Error('Proiectul nu mai există');
 undoS.push(ser()); load(typeof rows[0].data === 'string' ? rows[0].data : JSON.stringify(rows[0].data)); setCam('3d');
}
async function cloudDeleteProject(id) { await sbFetch(`/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, {method: 'DELETE'}); }
async function cloudDeleteAccount() { await sbFetch('/rest/v1/rpc/delete_my_account', {method: 'POST', body: '{}'}); saveSession(null); }

function renderCloudBox() {
 const box = $('#cloudBox'); if (!box) return;
 if (!cloudOn()) { box.innerHTML = `<div class="cloudbox"><b>Cont online</b><small>În curând: cont cu e-mail, proiecte salvate online și acces de pe orice dispozitiv. Până atunci, totul rămâne în acest browser.</small></div>`; return; }
 const u = cloudUser();
 if (!u) {
  box.innerHTML = `<div class="cloudbox"><b>Cont online</b><small>Salvează proiectele online și deschide-le de pe orice dispozitiv.</small>
  <div class="pfgrid" style="margin-top:8px"><input class="inp" id="cbEmail" type="email" placeholder="E-mail" autocomplete="email"><input class="inp" id="cbPass" type="password" placeholder="Parolă (minim 8 caractere)" autocomplete="current-password"></div>
  <label class="chk"><input type="checkbox" id="cbAge"><span>Am cel puțin 16 ani și accept <a href="termeni.html" target="_blank">Termenii</a> pentru contul online.</span></label>
  <div class="ckbtns" style="margin-top:8px"><button class="ckb" id="cbIn">Intră în cont</button><button class="ckb" id="cbUp">Creează cont</button></div></div>`;
  const cred = () => { const e = $('#cbEmail').value.trim(), p = $('#cbPass').value; if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error('E-mail invalid'); if (p.length < 8) throw new Error('Parola trebuie să aibă minim 8 caractere'); return [e, p]; };
  $('#cbIn').onclick = async () => { try { const [e, p] = cred(); await cloudSignIn(e, p); toast('Ești conectat'); openProfile(); } catch (er) { toast(er.message); } };
  $('#cbUp').onclick = async () => { try { if (!$('#cbAge').checked) throw new Error('Confirmă vârsta și termenii'); const [e, p] = cred(); const r = await cloudSignUp(e, p);
   if (r === 'in') { const pr = getProfile(); if (pr) await cloudPushProfile(pr); toast('Cont creat'); openProfile(); } else toast('Ți-am trimis un e-mail de confirmare. Confirmă și apoi intră în cont.'); } catch (er) { toast(er.message); } };
  return;
 }
 box.innerHTML = `<div class="cloudbox"><b>Conectat: ${esc(u.email || '')}</b>
 <div class="ckbtns" style="margin-top:8px"><button class="ckb" id="cbSave">Salvează proiectul online</button><button class="ckb" id="cbList">Proiectele mele online</button><button class="ckb" id="cbOut">Ieși din cont</button></div>
 <div id="cbProj"></div><button class="linkbtn" id="cbDel" style="margin-top:10px;font-size:12px">Șterge contul și toate datele online</button></div>`;
 $('#cbSave').onclick = async () => { try { await cloudSaveProject(); toast('Salvat online: ' + S.name); } catch (er) { toast(er.message); } };
 $('#cbOut').onclick = async () => { await cloudSignOut(); toast('Ai ieșit din cont'); renderCloudBox(); };
 $('#cbList').onclick = async () => { try { const list = await cloudListProjects(); const el = $('#cbProj');
  el.innerHTML = list && list.length ? `<div class="plist" style="margin-top:8px">${list.map(p => `<div class="pitem"><span style="flex:1">${esc(p.name || p.id)}<small style="display:block;color:var(--mut)">${new Date(p.updated_at).toLocaleString('ro-RO')}</small></span><button class="ckb" data-cbo="${esc(p.id)}">Deschide</button><button class="ckb" data-cbd="${esc(p.id)}">Șterge</button></div>`).join('')}</div>` : '<small>Nu ai proiecte online încă.</small>';
  $$('[data-cbo]').forEach(b => b.onclick = async () => { try { await cloudOpenProject(b.dataset.cbo); closeModal(true); toast('Deschis: ' + S.name); } catch (er) { toast(er.message); } });
  $$('[data-cbd]').forEach(b => b.onclick = async () => { try { await cloudDeleteProject(b.dataset.cbd); b.closest('.pitem').remove(); toast('Proiect șters online'); } catch (er) { toast(er.message); } });
 } catch (er) { toast(er.message); } };
 $('#cbDel').onclick = () => { const c = $('#cbDel'); if (c.dataset.sure) { cloudDeleteAccount().then(() => { toast('Cont șters'); renderCloudBox(); }).catch(er => toast(er.message)); } else { c.dataset.sure = 1; c.textContent = 'Apasă din nou ca să confirmi ștergerea definitivă'; } };
}
(() => { const st = document.createElement('style'); st.textContent = `.cloudbox{margin-top:12px;background:#141414;border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:4px;font-size:13px}.cloudbox small{color:var(--mut)}`; document.head.appendChild(st); })();
