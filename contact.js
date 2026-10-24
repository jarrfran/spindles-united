/* Style the first native Squarespace form below this block, without moving or rebuilding it. */
(function () {
  window.SUContact = function (el, getHls) {
    var root=el.querySelector('.su-contact-page');if(!root)return;
    var current=null,section=null,frame=0,host=null,film=null,stopFilm=null,autoReasonApplied=false;
    function align(){var h=document.querySelector('header .header-display-desktop .header-inner,header .header-inner');if(h){var b=h.getBoundingClientRect();if(b.width>600){root.style.setProperty('--su-content',Math.round(b.width)+'px');root.style.setProperty('--su-gutter',Math.max(16,Math.round(b.left))+'px');}}}
    function clear(){if(stopFilm)stopFilm();if(film)film.remove();if(host)host.classList.remove('su-contact-form-host','su-contact-sent');if(current){current.classList.remove('su-contact-native','su-contact-with-film','su-contact-sent');if(current.dataset.suContactId==='1'){current.removeAttribute('id');delete current.dataset.suContactId;}}if(section)section.classList.remove('su-contact-form-section','su-contact-sent');current=null;section=null;host=null;film=null;stopFilm=null;}
    function confirmation(){
      if(!current)return;
      var native=Array.from(current.querySelectorAll('.form-submission-text,.form-submission-html,.form-submission-message')).find(function(node){return node.textContent.trim()&&!node.hidden&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden'&&node.getClientRects().length;});
      if(!native)return;
      if(!native.dataset.suConfirmation){
        native.dataset.suConfirmation='true';
        native.setAttribute('role','status');native.setAttribute('aria-live','polite');native.setAttribute('tabindex','-1');
        native.innerHTML='<div class="su-contact-confirmation"><span class="su-contact-confirmation-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><p class="su-club-eyebrow">Thanks for Reaching Out</p><h2>Message received.</h2><p>Your message is with the club. We will get back to you using the email address you provided.</p><a class="su-club-btn su-recap-btn" href="/">Back to the Club</a></div>';
      }
      if(current.classList.contains('su-contact-sent'))return;
      current.classList.add('su-contact-sent');if(host)host.classList.add('su-contact-sent');if(section)section.classList.add('su-contact-sent');
      requestAnimationFrame(function(){if(!native.isConnected)return;native.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});native.focus({preventScroll:true});});
    }
    function preselect(){
      if(autoReasonApplied||!current||new URLSearchParams(location.search).get('reason')!=='sponsor')return;
      var choice=Array.from(current.querySelectorAll('input[type="radio"],input[type="checkbox"]')).find(function(input){var label=input.closest('label');if(!label&&input.id)label=Array.from(current.querySelectorAll('label')).find(function(l){return l.htmlFor===input.id;});return /sponsor/i.test((label?.textContent||'')+' '+input.value);});
      if(choice){autoReasonApplied=true;if(!choice.checked)choice.click();root.querySelector('[data-contact-reason="sponsor"]')?.classList.add('is-selected');}
    }
    function find(){
      frame=0;
      if(!el.isConnected){clear();observer.disconnect();window.removeEventListener('resize',resize);return;}
      var scope=el.closest('main,#page')||document.querySelector('main,#page')||document;
      if(current&&current.isConnected){confirmation();preselect();return;}
      var edge=el.getBoundingClientRect().bottom;
      var candidates=Array.prototype.filter.call(scope.querySelectorAll('.sqs-block-form,[data-sqsp-block="form"]'),function(b){
        if(b.closest('footer,#footer-sections,header,[data-su]'))return false;
        var box=b.getBoundingClientRect();
        return box.width>0&&box.height>0&&box.top>=edge-2;
      });
      candidates.sort(function(a,b){return a.getBoundingClientRect().top-b.getBoundingClientRect().top;});
      var next=candidates[0];
      if(next===current)return;
      clear();if(!next)return;
      current=next;current.classList.add('su-contact-native','su-contact-with-film');
      if(!current.id){current.id='su-contact-form';current.dataset.suContactId='1';}
      root.querySelectorAll('[data-contact-reason]').forEach(function(a){a.href='#'+current.id;});
      host=current.closest('.fe-block');if(host)host.classList.add('su-contact-form-host');
      film=document.createElement('aside');film.className='su-contact-film';film.setAttribute('aria-label','Scenes from Spindles United');
      film.innerHTML='<img src="https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/ecd034a2-dd1d-4566-a4b4-b760fc636ffd/8-9-2026-match-114.jpg?format=1500w" alt="Spindles United on matchday" loading="lazy">';
      current.appendChild(film);
      var s=next.closest('.page-section,section[data-section-id]');
      if(s&&!s.contains(el)){section=s;section.classList.add('su-contact-form-section');}
      confirmation();preselect();
    }
    root.addEventListener('click',function(e){
      var link=e.target.closest('[data-contact-reason]');if(!link||!current||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      e.preventDefault();var reason=link.dataset.contactReason;
      var choice=Array.prototype.find.call(current.querySelectorAll('input[type="radio"],input[type="checkbox"]'),function(input){var label=input.closest('label');if(!label&&input.id)label=Array.prototype.find.call(current.querySelectorAll('label'),function(l){return l.htmlFor===input.id;});return new RegExp(reason==='player'?'player':reason==='sponsor'?'sponsor':'volunteer','i').test((label?label.textContent:'')+' '+input.value);});
      if(choice&&!choice.checked)choice.click();
      root.querySelectorAll('[data-contact-reason]').forEach(function(a){a.classList.toggle('is-selected',a===link);});
      current.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      var focus=choice||current.querySelector('input:not([type="hidden"]):not([tabindex="-1"]),textarea,select');if(focus)focus.focus({preventScroll:true});
    });
    var observer=new MutationObserver(function(){if(!frame)frame=requestAnimationFrame(find);});
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
    function resize(){align();if(!frame)frame=requestAnimationFrame(find);}
    align();find();window.addEventListener('resize',resize);
  };
})();
