/* ===== Brew Book — APP LOGIC =====
   Storage, rendering (hero + lanes + boarding passes), navigation,
   detail view, brew mode, the add/edit form.
   World-map logic lives in js/worldmap.js. */

/* ---------- AIRLINE SYSTEM (keyed by recipe serial) ---------- */
const AIRLINES = {
  1:{name:'BREW BOOK AIR',code:'BB',color:'#cf7f45'},
  2:{name:'VIETNAM AIRLINES',code:'VN',color:'#1a4b8c'},
  3:{name:'VIETNAM AIRLINES',code:'VN',color:'#1a4b8c'},
  4:{name:'VIETNAM AIRLINES',code:'VN',color:'#1a4b8c'},
  5:{name:'IBERIA',code:'IB',color:'#cc0000'},
  6:{name:'GARUDA INDONESIA',code:'GA',color:'#0d4f8b'},
  7:{name:'THAI AIRWAYS',code:'TG',color:'#6b2d8b'},
  8:{name:'AEGEAN AIR',code:'A3',color:'#003087'},
  9:{name:'ITA AIRWAYS',code:'AZ',color:'#009246'},
  10:{name:'TAP PORTUGAL',code:'TP',color:'#006600'},
  11:{name:'AEROMEXICO',code:'AM',color:'#0a2240'},
  12:{name:'AIR INDIA',code:'AI',color:'#c8102e'},
  13:{name:'CUBANA',code:'CU',color:'#003087'},
  14:{name:'KOREAN AIR',code:'KE',color:'#00256c'},
  15:{name:'ROYAL AIR MAROC',code:'AT',color:'#cc0000'},
  16:{name:'CATHAY PACIFIC',code:'CX',color:'#005f6b'},
  17:{name:'TURKISH AIRLINES',code:'TK',color:'#c8102e'},
  18:{name:'ITA AIRWAYS',code:'AZ',color:'#009246'},
  19:{name:'AUSTRIAN',code:'OS',color:'#c8102e'},
  20:{name:'BREW BOOK AIR',code:'BB',color:'#cf7f45'},
  21:{name:'VIETNAM AIRLINES',code:'VN',color:'#1a4b8c'},
  22:{name:'YEMENIA',code:'IY',color:'#ce1126'},
  23:{name:'MALAYSIA AIRLINES',code:'MH',color:'#cc0000'},
  24:{name:'LATAM BRASIL',code:'LA',color:'#cc0000'},
  25:{name:'IBERIA',code:'IB',color:'#cc0000'},
  26:{name:'ETHIOPIAN',code:'ET',color:'#009a44'},
  27:{name:'AIR SÉNÉGAL',code:'HC',color:'#00853e'},
  28:{name:'YEMENIA',code:'IY',color:'#ce1126'},
  29:{name:'BREW BOOK AIR',code:'BB',color:'#cf7f45'},
  30:{name:'AIR INDIA',code:'AI',color:'#c8102e'},
  31:{name:'AIR INDIA',code:'AI',color:'#c8102e'},
  32:{name:'BREW BOOK AIR',code:'BB',color:'#cf7f45'},
  33:{name:'BREW BOOK AIR',code:'BB',color:'#cf7f45'},
  34:{name:'ANA',code:'NH',color:'#003087'},
  35:{name:'KOREAN AIR',code:'KE',color:'#00256c'},
  36:{name:'EVA AIR',code:'BR',color:'#007b40'},
  37:{name:'EVA AIR',code:'BR',color:'#007b40'},
  38:{name:'ANA',code:'NH',color:'#003087'}
};
function getAirline(serial){ return AIRLINES[serial] || {name:'BREW BOOK AIR',code:'BB',color:'#cf7f45'}; }
/* amt can be negative to darken (used by the world map's pin livery). */
function hexLighten(hex,amt){
  amt = amt || 42;
  const n = parseInt(hex.slice(1),16);
  const clamp = v => Math.max(0,Math.min(255,v));
  const r = clamp((n>>16)+amt), g = clamp(((n>>8)&255)+amt), b = clamp((n&255)+amt);
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function hexToRgb(hex){
  const n = parseInt(hex.slice(1),16);
  return `${(n>>16)&255},${(n>>8)&255},${n&255}`;
}

/* ---------- STYLE CATEGORIES (for hero + horizontal lanes) ----------
   Categories describe flavour and character, not geography or brew method.
   "World Black" is intentionally absent — World is a view mode, not a flavour.
   "Black & Strong" replaces it to describe the actual taste profile. */
const STYLE_CATEGORIES = [
  {
    id: 'milk', label: 'Milk & Cream',
    ids: ['seed-coconut','seed-egg','seed-suada','seed-bombon','seed-kopisusu',
          'seed-kaapi','seed-cortadito','seed-yuenyeung','seed-affogato',
          'seed-einspanner','seed-saltcoffee','seed-mocha','seed-ipoh','seed-dolcelatte']
  },
  {
    id: 'iced', label: 'Iced & Cold',
    ids: ['seed-mango','seed-mazagran','seed-shakerato','seed-orange','seed-pineapple',
          'seed-coffeejelly','seed-dirty','seed-brownsugar','seed-cheesefoam','seed-flashbrew']
  },
  {
    id: 'black', label: 'Black & Strong',
    ids: ['seed-turkish','seed-cafezinho','seed-carajillo','seed-buna']
  },
  {
    id: 'spiced', label: 'Spiced',
    ids: ['seed-thai','seed-cafeolla','seed-qahwa','seed-touba','seed-qishr']
  },
  {
    id: 'blended', label: 'Blended',
    ids: ['seed-frappe','seed-dalgona','seed-banana','seed-coldcoffee','seed-chikoo']
  }
];

/* Colour swatch choices for the custom-recipe form, matches
   brew_book_collection_reference.html's PALETTE exactly. */
const RECIPE_PALETTE = ['#cf7f45','#c0392b','#2f8f4e','#3a6db0','#d9893f'];
const FORM_ACCENT = RECIPE_PALETTE[0];

/* Pinned-favourites glyph, shared by collectionCard() and openDetail(). */
const PIN_SVG = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 14.5 C8 14.5 12.5 9.8 12.5 6.5 A4.5 4.5 0 0 0 3.5 6.5 C3.5 9.8 8 14.5 8 14.5Z" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="6.3" r="1.6" fill="currentColor"/></svg>`;

/* Custom recipes carry an explicit user-picked tagId (from the form's Tag
   select) since they can't match any seed id list. */
function getStyleCategory(r) {
  if (r.tagId) return r.tagId;
  for (const cat of STYLE_CATEGORIES) {
    if (cat.ids.includes(r.id)) return cat.id;
  }
  return 'other';
}

/* ---------- storage ----------
   Phase 1 data split:
     • CATALOG   — the shared recipe content, read from Supabase (source of
       truth) and cached locally for offline / fallback. Read-only here.
     • USER DATA — this browser's own state: tried/rating per recipe + any
       custom recipes. Stays client-side in Phase 1 (moves to a per-user
       table in Phase 2). Persisted via storeGet/storeSet under USERDATA_KEY.
   Nothing breaks before Supabase is configured: the app falls back to the
   bundled SEED, so it behaves exactly as it did when recipes were hardcoded. */
const hasClaudeStorage = typeof window.storage !== 'undefined' && window.storage && typeof window.storage.get === 'function';
const USERDATA_KEY = 'brewbook-userdata-v1';
const CATALOG_CACHE_KEY = 'brewbook-catalog-cache-v1';
/* Phase 2: when signed in, personal data is sourced from Supabase but mirrored
   here (tagged with the user's id) for instant paint / offline fallback. The
   guest USERDATA_KEY above is left untouched while signed in, so signing out
   restores the exact pre-sign-in guest data with no wipe/restore logic. */
const USERDATA_CLOUD_CACHE_KEY = 'brewbook-userdata-cloud-v1';

/* ---------- equipment (Phase 3 foundation) ----------
   What brewing gear a user owns, from the one-time "what do you brew with?"
   onboarding. Guests keep it in localStorage; signed-in users get it from
   `user_equipment` (mirrored to a local cache for instant reads), following
   the exact same guest/cloud split as the tried/rating data above. An empty
   set always means "unfiltered — show everything", never "show nothing". */
const EQUIPMENT_KEY = 'brewbook-equipment-v1';
const EQUIPMENT_CLOUD_CACHE_KEY = 'brewbook-equipment-cloud-v1';
let ownedEquipment = [];   /* current effective list of canonical equipment ids */

/* ---------- auth state (Phase 2) ----------
   currentUser is the Supabase auth user (or null = signed out / guest).
   syncState drives the little status dot in the account dropdown. */
let currentUser = null;
let accountOpen = false;
let syncState = 'idle';   /* 'idle' | 'syncing' | 'synced' | 'error' */
let authMode = 'signin';  /* signed-out dropdown mode: 'signin' | 'signup' */

/* Synchronous "is someone probably signed in?" check for the very first paint,
   before the async Supabase getSession() resolves. supabase-js v2 persists the
   session under a localStorage key like `sb-<ref>-auth-token`; if that's
   present we treat the visitor as returning (skip the landing, show the app).
   The landing is the signed-out home page, so it opens on every load/refresh
   until the user actually signs in. initAuth() is still the source of truth
   and corrects this if the token turns out to be stale. */
function hasSupabaseSession(){
  try{
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if(k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') === k.length - 11){
        const v = localStorage.getItem(k);
        if(v && v !== 'null' && v.length > 20) return true;
      }
    }
  }catch(e){}
  return false;
}

async function storeGet(key){ if(hasClaudeStorage){ const r = await window.storage.get(key); return r ? r.value : null; } return localStorage.getItem(key); }
async function storeSet(key, value){ if(hasClaudeStorage){ const r = await window.storage.set(key, value); return !!r; } localStorage.setItem(key, value); return true; }

/* Legacy → canonical brew-method ids. Track 3.0 renamed the flat method
   strings to the EQUIPMENT_TAXONOMY ids, and regenerated supabase/seed.sql —
   but the LIVE Supabase catalog keeps the old strings ("moka pot", "blended",
   …) until that seed is re-run in the dashboard. Rather than depend on that
   manual step, we normalise legacy ids as rows enter the app so everything
   downstream — method labels, the difficulty/time badge (METHOD_META), and
   the equipment filter — only ever sees canonical ids and works regardless of
   the live DB's state. The bundled seed already uses canonical ids, so this is
   a no-op there. */
const LEGACY_METHOD_ALIASES = {
  'moka pot':'moka', 'blended':'blender', 'pour over':'pour_over',
  'french press':'french_press', 'cold brew':'cold_brew'
};
function canonicalMethodId(id){
  if(!id) return id;
  const inTaxonomy = v => typeof EQUIPMENT_TAXONOMY !== 'undefined' && EQUIPMENT_TAXONOMY.some(m => m.id === v);
  if(inTaxonomy(id)) return id;
  if(LEGACY_METHOD_ALIASES[id]) return LEGACY_METHOD_ALIASES[id];
  const us = String(id).toLowerCase().replace(/\s+/g,'_');
  return inTaxonomy(us) ? us : id;
}

/* Map a Supabase row (snake_case) to the recipe shape the UI expects. */
function rowToRecipe(row){
  return {
    id: row.id, serial: row.serial, name: row.name, origin: row.origin,
    method: canonicalMethodId(row.method), ratio: row.ratio, ratioLabel: row.ratio_label,
    strength: row.strength, description: row.description, story: row.story,
    bean: row.bean, notes: row.notes,
    ingredients: row.ingredients || [], steps: row.steps || [],
    methods: (row.methods || []).map(m => ({ ...m, id: canonicalMethodId(m.id) })),
    roasterPicks: row.roaster_picks || null,
    color: row.color || undefined, tagId: row.tag_id || undefined, code: row.code || undefined,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    tried: false, rating: 0
  };
}
/* Inverse of rowToRecipe: a user-authored recipe → a Supabase `recipes` row.
   owner_id stamps ownership (RLS requires it to equal the signed-in user). */
function recipeToRow(r, ownerId, nowIso){
  return {
    id: r.id, serial: r.serial, name: r.name, origin: r.origin || null,
    method: r.method || null, ratio: r.ratio || null, ratio_label: r.ratioLabel || null,
    strength: r.strength || null, description: r.description || null, story: r.story || null,
    bean: r.bean || null, notes: r.notes || null,
    ingredients: r.ingredients || [], steps: r.steps || [], methods: r.methods || [],
    roaster_picks: r.roasterPicks || null,
    color: r.color || null, tag_id: r.tagId || null, code: r.code || null,
    owner_id: ownerId,
    created_at: r.createdAt ? new Date(r.createdAt).toISOString() : nowIso,
    updated_at: nowIso
  };
}
/* Bundled seed → same shape (offline / not-yet-configured fallback). */
function seedCatalog(){ return SEED.map(s => ({...s, roasterPicks: ROASTER_PICKS[s.id] || null})); }

/* This browser's own data: { custom:[…], state:{ id:{tried,rating} } }.
   Migrates the old v2 blob (which stored the whole recipe array) on first run
   so existing tried/rating/custom recipes carry over.

   When signed in, personal data comes from the cloud cache (kept in sync with
   Supabase), NOT the guest USERDATA_KEY — so the two never bleed together. The
   cache is tagged with the user id; a mismatch (or a not-yet-fetched cache)
   yields empty, and the background cloud fetch fills it in moments later. */
function loadUserData(){
  if(currentUser){
    try{
      const raw = localStorage.getItem(USERDATA_CLOUD_CACHE_KEY);
      if(raw){ const d = JSON.parse(raw); if(d.userId === currentUser.id) return { custom: d.custom || [], state: d.state || {} }; }
    }catch(e){}
    return { custom: [], state: {} };
  }
  return loadGuestUserData();
}
/* The original localStorage-only reader — the guest (signed-out) data path,
   also used by the one-time cloud migration to read what to push up. */
function loadGuestUserData(){
  try{
    const raw = localStorage.getItem(USERDATA_KEY);
    if(raw){ const d = JSON.parse(raw); return { custom: d.custom || [], state: d.state || {} }; }
  }catch(e){}
  try{
    const legacy = localStorage.getItem(STORE_KEY);
    if(legacy){
      const arr = JSON.parse(legacy);
      const custom = arr.filter(r => String(r.id).startsWith('custom-'));
      const state = {};
      arr.forEach(r => { if(r.tried || r.rating) state[r.id] = { tried: !!r.tried, rating: r.rating || 0 }; });
      return { custom, state };
    }
  }catch(e){}
  return { custom: [], state: {} };
}

/* Read the last cached Supabase response (DB rows) if we have one. */
function loadCachedCatalog(){
  try{ const c = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || 'null'); if(c && c.length) return c.map(rowToRecipe); }catch(e){}
  return null;
}

/* Build the working `recipes` array (catalog + this browser's state/customs)
   and paint every screen. */
function applyCatalog(catalog){
  const user = loadUserData();
  recipes = catalog
    .map(c => ({ ...c, tried: !!(user.state[c.id] && user.state[c.id].tried), rating: (user.state[c.id] && user.state[c.id].rating) || 0, pinned: !!(user.state[c.id] && user.state[c.id].pinned) }))
    .concat(user.custom || []);
  render();
  renderCollection();
  renderWorldPasses();
}

/* Repaint from a catalog UNLESS the user is mid-flow in Detail / Brew Mode —
   don't yank the page out from under them. Shared by the background catalog
   refresh and the background cloud-data refresh. */
function safeApplyCatalog(catalog){
  if(currentScreen === 'screen-detail' || (typeof brewState !== 'undefined' && brewState)) return;
  applyCatalog(catalog);
}

/* Instant load, then background refresh (stale-while-revalidate):
   1. Paint immediately from the local cache — or the bundled seed on a first
      visit — so the app appears at hardcoded speed, with no network wait.
   2. Fetch the live catalog from Supabase in the background; only if it
      actually changed do we re-cache and re-paint. */
function loadRecipes(){
  applyCatalog(loadCachedCatalog() || seedCatalog());
  refreshCatalog();
}

async function refreshCatalog(){
  const sb = await (window.bbSupabaseReady || Promise.resolve(null));
  if(!sb) return;
  try{
    const { data, error } = await sb.from('recipes').select('*').is('owner_id', null);
    if(error || !data || !data.length) return;
    const raw = JSON.stringify(data);
    if(raw === localStorage.getItem(CATALOG_CACHE_KEY)) return;   // unchanged → no repaint
    try{ localStorage.setItem(CATALOG_CACHE_KEY, raw); }catch(e){}
    /* Don't yank the page out from under an open Recipe Detail / Brew Mode. */
    if(currentScreen === 'screen-detail' || (typeof brewState !== 'undefined' && brewState)) return;
    applyCatalog(data.map(rowToRecipe));
  }catch(e){ /* keep whatever we already painted */ }
}

/* Split the in-memory recipes array back into the persisted personal shape:
   { custom:[user-authored recipes], state:{ id:{tried,rating} } }. */
function currentUserData(){
  const custom = recipes.filter(r => String(r.id).startsWith('custom-'));
  const state = {};
  recipes.forEach(r => { if(r.tried || r.rating || r.pinned) state[r.id] = { tried: !!r.tried, rating: r.rating || 0, pinned: !!r.pinned }; });
  return { custom, state };
}

/* Persist what this browser owns — custom recipes + tried/rating state. The
   catalog stays read-only (edited in the Supabase dashboard). Callers keep
   calling saveRecipes() unchanged; the signed-in branch adds cloud sync. */
async function saveRecipes(silent){
  const { custom, state } = currentUserData();

  if(currentUser){
    /* Mirror to the cloud cache first so an edit is never lost locally even if
       the network push fails, then push to Supabase (last-write-wins). */
    try{ localStorage.setItem(USERDATA_CLOUD_CACHE_KEY, JSON.stringify({ userId: currentUser.id, custom, state })); }catch(e){}
    syncState = 'syncing'; renderAccountUI();
    const ok = await pushUserDataToCloud(currentUser.id, custom, state);
    syncState = ok ? 'synced' : 'error';
    renderAccountUI();
    if(!ok && !silent) showToast('Saved locally — will sync when back online');
    return;
  }

  try{
    const ok = await storeSet(USERDATA_KEY, JSON.stringify({ custom, state }));
    if(!ok && !silent) showToast('Couldn’t save — try again');
  }
  catch(e){ if(!silent) showToast('Couldn’t save — try again'); }
}
function rememberSeedDeletion(id){ /* no-op in Phase 1 — only custom recipes are deletable */ }

/* Pinned favourites: flips r.pinned and repaints every surface that shows
   pin state (lanes, Collection sort, World passes) — mirrors the existing
   tried/rating toggle handlers in openDetail(). */
async function togglePinned(id, originEl){
  const r = recipes.find(x => x.id === id);
  if(!r) return;
  const wasPinned = r.pinned;
  /* Measured before the re-render, since originEl is destroyed by it. */
  const fromRect = (!wasPinned && originEl) ? originEl.getBoundingClientRect() : null;
  r.pinned = !r.pinned;
  await saveRecipes();

  _justPinnedId = wasPinned ? null : id;
  render(); renderCollection(); renderWorldPasses();
  _justPinnedId = null;   /* one-shot: later repaints must not replay it */

  if(fromRect) _flyPinToLane(fromRect, id);
}

/* The pin glyph arcs from the card's pin button up to its new stub in the
   Pinned lane, so the stub doesn't just blink into existence — you see where
   it went. Purely decorative: a floating ghost element that removes itself,
   skipped entirely without GSAP or under reduced motion. */
function _flyPinToLane(fromRect, id){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if(typeof gsap === 'undefined') return;
  const stub = document.querySelector(`#content .pin-stub[data-id="${CSS.escape(id)}"]`);
  if(!stub) return;                        /* not on the Recipes screen — nothing to fly to */
  const to = stub.getBoundingClientRect();
  if(!to.width) return;                    /* lane offscreen/collapsed */

  const ghost = document.createElement('span');
  ghost.className = 'pin-fly';
  ghost.innerHTML = PIN_SVG;
  ghost.style.left = (fromRect.left + fromRect.width/2) + 'px';
  ghost.style.top  = (fromRect.top  + fromRect.height/2) + 'px';
  document.body.appendChild(ghost);

  const dx = (to.left + to.width/2)  - (fromRect.left + fromRect.width/2);
  const dy = (to.top  + to.height/2) - (fromRect.top  + fromRect.height/2);
  /* rAF (and so GSAP's onComplete) stops while a tab is backgrounded, which
     would strand the ghost on screen — a wall-clock timer guarantees cleanup
     even if the tween never finishes. Same reasoning as Brew Mode's timer. */
  let cleaned = false;
  const done = () => { if(cleaned) return; cleaned = true; ghost.remove(); };
  setTimeout(done, 1200);

  if(typeof MotionPathPlugin !== 'undefined'){
    /* Lift up and over rather than a straight slide — the arc peak is above
       both endpoints so it reads as "tossed onto the board". */
    gsap.to(ghost, {
      motionPath:{ path:[{x:0,y:0},{x:dx*0.45,y:Math.min(dy*0.5, -70)},{x:dx,y:dy}], curviness:1.5 },
      scale:.5, opacity:0, rotate:18, duration:.6, ease:'power2.inOut', onComplete:done
    });
  } else {
    gsap.to(ghost, { x:dx, y:dy, scale:.5, opacity:0, duration:.5, ease:'power2.inOut', onComplete:done });
  }
}

/* ---------- cloud sync (Phase 2) ----------
   Full replace (delete-then-insert) of the signed-in user's rows in both
   tables on every save. Upsert alone can't propagate a local deletion, so a
   removed custom recipe would silently reappear; delete-then-insert keeps the
   cloud an exact mirror of local. Dataset is dozens of rows — no diffing. */
async function pushUserDataToCloud(userId, custom, state){
  const sb = await window.bbSupabaseReady;
  if(!sb) return false;
  const nowIso = new Date().toISOString();
  try{
    /* --- custom (user-authored) recipes → recipes table, owner_id = user --- */
    await sb.from('recipes').delete().eq('owner_id', userId);
    if(custom.length){
      const rows = custom.map(r => recipeToRow(r, userId, nowIso));
      const { error } = await sb.from('recipes').insert(rows);
      if(error) return false;
    }
    /* --- tried/rating → user_recipe_state, one row per interacted recipe --- */
    await sb.from('user_recipe_state').delete().eq('user_id', userId);
    const stateRows = Object.keys(state)
      .filter(id => state[id] && (state[id].tried || state[id].rating || state[id].pinned))
      .map(id => ({ user_id: userId, recipe_id: id, tried: !!state[id].tried, rating: state[id].rating || 0, pinned: !!state[id].pinned, updated_at: nowIso }));
    if(stateRows.length){
      const { error } = await sb.from('user_recipe_state').insert(stateRows);
      if(error) return false;
    }
    return true;
  }catch(e){ return false; }
}

/* Pull the signed-in user's personal data from Supabase, cache it (tagged with
   the user id), and repaint — mirroring the catalog's stale-while-revalidate. */
async function refreshUserDataFromCloud(){
  const sb = await window.bbSupabaseReady;
  if(!sb || !currentUser) return;
  const userId = currentUser.id;
  const [recRes, stateRes] = await Promise.all([
    sb.from('recipes').select('*').eq('owner_id', userId),
    sb.from('user_recipe_state').select('*').eq('user_id', userId)
  ]);
  if(recRes.error || stateRes.error) throw recRes.error || stateRes.error;
  const custom = (recRes.data || []).map(rowToRecipe);
  const state = {};
  (stateRes.data || []).forEach(row => { state[row.recipe_id] = { tried: !!row.tried, rating: row.rating || 0, pinned: !!row.pinned }; });
  try{ localStorage.setItem(USERDATA_CLOUD_CACHE_KEY, JSON.stringify({ userId, custom, state })); }catch(e){}
  safeApplyCatalog(loadCachedCatalog() || seedCatalog());
}

