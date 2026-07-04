/* ===== Brew Book — WORLD MAP =====
   Per-country dotted-stipple Robinson-projection map (standalone World tab).

   Requires (globals loaded before this file):
     d3, d3.geoRobinson (d3-geo-projection), topojson (topojson-client)
   Provides to app.js:
     initWorldMap()  – call once when World tab is first shown (idempotent)
     ORIGIN_PINS     – 22-country pin table (read by app.js for stat display)

   PRODUCT RULE: Only recipes with a genuine single-country origin get a pin.
   Recipes with origin "Fusion" or "Modern café" are excluded — placing them
   anywhere on Earth would be dishonest. They remain fully visible in the
   Recipes tab. See MAP_FUSION_ORIGINS below to change the exclusion list. */

const MAP_FUSION_ORIGINS = new Set(['Fusion', 'Modern café']);

/* Precise [lon, lat] centres for each genuine country-of-origin.
   Colors mirror the airline/card-stripe accent already used on recipe cards. */
const ORIGIN_PINS = [
  {origin:'Vietnam',     lon:108.0, lat:14.0,  airline:'VIETNAM AIRLINES',  color:'#1a6bbf'},
  {origin:'Spain',       lon:-3.7,  lat:40.4,  airline:'IBERIA',            color:'#d44040'},
  {origin:'Indonesia',   lon:113.9, lat:-0.8,  airline:'GARUDA INDONESIA',  color:'#0d6bbf'},
  {origin:'Thailand',    lon:100.5, lat:13.7,  airline:'THAI AIRWAYS',      color:'#7b3dbf'},
  {origin:'Greece',      lon:21.8,  lat:39.0,  airline:'AEGEAN AIR',        color:'#2255aa'},
  {origin:'Italy',       lon:12.5,  lat:41.9,  airline:'ITA AIRWAYS',       color:'#009246'},
  {origin:'Portugal',    lon:-8.2,  lat:39.4,  airline:'TAP PORTUGAL',      color:'#007a30'},
  {origin:'Mexico',      lon:-102.5,lat:23.6,  airline:'AEROMEXICO',        color:'#1a4075'},
  {origin:'India',       lon:78.9,  lat:20.6,  airline:'AIR INDIA',         color:'#c8102e'},
  {origin:'Cuba',        lon:-77.8, lat:21.5,  airline:'CUBANA',            color:'#2060aa'},
  {origin:'South Korea', lon:127.8, lat:35.9,  airline:'KOREAN AIR',        color:'#1a3a8a'},
  {origin:'Morocco',     lon:-5.0,  lat:31.8,  airline:'ROYAL AIR MAROC',   color:'#c8102e'},
  {origin:'Hong Kong',   lon:114.2, lat:22.3,  airline:'CATHAY PACIFIC',    color:'#006870'},
  {origin:'Turkey',      lon:35.2,  lat:38.9,  airline:'TURKISH AIRLINES',  color:'#c8102e'},
  {origin:'Austria',     lon:14.5,  lat:47.5,  airline:'AUSTRIAN',          color:'#c8102e'},
  {origin:'Malaysia',    lon:109.7, lat:4.2,   airline:'MALAYSIA AIRLINES', color:'#c8102e'},
  {origin:'Brazil',      lon:-51.9, lat:-14.2, airline:'LATAM BRASIL',      color:'#c8102e'},
  {origin:'Senegal',     lon:-14.5, lat:14.5,  airline:'AIR SÉNÉGAL',       color:'#00853e'},
  {origin:'Ethiopia',    lon:40.5,  lat:9.1,   airline:'ETHIOPIAN',         color:'#009a44'},
  {origin:'Yemen',       lon:48.5,  lat:15.6,  airline:'YEMENIA',           color:'#ce1126'},
  {origin:'Taiwan',      lon:120.9, lat:23.7,  airline:'EVA AIR',           color:'#007b40'},
  {origin:'Japan',       lon:138.3, lat:36.2,  airline:'ANA',               color:'#1a3a8a'}
];

/* ---------- MAP DIMENSIONS (projection-space) ---------- */
const WM_W = 960, WM_H = 500;

/* Pre-computed star positions for the night-sky atmosphere (deterministic). */
const WM_STARS = Array.from({length: 42}, (_, i) => ({
  x: ((i * 127 + 37) % 997) / 997,
  y: ((i * 239 + 73) % 991) / 991,
  r: 0.5 + ((i * 31) % 10) / 22,
  a: 0.06 + ((i * 53) % 12) / 120
}));

