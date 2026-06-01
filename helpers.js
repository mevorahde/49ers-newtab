// Small helpers extracted for unit testing
function domainFromUrl(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function normalizeUrl(value) {
  if (!value) return "";
  const trimmed = value.trim();
  try {
    return new URL(trimmed).href;
  } catch {
    try {
      return new URL(`https://${trimmed}`).href;
    } catch {
      return "";
    }
  }
}

function getFavicon(url) {
  const domain = domainFromUrl(url);
  return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(domain)}`;
}

module.exports = { domainFromUrl, normalizeUrl, getFavicon };