/* First-ever sign-in for this account: if the cloud has NO rows for this user
   yet, push whatever guest data is in this browser up once. Guarding on cloud
   emptiness (rather than a local "migrated" flag) is idempotent and correct
   even from a brand-new device — a second sign-in finds rows and skips. */
async function maybeMigrateLocalToCloud(){
  const sb = await window.bbSupabaseReady;
  if(!sb || !currentUser) return;
  const userId = currentUser.id;
  const [recCount, stateCount] = await Promise.all([
    sb.from('recipes').select('id', { count:'exact', head:true }).eq('owner_id', userId),
    sb.from('user_recipe_state').select('user_id', { count:'exact', head:true }).eq('user_id', userId)
  ]);
  if((recCount.count || 0) > 0 || (stateCount.count || 0) > 0) return;   // cloud already has data → authoritative
  const guest = loadGuestUserData();
  if(!(guest.custom && guest.custom.length) && !(guest.state && Object.keys(guest.state).length)) return;   // nothing to migrate
  await pushUserDataToCloud(userId, guest.custom || [], guest.state || {});
}

/* ---------- equipment storage + sync (Phase 3 foundation) ---------- */

/* Guest (signed-out) reader/writer — same localStorage-JSON-blob pattern used
   for USERDATA_KEY elsewhere in this file. */
function loadGuestEquipment(){
  try{
    const raw = localStorage.getItem(EQUIPMENT_KEY);
    if(raw){ const d = JSON.parse(raw); return { equipment: d.equipment || [], onboarded: !!d.onboarded }; }
  }catch(e){}
  return { equipment: [], onboarded: false };
}
function saveGuestEquipment(equipment, onboarded){
  try{ localStorage.setItem(EQUIPMENT_KEY, JSON.stringify({ equipment, onboarded })); }catch(e){}
}

/* Signed-in reader/writer — one row per user in `user_equipment` (upsert,
   since it's always exactly zero-or-one row), mirrored to a local cache
   tagged with the user id for instant reads next load. */
async function pushEquipmentToCloud(userId, equipment){
  const sb = await window.bbSupabaseReady;
  if(!sb) return false;
  try{
    const { error } = await sb.from('user_equipment')
      .upsert({ user_id: userId, equipment, onboarded: true, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    return !error;
  }catch(e){ return false; }
}
async function refreshEquipmentFromCloud(){
  const sb = await window.bbSupabaseReady;
  if(!sb || !currentUser) return;
  const userId = currentUser.id;
  const { data, error } = await sb.from('user_equipment').select('*').eq('user_id', userId).maybeSingle();
  if(error) throw error;
  ownedEquipment = (data && data.equipment) || [];
  try{ localStorage.setItem(EQUIPMENT_CLOUD_CACHE_KEY, JSON.stringify({ userId, equipment: ownedEquipment, onboarded: !!(data && data.onboarded) })); }catch(e){}
  /* Reflect the freshly-pulled profile in the header equipment filter + catalog. */
  if(typeof renderEquipment === 'function') renderEquipment();
  if(typeof render === 'function') render();
}

/* First-ever sign-in: if this account has no equipment row yet, carry over
   whatever the guest already picked in this browser (idempotent on cloud
   emptiness, same reasoning as maybeMigrateLocalToCloud). */
async function maybeMigrateEquipmentToCloud(){
  const sb = await window.bbSupabaseReady;
  if(!sb || !currentUser) return;
  const userId = currentUser.id;
  const { count } = await sb.from('user_equipment').select('user_id', { count:'exact', head:true }).eq('user_id', userId);
  if((count || 0) > 0) return;   // cloud already has a row → authoritative
  const guest = loadGuestEquipment();
  if(!guest.equipment.length) return;   // nothing to carry over
  await pushEquipmentToCloud(userId, guest.equipment);
}

/* Empty Set means "unfiltered — show everything"; a later Phase 3 track
   (the equipment filter) consumes this. Foundation just needs it to exist. */
function getOwnedEquipmentSet(){ return new Set(ownedEquipment); }

/* ---------- tasting journal (Phase 3) ----------
   A one-to-many log of brews per recipe (many brews of the same recipe over
   time), each a dated note + optional rating + which method was used. Guests
   keep an array per recipe in localStorage under `brewbook-tasting-<recipeId>`;
   signed-in users read/write Supabase `tasting_notes`. Works fully offline/
   guest; the cloud side is additive and degrades gracefully if
   phase3-tasting-notes.sql hasn't been run yet (inserts just fail silently and
   the local mirror keeps the data). Same guest→cloud story as tried/rating. */
const TASTING_KEY_PREFIX = 'brewbook-tasting-';
function _localTastingKey(recipeId){ return TASTING_KEY_PREFIX + recipeId; }
function loadGuestTastingNotes(recipeId){
  try{ const raw = localStorage.getItem(_localTastingKey(recipeId)); if(raw){ const a = JSON.parse(raw); if(Array.isArray(a)) return a; } }catch(e){}
  return [];
}
function saveGuestTastingNotes(recipeId, notes){
  try{ localStorage.setItem(_localTastingKey(recipeId), JSON.stringify(notes)); }catch(e){}
}

/* Newest-first list of a recipe's notes. Signed-in reads the cloud (falling
   back to the local mirror if that fails); guests read localStorage. */
async function loadTastingNotes(recipeId){
  if(currentUser){
    const sb = await window.bbSupabaseReady;
    if(sb){
      try{
        const { data, error } = await sb.from('tasting_notes')
          .select('*').eq('user_id', currentUser.id).eq('recipe_id', recipeId)
          .order('brewed_at', { ascending:false });
        if(!error && data) return data.map(row => ({
          id: row.id, methodId: row.method_id || '', rating: row.rating || 0,
          note: row.note || '', brewedAt: row.brewed_at ? new Date(row.brewed_at).getTime() : Date.now()
        }));
      }catch(e){}
    }
  }
  return loadGuestTastingNotes(recipeId).slice().sort((a, b) => (b.brewedAt || 0) - (a.brewedAt || 0));
}

/* Insert a note. Always mirrors locally (offline copy for signed-in users,
   the only copy for guests); also inserts to the cloud when signed in. */
async function saveTastingNote(recipeId, entry){
  const note = {
    id: 'tn-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
    methodId: entry.methodId || '', rating: entry.rating || 0,
    note: (entry.note || '').trim(), brewedAt: Date.now()
  };
  if(!note.note) return null;
  if(currentUser){
    const sb = await window.bbSupabaseReady;
    if(sb){
      try{
        const { data, error } = await sb.from('tasting_notes').insert({
          user_id: currentUser.id, recipe_id: recipeId, method_id: note.methodId || null,
          rating: note.rating || null, note: note.note, brewed_at: new Date(note.brewedAt).toISOString()
        }).select().single();
        if(!error && data) note.id = data.id;
      }catch(e){}
    }
  }
  const local = loadGuestTastingNotes(recipeId);
  local.push(note);
  saveGuestTastingNotes(recipeId, local);
  return note;
}

async function deleteTastingNote(recipeId, noteId){
  if(currentUser){
    const sb = await window.bbSupabaseReady;
    if(sb){ try{ await sb.from('tasting_notes').delete().eq('user_id', currentUser.id).eq('id', noteId); }catch(e){} }
  }
  saveGuestTastingNotes(recipeId, loadGuestTastingNotes(recipeId).filter(n => n.id !== noteId));
}

/* First-ever sign-in: if the account has no cloud notes yet, push every local
   note up once (guarded on cloud emptiness, same idempotency as the other
   migrations). Custom-recipe notes whose recipe isn't in the cloud catalog
   would violate the FK — the insert is wrapped so that never crashes sign-in. */
async function maybeMigrateTastingNotesToCloud(){
  const sb = await window.bbSupabaseReady;
  if(!sb || !currentUser) return;
  const userId = currentUser.id;
  const { count } = await sb.from('tasting_notes').select('id', { count:'exact', head:true }).eq('user_id', userId);
  if((count || 0) > 0) return;
  const rows = [];
  for(let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i);
    if(k && k.indexOf(TASTING_KEY_PREFIX) === 0){
      const recipeId = k.slice(TASTING_KEY_PREFIX.length);
      loadGuestTastingNotes(recipeId).forEach(n => rows.push({
        user_id: userId, recipe_id: recipeId, method_id: n.methodId || null,
        rating: n.rating || null, note: n.note, brewed_at: new Date(n.brewedAt || Date.now()).toISOString()
      }));
    }
  }
  if(rows.length){ try{ await sb.from('tasting_notes').insert(rows); }catch(e){} }
}

/* Whether the "what do you brew with?" picker should be offered right now:
   signed-in → cloud onboarded flag (already loaded into ownedEquipment by
   refreshEquipmentFromCloud, checked via its own cached onboarded flag);
   guest → local onboarded flag. Never shows twice, always skippable. */
function needsEquipmentOnboarding(){
  if(currentUser){
    try{
      const raw = localStorage.getItem(EQUIPMENT_CLOUD_CACHE_KEY);
      if(raw){ const d = JSON.parse(raw); if(d.userId === currentUser.id) return !d.onboarded; }
    }catch(e){}
    return true;   // no cache yet — cautious default, refreshEquipmentFromCloud will correct it
  }
  return !loadGuestEquipment().onboarded;
}

/* Auto-shown, once, after a first-time visitor actually reaches the app
   (never on top of the landing/splash — see enterApp() and onSignedIn()). */
function maybeOpenEquipmentOnboarding(){
  if(needsEquipmentOnboarding()) openEquipmentPicker('onboarding');
}

/* The one equipment picker, in two modes:
   'onboarding' — first-run "what do you brew with?", skippable, marks
                  onboarded regardless of whether anything was picked.
   'edit'       — reopened anytime from the account dropdown ("Edit your
                  equipment"), pre-checked with the current selection. */
function openEquipmentPicker(mode){
  const panel = document.getElementById('equipmentPanel');
  const sheet = document.getElementById('equipmentSheet');
  if(!panel || !sheet) return;

  const current = new Set(ownedEquipment.length ? ownedEquipment : loadGuestEquipment().equipment);
  const picked = new Set(current);   // working selection, committed on Save/Skip

  const categories = [];
  EQUIPMENT_TAXONOMY.forEach(m => { if(!categories.includes(m.category)) categories.push(m.category); });

  const chipsHtml = categories.map(cat => `
    <div class="eq-cat">
      <div class="eq-cat-label">${esc(cat)}</div>
      <div class="eq-chip-grid">
        ${EQUIPMENT_TAXONOMY.filter(m => m.category === cat).map(m => `
          <button class="if-chip eq-chip${picked.has(m.id) ? ' sel' : ''}" type="button" data-eq="${esc(m.id)}" title="${esc(m.hint || '')}">
            <span class="nm">${esc(m.label)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');

  sheet.innerHTML = `
    <div class="sheet-head">
      <h2>${mode === 'edit' ? 'Your brewing equipment' : 'What do you brew with?'}</h2>
      <button class="close-btn" data-close aria-label="Close">✕</button>
    </div>
    <p class="eq-intro">${mode === 'edit'
      ? 'Update what you brew with — this only shapes recommendations, it never hides recipes.'
      : 'Pick everything you have. This never limits what you can explore — it just helps us point out what you can make tonight.'}</p>
    <div class="eq-groups">${chipsHtml}</div>
    <div class="form-actions">
      ${mode === 'onboarding' ? '<button class="btn" id="eqSkipBtn" type="button">Skip — I\'ll decide later</button>' : '<button class="btn" data-close type="button">Cancel</button>'}
      <button class="btn primary" id="eqSaveBtn" type="button">${mode === 'onboarding' ? 'Get started' : 'Save'}</button>
    </div>
    <p class="eq-settings-note">You can change this anytime from your account menu.</p>`;

  sheet.querySelectorAll('[data-eq]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.eq;
      if(picked.has(id)){ picked.delete(id); btn.classList.remove('sel'); }
      else { picked.add(id); btn.classList.add('sel'); }
    };
  });

  const commit = async (skipped) => {
    const list = skipped ? Array.from(current) : Array.from(picked);
    ownedEquipment = list;
    if(currentUser){
      await pushEquipmentToCloud(currentUser.id, list);
      try{ localStorage.setItem(EQUIPMENT_CLOUD_CACHE_KEY, JSON.stringify({ userId: currentUser.id, equipment: list, onboarded: true })); }catch(e){}
    } else {
      saveGuestEquipment(list, true);
    }
    closeEquipmentPicker();
    /* Onboarding picker and the header equipment filter are the same profile —
       reflect the new selection in the filter + catalog immediately. */
    if(typeof renderEquipment === 'function') renderEquipment();
    if(typeof render === 'function') render();
    if(!skipped) showToast(list.length ? 'Saved your equipment ☕' : 'Saved — showing everything');
  };

  const saveBtn = document.getElementById('eqSaveBtn');
  if(saveBtn) saveBtn.onclick = () => commit(false);
  const skipBtn = document.getElementById('eqSkipBtn');
  if(skipBtn) skipBtn.onclick = () => commit(true);
  sheet.querySelectorAll('[data-close]').forEach(b => b.onclick = closeEquipmentPicker);

  panel.classList.add('open');
}
function closeEquipmentPicker(){
  const panel = document.getElementById('equipmentPanel');
  if(panel) panel.classList.remove('open');
}

/* Runs after a session is established (fresh sign-in or restored on load). */
async function onSignedIn(){
  syncState = 'syncing'; renderAccountUI();
  try{
    await maybeMigrateLocalToCloud();
    await refreshUserDataFromCloud();
    await maybeMigrateEquipmentToCloud();
    await refreshEquipmentFromCloud();
    await maybeMigrateTastingNotesToCloud();
    syncState = 'synced';
  }catch(e){ syncState = 'error'; }
  renderAccountUI();
  maybeOpenEquipmentOnboarding();
}

/* Initialise auth: build the control (works even if Supabase isn't configured),
   restore any existing session, and subscribe to sign-in / sign-out events. */
/* Supabase sends failures back as ?error=…/#error=… on the redirect URL (a
   rejected redirect_to, an expired magic link, a denied Google consent). We
   were dropping those silently, so a misconfiguration looked like "nothing
   happens" — surface it instead, then strip the params so a refresh is clean. */
function reportAuthErrorFromUrl(){
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const code = q.get('error') || h.get('error');
  if(!code) return null;
  const desc = (q.get('error_description') || h.get('error_description') || '').replace(/\+/g, ' ');
  history.replaceState(null, '', location.origin + location.pathname);
  return desc || code;
}

async function initAuth(){
  buildAccountUI();
  const authErr = reportAuthErrorFromUrl();
  const sb = await (window.bbSupabaseReady || Promise.resolve(null));
  if(!sb) return;
  try{
    const { data:{ session } } = await sb.auth.getSession();
    currentUser = session ? session.user : null;
    renderAccountUI();
    if(currentUser){ dismissWelcome(); await onSignedIn(); }
  }catch(e){}

  /* Applied after the session restore above, since renderAccountUI() rebuilds
     the panel and would otherwise wipe the message straight back out. */
  if(authErr && !currentUser){
    /* Skip the landing: this visitor was mid-sign-in, so dropping them back on
       the marketing page would bury the reason it failed. */
    dismissWelcome();
    accountOpen = true; renderAccountUI();
    setAccountHint(authErr, true);
    if(typeof showToast === 'function') showToast('Sign-in failed');
  }

  sb.auth.onAuthStateChange((event, session) => {
    if(event === 'SIGNED_IN'){
      const was = currentUser && currentUser.id;
      currentUser = session ? session.user : null;
      accountOpen = false;
      dismissWelcome();   // a signed-in user never sees the landing
      renderAccountUI();
      refreshCurrentGate();   // unlock World/Collection if the user is on it
      if(currentUser && currentUser.id !== was) onSignedIn();
    } else if(event === 'SIGNED_OUT'){
      currentUser = null; syncState = 'idle'; accountOpen = false;
      try{ localStorage.removeItem(USERDATA_CLOUD_CACHE_KEY); localStorage.removeItem(EQUIPMENT_CLOUD_CACHE_KEY); }catch(e){}
      ownedEquipment = loadGuestEquipment().equipment;   // restore the untouched guest equipment profile
      if(typeof renderEquipment === 'function') renderEquipment();
      renderAccountUI();
      refreshCurrentGate();   // re-lock World/Collection if the user is on it
      loadRecipes();   // repaint from the untouched guest data
    }
  });
}

/* ---------- welcome / landing (marketing first impression) ----------
   Shown to first-time, signed-out visitors. Recipes stay fully open — this is
   a front door, not a gate. "Explore recipes" reveals the app; the choice is
   remembered so returning visitors go straight in. */
function initWelcome(){
  const el = document.getElementById('welcome');
  if(!el) return;
  /* The landing is the signed-out home page: show it on every load/refresh
     while there's no session. Signed-in visitors skip straight to the app
     (initAuth also dismisses it if the session resolves a moment later). */
  if(hasSupabaseSession()){ el.style.display = 'none'; return; }

  /* Explore → play the intro splash as a loading transition, then the app.
     Sign-in buttons → go straight into the app (no 4s intro before you can
     sign in) AND open the account dropdown. The dropdown open is deferred so
     the click doesn't bubble to the outside-click handler and re-close it. */
  const explore = () => enterApp(true);
  const signIn  = () => { enterApp(false); setTimeout(() => { accountOpen = true; renderAccountUI(); }, 460); };
  const exploreBtn = document.getElementById('welcomeExplore');
  if(exploreBtn) exploreBtn.onclick = explore;
  ['welcomeSignIn','welcomeUnlock'].forEach(id => { const b = document.getElementById(id); if(b) b.onclick = signIn; });

  /* Fluid scroll motion (colour morph + parallax + reveal), unless the user
     prefers reduced motion. Set .motion BEFORE showing so reveal elements
     start hidden with no flash. */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced){ document.documentElement.classList.add('motion'); initWelcomeMotion(el); initWelcomeAtmosphere(el); }

  initWelcomeShowcase();

  el.style.display = 'block';

  /* Journey created after display:block so ScrollTrigger measures the real,
     laid-out #welcome scroller (not a hidden zero-height element). */
  initWelcomeJourney(el);
}

/* Ambient background: a canvas of drifting aroma motes, soft bokeh, and a few
   slow line-art coffee beans, tinted warm->cool->warm from the scroll position
   so it blends with the colour morph behind every section. Subtle by design —
   it fills the space without competing with the content. */
