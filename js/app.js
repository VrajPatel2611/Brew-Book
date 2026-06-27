/* ===== Brew Book — APP LOGIC =====
   Storage, rendering (boarding passes), airline system, world map,
   navigation, cinematic detail view, brew mode, the add/edit form. */

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
  27:{name:'AIR SENEGAL',code:'HC',color:'#00853e'},
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

/* ---------- WORLD MAP DATA (equirectangular, viewBox 1440x720) ---------- */
const MAP_BG = {
  na:'M48,76 L160,120 L220,164 L252,232 L372,300 L388,324 L420,320 L420,272 L400,260 L420,220 L452,184 L512,172 L480,112 L420,84 L320,80 L220,100 L100,124 Z',
  sa:'M400,316 L452,312 L500,336 L580,384 L580,416 L544,452 L512,496 L496,512 L460,580 L420,568 L400,512 L432,468 L432,380 L408,352 Z',
  eu:'M672,76 L700,184 L732,184 L780,216 L832,216 L896,188 L840,112 L800,76 Z',
  af:'M648,208 L868,212 L928,312 L896,312 L872,312 L848,380 L860,480 L824,504 L792,504 L768,464 L760,376 L720,340 L688,340 L648,300 Z',
  as:'M828,188 L896,188 L960,136 L1040,136 L1120,56 L1300,56 L1300,160 L1240,188 L1232,224 L1200,272 L1120,360 L1040,380 L992,328 L992,212 L1040,220 L1080,248 L1120,272 L1160,288 L1224,224 L1240,188 Z',
  sea:'M1100,336 L1140,392 L1200,400 L1284,392 L1284,336 Z',
  oc:'M1176,448 L1340,400 L1340,516 L1300,536 L1180,500 Z',
  gl:'M428,28 L640,24 L672,52 L648,100 L540,120 L448,108 L428,60 Z'
};
const MAP_COUNTRIES = [
  'M1128,268 L1152,268 L1156,320 L1136,320 L1128,304 Z',
  'M684,184 L732,188 L732,212 L712,216 L696,216 L684,208 Z',
  'M1112,276 L1144,276 L1144,340 L1112,340 Z',
  'M800,192 L824,192 L824,216 L808,220 L800,208 Z',
  'M748,184 L784,196 L780,212 L784,208 L780,188 L772,184 Z',
  'M252,232 L332,256 L368,296 L388,320 L420,320 L420,272 L392,268 L352,288 L332,272 L280,268 Z',
  'M992,212 L1108,212 L1108,328 L1028,328 L1000,272 L992,268 Z',
  'M696,216 L720,220 L720,248 L664,252 L664,216 Z',
  'M824,188 L896,188 L896,216 L832,216 L824,196 Z',
  'M1120,332 L1200,332 L1200,356 L1120,356 Z',
  'M432,380 L520,380 L580,396 L580,424 L544,452 L512,496 L480,472 L460,448 L448,400 L432,400 Z',
  'M852,300 L912,300 L912,348 L852,348 Z',
  'M888,288 L940,288 L940,312 L892,312 L888,300 Z',
  'M1240,180 L1288,180 L1288,240 L1240,240 Z'
];
const ORIGIN_PINS = [
  {origin:'Vietnam',lon:108.0,lat:14.0,airline:'VIETNAM AIRLINES',color:'#1a4b8c'},
  {origin:'Spain',lon:-3.7,lat:40.4,airline:'IBERIA',color:'#cc0000'},
  {origin:'Indonesia',lon:113.9,lat:-0.8,airline:'GARUDA INDONESIA',color:'#0d4f8b'},
  {origin:'Thailand',lon:100.5,lat:13.7,airline:'THAI AIRWAYS',color:'#6b2d8b'},
  {origin:'Greece',lon:21.8,lat:39.0,airline:'AEGEAN AIR',color:'#003087'},
  {origin:'Italy',lon:12.5,lat:41.9,airline:'ITA AIRWAYS',color:'#009246'},
  {origin:'Portugal',lon:-8.2,lat:39.4,airline:'TAP PORTUGAL',color:'#006600'},
  {origin:'Mexico',lon:-102.5,lat:23.6,airline:'AEROMEXICO',color:'#0a2240'},
  {origin:'India',lon:78.9,lat:20.6,airline:'AIR INDIA',color:'#c8102e'},
  {origin:'Cuba',lon:-77.8,lat:21.5,airline:'CUBANA',color:'#003087'},
  {origin:'South Korea',lon:127.8,lat:35.9,airline:'KOREAN AIR',color:'#00256c'},
  {origin:'Morocco',lon:-5.0,lat:31.8,airline:'ROYAL AIR MAROC',color:'#cc0000'},
  {origin:'Hong Kong',lon:114.2,lat:22.3,airline:'CATHAY PACIFIC',color:'#005f6b'},
  {origin:'Turkey',lon:35.2,lat:38.9,airline:'TURKISH AIRLINES',color:'#c8102e'},
  {origin:'Austria',lon:14.5,lat:47.5,airline:'AUSTRIAN',color:'#c8102e'},
  {origin:'Malaysia',lon:109.7,lat:4.2,airline:'MALAYSIA AIRLINES',color:'#cc0000'},
  {origin:'Brazil',lon:-51.9,lat:-14.2,airline:'LATAM BRASIL',color:'#cc0000'},
  {origin:'Senegal',lon:-14.5,lat:14.5,airline:'AIR SENEGAL',color:'#00853e'},
  {origin:'Ethiopia',lon:40.5,lat:9.1,airline:'ETHIOPIAN',color:'#009a44'},
  {origin:'Yemen',lon:48.5,lat:15.6,airline:'YEMENIA',color:'#ce1126'},
  {origin:'Taiwan',lon:120.9,lat:23.7,airline:'EVA AIR',color:'#007b40'},
  {origin:'Japan',lon:138.3,lat:36.2,airline:'ANA',color:'#003087'}
];
const METHOD_COLORS = {'moka pot':'#cf7f45','instant':'#7fb069','blended':'#e8b04b','cezve':'#a06fbf','other':'#7f9fc9'};

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
  return '<button class="detail-picks-toggle" data-picks-toggle><span>🛒 Which beans to buy (Blue Tokai · Third Wave)</span><span class="chev">▾</span></button>'
    + '<div class="detail-picks-body" data-picks-body>'
    + (bt.length ? '<div class="detail-roaster bt"><h4><span class="pin"></span>Blue Tokai</h4><div class="pick-label">Best pick for this drink</div><ul>' + bt.map(x=>'<li>'+esc(x)+'</li>').join('') + '</ul></div>' : '')
    + (tw.length ? '<div class="detail-roaster tw"><h4><span class="pin"></span>Third Wave</h4><div class="pick-label">Best pick for this drink</div><ul>' + tw.map(x=>'<li>'+esc(x)+'</li>').join('') + '</ul></div>' : '')
    + '</div>';
}

