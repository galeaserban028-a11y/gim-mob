/* ================== PROFIL + 7. MOD SIMPLU / PRO (Atelia) ================== */
const ROLES = {
 client:     {n: 'Persoană fizică',        d: 'Îmi proiectez casa sau mobila',            ic: '🏠', mode: 'simple'},
 mobila:     {n: 'Producător mobilă',      d: 'Debitare, CNC, oferte',                    ic: '🪵', mode: 'pro'},
 arhitect:   {n: 'Arhitect',               d: 'Planuri, export pentru CAD',               ic: '📐', mode: 'pro'},
 designer:   {n: 'Designer interior',      d: 'Prezentări pentru clienți, materiale',     ic: '🎨', mode: 'pro'},
 constructor:{n: 'Constructor / renovări', d: 'Cantități și liste de materiale',          ic: '🧱', mode: 'pro'}
};
function getProfile() { try { return JSON.parse(LS.get('atelia.profile') || 'null'); } catch (e) { return null; } }
function setProfile(p) {
 p.updated = new Date().toISOString();
 LS.set('atelia.profile', JSON.stringify(p));
 applyMode();
 if (typeof cloudPushProfile === 'function') cloudPushProfile(p).catch(() => {});
}
window.atFirm = () => { const p = getProfile(); return (p && p.company) || 'Atelia Build'; };
window.atContact = () => { const p = getProfile(); if (!p) return ''; return [p.company || p.name, p.cui && ('CUI ' + p.cui), p.phone, p.email, p.city].filter(Boolean).join(' · '); };
function curMode() { const p = getProfile(); return (p && p.mode) || 'pro'; }
function applyMode() {
 const simple = curMode() === 'simple';
 document.body.classList.toggle('at-simple', simple);
 const b = $('#modeChip'); if (b) b.innerHTML = simple ? 'Mod <b>Simplu</b>' : 'Mod <b>Pro</b>';
 const pb = $('#bProfile'); const p = getProfile();
 if (pb) pb.title = p ? `Profil: ${p.name || ROLES[p.role]?.n || ''}` : 'Profilul meu';
}
function toggleMode() {
 const p = getProfile() || {role: 'client'}; p.mode = curMode() === 'simple' ? 'pro' : 'simple'; setProfile(p);
 toast(p.mode === 'simple' ? 'Mod Simplu: doar proiectare și preț' : 'Mod Pro: toate uneltele de producție');
}
function resizeLogo(file) {
 return new Promise((res, rej) => {
  if (!/^image\//.test(file.type)) return rej(new Error('Alege o imagine'));
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => { const k = Math.min(1, 400 / Math.max(img.width, img.height)); const c = document.createElement('canvas');
   c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
   URL.revokeObjectURL(url); res(c.toDataURL('image/png')); };
  img.onerror = () => rej(new Error('Imagine invalidă')); img.src = url;
 });
}
function openProfile(opt = {}) {
 const p = Object.assign({role: '', name: '', company: '', cui: '', phone: '', email: '', city: '', logo: '', mode: ''}, getProfile() || {});
 modalState = opt.first ? {welcome: 1, profile: 1} : {profile: 1};
 const fld = (k, l, ph, type = 'text') => `<label class="pf"><span>${l}</span><input class="inp" id="pf_${k}" type="${type}" value="${esc(p[k] || '')}" placeholder="${ph}" autocomplete="off"></label>`;
 const head = opt.first ? `<div class="mh"><div><h2>Cine ești?</h2><div class="sub">Adaptăm uneltele după meseria ta. Poți schimba oricând.</div></div></div>` : mhead('Profilul meu', 'Datele apar pe oferte și pe documentele de producție');
 openModal(`${head}
 <div class="rgrid">${Object.entries(ROLES).map(([k, r]) => `<button class="rcard${p.role === k ? ' on' : ''}" data-role="${k}"><span>${r.ic}</span><b>${r.n}</b><small>${r.d}</small></button>`).join('')}</div>
 <div class="pfgrid">${fld('name', 'Nume', 'ex: Ion Popescu')}${fld('company', 'Firmă (opțional)', 'ex: Mobila Popescu SRL')}${fld('cui', 'CUI (opțional)', 'ex: RO12345678')}${fld('phone', 'Telefon', 'ex: 07xx xxx xxx', 'tel')}${fld('email', 'E-mail', 'ex: nume@firma.ro', 'email')}${fld('city', 'Oraș', 'ex: Cluj-Napoca')}</div>
 <div class="pflogo"><div id="pfLogoPrev">${p.logo ? `<img src="${p.logo}" alt="logo">` : '<span>Fără logo</span>'}</div><label class="ckb" style="text-align:center">Încarcă logo<input type="file" id="pfLogo" accept="image/*" hidden></label>${p.logo ? '<button class="ckb" id="pfLogoDel">Șterge logo</button>' : ''}</div>
 <div class="pfmode"><span>Interfață:</span><button class="ckb${(p.mode || ROLES[p.role]?.mode) === 'simple' ? ' on' : ''}" data-mode="simple">Simplu</button><button class="ckb${(p.mode || ROLES[p.role]?.mode || 'pro') === 'pro' ? ' on' : ''}" data-mode="pro">Pro</button></div>
 <div id="cloudBox"></div>
 <button class="btn gold wide" id="pfSave" style="margin-top:12px;padding:13px">${opt.first ? 'Continuă' : 'Salvează profilul'}</button>
 <div class="legal-links">Datele profilului stau în browserul tău${typeof cloudOn === 'function' && cloudOn() ? ' și, dacă ești conectat, în contul tău' : ''}. <a href="confidentialitate.html" target="_blank">Confidențialitate</a></div>`, true);
 let role = p.role, mode = p.mode, logo = p.logo;
 $$('.rcard').forEach(b => b.onclick = () => { role = b.dataset.role; $$('.rcard').forEach(x => x.classList.toggle('on', x === b));
  if (!p.mode) { mode = ROLES[role].mode; $$('[data-mode]').forEach(x => x.classList.toggle('on', x.dataset.mode === mode)); } });
 $$('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; $$('[data-mode]').forEach(x => x.classList.toggle('on', x === b)); });
 $('#pfLogo').onchange = async e => { try { logo = await resizeLogo(e.target.files[0]); $('#pfLogoPrev').innerHTML = `<img src="${logo}" alt="logo">`; } catch (er) { toast(er.message); } };
 $('#pfLogoDel') && ($('#pfLogoDel').onclick = () => { logo = ''; $('#pfLogoPrev').innerHTML = '<span>Fără logo</span>'; });
 $('#pfSave').onclick = () => {
  if (!role) { toast('Alege ce fel de utilizator ești'); return; }
  const np = {role, mode: mode || ROLES[role].mode, logo};
  for (const k of ['name', 'company', 'cui', 'phone', 'email', 'city']) np[k] = $('#pf_' + k).value.trim().slice(0, 120);
  if (np.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(np.email)) { toast('E-mail invalid'); return; }
  setProfile(np); closeModal(true); toast('Profil salvat');
  opt.next && setTimeout(opt.next, 250);
 };
 if (typeof renderCloudBox === 'function') renderCloudBox();
}
/* buton profil + comutator mod în bara de sus; prima pornire întreabă rolul */
(() => {
 const tb = $('#top .tb'), help = $('#bHelp');
 const chip = document.createElement('button'); chip.id = 'modeChip'; chip.className = 'modechip'; chip.title = 'Comută Simplu / Pro'; chip.onclick = toggleMode;
 const pb = document.createElement('button'); pb.id = 'bProfile'; pb.className = 'ib'; pb.title = 'Profilul meu'; pb.onclick = () => openProfile();
 pb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
 if (tb && help) { tb.insertBefore(chip, tb.firstChild); tb.insertBefore(pb, help); }
 const st = document.createElement('style'); st.textContent = `
.modechip{background:#1c1810;border:1px solid #5a4a28;color:var(--txt);border-radius:999px;padding:6px 12px;font:500 12px Inter,Arial;cursor:pointer;white-space:nowrap;margin-right:4px}
.modechip b{color:var(--gold)}
body.at-simple #tProd,body.at-simple #bHoles,body.at-simple [data-v="holes"],body.at-simple .pro-only{display:none!important}
.rgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:4px 0 12px}
.rcard{background:#181818;border:1px solid var(--line);border-radius:12px;padding:10px 12px;color:var(--txt);text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:2px;font-family:Inter,Arial}
.rcard span{font-size:20px}.rcard b{font-size:13px}.rcard small{color:var(--mut);font-size:11px;line-height:1.3}
.rcard.on{border-color:var(--gold);background:#1c1810}
.pfgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.pf{display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--mut)}
.pf .inp{width:100%}
.pflogo{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}
#pfLogoPrev{width:120px;height:56px;border:1px dashed var(--line);border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--mut);font-size:12px;background:#fff1}
#pfLogoPrev img{max-width:100%;max-height:100%}
.pfmode{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:13px;color:var(--mut)}
.pfmode .ckb{flex:0 0 auto}.ckb.on{border-color:var(--gold);color:var(--gold)}
@media(max-width:860px){.modechip{display:none}}`;
 document.head.appendChild(st);
 applyMode();
})();
openWelcome = () => { if (!getProfile()) openProfile({first: true, next: openDomains}); else openDomains(); };
