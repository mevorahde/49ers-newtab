const { domainFromUrl, normalizeUrl, getFavicon } = require('../../helpers');

describe('helpers', () => {
  test('domainFromUrl extracts hostname', () => {
    expect(domainFromUrl('https://example.com/path')).toBe('example.com');
    expect(domainFromUrl('http://localhost:8080')).toBe('localhost');
    expect(domainFromUrl('not-a-url')).toBe('not-a-url');
  });

  test('normalizeUrl returns full URL', () => {
    expect(normalizeUrl('example.com')).toMatch(/^https?:\/\/example.com/);
    expect(normalizeUrl('https://example.com')).toBe('https://example.com/');
    expect(normalizeUrl('')).toBe('');
  });

  test('getFavicon returns google s2 URL containing domain', () => {
    const s = getFavicon('https://mevorahde.github.io/Git_Cheat_Sheet/');
    expect(s).toContain('google.com/s2/favicons');
    expect(s).toContain('mevorahde.github.io');
  });
});
