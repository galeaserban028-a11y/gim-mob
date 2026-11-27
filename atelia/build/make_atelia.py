"""Builds atelia/index.html (Atelia Build) from the GIMMOB Studio index.html.
Usage: python3 -I make_atelia.py SRC_INDEX DEST_INDEX
"""
import re, sys, base64, os

src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()

def must(old, new, count=None):
    global s
    n = s.count(old)
    if n == 0:
        raise SystemExit(f'not found: {old[:60]!r}')
    if count is not None and n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:60]!r}')
    s = s.replace(old, new)

# ---------- logo (SVG monogram, gold on black) ----------
LOGO_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3dca2"/><stop offset="1" stop-color="#b3843f"/></linearGradient></defs>
<rect width="200" height="200" rx="36" fill="#0d0d0d"/>
<path d="M100 34 L156 166 H130 L119 138 H81 L70 166 H44 Z M100 78 L88 114 H112 Z" fill="url(#g)"/>
<rect x="40" y="172" width="120" height="5" rx="2.5" fill="url(#g)" opacity=".7"/>
</svg>'''
LOGO = 'data:image/svg+xml;base64,' + base64.b64encode(LOGO_SVG.encode()).decode()

# favicon / touch icon
s = re.sub(r'(<link rel="icon" href=")data:image/png;base64,[A-Za-z0-9+/=]+', r'\g<1>' + LOGO, s, count=1)
s = re.sub(r'(<link rel="apple-touch-icon" href=")data:image/png;base64,[A-Za-z0-9+/=]+', r'\g<1>' + LOGO, s, count=1)
# splash + header images
s, n1 = re.subn(r'(<div id="splash"><img src=")data:image/jpeg;base64,[A-Za-z0-9+/=]+(" alt=")GIMMOB Studio("><span>)STUDIO(</span>)',
                r'\g<1>' + LOGO + r'\g<2>Atelia Build\g<3>ATELIA BUILD\g<4>', s, count=1)
s, n2 = re.subn(r'(<div class="brand"><img src=")data:image/jpeg;base64,[A-Za-z0-9+/=]+(" alt="logo"><div>)<b>GIMMOB</b><span>STUDIO</span>',
                r'\g<1>' + LOGO + r'\g<2><b>ATELIA</b><span>BUILD</span>', s, count=1)
assert n1 == 1 and n2 == 1, (n1, n2)

# ---------- names ----------
must('GIMMOB Studio', 'Atelia Build')
must('`GIMMOB_', '`Atelia_')
must('`GIMMOB|', '`ATELIA|')
must("fillText('GIMMOB',", "fillText('ATELIA',")
must('<meta name="theme-color" content="#0b0b0b">', '<meta name="theme-color" content="#0b0b0b">\n<meta name="description" content="Atelia Build — proiectare 3D, ofertă și producție CNC într-un singur loc.">')

# ---------- storage keys (separate from GIMMOB on the same origin) ----------
s = s.replace("'gimmob.welcome'", "'atelia.welcome'")
s = s.replace("'gmob.", "'atelia.")

# ---------- domain chooser + 7-day trial (replaces the personal welcome) ----------
start = s.index('function openWelcome(){')
end = s.index('\nsetTimeout(()=>{$(\'#splash\')', start)
NEW_WELCOME = r'''const DOMAINS=[
 {id:'mob',ic:'🪵',n:'Mobilă la comandă',d:'Bucătării, dressinguri, dormitoare · debitare + CNC',on:1},
 {id:'win',ic:'🪟',n:'Ferestre & uși',d:'PVC și aluminiu · ofertă instant'},
 {id:'int',ic:'🛋️',n:'Design interior',d:'Canapele, decor, lumini, culori'},
 {id:'ren',ic:'🧱',n:'Renovări & construcții',d:'Pereți, gips-carton, gresie, materiale'},
 {id:'ext',ic:'🌿',n:'Amenajări exterioare',d:'Terase, pergole, garduri, foișoare'},
 {id:'com',ic:'🏬',n:'Mobilier comercial',d:'Magazine, baruri, recepții, standuri'},
 {id:'met',ic:'⚙️',n:'Confecții metalice',d:'Scări, balustrade, porți'}];
