# Atelia Build — audit și plan (27 noiembrie 2026)

## Audit complet #2 (seara, 27.11.2026) — rezultate
| Zonă | Verificat | Rezultat | Acțiune |
|---|---|---|---|
| Securitate | CSP, scripturi externe, eval, linkuri `_blank`, date injectate | ✅ CSP strict, 0 servere externe, 0 eval, toate linkurile cu `noopener` | — |
| Securitate | Fișiere CSV trimise la terți (centre de debitare) | ❌ formule Excel (`=…`) executabile | ✅ neutralizate automat în toate CSV-urile |
| Securitate | Nume cu cod HTML, proiecte importate | ✅ curățate, nu se execută | — |
| GDPR / cookies | Chei de stocare folosite vs. documentate (RO + EN) | ✅ 100% documentate | — |
| Legal | Preț pentru consumatori fără „TVA inclus” pe site | ❌ | ✅ corectat |
| Legal | Date firmă lipsă | ⚠️ [paranteze] în 9 pagini | de completat de tine + avocat |
| Baterie | 3D redesenat continuu (60 fps) și în repaus | ❌ | ✅ 2 fps în repaus (~97% mai puțin) |
| Accesibilitate | Butoane fără nume, câmpuri fără etichetă, imagini fără alt | ❌ 2 butoane „închide” fără nume | ✅ etichetate |
| Accesibilitate | Zoom blocat pe telefon (`user-scalable=no`) | ❌ încalcă WCAG 1.4.4 | ✅ zoom permis, fără zoom accidental la dublu-tap / câmpuri |
| Accesibilitate | Ținte de atingere | ✅ toate ≥ 24 px (WCAG 2.2 AA); antetul mărit la 40 px | — |
| Accesibilitate | Escape închide ferestrele, focus vizibil | ✅ | — |
| Funcțional | Salvare / reîncărcare identică, cameră 12×9 m, proiect gol, nume cu diacritice și simboluri | ✅ | — |
| Funcțional | 7 seturi de teste (desktop + telefon, RO + EN, 3D real) | ✅ 0 erori | — |
| Linkuri | Toate paginile, imaginile, iconițele, cache-ul offline | ✅ 0 rupte | — |
| Viteză | Prima încărcare ~690 KB (≈ 200 KB comprimat), interactiv < 3 s | ✅ | — |
| Site | Titlu, descriere, un singur H1, alt la imagini, canonical, sitemap | ✅ (canonical + sitemap adăugate) | — |

### Rămase (nu se pot rezolva din cod)
- Plăți Stripe, conturi Supabase, AI Cloudflare — sesiunea de pe laptop.
- Testul de 7 zile e ținut doar în browser până la conturi + Stripe.
- Pentru firme cu cont online: contract de prelucrare a datelor (DPA), pentru că firmele își pun în proiecte datele clienților lor.
- Datele firmei și verificarea juridică înainte de prima încasare.
- Test real cu un atelier pe un proiect complet.


## Rezolvat în această rundă
| Zonă | Problemă găsită | Rezolvare |
|---|---|---|
| Securitate | Un fișier de proiect primit de la altcineva putea strecura cod în pagină prin numele decorurilor (XSS) | Toate proiectele încărcate sunt curățate (`src/hardening.js`), testat cu un proiect rău-intenționat |
| Securitate | Pagina putea trimite date oriunde | Politică de securitate (CSP): doar serverul AI, Supabase și CDN-urile bibliotecilor |
| Robustețe | Un plan foto mare depășea memoria browserului și se pierdea la reîncărcare | Imaginile se micșorează la 2400 px; avertizare dacă tot nu încape |
| Ofertare | Ofertele nu arătau TVA | Profil: plătitor / neplătitor TVA; oferta PDF arată fără TVA, TVA 21%, total |
| Piață | Nu se putea instala ca aplicație și nu mergea fără internet | PWA: „Adaugă pe ecranul principal”, iconițe, funcționare offline |
| Legal | Cache-ul offline nu era menționat | Adăugat în Politica de cookies |

## Funcții unice (nu le are niciun concurent)
1. **Instrucțiuni de montaj automate** — PDF pas cu pas pe fiecare corp, cu codurile de pe etichetele QR, feronerie, ordinea în cameră, siguranță.
2. **Comandă debitare + comparare centre** — listă standard pentru orice centru, cost și termen calculate pentru fiecare centru salvat, trimitere e-mail/WhatsApp.
3. **Proiect partajat între meserii + aprobare client** — link fără server, note pe meserii, aprobare cu amprentă SHA-256 care detectează orice modificare după aprobare.
4. **Obstacole pe perete** — prize, apă, gaz, calorifere, ferestre, tablou electric; afișate în 3D și verificate față de corpuri; poza peretelui ca referință.

## Comparație cu piața
| Funcție | Cabinet Vision / imos / Mozaik | Polyboard | Planner 5D / Coohom | **Atelia Build** |
|---|---|---|---|---|
| Proiectare parametrică mobilier | da | da | parțial | da |
| Debitare + optimizare + CNC | da | da | nu | da |
| Ofertă client cu preț | parțial | parțial | nu | da (PDF, TVA, logo) |
| Rulează în browser / telefon | nu (Windows) | nu | da | da, + offline |
| Generare din descriere | nu | nu | parțial | da (local + AI) |
| Export pentru arhitect (DXF) | da | da | parțial | da (plan + elevații) |
| Plan de instalații | nu | nu | nu | da (orientativ) |
| Mai multe meserii, un proiect | nu | nu | nu | da (profiluri) |
| Preț | sute–mii €/an | licență scumpă | abonament | țintă 5–39 €/lună |

## Ce urmează (în ordinea impactului)
1. **Link de proiect pentru client** (aprobare + semnătură online) — după activarea Supabase.
2. **Bibliotecile 3D/PDF găzduite local** (fără CDN extern) — cer descărcarea fișierelor de pe un calculator cu internet.
3. ~~Versiune în engleză~~ — **făcut**: interfață, generator, ofertă PDF, documente legale EN. Rămân în română: desenele tehnice și etichetele PDF. **Monedă lei / € făcută** (cu conversie la cursul introdus de utilizator).
4. ~~Modulul Ferestre & uși~~ — **făcut**: configurator PVC/aluminiu, simboluri de deschidere, verificări, preț, ofertă PDF, debitare profile pe bare, listă geamuri și feronerie. **Uw estimat făcut** (EN ISO 10077-1 simplificat, valori editabile). De adăugat: plan 3D, sincronizare în cont.
5. **Plăți** (Stripe) — doar după ce firma și documentele legale sunt finalizate și verificate de avocat.
6. **Teste pe dispozitive reale** (iPhone, Android, Windows) cu tatăl tău, ca utilizator-pilot.
