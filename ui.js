/* Shared progressive controls: animated disclosures and accessible season menus. */
(function(){
'use strict';
if(window.SUControls)return;window.SUControls=true;
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)'),motions=new WeakMap(),serial=0,active=null;
var stopViewHold=null;
window.SUKeepView=function(y){
 if(stopViewHold)stopViewHold();var until=performance.now()+500,frame=0,stopped=false,events=['wheel','touchstart','pointerdown','keydown'];
 function stop(){if(stopped)return;stopped=true;cancelAnimationFrame(frame);events.forEach(function(type){window.removeEventListener(type,stop,true);});if(stopViewHold===stop)stopViewHold=null;}
 function hold(){if(stopped)return;window.scrollTo(0,y);if(performance.now()<until)frame=requestAnimationFrame(hold);else stop();}
 stopViewHold=stop;events.forEach(function(type){window.addEventListener(type,stop,{capture:true,passive:true});});hold();
};
function move(card,want){
 var old=motions.get(card),start=card.getBoundingClientRect().height,summary=card.querySelector(':scope > summary');
 if(old)old.animation.cancel();
 if(!card.animate||reduce.matches){card.open=want;return;}
 card.open=true;var end=want?card.scrollHeight:summary.getBoundingClientRect().height+2;
 card.classList.toggle('su-is-closing',!want);
 var animation=card.animate([{height:start+'px'},{height:end+'px'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});
 motions.set(card,{animation:animation,want:want});
 animation.onfinish=function(){card.open=want;card.classList.remove('su-is-closing');motions.delete(card);animation.cancel();};
}
document.addEventListener('click',function(e){
 var summary=e.target.closest('.su-match-dropdown > summary,.su-record-section > summary');
 if(summary&&!e.target.closest('a,button,input')){
  e.preventDefault();var card=summary.parentElement,old=motions.get(card),want=old?!old.want:!card.open;
  if(want&&card.matches('.su-match-dropdown'))card.closest('[data-su]').querySelectorAll('.su-match-dropdown[open]').forEach(function(other){if(other!==card)move(other,false);});
  move(card,want);
 }
 if(active&&!active.contains(e.target))close();
});
function close(){if(!active)return;active.classList.remove('is-open');active.querySelector('button').setAttribute('aria-expanded','false');active=null;}
function enhance(select){
 if(select.dataset.suSelect||select.multiple||select.size>1)return;
 select.dataset.suSelect='true';
 var menuScrollY=scrollY;
 var wrap=document.createElement('span');wrap.className='su-select';select.before(wrap);wrap.appendChild(select);select.classList.add('su-select-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
 var button=document.createElement('button');button.type='button';button.className='su-select-trigger';button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',select.getAttribute('aria-label')||'Choose an option');button.disabled=select.disabled;
 var list=document.createElement('span');list.className='su-select-menu';list.id='su-options-'+(++serial);list.setAttribute('role','listbox');list.setAttribute('aria-label',button.getAttribute('aria-label'));button.setAttribute('aria-controls',list.id);
 wrap.append(button,list);
 function sync(){
  button.textContent=select.selectedOptions[0]?.textContent||'';
  var chevron=document.createElementNS('http://www.w3.org/2000/svg','svg');chevron.setAttribute('viewBox','0 0 24 24');chevron.innerHTML='<path d="m6 9 6 6 6-6"/>';button.appendChild(chevron);
  list.innerHTML='';Array.from(select.options).forEach(function(option,index){var item=document.createElement('span');item.className='su-select-option';item.id=list.id+'-'+index;item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.selected));item.textContent=option.text;item.dataset.index=index;item.setAttribute('aria-disabled',String(option.disabled));list.appendChild(item);});
 }
 function highlight(index){var items=list.children;index=Math.max(0,Math.min(items.length-1,index));Array.from(items).forEach(function(el,i){el.classList.toggle('is-highlighted',i===index);});button.dataset.highlight=index;button.setAttribute('aria-activedescendant',items[index].id);var top=items[index].offsetTop,bottom=top+items[index].offsetHeight;if(top<list.scrollTop)list.scrollTop=top;else if(bottom>list.scrollTop+list.clientHeight)list.scrollTop=bottom-list.clientHeight;}
 function open(){menuScrollY=scrollY;if(active!==wrap)close();active=wrap;wrap.classList.add('is-open');button.setAttribute('aria-expanded','true');highlight(select.selectedIndex);}
 function choose(index){if(select.options[index].disabled)return;select.selectedIndex=index;sync();close();button.focus({preventScroll:true});select.dispatchEvent(new Event('change',{bubbles:true}));if(window.SUKeepView)window.SUKeepView(menuScrollY);}
 button.addEventListener('click',function(){active===wrap?close():open();});
 button.addEventListener('keydown',function(e){
  if(['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(e.key))e.preventDefault();
  if(e.key==='Escape'){close();return;}
  if(e.key==='Tab'){close();return;}
  if(e.key==='Enter'||e.key===' '){active===wrap?choose(Number(button.dataset.highlight)):open();return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   if(active!==wrap)open();else highlight(e.key==='Home'?0:e.key==='End'?select.options.length-1:Number(button.dataset.highlight)+(e.key==='ArrowDown'?1:-1));
  }else if(e.key.length===1){var i=Array.from(select.options).findIndex(function(o){return o.text.toLowerCase().startsWith(e.key.toLowerCase());});if(i>=0){if(active!==wrap)open();highlight(i);}}
 });
 // Keep focus on the combobox until an option click has been handled.
 list.addEventListener('pointerdown',function(e){e.preventDefault();});
 list.addEventListener('click',function(e){var item=e.target.closest('[data-index]');if(item){e.preventDefault();choose(Number(item.dataset.index));}});
 wrap.addEventListener('focusout',function(e){if(!wrap.contains(e.relatedTarget))close();});
 select.addEventListener('change',sync);select.addEventListener('focus',function(){button.focus({preventScroll:true});});sync();if(document.activeElement===select)button.focus({preventScroll:true});
}
function dimTeams(){document.querySelectorAll('.su-club-match-teams,.su-result-teams,.su-mw-row,.su-mini-match').forEach(function(row){var teams=Array.from(row.querySelectorAll('.su-club-team,.su-rt,.su-mw-team,.su-mini-team')),score=row.querySelector('.su-club-score,.su-result-score,.su-mw-score,b'),v=score?Array.from(score.childNodes).map(function(n){return n.textContent.trim();}).filter(function(t){return /^\d+$/.test(t);}):[],winner=row.dataset.winner;if(!['home','away'].includes(winner)&&v?.length===2)winner=+v[0]>+v[1]?'home':+v[0]<+v[1]?'away':'';teams.forEach(function(t,i){t.classList.toggle('is-loser',!!winner&&winner!==(i===0?'home':'away'));});});}
function storeNavigation(){document.querySelectorAll('header a,#header a,.header-menu a').forEach(function(a){try{var u=new URL(a.getAttribute('href'),location.href);if(['spindlesunited.store','www.spindlesunited.store'].includes(u.hostname)&&u.pathname==='/'){a.setAttribute('href','/store');a.removeAttribute('target');a.removeAttribute('rel');}}catch(e){}});}
function navigationCart(){document.querySelectorAll('.header-display-desktop .header-actions-action--cta,.header-menu-cta').forEach(function(cta){if(cta.previousElementSibling&&cta.previousElementSibling.classList.contains('su-nav-cart'))return;var a=document.createElement('a');a.className='su-nav-cart';a.href='/store?cart=1';a.setAttribute('aria-label','Open shopping cart');a.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.58L22 7H5.12"/></svg>';cta.before(a);});}
document.addEventListener('click',function(e){var a=e.target.closest('.su-nav-cart');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;if(window.SUOpenCart&&document.querySelector('.su-store')){e.preventDefault();var menu=document.querySelector('button[aria-label="Close Menu"]');if(menu)menu.click();window.SUOpenCart();}});
function scan(){storeNavigation();navigationCart();dimTeams();document.querySelectorAll('.su-site select:not([data-su-select])').forEach(enhance);if(active&&!active.isConnected)close();}
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});scan();
})();
