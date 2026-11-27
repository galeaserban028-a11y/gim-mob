# Atelia Build — servere (opționale, gratuite)

Aplicația merge și fără ele: profilul stă în browser, iar „Generează” folosește interpretorul local.
Când le activezi, completezi `atelia/config.js` și gata.

## 1. AI gratuit — Cloudflare Workers AI (~15 minute)

De ce Cloudflare: plan gratuit permanent (10.000 „neuroni” pe zi), fără card. Pe planul Free
nu se poate depăși limita, deci **nu apar costuri**. Cererile peste limită primesc eroare, iar
aplicația trece automat pe interpretorul local.

1. Cont gratuit pe https://dash.cloudflare.com (fără card).
2. Pe calculator: `npm install -g wrangler`, apoi `wrangler login`.
3. În folderul `atelia/backend`: `wrangler deploy`.
4. Copiezi adresa primită (ex. `https://atelia-ai.<cont>.workers.dev`) în `atelia/config.js` → `aiUrl`.
5. Dacă schimbi domeniul aplicației, actualizezi `ALLOWED_ORIGINS` în `wrangler.toml`.

Modelele se schimbă din `MODELS` în `wrangler.toml` (primul care răspunde e folosit).

## 2. Conturi și profiluri online — Supabase (~15 minute)

Plan gratuit: 50.000 utilizatori activi pe lună. Atenție: proiectul gratuit se pune pe pauză
după 7 zile fără activitate. Pentru lansare publică treci pe planul Pro.

1. Cont pe https://supabase.com → New project → **Region: Central EU (Frankfurt)** (GDPR).
2. SQL Editor → lipești tot din `supabase.sql` → Run.
3. Authentication → Providers → Email: activat, „Confirm email” activat.
4. Authentication → URL Configuration → Site URL: adresa aplicației.
5. Project Settings → API → copiezi **Project URL** și cheia **anon public** în `atelia/config.js`:
   `supabase: {url: 'https://xxxx.supabase.co', anon: 'eyJ...'}`
   ⚠ Nu pune niciodată cheia `service_role` în aplicație.

Securitate: fiecare utilizator vede doar datele lui (Row Level Security în `supabase.sql`).
Ștergerea contului (dreptul la ștergere GDPR) e inclusă: funcția `delete_my_account`.

## Înainte de lansare
- Completează datele firmei în `termeni.html`, `confidentialitate.html`, `cookies.html`.
- Verificare juridică a documentelor.
