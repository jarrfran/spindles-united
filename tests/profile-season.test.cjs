const assert=require('node:assert/strict'),fs=require('node:fs'),r=require('../record-book.js');
const read=p=>JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'..',p)));
global.document={title:''};global.location={search:''};global.setInterval=()=>0;
const data=r.build(read('data/club.json'),read('data/record-book.json'),read('data/player-media.json'));
const p=data.list.find(p=>new Set(Object.values(p.numbers)).size>1);assert(p);
function render(season){location.search=season?'?profile-season='+season:'';const el={innerHTML:'',querySelector:()=>({addEventListener(){}})};r.profile(el,data,p.id);return el.innerHTML;}
assert(render().includes('aria-label="Squad number '+p.number+'"'));
for(const [y,n] of Object.entries(p.numbers))assert(render(y).includes('aria-label="Squad number '+n+'"'));
assert(render().includes('su-stat-yellow'));assert(render().includes('su-stat-red'));assert(render().includes('Individual Accolades'));
data.accolades=[{player:p.name,season:p.years[0],award:'Test Verified Award',verified:true},{player:p.name,season:p.years[0],award:'Unverified Candidate',verified:false}];
assert(render().includes('Test Verified Award'));assert(!render().includes('Unverified Candidate'));
console.log('Career/latest number, season number changes, stat icons and verified accolades passed for '+p.name+'.');
