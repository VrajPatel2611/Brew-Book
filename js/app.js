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
function hexLighten(hex,amt){
  amt = amt || 42;
  const n = parseInt(hex.slice(1),16);
  const r = Math.min(255,(n>>16)+amt), g = Math.min(255,((n>>8)&255)+amt), b = Math.min(255,(n&255)+amt);
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
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

function getStyleCategory(r) {
  for (const cat of STYLE_CATEGORIES) {
    if (cat.ids.includes(r.id)) return cat.id;
  }
  return 'other';
}

/* ---------- storage ---------- */
const hasClaudeStorage = typeof window.storage !== 'undefined' && window.storage && typeof window.storage.get === 'function';
async function storeGet(){ if(hasClaudeStorage){ const r = await window.storage.get(STORE_KEY); return r ? r.value : null; } return localStorage.getItem(STORE_KEY); }
async function storeSet(value){ if(hasClaudeStorage){ const r = await window.storage.set(STORE_KEY, value); return !!r; } localStorage.setItem(STORE_KEY, value); return true; }

async function loadRecipes(){
  let saved = null;
  try{ saved = await storeGet(); }catch(e){ saved = null; }
  if(saved){ try{ recipes = JSON.parse(saved); }catch(e){ recipes = []; } } else { recipes = []; }
  let deletedSeeds = [];
  try{ deletedSeeds = JSON.parse(localStorage.getItem(STORE_KEY + '-removed') || '[]'); }catch(e){}
  let added = false;
  for(const s of SEED){ if(!recipes.some(r => r.id === s.id) && !deletedSeeds.includes(s.id)){ recipes.push({...s}); added = true; } }
  if(added) await saveRecipes(true);
  render();
  renderCollection();
}
async function saveRecipes(silent){
  try{ const ok = await storeSet(JSON.stringify(recipes)); if(!ok && !silent) showToast('Couldn’t save — try again'); }
  catch(e){ if(!silent) showToast('Couldn’t save — try again'); }
}
function rememberSeedDeletion(id){
  if(!id.startsWith('seed-')) return;
  try{ const k = STORE_KEY + '-removed'; const arr = JSON.parse(localStorage.getItem(k) || '[]'); if(!arr.includes(id)){ arr.push(id); localStorage.setItem(k, JSON.stringify(arr)); } }catch(e){}
}

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(3,'0');
function fmtDate(ts){ if(!ts) return ''; return new Date(ts).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function fmtDateShort(ts){ if(!ts) return ''; const d = new Date(ts); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase(); }
function dateInputVal(ts){ const d = ts ? new Date(ts) : new Date(); return d.toISOString().slice(0,10); }
function nextSerial(){ return recipes.reduce((m,r)=>Math.max(m, r.serial||0), 0) + 1; }
function showToast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._tm); t._tm = setTimeout(()=>t.classList.remove('show'), 2400); }

