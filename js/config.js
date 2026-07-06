/* ===== Brew Book — runtime config =====
   Paste your Supabase project's two PUBLIC values here.

   Find them in the Supabase dashboard → Project Settings → API:
     • Project URL      → SUPABASE_URL
     • anon public key  → SUPABASE_ANON_KEY   (the "anon" / "publishable" one)

   Both are safe to commit and ship in the frontend — Row Level Security
   (see supabase/schema.sql) is what actually protects your data. NEVER put
   the "service_role" secret key here.

   Until you fill these in, the app runs exactly as before off the bundled
   seed data, so nothing breaks in the meantime. */
window.BB_CONFIG = {
  SUPABASE_URL: 'YOUR-PROJECT-URL',
  SUPABASE_ANON_KEY: 'YOUR-ANON-KEY'
};
