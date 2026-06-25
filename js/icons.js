/* ===== Brew Book — ICON LIBRARY =====
   Glossy SVG icons for brew methods and ingredients, + helpers
   (beanSVG, beansRow, methodIcon, ingredientIcon). Loaded before app.js. */

function beanSVG(full){
  if(full){
    return `<svg class="bean full" viewBox="0 0 16 20" aria-hidden="true">`
      + `<ellipse cx="8" cy="10" rx="6.4" ry="9" fill="url(#roastFull)"/>`
      + `<path d="M8 1.6 C5.2 6, 10.8 14, 8 18.4" stroke="#3a1f0e" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"/>`
      + `<ellipse cx="5.7" cy="6.4" rx="2.6" ry="3.4" fill="url(#roastSheen)" transform="rotate(-28 5.7 6.4)"/>`
      + `</svg>`;
  }
  return `<svg class="bean ghost" viewBox="0 0 16 20" aria-hidden="true">`
    + `<ellipse cx="8" cy="10" rx="6.4" ry="9" fill="none" stroke="#5c4631" stroke-width="1.3"/>`
    + `<path d="M8 2.4 C5.6 6, 10.4 14, 8 17.6" stroke="#5c4631" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>`
    + `</svg>`;
}
function beansRow(n){ return `<span class="beans" title="Strength ${n}/5" aria-label="Strength ${n} of 5">${[1,2,3,4,5].map(i=>beanSVG(i<=n)).join('')}</span>`; }

