const fs=require('node:fs'),assert=require('node:assert/strict'),r=require('../record-book.js');
const read=p=>JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'..',p)));
const archive=read('data/accolades.json'),media=read('data/player-media.json');media.accolades=archive.entries;
const d=r.build(read('data/club.json'),read('data/record-book.json'),media),seen=new Set();
assert.equal(d.accolades.filter(a=>a.kind==='season').length,21);assert.equal(d.accolades.length,22);
for(const a of d.accolades){assert(a.verified);if(a.sourceUrl)assert.match(a.sourceUrl,/^https:\/\/www\.instagram\.com\/spindlesunited\/(p|reel)\/[\w-]+\/$/);else assert.equal(a.verificationSource,'Club owner confirmation');const p=d.players[r.slug(a.player)];assert(p,a.player);assert(p.seasons[a.season],a.player+' '+a.season);const key=[a.season,a.player,a.award].join('|');assert(!seen.has(key));seen.add(key);}
assert.equal(d.accolades.filter(a=>a.season===2023&&a.award==='Golden Boot').length,2);
assert.equal(d.accolades.filter(a=>a.season===2025&&a.award==='Community Spins').length,2);
assert.equal(d.accolades.filter(a=>a.player==='Dan Crook'&&a.season===2026).length,2);
console.log('22 confirmed accolades resolve to valid player profiles and playing seasons; shared awards and distinct season/competition awards verified.');