let welcomeAtmosRAF = null;
function stopWelcomeAtmos(){ if(welcomeAtmosRAF){ cancelAnimationFrame(welcomeAtmosRAF); welcomeAtmosRAF = null; } }
function initWelcomeAtmosphere(el){
  const canvas = document.getElementById('welcomeAtmos');
  if(!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const moteN = Math.round(Math.min(74, Math.max(34, W / 20)));
  const motes = [], bokeh = [], beans = [];
  for(let i = 0; i < moteN; i++) motes.push({ x: rand(0, W), y: rand(0, H), r: rand(0.7, 2.8), sp: rand(0.12, 0.42), ph: rand(0, TAU), sw: rand(0.2, 0.7), amp: rand(6, 22), a: rand(0.1, 0.3) });
  for(let i = 0; i < 8; i++) bokeh.push({ x: rand(0, W), y: rand(0, H), r: rand(52, 140), sp: rand(0.04, 0.14), a: rand(0.025, 0.07) });
  for(let i = 0; i < 6; i++) beans.push({ x: rand(0, W), y: rand(0, H), r: rand(5, 9), sp: rand(0.08, 0.2), rot: rand(0, Math.PI), vr: rand(-0.003, 0.003), a: rand(0.05, 0.1) });

  const WARM = [232, 182, 136], COOL = [150, 185, 224];
  const WARM_L = [150, 100, 60], COOL_L = [90, 115, 160];
  const mix = (c1, c2, t) => [c1[0] + (c2[0]-c1[0])*t, c1[1] + (c2[1]-c1[1])*t, c1[2] + (c2[2]-c1[2])*t];
  function tintAt(p, light){
    const w = light ? WARM_L : WARM, c = light ? COOL_L : COOL;
    return p < 0.5 ? mix(w, c, p / 0.5) : mix(c, w, (p - 0.5) / 0.5);
  }

  function frame(){
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    const max = (el.scrollHeight - el.clientHeight) || 1;
    const prog = Math.min(1, Math.max(0, el.scrollTop / max));
    const tint = tintAt(prog, light);
    const col = a => 'rgba(' + Math.round(tint[0]) + ',' + Math.round(tint[1]) + ',' + Math.round(tint[2]) + ',' + a + ')';
    const aScale = light ? 1.1 : 1;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';

    for(const b of bokeh){
      b.y -= b.sp; if(b.y < -b.r){ b.y = H + b.r; b.x = rand(0, W); }
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, col(b.a * aScale)); g.addColorStop(1, col(0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    }
    for(const bn of beans){
      bn.y -= bn.sp; bn.rot += bn.vr; if(bn.y < -bn.r){ bn.y = H + bn.r; bn.x = rand(0, W); }
      ctx.save(); ctx.translate(bn.x, bn.y); ctx.rotate(bn.rot);
      ctx.strokeStyle = col(bn.a * aScale); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, bn.r, bn.r * 0.62, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-bn.r * 0.55, -bn.r * 0.3); ctx.quadraticCurveTo(0, 0, bn.r * 0.55, bn.r * 0.3); ctx.stroke();
      ctx.restore();
    }
    for(const m of motes){
      m.y -= m.sp; m.ph += 0.01;
      if(m.y < -m.r){ m.y = H + m.r; m.x = rand(0, W); }
      ctx.fillStyle = col(m.a * aScale);
      ctx.beginPath(); ctx.arc(m.x + Math.sin(m.ph * m.sw) * m.amp, m.y, m.r, 0, TAU); ctx.fill();
    }

    welcomeAtmosRAF = requestAnimationFrame(frame);
  }
  stopWelcomeAtmos();
  welcomeAtmosRAF = requestAnimationFrame(frame);
}

/* Cycle the hero's brew-method illustrations (moka pot, pour over, French
   press, cezve, Chemex, AeroPress, espresso machine) like they're mounted on
   a slowly rotating display — the outgoing method turns away, the incoming
   one turns in — syncing the label + indicator dots. Dots are clickable;
   auto-advance pauses for reduced-motion. */
let welcomeShowcaseTimer = null;
function initWelcomeShowcase(){
  const showcase = document.getElementById('welcomeArt');
  const label    = document.getElementById('welcomeMethodLabel');
  const dotsWrap = document.getElementById('welcomeMethodDots');
  if(!showcase) return;
  const methods = [].slice.call(showcase.querySelectorAll('.wl-method'));
  if(methods.length < 2) return;
  let idx = 0;
  if(dotsWrap){
    dotsWrap.innerHTML = methods.map((m, i) =>
      `<button class="wl-dot${i === 0 ? ' on' : ''}" type="button" aria-label="${esc(m.dataset.label || '')}"></button>`
    ).join('');
  }
  function show(n){
    const outgoing = methods[idx];
    idx = (n + methods.length) % methods.length;
    const incoming = methods[idx];

    outgoing.classList.remove('is-active');
    outgoing.classList.add('is-leaving');
    /* Reset the outgoing element back to its default "ready to enter" state
       once its exit transition finishes, so it turns in correctly next time. */
    setTimeout(() => outgoing.classList.remove('is-leaving'), 820);

    /* Added synchronously, not via requestAnimationFrame: these elements are
       always present in the DOM (never display:none), so their "before" style
       is already stable and the transition fires correctly without waiting a
       frame — and not depending on rAF means this can't get stuck if the tab
       is backgrounded/throttled right when a method change fires. */
    incoming.classList.add('is-active');

    if(label) label.textContent = incoming.dataset.label || '';
    if(dotsWrap) [].forEach.call(dotsWrap.children, (d, i) => d.classList.toggle('on', i === idx));
  }
  if(label) label.textContent = methods[0].dataset.label || '';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function start(){ if(!reduced){ clearInterval(welcomeShowcaseTimer); welcomeShowcaseTimer = setInterval(() => show(idx + 1), 3400); } }
  if(dotsWrap){
    dotsWrap.onclick = e => {
      const d = e.target.closest('.wl-dot'); if(!d) return;
      const i = [].indexOf.call(dotsWrap.children, d);
      if(i >= 0){ show(i); start(); }
    };
  }
  start();
}

/* Scroll-driven motion for the landing, scoped to the #welcome scroll
   container (its own scrollTop, not the window). */
function initWelcomeMotion(el){
  const bg       = document.getElementById('welcomeBg');
  const progress = document.getElementById('welcomeProgress');
  const art      = document.getElementById('welcomeArt');
  const copy     = document.getElementById('welcomeHeroCopy');
  const branch   = document.getElementById('welcomeBranch');
  const hero     = el.querySelector('.wl-hero');
  /* The journey track is an anchor in its own right, so the page warms into a
     richer roast as the bean travels and then cools into the features' night
     panel — the scene shares the landing's background instead of sitting on
     top of one. Order here must match the PALETTES arrays below. */
  const sections = [el.querySelector('.wl-hero'), el.querySelector('.wlj-track'), el.querySelector('.wl-features'), el.querySelector('.wl-quiet')];
  if(sections.some(s => !s)) return;

  const PALETTES = {
    dark:  [[30,21,15],[44,30,21],[14,20,32],[26,17,11]],
    light: [[247,241,230],[240,231,216],[14,20,32],[243,235,221]]
  };
  const lerp = (a,b,t) => a + (b-a)*t;
  const mix  = (c1,c2,t) => [Math.round(lerp(c1[0],c2[0],t)),Math.round(lerp(c1[1],c2[1],t)),Math.round(lerp(c1[2],c2[2],t))];
  const scale = (c,f) => c.map(v => Math.max(0,Math.min(255,Math.round(v*f))));
  const rgb = c => 'rgb('+c[0]+','+c[1]+','+c[2]+')';

  function baseColorAt(centre){
    const pal = PALETTES[document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'];
    const centres = sections.map(s => s.offsetTop + s.offsetHeight/2);
    if(centre <= centres[0]) return pal[0];
    if(centre >= centres[centres.length-1]) return pal[pal.length-1];
    for(let i=0;i<centres.length-1;i++){
      if(centre >= centres[i] && centre <= centres[i+1]){
        return mix(pal[i], pal[i+1], (centre-centres[i])/(centres[i+1]-centres[i]));
      }
    }
    return pal[0];
  }

  function paint(){
    const y = el.scrollTop, vh = el.clientHeight;
    const max = el.scrollHeight - vh;
    const base = baseColorAt(y + vh/2);
    if(bg) bg.style.background = 'radial-gradient(130% 90% at 50% 8%,'+rgb(scale(base,1.42))+' 0%,'+rgb(base)+' 55%,'+rgb(scale(base,0.6))+' 100%)';
    if(progress) progress.style.width = (max > 0 ? (y/max)*100 : 0) + '%';
    const hp = Math.min(y / (hero.offsetHeight || vh), 1);
    if(art){ art.style.transform = 'translateY('+(y*-0.10)+'px) scale('+(1-hp*0.05)+')'; art.style.opacity = String(1-hp*0.25); }
    if(copy){ copy.style.transform = 'translateY('+(y*-0.16)+'px)'; copy.style.opacity = String(1-hp*0.55); }
    if(branch){ const r = branch.getBoundingClientRect(); branch.style.transform = 'translateY('+(((r.top + r.height/2 - vh/2)/vh)*-26)+'px)'; }
  }

  let ticking = false;
  el.addEventListener('scroll', () => {
    if(!ticking){ ticking = true; requestAnimationFrame(() => { paint(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener('resize', paint);
  window.__wlPaint = paint;   // repaint after a theme change (initAuth/theme toggle)

  /* Reveal on scroll — elements enter the real viewport as the container
     scrolls, so a viewport-rooted observer fires correctly. */
  const reveals = [].slice.call(el.querySelectorAll('.wl-reveal'));
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(r => io.observe(r));
  } else {
    reveals.forEach(r => r.classList.add('in'));
  }

  paint();
}

/* Scroll-pinned "one bean, four checkpoints" journey on the landing, ported
   from the motion concept. Pinning is CSS position:sticky (see .wlj-stage);
   GSAP only drives a scrubbed timeline keyed to scroll progress inside
   #welcome's own scroll container (scroller:), so it must be created AFTER the
   landing is shown/laid out. Degrades to a static arrived state under reduced
   motion or if GSAP/its plugins fail to load. */
let _welcomeJourneyTL = null;
function _killWelcomeJourney(){
  if(_welcomeJourneyTL){
    if(_welcomeJourneyTL.scrollTrigger) _welcomeJourneyTL.scrollTrigger.kill();
    _welcomeJourneyTL.kill();
    _welcomeJourneyTL = null;
  }
}
function initWelcomeJourney(scroller){
  const track = document.getElementById('welcomeJourneyTrack');
  if(!track) return;

  const STAGES = [
    { dep:'GRN', arr:'ROA', title:'Green <span class="accent">cherry</span>', desc:"Harvested at peak ripeness, still carrying the moisture and grassy sharpness that roasting hasn't touched yet." },
    { dep:'ROA', arr:'GRD', title:'First <span class="accent">crack</span>', desc:'Sugars caramelize, oils rise to the surface. This is where a bean earns its roast name.' },
    { dep:'GRD', arr:'CUP', title:'Full <span class="accent">extraction</span>', desc:'Hot water finds every fissure, pulling colour, body, and aroma out of the grounds.' },
    { dep:'CUP', arr:'YOU', title:'Ready to <span class="accent">board</span>', desc:'Poured, logged, stamped. One more entry in the atlas.' }
  ];

  const depEl   = document.getElementById('welcomeJourneyDep');
  const arrEl   = document.getElementById('welcomeJourneyArr');
  const titleEl = document.getElementById('welcomeJourneyTitle');
  const descEl  = document.getElementById('welcomeJourneyDesc');
  const stamp   = document.getElementById('welcomeJourneyStamp');
  const tickers = [].slice.call(track.querySelectorAll('.wlj-ticker span'));
  const dots    = [].slice.call(track.querySelectorAll('.wlj-dot'));
  const routeDraw = document.getElementById('wljRouteDraw');
  const beanBody  = document.getElementById('wljBeanBody');
  const beanCrack = document.getElementById('wljBeanCrack');

  /* Fully-arrived end state — reduced-motion and no-GSAP fallback. */
  function settleEnd(){
    tickers.forEach(s => s.classList.add('active'));
    dots.forEach(d => d.classList.add('hit'));
    if(beanBody){ beanBody.setAttribute('fill','#2e221a'); beanBody.setAttribute('stroke','#3a1f0e'); }
    if(beanCrack) beanCrack.setAttribute('stroke','#3a1f0e');
    if(routeDraw) routeDraw.style.strokeDashoffset = '0';
    if(stamp){ stamp.style.opacity = '1'; stamp.style.transform = 'rotate(-9deg) scale(1)'; }
    const last = STAGES[STAGES.length-1];
    if(depEl) depEl.textContent = last.dep;
    if(arrEl) arrEl.textContent = last.arr;
    if(titleEl) titleEl.innerHTML = last.title;
    if(descEl) descEl.textContent = last.desc;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined'){ settleEnd(); return; }

  const plugins = [ScrollTrigger];
  if(typeof DrawSVGPlugin !== 'undefined')   plugins.push(DrawSVGPlugin);
  if(typeof MotionPathPlugin !== 'undefined') plugins.push(MotionPathPlugin);
  gsap.registerPlugin.apply(gsap, plugins);
  const hasDraw = (typeof DrawSVGPlugin !== 'undefined');
  const hasPath = (typeof MotionPathPlugin !== 'undefined');

  _killWelcomeJourney();
  gsap.set('#wljRouteDraw', hasDraw ? { drawSVG:'0%' } : { opacity:0 });
  gsap.set('.wlj-stamp', { transformOrigin:'50% 50%' });

  let lastIdx = -1;
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: track,
      scroller: scroller || window,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.1,   /* longer catch-up = the scene drifts rather than tracks */
      onUpdate(self){
        const idx = Math.min(3, Math.floor(self.progress * 4));
        if(idx === lastIdx) return;
        lastIdx = idx;
        tickers.forEach((el,i) => el.classList.toggle('active', i <= idx));
        const s = STAGES[idx];
        if(depEl) depEl.textContent = s.dep;
        if(arrEl) arrEl.textContent = s.arr;
        if(titleEl) titleEl.innerHTML = s.title;
        if(descEl) descEl.textContent = s.desc;
        gsap.fromTo([titleEl, descEl], { opacity:0, y:16 }, { opacity:1, y:0, duration:.85, ease:'power2.out', stagger:.09, overwrite:true });
      }
    }
  });

  /* Everything below is keyed so the flight lands on dot N exactly as stage N
     begins. Stage boundaries come from floor(progress*4) — .25/.5/.75 — so the
     flight spans 0->.75 (dot 2 at .25, dot 3 at .5, dot 4 at .75) and the last
     quarter is left entirely to the stamp finale, unhurried. */
  const FLIGHT = .75;

  /* bean: hollow green outline -> glossy roast, with a little life mid-flight */
  tl.to('#wljBeanBody', { stroke:'#a8693c', duration:.22 }, 0)
    .to('#wljBeanBody', { fill:'#8f5526', stroke:'#3a1f0e', duration:.26 }, .22)
    .to('#wljBeanCrack', { stroke:'#3a1f0e', duration:.22 }, .22)
    .to('#wljBeanBody', { scale:1.06, transformOrigin:'50% 50%', duration:.12, yoyo:true, repeat:1 }, .26)
    .to('#wljBeanBody', { fill:'#2e221a', duration:.26 }, .49);

  /* route line draws in as we travel (DrawSVG if present, else a fade) */
  tl.to('#wljRouteDraw', hasDraw ? { drawSVG:'100%', ease:'none', duration:FLIGHT } : { opacity:1, ease:'none', duration:FLIGHT }, 0);

  /* plane follows the path */
  if(hasPath){
    tl.to('#wljPlane', { motionPath:{ path:'#wljRoutePath', align:'#wljRoutePath', alignOrigin:[.5,.5], autoRotate:true }, ease:'none', duration:FLIGHT }, 0);
  }

  /* stop dots light as the plane reaches each one — including the departure
     dot (1), so all four read the same copper rather than the origin sitting
     dark against the others. */
  tl.to('.wlj-dot:nth-of-type(1)', { fill:'#cf7f45', stroke:'#cf7f45', duration:.06 }, .01)
    .to('.wlj-dot:nth-of-type(2)', { fill:'#cf7f45', stroke:'#cf7f45', duration:.06 }, .25)
    .to('.wlj-dot:nth-of-type(3)', { fill:'#cf7f45', stroke:'#cf7f45', duration:.06 }, .50)
    .to('.wlj-dot:nth-of-type(4)', { fill:'#cf7f45', stroke:'#cf7f45', duration:.06 }, FLIGHT);

  /* finale: stamp slams down just after arrival, then settles */
  /* Ends at exactly 1.0 so the timeline's duration is 1 and scroll progress
     maps 1:1 onto it — that's what keeps dot N lighting on stage N's boundary. */
  tl.to('.wlj-stamp', { opacity:1, scale:1, rotate:-9, duration:.18, ease:'back.out(3)' }, .80)
    .to('.wlj-stamp', { scale:.94, duration:.08 }, .92);

  _welcomeJourneyTL = tl;
  /* Measurements can shift as fonts settle after first show; refresh once. */
  requestAnimationFrame(() => { if(typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(); });
}

/* Reveal the app from the landing page and remember the choice.
   playIntro=true (Explore recipes) plays the splash intro as the loading
   transition, then the app is revealed beneath it; playIntro=false (Sign in)
   just fades the landing so the user reaches the app immediately. */
function enterApp(playIntro){
  if(welcomeShowcaseTimer){ clearInterval(welcomeShowcaseTimer); welcomeShowcaseTimer = null; }
  stopWelcomeAtmos();
  _killWelcomeJourney();
  const el = document.getElementById('welcome');
  if(playIntro){
    if(el) el.style.display = 'none';
    if(typeof playSplash === 'function') playSplash();
    /* Wait out the splash before offering the equipment picker — showing it
       underneath/over the intro would look broken. Guest-only path: a signed-in
       user's check already runs from onSignedIn() once sync settles. */
    setTimeout(() => { if(!currentUser) maybeOpenEquipmentOnboarding(); }, 3200);
    return;
  }
  if(!el) return;
  el.style.transition = 'opacity .4s ease';
  el.style.opacity = '0';
  setTimeout(() => { el.style.display = 'none'; if(!currentUser) maybeOpenEquipmentOnboarding(); }, 460);
}

/* Hide the landing with no fade — used when a signed-in session is detected. */
function dismissWelcome(){
  if(welcomeShowcaseTimer){ clearInterval(welcomeShowcaseTimer); welcomeShowcaseTimer = null; }
  stopWelcomeAtmos();
  _killWelcomeJourney();
  const el = document.getElementById('welcome');
  if(el) el.style.display = 'none';
}

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Canonical equipment id -> its pretty display label (from EQUIPMENT_TAXONOMY).
   Recipes store the machine-friendly id (e.g. "moka", "cezve"); every place
   that shows a recipe's method as text should go through this instead of
   printing the raw id. Falls back to a title-cased version of the id itself
   for anything not in the taxonomy (e.g. a legacy or unusual custom value),
   so nothing ever renders as an ugly raw slug. */
function methodLabel(id){
  if(!id) return '';
  const m = typeof EQUIPMENT_TAXONOMY !== 'undefined' && EQUIPMENT_TAXONOMY.find(x => x.id === id);
  if(m) return m.label;
  return String(id).replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
}
/* <optgroup> options for the add/edit recipe form's method <select>, grouped
   by EQUIPMENT_TAXONOMY category in taxonomy order. Each <option value="id">
   so the form reads back a canonical id, not a display string. */
function equipmentSelectOptionsHTML(selectedId){
  const categories = [];
  EQUIPMENT_TAXONOMY.forEach(m => { if(!categories.includes(m.category)) categories.push(m.category); });
  return categories.map(cat => `
    <optgroup label="${esc(cat)}">
      ${EQUIPMENT_TAXONOMY.filter(m => m.category === cat).map(m =>
        `<option value="${esc(m.id)}" ${selectedId === m.id ? 'selected' : ''}>${esc(m.label)}</option>`
      ).join('')}
    </optgroup>
  `).join('');
}
/* ---------- difficulty + time (Phase 3b) ----------
   Derived from the brew method (METHOD_META in data.js), so the badge is
   accurate per method with no per-recipe data, and updates live on the Detail
   screen when the method switcher changes. An explicit r.difficulty /
   r.timeMinutes (or the same on a methods[] variant) still wins if ever set —
   e.g. a future custom recipe — otherwise we look up by the method id. */
function methodMeta(id){
  return (typeof METHOD_META !== 'undefined' && (METHOD_META[id] || METHOD_META._DEFAULT)) || { difficulty:'easy', minutes:5 };
}
function _methodVariant(r, methodId){
  if(!methodId || !r.methods) return null;
  return r.methods.find(m => m.id === methodId) || null;
}
function recipeDifficulty(r, methodId){
  const v = _methodVariant(r, methodId);
  if(v && v.difficulty) return v.difficulty;
  if(!methodId && r.difficulty) return r.difficulty;
  return methodMeta(methodId || r.method).difficulty;
}
function recipeTimeMinutes(r, methodId){
  const v = _methodVariant(r, methodId);
  if(v && v.timeMinutes) return v.timeMinutes;
  if(!methodId && r.timeMinutes) return r.timeMinutes;
  return methodMeta(methodId || r.method).minutes;
}
/* Serve style for the Hot/Iced filter — r.serve (custom recipes), else the
   SERVE side-table (catalog), else 'hot'. */
function recipeServe(r){
  if(r.serve) return r.serve;
  if(typeof SERVE !== 'undefined' && SERVE[r.id]) return SERVE[r.id];
  return 'hot';
}
const DIFF_LABEL = { easy:'Easy', medium:'Medium', advanced:'Advanced' };
/* Render N minutes as a compact human string: "3 min", "45 min", "12h",
   "2h 5m". Long unattended steeps (cold brew ≈ 720) read as hours. */
function fmtDuration(min){
  min = Math.round(min || 0);
  if(min < 60) return min + ' min';
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? h + 'h' : h + 'h ' + m + 'm';
}
/* Small "◑ Medium · 8 min" pill shown on cards and the Detail hero. */
function metaBadgeHTML(r, methodId){
  const d = recipeDifficulty(r, methodId);
  return `<span class="meta-badge meta-${d}"><span class="meta-dot" aria-hidden="true"></span>${DIFF_LABEL[d] || d} · ${fmtDuration(recipeTimeMinutes(r, methodId))}</span>`;
}

/* ---------- units (Phase 3: metric / imperial) ----------
   Persisted like the theme. Deliberately converts VOLUMES (ml/L → fl oz/cups)
   and TEMPERATURES (°C → °F) only — weights are left in grams and tsp/tbsp/cup
   are already US customary. Coffee is measured by weight in grams everywhere,
   including US specialty coffee, so converting "17 g" to "0.6 oz" would be
   worse, not better. fmtAmounts() is a no-op in metric, and rewrites amounts
   in a free-text ingredient/step string in imperial. */
let unitPref = 'metric';
try{ const u = localStorage.getItem('bb-units'); if(u === 'imperial' || u === 'metric') unitPref = u; }catch(e){}
function _trimNum(n){ return (Math.round(n * 100) / 100).toString(); }
function _convVol(nStr, unit){
  let ml = parseFloat(nStr);
  if(/^l/i.test(unit)) ml *= 1000;
  if(ml >= 240){ const cups = Math.round(ml / 240 * 4) / 4; return { val: cups, label: cups === 1 ? 'cup' : 'cups' }; }
  return { val: Math.round(ml / 29.5735 * 2) / 2, label: 'fl oz' };
}
function fmtAmounts(text){
  if(unitPref !== 'imperial' || !text) return text;
  /* volumes: single "60 ml" or range "200–250 ml" / "1–2 l" */
  text = text.replace(/(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*(ml|l)\b/gi, (m, a, b, unit) => {
    const A = _convVol(a, unit);
    if(b != null){
      const B = _convVol(b, unit);
      return A.label === B.label
        ? `${_trimNum(A.val)}–${_trimNum(B.val)} ${B.label}`
        : `${_trimNum(A.val)} ${A.label}–${_trimNum(B.val)} ${B.label}`;
    }
    return `${_trimNum(A.val)} ${A.label}`;
  });
  /* temperatures: "93°C" / "93 °C" */
  text = text.replace(/(\d+(?:\.\d+)?)\s*°\s*C\b/gi, (m, c) => Math.round(parseFloat(c) * 9 / 5 + 32) + '°F');
  return text;
}
function unitsControlHTML(){
  return `<div class="account-units-row">
    <span class="account-units-label">Units</span>
    <div class="qf-seg" data-units-seg>
      <button class="qf-pill${unitPref==='metric'?' active':''}" data-unit="metric" type="button">Metric</button>
      <button class="qf-pill${unitPref==='imperial'?' active':''}" data-unit="imperial" type="button">Imperial</button>
    </div>
  </div>`;
}
function wireUnitsControl(scope){
  const seg = scope.querySelector('[data-units-seg]');
  if(!seg) return;
  seg.onclick = e => {
    const b = e.target.closest('[data-unit]'); if(!b) return;
    unitPref = b.dataset.unit;
    try{ localStorage.setItem('bb-units', unitPref); }catch(err){}
    seg.querySelectorAll('[data-unit]').forEach(x => x.classList.toggle('active', x.dataset.unit === unitPref));
    /* Repaint anything showing amounts right now. */
    if(currentScreen === 'screen-detail' && detailRecipeId) openDetail(detailRecipeId);
    if(typeof brewState !== 'undefined' && brewState && brewEls) _renderBrewStep();
  };
}

const pad = n => String(n).padStart(3,'0');
function fmtDate(ts){ if(!ts) return ''; return new Date(ts).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function fmtDateShort(ts){ if(!ts) return ''; const d = new Date(ts); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase(); }
function dateInputVal(ts){ const d = ts ? new Date(ts) : new Date(); return d.toISOString().slice(0,10); }
function nextSerial(){ return recipes.reduce((m,r)=>Math.max(m, r.serial||0), 0) + 1; }
function showToast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._tm); t._tm = setTimeout(()=>t.classList.remove('show'), 2400); }

function buyPicksHTML(id){
  /* Prefer the recipe's own roaster_picks (from the DB row); fall back to the
     bundled ROASTER_PICKS map for the seed / offline case. */
  const rec = recipes.find(x => x.id === id);
  const picks = (rec && rec.roasterPicks) || ROASTER_PICKS[id];
  if(!picks || (!picks.bluetokai && !picks.thirdwave)) return '';
  const bt = picks.bluetokai || [], tw = picks.thirdwave || [];
  return `<button class="detail-picks-toggle" data-picks-toggle><span>🛒 Where to buy it — in India (Blue Tokai · Third Wave)</span><span class="chev">▾</span></button>
    <div class="detail-picks-body" data-picks-body>
      <p class="detail-picks-note">Anywhere else? Match the roast profile above — any local roaster's equivalent works just as well.</p>
      ${bt.length?`<div class="detail-roaster bt"><h4><span class="pin"></span>Blue Tokai</h4><div class="pick-label">Best pick for this drink</div><ul>${bt.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
      ${tw.length?`<div class="detail-roaster tw"><h4><span class="pin"></span>Third Wave</h4><div class="pick-label">Best pick for this drink</div><ul>${tw.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
    </div>`;
}

/* ---------- method filter chips (removed from the toolbar) ----------
   The method rail and the "All / To try / Made it" status control were
   removed from the UI; activeMethod/triedFilter simply stay at their
   defaults ('all') since there's no control left to change them. Guarded
   so nothing throws if these elements aren't in the DOM. */
function buildChips(){
  const chipsEl = document.getElementById('methodChips');
  if(chipsEl){
    const order = ['all','moka','instant','blender','cezve','other'];
    const present = new Set(['all']);
    recipes.forEach(r => present.add(order.includes(r.method) ? r.method : 'other'));
    const methods = order.filter(m => present.has(m));
    chipsEl.innerHTML = methods.map(m => `<button class="chip" data-method="${m}">${m === 'all' ? 'ALL' : m.toUpperCase()}</button>`).join('');
    chipsEl.onclick = e => { const b = e.target.closest('.chip'); if(!b) return; activeMethod = b.dataset.method; animateNext = true; render(); };
  }

  const triedEl = document.getElementById('triedChips');
  if(triedEl){
    triedEl.innerHTML = [['all','ALL'],['totry','TO TRY'],['tried','MADE IT']].map(([v,l]) => `<button class="chip tried" data-tried="${v}">${l}</button>`).join('');
    triedEl.onclick = e => { const b = e.target.closest('.chip'); if(!b) return; triedFilter = b.dataset.tried; animateNext = true; render(); };
  }
}
function syncChips(){
  document.querySelectorAll('#methodChips .chip').forEach(b => b.classList.toggle('active', b.dataset.method === activeMethod));
  document.querySelectorAll('#triedChips .chip').forEach(b => b.classList.toggle('active', b.dataset.tried === triedFilter));
}

/* ---------- boarding pass card ---------- */
function boardingPassCard(r, matchState){
  const al = getAirline(r.serial || 0);
  const light = hexLighten(al.color, 42);
  const d = r.createdAt ? new Date(r.createdAt) : null;
  const dateTop = d ? d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase() : '';
  const yr = d ? d.getFullYear() : '';
  return `<button class="bp-card ${r.tried?'is-boarded':''} ${matchState?('bp-'+matchState):''}" data-id="${r.id}">
    <span class="bp-strip" style="background:linear-gradient(180deg,${light},${al.color})"></span>
    <div class="bp-body">
      <div class="bp-top-row">
        <span class="bp-airline" style="color:${al.color}">${esc(al.name)}</span>
        <span class="bp-serial-label">BREW #${pad(r.serial||0)}</span>
      </div>
      <h3 class="bp-name">${esc(r.name)}</h3>
      ${r.description?`<p class="bp-desc">${esc(r.description)}</p>`:''}
      <div class="bp-journey">
        <div class="bp-journey-col"><span class="bp-info-label">FROM</span><span class="bp-origin-name" style="color:${al.color}">${esc(r.origin||'Fusion')}</span></div>
        <span class="bp-arrow">✈</span>
        <div class="bp-journey-col"><span class="bp-info-label">METHOD</span><span class="bp-method-val">${esc(methodLabel(r.method))}</span></div>
      </div>
    </div>
    <div class="bp-gate">
      <span class="bp-info-label">GATE</span>
      <span class="bp-ratio-num" style="color:${al.color}">${esc(r.ratio||'—')}</span>
      <span class="bp-info-label bp-strength-label">STR.</span>
      ${beansRow(r.strength||3)}
    </div>
    <div class="bp-stub">
      <span class="bp-country-badge" style="background:${al.color}">${esc(r.code || al.code)}</span>
      <span class="bp-stub-date">${dateTop}<br><span class="bp-stub-yr">${yr}</span></span>
      ${r.tried?'<span class="bp-boarded">BOARDED</span>':''}
    </div>
  </button>`;
}

/* ---------- ingredient (kitchen) filter ---------- */
let kitchen = new Set();
let kitchenOpen = false;
const KITCHEN_CHIPS = ['Milk','Condensed Milk','Coconut Milk','Cream','Ice','Sugar','Honey','Egg','Coffee','Instant Coffee','Banana','Mango','Orange','Pineapple','Chocolate','Cinnamon','Cardamom','Vanilla','Ginger','Lemon','Salt'];
const KITCHEN_STAPLES = new Set(['coffee']);

function ingredientToken(text){
  const t = (text||'').toLowerCase();
  if(t.includes('ice cream') || t.includes('gelato')) return null;
  const map = [
    ['condensed',['condensed']],['coconut',['coconut']],['cream',['cream']],
    ['ice',['ice']],['egg',['egg']],['banana',['banana']],['mango',['mango']],
    ['orange',['orange']],['pineapple',['pineapple']],['chocolate',['chocolate','cocoa']],
    ['cinnamon',['cinnamon']],['cardamom',['cardamom']],['vanilla',['vanilla']],
    ['ginger',['ginger']],['lemon',['lemon']],['salt',['salt']],['honey',['honey']],
    ['sugar',['sugar','jaggery','gur']],['coffee',['coffee','espresso','instant']],['milk',['milk']]
  ];
  for(const [tok,words] of map){ for(const w of words){ if(t.includes(w)) return tok; } }
  return null;
}
function recipeTokens(r){
  const s = new Set();
  (r.ingredients||[]).forEach(i => { const tok = ingredientToken(i); if(tok && !KITCHEN_STAPLES.has(tok)) s.add(tok); });
  return s;
}
function kitchenTokenSet(){
  const s = new Set();
  kitchen.forEach(name => { const tok = ingredientToken(name.toLowerCase()); if(tok) s.add(tok); });
  return s;
}
function isMakeable(r, kset){
  const toks = recipeTokens(r);
  if(toks.size === 0) return true;
  for(const t of toks){ if(!kset.has(t)) return false; }
  return true;
}
/* Kitchen ("what's in your kitchen?") ingredient filter now lives as an
   icon button in the header with a dropdown panel, instead of a permanent
   bar under the toolbar. The button shows a small count badge when active;
   the dropdown holds the same ingredient chips + "N recipes you can make"
   result row as before. */
function buildKitchen(){
  const wrap = document.getElementById('kitchenChips');
  if(!wrap) return;
  wrap.innerHTML = KITCHEN_CHIPS.map(name =>
    `<button class="if-chip" data-name="${esc(name)}"><span class="ic">${ingredientIcon(name.toLowerCase())}</span><span class="nm">${esc(name)}</span></button>`
  ).join('');
  wrap.onclick = e => {
    const c = e.target.closest('.if-chip'); if(!c) return;
    const n = c.dataset.name;
    if(kitchen.has(n)) kitchen.delete(n); else kitchen.add(n);
    renderKitchen(); render();
  };

  const toggleWrap = document.getElementById('kitchenToggleWrap');
  const toggleBtn  = document.getElementById('kitchenHeaderToggle');
  if(toggleWrap && toggleBtn){
    toggleBtn.onclick = e => {
      e.stopPropagation();
      kitchenOpen = !kitchenOpen; renderKitchen();
    };
    /* Click anywhere outside the dropdown closes it. */
    document.addEventListener('click', e => {
      if(!kitchenOpen) return;
      if(!toggleWrap.contains(e.target)){ kitchenOpen = false; renderKitchen(); }
    });
  }

  const clearBtn = document.getElementById('kitchenClear');
  if(clearBtn) clearBtn.onclick = () => { kitchen.clear(); renderKitchen(); render(); };

  renderKitchen();
}
function renderKitchen(){
  const toggleWrap = document.getElementById('kitchenToggleWrap');
  const dropdown    = document.getElementById('kitchenDropdown');
  const badge        = document.getElementById('kitchenBadge');
  const toggleBtn    = document.getElementById('kitchenHeaderToggle');
  if(!toggleWrap) return;
  const active = kitchen.size > 0;

  toggleWrap.classList.toggle('has-active', active);
  toggleWrap.classList.toggle('open', kitchenOpen);
  if(dropdown) dropdown.style.display = kitchenOpen ? 'block' : 'none';
  if(toggleBtn) toggleBtn.setAttribute('aria-expanded', kitchenOpen ? 'true' : 'false');
  if(badge){
    if(active){ badge.textContent = kitchen.size; badge.style.display = 'flex'; }
    else badge.style.display = 'none';
  }

  document.querySelectorAll('#kitchenChips .if-chip').forEach(c => c.classList.toggle('sel', kitchen.has(c.dataset.name)));
  const result = document.getElementById('kitchenResult');
  if(result) result.style.display = active ? 'flex' : 'none';
}

/* ---------- equipment filter (Phase 3b) ----------
   Header icon + dropdown mirroring the kitchen ingredient filter, but sourced
   from EQUIPMENT_TAXONOMY and coupled to the saved owned-equipment profile
   (ownedEquipment): there's one "my equipment", edited from either the
   account-menu onboarding picker or this dropdown, and they stay identical.
   Toggling a chip persists immediately. Empty profile = show everything
   (the default for guests / anyone who skipped onboarding); a non-empty
   profile filters the catalog to recipes makeable with that gear (primary
   method or any variant), which is the "what can I make tonight" payoff. */
let equipFilterOpen = false;

/* Persist ownedEquipment through the same guest/cloud split as the onboarding
   picker's commit (js/app.js openEquipmentPicker). */
async function persistOwnedEquipment(){
  if(currentUser){
    await pushEquipmentToCloud(currentUser.id, ownedEquipment);
    try{ localStorage.setItem(EQUIPMENT_CLOUD_CACHE_KEY, JSON.stringify({ userId: currentUser.id, equipment: ownedEquipment, onboarded: true })); }catch(e){}
  } else {
    saveGuestEquipment(ownedEquipment, true);
  }
}
function clearEquipmentFilter(){
  if(!ownedEquipment.length) return;
  ownedEquipment = [];
  persistOwnedEquipment();
  if(typeof renderEquipment === 'function') renderEquipment();
}

function buildEquipment(){
  const wrap = document.getElementById('equipFilterChips');
  if(wrap){
    const categories = [];
    EQUIPMENT_TAXONOMY.forEach(m => { if(!categories.includes(m.category)) categories.push(m.category); });
    wrap.innerHTML = categories.map(cat => `
      <div class="eq-cat">
        <div class="eq-cat-label">${esc(cat)}</div>
        <div class="eq-chip-grid">
          ${EQUIPMENT_TAXONOMY.filter(m => m.category === cat).map(m =>
            `<button class="if-chip eq-chip" type="button" data-eq="${esc(m.id)}" title="${esc(m.hint || '')}"><span class="nm">${esc(m.label)}</span></button>`
          ).join('')}
        </div>
      </div>`).join('');
    wrap.onclick = async e => {
      const c = e.target.closest('[data-eq]'); if(!c) return;
      const id = c.dataset.eq;
      const i = ownedEquipment.indexOf(id);
      if(i >= 0) ownedEquipment.splice(i, 1); else ownedEquipment.push(id);
      renderEquipment(); render();
      await persistOwnedEquipment();
    };
  }

  const toggleWrap = document.getElementById('equipFilterWrap');
  const toggleBtn  = document.getElementById('equipFilterToggle');
  if(toggleWrap && toggleBtn){
    toggleBtn.onclick = e => { e.stopPropagation(); equipFilterOpen = !equipFilterOpen; renderEquipment(); };
    document.addEventListener('click', e => {
      if(!equipFilterOpen) return;
      if(!toggleWrap.contains(e.target)){ equipFilterOpen = false; renderEquipment(); }
    });
  }
  const clearBtn = document.getElementById('equipFilterClear');
  if(clearBtn) clearBtn.onclick = () => { clearEquipmentFilter(); render(); };

  renderEquipment();
}
function renderEquipment(){
  const toggleWrap = document.getElementById('equipFilterWrap');
  const dropdown   = document.getElementById('equipFilterDropdown');
  const badge      = document.getElementById('equipFilterBadge');
  const toggleBtn  = document.getElementById('equipFilterToggle');
  if(!toggleWrap) return;
  const owned = new Set(ownedEquipment);
  const active = owned.size > 0;

  toggleWrap.classList.toggle('has-active', active);
  toggleWrap.classList.toggle('open', equipFilterOpen);
  if(dropdown) dropdown.style.display = equipFilterOpen ? 'block' : 'none';
  if(toggleBtn) toggleBtn.setAttribute('aria-expanded', equipFilterOpen ? 'true' : 'false');
  if(badge){
    if(active){ badge.textContent = owned.size; badge.style.display = 'flex'; }
    else badge.style.display = 'none';
  }

  document.querySelectorAll('#equipFilterChips .eq-chip').forEach(c => c.classList.toggle('sel', owned.has(c.dataset.eq)));
  const result = document.getElementById('equipFilterResult');
  const countEl = document.getElementById('equipFilterCount');
  if(result) result.style.display = active ? 'flex' : 'none';
  if(active && countEl) countEl.textContent = recipes.filter(r => isMakeableByEquipment(r, owned)).length;
}

/* ---------- account control (Phase 2) ----------
   Same header icon-button + dropdown pattern as the kitchen filter above.
   buildAccountUI() wires the toggle + outside-click once; renderAccountUI()
   reflects open/signed-in state; renderAccountDropdownBody() rebuilds the
   dropdown's inner HTML (signed-out vs signed-in) and re-wires its buttons. */
function buildAccountUI(){
  const toggleWrap = document.getElementById('accountToggleWrap');
  const toggleBtn  = document.getElementById('accountHeaderToggle');
  if(!toggleWrap || !toggleBtn) return;
  toggleBtn.onclick = e => { e.stopPropagation(); accountOpen = !accountOpen; renderAccountUI(); };
  /* Click anywhere outside the dropdown closes it. */
  document.addEventListener('click', e => {
    if(!accountOpen) return;
    if(!toggleWrap.contains(e.target)){ accountOpen = false; renderAccountUI(); }
  });
  /* The "Sign in" buttons inside the locked-screen gates open the same
     dropdown. stopPropagation so this very click doesn't bubble to the
     outside-click handler above and immediately re-close it. */
  document.querySelectorAll('.gate-signin-btn').forEach(b => {
    b.onclick = e => { e.stopPropagation(); accountOpen = true; renderAccountUI(); };
  });
  renderAccountUI();
}

function renderAccountUI(){
  const toggleWrap = document.getElementById('accountToggleWrap');
  const dropdown   = document.getElementById('accountDropdown');
  const toggleBtn  = document.getElementById('accountHeaderToggle');
  const icon       = document.getElementById('accountIconSignedOut');
  const avatar     = document.getElementById('accountAvatar');
  if(!toggleWrap) return;

  toggleWrap.classList.toggle('open', accountOpen);
  toggleWrap.classList.toggle('signed-in', !!currentUser);
  if(dropdown) dropdown.style.display = accountOpen ? 'block' : 'none';
  if(toggleBtn) toggleBtn.setAttribute('aria-expanded', accountOpen ? 'true' : 'false');

  /* Signed in → initial-letter avatar; signed out → the silhouette icon. */
  if(currentUser){
    const initial = (currentUser.email || '?').trim().charAt(0) || '?';
    if(avatar){ avatar.textContent = initial; avatar.style.display = 'flex'; }
    if(icon) icon.style.display = 'none';
  } else {
    if(avatar) avatar.style.display = 'none';
    if(icon) icon.style.display = 'block';
  }

  renderAccountDropdownBody();
}

const SYNC_TEXT = { idle:'Not synced yet', syncing:'Syncing…', synced:'Synced to your account', error:'Sync error — will retry' };

function renderAccountDropdownBody(){
  const body = document.getElementById('accountDropdownBody');
  if(!body) return;

  if(currentUser){
    body.innerHTML = `
      <div class="account-dropdown-label">Your account</div>
      <div class="account-email">${esc(currentUser.email || 'Signed in')}</div>
      <div class="account-sync-row"><span class="account-sync-dot ${syncState}"></span>${esc(SYNC_TEXT[syncState] || '')}</div>
      <button class="account-link-sub" id="acctEditEquipmentBtn" type="button">☕ Edit your brewing equipment</button>
      ${unitsControlHTML()}
      <button class="btn account-btn-full" id="acctSignOutBtn" type="button">Sign out</button>`;
    const out = document.getElementById('acctSignOutBtn');
    if(out) out.onclick = handleSignOut;
    const eq = document.getElementById('acctEditEquipmentBtn');
    if(eq) eq.onclick = () => { accountOpen = false; renderAccountUI(); openEquipmentPicker('edit'); };
    wireUnitsControl(body);
    return;
  }

  const signup = authMode === 'signup';
  body.innerHTML = `
    <div class="account-dropdown-label">${signup ? 'Create your account' : 'Welcome back'}</div>
    <div class="field">
      <label for="acctEmail">Email</label>
      <input id="acctEmail" type="email" autocomplete="email" placeholder="you@example.com" inputmode="email">
    </div>
    <div class="field">
      <label for="acctPassword">Password</label>
      <input id="acctPassword" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" placeholder="${signup ? 'At least 6 characters' : 'Your password'}">
    </div>
    <button class="btn primary account-btn-full" id="acctPwBtn" type="button">${signup ? 'Create account' : 'Sign in'}</button>
    <p class="account-switch">${signup ? 'Already have an account?' : 'New to Brew Book?'} <button class="account-switch-link" id="acctSwitch" type="button">${signup ? 'Sign in' : 'Create one'}</button></p>
    <p class="account-hint" id="acctHint">Your made, rated, and own recipes sync across devices. You can keep using Brew Book without signing in.</p>
    <button class="account-link-sub" id="acctEditEquipmentBtn" type="button">☕ Edit your brewing equipment</button>
    ${unitsControlHTML()}`;

  const pwBtn = document.getElementById('acctPwBtn');
  if(pwBtn) pwBtn.onclick = handlePasswordAuth;
  const sw = document.getElementById('acctSwitch');
  if(sw) sw.onclick = () => { authMode = signup ? 'signin' : 'signup'; renderAccountDropdownBody(); const f = document.getElementById('acctEmail'); if(f) f.focus(); };
  const eq = document.getElementById('acctEditEquipmentBtn');
  if(eq) eq.onclick = () => { accountOpen = false; renderAccountUI(); openEquipmentPicker('edit'); };
  const pw = document.getElementById('acctPassword');
  if(pw) pw.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); handlePasswordAuth(); } });
  wireUnitsControl(body);
}

function setAccountHint(msg, isError){
  const hint = document.getElementById('acctHint');
  if(hint){ hint.textContent = msg; hint.classList.toggle('error', !!isError); }
}

/* The redirect target for both auth flows: back to this exact page. This is a
   static site with no server callback route, so supabase-js's default
   detectSessionInUrl parses the returned tokens when we land back here. */
function authRedirectTo(){ return location.origin + location.pathname; }

/* DORMANT — not wired to any UI. Magic link is removed from the account panel
   for now; re-integration is planned. See docs/adr/0009. */
async function handleMagicLinkSubmit(){
  const input = document.getElementById('acctEmail');
  const email = (input && input.value || '').trim();
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ setAccountHint('Enter a valid email address.', true); return; }
  const sb = await window.bbSupabaseReady;
  if(!sb){ setAccountHint('Sign-in isn’t configured yet.', true); return; }
  setAccountHint('Sending…', false);
  try{
    const { error } = await sb.auth.signInWithOtp({ email, options:{ emailRedirectTo: authRedirectTo() } });
    if(error){ setAccountHint(error.message || 'Couldn’t send the link — try again.', true); return; }
    setAccountHint('Check your email for a sign-in link ☕', false);
  }catch(e){ setAccountHint('Couldn’t send the link — try again.', true); }
}

/* Email + password — the main sign in / create account path. Supabase handles
   the credentials and password hashing server-side; nothing sensitive lives in
   this code. On success, onAuthStateChange(SIGNED_IN) does the rest. If the
   project has "Confirm email" on, a new signup must click the emailed link
   before it can sign in (we surface that clearly). */
async function handlePasswordAuth(){
  const email = ((document.getElementById('acctEmail') || {}).value || '').trim();
  const password = (document.getElementById('acctPassword') || {}).value || '';
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ setAccountHint('Enter a valid email address.', true); return; }
  if(password.length < 6){ setAccountHint('Password must be at least 6 characters.', true); return; }
  const sb = await window.bbSupabaseReady;
  if(!sb){ setAccountHint('Sign-in isn’t configured yet.', true); return; }
  const signup = authMode === 'signup';
  setAccountHint(signup ? 'Creating your account…' : 'Signing in…', false);
  try{
    if(signup){
      const { data, error } = await sb.auth.signUp({ email, password, options:{ emailRedirectTo: authRedirectTo() } });
      if(error){
        const msg = /registered|already/i.test(error.message) ? 'That email already has an account — try signing in.' : (error.message || 'Couldn’t create the account.');
        setAccountHint(msg, true); return;
      }
      /* Session present → confirmation is off, we're signed in (handled by the
         auth listener). No session → a confirmation email was sent. */
      if(!(data && data.session)) setAccountHint('Check your email to confirm your account, then sign in.', false);
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if(error){
        const msg = /confirm/i.test(error.message) ? 'Confirm your email first — check your inbox.'
                  : /invalid/i.test(error.message)  ? 'Wrong email or password.'
                  : (error.message || 'Couldn’t sign in.');
        setAccountHint(msg, true); return;
      }
    }
  }catch(e){ setAccountHint('Something went wrong — try again.', true); }
}

/* DORMANT — not wired to any UI. Google sign-in is removed from the account
   panel for now; re-integration is planned. See docs/adr/0009. */
async function handleGoogleSignIn(){
  const sb = await window.bbSupabaseReady;
  if(!sb){ setAccountHint('Sign-in isn’t configured yet.', true); return; }
  try{
    const { error } = await sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: authRedirectTo() } });
    if(error) setAccountHint(error.message || 'Couldn’t start Google sign-in.', true);
    /* On success the browser redirects to Google; nothing more to do here. */
  }catch(e){ setAccountHint('Couldn’t start Google sign-in.', true); }
}

