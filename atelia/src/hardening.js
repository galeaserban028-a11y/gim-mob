/* ================== AUDIT: SECURITATE + TVA (Atelia) ================== */
/* 1) Proiectele importate (fișier primit de la altcineva, link, cloud) sunt curățate:
      niciun text nu poate conține < > → nu se poate injecta cod în pagină (XSS). */
{
 const _load = load;
 const clean = v => typeof v === 'string' ? v.replace(/[<>]/g, '').slice(0, 2000)
  : Array.isArray(v) ? v.map(clean) : (v && typeof v === 'object') ? Object.fromEntries(Object.entries(v).filter(([k]) => !/^__proto__|constructor|prototype$/.test(k)).map(([k, x]) => [k, clean(x)])) : v;
 load = function (str, silent) {
  let o; try { o = JSON.parse(str); } catch (e) { return _load(str, silent); }
  return _load(JSON.stringify(clean(o)), silent);
 };
}
/* 2) TVA pe oferte — cota standard în România: 21% */
const VAT_RATE = 21;
function vatInfo(total) {
 const p = getProfile() || {};
 if (p.vat === 'da') return {payer: true, net: total, vat: total * VAT_RATE / 100, gross: total * (1 + VAT_RATE / 100)};
 return {payer: false, net: total, vat: 0, gross: total};
}
/* câmp TVA în profil */
{
 const _open = openProfile;
 openProfile = function (opt = {}) {
  _open(opt);
  const grid = $('.pfgrid'); if (!grid) return;
  const p = getProfile() || {};
  const w = document.createElement('label'); w.className = 'pf';
  w.innerHTML = `<span>TVA</span><select class="inp" id="pf_vat"><option value="nu"${p.vat !== 'da' ? ' selected' : ''}>Neplătitor de TVA / persoană fizică</option><option value="da"${p.vat === 'da' ? ' selected' : ''}>Plătitor de TVA (${VAT_RATE}%)</option></select>`;
  grid.appendChild(w);
  const save = $('#pfSave'), orig = save.onclick;
  save.onclick = () => { const v = $('#pf_vat').value; orig(); const np = getProfile(); if (np && np.vat !== v) { np.vat = v; LS.set('atelia.profile', JSON.stringify(np)); if (typeof cloudPushProfile === 'function') cloudPushProfile(np).catch(() => {}); } };
 };
}