/* ---------- STATE ---------- */
let wmBuilt        = false;
let wmLand         = null;
let wmProjection   = null;
let wmTransform    = {k: 1, x: 0, y: 0};
let wmDots         = [];
let wmCountryPins  = [];  /* {origin, color, airline, recs[], x, y, el} — one per country */
let wmDotTimer     = null;
let wmRafPending   = false;
let wmZoom         = null;
let wmFitW         = WM_W;   /* actual fitted map width  (set after canvas is sized) */
let wmFitH         = WM_H;   /* actual fitted map height */

/* ---------- HELPERS ---------- */
const _esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function _recipeHasGenuineOrigin(r) {
  return r.origin && !MAP_FUSION_ORIGINS.has(r.origin);
}

/* Pin "livery": each pin's glow + glossy gradient fill are derived from its
   own base colour (rather than a small hardcoded lookup table, since our
   pin palette spans ~20 airline colours vs. the design reference's four) —
   lighten for the glow/top gradient stop, darken for the bottom stop,
   matching brew_book_worldmap_reference.html's LIVERY relationships. */
function _pinLivery(hex) {
  return {
    glow: hexToRgb(hexLighten(hex, 30)),
    g1:   hexLighten(hex, 26),
    g2:   hexLighten(hex, -34)
  };
}

/* ---------- PUBLIC API ---------- */

function initWorldMap() {
  if (wmBuilt) return;

  const haveLibs = typeof d3 !== 'undefined'
    && typeof d3.geoRobinson === 'function'
    && typeof topojson !== 'undefined';

  if (!haveLibs) { _buildFallback(); return; }

  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(world => _buildFromTopojson(world))
    .catch(() => _buildFallback());
}

/* ---------- BUILD ---------- */

function _buildFromTopojson(world) {
  wmBuilt = true;

  /* Fit the projection to the actual container dimensions so the map fills
     the full screen rather than leaving an empty band at the bottom. */
  _resizeCanvas();
  const canvas = document.getElementById('wvCanvas');
  const fitW = canvas ? (canvas.clientWidth  || WM_W) : WM_W;
  const fitH = canvas ? (canvas.clientHeight || WM_H) : WM_H;

  const proj = d3.geoRobinson()
    .rotate([-15, 0])
    .fitExtent([[10, Math.round(fitH * 0.024)], [fitW - 10, fitH - Math.round(fitH * 0.036)]], {type: 'Sphere'});
  wmProjection = proj;
  /* Store fitted size so zoom translateExtent can use it */
  wmFitW = fitW;
  wmFitH = fitH;

  wmLand = topojson.merge(world, world.objects.countries.geometries);

  _computeDotField(proj, fitW, fitH, 4);
  _computeCountryPins(proj);

  _redrawCanvas(wmTransform);

  _renderPins();
  _wireControls();
  _updateAbsentNote();
  _setupZoom();
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

function _recomputeDotsForZoom(transform) {
  const canvas = document.getElementById('wvCanvas');
  if (!canvas || !wmProjection || !wmLand) return;
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.width, ch = canvas.height;

  const projStep = 4 / transform.k;
  const px0 = (-transform.x / transform.k) - projStep;
  const py0 = (-transform.y / transform.k) - projStep;
  const px1 = ((cw / dpr - transform.x) / transform.k) + projStep;
  const py1 = ((ch / dpr - transform.y) / transform.k) + projStep;

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

/* ---------- CANVAS RENDERING ---------- */

function _resizeCanvas() {
  const canvas = document.getElementById('wvCanvas');
  if (!canvas) return;
  const parent = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const w   = parent.clientWidth  || WM_W;
  const h   = parent.clientHeight || WM_H;
  canvas.width  = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
}

function _redrawCanvas(transform) {
  const canvas = document.getElementById('wvCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cw  = canvas.width, ch = canvas.height;
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, cw, ch);

  /* Deep navy night-sky gradient */
  const bg = ctx.createRadialGradient(cw * 0.5, ch * 0.38, 0, cw * 0.5, ch * 0.52, cw * 0.72);
  bg.addColorStop(0,    '#12233d');
  bg.addColorStop(0.45, '#0b1729');
  bg.addColorStop(1,    '#081324');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cw, ch);

  /* Subtle top radial glow */
  const glow = ctx.createRadialGradient(cw * 0.5, ch * 0.12, 0, cw * 0.5, ch * 0.12, cw * 0.42);
  glow.addColorStop(0, 'rgba(30, 90, 185, 0.10)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, cw, ch);

  /* Static stars */
  ctx.beginPath();
  WM_STARS.forEach(s => {
    const sx = s.x * cw, sy = s.y * ch, r = s.r * dpr;
    ctx.moveTo(sx + r, sy);
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
  });
  ctx.fillStyle = 'rgba(190, 215, 255, 0.25)';
  ctx.fill();

  /* Faint latitude grid lines */
  if (wmProjection) _drawGridLines(ctx, transform, dpr, cw, ch);

  /* Land dots — soft blue, single beginPath for performance */
  if (wmDots.length) {
    const r  = Math.max(0.8, 1.1 * dpr);
    const k  = transform.k;
    const kd = k * dpr;
    const tx = transform.x * dpr, ty = transform.y * dpr;

    ctx.beginPath();
    for (const [x, y] of wmDots) {
      const sx = x * kd + tx, sy = y * kd + ty;
      if (sx < -r || sx > cw + r || sy < -r || sy > ch + r) continue;
      ctx.moveTo(sx + r, sy);
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = 'rgba(125, 163, 212, 0.44)';
    ctx.fill();
  }
}

function _drawGridLines(ctx, transform, dpr, cw, ch) {
  const k  = transform.k;
  const kd = k * dpr;
  const tx = transform.x * dpr, ty = transform.y * dpr;

  ctx.save();
  ctx.strokeStyle = 'rgba(125, 163, 212, 0.055)';
  ctx.lineWidth   = dpr;

  [-60, -30, 0, 30, 60].forEach(lat => {
    ctx.beginPath();
    let started = false;
    for (let lon = -180; lon <= 180; lon += 3) {
      const xy = wmProjection([lon, lat]);
      if (!xy) { started = false; continue; }
      const sx = xy[0] * kd + tx, sy = xy[1] * kd + ty;
      if (!started) { ctx.moveTo(sx, sy); started = true; }
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  });
  ctx.restore();
}

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
        if (wmProjection && wmLand) _computeDotField(wmProjection, WM_W, WM_H, 4);
      }
      _redrawCanvas(transform);
    }, 280);
  }
}

