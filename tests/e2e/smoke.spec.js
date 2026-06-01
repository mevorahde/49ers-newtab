const { test, expect } = require('@playwright/test');
const path = require('path');

test('page loads and shows favorites and weather', async ({ page }) => {
  const file = 'file://' + path.resolve(__dirname, '../../index.html');
  // Intercept network requests to provide deterministic responses for tests
  await page.route('**/open-meteo.com/**', (route) => {
    const fake = {
      latitude: 0,
      longitude: 0,
      generationtime_ms: 0,
      utc_offset_seconds: 0,
      timezone: 'UTC',
      timezone_abbreviation: 'UTC',
      elevation: 0,
      current_weather: {
        temperature: 82,
        windspeed: 1,
        winddirection: 180,
        weathercode: 0,
        time: new Date().toISOString()
      },
      daily: {
        temperature_2m_max: [85],
        temperature_2m_min: [68],
        precipitation_probability_max: [10]
      }
    };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fake) });
  });

  // Favicon/image requests -> return a tiny SVG so icons always load
  const svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#b30000"/></svg>';
  await page.route('**/s2/favicons*', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgIcon }));
  await page.route('**/icons.duckduckgo.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgIcon }));
  await page.route('**/mevorahde.github.io/**/favicon.ico', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgIcon }));

  await page.goto(file);

  // Wait for favorites to render
  await page.waitForSelector('.favorites');
  const favCount = await page.locator('.fav-item').count();
  expect(favCount).toBeGreaterThan(0);

  // Check at least one favicon image exists
  const icons = await page.locator('.fav-icon').count();
  expect(icons).toBeGreaterThan(0);

  // Weather elements present
  await page.waitForSelector('#weather-temp');
  const tempText = await page.locator('#weather-temp').innerText();
  expect(tempText.length).toBeGreaterThan(0);
});
