/* ===== Brew Book — ANIMATIONS =====
   BREW_ANIM object + splash + ripple + burst.
   Requires GSAP (loaded before this file via CDN). */

/* ─── helper: check reduced motion ─── */
const _reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ─── star field ─── */
function _makeStars(container, count){
  if(!container) return;
  let h = '';
  for(let i=0;i<count;i++){
    const sz  = (.6 + Math.random()*2.2).toFixed(1);
    const x   = (Math.random()*100).toFixed(2);
    const y   = (Math.random()*100).toFixed(2);
    const dur = (2 + Math.random()*3).toFixed(2);
    const del = (-Math.random()*5).toFixed(2);
    h += `<span class="star-dot" style="width:${sz}px;height:${sz}px;left:${x}%;top:${y}%;--dur:${dur}s;--delay:${del}s"></span>`;
  }
  container.innerHTML = h;
}

/* ══════════════════════════════════════════
   BREW_ANIM — every animation the app calls
══════════════════════════════════════════ */
const BREW_ANIM = {

  REDUCED: _reduced,

  /* ── star field (splash + brew mode) ── */
  createStarField(container, count, dark){
    _makeStars(container, count || 40);
  },

  /* ── card grid entrance ── */
  animateCardEntrance(content){
    if(_reduced) return;
    const cards = content.querySelectorAll('.bp-card');
    if(!cards.length) return;
    if(typeof gsap === 'undefined') return;
    gsap.fromTo(cards,
      { opacity:0, y:20 },
      { opacity:1, y:0, duration:.38, stagger:.045, ease:'power2.out', clearProps:'transform' }
    );
  },

  /* ── map pins fly in ── */
  animatePinsIn(){
    if(_reduced) return;
    if(typeof gsap === 'undefined') return;
    const pins = document.querySelectorAll('#map-content .map-pin');
    if(!pins.length) return;
    gsap.fromTo(pins,
      { opacity:0, scale:0, transformOrigin:'50% 100%' },
      { opacity:1, scale:1, duration:.4, stagger:.04, ease:'back.out(1.7)' }
    );
  },

  /* ── plane flies across map on first entry ── */
  animateMapEntry(){
    if(_reduced) return;
    if(typeof gsap === 'undefined') return;
    const plane = document.getElementById('map-plane');
    if(!plane) return;
    const w = window.innerWidth;
    gsap.fromTo(plane,
      { x:-80, opacity:0 },
      { x: w + 80, opacity:1, duration:2.8, ease:'power1.inOut',
        onComplete(){ gsap.set(plane, {opacity:0, x:0}); }
      }
    );
  },

  /* ── boarding pass open: card expands into full panel ── */
  openBoardingPassTransition(cardEl, panel){
    if(_reduced){ return; }
    if(typeof gsap === 'undefined') return;
    gsap.fromTo(panel,
      { y:'100%', opacity:0 },
      { y:0, opacity:1, duration:.42, ease:'power3.out' }
    );
  },

  /* ── boarding pass close ── */
  closeBoardingPassTransition(panel, cb){
    if(_reduced){ if(cb) cb(); return; }
    if(typeof gsap === 'undefined'){ if(cb) cb(); return; }
    gsap.to(panel,
      { y:'100%', opacity:0, duration:.28, ease:'power2.in',
        onComplete(){ if(cb) cb(); }
      }
    );
  },

  /* ── scroll-reveal in detail body ── */
  initDetailReveals(body){
    if(!body) return;
    const items = body.querySelectorAll('.reveal');
    if(_reduced){
      items.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold:0.08, rootMargin:'0px 0px -24px 0px' });
    items.forEach(el => io.observe(el));
  },

  /* ── TSA green scan line on map-preview card ── */
  initTSAScan(card){
    if(!card || _reduced) return;
    if(typeof gsap === 'undefined') return;
    /* remove any previous scan */
    card.querySelectorAll('.tsa-scan').forEach(s => s.remove());
    const scan = document.createElement('div');
    scan.className = 'tsa-scan';
    card.style.position = 'relative';
    card.appendChild(scan);
    gsap.fromTo(scan,
      { top:0, opacity:1 },
      { top:'100%', duration:1.1, ease:'none',
        onComplete(){ scan.remove(); }
      }
    );
  },

  /* ── departure board scramble ── */
  updateDepartureBoard(text){
    const el = document.getElementById('deptChars');
    if(!el) return;
    if(_reduced){ el.textContent = text.toUpperCase(); return; }
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·— ';
    const final = text.toUpperCase();
    let frame = 0;
    const total = final.length + 8;
    const tick = () => {
      let out = '';
      for(let j = 0; j < final.length; j++){
        if(j < frame - 4) out += `<span class="dept-char">${final[j]}</span>`;
        else out += `<span class="dept-char">${CHARS[Math.floor(Math.random()*CHARS.length)]}</span>`;
      }
      el.innerHTML = out;
      frame++;
      if(frame <= total) requestAnimationFrame(tick);
      else el.innerHTML = final.split('').map(c=>`<span class="dept-char">${c}</span>`).join('');
    };
    tick();
  },

  /* ── brew step slide transition ── */
  animateBrewStep(body, dir){
    if(!body || _reduced) return;
    if(typeof gsap === 'undefined') return;
    const x = (dir > 0 ? 44 : -44);
    gsap.fromTo(body,
      { x, opacity:0 },
      { x:0, opacity:1, duration:.3, ease:'power2.out', clearProps:'transform' }
    );
  },

  /* ── landing celebration ── */
  landAnimation(){
    if(_reduced) return;
    if(typeof gsap === 'undefined') return;
    const glow = document.querySelector('.brew-glow');
    if(glow){
      gsap.to(glow, {
        scale:1.6, opacity:1, duration:.55, ease:'power2.out',
        onComplete(){ gsap.to(glow, {scale:1, opacity:.55, duration:.7, ease:'power2.in'}); }
      });
    }
    /* star pulse */
    const stars = document.querySelectorAll('#brewStars .star-dot');
    if(stars.length){
      gsap.to(stars, { opacity:.9, stagger:{ each:.02, from:'random' }, duration:.3, yoyo:true, repeat:2 });
    }
  }

};