const TRIAL_DAYS=7;
function trialLeft(){let t=+LS.get('atelia.trialStart');if(!t){t=Date.now();LS.set('atelia.trialStart',String(t));}
 return Math.max(0,TRIAL_DAYS-Math.floor((Date.now()-t)/864e5));}
function trialChip(){const left=trialLeft();let c=$('#trialChip');
 if(!c){c=document.createElement('button');c.id='trialChip';c.className='trialchip';const pn=$('#pname');pn.parentNode.insertBefore(c,pn.nextSibling);c.onclick=openDomains;}
 c.textContent=left>0?`🪵 Mobilă · test gratuit: ${left} ${left===1?'zi':'zile'}`:'🪵 Mobilă · testul s-a încheiat';}
function openDomains(){
 modalState={domains:1};const left=trialLeft();
 openModal(`${mhead('Alege domeniul','Același motor 3D — proiectare, ofertă și producție')}
 <div class="dgrid">${DOMAINS.map(x=>`<button class="dcard${x.on?' on':''}" data-d="${x.id}"><span class="dic">${x.ic}</span><b>${x.n}</b><small>${x.d}</small>${x.on?'<em>Activ</em>':'<em class="soon">În curând</em>'}</button>`).join('')}</div>
 <div class="trialbox">${left>0?`Ai <b>${left} ${left===1?'zi':'zile'}</b> de test gratuit, cu toate funcțiile.`:'Perioada de test s-a încheiat. Abonamentele vin în curând.'}<br><small>Personal ~5 €/lună · Firmă ~39 €/lună (oferte, debitare, CNC, logo propriu)</small></div>`);
 $$('.dcard').forEach(b=>b.onclick=()=>{const d=DOMAINS.find(x=>x.id===b.dataset.d);
  if(d.on){LS.set('atelia.welcome','1');closeModal(true);if(LS.get('atelia.help')!=='2')setTimeout(openHelp,400);}
  else toast(`${d.n} — modul în lucru, vine în curând`);});
}
function openWelcome(){openDomains();}
(()=>{const st=document.createElement('style');st.textContent=`
.trialchip{margin-left:8px;background:#1c1810;border:1px solid #5a4a28;color:var(--gold);border-radius:999px;padding:6px 12px;font:600 12px Inter,Arial;cursor:pointer;white-space:nowrap}
@media(max-width:860px){.trialchip{display:none}}
.dgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin:6px 0 14px}
.dcard{position:relative;text-align:left;background:#181818;border:1px solid var(--line);border-radius:14px;padding:14px;color:var(--txt);cursor:pointer;display:flex;flex-direction:column;gap:4px;font-family:Inter,Arial}
.dcard:hover{border-color:#5a4a28}.dcard.on{border-color:var(--gold);background:#1c1810}
.dcard .dic{font-size:24px}.dcard b{font-size:14px}.dcard small{color:var(--mut);font-size:12px;line-height:1.35}
.dcard em{position:absolute;top:10px;right:10px;font-style:normal;font-size:10px;font-weight:700;letter-spacing:.06em;color:#0d0d0d;background:var(--gold);border-radius:999px;padding:2px 8px}
.dcard em.soon{background:#2a2a2a;color:var(--mut)}
.trialbox{background:#141414;border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.5}
.trialbox small{color:var(--mut)}`;document.head.appendChild(st);})();
setTimeout(()=>{trialChip();const br=$('.brand');if(br){br.style.cursor='pointer';br.title='Alege domeniul';br.onclick=openDomains;}},800);
'''
s = s[:start] + NEW_WELCOME + s[end:]

# ---------- fonts: no Google Fonts request (GDPR); use local fonts ----------
s = re.sub(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">\s*', '', s)
s = re.sub(r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">\s*', '', s)
assert 'fonts.googleapis' not in s
FONT_CSS = '''<style>
@font-face{font-family:Inter;src:local('Inter'),local('Segoe UI'),local('Roboto'),local('Helvetica Neue'),local('Arial');}
@font-face{font-family:'Cormorant Garamond';src:local('Cormorant Garamond'),local('Georgia'),local('Times New Roman');}
</style>
'''
must('<title>Atelia Build</title>', '<title>Atelia Build</title>\n' + FONT_CSS, count=1)

# ---------- CNC readme warning ----------
must(r'Atelia Build - export CNC\nProiect:',
     r'Atelia Build - export CNC\nATENTIE: fisiere generate automat. Verificati cotele, postprocesorul si setarile masinii si rulati o simulare inainte de debitare. Responsabilitatea utilizarii revine utilizatorului (vezi Termenii, pct. 4).\nProiect:', count=1)

# ---------- legal layer: terms gate, cookie banner, export confirmation ----------
must("setTimeout(()=>{$('#splash').classList.add('off');if(!LS.get('atelia.welcome'))setTimeout(openWelcome,400);else if(LS.get('atelia.help')!=='2')setTimeout(openHelp,500);},700);",
     "setTimeout(()=>{$('#splash').classList.add('off');startFlow();},700);", count=1)

LEGAL = r'''
/* ================== CADRU LEGAL ================== */
const TERMS_V='1.1';
const LEGAL_LINKS=`<div class="legal-links"><a href="termeni.html" target="_blank">Termeni</a> · <a href="confidentialitate.html" target="_blank">Confidențialitate</a> · <a href="cookies.html" target="_blank">Cookies</a> · <a href="https://reclamatiisal.anpc.ro" target="_blank" rel="noopener">ANPC – SAL</a> · <button class="linkbtn" id="ckSet">Setări cookies</button></div>`;
function termsOk(){try{return JSON.parse(LS.get('atelia.terms')||'{}').v===TERMS_V;}catch(e){return false;}}
function openTerms(next){
 modalState={welcome:1,terms:1};
 openModal(`<div class="mh"><div><h2>Înainte să începi</h2><div class="sub">Atelia Build · Termeni și condiții v${TERMS_V}</div></div></div>
 <div class="legalbox"><p><b>Atelia Build este un instrument de proiectare și calcul.</b> Cotele, listele de debitare, fișierele CNC și prețurile generate trebuie verificate de tine sau de un specialist înainte de producție, construcție sau ofertare.</p>
 <p>Aplicația nu înlocuiește proiectul semnat de un arhitect sau inginer autorizat acolo unde legea îl cere și nu face calcule de rezistență.</p>
 <p>Proiectele tale sunt salvate doar în browserul tău. Nu folosim cookie-uri de analiză sau publicitate.</p></div>
 <label class="chk"><input type="checkbox" id="tA"><span>Am citit și accept <a href="termeni.html" target="_blank">Termenii și condițiile</a> și am luat la cunoștință <a href="confidentialitate.html" target="_blank">Politica de confidențialitate</a>.</span></label>
 <label class="chk"><input type="checkbox" id="tB"><span>Înțeleg că sunt responsabil să verific rezultatele înainte de a le folosi în producție sau pe șantier.</span></label>
 <button class="btn gold wide" id="tOk" disabled style="margin-top:12px;padding:13px">Accept și continui</button>`);
 const upd=()=>{$('#tOk').disabled=!($('#tA').checked&&$('#tB').checked);};
 $('#tA').onchange=upd;$('#tB').onchange=upd;
 $('#tOk').onclick=()=>{LS.set('atelia.terms',JSON.stringify({v:TERMS_V,at:new Date().toISOString()}));closeModal(true);next&&next();};
}
function consentFresh(){try{const c=JSON.parse(LS.get('atelia.consent')||'null');return c&&(Date.now()-new Date(c.at).getTime())<365*864e5;}catch(e){return false;}}
function saveConsent(analytics,marketing){LS.set('atelia.consent',JSON.stringify({necessary:true,analytics:!!analytics,marketing:!!marketing,at:new Date().toISOString(),v:1}));const b=$('#ckBar');b&&b.remove();}
window.ateliaConsent=()=>{try{return JSON.parse(LS.get('atelia.consent')||'null');}catch(e){return null;}};
function cookieBar(){
 if(consentFresh()||$('#ckBar'))return;
 const d=document.createElement('div');d.id='ckBar';
 d.innerHTML=`<div class="cktxt"><b>Cookies și stocare locală.</b> Folosim doar stocarea strict necesară ca aplicația să funcționeze (proiectele tale rămân în browser). Nu folosim analiză sau publicitate. <a href="cookies.html" target="_blank">Detalii</a></div>
 <div class="ckbtns"><button class="ckb" id="ckNo">Doar necesare</button><button class="ckb" id="ckCfg">Setări</button><button class="ckb" id="ckYes">Accept toate</button></div>`;
 document.body.appendChild(d);
 $('#ckNo').onclick=()=>saveConsent(false,false);$('#ckYes').onclick=()=>saveConsent(true,true);$('#ckCfg').onclick=openCookieSettings;
}
function openCookieSettings(){
 const c=window.ateliaConsent()||{};modalState={cookies:1};
 openModal(`${mhead('Setări cookies','Alegerile tale se pot schimba oricând')}
 <div class="ckrow"><div><b>Strict necesare</b><small>Proiecte, setări, acceptarea termenilor, perioada de test. Fără ele aplicația nu funcționează.</small></div><input type="checkbox" checked disabled></div>
 <div class="ckrow"><div><b>Analiză</b><small>Nefolosite în prezent. Dacă le vom introduce, pornesc doar cu acordul tău.</small></div><input type="checkbox" id="ckA" ${c.analytics?'checked':''}></div>
 <div class="ckrow"><div><b>Marketing</b><small>Nefolosite în prezent.</small></div><input type="checkbox" id="ckM" ${c.marketing?'checked':''}></div>
 <div class="ckbtns" style="margin-top:12px"><button class="ckb" id="ckSNo">Refuz opționale</button><button class="ckb" id="ckSSave">Salvează alegerile</button><button class="ckb" id="ckSYes">Accept toate</button></div>`);
 $('#ckSNo').onclick=()=>{saveConsent(false,false);closeModal(true);toast('Salvat: doar necesare');};
 $('#ckSYes').onclick=()=>{saveConsent(true,true);closeModal(true);toast('Salvat');};
 $('#ckSSave').onclick=()=>{saveConsent($('#ckA').checked,$('#ckM').checked);closeModal(true);toast('Alegeri salvate');};
}
/* confirmare înainte de exporturile pentru producție (o dată pe sesiune) */
let prodAck=false;
const PROD_RE=/debitare|CNC|optimizare|desene|etichete/i;
function confirmProd(){
 if(prodAck)return Promise.resolve(true);
 return new Promise(res=>{
  const ov=document.createElement('div');ov.id='prodOv';
  ov.innerHTML=`<div class="card"><div class="mh"><div><h2>Verificare înainte de producție</h2><div class="sub">Fișierele sunt generate automat</div></div></div>
  <div class="legalbox"><p>Înainte să tai materiale sau să rulezi CNC, verifică: <b>cotele</b>, <b>grosimile plăcilor</b>, <b>decorurile și cantul</b>, <b>postprocesorul și setările mașinii</b>. Rulează întâi o simulare sau o probă.</p></div>
  <label class="chk"><input type="checkbox" id="pA"><span>Am verificat proiectul și îmi asum folosirea fișierelor (Termeni, pct. 4).</span></label>
  <div class="ckbtns" style="margin-top:12px"><button class="ckb" id="pNo">Renunț</button><button class="btn gold" id="pOk" disabled>Generează fișierele</button></div></div>`;
  document.body.appendChild(ov);
  const done=v=>{ov.remove();res(v);};
  $('#pA').onchange=()=>{$('#pOk').disabled=!$('#pA').checked;};
  $('#pNo').onclick=()=>done(false);
  $('#pOk').onclick=()=>{prodAck=true;let log=[];try{log=JSON.parse(LS.get('atelia.prodAck')||'[]');}catch(e){}
   log.push({at:new Date().toISOString(),p:S.name});LS.set('atelia.prodAck',JSON.stringify(log.slice(-20)));done(true);};
 });
}
{const _sf=saveFile,_pdf=pagesToPDF;
 saveFile=async(fn,d)=>{if(PROD_RE.test(fn)&&!(await confirmProd()))return;return _sf(fn,d);};
 pagesToPDF=async(p,fn)=>{if(PROD_RE.test(fn)&&!(await confirmProd()))return;return _pdf(p,fn);};}
