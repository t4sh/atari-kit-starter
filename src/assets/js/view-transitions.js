/**
 * view-transitions.js — Browser navigation adapter for PageLifecycle.
 *
 * - Wraps same-origin navigation in View Transitions API when supported
 * - Dispatches lifecycle unload/load through PageLifecycle
 * - Delegates safe DOM swapping to PageLifecycle
 * - Graceful fallback: normal navigation if View Transitions are unavailable
 */

(function () {
  'use strict';

  const lifecycle = window.PageLifecycle;
  if (!lifecycle) return;

  // Generated SPA output has its own navigation adapter at the same seam.
  if (window.PageLifecycleMode === 'spa') return;

  // Only enhance if View Transitions API is available
  if (!document.startViewTransition) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function fetchDocument(url) {
    return fetch(url.href)
      .then(function (res) {
        if (!res.ok) throw new Error('Navigation fetch failed: ' + res.status);
        return res.text();
      })
      .then(function (html) {
        return lifecycle.parseHTML(html);
      });
  }

  function applyDocument(doc, url) {
    lifecycle.swapMainFromDocument(doc);
    document.title = doc.title;
    if (url) history.pushState(null, '', url.href);
    lifecycle.dispatchPageLoaded({ url: url ? url.href : window.location.href });
  }

  function navigateTo(url) {
    lifecycle.dispatchBeforePageUnload({ url: url.href });

    if (reducedMotion.matches) {
      window.location.href = url.href;
      return;
    }

    const transition = document.startViewTransition(function () {
      return fetchDocument(url).then(function (doc) {
        applyDocument(doc, url);
      });
    });

    transition.updateCallbackDone.catch(function () {
      window.location.href = url.href;
    });
  }

  // Intercept clicks on same-origin anchor links
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href]');
    if (!link) return;

    let url;
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
    navigateTo(url);
  });

  // Handle back/forward navigation
  window.addEventListener('popstate', function () {
    lifecycle.dispatchBeforePageUnload({ url: window.location.href });

    fetchDocument(new URL(window.location.href))
      .then(function (doc) {
        applyDocument(doc);
      })
      .catch(function () {
        window.location.reload();
      });
  });
})();
