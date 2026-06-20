const { test, expect } = require('@playwright/test');
const path = require('path');

function isoOffsetDays(daysFromNow) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

async function stubCommon(page, scheduleJson) {
  await page.route('**/open-meteo.com/**', (route) => {
    const fake = {
      current_weather: { temperature: 72, weathercode: 0, time: new Date().toISOString() },
      daily: { temperature_2m_max: [74], temperature_2m_min: [61], precipitation_probability_max: [5] }
    };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fake) });
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
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(scheduleJson) });
  });

  await page.route('**/nfl.com/schedules/**', (route) => {
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' });
  });
}

test('preseason next game drives countdown and card', async ({ page }) => {
  const scheduleJson = [
    {
      seasonType: 'PRE',
      week: 1,
      opponent: 'Los Angeles Chargers',
      date: isoOffsetDays(2),
      location: 'at',
      channel: 'LOCAL',
      logo: 'https://static.www.nfl.com/f_auto,h_80,dpr_2.0,q_auto,w_80/league/api/clubs/logos/LAC'
    },
    {
      seasonType: 'REG',
      week: 1,
      opponent: 'Los Angeles Rams',
      date: isoOffsetDays(20),
      location: 'at',
      channel: 'NETFLIX',
      logo: 'https://static.www.nfl.com/f_auto,h_80,dpr_2.0,q_auto,w_80/league/api/clubs/logos/LA'
    }
  ];

  await stubCommon(page, scheduleJson);

  const file = 'file://' + path.resolve(__dirname, '../../index.html');
  await page.goto(file);

  await expect(page.locator('#countdown')).toContainText('DAYS');
  await expect(page.locator('#game-card')).toBeVisible();
  await expect(page.locator('#game-opponent')).toContainText('Los Angeles Chargers');
  await expect(page.locator('#game-week-badge')).toHaveText('PRESEASON WEEK 1');
  await expect(page.locator('#game-meta')).toContainText('LOCAL');
});

test('regular season game shows regular week badge text', async ({ page }) => {
  const scheduleJson = [
    {
      seasonType: 'REG',
      week: 2,
      opponent: 'Seattle Seahawks',
      date: isoOffsetDays(3),
      location: 'vs',
      channel: 'FOX',
      logo: 'https://static.www.nfl.com/f_auto,h_80,dpr_2.0,q_auto,w_80/league/api/clubs/logos/SEA'
    }
  ];

  await stubCommon(page, scheduleJson);

  const file = 'file://' + path.resolve(__dirname, '../../index.html');
  await page.goto(file);

  await expect(page.locator('#game-card')).toBeVisible();
  await expect(page.locator('#game-week-badge')).toHaveText('WEEK 2');
});

test('important controls stay above fold on laptop and monitor viewports', async ({ page }) => {
  const scheduleJson = [
    {
      seasonType: 'REG',
      week: 1,
      opponent: 'Los Angeles Rams',
      date: isoOffsetDays(5),
      location: 'at',
      channel: 'NETFLIX',
      logo: 'https://static.www.nfl.com/f_auto,h_80,dpr_2.0,q_auto,w_80/league/api/clubs/logos/LA'
    }
  ];

  await stubCommon(page, scheduleJson);

  const file = 'file://' + path.resolve(__dirname, '../../index.html');

  const viewports = [
    { width: 1366, height: 768 },
    { width: 2560, height: 1440 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(file);

    const visibleSelectors = ['#search-input', '#favorites', '#todo-input'];
    for (const selector of visibleSelectors) {
      await page.waitForSelector(selector, { state: 'visible' });
      const box = await page.locator(selector).boundingBox();
      expect(box).toBeTruthy();
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  }
});

test('offseason shows year season label when no future games', async ({ page }) => {
  const scheduleJson = [
    {
      seasonType: 'REG',
      week: 17,
      opponent: 'Philadelphia Eagles',
      date: '2026-01-03T20:20:00.000Z',
      location: 'vs',
      channel: 'NBC',
      logo: 'https://static.www.nfl.com/f_auto,h_80,dpr_2.0,q_auto,w_80/league/api/clubs/logos/PHI'
    }
  ];

  await stubCommon(page, scheduleJson);

  const file = 'file://' + path.resolve(__dirname, '../../index.html');
  await page.goto(file);

  await expect(page.locator('#countdown')).toContainText('Season');
  await expect(page.locator('#game-card')).toBeHidden();
});
