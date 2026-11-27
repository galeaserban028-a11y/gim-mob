/* ================== MONEDĂ: LEI / EURO (Atelia) ==================
   Moneda e eticheta tuturor prețurilor (fără conversie automată în fundal).
   La schimbare, utilizatorul poate converti prețurile salvate la cursul pe care îl introduce el. */
function CUR_CODE() { const p = getProfile(); return (p && p.currency === 'EUR') ? 'EUR' : 'RON'; }
function CUR() { return CUR_CODE() === 'EUR' ? '€' : (LANG === 'en' ? 'RON' : 'lei'); }
function money(v) {
 const n = Math.round(v || 0).toLocaleString(LANG === 'en' ? 'en-GB' : 'ro-RO');
 if (CUR_CODE() === 'EUR') return LANG === 'en' ? '€' + n : n + ' €';
 return LANG === 'en' ? n + ' RON' : n + ' lei';
}
/* câmpuri prețuri convertibile (procentele rămân la fel) */
const MONEY_KEYS = ['pal', 'front', 'hdf', 'blat', 'cant', 'bal', 'glis', 'man', 'pic', 'rab', 'bara', 'foaie'];
const WIN_MONEY_KEYS = ['pvc', 'al', 'osc', 'bat', 'door', 'slide', 'g3', 'sill', 'net', 'roller', 'mount'];
function convertPrices(factor) {
 const r2 = v => Math.round(v * factor * 100) / 100;
 mutate(() => { for (const k of MONEY_KEYS) if (S.rates[k] != null) S.rates[k] = r2(S.rates[k]);
  if (S.priceList && S.priceList.decors) for (const d of Object.values(S.priceList.decors)) { if (d.m2 != null) d.m2 = r2(d.m2); if (d.blat != null) d.blat = r2(d.blat); } });
 try { const w = JSON.parse(LS.get('atelia.win') || 'null'); if (w && w.rates) { for (const k of WIN_MONEY_KEYS) if (w.rates[k] != null) w.rates[k] = r2(w.rates[k]); LS.set('atelia.win', JSON.stringify(w)); } } catch (e) {}
 const lists = priceLists(); lists.forEach(l => { for (const k of MONEY_KEYS) if (l.rates[k] != null) l.rates[k] = r2(l.rates[k]); for (const d of Object.values(l.decors)) { if (d.m2 != null) d.m2 = r2(d.m2); if (d.blat != null) d.blat = r2(d.blat); } }); savePriceLists(lists);
 if (typeof prodCache !== 'undefined') prodCache = null;
}
/* valorile implicite (exemplele) sunt în lei — în modul EUR le împărțim la cursul salvat, ca proiectele noi să aibă ordinul de mărime corect */
function defaultsFactor() { const p = getProfile(); return CUR_CODE() === 'EUR' ? 1 / ((p && p.fx) || 5) : 1; }
let _defScaled = 1;
function scaleDefaults() { const f = defaultsFactor(), k = f / _defScaled; if (Math.abs(k - 1) < 1e-9) return;
 for (const key of MONEY_KEYS) if (DEFAULT_RATES[key] != null) DEFAULT_RATES[key] = Math.round(DEFAULT_RATES[key] * k * 100) / 100;
 if (typeof WIN_DEF_RATES !== 'undefined') for (const key of WIN_MONEY_KEYS) if (WIN_DEF_RATES[key] != null) WIN_DEF_RATES[key] = Math.round(WIN_DEF_RATES[key] * k * 100) / 100;
 _defScaled = f; }
setTimeout(scaleDefaults, 0);
/* câmp monedă în profil */
{
 const _open = openProfile;
 openProfile = function (opt = {}) {
  _open(opt);
  const grid = $('.pfgrid'); if (!grid) return;
  const p = getProfile() || {}, cur = p.currency === 'EUR' ? 'EUR' : 'RON';
  const w = document.createElement('label'); w.className = 'pf';
  w.innerHTML = `<span>${LANG === 'en' ? 'Currency' : 'Monedă'}</span><select class="inp" id="pf_cur"><option value="RON"${cur === 'RON' ? ' selected' : ''}>${LANG === 'en' ? 'Romanian leu (RON)' : 'Lei (RON)'}</option><option value="EUR"${cur === 'EUR' ? ' selected' : ''}>Euro (EUR)</option></select>`;
  grid.appendChild(w);
  const box = document.createElement('div'); box.id = 'curConv'; box.style.display = 'none'; box.className = 'legalbox'; box.style.marginTop = '8px';
  box.innerHTML = `<div>${LANG === 'en' ? 'Convert the prices you have already saved?' : 'Convertești prețurile deja salvate?'}</div>
  <label class="pf" style="max-width:240px;margin-top:6px"><span>${LANG === 'en' ? '1 EUR = … RON (use the current official rate)' : '1 EUR = … lei (folosește cursul oficial BNR al zilei)'}</span><input class="inp" type="number" step="0.0001" id="pf_fx" placeholder="ex: 5.0"></label>
  <label class="chk"><input type="checkbox" id="pf_conv" checked><span>${LANG === 'en' ? 'Convert project, windows and supplier prices' : 'Convertește prețurile din proiect, ferestre și listele furnizorilor'}</span></label>`;
  grid.parentNode.insertBefore(box, grid.nextSibling);
  $('#pf_cur').onchange = () => { box.style.display = $('#pf_cur').value !== cur ? 'block' : 'none'; };
  const save = $('#pfSave'), orig = save.onclick;
  save.onclick = () => {
   const nc = $('#pf_cur').value, fx = parseFloat(String($('#pf_fx').value).replace(',', '.')), conv = $('#pf_conv').checked;
   if (nc !== cur && conv && !(fx > 0.5 && fx < 50)) { toast(LANG === 'en' ? 'Enter the exchange rate (e.g. 5.0) or untick conversion' : 'Scrie cursul (ex. 5,0) sau debifează conversia'); return; }
   orig();
   const np = getProfile(); if (!np) return;
   if (np.currency !== nc || (fx > 0 && conv)) { np.currency = nc; if (fx > 0 && conv) np.fx = fx; LS.set('atelia.profile', JSON.stringify(np)); if (typeof cloudPushProfile === 'function') cloudPushProfile(np).catch(() => {}); }
   scaleDefaults();
   if (nc !== cur && conv) { convertPrices(nc === 'EUR' ? 1 / fx : fx); toast((LANG === 'en' ? 'Prices converted to ' : 'Prețuri convertite în ') + nc); }
   if (typeof updateTop === 'function') updateTop();
  };
 };
}