/* ---------- chips ---------- */
function buildChips(){
  const chipsEl = document.getElementById('methodChips');
  const order = ['all','moka pot','instant','blended','cezve','other'];
  const present = new Set(['all']);
  recipes.forEach(r => present.add(order.includes(r.method) ? r.method : 'other'));
  const methods = order.filter(m => present.has(m));
  chipsEl.innerHTML = methods.map(m => '<button class="chip" data-method="'+m+'">'+(m==='all'?'ALL':m.toUpperCase())+'</button>').join('');
  chipsEl.onclick = e => { const b = e.target.closest('.chip'); if(!b) return; activeMethod = b.dataset.method; animateNext = true; render(); };

  const triedEl = document.getElementById('triedChips');
  triedEl.innerHTML = [['all','ALL'],['totry','TO TRY'],['tried','MADE IT']].map(([v,l]) => '<button class="chip tried" data-tried="'+v+'">'+l+'</button>').join('');
  triedEl.onclick = e => { const b = e.target.closest('.chip'); if(!b) return; triedFilter = b.dataset.tried; animateNext = true; render(); };
}
function syncChips(){
  document.querySelectorAll('#methodChips .chip').forEach(b => b.classList.toggle('active', b.dataset.method === activeMethod));
  document.querySelectorAll('#triedChips .chip').forEach(b => b.classList.toggle('active', b.dataset.tried === triedFilter));
}

/* ---------- ingredient filter state ---------- */
let activeIngredients = new Set();

/* ---------- ingredient filter panel ---------- */
function buildIngFilter(){
  const triedEl = document.getElementById('triedChips');
  if(!triedEl) return;

  const ING_CHIPS = [
    ['milk','Milk'],['condensed','Condensed Milk'],['coconut','Coconut Milk'],
    ['cream','Cream'],['ice','Ice'],['sugar','Sugar'],['honey','Honey'],
    ['egg','Egg'],['banana','Banana'],['mango','Mango'],['orange','Orange'],
    ['pineapple','Pineapple'],['chocolate','Chocolate'],['cinnamon','Cinnamon'],
    ['cardamom','Cardamom'],['vanilla','Vanilla'],['ginger','Ginger'],
    ['lemon','Lemon'],['salt','Salt']
  ];

  const panel = document.createElement('div');
  panel.id = 'ingFilter';
  panel.innerHTML =
    '<div id="ingFilterHead">'
    + '<span class="ing-pan-ico">☕</span>'
    + '<span id="ingFilterLabel">What’s in your kitchen?</span>'
    + '<button id="ingFilterToggle" type="button">＋</button>'
    + '</div>'
    + '<div id="ingFilterBody">'
    + '<div id="ingChips">'
    + ING_CHIPS.map(function(pair){
        return '<button class="ingChip" data-ing="'+pair[0]+'" type="button">'+ingredientIcon(pair[1])+'<span>'+pair[1]+'</span></button>';
      }).join('')
    + '</div>'
    + '<div id="ingResultBar" style="display:none"></div>'
    + '</div>';

  triedEl.insertAdjacentElement('afterend', panel);

  var head   = document.getElementById('ingFilterHead');
  var body   = document.getElementById('ingFilterBody');
  var toggle = document.getElementById('ingFilterToggle');

  function toggleBody(){
    var isOpen = body.classList.contains('open');
    body.classList.toggle('open', !isOpen);
    toggle.textContent = isOpen ? '＋' : '×';
  }

  head.addEventListener('click', function(e){
    if(e.target === toggle) return;
    toggleBody();
  });
  toggle.addEventListener('click', function(e){
    e.stopPropagation();
    toggleBody();
  });

  document.getElementById('ingChips').addEventListener('click', function(e){
    var chip = e.target.closest('.ingChip');
    if(!chip) return;
    var ing = chip.dataset.ing;
    if(activeIngredients.has(ing)) activeIngredients.delete(ing); else activeIngredients.add(ing);
    chip.classList.toggle('active', activeIngredients.has(ing));

    var labelEl = document.getElementById('ingFilterLabel');
    if(activeIngredients.size > 0){
      var names = Array.from(activeIngredients).map(function(k){
        var entry = ING_CHIPS.find(function(p){ return p[0] === k; });
        return entry ? entry[1] : k;
      }).join(', ');
      labelEl.textContent = names.length > 28 ? names.slice(0,28) + '…' : names;
      head.classList.add('ing-active');
    } else {
      labelEl.textContent = 'What’s in your kitchen?';
      head.classList.remove('ing-active');
    }

    updateIngResultBar();
    render();
  });
}

