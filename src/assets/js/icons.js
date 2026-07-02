/**
 * icons.js — Lucide icon renderer.
 *
 * Calls lucide.createIcons() on:
 * - DOMContentLoaded
 * - PageLifecycle page-loaded (after View Transition or SPA navigation)
 * - site-theme-change (icons may swap in dark mode)
 */

(function () {
  'use strict';

  function render() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  const lifecycle = window.PageLifecycle;
  if (lifecycle) {
    lifecycle.onReady(render);
    lifecycle.onPageLoaded(render);
  }
  document.addEventListener('site-theme-change', render);
})();
