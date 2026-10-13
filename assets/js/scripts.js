(function () {
  var root = document.documentElement;

  // Light / dark toggle. By default the site follows the device setting;
  // pressing the small button saves a manual choice in this browser.
  var themeBtn = document.getElementById('theme-toggle');
  function systemDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function currentTheme() {
    return root.getAttribute('data-theme') || (systemDark() ? 'dark' : 'light');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('tf-theme', next); } catch (e) {}
    });
  }

  // Mobile menu
  var navBtn = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  if (navBtn && nav) {
    navBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        navBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Dropdown menus: on desktop they open on hover or keyboard focus; the small arrow
  // button opens them by tap or click (phones, tablets) and on the mobile menu.
  var toggles = document.querySelectorAll('.sub-toggle');
  function closeAll(except) {
    Array.prototype.forEach.call(toggles, function (t) {
      var li = t.parentNode;
      if (li !== except) {
        li.classList.remove('open');
        t.setAttribute('aria-expanded', 'false');
      }
    });
  }
  Array.prototype.forEach.call(toggles, function (t) {
    t.addEventListener('click', function (e) {
      e.stopPropagation();
      var li = t.parentNode;
      var open = li.classList.toggle('open');
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
      closeAll(li);
    });
  });
  // On desktop, leaving the item (or resizing to the phone layout) closes a panel opened by click
  var wide = window.matchMedia ? window.matchMedia('(min-width: 1041px)') : null;
  Array.prototype.forEach.call(document.querySelectorAll('.has-sub'), function (li) {
    li.addEventListener('mouseleave', function () {
      if (wide && wide.matches) {
        li.classList.remove('open');
        var b = li.querySelector('.sub-toggle');
        if (b) { b.setAttribute('aria-expanded', 'false'); }
      }
    });
  });
  if (wide && wide.addEventListener) { wide.addEventListener('change', function () { closeAll(null); }); }
  document.addEventListener('click', function (e) {
    if (!(e.target.closest && e.target.closest('.has-sub'))) { closeAll(null); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAll(null); }
  });

  // Photo zoom (lightbox): click a project photo to see it large.
  // Esc or a click outside closes it; arrow keys, buttons or a swipe move between photos.
  var zoomItems = Array.prototype.slice.call(document.querySelectorAll('[data-zoom]'));
  if (zoomItems.length) {
    var box = null, boxImg = null, boxCount = null, current = 0, lastFocus = null, touchX = null;
    var build = function () {
      box = document.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Photo viewer');
      box.hidden = true;
      box.innerHTML =
        '<button type="button" class="lb-close" aria-label="Close">&times;</button>' +
        '<button type="button" class="lb-nav lb-prev" aria-label="Previous photo">&#8249;</button>' +
        '<figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-count"></figcaption></figure>' +
        '<button type="button" class="lb-nav lb-next" aria-label="Next photo">&#8250;</button>';
      document.body.appendChild(box);
      boxImg = box.querySelector('.lb-img');
      boxCount = box.querySelector('.lb-count');
      box.addEventListener('click', function (e) {
        if (e.target === box || e.target.className === 'lb-figure') { close(); }
      });
      box.querySelector('.lb-close').addEventListener('click', close);
      box.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
      box.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
      box.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', function (e) {
        if (touchX === null) { return; }
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 50) { show(current + (dx < 0 ? 1 : -1)); }
      });
    };
    var show = function (i) {
      var n = zoomItems.length;
      current = (i + n) % n;
      var el = zoomItems[current];
      boxImg.src = el.getAttribute('data-zoom');
      boxImg.alt = el.getAttribute('data-zoom-alt') || '';
      boxCount.textContent = n > 1 ? (current + 1) + ' / ' + n : '';
      box.classList.toggle('single', n < 2);
    };
    var open = function (i) {
      if (!box) { build(); }
      lastFocus = document.activeElement;
      show(i);
      box.hidden = false;
      document.documentElement.classList.add('lb-open');
      box.querySelector('.lb-close').focus();
    };
    var close = function () {
      if (!box || box.hidden) { return; }
      box.hidden = true;
      boxImg.removeAttribute('src');
      document.documentElement.classList.remove('lb-open');
      if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    };
    zoomItems.forEach(function (el, i) {
      el.addEventListener('click', function () { open(i); });
    });
    document.addEventListener('keydown', function (e) {
      if (!box || box.hidden) { return; }
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowRight') { show(current + 1); }
      else if (e.key === 'ArrowLeft') { show(current - 1); }
      else if (e.key === 'Tab') {
        // keep keyboard focus inside the viewer
        var f = box.querySelectorAll('button:not([hidden])');
        var visible = Array.prototype.filter.call(f, function (b) { return b.offsetParent !== null; });
        if (!visible.length) { return; }
        var first = visible[0], last = visible[visible.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // Counters count up when they scroll into view (skipped if the visitor prefers reduced motion)
  var nums = document.querySelectorAll('.stat-n');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    if (isNaN(end)) { return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (start === null) { start = ts; }
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) { requestAnimationFrame(step); } else { el.textContent = String(end); }
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  if (nums.length && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(nums, function (n) { io.observe(n); });
  }
})();
