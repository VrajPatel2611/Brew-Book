/* ===== Brew Book — APP LOGIC =====
   Storage (localStorage / Claude artifact), rendering, cinematic detail view,
   Brew Mode, the add/edit form, search/filter/sort, and init.
   Loads LAST; all init runs here after data/icons/animations are available. */

/* ---------- storage (Claude artifact OR normal browser) ---------- */
const hasClaudeStorage = typeof window.storage !== 'undefined' && window.storage && typeof window.storage.get === 'function';
async function storeGet(){
  if(hasClaudeStorage){ const r = await window.storage.get(STORE_KEY); return r ? r.value : null; }
  return localStorage.getItem(STORE_KEY);
}
async function storeSet(value){
  if(hasClaudeStorage){ const r = await window.storage.set(STORE_KEY, value); return !!r; }
  localStorage.setItem(STORE_KEY, value); return true;
}

async function loadRecipes(){
  let saved = null;
  try{ saved = await storeGet(); }catch(e){ saved = null; }
  if(saved){ try{ recipes = JSON.parse(saved); }catch(e){ recipes = []; } } else { recipes = []; }
  let deletedSeeds = [];
  try{ deletedSeeds = JSON.parse(localStorage.getItem(STORE_KEY + '-removed') || '[]'); }catch(e){}
  let added = false;
  for(const s of SEED){
    if(!recipes.some(r => r.id === s.id) && !deletedSeeds.includes(s.id)){ recipes.push({...s}); added = true; }
  }
  if(added) await saveRecipes(true);
  render();
}
async function saveRecipes(silent){
  try{
    const ok = await storeSet(JSON.stringify(recipes));
    if(!ok && !silent) showToast('Couldn\u2019t save — try again');
  }catch(e){ if(!silent) showToast('Couldn\u2019t save — try again'); }
}
function rememberSeedDeletion(id){
  if(!id.startsWith('seed-')) return;
  try{
    const k = STORE_KEY + '-removed';
    const arr = JSON.parse(localStorage.getItem(k) || '[]');
    if(!arr.includes(id)){ arr.push(id); localStorage.setItem(k, JSON.stringify(arr)); }
  }catch(e){}
}

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(3,'0');
function fmtDate(ts){ if(!ts) return ''; const d = new Date(ts); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function dateInputVal(ts){ const d = ts ? new Date(ts) : new Date(); return d.toISOString().slice(0,10); }
function nextSerial(){ return recipes.reduce((m,r)=>Math.max(m, r.serial||0), 0) + 1; }

function showToast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2400); }
function buySectionHTML(id){
  const picks = ROASTER_PICKS[id];
  if(!picks || (!picks.bluetokai && !picks.thirdwave)) return '';
  const bt = picks.bluetokai || [], tw = picks.thirdwave || [];
  return `
    <button class="buy-toggle" data-buy-toggle>
      <span>🛒 Which beans to buy (Blue Tokai · Third Wave)</span>
      <span class="chev">▾</span>
    </button>
    <div class="buy-body" data-buy-body>
      ${bt.length ? `<div class="roaster bt"><h4><span class="pin"></span>Blue Tokai</h4><div class="pick-label">Best pick for this drink</div><ul>${bt.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${tw.length ? `<div class="roaster tw"><h4><span class="pin"></span>Third Wave</h4><div class="pick-label">Best pick for this drink</div><ul>${tw.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    </div>`;
}

/* ---------- chips built once, only active state updates on render ---------- */
function buildChips(){
  const chipsEl = document.getElementById('methodChips');
  chipsEl.innerHTML = METHODS.map(m => `<button class="chip" data-method="${m}">${m}</button>`).join('');
  chipsEl.addEventListener('click', e => { const b = e.target.closest('.chip'); if(!b) return; activeMethod = b.dataset.method; animateNext = true; render(); });

  const triedEl = document.getElementById('triedChips');
  const tFilters = [['all','All'],['totry','To try'],['tried','Made it']];
  triedEl.innerHTML = tFilters.map(([v,l]) => `<button class="chip tried" data-tried="${v}">${l}</button>`).join('');
  triedEl.addEventListener('click', e => { const b = e.target.closest('.chip'); if(!b) return; triedFilter = b.dataset.tried; animateNext = true; render(); });
}
function syncChips(){
  document.querySelectorAll('#methodChips .chip').forEach(b => b.classList.toggle('active', b.dataset.method === activeMethod));
  document.querySelectorAll('#triedChips .chip').forEach(b => b.classList.toggle('active', b.dataset.tried === triedFilter));
}

/* ---------- render ---------- */
function render(){
  document.getElementById('countPill').textContent = recipes.length + (recipes.length === 1 ? ' brew' : ' brews');
  syncChips();

  const content = document.getElementById('content');
  let list = recipes.slice();
  if(activeMethod !== 'all') list = list.filter(r => r.method === activeMethod);
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

  if(list.length === 0){
    content.innerHTML = `<div class="empty"><div class="ring"></div><h2>${recipes.length === 0 ? 'No brews yet' : 'Nothing matches'}</h2><p>${recipes.length === 0 ? 'Tap “New recipe” to write your first one.' : 'Try a different search or filter.'}</p></div>`;
    return;
  }

  content.innerHTML = `<div class="grid">` + list.map(r => `
    <button class="card ${r.tried?'is-tried':''}" data-id="${r.id}">
      <span class="serial">#${pad(r.serial||0)}</span>
      <div class="card-top">
        <h3>${esc(r.name)}</h3>
        ${r.ratio ? `<span class="ratio-badge"><svg class="rb-steam" viewBox="0 0 34 18" aria-hidden="true"><path d="M9 17 C6 12,12 9,9 3"/><path d="M17 17 C14 12,20 9,17 3"/><path d="M25 17 C22 12,28 9,25 3"/></svg>${esc(r.ratio)}</span>` : ''}
      </div>
      ${r.description ? `<p class="desc">${esc(r.description)}</p>` : ''}
      <div class="card-meta">
        <span class="method-tag"><span class="gear">${methodIcon(r.method)}</span>${esc(r.method)}</span>
        ${r.origin ? `<span class="origin-tag">${esc(r.origin)}</span>` : ''}
        ${beansRow(r.strength || 3)}
      </div>
      <div class="card-foot">
        <span class="date-txt">${fmtDate(r.createdAt)}</span>
        ${r.tried ? `<span class="made-badge">✓ Made it ${r.rating?starsRow(r.rating):''}</span>` : `<span class="totry-badge">To try</span>`}
      </div>
    </button>`).join('') + `</div>`;
  if(animateNext){
    const grid = content.querySelector('.grid');
    if(grid){ grid.classList.add('enter'); }
    animateNext = false;
  }
}

/* ---------- detail ---------- */
function openDetail(id, origin, instant){
  const r = recipes.find(x => x.id === id);
  if(!r) return;
  const sheet = document.getElementById('detailSheet');
  const prevScroll = instant ? sheet.scrollTop : 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  sheet.innerHTML = `
    <div class="detail-topbar">
      <div class="scroll-prog"><div class="scroll-prog-bar" data-prog></div></div>
      <button class="close-btn" data-close aria-label="Close">✕</button>
    </div>
    <section class="story-hero">
      <div class="hero-gear">${methodIcon(r.method)}</div>
      <span class="serial">Brew #${pad(r.serial||0)} · added ${fmtDate(r.createdAt)}</span>
      <h2 class="hero-name">${esc(r.name)}</h2>
      ${r.description ? `<p class="hero-desc">${esc(r.description)}</p>` : ''}
      <div class="hero-meta">
        ${r.ratio ? `<span class="ratio-badge">${esc(r.ratio)}${r.ratioLabel ? ' · ' + esc(r.ratioLabel) : ''}</span>` : ''}
        <span class="method-tag"><span class="gear">${methodIcon(r.method)}</span>${esc(r.method)}</span>
        ${r.origin ? `<span class="origin-tag">${esc(r.origin)}</span>` : ''}
        ${beansRow(r.strength || 3)}
      </div>
      ${r.story ? `<div class="story-label">The Story</div><p class="story-text">${esc(r.story)}</p>` : ''}
      <div class="scroll-hint" data-hint>Scroll for the recipe <span class="chev">↓</span></div>
    </section>
    <div class="detail-body">
      <div class="made-panel reveal">
        <button class="made-toggle ${r.tried?'on':''}" data-toggle-made><span class="box">✓</span>${r.tried ? 'Made it' : 'Mark as made'}<span class="puff"></span><span class="puff"></span><span class="puff"></span><span class="puff"></span><span class="puff"></span></button>
        <div class="rate-wrap">
          <span class="rate-label">Your rating</span>
          <div class="rate-stars" data-rate aria-label="Your rating">
            ${[1,2,3,4,5].map(i=>`<button data-star="${i}" class="${i<=(r.rating||0)?'on':''}" aria-label="${i} star">★</button>`).join('')}
          </div>
        </div>
      </div>
      ${r.bean ? `<div class="section-label reveal">Beans for this brew</div><div class="bean-box reveal"><span class="ico">🫘</span><span>${esc(r.bean)}</span></div>` : ''}
      <div class="reveal">${buySectionHTML(r.id)}</div>
      <div class="section-label reveal">Ingredients</div>
      <ul class="ing-list">${(r.ingredients||[]).map((i,idx)=>`<li class="reveal" style="transition-delay:${Math.min(idx*55,330)}ms">${ingredientIcon(i)}<span>${esc(i)}</span></li>`).join('')}</ul>
      <div class="section-label reveal">Steps</div>
      <ol class="step-list">${(r.steps||[]).map((s,idx)=>{const st=(typeof s==='string')?{c:s}:s; return `<li class="reveal ${idx%2?'reveal-right':'reveal-left'}"><div class="step-c">${st.t?`<strong class="step-t">${esc(st.t)}:</strong> `:''}${esc(st.c)}</div></li>`;}).join('')}</ol>
      ${r.notes ? `<div class="section-label reveal">Notes</div><div class="notes-box reveal">${esc(r.notes)}</div>` : ''}
      ${(r.steps&&r.steps.length) ? `<button class="btn primary brew-start reveal" data-brew><svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 3l9 5-9 5V3z" fill="currentColor"/></svg> Start brewing</button>` : ''}
      <div class="detail-actions reveal">
        <button class="btn" data-edit>Edit</button>
        <button class="btn danger" data-delete>Delete</button>
      </div>
    </div>`;

  // scroll-driven reveal
  const reveals = sheet.querySelectorAll('.reveal');
  if(instant || reduceMotion){
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { root: sheet, threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  }
  // scroll progress + hint
  const progBar = sheet.querySelector('[data-prog]');
  const hint = sheet.querySelector('[data-hint]');
  const heroGear = sheet.querySelector('.hero-gear');
  const heroInner = sheet.querySelector('.story-hero');
  sheet.onscroll = () => {
    const top = sheet.scrollTop;
    const max = sheet.scrollHeight - sheet.clientHeight;
    if(progBar) progBar.style.width = (max>0 ? top/max*100 : 0) + '%';
    if(hint && top > 40) hint.classList.add('hide');
    if(heroGear && !reduceMotion){
      heroGear.style.transform = `translateY(${top*0.35}px) rotate(${-8 + top*0.03}deg) scale(${1 + top*0.0006})`;
    }
    if(heroInner && !reduceMotion){
      const fade = Math.max(0, 1 - Math.max(0, top-60)/380);
      heroInner.style.opacity = (0.3 + 0.7*fade).toFixed(3);
    }
  };

  sheet.querySelector('[data-close]').onclick = closePanels;
  const buyToggle = sheet.querySelector('[data-buy-toggle]');
  if(buyToggle) buyToggle.onclick = () => {
    buyToggle.classList.toggle('open');
    sheet.querySelector('[data-buy-body]').classList.toggle('open');
  };
  const brewBtn = sheet.querySelector('[data-brew]');
  if(brewBtn) brewBtn.onclick = () => startBrew(id);
  const madeBtn = sheet.querySelector('[data-toggle-made]');
  madeBtn.onclick = async () => {
    const nowTried = !r.tried;
    r.tried = nowTried;
    if(!r.tried) r.rating = 0;
    await saveRecipes(); render();
    if(nowTried){
      madeBtn.classList.add('on');
      madeBtn.innerHTML = '<span class="box">✓</span>Made it' + '<span class="puff"></span>'.repeat(5);
      void madeBtn.offsetWidth;
      madeBtn.classList.add('celebrate');
      const br = madeBtn.getBoundingClientRect();
      beanBurst(br.left + br.width/2, br.top + br.height/2, 16);
      showToast('Marked as made ✓');
      setTimeout(() => openDetail(id, null, true), 760);
    } else {
      openDetail(id, null, true);
      showToast('Moved back to “to try”');
    }
  };
  sheet.querySelectorAll('[data-rate] button').forEach(b => b.onclick = async () => {
    const v = +b.dataset.star;
    r.rating = (r.rating === v ? v - 1 : v);
    if(r.rating > 0) r.tried = true;
    await saveRecipes(); openDetail(id, null, true); render();
  });
  sheet.querySelector('[data-edit]').onclick = () => { closePanels(); openForm(r.id); };
  sheet.querySelector('[data-delete]').onclick = async () => {
    if(!confirm(`Delete “${r.name}”? This can\u2019t be undone.`)) return;
    recipes = recipes.filter(x => x.id !== r.id);
    rememberSeedDeletion(r.id);
    await saveRecipes(); closePanels(); render(); showToast('Recipe deleted');
  };
  const panel = document.getElementById('detailPanel');
  if(origin && !reduceMotion){
    const ox = (origin.x / window.innerWidth * 100).toFixed(1);
    const oy = (origin.y / window.innerHeight * 100).toFixed(1);
    sheet.style.transformOrigin = `${ox}% ${oy}%`;
    sheet.classList.remove('zoom'); void sheet.offsetWidth; sheet.classList.add('zoom');
  } else {
    sheet.classList.remove('zoom');
    sheet.style.transformOrigin = '';
  }
  sheet.scrollTop = prevScroll;
  panel.classList.add('open');
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
    <div class="field"><label for="fBean">Beans / roast for this brew</label><textarea id="fBean" placeholder="e.g. dark roast robusta, chocolatey, low acidity">${r?esc(r.bean||''):''}</textarea><div class="hint">Which bean type, roast and flavour suits this drink</div></div>
    <div class="field"><label>Strength</label><div class="strength-picker" id="fStrength">${[1,2,3,4,5].map(n=>`<button type="button" data-n="${n}" class="${n===strength?'sel':''}" aria-label="Strength ${n}">${[...Array(n)].map(()=>beanSVG(true)).join('')}</button>`).join('')}</div></div>
    <div class="field"><label for="fIng">Ingredients</label><textarea id="fIng" rows="5" placeholder="One per line">${r?esc((r.ingredients||[]).join('\n')):''}</textarea><div class="hint">One ingredient per line</div></div>
    <div class="field"><label for="fSteps">Steps</label><textarea id="fSteps" rows="6" placeholder="One step per line. Optional: Title :: instruction">${r?esc((r.steps||[]).map(s=>(typeof s==='string')?s:(s.t?s.t+' :: '+s.c:s.c)).join('\n')):''}</textarea><div class="hint">One step per line. Add a bold title with “Title :: instruction”.</div></div>
    <div class="field"><label for="fNotes">Notes (optional)</label><textarea id="fNotes" placeholder="Tips, tweaks, what to try next time…">${r?esc(r.notes||''):''}</textarea></div>
    <div class="detail-actions"><button class="btn" data-close>Cancel</button><button class="btn primary" data-save>${r ? 'Save changes' : 'Save recipe'}</button></div>`;

  let selStrength = strength;
  sheet.querySelectorAll('#fStrength button').forEach(b => b.onclick = () => { selStrength = +b.dataset.n; sheet.querySelectorAll('#fStrength button').forEach(x => x.classList.toggle('sel', +x.dataset.n === selStrength)); });
  sheet.querySelectorAll('[data-close]').forEach(b => b.onclick = closePanels);
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
    await saveRecipes(); closePanels(); render();
    showToast(editingId ? 'Saved' : 'Recipe saved ☕');
    editingId = null;
  };
  document.getElementById('formPanel').classList.add('open');
  setTimeout(()=>sheet.querySelector('#fName').focus(), 80);
}

function closePanels(){ document.getElementById('detailPanel').classList.remove('open'); document.getElementById('formPanel').classList.remove('open'); }

/* ---------- brew mode (guided step-by-step) ---------- */
let brewState = null;
function startBrew(id){
  const r = recipes.find(x => x.id === id);
  if(!r || !r.steps || !r.steps.length) return;
  brewState = { id, i: 0, steps: r.steps, name: r.name, dir: 1 };
  closePanels();
  document.getElementById('brewMode').classList.add('open');
  renderBrew();
}
function cupFillHTML(pct, full){
  const innerTop = 8, innerBot = 28, innerH = innerBot - innerTop;
  const h = Math.max(0, Math.min(1, pct/100)) * innerH;
  const y = innerBot - h;
  return `<span class="cup-fill ${full?'full':''}" aria-hidden="true"><svg viewBox="0 0 32 34">
    <defs><clipPath id="cupInner"><path d="M7 7 H22 V25 Q22 28 18 28 H11 Q7 28 7 25 Z"/></clipPath></defs>
    <g class="cup-steam">
      <path d="M12 5 q-2 -2 0 -4" stroke="rgba(242,228,207,.65)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M17 5 q2 -2 0 -4" stroke="rgba(242,228,207,.65)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </g>
    <rect class="cup-liquid" x="6" y="${y.toFixed(1)}" width="18" height="${(h+1).toFixed(1)}" fill="url(#roastFull)" clip-path="url(#cupInner)"/>
    <path d="M7 7 H22 V25 Q22 28 18 28 H11 Q7 28 7 25 Z" fill="none" stroke="#c9b59c" stroke-width="1.6"/>
    <path d="M22 11 q5 0 5 5 q0 5 -5 5" fill="none" stroke="#c9b59c" stroke-width="1.6"/>
  </svg></span>`;
}
function renderBrew(){
  if(!brewState) return;
  const { i, steps, name } = brewState;
  const el = document.getElementById('brewMode');
  const total = steps.length;
  const atEnd = i >= total;
  const pct = Math.round((Math.min(i, total) / total) * 100);

  if(atEnd){
    el.innerHTML = `
      <div class="brew-head">
        <div style="display:flex;align-items:center;gap:12px">${cupFillHTML(100, true)}<div class="name">${esc(name)}<small>All done</small></div></div>
        <button class="close-btn" data-exit aria-label="Close">✕</button>
      </div>
      <div class="brew-progress"><div class="bar" style="width:100%"></div></div>
      <div class="brew-body"><div class="brew-done">
        <div class="cup">☕</div>
        <h3>Enjoy your coffee!</h3>
        <p>That's all the steps. Want to mark this as made and give it a rating?</p>
      </div></div>
      <div class="brew-foot">
        <button class="btn" data-restart>Start over</button>
        <button class="btn primary" data-finish>Mark as made ✓</button>
      </div>`;
    el.querySelector('[data-restart]').onclick = () => { brewState.dir = -1; brewState.i = 0; renderBrew(); };
    el.querySelector('[data-finish]').onclick = async () => {
      const r = recipes.find(x => x.id === brewState.id);
      if(r){ r.tried = true; await saveRecipes(); render(); }
      const fid = brewState.id;
      beanBurst(window.innerWidth/2, window.innerHeight*0.42, 26);
      setTimeout(() => { exitBrew(); openDetail(fid); }, 400);
      showToast('Enjoy your coffee ☕');
    };
  } else {
    el.innerHTML = `
      <div class="brew-head">
        <div style="display:flex;align-items:center;gap:12px">${cupFillHTML(Math.round(((i)/total)*100), false)}<div class="name">${esc(name)}<small>Step ${i+1} of ${total}</small></div></div>
        <button class="close-btn" data-exit aria-label="Close">✕</button>
      </div>
      <div class="brew-progress"><div class="bar" style="width:${pct}%"></div></div>
      <div class="brew-body">
        <div class="brew-step ${brewState.dir < 0 ? 'enter-left' : 'enter-right'}">
          <div class="brew-stepnum">Step ${i+1}${(typeof steps[i]==='object' && steps[i].t) ? ' · ' + esc(steps[i].t) : ''}</div>
          <div class="brew-steptext">${esc((typeof steps[i]==='string') ? steps[i] : steps[i].c)}</div>
          <div class="brew-dots">${steps.map((_,k)=>`<span class="${k<i?'done':k===i?'cur':''}"></span>`).join('')}</div>
        </div>
      </div>
      <div class="brew-foot">
        <button class="btn" data-prev ${i===0?'disabled style="opacity:.4"':''}>Back</button>
        <button class="btn primary" data-next>${i===total-1?'Finish':'Next step'}</button>
      </div>`;
    el.querySelector('[data-prev]').onclick = () => { if(brewState.i>0){ brewState.dir = -1; brewState.i--; renderBrew(); } };
    el.querySelector('[data-next]').onclick = () => { brewState.dir = 1; brewState.i++; renderBrew(); };
  }
  el.querySelector('[data-exit]').onclick = exitBrew;
}
function exitBrew(){
  document.getElementById('brewMode').classList.remove('open');
  brewState = null;
}

/* ---------- backup / restore ---------- */
function exportRecipes(){
  const blob = new Blob([JSON.stringify(recipes, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
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
      await saveRecipes(); render();
      showToast(`Restored ${merged} recipe${merged===1?'':'s'} ⬆`);
    }catch(e){ showToast('That file didn\u2019t look like a backup'); }
  };
  reader.readAsText(file);
}

/* ---------- wiring ---------- */
buildChips();
seedAmbient();
runSplash();
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.btn.primary, .fab, .made-toggle');
  if(el) spawnRipple(el, e);
}, {passive:true});
window.addEventListener('resize', () => { clearTimeout(window._amb); window._amb = setTimeout(seedAmbient, 400); });
document.getElementById('content').addEventListener('click', e => {
  const card = e.target.closest('.card');
  if(card && card.dataset.id) openDetail(card.dataset.id, {x: e.clientX, y: e.clientY});
});
const finePointer = window.matchMedia('(pointer:fine)').matches;
document.getElementById('content').addEventListener('pointermove', e => {
  const card = e.target.closest('.card');
  if(!card) return;
  const rect = card.getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;
  card.style.setProperty('--mx', px + 'px');
  card.style.setProperty('--my', py + 'px');
  if(finePointer){
    const rx = ((py / rect.height) - 0.5) * -7;   // tilt up/down
    const ry = ((px / rect.width) - 0.5) * 9;      // tilt left/right
    card.style.transform = `translateY(-3px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.012)`;
  }
}, {passive:true});
document.getElementById('content').addEventListener('pointerleave', e => {
  const card = e.target.closest && e.target.closest('.card');
  if(card) card.style.transform = '';
}, {passive:true});
document.getElementById('content').addEventListener('pointerout', e => {
  const card = e.target.closest('.card');
  if(card && !card.contains(e.relatedTarget)) card.style.transform = '';
}, {passive:true});
let searchTimer = null;
document.getElementById('addBtn').onclick = () => openForm(null);
document.getElementById('searchInput').oninput = e => {
  searchTerm = e.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(render, 120);
};
document.getElementById('sortSelect').onchange = e => { sortBy = e.target.value; animateNext = true; render(); };
document.getElementById('exportBtn').onclick = exportRecipes;
document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
document.getElementById('importFile').onchange = e => { if(e.target.files[0]) importRecipes(e.target.files[0]); e.target.value=''; };
document.querySelectorAll('.panel').forEach(p => p.addEventListener('click', e => { if(e.target === p) closePanels(); }));
document.addEventListener('keydown', e => {
  if(brewState){
    if(e.key === 'Escape') exitBrew();
    else if(e.key === 'ArrowRight'){ brewState.i++; renderBrew(); }
    else if(e.key === 'ArrowLeft'){ if(brewState.i>0){ brewState.i--; renderBrew(); } }
    return;
  }
  if(e.key === 'Escape') closePanels();
});

loadRecipes();
