/* Presentation only: Squarespace remains the cart and checkout authority. */
(function(){
 'use strict';
 if(window.SUNativeCommerce)return;window.SUNativeCommerce=true;
 var embedded=window.parent!==window&&new URLSearchParams(location.search).get('suCart')==='1';
 if(embedded)document.documentElement.classList.add('su-cart-embedded');
 var svg=function(path){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>';};
 var drawer,returnFocus,previousOverflow;
 function openCart(){
  if(embedded)return;
  if(drawer&&drawer.open)return;
  returnFocus=document.activeElement;
  var menu=document.querySelector('.header-burger-btn.burger--active');if(menu)menu.click();
  drawer=document.createElement('dialog');drawer.className='su-native-cart-drawer';drawer.setAttribute('aria-label','Shopping cart');
  var top=document.createElement('div');top.className='su-cart-drawer-top';top.innerHTML='<span>Wear the Colors</span><button type="button" aria-label="Close shopping cart">'+svg('m6 6 12 12M18 6 6 18')+'</button>';
  var frame=document.createElement('iframe');frame.title='Your shopping cart';frame.src='/cart?suCart=1';
  drawer.append(top,frame);document.body.append(drawer);
  function close(){drawer.close();}
  top.querySelector('button').addEventListener('click',close);
  drawer.addEventListener('click',function(e){if(e.target===drawer){var r=drawer.getBoundingClientRect();if(e.clientX<r.left)close();}});
  drawer.addEventListener('close',function(){document.body.style.overflow=previousOverflow;drawer.remove();drawer=null;if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});});
  previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';drawer.showModal();top.querySelector('button').focus();
 }
 function scan(){
  document.querySelectorAll('.product-gallery-carousel-control:not([data-su-chevron])').forEach(function(button){button.dataset.suChevron='1';button.innerHTML=svg(button.classList.contains('product-gallery-prev')?'m14 6-6 6 6 6':'m10 6 6 6-6 6');});
  document.querySelectorAll('.su-nav-cart').forEach(function(a){if(a.getAttribute('href')!=='/cart')a.setAttribute('href','/cart');});
  if(embedded)document.querySelectorAll('#sqs-cart-container a').forEach(function(a){if(a.target!=='_top')a.target='_top';});
 }
 document.addEventListener('click',function(e){
  if(embedded||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button>0)return;
  var a=e.target.closest('a'),view=e.target.closest('.commerce-mini-cart-view-cart-button');
  if(view){e.preventDefault();e.stopImmediatePropagation();var close=document.querySelector('.commerce-mini-cart-close-button');if(close)close.click();openCart();return;}
  if(!a)return;var url;try{url=new URL(a.href,location.href);}catch(_){return;}
  if(url.origin===location.origin&&(url.pathname==='/cart'||a.classList.contains('su-nav-cart'))&&location.pathname!=='/cart'){
   e.preventDefault();e.stopImmediatePropagation();openCart();
  }
 },true);
 new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});scan();
})();
