/* Recent stories share one unfiltered feed across schedule and footer. */
(function(){
'use strict';if(window.SUNews)return;
var BASE=new URL('.',document.currentScript.src).href,ready;
function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function load(){if(!ready)ready=fetch('/news?format=json',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw Error();return r.json();}).then(function(d){if(!d.items?.length)throw Error();return d.items;}).catch(function(){return fetch(BASE+'data/news.json?v='+Math.floor(Date.now()/120000)).then(function(r){return r.json();});});return ready;}
function scan(){document.querySelectorAll('[data-su-news]:not([data-news-loaded])').forEach(function(el){
 el.dataset.newsLoaded='true';load().then(function(items){if(!el.isConnected)return;var sidebar=el.dataset.suNews==='sidebar';
 el.innerHTML='<div class="su-news-heading"><div><p class="su-club-eyebrow">From the Club</p><h2>Recent News</h2></div><a href="/news">All News <span aria-hidden="true">›</span></a></div><div class="su-news-feed '+(sidebar?'su-news-feed-sidebar':'su-news-feed-footer')+'">'+items.slice(0,4).map(function(p){var dt=new Date(p.publishOn||p.addedOn),date=isNaN(dt)?'':dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});return '<a class="su-story-card" href="'+esc(p.fullUrl)+'">'+(p.assetUrl?'<div class="su-story-image"><img src="'+esc(p.assetUrl)+'?format=750w" alt="" loading="lazy"></div>':'')+'<div class="su-story-copy"><p><span>'+esc(p.categories?.[0]||'News')+'</span><time>'+date+'</time></p><h3>'+esc(p.title)+'</h3><span class="su-story-read">Read Story <b aria-hidden="true">›</b></span></div></a>';}).join('')+'</div>';
 }).catch(function(){el.innerHTML='<a class="su-club-btn su-recap-btn" href="/news">Read the Latest Club News</a>';});
 });}
window.SUNews={scan:scan};new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});scan();
})();
