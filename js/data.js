/* ===== Brew Book — CONTENT & CONFIG =====
   The 38 recipes (SEED), method list, and roaster buying picks.
   Add or edit recipes HERE — no other file needs to change.
   Pure data + the D() date helper; safe to edit without touching app logic. */

const STORE_KEY = 'brewbook-recipes-v2';
const METHODS = ['all','moka pot','instant','blended','cezve','pour over','french press','cold brew','espresso','other'];
let recipes = [];
let activeMethod = 'all';
let triedFilter = 'all';   // all | tried | totry
let sortBy = 'serial';
let searchTerm = '';
let editingId = null;
let animateNext = true;  // play card entrance on load/filter/sort, not on every keystroke

const D = s => new Date(s + 'T09:00:00').getTime();

/* ---------- roaster buying guide (real products, India) ----------
   bluetokai.com and thirdwavecoffeeroasters.com — dark/medium-dark blends
   that suit moka pot + milk/sweet drinks. Updated June 2026. */
const ROASTER_PICKS = {
  'seed-mango': {
    bluetokai: ['Attikan Estate (Dark-Medium) — nutty, balanced, sweet; the cleanest base that lets mango lead'],
    thirdwave: ['Seattle / signature medium blend — dark chocolate & brown sugar, mellow enough for fruit']
  },
  'seed-coconut': {
    bluetokai: ['Vienna Roast (Dark) — bittersweet, great body, made for milk', 'French Roast (Darkest) — keeps a bite under coconut + condensed milk'],
    thirdwave: ['Signature South Indian Filter Blend (Dark, Arabica+Robusta) — smooth, strong, milk-friendly']
  },
  'seed-egg': {
    bluetokai: ['French Roast (Darkest) — bold, bittersweet; balances the sweet custard foam', 'Vienna Roast (Dark)'],
    thirdwave: ['Signature Filter Blend (Dark) — cocoa, bitter & intense, stands up to the egg']
  },
  'seed-suada': {
    bluetokai: ['French Roast (Darkest) — closest to traditional Vietnamese dark; cuts condensed milk'],
    thirdwave: ['Signature South Indian Filter Blend (Dark, Arabica+Robusta) — the robusta body is spot-on here']
  },
  'seed-bombon': {
    bluetokai: ['Vienna Roast (Dark) — bittersweet, strong enough for an equal part of condensed milk', 'Dhak Blend (Dark) — dark chocolate & fruit jam'],
    thirdwave: ['El Diablo Blend (Medium-Dark) — caramel, syrupy, sweet; pairs cleanly in the layered shot']
  },
  'seed-kopisusu': {
    bluetokai: ['Vienna Roast (Dark) — chocolatey depth that loves the jaggery', 'Dhak Blend (Dark) — dark chocolate & fruit jam'],
    thirdwave: ['Signature Filter Blend (Dark) — cocoa & intense; carries the palm-sugar syrup']
  },
  'seed-thai': {
    bluetokai: ['French Roast (Darkest) — smoky, bold; survives cardamom + two milks'],
    thirdwave: ['Signature South Indian Filter Blend (Dark) — robusta body for the spice and double milk']
  },
  'seed-bombon2': {}, // reserved
  'seed-frappe': {
    bluetokai: ['Instant Coffee Blends — Blue Tokai do a spray-dried instant; use that, not the moka roasts'],
    thirdwave: ['Instant Coffees — Third Wave have an instant range; a robusta-leaning one foams thickest']
  },
  'seed-shakerato': {
    bluetokai: ['Vienna Roast (Dark) or Dhak Blend — rich, chocolatey, good crema for the foam'],
    thirdwave: ['El Diablo (Medium-Dark) — caramel and syrupy; foams beautifully when shaken']
  },
  'seed-mazagran': {
    bluetokai: ['Attikan Estate (Dark-Medium) or a medium roast — bright enough to play with the lemon'],
    thirdwave: ['A medium / signature blend — brighter notes complement the citrus better than a heavy dark roast']
  },
  'seed-cafeolla': {
    bluetokai: ['Vienna Roast (Dark) — chocolatey body that carries the cinnamon and jaggery'],
    thirdwave: ['El Diablo (Medium-Dark) — caramel and syrupy; sits beautifully with the spice']
  },
  'seed-kaapi': {
    bluetokai: ['Any dark roast works, but a filter-style blend is most authentic; Vienna Roast does the job'],
    thirdwave: ['Signature South Indian Filter Blend — literally made for this; chicory depth and all']
  },
  'seed-cortadito': {
    bluetokai: ['French Roast (Darkest) or Vienna Roast — bold, chocolatey, stands up in a small cup'],
    thirdwave: ['Signature Filter Blend (Dark) — intense enough to cut the milk and sugar']
  },
  'seed-dalgona': {
    bluetokai: ['Instant Coffee Blends — Blue Tokai\u2019s spray-dried instant'],
    thirdwave: ['Instant Coffees — a robusta-leaning one whips thickest']
  },
  'seed-qahwa': {
    bluetokai: ['Vienna Roast (Dark) — chocolatey body to carry the six-spice blend'],
    thirdwave: ['El Diablo (Medium-Dark) — caramel depth that suits the warm spices']
  },
  'seed-yuenyeung': {
    bluetokai: ['French Roast (Darkest) — bold enough to stand beside strong milk tea'],
    thirdwave: ['Signature South Indian Filter Blend (Dark) — robusta body holds up to the tea']
  },
  'seed-turkish': {
    bluetokai: ['Any medium-dark roast, but it MUST be ground Turkish-fine — coarser grinds won\u2019t work'],
    thirdwave: ['A medium-dark blend ground powder-fine; the cezve method does the rest']
  },
  'seed-affogato': {
    bluetokai: ['Vienna Roast or French Roast — bold and chocolatey against the sweet cream'],
    thirdwave: ['El Diablo (Medium-Dark) — caramel notes that play with vanilla ice cream']
  },
  'seed-einspanner': {
    bluetokai: ['Vienna Roast (Dark) — fittingly Viennese; smooth and rich under cream'],
    thirdwave: ['Signature Filter Blend (Dark) — smooth body that carries the cream']
  },
  'seed-dolcelatte': { bluetokai: ['Vienna Roast (Dark) — smooth, chocolatey base for the cinnamon-vanilla syrup'], thirdwave: ['El Diablo (Medium-Dark) — caramel notes that suit the dolce syrup'] },
  'seed-saltcoffee': { bluetokai: ['French Roast (Darkest) — bold Vietnamese-style base for the salted cream'], thirdwave: ['Signature South Indian Filter Blend (Dark) — robusta body under the sweet-salty cap'] },
  'seed-mocha': { bluetokai: ['Vienna Roast or French Roast — bold and chocolatey, doubles the cocoa note'], thirdwave: ['Signature Filter Blend (Dark) — cocoa-forward, made for mocha'] },
  'seed-ipoh': { bluetokai: ['Attikan Estate (Dark-Medium) — smoother medium roast for the gentle Ipoh character'], thirdwave: ['A medium / signature blend — mellow and caramelly, not sharp'] },
  'seed-cafezinho': { bluetokai: ['Attikan Estate (Dark-Medium) — nutty, chocolatey, classic Brazilian-style'], thirdwave: ['El Diablo (Medium-Dark) — caramel and smooth, takes sugar well'] },
  'seed-carajillo': { bluetokai: ['French Roast (Darkest) or Vienna Roast — bold enough to stand up to the spirit'], thirdwave: ['Signature Filter Blend (Dark) — intense base under the brandy or rum'] },
  'seed-buna': { bluetokai: ['A medium Ethiopian-style roast — bright but not so light it sours in the moka'], thirdwave: ['A medium / brighter blend — the black drink where fruity notes belong'] },
  'seed-touba': { bluetokai: ['Vienna Roast (Dark) — bold base that carries the peppery selim spice'], thirdwave: ['Signature South Indian Filter Blend (Dark) — robusta body for the sweet-peppery brew'] },
  'seed-qishr': { bluetokai: ['Not a bean drink — ask for cascara (dried coffee husk); some specialty roasters stock it'], thirdwave: ['Look for cascara / coffee cherry tea from a specialty roaster'] },
  'seed-banana': { bluetokai: ['Instant Coffee Blends — any everyday instant blends smooth with banana'], thirdwave: ['Instant Coffees — a smooth one disappears nicely into the shake'] },
  'seed-coldcoffee': { bluetokai: ['Instant Coffee Blends — the classic choice for café cold coffee'], thirdwave: ['Instant Coffees — foams beautifully with the ice cream'] },
  'seed-chikoo': { bluetokai: ['Instant Coffee Blends — blends cleanly so the chikoo leads'], thirdwave: ['Instant Coffees — a smooth instant suits the fruit'] },
  'seed-orange': { bluetokai: ['Attikan Estate (Dark-Medium) or a medium roast — brighter notes for the orange'], thirdwave: ['A medium / signature blend — fruity enough to play with citrus'] },
  'seed-pineapple': { bluetokai: ['A clean medium roast — bright enough to cut the juice and fizz'], thirdwave: ['A medium / signature blend — keeps it crisp, not heavy'] },
  'seed-coffeejelly': { bluetokai: ['Vienna Roast (Dark) — sets into a clean, chocolatey coffee jelly'], thirdwave: ['Signature Filter Blend (Dark) — strong and smooth for the jelly'] },
  'seed-dirty': { bluetokai: ['French Roast (Darkest) — bold dark streaks through the cold milk'], thirdwave: ['Signature Filter Blend (Dark) — chocolatey and intense for the dirty look'] },
  'seed-brownsugar': { bluetokai: ['Vienna Roast (Dark) — balances the heavy brown-sugar syrup'], thirdwave: ['El Diablo (Medium-Dark) — caramel notes echo the brown sugar'] },
  'seed-cheesefoam': { bluetokai: ['Vienna Roast (Dark) — rich base under the salty cheese foam'], thirdwave: ['Signature Filter Blend (Dark) — smooth and strong beneath the cap'] },
  'seed-flashbrew': { bluetokai: ['Attikan Estate (Dark-Medium) — flash-brewing shows off its aromatics'], thirdwave: ['A medium / brighter single-origin — the flash chill keeps it crisp and fragrant'] }
};
/* What each roaster generally offers, shown once for reference */
const ROASTER_INFO = {
  bluetokai: 'Blue Tokai — 100% arabica specialty. For these drinks: Vienna Roast & French Roast (their two darkest, both "best with milk"), Dhak Blend (dark, choc + fruit jam), Attikan Estate (their darkest medium). Pick the "Moka Pot" grind at checkout. Also do instant blends.',
  thirdwave: 'Third Wave Coffee Roasters — blends across light to dark. For these drinks: the Signature South Indian Filter Blend (dark, arabica+robusta, milk chocolate + almond) is the workhorse; El Diablo (medium-dark, caramel/syrup) for layered shots. Also do instant & drip bags. Choose "Espresso / Moka Pot".'
};