/* ---------- PER-COUNTRY PINS ---------- */

function _computeCountryPins(projection) {
  wmCountryPins = [];
  ORIGIN_PINS.forEach(p => {
    const recs = recipes
      .filter(r => r.origin === p.origin && _recipeHasGenuineOrigin(r))
      .sort((a, b) => (a.serial || 0) - (b.serial || 0));
    if (!recs.length) return;

    const xy = projection([p.lon, p.lat]);
    if (!xy) return;

    wmCountryPins.push({
      origin:  p.origin,
      color:   p.color,
      airline: p.airline,
      recs,
      x: xy[0],
      y: xy[1],
      el: null
    });
  });
}

function _renderPins() {
  const g = document.getElementById('wvPins');
  if (!g) return;
  g.innerHTML = wmCountryPins.map((p, i) => _pinMarkup(p, i)).join('');
  const els = g.querySelectorAll('.wm-pin');
  wmCountryPins.forEach((p, i) => { p.el = els[i]; });
  _wirePinClicks();
}

function _pinMarkup(p, idx) {
  const count = p.recs.length;
  const delayGlow = (idx * 0.22).toFixed(2);
  const lv = _pinLivery(p.color);
  const gradId = `pinGrad-${idx}`;
  const label = _esc(p.origin.toUpperCase());
  const labelW = Math.max(30, label.length * 6.4 + 14);
  return `<g class="wm-pin" data-origin="${_esc(p.origin)}"
      transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})">
    <defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${lv.g1}"/><stop offset="100%" stop-color="${lv.g2}"/>
    </linearGradient></defs>
    <circle class="pin-glow" cx="0" cy="0" r="16" fill="rgb(${lv.glow})" opacity="0.5"
      style="animation-delay:${delayGlow}s"/>
    <circle cx="0" cy="0" r="12" fill="url(#${gradId})" stroke="rgba(255,255,255,0.32)" stroke-width="1.4"/>
    <text class="pin-cup" x="0" y="5" text-anchor="middle" dominant-baseline="auto">☕</text>
    ${count > 1 ? `<g class="pin-badge">
      <circle cx="10" cy="-10" r="8" fill="url(#pinBadgeGrad)" stroke="#081324" stroke-width="1.5"/>
      <text x="10" y="-6.7" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#fff">${count}</text>
    </g>` : ''}
    <g class="wm-country-label-wrap">
      <rect x="${(-labelW / 2).toFixed(1)}" y="19" width="${labelW.toFixed(1)}" height="16" rx="6" fill="rgba(8,16,30,.8)"/>
      <text class="wm-country-label" x="0" y="30" text-anchor="middle">${label}</text>
    </g>
  </g>`;
}