function updateIngResultBar(){
  var bar = document.getElementById('ingResultBar');
  if(!bar) return;
  if(activeIngredients.size === 0){
    bar.style.display = 'none';
    return;
  }
  var count = recipes.filter(function(r){
    var ings = (r.ingredients || []).map(function(i){ return i.toLowerCase(); });
    return Array.from(activeIngredients).every(function(kw){ return ings.some(function(i){ return i.indexOf(kw) !== -1; }); });
  }).length;
  bar.style.display = 'flex';
  bar.innerHTML = '<span>'+count+' recipes you can make right now</span><button id="ingClearBtn" type="button">Clear All</button>';
  document.getElementById('ingClearBtn').onclick = function(){
    activeIngredients.clear();
    document.querySelectorAll('.ingChip').forEach(function(c){ c.classList.remove('active'); });
    var labelEl = document.getElementById('ingFilterLabel');
    if(labelEl) labelEl.textContent = 'What’s in your kitchen?';
    var headEl = document.getElementById('ingFilterHead');
    if(headEl) headEl.classList.remove('ing-active');
    bar.style.display = 'none';
    render();
  };
}

/* ---------- boarding pass card ---------- */
function boardingPassCard(r, extraClass){
  const al = getAirline(r.serial || 0);
  const light = hexLighten(al.color, 42);
  const d = r.createdAt ? new Date(r.createdAt) : null;
  const dateTop = d ? d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase() : '';
  const yr = d ? d.getFullYear() : '';
  return '<button class="bp-card '+(r.tried?'is-boarded':'')+' '+(extraClass||'')+'" data-id="'+r.id+'">'
    +'<span class="bp-strip" style="background:linear-gradient(180deg,'+light+','+al.color+')"></span>'
    +'<div class="bp-body">'
      +'<div class="bp-top-row">'
        +'<span class="bp-airline" style="color:'+al.color+'">'+esc(al.name)+'</span>'
        +'<span class="bp-serial-label">BREW #'+pad(r.serial||0)+'</span>'
      +'</div>'
      +'<h3 class="bp-name">'+esc(r.name)+'</h3>'
      +(r.description?'<p class="bp-desc">'+esc(r.description)+'</p>':'')
      +'<div class="bp-journey">'
        +'<div class="bp-journey-col"><span class="bp-info-label">FROM</span><span class="bp-origin-name" style="color:'+al.color+'">'+esc(r.origin||'Fusion')+'</span></div>'
        +'<span class="bp-arrow">✈</span>'
        +'<div class="bp-journey-col"><span class="bp-info-label">METHOD</span><span class="bp-method-val">'+esc(r.method||'')+'</span></div>'
      +'</div>'
    +'</div>'
    +'<div class="bp-gate">'
      +'<span class="bp-info-label">GATE</span>'
      +'<span class="bp-ratio-num" style="color:'+al.color+'">'+esc(r.ratio||'—')+'</span>'
      +'<span class="bp-info-label bp-strength-label">STR.</span>'
      +beansRow(r.strength||3)
    +'</div>'
    +'<div class="bp-stub">'
      +'<span class="bp-country-badge" style="background:'+al.color+'">'+al.code+'</span>'
      +'<span class="bp-stub-date">'+dateTop+'<br><span class="bp-stub-yr">'+yr+'</span></span>'
      +(r.tried?'<span class="bp-boarded">BOARDED</span>':'')
    +'</div>'
    +'</button>';
}

/* ---------- render (home terminal) ---------- */
function render(){
  document.getElementById('countPill').textContent = recipes.length + ' BREWS';
  syncChips();
  const content = document.getElementById('content');
  let list = recipes.slice();
  if(activeMethod !== 'all') list = list.filter(r => (['moka pot','instant','blended','cezve'].includes(r.method) ? r.method : 'other') === activeMethod);
  if(triedFilter === 'tried') list = list.filter(r => r.tried);
  if(triedFilter === 'totry') list = list.filter(r => !r.tried);
  if(searchTerm){
    const q = searchTerm.toLowerCase();
    list = list.filter(r => r.name.toLowerCase().includes(q) || (r.description||'').toLowerCase().includes(q) || (r.origin||'').toLowerCase().includes(q) || (r.ingredients||[]).some(i => i.toLowerCase().includes(q)));
  }
  if(sortBy === 'serial') list.sort((a,b)=>(a.serial||0)-(b.serial||0));
  else if(sortBy === 'newest') list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  else if(sortBy === 'rating') list.sort((a,b)=>(b.rating||0)-(a.rating||0) || (a.serial||0)-(b.serial||0));
  else if(sortBy === 'name') list.sort((a,b)=>a.name.localeCompare(b.name));

  const ingActive = activeIngredients.size > 0;

  if(list.length === 0){
    content.innerHTML = '<div class="empty"><div class="empty-ring"></div><h2>'+(recipes.length === 0 ? 'No brews yet' : 'Nothing matches')+'</h2><p>'+(recipes.length === 0 ? 'Tap ＋ to write your first one.' : 'Try a different search or filter.')+'</p></div>';
    return;
  }
  content.innerHTML = '<div class="bp-grid">'+list.map(function(r){
    var extraClass = '';
    if(ingActive){
      var ings = (r.ingredients || []).map(function(i){ return i.toLowerCase(); });
      var matches = Array.from(activeIngredients).every(function(kw){ return ings.some(function(i){ return i.indexOf(kw) !== -1; }); });
      extraClass = matches ? 'ing-match' : 'ing-nomatch';
    }
    return boardingPassCard(r, extraClass);
  }).join('')+'</div>';
  if(animateNext){
    if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.animateCardEntrance(content);
    animateNext = false;
  }
}

