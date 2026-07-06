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

async function storeGet(key){ if(hasClaudeStorage){ const r = await window.storage.get(key); return r ? r.value : null; } return localStorage.getItem(key); }
async function storeSet(key, value){ if(hasClaudeStorage){ const r = await window.storage.set(key, value); return !!r; } localStorage.setItem(key, value); return true; }

/* Map a Supabase row (snake_case) to the recipe shape the UI expects. */
function rowToRecipe(row){
  return {
    id: row.id, serial: row.serial, name: row.name, origin: row.origin,
    method: row.method, ratio: row.ratio, ratioLabel: row.ratio_label,
    strength: row.strength, description: row.description, story: row.story,
    bean: row.bean, notes: row.notes,
    ingredients: row.ingredients || [], steps: row.steps || [], methods: row.methods || [],
    roasterPicks: row.roaster_picks || null,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    tried: false, rating: 0
  };
}
/* Bundled seed → same shape (offline / not-yet-configured fallback). */
function seedCatalog(){ return SEED.map(s => ({...s, roasterPicks: ROASTER_PICKS[s.id] || null})); }

/* This browser's own data: { custom:[…], state:{ id:{tried,rating} } }.
   Migrates the old v2 blob (which stored the whole recipe array) on first run
   so existing tried/rating/custom recipes carry over. */
