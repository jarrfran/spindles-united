/* Spindles United FC — page loader
   Finds every <div data-su="name"></div> on the Squarespace page, loads
   pages/name.html from GitHub Pages into it, then runs that page's behavior. */
(function () {
  var BASE = 'https://jarrfran.github.io/spindles-united/';
  var V = Math.floor(Date.now() / 12e4); // changes every 2 minutes, so edits show up fast

  /* ---------- Per-page behavior ---------- */
  var INIT = {
    home: function (el) {
      var root = el.querySelector('.su-home');
      if (!root) return;

      /* --- Click-to-load YouTube (keeps the page fast) --- */
      root.querySelectorAll('.su-video[data-video]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-video');
          var f = document.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
          f.title = 'UPL Final live stream';
          f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          f.allowFullscreen = true;
          btn.innerHTML = '';
          btn.appendChild(f);
          btn.style.cursor = 'default';
        }, { once: true });
      });

      /* --- Carousel arrows: scroll the rail in the same block --- */
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

      /* --- Fill hero stories (3 newest) and the news grid (next 8) from the Squarespace News blog --- */
      var heroList = root.querySelector('#su-hero-stories');
      var grid = root.querySelector('#su-news-grid');
      if ((!heroList && !grid) || !window.fetch) return;
      var esc = function (s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };
      var fmt = function (p) { return new Date(p.publishOn || p.addedOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
      var card = function (p, cls, imgCls, w) {
        var cat = (p.categories && p.categories[0]) || 'News';
        var img = p.assetUrl ? '<img loading="lazy" src="' + p.assetUrl + '?format=' + w + 'w" alt="">' : '';
        return '<a class="' + cls + '" href="' + p.fullUrl + '"><div class="' + imgCls + '">' + img + '</div>' +
          '<div class="' + cls + '-body"><h3>' + esc(p.title) + '</h3>' +
          '<p class="su-meta"><span class="su-tag">' + esc(cat) + '</span><time>' + fmt(p) + '</time></p></div></a>';
      };
      fetch('/news?format=json', { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (data) {
          var items = (data && data.items) || [];
          if (heroList && items.length >= 3) {
            heroList.innerHTML = items.slice(0, 3).map(function (p) { return card(p, 'su-hstory', 'su-hstory-img', 750); }).join('');
          }
          var rest = items.slice(3, 11);
          if (grid && rest.length) {
            grid.innerHTML = rest.map(function (p) { return card(p, 'su-ncard', 'su-ncard-img', 750); }).join('');
          }
        })
        .catch(function () { /* keep fallback items */ });
    }
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
  function scan() { document.querySelectorAll('[data-su]').forEach(load); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  window.addEventListener('mercury:load', scan); // Squarespace in-site navigation
})();