async function handleSignOut(){
  const sb = await window.bbSupabaseReady;
  if(!sb) return;
  try{ await sb.auth.signOut(); }catch(e){}
  /* State reset + repaint happen in the onAuthStateChange SIGNED_OUT handler. */
}

/* Simple colored-shape bean strength indicator — matches Recipe Website
   Reference.html's .bb-bean exactly (a CSS border-radius shape gradient-
   filled with the recipe's own color, not our SVG bean icon set). Used by
   the hero and by collectionCard()'s ratio/strength column. */
function coloredBeans(n, color) {
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += i < n
      ? `<span class="bean filled" style="--bean-color:${color}"></span>`
      : `<span class="bean"></span>`;
  }
  return `<span class="beans">${out}</span>`;
}

/* ---------- HERO — brew of the day ---------- */
function heroHTML(r) {
  const al   = getAirline(r.serial || 0);
  const code = r.code || al.code;
  /* First word plain, rest of the name in italic accent — e.g.
     "Egg Coffee" -> "Egg" + italic "Coffee". */
  const nameParts = esc(r.name).split(' ');
  const firstWord = nameParts[0];
  const restWords = nameParts.slice(1).join(' ');
  return `<div class="hero-card" data-id="${r.id}">
    <div class="hero-glow" aria-hidden="true" style="background:radial-gradient(circle at 82% 30%, ${al.color}33, transparent 46%)"></div>
    <div class="hero-inner">
      <div class="hero-body">
        <div class="hero-eyebrow">Brew of the day · No. ${pad(r.serial || 0)} · ${esc(code)} ${esc((r.origin || 'Fusion').toUpperCase())}</div>
        <h2 class="hero-title">${firstWord}${restWords ? ` <em>${restWords}</em>` : ''}</h2>
        ${r.description ? `<p class="hero-desc">${esc(r.description)}</p>` : ''}
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-val">${esc(r.ratio || '—')}</span>
            <span class="hero-stat-label">Ratio</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-val">${esc(methodLabel(r.method))}</span>
            <span class="hero-stat-label">Method</span>
          </div>
          <div class="hero-stat">
            ${coloredBeans(r.strength || 3, al.color)}
            <span class="hero-stat-label">Strength</span>
          </div>
          <button class="hero-brew-btn" data-hero-brew type="button">Start Brewing <span aria-hidden="true">→</span></button>
        </div>
      </div>
      <div class="hero-portrait" aria-hidden="true" style="width:230px;height:230px">
        <span class="hero-portrait-glow" style="width:230px;height:230px;background:radial-gradient(circle,${al.color}55,transparent 68%)"></span>
        <div class="hero-portrait-cup" style="width:179.4px;height:179.4px">
          <span class="hero-portrait-highlight" style="top:32.2px;width:103.5px;height:36.8px"></span>
          <span class="hero-steam" style="left:40%;top:-7px"></span>
          <span class="hero-steam" style="left:55%;top:-7px;animation-delay:.9s"></span>
        </div>
      </div>
    </div>
  </div>`;
}