/* ---------- brewing-gear art (filled & glossy), keyed by method ---------- */
const GEAR_ICONS = {
  'moka pot': `<svg viewBox="0 0 48 48"><path d="M14 25 H34 L31 41 a3 3 0 0 1-3 2 H17 a3 3 0 0 1-3-2 Z" fill="url(#gSteel)" stroke="#3a3d42" stroke-width="1"/><path d="M16 25 L16.5 41" stroke="#fff" stroke-opacity=".3" stroke-width="1.5"/><path d="M15 25 H33 L33 21 a2 2 0 0 0-2-2 H17 a2 2 0 0 0-2 2 Z" fill="url(#gSteel)" stroke="#3a3d42" stroke-width="1"/><rect x="20" y="11" width="8" height="9" rx="1.5" fill="url(#gSteel)" stroke="#3a3d42" stroke-width="1"/><path d="M28 13 L34 9 L35 11 L29 16 Z" fill="url(#gSteel)" stroke="#3a3d42" stroke-width=".8"/><path d="M34 28 a7 7 0 0 1 5 6 l-3 0 a4 4 0 0 0-2.5-3.5 Z" fill="#2a2c30"/></svg>`,
  'pour over': `<svg viewBox="0 0 48 48"><path d="M14 14 H34 L27 28 H21 Z" fill="url(#gCoffee)" stroke="#3a2415" stroke-width="1"/><path d="M14 14 H34 L33 17 H15 Z" fill="url(#roastFull)"/><rect x="22" y="28" width="4" height="4" fill="url(#gCoffee)"/><path d="M16 32 H32 L30 41 a3 3 0 0 1-3 2 H21 a3 3 0 0 1-3-2 Z" fill="url(#gGlass)" stroke="#7c97a8" stroke-width="1"/><ellipse cx="24" cy="14" rx="10" ry="2.4" fill="#fff" fill-opacity=".18"/></svg>`,
  'french press': `<svg viewBox="0 0 48 48"><rect x="16" y="16" width="16" height="26" rx="3" fill="url(#gGlass)" stroke="#7c97a8" stroke-width="1.2"/><rect x="17" y="30" width="14" height="11" rx="2" fill="url(#gCoffee)"/><rect x="15" y="12" width="18" height="5" rx="2" fill="url(#gSteel)" stroke="#3a3d42" stroke-width=".8"/><rect x="23" y="5" width="2.5" height="9" rx="1" fill="url(#gSteel)"/><rect x="20" y="24" width="8" height="2.5" rx="1" fill="url(#gSteel)"/><path d="M32 20 h7 a3 3 0 0 1 0 8 h-7" fill="none" stroke="#7c97a8" stroke-width="1.5"/></svg>`,
  'cold brew': `<svg viewBox="0 0 48 48"><rect x="16" y="14" width="16" height="28" rx="4" fill="url(#gGlass)" stroke="#7c97a8" stroke-width="1.2"/><path d="M17 26 h14 v12 a4 4 0 0 1-4 4 h-6 a4 4 0 0 1-4-4 Z" fill="url(#gCoffee)"/><rect x="19" y="9" width="10" height="6" rx="2" fill="url(#gSteel)" stroke="#3a3d42" stroke-width=".8"/><circle cx="22" cy="31" r="1.4" fill="#fff" fill-opacity=".3"/><circle cx="27" cy="35" r="1.1" fill="#fff" fill-opacity=".25"/></svg>`,
  'espresso': `<svg viewBox="0 0 48 48"><path d="M14 22 H32 L30 34 a4 4 0 0 1-4 3 H20 a4 4 0 0 1-4-3 Z" fill="url(#gMilk)" stroke="#9b8a6e" stroke-width="1"/><path d="M15.5 24 H30.5 L30 28 H16 Z" fill="url(#gCoffee)"/><path d="M32 25 a6 6 0 0 1 0 9" fill="none" stroke="#9b8a6e" stroke-width="2"/><ellipse cx="23" cy="40" rx="12" ry="2.4" fill="url(#gMilk)" stroke="#9b8a6e" stroke-width=".8"/></svg>`,
  'instant': `<svg viewBox="0 0 48 48"><rect x="15" y="16" width="18" height="24" rx="3" fill="url(#gGlass)" stroke="#7c97a8" stroke-width="1.2"/><path d="M16 24 h16 v13 a3 3 0 0 1-3 3 H19 a3 3 0 0 1-3-3 Z" fill="url(#gCoffee)"/><rect x="14" y="11" width="20" height="6" rx="2" fill="url(#roastFull)" stroke="#8f5526" stroke-width=".8"/><path d="M30 8 l5 -3 l1.5 2.5 l-5 3 Z" fill="url(#gSteel)"/><circle cx="21" cy="30" r="1.3" fill="#fff" fill-opacity=".25"/><circle cx="26" cy="33" r="1" fill="#fff" fill-opacity=".2"/></svg>`,
  'other': `<svg viewBox="0 0 48 48"><path d="M14 18 H32 L30 38 a4 4 0 0 1-4 3 H20 a4 4 0 0 1-4-3 Z" fill="url(#roastFull)" stroke="#8f5526" stroke-width="1"/><path d="M32 22 a7 7 0 0 1 0 13" fill="none" stroke="#8f5526" stroke-width="2"/><ellipse cx="23" cy="20" rx="9" ry="2.2" fill="#fff" fill-opacity=".2"/></svg>`,
  'cezve': `<svg viewBox="0 0 48 48"><path d="M16 20 H30 L28 36 a3 3 0 0 1-3 2 H21 a3 3 0 0 1-3-2 Z" fill="url(#gSteel)" stroke="#3a3d42" stroke-width="1"/><path d="M16 20 q7 -4 14 0 l-1 2 q-6 -3 -12 0 Z" fill="#c9ccd1"/><path d="M30 23 L43 26 L43 28 L30 26 Z" fill="url(#gSteel)" stroke="#3a3d42" stroke-width=".6"/><path d="M18 20 q5 -2 10 0" fill="none" stroke="#3a2415" stroke-width="2.5" opacity=".5"/></svg>`,
  'blended': `<svg viewBox="0 0 48 48"><path d="M17 14 H31 L29 33 a2 2 0 0 1-2 2 H20 a2 2 0 0 1-2-2 Z" fill="url(#gGlass)" stroke="#7c97a8" stroke-width="1.2"/><path d="M18 24 h12 l-1 9 a2 2 0 0 1-2 2 H21 a2 2 0 0 1-2-2 Z" fill="url(#roastFull)" opacity=".85"/><rect x="19" y="35" width="10" height="3" fill="url(#gSteel)"/><rect x="21" y="38" width="6" height="6" rx="1" fill="url(#gSteel)" stroke="#3a3d42" stroke-width=".6"/><path d="M21 18 l6 4 M27 18 l-6 4" stroke="#fff" stroke-opacity=".4" stroke-width="1.4"/></svg>`
};
function methodIcon(method){ return GEAR_ICONS[method] || GEAR_ICONS['other']; }

