/* ===== Brew Book — FLAVOR WHEEL =====
   SCA v2 Coffee Taster's Flavor Wheel (World Coffee Research Sensory
   Lexicon) as a standalone reference screen: click-to-drill-in radial SVG
   (family -> group -> descriptor) with a linked side panel, plus a few
   curated links back into the recipe catalog.

   Geometry, taxonomy and panel copy are ported close to verbatim from a
   Claude-generated standalone prototype the user designed and approved —
   only the React/JSX shell was swapped for plain DOM string rendering (no
   build step here), and "brews in the book" now links real recipe ids
   instead of static text.

   Provides to app.js:
     renderFlavorWheel()  – call when the Flavor Wheel tab is first shown
                             (idempotent; wires its own click/hover listeners) */

const FLAVOR_FAMILIES = [
  { name:'Floral', color:'#C9779F', desc:'Delicate, perfume-like aromatics — fresh-cut flowers, dried blossom and fine tea. A hallmark of high-grown, gently-processed coffees.', subs:[
    { name:'Black Tea', leaves:[] },
    { name:'Floral', leaves:['Chamomile','Rose','Jasmine'] },
  ]},
  { name:'Fruity', color:'#D53E4B', desc:'Sweet, juicy and vibrant — from jammy berries to bright citrus. Driven by cherry ripeness, terroir and careful processing.', subs:[
    { name:'Berry', leaves:['Blackberry','Raspberry','Blueberry','Strawberry'] },
    { name:'Dried Fruit', leaves:['Raisin','Prune'] },
    { name:'Other Fruit', leaves:['Coconut','Cherry','Pomegranate','Pineapple','Grape','Apple','Peach','Pear'] },
    { name:'Citrus Fruit', leaves:['Grapefruit','Orange','Lemon','Lime'] },
  ]},
  { name:'Sour / Fermented', color:'#C9C33E', desc:'Sharp acids and boozy, fermented notes — pleasant citric brightness on one end, winey and overripe funk on the other.', subs:[
    { name:'Sour', leaves:['Sour Aromatics','Acetic Acid','Butyric Acid','Isovaleric Acid','Citric Acid','Malic Acid'] },
    { name:'Alcohol / Fermented', leaves:['Winey','Whiskey','Fermented','Overripe'] },
  ]},
  { name:'Green / Vegetative', color:'#4FA34C', desc:'Fresh, raw and leafy — from cut grass to pea pod. Often points to under-developed roast or unripe cherry.', subs:[
    { name:'Olive Oil', leaves:[] },
    { name:'Raw', leaves:[] },
    { name:'Green / Vegetative', leaves:['Under-ripe','Peapod','Fresh','Dark Green','Vegetative','Hay-like','Herb-like'] },
    { name:'Beany', leaves:[] },
  ]},
  { name:'Other', color:'#6FB6C6', desc:'Off-notes and faults — papery, musty, chemical and medicinal. The vocabulary for naming defects and storage problems.', subs:[
    { name:'Papery / Musty', leaves:['Stale','Cardboard','Papery','Woody','Moldy / Damp','Musty / Dusty','Musty / Earthy','Animalic'] },
    { name:'Chemical', leaves:['Rubber','Skunky','Petroleum','Medicinal','Salty','Bitter','Meaty Brothy','Phenolic'] },
  ]},
  { name:'Roasted', color:'#B85A2E', desc:'The signature of the roast itself — smoke, char, toasted grain and pipe tobacco. Deepens with darker development.', subs:[
    { name:'Pipe Tobacco', leaves:[] },
    { name:'Tobacco', leaves:[] },
    { name:'Burnt', leaves:['Acrid','Ashy','Smoky','Brown Roast'] },
    { name:'Cereal', leaves:['Grain','Malt'] },
  ]},
  { name:'Spices', color:'#9E2B2B', desc:'Warm and pungent — brown baking spices, fresh pepper and aromatic heat that lingers into the finish.', subs:[
    { name:'Pungent', leaves:[] },
    { name:'Pepper', leaves:[] },
    { name:'Brown Spice', leaves:['Anise','Nutmeg','Cinnamon','Clove'] },
  ]},
  { name:'Nutty / Cocoa', color:'#8A5A2B', desc:'Comforting roasted-nut and chocolate tones — the dependable backbone of many balanced, medium-roast coffees.', subs:[
    { name:'Nutty', leaves:['Peanuts','Hazelnut','Almond'] },
    { name:'Cocoa', leaves:['Chocolate','Dark Chocolate'] },
  ]},
  { name:'Sweet', color:'#E39A2B', desc:'Rich caramelised sweetness — brown sugar, honey, vanilla and syrup. The quality most tied to ripeness and balance.', subs:[
    { name:'Brown Sugar', leaves:['Molasses','Maple Syrup','Caramelized','Honey'] },
    { name:'Vanilla', leaves:[] },
    { name:'Vanillin', leaves:[] },
    { name:'Overall Sweet', leaves:[] },
    { name:'Sweet Aromatics', leaves:[] },
  ]},
];