/* ---------- CATEGORY CHIPS (style/flavour, inside content area) ---------- */
let activeCategory = 'all';

function categoryChipsHTML(visibleList) {
  /* Build only categories that have at least one recipe in the current filtered list */
  const present = new Set(['all']);
  visibleList.forEach(r => {
    const cat = getStyleCategory(r);
    STYLE_CATEGORIES.forEach(c => { if(c.ids.includes(r.id)) present.add(c.id); });
  });
  const cats = [{id:'all', label:'All'}].concat(STYLE_CATEGORIES.filter(c => present.has(c.id)));
  return `<div class="cat-rail" id="catRail" role="group" aria-label="Filter by style">
    ${cats.map(c => `<button class="cat-chip${activeCategory===c.id?' active':''}" data-cat="${c.id}">${esc(c.label)}</button>`).join('')}
  </div>`;
}

function syncCategoryChips() {
  document.querySelectorAll('#catRail .cat-chip').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === activeCategory)
  );
}

/* ---------- QUICK FILTERS (Hot/Iced + difficulty, Phase 3b) ----------
   Two segmented pill groups rendered in-content above the category rail (the
   old header method/tried chips were removed, so this is the home for
   lightweight browse filters). Composes with search + the equipment filter
   via visibleRecipeList(). */
function quickFiltersHTML(){
  const seg = (group, active, opts) => opts.length <= 1 ? '' : `<div class="qf-seg" role="group" data-qf="${group}">${
    opts.map(([v,l]) => `<button class="qf-pill${active===v?' active':''}" data-qf-val="${v}" type="button">${l}</button>`).join('')
  }</div>`;
  /* Only offer pills for values actually present in the catalog, so there's
     never a dead option (e.g. no recipe's primary method is "advanced", so an
     Advanced pill would always return nothing) — mirrors how the category rail
     only shows categories that have recipes. */
  const serves = new Set(recipes.map(r => recipeServe(r)));   // 'either' counts as both
  const serveOpts = [['all','All']];
  if(serves.has('hot')  || serves.has('either')) serveOpts.push(['hot','Hot']);
  if(serves.has('iced') || serves.has('either')) serveOpts.push(['iced','Iced']);
  const diffs = new Set(recipes.map(r => recipeDifficulty(r)));
  const diffOpts = [['all','Any']]
    .concat([['easy','Easy'],['medium','Medium'],['advanced','Advanced']].filter(([v]) => diffs.has(v)));
  return `<div class="quick-filters">
    ${seg('serve', serveFilter, serveOpts)}
    ${seg('difficulty', activeDifficulty, diffOpts)}
  </div>`;
}
function wireQuickFilters(scope){
  scope.querySelectorAll('.qf-seg').forEach(seg => {
    seg.onclick = e => {
      const b = e.target.closest('.qf-pill'); if(!b) return;
      const group = seg.dataset.qf, val = b.dataset.qfVal;
      if(group === 'serve') serveFilter = val;
      else if(group === 'difficulty') activeDifficulty = val;
      animateNext = true; render();
    };
  });
}

/* ---------- shared nav count pill ----------
   One persistent pill in the top nav, always a BREWED count derived from the
   per-user tried state (never hardcoded) and scoped to the active tab:
     • Recipes / Detail  → brews from the shared catalog you've made
     • World             → brews you've made among genuine-origin recipes
     • Collection        → every brew you've made, including your own recipes
   A recipe only counts once it's actually marked made — a custom recipe that's
   just been added (tried=false) does not count anywhere. */
function brewedCount(scope){
  const isCustom = r => String(r.id).startsWith('custom-');
  if(scope === 'collection') return recipes.filter(r => r.tried).length;
  if(scope === 'world'){
    return (typeof genuineOriginRecipes === 'function' ? genuineOriginRecipes() : [])
      .filter(r => r.tried).length;
  }
  /* catalog (Recipes / Detail): shared catalog recipes only, not your own */
  return recipes.filter(r => r.tried && !isCustom(r)).length;
}
function updateNavCountPill(){
  const el = document.getElementById('navCountPill');
  if(!el) return;
  const scope = currentScreen === 'screen-collection' ? 'collection'
              : currentScreen === 'screen-world'      ? 'world'
              : 'catalog';
  el.textContent = brewedCount(scope) + ' BREWED';
}

/* ---------- shared empty-state illustration ----------
   One hand-drawn line-art mark (a pour into a cup) reused across every
   empty/no-results state, recoloured via currentColor so it themes for
   free in both light and dark mode. ctaLabel/ctaId are optional — pass
   both to render a small pill button and wire its onclick separately. */
function emptyStateHTML(opts){
  const { title, body, ctaLabel, ctaId } = opts || {};
  return `<div class="empty">
    <svg class="empty-illustration" viewBox="0 0 80 96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M17 18 C15 13 21 11 19 6" stroke-width="1.8" opacity=".5"/>
      <path d="M30 18 C28 13 34 11 32 6" stroke-width="1.8" opacity=".5"/>
      <path d="M14 20 L54 20 L44 44 L24 44 Z" stroke-width="2.2"/>
      <path d="M20 26 L48 26 M24 32 L44 32" stroke-width="1.5" opacity=".8"/>
      <path d="M34 44 L34 52" stroke-width="1.5" stroke-dasharray="2 4"/>
      <path d="M27 54 L27 58 C18 62 16 82 34 86 C52 82 50 62 41 58 L41 54 Z" stroke-width="2.2"/>
      <path d="M23 74 C30 78 38 78 45 74" stroke-width="1.5" opacity=".6"/>
    </svg>
    <h2>${esc(title)}</h2>
    <p>${esc(body)}</p>
    ${ctaLabel ? `<button class="empty-cta" id="${esc(ctaId)}" type="button">${esc(ctaLabel)}</button>` : ''}
  </div>`;
}

/* Base filtered list shared by render() and surpriseMe(): method chip +
   tried/to-try + search term + Hot/Iced + difficulty + equipment (Phase 3b).
   Deliberately excludes the kitchen INGREDIENT filter, which only dims
   non-matching cards via matchState rather than removing them, so it
   shouldn't narrow what Surprise Me can pick either. The equipment filter,
   by contrast, is a hard filter (the "what can I make tonight" payoff), so
   it belongs here and Surprise Me respects it too. */
function visibleRecipeList(){
  let list = recipes.slice();
  if(activeMethod !== 'all') list = list.filter(r => (['moka','instant','blender','cezve'].includes(r.method) ? r.method : 'other') === activeMethod);
  if(triedFilter === 'tried') list = list.filter(r => r.tried);
  if(triedFilter === 'totry')  list = list.filter(r => !r.tried);
  if(serveFilter !== 'all') list = list.filter(r => { const s = recipeServe(r); return s === serveFilter || s === 'either'; });
  if(activeDifficulty !== 'all') list = list.filter(r => recipeDifficulty(r) === activeDifficulty);
  const eqSet = getOwnedEquipmentSet();
  if(eqSet.size) list = list.filter(r => isMakeableByEquipment(r, eqSet));
  if(searchTerm){
    const q = searchTerm.toLowerCase();
    list = list.filter(r => r.name.toLowerCase().includes(q) || (r.description||'').toLowerCase().includes(q) || (r.origin||'').toLowerCase().includes(q) || (r.ingredients||[]).some(i => i.toLowerCase().includes(q)));
  }
  return list;
}

/* Equipment makeability: true if the user owns the recipe's primary method,
   or any of its method variants. `equipmentViaMethod(r, eqSet)` returns the
   variant method id when a recipe is makeable ONLY via a variant (not its
   primary method), so the card can surface a "(via AeroPress)" note instead
   of hiding the recipe. */
function isMakeableByEquipment(r, eqSet){
  if(eqSet.has(r.method)) return true;
  return (r.methods || []).some(m => eqSet.has(m.id));
}
function equipmentViaMethod(r, eqSet){
  if(!eqSet.size || eqSet.has(r.method)) return null;
  const v = (r.methods || []).find(m => eqSet.has(m.id));
  return v ? v.id : null;
}

/* Picks a random recipe from whatever's currently visible (respecting the
   active method/tried/search filters) and jumps straight to its Detail
   screen, with a brief flash on the boarding-pass stripe so the jump feels
   intentional rather than jarring. */
function surpriseMe(){
  const list = visibleRecipeList();
  if(list.length === 0){ showToast('Nothing to surprise you with — try clearing some filters'); return; }
  const pick = list[Math.floor(Math.random() * list.length)];
  openDetail(pick.id);
  requestAnimationFrame(() => {
    const stripe = document.querySelector('.detail-hero-stripe');
    if(!stripe) return;
    stripe.classList.add('flash');
    setTimeout(() => stripe.classList.remove('flash'), 700);
  });
}

/* ---------- render (home — list view) ---------- */
function render(){
  updateNavCountPill();
  syncChips();

  let list = visibleRecipeList();
  if(sortBy === 'serial') list.sort((a,b)=>(a.serial||0)-(b.serial||0));
  else if(sortBy === 'newest') list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  else if(sortBy === 'rating') list.sort((a,b)=>(b.rating||0)-(a.rating||0) || (a.serial||0)-(b.serial||0));
  else if(sortBy === 'name') list.sort((a,b)=>a.name.localeCompare(b.name));

  const kActive = kitchen.size > 0;
  const kset    = kActive ? kitchenTokenSet() : null;

  const content = document.getElementById('content');

  if(list.length === 0){
    const hasFilters = !!searchTerm || kitchen.size > 0 || activeMethod !== 'all' || triedFilter !== 'all'
      || serveFilter !== 'all' || activeDifficulty !== 'all' || getOwnedEquipmentSet().size > 0;
    content.innerHTML = recipes.length === 0
      ? emptyStateHTML({title:'No brews yet', body:'Add your first recipe to get started.', ctaLabel:'+ Add a recipe', ctaId:'emptyAddBtn'})
      : emptyStateHTML({title:'Nothing matches', body:'Try a different search or clear your filters.', ctaLabel: hasFilters ? 'Clear filters' : null, ctaId:'emptyClearBtn'});
    const addBtn = document.getElementById('emptyAddBtn');
    if(addBtn) addBtn.onclick = () => openForm(null);
    const clearBtn = document.getElementById('emptyClearBtn');
    if(clearBtn) clearBtn.onclick = () => {
      searchTerm = '';
      const si = document.getElementById('searchInput'); if(si) si.value = '';
      document.querySelector('.search-wrap')?.classList.remove('has-term');
      kitchen.clear(); if(typeof renderKitchen === 'function') renderKitchen();
      activeMethod = 'all'; triedFilter = 'all'; serveFilter = 'all'; activeDifficulty = 'all'; syncChips();
      clearEquipmentFilter();
      animateNext = true; render();
    };
    if(animateNext){ animateNext = false; }
    return;
  }

  /* If search is active, show a flat grid — search results feel better without lanes */
  if(searchTerm){
    content.innerHTML = quickFiltersHTML()
      + `<div class="collection-content">${list.map(r => collectionCard(r, {showRatio:true, matchState: kActive?(isMakeable(r,kset)?'match':'dim'):null})).join('')}</div>`;
    wireQuickFilters(content);
    if(kActive){ const cnt = document.getElementById('kitchenCount'); if(cnt) cnt.textContent = list.filter(r=>isMakeable(r,kset)).length; }
    if(animateNext){ if(typeof BREW_ANIM!=='undefined') BREW_ANIM.animateCardEntrance(content); animateNext=false; }
    return;
  }

  /* ---------- Hero + category chips + lanes ---------- */

  /* Today's brew: deterministic per calendar day, cycles through all recipes */
  const dayIdx   = (new Date().getDate() - 1) % list.length;
  const heroRec  = list[dayIdx];

  /* Apply category filter */
  const filteredForLanes = activeCategory === 'all'
    ? list
    : list.filter(r => STYLE_CATEGORIES.find(c => c.id === activeCategory)?.ids.includes(r.id));

  const pinnedList = list.filter(r => r.pinned);
  let html = pinnedList.length ? pinnedLaneHTML(pinnedList) : '';
  html += heroHTML(heroRec);
  html += quickFiltersHTML();
  html += categoryChipsHTML(list);

  const sectionTitle = activeCategory === 'all'
    ? 'All brews'
    : (STYLE_CATEGORIES.find(c => c.id === activeCategory) || {}).label || 'All brews';
  html += `<div class="section-head">
    <div class="section-eyebrow">Every recipe in the book</div>
    <h2 class="section-title">${esc(sectionTitle)}</h2>
  </div>`;

  if(filteredForLanes.length === 0){
    html += emptyStateHTML({title:'Nothing here', body:'Try a different category.', ctaLabel:'Show all categories', ctaId:'emptyAllCatBtn'});
  } else if(activeCategory !== 'all'){
    /* Single-category view: one grid, no repeated section title (already shown above) */
    html += _laneHTML(null, filteredForLanes, kActive, kset);
  } else {
    /* All categories: one lane per category, only if it has recipes */
    const seen = new Set();
    STYLE_CATEGORIES.forEach(cat => {
      const catRecs = list.filter(r => cat.ids.includes(r.id));
      if(!catRecs.length) return;
      catRecs.forEach(r => seen.add(r.id));
      html += _laneHTML(cat.label, catRecs, kActive, kset);
    });
    /* Recipes not yet assigned to any category go in a misc lane */
    const other = list.filter(r => !seen.has(r.id));
    if(other.length) html += _laneHTML('Other', other, kActive, kset);
  }

  content.innerHTML = html;

  wireQuickFilters(content);

  /* Wire category chip clicks */
  const rail = document.getElementById('catRail');
  if(rail) rail.onclick = e => {
    const b = e.target.closest('.cat-chip');
    if(!b) return;
    activeCategory = b.dataset.cat;
    animateNext = true;
    render();
  };

  const allCatBtn = document.getElementById('emptyAllCatBtn');
  if(allCatBtn) allCatBtn.onclick = () => { activeCategory = 'all'; animateNext = true; render(); };

  /* Wire hero click + its "Start Brewing" shortcut */
  const heroEl = content.querySelector('.hero-card');
  heroEl?.addEventListener('click', () => openDetail(heroRec.id, heroEl));
  heroEl?.querySelector('[data-hero-brew]')?.addEventListener('click', e => {
    e.stopPropagation();
    startBrew(heroRec.id);
  });

  if(kActive){ const cnt = document.getElementById('kitchenCount'); if(cnt) cnt.textContent = list.filter(r=>isMakeable(r,kset)).length; }
  if(animateNext){ if(typeof BREW_ANIM!=='undefined') BREW_ANIM.animateCardEntrance(content); animateNext=false; }
}

/* Pinned recipes render as compact "stubs" — just the heading (origin, name,
   airline badge), not the whole card. A full card per pin made the lane read
   like a duplicate of the catalog below it; the stub is a shortcut, so it only
   needs to be identifiable and tappable. Id of the just-pinned recipe gets
   .is-new so only that stub plays the entrance animation on re-render. */
let _justPinnedId = null;
function pinnedStubHTML(r){
  const al    = getAirline(r.serial || 0);
  const color = r.color || al.color;
  const code  = r.code  || al.code;
  return `<div class="pin-stub${_justPinnedId === r.id ? ' is-new' : ''}" data-id="${esc(r.id)}" tabindex="0" role="button" aria-label="Open ${esc(r.name)}">
    <span class="pin-stub-stripe" style="background:${color}"></span>
    <span class="pin-stub-copy">
      <span class="pin-stub-origin" style="color:${color}">${esc(code)} · ${esc((r.origin || 'Fusion').toUpperCase())}</span>
      <span class="pin-stub-name">${esc(r.name)}</span>
    </span>
    <button class="pin-stub-unpin" data-pin type="button" aria-label="Unpin ${esc(r.name)}">${PIN_SVG}</button>
  </div>`;
}

function pinnedLaneHTML(recs){
  return `<section class="recipe-lane pin-lane">
    <div class="lane-head">
      <h3 class="lane-title">📌 Pinned</h3>
      <span class="lane-count">${recs.length} BREW${recs.length===1?'':'S'}</span>
      <span class="lane-rule" aria-hidden="true"></span>
    </div>
    <div class="pin-strip">${recs.map(pinnedStubHTML).join('')}</div>
  </section>`;
}

function _laneHTML(title, recs, kActive, kset) {
  const cards = recs.map(r => collectionCard(r, {showRatio:true, matchState: kActive?(isMakeable(r,kset)?'match':'dim'):null})).join('');
  return `<section class="recipe-lane">
    ${title ? `<div class="lane-head">
      <h3 class="lane-title">${esc(title)}</h3>
      <span class="lane-count">${recs.length} BREW${recs.length===1?'':'S'}</span>
      <span class="lane-rule" aria-hidden="true"></span>
    </div>` : ''}
    <div class="lane-grid">${cards}</div>
  </section>`;
}

/* ---------- collection screen ---------- */
let collView = 'landed'; /* 'landed' | 'mine' */

/* Ticket-stub card — shared by Collection, World's Boarding Passes view,
   and the Recipes/Home lanes. Matches Recipe Website Reference.html's
   .bb-card structure exactly (stripe + body + dashed/notched stub column).
   Custom recipes (My Recipes) get edit/delete icon buttons and an optional
   user-picked colour; showRatio adds the ratio + strength-beans column;
   matchState ('match'/'dim') reflects the kitchen ingredient filter;
   showTried adds the Landed-Brews-only ink-stamp + highlighted border for
   recipes the user has actually made. */
function collectionCard(r, opts){
  const custom     = !!(opts && opts.custom);
  const showRatio  = !!(opts && opts.showRatio);
  const showTried  = !!(opts && opts.showTried);
  const matchState = opts && opts.matchState;
  /* When the equipment filter is active and a recipe is makeable only via a
     method variant (not its primary method), name that variant. */
  const viaMethod  = equipmentViaMethod(r, getOwnedEquipmentSet());
  const al = getAirline(r.serial || 0);
  const color = r.color || al.color;
  const code = r.code || al.code;
  const catId = getStyleCategory(r);
  const catLabel = (STYLE_CATEGORIES.find(c => c.id === catId) || {}).label || '';
  const tried = showTried && !!r.tried;
  const matchClass  = matchState ? ` coll-${matchState}` : '';
  const triedClass  = tried ? ' coll-tried' : '';
  const stripeColor = matchState === 'match' ? '#7fb069' : color;
  return `<div class="coll-card${matchClass}${triedClass}" data-id="${esc(r.id)}">
    <span class="coll-card-stripe" style="background:${stripeColor}"></span>
    ${tried ? `<div class="coll-stamp"><div class="coll-stamp-box">Brewed</div></div>` : ''}
    <div class="coll-card-inner">
      <div class="coll-card-body">
        <div class="coll-card-top">
          <div>
            <div class="coll-card-origin" style="color:${color}">${esc(code)} · ${esc((r.origin || 'Fusion').toUpperCase())}</div>
            <div class="coll-card-no">Brew No. ${pad(r.serial || 0)}</div>
          </div>
          <div class="coll-card-right">
            <button class="coll-icon-btn coll-pin-btn${r.pinned?' is-pinned':''}" data-pin aria-label="${r.pinned?'Unpin':'Pin'} recipe">${PIN_SVG}</button>
            ${custom ? `<button class="coll-icon-btn" data-edit aria-label="Edit recipe">✎</button><button class="coll-icon-btn" data-delete aria-label="Delete recipe">✕</button>` : ''}
            <span class="coll-badge" style="background:${color}">${esc(code)}</span>
          </div>
        </div>
        <h3 class="coll-card-name">${esc(r.name)}</h3>
        <p class="coll-card-desc">${esc(r.description || '')}</p>
        <div class="coll-card-meta">
          ${metaBadgeHTML(r)}
          ${viaMethod ? `<span class="coll-via">via ${esc(methodLabel(viaMethod))}</span>` : ''}
        </div>
        <div class="coll-card-footer">
          <div>
            <div class="coll-card-method-label">Method</div>
            <div class="coll-card-method-val" style="color:${color}">${esc(methodLabel(r.method))}</div>
          </div>
          ${showRatio ? `<div>
            <div class="coll-card-ratio">${esc(r.ratio || '—')}</div>
            <div class="coll-card-beans">${coloredBeans(r.strength || 3, color)}</div>
          </div>` : ''}
        </div>
      </div>
      ${catLabel ? `<div class="coll-card-stub"><span class="coll-card-tag">${esc(catLabel)}</span></div>` : ''}
    </div>
  </div>`;
}

function addRecipeCard(){
  return `<button class="coll-add-card" id="collAddCard" type="button">
    <span class="coll-add-plus">+</span>
    <span class="coll-add-label">Add a recipe</span>
    <span class="coll-add-desc">Write up a brew that isn't in the terminal yet</span>
  </button>`;
}