function _wirePinClicks() {
  document.querySelectorAll('#wvPins .wm-pin').forEach(pin => {
    const origin = pin.dataset.origin;
    const cp = wmCountryPins.find(p => p.origin === origin);
    if (!cp) return;
    pin.addEventListener('click', e => { e.stopPropagation(); _showPopup(pin, cp); });
    pin.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _showPopup(pin, cp); }
    });
    pin.setAttribute('tabindex', '0');
    pin.setAttribute('role', 'button');
    pin.setAttribute('aria-label', `${cp.origin}: ${cp.recs.length} recipe${cp.recs.length > 1 ? 's' : ''}`);
  });

  const wv = document.getElementById('world-view');
  if (wv) {
    wv.addEventListener('click', e => {
      if (!e.target.closest('.wm-popup') && !e.target.closest('.wm-pin')) _closePopup();
    });
  }
}

/* ---------- COUNTRY POPUP ---------- */

function _showPopup(pinEl, cp) {
  _closePopup();
  const popup = document.getElementById('wvPreview');
  if (!popup) return;

  const rowsHTML = cp.recs.map(r => {
    const catId    = getStyleCategory(r);
    const catLabel = (STYLE_CATEGORIES.find(c => c.id === catId) || {}).label || '';
    const meta     = [r.method, catLabel].filter(Boolean).join(' · ');
    return `
    <div class="wm-popup-row" data-id="${_esc(r.id)}" tabindex="0" role="button" aria-label="Open ${_esc(r.name)}">
      <span class="wm-popup-dot" style="background:${_esc(cp.color)}"></span>
      <div class="wm-popup-info">
        <div class="wm-popup-name">${_esc(r.name)}</div>
        <div class="wm-popup-meta">${_esc(meta)}</div>
      </div>
      ${r.ratio ? `<span class="wm-popup-ratio">${_esc(r.ratio)}</span>` : ''}
    </div>`;
  }).join('');

  popup.innerHTML = `
    <div class="wm-popup-head">
      <div class="wm-popup-head-text">
        <div class="wm-popup-eyebrow">${_esc(cp.airline)}</div>
        <div class="wm-popup-country">${_esc(cp.origin)}</div>
      </div>
      <button class="wm-popup-close" aria-label="Close">✕</button>
    </div>
    <div class="wm-popup-body">${rowsHTML}</div>`;

  popup.querySelectorAll('.wm-popup-row[data-id]').forEach(row => {
    const go = () => { _closePopup(); openDetail(row.dataset.id, row); };
    row.addEventListener('click', go);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  popup.querySelector('.wm-popup-close').addEventListener('click', e => { e.stopPropagation(); _closePopup(); });

  popup.style.display = 'block';
  popup.style.visibility = 'hidden';

  const wv     = document.getElementById('world-view');
  const wvRect = wv ? wv.getBoundingClientRect() : {left: 0, top: 0};
  const wvW    = wv ? wv.clientWidth  : 300;
  const wvH    = wv ? wv.clientHeight : 300;
  const pinRect = pinEl.getBoundingClientRect();

  requestAnimationFrame(() => {
    const pw = popup.offsetWidth  || 240;
    const ph = popup.offsetHeight || 120;

    let px = pinRect.left - wvRect.left + pinRect.width / 2 - pw / 2;
    px = Math.min(Math.max(px, 8), wvW - pw - 8);

    let py = (pinRect.top - wvRect.top) - ph - 20;
    if (py < 8) py = (pinRect.top - wvRect.top) + pinRect.height + 14;
    py = Math.min(Math.max(py, 8), wvH - ph - 8);

    popup.style.left = px + 'px';
    popup.style.top  = py + 'px';
    popup.style.visibility = 'visible';
    popup.classList.add('visible');
  });
}

function _closePopup() {
  const popup = document.getElementById('wvPreview');
  if (!popup) return;
  popup.classList.remove('visible');
  popup.style.display = 'none';
}

/* ---------- ABSENT NOTE ---------- */

function _updateAbsentNote() {
  const el = document.getElementById('wvAbsentNote');
  if (!el) return;
  const n = (typeof recipes !== 'undefined')
    ? recipes.filter(r => MAP_FUSION_ORIGINS.has(r.origin)).length
    : 0;
  el.textContent = n > 0
    ? `${n} fusion recipe${n > 1 ? 's' : ''} not shown — no single home country`
    : '';
}

/* ---------- ZOOM CONTROLS ---------- */

function _wireControls() {
  const zI = document.getElementById('wvZoomIn');
  const zO = document.getElementById('wvZoomOut');
  const zR = document.getElementById('wvZoomReset');
  if (zI) zI.addEventListener('click', () => _zoomBy(1.45));
  if (zO) zO.addEventListener('click', () => _zoomBy(1 / 1.45));
  if (zR) zR.addEventListener('click', _zoomReset);
}

function _zoomBy(factor) {
  if (!wmZoom) return;
  const wv = document.getElementById('world-view');
  if (!wv) return;
  d3.select(wv).transition().duration(300).call(wmZoom.scaleBy, factor);
}

function _zoomReset() {
  if (!wmZoom) return;
  const wv = document.getElementById('world-view');
  if (!wv) return;
  d3.select(wv).transition().duration(420).call(wmZoom.transform, d3.zoomIdentity);
}

/* ---------- ZOOM & PAN ---------- */

function _applyTransform(t) {
  wmTransform = {k: t.k, x: t.x, y: t.y};

  /* Zoom % readout */
  const pct = document.getElementById('wvZoomPct');
  if (pct) pct.textContent = Math.round(t.k * 100) + '%';

  /* Reposition pins + counter-scale so they stay the same visual size */
  const inv = (1 / t.k).toFixed(3);
  wmCountryPins.forEach(p => {
    if (!p.el) return;
    const sx = p.x * t.k + t.x;
    const sy = p.y * t.k + t.y;
    p.el.setAttribute('transform', `translate(${sx.toFixed(1)},${sy.toFixed(1)}) scale(${inv})`);
  });

  /* Country labels fade in only once zoomed in past ~1.2x, fully visible by
     2x — matches brew_book_worldmap_reference.html's labelOpacity ramp. */
  const labelAlpha = t.k < 1.2 ? 0 : Math.min(1, (t.k - 1.2) / 0.8);
  document.querySelectorAll('.wm-country-label-wrap').forEach(el => {
    el.style.opacity = labelAlpha.toFixed(2);
  });

  _closePopup();
  _scheduleRedot(wmTransform, false);
}

function _setupZoom() {
  const wv = document.getElementById('world-view');
  if (!wv) return;

  wmZoom = d3.zoom()
    .scaleExtent([1, 5])
    .on('zoom', ev => _applyTransform(ev.transform));

  d3.select(wv).call(wmZoom).on('dblclick.zoom', null);
  wmZoom.translateExtent([[0, 0], [wmFitW, wmFitH]]);
}

/* ---------- FALLBACK (no D3 available) ---------- */

function _buildFallback() {
  wmBuilt = true;
  const proj = ([lon, lat]) => {
    const x = ((lon + 15 + 180) % 360) / 360 * WM_W;
    const y = (90 - lat) / 180 * WM_H;
    return [x, y];
  };

  wmCountryPins = [];
  ORIGIN_PINS.forEach(p => {
    const recs = recipes
      .filter(r => r.origin === p.origin && _recipeHasGenuineOrigin(r))
      .sort((a, b) => (a.serial || 0) - (b.serial || 0));
    if (!recs.length) return;
    const xy = proj([p.lon, p.lat]);
    wmCountryPins.push({origin: p.origin, color: p.color, airline: p.airline, recs, x: xy[0], y: xy[1], el: null});
  });

  _renderPins();
  _wireControls();
  _updateAbsentNote();

  const canvas = document.getElementById('wvCanvas');
  if (canvas) {
    _resizeCanvas();
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0b1729';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