/* ══════════════════════════════════════════
   SPLASH  — animated on first load
══════════════════════════════════════════ */
function runSplash(){
  const s = document.getElementById('splash');
  if(!s) return;

  /* seed stars */
  _makeStars(document.getElementById('splashStars'), 55);

  /* respect reduced motion */
  if(_reduced){
    const dismiss = () => { s.style.display='none'; s.remove(); };
    const skipBtn = document.getElementById('splashSkip');
    if(skipBtn) skipBtn.onclick = dismiss;
    setTimeout(dismiss, 1200);
    return;
  }

  /* ── cup draw paths ── */
  const draws  = s.querySelectorAll('.cup-draw');
  const steams = s.querySelectorAll('.cup-steam');
  const title  = s.querySelector('.splash-title');
  const tag    = s.querySelector('.splash-tagline');
  const skip   = s.querySelector('.splash-skip');

  /* measure path lengths and set dash */
  draws.forEach(p => {
    try {
      const len = p.getTotalLength();
      p.style.strokeDasharray  = len;
      p.style.strokeDashoffset = len;
    } catch(e){
      /* SVG method not available — fallback to CSS value */
      p.style.strokeDasharray  = '300';
      p.style.strokeDashoffset = '300';
    }
  });

  if(typeof gsap === 'undefined'){
    /* no GSAP — instant show then dismiss */
    draws.forEach(p => p.style.strokeDashoffset = '0');
    steams.forEach(p => p.style.opacity = '1');
    if(title)  title.style.opacity = '1';
    if(tag)    tag.style.opacity   = '1';
    if(skip)   skip.style.opacity  = '1';
    const dismiss = () => { s.style.opacity='0'; setTimeout(()=>s.remove(),350); };
    if(skip) skip.onclick = dismiss;
    setTimeout(dismiss, 3200);
    return;
  }

  /* ── GSAP timeline ── */
  const tl = gsap.timeline();

  /* draw cup body + handle + rim */
  tl.to(draws, {
    strokeDashoffset: 0,
    duration: 1.2,
    stagger: .18,
    ease: 'power2.inOut'
  })
  /* steam wafts up */
  .to(steams, {
    opacity: 1,
    duration: .5,
    stagger: .12,
    ease: 'power1.out'
  }, '-=.4')
  /* title & tagline */
  .to(title || [], {
    opacity: 1, y: 0,
    duration: .55,
    ease: 'power2.out'
  }, '-=.25')
  .to(tag || [], {
    opacity: 1, y: 0,
    duration: .45,
    ease: 'power2.out'
  }, '-=.3')
  /* skip button */
  .to(skip || [], {
    opacity: 1,
    duration: .35
  }, '+=.1');

  /* continuous steam float */
  gsap.to(steams, {
    y: -10,
    duration: 1.5,
    stagger: .22,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  /* dismiss helper */
  const dismiss = () => {
    tl.kill();
    gsap.to(s, {
      opacity: 0,
      duration: .45,
      ease: 'power1.in',
      onComplete(){ s.remove(); }
    });
  };

  if(skip) skip.onclick = dismiss;
  setTimeout(dismiss, 4000);
}

/* ══════════════════════════════════════════
   BEAN BURST  — celebration confetti
══════════════════════════════════════════ */
function beanBurst(x, y, count){
  if(_reduced) return;
  const layer = document.createElement('div');
  layer.className = 'burst';
  const N = count || 16;
  let h = '';
  for(let i=0;i<N;i++){
    const ang  = (Math.PI*2*i/N) + (Math.random()*.5);
    const dist = 70 + Math.random()*130;
    const tx   = (Math.cos(ang)*dist).toFixed(0);
    const ty   = (Math.sin(ang)*dist - 30).toFixed(0);
    const rot  = (Math.random()*720-360).toFixed(0)+'deg';
    const dly  = (Math.random()*.08).toFixed(2);
    h += `<span class="bbean" style="left:${x}px;top:${y}px;--tx:${tx}px;--ty:${ty}px;--rot:${rot};animation-delay:${dly}s">${beanSVG(true)}</span>`;
  }
  layer.innerHTML = h;
  document.body.appendChild(layer);
  setTimeout(()=>layer.remove(), 1100);
}

/* ══════════════════════════════════════════
   TAP RIPPLE
══════════════════════════════════════════ */
function spawnRipple(el, e){
  if(_reduced) return;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.25;
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px`;
  el.style.position = el.style.position || 'relative';
  el.style.overflow = 'hidden';
  el.appendChild(r);
  setTimeout(()=>r.remove(), 650);
}

/* ══════════════════════════════════════════
   STARS ROW (rating display)
══════════════════════════════════════════ */
function starsRow(n){
  n = n||0;
  let h='';
  for(let i=1;i<=5;i++) h+=`<span class="${i<=n?'':'off'}">★</span>`;
  return `<span class="stars" aria-label="${n} of 5 stars">${h}</span>`;
}

/* ══════════════════════════════════════════
   AMBIENT FLOATING BEANS (legacy / unused)
══════════════════════════════════════════ */
function seedAmbient(){
  const host = document.getElementById('ambient');
  if(!host || typeof beanSVG === 'undefined') return;
  const n = window.innerWidth < 560 ? 5 : 8;
  let h = '';
  for(let i=0;i<n;i++){
    const sz  = 14 + Math.random()*16;
    const lft = Math.random()*100;
    const dur = 16 + Math.random()*16;
    const del = -Math.random()*dur;
    const sw  = (Math.random()*40-20).toFixed(0)+'px';
    h += `<span class="fbean" style="left:${lft}%;width:${sz}px;height:${sz*1.25}px;animation-duration:${dur}s;animation-delay:${del}s;--sway:${sw}">${beanSVG(true)}</span>`;
  }
  host.innerHTML = h;
}