/* ---------- collection screen ---------- */
function renderCollection(){
  const tried = recipes.filter(r => r.tried).sort((a,b)=>(a.serial||0)-(b.serial||0));
  document.getElementById('collectionCount').textContent = tried.length + ' BOARDED';
  const el = document.getElementById('collection-content');
  if(tried.length === 0){
    el.innerHTML = '<div class="empty"><div class="empty-ring"></div><h2>No stamps yet</h2><p>Mark a brew as made to stamp your passport.</p></div>';
    return;
  }
  el.innerHTML = '<div class="bp-grid">'+tried.map(function(r){ return boardingPassCard(r, ''); }).join('')+'</div>';
}

/* ---------- world map (D3 + Natural Earth, Robinson projection) ---------- */
let mapBuilt = false;
let mapPins = [];
let mapProjection = null;
let mapZoomT = {k:1,x:0,y:0};

function pinMarkup(p, rec, idx){
  return '<g class="map-pin" data-id="'+rec.id+'" data-origin="'+esc(p.origin)+'" transform="translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+')"><g class="pin-anim"><g class="pin-pulse" style="animation-delay:'+(idx*0.13).toFixed(2)+'s"><path class="pin-drop" d="M0,-19 C-8,-19 -13,-12 -13,-6 C-13,4 0,14 0,14 C0,14 13,4 13,-6 C13,-12 8,-19 0,-19 Z" fill="'+p.color+'" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" style="color:'+p.color+'"/><circle cx="0" cy="-6" r="4" fill="rgba(255,255,255,.6)"/><circle cx="0" cy="-6" r="1.7" fill="rgba(255,255,255,.95)"/></g></g></g>';
}

function computePins(projectFn){
  const pins = [];
  ORIGIN_PINS.forEach(p => {
    const recs = recipes.filter(r => r.origin === p.origin).sort((a,b)=>(a.serial||0)-(b.serial||0));
    if(!recs.length) return;
    const n = recs.length;
    recs.forEach((rec, i) => {
      const off = i - (n-1)/2;
      const lon = p.lon + off * 1.2;
      const lat = p.lat + off * 0.5;
      const xy = projectFn([lon, lat]);
      if(!xy) return;
      pins.push({ origin:p.origin, color:p.color, recId:rec.id, rec, x:xy[0], y:xy[1] });
    });
  });
  return pins;
}

function wireMapPins(){
  document.querySelectorAll('#map-content .map-pin').forEach(pin => {
    const id = pin.dataset.id;
    pin.addEventListener('mouseenter', () => showMapPreview(pin, id));
    pin.addEventListener('mouseleave', hideMapPreview);
    pin.addEventListener('click', (e) => { e.stopPropagation(); openDetail(id, pin); });
  });
}

function buildLegend(){
  const legend = document.getElementById('mapLegend');
  legend.innerHTML = Object.entries(METHOD_COLORS).map(([m,c])=>'<div class="legend-item"><span class="legend-dot" style="background:'+c+'"></span>'+m+'</div>').join('');
}

function buildWorldMap(){
  if(mapBuilt) return;
  mapBuilt = true;
  buildLegend();
  const haveD3 = (typeof d3 !== 'undefined' && d3.geoRobinson && typeof topojson !== 'undefined');
  if(haveD3){
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(world => { renderD3Map(world); })
      .catch(() => { buildFallbackMap(); });
  } else {
    buildFallbackMap();
  }
}

function renderD3Map(world){
  const W = 960, H = 500;
  const projection = d3.geoRobinson().rotate([-15, 0]).fitExtent([[12,14],[W-12,H-22]], {type:'Sphere'});
  mapProjection = projection;
  const path = d3.geoPath(projection);
  document.getElementById('map-sphere').setAttribute('d', path({type:'Sphere'}) || '');
  const grat = d3.geoGraticule().step([30,30]);
  document.getElementById('map-graticule').innerHTML = '<path d="'+(path(grat())||'')+'" fill="none" stroke="#162030" stroke-width="0.5" stroke-opacity="0.85"/>';
  const countries = topojson.feature(world, world.objects.countries).features;
  const cg = document.getElementById('map-countries');
  cg.innerHTML = countries.map(f => '<path class="map-country-d" d="'+(path(f)||'')+'" fill="#1a2a3a" stroke="#2a3a4a" stroke-width="0.5" style="opacity:0"/>').join('');
  mapPins = computePins(ll => projection(ll));
  document.getElementById('map-content').innerHTML = mapPins.map((p,i)=>pinMarkup(p, p.rec, i)).join('');
  bindPinEls();
  wireMapPins();
  setupD3Zoom();
  animateCountriesIn();
  if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.animatePinsIn();
}

