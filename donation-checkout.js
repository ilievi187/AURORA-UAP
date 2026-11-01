/* Accept only a public Buy Me a Coffee creator profile URL. */
(function attachDonationCheckout(root) {
  function verifiedCheckoutLink(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
      if (!['buymeacoffee.com', 'www.buymeacoffee.com'].includes(url.hostname)) return null;
      if (!url.pathname || url.pathname === '/' || url.search || url.hash) return null;
      return url.toString();
    } catch {
      return null;
    }
  }
  root.AURORA_DONATION_CHECKOUT = { verifiedCheckoutLink };
})(window);
