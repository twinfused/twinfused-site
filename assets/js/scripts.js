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