function animateCountriesIn(){
  const paths = document.querySelectorAll('.map-country-d');
  if(typeof BREW_ANIM !== 'undefined' && BREW_ANIM.REDUCED){ paths.forEach(p=>p.style.opacity='1'); return; }
  if(typeof gsap !== 'undefined'){
    gsap.fromTo(paths, {opacity:0}, {opacity:1, duration:1.2, stagger:0.02, ease:'power1.out'});
  }
  setTimeout(()=>{ paths.forEach(p=>{ try{ gsap.killTweensOf(p); }catch(e){} p.style.opacity='1'; }); }, 1600);
}

function buildFallbackMap(){
  const cg = document.getElementById('map-countries');
  let html = '';
  Object.values(MAP_BG).forEach(d => { html += '<path class="map-country-d" d="'+d+'" fill="#1a2a3a" stroke="#2a3a4a" stroke-width="0.5" transform="scale(0.6667)" style="opacity:0"/>'; });
  MAP_COUNTRIES.forEach(d => { html += '<path class="map-country-d" d="'+d+'" fill="#26384c" stroke="#33485c" stroke-width="0.5" transform="scale(0.6667)" style="opacity:0"/>'; });
  cg.innerHTML = html;
  document.getElementById('map-sphere').setAttribute('d','');
  const proj = ll => {
    const lon = ll[0], lat = ll[1];
    const x = (((lon - 15 + 180 + 360) % 360)) / 360 * 960;
    const y = (90 - lat) / 180 * 500;
    return [x, y];
  };
  mapPins = computePins(proj);
  document.getElementById('map-content').innerHTML = mapPins.map((p,i)=>pinMarkup(p, p.rec, i)).join('');
  bindPinEls();
  wireMapPins();
  setupPointerZoom();
  animateCountriesIn();
  if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.animatePinsIn();
}

function bindPinEls(){
  const els = document.querySelectorAll('#map-content .map-pin');
  mapPins.forEach((p, i) => { p.el = els[i]; });
}

function setupD3Zoom(){
  const svg = document.getElementById('world-map-svg');
  const zoomG = document.getElementById('map-zoom');
  const zoom = d3.zoom()
    .scaleExtent([1, 6])
    .translateExtent([[0,0],[960,500]])
    .on('zoom', (ev) => {
      const t = ev.transform;
      mapZoomT = {k:t.k, x:t.x, y:t.y};
      zoomG.setAttribute('transform', 'translate('+t.x+','+t.y+') scale('+t.k+')');
      mapPins.forEach(p => { if(p.el) p.el.setAttribute('transform', 'translate('+(t.x + p.x*t.k).toFixed(1)+','+(t.y + p.y*t.k).toFixed(1)+')'); });
      hideMapPreview();
    });
  d3.select(svg).call(zoom).on('dblclick.zoom', null);
}

function setupPointerZoom(){
  const c = document.getElementById('map-container');
  const zoomG = document.getElementById('map-zoom');
  let st = {k:1,x:0,y:0,drag:false,sx:0,sy:0,ox:0,oy:0};
  const clamp = () => {
    const maxX = 0, maxY = 0;
    const minX = 960 - 960*st.k, minY = 500 - 500*st.k;
    st.x = Math.min(maxX, Math.max(minX, st.x));
    st.y = Math.min(maxY, Math.max(minY, st.y));
  };
  const apply = () => {
    zoomG.setAttribute('transform', 'translate('+st.x+','+st.y+') scale('+st.k+')');
    mapPins.forEach(p => { if(p.el) p.el.setAttribute('transform', 'translate('+(st.x + p.x*st.k).toFixed(1)+','+(st.y + p.y*st.k).toFixed(1)+')'); });
    mapZoomT = {k:st.k,x:st.x,y:st.y};
  };
  c.addEventListener('pointerdown', e => {
    if(e.target.closest('.map-pin')) return;
    st.drag = true; st.sx = e.clientX; st.sy = e.clientY; st.ox = st.x; st.oy = st.y;
    c.setPointerCapture(e.pointerId);
  });
  c.addEventListener('pointermove', e => {
    if(!st.drag) return;
    const sc = 960 / c.clientWidth;
    st.x = st.ox + (e.clientX - st.sx) * sc;
    st.y = st.oy + (e.clientY - st.sy) * sc;
    clamp(); apply();
  });
  const end = () => { st.drag = false; };
  c.addEventListener('pointerup', end);
  c.addEventListener('pointercancel', end);
  c.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = c.getBoundingClientRect();
    const sc = 960 / rect.width;
    const mx = (e.clientX - rect.left) * sc, my = (e.clientY - rect.top) * sc;
    const nk = Math.min(6, Math.max(1, st.k * (e.deltaY > 0 ? 0.9 : 1.1)));
    st.x = mx - (mx - st.x) * (nk / st.k);
    st.y = my - (my - st.y) * (nk / st.k);
    st.k = nk; clamp(); apply();
  }, {passive:false});
}

