/* Match recap identity links. Shared surnames require season and article context. */
(function(root){
'use strict';
function escapeRE(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function index(data,api,year){
 var full=new Map(),last=new Map();
 function put(map,key,p){key=key.toLowerCase();if(!map.has(key))map.set(key,[]);if(!map.get(key).some(x=>x.id===p.id))map.get(key).push(p);}
 data.list.forEach(function(p){put(full,p.name,p);put(last,p.name.split(' ').at(-1),p);});
 Object.values(data.club.rosters).forEach(r=>r.players.forEach(function(r){var p=data.players[api.slug(r.name)];if(p)put(full,r.name,p);}));
 var variants={'Jimmy Alexander':'James Alexander','Joe Piperata':'Joseph Piperata','Danny Primeau':'Daniel Primeau','Drew Michel':'Andrew Michel','Zeidane Adeji':'Zeidane Adjei','Adeji':'Zeidane Adjei','Am. Singaporewala':'Ammar Singaporewala','Ad. Singaporewala':'Adam Singaporewala'};
 Object.entries(variants).forEach(function([v,n]){var p=data.players[api.slug(n)];if(p)put(full,v,p);});
 var keys=[...new Set([...full.keys(),...last.keys()])].sort((a,b)=>b.length-a.length),re=new RegExp('(?<![\\p{L}\\p{N}])('+keys.map(escapeRE).join('|')+')(?![\\p{L}\\p{N}])','giu');
 function mentions(text){return [...text.matchAll(new RegExp(re.source,re.flags))];}
 function explicit(text){var ids=new Set();mentions(text).forEach(m=>{var a=full.get(m[0].toLowerCase());if(a?.length===1)ids.add(a[0].id);});return ids;}
 function resolve(word,paragraph,article){var key=word.toLowerCase(),f=full.get(key);if(f?.length===1)return f[0];var a=last.get(key)||[];if(!a.length)return null;var current=a.filter(p=>p.seasons[year]);if(current.length)a=current;if(a.length===1)return a[0];var context=a.filter(p=>explicit(paragraph).has(p.id));if(context.length===1)return context[0];context=a.filter(p=>explicit(article).has(p.id));return context.length===1?context[0]:null;}
 return {mentions:mentions,resolve:resolve};
}
function link(body,data,api,year){var idx=index(data,api,year),article=body.textContent,walker=body.ownerDocument.createTreeWalker(body,4),nodes=[],node;
 while(node=walker.nextNode())if(node.nodeValue.trim()&&!node.parentElement.closest('a,script,style,button,textarea,code,pre,[hidden],.su-redundant-match-intro'))nodes.push(node);
 nodes.forEach(function(n){var text=n.nodeValue,para=n.parentElement.closest('p,li,h2,h3,h4,blockquote')||n.parentElement,fragment=body.ownerDocument.createDocumentFragment(),cursor=0,changed=false;
 idx.mentions(text).forEach(function(m){var p=idx.resolve(m[0],para.textContent,article);if(!p)return;fragment.append(text.slice(cursor,m.index));var a=body.ownerDocument.createElement('a');a.className='su-player-mention';a.href=api.href(p.name);a.textContent=m[0];a.setAttribute('aria-label',p.name+' player profile');fragment.append(a);cursor=m.index+m[0].length;changed=true;});
 if(changed){fragment.append(text.slice(cursor));n.replaceWith(fragment);}});
}
var api={index:index,link:link};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SUPlayerMentions=api;
})(typeof window!=='undefined'?window:globalThis);
