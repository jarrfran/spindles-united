/* Style the first native Squarespace form below this block, without moving or rebuilding it. */
(function () {
  window.SUContact = function (el) {
    var root=el.querySelector('.su-contact-page');if(!root)return;
    var current=null,section=null,frame=0;
    function align(){var h=document.querySelector('header .header-display-desktop .header-inner,header .header-inner');if(h){var b=h.getBoundingClientRect();if(b.width>600){root.style.setProperty('--su-content',Math.round(b.width)+'px');root.style.setProperty('--su-gutter',Math.max(16,Math.round(b.left))+'px');}}}
    function clear(){if(current)current.classList.remove('su-contact-native');if(section)section.classList.remove('su-contact-form-section');current=null;section=null;}
    function find(){
      frame=0;
      if(!el.isConnected){clear();observer.disconnect();window.removeEventListener('resize',resize);return;}
      var scope=el.closest('main,#page')||document.querySelector('main,#page')||document;
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
      current=next;current.classList.add('su-contact-native');
      var s=next.closest('.page-section,section[data-section-id]');
      if(s&&!s.contains(el)){section=s;section.classList.add('su-contact-form-section');}
    }
    var observer=new MutationObserver(function(){if(!frame)frame=requestAnimationFrame(find);});
    observer.observe(document.body,{childList:true,subtree:true});
    function resize(){align();if(!frame)frame=requestAnimationFrame(find);}
    align();find();window.addEventListener('resize',resize);
  };
})();
