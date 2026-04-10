/**
 * theme-toggle.js — Dark / light / system theme switcher.
 *
 * - 3-mode cycle: light → dark → system
 * - Persists to localStorage('theme-preference')
 * - Updates <html> class and meta theme-color
 * - Uses View Transitions API for circular reveal when supported
 * - Respects prefers-reduced-motion (skips animation)
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'theme-preference';
  var META_LIGHT = 'oklch(0.985 0 0)';
  var META_DARK = 'oklch(0.15 0 0)';

  var motionQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function getPreference() {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  }

  function isDark(pref) {
    if (pref === 'dark') return true;
    if (pref === 'light') return false;
    return motionQuery.matches;
  }

  function applyTheme(pref) {
    var dark = isDark(pref);
    document.documentElement.classList.toggle('dark', dark);

    var meta = document.querySelector('#meta-theme-color');
    if (meta) meta.content = dark ? META_DARK : META_LIGHT;

    // Dispatch event for other modules (icons, etc.)
    document.dispatchEvent(new CustomEvent('site-theme-change', { detail: { dark: dark } }));
  }

  function nextPreference(current) {
    if (current === 'light') return 'dark';
    if (current === 'dark') return 'system';
    return 'light';
  }

  function toggle(event) {
    var pref = nextPreference(getPreference());
    localStorage.setItem(STORAGE_KEY, pref);

    // Use View Transitions for circular reveal if available and motion allowed
    if (document.startViewTransition && !reducedMotion.matches && event) {
      var x = event.clientX || window.innerWidth / 2;
      var y = event.clientY || 0;
      var maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      var transition = document.startViewTransition(function () {
        applyTheme(pref);
      });

      transition.ready.then(function () {
        document.documentElement.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + maxRadius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 400, easing: 'ease-out', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
    } else {
      applyTheme(pref);
    }
  }

  // -- Init -----------------------------------------------------------------
  function init() {
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);

    // Listen for OS theme changes (affects 'system' mode)
    motionQuery.addEventListener('change', function () {
      if (getPreference() === 'system') applyTheme('system');
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('{{project-name}}:page-loaded', init);
})();