function buyPicksHTML(id){
  const picks = ROASTER_PICKS[id];
  if(!picks || (!picks.bluetokai && !picks.thirdwave)) return '';
  const bt = picks.bluetokai || [], tw = picks.thirdwave || [];
  return `<button class="detail-picks-toggle" data-picks-toggle><span>🛒 Which beans to buy (Blue Tokai · Third Wave)</span><span class="chev">▾</span></button>
    <div class="detail-picks-body" data-picks-body>
      ${bt.length?`<div class="detail-roaster bt"><h4><span class="pin"></span>Blue Tokai</h4><div class="pick-label">Best pick for this drink</div><ul>${bt.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
      ${tw.length?`<div class="detail-roaster tw"><h4><span class="pin"></span>Third Wave</h4><div class="pick-label">Best pick for this drink</div><ul>${tw.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
    </div>`;
}

/* ---------- method filter chips (in toolbar) ---------- */
function buildChips(){
  const chipsEl = document.getElementById('methodChips');
  const order = ['all','moka pot','instant','blended','cezve','other'];
  const present = new Set(['all']);
  recipes.forEach(r => present.add(order.includes(r.method) ? r.method : 'other'));
  const methods = order.filter(m => present.has(m));
  chipsEl.innerHTML = methods.map(m => `<button class="chip" data-method="${m}">${m === 'all' ? 'ALL' : m.toUpperCase()}</button>`).join('');
  chipsEl.onclick = e => { const b = e.target.closest('.chip'); if(!b) return; activeMethod = b.dataset.method; animateNext = true; render(); };

  const triedEl = document.getElementById('triedChips');
  triedEl.innerHTML = [['all','ALL'],['totry','TO TRY'],['tried','MADE IT']].map(([v,l]) => `<button class="chip tried" data-tried="${v}">${l}</button>`).join('');
  triedEl.onclick = e => { const b = e.target.closest('.chip'); if(!b) return; triedFilter = b.dataset.tried; animateNext = true; render(); };
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
      <span class="bp-country-badge" style="background:${al.color}">${al.code}</span>
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
function kitchenActiveIcons(){
  const names = [...kitchen];
  const shown = names.slice(0,4);
  let h = shown.map(n => `<span class="mini">${ingredientIcon(n.toLowerCase())}</span>`).join('');
  if(names.length > 4) h += `<span class="if-more">+${names.length-4} more</span>`;
  return h;
}
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
  document.getElementById('kitchenCollapsed').onclick = e => {
    if(e.target.closest('#kitchenToggle')) return;
    kitchenOpen = !kitchenOpen; renderKitchen();
  };
  document.getElementById('kitchenToggle').onclick = e => {
    e.stopPropagation();
    if(kitchenOpen){ kitchenOpen = false; renderKitchen(); }
    else if(kitchen.size > 0){ kitchen.clear(); renderKitchen(); render(); }
    else { kitchenOpen = true; renderKitchen(); }
  };
  document.getElementById('kitchenClear').onclick = () => { kitchen.clear(); renderKitchen(); render(); };
  renderKitchen();
}
function renderKitchen(){
  const collapsed = document.getElementById('kitchenCollapsed');
  if(!collapsed) return;
  const active = kitchen.size > 0;
  collapsed.classList.toggle('active', kitchenOpen || active);
  document.getElementById('kitchenExpand').style.display = kitchenOpen ? 'block' : 'none';
  const prompt = document.getElementById('kitchenPrompt');
  const icons  = document.getElementById('kitchenIcons');
  const toggle = document.getElementById('kitchenToggle');
  if(!kitchenOpen && active){
    prompt.style.display = 'none';
    icons.style.display = 'flex';
    icons.innerHTML = kitchenActiveIcons();
    toggle.textContent = '×'; toggle.classList.add('clear');
    toggle.setAttribute('aria-label','Clear ingredients');
  } else {
    prompt.style.display = 'block';
    icons.style.display = 'none';
    toggle.classList.remove('clear');
    toggle.textContent = kitchenOpen ? '×' : '+';
    toggle.setAttribute('aria-label', kitchenOpen ? 'Close ingredient filter' : 'Open ingredient filter');
  }
  document.querySelectorAll('#kitchenChips .if-chip').forEach(c => c.classList.toggle('sel', kitchen.has(c.dataset.name)));
  document.getElementById('kitchenResult').style.display = active ? 'flex' : 'none';
}

/* ---------- HERO — brew of the day ---------- */
function heroHTML(r) {
  const al  = getAirline(r.serial || 0);
  const light = hexLighten(al.color, 55);
  return `<div class="hero-card" data-id="${r.id}">
    <div class="hero-portrait" aria-hidden="true">
      <div class="hero-portrait-glow" style="background:radial-gradient(circle at 40% 55%,${al.color}55,transparent 68%)"></div>
      <div class="hero-portrait-inner" style="background:radial-gradient(ellipse at 38% 48%,${light}33 0%,${al.color}22 45%,transparent 70%)"></div>
      <div class="hero-portrait-highlight"></div>
    </div>
    <div class="hero-body">
      <div class="hero-eyebrow">
        <em class="hero-today">today's</em>
        <span class="hero-eyebrow-label">BREW OF THE DAY</span>
      </div>
      <h2 class="hero-title">${esc(r.name)}</h2>
      ${r.description ? `<p class="hero-desc">${esc(r.description)}</p>` : ''}
      <div class="hero-meta">
        <span class="hero-origin" style="color:${al.color}">${esc(r.origin||'Fusion')}</span>
        <span class="hero-sep">·</span>
        <span class="hero-method">${esc(r.method||'')}</span>
      </div>
    </div>
    <div class="hero-airline-bar" style="background:${al.color}"></div>
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

/* ---------- render (home — list view) ---------- */
function render(){
  document.getElementById('countPill').textContent = recipes.length + ' BREWS';
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
    content.innerHTML = `<div class="empty"><div class="empty-ring"></div><h2>${recipes.length===0?'No brews yet':'Nothing matches'}</h2><p>${recipes.length===0?'Tap ＋ to write your first one.':'Try a different search or filter.'}</p></div>`;
    if(animateNext){ animateNext = false; }
    return;
  }

  /* If search is active, show a flat grid — search results feel better without lanes */
  if(searchTerm){
    content.innerHTML = `<div class="bp-grid">${list.map(r => boardingPassCard(r, kActive?(isMakeable(r,kset)?'match':'dim'):null)).join('')}</div>`;
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

  if(filteredForLanes.length === 0){
    html += `<div class="empty"><div class="empty-ring"></div><h2>Nothing here</h2><p>Try a different category.</p></div>`;
  } else if(activeCategory !== 'all'){
    /* Single-category view: plain horizontal lane, no section title */
    const cat = STYLE_CATEGORIES.find(c => c.id === activeCategory);
    html += _laneHTML(cat ? cat.label : '', filteredForLanes, kActive, kset);
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

  /* Wire hero click */
  content.querySelector('.hero-card')?.addEventListener('click', () => openDetail(heroRec.id, content.querySelector('.hero-card')));

  if(kActive){ const cnt = document.getElementById('kitchenCount'); if(cnt) cnt.textContent = list.filter(r=>isMakeable(r,kset)).length; }
  if(animateNext){ if(typeof BREW_ANIM!=='undefined') BREW_ANIM.animateCardEntrance(content); animateNext=false; }
}

function _laneHTML(title, recs, kActive, kset) {
  const cards = recs.map(r => boardingPassCard(r, kActive?(isMakeable(r,kset)?'match':'dim'):null)).join('');
  return `<section class="recipe-lane">
    ${title ? `<h2 class="lane-title">${esc(title)}</h2>` : ''}
    <div class="lane-scroll">${cards}</div>
  </section>`;
}

/* ---------- collection screen ---------- */
function renderCollection(){
  const tried = recipes.filter(r => r.tried).sort((a,b)=>(a.serial||0)-(b.serial||0));
  document.getElementById('collectionCount').textContent = tried.length + ' BOARDED';
  const el = document.getElementById('collection-content');
  if(tried.length === 0){
    el.innerHTML = `<div class="empty"><div class="empty-ring"></div><h2>No stamps yet</h2><p>Mark a brew as made to stamp your passport.</p></div>`;
    return;
  }
  el.innerHTML = `<div class="bp-grid">${tried.map(boardingPassCard).join('')}</div>`;
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
  if(target === 'screen-collection') renderCollection();
}

/* ---------- view toggle (List / World) ---------- */
let viewMode = 'list'; /* 'list' | 'world' */

function setViewMode(mode, skipRender) {
  if(mode === viewMode && !skipRender) return;
  viewMode = mode;
  /* Update pill button states */
  document.querySelectorAll('.vt-seg').forEach(b => {
    const on = b.dataset.view === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const content = document.getElementById('content');
  if(mode === 'world'){
    if(content) content.style.display = 'none';
    showWorldView();
  } else {
    if(content) content.style.display = '';
    hideWorldView();
    if(!skipRender) render();
  }
}

/* ---------- detail (boarding pass paper) ---------- */
let detailPanelEl = null;
function openDetail(id, cardEl){
  const r = recipes.find(x => x.id === id);
  if(!r) return;
  const al = getAirline(r.serial || 0);
  const panel = document.getElementById('detail-panel');
  detailPanelEl = panel;

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
    return `<div class="method-switcher reveal">
      <div class="method-label">Brew method</div>
      <div class="method-tabs">${r.methods.map(m =>
        `<button class="method-tab${m.id===curMethodId?' active':''}" data-method-id="${esc(m.id)}">${esc(m.label)}</button>`
      ).join('')}</div>
    </div>`;
  }

  function methodContentHTML(){
    const { ingredients, steps, note } = activeContent();
    const ingHTML  = ingredients.map((i,idx)=>`<li class="reveal" style="transition-delay:${Math.min(idx*45,300)}ms">${ingredientIcon(i)}<span>${esc(i)}</span></li>`).join('');
    const stepHTML = steps.map((s,idx)=>{const st=(typeof s==='string')?{c:s}:s;return `<li class="reveal ${idx%2?'reveal-right':'reveal-left'}"><div>${st.t?`<strong class="step-title">${esc(st.t)}:</strong> `:''}${esc(st.c)}</div></li>`;}).join('');
    return `${note?`<p class="method-note">${esc(note)}</p>`:''}
      <div class="detail-section-label reveal">Ingredients</div>
      <ul class="detail-ing-list">${ingHTML}</ul>
      <div class="detail-section-label reveal">Steps</div>
      <ol class="detail-step-list">${stepHTML}</ol>`;
  }

  const initContent = activeContent();
  const hasSteps = initContent.steps && initContent.steps.length > 0;

  panel.innerHTML = `
    <div class="bp-detail-header" style="background:linear-gradient(135deg,${hexLighten(al.color,30)},${al.color})">
      <button class="bp-detail-close" data-close aria-label="Close">✕</button>
      <span class="bp-detail-airline">${esc(al.name)}</span>
      <span class="bp-detail-flight">FLIGHT BREW-${pad(r.serial||0)}</span>
      <div class="bp-detail-departing-label">DEPARTING FROM</div>
      <div class="bp-detail-city">${esc(r.origin||'Fusion')}</div>
    </div>
    <div class="torn-sep"><div class="torn-sep-fill"></div></div>
    <div class="detail-progress-bar"><div class="detail-progress-fill" data-prog></div></div>
    <div class="bp-detail-body" data-body>
      <div class="detail-recipe-name reveal">${esc(r.name)}</div>
      ${r.description?`<div class="detail-recipe-desc reveal">${esc(r.description)}</div>`:''}
      <div class="detail-made-panel reveal">
        <button class="detail-made-toggle ${r.tried?'on':''}" data-made><span class="box">✓</span>${r.tried?'Made it':'Mark as made'}<span class="puff"></span><span class="puff"></span><span class="puff"></span><span class="puff"></span><span class="puff"></span></button>
        <div class="detail-rate-wrap"><span class="detail-rate-label">Your rating</span><div class="detail-rate-stars" data-rate>${[1,2,3,4,5].map(i=>`<button data-star="${i}" class="${i<=(r.rating||0)?'on':''}" aria-label="${i} star">★</button>`).join('')}</div></div>
      </div>
      ${r.story?`<div class="detail-section-label reveal">The Story</div><div class="detail-rule reveal"></div><div class="detail-story-text reveal">${esc(r.story)}</div>`:''}
      ${r.bean?`<div class="detail-section-label reveal">Beans for this brew</div><div class="detail-bean-box reveal"><span>🫘</span><span>${esc(r.bean)}</span></div>`:''}
      <div class="reveal">${buyPicksHTML(r.id)}</div>
      ${methodTabsHTML()}
      <div data-method-content>${methodContentHTML()}</div>
      ${r.notes?`<div class="detail-section-label reveal">Notes</div><div class="detail-notes-box reveal">${esc(r.notes)}</div>`:''}
      ${hasSteps?`<button class="detail-btn primary detail-brew-start reveal" data-brew><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 3l9 5-9 5V3z" fill="currentColor"/></svg> START BREWING →</button>`:''}
      <div class="detail-actions reveal"><button class="detail-btn" data-edit>Edit</button><button class="detail-btn danger" data-delete>Delete</button></div>
    </div>`;

  const torn = panel.querySelector('.torn-sep');
  torn.style.background = 'var(--pass-paper)';
  panel.querySelector('.bp-detail-header').style.marginBottom = '0';
  const sepFill = panel.querySelector('.torn-sep-fill');
  if(sepFill){ sepFill.style.cssText = `position:absolute;top:-1px;left:0;right:0;height:11px;background:${al.color};clip-path:polygon(0 0,100% 0,100% 55%,96% 80%,92% 40%,88% 90%,84% 45%,80% 85%,76% 30%,72% 82%,68% 38%,64% 90%,60% 48%,56% 85%,52% 30%,48% 78%,44% 42%,40% 88%,36% 38%,32% 85%,28% 32%,24% 80%,20% 42%,16% 88%,12% 52%,8% 82%,4% 48%,0 72%);`; }

  panel.style.display = 'flex';
  if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.openBoardingPassTransition(cardEl, panel);

  const body = panel.querySelector('[data-body]');
  if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.initDetailReveals(body);
  const progFill = panel.querySelector('[data-prog]');
  body.onscroll = () => { const max = body.scrollHeight - body.clientHeight; if(progFill) progFill.style.width = (max>0 ? body.scrollTop/max*100 : 0) + '%'; };

  panel.querySelector('[data-close]').onclick = closeDetail;
  const picksToggle = panel.querySelector('[data-picks-toggle]');
  if(picksToggle) picksToggle.onclick = () => { picksToggle.classList.toggle('open'); panel.querySelector('[data-picks-body]').classList.toggle('open'); };

  function wireBrewBtn(){
    const btn = panel.querySelector('[data-brew]');
    if(btn) btn.onclick = () => startBrew(id, curMethodId);
  }
  wireBrewBtn();

  panel.querySelectorAll('.method-tab').forEach(btn => {
    btn.onclick = () => {
      curMethodId = btn.dataset.methodId;
      panel.querySelectorAll('.method-tab').forEach(b => b.classList.toggle('active', b.dataset.methodId === curMethodId));
      const mc = panel.querySelector('[data-method-content]');
      if(mc){
        mc.style.transition = 'opacity .18s';
        mc.style.opacity = '0';
        setTimeout(() => {
          mc.innerHTML = methodContentHTML();
          mc.style.opacity = '1';
          if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.initDetailReveals(mc);
          wireBrewBtn();
        }, 180);
      }
    };
  });

  const madeBtn = panel.querySelector('[data-made]');
  madeBtn.onclick = async () => {
    const nowTried = !r.tried;
    r.tried = nowTried;
    if(!r.tried) r.rating = 0;
    await saveRecipes(); render(); renderCollection();
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
  panel.querySelectorAll('[data-rate] button').forEach(b => b.onclick = async () => {
    const v = +b.dataset.star;
    r.rating = (r.rating === v ? v - 1 : v);
    if(r.rating > 0) r.tried = true;
    await saveRecipes(); render(); renderCollection(); openDetail(id, cardEl);
  });
  panel.querySelector('[data-edit]').onclick = () => { closeDetail(); openForm(r.id); };
  panel.querySelector('[data-delete]').onclick = async () => {
    if(!confirm(`Delete "${r.name}"? This can’t be undone.`)) return;
    recipes = recipes.filter(x => x.id !== r.id);
    rememberSeedDeletion(r.id);
    await saveRecipes(); closeDetail(); render(); renderCollection(); showToast('Recipe deleted');
  };
}
function closeDetail(){
  const panel = document.getElementById('detail-panel');
  if(typeof BREW_ANIM !== 'undefined'){ BREW_ANIM.closeBoardingPassTransition(panel, () => { panel.style.display = 'none'; }); }
  else panel.style.display = 'none';
}

/* ---------- form ---------- */
function openForm(id){
  editingId = id || null;
  const r = id ? recipes.find(x=>x.id===id) : null;
  const sheet = document.getElementById('formSheet');
  const strength = r ? (r.strength||3) : 3;
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
    <div class="field"><label for="fRatioLabel">What the ratio means</label><input id="fRatioLabel" type="text" placeholder="e.g. espresso : ice" value="${r?esc(r.ratioLabel||''):''}"></div>
    <div class="field"><label for="fBean">Beans / roast for this brew</label><textarea id="fBean" placeholder="e.g. dark roast robusta, chocolatey, low acidity">${r?esc(r.bean||''):''}</textarea></div>
    <div class="field"><label>Strength</label><div class="strength-picker" id="fStrength">${[1,2,3,4,5].map(n=>`<button type="button" data-n="${n}" class="${n===strength?'sel':''}" aria-label="Strength ${n}">${[...Array(n)].map(()=>beanSVG(true)).join('')}</button>`).join('')}</div></div>
    <div class="field"><label for="fIng">Ingredients</label><textarea id="fIng" rows="5" placeholder="One per line">${r?esc((r.ingredients||[]).join('\n')):''}</textarea><div class="hint">One ingredient per line</div></div>
    <div class="field"><label for="fSteps">Steps</label><textarea id="fSteps" rows="6" placeholder="One step per line. Optional: Title :: instruction">${r?esc((r.steps||[]).map(s=>(typeof s==='string')?s:(s.t?s.t+' :: '+s.c:s.c)).join('\n')):''}</textarea><div class="hint">One step per line. Add a bold title with "Title :: instruction".</div></div>
    <div class="field"><label for="fNotes">Notes (optional)</label><textarea id="fNotes" placeholder="Tips, tweaks, what to try next time…">${r?esc(r.notes||''):''}</textarea></div>
    <div class="form-actions"><button class="btn" data-close>Cancel</button><button class="btn primary" data-save>${r ? 'Save changes' : 'Save recipe'}</button></div>`;

  let selStrength = strength;
  sheet.querySelectorAll('#fStrength button').forEach(b => b.onclick = () => { selStrength = +b.dataset.n; sheet.querySelectorAll('#fStrength button').forEach(x => x.classList.toggle('sel', +x.dataset.n === selStrength)); });
  sheet.querySelectorAll('[data-close]').forEach(b => b.onclick = closeForm);
  sheet.querySelector('[data-save]').onclick = async () => {
    const name = sheet.querySelector('#fName').value.trim();
    if(!name){ showToast('Give it a name first'); sheet.querySelector('#fName').focus(); return; }
    const lines = sel => sheet.querySelector(sel).value.split('\n').map(s=>s.trim()).filter(Boolean);
    const prev = editingId ? recipes.find(x=>x.id===editingId) : null;
    const dateStr = sheet.querySelector('#fDate').value;
    const data = {
      id: editingId || ('r-' + Date.now()),
      serial: parseInt(sheet.querySelector('#fSerial').value, 10) || nextSerial(),
      name,
      description: sheet.querySelector('#fDesc').value.trim(),
      origin: sheet.querySelector('#fOrigin').value.trim(),
      method: sheet.querySelector('#fMethod').value,
      ratio: sheet.querySelector('#fRatio').value.trim(),
      ratioLabel: sheet.querySelector('#fRatioLabel').value.trim(),
      bean: sheet.querySelector('#fBean').value.trim(),
      strength: selStrength,
      ingredients: lines('#fIng'),
      steps: sheet.querySelector('#fSteps').value.split('\n').map(s=>s.trim()).filter(Boolean).map(line=>{const ix=line.indexOf('::'); return ix>=0?{t:line.slice(0,ix).trim(),c:line.slice(ix+2).trim()}:{c:line};}),
      notes: sheet.querySelector('#fNotes').value.trim(),
      tried: prev ? prev.tried : false,
      rating: prev ? prev.rating : 0,
      createdAt: dateStr ? D(dateStr) : (prev ? prev.createdAt : Date.now())
    };
    if(editingId) recipes = recipes.map(x => x.id === editingId ? data : x);
    else recipes.push(data);
    await saveRecipes(); closeForm(); buildChips(); render(); renderCollection();
    showToast(editingId ? 'Saved' : 'Recipe saved ☕');
    editingId = null;
  };
  document.getElementById('formPanel').classList.add('open');
  setTimeout(()=>sheet.querySelector('#fName').focus(), 80);
}
function closeForm(){ document.getElementById('formPanel').classList.remove('open'); }
function closePanels(){ closeDetail(); closeForm(); }

/* ---------- brew mode (cinematic) with filling-cup visual ---------- */
let brewState = null;
let brewStarsSeeded = false;

function startBrew(id, methodId){
  const r = recipes.find(x => x.id === id);
  if(!r) return;
  let steps = r.steps || [];
  let methodLabel = '';
  if(r.methods && r.methods.length){
    const mId = methodId || (r.methods.find(m => m.recommended) || r.methods[0]).id;
    const m = r.methods.find(m => m.id === mId) || r.methods[0];
    if(m && m.steps && m.steps.length){ steps = m.steps; methodLabel = ' · ' + m.label; }
  }
  if(!steps.length) return;
  brewState = { id, i: 0, steps, name: r.name + methodLabel, origin: r.origin, dir: 1 };
  closeDetail();
  const bm = document.getElementById('brew-mode');
  bm.style.display = 'flex';
  if(!brewStarsSeeded && typeof BREW_ANIM !== 'undefined'){ BREW_ANIM.createStarField(document.getElementById('brewStars'), 45, true); brewStarsSeeded = true; }
  renderBrew();
}

function _brewCupSVG(pct) {
  /* Filling cup visual — rises as a percentage of steps completed.
     Two animated steam wisps appear once the cup is reasonably full. */
  const fillH = Math.round(47 * pct / 100);
  const fillY = 82 - fillH;
  const steamOpacity = pct > 40 ? 0.55 : 0.18;
  return `<div class="brew-cup-wrap" aria-hidden="true">
    <svg class="brew-cup-svg" viewBox="0 0 80 100" fill="none">
      <defs>
        <clipPath id="cupClip">
          <path d="M15 35 H65 L60 82 a8 8 0 0 1-8 7 H28 a8 8 0 0 1-8-7 Z"/>
        </clipPath>
      </defs>
      <!-- cup fill -->
      <rect x="15" y="${fillY}" width="50" height="${fillH + 10}"
        fill="url(#roastFull)" opacity="0.72" clip-path="url(#cupClip)"
        style="transition:y .4s ease,height .4s ease"/>
      <!-- cup body outline -->
      <path d="M15 35 H65 L60 82 a8 8 0 0 1-8 7 H28 a8 8 0 0 1-8-7 Z"
        stroke="rgba(207,127,69,.45)" stroke-width="1.8"/>
      <!-- handle -->
      <path d="M65 46 a11 11 0 0 1 0 22"
        stroke="rgba(207,127,69,.45)" stroke-width="1.8"/>
      <!-- rim -->
      <path d="M14 35 H66" stroke="rgba(233,162,95,.55)" stroke-width="1.4" stroke-linecap="round"/>
      <!-- steam wisps -->
      <path class="bw-steam bw-s1" d="M30 32 C26 22 34 16 30 8"
        stroke="#cf7f45" stroke-width="1.6" stroke-linecap="round" opacity="${steamOpacity}"/>
      <path class="bw-steam bw-s2" d="M50 32 C46 22 54 16 50 8"
        stroke="#e9a25f" stroke-width="1.6" stroke-linecap="round" opacity="${steamOpacity}"/>
    </svg>
    <div class="brew-cup-pct">${pct}%</div>
  </div>`;
}

function renderBrew(){
  if(!brewState) return;
  const { i, steps, name, origin } = brewState;
  const bm    = document.getElementById('brew-mode');
  const total = steps.length;
  const atEnd = i >= total;
  const pct   = Math.round((Math.min(i, total) / total) * 100);

  bm.querySelectorAll('.brew-shell').forEach(n => n.remove());
  const shell = document.createElement('div');
  shell.className = 'brew-shell';
  shell.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column;flex:1;min-height:0';

  if(atEnd){
    shell.innerHTML = `
      <div class="brew-header"><div><div class="brew-title-line">IN FLIGHT · BREW MODE · ${esc(name)}</div><div class="brew-origin-line">Arrived ☕</div></div><button class="close-btn" data-exit aria-label="Close">✕</button></div>
      <div class="brew-progress-bar"><div class="brew-progress-fill" style="width:100%"></div></div>
      <div class="brew-body"><div class="brew-done">
        ${_brewCupSVG(100)}
        <h3>Brewed. Safe to consume.</h3>
        <p>Rate this brew and head back to the terminal.</p>
        <div class="brew-done-stars"><div class="detail-rate-stars" data-brewrate>${[1,2,3,4,5].map(n=>`<button data-star="${n}" aria-label="${n} star">★</button>`).join('')}</div></div>
      </div></div>
      <div class="brew-foot"><button class="brew-btn" data-restart>Start over</button><button class="brew-btn primary" data-finish>Return to Terminal</button></div>`;
  } else {
    shell.innerHTML = `
      <div class="brew-header"><div><div class="brew-title-line">IN FLIGHT · BREW MODE · ${esc(name)}</div><div class="brew-origin-line">${esc(origin||'')}</div></div><button class="close-btn" data-exit aria-label="Close">✕</button></div>
      <div class="brew-progress-bar"><div class="brew-progress-fill" style="width:${pct}%"></div></div>
      <div class="brew-body">
        ${_brewCupSVG(pct)}
        <div class="brew-step-content">
          <div class="brew-stepnum">Step ${i+1} of ${total}${(typeof steps[i]==='object' && steps[i].t) ? ' · ' + esc(steps[i].t) : ''}</div>
          <div class="brew-steptext">${esc((typeof steps[i]==='string') ? steps[i] : steps[i].c)}</div>
          <div class="brew-dots">${steps.map((_,k)=>`<span class="${k<i?'done':k===i?'cur':''}"></span>`).join('')}</div>
        </div>
      </div>
      <div class="brew-foot"><button class="brew-btn" data-prev ${i===0?'disabled':''}>← Prev</button><button class="brew-btn primary" data-next>${i===total-1?'LAND ☕':'Next →'}</button></div>`;
  }
  bm.appendChild(shell);

  if(typeof BREW_ANIM !== 'undefined' && !atEnd){ BREW_ANIM.animateBrewStep(shell.querySelector('.brew-body'), brewState.dir); }

  if(atEnd){
    shell.querySelector('[data-restart]').onclick = () => { brewState.dir = -1; brewState.i = 0; renderBrew(); };
    shell.querySelector('[data-finish]').onclick = async () => {
      const r = recipes.find(x => x.id === brewState.id);
      if(r){ r.tried = true; await saveRecipes(); render(); renderCollection(); }
      exitBrew(); switchScreen('screen-home');
    };
    shell.querySelectorAll('[data-brewrate] button').forEach(b => b.onclick = async () => {
      const v = +b.dataset.star;
      const r = recipes.find(x => x.id === brewState.id);
      if(r){ r.rating = v; r.tried = true; await saveRecipes(); render(); renderCollection(); }
      shell.querySelectorAll('[data-brewrate] button').forEach(x => x.classList.toggle('on', +x.dataset.star <= v));
    });
    if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.landAnimation();
  } else {
    shell.querySelector('[data-prev]').onclick = () => { if(brewState.i>0){ brewState.dir = -1; brewState.i--; renderBrew(); } };
    shell.querySelector('[data-next]').onclick = () => { brewState.dir = 1; brewState.i++; renderBrew(); };
  }
  shell.querySelector('[data-exit]').onclick = exitBrew;
}
function exitBrew(){ document.getElementById('brew-mode').style.display = 'none'; brewState = null; }

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
      await saveRecipes(); buildChips(); render(); renderCollection();
      showToast(`Restored ${merged} recipe${merged===1?'':'s'} ⬆`);
    }catch(e){ showToast('That file didn’t look like a backup'); }
  };
  reader.readAsText(file);
}

