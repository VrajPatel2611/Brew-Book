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
    bluetokai: ['Instant Coffee Blends — Blue Tokai’s spray-dried instant'],
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
    bluetokai: ['Any medium-dark roast, but it MUST be ground Turkish-fine — coarser grinds won’t work'],
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
  story:"Where it all started. Mango and coffee sound like they shouldn't work — one is all sunshine and sweetness, the other dark and serious — but layered over ice they meet in the middle: the fruit softens the coffee's edge, and the coffee keeps the mango from being just dessert. It's the drink that kicked off this whole book, and the only one here that's pure invention rather than tradition. Think of it as summer in a glass with a caffeine backbone.",
  bean:"Medium roast, nutty-chocolatey, low acidity (a Brazilian or Indian arabica). Skip floral/fruity light roasts here — their delicate berry/citrus notes fight the mango instead of supporting it. You want a clean, mellow base that lets the fruit lead.",
  description:"Layered iced coffee — sweet mango purée below, milk in the middle, strong coffee floating on top. The first one Claude and I made.",
  method:"moka pot", origin:"Fusion", ratio:"1:2:1", ratioLabel:"mango : milk : coffee", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-01'),
  ingredients:["1 ripe mango (about 3/4 cup pulp)","60 ml strong coffee — moka pot (15–17 g grounds) or 2 tsp instant in 60 ml hot water","150 ml chilled milk","2 tsp sugar or honey (adjust to mango sweetness)","1 cup ice cubes"],
  steps:[{t:"Brew strong coffee",c:"Brew 60 ml strong coffee. Moka pot: water to the safety valve, fill the basket level but never tamped, low-medium heat, pull off when it gurgles. Let it cool slightly."},{t:"Blend the mango",c:"Blend the mango with sugar and a splash of milk until completely smooth. Strain if fibrous."},{t:"Layer the glass",c:"Pour the mango purée into a tall glass, add ice, then slowly pour the milk over the ice."},{t:"Top with coffee",c:"Float the coffee on top by pouring it over the back of a spoon. Stir before drinking."}],
  notes:"Don't go weaker than 2 tsp instant per 60 ml — mango drowns out weak coffee. Alphonso or Kesar mango works best.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka pot gives a bold concentrated shot that holds up against the mango and milk.",
      ingredients:["1 ripe mango (about 3/4 cup pulp)","60 ml strong coffee — moka pot (15–17 g grounds) or 2 tsp instant in 60 ml hot water","150 ml chilled milk","2 tsp sugar or honey (adjust to mango sweetness)","1 cup ice cubes"],
      steps:[{t:"Brew strong coffee",c:"Brew 60 ml strong coffee. Moka pot: water to the safety valve, fill the basket level but never tamped, low-medium heat, pull off when it gurgles. Let it cool slightly."},{t:"Blend the mango",c:"Blend the mango with sugar and a splash of milk until completely smooth. Strain if fibrous."},{t:"Layer the glass",c:"Pour the mango purée into a tall glass, add ice, then slowly pour the milk over the ice."},{t:"Top with coffee",c:"Float the coffee on top by pouring it over the back of a spoon. Stir before drinking."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant works perfectly here — the fruit and milk mask any flatness. Use 2 heaped tsp in 60 ml hot water.",
      ingredients:["1 ripe mango (about 3/4 cup pulp)","2 heaped tsp instant coffee","60 ml hot water","150 ml chilled milk","2 tsp sugar or honey","1 cup ice cubes"],
      steps:[{t:"Dissolve instant",c:"Stir 2 tsp instant coffee into 60 ml hot water until fully dissolved. Let cool."},{t:"Blend the mango",c:"Blend mango with sugar and a splash of milk until completely smooth."},{t:"Layer the glass",c:"Pour mango purée into a tall glass, add ice, then slowly pour milk over the ice."},{t:"Top with coffee",c:"Float the cooled instant coffee on top by pouring over the back of a spoon. Stir before drinking."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A French press gives a fuller body than instant — brew strong, let it cool before layering.",
      ingredients:["1 ripe mango (about 3/4 cup pulp)","18 g ground coffee (coarse grind)","120 ml hot water","150 ml chilled milk","2 tsp sugar or honey","1 cup ice cubes"],
      steps:[{t:"Brew strong",c:"Add coffee to French press, pour 120 ml just-off-boil water, steep 4 minutes, press and cool."},{t:"Blend the mango",c:"Blend mango with sugar and a splash of milk until smooth."},{t:"Layer the glass",c:"Pour mango purée into a glass, add ice, pour milk over."},{t:"Float the coffee",c:"Pour the cooled coffee over the back of a spoon to float on top. Stir before drinking."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"Pour over gives the cleanest, brightest cup — ideal if you want the mango to lead.",
      ingredients:["1 ripe mango (about 3/4 cup pulp)","15 g ground coffee (medium grind)","120 ml hot water (93°C)","150 ml chilled milk","2 tsp sugar or honey","1 cup ice cubes"],
      steps:[{t:"Bloom the grounds",c:"Place filter in dripper, add coffee, pour 30 ml hot water and wait 30 seconds."},{t:"Pour slowly",c:"Pour remaining water in slow circles over 2 minutes. Let drip fully into a cup below."},{t:"Cool the coffee",c:"Let the pour over brew cool to room temperature."},{t:"Layer and float",c:"Build the glass — mango, ice, milk, then float the cooled pour over on top."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew gives a naturally sweet, low-acid base that is extraordinarily good with mango.",
      ingredients:["1 ripe mango (about 3/4 cup pulp)","20 g ground coffee (coarse grind)","160 ml cold water","150 ml chilled milk","2 tsp sugar or honey","1 cup ice cubes"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Seal and refrigerate 12–18 hours."},{t:"Strain",c:"Strain through a fine sieve or coffee filter into a clean jar. Discard grounds."},{t:"Blend the mango",c:"Blend mango with sugar and a splash of milk until smooth."},{t:"Build the glass",c:"Pour mango purée into a tall glass, add ice, pour milk, then float the cold brew on top."}]
    }
  ]
},
{
  id:"seed-coconut", serial:2, name:"Coconut Coffee (Cà Phê Dừa)",
  story:"Vietnam's answer to a heatwave. Walk into a café in Saigon and you'll find this everywhere — strong dark coffee poured over a blizzard of blended coconut and condensed milk, so cold and thick that the first few sips ask for a spoon. It drinks like dessert but hits like espresso. The whole joy is in the contrast: frost on top, hot coffee cutting down through the cream as you go.",
  bean:"Dark roast robusta or a robusta-heavy blend — bold, chocolatey and full-bodied to punch through coconut cream and condensed milk. This is the classic Vietnamese choice; a light roast would simply vanish under the richness.",
  description:"Vietnamese-style coffee slushy — hot moka coffee poured over a frosty coconut–condensed milk slush. Creamy on top, frosty at the bottom.",
  method:"moka pot", origin:"Vietnam", ratio:"1:2", ratioLabel:"coffee : coconut blend", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-02'),
  ingredients:["17 g ground coffee (moka basket level, never tamped)","60 ml water (to the moka pot safety valve)","100 ml thick coconut milk (canned, full-fat)","2 tbsp condensed milk","1 cup ice cubes","1 pinch of salt"],
  steps:[{t:"Brew the coffee",c:"Brew the moka pot: water to the safety valve, basket level not tamped, low-medium heat, pull off when it gurgles."},{t:"Blend the slush",c:"Blend coconut milk, condensed milk, salt and ice for 30–45 sec until it's a thick frosty slush."},{t:"Fill the glass",c:"Spoon the slush into a glass, about two-thirds full."},{t:"Pour coffee over",c:"Pour the hot coffee directly over the slush and stir as you drink."}],
  notes:"Instant version: 2 heaped tsp instant coffee in 60 ml hot water, everything else same. Salt is mandatory — it cuts the sweetness. Less sweet: 1 tbsp condensed milk + extra splash coconut milk.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"Bold moka concentration cuts right through the rich coconut-condensed milk slush.",
      ingredients:["17 g ground coffee (moka basket level, never tamped)","60 ml water (to the moka pot safety valve)","100 ml thick coconut milk (canned, full-fat)","2 tbsp condensed milk","1 cup ice cubes","1 pinch of salt"],
      steps:[{t:"Brew the coffee",c:"Brew the moka pot: water to the safety valve, basket level not tamped, low-medium heat, pull off when it gurgles."},{t:"Blend the slush",c:"Blend coconut milk, condensed milk, salt and ice for 30–45 sec until it's a thick frosty slush."},{t:"Fill the glass",c:"Spoon the slush into a glass, about two-thirds full."},{t:"Pour coffee over",c:"Pour the hot coffee directly over the slush and stir as you drink."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Use a robusta-based instant — it needs to punch through coconut cream. 2 heaped tsp in 60 ml hot water.",
      ingredients:["2 heaped tsp instant coffee (robusta-based)","60 ml hot water","100 ml thick coconut milk (canned, full-fat)","2 tbsp condensed milk","1 cup ice cubes","1 pinch of salt"],
      steps:[{t:"Dissolve instant",c:"Stir instant coffee into hot water until smooth. Let cool slightly."},{t:"Blend the slush",c:"Blend coconut milk, condensed milk, salt and ice 30–45 sec until thick and frosty."},{t:"Fill the glass",c:"Spoon slush into a glass, about two-thirds full."},{t:"Pour coffee over",c:"Pour the instant coffee directly over the slush and stir as you drink."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A dark-roast French press gives good body and enough boldness to stand up to the coconut.",
      ingredients:["18 g ground coffee (dark roast, coarse grind)","120 ml hot water","100 ml thick coconut milk (canned, full-fat)","2 tbsp condensed milk","1 cup ice cubes","1 pinch of salt"],
      steps:[{t:"Brew strong",c:"Add coffee to French press, pour 120 ml hot water, steep 4 minutes, press. Cool slightly."},{t:"Blend the slush",c:"Blend coconut milk, condensed milk, salt and ice until thick and frosty."},{t:"Fill the glass",c:"Spoon slush into a glass two-thirds full."},{t:"Pour and stir",c:"Pour the French press coffee over the slush. Stir as you drink."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew concentrate is the café-favourite base for this drink — smooth, bold, no bitterness.",
      ingredients:["25 g ground coffee (coarse grind)","200 ml cold water","100 ml thick coconut milk (canned, full-fat)","2 tbsp condensed milk","1 cup ice cubes","1 pinch of salt"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar, seal and refrigerate 12–18 hours."},{t:"Strain",c:"Strain through a fine sieve into a clean jar. This is your cold brew concentrate."},{t:"Blend the slush",c:"Blend coconut milk, condensed milk, salt and ice until thick and frosty."},{t:"Build the glass",c:"Spoon slush into a glass, pour cold brew concentrate over the top."}]
    }
  ]
},
{
  id:"seed-egg", serial:3, name:"Vietnamese Egg Coffee (Cà Phê Trứng)",
  story:"Born from a shortage. In 1940s Hanoi, when fresh milk was scarce and expensive, a bartender whipped egg yolk with condensed milk instead — and accidentally invented one of the world's great coffees. The yolk turns into a warm, sweet custard that sits on the coffee like a hat. Don't let the word 'egg' scare you off: it tastes like tiramisu, not breakfast. Hanoi still serves it in tiny old cafés tucked down narrow alleys.",
  bean:"Dark roast robusta with strong cocoa / bitter-chocolate notes — that edge is what balances the sweet custard foam. A bright, acidic light roast would taste sour against the egg; you want deep and roasty here.",
  description:"Hanoi's famous egg coffee — a warm whipped egg-yolk and condensed milk foam, thick like custard, floating on strong coffee. Tastes like tiramisu in a cup.",
  method:"moka pot", origin:"Vietnam", ratio:"1:2", ratioLabel:"coffee : egg foam", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-05'),
  ingredients:["1 very fresh egg yolk","2 tbsp condensed milk","1/4 tsp vanilla (optional)","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)"],
  steps:[{t:"Set up the yolk",c:"Separate the yolk cleanly into a small deep bowl with condensed milk and vanilla."},{t:"Whip the foam",c:"Whip 3–4 min with a frother until pale, thick and it holds a ribbon."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Pour the coffee",c:"Pour coffee into a small cup, about a third full."},{t:"Float the foam",c:"Spoon the egg foam on top so it floats; eat with a spoon or stir in halfway."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Whipping is the whole secret — don't rush or it tastes eggy. Freshest egg possible. Cocoa powder on top if you have it. Serve warm.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka shot is strong enough to support the heavy egg-yolk foam without being swamped.",
      ingredients:["1 very fresh egg yolk","2 tbsp condensed milk","1/4 tsp vanilla (optional)","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)"],
      steps:[{t:"Set up the yolk",c:"Separate the yolk cleanly into a small deep bowl with condensed milk and vanilla."},{t:"Whip the foam",c:"Whip 3–4 min with a frother until pale, thick and it holds a ribbon."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Pour the coffee",c:"Pour coffee into a small cup, about a third full."},{t:"Float the foam",c:"Spoon the egg foam on top so it floats; eat with a spoon or stir in halfway."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant works well here — the egg foam is so dominant that coffee quality matters less than strength. Use 2 tsp in 50 ml water to keep it concentrated.",
      ingredients:["1 very fresh egg yolk","2 tbsp condensed milk","1/4 tsp vanilla (optional)","2 tsp instant coffee","50 ml hot water"],
      steps:[{t:"Whip the yolk",c:"Combine egg yolk, condensed milk and vanilla in a small deep bowl."},{t:"Whip to foam",c:"Whip 3–4 minutes with a frother until pale, thick and ribbon-forming."},{t:"Make the coffee",c:"Stir instant coffee into 50 ml hot water until dissolved."},{t:"Pour and float",c:"Pour coffee into a small cup about a third full, then spoon the egg foam on top."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A French press gives a fuller, darker base that balances the sweet egg foam beautifully.",
      ingredients:["1 very fresh egg yolk","2 tbsp condensed milk","1/4 tsp vanilla (optional)","18 g ground coffee (dark roast, coarse grind)","120 ml hot water"],
      steps:[{t:"Brew strong",c:"Steep coffee in French press 4 minutes, press and pour about 60 ml into a small cup."},{t:"Whip the foam",c:"Whip egg yolk with condensed milk and vanilla until pale, thick and ribbon-forming."},{t:"Combine",c:"Pour a small amount of hot French press coffee into a cup, about a third full."},{t:"Float the foam",c:"Spoon the egg foam on top so it floats. Eat with a spoon or stir halfway."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A pour over base gives a cleaner, brighter cup under the rich foam — interesting contrast.",
      ingredients:["1 very fresh egg yolk","2 tbsp condensed milk","1/4 tsp vanilla (optional)","15 g ground coffee (medium grind)","120 ml hot water (93°C)"],
      steps:[{t:"Brew pour over",c:"Bloom 30 seconds, then pour slowly. Collect 60 ml of concentrated brew."},{t:"Whip the foam",c:"Whip egg yolk with condensed milk and vanilla until pale, thick and ribbon-forming."},{t:"Pour base",c:"Pour 60 ml of the pour over into a small cup."},{t:"Float the foam",c:"Spoon egg foam on top. The cleaner pour over base lets the egg flavour lead."}]
    }
  ]
},
{
  id:"seed-suada", serial:4, name:"Vietnamese Iced Coffee (Cà Phê Sữa Đá)",
  story:"The original, and the blueprint for half this book. When the French brought coffee to Vietnam but fresh milk wouldn't survive the heat, locals reached for the tin of sweetened condensed milk instead — and a classic was born. Bold robusta, sweet milk, a mountain of ice. Master the balance here and the coconut and egg versions are just this with one extra step. If you only learn one Vietnamese coffee, make it this one.",
  bean:"Dark roast robusta — the traditional Vietnamese bean. Bold, low-acid and bitter enough to cut clean through sweet condensed milk. Phin-style dark robusta (Trung Nguyen, or any robusta-heavy dark blend) is the authentic move.",
  description:"The original Vietnamese iced coffee — strong coffee stirred into sweet condensed milk, poured over ice. The master recipe the others are built on.",
  method:"moka pot", origin:"Vietnam", ratio:"1:2", ratioLabel:"condensed milk : coffee", strength:4,
  tried:true, rating:0, createdAt:D('2026-06-08'),
  ingredients:["2 tbsp condensed milk","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1 cup ice cubes"],
  steps:[{t:"Start with the milk",c:"Spoon condensed milk into the bottom of the glass."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Stir into the milk",c:"Pour hot coffee onto the milk and stir hard 20–30 sec until smooth and caramel-coloured."},{t:"Pour over ice",c:"Fill with ice, stir until frosty, add more condensed milk if you want it sweeter."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. This is the master recipe. Stir while hot so the milk dissolves before the ice goes in. More condensed milk = dessert-sweet, less = sharper kick.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka pot is the best home substitute for the traditional Vietnamese phin filter.",
      ingredients:["2 tbsp condensed milk","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1 cup ice cubes"],
      steps:[{t:"Start with the milk",c:"Spoon condensed milk into the bottom of the glass."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Stir into the milk",c:"Pour hot coffee onto the milk and stir hard 20–30 sec until smooth and caramel-coloured."},{t:"Pour over ice",c:"Fill with ice, stir until frosty, add more condensed milk if you want it sweeter."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Use a robusta-based instant and make it slightly stronger than usual to cut through the condensed milk.",
      ingredients:["2 tbsp condensed milk","2 heaped tsp instant coffee (robusta preferred)","60 ml hot water","1 cup ice cubes"],
      steps:[{t:"Start with the milk",c:"Spoon condensed milk into the bottom of the glass."},{t:"Dissolve instant",c:"Stir instant coffee into 60 ml hot water until fully dissolved."},{t:"Stir into the milk",c:"Pour hot coffee onto the milk and stir hard 20–30 sec until smooth and caramel-coloured."},{t:"Pour over ice",c:"Fill with ice, stir until frosty, taste and add more condensed milk if needed."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A dark-roast French press is a great alternative — coarse grind gives good body with less bitterness.",
      ingredients:["2 tbsp condensed milk","18 g ground coffee (dark roast, coarse grind)","120 ml hot water","1 cup ice cubes"],
      steps:[{t:"Brew strong",c:"Steep coffee in French press 4 minutes with 120 ml hot water. Press and pour 60 ml."},{t:"Stir with milk",c:"Pour hot coffee onto condensed milk and stir hard until smooth."},{t:"Add ice",c:"Fill with ice and stir until frosty cold."},{t:"Taste and adjust",c:"More condensed milk = sweeter, less = sharper."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A medium-dark pour over gives a cleaner, more nuanced base — try a Vietnamese arabica if you can find one.",
      ingredients:["2 tbsp condensed milk","15 g ground coffee (medium-dark, medium grind)","120 ml hot water (93°C)","1 cup ice cubes"],
      steps:[{t:"Bloom",c:"Place filter, add coffee, pour 30 ml water and wait 30 seconds."},{t:"Pour slowly",c:"Pour remaining water in slow circles over 2 minutes. Collect 60 ml concentrate."},{t:"Stir with milk",c:"Pour pour over concentrate onto condensed milk and stir hard."},{t:"Over ice",c:"Fill with ice and stir frosty cold."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew + condensed milk is how many Vietnamese cafés make this now — ultra-smooth, zero bitterness.",
      ingredients:["2 tbsp condensed milk","20 g ground coffee (dark roast, coarse grind)","160 ml cold water","1 cup ice cubes"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Refrigerate 12–18 hours."},{t:"Strain",c:"Strain through a fine sieve. This is your cold brew concentrate."},{t:"Stir with milk",c:"Stir condensed milk into 80 ml cold brew until smooth."},{t:"Over ice",c:"Pour over a glass packed with ice."}]
    },
    {
      id:"cezve", label:"Cezve", recommended:false,
      note:"A cezve gives an incredibly strong, fine-bodied coffee — closer to the original phin intensity than any other method.",
      ingredients:["2 tbsp condensed milk","1 heaped tsp extra-fine ground coffee (Turkish grind)","65 ml cold water","1 cup ice cubes"],
      steps:[{t:"Combine cold",c:"Put coffee and water in the cezve. Do not stir yet."},{t:"Heat very gently",c:"Heat on low until foam rises. Spoon a little foam into the cup."},{t:"Catch before boiling",c:"Remove just before it boils. Let grounds settle 1 minute."},{t:"Build the glass",c:"Stir condensed milk with the settled coffee, then pour over ice."}]
    }
  ]
},
{
  id:"seed-bombon", serial:5, name:"Café Bombón (Spanish Layered Coffee)",
  story:"Spain's little jewel. Born in Valencia, it's almost too pretty to drink: equal parts condensed milk and strong coffee, poured so they settle into two clean bands — dark over cream — in a small clear glass. The name means 'bonbon,' and that's exactly the size and spirit: tiny, sweet, intense. You admire the layers for a moment, then stir them into one smooth, sweet shot.",
  bean:"Dark roast, chocolatey-nutty espresso-style blend (arabica-robusta) — strong and concentrated enough to stand against an equal part of condensed milk. Spanish tradition leans very dark; keep it bold so the coffee layer holds its own.",
  description:"Spanish layered coffee — equal parts condensed milk and strong coffee in a small clear glass, sitting in two clean bands. Small, sweet, striking.",
  method:"moka pot", origin:"Spain", ratio:"1:1", ratioLabel:"condensed milk : coffee", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-10'),
  ingredients:["1 tbsp condensed milk","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)"],
  steps:[{t:"Pour the milk",c:"Pour condensed milk into a small clear glass. It needs to be clear so you can see the two layers — that's the whole charm."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Layer the coffee",c:"Hold a spoon upside down above the milk and pour coffee over the back of it so it layers on top in a clean dark band."},{t:"Show, then stir",c:"Serve as-is for the two-tone look, then stir together into a sweet smooth shot before drinking."}],
  notes:"Instant: 1 heaped tsp in 30–40 ml hot water — keep it strong and small. Clear glass is essential for the layers. It's a small intense shot, don't scale up to a mug. Pour slow over the spoon for a clean line.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka shot sits in a clean band above the condensed milk — the classic two-tone look.",
      ingredients:["1 tbsp condensed milk","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)"],
      steps:[{t:"Pour the milk",c:"Pour condensed milk into a small clear glass. It needs to be clear so you can see the two layers — that's the whole charm."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Layer the coffee",c:"Hold a spoon upside down above the milk and pour coffee over the back of it so it layers on top in a clean dark band."},{t:"Show, then stir",c:"Serve as-is for the two-tone look, then stir together into a sweet smooth shot before drinking."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Use only 30–40 ml of water to keep it concentrated — the Bombón needs a strong short shot.",
      ingredients:["1 tbsp condensed milk","1 heaped tsp instant coffee","35 ml hot water"],
      steps:[{t:"Pour the milk",c:"Pour condensed milk into a small clear glass."},{t:"Make strong instant",c:"Dissolve instant coffee in 35 ml hot water — keep it small and strong."},{t:"Layer carefully",c:"Pour coffee over the back of a spoon so it layers above the milk in a dark band."},{t:"Show, then stir",c:"Admire the layers, then stir into a sweet smooth shot before drinking."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"Brew very small and strong — collect only 40 ml from the press for the right concentration.",
      ingredients:["1 tbsp condensed milk","18 g ground coffee (dark roast, coarse grind)","80 ml hot water"],
      steps:[{t:"Brew small and strong",c:"Steep 4 minutes in French press with 80 ml water. Press, collect 40 ml."},{t:"Pour the milk",c:"Add condensed milk to a small clear glass."},{t:"Layer",c:"Pour the strong French press coffee over the back of a spoon to float on top."},{t:"Stir to drink",c:"The layers are for show — stir before drinking."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A concentrated pour over drip — use less water than usual to keep the coffee strong enough to hold its layer.",
      ingredients:["1 tbsp condensed milk","12 g ground coffee (medium-dark grind)","80 ml hot water (93°C)"],
      steps:[{t:"Brew concentrated",c:"Bloom 20 seconds, then pour slowly over 90 seconds. Collect 40 ml strong concentrate."},{t:"Pour the milk",c:"Add condensed milk to a small clear glass."},{t:"Layer",c:"Pour the pour over concentrate over the back of a spoon to sit above the milk."},{t:"Stir to serve",c:"The Bombón is small — it is drunk stirred together, not in layers."}]
    },
    {
      id:"cezve", label:"Cezve", recommended:false,
      note:"The cezve makes an intensely strong, fine-bodied shot that layers perfectly and holds the two-tone look the longest.",
      ingredients:["1 tbsp condensed milk","1 heaped tsp extra-fine ground coffee","65 ml cold water","1 tsp sugar (optional)"],
      steps:[{t:"Combine cold",c:"Add coffee, water and sugar to cezve. Stir once."},{t:"Heat gently",c:"Warm slowly on low until foam rises. Remove just before boiling."},{t:"Settle",c:"Let grounds settle 1 minute, then pour slowly into the glass over the condensed milk."},{t:"Layer effect",c:"The fine cezve brew layers more cleanly than moka — almost no stirring needed."}]
    }
  ]
},
{
  id:"seed-kopisusu", serial:6, name:"Es Kopi Susu (Indonesian Iced Coffee)",
  story:"Indonesia's modern café darling. 'Kopi susu' simply means 'coffee milk,' but the new-wave Jakarta version added a spoon of palm sugar for caramel depth — and the streaky syrup running down the inside of the glass became its signature look. Indonesia grows some of the world's boldest robusta, and here it turns earthy and chocolatey under sweet milk and that jaggery edge. The lucky part for you: gur from your own kitchen does the job perfectly.",
  bean:"Dark roast Indonesian — Sumatra (Mandheling) or Java — or a robusta blend. Earthy, full-bodied and low-acid, with a heavy chocolate depth that pairs beautifully with the jaggery/palm-sugar syrup.",
  description:"Indonesian café coffee — strong coffee and condensed milk lifted with jaggery/palm sugar for caramel depth, over ice.",
  method:"moka pot", origin:"Indonesia", ratio:"1:2", ratioLabel:"condensed milk : coffee", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-12'),
  ingredients:["2 tbsp condensed milk","1 tbsp palm sugar or jaggery (gur), grated","1 tbsp hot water (to melt the sugar)","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1 cup ice cubes"],
  steps:[{t:"Make the syrup",c:"Melt jaggery with hot water into a thick dark syrup, then swirl it up the inside walls of the glass for the streaky café look."},{t:"Add condensed milk",c:"Add condensed milk on top of the syrup."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Stir together",c:"Pour hot coffee in and stir to a smooth caramel brown."},{t:"Pour over ice",c:"Fill with ice and stir cold; add more condensed milk if needed."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Jaggery (gur) = the Indonesian twist. Swirl the syrup up the walls for the streaky café look.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka pot gives the earthy depth that matches the jaggery syrup.",
      ingredients:["2 tbsp condensed milk","1 tbsp palm sugar or jaggery (gur), grated","1 tbsp hot water (to melt the sugar)","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1 cup ice cubes"],
      steps:[{t:"Make the syrup",c:"Melt jaggery with hot water into a thick dark syrup, then swirl it up the inside walls of the glass for the streaky café look."},{t:"Add condensed milk",c:"Add condensed milk on top of the syrup."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Stir together",c:"Pour hot coffee in and stir to a smooth caramel brown."},{t:"Pour over ice",c:"Fill with ice and stir cold; add more condensed milk if needed."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"A bold robusta instant is actually very close to Indonesian kopi — this method is authentic.",
      ingredients:["2 tbsp condensed milk","1 tbsp palm sugar or jaggery (gur), grated","1 tbsp hot water","2 heaped tsp instant coffee (robusta-based)","60 ml hot water","1 cup ice cubes"],
      steps:[{t:"Make the syrup",c:"Melt jaggery with 1 tbsp hot water. Swirl it up the inside walls of the glass."},{t:"Add condensed milk",c:"Spoon condensed milk on top of the syrup."},{t:"Make instant coffee",c:"Stir instant coffee into 60 ml hot water."},{t:"Stir and ice",c:"Pour coffee into glass, stir together, then fill with ice."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A dark-roast French press gives earthy body close to Indonesian kopi — coarse grind, 4 minute steep.",
      ingredients:["2 tbsp condensed milk","1 tbsp jaggery (gur), grated","1 tbsp hot water","18 g ground coffee (dark roast, coarse grind)","120 ml hot water","1 cup ice cubes"],
      steps:[{t:"Brew strong",c:"Steep coffee in French press 4 minutes. Press and collect 60 ml."},{t:"Make the syrup",c:"Melt jaggery with hot water and swirl inside the glass."},{t:"Add condensed milk",c:"Spoon onto the syrup."},{t:"Stir and ice",c:"Pour hot French press coffee in, stir smooth, fill with ice."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew + jaggery + condensed milk is the modern Jakarta café version — smooth and deeply caramelly.",
      ingredients:["2 tbsp condensed milk","1 tbsp jaggery (gur), grated","1 tbsp hot water","20 g ground coffee (dark roast, coarse grind)","160 ml cold water","1 cup ice cubes"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water, refrigerate 12–18 hours, strain."},{t:"Make the syrup",c:"Dissolve jaggery in 1 tbsp hot water and swirl inside the glass."},{t:"Layer",c:"Add condensed milk, then ice, then pour cold brew concentrate over the top."},{t:"Stir",c:"Give one gentle stir and drink."}]
    }
  ]
},
{
  id:"seed-thai", serial:7, name:"Thai Iced Coffee (Oliang-style)",
  story:"Thailand's street-cart classic. 'Oliang' is the strong black coffee Thai vendors brew through a cloth sock filter, traditionally roasted with corn and sesame for a smoky depth. Sweetened heavily, poured over ice, then finished with a ribbon of evaporated milk swirling down through the dark — that two-milk cascade is the signature move. The cardamom is my small shortcut to that 'what is that flavour?' Thai taste, using something you almost certainly already have in the kitchen.",
  bean:"Dark roast robusta blend — bold and a touch smoky, so it carries the cardamom spice and survives the double hit of condensed and evaporated milk. Traditional Oliang blends even add roasted grains; a dark robusta gets you the same deep, smoky base.",
  description:"Thai iced coffee — sweet spiced coffee over ice, finished with a float of evaporated milk that swirls down in white ribbons.",
  method:"moka pot", origin:"Thailand", ratio:"1:2", ratioLabel:"milk : coffee", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-12'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","1 cardamom pod, lightly crushed","60 ml water (to the moka pot safety valve)","1.5 tbsp condensed milk","1 tsp sugar","1 cup ice cubes","2 tbsp evaporated or regular milk for the float"],
  steps:[{t:"Brew spiced coffee",c:"Brew the moka pot with the crushed cardamom pod tucked in the basket; pull off when it gurgles."},{t:"Sweeten it",c:"Stir condensed milk and sugar into the hot coffee until glossy."},{t:"Pour over ice",c:"Fill a tall glass with ice and pour the coffee over."},{t:"Float the milk",c:"Float evaporated milk on top so it blooms and swirls down through the dark coffee; stir before drinking."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water; steep crushed cardamom in it a minute then remove. Two-milk system is the signature. Skip cardamom for plain.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The cardamom pod brewed directly in the moka basket is the key technique — it perfumes the coffee perfectly.",
      ingredients:["17 g ground coffee (moka basket level, not tamped)","1 cardamom pod, lightly crushed","60 ml water (to the moka pot safety valve)","1.5 tbsp condensed milk","1 tsp sugar","1 cup ice cubes","2 tbsp evaporated or regular milk for the float"],
      steps:[{t:"Brew spiced coffee",c:"Brew the moka pot with the crushed cardamom pod tucked in the basket; pull off when it gurgles."},{t:"Sweeten it",c:"Stir condensed milk and sugar into the hot coffee until glossy."},{t:"Pour over ice",c:"Fill a tall glass with ice and pour the coffee over."},{t:"Float the milk",c:"Float evaporated milk on top so it blooms and swirls down through the dark coffee; stir before drinking."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Steep a crushed cardamom pod in the hot water before adding instant coffee for the authentic Thai spice note.",
      ingredients:["2 heaped tsp instant coffee (robusta-based)","1 cardamom pod, lightly crushed","60 ml hot water","1.5 tbsp condensed milk","1 tsp sugar","1 cup ice cubes","2 tbsp evaporated or regular milk for the float"],
      steps:[{t:"Steep the spice",c:"Pour hot water over the crushed cardamom pod and steep 2 minutes. Remove pod."},{t:"Dissolve instant",c:"Stir instant coffee into the cardamom water until fully dissolved."},{t:"Sweeten",c:"Stir in condensed milk and sugar until smooth."},{t:"Build the glass",c:"Fill a tall glass with ice, pour the spiced coffee over, then float evaporated milk on top."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"Add the cardamom pod directly to the French press — it steeps with the coffee and delivers the full Thai character.",
      ingredients:["18 g ground coffee (dark roast, coarse grind)","2 cardamom pods, lightly crushed","120 ml hot water","1.5 tbsp condensed milk","1 tsp sugar","1 cup ice cubes","2 tbsp evaporated milk"],
      steps:[{t:"Brew with spice",c:"Add coffee and crushed cardamom to French press, pour hot water, steep 4 minutes, press."},{t:"Sweeten",c:"Stir condensed milk and sugar into the hot coffee."},{t:"Over ice",c:"Fill a tall glass with ice and pour the sweetened spiced coffee over."},{t:"Float the milk",c:"Pour evaporated milk over the top so it blooms down through the coffee."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold-brew the coffee with cardamom overnight for a smooth, spiced Thai cold brew concentrate.",
      ingredients:["20 g ground coffee (dark roast, coarse grind)","4 cardamom pods, lightly crushed","160 ml cold water","1.5 tbsp condensed milk","1 cup ice cubes","2 tbsp evaporated milk"],
      steps:[{t:"Steep overnight",c:"Combine coffee, cardamom pods and cold water in a jar. Refrigerate 14 hours. Strain."},{t:"Sweeten",c:"Stir condensed milk into the cold brew concentrate."},{t:"Build the glass",c:"Fill a glass with ice, pour the sweetened cold brew over."},{t:"Float the milk",c:"Pour evaporated milk on top so it blooms through."}]
    }
  ]
},
{
  id:"seed-frappe", serial:8, name:"Greek Frappé",
  story:"An accident that became a national habit. At a 1957 trade fair in Thessaloniki, a Nestlé rep wanted a coffee but had no hot water — so he shook instant coffee with cold water and ice in a shaker, and the frappé was born. Greece has been sipping it through long summer afternoons ever since. It's the one coffee in this book that needs instant — only spray-dried coffee whips into that thick, lasting foam. Order it like a local by sweetness: sketos, metrios, or glykos.",
  bean:"No moka beans here — this one is instant by design. A robusta-based instant (the classic Nescafé-style) whips into a thicker, longer-lasting foam than a smooth arabica instant. The foam is the whole point, so robusta wins.",
  description:"The Greek summer classic — instant coffee, a splash of water and sugar shaken into a thick foam, poured over ice and topped with cold water. The one coffee that needs instant.",
  method:"instant", origin:"Greece", ratio:"2:1", ratioLabel:"coffee : sugar", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-13'),
  ingredients:["2 tsp instant coffee","1 tsp sugar (adjust to taste)","3 tbsp cold water (for the foam)","1 cup ice cubes","150 ml cold water (to top up)","2 tbsp milk (optional splash)"],
  steps:[{t:"Combine the base",c:"Put instant coffee, sugar and 3 tbsp cold water in a sealable jar (or tall glass with a frother). Keep the water small — a thick paste foams best."},{t:"Shake to foam",c:"Shake the sealed jar hard for about a minute (or whisk/froth) until it's a thick, pale, mousse-like foam that holds its shape."},{t:"Foam over ice",c:"Add ice to a tall glass, then spoon and pour the foam over the ice."},{t:"Top with water",c:"Slowly top up with cold water (and milk if you like). Serve with a straw and don't stir — sip through the foam."}],
  notes:"Must use instant — won't foam with brewed. Keep the foam water tiny for a thick paste. Order by sugar: sketos (none), metrios (medium), glykos (sweet). Milk splash = frappé me gala.",
  methods:[
    {
      id:"instant", label:"Instant", recommended:true,
      note:"The Greek Frappé cannot be made with any other method. It requires spray-dried instant coffee because only the surfactants in spray-dried powder create the stable thick foam that defines this drink. Brewed coffee — moka, French press, pour over — will not foam. This is not a limitation; it is how the recipe was invented.",
      ingredients:["2 tsp instant coffee","1 tsp sugar (adjust to taste)","3 tbsp cold water (for the foam)","1 cup ice cubes","150 ml cold water (to top up)","2 tbsp milk (optional splash)"],
      steps:[{t:"Combine the base",c:"Put instant coffee, sugar and 3 tbsp cold water in a sealable jar (or tall glass with a frother). Keep the water small — a thick paste foams best."},{t:"Shake to foam",c:"Shake the sealed jar hard for about a minute (or whisk/froth) until it's a thick, pale, mousse-like foam that holds its shape."},{t:"Foam over ice",c:"Add ice to a tall glass, then spoon and pour the foam over the ice."},{t:"Top with water",c:"Slowly top up with cold water (and milk if you like). Serve with a straw and don't stir — sip through the foam."}]
    }
  ]
},
{
  id:"seed-shakerato", serial:9, name:"Caffè Shakerato (Italian Shaken Coffee)",
  story:"Italy, the moka pot's homeland. When the Italian summer makes a hot espresso unthinkable, baristas pour a fresh shot into a cocktail shaker with ice and shake it hard until it turns thick and frothy, then strain it — no ice, no milk — into a chilled coupe glass. It's coffee dressed up as a cocktail: all crema and elegance. It's the same shake-it-to-foam trick as the Greek frappé, but with real hot-brewed coffee, so it comes out richer and more grown-up. After a row of sweet milky drinks, this is the sophisticated black one.",
  bean:"Medium-dark to dark espresso roast with good body and crema — that's what foams up thick when shaken. Chocolatey and smooth rather than bright; it's served black, so the bean's character is front and centre.",
  description:"Italian shaken iced coffee — strong moka coffee shaken hard with ice until frothy, then strained into a chilled glass. No milk.",
  method:"moka pot", origin:"Italy", ratio:"2:1", ratioLabel:"coffee : sugar", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tsp sugar (dissolve while hot)","1 cup ice cubes (for shaking)"],
  steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten while hot",c:"Stir sugar into the hot coffee until fully dissolved — this must happen while it's hot."},{t:"Load the shaker",c:"Fill a cocktail shaker (or sealed jar) with ice and pour in the sweetened coffee."},{t:"Shake hard",c:"Shake hard for 15–20 sec until the outside frosts over and the coffee turns thick with foam."},{t:"Strain and serve",c:"Strain into a chilled glass, leaving the ice behind; the foam settles into a crema on top."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Dissolve sugar while hot; shake HARD — the foam is the point. Strain the ice out; a chilled martini or coupe glass is the traditional serve. Splash of coffee liqueur for an aperitivo version.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka crema shakes into a thick, luxurious foam — this is the authentic Italian method.",
      ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tsp sugar (dissolve while hot)","1 cup ice cubes (for shaking)"],
      steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten while hot",c:"Stir sugar into the hot coffee until fully dissolved — this must happen while it's hot."},{t:"Load the shaker",c:"Fill a cocktail shaker (or sealed jar) with ice and pour in the sweetened coffee."},{t:"Shake hard",c:"Shake hard for 15–20 sec until the outside frosts over and the coffee turns thick with foam."},{t:"Strain and serve",c:"Strain into a chilled glass, leaving the ice behind; the foam settles into a crema on top."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant shakerato works surprisingly well — dissolve in very little water to keep it concentrated, then shake hard.",
      ingredients:["2 heaped tsp instant coffee","40 ml hot water (very small — keep it strong)","2 tsp sugar (dissolve while hot)","1 cup ice cubes (for shaking)"],
      steps:[{t:"Make strong instant",c:"Dissolve coffee and sugar in 40 ml hot water — much less water than usual."},{t:"Load the shaker",c:"Fill a cocktail shaker or sealed jar with ice and pour in the sweetened instant."},{t:"Shake hard",c:"Shake 20–25 seconds until the outside frosts and the liquid turns thick and foamy."},{t:"Strain and serve",c:"Strain into a chilled glass, leaving ice behind. The foam settles on top."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A dark French press concentrate shakes into a decent foam — use less water than usual for concentration.",
      ingredients:["18 g ground coffee (dark roast, coarse grind)","80 ml hot water","2 tsp sugar","1 cup ice cubes (for shaking)"],
      steps:[{t:"Brew small and strong",c:"Steep 4 minutes in French press with 80 ml water. Collect 50 ml concentrate."},{t:"Sweeten hot",c:"Stir sugar into hot coffee until dissolved."},{t:"Shake hard",c:"Load a shaker with ice and the coffee. Shake 20 seconds until frosty and foamy."},{t:"Strain",c:"Strain into a chilled glass, leaving the ice behind."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A concentrated pour over shakerato has a cleaner, lighter foam — more elegant, less espresso-bar.",
      ingredients:["12 g ground coffee (medium-dark grind)","70 ml hot water (93°C)","2 tsp sugar","1 cup ice cubes"],
      steps:[{t:"Brew concentrated",c:"Bloom 20 seconds, pour slowly. Collect 50 ml concentrate."},{t:"Sweeten while hot",c:"Stir in sugar until dissolved."},{t:"Shake hard",c:"Ice into a shaker, add sweetened coffee, shake 20 seconds."},{t:"Strain into a chilled glass",c:"Leave the ice behind. The foam settles gently on top."}]
    },
    {
      id:"cezve", label:"Cezve", recommended:false,
      note:"A cezve shot shaken with ice makes the richest, most intense shakerato — closest to bar espresso.",
      ingredients:["1.5 heaped tsp extra-fine ground coffee","65 ml cold water","2 tsp sugar","1 cup ice cubes"],
      steps:[{t:"Brew and sweeten",c:"Make the cezve coffee as normal, sweeten while hot."},{t:"Cool slightly",c:"Let settle 1 minute, pour off the top (leaving grounds in the cezve)."},{t:"Shake",c:"Add to a shaker with ice, shake 20 seconds until frosty and foamy."},{t:"Strain and serve in a chilled glass",c:"The cezve version gives the richest, most intense foam."}]
    }
  ]
},
{
  id:"seed-mazagran", serial:10, name:"Mazagran (Portuguese Lemon Iced Coffee)",
  story:"One of the original iced coffees, with a curveball. French Foreign Legion soldiers stationed at the Algerian fort of Mazagran in the 1840s cut their coffee with cold water to survive the heat; Portugal adopted the idea and added lemon. It sounds wrong until you taste it — the citrus lifts the coffee and cuts the bitterness, turning something strong into something shockingly refreshing. After a long row of sweet, milky drinks, this is the bright, tart outlier — and the one place a brighter, fruitier bean finally earns its keep.",
  bean:"The one that flips the rule: with no milk to cut through, a medium roast with brighter, fruitier notes actually shines alongside the lemon. The citrus loves a more balanced, less-dark bean — the very kind to avoid in the milk drinks.",
  description:"Portugal's lemon iced coffee — strong sweetened coffee over ice with fresh lemon. Tart, bright and unexpectedly refreshing.",
  method:"moka pot", origin:"Portugal", ratio:"4:1", ratioLabel:"coffee : lemon juice", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tsp sugar (dissolve while hot)","15 ml fresh lemon juice (about half a lemon)","1 lemon slice, to garnish","1 cup ice cubes"],
  steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten while hot",c:"Stir sugar into the hot coffee until dissolved, then let it cool."},{t:"Add the lemon",c:"Stir in the lemon juice; taste and add a little more only if you want it brighter."},{t:"Pour over ice",c:"Fill a glass with ice, pour over, and garnish with a lemon slice. Stir and sip."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Start with less lemon and taste up — bright, not sour. Splash of rum for adults; top with soda for a fizzy version. A medium roast actually shines here since there's no milk.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"A medium-dark moka shot gives good body while letting the lemon brightness through.",
      ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tsp sugar (dissolve while hot)","15 ml fresh lemon juice (about half a lemon)","1 lemon slice, to garnish","1 cup ice cubes"],
      steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten while hot",c:"Stir sugar into the hot coffee until dissolved, then let it cool."},{t:"Add the lemon",c:"Stir in the lemon juice; taste and add a little more only if you want it brighter."},{t:"Pour over ice",c:"Fill a glass with ice, pour over, and garnish with a lemon slice. Stir and sip."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant works fine here — the lemon is the star, so coffee quality matters less than usual.",
      ingredients:["2 tsp instant coffee","60 ml hot water","2 tsp sugar","15 ml fresh lemon juice","1 lemon slice","1 cup ice cubes"],
      steps:[{t:"Dissolve instant",c:"Stir coffee and sugar into 60 ml hot water."},{t:"Add lemon",c:"Stir in lemon juice. Taste — it should be bright, not sour."},{t:"Over ice",c:"Fill a glass with ice, pour over, garnish with lemon slice."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A medium-roast French press gives a clean, fuller-bodied base that holds up well against lemon.",
      ingredients:["15 g ground coffee (medium roast, coarse grind)","100 ml hot water","2 tsp sugar","15 ml fresh lemon juice","1 lemon slice","1 cup ice cubes"],
      steps:[{t:"Brew medium",c:"Steep 3.5 minutes, press, collect 60 ml."},{t:"Sweeten",c:"Stir sugar into hot coffee."},{t:"Add lemon and cool",c:"Add lemon juice, let cool briefly."},{t:"Over ice",c:"Fill glass with ice, pour over, garnish."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"Pour over is actually ideal for Mazagran — the clean, bright, fruity notes of a medium roast play beautifully with lemon. This is the specialty-café way to make it.",
      ingredients:["14 g ground coffee (medium roast, medium grind)","120 ml hot water (93°C)","2 tsp sugar","15 ml fresh lemon juice","1 lemon slice","1 cup ice cubes"],
      steps:[{t:"Bloom",c:"Pour 30 ml water over grounds, wait 30 seconds."},{t:"Pour slowly",c:"Pour remaining water in slow circles over 2 minutes. Collect 60 ml."},{t:"Sweeten while hot",c:"Stir sugar into the pour over while warm."},{t:"Lemon and ice",c:"Add lemon juice, pour over ice, garnish."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew Mazagran is a Portuguese summer staple — the low-acid cold brew and lemon is a surprisingly perfect pairing.",
      ingredients:["20 g ground coffee (medium roast, coarse grind)","160 ml cold water","2 tsp sugar or simple syrup","20 ml fresh lemon juice","1 lemon slice","1 cup ice cubes"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in jar, refrigerate 12–18 hours, strain."},{t:"Sweeten cold",c:"Stir sugar syrup into cold brew concentrate."},{t:"Add lemon",c:"Stir in lemon juice — use slightly more than the hot version since cold brew is sweeter."},{t:"Over ice",c:"Pour over a glass packed with ice, garnish with lemon."}]
    }
  ]
},
{
  id:"seed-cafeolla", serial:11, name:"Café de Olla (Mexican Spiced Coffee)",
  story:"Time to cross the Atlantic to the Americas. Café de Olla is Mexico's cozy spiced coffee, traditionally brewed in a clay pot — the 'olla' that gives it its name and an earthy depth. The magic is cinnamon and piloncillo, raw unrefined cane sugar, simmered right into the coffee until it turns sweet, warming and faintly molasses-y. The lovely part for you: piloncillo and your jaggery (gur) are practically cousins, so your kitchen already has the secret ingredient. It's gentle and a little festive — a coffee made for cool evenings and slow mornings.",
  bean:"A medium-dark roast — enough body to carry the cinnamon and jaggery, but not so dark that it fights the spice. Chocolatey and smooth rather than sharp.",
  description:"Mexico's cozy spiced coffee — strong coffee brewed with cinnamon and sweetened with jaggery. Warm, gently spiced and faintly molasses-y.",
  method:"moka pot", origin:"Mexico", ratio:"2:1", ratioLabel:"coffee : jaggery", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","1 small cinnamon stick, broken (or 1/2 tsp ground cinnamon)","60 ml water (to the moka pot safety valve)","1.5 tbsp jaggery (gur) or piloncillo, grated","1 tbsp hot water (to melt the jaggery)","1 strip orange peel + 1 clove (optional, traditional)"],
  steps:[{t:"Brew with cinnamon",c:"Tuck the broken cinnamon stick into the moka basket with the grounds and brew; the steam carries the cinnamon right through. Pull off when it gurgles."},{t:"Make the syrup",c:"Melt jaggery with 1 tbsp hot water (and the orange peel/clove if using) into a thick dark syrup."},{t:"Sweeten and spice",c:"Stir the syrup into the hot coffee until dissolved; fish out the peel and clove."},{t:"Serve warm",c:"Pour into a mug and serve warm — or over a glass of ice for an iced version."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water; steep cinnamon in it first. Jaggery (gur) is the perfect stand-in for piloncillo. Don't oversweeten — taste cinnamon and caramel, not just sugar. Orange peel + clove make it smell like the holidays. Warm or iced.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"Tucking the cinnamon stick in the moka basket is the signature technique — the steam carries the spice right through.",
      ingredients:["17 g ground coffee (moka basket level, not tamped)","1 small cinnamon stick, broken (or 1/2 tsp ground cinnamon)","60 ml water (to the moka pot safety valve)","1.5 tbsp jaggery (gur) or piloncillo, grated","1 tbsp hot water (to melt the jaggery)","1 strip orange peel + 1 clove (optional, traditional)"],
      steps:[{t:"Brew with cinnamon",c:"Tuck the broken cinnamon stick into the moka basket with the grounds and brew; the steam carries the cinnamon right through. Pull off when it gurgles."},{t:"Make the syrup",c:"Melt jaggery with 1 tbsp hot water (and the orange peel/clove if using) into a thick dark syrup."},{t:"Sweeten and spice",c:"Stir the syrup into the hot coffee until dissolved; fish out the peel and clove."},{t:"Serve warm",c:"Pour into a mug and serve warm — or over a glass of ice for an iced version."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Steep cinnamon in the hot water before adding instant coffee — you get the warmth without the beans.",
      ingredients:["2 heaped tsp instant coffee","1 small cinnamon stick","60 ml hot water","1.5 tbsp jaggery (gur) or piloncillo","1 strip orange peel + 1 clove (optional)"],
      steps:[{t:"Steep the spice",c:"Bring 60 ml water to a simmer with cinnamon, orange peel and clove. Steep 3 minutes."},{t:"Dissolve jaggery",c:"Stir jaggery into the spiced water until melted."},{t:"Add instant",c:"Remove cinnamon, stir in instant coffee until dissolved."},{t:"Serve warm or over ice",c:"Taste, adjust sweetness, and pour into a mug or over ice."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"The French press is perfect for Café de Olla — the cinnamon and spices steep directly with the coffee grounds.",
      ingredients:["18 g ground coffee (medium-dark, coarse grind)","1 small cinnamon stick, broken","1 strip orange peel (optional)","1 clove (optional)","200 ml hot water","1.5 tbsp jaggery (gur)"],
      steps:[{t:"Add everything",c:"Place ground coffee, broken cinnamon, orange peel and clove into the French press."},{t:"Pour and steep",c:"Pour 200 ml hot water, stir once gently, steep 4 minutes."},{t:"Press and sweeten",c:"Press slowly, pour into a cup, stir in jaggery until dissolved."},{t:"Serve",c:"Hot as a warming cup, or let cool and pour over ice for a spiced iced coffee."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"Pour spiced simple syrup directly into your cup, then pour over a clean medium-dark brew — the two-step method keeps the spice bold and the coffee clean.",
      ingredients:["15 g ground coffee (medium-dark, medium grind)","1 small cinnamon stick","120 ml hot water (93°C)","1.5 tbsp jaggery dissolved in 1 tbsp hot water","1 strip orange peel (optional)"],
      steps:[{t:"Make spiced syrup",c:"Simmer jaggery, cinnamon and orange peel in 1 tbsp hot water for 2 minutes. Pour into cup."},{t:"Brew pour over",c:"Bloom 30 seconds, pour slowly. Drip directly onto the spiced syrup in the cup."},{t:"Stir to combine",c:"The hot pour over dissolves and melds with the syrup."},{t:"Taste and adjust",c:"Add more syrup if you want it sweeter."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold-brew with cinnamon overnight for an incredible naturally sweet iced Mexican coffee — great in summer.",
      ingredients:["20 g ground coffee (medium-dark, coarse grind)","2 cinnamon sticks","160 ml cold water","1.5 tbsp jaggery syrup (dissolved in 1 tbsp hot water, cooled)","1 cup ice cubes"],
      steps:[{t:"Steep overnight",c:"Combine coffee, cinnamon sticks and cold water in a jar. Refrigerate 14–18 hours."},{t:"Strain",c:"Strain through fine sieve, discard grounds and cinnamon."},{t:"Sweeten",c:"Stir in cooled jaggery syrup."},{t:"Over ice",c:"Pour over a glass packed with ice."}]
    }
  ]
},
{
  id:"seed-kaapi", serial:12, name:"South Indian Filter Coffee (Kaapi)",
  story:"Coming home for this one. After touring the world, here's the milky, frothy cup most of India grew up smelling in the kitchen. Strong coffee 'decoction' is cut with lots of hot milk and sugar, then pulled between a tumbler and a dabarah from a height until it's foamy and just cool enough to sip. Traditionally it's brewed in a metal filter with a chicory-coffee blend — your moka pot makes a fine stand-in for the filter, and that South Indian filter blend I kept recommending for the milk drinks is finally on its home turf.",
  bean:"The South Indian filter blend (arabica + robusta + chicory) is the obvious match — this is its home turf. The chicory gives kaapi its authentic bittersweet depth and body under all that milk.",
  description:"South India's beloved milky coffee — strong moka decoction cut with hot milk and sugar, pulled between two vessels until frothy. Comforting and creamy.",
  method:"moka pot", origin:"India", ratio:"1:3", ratioLabel:"decoction : milk", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["18 g ground coffee — South Indian filter blend (with chicory) is ideal","60 ml water (to the moka pot safety valve)","150 ml full-fat milk","2 tsp sugar (to taste)"],
  steps:[{t:"Make the decoction",c:"Brew the moka pot — this strong shot is your 'decoction'. Pull off when it gurgles."},{t:"Heat the milk",c:"Heat the milk until steaming hot but not boiling over."},{t:"Combine",c:"Combine the decoction, hot milk and sugar in a tall tumbler; stir to dissolve the sugar."},{t:"Pull it frothy",c:"Pour back and forth between two cups (or a tumbler and a bowl) from a height, 5–6 times, until frothy and well mixed. Serve immediately."}],
  notes:"Instant works in a pinch, but a chicory filter blend gives the authentic depth. Full-fat milk is non-negotiable. Strong decoction is key. The pour-from-height mixes, froths, and cools in one move. More milk = milder.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka pot is the best home substitute for the traditional South Indian metal filter drip.",
      ingredients:["18 g ground coffee — South Indian filter blend (with chicory) is ideal","60 ml water (to the moka pot safety valve)","150 ml full-fat milk","2 tsp sugar (to taste)"],
      steps:[{t:"Make the decoction",c:"Brew the moka pot — this strong shot is your 'decoction'. Pull off when it gurgles."},{t:"Heat the milk",c:"Heat the milk until steaming hot but not boiling over."},{t:"Combine",c:"Combine the decoction, hot milk and sugar in a tall tumbler; stir to dissolve the sugar."},{t:"Pull it frothy",c:"Pour back and forth between two cups (or a tumbler and a bowl) from a height, 5–6 times, until frothy and well mixed. Serve immediately."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Use a chicory-blend instant if available (MTR or similar) — the chicory depth is what makes Kaapi taste authentic.",
      ingredients:["2 heaped tsp instant coffee (chicory blend preferred — MTR, Continental)","60 ml hot water","150 ml full-fat milk","2 tsp sugar (to taste)"],
      steps:[{t:"Make the decoction",c:"Dissolve instant in 60 ml hot water — this is your stand-in decoction."},{t:"Heat the milk",c:"Heat milk until steaming hot but not boiling."},{t:"Combine",c:"Mix decoction, hot milk and sugar in a tall tumbler."},{t:"Pull frothy",c:"Pour back and forth between two cups from a height 5–6 times until frothy."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A dark French press with chicory coffee grounds gives excellent body and the bitter-sweet note authentic to Kaapi.",
      ingredients:["20 g ground coffee (South Indian filter blend with chicory, coarse grind)","100 ml hot water","150 ml full-fat milk","2 tsp sugar"],
      steps:[{t:"Brew strong",c:"Steep coffee in French press 5 minutes. Press slowly, collect 60 ml strong decoction."},{t:"Heat the milk",c:"Heat milk until steaming."},{t:"Combine and pull",c:"Mix decoction, hot milk and sugar in a tumbler. Pull from height 5–6 times until frothy."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A very slow, concentrated pour over with a chicory-blend drip coffee gives a smooth, clean version of Kaapi.",
      ingredients:["18 g ground coffee (South Indian blend, medium grind)","100 ml hot water (93°C)","150 ml full-fat milk","2 tsp sugar"],
      steps:[{t:"Bloom",c:"Pour 30 ml water, wait 45 seconds — chicory blooms slowly."},{t:"Pour slow",c:"Pour remaining water very slowly. Collect 60 ml decoction."},{t:"Combine with milk",c:"Mix hot decoction with hot milk and sugar."},{t:"Pull frothy",c:"Pour back and forth from a height 5–6 times."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew Kaapi — make a strong cold brew with chicory blend, then mix with cold full-fat milk over ice. The chicory makes this unusually good cold.",
      ingredients:["22 g ground coffee (South Indian filter blend with chicory, coarse grind)","180 ml cold water","150 ml cold full-fat milk","2 tsp sugar or condensed milk","1 cup ice cubes"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in jar, refrigerate 14 hours, strain."},{t:"Sweeten",c:"Stir sugar or condensed milk into the cold brew concentrate."},{t:"Over ice",c:"Fill a glass with ice, add cold milk, then pour in the sweetened cold brew."},{t:"Stir and serve cold",c:"Give one gentle stir and drink immediately."}]
    }
  ]
},
{
  id:"seed-cortadito", serial:13, name:"Cuban Cortadito",
  story:"From Mexico down to the Caribbean. The cortadito is Cuba's small, strong, sweet milk coffee, and it has a gorgeous signature trick called espuma: you whip the very first dark drops of the brew with sugar into a pale golden foam, then the rest of the coffee froths up over it. No machine, no egg — just sugar and elbow grease making its own sweet crema. It's the third 'whip it to foam' move in this book, reached a completely different way: egg yolk in Hanoi, a hard shake in Greece and Italy, and here, whipped sugar in Havana.",
  bean:"A dark espresso roast — bold and chocolatey so it punches through the milk in such a small cup. Smooth and rich, not bright or acidic.",
  description:"Cuba's small, sweet milk coffee — strong coffee with a whipped-sugar espuma crema, cut with equal hot milk. Rich and frothy.",
  method:"moka pot", origin:"Cuba", ratio:"1:1", ratioLabel:"coffee : milk", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (dark roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tsp sugar","60 ml hot milk (equal to the coffee)"],
  steps:[{t:"Catch the first drops",c:"Put the sugar in a small cup. Start brewing the moka pot and catch the very first dark drops (about 1 tsp) into the sugar."},{t:"Whip the espuma",c:"Whip those first drops and the sugar hard with a spoon for a minute until it turns into a pale, thick, light-brown foam — the espuma."},{t:"Pour the coffee in",c:"Let the rest of the coffee finish brewing, then pour it into the espuma. It foams up into a creamy golden crema."},{t:"Add equal milk",c:"Heat the milk until steaming, pour in an equal amount, and stir gently. Serve in a small glass."}],
  notes:"Instant: whip the sugar with a thick paste of 1 tsp instant + a few drops hot water. Espuma is the Cuban secret — naturally sweet crema, no machine. Dark espresso roast is best. Equal milk = cortadito; more milk = cortado.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The espuma (whipped sugar-and-first-drops) technique requires the moka pot — you catch the very first drops as they emerge.",
      ingredients:["17 g ground coffee (dark roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tsp sugar","60 ml hot milk (equal to the coffee)"],
      steps:[{t:"Catch the first drops",c:"Put the sugar in a small cup. Start brewing the moka pot and catch the very first dark drops (about 1 tsp) into the sugar."},{t:"Whip the espuma",c:"Whip those first drops and the sugar hard with a spoon for a minute until it turns into a pale, thick, light-brown foam — the espuma."},{t:"Pour the coffee in",c:"Let the rest of the coffee finish brewing, then pour it into the espuma. It foams up into a creamy golden crema."},{t:"Add equal milk",c:"Heat the milk until steaming, pour in an equal amount, and stir gently. Serve in a small glass."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Whip a thick paste of instant + a few drops hot water with sugar to create an espuma-style foam — it works surprisingly well.",
      ingredients:["2 tsp instant coffee","2 tsp sugar","2 tbsp hot water (split — 1 tsp for paste, rest for the cup)","60 ml hot milk"],
      steps:[{t:"Make the paste",c:"Combine sugar with 1 tsp instant coffee and just a few drops of hot water. Whip hard until pale and thick."},{t:"Make the coffee",c:"Dissolve remaining instant in the rest of the hot water."},{t:"Build the cup",c:"Pour coffee onto the whipped paste — it foams up into a sweet crema."},{t:"Add equal milk",c:"Add hot milk and stir gently. Serve in a small glass."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"Brew very small and strong. The espuma technique changes — whip sugar with the first pour from the press.",
      ingredients:["18 g ground coffee (dark roast, coarse grind)","80 ml hot water","2 tsp sugar","60 ml hot milk"],
      steps:[{t:"Brew small",c:"Steep 4 minutes in French press with 80 ml water. Press, collect 60 ml."},{t:"Make espuma alternative",c:"Whip 2 tsp sugar with 1 tbsp of the hot coffee until pale and thick."},{t:"Combine",c:"Pour remaining coffee onto the whipped sugar. Add equal amount of hot milk. Serve in a small glass."}]
    },
    {
      id:"cezve", label:"Cezve", recommended:false,
      note:"The cezve gives the most intense, syrup-thick base — closest to real Cuban espresso pressure.",
      ingredients:["1.5 heaped tsp extra-fine ground coffee","65 ml cold water","2 tsp sugar","60 ml hot milk"],
      steps:[{t:"Combine cold",c:"Add coffee, water and sugar to cezve. Stir once."},{t:"Heat slowly",c:"Warm on low until foam rises. Spoon a little into the cup. Remove before boiling."},{t:"Settle and pour",c:"Let settle 1 minute, pour carefully into a small glass."},{t:"Add equal milk",c:"Add 60 ml hot milk. The cezve version has a naturally silky texture that makes the milk feel almost creamy."}]
    }
  ]
},
{
  id:"seed-dalgona", serial:14, name:"Dalgona Coffee (Korean Whipped Coffee)",
  story:"Korea's contribution, and one you can make right now with just instant coffee. Dalgona went viral during the 2020 lockdowns, but it's rooted in a whipped coffee long served in Macau and Korea. You beat instant coffee, sugar and hot water into a thick caramel cloud and spoon it over cold milk. It's named after dalgona, a Korean honeycomb-sugar candy it matches in colour. Like the Greek frappé, it only works with instant — spray-dried coffee is the secret to the foam.",
  bean:"Instant by design — like the Greek frappé, only spray-dried instant whips into a stable cloud. A robusta-leaning instant gives the thickest, most stable foam.",
  description:"Korea's viral whipped coffee — instant coffee, sugar and hot water beaten into a fluffy caramel cloud, spooned over cold milk.",
  method:"instant", origin:"South Korea", ratio:"1:1:1", ratioLabel:"coffee : sugar : water", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["2 tbsp instant coffee (must be instant)","2 tbsp sugar","2 tbsp hot water","200 ml cold milk","1 cup ice cubes"],
  steps:[{t:"Combine the three",c:"Combine the instant coffee, sugar and hot water in a bowl."},{t:"Whip to a cloud",c:"Whip hard with a hand mixer, frother or whisk until it's a thick, fluffy, pale-caramel cream that holds peaks — 2–3 min with a mixer, longer by hand."},{t:"Ice the milk",c:"Fill a glass with ice and pour in the cold milk, leaving room at the top."},{t:"Top with the cloud",c:"Spoon the whipped coffee cloud on top of the milk. Admire it, then stir to drink."}],
  notes:"It MUST be instant coffee — like the Greek frappé, only spray-dried coffee whips into a stable foam. The 1:1:1 ratio is the whole magic. By hand it's 5+ minutes; an electric frother or mixer does it in 2–3 min. Serve over iced milk, or warm milk in winter.",
  methods:[
    {
      id:"instant", label:"Instant", recommended:true,
      note:"Like the Greek Frappé, Dalgona cannot be made with brewed coffee. The stable whipped foam — the entire point of the drink — requires the surfactants in spray-dried instant coffee powder. Brewed coffee, no matter how concentrated, will not hold peaks. This is not a workaround; it is the recipe.",
      ingredients:["2 tbsp instant coffee (must be instant)","2 tbsp sugar","2 tbsp hot water","200 ml cold milk","1 cup ice cubes"],
      steps:[{t:"Combine the three",c:"Combine the instant coffee, sugar and hot water in a bowl."},{t:"Whip to a cloud",c:"Whip hard with a hand mixer, frother or whisk until it's a thick, fluffy, pale-caramel cream that holds peaks — 2–3 min with a mixer, longer by hand."},{t:"Ice the milk",c:"Fill a glass with ice and pour in the cold milk, leaving room at the top."},{t:"Top with the cloud",c:"Spoon the whipped coffee cloud on top of the milk. Admire it, then stir to drink."}]
    }
  ]
},
{
  id:"seed-qahwa", serial:15, name:"Moroccan Spiced Coffee (Qahwa)",
  story:"North Africa now. Moroccans perfume their coffee with a warming spice blend, and the secret that sets it apart from a sweet dessert-spice is black pepper and ginger — they give it a gentle heat rather than just sweetness. Served strong and sweet, it's a gesture of hospitality, often offered to guests alongside dates or pastries.",
  bean:"A medium-dark roast with body to carry the spice without fighting it. Chocolatey and smooth; the six-spice blend is the star here, not bright bean notes.",
  description:"Morocco's spiced coffee — strong coffee brewed with a warming blend of cinnamon, cardamom, clove, nutmeg, black pepper and ginger. Strong, sweet, fragrant.",
  method:"moka pot", origin:"Morocco", ratio:"½ tsp", ratioLabel:"spice blend per cup", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","1/2 tsp spice blend: pinch each of cinnamon, cardamom, clove, nutmeg, black pepper, ginger","60 ml water (to the moka pot safety valve)","2 tsp sugar (to taste)","60 ml hot milk (optional)"],
  steps:[{t:"Spice the grounds",c:"Mix the spice blend into the ground coffee right in the moka basket so the spices brew through the coffee."},{t:"Brew",c:"Brew the moka pot: low-medium heat, basket level not tamped, pull off when it gurgles."},{t:"Sweeten",c:"Stir in the sugar until dissolved. Add a splash of hot milk if you'd like it milky."},{t:"Serve",c:"Pour and serve strong and hot. Great with a date or a sweet pastry on the side."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water, stirred with the spice blend. Black pepper and ginger are what make it Moroccan rather than a sweet dessert spice; don't skip them. Start with a small pinch of each and adjust — the pepper should warm, not bite.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"Mixing the six-spice blend directly into the basket lets the steam carry every note through the coffee.",
      ingredients:["17 g ground coffee (moka basket level, not tamped)","1/2 tsp spice blend: pinch each of cinnamon, cardamom, clove, nutmeg, black pepper, ginger","60 ml water (to the moka pot safety valve)","2 tsp sugar (to taste)","60 ml hot milk (optional)"],
      steps:[{t:"Spice the grounds",c:"Mix the spice blend into the ground coffee right in the moka basket so the spices brew through the coffee."},{t:"Brew",c:"Brew the moka pot: low-medium heat, basket level not tamped, pull off when it gurgles."},{t:"Sweeten",c:"Stir in the sugar until dissolved. Add a splash of hot milk if you'd like it milky."},{t:"Serve",c:"Pour and serve strong and hot. Great with a date or a sweet pastry on the side."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Stir the spice blend into hot water before adding instant — the bloom releases the aromatics.",
      ingredients:["2 heaped tsp instant coffee","1/2 tsp spice blend (cinnamon, cardamom, clove, nutmeg, black pepper, ginger — pinch of each)","60 ml hot water","2 tsp sugar"],
      steps:[{t:"Steep the spice",c:"Pour hot water over the spice blend and steep 2 minutes."},{t:"Add instant",c:"Stir instant coffee and sugar into the spiced water."},{t:"Strain if needed",c:"Pour through a fine sieve if using whole spices."},{t:"Serve strong and hot",c:"Pour into a small cup. Great with a date on the side."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"The French press is excellent here — steep the spices directly with the grounds for maximum fragrance.",
      ingredients:["18 g ground coffee (medium-dark, coarse grind)","1/2 tsp spice blend","200 ml hot water","2 tsp sugar"],
      steps:[{t:"Combine",c:"Add coffee and spice blend to the French press."},{t:"Pour and steep",c:"Add hot water, stir once, steep 4 minutes."},{t:"Press",c:"Press slowly and pour into a cup."},{t:"Sweeten",c:"Stir in sugar. Serve black and strong."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"Mix spices into ground coffee before brewing — the pour over extracts the spice cleanly without over-steeping.",
      ingredients:["15 g ground coffee (medium-dark, medium grind)","1/2 tsp spice blend mixed into the grounds","120 ml hot water (93°C)","2 tsp sugar or to taste"],
      steps:[{t:"Mix spice in",c:"Stir the spice blend into your ground coffee before adding to the filter."},{t:"Bloom",c:"Pour 30 ml water, wait 45 seconds — spice blooms need a little longer."},{t:"Pour slowly",c:"Complete the pour over in slow circles over 2 minutes."},{t:"Sweeten",c:"Stir sugar into the hot brew and serve immediately."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold-brew the spice-infused coffee overnight for an extraordinary iced Moroccan coffee — naturally sweet, deeply aromatic.",
      ingredients:["20 g ground coffee (medium-dark, coarse grind)","1 tsp spice blend","160 ml cold water","2 tsp sugar syrup (dissolved in 1 tbsp hot water, cooled)","1 cup ice cubes"],
      steps:[{t:"Spice and steep",c:"Combine coffee, spice blend and cold water in a jar. Refrigerate 14 hours."},{t:"Strain well",c:"Strain twice — once through a sieve, once through a coffee filter to remove fine spice particles."},{t:"Sweeten",c:"Stir in cooled sugar syrup."},{t:"Over ice",c:"Serve over a glass packed with ice."}]
    }
  ]
},
{
  id:"seed-yuenyeung", serial:16, name:"Hong Kong Yuenyeung (Coffee Milk Tea)",
  story:"One gloriously unusual one from Hong Kong: coffee mixed with milk tea. The name means 'mandarin duck pair,' the symbol for two things that belong together — coffee for the kick, Hong Kong-style milk tea for the smoothness. It was born in the city's cha chaan teng tea houses, where it's served both steaming hot and over ice.",
  bean:"Bold and dark — it has to hold its own against strong black tea and evaporated milk. A dark robusta blend keeps the coffee side from getting lost.",
  description:"Hong Kong's coffee-meets-milk-tea drink — strong coffee blended with sweet, creamy black milk tea. Served hot or iced.",
  method:"moka pot", origin:"Hong Kong", ratio:"3:7", ratioLabel:"coffee : milk tea", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["60 ml strong coffee (moka pot, or 2 tsp instant in 60 ml hot water)","140 ml strong brewed black tea (Ceylon-style, brewed dark)","2 tbsp evaporated milk (or 1.5 tbsp condensed milk)","2 tsp sugar (skip if using condensed milk)","1 cup ice cubes (for the iced version)"],
  steps:[{t:"Brew the coffee",c:"Brew 60 ml strong coffee and set aside."},{t:"Brew strong tea",c:"Brew the black tea strong and dark — steep 4–5 minutes, then remove the leaves or bag."},{t:"Mix the pair",c:"Combine the coffee and tea (about 3 parts coffee to 7 parts tea), then stir in the evaporated milk and sugar until smooth."},{t:"Hot or iced",c:"Serve hot, or pour over ice for an iced yuenyeung. Stir and sip."}],
  notes:"Both the coffee and tea need to be strong — weak versions taste muddy. Steep the tea darker than you'd drink it alone. Evaporated milk + sugar is the classic combo; condensed milk is a sweeter shortcut. Start at 3:7 and nudge toward whichever you love more.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka gives the bold coffee half that holds its own against strong black tea.",
      ingredients:["60 ml strong coffee (moka pot, or 2 tsp instant in 60 ml hot water)","140 ml strong brewed black tea (Ceylon-style, brewed dark)","2 tbsp evaporated milk (or 1.5 tbsp condensed milk)","2 tsp sugar (skip if using condensed milk)","1 cup ice cubes (for the iced version)"],
      steps:[{t:"Brew the coffee",c:"Brew 60 ml strong coffee and set aside."},{t:"Brew strong tea",c:"Brew the black tea strong and dark — steep 4–5 minutes, then remove the leaves or bag."},{t:"Mix the pair",c:"Combine the coffee and tea (about 3 parts coffee to 7 parts tea), then stir in the evaporated milk and sugar until smooth."},{t:"Hot or iced",c:"Serve hot, or pour over ice for an iced yuenyeung. Stir and sip."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Both sides (coffee and tea) are quick here — use a robusta instant and steep the tea dark and strong.",
      ingredients:["2 heaped tsp instant coffee (robusta preferred)","60 ml hot water","140 ml strong brewed black tea (Ceylon-style, steeped 5 minutes)","2 tbsp evaporated milk","2 tsp sugar (skip if using condensed milk)","1 cup ice cubes (for iced version)"],
      steps:[{t:"Make instant coffee",c:"Dissolve instant in 60 ml hot water."},{t:"Brew strong tea",c:"Steep black tea 5 minutes — it needs to be dark to hold up to the coffee."},{t:"Mix",c:"Combine coffee and tea at roughly 3:7 ratio. Add evaporated milk and sugar."},{t:"Hot or iced",c:"Serve hot or over ice."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"Brew both the coffee and the tea strong — the French press handles coffee beautifully here.",
      ingredients:["18 g ground coffee (dark roast, coarse grind)","80 ml hot water","140 ml very strong black tea","2 tbsp evaporated milk","2 tsp sugar"],
      steps:[{t:"Brew coffee strong",c:"Steep 4 minutes, press, collect 60 ml."},{t:"Brew tea dark",c:"Steep 2 tea bags or 2 tsp loose leaf for 5 minutes."},{t:"Combine",c:"Mix 60 ml coffee with 140 ml tea. Add evaporated milk and sugar. Adjust ratio to taste."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A pour over gives a cleaner coffee half — the clarity makes the two-liquid pairing taste more distinct and interesting.",
      ingredients:["15 g ground coffee (medium-dark, medium grind)","100 ml hot water (93°C)","140 ml very strong black tea","2 tbsp evaporated milk","2 tsp sugar"],
      steps:[{t:"Brew pour over",c:"Bloom 30 seconds, pour slowly, collect 60 ml concentrate."},{t:"Brew tea dark",c:"Steep black tea 5 minutes."},{t:"Combine",c:"Mix at 3:7 ratio, add evaporated milk and sugar."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew Yuenyeung — cold brew coffee + cold-steeped tea + milk = the ultimate iced Hong Kong café drink.",
      ingredients:["20 g ground coffee (dark roast, coarse grind)","160 ml cold water","140 ml cold-steeped strong black tea (overnight in fridge)","2 tbsp evaporated milk","2 tsp sugar syrup","1 cup ice cubes"],
      steps:[{t:"Cold brew the coffee",c:"Steep 12–18 hours in fridge, strain."},{t:"Cold-steep the tea",c:"Steep 2 tea bags in 140 ml cold water overnight in fridge."},{t:"Combine",c:"Mix cold brew and cold tea at 3:7 ratio. Add evaporated milk and sugar syrup."},{t:"Over ice",c:"Pour over a glass packed with ice."}]
    }
  ]
},
{
  id:"seed-turkish", serial:17, name:"Turkish Coffee (Türk Kahvesi)",
  story:"The one recipe that breaks our moka pattern, and one of the oldest ways to make coffee anywhere. Türk Kahvesi is brewed in a little long-handled pot called a cezve, with coffee ground to a powder finer than flour, simmered slowly so a prized foam rises. It's Ottoman, centuries old, recognised by UNESCO as cultural heritage — and people even read fortunes from the grounds left in the cup. This is your graduate piece: a different grind, a different pot, a different pace.",
  bean:"Needs a special powder-fine grind (finer than espresso) — ask a shop to grind it 'Turkish fine'. A medium-dark blend is traditional; here the method, not the bean, is the star.",
  description:"One of the oldest coffee methods — powder-fine coffee simmered slowly in a cezve until a prized foam rises, served unfiltered. Intense and ceremonial.",
  method:"cezve", origin:"Turkey", ratio:"1 tsp / cup", ratioLabel:"powder-fine coffee per cup", strength:5,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["1 heaped tsp extra-fine coffee (powder-fine, finer than espresso)","65 ml cold water","1 tsp sugar (0 = sade, 1 = orta, 2 = şekerli) — decide now","1 cardamom pod, crushed (optional, traditional)"],
  steps:[{t:"Combine cold",c:"In a cezve or small pot, combine the fine coffee, cold water, sugar and crushed cardamom. Stir once to mix."},{t:"Heat gently",c:"Heat very slowly on low. Do not stir again. As a dark foam rises, spoon a little into your cup."},{t:"Catch the foam",c:"When it foams up near the top (just before boiling), take it off the heat. For more foam, briefly return it to the heat once more."},{t:"Pour and settle",c:"Pour gently into the cup, keeping the foam on top. Let it sit a minute so the grounds settle before sipping."}],
  notes:"The grind must be powder-fine — finer than espresso — or it won't work. A moka pot won't make this; you need a cezve or small saucepan. Never boil — heat slowly. The foam (köpük) is prized. Decide sugar BEFORE brewing; you never stir again. Don't drink the muddy bottom.",
  methods:[
    {
      id:"cezve", label:"Cezve", recommended:true,
      note:"Turkish Coffee is the method. The cezve (or any small saucepan) and the powder-fine grind are inseparable from what makes this drink what it is — the unfiltered grounds, the prized foam, the slow heat. A moka pot or French press cannot replicate the texture, the ritual, or the foam. Use a cezve or a very small saucepan. There is no substitute.",
      ingredients:["1 heaped tsp extra-fine coffee (powder-fine, finer than espresso)","65 ml cold water","1 tsp sugar (0 = sade, 1 = orta, 2 = şekerli) — decide now","1 cardamom pod, crushed (optional, traditional)"],
      steps:[{t:"Combine cold",c:"In a cezve or small pot, combine the fine coffee, cold water, sugar and crushed cardamom. Stir once to mix."},{t:"Heat gently",c:"Heat very slowly on low. Do not stir again. As a dark foam rises, spoon a little into your cup."},{t:"Catch the foam",c:"When it foams up near the top (just before boiling), take it off the heat. For more foam, briefly return it to the heat once more."},{t:"Pour and settle",c:"Pour gently into the cup, keeping the foam on top. Let it sit a minute so the grounds settle before sipping."}]
    }
  ]
},
{
  id:"seed-affogato", serial:18, name:"Affogato (Italian Coffee + Ice Cream)",
  story:"Italy's two-ingredient genius. 'Affogato' means 'drowned' — a scoop of cold vanilla ice cream drowned in a shot of hot coffee, poured over right at the table. Hot meets cold, dessert meets digestivo, and it's done in under a minute. It's the after-dinner staple that's somehow both pudding and espresso at once.",
  bean:"A bold, dark espresso roast — it has to cut through sweet, cold ice cream. Chocolatey and intense is ideal; this is no place for a delicate light roast.",
  description:"Italy's two-ingredient dessert coffee — a scoop of cold vanilla ice cream drowned in a shot of hot coffee, poured over at the table.",
  method:"moka pot", origin:"Italy", ratio:"1:1", ratioLabel:"coffee : ice cream", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["1 generous scoop of vanilla ice cream or gelato","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","shaved chocolate or crushed nuts (optional)"],
  steps:[{t:"Scoop the ice cream",c:"Put a generous scoop of vanilla ice cream into a small glass, cup or bowl and have it ready."},{t:"Brew hot coffee",c:"Brew the moka pot fresh and hot: basket level not tamped, pull off when it gurgles."},{t:"Drown it",c:"Pour the hot coffee over the ice cream right at the table. Scatter shaved chocolate or nuts on top if using."},{t:"Eat at once",c:"Eat immediately with a spoon, scooping up the melting coffee-cream as you go."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Brew fresh and pour over at the moment of serving — don't let it sit. Use the best vanilla ice cream you can. Grown-up version: a splash of amaretto, coffee liqueur or dark rum.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"A hot moka shot poured over cold ice cream — the contrast is the whole point.",
      ingredients:["1 generous scoop of vanilla ice cream or gelato","17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","shaved chocolate or crushed nuts (optional)"],
      steps:[{t:"Scoop the ice cream",c:"Put a generous scoop of vanilla ice cream into a small glass, cup or bowl and have it ready."},{t:"Brew hot coffee",c:"Brew the moka pot fresh and hot: basket level not tamped, pull off when it gurgles."},{t:"Drown it",c:"Pour the hot coffee over the ice cream right at the table. Scatter shaved chocolate or nuts on top if using."},{t:"Eat at once",c:"Eat immediately with a spoon, scooping up the melting coffee-cream as you go."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant works perfectly well — the ice cream mellows any flatness and the heat contrast is all that matters.",
      ingredients:["1 generous scoop vanilla ice cream or gelato","2 heaped tsp instant coffee","50 ml hot water (small — keep it strong)","shaved chocolate or crushed nuts (optional)"],
      steps:[{t:"Scoop",c:"Place ice cream into a small glass, cup or bowl."},{t:"Make strong instant",c:"Dissolve in only 50 ml hot water — keep it concentrated and hot."},{t:"Drown",c:"Pour hot instant coffee over the ice cream immediately."},{t:"Eat at once",c:"Eat immediately with a spoon, scooping up the melting coffee-cream."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"Brew a small strong French press shot — 80 ml water over 18 g, press after 4 minutes, use 50 ml hot over the ice cream.",
      ingredients:["1 generous scoop vanilla ice cream or gelato","18 g ground coffee (dark roast, coarse grind)","80 ml hot water","shaved chocolate (optional)"],
      steps:[{t:"Brew small and strong",c:"Steep 4 minutes, press, pour 50 ml immediately while hot."},{t:"Scoop",c:"Place ice cream in a glass."},{t:"Drown immediately",c:"Pour the hot French press shot over the ice cream. Speed matters — the coffee must be hot."},{t:"Eat at once",c:"Eat immediately with a spoon."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A concentrated dark pour over works — collect only 50 ml from 12 g of coffee so the brew stays strong enough.",
      ingredients:["1 generous scoop vanilla ice cream or gelato","12 g ground coffee (medium-dark, medium grind)","70 ml hot water (93°C)"],
      steps:[{t:"Brew concentrated",c:"Bloom 20 seconds, pour slowly, collect 50 ml."},{t:"Scoop",c:"Ice cream in a glass."},{t:"Drown",c:"Pour the hot pour over over the ice cream immediately."},{t:"Eat at once",c:"Eat immediately — the contrast is everything."}]
    },
    {
      id:"cezve", label:"Cezve", recommended:false,
      note:"A cezve shot gives the richest, most syrup-thick affogato — closest to a real espresso machine version.",
      ingredients:["1 generous scoop vanilla ice cream or gelato","1.5 heaped tsp extra-fine ground coffee","65 ml cold water","1 tsp sugar (optional)"],
      steps:[{t:"Brew cezve",c:"Heat slowly, catch the foam, remove just before boiling. Let settle 1 minute."},{t:"Scoop",c:"Ice cream in a small glass."},{t:"Pour carefully",c:"Pour the hot cezve shot (not the grounds) over the ice cream."},{t:"Eat immediately",c:"The cezve gives the richest, most syrup-thick affogato."}]
    }
  ]
},
{
  id:"seed-einspanner", serial:19, name:"Einspänner (Viennese Cream Coffee)",
  story:"From Vienna's grand coffee houses. The Einspänner is strong black coffee under a thick cap of whipped cream — the name means 'one-horse carriage,' because coachmen drank it one-handed, the cream lid keeping it warm and unspillable while they held the reins. You sip the hot coffee up through the cool cream, never stirring. It's the elegant, old-world end to this whole tour.",
  bean:"A smooth dark roast — rich and chocolatey under the cream, not bright or acidic. Body matters more than nuance here.",
  description:"A Viennese coffee-house classic — strong sweetened black coffee under a thick cap of whipped cream, sipped through the cream without stirring.",
  method:"moka pot", origin:"Austria", ratio:"1:1", ratioLabel:"coffee : cream cap", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-14'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","90 ml hot water (to lengthen, optional)","1 tsp sugar (to taste)","4 tbsp cold heavy cream","cocoa powder or chocolate shavings, to dust"],
  steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten and pour",c:"Stir the sugar into the hot coffee. Add the hot water if you'd like a longer drink, then pour into a glass."},{t:"Whip the cream",c:"Whip the cold heavy cream to soft peaks."},{t:"Cap and dust",c:"Spoon a thick cap of cream over the coffee so it floats. Dust with cocoa. Don't stir — sip the hot coffee up through the cool cream."}],
  notes:"Instant: 2 heaped tsp in 60 ml hot water. Use real heavy cream, whipped to soft peaks and only lightly sweetened. The whole idea is contrast: don't stir. Lengthen with hot water for a longer drink, or leave it short and intense. Served in a glass so you can see the layers.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka gives a bold base that holds its own under the cream cap.",
      ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","90 ml hot water (to lengthen, optional)","1 tsp sugar (to taste)","4 tbsp cold heavy cream","cocoa powder or chocolate shavings, to dust"],
      steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten and pour",c:"Stir the sugar into the hot coffee. Add the hot water if you'd like a longer drink, then pour into a glass."},{t:"Whip the cream",c:"Whip the cold heavy cream to soft peaks."},{t:"Cap and dust",c:"Spoon a thick cap of cream over the coffee so it floats. Dust with cocoa. Don't stir — sip the hot coffee up through the cool cream."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Use 2 heaped tsp in only 60 ml water for maximum concentration before adding the lengthening water and cream.",
      ingredients:["2 heaped tsp instant coffee","60 ml hot water","90 ml hot water (to lengthen, optional)","1 tsp sugar","4 tbsp cold heavy cream","cocoa powder or chocolate shavings"],
      steps:[{t:"Make strong instant",c:"Dissolve coffee and sugar in 60 ml hot water."},{t:"Lengthen",c:"Add 90 ml more hot water if you want a longer drink."},{t:"Pour into a glass",c:"Pour the coffee into a glass."},{t:"Whip and cap",c:"Whip cream to soft peaks, spoon over the top. Dust with cocoa. Sip through the cream."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"Brew dark and strong — collect only 60 ml from the press so it is concentrated enough to stand up to the cream.",
      ingredients:["18 g ground coffee (dark roast, coarse grind)","80 ml hot water","90 ml hot water (to lengthen)","1 tsp sugar","4 tbsp cold heavy cream"],
      steps:[{t:"Brew strong",c:"Steep 4 minutes, press, collect 60 ml."},{t:"Sweeten",c:"Stir in sugar."},{t:"Lengthen and pour",c:"Add hot water, pour into a glass."},{t:"Whip and cap",c:"Whip cream to soft peaks, spoon on top. Don't stir — sip through the cream."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A concentrated pour over gives a cleaner, brighter base under the cream — elegant and slightly lighter than the moka version.",
      ingredients:["14 g ground coffee (medium-dark, medium grind)","120 ml hot water (93°C)","90 ml hot water (to lengthen)","1 tsp sugar","4 tbsp cold heavy cream"],
      steps:[{t:"Brew",c:"Bloom 30 seconds, pour over 90 seconds. Collect 60 ml."},{t:"Sweeten and lengthen",c:"Add sugar and extra hot water."},{t:"Whip and cap",c:"Soft-peak cream on top. Dust with cocoa. Sip through."}]
    },
    {
      id:"cezve", label:"Cezve", recommended:false,
      note:"The richest Einspänner possible — the cezve shot under cream is close to an espresso-machine version.",
      ingredients:["1.5 heaped tsp extra-fine ground coffee","65 ml cold water","1 tsp sugar","90 ml hot water (to lengthen)","4 tbsp cold heavy cream"],
      steps:[{t:"Brew cezve",c:"Heat slowly, foam rises, remove before boiling. Settle 1 minute."},{t:"Pour and sweeten",c:"Pour the clarified shot into a glass with sugar and hot water."},{t:"Whip and cap",c:"Soft-peak cream on top. Dust with cocoa. Sip through without stirring."}]
    }
  ]
},
{
  id:"seed-dolcelatte", serial:20, name:"Iced Cinnamon Dolce Latte",
  story:"The one you asked about. 'Dolce' is just Italian for 'sweet,' and this is the café favourite — espresso and cold milk over ice, sweetened with a homemade cinnamon-vanilla syrup and crowned with whipped cream and a cinnamon-sugar dust. Since Starbucks doesn't bottle the syrup, making it at home is the only way to get it exactly right (and far cheaper). It's basically Café de Olla gone cold, milky and creamy.",
  bean:"A smooth medium-dark roast — cinnamon and vanilla sit on top, so you want a mellow, chocolatey base, not a sharp dark one.",
  description:"The Starbucks-style cold classic — espresso and cold milk over ice, sweetened with homemade cinnamon-vanilla 'dolce' syrup, topped with whipped cream and a cinnamon-sugar dust.",
  method:"moka pot", origin:"Modern café", ratio:"2–3 tbsp", ratioLabel:"dolce syrup per glass", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2–3 tbsp cinnamon dolce syrup (recipe in notes)","180 ml cold milk","1 cup ice cubes","whipped cream + cinnamon-sugar, to top (optional)"],
  steps:[{t:"Make the syrup",c:"Make the cinnamon dolce syrup (see notes) and let it cool. You only need a few tablespoons per drink."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles. Let it cool slightly."},{t:"Build the glass",c:"Fill a tall glass with ice, add the cold milk and stir in the dolce syrup."},{t:"Pour and top",c:"Pour the coffee over the top. Crown with whipped cream and a dusting of cinnamon-sugar. Stir and sip."}],
  notes:"Cinnamon dolce syrup (makes plenty, keeps 2 weeks in the fridge): simmer 1/2 cup water, 1/4 cup brown sugar, 1/4 cup white sugar and 1 tsp cinnamon for ~10 min until slightly thick, then stir in 1/2 tsp vanilla. Instant coffee works (2 heaped tsp in 60 ml hot water). The cinnamon-sugar dust on top is just 1:1 cinnamon and sugar. Start with 2 tbsp syrup and adjust.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka shot gives a rich, concentrated base that cuts through the sweet cinnamon-vanilla syrup over ice.",
      ingredients:["17 g ground coffee (moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2–3 tbsp cinnamon dolce syrup (recipe in notes)","180 ml cold milk","1 cup ice cubes","whipped cream + cinnamon-sugar, to top (optional)"],
      steps:[{t:"Make the syrup",c:"Make the cinnamon dolce syrup (see notes) and let it cool. You only need a few tablespoons per drink."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles. Let it cool slightly."},{t:"Build the glass",c:"Fill a tall glass with ice, add the cold milk and stir in the dolce syrup."},{t:"Pour and top",c:"Pour the coffee over the top. Crown with whipped cream and a dusting of cinnamon-sugar. Stir and sip."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant works perfectly here — the dolce syrup is the star, so the coffee just needs to be strong and hot.",
      ingredients:["2 heaped tsp instant coffee","60 ml hot water","2–3 tbsp cinnamon dolce syrup (recipe in notes)","180 ml cold milk","1 cup ice cubes","whipped cream + cinnamon-sugar, to top (optional)"],
      steps:[{t:"Dissolve instant",c:"Stir instant coffee into 60 ml hot water until fully dissolved. Let cool slightly."},{t:"Build the glass",c:"Fill a tall glass with ice and add the cold milk."},{t:"Stir in syrup",c:"Stir the cinnamon dolce syrup into the milk until combined."},{t:"Pour and top",c:"Pour the coffee over the top. Crown with whipped cream and a cinnamon-sugar dust."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A medium-dark French press gives a fuller-bodied base that holds up well against the rich cinnamon-vanilla syrup.",
      ingredients:["18 g ground coffee (medium-dark, coarse grind)","120 ml hot water","2–3 tbsp cinnamon dolce syrup","180 ml cold milk","1 cup ice cubes","whipped cream + cinnamon-sugar (optional)"],
      steps:[{t:"Brew strong",c:"Steep coffee in French press 4 minutes. Press slowly and let cool to warm."},{t:"Build the glass",c:"Fill a tall glass with ice and cold milk."},{t:"Stir in syrup",c:"Stir cinnamon dolce syrup into the milk."},{t:"Pour and top",c:"Pour the French press coffee over. Top with whipped cream and cinnamon-sugar dust."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew dolce latte is enormously popular — the naturally sweet, low-acid cold brew pairs beautifully with the cinnamon-vanilla syrup.",
      ingredients:["20 g ground coffee (medium-dark, coarse grind)","160 ml cold water","2–3 tbsp cinnamon dolce syrup","180 ml cold milk","1 cup ice cubes","whipped cream + cinnamon-sugar (optional)"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Refrigerate 12–18 hours. Strain."},{t:"Build the glass",c:"Fill a tall glass with ice and cold milk."},{t:"Stir in syrup",c:"Stir cinnamon dolce syrup into the milk."},{t:"Pour and top",c:"Pour cold brew concentrate over the top. Crown with whipped cream and cinnamon-sugar dust."}]
    }
  ]
},
{
  id:"seed-saltcoffee", serial:21, name:"Vietnamese Salt Coffee (Cà Phê Muối)",
  story:"From the old imperial city of Huế, and one of the most talked-about coffees in the world right now. It takes the sweet condensed-milk base you already know and crowns it with a lightly salted whipped-cream foam. Sounds odd, tastes genius: the salt cuts the sweetness, rounds out the coffee's bitterness and makes the whole thing taste richer — the same trick that makes salted caramel work. You sip the cold sweet coffee up through the salty cream.",
  bean:"Dark Vietnamese-style robusta — bold and low-acid so it stands up to condensed milk and the salted cream cap.",
  description:"Huế's viral salt coffee — sweet condensed-milk coffee over ice, crowned with a lightly salted whipped-cream foam. The salt rounds the sweetness like salted caramel.",
  method:"moka pot", origin:"Vietnam", ratio:"1:2", ratioLabel:"condensed milk : coffee", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["2 tbsp condensed milk","17 g ground coffee (dark roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","3 tbsp heavy/whipping cream","2 tbsp milk","1 good pinch of salt","1 cup ice cubes"],
  steps:[{t:"Sweeten the glass",c:"Spoon the condensed milk into the bottom of a glass."},{t:"Brew and stir",c:"Brew the moka pot (pull off when it gurgles) and stir the coffee into the condensed milk until smooth."},{t:"Add ice",c:"Add ice to fill the glass, leaving room at the top."},{t:"Whip the salted cream",c:"Whip the cream, milk and a good pinch of salt to a soft, loose foam."},{t:"Cap and sip",c:"Spoon the salted cream over the top so it floats. Don't stir — sip the sweet coffee up through the salty cream."}],
  notes:"Instant version: 2 heaped tsp in 60 ml hot water. The salt is the whole point — a proper pinch, not a few grains; it should make the drink taste richer, not salty. Whip the cream to a soft, pourable foam, not stiff. Use a dark Vietnamese-style robusta for the boldest base.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"A bold dark moka shot gives the base strength needed to carry the sweet condensed milk and salted cream cap.",
      ingredients:["2 tbsp condensed milk","17 g ground coffee (dark roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","3 tbsp heavy/whipping cream","2 tbsp milk","1 good pinch of salt","1 cup ice cubes"],
      steps:[{t:"Sweeten the glass",c:"Spoon the condensed milk into the bottom of a glass."},{t:"Brew and stir",c:"Brew the moka pot (pull off when it gurgles) and stir the coffee into the condensed milk until smooth."},{t:"Add ice",c:"Add ice to fill the glass, leaving room at the top."},{t:"Whip the salted cream",c:"Whip the cream, milk and a good pinch of salt to a soft, loose foam."},{t:"Cap and sip",c:"Spoon the salted cream over the top so it floats. Don't stir — sip the sweet coffee up through the salty cream."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Use a robusta-based instant for the boldest base under the salted cream — the foam is so rich it forgives any flatness in the coffee.",
      ingredients:["2 tbsp condensed milk","2 heaped tsp instant coffee (robusta preferred)","60 ml hot water","3 tbsp heavy/whipping cream","2 tbsp milk","1 good pinch of salt","1 cup ice cubes"],
      steps:[{t:"Sweeten the glass",c:"Spoon the condensed milk into the bottom of a glass."},{t:"Make instant coffee",c:"Dissolve instant in 60 ml hot water and stir into the condensed milk until smooth."},{t:"Add ice",c:"Add ice to fill the glass, leaving room at the top."},{t:"Whip the salted cream",c:"Whip the cream, milk and a good pinch of salt to a soft, loose foam."},{t:"Cap and sip",c:"Spoon the salted cream over the top. Don't stir — sip the sweet coffee up through the salty cream."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A dark French press gives excellent body under the salted cream — brew strong and use it immediately while hot.",
      ingredients:["2 tbsp condensed milk","18 g ground coffee (dark roast, coarse grind)","120 ml hot water","3 tbsp heavy/whipping cream","2 tbsp milk","1 good pinch of salt","1 cup ice cubes"],
      steps:[{t:"Sweeten the glass",c:"Spoon the condensed milk into the bottom of a glass."},{t:"Brew strong",c:"Steep coffee in French press 4 minutes. Press slowly and collect 60 ml."},{t:"Stir and ice",c:"Pour hot coffee onto condensed milk, stir until smooth, then fill with ice."},{t:"Whip the salted cream",c:"Whip the cream, milk and a good pinch of salt to a soft, loose foam."},{t:"Cap and sip",c:"Spoon the salted cream over the top. Sip the sweet coffee up through the salty cream."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew salt coffee — the naturally smooth cold brew base lets the salted cream cap shine without any coffee bitterness fighting through.",
      ingredients:["2 tbsp condensed milk","20 g ground coffee (dark roast, coarse grind)","160 ml cold water","3 tbsp heavy/whipping cream","2 tbsp milk","1 good pinch of salt","1 cup ice cubes"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Refrigerate 12–18 hours. Strain."},{t:"Sweeten",c:"Stir condensed milk into 80 ml cold brew until smooth."},{t:"Over ice",c:"Pour the sweetened cold brew over a glass packed with ice."},{t:"Whip and cap",c:"Whip cream, milk and salt to a soft foam. Spoon over the top and sip through."}]
    }
  ]
},
{
  id:"seed-mocha", serial:22, name:"Café Mocha",
  story:"The chocolate one — and its name is a geography lesson. 'Mocha' comes from the port of al-Makha in Yemen, which for centuries was the world's great coffee-trading hub; its beans were prized for a natural chocolatey note. Over time 'mocha' came to mean coffee married with actual chocolate. It's the cosiest, most dessert-like cup in the book: espresso and melted chocolate under warm milk, the kind of thing that tastes like a hug.",
  bean:"A dark, chocolatey roast doubles down on the chocolate. Bold and smooth; skip bright acidic light roasts here.",
  description:"The chocolate-coffee classic — espresso and melted chocolate under warm milk, topped with whipped cream. Cosy and dessert-like.",
  method:"moka pot", origin:"Yemen / worldwide", ratio:"1:1", ratioLabel:"coffee : chocolate", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (dark, chocolatey roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1.5 tbsp cocoa powder (or 2 squares dark chocolate, or chocolate syrup)","2 tsp sugar (to taste)","180 ml milk","whipped cream + cocoa dust, to top (optional)"],
  steps:[{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Make the chocolate base",c:"In the cup, stir the cocoa and sugar into a splash of the hot coffee until completely smooth and glossy."},{t:"Combine",c:"Pour in the rest of the coffee and stir to combine."},{t:"Add milk and top",c:"Heat and froth the milk, pour it in (or pour over ice for iced), and finish with whipped cream and a cocoa dust."}],
  notes:"Instant version: 2 heaped tsp in 60 ml hot water. Melt the cocoa/chocolate into a little hot coffee first so it's smooth with no lumps. Serve hot with steamed milk, or pour over ice with cold milk for an iced mocha. Cocoa powder needs more sugar than sweet chocolate syrup.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka gives a bold chocolatey base that doubles the cocoa note from the spoon.",
      ingredients:["17 g ground coffee (dark, chocolatey roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1.5 tbsp cocoa powder (or 2 squares dark chocolate, or chocolate syrup)","2 tsp sugar (to taste)","180 ml milk","whipped cream + cocoa dust, to top (optional)"],
      steps:[{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Make the chocolate base",c:"In the cup, stir the cocoa and sugar into a splash of the hot coffee until completely smooth and glossy."},{t:"Combine",c:"Pour in the rest of the coffee and stir to combine."},{t:"Add milk and top",c:"Heat and froth the milk, pour it in (or pour over ice for iced), and finish with whipped cream and a cocoa dust."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant mocha is excellent — melt the cocoa into a little hot water first so it dissolves completely before adding the instant coffee.",
      ingredients:["2 heaped tsp instant coffee","60 ml hot water","1.5 tbsp cocoa powder (or chocolate syrup)","2 tsp sugar (to taste)","180 ml milk","whipped cream + cocoa dust, to top (optional)"],
      steps:[{t:"Make the chocolate base",c:"Stir cocoa and sugar into a few tablespoons of the hot water until completely smooth and glossy."},{t:"Add instant coffee",c:"Stir instant coffee into the remaining hot water until dissolved, then combine with the chocolate base."},{t:"Add milk and top",c:"Heat and froth the milk, pour it in (or pour over ice for iced), and finish with whipped cream and cocoa dust."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A dark French press doubles the chocolate character — brew small and strong, then melt cocoa directly in the hot coffee.",
      ingredients:["18 g ground coffee (dark, coarse grind)","120 ml hot water","1.5 tbsp cocoa powder","2 tsp sugar","180 ml milk","whipped cream + cocoa dust (optional)"],
      steps:[{t:"Brew strong",c:"Steep coffee in French press 4 minutes. Press slowly, collect 60 ml concentrate."},{t:"Make the chocolate base",c:"Stir cocoa and sugar into the hot coffee until completely smooth."},{t:"Add milk and top",c:"Heat and froth the milk, pour in, finish with whipped cream and cocoa dust."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A clean pour over mocha — the bright, lighter-bodied base makes the chocolate flavour taste cleaner and less heavy.",
      ingredients:["15 g ground coffee (medium-dark, medium grind)","120 ml hot water (93°C)","1.5 tbsp cocoa powder","2 tsp sugar","180 ml milk","whipped cream + cocoa dust (optional)"],
      steps:[{t:"Brew pour over",c:"Bloom 30 seconds, pour slowly over 2 minutes into a cup with the cocoa and sugar pre-stirred in 2 tbsp hot water."},{t:"Stir to combine",c:"The hot pour over dissolves and melds with the chocolate base in the cup."},{t:"Add milk and top",c:"Pour in heated milk, top with whipped cream and cocoa dust."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew iced mocha — dissolve the cocoa into a small amount of hot water first so it blends into the cold brew without lumps.",
      ingredients:["20 g ground coffee (dark, coarse grind)","160 ml cold water","1.5 tbsp cocoa powder or chocolate syrup","2 tsp sugar","180 ml cold milk","1 cup ice cubes","whipped cream + cocoa dust (optional)"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water, refrigerate 12–18 hours, strain."},{t:"Make the chocolate paste",c:"Dissolve cocoa and sugar in 2 tbsp hot water to make a smooth paste. Let it cool."},{t:"Combine",c:"Stir the cooled chocolate paste into the cold brew concentrate."},{t:"Build and top",c:"Pour over iced cold milk, top with whipped cream and cocoa dust."}]
    }
  ]
},
{
  id:"seed-ipoh", serial:23, name:"Ipoh White Coffee (Malaysia)",
  story:"Don't let 'white' fool you — it's not about milk. In the town of Ipoh, the beans are roasted in palm-oil margarine instead of the sugar used for dark 'black' coffee, giving a smoother, caramelly, less bitter cup that's then served thick with condensed and evaporated milk. It's one of Malaysia's proudest exports, sold in kopitiams everywhere.",
  bean:"A smooth medium roast (not a sharp dark one) mimics the gentle, caramelly character of margarine-roasted Ipoh beans.",
  description:"Malaysia's Ipoh classic — a smooth, caramelly coffee (beans traditionally roasted in margarine) served rich with condensed and evaporated milk.",
  method:"moka pot", origin:"Malaysia", ratio:"1:2", ratioLabel:"coffee : milk blend", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (medium roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tbsp condensed milk","2 tbsp evaporated milk","1 cup ice cubes (optional, for iced)"],
  steps:[{t:"Layer the milks",c:"Spoon the condensed and evaporated milk into the bottom of a cup or glass."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Stir together",c:"Pour the hot coffee over the milks and stir well until smooth and pale caramel."},{t:"Hot or iced",c:"Drink it hot — or fill with ice and stir cold for an iced Ipoh white coffee."}],
  notes:"Instant version: 2 heaped tsp in 60 ml hot water. Real Ipoh white coffee uses beans roasted in palm-oil margarine — a smooth medium roast gets you the gentle, caramelly character. The two-milk combo (condensed for sweetness, evaporated for body) is the signature.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"A smooth medium-roast moka shot gives the gentle, caramelly character closest to the margarine-roasted Ipoh style.",
      ingredients:["17 g ground coffee (medium roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","2 tbsp condensed milk","2 tbsp evaporated milk","1 cup ice cubes (optional, for iced)"],
      steps:[{t:"Layer the milks",c:"Spoon the condensed and evaporated milk into the bottom of a cup or glass."},{t:"Brew the coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Stir together",c:"Pour the hot coffee over the milks and stir well until smooth and pale caramel."},{t:"Hot or iced",c:"Drink it hot — or fill with ice and stir cold for an iced Ipoh white coffee."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant Ipoh white coffee is widely available as a product in Malaysia — making your own is as simple as dissolving and adding the two milks.",
      ingredients:["2 heaped tsp instant coffee","60 ml hot water","2 tbsp condensed milk","2 tbsp evaporated milk","1 cup ice cubes (optional, for iced)"],
      steps:[{t:"Layer the milks",c:"Spoon the condensed and evaporated milk into the bottom of a cup or glass."},{t:"Make instant coffee",c:"Stir instant coffee into 60 ml hot water until fully dissolved."},{t:"Stir together",c:"Pour the hot coffee over the milks and stir well until smooth and pale caramel."},{t:"Hot or iced",c:"Drink it hot — or fill with ice and stir cold for an iced Ipoh white coffee."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A medium-roast French press gives a clean, caramelly body that works very well — steep slightly shorter than usual to keep it smooth.",
      ingredients:["18 g ground coffee (medium roast, coarse grind)","120 ml hot water","2 tbsp condensed milk","2 tbsp evaporated milk","1 cup ice cubes (optional)"],
      steps:[{t:"Layer the milks",c:"Spoon the condensed and evaporated milk into the bottom of a cup or glass."},{t:"Brew medium",c:"Steep coffee in French press 3.5 minutes. Press slowly, collect 60 ml."},{t:"Stir together",c:"Pour the hot coffee over the milks and stir well until smooth."},{t:"Hot or iced",c:"Drink hot or fill with ice for iced."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew Ipoh is smooth, sweet and very easy to drink — the naturally mellow cold brew suits the gentle Ipoh character perfectly.",
      ingredients:["18 g ground coffee (medium roast, coarse grind)","160 ml cold water","2 tbsp condensed milk","2 tbsp evaporated milk","1 cup ice cubes"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Refrigerate 12–18 hours. Strain."},{t:"Stir milks in",c:"Stir condensed and evaporated milk into 80 ml cold brew until smooth."},{t:"Over ice",c:"Pour the sweetened cold brew over a glass packed with ice."}]
    }
  ]
},
{
  id:"seed-cafezinho", serial:24, name:"Cafezinho (Brazil)",
  story:"In the world's biggest coffee country, this is the tiny, strong, already-sweet cup offered to absolutely everyone — guests, shopkeepers, you name it. The trick: sugar goes into the water before the coffee, so it dissolves completely into something almost syrupy. Quick, strong and endlessly sociable.",
  bean:"A medium-dark Brazilian, naturally — nutty, chocolatey and low-acid, made to be taken sweet and small.",
  description:"Brazil's 'little coffee' — a tiny, strong, pre-sweetened cup where sugar dissolves into the water before the coffee. Offered to everyone, all day.",
  method:"moka pot", origin:"Brazil", ratio:"strong & sweet", ratioLabel:"small black cup", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (medium-dark, moka basket level, not tamped)","70 ml water","1.5 tsp sugar"],
  steps:[{t:"Sugar first",c:"Put the sugar into the cup you'll serve in."},{t:"Brew strong",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Dissolve the sugar",c:"Pour the hot coffee straight onto the sugar and stir hard until fully dissolved — it should look glossy."},{t:"Serve little",c:"Serve at once in a small cup, strong and sweet. No milk."}],
  notes:"Instant version: 2 tsp in 70 ml hot water, stirred with the sugar. Traditionally made by dissolving sugar in the water as it heats, then passing it through a cloth filter. It's meant to be small and intense, served in a tiny cup, no milk. Sweetness is built in.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka gives a strong, concentrated shot poured directly onto pre-weighed sugar — the Brazilian-style pre-sweetened espresso at home.",
      ingredients:["17 g ground coffee (medium-dark, moka basket level, not tamped)","70 ml water","1.5 tsp sugar"],
      steps:[{t:"Sugar first",c:"Put the sugar into the cup you'll serve in."},{t:"Brew strong",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Dissolve the sugar",c:"Pour the hot coffee straight onto the sugar and stir hard until fully dissolved — it should look glossy."},{t:"Serve little",c:"Serve at once in a small cup, strong and sweet. No milk."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Cafezinho with instant is one of Brazil's everyday shortcuts — dissolve the sugar and instant together in hot water and pour into a small cup.",
      ingredients:["2 tsp instant coffee","70 ml hot water","1.5 tsp sugar"],
      steps:[{t:"Sugar first",c:"Put the sugar into the cup you'll serve in."},{t:"Dissolve together",c:"Stir instant coffee into 70 ml hot water until dissolved."},{t:"Pour onto the sugar",c:"Pour the hot coffee straight onto the sugar and stir hard until fully dissolved — it should look glossy."},{t:"Serve little",c:"Serve at once in a small cup, strong and sweet. No milk."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"The French press makes an excellent Cafezinho — coarse grind, short steep, brew small and strong directly onto the sugar.",
      ingredients:["18 g ground coffee (medium-dark, coarse grind)","100 ml hot water","1.5 tsp sugar"],
      steps:[{t:"Sugar first",c:"Put the sugar into the small cup you'll serve in."},{t:"Brew strong",c:"Add coffee to French press, pour 100 ml hot water, steep 3.5 minutes, press slowly."},{t:"Pour onto sugar",c:"Pour 60–70 ml of the French press coffee directly onto the sugar and stir hard until dissolved and glossy."},{t:"Serve little",c:"Serve at once in a small cup, strong and sweet."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A pour over Cafezinho gives a cleaner, brighter take on Brazil's little sweet cup — collect just 60–70 ml and pour it directly onto the sugar.",
      ingredients:["15 g ground coffee (medium-dark, medium grind)","100 ml hot water (93°C)","1.5 tsp sugar"],
      steps:[{t:"Sugar first",c:"Put the sugar into the small cup you'll serve in."},{t:"Bloom",c:"Add filter and coffee to dripper, pour 30 ml water, wait 20 seconds."},{t:"Pour slowly",c:"Pour remaining water in slow circles to collect 60–70 ml."},{t:"Pour onto sugar",c:"Pour the hot brew directly onto the sugar and stir hard until dissolved and glossy. Serve small and sweet."}]
    }
  ]
},
{
  id:"seed-carajillo", serial:25, name:"Carajillo (Spain)",
  story:"Strong coffee spiked with a shot of spirit — traditionally brandy, rum, or Licor 43. It was supposedly born when Spanish troops in Cuba mixed coffee with rum for 'courage' (coraje) — hence the name. It's the after-dinner pick-me-up that does both jobs at once. (Adults only — this one contains alcohol.)",
  bean:"A bold dark roast stands up to the spirit. Chocolatey and strong; the alcohol and sugar need something assertive underneath.",
  description:"Spain's spiked after-dinner coffee — strong hot coffee with a shot of brandy, rum or Licor 43. Adults only.",
  method:"moka pot", origin:"Spain", ratio:"1:1", ratioLabel:"coffee : spirit", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (dark roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","30 ml brandy, dark rum or Licor 43","1 tsp sugar (to taste, optional)","1 lemon peel + a coffee bean (optional garnish)"],
  steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten (optional)",c:"Stir sugar into the hot coffee if you'd like it sweet."},{t:"Add the spirit",c:"Pour the spirit into a small heatproof glass, then add the hot coffee."},{t:"Garnish and serve",c:"Garnish with a lemon peel and a coffee bean and serve warm — or pour over ice for an iced carajillo."}],
  notes:"Adults only — contains alcohol. Instant works for the coffee base (2 heaped tsp in 60 ml hot water). Licor 43 makes it sweet and vanilla-ish; brandy is classic; rum nods to its Cuban-soldier origins. Serve hot in a small glass, or over ice for summer.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"A bold dark moka shot is strong enough to stand up to the spirit in such a small cup.",
      ingredients:["17 g ground coffee (dark roast, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","30 ml brandy, dark rum or Licor 43","1 tsp sugar (to taste, optional)","1 lemon peel + a coffee bean (optional garnish)"],
      steps:[{t:"Brew strong coffee",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten (optional)",c:"Stir sugar into the hot coffee if you'd like it sweet."},{t:"Add the spirit",c:"Pour the spirit into a small heatproof glass, then add the hot coffee."},{t:"Garnish and serve",c:"Garnish with a lemon peel and a coffee bean and serve warm — or pour over ice for an iced carajillo."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant works well for the coffee base — dissolve in minimal water to keep it concentrated and hot, then add the spirit.",
      ingredients:["2 heaped tsp instant coffee","60 ml hot water","30 ml brandy, dark rum or Licor 43","1 tsp sugar (optional)","1 lemon peel + a coffee bean (optional garnish)"],
      steps:[{t:"Dissolve instant",c:"Stir instant coffee into 60 ml hot water until fully dissolved."},{t:"Sweeten (optional)",c:"Stir in sugar if desired."},{t:"Add the spirit",c:"Pour the spirit into a small heatproof glass, then add the hot coffee."},{t:"Garnish and serve",c:"Garnish with lemon peel and a coffee bean. Serve warm, or over ice for an iced carajillo."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"Brew very small and strong — collect only 60 ml so the coffee is concentrated enough to hold its own against the spirit.",
      ingredients:["18 g ground coffee (dark roast, coarse grind)","80 ml hot water","30 ml brandy, dark rum or Licor 43","1 tsp sugar (optional)","1 lemon peel + a coffee bean (optional garnish)"],
      steps:[{t:"Brew small and strong",c:"Steep 4 minutes in French press with 80 ml water. Press, collect 60 ml."},{t:"Sweeten (optional)",c:"Stir in sugar if desired."},{t:"Add the spirit",c:"Pour spirit into a small heatproof glass, then add the hot coffee."},{t:"Garnish and serve",c:"Garnish with lemon peel and a coffee bean."}]
    },
    {
      id:"cezve", label:"Cezve", recommended:false,
      note:"The cezve gives the most intense, syrup-thick base — closest to a true espresso shot under the spirit.",
      ingredients:["1.5 heaped tsp extra-fine ground coffee (Turkish grind)","65 ml cold water","1 tsp sugar (optional)","30 ml brandy, dark rum or Licor 43","1 lemon peel + a coffee bean (optional garnish)"],
      steps:[{t:"Combine cold",c:"Put coffee, water and sugar in cezve. Stir once."},{t:"Heat slowly",c:"Warm on low until foam rises, remove just before boiling. Settle 1 minute."},{t:"Pour carefully",c:"Pour the clarified shot (not the grounds) into a small glass with the spirit."},{t:"Garnish and serve",c:"Garnish with lemon peel and coffee bean. Serve warm."}]
    }
  ]
},
{
  id:"seed-buna", serial:26, name:"Ethiopian Buna",
  story:"Ethiopia is where coffee was discovered — legend says a goatherd named Kaldi noticed his goats dancing after eating the cherries. 'Buna' is both the word for coffee and the name of the famous ceremony: beans roasted fresh in a pan, ground, brewed in a clay jebena, and poured from a height into tiny cups over three slow rounds, with incense burning. Strong, black, and deeply social.",
  bean:"The rare black drink where a brighter Ethiopian bean belongs — it's the homeland. Keep it a medium roast, not super-light, so the moka pot doesn't turn it sour.",
  description:"From coffee's birthplace — strong black coffee served in small cups, the heart of the Ethiopian coffee ceremony. Sometimes taken with a pinch of salt rather than sugar.",
  method:"moka pot", origin:"Ethiopia", ratio:"strong & black", ratioLabel:"no milk", strength:5,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["18 g ground coffee (a medium Ethiopian shines here, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1 pinch of salt (traditional) or sugar to taste (optional)"],
  steps:[{t:"Brew strong",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles. Aim for a strong, clean cup."},{t:"Pour from a height",c:"Pour into a small cup from a slight height — the traditional pour aerates it and shows off the colour."},{t:"Salt, sugar, or neither",c:"Add a pinch of salt or sugar if you like — or leave it black, the traditional way."},{t:"Take your time",c:"Sip slowly. If you're feeling it, brew a lighter second and third round from the same grounds."}],
  notes:"Buna is about good, fresh coffee taken black. In parts of Ethiopia it's taken with a small pinch of salt instead of sugar — try it once. Traditionally served in three rounds (abol, tona, baraka), each weaker than the last.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka pot gives a strong, concentrated black Ethiopian coffee — the home-equipment version that most closely replicates the jebena brew.",
      ingredients:["18 g ground coffee (a medium Ethiopian shines here, moka basket level, not tamped)","60 ml water (to the moka pot safety valve)","1 pinch of salt (traditional) or sugar to taste (optional)"],
      steps:[{t:"Brew strong",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles. Aim for a strong, clean cup."},{t:"Pour from a height",c:"Pour into a small cup from a slight height — the traditional pour aerates it and shows off the colour."},{t:"Salt, sugar, or neither",c:"Add a pinch of salt or sugar if you like — or leave it black, the traditional way."},{t:"Take your time",c:"Sip slowly. If you're feeling it, brew a lighter second and third round from the same grounds."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"Pour over is the specialty-café way to brew Ethiopian Buna — the paper filter gives the cleanest, most aromatic expression of the bean's natural floral and fruity notes.",
      ingredients:["16 g ground coffee (medium Ethiopian roast, medium grind)","240 ml hot water (93°C)","1 pinch of salt or sugar to taste (optional)"],
      steps:[{t:"Bloom",c:"Place filter in dripper, add coffee, pour 40 ml water and wait 35 seconds."},{t:"Pour in slow circles",c:"Pour remaining water slowly in circles over 3 minutes. Let drip fully."},{t:"Pour from a height",c:"Pour the brew into small cups from a slight height — the traditional pour aerates and shows off the colour."},{t:"Salt, sugar, or neither",c:"Add a pinch of salt or sugar if you like — or leave it black, the traditional way."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A French press gives a fuller-bodied Ethiopian Buna — the lack of filtering keeps the natural oils that give Ethiopian coffee its signature round texture.",
      ingredients:["18 g ground coffee (medium Ethiopian roast, coarse grind)","200 ml hot water","1 pinch of salt or sugar to taste (optional)"],
      steps:[{t:"Brew",c:"Add coffee to French press, pour 200 ml hot water, steep 4 minutes, press slowly."},{t:"Pour from a height",c:"Pour into small cups from a slight height."},{t:"Salt, sugar, or neither",c:"Add a pinch of salt or sugar — or drink it black."},{t:"Take your time",c:"Sip slowly in the spirit of the Buna ceremony."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew Buna brings out the natural fruity sweetness of Ethiopian coffee — serve it black over ice for a clean, intensely aromatic cold cup.",
      ingredients:["20 g ground coffee (medium Ethiopian roast, coarse grind)","160 ml cold water","1 pinch of salt or sugar to taste (optional)"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Refrigerate 12–18 hours."},{t:"Strain",c:"Strain through a fine sieve or coffee filter into a clean jar."},{t:"Serve",c:"Pour into small cups over ice, or at room temperature."},{t:"Salt or sugar if desired",c:"A pinch of either is traditional; black is also correct."}]
    }
  ]
},
{
  id:"seed-touba", serial:27, name:"Café Touba (Senegal)",
  story:"Café Touba is Senegal's national coffee, named after the holy city of Touba and tied to the Mouride brotherhood, whose founder is said to have introduced the spiced brew. The secret is grains of selim — a peppery West African spice called djar — sometimes with cloves, ground right in with the coffee and sweetened generously. Warming, fragrant, faintly medicinal, and sold from carts all over Dakar.",
  bean:"A bold dark robusta blend carries the peppery selim spice and the heavy sweetness.",
  description:"Senegal's spiced national coffee — strong sweet coffee brewed with peppery grains of selim (djar) and cloves. Warming and fragrant.",
  method:"moka pot", origin:"Senegal", ratio:"½ tsp", ratioLabel:"spice per cup", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (dark roast, moka basket level, not tamped)","1/2 tsp ground selim pepper (djar) — or sub: pinch black pepper + 1 clove + grains of paradise","60 ml water (to the moka pot safety valve)","2 tsp sugar (generous, to taste)"],
  steps:[{t:"Spice the grounds",c:"Mix the ground selim (or substitute) into the coffee right in the moka basket so it brews through."},{t:"Brew",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten well",c:"Stir in the sugar generously — it should be properly sweet to balance the pepper."},{t:"Serve",c:"Serve hot and black in a small cup. Strong, sweet and peppery."}],
  notes:"Instant version: 2 heaped tsp in 60 ml hot water, stirred with the spice. Authentic spice is selim pepper (Xylopia aethiopica, 'djar' in Wolof), often with cloves — hard to find in India; a pinch of black pepper, a clove and grains of paradise gets the peppery-floral warmth. Meant to be sweet, no milk.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"Mixing the selim spice directly into the basket lets the steam carry the peppery fragrance through the coffee perfectly.",
      ingredients:["17 g ground coffee (dark roast, moka basket level, not tamped)","1/2 tsp ground selim pepper (djar) — or sub: pinch black pepper + 1 clove + grains of paradise","60 ml water (to the moka pot safety valve)","2 tsp sugar (generous, to taste)"],
      steps:[{t:"Spice the grounds",c:"Mix the ground selim (or substitute) into the coffee right in the moka basket so it brews through."},{t:"Brew",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles."},{t:"Sweeten well",c:"Stir in the sugar generously — it should be properly sweet to balance the pepper."},{t:"Serve",c:"Serve hot and black in a small cup. Strong, sweet and peppery."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Steep the selim spice in hot water before adding instant coffee — you get the peppery warmth without needing to grind spice into the grounds.",
      ingredients:["2 heaped tsp instant coffee","1/2 tsp ground selim pepper (djar) — or sub: pinch black pepper + 1 clove, ground","60 ml hot water","2 tsp sugar (generous)"],
      steps:[{t:"Steep the spice",c:"Pour hot water over the ground selim and steep 2 minutes."},{t:"Add instant",c:"Stir instant coffee and sugar into the spiced water until dissolved."},{t:"Strain if needed",c:"Pour through a fine sieve if any grit remains."},{t:"Serve hot and strong",c:"Pour into a small cup, strong, sweet and peppery."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"The French press is excellent for Café Touba — the selim spice steeps directly with the coffee grounds for maximum fragrance.",
      ingredients:["18 g ground coffee (dark roast, coarse grind)","1/2 tsp ground selim pepper (djar) or substitute","200 ml hot water","2 tsp sugar (generous)"],
      steps:[{t:"Combine",c:"Add coffee and selim spice to the French press."},{t:"Pour and steep",c:"Pour 200 ml hot water, stir once gently, steep 4 minutes."},{t:"Press",c:"Press slowly and pour into a cup."},{t:"Sweeten well",c:"Stir in sugar generously — it should be properly sweet to balance the pepper. Serve hot and black."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"Mix the selim spice into the ground coffee before brewing — the pour over extracts the spice evenly without over-steeping it.",
      ingredients:["17 g ground coffee (dark roast, medium-fine grind)","1/2 tsp ground selim pepper (djar) or substitute mixed into the grounds","120 ml hot water (93°C)","2 tsp sugar (generous)"],
      steps:[{t:"Mix spice in",c:"Stir the selim spice into your ground coffee before adding to the filter."},{t:"Bloom",c:"Pour 30 ml water, wait 45 seconds."},{t:"Pour slowly",c:"Pour remaining water in slow circles over 2 minutes."},{t:"Sweeten immediately",c:"Stir in sugar while still hot and serve."}]
    }
  ]
},
{
  id:"seed-qishr", serial:28, name:"Yemeni Qishr (Cascara + Ginger)",
  story:"Long before Yemenis brewed the beans, they steeped the coffee cherry's dried husks — qishr — into a light, golden, tea-like drink with ginger and cinnamon. It's gently caffeinated, fruity-tart, and warming, and in much of Yemen it's still preferred to coffee itself. The husk is sold as 'cascara', so this is one you can genuinely brew.",
  bean:"Not made from beans at all — qishr is the dried coffee husk (cascara). No roast to choose; seek out cascara from a specialty roaster.",
  description:"Yemen's husk brew — dried coffee cherry husks (cascara) steeped with ginger and cinnamon into a light, golden, tea-like drink. Fruity, gingery, low in caffeine.",
  method:"other", origin:"Yemen", ratio:"1:4", ratioLabel:"husks : water", strength:2,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["4 tbsp cascara (dried coffee cherry husks / qishr)","1 tsp ground ginger (or a few fresh slices)","1 small piece of cinnamon stick","500 ml water","2 tsp sugar or honey (to taste)"],
  steps:[{t:"Simmer the spices",c:"Bring the water to a gentle simmer with the ginger and cinnamon."},{t:"Steep the husks",c:"Add the cascara, lower the heat and simmer gently 5–10 min until the water turns a deep golden-amber."},{t:"Strain",c:"Strain out the husks and spices."},{t:"Sweeten and serve",c:"Sweeten with sugar or honey and serve hot in small cups. Light, gingery and fragrant."}],
  notes:"This isn't made from beans — qishr is the dried coffee fruit (husk), sold by specialty roasters as 'cascara'. Some Indian specialty roasters carry it; it's worth asking. Naturally low in caffeine, so it's a lovely evening drink. Ginger-forward is traditional.",
  methods:[
    {
      id:"stovetop", label:"Stovetop", recommended:true,
      note:"Qishr is made from dried coffee husks (cascara), not beans. The only way to brew it is a gentle stovetop simmer — no other method extracts the fruity, gingery character of the husks correctly. Moka pots, French presses, and pour over filters are all designed for ground coffee beans and will not work with husks.",
      ingredients:["4 tbsp cascara (dried coffee cherry husks / qishr)","1 tsp ground ginger (or a few fresh slices)","1 small piece of cinnamon stick","500 ml water","2 tsp sugar or honey (to taste)"],
      steps:[{t:"Simmer the spices",c:"Bring the water to a gentle simmer with the ginger and cinnamon."},{t:"Steep the husks",c:"Add the cascara, lower the heat and simmer gently 5–10 min until the water turns a deep golden-amber."},{t:"Strain",c:"Strain out the husks and spices."},{t:"Sweeten and serve",c:"Sweeten with sugar or honey and serve hot in small cups. Light, gingery and fragrant."}]
    }
  ]
},
{
  id:"seed-banana", serial:29, name:"Banana Cold Coffee",
  story:"One ripe banana turns cold coffee thick, creamy and naturally sweet — you barely need sugar. It's basically breakfast in a glass, and one of the easiest drinks in the whole book: no moka skill needed, just a blender and instant coffee.",
  bean:"Instant coffee is perfect here. Any everyday coffee works; the banana and milk are the stars.",
  description:"Creamy blended cold coffee with banana — naturally sweet, thick and filling. Just blend and pour.",
  method:"blended", origin:"Fusion", ratio:"blend", ratioLabel:"banana + milk + coffee", strength:2,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["1 ripe banana","200 ml cold milk","2 tsp instant coffee (or 60 ml strong moka coffee, cooled)","1 tsp sugar or honey (optional — banana is already sweet)","1 cup ice cubes"],
  steps:[{t:"Add the banana",c:"Peel and break the banana into a blender."},{t:"Everything in",c:"Add the milk, coffee, sugar and ice."},{t:"Blend smooth",c:"Blend 30–45 seconds until completely smooth, thick and frothy."},{t:"Pour and sip",c:"Pour into a tall glass and drink straight away."}],
  notes:"The riper the banana, the sweeter and creamier — use one with brown speckles and skip the sugar. A pinch of cinnamon or a spoon of peanut butter makes it even better. Freeze the banana for an extra-thick texture. Drink it fresh; banana shakes thin out and brown if they sit.",
  methods:[
    {
      id:"instant", label:"Instant", recommended:true,
      note:"Instant coffee blends smoothly with banana and milk — this is the easiest, most accessible version. A blender is required regardless of the coffee method.",
      ingredients:["1 ripe banana","200 ml cold milk","2 tsp instant coffee (or 60 ml strong moka coffee, cooled)","1 tsp sugar or honey (optional — banana is already sweet)","1 cup ice cubes"],
      steps:[{t:"Add the banana",c:"Peel and break the banana into a blender."},{t:"Everything in",c:"Add the milk, coffee, sugar and ice."},{t:"Blend smooth",c:"Blend 30–45 seconds until completely smooth, thick and frothy."},{t:"Pour and sip",c:"Pour into a tall glass and drink straight away."}]
    },
    {
      id:"moka", label:"Moka Pot", recommended:false,
      note:"Cool the moka shot to room temperature before blending — hot coffee will melt the ice and thin the shake. A blender is still required.",
      ingredients:["1 ripe banana","60 ml strong moka coffee (15–17 g grounds, cooled to room temperature)","200 ml cold milk","1 tsp sugar or honey (optional)","1 cup ice cubes"],
      steps:[{t:"Brew and cool",c:"Brew the moka pot and let the coffee cool to room temperature — never add hot coffee to the blender."},{t:"Add the banana",c:"Peel and break the banana into the blender."},{t:"Everything in",c:"Add the cooled coffee, milk, sugar and ice."},{t:"Blend smooth",c:"Blend 30–45 seconds until completely smooth, thick and frothy. Pour and drink fresh."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"Brew a small strong French press and let it cool before blending — the fuller body adds nice depth to the banana shake. A blender is still required.",
      ingredients:["1 ripe banana","18 g ground coffee (medium-dark, coarse grind) brewed to 60 ml concentrate, cooled","200 ml cold milk","1 tsp sugar or honey (optional)","1 cup ice cubes"],
      steps:[{t:"Brew and cool",c:"Add coffee to French press, pour 80 ml hot water, steep 4 minutes, press, cool to room temperature."},{t:"Add the banana",c:"Peel and break the banana into the blender."},{t:"Everything in",c:"Add the cooled French press coffee, milk, sugar and ice."},{t:"Blend smooth",c:"Blend 30–45 seconds until completely smooth. Drink fresh."}]
    }
  ]
},
{
  id:"seed-coldcoffee", serial:30, name:"Indian Café Cold Coffee",
  story:"The cold coffee every café and home blender in India makes — thick, frothy, sweet, with a scoop of vanilla ice cream for that milkshake body and foam. It's the after-school, hot-afternoon, everyone-loves-it classic.",
  bean:"Instant coffee is traditional and ideal — it blends smooth and foams well with the ice cream.",
  description:"The classic Indian café-style cold coffee — milk, coffee and sugar blended thick and frothy with a scoop of ice cream.",
  method:"blended", origin:"India", ratio:"blend", ratioLabel:"milk + coffee + ice cream", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["200 ml chilled milk","2 tsp instant coffee","3 tsp sugar (to taste)","1 small scoop vanilla ice cream","5 ice cubes"],
  steps:[{t:"Load the blender",c:"Put the milk, instant coffee, sugar and ice cream into a blender."},{t:"Blend till frothy",c:"Add the ice and blend a full minute until thick, pale and very frothy."},{t:"Pour",c:"Pour into a tall glass — the foam should sit on top."},{t:"Finish and serve",c:"Top with a little coffee powder, cocoa or chocolate syrup and serve with a straw."}],
  notes:"The ice cream gives it that thick, foamy café texture — don't skip it. Blend longer than you think (a full minute) for maximum froth. Drizzle chocolate syrup inside the glass before pouring for the full café look.",
  methods:[
    {
      id:"instant", label:"Instant", recommended:true,
      note:"Instant coffee is traditional for Indian café cold coffee — it blends perfectly smooth and foams up beautifully with the ice cream. A blender is required regardless of the coffee method.",
      ingredients:["200 ml chilled milk","2 tsp instant coffee","3 tsp sugar (to taste)","1 small scoop vanilla ice cream","5 ice cubes"],
      steps:[{t:"Load the blender",c:"Put the milk, instant coffee, sugar and ice cream into a blender."},{t:"Blend till frothy",c:"Add the ice and blend a full minute until thick, pale and very frothy."},{t:"Pour",c:"Pour into a tall glass — the foam should sit on top."},{t:"Finish and serve",c:"Top with a little coffee powder, cocoa or chocolate syrup and serve with a straw."}]
    },
    {
      id:"moka", label:"Moka Pot", recommended:false,
      note:"Brew the moka shot and let it cool completely before blending — hot coffee melts the ice cream too fast and makes the shake thin. A blender is still required.",
      ingredients:["200 ml chilled milk","60 ml strong moka coffee (15–17 g grounds, cooled completely)","3 tsp sugar (to taste)","1 small scoop vanilla ice cream","5 ice cubes"],
      steps:[{t:"Brew and cool",c:"Brew the moka pot and let the coffee cool completely to room temperature or refrigerator temperature."},{t:"Load the blender",c:"Put the chilled milk, cooled coffee, sugar and ice cream into a blender."},{t:"Blend till frothy",c:"Add the ice and blend a full minute until thick, pale and very frothy."},{t:"Pour and finish",c:"Pour into a tall glass. Top with a coffee powder dust and drizzle of chocolate syrup."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A dark French press is a great alternative — brew small and strong, cool it completely, then blend with milk and ice cream. A blender is still required.",
      ingredients:["200 ml chilled milk","18 g ground coffee (medium-dark, coarse grind) brewed to 60 ml, cooled completely","3 tsp sugar (to taste)","1 small scoop vanilla ice cream","5 ice cubes"],
      steps:[{t:"Brew and cool",c:"Add coffee to French press with 80 ml hot water, steep 4 minutes, press, cool completely."},{t:"Load the blender",c:"Put chilled milk, cooled French press coffee, sugar and ice cream in blender."},{t:"Blend till frothy",c:"Add ice and blend 1 full minute until thick, pale and frothy."},{t:"Pour and finish",c:"Pour into a tall glass. Top with a coffee powder dust or chocolate drizzle."}]
    }
  ]
},
{
  id:"seed-chikoo", serial:31, name:"Chikoo Cold Coffee",
  story:"A desi twist: chikoo's natural caramel-malt sweetness is a secret match for coffee. No sugar needed, and it tastes like a caramel shake. It's an unexpected, very Indian spin on cold coffee that uses a fruit sitting in most kitchens.",
  bean:"Instant coffee blends cleanly with the fruit; the chikoo's malty sweetness leads.",
  description:"A desi cold coffee with chikoo (sapota) — naturally caramel-sweet, creamy, and unusual in the best way.",
  method:"blended", origin:"India", ratio:"blend", ratioLabel:"chikoo + milk + coffee", strength:2,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["2 ripe chikoo (sapota), peeled and deseeded","200 ml cold milk","2 tsp instant coffee (or 60 ml strong moka coffee, cooled)","1 tsp sugar (optional — chikoo is very sweet)","1 cup ice cubes"],
  steps:[{t:"Prep the chikoo",c:"Peel the chikoo, remove all the seeds, and drop the flesh into a blender."},{t:"Everything in",c:"Add the milk, coffee, sugar and ice."},{t:"Blend smooth",c:"Blend 30–45 seconds until completely smooth and creamy."},{t:"Pour and serve",c:"Pour into a tall glass and serve cold."}],
  notes:"Use fully ripe, soft chikoo — firm ones are bland. Remove all the seeds. Chikoo is naturally very sweet with a malty, brown-sugar note that mirrors coffee, so you'll likely need no added sugar. A pinch of cardamom is a lovely Indian touch. Best fresh.",
  methods:[
    {
      id:"instant", label:"Instant", recommended:true,
      note:"Instant coffee blends cleanly with chikoo — the fruit's malty sweetness leads and the instant stays in the background. A blender is required regardless of the coffee method.",
      ingredients:["2 ripe chikoo (sapota), peeled and deseeded","200 ml cold milk","2 tsp instant coffee (or 60 ml strong moka coffee, cooled)","1 tsp sugar (optional — chikoo is very sweet)","1 cup ice cubes"],
      steps:[{t:"Prep the chikoo",c:"Peel the chikoo, remove all the seeds, and drop the flesh into a blender."},{t:"Everything in",c:"Add the milk, coffee, sugar and ice."},{t:"Blend smooth",c:"Blend 30–45 seconds until completely smooth and creamy."},{t:"Pour and serve",c:"Pour into a tall glass and serve cold."}]
    },
    {
      id:"moka", label:"Moka Pot", recommended:false,
      note:"Cool the moka shot to room temperature before blending — the chikoo's sweetness is best with everything cold. A blender is still required.",
      ingredients:["2 ripe chikoo (sapota), peeled and deseeded","60 ml strong moka coffee (15–17 g grounds, cooled to room temperature)","200 ml cold milk","1 tsp sugar (optional)","1 cup ice cubes"],
      steps:[{t:"Brew and cool",c:"Brew the moka pot and cool the coffee to room temperature before blending."},{t:"Prep the chikoo",c:"Peel the chikoo, remove all the seeds, and drop the flesh into a blender."},{t:"Everything in",c:"Add the cooled coffee, milk, sugar and ice."},{t:"Blend smooth",c:"Blend 30–45 seconds until completely smooth and creamy. Serve immediately."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A small strong French press cooled before blending gives a fuller-bodied chikoo shake — the extra body complements the fruit's malt note. A blender is still required.",
      ingredients:["2 ripe chikoo (sapota), peeled and deseeded","18 g ground coffee (medium-dark, coarse grind) brewed to 60 ml, cooled","200 ml cold milk","1 tsp sugar (optional)","1 cup ice cubes"],
      steps:[{t:"Brew and cool",c:"Add coffee to French press with 80 ml hot water, steep 4 minutes, press, cool completely."},{t:"Prep the chikoo",c:"Peel and deseed the chikoo and add to the blender."},{t:"Everything in",c:"Add the cooled French press coffee, milk, sugar and ice."},{t:"Blend smooth",c:"Blend 30–45 seconds until completely smooth. Serve immediately."}]
    }
  ]
},
{
  id:"seed-orange", serial:32, name:"Orange Iced Coffee",
  story:"Orange and coffee sounds strange and tastes like sunshine — the citrus lifts the coffee and cuts the bitterness. It's the easygoing cousin of the Portuguese Mazagran (coffee + citrus), just with a carton of orange juice instead of a fresh lemon. A perfect no-milk refresher for a hot Ahmedabad afternoon.",
  bean:"A medium or brighter roast works better than a heavy dark one — the fruitier notes play with the orange (like the Mazagran).",
  description:"A bright, no-milk refresher — chilled orange juice and strong coffee over ice. Citrusy, layered and unexpectedly good.",
  method:"moka pot", origin:"Fusion", ratio:"2:1", ratioLabel:"juice : coffee", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["120 ml chilled orange juice (store-bought is fine)","60 ml strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water), cooled","1 tsp honey or sugar (optional)","1 cup ice cubes","1 orange slice, to garnish"],
  steps:[{t:"Ice the glass",c:"Fill a tall glass with ice."},{t:"Add the juice",c:"Pour in the orange juice and stir in the honey if using."},{t:"Float the coffee",c:"Slowly pour the cooled coffee over the back of a spoon so it floats on top in a dark layer."},{t:"Garnish and sip",c:"Garnish with an orange slice. Admire the layers, then stir and sip."}],
  notes:"The coffee must be cooled or it'll taste muddy with the juice. Pour gently and don't over-stir — it looks beautiful half-layered. A medium/brighter roast plays best with the orange. Start with a 2:1 juice-to-coffee ratio and adjust.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka shot gives a clean, concentrated base that layers beautifully over orange juice — cool it first so the flavours stay bright.",
      ingredients:["120 ml chilled orange juice (store-bought is fine)","60 ml strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water), cooled","1 tsp honey or sugar (optional)","1 cup ice cubes","1 orange slice, to garnish"],
      steps:[{t:"Ice the glass",c:"Fill a tall glass with ice."},{t:"Add the juice",c:"Pour in the orange juice and stir in the honey if using."},{t:"Float the coffee",c:"Slowly pour the cooled coffee over the back of a spoon so it floats on top in a dark layer."},{t:"Garnish and sip",c:"Garnish with an orange slice. Admire the layers, then stir and sip."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant works well here — the orange juice is the star, and the cooled instant floats and layers just as prettily as brewed coffee.",
      ingredients:["2 tsp instant coffee","60 ml hot water (cool before using)","120 ml chilled orange juice","1 tsp honey or sugar (optional)","1 cup ice cubes","1 orange slice, to garnish"],
      steps:[{t:"Dissolve and cool",c:"Stir instant coffee into 60 ml hot water until dissolved. Let cool to room temperature."},{t:"Ice the glass",c:"Fill a tall glass with ice."},{t:"Add the juice",c:"Pour in the orange juice and stir in honey if using."},{t:"Float the coffee",c:"Slowly pour the cooled instant coffee over the back of a spoon so it floats on top. Garnish and sip."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"Pour over is ideal for orange coffee — the clean, bright, fruity notes of a medium roast play beautifully with the citrus. Let it cool fully before pouring.",
      ingredients:["14 g ground coffee (medium roast, medium grind)","100 ml hot water (93°C)","120 ml chilled orange juice","1 tsp honey or sugar (optional)","1 cup ice cubes","1 orange slice, to garnish"],
      steps:[{t:"Bloom",c:"Add filter and coffee, pour 30 ml water, wait 25 seconds."},{t:"Pour slowly",c:"Pour remaining water in circles over 90 seconds. Collect 60 ml."},{t:"Cool completely",c:"Let the pour over cool to room temperature before building the glass."},{t:"Layer and serve",c:"Fill a tall glass with ice, add OJ and sweetener, float the cooled pour over over the back of a spoon. Garnish."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew orange coffee needs no cooling step — the naturally cold brew is ready to pour straight over the juice.",
      ingredients:["18 g ground coffee (medium roast, coarse grind)","150 ml cold water","120 ml chilled orange juice","1 tsp honey or sugar (optional)","1 cup ice cubes","1 orange slice, to garnish"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Refrigerate 12–18 hours. Strain."},{t:"Ice the glass",c:"Fill a tall glass with ice."},{t:"Add the juice",c:"Pour in the orange juice and stir in honey if using."},{t:"Float the cold brew",c:"Pour cold brew concentrate over the back of a spoon so it floats. Garnish and sip."}]
    }
  ]
},
{
  id:"seed-pineapple", serial:33, name:"Pineapple Coffee Fizz",
  story:"The tropical cousin: pineapple juice and coffee topped with a fizz of soda. It sounds wild and drinks like a coffee mocktail — the pineapple's bright tang is a surprising match for coffee, almost like a coffee tonic with a holiday edge.",
  bean:"A clean medium roast — bright enough to cut the juice and fizz, not overpower.",
  description:"A fizzy coffee mocktail — pineapple juice and strong coffee over ice, topped with soda. Tropical, bubbly and refreshing.",
  method:"moka pot", origin:"Fusion", ratio:"fizzy", ratioLabel:"juice + coffee + soda", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["100 ml chilled pineapple juice (store-bought)","60 ml strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water), cooled","1 tsp sugar or honey (optional)","80 ml chilled soda or tonic water","1 cup ice cubes"],
  steps:[{t:"Ice the glass",c:"Fill a tall glass with ice."},{t:"Add the juice",c:"Pour in the pineapple juice and stir in the sugar if using."},{t:"Add the coffee",c:"Gently pour the cooled coffee over so it layers on top."},{t:"Top with fizz",c:"Top with soda or tonic, give one gentle stir, and serve fizzy and cold."}],
  notes:"Cool the coffee first — hot coffee kills the fizz and muddies the juice. Add the soda last and don't stir hard, so it stays bubbly. Tonic gives a grown-up bitter finish; plain soda keeps it sweeter. Great tall and very cold.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka gives a bold, clean shot that layers over the pineapple juice and holds its shape before you stir.",
      ingredients:["100 ml chilled pineapple juice (store-bought)","60 ml strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water), cooled","1 tsp sugar or honey (optional)","80 ml chilled soda or tonic water","1 cup ice cubes"],
      steps:[{t:"Ice the glass",c:"Fill a tall glass with ice."},{t:"Add the juice",c:"Pour in the pineapple juice and stir in the sugar if using."},{t:"Add the coffee",c:"Gently pour the cooled coffee over so it layers on top."},{t:"Top with fizz",c:"Top with soda or tonic, give one gentle stir, and serve fizzy and cold."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant pineapple coffee fizz is simple and just as dramatic — cool the instant first so it doesn't kill the fizz.",
      ingredients:["2 tsp instant coffee","60 ml hot water (cool before using)","100 ml chilled pineapple juice","1 tsp sugar or honey (optional)","80 ml chilled soda or tonic water","1 cup ice cubes"],
      steps:[{t:"Dissolve and cool",c:"Stir instant coffee into 60 ml hot water until dissolved. Cool to room temperature."},{t:"Ice the glass",c:"Fill a tall glass with ice."},{t:"Add the juice",c:"Pour in the pineapple juice and stir in sugar if using."},{t:"Layer and fizz",c:"Pour cooled coffee over gently so it layers on top. Top with soda or tonic, give one gentle stir and serve."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A clean medium pour over gives the crispest coffee base — its brightness plays excellently against the pineapple's tang. Cool fully before building.",
      ingredients:["14 g ground coffee (medium roast, medium grind)","90 ml hot water (93°C)","100 ml chilled pineapple juice","1 tsp sugar or honey (optional)","80 ml chilled soda or tonic water","1 cup ice cubes"],
      steps:[{t:"Bloom",c:"Add filter and coffee, pour 25 ml water, wait 25 seconds."},{t:"Pour slowly",c:"Pour remaining water to collect 60 ml concentrate."},{t:"Cool completely",c:"Let cool to room temperature before using."},{t:"Build and fizz",c:"Fill glass with ice, add juice, layer cooled pour over on top, top with soda/tonic, one gentle stir."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew pineapple fizz skips the cooling step — pour the cold brew concentrate straight over the juice and fizz for the cleanest, most refreshing version.",
      ingredients:["18 g ground coffee (medium roast, coarse grind)","150 ml cold water","100 ml chilled pineapple juice","1 tsp sugar or honey (optional)","80 ml chilled soda or tonic water","1 cup ice cubes"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Refrigerate 12–18 hours. Strain."},{t:"Ice the glass",c:"Fill a tall glass with ice."},{t:"Add the juice",c:"Pour in the pineapple juice and sweetener."},{t:"Layer and fizz",c:"Pour cold brew over the juice, top with soda or tonic, one gentle stir. Serve immediately."}]
    }
  ]
},
{
  id:"seed-coffeejelly", serial:34, name:"Japanese Coffee Jelly",
  story:"A beloved retro kissaten (old-school Japanese café) creation — coffee set into a wobbly jelly, cut into cubes, and served in a glass with cold milk poured over. It's coffee you eat with a spoon, half drink and half dessert, and a fixture of Japanese cafés for decades.",
  bean:"Any decent coffee works; brew it strong since the milk and syrup soften it. A smooth medium-dark sets into a clean-tasting jelly.",
  description:"A retro Japanese café classic — wobbly coffee jelly cubes served in a glass with cold milk and syrup. Half drink, half dessert, eaten with a spoon.",
  method:"moka pot", origin:"Japan", ratio:"set", ratioLabel:"coffee jelly + milk", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["250 ml strong brewed coffee (moka or 3 tsp instant in 250 ml hot water)","2 tbsp sugar","1.5 tsp gelatin (or 1 tsp agar / China grass for veg)","100 ml cold milk or cream, to serve","extra sugar syrup, to drizzle (optional)"],
  steps:[{t:"Bloom the gelatin",c:"If using gelatin, sprinkle it over 2 tbsp cold water and let it bloom 5 min. (For agar, boil it with the coffee instead.)"},{t:"Sweeten and set",c:"Make the coffee hot and stir in the sugar. Stir in the bloomed gelatin (or boil with agar 1 min) until fully melted."},{t:"Chill until set",c:"Pour into a shallow tray or cups and chill until firmly set, 2–3 hours (agar sets faster)."},{t:"Cut into cubes",c:"Cut the set jelly into small cubes and spoon them into a glass."},{t:"Serve with milk",c:"Pour cold milk over the cubes and drizzle with syrup. Serve cold with a spoon."}],
  notes:"For a vegetarian set, use agar-agar (China grass), easy to find in India: ~1 tsp per 250 ml, and you must boil it 1 min to activate — it then sets firm at room temperature. Gelatin needs the fridge. Cut into 1.5–2 cm cubes. Eat with both a spoon and a fat straw.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka pot brewed in multiple rounds (or using a larger moka) gives a strong, clean base that sets into a firm, deeply flavoured coffee jelly.",
      ingredients:["250 ml strong brewed coffee (moka or 3 tsp instant in 250 ml hot water)","2 tbsp sugar","1.5 tsp gelatin (or 1 tsp agar / China grass for veg)","100 ml cold milk or cream, to serve","extra sugar syrup, to drizzle (optional)"],
      steps:[{t:"Bloom the gelatin",c:"If using gelatin, sprinkle it over 2 tbsp cold water and let it bloom 5 min. (For agar, boil it with the coffee instead.)"},{t:"Sweeten and set",c:"Make the coffee hot and stir in the sugar. Stir in the bloomed gelatin (or boil with agar 1 min) until fully melted."},{t:"Chill until set",c:"Pour into a shallow tray or cups and chill until firmly set, 2–3 hours (agar sets faster)."},{t:"Cut into cubes",c:"Cut the set jelly into small cubes and spoon them into a glass."},{t:"Serve with milk",c:"Pour cold milk over the cubes and drizzle with syrup. Serve cold with a spoon."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant is excellent for coffee jelly — 3 tsp in 250 ml gives a strong, smooth brew that sets cleanly and tastes great cold with milk.",
      ingredients:["3 tsp instant coffee","250 ml hot water","2 tbsp sugar","1.5 tsp gelatin (bloomed in 2 tbsp cold water) or 1 tsp agar","100 ml cold milk or cream, to serve","extra sugar syrup (optional)"],
      steps:[{t:"Bloom the gelatin",c:"Sprinkle gelatin over 2 tbsp cold water and let bloom 5 minutes. (For agar, you'll boil it with the coffee.)"},{t:"Make strong instant",c:"Dissolve instant coffee and sugar in 250 ml hot water."},{t:"Set the jelly",c:"Stir in bloomed gelatin (or for agar, boil 1 minute) until fully melted."},{t:"Chill until firm",c:"Pour into a shallow tray or cups and chill 2–3 hours until set."},{t:"Cut and serve",c:"Cut into cubes, spoon into a glass, pour cold milk over. Eat with a spoon."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A 5-minute French press steep gives a full-bodied jelly with excellent coffee flavour — brew the full 250 ml at once if your press is large enough.",
      ingredients:["20 g ground coffee (medium-dark, coarse grind)","250 ml hot water","2 tbsp sugar","1.5 tsp gelatin (bloomed in 2 tbsp cold water) or 1 tsp agar","100 ml cold milk or cream, to serve","extra sugar syrup (optional)"],
      steps:[{t:"Bloom the gelatin",c:"Sprinkle gelatin over 2 tbsp cold water and let bloom 5 minutes."},{t:"Brew strong",c:"Add coffee to French press, pour 250 ml hot water, steep 5 minutes, press slowly."},{t:"Sweeten and set",c:"Stir sugar into the hot coffee. Stir in bloomed gelatin until fully dissolved."},{t:"Chill until firm",c:"Pour into a tray, chill 2–3 hours until set."},{t:"Cut and serve",c:"Cut into cubes, spoon into a glass, pour cold milk over."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"A pour over coffee jelly is cleaner and more elegant — brew the full 250 ml slowly so the jelly has a bright, clean flavour.",
      ingredients:["18 g ground coffee (medium-dark, medium grind)","250 ml hot water (93°C)","2 tbsp sugar","1.5 tsp gelatin (bloomed in 2 tbsp cold water) or 1 tsp agar","100 ml cold milk or cream, to serve","extra sugar syrup (optional)"],
      steps:[{t:"Bloom the gelatin",c:"Sprinkle gelatin over 2 tbsp cold water and let bloom 5 minutes."},{t:"Brew pour over",c:"Bloom grounds 30 seconds, then pour slowly in circles over 4 minutes to collect 250 ml."},{t:"Sweeten and set",c:"Stir sugar into the hot brew. Stir in bloomed gelatin until dissolved."},{t:"Chill until firm",c:"Pour into a shallow tray, chill 2–3 hours until set."},{t:"Cut and serve",c:"Cut into cubes, spoon into a glass, pour cold milk over."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew coffee jelly is the elevated version — naturally sweet, low-acid, and extraordinarily smooth. Gently warm a portion of the cold brew to dissolve the gelatin, then combine.",
      ingredients:["22 g ground coffee (medium-dark, coarse grind)","300 ml cold water","2 tbsp sugar or simple syrup","1.5 tsp gelatin (bloomed in 2 tbsp cold water) or 1 tsp agar","100 ml cold milk or cream, to serve","extra sugar syrup (optional)"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Refrigerate 14–18 hours. Strain to get ~250 ml."},{t:"Bloom the gelatin",c:"Sprinkle gelatin over 2 tbsp cold water and let bloom 5 minutes."},{t:"Dissolve gently",c:"Warm 60 ml of the cold brew in a small pan until just hot (do not boil). Stir in sugar and bloomed gelatin until dissolved."},{t:"Combine and set",c:"Mix the warm portion back into the remaining cold brew. Pour into a tray, chill 3+ hours."},{t:"Cut and serve",c:"Cut into cubes, spoon into a glass, pour cold milk over."}]
    }
  ]
},
{
  id:"seed-dirty", serial:35, name:"Dirty Coffee",
  story:"A huge hit in Korean and Japanese cafés — the name comes from what it looks like: hot espresso poured from a height onto cold milk so it crashes through and 'dirties' the white with dark streaks. You don't stir it; you drink it fast for that hot-meets-cold contrast. It's built to be photographed.",
  bean:"A bold, chocolatey dark roast — it has to punch through cold milk in dark streaks.",
  description:"The photogenic café favourite — hot espresso poured over cold milk so it streaks down 'dirtying' the white. No stirring; drink right away.",
  method:"moka pot", origin:"Korea / Japan", ratio:"2:1", ratioLabel:"milk : coffee", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["120 ml cold milk","1 tbsp brown sugar (optional)","60 ml hot strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water)","cocoa powder, to dust (optional)"],
  steps:[{t:"Sweeten the cold milk",c:"Stir the brown sugar into the cold milk and pour into a short, wide glass, filling it about three-quarters."},{t:"Brew hot coffee",c:"Brew the coffee fresh and hot."},{t:"Pour from a height",c:"Pour the hot coffee slowly from a height onto the cold milk so it crashes through and streaks down."},{t:"Dust and drink",c:"Dust with cocoa. Don't stir — photograph it, then drink it straight away."}],
  notes:"Use a short, wide glass so the dark streaks show against the white milk. The coffee must be HOT and the milk COLD — the clash is what makes it dramatic. Don't stir, and drink within a minute or two while the layers are distinct.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"A hot moka shot poured from height onto cold milk creates the dramatic dark streaks that define this drink — the coffee must be hot and the milk must be cold.",
      ingredients:["120 ml cold milk","1 tbsp brown sugar (optional)","60 ml hot strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water)","cocoa powder, to dust (optional)"],
      steps:[{t:"Sweeten the cold milk",c:"Stir the brown sugar into the cold milk and pour into a short, wide glass, filling it about three-quarters."},{t:"Brew hot coffee",c:"Brew the coffee fresh and hot."},{t:"Pour from a height",c:"Pour the hot coffee slowly from a height onto the cold milk so it crashes through and streaks down."},{t:"Dust and drink",c:"Dust with cocoa. Don't stir — photograph it, then drink it straight away."}]
    },
    {
      id:"instant", label:"Instant", recommended:false,
      note:"Instant dirty coffee looks just as dramatic — dissolve in minimal water to keep it concentrated and pour it hot from a height over cold milk.",
      ingredients:["120 ml cold milk","1 tbsp brown sugar (optional)","2 heaped tsp instant coffee","60 ml hot water","cocoa powder, to dust (optional)"],
      steps:[{t:"Sweeten the cold milk",c:"Stir the brown sugar into the cold milk and pour into a short, wide glass filling it about three-quarters."},{t:"Make strong instant",c:"Dissolve instant coffee in 60 ml hot water — keep it concentrated."},{t:"Pour from a height",c:"Pour the hot instant coffee slowly from a height onto the cold milk so it crashes through and streaks down."},{t:"Dust and drink",c:"Dust with cocoa. Don't stir — drink immediately."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A dark French press gives a full-bodied base that streaks beautifully — brew small and strong, then pour hot directly over the cold milk.",
      ingredients:["120 ml cold milk","1 tbsp brown sugar (optional)","18 g ground coffee (dark roast, coarse grind)","80 ml hot water","cocoa powder, to dust (optional)"],
      steps:[{t:"Sweeten the cold milk",c:"Stir brown sugar into cold milk in a short, wide glass."},{t:"Brew small and strong",c:"Steep coffee in French press 4 minutes with 80 ml water. Press, collect 60 ml."},{t:"Pour from a height",c:"Pour the hot French press coffee from a height onto the cold milk."},{t:"Dust and drink",c:"Dust with cocoa. Don't stir — drink immediately while the streaks are dramatic."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew dirty coffee reverses the contrast — ice-cold brew streaks through hot steamed milk for an equally dramatic but smoother version.",
      ingredients:["120 ml full-fat milk (steamed hot)","1 tbsp brown sugar (optional)","60 ml cold brew concentrate (20 g coffee steeped in 160 ml cold water 12–18 hours, strained)","cocoa powder, to dust (optional)"],
      steps:[{t:"Steep the cold brew",c:"Combine 20 g coarse coffee and 160 ml cold water in a jar, refrigerate 12–18 hours, strain."},{t:"Steam the milk",c:"Heat milk until steaming hot and sweeten with brown sugar if using. Pour into a glass."},{t:"Pour from a height",c:"Pour the cold brew concentrate from a height into the hot milk — it streaks dark through the white."},{t:"Dust and drink",c:"Dust with cocoa. Don't stir. Drink immediately."}]
    }
  ]
},
{
  id:"seed-brownsugar", serial:36, name:"Brown Sugar Latte",
  story:"The tiger-striped Instagram star that swept out of Taiwan and conquered Korean and Japanese cafés. Thick brown-sugar syrup is painted up the inside of the glass in dramatic stripes, then milk and coffee poured over. Add boba at the bottom and you've got the full bubble-tea-shop version.",
  bean:"A medium-dark roast balances the heavy brown-sugar sweetness without disappearing under it.",
  description:"The tiger-striped café star — thick brown sugar syrup swirled up the glass, then cold milk and coffee. Sweet, caramelly and very photogenic.",
  method:"moka pot", origin:"Taiwan", ratio:"build", ratioLabel:"syrup + milk + coffee", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["3 tbsp brown sugar","1 tbsp water","200 ml cold milk","60 ml strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water)","1 cup ice cubes"],
  steps:[{t:"Make brown sugar syrup",c:"Simmer the brown sugar with the water for 2–3 min into a thick, dark syrup. Let it cool slightly so it clings."},{t:"Paint the stripes",c:"Drizzle the syrup around the inside walls of the glass, tilting and turning to paint tiger stripes."},{t:"Ice and milk",c:"Add ice, then pour in the cold milk."},{t:"Top with coffee",c:"Slowly pour the coffee over the top. Serve unstirred so the stripes and layers show."}],
  notes:"The syrup must be thick so it clings — simmer until it coats the back of a spoon, then cool slightly (too hot and it just runs down). Tilt and rotate the glass while drizzling to paint the stripes. Don't stir. Add cooked tapioca pearls for the full boba version.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka gives a medium-dark base that balances the heavy caramel brown-sugar syrup without getting lost under it.",
      ingredients:["3 tbsp brown sugar","1 tbsp water","200 ml cold milk","60 ml strong coffee (60 ml moka, or 2 tsp instant in 60 ml hot water)","1 cup ice cubes"],
      steps:[{t:"Make brown sugar syrup",c:"Simmer the brown sugar with the water for 2–3 min into a thick, dark syrup. Let it cool slightly so it clings."},{t:"Paint the stripes",c:"Drizzle the syrup around the inside walls of the glass, tilting and turning to paint tiger stripes."},{t:"Ice and milk",c:"Add ice, then pour in the cold milk."},{t:"Top with coffee",c:"Slowly pour the coffee over the top. Serve unstirred so the stripes and layers show."}]
    },
    {
      id:"instant", label:"Instant Coffee", recommended:false,
      note:"Instant brown sugar latte is easy and looks just as dramatic — make the syrup first, paint the glass, then pour cold milk and hot instant over.",
      ingredients:["3 tbsp brown sugar","1 tbsp water","2 heaped tsp instant coffee","60 ml hot water","200 ml cold milk","1 cup ice cubes"],
      steps:[{t:"Make brown sugar syrup",c:"Simmer the brown sugar with 1 tbsp water for 2–3 min into a thick, dark syrup. Cool slightly."},{t:"Paint the stripes",c:"Drizzle the syrup around the inside walls of the glass."},{t:"Ice and milk",c:"Add ice, then pour in the cold milk."},{t:"Add coffee",c:"Stir instant coffee into 60 ml hot water until dissolved. Pour over the top. Serve unstirred."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A medium-dark French press gives a fuller-bodied base that holds up beautifully under the caramel brown sugar stripes.",
      ingredients:["3 tbsp brown sugar","1 tbsp water","18 g ground coffee (medium-dark, coarse grind)","120 ml hot water","200 ml cold milk","1 cup ice cubes"],
      steps:[{t:"Make brown sugar syrup",c:"Simmer brown sugar with 1 tbsp water 2–3 min. Cool slightly."},{t:"Paint the stripes",c:"Drizzle syrup around the inside walls of the glass."},{t:"Brew and cool slightly",c:"Steep coffee in French press 4 minutes, press slowly, let cool to warm."},{t:"Build and serve",c:"Add ice and cold milk to the glass. Pour French press coffee over the top. Serve unstirred."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew brown sugar latte is the Taiwanese café standard — the naturally sweet, low-acid cold brew pairs perfectly with the thick caramel syrup.",
      ingredients:["3 tbsp brown sugar","1 tbsp water","20 g ground coffee (medium-dark, coarse grind)","160 ml cold water","200 ml cold milk","1 cup ice cubes"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Refrigerate 12–18 hours. Strain."},{t:"Make brown sugar syrup",c:"Simmer brown sugar with 1 tbsp water 2–3 min. Cool to room temperature."},{t:"Paint the stripes",c:"Drizzle cooled syrup around the inside walls of the glass."},{t:"Build and serve",c:"Add ice and cold milk to the glass. Pour cold brew concentrate over the top. Serve unstirred."}]
    }
  ]
},
{
  id:"seed-cheesefoam", serial:37, name:"Cheese Foam Coffee",
  story:"Taiwan's wild idea that became an Asian café obsession — a salted, whipped cream-cheese foam floating on top of your coffee. It sounds bizarre and tastes like a liquid cheesecake lid: sweet-salty, rich and silky. You sip the coffee up through the foam, no straw, tilting the glass.",
  bean:"A smooth medium-dark roast — rich enough to carry the salty-sweet cheese cap without turning bitter.",
  description:"Taiwan's salted cream-cheese foam, whipped into a silky cap over iced coffee. Sweet-salty and rich, like liquid cheesecake. Sip through the foam.",
  method:"moka pot", origin:"Taiwan", ratio:"cap", ratioLabel:"coffee + cheese foam", strength:3,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["2 tbsp cream cheese, softened","2 tbsp heavy/whipping cream","2 tbsp milk","1 tsp sugar","1 good pinch of salt","150 ml coffee (60 ml strong + 90 ml water/milk, lightly sweetened)","1 cup ice cubes"],
  steps:[{t:"Whip the cheese foam",c:"Whisk the cream cheese, cream, milk, sugar and salt together until smooth, silky and just pourable."},{t:"Build the coffee",c:"Fill a glass with ice and pour in the coffee, leaving room at the top."},{t:"Float the foam",c:"Gently pour the cheese foam over the back of a spoon so it floats in a thick cap."},{t:"Sip through the cap",c:"Don't stir — sip the coffee up through the salty-sweet foam."}],
  notes:"Soften the cream cheese first or it'll stay lumpy. Whisk the foam just pourable — thick enough to float, loose enough to pour. The salt is essential; it turns sweet cream into that addictive 'cheese tea' flavour. Traditionally drunk without a straw, tilting the glass.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"The moka gives a smooth, rich base that complements the salty-sweet cheese foam — diluted slightly with cold water or milk so the cheese flavour can lead.",
      ingredients:["2 tbsp cream cheese, softened","2 tbsp heavy/whipping cream","2 tbsp milk","1 tsp sugar","1 good pinch of salt","150 ml coffee (60 ml strong + 90 ml water/milk, lightly sweetened)","1 cup ice cubes"],
      steps:[{t:"Whip the cheese foam",c:"Whisk the cream cheese, cream, milk, sugar and salt together until smooth, silky and just pourable."},{t:"Build the coffee",c:"Fill a glass with ice and pour in the coffee, leaving room at the top."},{t:"Float the foam",c:"Gently pour the cheese foam over the back of a spoon so it floats in a thick cap."},{t:"Sip through the cap",c:"Don't stir — sip the coffee up through the salty-sweet foam."}]
    },
    {
      id:"instant", label:"Instant Coffee", recommended:false,
      note:"Instant cheese foam coffee is enormously popular — the cheese foam is the star, so the coffee quality matters less than usual.",
      ingredients:["2 tbsp cream cheese, softened","2 tbsp heavy/whipping cream","2 tbsp milk","1 tsp sugar","1 good pinch of salt","2 tsp instant coffee","150 ml hot water (split: 60 ml strong + 90 ml to dilute)","1 cup ice cubes"],
      steps:[{t:"Whip the cheese foam",c:"Whisk the cream cheese, cream, milk, sugar and salt together until smooth, silky and just pourable."},{t:"Make the coffee",c:"Dissolve instant in 60 ml hot water. Add 90 ml more water and lightly sweeten."},{t:"Build the glass",c:"Fill a glass with ice and pour in the coffee."},{t:"Float the foam",c:"Gently pour the cheese foam over the back of a spoon so it floats. Sip through the foam."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"A medium-dark French press gives a fuller-bodied base under the cheese foam — brew 150 ml total and lightly sweeten before building.",
      ingredients:["2 tbsp cream cheese, softened","2 tbsp heavy/whipping cream","2 tbsp milk","1 tsp sugar","1 good pinch of salt","18 g ground coffee (medium-dark, coarse grind)","150 ml hot water","1 cup ice cubes"],
      steps:[{t:"Whip the cheese foam",c:"Whisk the cream cheese, cream, milk, sugar and salt until smooth, silky and just pourable."},{t:"Brew",c:"Steep coffee in French press 4 minutes with 150 ml water. Press slowly."},{t:"Lightly sweeten",c:"Add a small pinch of sugar to the coffee. Pour over ice in a glass."},{t:"Float the foam",c:"Gently pour the cheese foam over the back of a spoon. Sip through the cap."}]
    },
    {
      id:"cold_brew", label:"Cold Brew", recommended:false,
      note:"Cold brew cheese foam coffee is an excellent version — the smooth, low-acid cold brew is the perfect base under the rich, salty foam.",
      ingredients:["2 tbsp cream cheese, softened","2 tbsp heavy/whipping cream","2 tbsp milk","1 tsp sugar","1 good pinch of salt","20 g ground coffee (medium-dark, coarse grind)","160 ml cold water","1 cup ice cubes","sugar or simple syrup to lightly sweeten the coffee"],
      steps:[{t:"Steep overnight",c:"Combine coffee and cold water in a jar. Refrigerate 12–18 hours. Strain."},{t:"Whip the cheese foam",c:"Whisk cream cheese, cream, milk, sugar and salt until smooth, silky and just pourable."},{t:"Build the glass",c:"Fill a glass with ice. Pour ~150 ml cold brew, lightly sweetened."},{t:"Float the foam",c:"Pour cheese foam over the back of a spoon so it floats. Sip through the foam without stirring."}]
    }
  ]
},
{
  id:"seed-flashbrew", serial:38, name:"Japanese Flash-Brew Iced Coffee",
  story:"The specialty-café secret from Japan: instead of cooling coffee in the fridge (which goes flat and dull), you brew it hot, directly onto a glass of ice. The instant chill traps all the bright aromatics — it's the cleanest, most fragrant iced coffee you can make, and the one place a fruity, brighter roast really sings.",
  bean:"This is the one iced coffee where a fruity, brighter roast really sings — the instant chill captures its aromatics.",
  description:"The specialty-coffee method from Japan — hot coffee brewed straight onto ice, locking in aroma for the crispest, brightest iced coffee.",
  method:"moka pot", origin:"Japan", ratio:"strong on ice", ratioLabel:"brew onto ice", strength:4,
  tried:false, rating:0, createdAt:D('2026-06-20'),
  ingredients:["17 g ground coffee (a brighter medium roast shines here, moka basket level)","60 ml water (to the moka pot safety valve)","1 tall glass packed with ice","sugar or a splash of milk (optional)"],
  steps:[{t:"Pack the glass with ice",c:"Pack a tall glass or server right to the top with ice."},{t:"Brew strong and hot",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles — keep it strong."},{t:"Brew onto the ice",c:"Pour the hot coffee directly over the ice so it chills instantly. Give it a quick swirl."},{t:"Finish and serve",c:"Sweeten or add a splash of milk if you like, and drink straight away while it's bright and aromatic."}],
  notes:"The ice becomes part of your water as it melts, so brew a touch stronger than usual. The trick is the instant chill: it captures aromatic oils that slow fridge-cooling lets escape, so it tastes noticeably brighter and cleaner. Best drunk fresh, black or with a splash of milk.",
  methods:[
    {
      id:"moka", label:"Moka Pot", recommended:true,
      note:"Flash-brew is the method — hot coffee brewed directly onto ice for the instant chill that traps bright aromatics. The moka pot is recommended: easy to control, gives a consistently strong pour, and the concentrated shot chills instantly without diluting too much.",
      ingredients:["17 g ground coffee (a brighter medium roast shines here, moka basket level)","60 ml water (to the moka pot safety valve)","1 tall glass packed with ice","sugar or a splash of milk (optional)"],
      steps:[{t:"Pack the glass with ice",c:"Pack a tall glass or server right to the top with ice."},{t:"Brew strong and hot",c:"Brew the moka pot: basket level not tamped, pull off when it gurgles — keep it strong."},{t:"Brew onto the ice",c:"Pour the hot coffee directly over the ice so it chills instantly. Give it a quick swirl."},{t:"Finish and serve",c:"Sweeten or add a splash of milk if you like, and drink straight away while it's bright and aromatic."}]
    },
    {
      id:"pour_over", label:"Pour Over", recommended:false,
      note:"Pour over flash-brew is the specialty-café original — brew hot directly onto a glass packed with ice, using about half your usual water so the melting ice makes up the rest. The paper filter gives the cleanest, most aromatic result.",
      ingredients:["16 g ground coffee (medium to bright roast, medium grind)","120 ml hot water (93°C) — the ice replaces the other half of your usual brew water","1 tall glass packed with ice","sugar or a splash of milk (optional)"],
      steps:[{t:"Pack the glass with ice",c:"Pack a tall glass right to the top with ice. Place your dripper on top."},{t:"Bloom",c:"Add filter and coffee, pour 30 ml water, wait 30 seconds."},{t:"Pour slowly onto the ice",c:"Pour remaining water in slow circles. The brew drips through the filter directly onto the ice and chills instantly."},{t:"Swirl and serve",c:"Give a quick swirl. Sweeten or add a splash of milk if you like, and drink immediately while aromatic."}]
    },
    {
      id:"french_press", label:"French Press", recommended:false,
      note:"French press flash-brew works well — brew small and strong, then pour the hot brew directly over a glass packed with ice. The fuller-bodied result gives a richer iced coffee than pour over.",
      ingredients:["18 g ground coffee (medium-bright roast, coarse grind)","100 ml hot water","1 tall glass packed with ice","sugar or a splash of milk (optional)"],
      steps:[{t:"Pack the glass with ice",c:"Pack a tall glass right to the top with ice."},{t:"Brew small and strong",c:"Add coffee to French press, pour 100 ml hot water, steep 3.5 minutes, press slowly."},{t:"Pour hot onto the ice",c:"Pour the hot French press brew in a steady stream over the ice. The coffee chills instantly."},{t:"Swirl and serve",c:"Swirl briefly, sweeten or add milk, and drink immediately while the aromatics are bright."}]
    }
  ]
}
];
