/* ===== Brew Book — DECORATIVE MOTION (isolated) =====
   Splash screen, drifting-bean ambient bg, tap ripples, bean-burst finish.
   Pure enhancement: the app renders and works fully without this file.
   (Scroll-reveal & brew flourishes live in app.js for now; Claude Design
    can lift those out into here during the rebuild.) */

function seedAmbient(){
  const host = document.getElementById('ambient');
  if(!host) return;
  const n = window.innerWidth < 560 ? 5 : 8;
  let html = '';
  for(let i=0;i<n;i++){
    const size = 14 + Math.random()*16;
    const left = Math.random()*100;
    const dur = 16 + Math.random()*16;
    const delay = -Math.random()*dur;
    const sway = (Math.random()*40 - 20).toFixed(0) + 'px';
    html += `<span class="fbean" style="left:${left}%;width:${size}px;height:${size*1.25}px;animation-duration:${dur}s;animation-delay:${delay}s;--sway:${sway}">${beanSVG(true)}</span>`;
  }
  host.innerHTML = html;
}

/* ---------- signature: first-load pour splash ---------- */
function runSplash(){
  const s = document.getElementById('splash');
  if(!s) return;
  const gear = document.getElementById('sgear');
  if(gear) gear.innerHTML = ['moka pot','pour over','french press','cold brew'].map(m=>`<span>${methodIcon(m)}</span>`).join('');
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){ s.remove(); return; }
  const dismiss = () => { s.classList.add('done'); setTimeout(()=>s.remove(), 650); };
  s.addEventListener('click', dismiss);
  setTimeout(dismiss, 2700);
}

/* ---------- bean-burst celebration ---------- */
function beanBurst(x, y, count){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'burst';
  const N = count || 16;
  let html = '';
  for(let i=0;i<N;i++){
    const ang = (Math.PI*2*i)/N + (Math.random()*0.5);
    const dist = 70 + Math.random()*130;
    const tx = Math.cos(ang)*dist; const ty = Math.sin(ang)*dist - 30; // bias upward
    const rot = (Math.random()*720 - 360) + 'deg';
    const dly = (Math.random()*0.08).toFixed(2);
    html += `<span class="bbean" style="left:${x}px;top:${y}px;--tx:${tx.toFixed(0)}px;--ty:${ty.toFixed(0)}px;--rot:${rot};animation-delay:${dly}s">${beanSVG(true)}</span>`;
  }
  layer.innerHTML = html;
  document.body.appendChild(layer);
  setTimeout(()=>layer.remove(), 1100);
}

/* ---------- tap ripple ---------- */
function spawnRipple(el, e){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.2;
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.width = r.style.height = size + 'px';
  r.style.left = (e.clientX - rect.left) + 'px';
  r.style.top = (e.clientY - rect.top) + 'px';
  el.appendChild(r);
  setTimeout(()=>r.remove(), 620);
}
function starsRow(n){ n = n||0; let h=''; for(let i=1;i<=5;i++) h += `<span class="${i<=n?'':'off'}">★</span>`; return `<span class="stars" aria-label="${n} of 5 stars">${h}</span>`; }
