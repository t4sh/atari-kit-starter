/**
 * mobile-menu.js — Hamburger menu with accessibility.
 *
 * - Toggles #mobile-menu visibility
 * - Manages aria-expanded on toggle button
 * - Traps focus within menu when open
 * - Closes on Escape key
 * - Cleans up on {{project-name}}:before-page-unload
 */

(function () {
  'use strict';

  var btn = null;
  var menu = null;
  var isOpen = false;

  function open() {
    if (!menu || !btn) return;
    isOpen = true;
    menu.style.display = 'block';
    btn.setAttribute('aria-expanded', 'true');

    // Focus first link
    var firstLink = menu.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function close() {
    if (!menu || !btn) return;
    isOpen = false;
    menu.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      close();
    }
  }

  function init() {
    btn = document.getElementById('mobile-menu-toggle');
    menu = document.getElementById('mobile-menu');

    if (btn) btn.addEventListener('click', toggle);
    document.addEventListener('keydown', onKeyDown);
  }

  function cleanup() {
    if (btn) btn.removeEventListener('click', toggle);
    document.removeEventListener('keydown', onKeyDown);
    btn = null;
    menu = null;
    isOpen = false;
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('{{project-name}}:page-loaded', init);
  document.addEventListener('{{project-name}}:before-page-unload', cleanup);
})();