function showMapPreview(pin, id){
  const rec = recipes.find(r => r.id === id);
  if(!rec) return;
  const preview = document.getElementById('map-preview');
  preview.innerHTML = boardingPassCard(rec, '');
  preview.style.display = 'block';
  const pinRect = pin.getBoundingClientRect();
  let px = pinRect.left + pinRect.width/2 - 140;
  px = Math.min(Math.max(px, 8), window.innerWidth - 288);
  preview.style.left = px + 'px';
  preview.style.visibility = 'hidden';
  preview.style.top = '0px';
  const place = () => {
    const h = preview.offsetHeight;
    let py = pinRect.top - h - 12;
    if(py < 50) py = pinRect.bottom + 12;
    preview.style.top = py + 'px';
    preview.style.visibility = 'visible';
    preview.classList.add('visible');
    if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.initTSAScan(preview.querySelector('.bp-card'));
  };
  place();
  BREW_ANIM && BREW_ANIM.updateDepartureBoard(rec.name+'  ·  '+(rec.origin||'GLOBAL')+'  ·  BREW-'+pad(rec.serial||0));
}
function hideMapPreview(){
  const preview = document.getElementById('map-preview');
  preview.classList.remove('visible');
  setTimeout(() => { if(!preview.classList.contains('visible')) preview.style.display = 'none'; }, 220);
}

/* ---------- navigation ---------- */
let currentScreen = 'screen-home';
let mapEntered = false;
function switchScreen(target){
  if(target === currentScreen) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === target));
  document.querySelectorAll('.nav-tab').forEach(t => {
    const on = t.dataset.target === target;
    t.classList.toggle('active', on);
    if(on) t.setAttribute('aria-current','page'); else t.removeAttribute('aria-current');
  });
  currentScreen = target;
  if(target === 'screen-map'){
    buildWorldMap();
    if(!mapEntered){ mapEntered = true; setTimeout(() => BREW_ANIM && BREW_ANIM.animateMapEntry(), 80); }
  }
  if(target === 'screen-collection') renderCollection();
}

