// Offline → static photo pool (real Unsplash CDN images), no network for keys.
for (const k of ['UNSPLASH_API_KEY','PEXELS_API_KEY','GOOGLE_PLACES_API_KEY','OPENAI_API_KEY']) process.env[k] = ''
process.env.SITE_BASE_URL = 'https://guma.ai'

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const { generateFromTemplate } = await import('./src/generator/templateEngine.js')
const { resolveCategory }       = await import('./src/templates/categories.js')
const { validateAndRefine }     = await import('./src/generator/refine.js')

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'output', 'samples')
mkdirSync(OUT, { recursive: true })

// 10 categories × realistic BI-style specs (what the pipeline feeds the renderer)
const CASES = [
  { slug:'bellas-trattoria-nyc', name:"Bella's Trattoria", category:'Italian Restaurant', city:'New York', country:'US', phone:'+1 212 555 0140', address:'12 Mott St, New York',
    raw:{ rating:'4.8', review_count:'512' },
    spec:{ tagline:'Naples, served in Nolita', hero_subtext:'Hand-stretched dough, San Marzano tomatoes, and a 900° wood oven — since 1998.', offering_type:'menu',
      offerings:[{name:'Margherita DOP',desc:'Fior di latte, basil, 60-second char'},{name:'Diavola',desc:'Spicy salami & chili honey'},{name:'Cacio e Pepe',desc:'Hand-rolled, pecorino, black pepper'},{name:'Tiramisu',desc:'Espresso-soaked, made daily'}],
      trust_points:['4.8★ from 512 diners','Imported 00 flour','Wood-fired in 90 seconds'], cta_primary:'Reserve a Table', meta_title:"Bella's Trattoria — Wood-Fired Neapolitan Pizza in Nolita NYC", meta_description:'Authentic Neapolitan pizza and handmade pasta in the heart of Nolita, New York. Wood-fired since 1998.' } },

  { slug:'lumiere-hair-makati', name:'Lumière Hair & Beauty', category:'Hair Salon', city:'Makati', country:'PH', phone:'+63 2 8555 0190', address:'Greenbelt 5, Makati',
    raw:{ rating:'4.9', review_count:'288' },
    spec:{ tagline:'Where your best hair day lives', hero_subtext:'Precision cuts, balayage, and keratin treatments from senior stylists in the heart of Makati.', offering_type:'services',
      offerings:[{name:'Signature Cut & Style',desc:'Consultation, cut, blow-dry'},{name:'Balayage',desc:'Hand-painted, natural grow-out'},{name:'Keratin Treatment',desc:'Frizz-free for 3 months'},{name:'Bridal Hair & Makeup',desc:'Trial + day-of glam'}],
      trust_points:['4.9★ from 288 clients','Senior stylists only','Premium Kérastase products'], cta_primary:'Book Appointment', meta_title:'Lumière Hair & Beauty — Premium Salon in Makati', meta_description:'Precision cuts, balayage and bridal styling by senior stylists in Greenbelt, Makati. Book your appointment.' } },

  { slug:'apex-plumbing-austin', name:'Apex Plumbing & Heating', category:'Plumbing Contractor', city:'Austin', country:'US', phone:'+1 512 555 0177', address:'Austin, TX',
    raw:{ rating:'4.7', review_count:'196' },
    spec:{ tagline:'Done right, the first time', hero_subtext:'Licensed, insured, and on-call 24/7 for emergencies across Greater Austin.', offering_type:'services',
      offerings:[{name:'Emergency Repairs',desc:'24/7 burst pipes & leaks'},{name:'Water Heater Install',desc:'Tank & tankless, same-week'},{name:'Drain Cleaning',desc:'Camera-inspected, no mess'},{name:'Repiping',desc:'Whole-home, up to code'}],
      trust_points:['Licensed & insured','24/7 emergency callout','Upfront flat-rate pricing'], cta_primary:'Get a Free Quote', meta_title:'Apex Plumbing & Heating — 24/7 Licensed Plumbers in Austin', meta_description:'Licensed, insured plumbers serving Greater Austin. Emergency repairs, water heaters, repiping. Free quotes.' } },

  { slug:'brightsmile-dental-cebu', name:'BrightSmile Dental Clinic', category:'Dental Clinic', city:'Cebu City', country:'PH', phone:'+63 32 555 0122', address:'Cebu Business Park',
    raw:{ rating:'4.9', review_count:'341' },
    spec:{ tagline:'Modern dentistry, gentle care', hero_subtext:'Painless cleanings, implants, and same-day crowns in a calm, modern clinic.', offering_type:'services',
      offerings:[{name:'Cleaning & Checkup',desc:'Gentle, thorough, 45 min'},{name:'Dental Implants',desc:'Titanium, lifetime support'},{name:'Same-Day Crowns',desc:'CEREC, one visit'},{name:'Teeth Whitening',desc:'Up to 8 shades brighter'}],
      trust_points:['Accepting new patients','Major HMOs accepted','Same-day appointments'], cta_primary:'Book a Visit', meta_title:'BrightSmile Dental Clinic — Gentle Modern Dentistry in Cebu', meta_description:'Painless cleanings, implants and same-day crowns in Cebu Business Park. Accepting new patients and HMOs.' } },

  { slug:'sterling-law-london', name:'Sterling & Co. Solicitors', category:'Law Firm', city:'London', country:'GB', phone:'+44 20 7555 0103', address:'Lincoln’s Inn, London',
    raw:{ rating:'4.8', review_count:'127' },
    spec:{ tagline:'Counsel you can trust', hero_subtext:'Three decades of property, corporate, and family law expertise — discreet and decisive.', offering_type:'services',
      offerings:[{name:'Conveyancing',desc:'Residential & commercial'},{name:'Corporate Law',desc:'M&A, contracts, disputes'},{name:'Family Law',desc:'Divorce, custody, mediation'},{name:'Wills & Probate',desc:'Estate planning, trusts'}],
      trust_points:['Est. 1991','SRA regulated','Free 30-min consultation'], cta_primary:'Free Consultation', meta_title:'Sterling & Co. Solicitors — Trusted London Law Firm', meta_description:'Property, corporate and family law from a trusted London firm since 1991. Book a free 30-minute consultation.' } },

  { slug:'corner-bookshop-portland', name:'The Corner Book Shop', category:'Book Shop & Gift Store', city:'Portland', country:'US', phone:'+1 503 555 0166', address:'Hawthorne Blvd, Portland',
    raw:{ rating:'4.9', review_count:'604' },
    spec:{ tagline:'Your next favorite book is here', hero_subtext:'An independent bookshop with hand-picked staff favorites, rare finds, and weekly readings.', offering_type:'products',
      offerings:[{name:'New Releases',desc:'Curated front table'},{name:'Used & Rare',desc:'Out-of-print treasures'},{name:'Kids & YA',desc:'Cozy reading nook'},{name:'Gift Cards',desc:'For every reader'}],
      trust_points:['Independent since 2004','Staff picks weekly','Author readings'], cta_primary:'Visit the Shop', meta_title:'The Corner Bookshop — Independent Bookstore in Portland', meta_description:'Hand-picked new releases, rare finds and weekly author readings at Portland’s favorite indie bookshop.' } },

  { slug:'iron-forge-manila', name:'Iron Forge Fitness', category:'Fitness Gym', city:'Manila', country:'PH', phone:'+63 2 8555 0150', address:'BGC, Taguig',
    raw:{ rating:'4.8', review_count:'430' },
    spec:{ tagline:'Forge your strongest self', hero_subtext:'Olympic platforms, expert coaches, and a community that shows up — open 24/7.', offering_type:'services',
      offerings:[{name:'Day Pass',desc:'Full access, no lock-in'},{name:'Monthly Membership',desc:'Unlimited classes'},{name:'Personal Training',desc:'1-on-1 programming'},{name:'Strength Classes',desc:'Olympic lifting & HIIT'}],
      trust_points:['Certified coaches','Open 24/7','Olympic-grade equipment'], cta_primary:'Start Free Trial', meta_title:'Iron Forge Fitness — 24/7 Strength Gym in BGC Manila', meta_description:'Olympic platforms, expert coaching and a real community in BGC. Open 24/7. Start your free trial today.' } },

  { slug:'aperture-studio-capetown', name:'Aperture Studio', category:'Photography Studio', city:'Cape Town', country:'ZA', phone:'+27 21 555 0188', address:'Woodstock, Cape Town',
    raw:{ rating:'5.0', review_count:'162' },
    spec:{ tagline:'Your story, beautifully framed', hero_subtext:'Weddings, portraits, and brand shoots with a cinematic, editorial eye.', offering_type:'services',
      offerings:[{name:'Wedding Coverage',desc:'Full-day, two shooters'},{name:'Portrait Sessions',desc:'Studio or on-location'},{name:'Brand & Product',desc:'E-commerce ready'},{name:'Events',desc:'Corporate & private'}],
      trust_points:['5.0★ from 162 clients','48-hour gallery delivery','Featured in Vogue ZA'], cta_primary:'Book a Session', meta_title:'Aperture Studio — Cinematic Photography in Cape Town', meta_description:'Editorial wedding, portrait and brand photography in Cape Town. 48-hour gallery delivery. Book a session.' } },

  { slug:'lolas-panaderya-iloilo', name:"Lola's Panaderya", category:'Bakeshop', city:'Iloilo', country:'PH', phone:'+63 33 555 0111', address:'Jaro, Iloilo City',
    raw:{ rating:'4.9', review_count:'377' },
    spec:{ tagline:'Sariwa, araw-araw', hero_subtext:'Pan de sal pulled hot from the oven at 5am, plus heirloom kakanin baked the old way.', offering_type:'products',
      offerings:[{name:'Pan de Sal',desc:'Hot from 5am daily'},{name:'Ensaymada',desc:'Buttery, cheese-topped'},{name:'Ube Bibingka',desc:'Clay-oven baked'},{name:'Custom Cakes',desc:'Birthdays & fiestas'}],
      trust_points:['Baked fresh daily','No preservatives','Custom orders welcome'], cta_primary:'Order Now', meta_title:"Lola's Panaderya — Fresh Pan de Sal & Kakanin in Iloilo", meta_description:'Hot pan de sal from 5am, ensaymada and heirloom kakanin baked fresh daily in Jaro, Iloilo. Order now.' } },

  { slug:'fixhub-repair-qc', name:'FixHub Gadget Repair', category:'Phone Repair', city:'Quezon City', country:'PH', phone:'+63 2 8555 0199', address:'Cubao, Quezon City',
    raw:{ rating:'4.7', review_count:'259' },
    spec:{ tagline:'Fixed fast — or it’s free', hero_subtext:'Screen, battery, and water-damage repairs in under an hour, with genuine parts and a 90-day warranty.', offering_type:'services',
      offerings:[{name:'Screen Replacement',desc:'Most phones, 45 min'},{name:'Battery Swap',desc:'Genuine cells, same-day'},{name:'Water Damage',desc:'Diagnostics + recovery'},{name:'Data Recovery',desc:'Photos & contacts'}],
      trust_points:['90-day warranty','Genuine parts','Same-day repair'], cta_primary:'Get a Repair Quote', meta_title:'FixHub Gadget Repair — Fast Phone Repair in Quezon City', meta_description:'Screen, battery and water-damage phone repairs in under an hour with genuine parts and a 90-day warranty.' } },
]

