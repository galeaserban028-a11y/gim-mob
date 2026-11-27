# Atelia Build — audit și plan (27 noiembrie 2026)

## Rezolvat în această rundă
| Zonă | Problemă găsită | Rezolvare |
|---|---|---|
| Securitate | Un fișier de proiect primit de la altcineva putea strecura cod în pagină prin numele decorurilor (XSS) | Toate proiectele încărcate sunt curățate (`src/hardening.js`), testat cu un proiect rău-intenționat |
| Securitate | Pagina putea trimite date oriunde | Politică de securitate (CSP): doar serverul AI, Supabase și CDN-urile bibliotecilor |
| Robustețe | Un plan foto mare depășea memoria browserului și se pierdea la reîncărcare | Imaginile se micșorează la 2400 px; avertizare dacă tot nu încape |
| Ofertare | Ofertele nu arătau TVA | Profil: plătitor / neplătitor TVA; oferta PDF arată fără TVA, TVA 21%, total |
| Piață | Nu se putea instala ca aplicație și nu mergea fără internet | PWA: „Adaugă pe ecranul principal”, iconițe, funcționare offline |
| Legal | Cache-ul offline nu era menționat | Adăugat în Politica de cookies |

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
3. ~~Versiune în engleză~~ — **făcut**: interfață, generator, ofertă PDF, documente legale EN. Rămân în română: desenele tehnice și etichetele PDF; moneda e încă lei (de adăugat EUR).
4. **Modulul Ferestre & uși** — al doilea domeniu, refolosește motorul și ofertarea.
5. **Plăți** (Stripe) — doar după ce firma și documentele legale sunt finalizate și verificate de avocat.
6. **Teste pe dispozitive reale** (iPhone, Android, Windows) cu tatăl tău, ca utilizator-pilot.