/* ---------- ingredient art (filled & glossy), matched by keyword ---------- */
const ING_ICONS = {
  mango:`<svg viewBox="0 0 24 24"><path d="M15 4 C9 3,4 7,4 13 c0 4,3 7,8 7 c6 0,9-5,8-10 C19 6,17 4,15 4Z" fill="url(#gMango)" stroke="#c96a14" stroke-width=".8"/><path d="M15 4 c1 0,2 1,2 2" stroke="#5f8a32" stroke-width="1.4" fill="none" stroke-linecap="round"/><ellipse cx="9" cy="9" rx="2.5" ry="1.6" fill="#fff" fill-opacity=".35" transform="rotate(-30 9 9)"/></svg>`,
  condensed:`<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="14" rx="1.5" fill="url(#gMilk)" stroke="#9b8a6e" stroke-width=".8"/><rect x="6" y="6" width="12" height="4" fill="url(#roastFull)"/><rect x="7.5" y="12" width="9" height="3" rx="1" fill="#c96a14" fill-opacity=".5"/><rect x="8" y="7.5" width="3" height="1.2" fill="#fff" fill-opacity=".4"/></svg>`,
  evaporated:`<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="14" rx="1.5" fill="url(#gMilk)" stroke="#9b8a6e" stroke-width=".8"/><rect x="6" y="6" width="12" height="4" fill="url(#gSteel)"/><rect x="7.5" y="13" width="9" height="3" rx="1" fill="#a9d4ec" fill-opacity=".6"/><rect x="8" y="7.5" width="3" height="1.2" fill="#fff" fill-opacity=".4"/></svg>`,
  milk:`<svg viewBox="0 0 24 24"><path d="M8 8 V5 h8 v3 l1 3 v8 a1 1 0 0 1-1 1 H8 a1 1 0 0 1-1-1 v-8 Z" fill="url(#gMilk)" stroke="#9b8a6e" stroke-width=".8"/><path d="M7 13 h10 v6 a1 1 0 0 1-1 1 H8 a1 1 0 0 1-1-1 Z" fill="#fff" fill-opacity=".5"/><rect x="9" y="6" width="2.5" height="1.4" fill="#fff" fill-opacity=".5"/></svg>`,
  coconut:`<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="url(#gJaggery)" stroke="#5a3414" stroke-width=".8"/><path d="M8 7 a8 8 0 0 1 8 0 a8 8 0 0 1-1 13 a10 10 0 0 0 1-13Z" fill="#fff" fill-opacity=".12"/><circle cx="10" cy="11" r="1" fill="#3a2415"/><circle cx="14" cy="11" r="1" fill="#3a2415"/><circle cx="12" cy="14" r="1" fill="#3a2415"/><ellipse cx="9" cy="9" rx="2" ry="1.3" fill="#fff" fill-opacity=".25" transform="rotate(-30 9 9)"/></svg>`,
  ice:`<svg viewBox="0 0 24 24"><rect x="4" y="9" width="9" height="9" rx="1.5" transform="rotate(-8 8 13)" fill="url(#gIce)" stroke="#7fb2cf" stroke-width=".7"/><rect x="11" y="6" width="9" height="9" rx="1.5" transform="rotate(10 15 10)" fill="url(#gIce)" stroke="#7fb2cf" stroke-width=".7"/><path d="M6 11 l2 0 M13 8 l2 0" stroke="#fff" stroke-opacity=".6" stroke-width="1" stroke-linecap="round"/></svg>`,
  egg:`<svg viewBox="0 0 24 24"><ellipse cx="12" cy="14" rx="9" ry="6" fill="url(#gMilk)"/><circle cx="12" cy="13" r="4.5" fill="url(#gYolk)" stroke="#e0902a" stroke-width=".6"/><ellipse cx="10.5" cy="11.5" rx="1.6" ry="1.1" fill="#fff" fill-opacity=".5"/></svg>`,
  sugar:`<svg viewBox="0 0 24 24"><rect x="5" y="11" width="7" height="7" rx="1" fill="url(#gMilk)" stroke="#cbb68f" stroke-width=".7"/><rect x="12" y="8" width="7" height="7" rx="1" fill="url(#gMilk)" stroke="#cbb68f" stroke-width=".7"/><rect x="6.5" y="12.5" width="2" height="2" fill="#fff" fill-opacity=".6"/></svg>`,
  jaggery:`<svg viewBox="0 0 24 24"><path d="M5 12 l7-3 l7 3 l-2 6 l-10 0 Z" fill="url(#gJaggery)" stroke="#5a3414" stroke-width=".8"/><path d="M5 12 l7-3 l7 3 l-7 2 Z" fill="#fff" fill-opacity=".15"/></svg>`,
  cardamom:`<svg viewBox="0 0 24 24"><path d="M12 4 C8 8,8 16,12 20 C16 16,16 8,12 4Z" fill="url(#gGreen)" stroke="#4e7328" stroke-width=".8"/><path d="M12 4 C10 9,10 15,12 20" stroke="#3c5a1e" stroke-width="1" fill="none"/><ellipse cx="10.5" cy="9" rx="1.2" ry="2.4" fill="#fff" fill-opacity=".25"/></svg>`,
  cinnamon:`<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="18" rx="3" transform="rotate(12 12 12)" fill="url(#gJaggery)" stroke="#5a3414" stroke-width=".8"/><path d="M11 4 C10 9,10 15,11 20" stroke="#3a2008" stroke-width=".9" fill="none" opacity=".6" transform="rotate(12 12 12)"/><path d="M13.5 4 C12.5 9,12.5 15,13.5 20" stroke="#3a2008" stroke-width=".7" fill="none" opacity=".4" transform="rotate(12 12 12)"/></svg>`,
  vanilla:`<svg viewBox="0 0 24 24"><path d="M9 3 C7 9,8 17,11 21 C12 21,13 20,13 19 C11 15,11 8,12 4 C11 3,10 3,9 3Z" fill="url(#gJaggery)" stroke="#4a2c12" stroke-width=".7"/><path d="M9.5 5 C8.5 10,9 16,11 20" stroke="#2a1808" stroke-width=".7" fill="none"/></svg>`,
  honey:`<svg viewBox="0 0 24 24"><path d="M12 4 C12 4,7 12,7 16 a5 5 0 0 0 10 0 C17 12,12 4,12 4Z" fill="url(#gMango)" stroke="#c96a14" stroke-width=".8"/><ellipse cx="10" cy="13" rx="1.4" ry="2.2" fill="#fff" fill-opacity=".4"/></svg>`,
  salt:`<svg viewBox="0 0 24 24"><path d="M9 9 h6 l1 10 a1 1 0 0 1-1 1 H9 a1 1 0 0 1-1-1 Z" fill="url(#gGlass)" stroke="#9b8a6e" stroke-width=".8"/><path d="M9 7 a3 3 0 0 1 6 0 Z" fill="url(#gSteel)"/><circle cx="11" cy="6" r=".5" fill="#3a3d42"/><circle cx="13" cy="6" r=".5" fill="#3a3d42"/><rect x="10" y="13" width="4" height="5" fill="#fff" fill-opacity=".45"/></svg>`,
  water:`<svg viewBox="0 0 24 24"><path d="M12 3 C12 3,6 11,6 16 a6 6 0 0 0 12 0 C18 11,12 3,12 3Z" fill="url(#gIce)" stroke="#7fb2cf" stroke-width=".8"/><ellipse cx="10" cy="13" rx="1.5" ry="2.4" fill="#fff" fill-opacity=".5"/></svg>`,
  coffee:`<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="5" ry="7.5" fill="url(#roastFull)"/><path d="M12 4.5 C9.7 8,13 16,12 19.5" stroke="#3a1f0e" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".75"/><ellipse cx="9.7" cy="9" rx="1.8" ry="2.4" fill="url(#roastSheen)" transform="rotate(-28 9.7 9)"/></svg>`,
  lemon:`<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8.5" ry="6.5" transform="rotate(-25 12 12)" fill="url(#gMango)" stroke="#c9a514" stroke-width=".8"/><path d="M19 7 l2.5 -2" stroke="#5f8a32" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="8.5" cy="9.5" rx="2.2" ry="1.4" fill="#fff" fill-opacity=".4" transform="rotate(-25 8.5 9.5)"/></svg>`,
  icecream:`<svg viewBox="0 0 24 24"><path d="M8 11 L12 21 L16 11 Z" fill="url(#gJaggery)" stroke="#7c4a1e" stroke-width=".6"/><circle cx="12" cy="9" r="5.5" fill="url(#gMilk)" stroke="#cbb68f" stroke-width=".6"/><circle cx="9.5" cy="8" r="2.4" fill="url(#gMilk)"/><circle cx="14.5" cy="8" r="2.4" fill="url(#gMilk)"/><ellipse cx="10" cy="7" rx="1.4" ry="1" fill="#fff" fill-opacity=".55"/></svg>`,
  cream:`<svg viewBox="0 0 24 24"><path d="M6 13 q2 -4 6 -4 q4 0 6 4 q-1 5 -6 5 q-5 0 -6 -5Z" fill="url(#gMilk)" stroke="#cbb68f" stroke-width=".7"/><path d="M9 9 q3 -3 6 0" fill="none" stroke="#fff" stroke-width="1.4" opacity=".6" stroke-linecap="round"/><ellipse cx="10" cy="13" rx="2" ry="1.3" fill="#fff" fill-opacity=".5"/></svg>`,
  tea:`<svg viewBox="0 0 24 24"><path d="M6 9 H18 L16.5 18 a3 3 0 0 1-3 2.5 H10.5 a3 3 0 0 1-3-2.5 Z" fill="url(#gCoffee)" stroke="#3a2415" stroke-width=".8"/><path d="M6.5 9 H17.5 L17 11 H7 Z" fill="#8a5a2a"/><path d="M18 11 a4 4 0 0 1 0 7" fill="none" stroke="#3a2415" stroke-width="1.4"/></svg>`,
  banana:`<svg viewBox="0 0 24 24"><path d="M5 8 C5 15,10 20,18 19 C19 19,20 18,19 17 C12 18,8 13,8 8 C8 7,6 7,5 8Z" fill="url(#gMango)" stroke="#c9a514" stroke-width=".8"/><path d="M18 19 l2 -1" stroke="#5a3414" stroke-width="1.6" stroke-linecap="round"/><path d="M7 9 C8 13,11 16,16 17" fill="none" stroke="#fff" stroke-width="1" opacity=".4"/></svg>`,
  orange:`<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="url(#gMango)" stroke="#c96a14" stroke-width=".8"/><path d="M12 6 a2 2 0 0 1 2 -2" stroke="#5f8a32" stroke-width="1.4" fill="none" stroke-linecap="round"/><ellipse cx="9" cy="10" rx="2.4" ry="1.6" fill="#fff" fill-opacity=".35" transform="rotate(-30 9 10)"/></svg>`,
  pineapple:`<svg viewBox="0 0 24 24"><path d="M8 3 L10 8 M12 2 L12 8 M16 3 L14 8" stroke="#5f8a32" stroke-width="1.6" stroke-linecap="round" fill="none"/><ellipse cx="12" cy="15" rx="6" ry="7" fill="url(#gMango)" stroke="#c96a14" stroke-width=".8"/><path d="M9 11 l6 8 M15 11 l-6 8 M8 15 h8" stroke="#b06a14" stroke-width=".7" opacity=".6"/></svg>`,
  chocolate:`<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="14" rx="1.5" fill="url(#gJaggery)" stroke="#4a2c12" stroke-width=".8"/><path d="M12 6 V20 M6 11 H18 M6 15.5 H18" stroke="#3a2008" stroke-width=".8" opacity=".7"/><rect x="7.5" y="7.5" width="3.5" height="2.5" fill="#fff" fill-opacity=".15"/></svg>`,
  ginger:`<svg viewBox="0 0 24 24"><path d="M6 13 q2 -5 6 -4 q1 -3 4 -2 q3 2 1 5 q3 1 1 4 q-3 2 -6 0 q-2 2 -5 0 q-2 -4 -1 -3Z" fill="url(#gJaggery)" stroke="#7c4a1e" stroke-width=".8"/><circle cx="10" cy="11" r="1" fill="#5a3414" opacity=".5"/><circle cx="14" cy="14" r="1" fill="#5a3414" opacity=".5"/></svg>`
};
function ingredientIcon(text){
  const t = (text||'').toLowerCase();
  const map = [
    ['condensed', ['condensed milk','condensed']],
    ['evaporated', ['evaporated']],
    ['coconut', ['coconut']],
    ['mango', ['mango']],
    ['egg', ['egg']],
    ['cardamom', ['cardamom']],
    ['cinnamon', ['cinnamon']],
    ['vanilla', ['vanilla']],
    ['jaggery', ['jaggery','palm sugar','gur']],
    ['honey', ['honey']],
    ['salt', ['salt']],
    ['icecream', ['ice cream','gelato']],
    ['banana', ['banana']],
    ['orange', ['orange']],
    ['pineapple', ['pineapple']],
    ['chocolate', ['chocolate','cocoa']],
    ['ginger', ['ginger']],
    ['ice', ['ice']],
    ['lemon', ['lemon']],
    ['cream', ['cream']],
    ['tea', ['tea']],
    ['coffee', ['coffee','espresso','grounds','ground coffee','instant']],
    ['sugar', ['sugar']],
    ['milk', ['milk']],
    ['water', ['water']]
  ];
  let best = null;
  for(const [key, words] of map){
    for(const w of words){
      const idx = t.indexOf(w);
      if(idx !== -1 && (best === null || idx < best.idx)) best = {key, idx};
    }
  }
  if(!best) return `<span class="ing-ico ing-dot"></span>`;
  return `<span class="ing-ico">${ING_ICONS[best.key]}</span>`;
}

/* ---------- living atmosphere: drifting beans ---------- */
