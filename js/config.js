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
  SUPABASE_URL: 'https://bgsuyazgifofgmhnlfcr.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnc3V5YXpnaWZvZmdtaG5sZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjk1NTUsImV4cCI6MjA5ODkwNTU1NX0.XqWzLG56KjvfaL_JhQBe-_V9Hz0UIYh1H42WboWdiU4'
};
