for (const k of ['UNSPLASH_API_KEY','PEXELS_API_KEY','GOOGLE_PLACES_API_KEY','OPENAI_API_KEY']) process.env[k]=''
const { generateFromTemplate } = await import('./src/generator/templateEngine.js')
const { resolveCategory } = await import('./src/templates/categories.js')
const { validateAndRefine } = await import('./src/generator/refine.js')
const t = (s)=>s.length
console.log('Bella title len:', t("Bella's Trattoria — Wood-Fired Neapolitan Pizza in Nolita NYC"))
console.log('Apex  title len:', t("Apex Plumbing & Heating — 24/7 Licensed Plumbers in Austin"))
for (const [nm,b,spec] of [
 ['Bella', {id:'1',slug:'bellas-trattoria-nyc',name:"Bella's Trattoria",category:'Italian Restaurant',city:'New York',country:'US',phone:'+1',address:'x',raw_data:{rating:'4.8',review_count:'512'}}, {tagline:'Naples, served in Nolita',hero_subtext:'Hand-stretched dough.',offering_type:'menu',offerings:[{name:'a',desc:'b'}],trust_points:['x'],meta_title:"Bella's Trattoria — Wood-Fired Neapolitan Pizza in Nolita NYC",meta_description:'Authentic Neapolitan pizza and handmade pasta in the heart of Nolita, New York. Wood-fired since 1998.'}],
 ['Apex', {id:'2',slug:'apex-plumbing-austin',name:'Apex Plumbing & Heating',category:'Plumbing Contractor',city:'Austin',country:'US',phone:'+1',address:'x',raw_data:{rating:'4.7',review_count:'196'}}, {tagline:'Done right, the first time',hero_subtext:'Licensed and insured.',offering_type:'services',offerings:[{name:'a',desc:'b'}],trust_points:['x'],meta_title:'Apex Plumbing & Heating — 24/7 Licensed Plumbers in Austin',meta_description:'Licensed, insured plumbers serving Greater Austin. Emergency repairs, water heaters, repiping. Free quotes.'}],
]) {
  const {key,config}=resolveCategory(b)
  const {html}=await generateFromTemplate(b,key,config,spec)
  const {report}=validateAndRefine({html,business:b,spec})
  console.log(`${nm} (${key}) score ${report.score}:`, report.issues.map(i=>`${i.code}${i.fixed?'(fixed)':''}`).join(', ')||'none')
}