/* Family -> a few brews from the actual catalog that lean that way. Real
   recipe ids (checked against js/data.js) so these are clickable, not just
   text — curated by hand, same "small side-table" pattern as ROASTER_PICKS
   rather than anything auto-derived (no per-recipe SCA-family tagging
   exists, and guessing one algorithmically would be worse than a short
   hand-picked list). */
const FLAVOR_BREW_LINKS = {
  'Floral': [],
  'Fruity': [
    { id:'seed-mazagran', label:'Mazagran — lemon' },
    { id:'seed-thai',     label:'Thai Iced Coffee' },
  ],
  'Sour / Fermented': [
    { id:'seed-mazagran',  label:'Mazagran' },
    { id:'seed-shakerato', label:'Caffè Shakerato' },
  ],
  'Green / Vegetative': [],
  'Other': [],
  'Roasted': [
    { id:'seed-turkish',    label:'Turkish Coffee' },
    { id:'seed-cortadito',  label:'Cuban Cortadito' },
  ],
  'Spices': [
    { id:'seed-cafeolla', label:'Café de Olla — cinnamon' },
    { id:'seed-qahwa',    label:'Moroccan Qahwa' },
    { id:'seed-thai',     label:'Thai Iced Coffee' },
  ],
  'Nutty / Cocoa': [
    { id:'seed-egg',      label:'Egg Coffee — tiramisu' },
    { id:'seed-affogato', label:'Affogato' },
  ],
  'Sweet': [
    { id:'seed-bombon',  label:'Café Bombón' },
    { id:'seed-suada',   label:'Vietnamese Iced' },
    { id:'seed-dalgona', label:'Dalgona Coffee' },
  ],
};

