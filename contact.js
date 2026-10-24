/* Style the first native Squarespace form below this block, without moving or rebuilding it. */
(function () {
  function startFilm(panel,getHls){
    var v=panel.querySelector('video'),button=panel.querySelector('button'),index=0,hls=null,visible=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,dead=false;
    var base='https://video.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/';
    var clips=['8be1e7ba-8df6-4aae-be3d-07f017cfdf37/','7f0692da-669c-43ed-a2ff-0b5804494f7d/'];
    function label(){button.textContent=paused?'Play video':'Pause video';button.setAttribute('aria-label',paused?'Play club videos':'Pause club videos');}
    function play(){if(v.readyState<1)return;if(visible&&!paused&&!document.hidden)v.play().catch(function(){paused=true;label();});else v.pause();}
    function source(){v.poster=base+clips[index]+'thumbnail';var url=base+clips[index]+'playlist.m3u8';if(!window.MediaSource&&v.canPlayType('application/vnd.apple.mpegurl')){v.src=url;v.load();}else if(getHls)getHls().then(function(Hls){if(dead||!Hls.isSupported())return;if(hls)hls.destroy();hls=new Hls({capLevelToPlayerSize:true,maxBufferLength:12});hls.loadSource(url);hls.attachMedia(v);}).catch(function(){});}
    v.muted=true;v.addEventListener('loadedmetadata',play);v.addEventListener('ended',function(){index=(index+1)%clips.length;source();});
    v.poster=base+clips[0]+'thumbnail';var started=false;
    function start(){if(!started&&!paused){started=true;source();}play();}
    button.addEventListener('click',function(){paused=!paused;label();start();});
    var io=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;start();},{threshold:.05});io.observe(panel);
    function visibility(){play();}document.addEventListener('visibilitychange',visibility);label();
    return function(){dead=true;v.pause();io.disconnect();if(hls)hls.destroy();document.removeEventListener('visibilitychange',visibility);};
  }
  window.SUContact = function (el, getHls) {
    var root=el.querySelector('.su-contact-page');if(!root)return;
    var current=null,section=null,frame=0,host=null,film=null,stopFilm=null;
    function align(){var h=document.querySelector('header .header-display-desktop .header-inner,header .header-inner');if(h){var b=h.getBoundingClientRect();if(b.width>600){root.style.setProperty('--su-content',Math.round(b.width)+'px');root.style.setProperty('--su-gutter',Math.max(16,Math.round(b.left))+'px');}}}
    function clear(){if(stopFilm)stopFilm();if(film)film.remove();if(host)host.classList.remove('su-contact-form-host');if(current){current.classList.remove('su-contact-native','su-contact-with-film');if(current.dataset.suContactId==='1'){current.removeAttribute('id');delete current.dataset.suContactId;}}if(section)section.classList.remove('su-contact-form-section');current=null;section=null;host=null;film=null;stopFilm=null;}
    function find(){
      frame=0;
      if(!el.isConnected){clear();observer.disconnect();window.removeEventListener('resize',resize);return;}
      var scope=el.closest('main,#page')||document.querySelector('main,#page')||document;
      if(current&&current.isConnected)return;
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
      film.innerHTML='<video muted playsinline preload="metadata" aria-hidden="true"></video><button type="button" class="su-contact-film-toggle" aria-label="Play club videos">Play video</button>';
      current.appendChild(film);stopFilm=startFilm(film,getHls);
      var s=next.closest('.page-section,section[data-section-id]');
      if(s&&!s.contains(el)){section=s;section.classList.add('su-contact-form-section');}
    }
    root.addEventListener('click',function(e){
      var link=e.target.closest('[data-contact-reason]');if(!link||!current||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      e.preventDefault();var reason=link.dataset.contactReason;
      var choice=Array.prototype.find.call(current.querySelectorAll('input[type="radio"]'),function(input){var label=input.closest('label');if(!label&&input.id)label=Array.prototype.find.call(current.querySelectorAll('label'),function(l){return l.htmlFor===input.id;});return new RegExp(reason==='player'?'player':reason==='sponsor'?'sponsor':'volunteer','i').test((label?label.textContent:'')+' '+input.value);});
      if(choice)choice.click();
      root.querySelectorAll('[data-contact-reason]').forEach(function(a){a.classList.toggle('is-selected',a===link);});
      current.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      var focus=choice||current.querySelector('input:not([type="hidden"]):not([tabindex="-1"]),textarea,select');if(focus)focus.focus({preventScroll:true});
    });
    var observer=new MutationObserver(function(){if(!frame)frame=requestAnimationFrame(find);});
    observer.observe(document.body,{childList:true,subtree:true});
    function resize(){align();if(!frame)frame=requestAnimationFrame(find);}
    align();find();window.addEventListener('resize',resize);
  };
})();
