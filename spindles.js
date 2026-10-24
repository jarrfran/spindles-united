/* Spindles United FC — page loader
   Finds every <div data-su="name"></div> on the Squarespace page, loads
   pages/name.html from GitHub Pages into it, then runs that page's behavior. */
(function () {
  var BASE = document.currentScript && document.currentScript.src
    ? new URL('.', document.currentScript.src).href
    : 'https://jarrfran.github.io/spindles-united/';
  var V = Math.floor(Date.now() / 12e4) + '-26'; // changes every 2 minutes, so edits show up fast
  var uiScript=document.createElement('script');uiScript.src=BASE+'ui.js?v='+V;document.head.appendChild(uiScript);
  var newsScript=document.createElement('script');newsScript.src=BASE+'news.js?v='+V;document.head.appendChild(newsScript);
  var IMG = 'https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/';

  var archiveReady, archiveBase;
  function getClubArchive(force) {
    if (!archiveReady) archiveReady = Promise.all([
      fetch(BASE+'data/club.json?v='+V).then(function(r){if(!r.ok)throw new Error('Archive unavailable');return r.json();}),
      new Promise(function(resolve){var script=document.createElement('script');script.src=BASE+'sheet-archive.js?v='+V;script.onload=function(){resolve(window.SUSheetArchive);};script.onerror=function(){resolve(null);};document.head.appendChild(script);})
    ]).then(function(values){archiveBase=values[0];return values[1];});
    return archiveReady.then(function(api){return api?api.load(archiveBase,force):archiveBase;});
  }
  window.SUGetClubArchive=getClubArchive;

  /* 2026 schedule (from /schedule): date -> [opponent, spindles goals, opponent goals, home?, competition, kickoff] */
  var SCHED = {"2026-05-17": ["Mohawk City FC", 0, 1, false, "UPL Matchweek 1", "Sun, May 17 · 6pm"], "2026-05-22": ["Collar City FC", 0, 1, false, "UPL Matchweek 2", "Fri, May 22 · 7pm"], "2026-05-29": ["Patroon United", 1, 0, true, "UPL Matchweek 3", "Fri, May 29 · 7:15pm"], "2026-06-07": ["United Soccer Group", 1, 0, true, "UPL Matchweek 4", "Sun, Jun 7 · 6pm"], "2026-06-14": ["Sacandaga Lakers", 3, 2, false, "UPL Matchweek 5", "Sun, Jun 14 · 2pm"], "2026-06-19": ["Mohawk City FC", 1, 2, true, "UPL Matchweek 6", "Fri, Jun 19 · 7:15pm"], "2026-06-28": ["Collar City FC", 1, 1, true, "UPL Matchweek 7", "Sun, Jun 28 · 6pm"], "2026-07-12": ["Patroon United", 4, 1, false, "UPL Matchweek 8", "Sun, Jul 12 · 4pm"], "2026-07-17": ["United Soccer Group", 2, 2, false, "UPL Matchweek 9", "Fri, Jul 17 · 6:30pm"], "2026-07-26": ["Sacandaga Lakers", 5, 0, true, "UPL Matchweek 10", "Sun, Jul 26 · 6pm"], "2026-08-02": ["United Soccer Group", 2, 0, true, "UPL Semi-Final", "Sun, Aug 2 · 4pm"], "2026-08-09": ["Patroon United", 2, 0, true, "UPL Final", "Sun, Aug 9 · 6pm"]};
  /* team -> [short name, crest] */
  var TEAMS = {"Spindles United": ["Spindles", "cbc79c09-185c-45df-b925-f429573953b9/Full-logo-new.png"], "Mohawk City FC": ["Mohawk City", "92d88561-7c3f-4f10-854b-e4e021f05d17/mohawk-low.png"], "Collar City FC": ["Collar City", "8e857a58-a781-4ec8-b1bc-fadc67a44d99/collar-low.png"], "Patroon United": ["Patroon", "3788360b-37f3-41aa-9052-88e7648bc80a/patroon-low.png"], "United Soccer Group": ["USG", "bdfd0d5b-433f-4129-aebe-5ff0a86df3ad/usg-low.png"], "Sacandaga Lakers": ["Lakers", "58224db6-2b8e-4c64-9f5d-8a231961c0d8/lakers-low.png"]};
  /* Short hero headlines per post; the full blog title shows underneath */
  var SHORT = {"/news/8-9-2026-match": "Champions of Upstate", "/news/8-2-2026-match": "Back in the Final", "/news/7-26-2026-match": "Five Past the Lakers", "/news/7-17-2026-match": "A Point in the Push", "/news/7-12-2026-match": "Four Past the Leaders", "/news/6-28-2026-match": "Points Shared at Home", "/news/6-19-2026-match": "First Home Defeat", "/news/6-14-2026-match": "Last-Minute Winner", "/news/6-7-2026-match": "Another 1–0 at Home", "/news/5-29-2026-match": "Nine Men, First Win", "/news/5-22-2026-match": "Battle Across the Hudson", "/news/5-17-2026-match": "A Tough UPL Debut"};

  var esc = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function slugDate(url) {
    var m = /\/news\/(\d+)-(\d+)-(\d{4})-match/.exec(url || '');
    if (!m) return null;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return m[3] + '-' + p(+m[1]) + '-' + p(+m[2]);
  }
  function teamHTML(name, cls) {
    var t = TEAMS[name];
    return '<span class="' + cls + '"><img src="' + IMG + t[1] + '?format=300w" alt=""><span>' + esc(t[0]) + '</span></span>';
  }
  /* Match widget for a recap slide — mirrors match_widget() in build.py */
  function mwHTML(date) {
    var m = SCHED[date];
    if (!m) return '';
    var opp = m[0], us = m[1], them = m[2], home = m[3];
    var res = us > them ? 'W' : us === them ? 'D' : 'L';
    var hn = home ? 'Spindles United' : opp, an = home ? opp : 'Spindles United';
    var hg = home ? us : them, ag = home ? them : us;
    return '<aside class="su-mw" aria-label="' + esc(m[4]) + ': ' + esc(TEAMS[hn][0]) + ' ' + hg + ', ' + esc(TEAMS[an][0]) + ' ' + ag + '">' +
      '<p class="su-mw-comp"><span>' + esc(m[4]) + '</span><span class="su-res su-res-' + res.toLowerCase() + '">' + res + '</span></p>' +
      '<div class="su-mw-row">' + teamHTML(hn, 'su-mw-team') + '<span class="su-mw-score">' + '<span>' + hg + '</span><i aria-hidden="true"></i><span>' + ag + '</span></span>' + teamHTML(an, 'su-mw-team') + '</div>' +
      '<p class="su-mw-foot">' + esc(m[5]) + ' · ' + (home ? 'vs ' : 'at ') + esc(opp) + '</p></aside>';
  }
  /* Short hero headline: hand-written if listed, otherwise built from the match result — mirrors short_title() in build.py */
  function shortTitle(url, title) {
    var path = (url || '').replace(/^https?:\/\/[^/]+/, '');
    if (SHORT[path]) return SHORT[path];
    var m = SCHED[slugDate(path)];
    if (m) {
      var o = TEAMS[m[0]][0];
      if (m[1] > m[2]) return 'Win over ' + o;
      if (m[1] === m[2]) return 'Draw ' + (m[3] ? 'with ' : 'at ') + o;
      return 'Defeat ' + (m[3] ? 'to ' : 'at ') + o;
    }
    return title;
  }
  function fmtDate(p) {
    return new Date(p.publishOn || p.addedOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* ---------- Hero carousel ---------- */
  function heroCarousel(hero) {
    var slidesBox = hero.querySelector('#su-slides');
    var dotsBox = hero.querySelector('#su-dots');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var idx = 0, paused = reduce, hover = false;

    function slides() { return slidesBox.querySelectorAll('.su-slide'); }
    function dots() { return dotsBox.querySelectorAll('.su-dot'); }
    function setPaused(p) {
      paused = p;
      hero.classList.toggle('is-paused', paused || hover);
      var b = hero.querySelector('[data-hero="pause"]');
      if (b) b.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    }
    function go(n) {
      var s = slides(), d = dots();
      if (!s.length) return;
      idx = (n + s.length) % s.length;
      s.forEach(function (el, i) {
        var on = i === idx;
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
        el.querySelectorAll('a').forEach(function (a) { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
      });
      d.forEach(function (el, i) {
        el.classList.remove('is-active');
        if (i === idx) { void el.offsetWidth; el.classList.add('is-active'); el.setAttribute('aria-current', 'true'); }
        else el.removeAttribute('aria-current');
      });
    }
    /* Autoplay is driven by the progress-bar animation: when it finishes, advance. */
    dotsBox.addEventListener('animationend', function (ev) {
      if (ev.target.classList.contains('su-dot-fill') && !paused) go(idx + 1);
    });
    dotsBox.addEventListener('click', function (ev) {
      var b = ev.target.closest('.su-dot'); if (!b) return;
      go(Array.prototype.indexOf.call(dots(), b));
    });
    hero.querySelector('[data-hero="prev"]').addEventListener('click', function () { go(idx - 1); });
    hero.querySelector('[data-hero="next"]').addEventListener('click', function () { go(idx + 1); });
    var pauseBtn = hero.querySelector('[data-hero="pause"]');
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    hero.addEventListener('focusin', function () { hover = true; setPaused(paused); });
    hero.addEventListener('focusout', function (ev) { if (!hero.contains(ev.relatedTarget)) { hover = false; setPaused(paused); } });
    hero.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowLeft') go(idx - 1);
      if (ev.key === 'ArrowRight') go(idx + 1);
    });
    var x0 = null;
    hero.addEventListener('touchstart', function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (ev) {
      if (x0 == null) return;
      var dx = ev.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) go(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
    document.addEventListener('visibilitychange', function () { hero.classList.toggle('is-hidden', document.hidden); });

    setPaused(paused);
    go(0);

    return {
      /* Replace slides with the newest posts from the News blog */
      render: function (posts) {
        var n = posts.length;
        slidesBox.innerHTML = posts.map(function (p, i) {
          var cat = (p.categories && p.categories[0]) || 'News';
          var photo = p.assetUrl ? '<img class="su-slide-img" src="' + p.assetUrl + '?format=2500w" alt=""' + (i ? ' loading="lazy"' : '') + '>' : '';
          return '<article class="su-slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + n + '">' + photo +
            '<div class="su-slide-inner su-wrap"><div class="su-slide-copy">' +
            '<p class="su-slide-meta"><span class="su-tag">' + esc(cat) + '</span><time>' + fmtDate(p) + '</time></p>' +
            '<h2 class="su-slide-title"><a href="' + p.fullUrl + '">' + esc(shortTitle(p.fullUrl, p.title)) + '</a></h2>' +
            '<p class="su-slide-sub">' + esc(p.title) + '</p>' +
            '<div class="su-hero-actions"><a class="su-btn su-btn-solid" href="' + p.fullUrl + '">Read the recap ' + ARROW + '</a></div>' +
            '</div>' + mwHTML(slugDate(p.fullUrl)) + '</div></article>';
        }).join('');
        dotsBox.innerHTML = posts.map(function (p, i) {
          return '<button class="su-dot" type="button" aria-label="Story ' + (i + 1) + ': ' + esc(shortTitle(p.fullUrl, p.title)) + '"><span class="su-dot-fill"></span></button>';
        }).join('');
        go(0);
      }
    };
  }

  /* Native horizontal scrolling plus gentle automatic movement. */
  function initTicker(root) {
    var viewport = root.querySelector('.su-tk-viewport');
    if (!viewport) return;
    var track = viewport.querySelector('.su-tk-track');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var holdUntil = 0, down = false, drag = false, startX = 0, startScroll = 0, previous = 0, autoCarry = 0;
    function hold() { holdUntil = performance.now() + 1400; }
    function cycleWidth() { var list = track.querySelector('.su-tk-list'); return list ? list.offsetWidth : 0; }
    function normalize() {
      var width = cycleWidth();
      if (width && viewport.scrollLeft >= width) viewport.scrollLeft -= width;
    }
    viewport.addEventListener('pointerdown', function (e) {
      down = true; drag = false; startX = e.clientX; startScroll = viewport.scrollLeft; hold();
    });
    window.addEventListener('pointermove', function (e) {
      if (!down || e.pointerType !== 'mouse') return;
      if (Math.abs(e.clientX - startX) > 5) drag = true;
      if (drag) { e.preventDefault(); viewport.scrollLeft = startScroll + startX - e.clientX; hold(); }
    });
    function release() { if (down) { down = false; hold(); } }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    viewport.addEventListener('wheel', hold, { passive: true });
    viewport.addEventListener('scroll', function () {
      if (down || performance.now() < holdUntil) hold();
      normalize();
    }, { passive: true });
    viewport.addEventListener('click', function (e) { if (drag) { e.preventDefault(); drag = false; } }, true);
    viewport.addEventListener('dragstart', function (e) { e.preventDefault(); });
    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault(); hold();
        if (e.key === 'ArrowLeft' && viewport.scrollLeft < 202) viewport.scrollLeft += cycleWidth();
        viewport.scrollLeft += e.key === 'ArrowRight' ? 202 : -202;
      }
    });
    function frame(now) {
      if (!root.isConnected) return;
      var dt = previous ? Math.min((now - previous) / 1000, .05) : 0; previous = now;
      if (!reduce && !document.hidden && !down && now > holdUntil) {
        autoCarry += dt * 18;
        var pixels = Math.floor(autoCarry);
        if (pixels) { viewport.scrollLeft += pixels; autoCarry -= pixels; }
        normalize();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /* A year-neutral data file keeps results newest-first across seasons. */
    getClubArchive().then(function (data) {
      var matches=Object.keys(data.schedules).flatMap(function(y){return data.schedules[y].matches.map(function(m){return Object.assign({},m,{url:m.scheduleUrl});});});
      if (!Array.isArray(matches) || !matches.length) return;
      matches.sort(function (a, b) { return b.date.localeCompare(a.date); });
      var html = matches.map(function (m) {
        var d = new Date(m.date + 'T12:00:00');
        var label = m.note || m.competition.replace(/UPL |CDSL /g, '').replace('Matchweek ', 'MW ');
        var winner = m.winner || (m.homeScore != null && m.awayScore != null && m.homeScore !== m.awayScore ? (m.homeScore > m.awayScore ? 'home' : 'away') : null);
        function row(side) {
          return '<span class="su-tk-team' + (winner && winner !== side ? ' is-loser' : '') + '" data-side="' + side + '"><span class="su-tk-name">' + esc(m[side]) + '</span><img src="' + esc(m[side + 'Crest']) + '?format=100w" alt=""><b class="su-tk-goals">' + esc(m[side + 'Score'] == null ? '–' : m[side + 'Score']) + '</b></span>';
        }
        var spoken = m.homeScore == null ? 'No contest' : m.home + ' ' + m.homeScore + ', ' + m.away + ' ' + m.awayScore;
        return '<a class="su-tk-item" href="' + esc(m.url) + '" aria-label="' + esc(spoken + '. ' + (m.note || '')) + '"><span class="su-tk-card-head"><time datetime="' + esc(m.date) + '">' + d.toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) + '</time><span>' + esc(label) + '</span></span><span class="su-tk-match">' + row('home') + row('away') + '</span></a>';
      }).join('');
      if (down || performance.now() < holdUntil) return; // do not jump during an active swipe
      track.innerHTML = '<div class="su-tk-list">' + html + '</div><div class="su-tk-list" aria-hidden="true">' + html.replace(/<a /g, '<a tabindex="-1" ') + '</div>';
      viewport.scrollLeft = 0;
    }).catch(function () { /* retain verified static results */ });
  }

  var hlsReady;
  function getHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (!hlsReady) hlsReady = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
      script.onload = function () { window.Hls ? resolve(window.Hls) : reject(); };
      script.onerror = reject; document.head.appendChild(script);
    });
    return hlsReady;
  }
  function initStatVideos(root) {
    var videos = root.querySelectorAll('.su-stat-video');
    if (!videos.length || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var epoch = performance.now() / 1000;
    function play(video) {
      if (!video._suVisible || document.hidden) return;
      var offset = +video.getAttribute('data-offset');
      if (Number.isFinite(video.duration) && video.duration > 1) {
        try { video.currentTime = (performance.now() / 1000 - epoch + offset) % video.duration; } catch (e) {}
      }
      video.play().catch(function () {});
    }
    function start(video) {
      if (video.dataset.started) { if (video.readyState >= 1) play(video); return; }
      video.dataset.started = '1';
      video.preload = 'auto';
      video.addEventListener('loadedmetadata', function () { play(video); });
      var source = video.getAttribute('data-hls');
      if (!window.MediaSource && video.canPlayType('application/vnd.apple.mpegurl')) { video.src = source; video.load(); return; }
      getHls().then(function (Hls) {
        if (!root.isConnected || !Hls.isSupported()) return;
        var hls = new Hls({startPosition:+video.getAttribute('data-offset'),capLevelToPlayerSize:true,maxBufferLength:8,maxMaxBufferLength:16,startLevel:0});
        video._suHls = hls; hls.loadSource(source); hls.attachMedia(video);
      }).catch(function () { /* retain the video's poster */ });
    }
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target; v._suVisible = entry.isIntersecting;
          if (entry.isIntersecting) { if (v._suHls) v._suHls.startLoad(); start(v); }
          else { v.pause(); if (v._suHls) v._suHls.stopLoad(); }
        });
      }, {threshold:.08});
      videos.forEach(function (v) { observer.observe(v); });
    } else videos.forEach(function (v) { v._suVisible = true; start(v); });
    document.addEventListener('visibilitychange', function () {
      videos.forEach(function (v) { if (document.hidden) v.pause(); else if (v._suVisible) play(v); });
    });
  }

  /* ---------- Per-page behavior ---------- */
  var INIT = {
    home: function (el) {
      var root = el.querySelector('.su-home');
      if (!root) return;

      /* Let the hero fill the screen below the Squarespace header */
      var header = document.querySelector('header#header, header');
      /* Match the content width to the Squarespace nav bar: whatever width is set for the
         header in Squarespace, every section lines up with the logo on the left and the
         Store button on the right. */
      var setHeader = function () {
        root.style.setProperty('--su-header', (header ? header.offsetHeight : 0) + 'px');
        var inner = header && (header.querySelector('.header-display-desktop .header-inner') || header.querySelector('.header-inner'));
        var r = inner && inner.getBoundingClientRect();
        if (r && r.width > 600) {
          root.style.setProperty('--su-content', Math.round(r.width) + 'px');
          root.style.setProperty('--su-gutter', Math.max(16, Math.round(r.left)) + 'px');
        } else {
          root.style.removeProperty('--su-content');
          root.style.removeProperty('--su-gutter');
        }
      };
      setHeader(); window.addEventListener('resize', setHeader);

      initTicker(root);
      initStatVideos(root);

      var hero = root.querySelector('#su-hero');
      var carousel = hero ? heroCarousel(hero) : null;
      if(hero)getClubArchive().then(function(archive){
        function updateHero(){
          hero.querySelectorAll('.su-slide').forEach(function(slide){
            var recap=slide.querySelector('.su-slide-copy .su-btn:not(.su-hero-watch)'),widget=slide.querySelector('.su-mw');
            if(!recap)return;
            if(!recap.parentElement.classList.contains('su-hero-actions')){var actions=document.createElement('div');actions.className='su-hero-actions';recap.before(actions);actions.appendChild(recap);}
            recap.classList.remove('su-btn-solid');recap.classList.add('su-btn-line');
            var dt=slugDate(recap.getAttribute('href')),match;
            Object.keys(archive.schedules).some(function(y){match=archive.schedules[y].matches.find(function(m){return m.date===dt;});return !!match;});
            if(!match)return;
            if(widget&&widget.tagName!=='A'){
              var link=document.createElement('a');link.className=widget.className;link.href=match.scheduleUrl||'/schedule?season='+dt.slice(0,4)+'#match-'+match.id;link.innerHTML=widget.innerHTML;link.setAttribute('aria-label','View match details: '+match.home+' vs '+match.away);if(widget.hasAttribute('tabindex'))link.tabIndex=widget.tabIndex;widget.replaceWith(link);
            }
            if(match.video&&!slide.querySelector('.su-hero-watch')){
              var watch=document.createElement('a');watch.className='su-btn su-btn-solid su-hero-watch';watch.href=match.video;watch.textContent='Watch the Stream';watch.target='_blank';watch.rel='noopener';if(slide.getAttribute('aria-hidden')==='true')watch.tabIndex=-1;recap.after(watch);
            }
          });
        }
        updateHero();new MutationObserver(updateHero).observe(hero.querySelector('#su-slides'),{childList:true});
      });

      /* --- Click-to-load YouTube (keeps the page fast) --- */
      root.querySelectorAll('.su-video[data-video]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var f = document.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + btn.getAttribute('data-video') + '?autoplay=1&rel=0';
          f.title = 'UPL Final live stream';
          f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          f.allowFullscreen = true;
          btn.innerHTML = '';
          btn.appendChild(f);
          btn.style.cursor = 'default';
        }, { once: true });
      });

      /* --- Carousel arrows for the horizontal rails --- */
      root.querySelectorAll('[data-rail-wrap]').forEach(function (wrap) {
        var rail = wrap.querySelector('.su-rail');
        if (!rail) return;
        wrap.querySelectorAll('[data-rail]').forEach(function (b) {
          b.addEventListener('click', function () {
            var dir = b.getAttribute('data-rail') === 'next' ? 1 : -1;
            rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: 'smooth' });
          });
        });
      });

      /* --- Hero (5 newest) + Latest news grid (next 4) from the Squarespace News blog --- */
      var grid = root.querySelector('#su-news-grid');
      if (!window.fetch) return;
      fetch('/news?format=json', { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (data) {
          var items = (data && data.items) || [];
          if (carousel && items.length >= 3) carousel.render(items.slice(0, 5));
          var rest = items.slice(5, 9);
          if (grid && rest.length) {
            grid.innerHTML = rest.map(function (p) {
              var cat = (p.categories && p.categories[0]) || 'News';
              var img = p.assetUrl ? '<img loading="lazy" src="' + p.assetUrl + '?format=750w" alt="">' : '';
              return '<a class="su-ncard" href="' + p.fullUrl + '"><div class="su-ncard-img">' + img + '</div>' +
                '<div class="su-ncard-body"><h3>' + esc(p.title) + '</h3>' +
                '<p class="su-meta"><span class="su-tag">' + esc(cat) + '</span><time>' + fmtDate(p) + '</time></p><span class="su-ncard-cta">Read story</span></div></a>';
            }).join('');
          }
        })
        .catch(function () { /* keep fallback items */ });
    }
  };

  /* Load archive behavior only on schedule and roster pages. */
  var clubModule;
  function initClubPage(name, el) {
    if (!clubModule) clubModule = new Promise(function(resolve,reject) {
      if (window.SUClubPages) { resolve(window.SUClubPages); return; }
      var script=document.createElement('script');script.src=BASE+'club-pages.js?v='+V;
      script.onload=function(){window.SUClubPages?resolve(window.SUClubPages):reject();};script.onerror=reject;document.head.appendChild(script);
    });
    clubModule.then(function(api){api[name](el);}).catch(function(){el.innerHTML='<p>Unable to load this page. Please refresh to try again.</p>';});
  }
  INIT.schedule=function(el){initClubPage('schedule',el);};
  INIT.roster=function(el){initClubPage('roster',el);};
  var recordModule;
  window.SUGetRecordBook=function(){
    if(!recordModule)recordModule=new Promise(function(resolve,reject){
      if(window.SURecordBook){resolve(window.SURecordBook);return;}
      var script=document.createElement('script');script.src=BASE+'record-book.js?v='+V;
      script.onload=function(){window.SURecordBook?resolve(window.SURecordBook):reject();};script.onerror=reject;document.head.appendChild(script);
    });return recordModule;
  };
  INIT.stats=function(el){window.SUGetRecordBook().then(function(api){api.stats(el);});};

  INIT.seasons=function(el){var script=document.createElement('script');script.src=BASE+'seasons.js?v='+V;script.onload=function(){window.SUSeasons(el);};document.head.appendChild(script);};

  INIT.footer=function(el){var year=el.querySelector('.su-footer-year');if(year)year.textContent=new Date().getFullYear();};

  INIT.contact=function(el){
    if(window.SUContact){window.SUContact(el,getHls);return;}
    var script=document.createElement('script');script.src=BASE+'contact.js?v='+V;
    script.onload=function(){if(window.SUContact)window.SUContact(el,getHls);};
    document.head.appendChild(script);
  };

  /* ---------- Loader ---------- */
  function load(el) {
    var name = el.getAttribute('data-su');
    if (!name || el.getAttribute('data-su-loaded')) return;
    el.setAttribute('data-su-loaded', '1');
    fetch(BASE + 'pages/' + name + '.html?v=' + V)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        el.innerHTML = html;
        if (INIT[name]) { try { INIT[name](el); } catch (e) { console.warn('Spindles:', name, e); } }
      })
      .catch(function (e) { console.warn('Spindles: could not load page "' + name + '"', e); });
  }
  function scan() {
    if(location.pathname.replace(/\/$/,'')==='/stats'&&!document.querySelector('[data-su="stats"]')){
      var legacy=document.getElementById('suf');
      if(legacy){legacy.hidden=true;legacy.style.setProperty('display','none','important');var fresh=document.createElement('div');fresh.setAttribute('data-su','stats');legacy.before(fresh);}
    }
    document.querySelectorAll('[data-su]').forEach(load);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  window.addEventListener('mercury:load', scan); // Squarespace in-site navigation
})();
