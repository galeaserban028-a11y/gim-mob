/* Atelia Build — configurare. Câmpurile goale = funcția rămâne dezactivată, aplicația merge local.
   aiUrl:    adresa serverului AI (Cloudflare Worker din backend/ai-worker.js), ex. https://atelia-ai.<cont>.workers.dev
   supabase: {url, anon} din Supabase → Project Settings → API (cheia „anon public”, NU cheia service_role) */
window.ATELIA_CONFIG = {
  aiUrl: 'https://atelia-ai.galeaserban028.workers.dev',
  supabase: null
};
