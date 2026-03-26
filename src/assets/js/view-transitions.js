/**
 * view-transitions.js — Page transition orchestration.
 *
 * - Wraps same-origin navigation in View Transitions API when supported
 * - Fires starter:before-page-unload before leaving
 * - Fires starter:page-loaded after new content is in place
 * - Graceful fallback: just navigates normally if API unavailable
 */

(function () {
  'use strict';

  // Only enhance if View Transitions API is available
  if (!document.startViewTransition) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Intercept clicks on same-origin anchor links
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var url;
    try {
      url = new URL(link.href, window.location.origin);
    } catch (_err) {
      return;
    }

    // Only handle same-origin, non-hash, non-download links
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;
    if (link.hasAttribute('download')) return;
    if (link.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;

    e.preventDefault();

    // Dispatch cleanup event
    document.dispatchEvent(new CustomEvent('starter:before-page-unload'));

    if (reducedMotion.matches) {
      // Skip animation, just navigate
      window.location.href = url.href;
      return;
    }

    document.startViewTransition(function () {
      return fetch(url.href)
        .then(function (res) { return res.text(); })
        .then(function (html) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');

          // Swap main content
          var newMain = doc.querySelector('#main-content');
          var currentMain = document.querySelector('#main-content');
          if (newMain && currentMain) {
            currentMain.innerHTML = newMain.innerHTML;
          }

          // Update title
          document.title = doc.title;

          // Update URL
          history.pushState(null, '', url.href);

          // Re-init modules
          document.dispatchEvent(new CustomEvent('starter:page-loaded'));
        });
    });
  });

  // Handle back/forward navigation
  window.addEventListener('popstate', function () {
    document.dispatchEvent(new CustomEvent('starter:before-page-unload'));

    fetch(window.location.href)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        var newMain = doc.querySelector('#main-content');
        var currentMain = document.querySelector('#main-content');
        if (newMain && currentMain) {
          currentMain.innerHTML = newMain.innerHTML;
        }

        document.title = doc.title;
        document.dispatchEvent(new CustomEvent('starter:page-loaded'));
      });
  });
})();
