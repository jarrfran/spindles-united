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

      /* --- Pull the 3 newest posts from the Squarespace News blog --- */
      var list = root.querySelector('#su-news-list');
      if (!list || !window.fetch) return;
      fetch('/news?format=json', { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (data) {
          var items = (data && data.items || []).slice(0, 3);
          if (!items.length) return;
          var esc = function (s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };
          list.innerHTML = items.map(function (p) {
            var date = new Date(p.publishOn || p.addedOn).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            var cat = (p.categories && p.categories[0]) || 'News';
            var img = p.assetUrl ? '<img loading="lazy" src="' + p.assetUrl + '?format=500w" alt="">' : '';
            return '<a class="su-news-item" href="' + p.fullUrl + '">' +
              '<div class="su-news-thumb">' + img + '</div>' +
              '<div><p class="su-news-meta"><b>' + esc(cat) + '</b> &nbsp;' + date + '</p>' +
              '<h3 class="su-news-title">' + esc(p.title) + '</h3></div></a>';
          }).join('');
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