/* ---------- detail (boarding pass paper) ---------- */
let detailPanelEl = null;
function openDetail(id, cardEl){
  const r = recipes.find(x => x.id === id);
  if(!r) return;
  const al = getAirline(r.serial || 0);
  const panel = document.getElementById('detail-panel');
  detailPanelEl = panel;

  panel.innerHTML =
    '<div class="bp-detail-header" style="background:linear-gradient(135deg,'+hexLighten(al.color,30)+','+al.color+')">'
    +'<button class="bp-detail-close" data-close aria-label="Close">✕</button>'
    +'<span class="bp-detail-airline">'+esc(al.name)+'</span>'
    +'<span class="bp-detail-flight">FLIGHT BREW-'+pad(r.serial||0)+'</span>'
    +'<div class="bp-detail-departing-label">DEPARTING FROM</div>'
    +'<div class="bp-detail-city">'+esc(r.origin||'Fusion')+'</div>'
    +'</div>'
    +'<div class="torn-sep"><div class="torn-sep-fill"></div></div>'
    +'<div class="detail-progress-bar"><div class="detail-progress-fill" data-prog></div></div>'
    +'<div class="bp-detail-body" data-body>'
    +'<div class="detail-recipe-name reveal">'+esc(r.name)+'</div>'
    +(r.description?'<div class="detail-recipe-desc reveal">'+esc(r.description)+'</div>':'')
    +'<div class="detail-made-panel reveal">'
    +'<button class="detail-made-toggle '+(r.tried?'on':'')+'" data-made><span class="box">✓</span>'+(r.tried?'Made it':'Mark as made')+'<span class="puff"></span><span class="puff"></span><span class="puff"></span><span class="puff"></span><span class="puff"></span></button>'
    +'<div class="detail-rate-wrap"><span class="detail-rate-label">Your rating</span><div class="detail-rate-stars" data-rate>'+[1,2,3,4,5].map(i=>'<button data-star="'+i+'" class="'+(i<=(r.rating||0)?'on':'')+'" aria-label="'+i+' star">★</button>').join('')+'</div></div>'
    +'</div>'
    +(r.story?'<div class="detail-section-label reveal">The Story</div><div class="detail-rule reveal"></div><div class="detail-story-text reveal">'+esc(r.story)+'</div>':'')
    +(r.bean?'<div class="detail-section-label reveal">Beans for this brew</div><div class="detail-bean-box reveal"><span>\uD83FAB</span><span>'+esc(r.bean)+'</span></div>':'')
    +'<div class="reveal">'+buyPicksHTML(r.id)+'</div>'
    +'<div class="detail-section-label reveal">Ingredients</div>'
    +'<ul class="detail-ing-list">'+(r.ingredients||[]).map((i,idx)=>'<li class="reveal" style="transition-delay:'+Math.min(idx*45,300)+'ms">'+ingredientIcon(i)+'<span>'+esc(i)+'</span></li>').join('')+'</ul>'
    +'<div class="detail-section-label reveal">Steps</div>'
    +'<ol class="detail-step-list">'+(r.steps||[]).map((s,idx)=>{const st=(typeof s==='string')?{c:s}:s;return '<li class="reveal '+(idx%2?'reveal-right':'reveal-left')+'"><div>'+(st.t?'<strong class="step-title">'+esc(st.t)+':</strong> ':'')+esc(st.c)+'</div></li>';}).join('')+'</ol>'
    +(r.notes?'<div class="detail-section-label reveal">Notes</div><div class="detail-notes-box reveal">'+esc(r.notes)+'</div>':'')
    +((r.steps&&r.steps.length)?'<button class="detail-btn primary detail-brew-start reveal" data-brew><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 3l9 5-9 5V3z" fill="currentColor"/></svg> START BREWING →</button>':'')
    +'<div class="detail-actions reveal"><button class="detail-btn" data-edit>Edit</button><button class="detail-btn danger" data-delete>Delete</button></div>'
    +'</div>';

  const torn = panel.querySelector('.torn-sep');
  torn.style.background = 'var(--pass-paper)';
  panel.querySelector('.bp-detail-header').style.marginBottom = '0';
  const sepFill = panel.querySelector('.torn-sep-fill');
  if(sepFill){ sepFill.style.cssText = 'position:absolute;top:-1px;left:0;right:0;height:11px;background:'+al.color+';clip-path:polygon(0 0,100% 0,100% 55%,96% 80%,92% 40%,88% 90%,84% 45%,80% 85%,76% 30%,72% 82%,68% 38%,64% 90%,60% 48%,56% 85%,52% 30%,48% 78%,44% 42%,40% 88%,36% 38%,32% 85%,28% 32%,24% 80%,20% 42%,16% 88%,12% 52%,8% 82%,4% 48%,0 72%);'; }

  panel.style.display = 'flex';
  if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.openBoardingPassTransition(cardEl, panel);

  const body = panel.querySelector('[data-body]');
  if(typeof BREW_ANIM !== 'undefined') BREW_ANIM.initDetailReveals(body);
  const progFill = panel.querySelector('[data-prog]');
  body.onscroll = () => { const max = body.scrollHeight - body.clientHeight; if(progFill) progFill.style.width = (max>0 ? body.scrollTop/max*100 : 0) + '%'; };

  panel.querySelector('[data-close]').onclick = closeDetail;
  const picksToggle = panel.querySelector('[data-picks-toggle]');
  if(picksToggle) picksToggle.onclick = () => { picksToggle.classList.toggle('open'); panel.querySelector('[data-picks-body]').classList.toggle('open'); };
  const brewBtn = panel.querySelector('[data-brew]');
  if(brewBtn) brewBtn.onclick = () => startBrew(id);

  const madeBtn = panel.querySelector('[data-made]');
  madeBtn.onclick = async () => {
    const nowTried = !r.tried;
    r.tried = nowTried;
    if(!r.tried) r.rating = 0;
    await saveRecipes(); render(); renderCollection();
    if(nowTried){
      madeBtn.classList.add('on');
      madeBtn.innerHTML = '<span class="box">✓</span>Made it'+'<span class="puff"></span>'.repeat(5);
      void madeBtn.offsetWidth; madeBtn.classList.add('celebrate');
      const br = madeBtn.getBoundingClientRect();
      if(typeof beanBurst === 'function') beanBurst(br.left + br.width/2, br.top + br.height/2, 16);
      showToast('Boarded ✓');
      setTimeout(() => openDetail(id, cardEl), 720);
    } else {
      openDetail(id, cardEl); showToast('Moved back to “to try”');
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
    if(!confirm('Delete "'+r.name+'"? This can’t be undone.')) return;
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
  sheet.innerHTML =
    '<div class="sheet-head"><h2>'+(r ? 'Edit recipe' : 'New recipe')+'</h2><button class="close-btn" data-close aria-label="Close">✕</button></div>'
    +'<div class="field"><label for="fName">Name</label><input id="fName" type="text" placeholder="e.g. Caffè Shakerato" value="'+(r?esc(r.name):'')+'"></div>'
    +'<div class="field"><label for="fDesc">Description</label><textarea id="fDesc" placeholder="What makes this brew yours?">'+(r?esc(r.description||''):'')+'</textarea></div>'
    +'<div class="field-row3">'
    +'<div class="field"><label for="fSerial">Serial #</label><input id="fSerial" type="number" min="1" value="'+(r?(r.serial||nextSerial()):nextSerial())+'"></div>'
    +'<div class="field"><label for="fDate">Date added</label><input id="fDate" type="date" value="'+dateInputVal(r?r.createdAt:null)+'"></div>'
    +'<div class="field"><label for="fOrigin">Origin</label><input id="fOrigin" type="text" placeholder="e.g. Italy" value="'+(r?esc(r.origin||''):'')+'"></div>'
    +'</div>'
    +'<div class="field-row">'
    +'<div class="field"><label for="fMethod">Brew method</label><select id="fMethod">'+METHODS.filter(m=>m!=='all').map(m=>'<option '+(r&&r.method===m?'selected':'')+'>'+m+'</option>').join('')+'</select></div>'
    +'<div class="field"><label for="fRatio">Ratio</label><input id="fRatio" type="text" placeholder="e.g. 1:4" value="'+(r?esc(r.ratio||''):'')+'"></div>'
    +'</div>'
    +'<div class="field"><label for="fRatioLabel">What the ratio means</label><input id="fRatioLabel" type="text" placeholder="e.g. espresso : ice" value="'+(r?esc(r.ratioLabel||''):'')+'"></div>'
    +'<div class="field"><label for="fBean">Beans / roast for this brew</label><textarea id="fBean" placeholder="e.g. dark roast robusta, chocolatey, low acidity">'+(r?esc(r.bean||''):'')+'</textarea></div>'
    +'<div class="field"><label>Strength</label><div class="strength-picker" id="fStrength">'+[1,2,3,4,5].map(n=>'<button type="button" data-n="'+n+'" class="'+(n===strength?'sel':'')+'" aria-label="Strength '+n+'">'+''+[...Array(n)].map(()=>beanSVG(true)).join('')+'</button>').join('')+'</div></div>'
    +'<div class="field"><label for="fIng">Ingredients</label><textarea id="fIng" rows="5" placeholder="One per line">'+(r?esc((r.ingredients||[]).join('\n')):'')+'</textarea><div class="hint">One ingredient per line</div></div>'
    +'<div class="field"><label for="fSteps">Steps</label><textarea id="fSteps" rows="6" placeholder="One step per line. Optional: Title :: instruction">'+(r?esc((r.steps||[]).map(s=>(typeof s==='string')?s:(s.t?s.t+' :: '+s.c:s.c)).join('\n')):'')+'</textarea><div class="hint">One step per line. Add a bold title with "Title :: instruction".</div></div>'
    +'<div class="field"><label for="fNotes">Notes (optional)</label><textarea id="fNotes" placeholder="Tips, tweaks, what to try next time…">'+(r?esc(r.notes||''):'')+'</textarea></div>'
    +'<div class="form-actions"><button class="btn" data-close>Cancel</button><button class="btn primary" data-save>'+(r ? 'Save changes' : 'Save recipe')+'</button></div>';

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

/* ---------- brew mode (cinematic) ---------- */
let brewState = null;
let brewStarsSeeded = false;
function startBrew(id){
  const r = recipes.find(x => x.id === id);
  if(!r || !r.steps || !r.steps.length) return;
  brewState = { id, i: 0, steps: r.steps, name: r.name, origin: r.origin, dir: 1 };
  closeDetail();
  const bm = document.getElementById('brew-mode');
  bm.style.display = 'flex';
  if(!brewStarsSeeded && typeof BREW_ANIM !== 'undefined'){ BREW_ANIM.createStarField(document.getElementById('brewStars'), 45, true); brewStarsSeeded = true; }
  renderBrew();
}
function renderBrew(){
  if(!brewState) return;
  const { i, steps, name, origin } = brewState;
  const bm = document.getElementById('brew-mode');
  const total = steps.length;
  const atEnd = i >= total;
  const pct = Math.round((Math.min(i, total) / total) * 100);

  bm.querySelectorAll('.brew-shell').forEach(n => n.remove());
  const shell = document.createElement('div');
  shell.className = 'brew-shell';
  shell.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column;flex:1;min-height:0';

  if(atEnd){
    shell.innerHTML =
      '<div class="brew-header"><div><div class="brew-title-line">IN FLIGHT · BREW MODE · '+esc(name)+'</div><div class="brew-origin-line">Arrived ☕</div></div><button class="close-btn" data-exit aria-label="Close">✕</button></div>'
      +'<div class="brew-progress-bar"><div class="brew-progress-fill" style="width:100%"></div></div>'
      +'<div class="brew-body"><div class="brew-done">'
      +'<div class="brew-done-cup">☕</div>'
      +'<h3>Brewed. Safe to consume.</h3>'
      +'<p>Rate this brew and head back to the terminal.</p>'
      +'<div class="brew-done-stars"><div class="detail-rate-stars" data-brewrate>'+[1,2,3,4,5].map(n=>'<button data-star="'+n+'" aria-label="'+n+' star">★</button>').join('')+'</div></div>'
      +'</div></div>'
      +'<div class="brew-foot"><button class="brew-btn" data-restart>Start over</button><button class="brew-btn primary" data-finish>Return to Terminal</button></div>';
  } else {
    shell.innerHTML =
      '<div class="brew-header"><div><div class="brew-title-line">IN FLIGHT · BREW MODE · '+esc(name)+'</div><div class="brew-origin-line">'+esc(origin||'')+'</div></div><button class="close-btn" data-exit aria-label="Close">✕</button></div>'
      +'<div class="brew-progress-bar"><div class="brew-progress-fill" style="width:'+pct+'%"></div></div>'
      +'<div class="brew-body"><div class="brew-step-content">'
      +'<div class="brew-stepnum">Step '+(i+1)+' of '+total+((typeof steps[i]==='object' && steps[i].t) ? ' · ' + esc(steps[i].t) : '')+'</div>'
      +'<div class="brew-steptext">'+esc((typeof steps[i]==='string') ? steps[i] : steps[i].c)+'</div>'
      +'<div class="brew-dots">'+steps.map((_,k)=>'<span class="'+(k<i?'done':k===i?'cur':'')+'"></span>').join('')+'</div>'
      +'</div></div>'
      +'<div class="brew-foot"><button class="brew-btn" data-prev '+(i===0?'disabled':'')+'>← Prev</button><button class="brew-btn primary" data-next>'+(i===total-1?'LAND ☕':'Next →')+'</button></div>';
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'brew-book-backup-'+dateInputVal(Date.now())+'.json';
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
      showToast('Restored '+merged+' recipe'+(merged===1?'':'s')+' ⬆');
    }catch(e){ showToast('That file didn’t look like a backup'); }
  };
  reader.readAsText(file);
}

/* ---------- wiring ---------- */
buildChips();
buildIngFilter();
runSplash();

document.querySelectorAll('.nav-tab').forEach(t => t.addEventListener('click', () => switchScreen(t.dataset.target)));

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
document.getElementById('sortSelect').onchange = e => { sortBy = e.target.value; animateNext = true; render(); };
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