function startFlow(){
 const go=()=>{const idle=()=>{const m=$('#modal');if(m&&!m.hidden){setTimeout(idle,700);return;}cookieBar();};setTimeout(idle,1200);if(!LS.get('atelia.welcome'))setTimeout(openWelcome,300);else if(LS.get('atelia.help')!=='2')setTimeout(openHelp,400);};
 if(!termsOk())setTimeout(()=>openTerms(go),300);else go();
}
document.addEventListener('click',e=>{if(e.target&&e.target.id==='ckSet'){e.preventDefault();openCookieSettings();}});
(()=>{const st=document.createElement('style');st.textContent=`
.legalbox{background:#141414;border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.55}
.legalbox p{margin:0 0 8px}.legalbox p:last-child{margin:0}
.chk{display:flex;gap:10px;align-items:flex-start;margin-top:12px;font-size:14px;line-height:1.45;cursor:pointer}
.chk input{width:20px;height:20px;flex:none;margin-top:1px;accent-color:#d8b46e}
.chk a,.legal-links a,#ckBar a{color:var(--gold)}
.legal-links{margin-top:12px;font-size:12px;color:var(--mut);text-align:center}
.linkbtn{background:none;border:0;color:var(--gold);font:inherit;text-decoration:underline;cursor:pointer;padding:0}
#ckBar{position:fixed;left:12px;right:12px;bottom:12px;z-index:150;background:#141414;border:1px solid #5a4a28;border-radius:14px;padding:14px 16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;box-shadow:0 10px 40px #000a;font:14px/1.45 Inter,Arial;color:var(--txt)}
.cktxt{flex:1 1 320px}
.ckbtns{display:flex;gap:8px;flex-wrap:wrap}
.ckb{flex:1 0 auto;background:#1f1f1f;border:1px solid var(--line);color:var(--txt);border-radius:10px;padding:10px 14px;font:600 13px Inter,Arial;cursor:pointer}
.ckb:hover{border-color:var(--gold)}
.ckrow{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#141414;border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-top:8px}
.ckrow b{display:block;font-size:14px}.ckrow small{color:var(--mut);font-size:12px}
.ckrow input{width:20px;height:20px;accent-color:#d8b46e}
button:disabled{opacity:.45;cursor:not-allowed}
#prodOv{position:fixed;inset:0;z-index:160;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px}
#prodOv .card{max-width:560px;width:100%;background:#111;border:1px solid #5a4a28;border-radius:18px;padding:20px;color:var(--txt);font-family:Inter,Arial}
#prodOv h2{margin:0;color:var(--gold);font-family:'Cormorant Garamond',serif;font-size:24px}
#prodOv .sub{color:var(--mut);font-size:13px;margin-bottom:12px}`;document.head.appendChild(st);})();
'''
# append legal footer to the domains modal
must("<small>Personal ~5 €/lună · Firmă ~39 €/lună (oferte, debitare, CNC, logo propriu)</small></div>`);",
     "<small>Personal ~5 €/lună · Firmă ~39 €/lună (oferte, debitare, CNC, logo propriu)</small></div>${LEGAL_LINKS}`);", count=1)
must("setTimeout(()=>{$('#splash').classList.add('off');startFlow();},700);",
     LEGAL + "\nsetTimeout(()=>{$('#splash').classList.add('off');startFlow();},700);", count=1)

# ---------- module Atelia (src/*.js) ----------
SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(dst)), 'src')
MODS = ['i18n.js', 'profile.js', 'cloud.js', 'checks.js', 'ai.js', 'exports.js', 'underlay.js', 'prices.js', 'hardening.js', 'currency.js', 'windows.js']
mods_code = '\n'.join(f'/* ---- src/{m} ---- */\n' + open(os.path.join(SRC_DIR, m), encoding='utf-8').read() for m in MODS)
if '</script>' in mods_code: raise SystemExit('src contains </script>')
must("\nsetTimeout(()=>{$('#splash').classList.add('off');startFlow();},700);",
     '\n' + mods_code + "\nsetTimeout(()=>{$('#splash').classList.add('off');startFlow();},700);", count=1)
must('<script type="importmap">', '<script src="config.js"></script>\n<script type="importmap">', count=1)
# firma din profil pe oferte și desene
must('copy(`Atelia Build — Ofertă: ${S.name}', 'copy(`${atFirm()} — Ofertă: ${S.name}${atContact()?"\\n"+atContact():""}', count=1)
must('fillText(`Atelia Build · ${S.name}', 'fillText(`${atFirm()} · ${S.name}', count=1)

# ---------- PWA (instalabil, offline) + politică de securitate a conținutului ----------
# biblioteci găzduite local (vendor/) — nicio cerere către CDN-uri externe
must('"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"', '"three":"./vendor/three.module.min.js","three/addons/":"./vendor/addons/"', count=1)
must("const JSPDF='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',QRLIB='https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'", "const JSPDF='./vendor/jspdf.umd.min.js',QRLIB='./vendor/qrcode.js'", count=1)
CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline'; "
       "connect-src 'self' https://*.workers.dev https://*.supabase.co; "
       "img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; worker-src 'self' blob:; "
       "object-src 'none'; base-uri 'self'; form-action 'none'")
must('<meta name="theme-color" content="#0b0b0b">', f'<meta http-equiv="Content-Security-Policy" content="{CSP}">\n<meta name="theme-color" content="#0b0b0b">\n<link rel="manifest" href="manifest.webmanifest">', count=1)
s = re.sub(r'(<link rel="apple-touch-icon" href=")[^"]+', r'\g<1>icons/apple-touch-icon.png', s, count=1)
must("\nsetTimeout(()=>{$('#splash').classList.add('off');startFlow();},700);",
     "\nif('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});\nsetTimeout(()=>{$('#splash').classList.add('off');startFlow();},700);", count=1)

# ---------- monedă configurabilă (lei / €) ----------
must("const lei=v=>Math.round(v).toLocaleString('ro-RO')+' lei',", "const lei=v=>money(v),", count=1)
s, nu = re.subn(r"'lei/(m²|buc|ml|set|foaie)'", r"CUR()+'/\1'", s)
assert nu == 12, nu

# leftover personal text must be gone
for bad in ('GIMMOB', 'gimmob', '100 de lei', "'gmob."):
    if bad in s:
        raise SystemExit(f'leftover: {bad}')

open(dst, 'w', encoding='utf-8').write(s)
print('ok', len(s))
