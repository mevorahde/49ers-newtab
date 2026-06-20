const { test, expect } = require('@playwright/test');
const path = require('path');

test('clicking a todo row toggles completed state', async ({ page }) => {
  await page.route('**/open-meteo.com/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current_weather: { temperature: 72, weathercode: 0, time: new Date().toISOString() },
        daily: { temperature_2m_max: [74], temperature_2m_min: [61], precipitation_probability_max: [5] }
      })
    });
  });

  await page.route('**/ipapi.co/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ latitude: 37.77, longitude: -122.42 }) });
  });

  await page.route('**/nominatim.openstreetmap.org/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ address: { city: 'San Francisco', state: 'California' } })
    });
  });

  await page.route('**/raw.githubusercontent.com/**/game-schedule.json', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/nfl.com/schedules/**', (route) => {
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' });
  });

  const file = 'file://' + path.resolve(__dirname, '../../index.html');
  await page.goto(file);

  await page.evaluate(() => {
    localStorage.setItem('tasks', JSON.stringify([{ text: 'Test task', completed: false }]));
  });

  await page.reload();
  const todoItem = page.locator('.todo-item').first();
  await expect(todoItem).toHaveClass(/todo-item$/);

  const box = await todoItem.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  await expect(todoItem).toHaveClass(/completed/);
  await expect(page.locator('.todo-text').first()).toHaveCSS('text-decoration-line', 'none');
  await expect(page.locator('.todo-item.completed').first()).toHaveCSS('background-image', /gradient/);
});