function syncCollToggle(){
  document.querySelectorAll('.coll-seg').forEach(b => {
    const on = b.dataset.collView === collView;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function renderCollection(){
  syncCollToggle();

  const pinnedFirst = (a, b) => (b.pinned?1:0) - (a.pinned?1:0) || (a.serial || 0) - (b.serial || 0);
  const catalog = recipes.filter(r => !String(r.id).startsWith('custom-')).sort(pinnedFirst);
  const mine    = recipes.filter(r => String(r.id).startsWith('custom-')).sort(pinnedFirst);
  const triedCount = catalog.filter(r => r.tried).length;

  const progRow   = document.getElementById('collProgressRow');
  const progFill  = document.getElementById('collProgressFill');
  const progLabel = document.getElementById('collProgressLabel');
  if(progFill && progLabel){
    const pct = catalog.length ? Math.round((triedCount / catalog.length) * 100) : 0;
    progFill.style.width = pct + '%';
    progLabel.textContent = `${triedCount} / ${catalog.length} brewed`;
  }
  const mineCountEl = document.getElementById('collMineCount');
  if(mineCountEl) mineCountEl.textContent = `${mine.length} recipe${mine.length === 1 ? '' : 's'} of your own`;
  if(progRow) progRow.style.display = collView === 'landed' ? '' : 'none';
  if(mineCountEl) mineCountEl.style.display = collView === 'mine' ? '' : 'none';

  const el = document.getElementById('collection-content');

  if(collView === 'landed'){
    /* Collection shows only the brews you've actually made (the stamped ones).
       r.tried is per-user data, so each user collects their own set. */
    const brewed = catalog.filter(r => r.tried);
    if(catalog.length === 0){
      el.innerHTML = emptyStateHTML({title:'No recipes yet', body:'The catalog is still loading.'});
    } else if(brewed.length === 0){
      el.innerHTML = emptyStateHTML({title:'No brews collected yet', body:'Mark a recipe as “made” and it’ll be stamped into your collection here.'});
    } else {
      el.innerHTML = brewed.map(r => collectionCard(r, {showRatio: true, showTried: true})).join('');
    }
  } else {
    el.innerHTML = mine.map(r => collectionCard(r, {custom: true, showRatio: true})).join('') + addRecipeCard();
  }

  updateNavCountPill();
}

/* ---------- world screen (boarding passes ⇄ world map toggle) ----------
   Only recipes with a genuine single-country origin appear here — the
   same product rule the map already enforces (see MAP_FUSION_ORIGINS in
   worldmap.js). Fusion/Modern-café recipes stay fully visible in Recipes,
   they just don't have a "flight" to show here. */
let worldView = 'passes'; /* 'passes' | 'map' */

function genuineOriginRecipes(){
  return recipes
    .filter(r => r.origin && typeof MAP_FUSION_ORIGINS !== 'undefined' && !MAP_FUSION_ORIGINS.has(r.origin))
    .sort((a, b) => (a.serial || 0) - (b.serial || 0));
}

function syncWorldToggle(){
  document.querySelectorAll('.world-seg').forEach(b => {
    const on = b.dataset.worldView === worldView;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const passesEl = document.getElementById('worldPasses');
  const mapEl    = document.getElementById('worldMapWrap');
  if(passesEl) passesEl.style.display = worldView === 'passes' ? '' : 'none';
  if(mapEl)    mapEl.style.display    = worldView === 'map'    ? '' : 'none';
}

function renderWorldPasses(){
  const genuine = genuineOriginRecipes();

  const countEl = document.getElementById('worldRecipeCount');
  if(countEl) countEl.textContent = genuine.length;

  const pinCountEl = document.getElementById('worldPinCount');
  if(pinCountEl){
    /* Only count origins that will actually get a map pin — some catalog
       recipes carry a dual/ambiguous origin string (e.g. "Yemen / Worldwide")
       that has a real country but doesn't exact-match a single ORIGIN_PINS
       entry, so it wouldn't be placeable on the map. */
    const pinnable = typeof ORIGIN_PINS !== 'undefined' ? new Set(ORIGIN_PINS.map(p => p.origin)) : null;
    const origins = new Set(genuine.map(r => r.origin).filter(o => !pinnable || pinnable.has(o)));
    pinCountEl.textContent = origins.size;
  }

  const el = document.getElementById('worldPasses');
  if(!el) return;
  if(genuine.length === 0){
    el.innerHTML = emptyStateHTML({title:'No flights yet', body:'Recipes need a real country of origin to show up here.'});
    return;
  }
  el.innerHTML = genuine.map(r => collectionCard(r, {showRatio: true})).join('');
}

/* ---------- tasting journal UI (Phase 3) ----------
   Shared between the Detail screen (full section: list + add form) and the
   Brew Mode finish screen (just the add form). Star markup mirrors the
   existing .detail-rate-stars; the method dropdown reuses
   equipmentSelectOptionsHTML(). */
function _journalStarsHTML(sel){
  return `<div class="journal-stars" data-journal-stars>${[1,2,3,4,5].map(i =>
    `<button type="button" data-jstar="${i}" class="${i <= (sel||0) ? 'on' : ''}" aria-label="${i} star">★</button>`).join('')}</div>`;
}
function journalFormHTML(defaultMethodId){
  return `<div class="journal-form" data-journal-form>
    <textarea class="journal-note-input" data-journal-note rows="2" placeholder="How did this brew turn out? What would you tweak?"></textarea>
    <div class="journal-form-row">
      <div class="journal-form-field"><span class="journal-form-label">Rating</span>${_journalStarsHTML(0)}</div>
      <div class="journal-form-field"><span class="journal-form-label">Method</span><select class="journal-method" data-journal-method>${equipmentSelectOptionsHTML(defaultMethodId)}</select></div>
    </div>
    <div class="journal-form-actions">
      <button class="btn journal-cancel" type="button" data-journal-cancel>Cancel</button>
      <button class="btn primary" type="button" data-journal-save>Save note</button>
    </div>
  </div>`;
}
function journalSectionHTML(){
  return `<div class="detail-journal" data-journal>
    <div class="detail-block-label">Tasting journal</div>
    <div class="journal-list" data-journal-list><p class="journal-empty">Loading…</p></div>
    <button class="journal-add-btn" type="button" data-journal-add>+ Add entry</button>
  </div>`;
}
function _journalEntryHTML(n){
  const d = n.brewedAt ? new Date(n.brewedAt) : null;
  const date = d ? d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '';
  const stars = n.rating ? `<span class="journal-entry-stars">${'★'.repeat(n.rating)}${'☆'.repeat(5-n.rating)}</span>` : '';
  const method = n.methodId ? `<span class="journal-entry-method">${esc(methodLabel(n.methodId))}</span>` : '';
  return `<div class="journal-entry" data-note-id="${esc(n.id)}">
    <div class="journal-entry-head">
      <span class="journal-entry-date">${esc(date)}</span>
      ${method}${stars}
      <button class="journal-del" type="button" data-note-del aria-label="Delete entry">✕</button>
    </div>
    <p class="journal-entry-note">${esc(n.note)}</p>
  </div>`;
}
async function renderJournalEntries(recipeId, listEl){
  if(!listEl) return;
  const notes = await loadTastingNotes(recipeId);
  listEl.innerHTML = notes.length
    ? notes.map(_journalEntryHTML).join('')
    : `<p class="journal-empty">No entries yet — log how your next brew turns out.</p>`;
}
/* Wire a journal add-form (stars + method + save/cancel). onSaved(note) fires
   after a successful save. Returns nothing; operates on the passed form el. */
function wireJournalForm(formEl, recipeId, onSaved){
  if(!formEl) return;
  let sel = 0;
  const starsWrap = formEl.querySelector('[data-journal-stars]');
  starsWrap?.querySelectorAll('[data-jstar]').forEach(b => b.onclick = () => {
    const v = +b.dataset.jstar;
    sel = (sel === v ? v - 1 : v);
    starsWrap.querySelectorAll('[data-jstar]').forEach(x => x.classList.toggle('on', +x.dataset.jstar <= sel));
  });
  const save = async () => {
    const note = (formEl.querySelector('[data-journal-note]').value || '').trim();
    if(!note){ showToast('Write a note first'); formEl.querySelector('[data-journal-note]').focus(); return; }
    const methodId = formEl.querySelector('[data-journal-method]').value || '';
    const saved = await saveTastingNote(recipeId, { methodId, rating: sel, note });
    if(saved){ showToast('Saved to your journal ☕'); if(typeof onSaved === 'function') onSaved(saved); }
  };
  formEl.querySelector('[data-journal-save]').onclick = save;
  const cancel = formEl.querySelector('[data-journal-cancel]');
  if(cancel) cancel.onclick = () => { if(typeof formEl._onCancel === 'function') formEl._onCancel(); };
}
/* Detail-screen journal: load the list, wire the "+ Add entry" reveal, the
   inline form, and per-entry delete. */
function wireDetailJournal(scope, recipeId, defaultMethodId){
  const section = scope.querySelector('[data-journal]');
  if(!section) return;
  const listEl = section.querySelector('[data-journal-list]');
  const addBtn = section.querySelector('[data-journal-add]');
  renderJournalEntries(recipeId, listEl);

  addBtn.onclick = () => {
    if(section.querySelector('[data-journal-form]')) return;   // already open
    addBtn.insertAdjacentHTML('beforebegin', journalFormHTML(defaultMethodId));
    const formEl = section.querySelector('[data-journal-form]');
    addBtn.style.display = 'none';
    formEl._onCancel = () => { formEl.remove(); addBtn.style.display = ''; };
    wireJournalForm(formEl, recipeId, () => { formEl.remove(); addBtn.style.display = ''; renderJournalEntries(recipeId, listEl); });
    formEl.querySelector('[data-journal-note]').focus();
  };

  listEl.onclick = async e => {
    const del = e.target.closest('[data-note-del]');
    if(!del) return;
    const entry = del.closest('[data-note-id]');
    if(!entry) return;
    if(!confirm('Delete this journal entry?')) return;
    await deleteTastingNote(recipeId, entry.dataset.noteId);
    renderJournalEntries(recipeId, listEl);
  };
}

/* ---------- navigation ---------- */
let currentScreen = 'screen-home';

/* World map + Collection are member features: a signed-out visitor still
   lands on the tab, but its content is swapped for a sign-in gate (the .screen
   markup carries a .screen-gate; app.js just toggles .is-locked). Recipes and
   Recipe Detail are never gated — the catalog stays fully open. */
function isGatedScreen(s){ return s === 'screen-world' || s === 'screen-collection'; }
function applyScreenGate(target){
  const locked = isGatedScreen(target) && !currentUser;
  const el = document.getElementById(target);
  if(el) el.classList.toggle('is-locked', locked);
  return locked;
}

function switchScreen(target){
  if(target === currentScreen) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === target));
  document.querySelectorAll('.nav-tab').forEach(t => {
    const on = t.dataset.target === target;
    t.classList.toggle('active', on);
    if(on) t.setAttribute('aria-current','page'); else t.removeAttribute('aria-current');
  });
  currentScreen = target;
  const locked = applyScreenGate(target);
  if(target === 'screen-collection' && !locked){ renderCollection(); if(window._resetCollHeaderScroll) window._resetCollHeaderScroll(); }
  if(target === 'screen-world' && !locked){
    syncWorldToggle();
    renderWorldPasses();
    if(worldView === 'map') initWorldMap();
  }
  if(target === 'screen-flavorwheel') renderFlavorWheel();
  updateNavCountPill();
  if(window._collapseSearch) window._collapseSearch();
  if(kitchenOpen){ kitchenOpen = false; renderKitchen(); }
  if(equipFilterOpen){ equipFilterOpen = false; renderEquipment(); }
}

/* Re-evaluate the current screen's gate after an auth change: unlock + render
   it when signing in, re-lock it when signing out. */
function refreshCurrentGate(){
  if(!isGatedScreen(currentScreen)) return;
  const locked = applyScreenGate(currentScreen);
  if(locked) return;
  if(currentScreen === 'screen-collection'){ renderCollection(); if(window._resetCollHeaderScroll) window._resetCollHeaderScroll(); }
  if(currentScreen === 'screen-world'){ syncWorldToggle(); renderWorldPasses(); if(worldView === 'map') initWorldMap(); }
}

/* ---------- similar recipes ("you might also like") ----------
   Scores every other recipe against r and returns the top n. Reuses
   getStyleCategory() (flavour lane) and getOwnedEquipmentSet() (Track 3.0
   onboarding) rather than anything new. _canMakeWithOwned is a small local
   check for scoring purposes only — not the full Track 3b equipment filter. */
function _canMakeWithOwned(x, owned){
  if(owned.has(x.method)) return true;
  return (x.methods || []).some(m => owned.has(m.id));
}
function similarRecipes(r, n){
  n = n || 4;
  const cat = getStyleCategory(r);
  const owned = getOwnedEquipmentSet();
  const scored = recipes
    .filter(x => x.id !== r.id)
    .map(x => ({
      x,
      score: (getStyleCategory(x) === cat ? 2 : 0)
           + (x.method === r.method ? 1 : 0)
           + (r.origin && x.origin === r.origin ? 1 : 0)
           + (owned.size && _canMakeWithOwned(x, owned) ? 1 : 0)
    }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
  const picks = scored.slice(0, n).map(s => s.x);
  if(picks.length < n){
    const have = new Set(picks.map(p => p.id));
    have.add(r.id);
    for(const x of recipes.slice().sort((a,b) => (a.serial||0)-(b.serial||0))){
      if(picks.length >= n) break;
      if(have.has(x.id)) continue;
      picks.push(x); have.add(x.id);
    }
  }
  return picks;
}
function similarRecipesHTML(r){
  const sims = similarRecipes(r);
  if(!sims.length) return '';
  return `<div class="detail-block similar-block">
    <div class="detail-block-label">You might also like</div>
    <div class="similar-row">${sims.map(x => collectionCard(x, {showRatio:true})).join('')}</div>
  </div>`;
}

/* ---------- detail (its own screen — breadcrumb, hero, story/ingredients/steps) ---------- */
let detailRecipeId = null;

function openDetail(id, cardEl){
  const r = recipes.find(x => x.id === id);
  if(!r) return;
  detailRecipeId = id;
  const al   = getAirline(r.serial || 0);
  const code = r.code || al.code;
  const content = document.getElementById('detail-content');

  const hasMethods = r.methods && r.methods.length > 1;
  let curMethodId = hasMethods
    ? ((r.methods.find(m => m.recommended) || r.methods[0]).id)
    : null;

  function activeContent(){
    if(hasMethods){
      const m = r.methods.find(m => m.id === curMethodId) || r.methods[0];
      return { ingredients: m.ingredients||r.ingredients||[], steps: m.steps||r.steps||[], note: m.note||'' };
    }
    return { ingredients: r.ingredients||[], steps: r.steps||[], note: '' };
  }

  function methodTabsHTML(){
    if(!hasMethods) return '';
    return `<div class="method-switcher">
      <div class="method-label">Brew method</div>
      <div class="method-tabs">${r.methods.map(m =>
        `<button class="method-tab${m.id===curMethodId?' active':''}" data-method-id="${esc(m.id)}">${esc(m.label)}</button>`
      ).join('')}</div>
    </div>`;
  }

  function bodyContentHTML(){
    const { ingredients, steps, note } = activeContent();

    const ingHTML = ingredients.map((i) => `<div class="check-row" data-check role="button" tabindex="0" aria-pressed="false">
        <span class="check-box" aria-hidden="true" style="--check-color:${al.color}"></span>
        <span class="check-text">${esc(fmtAmounts(i))}</span>
      </div>`).join('');

    const stepHTML = steps.map((s, idx) => {
      const st = (typeof s === 'string') ? {c: s} : s;
      const notLast = idx < steps.length - 1;
      return `<div class="timeline-item">
        ${notLast ? `<span class="timeline-line" style="background:linear-gradient(180deg, ${al.color}55, rgba(242,228,207,.08))"></span>` : ''}
        <span class="timeline-num" style="border:1.5px solid ${al.color}66;color:${al.color}">${idx + 1}</span>
        <div class="timeline-body">
          ${st.t ? `<div class="timeline-title">${esc(st.t)}</div>` : ''}
          <div class="timeline-text">${esc(fmtAmounts(st.c))}</div>
        </div>
      </div>`;
    }).join('');

    return `<div class="detail-columns">
      <div class="detail-col detail-col-left">
        ${r.story ? `<div class="detail-block">
          <div class="detail-block-label">The story</div>
          <p class="detail-story-text">${esc(r.story)}</p>
        </div>` : ''}

        ${r.bean ? `<div class="detail-bean-note">
          <div class="detail-bean-note-label">☕ Roast profile — what to look for</div>
          <p>${esc(r.bean)}</p>
        </div>` : ''}

        ${buyPicksHTML(r.id)}

        <div class="detail-block detail-ing-section">
          <div class="detail-block-label">What you'll need</div>
          <div class="detail-check-list">${ingHTML}</div>
        </div>
      </div>

      <div class="detail-col detail-col-right">
        <div class="detail-steps-head">
          <div class="detail-block-label">How to make</div>
          <span class="detail-steps-count">· ${steps.length} step${steps.length===1?'':'s'}</span>
        </div>
        <div class="detail-timeline">${stepHTML}</div>

        ${note ? `<p class="method-note">${esc(note)}</p>` : ''}

        ${r.notes ? `<div class="detail-notes-box">
          <div class="detail-notes-label">✎ Notes</div>
          <p>${esc(r.notes)}</p>
        </div>` : ''}
      </div>
    </div>`;
  }

  const isCustom  = String(r.id).startsWith('custom-');
  const anySteps  = (activeContent().steps || []).length > 0;

  content.innerHTML = `
    <div class="detail-inner">
      <div class="detail-breadcrumb">
        <button class="crumb-back" data-back type="button">← Recipes</button>
        <span class="crumb-sep">/</span>
        <span class="crumb-cat">${esc((STYLE_CATEGORIES.find(c => c.id === getStyleCategory(r)) || {}).label || 'Recipe')}</span>
        <span class="crumb-sep">/</span>
        <span class="crumb-current">${esc(r.name)}</span>
        ${isCustom ? `<div class="crumb-owner-actions">
          <button class="coll-icon-btn" data-edit aria-label="Edit recipe">✎</button>
          <button class="coll-icon-btn" data-delete aria-label="Delete recipe">✕</button>
        </div>` : ''}
      </div>

      <div class="detail-hero">
        <span class="detail-hero-stripe" style="background:${al.color}"></span>
        <div class="detail-hero-glow" style="background:radial-gradient(circle at 85% 20%, ${al.color}30, transparent 48%)"></div>
        <div class="detail-hero-inner">
          <div class="hero-portrait" aria-hidden="true" style="width:180px;height:180px">
            <span class="hero-portrait-glow" style="width:180px;height:180px;background:radial-gradient(circle,${al.color}55,transparent 68%)"></span>
            <div class="hero-portrait-cup" style="width:140.4px;height:140.4px">
              <span class="hero-portrait-highlight" style="top:25.2px;width:81px;height:28.8px"></span>
              <span class="hero-steam" style="left:40%;top:-7px"></span>
              <span class="hero-steam" style="left:55%;top:-7px;animation-delay:.9s"></span>
            </div>
          </div>
          <div class="detail-hero-copy">
            <div class="detail-hero-eyebrow" style="color:${al.color}">Boarding pass · Brew No. ${pad(r.serial || 0)} · ${esc(code)} ${esc(r.origin || 'Fusion')}</div>
            <h1 class="detail-hero-title">${esc(r.name)}</h1>
            ${r.description ? `<p class="detail-hero-sub">${esc(r.description)}</p>` : ''}
            <div class="detail-hero-stats">
              <div class="detail-stat"><div class="detail-stat-value">${esc(r.ratio || '—')}</div><div class="detail-stat-label">Ratio</div></div>
              <div class="detail-stat"><div class="detail-stat-value detail-stat-method">${esc(methodLabel(r.method))}</div><div class="detail-stat-label">Method</div></div>
              <div class="detail-stat"><div class="detail-beans">${coloredBeans(r.strength || 3, al.color)}</div><div class="detail-stat-label">Strength</div></div>
              <div class="detail-stat"><div class="detail-stat-value" data-meta-stat>${metaBadgeHTML(r, curMethodId)}</div><div class="detail-stat-label">Effort · Time</div></div>
            </div>
          </div>
        </div>
      </div>

      ${methodTabsHTML()}
      <div data-method-content>${bodyContentHTML()}</div>

      ${similarRecipesHTML(r)}

      <div class="detail-made-row">
        <button class="detail-made-toggle ${r.tried?'on':''}" data-made type="button"><span class="box">✓</span>${r.tried?'Made it':'Mark as made'}<span class="puff"></span><span class="puff"></span><span class="puff"></span><span class="puff"></span><span class="puff"></span></button>
        <div class="detail-rate-wrap"><span class="detail-rate-label">Your rating</span><div class="detail-rate-stars" data-rate>${[1,2,3,4,5].map(i=>`<button data-star="${i}" class="${i<=(r.rating||0)?'on':''}" aria-label="${i} star">★</button>`).join('')}</div></div>
        <button class="detail-pin-btn ${r.pinned?'on':''}" data-pin type="button" aria-label="${r.pinned?'Unpin':'Pin'} recipe">${PIN_SVG}</button>
      </div>

      ${journalSectionHTML()}

      <div class="detail-cta-footer">
        <div class="detail-cta-text">
          <div class="detail-cta-label">Ready when you are</div>
          <div class="detail-cta-title">Brew the ${esc(r.name)}, step by step</div>
        </div>
        ${anySteps ? `<button class="detail-start-btn" data-brew type="button">▶ Start the recipe</button>` : ''}
      </div>
    </div>`;

  switchScreen('screen-detail');
  content.scrollTop = 0;

  content.querySelector('[data-back]').onclick = () => switchScreen('screen-home');

  function wireBrewBtn(){
    const btn = content.querySelector('[data-brew]');
    if(btn) btn.onclick = () => startBrew(id, curMethodId);
  }
  wireBrewBtn();

  /* Click (or Enter/Space) an ingredient row to strike it through. */
  function wireChecks(){
    content.querySelectorAll('[data-check]').forEach(row => {
      const toggle = () => {
        const on = row.classList.toggle('checked');
        row.setAttribute('aria-pressed', on ? 'true' : 'false');
      };
      row.onclick = toggle;
      row.onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); } };
    });
  }
  wireChecks();

  content.querySelectorAll('.similar-row .coll-card').forEach(card => {
    card.onclick = async e => {
      const pinBtn = e.target.closest('[data-pin]');
      if(pinBtn){ e.stopPropagation(); await togglePinned(card.dataset.id); openDetail(id, cardEl); return; }
      openDetail(card.dataset.id, card);
    };
  });

  const picksToggle = content.querySelector('[data-picks-toggle]');
  if(picksToggle) picksToggle.onclick = () => { picksToggle.classList.toggle('open'); content.querySelector('[data-picks-body]').classList.toggle('open'); };

  content.querySelectorAll('.method-tab').forEach(btn => {
    btn.onclick = () => {
      curMethodId = btn.dataset.methodId;
      content.querySelectorAll('.method-tab').forEach(b => b.classList.toggle('active', b.dataset.methodId === curMethodId));
      const mc = content.querySelector('[data-method-content]');
      if(mc){
        mc.innerHTML = bodyContentHTML();
        wireBrewBtn();
        wireChecks();
        const pt = content.querySelector('[data-picks-toggle]');
        if(pt) pt.onclick = () => { pt.classList.toggle('open'); content.querySelector('[data-picks-body]').classList.toggle('open'); };
      }
      /* Effort · Time badge tracks the selected method variant. */
      const ms = content.querySelector('[data-meta-stat]');
      if(ms) ms.innerHTML = metaBadgeHTML(r, curMethodId);
    };
  });

  const madeBtn = content.querySelector('[data-made]');
  madeBtn.onclick = async () => {
    const nowTried = !r.tried;
    r.tried = nowTried;
    if(!r.tried) r.rating = 0;
    await saveRecipes(); render(); renderCollection(); renderWorldPasses();
    if(nowTried){
      madeBtn.classList.add('on');
      madeBtn.innerHTML = '<span class="box">✓</span>Made it' + '<span class="puff"></span>'.repeat(5);
      void madeBtn.offsetWidth; madeBtn.classList.add('celebrate');
      const br = madeBtn.getBoundingClientRect();
      if(typeof beanBurst === 'function') beanBurst(br.left + br.width/2, br.top + br.height/2, 16);
      showToast('Boarded ✓');
      setTimeout(() => openDetail(id, cardEl), 720);
    } else {
      openDetail(id, cardEl); showToast('Moved back to "to try"');
    }
  };
  content.querySelectorAll('[data-rate] button').forEach(b => b.onclick = async () => {
    const v = +b.dataset.star;
    r.rating = (r.rating === v ? v - 1 : v);
    if(r.rating > 0) r.tried = true;
    await saveRecipes(); render(); renderCollection(); renderWorldPasses(); openDetail(id, cardEl);
  });
  const pinBtn = content.querySelector('.detail-made-row [data-pin]');
  if(pinBtn) pinBtn.onclick = async () => { await togglePinned(id); openDetail(id, cardEl); };
  wireDetailJournal(content, id, curMethodId || r.method);
  const editBtn = content.querySelector('[data-edit]');
  if(editBtn) editBtn.onclick = () => openForm(r.id);
  const deleteBtn = content.querySelector('[data-delete]');
  if(deleteBtn) deleteBtn.onclick = async () => {
    if(!confirm(`Delete "${r.name}"? This can’t be undone.`)) return;
    recipes = recipes.filter(x => x.id !== r.id);
    rememberSeedDeletion(r.id);
    await saveRecipes(); render(); renderCollection(); renderWorldPasses(); switchScreen('screen-home'); showToast('Recipe deleted');
  };
}

/* Returns to the Recipes screen — kept as the Escape-key / form-close target. */
function closeDetail(){
  if(currentScreen === 'screen-detail') switchScreen('screen-home');
}

/* ---------- form ---------- */
/* Repeatable-row builders for the ingredients & steps lists. */
function ingRowHTML(val){
  return `<div class="repeat-row" data-ing-row>
    <input type="text" class="ri-input" placeholder="e.g. 60 ml strong coffee" value="${esc(val||'')}">
    <button type="button" class="repeat-del" data-ing-del aria-label="Remove ingredient">✕</button>
  </div>`;
}
function stepRowHTML(t, c){
  return `<div class="repeat-row repeat-row-step" data-step-row>
    <div class="step-inputs">
      <input type="text" class="rs-title" placeholder="Step title (optional)" value="${esc(t||'')}">
      <textarea class="rs-instr" placeholder="What to do in this step">${esc(c||'')}</textarea>
    </div>
    <button type="button" class="repeat-del" data-step-del aria-label="Remove step">✕</button>
  </div>`;
}

function openForm(id){
  editingId = id || null;
  const r = id ? recipes.find(x=>x.id===id) : null;
  const sheet = document.getElementById('formSheet');
  const strength = r ? (r.strength||3) : 3;
  const ingVals  = (r && r.ingredients && r.ingredients.length) ? r.ingredients : [''];
  const stepVals = (r && r.steps && r.steps.length)
    ? r.steps.map(s => (typeof s === 'string') ? {t:'', c:s} : {t:s.t||'', c:s.c||''})
    : [{t:'', c:''}];
  sheet.innerHTML = `
    <div class="sheet-head"><h2>${r ? 'Edit recipe' : 'New recipe'}</h2><button class="close-btn" data-close aria-label="Close">✕</button></div>
    <div class="field"><label for="fName">Name</label><input id="fName" type="text" placeholder="e.g. Caffè Shakerato" value="${r?esc(r.name):''}"></div>
    <div class="field"><label for="fDesc">Description</label><textarea id="fDesc" placeholder="What makes this brew yours?">${r?esc(r.description||''):''}</textarea></div>
    <div class="field-row3">
      <div class="field"><label for="fSerial">Serial #</label><input id="fSerial" type="number" min="1" value="${r?(r.serial||nextSerial()):nextSerial()}"></div>
      <div class="field"><label for="fDate">Date added</label><input id="fDate" type="date" value="${dateInputVal(r?r.createdAt:null)}"></div>
      <div class="field"><label for="fOrigin">Origin</label><input id="fOrigin" type="text" placeholder="e.g. Italy" value="${r?esc(r.origin||''):''}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label for="fMethod">Brew method</label><select id="fMethod">${equipmentSelectOptionsHTML(r && r.method)}</select></div>
      <div class="field"><label for="fRatio">Ratio</label><input id="fRatio" type="text" placeholder="e.g. 1:4" value="${r?esc(r.ratio||''):''}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label for="fRatioLabel">What the ratio means</label><input id="fRatioLabel" type="text" placeholder="e.g. espresso : ice" value="${r?esc(r.ratioLabel||''):''}"></div>
      <div class="field"><label for="fTag">Tag</label><select id="fTag">${STYLE_CATEGORIES.map(c=>`<option value="${c.id}" ${r&&getStyleCategory(r)===c.id?'selected':''}>${esc(c.label)}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>Strength</label><div class="strength-picker" id="fStrength"></div></div>
    <div class="field"><label>Colour</label><div class="color-picker" id="fColor"></div></div>

    <div class="form-section">
      <div class="form-section-label">Detail page content</div>
      <div class="field"><label for="fStory">Story</label><textarea id="fStory" placeholder="The italic narrative that opens the recipe's detail page…">${r?esc(r.story||''):''}</textarea></div>
      <div class="field"><label for="fBean">Bean note</label><textarea id="fBean" placeholder="e.g. dark roast robusta, chocolatey — shown in the ☕ Bean note box">${r?esc(r.bean||''):''}</textarea></div>

      <div class="field">
        <label>Ingredients</label>
        <div class="repeat-list" id="ingList">${ingVals.map(ingRowHTML).join('')}</div>
        <button type="button" class="repeat-add" id="ingAdd">+ Add ingredient</button>
      </div>

      <div class="field">
        <label>Steps</label>
        <div class="repeat-list" id="stepList">${stepVals.map(s=>stepRowHTML(s.t, s.c)).join('')}</div>
        <button type="button" class="repeat-add" id="stepAdd">+ Add step</button>
      </div>

      <div class="field"><label for="fNotes">Notes</label><textarea id="fNotes" placeholder="Tips, tweaks, what to try next time — shown in the ✎ Notes box">${r?esc(r.notes||''):''}</textarea></div>
    </div>
    <div class="form-actions"><button class="btn" data-close>Cancel</button><button class="btn primary" data-save>${r ? 'Save changes' : 'Save recipe'}</button></div>`;

  let selStrength = strength;
  let selColor = r ? (r.color || FORM_ACCENT) : FORM_ACCENT;
  function renderStrengthDots(){
    sheet.querySelector('#fStrength').innerHTML = [1,2,3,4,5].map(n => `<span class="strength-dot" data-n="${n}" style="background:${n<=selStrength?`linear-gradient(150deg,#e9a25f,${selColor})`:'rgba(242,228,207,.1)'}"></span>`).join('');
    sheet.querySelectorAll('#fStrength .strength-dot').forEach(el => el.onclick = () => { selStrength = +el.dataset.n; renderStrengthDots(); });
  }
  function renderColorSwatches(){
    sheet.querySelector('#fColor').innerHTML = RECIPE_PALETTE.map(hex => `<span class="color-swatch" data-hex="${hex}" style="background:${hex};border:${selColor===hex?'2px solid var(--foam)':'1px solid rgba(242,228,207,.2)'};box-shadow:${selColor===hex?`0 0 0 3px ${hex}55`:'none'}"></span>`).join('');
    sheet.querySelectorAll('#fColor .color-swatch').forEach(el => el.onclick = () => { selColor = el.dataset.hex; renderColorSwatches(); renderStrengthDots(); });
  }
  renderStrengthDots();
  renderColorSwatches();
  sheet.querySelectorAll('[data-close]').forEach(b => b.onclick = closeForm);

  /* Repeatable ingredient rows: add appends a blank row; delete removes
     (but never the last one — it clears instead so a row is always present). */
  const ingList = sheet.querySelector('#ingList');
  sheet.querySelector('#ingAdd').onclick = () => {
    ingList.insertAdjacentHTML('beforeend', ingRowHTML(''));
    ingList.lastElementChild.querySelector('.ri-input').focus();
  };
  ingList.addEventListener('click', e => {
    const del = e.target.closest('[data-ing-del]');
    if(!del) return;
    if(ingList.querySelectorAll('[data-ing-row]').length > 1) del.closest('[data-ing-row]').remove();
    else del.closest('[data-ing-row]').querySelector('.ri-input').value = '';
  });

  /* Repeatable step rows (title + instruction), same add/delete behaviour. */
  const stepList = sheet.querySelector('#stepList');
  sheet.querySelector('#stepAdd').onclick = () => {
    stepList.insertAdjacentHTML('beforeend', stepRowHTML('', ''));
    stepList.lastElementChild.querySelector('.rs-title').focus();
  };
  stepList.addEventListener('click', e => {
    const del = e.target.closest('[data-step-del]');
    if(!del) return;
    if(stepList.querySelectorAll('[data-step-row]').length > 1) del.closest('[data-step-row]').remove();
    else { const row = del.closest('[data-step-row]'); row.querySelector('.rs-title').value = ''; row.querySelector('.rs-instr').value = ''; }
  });

  sheet.querySelector('[data-save]').onclick = async () => {
    const name = sheet.querySelector('#fName').value.trim();
    if(!name){ showToast('Give it a name first'); sheet.querySelector('#fName').focus(); return; }
    const prev = editingId ? recipes.find(x=>x.id===editingId) : null;
    const dateStr = sheet.querySelector('#fDate').value;
    const origin = sheet.querySelector('#fOrigin').value.trim();

    const ingredients = [...sheet.querySelectorAll('#ingList .ri-input')]
      .map(i => i.value.trim()).filter(Boolean);
    const steps = [...sheet.querySelectorAll('#stepList [data-step-row]')]
      .map(row => {
        const t = row.querySelector('.rs-title').value.trim();
        const c = row.querySelector('.rs-instr').value.trim();
        const step = {c};
        if(t) step.t = t;
        return step;
      })
      .filter(s => s.c);

    const data = {
      id: editingId || ('custom-' + Date.now()),
      serial: parseInt(sheet.querySelector('#fSerial').value, 10) || nextSerial(),
      name,
      description: sheet.querySelector('#fDesc').value.trim(),
      origin,
      method: sheet.querySelector('#fMethod').value,
      ratio: sheet.querySelector('#fRatio').value.trim(),
      ratioLabel: sheet.querySelector('#fRatioLabel').value.trim(),
      tagId: sheet.querySelector('#fTag').value,
      color: selColor,
      story: sheet.querySelector('#fStory').value.trim(),
      bean: sheet.querySelector('#fBean').value.trim(),
      strength: selStrength,
      ingredients,
      steps,
      notes: sheet.querySelector('#fNotes').value.trim(),
      tried: prev ? prev.tried : false,
      rating: prev ? prev.rating : 0,
      createdAt: dateStr ? D(dateStr) : (prev ? prev.createdAt : Date.now())
    };

    /* Custom recipes carry an origin-derived 2-letter code (shown on the
       boarding-pass stub). Built-in seed recipes keep their airline code. */
    const isCustom = !editingId || String(editingId).startsWith('custom-');
    if(isCustom && origin) data.code = origin.slice(0, 2).toUpperCase();
    else if(prev && prev.code) data.code = prev.code;

    if(editingId) recipes = recipes.map(x => x.id === editingId ? data : x);
    else recipes.push(data);
    await saveRecipes(); closeForm(); buildChips(); render(); renderCollection(); renderWorldPasses();
    showToast(editingId ? 'Saved' : 'Recipe saved ☕');
    editingId = null;
  };
  document.getElementById('formPanel').classList.add('open');
  setTimeout(()=>sheet.querySelector('#fName').focus(), 80);
}
function closeForm(){ document.getElementById('formPanel').classList.remove('open'); }
function closePanels(){ closeDetail(); closeForm(); }

/* ---------- brew mode (guided steps, JS-animated vessel fill) ----------
   The vessel fill is animated with a requestAnimationFrame loop rather than
   a CSS transition: the shell's inner nodes persist across step navigation
   (only text/attrs update), so a plain CSS transition would have nothing to
   transition *from* whenever step content changes. Driving it in JS also
   sidesteps environments where CSS transitions on SVG attrs stall or skip. */
let brewState        = null;   // {id,i,steps,ingredients,name,method,origin,color,dir,finishedSaved}
let brewStarsSeeded  = false;
let brewEls          = null;   // persistent DOM refs for the active brew session
let brewFillCurrent  = 0;      // current animated vessel fill percentage (0-100)
let brewFillRaf      = null;   // active requestAnimationFrame id
let brewTimerId      = null;   // active step-timer setInterval id
let brewTimerAudio   = null;   // lazily-created AudioContext for the done-chime

/* Step → icon type, guessed from the step's title + instruction text. */
const STEP_TYPE_KEYWORDS = [
  ['whisk', ['whip','whisk','foam','froth','beat','ribbon']],
  ['mix',   ['blend','stir','combine','dissolve','mix','shake']],
  ['brew',  ['brew','steep','bloom','heat','cezve','moka','simmer','boil']],
  ['pour',  ['pour','layer','float','top','fill','build','drizzle']],
  ['serve', ['serve','drink','garnish','enjoy','taste','adjust','show','strain']]
];
function _stepType(step){
  const text = ((step.t || '') + ' ' + (step.c || '')).toLowerCase();
  for(const [type, words] of STEP_TYPE_KEYWORDS){
    if(words.some(w => text.includes(w))) return type;
  }
  return 'cup';
}

/* Countdown length for a step (Phase 3 Brew Mode timer). An explicit
   step.seconds wins; otherwise parse the FIRST duration the instruction text
   already states ("steep 4 minutes", "wait 30 seconds", "30–45 sec") — most
   wait-steps say their time, so this needs no per-step data. Ranges use the
   lower bound. Long unattended steeps ("12–18 hours") return null: a 12-hour
   countdown ring is absurd, and the prose already says to walk away. */
function stepSeconds(step){
  if(!step) return null;
  if(typeof step.seconds === 'number') return step.seconds;
  const text = (typeof step === 'string' ? step : step.c) || '';
  const m = text.match(/(\d+(?:\.\d+)?)(?:\s*[–-]\s*\d+(?:\.\d+)?)?\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/i);
  if(!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  const secs = /^h/.test(unit) ? n * 3600 : /^m/.test(unit) ? n * 60 : n;
  return secs > 0 && secs <= 900 ? Math.round(secs) : null;   // no live countdown past 15 min
}
function _fmtClock(s){
  s = Math.max(0, Math.round(s));
  const m = Math.floor(s / 60);
  return m + ':' + String(s % 60).padStart(2, '0');
}
const STEP_ICONS = {
  whisk: `<svg viewBox="0 0 22 22" fill="none"><path d="M11 3 L8 12 M11 3 L11 13 M11 3 L14 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 12 Q11 16 14 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M11 15 V19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  mix:   `<svg viewBox="0 0 22 22" fill="none"><path d="M5 9 H17 L15 17 a2 2 0 0 1-2 1.6H9 A2 2 0 0 1 7 17 Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 5 L14 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  brew:  `<svg viewBox="0 0 22 22" fill="none"><path d="M5 9 H15 L14 17 a2 2 0 0 1-2 2H9 a2 2 0 0 1-2-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M15 11 a3 3 0 0 1 0 6" stroke="currentColor" stroke-width="1.5"/><path d="M8 6 C7 4 9 3 8 1 M12 6 C11 4 13 3 12 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  pour:  `<svg viewBox="0 0 22 22" fill="none"><path d="M4 4 L10 4 L9 10 a1.5 1.5 0 0 1-3 0Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 6 Q14 9 15 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="1.5 2.2"/><path d="M12 15 H18 L17 20 a1.6 1.6 0 0 1-1.6 1.4h-.8A1.6 1.6 0 0 1 13 20Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  serve: `<svg viewBox="0 0 22 22" fill="none"><path d="M6 8 H16 L15 16 a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 16Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 19 H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 4.5 Q11 6 9 7.5 M13 4.5 Q15 6 13 7.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  cup:   `<svg viewBox="0 0 22 22" fill="none"><path d="M5 8 H15 L14 17 a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 17Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M15 10 a3 3 0 0 1 0 6" stroke="currentColor" stroke-width="1.5"/></svg>`
};

function startBrew(id, methodId){
  const r = recipes.find(x => x.id === id);
  if(!r) return;
  let steps        = r.steps || [];
  let ingredients  = r.ingredients || [];
  /* Recipes with a methods[] array already carry a human label per variant
     (m.label); only a custom recipe with no methods[] falls back to the raw
     top-level id, so run that fallback through methodLabel() for a pretty
     display instead of e.g. "moka". */
  let curMethodLabel = methodLabel(r.method) || '';
  let curMethodId = r.method || '';
  if(r.methods && r.methods.length){
    const mId = methodId || (r.methods.find(m => m.recommended) || r.methods[0]).id;
    const m = r.methods.find(m => m.id === mId) || r.methods[0];
    if(m && m.steps && m.steps.length){ steps = m.steps; ingredients = m.ingredients || ingredients; curMethodLabel = m.label; curMethodId = m.id; }
  }
  if(!steps.length) return;

  const al = getAirline(r.serial || 0);
  brewState = {
    id, i: 0, steps, ingredients,
    name: r.name, method: curMethodLabel, methodId: curMethodId, origin: r.origin || 'Fusion',
    color: al.color, dir: 1, finishedSaved: false
  };
  brewFillCurrent = 0;
  cancelAnimationFrame(brewFillRaf);

  /* Brew Mode is a full-screen overlay (z-index above everything), so the
     screen underneath — often screen-detail — is left as-is rather than
     navigated away from. Exiting Brew Mode lands back on the same page. */
  const bm = document.getElementById('brew-mode');
  bm.style.display = 'flex';
  if(!brewStarsSeeded && typeof BREW_ANIM !== 'undefined'){ BREW_ANIM.createStarField(document.getElementById('brewStars'), 45, true); brewStarsSeeded = true; }

  _buildBrewShell();
  _renderBrewStep();
}

function _buildBrewShell(){
  const bm  = document.getElementById('brew-mode');
  const old = bm.querySelector('.brew-shell');
  if(old) old.remove();

  const shell = document.createElement('div');
  shell.className = 'brew-shell';
  shell.innerHTML = `
    <div class="brew-topbar">
      <div class="brew-top-left">
        <span class="brew-origin-badge" data-origin-badge></span>
        <div class="brew-top-text">
          <div class="brew-top-label">BREW MODE · IN FLIGHT</div>
          <div class="brew-top-title" data-top-title></div>
        </div>
      </div>
      <div class="brew-top-right">
        <button class="brew-ing-btn" data-ing-toggle type="button" aria-expanded="false" aria-controls="brewIngPopover">
          <svg class="brew-ing-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 5h10M3 8h10M3 11h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          Ingredients <span class="brew-ing-count" data-ing-count></span>
          <svg class="brew-ing-chev" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="close-btn" data-exit aria-label="Close">✕</button>
      </div>
      <div class="brew-ing-popover" id="brewIngPopover" data-ing-popover hidden>
        <div class="brew-ing-popover-title">Ingredients</div>
        <ul class="brew-ing-list" data-ing-list></ul>
      </div>
    </div>

    <div class="brew-progress-bar"><div class="brew-progress-fill" data-progress-fill></div></div>

    <div class="brew-content" data-content>
      <div class="brew-live" data-live>
        <div class="brew-vessel-col">
          <div class="brew-vessel-wrap" aria-hidden="true">
            <svg class="brew-vessel-svg" viewBox="0 0 80 100" fill="none">
              <defs><clipPath id="brewVesselClip"><path d="M15 35 H65 L60 82 a8 8 0 0 1-8 7 H28 a8 8 0 0 1-8-7 Z"/></clipPath></defs>
              <rect data-vessel-fill x="15" y="82" width="50" height="10" clip-path="url(#brewVesselClip)"/>
              <path data-vessel-outline d="M15 35 H65 L60 82 a8 8 0 0 1-8 7 H28 a8 8 0 0 1-8-7 Z" stroke-width="1.8"/>
              <path data-vessel-handle d="M65 46 a11 11 0 0 1 0 22" stroke-width="1.8"/>
              <path data-vessel-rim d="M14 35 H66" stroke-width="1.4" stroke-linecap="round"/>
              <path class="bw-steam" data-vessel-steam1 d="M30 32 C26 22 34 16 30 8" stroke-width="1.6" stroke-linecap="round"/>
              <path class="bw-steam" data-vessel-steam2 d="M50 32 C46 22 54 16 50 8" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="brew-vessel-pct" data-vessel-pct>0%</div>
        </div>
        <div class="brew-step-col">
          <div class="brew-step-icon" data-step-icon></div>
          <div class="brew-stepnum" data-stepnum></div>
          <div class="brew-step-title" data-step-title></div>
          <div class="brew-step-text" data-step-text></div>
          <div class="brew-timer" data-timer hidden>
            <svg class="brew-timer-ring" viewBox="0 0 64 64" aria-hidden="true">
              <circle class="brew-timer-track" cx="32" cy="32" r="28"/>
              <circle class="brew-timer-prog" data-timer-ring cx="32" cy="32" r="28"/>
            </svg>
            <div class="brew-timer-num" data-timer-num>0:00</div>
            <button class="brew-timer-btn" data-timer-btn type="button">Start timer</button>
          </div>
        </div>
      </div>

      <div class="brew-finish" data-finish hidden>
        <div class="brew-stamp" data-stamp>✓ Boarded<br>Brew complete</div>
        <h2 class="brew-finish-title" data-finish-title></h2>
        <p class="brew-finish-sub" data-finish-sub></p>
        <div class="brew-finish-actions">
          <button class="brew-btn" data-restart type="button">↺ Brew again</button>
          <button class="brew-btn" data-finish-note type="button">✎ Add a tasting note</button>
        </div>
        <div class="brew-finish-journal" data-finish-journal hidden></div>
      </div>
    </div>

    <div class="brew-rail" data-rail role="tablist" aria-label="Jump to step"></div>

    <div class="brew-footer" data-footer>
      <button class="brew-btn" data-prev type="button">← Back</button>
      <div class="brew-footer-mid"><span data-footer-pct>0%</span><span class="brew-footer-dot">·</span><span data-footer-origin></span></div>
      <button class="brew-btn primary" data-next type="button">Next step →</button>
    </div>`;
  bm.appendChild(shell);

  brewEls = {
    shell,
    originBadge: shell.querySelector('[data-origin-badge]'),
    topTitle:    shell.querySelector('[data-top-title]'),
    ingToggle:   shell.querySelector('[data-ing-toggle]'),
    ingCount:    shell.querySelector('[data-ing-count]'),
    ingPopover:  shell.querySelector('[data-ing-popover]'),
    ingList:     shell.querySelector('[data-ing-list]'),
    exitBtn:     shell.querySelector('[data-exit]'),
    progressFill:shell.querySelector('[data-progress-fill]'),
    live:        shell.querySelector('[data-live]'),
    finish:      shell.querySelector('[data-finish]'),
    vesselFill:    shell.querySelector('[data-vessel-fill]'),
    vesselOutline: shell.querySelector('[data-vessel-outline]'),
    vesselHandle:  shell.querySelector('[data-vessel-handle]'),
    vesselRim:     shell.querySelector('[data-vessel-rim]'),
    vesselSteam1:  shell.querySelector('[data-vessel-steam1]'),
    vesselSteam2:  shell.querySelector('[data-vessel-steam2]'),
    vesselPct:     shell.querySelector('[data-vessel-pct]'),
    stepIcon:  shell.querySelector('[data-step-icon]'),
    stepnum:   shell.querySelector('[data-stepnum]'),
    stepTitle: shell.querySelector('[data-step-title]'),
    stepText:  shell.querySelector('[data-step-text]'),
    timer:     shell.querySelector('[data-timer]'),
    timerRing: shell.querySelector('[data-timer-ring]'),
    timerNum:  shell.querySelector('[data-timer-num]'),
    timerBtn:  shell.querySelector('[data-timer-btn]'),
    rail:      shell.querySelector('[data-rail]'),
    footer:    shell.querySelector('[data-footer]'),
    prevBtn:   shell.querySelector('[data-prev]'),
    nextBtn:   shell.querySelector('[data-next]'),
    footerPct:    shell.querySelector('[data-footer-pct]'),
    footerOrigin: shell.querySelector('[data-footer-origin]'),
    stamp:       shell.querySelector('[data-stamp]'),
    finishTitle: shell.querySelector('[data-finish-title]'),
    finishSub:   shell.querySelector('[data-finish-sub]'),
    restartBtn:  shell.querySelector('[data-restart]'),
    finishNote:  shell.querySelector('[data-finish-note]'),
    finishJournal: shell.querySelector('[data-finish-journal]')
  };

  const color = brewState.color;
  brewEls.originBadge.textContent = brewState.origin;
  brewEls.originBadge.style.cssText = `color:${color};border-color:${color}66;background:${color}1f`;
  brewEls.topTitle.innerHTML = `${esc(brewState.name)}${brewState.method ? ` <span class="brew-top-method">· ${esc(brewState.method)}</span>` : ''}`;
  brewEls.progressFill.style.background = color;
  brewEls.vesselOutline.setAttribute('stroke', color + 'aa');
  brewEls.vesselHandle.setAttribute('stroke', color + 'aa');
  brewEls.vesselRim.setAttribute('stroke', hexLighten(color, 55));
  brewEls.vesselSteam1.setAttribute('stroke', color);
  brewEls.vesselSteam2.setAttribute('stroke', hexLighten(color, 40));
  brewEls.vesselFill.setAttribute('fill', color);
  brewEls.nextBtn.style.background = color;
  brewEls.stamp.style.cssText = `border-color:${color};color:${color}`;
  brewEls.footerOrigin.textContent = brewState.origin;

  brewEls.ingCount.textContent = brewState.ingredients.length ? `(${brewState.ingredients.length})` : '';
  brewEls.ingList.innerHTML = brewState.ingredients.map(i =>
    `<li>${ingredientIcon(i)}<span>${esc(fmtAmounts(i))}</span></li>`
  ).join('');

  _buildBrewRail();

  brewEls.exitBtn.onclick = exitBrew;
  brewEls.ingToggle.onclick = () => {
    const willOpen = brewEls.ingPopover.hidden;
    brewEls.ingPopover.hidden = !willOpen;
    brewEls.ingToggle.classList.toggle('open', willOpen);
    brewEls.ingToggle.setAttribute('aria-expanded', String(willOpen));
  };
  shell.addEventListener('click', e => {
    if(brewEls.ingPopover.hidden) return;
    if(e.target.closest('[data-ing-popover]') || e.target.closest('[data-ing-toggle]')) return;
    brewEls.ingPopover.hidden = true;
    brewEls.ingToggle.classList.remove('open');
    brewEls.ingToggle.setAttribute('aria-expanded', 'false');
  });
  brewEls.prevBtn.onclick = () => _brewGoto(brewState.i - 1);
  brewEls.nextBtn.onclick = () => _brewGoto(brewState.i + 1);
  brewEls.restartBtn.onclick = () => { brewState.finishedSaved = false; _brewGoto(0); };

  /* Finish screen: "Add a tasting note" reveals the shared journal form,
     pre-filled with the method just brewed, saving against this recipe. */
  if(brewEls.finishNote) brewEls.finishNote.onclick = () => {
    if(!brewEls.finishJournal) return;
    if(brewEls.finishJournal.querySelector('[data-journal-form]')){   // toggle closed
      brewEls.finishJournal.innerHTML = ''; brewEls.finishJournal.hidden = true;
      brewEls.finishNote.classList.remove('open');
      return;
    }
    brewEls.finishJournal.innerHTML = journalFormHTML(brewState.methodId || '');
    brewEls.finishJournal.hidden = false;
    brewEls.finishNote.classList.add('open');
    const formEl = brewEls.finishJournal.querySelector('[data-journal-form]');
    formEl._onCancel = () => { brewEls.finishJournal.innerHTML = ''; brewEls.finishJournal.hidden = true; brewEls.finishNote.classList.remove('open'); };
    wireJournalForm(formEl, brewState.id, () => {
      brewEls.finishJournal.innerHTML = '<p class="journal-saved-msg">Saved to your journal ☕</p>';
      brewEls.finishNote.classList.remove('open');
    });
    formEl.querySelector('[data-journal-note]').focus();
  };
}

function _buildBrewRail(){
  const total = brewState.steps.length;
  brewEls.rail.innerHTML = Array.from({length: total}, (_, k) =>
    `<button class="brew-seg" data-jump="${k}" type="button" aria-label="Go to step ${k + 1}"></button>`
  ).join('');
  brewEls.rail.querySelectorAll('.brew-seg').forEach(btn => {
    btn.onclick = () => _brewGoto(+btn.dataset.jump);
  });
}
function _updateBrewRail(){
  const color = brewState.color;
  brewEls.rail.querySelectorAll('.brew-seg').forEach(btn => {
    const k = +btn.dataset.jump;
    btn.classList.remove('done', 'current', 'upcoming');
    if(k < brewState.i){ btn.classList.add('done'); btn.style.background = color; }
    else if(k === brewState.i){ btn.classList.add('current'); btn.style.background = color; }
    else { btn.classList.add('upcoming'); btn.style.background = ''; }
  });
}

function _brewGoto(newIndex){
  if(!brewState) return;
  _clearStepTimer();
  const total = brewState.steps.length;
  newIndex = Math.max(0, Math.min(total, newIndex));
  brewState.dir = newIndex > brewState.i ? 1 : -1;
  brewState.i = newIndex;
  _renderBrewStep();
}

function _renderBrewStep(){
  if(!brewState || !brewEls) return;
  const { i, steps } = brewState;
  const total = steps.length;
  const atEnd = i >= total;
  const pct   = Math.round((Math.min(i, total) / total) * 100);

  _animateVesselTo(pct);

  brewEls.live.hidden   = atEnd;
  brewEls.finish.hidden = !atEnd;
  brewEls.rail.hidden   = atEnd;
  brewEls.footer.hidden = atEnd;

  if(!atEnd){
    const stepObj = (typeof steps[i] === 'string') ? {c: steps[i]} : steps[i];
    const type = _stepType(stepObj);
    brewEls.stepIcon.innerHTML = STEP_ICONS[type] || STEP_ICONS.cup;
    brewEls.stepIcon.style.color = brewState.color;
    brewEls.stepnum.textContent = `STEP ${i + 1} OF ${total}`;
    brewEls.stepTitle.textContent = stepObj.t || '';
    brewEls.stepTitle.style.display = stepObj.t ? '' : 'none';
    brewEls.stepText.textContent = fmtAmounts(stepObj.c || '');
    _setupStepTimer(stepSeconds(stepObj));

    brewEls.prevBtn.disabled = i === 0;
    brewEls.footerPct.textContent = pct + '%';
    brewEls.nextBtn.textContent = (i === total - 1) ? 'Finish ✓' : 'Next step →';

    _updateBrewRail();
    if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.animateBrewStep(brewEls.stepIcon.closest('.brew-step-col'), brewState.dir);
  } else {
    brewEls.finishTitle.textContent = `Enjoy your ${brewState.name}`;
    brewEls.finishSub.textContent = `${brewState.method ? brewState.method + ' · ' : ''}${total} step${total === 1 ? '' : 's'} · from ${brewState.origin}`;
    /* Reset any open/saved journal form from a previous finish. */
    if(brewEls.finishJournal){ brewEls.finishJournal.innerHTML = ''; brewEls.finishJournal.hidden = true; }
    if(brewEls.finishNote) brewEls.finishNote.classList.remove('open');
    if(!brewState.finishedSaved){
      brewState.finishedSaved = true;
      _markBrewTried(brewState.id);
    }
    if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.landAnimation();
  }
}

/* Vessel fill is driven by rAF, not a CSS transition — see comment above. */
function _animateVesselTo(targetPct){
  if(!brewEls || !brewEls.vesselFill) return;
  cancelAnimationFrame(brewFillRaf);
  const start = brewFillCurrent;
  const t0    = performance.now();
  const dur   = 550;
  const step = now => {
    const t = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    brewFillCurrent = start + (targetPct - start) * eased;
    _paintVessel(brewFillCurrent);
    if(t < 1) brewFillRaf = requestAnimationFrame(step);
  };
  brewFillRaf = requestAnimationFrame(step);
}
function _paintVessel(pct){
  if(!brewEls || !brewEls.vesselFill) return;
  const fillH = 47 * pct / 100;
  const fillY = 82 - fillH;
  brewEls.vesselFill.setAttribute('y', fillY);
  brewEls.vesselFill.setAttribute('height', fillH + 10);
  if(brewEls.vesselPct) brewEls.vesselPct.textContent = Math.round(pct) + '%';
  const steamOpacity = pct > 40 ? 0.55 : 0.18;
  if(brewEls.vesselSteam1) brewEls.vesselSteam1.style.opacity = steamOpacity;
  if(brewEls.vesselSteam2) brewEls.vesselSteam2.style.opacity = steamOpacity;
}

/* ---------- step timer (Phase 3) ----------
   Optional per-step countdown. Deliberately driven by a wall-clock +
   setInterval, NOT requestAnimationFrame: rAF (right for the vessel fill)
   PAUSES whenever the tab is backgrounded — which for a brew timer is exactly
   when the user has walked away and most needs the chime. setInterval keeps
   firing (throttled to ~1s) while hidden, and reading remaining time from
   Date.now() means the count stays accurate regardless of throttling. It
   never gates progress — "Next step" stays live throughout. */
const _TIMER_RING_C = 2 * Math.PI * 28;   // circumference of the r=28 ring
function _paintTimerRing(frac){
  if(!brewEls || !brewEls.timerRing) return;
  brewEls.timerRing.style.strokeDasharray = _TIMER_RING_C.toFixed(2);
  brewEls.timerRing.style.strokeDashoffset = (_TIMER_RING_C * Math.min(1, Math.max(0, frac))).toFixed(2);
}
function _clearStepTimer(){
  if(brewTimerId){ clearInterval(brewTimerId); brewTimerId = null; }
}
/* Prime the timer UI for a step (not running yet — the user starts it when
   they're ready). secs falsy → hide the timer entirely for this step. */
function _setupStepTimer(secs){
  _clearStepTimer();
  const el = brewEls && brewEls.timer;
  if(!el) return;
  if(!secs){ el.hidden = true; return; }
  el.hidden = false;
  el.classList.remove('done', 'running');
  el.style.setProperty('--timer-color', brewState.color);
  brewEls.timerNum.textContent = _fmtClock(secs);
  brewEls.timerBtn.textContent = 'Start ' + _fmtClock(secs);
  _paintTimerRing(0);
  brewEls.timerBtn.onclick = () => _startStepTimer(secs);
}
function _startStepTimer(secs){
  _clearStepTimer();
  const el = brewEls.timer;
  el.classList.remove('done'); el.classList.add('running');
  brewEls.timerBtn.textContent = 'Reset';
  brewEls.timerBtn.onclick = () => _setupStepTimer(secs);
  const endAt = Date.now() + secs * 1000, durMs = secs * 1000;
  const tick = () => {
    const remaining = Math.max(0, endAt - Date.now());
    brewEls.timerNum.textContent = _fmtClock(Math.ceil(remaining / 1000));
    _paintTimerRing((durMs - remaining) / durMs);
    if(remaining <= 0){ _clearStepTimer(); _onStepTimerDone(secs); }
  };
  tick();
  brewTimerId = setInterval(tick, 200);
}
function _onStepTimerDone(secs){
  const el = brewEls.timer;
  el.classList.remove('running'); el.classList.add('done');
  _paintTimerRing(1);
  brewEls.timerNum.textContent = 'Done';
  brewEls.timerBtn.textContent = 'Restart ' + _fmtClock(secs);
  brewEls.timerBtn.onclick = () => _startStepTimer(secs);
  _timerDoneCue();
}
/* A short two-note chime (WebAudio) + a mobile vibration pulse, so a user who
   walked away from the screen mid-brew still gets the cue. Both are best-effort
   and wrapped — no-ops where unsupported. The AudioContext is created lazily
   inside a click handler so autoplay policies are satisfied. */
function _timerDoneCue(){
  try{ if(navigator.vibrate) navigator.vibrate([120, 60, 120]); }catch(e){}
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    brewTimerAudio = brewTimerAudio || new Ctx();
    const ctx = brewTimerAudio;
    if(ctx.state === 'suspended') ctx.resume();
    [[660, 0], [880, 0.18]].forEach(([freq, delay]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + delay;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.start(t); o.stop(t + 0.18);
    });
  }catch(e){}
}

async function _markBrewTried(id){
  const r = recipes.find(x => x.id === id);
  if(!r) return;
  r.tried = true;
  await saveRecipes();
  render(); renderCollection(); renderWorldPasses();
  /* If the underlying Detail screen is what's under this Brew Mode overlay,
     refresh it so its "Mark as made" button reflects the new state once
     Brew Mode is closed. */
  if(currentScreen === 'screen-detail' && detailRecipeId === id) openDetail(id);
}

function exitBrew(){
  cancelAnimationFrame(brewFillRaf);
  _clearStepTimer();
  const bm = document.getElementById('brew-mode');
  bm.style.display = 'none';
  const shell = bm.querySelector('.brew-shell');
  if(shell) shell.remove();
  brewState = null;
  brewEls   = null;
}

/* ---------- backup / restore ---------- */
function exportRecipes(){
  const blob = new Blob([JSON.stringify(recipes, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `brew-book-backup-${dateInputVal(Date.now())}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast('Backup downloaded ⬇');
}
function importRecipes(file){
  const reader = new FileReader();
  reader.onload = async () => {
    try{
      const data = JSON.parse(reader.result);
      if(!Array.isArray(data)) throw new Error('not a list');
      let merged = 0;
      for(const item of data){
        if(!item || !item.name) continue;
        if(!item.id) item.id = 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
        const idx = recipes.findIndex(x => x.id === item.id);
        if(idx >= 0) recipes[idx] = item; else recipes.push(item);
        merged++;
      }
      await saveRecipes(); buildChips(); render(); renderCollection(); renderWorldPasses();
      showToast(`Restored ${merged} recipe${merged===1?'':'s'} ⬆`);
    }catch(e){ showToast('That file didn’t look like a backup'); }
  };
  reader.readAsText(file);
}

/* ---------- wiring ---------- */
/* Flag the animation system as active so scroll-reveal elements start hidden.
   Without animations.js loaded, this stays off and all content renders visible. */
if(typeof BREW_ANIM !== 'undefined') document.documentElement.classList.add('brew-anim');

buildChips();
buildKitchen();
ownedEquipment = loadGuestEquipment().equipment;   // instant guest read (before first paint); initAuth() overrides for signed-in
buildEquipment();
/* The splash is the intro / loading animation (image + title). It plays as a
   transition INTO the app — not before the landing. Play it on load only for
   returning visitors who skip the landing; first-time / signed-out visitors
   see the marketing landing first and the splash plays when they click
   "Explore recipes" (see enterApp). */
function playSplash(){
  const sp = document.getElementById('splash');
  /* Explicit inline 'flex' (not '') so it overrides the html:not(.bb-returning)
     .splash{display:none} gate — that's what lets the splash play for a
     signed-out visitor after they tap "Explore recipes". */
  if(sp) sp.style.display = 'flex';
  if(typeof runSplash === 'function'){ runSplash(); return; }
  /* Fallback when animations.js isn't loaded: seed stars, then auto-dismiss. */
  if(!sp) return;
  const starsEl = document.getElementById('splashStars');
  if(starsEl){
    let html = '';
    for(let i = 0; i < 34; i++){
      const size  = (Math.random() * 2 + 1).toFixed(1);
      const left  = (Math.random() * 100).toFixed(1);
      const top   = (Math.random() * 100).toFixed(1);
      const dur   = (Math.random() * 3 + 2.5).toFixed(1);
      const delay = (Math.random() * 3).toFixed(1);
      html += `<span class="star-dot" style="width:${size}px;height:${size}px;left:${left}%;top:${top}%;--dur:${dur}s;--delay:${delay}s"></span>`;
    }
    starsEl.innerHTML = html;
  }
  setTimeout(() => { sp.style.transition = 'opacity .5s'; sp.style.opacity = '0'; setTimeout(() => { sp.style.display = 'none'; }, 520); }, 2900);
  const skip = document.getElementById('splashSkip');
  if(skip) skip.onclick = () => { sp.style.transition = 'opacity .25s'; sp.style.opacity = '0'; setTimeout(() => { sp.style.display = 'none'; }, 280); };
}

/* Signed-in visitors get the intro immediately as a loading screen; signed-out
   visitors land on the marketing home first (splash hidden), and the intro
   plays when they click "Explore recipes" (see enterApp). */
if(hasSupabaseSession()){
  playSplash();
} else {
  const sp0 = document.getElementById('splash');
  if(sp0) sp0.style.display = 'none';
}

document.querySelectorAll('.nav-tab').forEach(t => t.addEventListener('click', () => switchScreen(t.dataset.target)));

/* Clicking the logo/brand from anywhere returns to the Recipes home. */
(function(){
  const brand = document.getElementById('brandHome');
  if(!brand) return;
  const goHome = () => switchScreen('screen-home');
  brand.addEventListener('click', goHome);
  brand.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); goHome(); } });
})();

