/* ===== Brew Book — WORLD MAP =====
   Dotted-stipple Robinson-projection map embedded inside the Recipes screen.
   Toggled in-place by the List/World pill switch — no separate tab.

   Requires (globals loaded before this file):
     d3, d3.geoRobinson (d3-geo-projection), topojson (topojson-client)
   Provides to app.js:
     initWorldView()   – call once when World is first activated
     showWorldView()   – reveal the canvas/SVG layer
     hideWorldView()   – hide it
     ORIGIN_PINS       – read by app.js for the 22-country stat
     METHOD_COLORS     – read by app.js for legend */

/* ---------- PRODUCT RULE — MAP PIN FILTER ----------
   Recipes whose `origin` is "Fusion" or "Modern café" represent invented drinks
   or broad café-culture trends with no single true home country. They receive
   no pin on the world map. Placing a pin for an invented recipe anywhere on
   Earth would be dishonest. These recipes remain fully visible and fully
   featured in List view — their origin label shows as normal on the boarding-
   pass card. Only the map pin is absent, because that absence is honest.
   To change this rule, edit MAP_FUSION_ORIGINS below. */
const MAP_FUSION_ORIGINS = new Set(['Fusion', 'Modern café']);

/* ---------- ORIGIN → PIN DATA ---------- */
/* Precise [lon, lat] centres for each genuine country-of-origin.
   Robinson projection + rotate([-15,0]) places these at their true locations. */
const ORIGIN_PINS = [
  {origin:'Vietnam',     lon:108.0, lat:14.0,  airline:'VIETNAM AIRLINES',  color:'#1a4b8c'},
  {origin:'Spain',       lon:-3.7,  lat:40.4,  airline:'IBERIA',            color:'#cc0000'},
  {origin:'Indonesia',   lon:113.9, lat:-0.8,  airline:'GARUDA INDONESIA',  color:'#0d4f8b'},
  {origin:'Thailand',    lon:100.5, lat:13.7,  airline:'THAI AIRWAYS',      color:'#6b2d8b'},
  {origin:'Greece',      lon:21.8,  lat:39.0,  airline:'AEGEAN AIR',        color:'#003087'},
  {origin:'Italy',       lon:12.5,  lat:41.9,  airline:'ITA AIRWAYS',       color:'#009246'},
  {origin:'Portugal',    lon:-8.2,  lat:39.4,  airline:'TAP PORTUGAL',      color:'#006600'},
  {origin:'Mexico',      lon:-102.5,lat:23.6,  airline:'AEROMEXICO',        color:'#0a2240'},
  {origin:'India',       lon:78.9,  lat:20.6,  airline:'AIR INDIA',         color:'#c8102e'},
  {origin:'Cuba',        lon:-77.8, lat:21.5,  airline:'CUBANA',            color:'#003087'},
  {origin:'South Korea', lon:127.8, lat:35.9,  airline:'KOREAN AIR',        color:'#00256c'},
  {origin:'Morocco',     lon:-5.0,  lat:31.8,  airline:'ROYAL AIR MAROC',   color:'#cc0000'},
  {origin:'Hong Kong',   lon:114.2, lat:22.3,  airline:'CATHAY PACIFIC',    color:'#005f6b'},
  {origin:'Turkey',      lon:35.2,  lat:38.9,  airline:'TURKISH AIRLINES',  color:'#c8102e'},
  {origin:'Austria',     lon:14.5,  lat:47.5,  airline:'AUSTRIAN',          color:'#c8102e'},
  {origin:'Malaysia',    lon:109.7, lat:4.2,   airline:'MALAYSIA AIRLINES', color:'#cc0000'},
  {origin:'Brazil',      lon:-51.9, lat:-14.2, airline:'LATAM BRASIL',      color:'#cc0000'},
  {origin:'Senegal',     lon:-14.5, lat:14.5,  airline:'AIR SÉNÉGAL',       color:'#00853e'},
  {origin:'Ethiopia',    lon:40.5,  lat:9.1,   airline:'ETHIOPIAN',         color:'#009a44'},
  {origin:'Yemen',       lon:48.5,  lat:15.6,  airline:'YEMENIA',           color:'#ce1126'},
  {origin:'Taiwan',      lon:120.9, lat:23.7,  airline:'EVA AIR',           color:'#007b40'},
  {origin:'Japan',       lon:138.3, lat:36.2,  airline:'ANA',               color:'#003087'}
];

const METHOD_COLORS = {
  'moka pot': '#cf7f45',
  'instant':  '#7fb069',
  'blended':  '#e8b04b',
  'cezve':    '#a06fbf',
  'other':    '#7f9fc9'
};

/* ---------- MAP DIMENSIONS (projection-space) ---------- */
const WM_W = 960, WM_H = 500;

