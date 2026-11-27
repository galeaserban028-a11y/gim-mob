/* ================== 1. VERIFICĂRI EXTINSE (Atelia) ==================
   Se adaugă peste verificările existente din runChecks(). */
{
 const _baseChecks = runChecks;
 const catOf = c => (TYPES[c.type] || {}).cat;
 const nameOf = c => (typeof cabCode === 'function' ? cabCode(c) : (TYPES[c.type] || {}).n || c.type);
 const near = (a, b, tol = 6) => a.wall === b.wall && (a.off || 0) === (b.off || 0) &&
   Math.abs(a.s - b.s) <= (a.w + b.w) / 2 + tol;
 runChecks = function () {
  const out = _baseChecks();
  const R = S.room, cabs = S.items.filter(i => i.kind === 'cab' && !i.hidden);
  const base = cabs.filter(c => catOf(c) === 'base');
  const counters = cabs.filter(c => c.type === 'counter');
  for (const c of cabs) {
   const t = TYPES[c.type] || {}, cat = t.cat, nm = nameOf(c);
   // a) corpul înalt trebuie să poată fi ridicat la montaj (diagonala laterală)
   if ((cat === 'tall' || cat === 'ward') && (c.e || 0) < 50 && c.h > 1500) {
    const diag = Math.sqrt(c.h * c.h + c.d * c.d), free = R.h - (c.e || 0);
    if (diag > free - 10) out.push({lvl: 'err', id: c.id, msg: `${nm}: nu poate fi ridicat la montaj — diagonala laterală are ${Math.round(diag)} mm, iar până la tavan sunt ${Math.round(free)} mm. Micșorează înălțimea sau montează-l din bucăți.`});
    else if (R.h - (c.e + c.h) < 30) out.push({lvl: 'warn', id: c.id, msg: `${nm}: rămân sub 30 mm până la tavan — verifică planeitatea tavanului înainte de debitare.`});
   }
   // b) siguranță: corpurile înalte se prind de perete
   if ((cat === 'tall' || cat === 'ward') && c.h >= 1500)
    out.push({lvl: 'info', id: c.id, msg: `${nm}: corp înalt — prinde-l de perete cu feronerie anti-răsturnare.`});
   // c) blatul trebuie să acopere frontul
   if (cat === 'base' && (c.e || 0) < 50) {
    const top = c.e + c.h;
    const cov = counters.find(o => o.wall === c.wall && Math.abs(o.e - top) < 15 && Math.abs(o.s - c.s) <= (o.w - c.w) / 2 + 5);
    const need = c.d + (S.std.FT || 18);
    if (cov && cov.d < need) out.push({lvl: 'warn', id: cov.id, msg: `${nameOf(cov)}: adâncime ${cov.d} mm — nu acoperă frontul corpului ${nm} (minim ${need} mm).`});
   }
   // d) deasupra plitei: corp de hotă
   if (c.type === 'base_hob' || c.type === 'base_oven') {
    const above = cabs.filter(o => catOf(o) === 'wall' && o.wall === c.wall && Math.abs(o.s - c.s) < (o.w + c.w) / 2 - 20);
    if (above.length && !above.some(o => o.type === 'wall_hood'))
     out.push({lvl: 'warn', id: c.id, msg: `${nm}: deasupra plitei e un corp obișnuit — folosește corp de hotă și respectă distanța minimă din manualul hotei și al plitei.`});
    const fr = cabs.find(o => o.type === 'tall_fridge' && near(o, c, 2));
    if (fr) out.push({lvl: 'warn', id: c.id, msg: `${nm}: plita e lipită de coloana frigider — lasă un corp între ele.`});
   }
   // e) mașina de vase lângă chiuvetă
   if (c.type === 'base_dish' && !base.some(o => o.type === 'base_sink' && near(o, c)))
    out.push({lvl: 'info', id: c.id, msg: `${nm}: mașina de vase nu e lângă chiuvetă — verifică traseul scurgerii și alimentării.`});
   // f) chiuvetă fără blat
   if (c.type === 'base_sink' && !counters.some(o => o.wall === c.wall && Math.abs(o.e - (c.e + c.h)) < 15 && Math.abs(o.s - c.s) <= (o.w - c.w) / 2 + 5))
    out.push({lvl: 'err', id: c.id, msg: `${nm}: chiuvetă fără blat deasupra.`});
   // g) blat mai lung decât placa standard
   if (c.type === 'counter' && c.w > (S.std.blatL || 4100))
    out.push({lvl: 'warn', id: c.id, msg: `${nm}: blat de ${Math.round(c.w)} mm — mai lung decât placa (${S.std.blatL} mm), trebuie îmbinat.`});
  }
  // h) corp de colț: două șiruri care se întâlnesc fără corp de colț sau lată
  for (const w of ['left', 'right']) {
   const side = base.filter(c => c.wall === w), back = base.filter(c => c.wall === 'back');
   if (!side.length || !back.length) continue;
   const first = side.reduce((a, b) => (a.s - a.w / 2 < b.s - b.w / 2 ? a : b));
   const gap = first.s - first.w / 2 - 600;
   if (gap > 60) out.push({lvl: 'info', id: first.id, msg: `Colțul ${w === 'left' ? 'stânga' : 'dreapta'}: gol de ${Math.round(gap)} mm între șiruri — pune o lată de completare sau un corp de colț.`});
  }
  return out;
 };
}
