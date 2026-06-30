/* ===== Brew Book — WORLD MAP =====
   D3 Robinson projection, Natural Earth country boundaries,
   pin placement, pan/zoom, departure-board header.
   Requires: d3, topojson globals loaded before this file.
   Uses: recipes (global from app.js), boardingPassCard, pad (app.js runtime). */

/* ---------- MAP CONSTANTS ---------- */
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

/* one pin per origin country — precise [lon, lat] for D3 projection */
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
  {origin:'Senegal',lon:-14.5,lat:14.5,airline:'AIR SÉNÉGAL',color:'#00853e'},
  {origin:'Ethiopia',lon:40.5,lat:9.1,airline:'ETHIOPIAN',color:'#009a44'},
  {origin:'Yemen',lon:48.5,lat:15.6,airline:'YEMENIA',color:'#ce1126'},
  {origin:'Taiwan',lon:120.9,lat:23.7,airline:'EVA AIR',color:'#007b40'},
  {origin:'Japan',lon:138.3,lat:36.2,airline:'ANA',color:'#003087'}
];

const METHOD_COLORS = {
  'moka pot':'#cf7f45',
  'instant':'#7fb069',
  'blended':'#e8b04b',
  'cezve':'#a06fbf',
  'other':'#7f9fc9'
};

/* ---------- map state ---------- */
let mapBuilt = false;
let mapPins = [];
let mapProjection = null;
let mapZoomT = {k:1,x:0,y:0};

function pinMarkup(p, rec, idx){
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return `<g class="map-pin" data-id="${rec.id}" data-origin="${esc(p.origin)}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})">
    <g class="pin-anim">
      <g class="pin-pulse" style="animation-delay:${(idx*0.13).toFixed(2)}s">
        <path class="pin-drop" d="M0,-19 C-8,-19 -13,-12 -13,-6 C-13,4 0,14 0,14 C0,14 13,4 13,-6 C13,-12 8,-19 0,-19 Z" fill="${p.color}" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" style="color:${p.color}"/>
        <circle cx="0" cy="-6" r="4" fill="rgba(255,255,255,.6)"/>
        <circle cx="0" cy="-6" r="1.7" fill="rgba(255,255,255,.95)"/>
      </g>
    </g>
  </g>`;
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
  legend.innerHTML = Object.entries(METHOD_COLORS).map(([m,c])=>
    `<div class="legend-item"><span class="legend-dot" style="background:${c}"></span>${m}</div>`
  ).join('');
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
  document.getElementById('map-graticule').innerHTML =
    `<path d="${path(grat()) || ''}" fill="none" stroke="#162030" stroke-width="0.5" stroke-opacity="0.85"/>`;

  const countries = topojson.feature(world, world.objects.countries).features;
  const cg = document.getElementById('map-countries');
  /* Taiwan (ISO 158) gets solid fill — too small for Natural Earth polygon */
  cg.innerHTML = countries.map(f => {
    const fill = String(f.id) === '158' ? '#26384c' : '#1a2a3a';
    return `<path class="map-country-d" d="${path(f) || ''}" fill="${fill}" stroke="#2a3a4a" stroke-width="0.5" style="opacity:0"/>`;
  }).join('');

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
  Object.values(MAP_BG).forEach(d => {
    html += `<path class="map-country-d" d="${d}" fill="#1a2a3a" stroke="#2a3a4a" stroke-width="0.5" transform="scale(0.6667)" style="opacity:0"/>`;
  });
  MAP_COUNTRIES.forEach(d => {
    html += `<path class="map-country-d" d="${d}" fill="#26384c" stroke="#33485c" stroke-width="0.5" transform="scale(0.6667)" style="opacity:0"/>`;
  });
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
      zoomG.setAttribute('transform', `translate(${t.x},${t.y}) scale(${t.k})`);
      mapPins.forEach(p => {
        if(p.el) p.el.setAttribute('transform', `translate(${(t.x + p.x*t.k).toFixed(1)},${(t.y + p.y*t.k).toFixed(1)})`);
      });
      hideMapPreview();
    });
  d3.select(svg).call(zoom).on('dblclick.zoom', null);
}

function setupPointerZoom(){
  const c = document.getElementById('map-container');
  const zoomG = document.getElementById('map-zoom');
  let st = {k:1,x:0,y:0,drag:false,sx:0,sy:0,ox:0,oy:0};
  const clamp = () => {
    const minX = 960 - 960*st.k, minY = 500 - 500*st.k;
    st.x = Math.min(0, Math.max(minX, st.x));
    st.y = Math.min(0, Math.max(minY, st.y));
  };
  const apply = () => {
    zoomG.setAttribute('transform', `translate(${st.x},${st.y}) scale(${st.k})`);
    mapPins.forEach(p => {
      if(p.el) p.el.setAttribute('transform', `translate(${(st.x + p.x*st.k).toFixed(1)},${(st.y + p.y*st.k).toFixed(1)})`);
    });
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
  preview.innerHTML = boardingPassCard(rec);
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
  if(typeof BREW_ANIM !== 'undefined') {
    const padFn = typeof pad === 'function' ? pad : n => String(n).padStart(3,'0');
    BREW_ANIM.updateDepartureBoard(`${rec.name}  ·  ${rec.origin||'GLOBAL'}  ·  BREW-${padFn(rec.serial||0)}`);
  }
}

function hideMapPreview(){
  const preview = document.getElementById('map-preview');
  preview.classList.remove('visible');
  setTimeout(() => { if(!preview.classList.contains('visible')) preview.style.display = 'none'; }, 220);
}
