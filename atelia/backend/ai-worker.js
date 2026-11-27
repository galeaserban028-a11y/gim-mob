/**
 * Atelia Build — server AI (Cloudflare Worker + Workers AI, plan gratuit).
 * Primește o descriere în română și întoarce un „spec” JSON de proiect.
 * Cheia nu ajunge niciodată în browser: Workers AI se folosește prin binding-ul env.AI.
 * Pe planul Workers Free nu se poate depăși alocarea zilnică gratuită → nu apar costuri.
 */
const SYS = `Ești asistentul de proiectare Atelia Build. Transformi descrierea clientului într-un JSON STRICT, fără alt text.
Schema:
{"kind":"bucatarie"|"dulap","name":string,"layout":"I"|"L"|"U",
 "runs":{"back":mm,"left":mm,"right":mm},"height":mm,
 "tall":["fridge"|"oven"|"pantry"],"ovenUnder":bool,"sink":bool,"hob":bool,"dishwasher":bool,"upper":bool,
 "colors":{"body":string,"front":string,"counter":string},"notes":[string]}
Reguli: toate dimensiunile în milimetri (3,2 m = 3200). "back" = peretele principal. "left"/"right" doar pentru L/U, altfel 0.
"height" = înălțimea camerei dacă e dată, altfel 2600. Culorile în cuvinte simple (alb, gri, negru, stejar, nuc, beton, marmură) sau cod Egger (ex. H1145).
"tall": coloane cerute explicit (frigider în coloană → fridge, cuptor în coloană → oven, cămară → pantry). "ovenUnder": cuptor sub plită.
"upper": false doar dacă se cere fără corpuri sus. În "notes" pui scurt, în română, ce nu poți respecta (ex. insulă, două rânduri).`;

const json = (obj, status, cors) => new Response(JSON.stringify(obj), {status, headers: {...cors, 'Content-Type': 'application/json; charset=utf-8'}});

function extractJSON(out) {
  if (out && typeof out === 'object') return out;
  const s = String(out || '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
}

export default {
  async fetch(req, env) {
    const allowed = (env.ALLOWED_ORIGINS || 'https://galeaserban028-a11y.github.io').split(',').map(s => s.trim());
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, {headers: cors});
    if (req.method !== 'POST' || !allowed.includes(origin)) return json({error: 'Acces interzis'}, 403, cors);

    let text = '';
    try { text = String((await req.json()).text || '').trim(); } catch (e) {}
    if (text.length < 8 || text.length > 600) return json({error: 'Descriere invalidă (8–600 caractere)'}, 400, cors);

    const models = (env.MODELS || '@cf/google/gemma-4-26b-a4b-it,@cf/zai-org/glm-4.7-flash').split(',').map(s => s.trim());
    for (const model of models) {
      try {
        const r = await env.AI.run(model, {
          messages: [{role: 'system', content: SYS}, {role: 'user', content: text}],
          max_tokens: 500, temperature: 0.1
        });
        const out = r && (r.response !== undefined ? r.response : (r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content));
        const spec = extractJSON(out);
        if (spec && spec.runs) return json({spec, model}, 200, cors);
      } catch (e) { /* încearcă următorul model */ }
    }
    return json({error: 'AI indisponibil momentan'}, 503, cors);
  }
};