const _fwEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- geometry + render (ported from the approved prototype) ---------- */
const FW = {
  CX:400, CY:400, HUB:66, R1:146, R2:244, R3:352,
  state: { fi:-1, si:-1, li:-1 },

  lighten(hex,t){
    const n=parseInt(hex.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    r=Math.round(r+(255-r)*t); g=Math.round(g+(255-g)*t); b=Math.round(b+(255-b)*t);
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  },
  pt(r,deg){ const a=deg*Math.PI/180; return [this.CX+r*Math.cos(a), this.CY+r*Math.sin(a)]; },
  sector(r0,r1,a0,a1){
    const [x0,y0]=this.pt(r1,a0),[x1,y1]=this.pt(r1,a1),[x2,y2]=this.pt(r0,a1),[x3,y3]=this.pt(r0,a0);
    const lg=(a1-a0)>180?1:0;
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r1} ${r1} 0 ${lg} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} A${r0} ${r0} 0 ${lg} 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
  },
  /* All wedge labels render white with a thin dark outline (paint-order:
     stroke) instead of the prototype's per-wedge luminance ink — that gave
     dark-brown text on the brighter wedges (Sweet, Sour, lightened leaves),
     which read as "not glowing" next to the white labels everywhere else.
     The outline is what keeps white legible on those light fills. */
  radialLabel(text,r,deg,size,weight){
    const m=((deg%360)+360)%360; const left=m>90&&m<270;
    const rot=left?deg+180:deg; const anchor=left?'end':'start'; const rr=left?-r:r;
    return `<text transform="rotate(${rot.toFixed(2)} ${this.CX} ${this.CY})" x="${(this.CX+rr).toFixed(2)}" y="${this.CY}" dy="0.32em" text-anchor="${anchor}" fill="#fff7ec" stroke="#1a110b" stroke-width="${size<=7.5?1.5:1.8}" stroke-linejoin="round" paint-order="stroke" font-family="'JetBrains Mono',monospace" font-size="${size}" font-weight="${weight||500}" letter-spacing="0.02em" style="pointer-events:none">${text}</text>`;
  },
  arcLabelPath(id,r,a0,a1){
    const mid=(a0+a1)/2, m=((mid%360)+360)%360; const bottom=m>0&&m<180;
    let d;
    if(!bottom){ const [x0,y0]=this.pt(r,a0),[x1,y1]=this.pt(r,a1); d=`M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; }
    else { const [x0,y0]=this.pt(r,a1),[x1,y1]=this.pt(r,a0); d=`M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`; }
    return `<path id="${id}" d="${d}" fill="none"/>`;
  },

  buildWheel() {
    const fams=FLAVOR_FAMILIES;
    const total = fams.reduce((t,f)=>t+f.subs.reduce((s,su)=>s+Math.max(su.leaves.length,1),0),0);
    const sel=this.state; const any=sel.fi>=0;
    const paths=[], subArcs=[], leafArcs=[], famLabels=[], subLabels=[], leafLabels=[], defs=[];
    let ang=-90; // start at top

    fams.forEach((f,fi)=>{
      const fWeight=f.subs.reduce((s,su)=>s+Math.max(su.leaves.length,1),0);
      const fSpan=fWeight/total*360; const fa0=ang, fa1=ang+fSpan;
      const famActive = !any || sel.fi===fi;
      const famOp = famActive?1:0.14;

      paths.push(`<path class="fw-wedge" data-fi="${fi}" data-si="-1" data-li="-1" data-tip="${_fwEsc(f.name)}" d="${this.sector(this.HUB,this.R1,fa0,fa1)}" fill="${f.color}" stroke="#1a110b" stroke-width="1.4" style="opacity:${famOp}"/>`);
      const rFam=(this.HUB+this.R1)/2+2;
      const arcPx=2*Math.PI*rFam*(fSpan/360);
      /* Fit check counts spaces + slashes (mono font — they're full-width),
         unlike the prototype, whose no-space count under-measured "SOUR /
         FERMENTED" etc. and let textPath clip them mid-word. When a name
         can't fit its arc even at the minimum size, drop to its first word —
         the side panel always carries the full name. */
      let label=f.name.toUpperCase();
      let fs=(arcPx*0.9)/(label.length*0.66);
      if(fs<6.4){ label=label.split('/')[0].trim(); fs=(arcPx*0.9)/(label.length*0.66); }
      fs=Math.min(12.5,Math.max(6.2,fs));
      const pid=`fwfam${fi}`;
      defs.push(this.arcLabelPath(pid,rFam,fa0+fSpan*0.03,fa1-fSpan*0.03));
      famLabels.push(`<text font-family="'JetBrains Mono',monospace" font-weight="700" font-size="${fs.toFixed(1)}" letter-spacing="${fs>=12?'0.12em':'0.02em'}" fill="#fff7ec" stroke="#1a110b" stroke-width="2" stroke-linejoin="round" paint-order="stroke" style="opacity:${famOp};pointer-events:none"><textPath href="#${pid}" startOffset="50%" text-anchor="middle">${label}</textPath></text>`);

      let sang=fa0;
      f.subs.forEach((su,si)=>{
        const w=Math.max(su.leaves.length,1); const sSpan=w/fWeight*fSpan; const sa0=sang, sa1=sang+sSpan;
        const subActive = !any || (sel.fi===fi && (sel.si<0 || sel.si===si));
        const sOp = !famActive?0.14 : (subActive?1:0.32);
        const subColor=this.lighten(f.color,0.16);
        const hasLeaves=su.leaves.length>0;
        const subOuter = hasLeaves? this.R2 : this.R3;
        subArcs.push(`<path class="fw-wedge" data-fi="${fi}" data-si="${si}" data-li="-1" data-tip="${_fwEsc(f.name+' › '+su.name)}" d="${this.sector(this.R1,subOuter,sa0,sa1)}" fill="${subColor}" stroke="#1a110b" stroke-width="1.2" style="opacity:${sOp}"/>`);
        const smid=(sa0+sa1)/2;
        const srLabel = hasLeaves ? (this.R1+this.R2)/2 : (this.R1+this.R3)/2;
        const sLabelSize = hasLeaves?7.4:8.2;
        subLabels.push(this.radialLabel(_fwEsc(su.name.toUpperCase()), srLabel-((su.name.length*sLabelSize*0.5)/2), smid, sLabelSize, 700));

        let lang=sa0;
        su.leaves.forEach((lf,li)=>{
          const lSpan=sSpan/su.leaves.length; const la0=lang, la1=lang+lSpan; const lmid=(la0+la1)/2;
          const leafSelected = sel.fi===fi && sel.si===si && (sel.li<0 || sel.li===li);
          const lOp = !famActive?0.14 : (!subActive?0.28 : (sel.li>=0 ? (leafSelected?1:0.34):1));
          const leafColor=this.lighten(f.color, 0.30 + (li%3)*0.05);
          leafArcs.push(`<path class="fw-wedge" data-fi="${fi}" data-si="${si}" data-li="${li}" data-tip="${_fwEsc(f.name+' › '+su.name+' › '+lf)}" d="${this.sector(this.R2,this.R3,la0,la1)}" fill="${leafColor}" stroke="#1a110b" stroke-width="1" style="opacity:${lOp}"/>`);
          leafLabels.push(this.radialLabel(_fwEsc(lf), this.R2+7, lmid, 7.2, 500));
          lang=la1;
        });
        sang=sa1;
      });
      ang=fa1;
    });

    const hub=`<circle cx="${this.CX}" cy="${this.CY}" r="${this.HUB}" fill="url(#fwhub)" stroke="rgba(207,127,69,.4)" stroke-width="1.5"/>
      <text x="${this.CX}" y="${this.CY-8}" text-anchor="middle" font-family="'Fraunces',serif" font-style="italic" font-weight="500" font-size="20" fill="#fff7ec">taste</text>
      <text x="${this.CX}" y="${this.CY+14}" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="8.5" letter-spacing="0.24em" fill="#cf7f45">THE CUP</text>`;

    return `<svg viewBox="0 0 800 800" width="100%" class="fw-svg">
      <defs>
        <radialGradient id="fwhub" cx="42%" cy="34%" r="72%">
          <stop offset="0%" stop-color="#3a2a1d"/><stop offset="100%" stop-color="#1a110b"/>
        </radialGradient>
        ${defs.join('')}
      </defs>
      <g>${paths.join('')}${subArcs.join('')}${leafArcs.join('')}</g>
      <g>${famLabels.join('')}${subLabels.join('')}${leafLabels.join('')}</g>
      ${hub}
    </svg>`;
  },

  buildPanel() {
    const sel=this.state; const fams=FLAVOR_FAMILIES;
    if(sel.fi<0){
      const rows=fams.map((f,i)=>{
        return `<div data-fi="${i}" class="fw-chip fw-legend-row">
          <span class="fw-dot" style="background:${f.color};box-shadow:0 0 0 3px ${f.color}22"></span>
          <span class="fw-legend-name">${_fwEsc(f.name)}</span>
          <span class="fw-legend-count">${f.subs.length} groups</span>
        </div>`;
      }).join('');
      return `<div class="fw-panel-inner">
        <div class="fw-kicker">How to read it</div>
        <h3 class="fw-panel-h">Nine families of flavor</h3>
        <p class="fw-panel-p">Tasters move <em>inside-out</em>: sense a broad family at the centre, then narrow to a group and finally a single descriptor at the rim. Pick a family to explore it.</p>
        <div class="fw-legend-list">${rows}</div>
        <div class="fw-footnote">SCA &amp; WCR · Coffee Taster&#8217;s Flavor Wheel v2 (2016), built on the World Coffee Research Sensory Lexicon.</div>
      </div>`;
    }

    const f=fams[sel.fi]; const su = sel.si>=0? f.subs[sel.si]:null; const leaf = (su && sel.li>=0)? su.leaves[sel.li]:null;
    const links = FLAVOR_BREW_LINKS[f.name] || [];
    const crumb=`<div class="fw-crumb">
      <span data-fi="${sel.fi}" class="fw-chip fw-crumb-part" style="color:${leaf||su?'#c9b59c':'#fff7ec'}">${_fwEsc(f.name)}</span>
      ${su?`<span class="fw-crumb-sep">/</span><span data-fi="${sel.fi}" data-si="${sel.si}" class="fw-chip fw-crumb-part" style="color:${leaf?'#c9b59c':'#fff7ec'}">${_fwEsc(su.name)}</span>`:''}
      ${leaf?`<span class="fw-crumb-sep">/</span><span class="fw-crumb-leaf">${_fwEsc(leaf)}</span>`:''}
    </div>`;

    let body='';
    if(leaf){
      body=`<div class="fw-body">
        <div class="fw-kicker" style="color:${f.color}">Descriptor</div>
        <h3 class="fw-panel-h fw-panel-h--lg">${_fwEsc(leaf)}</h3>
        <p class="fw-panel-p">A rim-level descriptor within <strong>${_fwEsc(su.name)}</strong>. It&#8217;s the most specific word a taster reaches for once they&#8217;ve placed the note in the <strong>${_fwEsc(f.name)}</strong> family.</p>
        <div class="fw-subhead">Neighbours in ${_fwEsc(su.name)}</div>
        <div class="fw-chip-row">${su.leaves.map((lf,li)=>`<span data-fi="${sel.fi}" data-si="${sel.si}" data-li="${li}" class="fw-chip fw-chip--leaf ${li===sel.li?'is-active':''}" style="${li===sel.li?`border-color:${f.color};background:${this.lighten(f.color,0.28)};color:#1a110b`:''}">${_fwEsc(lf)}</span>`).join('')}</div>
      </div>`;
    } else if(su){
      const chips = su.leaves.length? su.leaves.map((lf,li)=>`<span data-fi="${sel.fi}" data-si="${sel.si}" data-li="${li}" class="fw-chip fw-chip--leaf">${_fwEsc(lf)}</span>`).join('')
        : `<span class="fw-empty">A terminal group — no finer descriptors branch from it.</span>`;
      body=`<div class="fw-body">
        <div class="fw-kicker" style="color:${f.color}">Group</div>
        <h3 class="fw-panel-h fw-panel-h--md">${_fwEsc(su.name)}</h3>
        <p class="fw-panel-p">${_fwEsc(f.desc)}</p>
        <div class="fw-subhead">${su.leaves.length||'No'} descriptor${su.leaves.length===1?'':'s'}</div>
        <div class="fw-chip-row">${chips}</div>
      </div>`;
    } else {
      body=`<div class="fw-body">
        <div class="fw-kicker" style="color:${f.color}">Family</div>
        <h3 class="fw-panel-h fw-panel-h--lg">${_fwEsc(f.name)}</h3>
        <p class="fw-panel-p">${_fwEsc(f.desc)}</p>
        <div class="fw-subhead">${f.subs.length} groups · click to drill in</div>
        <div class="fw-group-list">${f.subs.map((s,si)=>`<div data-fi="${sel.fi}" data-si="${si}" class="fw-chip fw-group-row">
          <span class="fw-group-name">${_fwEsc(s.name)}</span>
          <span class="fw-group-count">${s.leaves.length||'—'}</span>
        </div>`).join('')}</div>
        ${links.length?`<div class="fw-brews">
          <div class="fw-kicker fw-kicker--copper">Brews in the book that lean this way</div>
          <div class="fw-chip-row">${links.map(b=>`<span class="fw-chip fw-chip--brew" data-open-recipe="${_fwEsc(b.id)}">${_fwEsc(b.label)}</span>`).join('')}</div>
        </div>`:''}
      </div>`;
    }

    return `<div class="fw-panel-inner fw-panel-inner--selected">
      <span class="fw-rail" style="background:${f.color}"></span>
      ${crumb}
      ${body}
    </div>`;
  },
};

function _fwRender(){
  const wheelEl = document.getElementById('fwWheel');
  const panelEl = document.getElementById('fwPanel');
  if(!wheelEl || !panelEl) return;
  wheelEl.innerHTML = FW.buildWheel();
  panelEl.innerHTML = FW.buildPanel();
}

let _fwWired = false;
function renderFlavorWheel(){
  _fwRender();
  if(_fwWired) return;
  _fwWired = true;

  const root = document.getElementById('screen-flavorwheel');
  const tip = document.getElementById('fwTip');
  if(!root) return;

  root.addEventListener('click', (e) => {
    const resetEl = e.target.closest && e.target.closest('[data-reset]');
    if(resetEl){ FW.state = {fi:-1,si:-1,li:-1}; _fwRender(); return; }
    const openEl = e.target.closest && e.target.closest('[data-open-recipe]');
    if(openEl){ openDetail(openEl.getAttribute('data-open-recipe')); return; }
    const el = e.target.closest && e.target.closest('[data-fi]');
    if(!el) return;
    const fi=+el.getAttribute('data-fi');
    const si=el.hasAttribute('data-si')?+el.getAttribute('data-si'):-1;
    const li=el.hasAttribute('data-li')?+el.getAttribute('data-li'):-1;
    FW.state = {fi,si,li};
    _fwRender();
  });
  root.addEventListener('mousemove', (e) => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if(!tip) return;
    if(el){ tip.textContent=el.getAttribute('data-tip'); tip.style.opacity='1'; tip.style.left=(e.clientX+14)+'px'; tip.style.top=(e.clientY+16)+'px'; }
    else tip.style.opacity='0';
  });
  root.addEventListener('mouseleave', () => { if(tip) tip.style.opacity='0'; });
}