/* ---------- wiring ---------- */
buildChips();
buildKitchen();
if(typeof runSplash === 'function'){
  runSplash();
} else {
  /* Fallback when animations.js isn't loaded: hide splash after 1.6 s */
  const sp = document.getElementById('splash');
  if(sp){
    setTimeout(() => { sp.style.transition = 'opacity .5s'; sp.style.opacity = '0'; setTimeout(() => { sp.style.display = 'none'; }, 520); }, 1600);
    document.getElementById('splashSkip').onclick = () => { sp.style.transition = 'opacity .25s'; sp.style.opacity = '0'; setTimeout(() => { sp.style.display = 'none'; }, 280); };
  }
}

document.querySelectorAll('.nav-tab').forEach(t => t.addEventListener('click', () => switchScreen(t.dataset.target)));

/* View toggle (List / World) */
document.getElementById('viewToggle').addEventListener('click', e => {
  const btn = e.target.closest('.vt-seg');
  if(!btn) return;
  setViewMode(btn.dataset.view);
});

document.getElementById('content').addEventListener('click', e => {
  const card = e.target.closest('.bp-card');
  if(card && card.dataset.id) openDetail(card.dataset.id, card);
});
document.getElementById('collection-content').addEventListener('click', e => {
  const card = e.target.closest('.bp-card');
  if(card && card.dataset.id) openDetail(card.dataset.id, card);
});

