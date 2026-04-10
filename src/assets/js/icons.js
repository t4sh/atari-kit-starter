/**
 * icons.js — Lucide icon renderer.
 *
 * Calls lucide.createIcons() on:
 * - DOMContentLoaded
 * - {{project-name}}:page-loaded (after View Transition)
 * - site-theme-change (icons may swap in dark mode)
 */

(function () {
  'use strict';

  function render() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('{{project-name}}:page-loaded', render);
  document.addEventListener('site-theme-change', render);
})();
