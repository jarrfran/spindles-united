/* Presentation only: Squarespace remains the cart and checkout authority. */
(function(){
 'use strict';
 if(window.SUNativeCommerce)return;window.SUNativeCommerce=true;
 var embedded=window.parent!==window&&new URLSearchParams(location.search).get('suCart')==='1';
 if(embedded)document.documentElement.classList.add('su-cart-embedded');
 var svg=function(path){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>';};
 var drawer,returnFocus,previousOverflow,bar,count=0,lastNative=null,handledMini=new WeakSet();
 var cartSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.58L22 7H5.12"/></svg>';
 try{count=Math.max(0,Number(localStorage.getItem('su-native-cart-count'))||0);}catch(_){}
 function updateCount(value){
  value=Math.max(0,Math.floor(Number(value)||0));count=value;
  try{if(localStorage.getItem('su-native-cart-count')!==String(value))localStorage.setItem('su-native-cart-count',String(value));}catch(_){}
  if(embedded)window.parent.postMessage({type:'su-native-cart-count',count:value},location.origin);
  updateBar();
 }
 function updateBar(){
  if(embedded)return;
  var main=document.querySelector('#page,#page-regions'),isStore=/^\/store(?:-1)?(?:\/|$)/.test(location.pathname);
  if(!bar&&main){
   bar=document.createElement('nav');bar.className='su-commerce-bar';bar.setAttribute('aria-label','Store and cart');
   bar.innerHTML='<div class="su-commerce-bar-inner"><a href="/store">'+svg('m14 6-6 6 6 6')+'<span>Back to the Store</span></a><a class="su-commerce-cart" href="/cart">'+cartSVG+'<span>Cart</span><span class="su-commerce-count" aria-hidden="true"></span></a></div>';
   main.before(bar);
  }
  if(!bar)return;
  bar.hidden=!(isStore||count>0);
  var show=!bar.hidden;if(main&&main.classList.contains('su-commerce-offset')!==show)main.classList.toggle('su-commerce-offset',show);
  var header=document.querySelector('#header');if(header)bar.style.top=header.getBoundingClientRect().height+'px';
  var badge=bar.querySelector('.su-commerce-count'),link=bar.querySelector('.su-commerce-cart');
  if(badge.textContent!==String(count))badge.textContent=String(count);
  badge.hidden=count===0;
  var label='Open cart, '+count+' '+(count===1?'item':'items');if(link.getAttribute('aria-label')!==label)link.setAttribute('aria-label',label);
 }
 window.addEventListener('message',function(e){if(e.origin===location.origin&&drawer&&e.source===drawer.querySelector('iframe').contentWindow&&e.data&&e.data.type==='su-native-cart-count')updateCount(e.data.count);});
 window.addEventListener('resize',updateBar);
 window.addEventListener('storage',function(e){if(e.key==='su-native-cart-count')updateCount(e.newValue);});
 function openCart(){
  if(embedded)return;
  if(drawer&&drawer.open)return;
  returnFocus=document.activeElement;
  var menu=document.querySelector('.header-burger-btn.burger--active');if(menu)menu.click();
  drawer=document.createElement('dialog');drawer.className='su-native-cart-drawer';drawer.setAttribute('aria-label','Shopping cart');
  var top=document.createElement('div');top.className='su-cart-drawer-top';top.innerHTML='<span>Wear the Colors</span><button type="button" aria-label="Close shopping cart">'+svg('m6 6 12 12M18 6 6 18')+'</button>';
  var frame=document.createElement('iframe');frame.title='Your shopping cart';frame.src='/cart?suCart=1';frame.style.visibility='hidden';var loading=document.createElement('div');loading.className='su-cart-loading';loading.setAttribute('role','status');loading.textContent='Opening your cart…';frame.addEventListener('load',function(){frame.style.visibility='visible';loading.remove();});
  drawer.append(top,loading,frame);document.body.append(drawer);
  function close(){drawer.close();}
  top.querySelector('button').addEventListener('click',close);
  drawer.addEventListener('click',function(e){if(e.target===drawer){var r=drawer.getBoundingClientRect();if(e.clientX<r.left)close();}});
  drawer.addEventListener('close',function(){document.body.style.overflow=previousOverflow;drawer.remove();drawer=null;if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});});
  previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';drawer.showModal();top.querySelector('button').focus();
 }
 function scan(){
  document.querySelectorAll('.product-gallery-carousel-control:not([data-su-chevron])').forEach(function(button){button.dataset.suChevron='1';button.innerHTML=svg(button.classList.contains('product-gallery-prev')?'m14 6-6 6 6 6':'m10 6 6 6-6 6');});
  document.querySelectorAll('.su-nav-cart').forEach(function(a){a.remove();});
  var quantity=document.querySelector('.sqs-cart-initialized .sqs-cart-quantity');
  if(quantity&&/^\d+$/.test(quantity.textContent.trim())){var nativeCount=Number(quantity.textContent.trim());if(lastNative!==nativeCount){lastNative=nativeCount;updateCount(nativeCount);}}
  updateBar();
  if(!embedded){
   if(!document.body.classList.contains('su-commerce-ready'))document.body.classList.add('su-commerce-ready');
   document.querySelectorAll('.commerce-mini-cart-dialog:not(.open)').forEach(function(el){handledMini.delete(el);});
   var mini=document.querySelector('.commerce-mini-cart-dialog.open'),close=mini&&mini.querySelector('.commerce-mini-cart-close-button');
   if(mini&&close&&!handledMini.has(mini)){handledMini.add(mini);close.click();requestAnimationFrame(openCart);}
  }
  if(embedded)document.querySelectorAll('#sqs-cart-container a').forEach(function(a){if(a.target!=='_top')a.target='_top';});
 }
 document.addEventListener('click',function(e){
  if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button>0)return;
  if(embedded){var cartLink=e.target.closest('#sqs-cart-container a');if(cartLink){var destination=new URL(cartLink.href,location.href);if(destination.origin===location.origin){e.preventDefault();e.stopImmediatePropagation();window.top.location.href=destination.href;}}return;}
  var a=e.target.closest('a'),view=e.target.closest('.commerce-mini-cart-view-cart-button');
  if(view){e.preventDefault();e.stopImmediatePropagation();var close=document.querySelector('.commerce-mini-cart-close-button');if(close)close.click();openCart();return;}
  if(!a)return;var url;try{url=new URL(a.href,location.href);}catch(_){return;}
  if(url.origin===location.origin&&(url.pathname==='/cart'||a.classList.contains('su-nav-cart'))&&location.pathname!=='/cart'){
   e.preventDefault();e.stopImmediatePropagation();openCart();
  }
 },true);
 new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});scan();
})();