/* ---------- STATE ---------- */
let wmBuilt        = false;
let wmLand         = null;   // topojson merged land feature
let wmProjection   = null;
let wmTransform    = {k:1, x:0, y:0};
let wmDots         = [];     // pre-computed dot positions in projection space
let wmPins         = [];     // {origin, color, recId, rec, x, y, el}
let wmDotTimer     = null;
let wmRafPending   = false;

/* ---------- HELPERS ---------- */
const _esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- PUBLIC API ---------- */

function initWorldView() {
  if (wmBuilt) { _showLayer(); return; }

  const haveLibs = typeof d3 !== 'undefined'
    && typeof d3.geoRobinson === 'function'
    && typeof topojson !== 'undefined';

  if (!haveLibs) {
    _buildFallbackDots();
    return;
  }

  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(world => { _buildFromTopojson(world); })
    .catch(() => { _buildFallbackDots(); });
}

function showWorldView() {
  const wv = document.getElementById('world-view');
  if (wv) { wv.style.display = 'flex'; wv.removeAttribute('aria-hidden'); }
  if (!wmBuilt) { initWorldView(); }
  _updateAbsentNote();
}

function hideWorldView() {
  const wv = document.getElementById('world-view');
  if (wv) { wv.style.display = 'none'; wv.setAttribute('aria-hidden', 'true'); }
}

/* ---------- BUILD FROM REAL TOPOJSON DATA ---------- */

function _buildFromTopojson(world) {
  wmBuilt = true;

  /* Robinson projection, rotated so Asia isn't cut at the antimeridian */
  const proj = d3.geoRobinson()
    .rotate([-15, 0])
    .fitExtent([[10, 12], [WM_W - 10, WM_H - 18]], {type: 'Sphere'});
  wmProjection = proj;

  /* Merge all country features into a single land polygon for fast containment tests */
  wmLand = topojson.merge(world, world.objects.countries.geometries);

  /* Pre-compute dot field: sample every 4px in projection space */
  _computeDotField(proj, WM_W, WM_H, 4);

  /* Compute pin positions for genuine-origin recipes only */
  _computePins(proj);

  /* Size the canvas to match its container then draw */
  _resizeCanvas();
  _scheduleRedot(wmTransform, true /* immediate */);

  /* Render pin SVG */
  _renderPins();
  _buildLegend();

  /* Wire D3 zoom */
  _setupZoom();

  _showLayer();
  _updateAbsentNote();
}

/* ---------- DOT FIELD ---------- */

function _computeDotField(projection, W, H, step) {
  wmDots = [];
  for (let px = 0; px <= W; px += step) {
    for (let py = 0; py <= H; py += step) {
      const geo = projection.invert([px, py]);
      if (!geo) continue;
      if (d3.geoContains(wmLand, geo)) wmDots.push([px, py]);
    }
  }
}

/* Re-sample the dot field for the VISIBLE REGION at the current zoom so
   screen-space density stays constant regardless of zoom level. */
function _recomputeDotsForZoom(transform) {
  const canvas = document.getElementById('wvCanvas');
  if (!canvas || !wmProjection || !wmLand) return;
  const cw = canvas.width, ch = canvas.height;

  const screenStep = 4;
  const projStep   = screenStep / transform.k;

  /* Visible region bounds in projection space */
  const px0 = (-transform.x / transform.k) - projStep;
  const py0 = (-transform.y / transform.k) - projStep;
  const px1 = ((cw - transform.x) / transform.k) + projStep;
  const py1 = ((ch - transform.y) / transform.k) + projStep;

  const dots = [];
  for (let px = Math.max(0, px0); px <= Math.min(WM_W, px1); px += projStep) {
    for (let py = Math.max(0, py0); py <= Math.min(WM_H, py1); py += projStep) {
      const geo = wmProjection.invert([px, py]);
      if (!geo) continue;
      if (d3.geoContains(wmLand, geo)) dots.push([px, py]);
    }
  }
  wmDots = dots;
}

/* ---------- CANVAS DRAWING ---------- */

function _resizeCanvas() {
  const canvas = document.getElementById('wvCanvas');
  if (!canvas) return;
  const wv = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const w   = wv.clientWidth  || WM_W;
  const h   = wv.clientHeight || WM_H;
  canvas.width  = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
}

function _redrawCanvas(transform) {
  const canvas = document.getElementById('wvCanvas');
  if (!canvas || !wmDots.length) return;
  const ctx = canvas.getContext('2d');
  const cw  = canvas.width, ch = canvas.height;
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, cw, ch);

  /* Deep navy background — the "in-flight, between destinations" night sky */
  ctx.fillStyle = '#070f1a';
  ctx.fillRect(0, 0, cw, ch);

  /* Dots: dark blue-grey at low opacity, matching Brew Mode's night-sky palette */
  ctx.fillStyle = 'rgba(55, 82, 112, 0.58)';
  ctx.beginPath();
  const r  = Math.max(0.8, 1.2 * dpr);
  const k  = transform.k, tx = transform.x * dpr, ty = transform.y * dpr;
  const kd = k * dpr; /* combined scale for dot positions */

  for (const [x, y] of wmDots) {
    const sx = x * kd + tx;
    const sy = y * kd + ty;
    if (sx < -r || sx > cw + r || sy < -r || sy > ch + r) continue;
    ctx.moveTo(sx + r, sy);
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
  }
  ctx.fill();
}

