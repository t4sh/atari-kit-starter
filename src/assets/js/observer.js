/**
 * observer.js — Single IntersectionObserver for all scroll-triggered behaviors.
 *
 * Declarative API via data-observe attribute:
 *   data-observe="reveal"       — fade in on enter
 *   data-observe="reveal-up"    — slide up + fade in
 *   data-observe="lazy"         — lazy-load image (data-src → src)
 *   data-observe="countup"      — animate number (data-to="1500")
 *   data-observe="stagger"      — children animate sequentially
 *
 * Multiple effects can stack: data-observe="reveal stagger"
 *
 * Respects prefers-reduced-motion: all effects resolve instantly.
 */

(function () {
  'use strict';

  // -- Reduced motion check (live) ------------------------------------------
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = motionQuery.matches;

  motionQuery.addEventListener('change', function (e) {
    prefersReducedMotion = e.matches;
    // If user enables reduced motion, instantly reveal all pending elements
    if (prefersReducedMotion) revealAll();
  });

  // -- State ----------------------------------------------------------------
  const observed = new Set();
  let observer = null;

  // -- Effect handlers ------------------------------------------------------
  const effects = {
    reveal: function (el) {
      el.classList.add('observed');
    },

    'reveal-up': function (el) {
      el.classList.add('observed');
    },

    lazy: function (el) {
      const src = el.getAttribute('data-src');
      if (src) {
        el.src = src;
        el.removeAttribute('data-src');
      }
    },

    countup: function (el) {
      const target = parseInt(el.getAttribute('data-to'), 10) || 0;
      if (prefersReducedMotion) {
        el.textContent = target.toLocaleString();
        return;
      }
      animateCountUp(el, target);
    },

    stagger: function (el) {
      const children = el.children;
      for (let i = 0; i < children.length; i++) {
        children[i].style.setProperty('--stagger-index', i);
      }
      el.classList.add('observed');
    },
  };

  // -- Count-up animation ---------------------------------------------------
  function animateCountUp(el, target) {
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // -- Reveal all (for reduced motion) --------------------------------------
  function revealAll() {
    observed.forEach(function (el) {
      const types = (el.getAttribute('data-observe') || '').split(/\s+/);
      types.forEach(function (type) {
        if (effects[type]) effects[type](el);
      });
    });
  }

  // -- Observer callback ----------------------------------------------------
  function handleIntersect(entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const types = (el.getAttribute('data-observe') || '').split(/\s+/);

      types.forEach(function (type) {
        if (effects[type]) effects[type](el);
      });

      // Unobserve after triggering (one-shot)
      observer.unobserve(el);
      observed.delete(el);
    });
  }

  // -- Init / scan ----------------------------------------------------------
  function scan() {
    if (!observer) {
      observer = new IntersectionObserver(handleIntersect, {
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1,
      });
    }

    const elements = document.querySelectorAll('[data-observe]');
    elements.forEach(function (el) {
      if (observed.has(el)) return;

      // Reduced motion: resolve immediately
      if (prefersReducedMotion) {
        const types = (el.getAttribute('data-observe') || '').split(/\s+/);
        types.forEach(function (type) {
          if (effects[type]) effects[type](el);
        });
        return;
      }

      observed.add(el);
      observer.observe(el);
    });
  }

  // -- Cleanup --------------------------------------------------------------
  function cleanup() {
    if (observer) {
      observer.disconnect();
      observed.clear();
    }
  }

  // -- Lifecycle hooks ------------------------------------------------------
  document.addEventListener('DOMContentLoaded', scan);
  document.addEventListener('{{project-name}}:page-loaded', scan);
  document.addEventListener('{{project-name}}:before-page-unload', cleanup);
})();