document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.detail-btn.primary, .util-add, .detail-made-toggle, .brew-btn.primary');
  if(el && typeof spawnRipple === 'function') spawnRipple(el, e);
}, {passive:true});

let searchTimer = null;
document.getElementById('addBtn').onclick = () => openForm(null);
document.getElementById('searchInput').oninput = e => { searchTerm = e.target.value; clearTimeout(searchTimer); searchTimer = setTimeout(render, 120); };
document.getElementById('sortSelect').onchange  = e => { sortBy = e.target.value; animateNext = true; render(); };
document.getElementById('exportBtn').onclick = exportRecipes;
document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
document.getElementById('importFile').onchange = e => { if(e.target.files[0]) importRecipes(e.target.files[0]); e.target.value=''; };
document.getElementById('formPanel').addEventListener('click', e => { if(e.target === document.getElementById('formPanel')) closeForm(); });

document.addEventListener('keydown', e => {
  if(brewState){
    if(e.key === 'Escape') exitBrew();
    else if(e.key === 'ArrowRight'){ if(brewState.i < brewState.steps.length){ brewState.dir = 1; brewState.i++; renderBrew(); } }
    else if(e.key === 'ArrowLeft'){ if(brewState.i>0){ brewState.dir = -1; brewState.i--; renderBrew(); } }
    return;
  }
  if(e.key === 'Escape'){
    if(document.getElementById('detail-panel').style.display !== 'none') closeDetail();
    else closeForm();
  }
});

loadRecipes();