/* Schedule a redraw. During active panning/zooming this fires via rAF.
   After zoom settles (280ms) the dot field is re-sampled at the new level. */
function _scheduleRedot(transform, immediate) {
  if (!wmRafPending) {
    wmRafPending = true;
    requestAnimationFrame(() => {
      wmRafPending = false;
      _redrawCanvas(transform);
    });
  }

  clearTimeout(wmDotTimer);
  if (!immediate) {
    wmDotTimer = setTimeout(() => {
      if (transform.k > 1.05) {
        _recomputeDotsForZoom(transform);
      } else {
        /* Zoom ≈ 1: restore the full-resolution pre-computed field */
        if (wmProjection && wmLand) _computeDotField(wmProjection, WM_W, WM_H, 4);
      }
      _redrawCanvas(transform);
    }, 280);
  }
}

/* ---------- PINS ---------- */

function _recipeHasGenuineOrigin(r) {
  /* The map pin filter rule — see product comment at top of file */
  return r.origin && !MAP_FUSION_ORIGINS.has(r.origin);
}

function _computePins(projection) {
  wmPins = [];
  ORIGIN_PINS.forEach(p => {
    /* Only include recipes with genuine single-country origins */
    const recs = recipes
      .filter(r => r.origin === p.origin && _recipeHasGenuineOrigin(r))
      .sort((a, b) => (a.serial || 0) - (b.serial || 0));
    if (!recs.length) return;

    const n = recs.length;
    recs.forEach((rec, i) => {
      /* Fan out multiple recipes from the same country so pins don't fully overlap */
      const off = i - (n - 1) / 2;
      const lon = p.lon + off * 1.4;
      const lat = p.lat + off * 0.6;
      const xy  = projection([lon, lat]);
      if (!xy) return;
      wmPins.push({
        origin: p.origin, color: p.color,
        recId: rec.id, rec,
        x: xy[0], y: xy[1]
      });
    });
  });
}

function _renderPins() {
  const g = document.getElementById('wvPins');
  if (!g) return;
  g.innerHTML = wmPins.map((p, i) => _pinMarkup(p, i)).join('');
  /* Store el references */
  const els = g.querySelectorAll('.wm-pin');
  wmPins.forEach((p, i) => { p.el = els[i]; });
  _wirePins();
}

function _pinMarkup(p, idx) {
  return `<g class="wm-pin" data-id="${_esc(p.recId)}" data-origin="${_esc(p.origin)}"
      transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})">
    <g class="pin-pulse" style="animation-delay:${(idx * 0.13).toFixed(2)}s">
      <path class="pin-drop"
        d="M0,-19 C-8,-19 -13,-12 -13,-6 C-13,4 0,14 0,14 C0,14 13,4 13,-6 C13,-12 8,-19 0,-19 Z"
        fill="${p.color}" stroke="rgba(255,255,255,0.4)" stroke-width="1.2"/>
      <circle cx="0" cy="-6" r="4"   fill="rgba(255,255,255,.55)"/>
      <circle cx="0" cy="-6" r="1.7" fill="rgba(255,255,255,.95)"/>
    </g>
  </g>`;
}

function _wirePins() {
  document.querySelectorAll('#wvPins .wm-pin').forEach(pin => {
    const id = pin.dataset.id;
    pin.addEventListener('mouseenter',  () => _showPreview(pin, id));
    pin.addEventListener('mouseleave',  _hidePreview);
    pin.addEventListener('touchstart',  () => _showPreview(pin, id), {passive: true});
    pin.addEventListener('click', e => { e.stopPropagation(); openDetail(id, pin); });
  });
}

/* ---------- PREVIEW POPUP ---------- */

