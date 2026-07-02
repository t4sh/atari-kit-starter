/**
 * page-lifecycle.js — Deep module for page load/unload and safe DOM swaps.
 *
 * Interface:
 *   PageLifecycle.onReady(handler)
 *   PageLifecycle.onPageLoaded(handler)
 *   PageLifecycle.onBeforePageUnload(handler)
 *   PageLifecycle.dispatchPageLoaded()
 *   PageLifecycle.dispatchBeforePageUnload()
 *   PageLifecycle.parseHTML(html)
 *   PageLifecycle.swapMainFromDocument(doc)
 *   PageLifecycle.sanitizeHTML(html)
 *
 * Browser navigation and SPA navigation are adapters at this seam. The
 * sanitizer implementation is intentionally local to this module so DOM swap
 * safety rules are reviewed in one place.
 */

(function () {
  'use strict';

  const EVENTS = {
    pageLoaded: '{{project-name}}:page-loaded',
    beforePageUnload: '{{project-name}}:before-page-unload',
  };

  function onReady(handler) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handler, { once: true });
    } else {
      handler();
    }
  }

  function onPageLoaded(handler) {
    document.addEventListener(EVENTS.pageLoaded, handler);
  }

  function offPageLoaded(handler) {
    document.removeEventListener(EVENTS.pageLoaded, handler);
  }

  function onBeforePageUnload(handler) {
    document.addEventListener(EVENTS.beforePageUnload, handler);
  }

  function offBeforePageUnload(handler) {
    document.removeEventListener(EVENTS.beforePageUnload, handler);
  }

  function dispatchPageLoaded(detail) {
    document.dispatchEvent(new CustomEvent(EVENTS.pageLoaded, { detail: detail || {} }));
  }

  function dispatchBeforePageUnload(detail) {
    document.dispatchEvent(new CustomEvent(EVENTS.beforePageUnload, { detail: detail || {} }));
  }

  function compactUrl(value) {
    return Array.from(value.trim())
      .filter(function (ch) {
        const code = ch.charCodeAt(0);
        return code > 31 && code !== 127 && !/\s/.test(ch);
      })
      .join('');
  }

  function isSafeUrl(value, allowImageData) {
    if (!value) return true;
    const trimmed = compactUrl(value);
    if (!trimmed) return true;
    if (trimmed.startsWith('//')) return false;
    if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return true;
    if (allowImageData && /^data:image\/(png|gif|jpe?g|webp);/i.test(trimmed)) return true;
    return /^(https?|mailto|tel):/i.test(trimmed);
  }

  function sanitizeHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html;

    template.content
      .querySelectorAll('script, iframe, object, embed, link, meta, base')
      .forEach(function (el) {
        el.remove();
      });

    template.content.querySelectorAll('*').forEach(function (el) {
      Array.from(el.attributes).forEach(function (attr) {
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (name.startsWith('on') || name === 'srcdoc') {
          el.removeAttribute(attr.name);
          return;
        }

        if (['href', 'src', 'action', 'formaction', 'xlink:href'].includes(name)) {
          const allowImageData = name === 'src' && /^(img|source)$/i.test(el.tagName);
          if (!isSafeUrl(value, allowImageData)) el.removeAttribute(attr.name);
        }
      });
    });

    return template.innerHTML;
  }

  function parseHTML(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  function swapMainFromDocument(doc) {
    const newMain = doc.querySelector('#main-content');
    const currentMain = document.querySelector('#main-content');

    if (!newMain || !currentMain) return false;

    currentMain.innerHTML = sanitizeHTML(newMain.innerHTML);
    return true;
  }

  window.PageLifecycle = {
    events: EVENTS,
    onReady,
    onPageLoaded,
    offPageLoaded,
    onBeforePageUnload,
    offBeforePageUnload,
    dispatchPageLoaded,
    dispatchBeforePageUnload,
    parseHTML,
    sanitizeHTML,
    swapMainFromDocument,
  };
})();