/* [data-id] rather than .coll-card so the compact .pin-stub in the Pinned lane
   works through the same delegated handlers. */
document.getElementById('content').addEventListener('click', async e => {
  const pinBtn = e.target.closest('[data-pin]');
  if(pinBtn){
    e.stopPropagation();
    const host = pinBtn.closest('[data-id]');
    if(host) await togglePinned(host.dataset.id, pinBtn);
    return;
  }

  const card = e.target.closest('.coll-card, .pin-stub');
  if(card && card.dataset.id) openDetail(card.dataset.id, card);
});
/* Stubs are keyboard-reachable (role=button, tabindex=0), so mirror the click. */
document.getElementById('content').addEventListener('keydown', e => {
  const stub = e.target.closest('.pin-stub');
  if(stub && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); openDetail(stub.dataset.id, stub); }
});
document.getElementById('collection-content').addEventListener('click', async e => {
  if(e.target.closest('#collAddCard')){ openForm(null); return; }

  const pinBtn = e.target.closest('[data-pin]');
  if(pinBtn){
    e.stopPropagation();
    const host = pinBtn.closest('[data-id]');
    if(host) await togglePinned(host.dataset.id, pinBtn);
    return;
  }

  const editBtn = e.target.closest('[data-edit]');
  if(editBtn){ e.stopPropagation(); openForm(editBtn.closest('.coll-card').dataset.id); return; }

  const delBtn = e.target.closest('[data-delete]');
  if(delBtn){
    e.stopPropagation();
    const id = delBtn.closest('.coll-card').dataset.id;
    const r = recipes.find(x => x.id === id);
    if(!r) return;
    if(!confirm(`Delete "${r.name}"? This can’t be undone.`)) return;
    recipes = recipes.filter(x => x.id !== id);
    await saveRecipes(); render(); renderCollection(); renderWorldPasses(); showToast('Recipe deleted');
    return;
  }

  const card = e.target.closest('.coll-card');
  if(card && card.dataset.id) openDetail(card.dataset.id, card);
});