function loadUserData(){
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
    .map(c => ({ ...c, tried: !!(user.state[c.id] && user.state[c.id].tried), rating: (user.state[c.id] && user.state[c.id].rating) || 0 }))
    .concat(user.custom || []);
  render();
  renderCollection();
  renderWorldPasses();
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

/* Persist only what this browser owns — custom recipes + tried/rating state.
   The catalog is read-only here (edited in the Supabase dashboard), so it is
   never written back. Existing callers can keep calling saveRecipes() as-is. */
async function saveRecipes(silent){
  try{
    const custom = recipes.filter(r => String(r.id).startsWith('custom-'));
    const state = {};
    recipes.forEach(r => { if(r.tried || r.rating) state[r.id] = { tried: !!r.tried, rating: r.rating || 0 }; });
    const ok = await storeSet(USERDATA_KEY, JSON.stringify({ custom, state }));
    if(!ok && !silent) showToast('Couldn’t save — try again');
  }
  catch(e){ if(!silent) showToast('Couldn’t save — try again'); }
}
function rememberSeedDeletion(id){ /* no-op in Phase 1 — only custom recipes are deletable */ }

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
  return `<button class="detail-picks-toggle" data-picks-toggle><span>🛒 Which beans to buy (Blue Tokai · Third Wave)</span><span class="chev">▾</span></button>
    <div class="detail-picks-body" data-picks-body>
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
    const order = ['all','moka pot','instant','blended','cezve','other'];
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
        <div class="bp-journey-col"><span class="bp-info-label">METHOD</span><span class="bp-method-val">${esc(r.method||'')}</span></div>
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
            <span class="hero-stat-val">${esc(r.method || '')}</span>
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

/* ---------- shared nav count pill ----------
   A single persistent pill lives in the top nav. Its label depends on
   whichever screen is active: total recipes everywhere except Collection,
   where it shows how many have actually been brewed. */
function updateNavCountPill(){
  const el = document.getElementById('navCountPill');
  if(!el) return;
  if(currentScreen === 'screen-collection'){
    el.textContent = recipes.filter(r => r.tried).length + ' BREWED';
  } else {
    el.textContent = recipes.length + ' BREWS';
  }
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

/* ---------- render (home — list view) ---------- */
function render(){
  updateNavCountPill();
  syncChips();

  /* Build the base filtered list (method + tried + search + kitchen) */
  let list = recipes.slice();
  if(activeMethod !== 'all') list = list.filter(r => (['moka pot','instant','blended','cezve'].includes(r.method) ? r.method : 'other') === activeMethod);
  if(triedFilter === 'tried') list = list.filter(r => r.tried);
  if(triedFilter === 'totry')  list = list.filter(r => !r.tried);
  if(searchTerm){
    const q = searchTerm.toLowerCase();
    list = list.filter(r => r.name.toLowerCase().includes(q) || (r.description||'').toLowerCase().includes(q) || (r.origin||'').toLowerCase().includes(q) || (r.ingredients||[]).some(i => i.toLowerCase().includes(q)));
  }
  if(sortBy === 'serial') list.sort((a,b)=>(a.serial||0)-(b.serial||0));
  else if(sortBy === 'newest') list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  else if(sortBy === 'rating') list.sort((a,b)=>(b.rating||0)-(a.rating||0) || (a.serial||0)-(b.serial||0));
  else if(sortBy === 'name') list.sort((a,b)=>a.name.localeCompare(b.name));

  const kActive = kitchen.size > 0;
  const kset    = kActive ? kitchenTokenSet() : null;

  const content = document.getElementById('content');

  if(list.length === 0){
    const hasFilters = !!searchTerm || kitchen.size > 0 || activeMethod !== 'all' || triedFilter !== 'all';
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
      activeMethod = 'all'; triedFilter = 'all'; syncChips();
      animateNext = true; render();
    };
    if(animateNext){ animateNext = false; }
    return;
  }

  /* If search is active, show a flat grid — search results feel better without lanes */
  if(searchTerm){
    content.innerHTML = `<div class="collection-content">${list.map(r => collectionCard(r, {showRatio:true, matchState: kActive?(isMakeable(r,kset)?'match':'dim'):null})).join('')}</div>`;
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

  let html = heroHTML(heroRec);
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
            ${custom ? `<button class="coll-icon-btn" data-edit aria-label="Edit recipe">✎</button><button class="coll-icon-btn" data-delete aria-label="Delete recipe">✕</button>` : ''}
            <span class="coll-badge" style="background:${color}">${esc(code)}</span>
          </div>
        </div>
        <h3 class="coll-card-name">${esc(r.name)}</h3>
        <p class="coll-card-desc">${esc(r.description || '')}</p>
        <div class="coll-card-footer">
          <div>
            <div class="coll-card-method-label">Method</div>
            <div class="coll-card-method-val" style="color:${color}">${esc(r.method || '')}</div>
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

  const catalog = recipes.filter(r => !String(r.id).startsWith('custom-')).sort((a, b) => (a.serial || 0) - (b.serial || 0));
  const mine    = recipes.filter(r => String(r.id).startsWith('custom-')).sort((a, b) => (a.serial || 0) - (b.serial || 0));
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
    if(catalog.length === 0){
      el.innerHTML = emptyStateHTML({title:'No recipes yet', body:'The catalog is still loading.'});
    } else {
      el.innerHTML = catalog.map(r => collectionCard(r, {showRatio: true, showTried: true})).join('');
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

/* ---------- navigation ---------- */
let currentScreen = 'screen-home';

function switchScreen(target){
  if(target === currentScreen) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === target));
  document.querySelectorAll('.nav-tab').forEach(t => {
    const on = t.dataset.target === target;
    t.classList.toggle('active', on);
    if(on) t.setAttribute('aria-current','page'); else t.removeAttribute('aria-current');
  });
  currentScreen = target;
  if(target === 'screen-collection'){ renderCollection(); if(window._resetCollHeaderScroll) window._resetCollHeaderScroll(); }
  if(target === 'screen-world'){
    syncWorldToggle();
    renderWorldPasses();
    if(worldView === 'map') initWorldMap();
  }
  updateNavCountPill();
  if(window._collapseSearch) window._collapseSearch();
  if(kitchenOpen){ kitchenOpen = false; renderKitchen(); }
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
        <span class="check-text">${esc(i)}</span>
      </div>`).join('');

    const stepHTML = steps.map((s, idx) => {
      const st = (typeof s === 'string') ? {c: s} : s;
      const notLast = idx < steps.length - 1;
      return `<div class="timeline-item">
        ${notLast ? `<span class="timeline-line" style="background:linear-gradient(180deg, ${al.color}55, rgba(242,228,207,.08))"></span>` : ''}
        <span class="timeline-num" style="border:1.5px solid ${al.color}66;color:${al.color}">${idx + 1}</span>
        <div class="timeline-body">
          ${st.t ? `<div class="timeline-title">${esc(st.t)}</div>` : ''}
          <div class="timeline-text">${esc(st.c)}</div>
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
          <div class="detail-bean-note-label">☕ Bean note</div>
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
              <div class="detail-stat"><div class="detail-stat-value detail-stat-method">${esc(r.method || '')}</div><div class="detail-stat-label">Method</div></div>
              <div class="detail-stat"><div class="detail-beans">${coloredBeans(r.strength || 3, al.color)}</div><div class="detail-stat-label">Strength</div></div>
            </div>
          </div>
        </div>
      </div>

      ${methodTabsHTML()}
      <div data-method-content>${bodyContentHTML()}</div>

      <div class="detail-made-row">
        <button class="detail-made-toggle ${r.tried?'on':''}" data-made type="button"><span class="box">✓</span>${r.tried?'Made it':'Mark as made'}<span class="puff"></span><span class="puff"></span><span class="puff"></span><span class="puff"></span><span class="puff"></span></button>
        <div class="detail-rate-wrap"><span class="detail-rate-label">Your rating</span><div class="detail-rate-stars" data-rate>${[1,2,3,4,5].map(i=>`<button data-star="${i}" class="${i<=(r.rating||0)?'on':''}" aria-label="${i} star">★</button>`).join('')}</div></div>
      </div>

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
      <div class="field"><label for="fMethod">Brew method</label><select id="fMethod">${METHODS.filter(m=>m!=='all').map(m=>`<option ${r&&r.method===m?'selected':''}>${m}</option>`).join('')}</select></div>
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
  let steps       = r.steps || [];
  let ingredients = r.ingredients || [];
  let methodLabel = r.method || '';
  if(r.methods && r.methods.length){
    const mId = methodId || (r.methods.find(m => m.recommended) || r.methods[0]).id;
    const m = r.methods.find(m => m.id === mId) || r.methods[0];
    if(m && m.steps && m.steps.length){ steps = m.steps; ingredients = m.ingredients || ingredients; methodLabel = m.label; }
  }
  if(!steps.length) return;

  const al = getAirline(r.serial || 0);
  brewState = {
    id, i: 0, steps, ingredients,
    name: r.name, method: methodLabel, origin: r.origin || 'Fusion',
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
        </div>
      </div>

      <div class="brew-finish" data-finish hidden>
        <div class="brew-stamp" data-stamp>✓ Boarded<br>Brew complete</div>
        <h2 class="brew-finish-title" data-finish-title></h2>
        <p class="brew-finish-sub" data-finish-sub></p>
        <button class="brew-btn" data-restart type="button">↺ Brew again</button>
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
    rail:      shell.querySelector('[data-rail]'),
    footer:    shell.querySelector('[data-footer]'),
    prevBtn:   shell.querySelector('[data-prev]'),
    nextBtn:   shell.querySelector('[data-next]'),
    footerPct:    shell.querySelector('[data-footer-pct]'),
    footerOrigin: shell.querySelector('[data-footer-origin]'),
    stamp:       shell.querySelector('[data-stamp]'),
    finishTitle: shell.querySelector('[data-finish-title]'),
    finishSub:   shell.querySelector('[data-finish-sub]'),
    restartBtn:  shell.querySelector('[data-restart]')
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
    `<li>${ingredientIcon(i)}<span>${esc(i)}</span></li>`
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
    brewEls.stepText.textContent = stepObj.c || '';

    brewEls.prevBtn.disabled = i === 0;
    brewEls.footerPct.textContent = pct + '%';
    brewEls.nextBtn.textContent = (i === total - 1) ? 'Finish ✓' : 'Next step →';

    _updateBrewRail();
    if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.animateBrewStep(brewEls.stepIcon.closest('.brew-step-col'), brewState.dir);
  } else {
    brewEls.finishTitle.textContent = `Enjoy your ${brewState.name}`;
    brewEls.finishSub.textContent = `${brewState.method ? brewState.method + ' · ' : ''}${total} step${total === 1 ? '' : 's'} · from ${brewState.origin}`;
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
if(typeof runSplash === 'function'){
  runSplash();
} else {
  /* Fallback when animations.js isn't loaded: hide splash after the
     portrait/title/tagline/skip entrance sequence has fully played
     (~2.6s) plus a short beat to actually look at it. */
  const sp = document.getElementById('splash');
  if(sp){
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
    document.getElementById('splashSkip').onclick = () => { sp.style.transition = 'opacity .25s'; sp.style.opacity = '0'; setTimeout(() => { sp.style.display = 'none'; }, 280); };
  }
}

document.querySelectorAll('.nav-tab').forEach(t => t.addEventListener('click', () => switchScreen(t.dataset.target)));

document.getElementById('content').addEventListener('click', e => {
  const card = e.target.closest('.coll-card');
  if(card && card.dataset.id) openDetail(card.dataset.id, card);
});
document.getElementById('collection-content').addEventListener('click', async e => {
  if(e.target.closest('#collAddCard')){ openForm(null); return; }

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
if(worldPassesEl) worldPassesEl.addEventListener('click', e => {
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
