// Provider-neutral consent hook. Integrations can listen for the event without
// shipping a vendor SDK or making a network request by default.
(function () {
  const STORAGE_KEY = 'site-analytics-consent';

  function currentConsent() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'granted';
    } catch (_error) {
      return false;
    }
  }

  function announce() {
    document.dispatchEvent(
      new CustomEvent('site:analytics-consent', { detail: { granted: currentConsent() } })
    );
  }

  function updateConsent(granted) {
    try {
      if (granted) window.localStorage.setItem(STORAGE_KEY, 'granted');
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch (_error) {
      // Storage can be blocked by browser privacy settings. Consent remains off.
    }
    announce();
    return currentConsent();
  }

  window.SiteAnalytics = {
    hasConsent: currentConsent,
    grant: function () {
      return updateConsent(true);
    },
    revoke: function () {
      return updateConsent(false);
    },
  };

  announce();
})();