const rows = []
for (const c of CASES) {
  const business = { id:c.slug, slug:c.slug, name:c.name, category:c.category, city:c.city, country:c.country, phone:c.phone, address:c.address, raw_data:c.raw }
  const { key, config } = resolveCategory(business)
  const { html } = await generateFromTemplate(business, key, config, c.spec)
  const { html: refined, report } = validateAndRefine({ html, business, spec: c.spec })
  const file = join(OUT, `${c.slug}.html`)
  writeFileSync(file, refined)
  // pull the palette primary the renderer chose (deterministic per slug)
  const primary = refined.match(/--color-primary:(#[0-9A-Fa-f]{6})/)?.[1] || '?'
  rows.push({ name:c.name, category:key, palette:primary, score:report.score, bytes:refined.length, file:`output/samples/${c.slug}.html` })
}

console.log('\n  Business                     Category        Palette    Score   Size   File')
console.log('  ' + '-'.repeat(96))
for (const r of rows) {
  console.log('  ' +
    r.name.padEnd(28) + ' ' +
    r.category.padEnd(15) + ' ' +
    r.palette.padEnd(9) + ' ' +
    String(r.score).padStart(4) + '   ' +
    String(Math.round(r.bytes/1024)+'KB').padStart(5) + '  ' +
    r.file)
}
console.log(`\n  ✓ ${rows.length} sites rendered to apps/generator/output/samples/`)
