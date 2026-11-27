/* ================== AUDIT: CALITATE, BATERIE, SECURITATE CSV ================== */
/* 1) Baterie: când nu atingi nimic (3 s) și nu rulează animații, 3D-ul se redesenează de 2 ori pe secundă în loc de 60. */
{
 let lastInput = performance.now(), lastRender = 0;
 const poke = () => { lastInput = performance.now(); };
 ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart', 'touchmove', 'resize', 'visibilitychange'].forEach(ev => addEventListener(ev, poke, {passive: true}));
 new MutationObserver(poke).observe(document.body, {childList: true, subtree: true});
 const _render = renderer.render.bind(renderer);
 renderer.render = (sc, cam) => {
  const now = performance.now(), busy = now - lastInput < 3000 || camAnim || Math.abs(openT - openTarget) > .001;
  if (!busy && now - lastRender < 500) return;
  lastRender = now; _render(sc, cam);
 };
 window.__ateliaPoke = poke;
}
/* 2) Securitate CSV: o celulă care începe cu = + @ (sau - urmat de text) ar fi executată ca formulă în Excel.
      O prefixăm cu apostrof — textul rămâne la fel, formula nu mai rulează. Numerele negative nu sunt atinse. */
function csvSafe(txt) {
 return String(txt).split('\n').map(line => line.replace(/(^|[;,\t])("?)([=+@]|-(?=[^\d.\s"]))/g, (m, sep, q, ch) => `${sep}${q}'${ch}`)).join('\n');
}
{
 const _save = saveFile;
 saveFile = (fn, data) => _save(fn, /\.csv$/i.test(fn) && typeof data === 'string' ? csvSafe(data) : data);
}
/* 3) Telefon: ținte de atingere mai mari, fără zoom automat la câmpuri, dublu-tap fără zoom accidental */
(() => { const st = document.createElement('style'); st.textContent = `
body{touch-action:manipulation}
@media(max-width:860px){#top .ib{width:40px;height:40px}.inp,select.inp,textarea.inp{font-size:16px!important}}
@media(max-width:420px){.brand>div{display:none}}
.fld i{color:#aaa49a}`; document.head.appendChild(st); })();