function _showPreview(pinEl, id) {
  const rec = recipes.find(r => r.id === id);
  if (!rec) return;
  const preview = document.getElementById('wvPreview');
  if (!preview) return;
  preview.innerHTML = boardingPassCard(rec);
  preview.style.display = 'block';

  /* Position above pin, clamp to viewport */
  const pinRect = pinEl.getBoundingClientRect();
  const wv      = document.getElementById('world-view');
  const wvRect  = wv ? wv.getBoundingClientRect() : {left: 0, top: 0};

  let px = pinRect.left - wvRect.left + pinRect.width / 2 - 140;
  px = Math.min(Math.max(px, 8), (wv ? wv.clientWidth : window.innerWidth) - 292);

  preview.style.visibility = 'hidden';
  preview.style.left = px + 'px';
  preview.style.top  = '0px';

  requestAnimationFrame(() => {
    const h  = preview.offsetHeight;
    const py = Math.max(8, (pinRect.top - wvRect.top) - h - 14);
    preview.style.top        = py + 'px';
    preview.style.visibility = 'visible';
    preview.classList.add('visible');
    if (typeof BREW_ANIM !== 'undefined') BREW_ANIM.initTSAScan(preview.querySelector('.bp-card'));
  });
}

function _hidePreview() {
  const preview = document.getElementById('wvPreview');
  if (!preview) return;
  preview.classList.remove('visible');
  setTimeout(() => {
    if (!preview.classList.contains('visible')) preview.style.display = 'none';
  }, 220);
}

/* ---------- LEGEND ---------- */

function _buildLegend() {
  const el = document.getElementById('wvLegendItems');
  if (!el) return;
  el.innerHTML = Object.entries(METHOD_COLORS).map(([m, c]) =>
    `<div class="legend-item"><span class="legend-dot" style="background:${c}"></span>${m}</div>`
  ).join('');
}

/* ---------- ABSENT NOTE (Fusion recipes not on map) ---------- */

function _updateAbsentNote() {
  const el = document.getElementById('wvAbsentNote');
  if (!el) return;
  const fusionCount = (typeof recipes !== 'undefined')
    ? recipes.filter(r => MAP_FUSION_ORIGINS.has(r.origin)).length
    : 0;
  if (fusionCount > 0) {
    el.textContent = `${fusionCount} fusion recipe${fusionCount > 1 ? 's' : ''} not shown — no single home country`;
  } else {
    el.textContent = '';
  }
}

/* ---------- ZOOM & PAN ---------- */

function _applyTransform(t) {
  wmTransform = {k: t.k, x: t.x, y: t.y};

  /* Move SVG pins — they live in projection space, we re-position in screen space */
  wmPins.forEach(p => {
    if (!p.el) return;
    const sx = p.x * t.k + t.x;
    const sy = p.y * t.k + t.y;
    p.el.setAttribute('transform', `translate(${sx.toFixed(1)},${sy.toFixed(1)})`);
  });

  _hidePreview();
  _scheduleRedot(wmTransform, false);
}

function _setupZoom() {
  const wv  = document.getElementById('world-view');
  const svg = document.getElementById('wvSvg');
  if (!wv || !svg) return;

  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', ev => { _applyTransform(ev.transform); });

  /* Bind zoom to the container div but also make SVG a passthrough */
  d3.select(wv).call(zoom).on('dblclick.zoom', null);

  /* Keep pans bounded: don't let user scroll into void */
  zoom.translateExtent([[0, 0], [WM_W, WM_H]]);
}

/* ---------- FALLBACK (no D3 available) ---------- */

function _buildFallbackDots() {
  wmBuilt = true;
  /* Simple equirectangular approximation for pin placement */
  const proj = ll => {
    const lon = ll[0], lat = ll[1];
    const x = ((lon - (-15) + 180 + 360) % 360) / 360 * WM_W;
    const y = (90 - lat) / 180 * WM_H;
    return [x, y];
  };
  wmProjection = {invert: null}; /* signal that geoContains is unavailable */

  _computePinsWithFn(proj);
  _renderPins();
  _buildLegend();

  const canvas = document.getElementById('wvCanvas');
  if (canvas) {
    _resizeCanvas();
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#070f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    /* Simple dot pattern without geographic accuracy */
    ctx.fillStyle = 'rgba(55, 82, 112, 0.45)';
    for (let x = 0; x < canvas.width; x += 6) {
      for (let y = 0; y < canvas.height; y += 6) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }
  }

  _showLayer();
}

function _computePinsWithFn(projection) {
  wmPins = [];
  ORIGIN_PINS.forEach(p => {
    const recs = recipes
      .filter(r => r.origin === p.origin && _recipeHasGenuineOrigin(r))
      .sort((a, b) => (a.serial || 0) - (b.serial || 0));
    if (!recs.length) return;
    const n = recs.length;
    recs.forEach((rec, i) => {
      const off = i - (n - 1) / 2;
      const xy  = projection([p.lon + off * 1.4, p.lat + off * 0.6]);
      if (!xy) return;
      wmPins.push({origin: p.origin, color: p.color, recId: rec.id, rec, x: xy[0], y: xy[1]});
    });
  });
}

/* ---------- LAYER SHOW/HIDE ---------- */

function _showLayer() {
  const wv = document.getElementById('world-view');
  if (wv) { wv.style.display = 'flex'; wv.removeAttribute('aria-hidden'); }
}