/* ---------- embedded recipes (always here on first open) ---------- */
const SEED = [
{
  id:"seed-mango", serial:1, name:"Iced Mango Coffee",
  story:"Where it all started. Mango and coffee sound like they shouldn’t work — one is all sunshine and sweetness, the other dark and serious — but layered over ice they meet in the middle: the fruit softens the coffee’s edge, and the coffee keeps the mango from being just dessert. It’s the drink that kicked off this whole book, and the only one here that’s pure invention rather than tradition. Think of it as summer in a glass with a caffeine backbone.",
  bean:"Medium roast, nutty-chocolatey, low acidity (a Brazilian or Indian arabica). Skip floral/fruity light roasts here — their delicate berry/citrus notes fight the mango instead of supporting it. You want a clean, mellow base that lets the fruit lead.",
  description:"Layered iced coffee — sweet mango purée below, milk in the middle, strong coffee floating on top. The first one Claude and I made.",
  method:"moka pot", origin:"Fusion", ratio:"1:2:1", ratioLabel:"mango : milk : coffee", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-01'),
  ingredients:["1 ripe mango (about 3/4 cup pulp)","60 ml strong coffee — moka pot (15–17 g grounds) or 2 tsp instant in 60 ml hot water","150 ml chilled milk","2 tsp sugar or honey (adjust to mango sweetness)","1 cup ice cubes"],
  steps:[{t:"Brew strong coffee",c:"Brew 60 ml strong coffee. Moka pot: water to the safety valve, fill the basket level but never tamped, low-medium heat, pull off when it gurgles. Let it cool slightly."},{t:"Blend the mango",c:"Blend the mango with sugar and a splash of milk until completely smooth. Strain if fibrous."},{t:"Layer the glass",c:"Pour the mango purée into a tall glass, add ice, then slowly pour the milk over the ice."},{t:"Top with coffee",c:"Float the coffee on top by pouring it over the back of a spoon. Stir before drinking."}],
  notes:"Don’t go weaker than 2 tsp instant per 60 ml — mango drowns out weak coffee. Alphonso or Kesar mango works best."
},
{
  id:"seed-coconut", serial:2, name:"Coconut Coffee (Cà Phê Dừa)",
  story:"Vietnam’s answer to a heatwave. Walk into a café in Saigon and you’ll find this everywhere — strong dark coffee poured over a blizzard of blended coconut and condensed milk, so cold and thick that the first few sips ask for a spoon. It drinks like dessert but hits like espresso. The whole joy is in the contrast: frost on top, hot coffee cutting down through the cream as you go.",
  bean:"Dark roast robusta or a robusta-heavy blend — bold, chocolatey and full-bodied to punch through coconut cream and condensed milk. This is the classic Vietnamese choice; a light roast would simply vanish under the richness.",
  description:"Vietnamese-style coffee slushy — hot moka coffee poured over a frosty coconut–condensed milk slush. Creamy on top, frosty at the bottom.",
  method:"moka pot", origin:"Vietnam", ratio:"1:2", ratioLabel:"coffee : coconut blend", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-02'),
  ingredients:["17 g ground coffee (moka basket level, never tamped)","60 ml water (to the moka pot safety valve)","100 ml thick coconut milk (canned, full-fat)","2 tbsp condensed milk","1 cup ice cubes","1 pinch of salt"],
  steps:[{t:"Brew the coffee",c:"Brew the moka pot: water to the safety valve, basket level not tamped, low-medium heat, pull off when it gurgles."},{t:"Blend the slush",c:"Blend coconut milk, condensed milk, salt and ice for 30–45 sec until it’s a thick frosty slush."},{t:"Fill the glass",c:"Spoon the slush into a glass, about two-thirds full."},{t:"Pour coffee over",c:"Pour the hot coffee directly over the slush and stir as you drink."}],
  notes:"Instant version: 2 heaped tsp instant coffee in 60 ml hot water, everything else same. Salt is mandatory — it cuts the sweetness. Less sweet: 1 tbsp condensed milk + extra splash coconut milk."
},
{
  id:"seed-egg", serial:3, name:"Vietnamese Egg Coffee (Cà Phê Trứng)",
  story:"Born from a shortage. In 1940s Hanoi, when fresh milk was scarce and expensive, a bartender whipped egg yolk with condensed milk instead — and accidentally invented one of the world’s great coffees. The yolk turns into a warm, sweet custard that sits on the coffee like a hat. Don’t let the word ‘egg’ scare you off: it tastes like tiramisu, not breakfast. Hanoi still serves it in tiny old cafés tucked down narrow alleys.",
  bean:"Dark roast robusta with strong cocoa / bitter-chocolate notes — that edge is what balances the sweet custard foam. A bright, acidic light roast would taste sour against the egg; you want deep and roasty here.",
  description:"Hanoi’s famous egg coffee — a warm whipped egg-yolk and condensed milk foam, thick like custard, floating on strong coffee. Tastes like tiramisu in a cup.",
  method:"moka pot", origin:"Vietnam", ratio:"1:2", ratioLabel:"coffee : egg foam", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-05'),
  ingredients:["1 very fresh egg yolk","2 tbsp condensed milk","1/4 tsp vanilla (optional)","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)"],
  steps:[{t:"Set up the yolk",c:"Separate the yolk cleanly into a small deep bowl with condensed milk and vanilla."},{t:"Whip the foam",c:"Whip 3–4 min with a frother until pale, thick and it holds a ribbon."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Pour the coffee",c:"Pour coffee into a small cup, about a third full."},{t:"Float the foam",c:"Spoon the egg foam on top so it floats; eat with a spoon or stir in halfway."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Whipping is the whole secret — don’t rush or it tastes eggy. Freshest egg possible. Cocoa powder on top if you have it. Serve warm."
},
{
  id:"seed-suada", serial:4, name:"Vietnamese Iced Coffee (Cà Phê Sữa Đá)",
  story:"The original, and the blueprint for half this book. When the French brought coffee to Vietnam but fresh milk wouldn’t survive the heat, locals reached for the tin of sweetened condensed milk instead — and a classic was born. Bold robusta, sweet milk, a mountain of ice. Master the balance here and the coconut and egg versions are just this with one extra step. If you only learn one Vietnamese coffee, make it this one.",
  bean:"Dark roast robusta — the traditional Vietnamese bean. Bold, low-acid and bitter enough to cut clean through sweet condensed milk. Phin-style dark robusta (Trung Nguyen, or any robusta-heavy dark blend) is the authentic move.",
  description:"The original Vietnamese iced coffee — strong coffee stirred into sweet condensed milk, poured over ice. The master recipe the others are built on.",
  method:"moka pot", origin:"Vietnam", ratio:"1:2", ratioLabel:"condensed milk : coffee", strength:4,
  tried:true, rating:0, createdAt:D('2026-06-08'),
  ingredients:["2 tbsp condensed milk","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1 cup ice cubes"],
  steps:[{t:"Start with the milk",c:"Spoon condensed milk into the bottom of the glass."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Stir into the milk",c:"Pour hot coffee onto the milk and stir hard 20–30 sec until smooth and caramel-coloured."},{t:"Pour over ice",c:"Fill with ice, stir until frosty, add more condensed milk if you want it sweeter."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. This is the master recipe. Stir while hot so the milk dissolves before the ice goes in. More condensed milk = dessert-sweet, less = sharper kick."
},
{
  id:"seed-bombon", serial:5, name:"Café Bombón (Spanish Layered Coffee)",
  story:"Spain’s little jewel. Born in Valencia, it’s almost too pretty to drink: equal parts condensed milk and strong coffee, poured so they settle into two clean bands — dark over cream — in a small clear glass. The name means ‘bonbon,’ and that’s exactly the size and spirit: tiny, sweet, intense. You admire the layers for a moment, then stir them into one smooth, sweet shot.",
  bean:"Dark roast, chocolatey-nutty espresso-style blend (arabica-robusta) — strong and concentrated enough to stand against an equal part of condensed milk. Spanish tradition leans very dark; keep it bold so the coffee layer holds its own.",
  description:"Spanish layered coffee — equal parts condensed milk and strong coffee in a small clear glass, sitting in two clean bands. Small, sweet, striking.",
  method:"moka pot", origin:"Spain", ratio:"1:1", ratioLabel:"condensed milk : coffee", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-10'),
  ingredients:["1 tbsp condensed milk","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)"],
  steps:[{t:"Pour the milk",c:"Pour condensed milk into a small clear glass. It needs to be clear so you can see the two layers — that’s the whole charm."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Layer the coffee",c:"Hold a spoon upside down above the milk and pour coffee over the back of it so it layers on top in a clean dark band."},{t:"Show, then stir",c:"Serve as-is for the two-tone look, then stir together into a sweet smooth shot before drinking."}],
  notes:"Instant: 1 heaped tsp in 30–40 ml hot water — keep it strong and small. Clear glass is essential for the layers. It’s a small intense shot, don’t scale up to a mug. Pour slow over the spoon for a clean line."
},
{
  id:"seed-kopisusu", serial:6, name:"Es Kopi Susu (Indonesian Iced Coffee)",
  story:"Indonesia’s modern café darling. ‘Kopi susu’ simply means ‘coffee milk,’ but the new-wave Jakarta version added a spoon of palm sugar for caramel depth — and the streaky syrup running down the inside of the glass became its signature look. Indonesia grows some of the world’s boldest robusta, and here it turns earthy and chocolatey under sweet milk and that jaggery edge. The lucky part for you: gur from your own kitchen does the job perfectly.",
  bean:"Dark roast Indonesian — Sumatra (Mandheling) or Java — or a robusta blend. Earthy, full-bodied and low-acid, with a heavy chocolate depth that pairs beautifully with the jaggery/palm-sugar syrup.",
  description:"Indonesian café coffee — strong coffee and condensed milk lifted with jaggery/palm sugar for caramel depth, over ice.",
  method:"moka pot", origin:"Indonesia", ratio:"1:2", ratioLabel:"condensed milk : coffee", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-12'),
  ingredients:["2 tbsp condensed milk","1 tbsp palm sugar or jaggery (gur), grated","1 tbsp hot water (to melt the sugar)","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1 cup ice cubes"],
  steps:[{t:"Make the syrup",c:"Melt jaggery with hot water into a thick dark syrup, then swirl it up the inside walls of the glass for the streaky café look."},{t:"Add condensed milk",c:"Add condensed milk on top of the syrup."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Stir together",c:"Pour hot coffee in and stir to a smooth caramel brown."},{t:"Pour over ice",c:"Fill with ice and stir cold; add more condensed milk if needed."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Jaggery (gur) = the Indonesian twist. Swirl the syrup up the walls for the streaky café look."
},
{
  id:"seed-thai", serial:7, name:"Thai Iced Coffee (Oliang-style)",
  story:"Thailand’s street-cart classic. ‘Oliang’ is the strong black coffee Thai vendors brew through a cloth sock filter, traditionally roasted with corn and sesame for a smoky depth. Sweetened heavily, poured over ice, then finished with a ribbon of evaporated milk swirling down through the dark — that two-milk cascade is the signature move. The cardamom is my small shortcut to that ‘what is that flavour?’ Thai taste, using something you almost certainly already have in the kitchen.",
  bean:"Dark roast robusta blend — bold and a touch smoky, so it carries the cardamom spice and survives the double hit of condensed and evaporated milk. Traditional Oliang blends even add roasted grains; a dark robusta gets you the same deep, smoky base.",
  description:"Thai iced coffee — sweet spiced coffee over ice, finished with a float of evaporated milk that swirls down in white ribbons.",
  method:"moka pot", origin:"Thailand", ratio:"1:2", ratioLabel:"milk : coffee", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-12'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","1 cardamom pod, lightly crushed","60 ml water (to the moka pot safety valve)","1.5 tbsp condensed milk","1 tsp sugar","1 cup ice cubes","2 tbsp evaporated or regular milk for the float"],
  steps:[{t:"Brew spiced coffee",c:"Brew the moka pot with the crushed cardamom pod tucked in the basket; pull off when it gurgles."},{t:"Sweeten it",c:"Stir condensed milk and sugar into the hot coffee until glossy."},{t:"Pour over ice",c:"Fill a tall glass with ice and pour the coffee over."},{t:"Float the milk",c:"Float evaporated milk on top so it blooms and swirls down through the dark coffee; stir before drinking."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water; steep crushed cardamom in it a minute then remove. Two-milk system is the signature. Skip cardamom for plain."
},
{
  id:"seed-frappe", serial:8, name:"Greek Frappé",
  story:"An accident that became a national habit. At a 1957 trade fair in Thessaloniki, a Nestlé rep wanted a coffee but had no hot water — so he shook instant coffee with cold water and ice in a shaker, and the frappé was born. Greece has been sipping it through long summer afternoons ever since. It’s the one coffee in this book that needs instant — only spray-dried coffee whips into that thick, lasting foam. Order it like a local by sweetness: sketos, metrios, or glykos.",
  bean:"No moka beans here — this one is instant by design. A robusta-based instant (the classic Nescafé-style) whips into a thicker, longer-lasting foam than a smooth arabica instant. The foam is the whole point, so robusta wins.",
  description:"The Greek summer classic — instant coffee, a splash of water and sugar shaken into a thick foam, poured over ice and topped with cold water. The one coffee that needs instant.",
  method:"instant", origin:"Greece", ratio:"2:1", ratioLabel:"coffee : sugar", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-13'),
  ingredients:["2 tsp instant coffee","1 tsp sugar (adjust to taste)","3 tbsp cold water (for the foam)","1 cup ice cubes","150 ml cold water (to top up)","2 tbsp milk (optional splash)"],
  steps:[{t:"Combine the base",c:"Put instant coffee, sugar and 3 tbsp cold water in a sealable jar (or tall glass with a frother). Keep the water small — a thick paste foams best."},{t:"Shake to foam",c:"Shake the sealed jar hard for about a minute (or whisk/froth) until it’s a thick, pale, mousse-like foam that holds its shape."},{t:"Foam over ice",c:"Add ice to a tall glass, then spoon and pour the foam over the ice."},{t:"Top with water",c:"Slowly top up with cold water (and milk if you like). Serve with a straw and don’t stir — sip through the foam."}],
  notes:"Must use instant — won’t foam with brewed. Keep the foam water tiny for a thick paste. Order by sugar: sketos (none), metrios (medium), glykos (sweet). Milk splash = frappé me gala."
},
{
  id:"seed-shakerato", serial:9, name:"Caffè Shakerato (Italian Shaken Coffee)",
  story:"Italy, the moka pot’s homeland. When the Italian summer makes a hot espresso unthinkable, baristas pour a fresh shot into a cocktail shaker with ice and shake it hard until it turns thick and frothy, then strain it — no ice, no milk — into a chilled coupe glass. It’s coffee dressed up as a cocktail: all crema and elegance. It’s the same shake-it-to-foam trick as the Greek frappé, but with real hot-brewed coffee, so it comes out richer and more grown-up. After a row of sweet milky drinks, this is the sophisticated black one.",
  bean:"Medium-dark to dark espresso roast with good body and crema — that’s what foams up thick when shaken. Chocolatey and smooth rather than bright; it’s served black, so the bean’s character is front and centre.",
  description:"Italian shaken iced coffee — strong moka coffee shaken hard with ice until frothy, then strained into a chilled glass. No milk.",
  method:"moka pot", origin:"Italy", ratio:"2:1", ratioLabel:"coffee : sugar", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tsp sugar (dissolve while hot)","1 cup ice cubes (for shaking)"],
  steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten while hot",c:"Stir sugar into the hot coffee until fully dissolved — this must happen while it’s hot."},{t:"Load the shaker",c:"Fill a cocktail shaker (or sealed jar) with ice and pour in the sweetened coffee."},{t:"Shake hard",c:"Shake hard for 15–20 sec until the outside frosts over and the coffee turns thick with foam."},{t:"Strain and serve",c:"Strain into a chilled glass, leaving the ice behind; the foam settles into a crema on top."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Dissolve sugar while hot; shake HARD — the foam is the point. Strain the ice out; a chilled martini or coupe glass is the traditional serve. Splash of coffee liqueur for an aperitivo version."
},
{
  id:"seed-mazagran", serial:10, name:"Mazagran (Portuguese Lemon Iced Coffee)",
  story:"One of the original iced coffees, with a curveball. French Foreign Legion soldiers stationed at the Algerian fort of Mazagran in the 1840s cut their coffee with cold water to survive the heat; Portugal adopted the idea and added lemon. It sounds wrong until you taste it — the citrus lifts the coffee and cuts the bitterness, turning something strong into something shockingly refreshing. After a long row of sweet, milky drinks, this is the bright, tart outlier — and the one place a brighter, fruitier bean finally earns its keep.",
  bean:"The one that flips the rule: with no milk to cut through, a medium roast with brighter, fruitier notes actually shines alongside the lemon. The citrus loves a more balanced, less-dark bean — the very kind to avoid in the milk drinks.",
  description:"Portugal’s lemon iced coffee — strong sweetened coffee over ice with fresh lemon. Tart, bright and unexpectedly refreshing.",
  method:"moka pot", origin:"Portugal", ratio:"4:1", ratioLabel:"coffee : lemon juice", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tsp sugar (dissolve while hot)","15 ml fresh lemon juice (about half a lemon)","1 lemon slice, to garnish","1 cup ice cubes"],
  steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten while hot",c:"Stir sugar into the hot coffee until dissolved, then let it cool."},{t:"Add the lemon",c:"Stir in the lemon juice; taste and add a little more only if you want it brighter."},{t:"Pour over ice",c:"Fill a glass with ice, pour over, and garnish with a lemon slice. Stir and sip."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Start with less lemon and taste up — bright, not sour. Splash of rum for adults; top with soda for a fizzy version. A medium roast actually shines here since there’s no milk."
},
{
  id:"seed-cafeolla", serial:11, name:"Café de Olla (Mexican Spiced Coffee)",
  story:"Time to cross the Atlantic to the Americas. Café de Olla is Mexico’s cozy spiced coffee, traditionally brewed in a clay pot — the ‘olla’ that gives it its name and an earthy depth. The magic is cinnamon and piloncillo, raw unrefined cane sugar, simmered right into the coffee until it turns sweet, warming and faintly molasses-y. The lovely part for you: piloncillo and your jaggery (gur) are practically cousins, so your kitchen already has the secret ingredient. It’s gentle and a little festive — a coffee made for cool evenings and slow mornings.",
  bean:"A medium-dark roast — enough body to carry the cinnamon and jaggery, but not so dark that it fights the spice. Chocolatey and smooth rather than sharp.",
  description:"Mexico’s cozy spiced coffee — strong coffee brewed with cinnamon and sweetened with jaggery. Warm, gently spiced and faintly molasses-y.",
  method:"moka pot", origin:"Mexico", ratio:"2:1", ratioLabel:"coffee : jaggery", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","1 small cinnamon stick, broken (or 1/2 tsp ground cinnamon)","60 ml water (to the moka pot safety valve)","1.5 tbsp jaggery (gur) or piloncillo, grated","1 tbsp hot water (to melt the jaggery)","1 strip orange peel + 1 clove (optional, traditional)"],
  steps:[{t:"Brew with cinnamon",c:"Tuck the broken cinnamon stick into the moka basket with the grounds and brew; the steam carries the cinnamon right through. Pull off when it gurgles."},{t:"Make the syrup",c:"Melt jaggery with 1 tbsp hot water (and the orange peel/clove if using) into a thick dark syrup."},{t:"Sweeten and spice",c:"Stir the syrup into the hot coffee until dissolved; fish out the peel and clove."},{t:"Serve warm",c:"Pour into a mug and serve warm — or over a glass of ice for an iced version."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water; steep cinnamon in it first. Jaggery (gur) is the perfect stand-in for piloncillo. Don’t oversweeten — taste cinnamon and caramel, not just sugar. Orange peel + clove make it smell like the holidays. Warm or iced."
},
{
  id:"seed-kaapi", serial:12, name:"South Indian Filter Coffee (Kaapi)",
  story:"Coming home for this one. After touring the world, here’s the milky, frothy cup most of India grew up smelling in the kitchen. Strong coffee ‘decoction’ is cut with lots of hot milk and sugar, then pulled between a tumbler and a dabarah from a height until it’s foamy and just cool enough to sip. Traditionally it’s brewed in a metal filter with a chicory-coffee blend — your moka pot makes a fine stand-in for the filter, and that South Indian filter blend I kept recommending for the milk drinks is finally on its home turf.",
  bean:"The South Indian filter blend (arabica + robusta + chicory) is the obvious match — this is its home turf. The chicory gives kaapi its authentic bittersweet depth and body under all that milk.",
  description:"South India’s beloved milky coffee — strong moka decoction cut with hot milk and sugar, pulled between two vessels until frothy. Comforting and creamy.",
  method:"moka pot", origin:"India", ratio:"1:3", ratioLabel:"decoction : milk", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["18 g ground coffee — South Indian filter blend (with chicory) is ideal","60 ml water (to the moka pot safety valve)","150 ml full-fat milk","2 tsp sugar (to taste)"],
  steps:[{t:"Make the decoction",c:"Brew the moka pot — this strong shot is your ‘decoction’. Pull off when it gurgles."},{t:"Heat the milk",c:"Heat the milk until steaming hot but not boiling over."},{t:"Combine",c:"Combine the decoction, hot milk and sugar in a tall tumbler; stir to dissolve the sugar."},{t:"Pull it frothy",c:"Pour back and forth between two cups (or a tumbler and a bowl) from a height, 5–6 times, until frothy and well mixed. Serve immediately."}],
  notes:"Instant works in a pinch, but a chicory filter blend gives the authentic depth. Full-fat milk is non-negotiable. Strong decoction is key. The pour-from-height mixes, froths, and cools in one move. More milk = milder."
},
{
  id:"seed-cortadito", serial:13, name:"Cuban Cortadito",
  story:"From Mexico down to the Caribbean. The cortadito is Cuba’s small, strong, sweet milk coffee, and it has a gorgeous signature trick called espuma: you whip the very first dark drops of the brew with sugar into a pale golden foam, then the rest of the coffee froths up over it. No machine, no egg — just sugar and elbow grease making its own sweet crema. It’s the third ‘whip it to foam’ move in this book, reached a completely different way: egg yolk in Hanoi, a hard shake in Greece and Italy, and here, whipped sugar in Havana.",
  bean:"A dark espresso roast — bold and chocolatey so it punches through the milk in such a small cup. Smooth and rich, not bright or acidic.",
  description:"Cuba’s small, sweet milk coffee — strong coffee with a whipped-sugar espuma crema, cut with equal hot milk. Rich and frothy.",
  method:"moka pot", origin:"Cuba", ratio:"1:1", ratioLabel:"coffee : milk", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (dark roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tsp sugar","60 ml hot milk (equal to the coffee)"],
  steps:[{t:"Catch the first drops",c:"Put the sugar in a small cup. Start brewing the moka pot and catch the very first dark drops (about 1 tsp) into the sugar."},{t:"Whip the espuma",c:"Whip those first drops and the sugar hard with a spoon for a minute until it turns into a pale, thick, light-brown foam — the espuma."},{t:"Pour the coffee in",c:"Let the rest of the coffee finish brewing, then pour it into the espuma. It foams up into a creamy golden crema."},{t:"Add equal milk",c:"Heat the milk until steaming, pour in an equal amount, and stir gently. Serve in a small glass."}],
  notes:"Instant: whip the sugar with a thick paste of 1 tsp instant + a few drops hot water. Espuma is the Cuban secret — naturally sweet crema, no machine. Dark espresso roast is best. Equal milk = cortadito; more milk = cortado."
},
{
  id:"seed-dalgona", serial:14, name:"Dalgona Coffee (Korean Whipped Coffee)",
  story:"Korea’s contribution, and one you can make right now with just instant coffee. Dalgona went viral during the 2020 lockdowns, but it’s rooted in a whipped coffee long served in Macau and Korea. You beat instant coffee, sugar and hot water into a thick caramel cloud and spoon it over cold milk. It’s named after dalgona, a Korean honeycomb-sugar candy it matches in colour. Like the Greek frappé, it only works with instant — spray-dried coffee is the secret to the foam.",
  bean:"Instant by design — like the Greek frappé, only spray-dried instant whips into a stable cloud. A robusta-leaning instant gives the thickest, most stable foam.",
  description:"Korea’s viral whipped coffee — instant coffee, sugar and hot water beaten into a fluffy caramel cloud, spooned over cold milk.",
  method:"instant", origin:"South Korea", ratio:"1:1:1", ratioLabel:"coffee : sugar : water", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["2 tbsp instant coffee (must be instant)","2 tbsp sugar","2 tbsp hot water","200 ml cold milk","1 cup ice cubes"],
  steps:[{t:"Combine the three",c:"Combine the instant coffee, sugar and hot water in a bowl."},{t:"Whip to a cloud",c:"Whip hard with a hand mixer, frother or whisk until it’s a thick, fluffy, pale-caramel cream that holds peaks — 2–3 min with a mixer, longer by hand."},{t:"Ice the milk",c:"Fill a glass with ice and pour in the cold milk, leaving room at the top."},{t:"Top with the cloud",c:"Spoon the whipped coffee cloud on top of the milk. Admire it, then stir to drink."}],
  notes:"It MUST be instant coffee — like the Greek frappé, only spray-dried coffee whips into a stable foam. The 1:1:1 ratio is the whole magic. By hand it’s 5+ minutes; an electric frother or mixer does it in 2–3 min. Serve over iced milk, or warm milk in winter."
},
{
  id:"seed-qahwa", serial:15, name:"Moroccan Spiced Coffee (Qahwa)",
  story:"North Africa now. Moroccans perfume their coffee with a warming spice blend, and the secret that sets it apart from a sweet dessert-spice is black pepper and ginger — they give it a gentle heat rather than just sweetness. Served strong and sweet, it’s a gesture of hospitality, often offered to guests alongside dates or pastries.",
  bean:"A medium-dark roast with body to carry the spice without fighting it. Chocolatey and smooth; the six-spice blend is the star here, not bright bean notes.",
  description:"Morocco’s spiced coffee — strong coffee brewed with a warming blend of cinnamon, cardamom, clove, nutmeg, black pepper and ginger. Strong, sweet, fragrant.",
  method:"moka pot", origin:"Morocco", ratio:"½ tsp", ratioLabel:"spice blend per cup", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","1/2 tsp spice blend: pinch each of cinnamon, cardamom, clove, nutmeg, black pepper, ginger","60 ml water (to the moka pot safety valve)","2 tsp sugar (to taste)","60 ml hot milk (optional)"],
  steps:[{t:"Spice the grounds",c:"Mix the spice blend into the ground coffee right in the moka basket so the spices brew through the coffee."},{t:"Brew",c:"Brew the moka pot: low-medium heat, basket level not tamped, pull off when it gurgles."},{t:"Sweeten",c:"Stir in the sugar until dissolved. Add a splash of hot milk if you’d like it milky."},{t:"Serve",c:"Pour and serve strong and hot. Great with a date or a sweet pastry on the side."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water, stirred with the spice blend. Black pepper and ginger are what make it Moroccan rather than a sweet dessert spice; don’t skip them. Start with a small pinch of each and adjust — the pepper should warm, not bite."
},
{
  id:"seed-yuenyeung", serial:16, name:"Hong Kong Yuenyeung (Coffee Milk Tea)",
  story:"One gloriously unusual one from Hong Kong: coffee mixed with milk tea. The name means ‘mandarin duck pair,’ the symbol for two things that belong together — coffee for the kick, Hong Kong-style milk tea for the smoothness. It was born in the city’s cha chaan teng tea houses, where it’s served both steaming hot and over ice.",
  bean:"Bold and dark — it has to hold its own against strong black tea and evaporated milk. A dark robusta blend keeps the coffee side from getting lost.",
  description:"Hong Kong’s coffee-meets-milk-tea drink — strong coffee blended with sweet, creamy black milk tea. Served hot or iced.",
  method:"moka pot", origin:"Hong Kong", ratio:"3:7", ratioLabel:"coffee : milk tea", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["60 ml strong coffee (moka pot, or 2 tsp instant in 60 ml hot water)","140 ml strong brewed black tea (Ceylon-style, brewed dark)","2 tbsp evaporated milk (or 1.5 tbsp condensed milk)","2 tsp sugar (skip if using condensed milk)","1 cup ice cubes (for the iced version)"],
  steps:[{t:"Brew the coffee",c:"Brew 60 ml strong coffee and set aside."},{t:"Brew strong tea",c:"Brew the black tea strong and dark — steep 4–5 minutes, then remove the leaves or bag."},{t:"Mix the pair",c:"Combine the coffee and tea (about 3 parts coffee to 7 parts tea), then stir in the evaporated milk and sugar until smooth."},{t:"Hot or iced",c:"Serve hot, or pour over ice for an iced yuenyeung. Stir and sip."}],
  notes:"Both the coffee and tea need to be strong — weak versions taste muddy. Steep the tea darker than you’d drink it alone. Evaporated milk + sugar is the classic combo; condensed milk is a sweeter shortcut. Start at 3:7 and nudge toward whichever you love more."
},
{
  id:"seed-turkish", serial:17, name:"Turkish Coffee (Türk Kahvesi)",
  story:"The one recipe that breaks our moka pattern, and one of the oldest ways to make coffee anywhere. Türk Kahvesi is brewed in a little long-handled pot called a cezve, with coffee ground to a powder finer than flour, simmered slowly so a prized foam rises. It’s Ottoman, centuries old, recognised by UNESCO as cultural heritage — and people even read fortunes from the grounds left in the cup. This is your graduate piece: a different grind, a different pot, a different pace.",
  bean:"Needs a special powder-fine grind (finer than espresso) — ask a shop to grind it ‘Turkish fine’. A medium-dark blend is traditional; here the method, not the bean, is the star.",
  description:"One of the oldest coffee methods — powder-fine coffee simmered slowly in a cezve until a prized foam rises, served unfiltered. Intense and ceremonial.",
  method:"cezve", origin:"Turkey", ratio:"1 tsp / cup", ratioLabel:"powder-fine coffee per cup", strength:5,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["1 heaped tsp extra-fine coffee (powder-fine, finer than espresso)","65 ml cold water","1 tsp sugar (0 = sade, 1 = orta, 2 = şekerli) — decide now","1 cardamom pod, crushed (optional, traditional)"],
  steps:[{t:"Combine cold",c:"In a cezve or small pot, combine the fine coffee, cold water, sugar and crushed cardamom. Stir once to mix."},{t:"Heat gently",c:"Heat very slowly on low. Do not stir again. As a dark foam rises, spoon a little into your cup."},{t:"Catch the foam",c:"When it foams up near the top (just before boiling), take it off the heat. For more foam, briefly return it to the heat once more."},{t:"Pour and settle",c:"Pour gently into the cup, keeping the foam on top. Let it sit a minute so the grounds settle before sipping."}],
  notes:"The grind must be powder-fine — finer than espresso — or it won’t work. A moka pot won’t make this; you need a cezve or small saucepan. Never boil — heat slowly. The foam (köpük) is prized. Decide sugar BEFORE brewing; you never stir again. Don’t drink the muddy bottom."
},
{
  id:"seed-affogato", serial:18, name:"Affogato (Italian Coffee + Ice Cream)",
  story:"Italy’s two-ingredient genius. ‘Affogato’ means ‘drowned’ — a scoop of cold vanilla ice cream drowned in a shot of hot coffee, poured over right at the table. Hot meets cold, dessert meets digestivo, and it’s done in under a minute. It’s the after-dinner staple that’s somehow both pudding and espresso at once.",
  bean:"A bold, dark espresso roast — it has to cut through sweet, cold ice cream. Chocolatey and intense is ideal; this is no place for a delicate light roast.",
  description:"Italy’s two-ingredient dessert coffee — a scoop of cold vanilla ice cream drowned in a shot of hot coffee, poured over at the table.",
  method:"moka pot", origin:"Italy", ratio:"1:1", ratioLabel:"coffee : ice cream", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["1 generous scoop of vanilla ice cream or gelato","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","shaved chocolate or crushed nuts (optional)"],
  steps:[{t:"Scoop the ice cream",c:"Put a generous scoop of vanilla ice cream into a small glass, cup or bowl and have it ready."},{t:"Brew hot coffee",c:"Brew the moka pot fresh and hot: basket level not tamped, pull off when it gurgles."},{t:"Drown it",c:"Pour the hot coffee over the ice cream right at the table. Scatter shaved chocolate or nuts on top if using."},{t:"Eat at once",c:"Eat immediately with a spoon, scooping up the melting coffee-cream as you go."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Brew fresh and pour over at the moment of serving — don’t let it sit. Use the best vanilla ice cream you can. Grown-up version: a splash of amaretto, coffee liqueur or dark rum."
},
{
  id:"seed-einspanner", serial:19, name:"Einspänner (Viennese Cream Coffee)",
  story:"From Vienna’s grand coffee houses. The Einspänner is strong black coffee under a thick cap of whipped cream — the name means ‘one-horse carriage,’ because coachmen drank it one-handed, the cream lid keeping it warm and unspillable while they held the reins. You sip the hot coffee up through the cool cream, never stirring. It’s the elegant, old-world end to this whole tour.",
  bean:"A smooth dark roast — rich and chocolatey under the cream, not bright or acidic. Body matters more than nuance here.",
  description:"A Viennese coffee-house classic — strong sweetened black coffee under a thick cap of whipped cream, sipped through the cream without stirring.",
  method:"moka pot", origin:"Austria", ratio:"1:1", ratioLabel:"coffee : cream cap", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","90 ml hot water (to lengthen, optional)","1 tsp sugar (to taste)","4 tbsp cold heavy cream","cocoa powder or chocolate shavings, to dust"],
  steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten and pour",c:"Stir the sugar into the hot coffee. Add the hot water if you’d like a longer drink, then pour into a glass."},{t:"Whip the cream",c:"Whip the cold heavy cream to soft peaks."},{t:"Cap and dust",c:"Spoon a thick cap of cream over the coffee so it floats. Dust with cocoa. Don’t stir — sip the hot coffee up through the cool cream."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Use real heavy cream, whipped to soft peaks and only lightly sweetened. The whole idea is contrast: don’t stir. Lengthen with hot water for a longer drink, or leave it short and intense. Served in a glass so you can see the layers."
},
{
  id:"seed-dolcelatte", serial:20, name:"Iced Cinnamon Dolce Latte",
  story:"The one you asked about. ‘Dolce’ is just Italian for ‘sweet,’ and this is the café favourite — espresso and cold milk over ice, sweetened with a homemade cinnamon-vanilla syrup and crowned with whipped cream and a cinnamon-sugar dust. Since Starbucks doesn’t bottle the syrup, making it at home is the only way to get it exactly right (and far cheaper). It’s basically Café de Olla gone cold, milky and creamy.",
  bean:"A smooth medium-dark roast — cinnamon and vanilla sit on top, so you want a mellow, chocolatey base, not a sharp dark one.",
  description:"The Starbucks-style cold classic — espresso and cold milk over ice, sweetened with homemade cinnamon-vanilla 'dolce' syrup, topped with whipped cream and a cinnamon-sugar dust.",
  method:"moka pot", origin:"Modern café", ratio:"2–3 tbsp", ratioLabel:"dolce syrup per glass", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2–3 tbsp cinnamon dolce syrup (recipe in notes)","180 ml cold milk","1 cup ice cubes","whipped cream + cinnamon-sugar, to top (optional)"],
  steps:[{t:"Make the syrup",c:"Make the cinnamon dolce syrup (see notes) and let it cool. You only need a few tablespoons per drink."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles. Let it cool slightly."},{t:"Build the glass",c:"Fill a tall glass with ice, add the cold milk and stir in the dolce syrup."},{t:"Pour and top",c:"Pour the coffee over the top. Crown with whipped cream and a dusting of cinnamon-sugar. Stir and sip."}],
  notes:"Cinnamon dolce syrup (makes plenty, keeps 2 weeks in the fridge): simmer 1/2 cup water, 1/4 cup brown sugar, 1/4 cup white sugar and 1 tsp cinnamon for ~10 min until slightly thick, then stir in 1/2 tsp vanilla. Instant coffee works (2 heaped tsp in 60 ml hot water). The cinnamon-sugar dust on top is just 1:1 cinnamon and sugar. Start with 2 tbsp syrup and adjust."
},
{
  id:"seed-saltcoffee", serial:21, name:"Vietnamese Salt Coffee (Cà Phê Muối)",
  story:"From the old imperial city of Huế, and one of the most talked-about coffees in the world right now. It takes the sweet condensed-milk base you already know and crowns it with a lightly salted whipped-cream foam. Sounds odd, tastes genius: the salt cuts the sweetness, rounds out the coffee’s bitterness and makes the whole thing taste richer — the same trick that makes salted caramel work. You sip the cold sweet coffee up through the salty cream.",
  bean:"Dark Vietnamese-style robusta — bold and low-acid so it stands up to condensed milk and the salted cream cap.",
  description:"Huế's viral salt coffee — sweet condensed-milk coffee over ice, crowned with a lightly salted whipped-cream foam. The salt rounds the sweetness like salted caramel.",
  method:"moka pot", origin:"Vietnam", ratio:"1:2", ratioLabel:"condensed milk : coffee", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["2 tbsp condensed milk","17 g ground coffee (dark roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","3 tbsp heavy/whipping cream","2 tbsp milk","1 good pinch of salt","1 cup ice cubes"],
  steps:[{t:"Sweeten the glass",c:"Spoon the condensed milk into the bottom of a glass."},{t:"Brew and stir",c:"Brew the moka pot (pull off when it gurgles) and stir the coffee into the condensed milk until smooth."},{t:"Add ice",c:"Add ice to fill the glass, leaving room at the top."},{t:"Whip the salted cream",c:"Whip the cream, milk and a good pinch of salt to a soft, loose foam."},{t:"Cap and sip",c:"Spoon the salted cream over the top so it floats. Don’t stir — sip the sweet coffee up through the salty cream."}],
  notes:"Instant version: 2 heaped tsp in 60 ml hot water. The salt is the whole point — a proper pinch, not a few grains; it should make the drink taste richer, not salty. Whip the cream to a soft, pourable foam, not stiff. Use a dark Vietnamese-style robusta for the boldest base."
},
{
  id:"seed-mocha", serial:22, name:"Café Mocha",
  story:"The chocolate one — and its name is a geography lesson. ‘Mocha’ comes from the port of al-Makha in Yemen, which for centuries was the world’s great coffee-trading hub; its beans were prized for a natural chocolatey note. Over time ‘mocha’ came to mean coffee married with actual chocolate. It’s the cosiest, most dessert-like cup in the book: espresso and melted chocolate under warm milk, the kind of thing that tastes like a hug.",
  bean:"A dark, chocolatey roast doubles down on the chocolate. Bold and smooth; skip bright acidic light roasts here.",
  description:"The chocolate-coffee classic — espresso and melted chocolate under warm milk, topped with whipped cream. Cosy and dessert-like.",
  method:"moka pot", origin:"Yemen / worldwide", ratio:"1:1", ratioLabel:"coffee : chocolate", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (dark, chocolatey roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1.5 tbsp cocoa powder (or 2 squares dark chocolate, or chocolate syrup)","2 tsp sugar (to taste)","180 ml milk","whipped cream + cocoa dust, to top (optional)"],
  steps:[{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Make the chocolate base",c:"In the cup, stir the cocoa and sugar into a splash of the hot coffee until completely smooth and glossy."},{t:"Combine",c:"Pour in the rest of the coffee and stir to combine."},{t:"Add milk and top",c:"Heat and froth the milk, pour it in (or pour over ice for iced), and finish with whipped cream and a cocoa dust."}],
  notes:"Instant version: 2 heaped tsp in 60 ml hot water. Melt the cocoa/chocolate into a little hot coffee first so it’s smooth with no lumps. Serve hot with steamed milk, or pour over ice with cold milk for an iced mocha. Cocoa powder needs more sugar than sweet chocolate syrup."
},
{
  id:"seed-ipoh", serial:23, name:"Ipoh White Coffee (Malaysia)",
  story:"Don’t let ‘white’ fool you — it’s not about milk. In the town of Ipoh, the beans are roasted in palm-oil margarine instead of the sugar used for dark ‘black’ coffee, giving a smoother, caramelly, less bitter cup that’s then served thick with condensed and evaporated milk. It’s one of Malaysia’s proudest exports, sold in kopitiams everywhere.",
  bean:"A smooth medium roast (not a sharp dark one) mimics the gentle, caramelly character of margarine-roasted Ipoh beans.",
  description:"Malaysia's Ipoh classic — a smooth, caramelly coffee (beans traditionally roasted in margarine) served rich with condensed and evaporated milk.",
  method:"moka pot", origin:"Malaysia", ratio:"1:2", ratioLabel:"coffee : milk blend", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (medium roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tbsp condensed milk","2 tbsp evaporated milk","1 cup ice cubes (optional, for iced)"],
  steps:[{t:"Layer the milks",c:"Spoon the condensed and evaporated milk into the bottom of a cup or glass."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Stir together",c:"Pour the hot coffee over the milks and stir well until smooth and pale caramel."},{t:"Hot or iced",c:"Drink it hot — or fill with ice and stir cold for an iced Ipoh white coffee."}],
  notes:"Instant version: 2 heaped tsp in 60 ml hot water. Real Ipoh white coffee uses beans roasted in palm-oil margarine — a smooth medium roast gets you the gentle, caramelly character. The two-milk combo (condensed for sweetness, evaporated for body) is the signature."
},
{
  id:"seed-cafezinho", serial:24, name:"Cafezinho (Brazil)",
  story:"In the world’s biggest coffee country, this is the tiny, strong, already-sweet cup offered to absolutely everyone — guests, shopkeepers, you name it. The trick: sugar goes into the water before the coffee, so it dissolves completely into something almost syrupy. Quick, strong and endlessly sociable.",
  bean:"A medium-dark Brazilian, naturally — nutty, chocolatey and low-acid, made to be taken sweet and small.",
  description:"Brazil's 'little coffee' — a tiny, strong, pre-sweetened cup where sugar dissolves into the water before the coffee. Offered to everyone, all day.",
  method:"moka pot", origin:"Brazil", ratio:"strong & sweet", ratioLabel:"small black cup", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (medium-dark, moka basket level, not tamped)","70 ml water","1.5 tsp sugar"],
  steps:[{t:"Sugar first",c:"Put the sugar into the cup you’ll serve in."},{t:"Brew strong",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Dissolve the sugar",c:"Pour the hot coffee straight onto the sugar and stir hard until fully dissolved — it should look glossy."},{t:"Serve little",c:"Serve at once in a small cup, strong and sweet. No milk."}],
  notes:"Instant version: 2 tsp in 70 ml hot water, stirred with the sugar. Traditionally made by dissolving sugar in the water as it heats, then passing it through a cloth filter. It’s meant to be small and intense, served in a tiny cup, no milk. Sweetness is built in."
},
{
  id:"seed-carajillo", serial:25, name:"Carajillo (Spain)",
  story:"Strong coffee spiked with a shot of spirit — traditionally brandy, rum, or Licor 43. It was supposedly born when Spanish troops in Cuba mixed coffee with rum for ‘courage’ (coraje) — hence the name. It’s the after-dinner pick-me-up that does both jobs at once. (Adults only — this one contains alcohol.)",
  bean:"A bold dark roast stands up to the spirit. Chocolatey and strong; the alcohol and sugar need something assertive underneath.",
  description:"Spain's spiked after-dinner coffee — strong hot coffee with a shot of brandy, rum or Licor 43. Adults only.",
  method:"moka pot", origin:"Spain", ratio:"1:1", ratioLabel:"coffee : spirit", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (dark roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","30 ml brandy, dark rum or Licor 43","1 tsp sugar (to taste, optional)","1 lemon peel + a coffee bean (optional garnish)"],
  steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten (optional)",c:"Stir sugar into the hot coffee if you’d like it sweet."},{t:"Add the spirit",c:"Pour the spirit into a small heatproof glass, then add the hot coffee."},{t:"Garnish and serve",c:"Garnish with a lemon peel and a coffee bean and serve warm — or pour over ice for an iced carajillo."}],
  notes:"Adults only — contains alcohol. Instant works for the coffee base (2 heaped tsp in 60 ml hot water). Licor 43 makes it sweet and vanilla-ish; brandy is classic; rum nods to its Cuban-soldier origins. Serve hot in a small glass, or over ice for summer."
},
{
  id:"seed-buna", serial:26, name:"Ethiopian Buna",
  story:"Ethiopia is where coffee was discovered — legend says a goatherd named Kaldi noticed his goats dancing after eating the cherries. ‘Buna’ is both the word for coffee and the name of the famous ceremony: beans roasted fresh in a pan, ground, brewed in a clay jebena, and poured from a height into tiny cups over three slow rounds, with incense burning. Strong, black, and deeply social.",
  bean:"The rare black drink where a brighter Ethiopian bean belongs — it’s the homeland. Keep it a medium roast, not super-light, so the moka pot doesn’t turn it sour.",
  description:"From coffee's birthplace — strong black coffee served in small cups, the heart of the Ethiopian coffee ceremony. Sometimes taken with a pinch of salt rather than sugar.",
  method:"moka pot", origin:"Ethiopia", ratio:"strong & black", ratioLabel:"no milk", strength:5,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["18 g ground coffee (a medium Ethiopian shines here, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1 pinch of salt (traditional) or sugar to taste (optional)"],
  steps:[{t:"Brew strong",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles. Aim for a strong, clean cup."},{t:"Pour from a height",c:"Pour into a small cup from a slight height — the traditional pour aerates it and shows off the colour."},{t:"Salt, sugar, or neither",c:"Add a pinch of salt or sugar if you like — or leave it black, the traditional way."},{t:"Take your time",c:"Sip slowly. If you’re feeling it, brew a lighter second and third round from the same grounds."}],
  notes:"Buna is about good, fresh coffee taken black. In parts of Ethiopia it’s taken with a small pinch of salt instead of sugar — try it once. Traditionally served in three rounds (abol, tona, baraka), each weaker than the last."
},
{
  id:"seed-touba", serial:27, name:"Café Touba (Senegal)",
  story:"Café Touba is Senegal’s national coffee, named after the holy city of Touba and tied to the Mouride brotherhood, whose founder is said to have introduced the spiced brew. The secret is grains of selim — a peppery West African spice called djar — sometimes with cloves, ground right in with the coffee and sweetened generously. Warming, fragrant, faintly medicinal, and sold from carts all over Dakar.",
  bean:"A bold dark robusta blend carries the peppery selim spice and the heavy sweetness.",
  description:"Senegal's spiced national coffee — strong sweet coffee brewed with peppery grains of selim (djar) and cloves. Warming and fragrant.",
  method:"moka pot", origin:"Senegal", ratio:"½ tsp", ratioLabel:"spice per cup", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (dark roast, moka basket level, not tamped)","1/2 tsp ground selim pepper (djar) — or sub: pinch black pepper + 1 clove + grains of paradise","60 ml water (to the moka pot safety valve)","2 tsp sugar (generous, to taste)"],
  steps:[{t:"Spice the grounds",c:"Mix the ground selim (or substitute) into the coffee right in the moka basket so it brews through."},{t:"Brew",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten well",c:"Stir in the sugar generously — it should be properly sweet to balance the pepper."},{t:"Serve",c:"Serve hot and black in a small cup. Strong, sweet and peppery."}],
  notes:"Instant version: 2 heaped tsp in 60 ml hot water, stirred with the spice. Authentic spice is selim pepper (Xylopia aethiopica, ‘djar’ in Wolof), often with cloves — hard to find in India; a pinch of black pepper, a clove and grains of paradise gets the peppery-floral warmth. Meant to be sweet, no milk."
},
{
  id:"seed-qishr", serial:28, name:"Yemeni Qishr (Cascara + Ginger)",
  story:"Long before Yemenis brewed the beans, they steeped the coffee cherry’s dried husks — qishr — into a light, golden, tea-like drink with ginger and cinnamon. It’s gently caffeinated, fruity-tart, and warming, and in much of Yemen it’s still preferred to coffee itself. The husk is sold as ‘cascara’, so this is one you can genuinely brew.",
  bean:"Not made from beans at all — qishr is the dried coffee husk (cascara). No roast to choose; seek out cascara from a specialty roaster.",
  description:"Yemen's husk brew — dried coffee cherry husks (cascara) steeped with ginger and cinnamon into a light, golden, tea-like drink. Fruity, gingery, low in caffeine.",
  method:"other", origin:"Yemen", ratio:"1:4", ratioLabel:"husks : water", strength:2,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["4 tbsp cascara (dried coffee cherry husks / qishr)","1 tsp ground ginger (or a few fresh slices)","1 small piece of cinnamon stick","500 ml water","2 tsp sugar or honey (to taste)"],
  steps:[{t:"Simmer the spices",c:"Bring the water to a gentle simmer with the ginger and cinnamon."},{t:"Steep the husks",c:"Add the cascara, lower the heat and simmer gently 5–10 min until the water turns a deep golden-amber."},{t:"Strain",c:"Strain out the husks and spices."},{t:"Sweeten and serve",c:"Sweeten with sugar or honey and serve hot in small cups. Light, gingery and fragrant."}],
  notes:"This isn’t made from beans — qishr is the dried coffee fruit (husk), sold by specialty roasters as ‘cascara’. Some Indian specialty roasters carry it; it’s worth asking. Naturally low in caffeine, so it’s a lovely evening drink. Ginger-forward is traditional."
},
{
  id:"seed-banana", serial:29, name:"Banana Cold Coffee",
  story:"One ripe banana turns cold coffee thick, creamy and naturally sweet — you barely need sugar. It’s basically breakfast in a glass, and one of the easiest drinks in the whole book: no moka skill needed, just a blender and instant coffee.",
  bean:"Instant coffee is perfect here. Any everyday coffee works; the banana and milk are the stars.",
  description:"Creamy blended cold coffee with banana — naturally sweet, thick and filling. Just blend and pour.",
  method:"blended", origin:"Fusion", ratio:"blend", ratioLabel:"banana + milk + coffee", strength:2,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["1 ripe banana","200 ml cold milk","2 tsp instant coffee (or 60 ml strong moka coffee, cooled)","1 tsp sugar or honey (optional — banana is already sweet)","1 cup ice cubes"],
  steps:[{t:"Add the banana",c:"Peel and break the banana into a blender."},{t:"Everything in",c:"Add the milk, coffee, sugar and ice."},{t:"Blend smooth",c:"Blend 30–45 seconds until completely smooth, thick and frothy."},{t:"Pour and sip",c:"Pour into a tall glass and drink straight away."}],
  notes:"The riper the banana, the sweeter and creamier — use one with brown speckles and skip the sugar. A pinch of cinnamon or a spoon of peanut butter makes it even better. Freeze the banana for an extra-thick texture. Drink it fresh; banana shakes thin out and brown if they sit."
},
{
  id:"seed-coldcoffee", serial:30, name:"Indian Café Cold Coffee",
  story:"The cold coffee every café and home blender in India makes — thick, frothy, sweet, with a scoop of vanilla ice cream for that milkshake body and foam. It’s the after-school, hot-afternoon, everyone-loves-it classic.",
  bean:"Instant coffee is traditional and ideal — it blends smooth and foams well with the ice cream.",
  description:"The classic Indian café-style cold coffee — milk, coffee and sugar blended thick and frothy with a scoop of ice cream.",
  method:"blended", origin:"India", ratio:"blend", ratioLabel:"milk + coffee + ice cream", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["200 ml chilled milk","2 tsp instant coffee","3 tsp sugar (to taste)","1 small scoop vanilla ice cream","5 ice cubes"],
  steps:[{t:"Load the blender",c:"Put the milk, instant coffee, sugar and ice cream into a blender."},{t:"Blend till frothy",c:"Add the ice and blend a full minute until thick, pale and very frothy."},{t:"Pour",c:"Pour into a tall glass — the foam should sit on top."},{t:"Finish and serve",c:"Top with a little coffee powder, cocoa or chocolate syrup and serve with a straw."}],
  notes:"The ice cream gives it that thick, foamy café texture — don’t skip it. Blend longer than you think (a full minute) for maximum froth. Drizzle chocolate syrup inside the glass before pouring for the full café look."
},
{
  id:"seed-chikoo", serial:31, name:"Chikoo Cold Coffee",
  story:"A desi twist: chikoo’s natural caramel-malt sweetness is a secret match for coffee. No sugar needed, and it tastes like a caramel shake. It’s an unexpected, very Indian spin on cold coffee that uses a fruit sitting in most kitchens.",
  bean:"Instant coffee blends cleanly with the fruit; the chikoo’s malty sweetness leads.",
  description:"A desi cold coffee with chikoo (sapota) — naturally caramel-sweet, creamy, and unusual in the best way.",
  method:"blended", origin:"India", ratio:"blend", ratioLabel:"chikoo + milk + coffee", strength:2,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["2 ripe chikoo (sapota), peeled and deseeded","200 ml cold milk","2 tsp instant coffee (or 60 ml strong moka coffee, cooled)","1 tsp sugar (optional — chikoo is very sweet)","1 cup ice cubes"],
  steps:[{t:"Prep the chikoo",c:"Peel the chikoo, remove all the seeds, and drop the flesh into a blender."},{t:"Everything in",c:"Add the milk, coffee, sugar and ice."},{t:"Blend smooth",c:"Blend 30–45 seconds until completely smooth and creamy."},{t:"Pour and serve",c:"Pour into a tall glass and serve cold."}],
  notes:"Use fully ripe, soft chikoo — firm ones are bland. Remove all the seeds. Chikoo is naturally very sweet with a malty, brown-sugar note that mirrors coffee, so you’ll likely need no added sugar. A pinch of cardamom is a lovely Indian touch. Best fresh."
},
{
  id:"seed-orange", serial:32, name:"Orange Iced Coffee",
  story:"Orange and coffee sounds strange and tastes like sunshine — the citrus lifts the coffee and cuts the bitterness. It’s the easygoing cousin of the Portuguese Mazagran (coffee + citrus), just with a carton of orange juice instead of a fresh lemon. A perfect no-milk refresher for a hot Ahmedabad afternoon.",
  bean:"A medium or brighter roast works better than a heavy dark one — the fruitier notes play with the orange (like the Mazagran).",
  description:"A bright, no-milk refresher — chilled orange juice and strong coffee over ice. Citrusy, layered and unexpectedly good.",
  method:"moka pot", origin:"Fusion", ratio:"2:1", ratioLabel:"juice : coffee", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["120 ml chilled orange juice (store-bought is fine)","60 ml strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water), cooled","1 tsp honey or sugar (optional)","1 cup ice cubes","1 orange slice, to garnish"],
  steps:[{t:"Ice the glass",c:"Fill a tall glass with ice."},{t:"Add the juice",c:"Pour in the orange juice and stir in the honey if using."},{t:"Float the coffee",c:"Slowly pour the cooled coffee over the back of a spoon so it floats on top in a dark layer."},{t:"Garnish and sip",c:"Garnish with an orange slice. Admire the layers, then stir and sip."}],
  notes:"The coffee must be cooled or it’ll taste muddy with the juice. Pour gently and don’t over-stir — it looks beautiful half-layered. A medium/brighter roast plays best with the orange. Start with a 2:1 juice-to-coffee ratio and adjust."
},
{
  id:"seed-pineapple", serial:33, name:"Pineapple Coffee Fizz",
  story:"The tropical cousin: pineapple juice and coffee topped with a fizz of soda. It sounds wild and drinks like a coffee mocktail — the pineapple’s bright tang is a surprising match for coffee, almost like a coffee tonic with a holiday edge.",
  bean:"A clean medium roast — bright enough to cut the juice and fizz, not overpower.",
  description:"A fizzy coffee mocktail — pineapple juice and strong coffee over ice, topped with soda. Tropical, bubbly and refreshing.",
  method:"moka pot", origin:"Fusion", ratio:"fizzy", ratioLabel:"juice + coffee + soda", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["100 ml chilled pineapple juice (store-bought)","60 ml strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water), cooled","1 tsp sugar or honey (optional)","80 ml chilled soda or tonic water","1 cup ice cubes"],
  steps:[{t:"Ice the glass",c:"Fill a tall glass with ice."},{t:"Add the juice",c:"Pour in the pineapple juice and stir in the sugar if using."},{t:"Add the coffee",c:"Gently pour the cooled coffee over so it layers on top."},{t:"Top with fizz",c:"Top with soda or tonic, give one gentle stir, and serve fizzy and cold."}],
  notes:"Cool the coffee first — hot coffee kills the fizz and muddies the juice. Add the soda last and don’t stir hard, so it stays bubbly. Tonic gives a grown-up bitter finish; plain soda keeps it sweeter. Great tall and very cold."
},
{
  id:"seed-coffeejelly", serial:34, name:"Japanese Coffee Jelly",
  story:"A beloved retro kissaten (old-school Japanese café) creation — coffee set into a wobbly jelly, cut into cubes, and served in a glass with cold milk poured over. It’s coffee you eat with a spoon, half drink and half dessert, and a fixture of Japanese cafés for decades.",
  bean:"Any decent coffee works; brew it strong since the milk and syrup soften it. A smooth medium-dark sets into a clean-tasting jelly.",
  description:"A retro Japanese café classic — wobbly coffee jelly cubes served in a glass with cold milk and syrup. Half drink, half dessert, eaten with a spoon.",
  method:"moka pot", origin:"Japan", ratio:"set", ratioLabel:"coffee jelly + milk", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["250 ml strong brewed coffee (moka or 3 tsp instant in 250 ml hot water)","2 tbsp sugar","1.5 tsp gelatin (or 1 tsp agar / China grass for veg)","100 ml cold milk or cream, to serve","extra sugar syrup, to drizzle (optional)"],
  steps:[{t:"Bloom the gelatin",c:"If using gelatin, sprinkle it over 2 tbsp cold water and let it bloom 5 min. (For agar, boil it with the coffee instead.)"},{t:"Sweeten and set",c:"Make the coffee hot and stir in the sugar. Stir in the bloomed gelatin (or boil with agar 1 min) until fully melted."},{t:"Chill until set",c:"Pour into a shallow tray or cups and chill until firmly set, 2–3 hours (agar sets faster)."},{t:"Cut into cubes",c:"Cut the set jelly into small cubes and spoon them into a glass."},{t:"Serve with milk",c:"Pour cold milk over the cubes and drizzle with syrup. Serve cold with a spoon."}],
  notes:"For a vegetarian set, use agar-agar (China grass), easy to find in India: ~1 tsp per 250 ml, and you must boil it 1 min to activate — it then sets firm at room temperature. Gelatin needs the fridge. Cut into 1.5–2 cm cubes. Eat with both a spoon and a fat straw."
},
{
  id:"seed-dirty", serial:35, name:"Dirty Coffee",
  story:"A huge hit in Korean and Japanese cafés — the name comes from what it looks like: hot espresso poured from a height onto cold milk so it crashes through and ‘dirties’ the white with dark streaks. You don’t stir it; you drink it fast for that hot-meets-cold contrast. It’s built to be photographed.",
  bean:"A bold, chocolatey dark roast — it has to punch through cold milk in dark streaks.",
  description:"The photogenic café favourite — hot espresso poured over cold milk so it streaks down 'dirtying' the white. No stirring; drink right away.",
  method:"moka pot", origin:"Korea / Japan", ratio:"2:1", ratioLabel:"milk : coffee", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["120 ml cold milk","1 tbsp brown sugar (optional)","60 ml hot strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water)","cocoa powder, to dust (optional)"],
  steps:[{t:"Sweeten the cold milk",c:"Stir the brown sugar into the cold milk and pour into a short, wide glass, filling it about three-quarters."},{t:"Brew hot coffee",c:"Brew the coffee fresh and hot."},{t:"Pour from a height",c:"Pour the hot coffee slowly from a height onto the cold milk so it crashes through and streaks down."},{t:"Dust and drink",c:"Dust with cocoa. Don’t stir — photograph it, then drink it straight away."}],
  notes:"Use a short, wide glass so the dark streaks show against the white milk. The coffee must be HOT and the milk COLD — the clash is what makes it dramatic. Don’t stir, and drink within a minute or two while the layers are distinct."
},
{
  id:"seed-brownsugar", serial:36, name:"Brown Sugar Latte",
  story:"The tiger-striped Instagram star that swept out of Taiwan and conquered Korean and Japanese cafés. Thick brown-sugar syrup is painted up the inside of the glass in dramatic stripes, then milk and coffee poured over. Add boba at the bottom and you’ve got the full bubble-tea-shop version.",
  bean:"A medium-dark roast balances the heavy brown-sugar sweetness without disappearing under it.",
  description:"The tiger-striped café star — thick brown sugar syrup swirled up the glass, then cold milk and coffee. Sweet, caramelly and very photogenic.",
  method:"moka pot", origin:"Taiwan", ratio:"build", ratioLabel:"syrup + milk + coffee", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["3 tbsp brown sugar","1 tbsp water","200 ml cold milk","60 ml strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water)","1 cup ice cubes"],
  steps:[{t:"Make brown sugar syrup",c:"Simmer the brown sugar with the water for 2–3 min into a thick, dark syrup. Let it cool slightly so it clings."},{t:"Paint the stripes",c:"Drizzle the syrup around the inside walls of the glass, tilting and turning to paint tiger stripes."},{t:"Ice and milk",c:"Add ice, then pour in the cold milk."},{t:"Top with coffee",c:"Slowly pour the coffee over the top. Serve unstirred so the stripes and layers show."}],
  notes:"The syrup must be thick so it clings — simmer until it coats the back of a spoon, then cool slightly (too hot and it just runs down). Tilt and rotate the glass while drizzling to paint the stripes. Don’t stir. Add cooked tapioca pearls for the full boba version."
},
{
  id:"seed-cheesefoam", serial:37, name:"Cheese Foam Coffee",
  story:"Taiwan’s wild idea that became an Asian café obsession — a salted, whipped cream-cheese foam floating on top of your coffee. It sounds bizarre and tastes like a liquid cheesecake lid: sweet-salty, rich and silky. You sip the coffee up through the foam, no straw, tilting the glass.",
  bean:"A smooth medium-dark roast — rich enough to carry the salty-sweet cheese cap without turning bitter.",
  description:"Taiwan's salted cream-cheese foam, whipped into a silky cap over iced coffee. Sweet-salty and rich, like liquid cheesecake. Sip through the foam.",
  method:"moka pot", origin:"Taiwan", ratio:"cap", ratioLabel:"coffee + cheese foam", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["2 tbsp cream cheese, softened","2 tbsp heavy/whipping cream","2 tbsp milk","1 tsp sugar","1 good pinch of salt","150 ml coffee (60 ml strong + 90 ml water/milk, lightly sweetened)","1 cup ice cubes"],
  steps:[{t:"Whip the cheese foam",c:"Whisk the cream cheese, cream, milk, sugar and salt together until smooth, silky and just pourable."},{t:"Build the coffee",c:"Fill a glass with ice and pour in the coffee, leaving room at the top."},{t:"Float the foam",c:"Gently pour the cheese foam over the back of a spoon so it floats in a thick cap."},{t:"Sip through the cap",c:"Don’t stir — sip the coffee up through the salty-sweet foam."}],
  notes:"Soften the cream cheese first or it’ll stay lumpy. Whisk the foam just pourable — thick enough to float, loose enough to pour. The salt is essential; it turns sweet cream into that addictive ‘cheese tea’ flavour. Traditionally drunk without a straw, tilting the glass."
},
{
  id:"seed-flashbrew", serial:38, name:"Japanese Flash-Brew Iced Coffee",
  story:"The specialty-café secret from Japan: instead of cooling coffee in the fridge (which goes flat and dull), you brew it hot, directly onto a glass of ice. The instant chill traps all the bright aromatics — it’s the cleanest, most fragrant iced coffee you can make, and the one place a fruity, brighter roast really sings.",
  bean:"This is the one iced coffee where a fruity, brighter roast really sings — the instant chill captures its aromatics.",
  description:"The specialty-coffee method from Japan — hot coffee brewed straight onto ice, locking in aroma for the crispest, brightest iced coffee.",
  method:"moka pot", origin:"Japan", ratio:"strong on ice", ratioLabel:"brew onto ice", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (a brighter medium roast shines here, moka basket level)","60 ml water (to the moka pot safety valve)","1 tall glass packed with ice","sugar or a splash of milk (optional)"],
  steps:[{t:"Pack the glass with ice",c:"Pack a tall glass or server right to the top with ice."},{t:"Brew strong and hot",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles — keep it strong."},{t:"Brew onto the ice",c:"Pour the hot coffee directly over the ice so it chills instantly. Give it a quick swirl."},{t:"Finish and serve",c:"Sweeten or add a splash of milk if you like, and drink straight away while it’s bright and aromatic."}],
  notes:"The ice becomes part of your water as it melts, so brew a touch stronger than usual. The trick is the instant chill: it captures aromatic oils that slow fridge-cooling lets escape, so it tastes noticeably brighter and cleaner. Best drunk fresh, black or with a splash of milk."
}
];