document.querySelectorAll('.coll-seg').forEach(b => b.addEventListener('click', () => {
  collView = b.dataset.collView;
  renderCollection();
}));

document.querySelectorAll('.world-seg').forEach(b => b.addEventListener('click', () => {
  worldView = b.dataset.worldView;
  syncWorldToggle();
  if(worldView === 'map') initWorldMap();
}));

const worldPassesEl = document.getElementById('worldPasses');
if(worldPassesEl) worldPassesEl.addEventListener('click', async e => {
  const pinBtn = e.target.closest('[data-pin]');
  if(pinBtn){
    e.stopPropagation();
    const host = pinBtn.closest('[data-id]');
    if(host) await togglePinned(host.dataset.id, pinBtn);
    return;
  }

  const card = e.target.closest('.coll-card');
  if(card && card.dataset.id) openDetail(card.dataset.id, card);
});

document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.hero-brew-btn, .util-add, .detail-made-toggle, .brew-btn.primary');
  if(el && typeof spawnRipple === 'function') spawnRipple(el, e);
}, {passive:true});

/* Light / dark theme toggle. Initial theme is set inline in <head> before
   first paint; here we just wire the button and persist the choice. */
(function(){
  const btn = document.getElementById('themeToggle');
  if(!btn) return;
  const sync = () => {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  };
  sync();
  btn.onclick = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try{ localStorage.setItem('bb-theme', next); }catch(e){}
    sync();
  };
})();

let searchTimer = null;
document.getElementById('addBtn').onclick = () => openForm(null);
const surpriseBtn = document.getElementById('surpriseBtn');
if(surpriseBtn) surpriseBtn.onclick = surpriseMe;
document.getElementById('searchInput').oninput = e => {
  searchTerm = e.target.value;
  document.querySelector('.search-wrap').classList.toggle('has-term', !!e.target.value.trim());
  clearTimeout(searchTimer); searchTimer = setTimeout(render, 120);
};

/* Header search is always just its icon by default (no full bar shown on
   landing) — tap it to expand the input inline, and it collapses again on
   blur or when you switch away from it. No scroll-position logic needed
   since there's nothing else in the header competing for space. */
(function(){
  const searchWrap = document.getElementById('searchWrap');
  const searchInp  = document.getElementById('searchInput');
  if(!searchWrap || !searchInp) return;

  window._collapseSearch = () => searchWrap.classList.remove('expanded');

  searchWrap.addEventListener('click', () => {
    if(searchWrap.classList.contains('expanded')) return;
    searchWrap.classList.add('expanded');
    searchInp.focus();
  });

  searchInp.addEventListener('blur', () => searchWrap.classList.remove('expanded'));
})();

/* Collection screen: header/toggle/progress row slides up out of the way
   while the grid is scrolled down, and drops back in on scroll-up or near
   the top — mirrors the old Home toolbar-hide behavior. */
(function(){
  const content     = document.getElementById('collection-content');
  const headerGroup = document.getElementById('collHeaderGroup');
  if(!content || !headerGroup) return;

  let lastTop = 0;
  content.addEventListener('scroll', () => {
    const top = content.scrollTop;
    if(top <= 40)               headerGroup.classList.remove('coll-header-hidden');
    else if(top > lastTop + 4)  headerGroup.classList.add('coll-header-hidden');
    else if(top < lastTop - 4)  headerGroup.classList.remove('coll-header-hidden');
    lastTop = top;
  }, {passive:true});

  window._resetCollHeaderScroll = () => {
    headerGroup.classList.remove('coll-header-hidden');
    lastTop = content.scrollTop;
  };
})();
/* Sort dropdown was removed from the toolbar; sortBy stays at its default. */
const _sortSel = document.getElementById('sortSelect');
if(_sortSel) _sortSel.onchange = e => { sortBy = e.target.value; animateNext = true; render(); };
document.getElementById('exportBtn').onclick = exportRecipes;
document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
document.getElementById('importFile').onchange = e => { if(e.target.files[0]) importRecipes(e.target.files[0]); e.target.value=''; };
document.getElementById('formPanel').addEventListener('click', e => { if(e.target === document.getElementById('formPanel')) closeForm(); });

document.addEventListener('keydown', e => {
  if(brewState){
    if(e.key === 'Escape'){
      if(brewEls && brewEls.ingPopover && !brewEls.ingPopover.hidden){
        brewEls.ingPopover.hidden = true;
        brewEls.ingToggle.classList.remove('open');
        brewEls.ingToggle.setAttribute('aria-expanded', 'false');
      } else {
        exitBrew();
      }
    }
    else if(e.key === 'ArrowRight'){ _brewGoto(brewState.i + 1); }
    else if(e.key === 'ArrowLeft'){ _brewGoto(brewState.i - 1); }
    return;
  }
  if(e.key === 'Escape'){
    if(document.getElementById('formPanel').classList.contains('open')) closeForm();
    else if(currentScreen === 'screen-detail') closeDetail();
  }
});

loadRecipes();
initWelcome();
initAuth();
