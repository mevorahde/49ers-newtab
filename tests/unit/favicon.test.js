const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('runtime shortcut favicon loader', () => {
  let populateFavicon;

  beforeAll(() => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../script.js'), 'utf8');
    const start = source.indexOf('function domainFromUrl(');
    const end = source.indexOf('function renderFavorites(', start);
    if (start < 0 || end < 0) throw new Error('Favicon runtime section not found');
    const context = { URL, encodeURIComponent, debugTrace: jest.fn(), console: { warn: jest.fn() } };
    vm.createContext(context);
    // Exercise the real loader without starting weather, schedule, timers, or storage.
    vm.runInContext(source.slice(start, end), context);
    populateFavicon = context.populateFavicon;
  });

  test.each([
    'https://mevorahde.github.io/family-recipes/',
    'https://mevorahde.github.io/family-recipes',
    'https://mevorahde.github.io/family-recipes/?v=ccc3cf6',
    'https://mevorahde.github.io/family-recipes/#/recipe/apple-pie',
    'https://mevorahde.github.io/family-recipes/nested/',
  ])('prefers cookbook.svg for %s', (url) => {
    const img = {};
    populateFavicon(img, url);
    expect(img.src).toBe('https://mevorahde.github.io/family-recipes/cookbook.svg');
    img.onload();
    expect(img.onerror).toBeNull();
    expect(img.title).toContain('cookbook.svg');
  });

  test.each([
    'https://mevorahde.github.io/Git_Cheat_Sheet/',
    'https://mevorahde.github.io/',
    'https://mevorahde.github.io/family-recipes-other/',
    'https://example.com/family-recipes/',
  ])('preserves existing first choice for %s', (url) => {
    const img = {};
    populateFavicon(img, url);
    const parsed = new URL(url);
    expect(img.src).toBe(`${parsed.origin}${parsed.pathname.replace(/\/$/, '')}/favicon.ico`);
  });

  test('failed cookbook icon retains the existing fallback chain', () => {
    const img = {};
    populateFavicon(img, 'https://mevorahde.github.io/family-recipes/');
    img.onerror();
    expect(img.src).toBe('https://mevorahde.github.io/family-recipes/favicon.ico');
    img.onerror();
    expect(img.src).toBe('https://mevorahde.github.io/favicon.ico');
    img.onerror();
    expect(img.src).toContain('google.com/s2/favicons');
    img.onerror();
    expect(img.src).toContain('icons.duckduckgo.com');
    img.onerror();
    expect(img.src).toContain('domain_url=');
    img.onerror();
    expect(img.src).toMatch(/^data:image\/svg\+xml/);
  });
});
