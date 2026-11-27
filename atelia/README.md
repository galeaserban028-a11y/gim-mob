# Atelia Build

Proiectare 3D, ofertă și producție (debitare + CNC) într-o singură aplicație, pe mai multe domenii.
Link: https://galeaserban028-a11y.github.io/gim-mob/atelia/

## Ce conține
- Motorul GIMMOB Studio (tip ArchiWood), cu brand și date separate (`atelia.*` în browser).
- Domenii: Mobilă la comandă (activ), alte 6 în curând.
- Cadru legal: termeni v1.1, confidențialitate, cookies, confirmare înainte de exporturile de producție.
- Profiluri pe meserii (persoană fizică, producător mobilă, arhitect, designer, constructor) + mod Simplu / Pro.
- Verificări extinse (montaj coloane, anti-răsturnare, blat, hotă, mașină de vase, colțuri).
- „Generează”: proiect din descriere (AI gratuit pe Cloudflare, cu interpretor local de rezervă).
- Conturi online (Supabase, UE) — se activează din `config.js`.

## Cum se construiește
`index.html` se generează din aplicația GIMMOB (`../index.html`) + modulele din `src/`:

    python3 -I atelia/build/make_atelia.py index.html atelia/index.html

Nu edita direct `atelia/index.html` — modifică `src/*.js` sau scriptul de build.

Servere opționale: vezi `backend/README.md`.
