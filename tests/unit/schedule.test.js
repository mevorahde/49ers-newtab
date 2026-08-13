const fs = require('fs');
const path = require('path');

describe('schedule internals', () => {
  let internals;

  beforeAll(() => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const scriptPath = path.resolve(__dirname, '../../script.js');

    document.documentElement.innerHTML = fs.readFileSync(indexPath, 'utf8');

    // Prevent real timers/network and keep load deterministic.
    jest.spyOn(global, 'setInterval').mockImplementation(() => 0);

    global.fetch = jest.fn((url) => {
      if (String(url).includes('open-meteo.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            current_weather: { temperature: 72, weathercode: 0 },
            daily: { temperature_2m_max: [75], temperature_2m_min: [62], precipitation_probability_max: [10] }
          })
        });
      }

      if (String(url).includes('ipapi.co')) {
        return Promise.resolve({ ok: true, json: async () => ({ latitude: 37.78, longitude: -122.41 }) });
      }

      if (String(url).includes('nominatim.openstreetmap.org/reverse')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ address: { city: 'San Francisco', state: 'California' } })
        });
      }

      if (String(url).includes('nominatim.openstreetmap.org/search')) {
        return Promise.resolve({ ok: true, json: async () => ([{ lat: '37.7749', lon: '-122.4194' }]) });
      }

      if (String(url).includes('raw.githubusercontent.com')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }

      if (String(url).includes('nfl.com/schedules/')) {
        return Promise.resolve({ ok: true, text: async () => '' });
      }

      return Promise.resolve({ ok: true, json: async () => ({}), text: async () => '' });
    });

    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success) => success({ coords: { latitude: 37.77, longitude: -122.42 } })
      },
      configurable: true
    });

    // Evaluate runtime script and use exposed internals.
    const scriptCode = fs.readFileSync(scriptPath, 'utf8');
    // eslint-disable-next-line no-eval
    eval(scriptCode);

    internals = window.__scheduleInternals;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('parseTeamsFromGameSlug parses preseason and regular game slugs', () => {
    expect(internals.parseTeamsFromGameSlug('49ers-at-chargers-2026-pre-2')).toEqual({
      seasonType: 'PRE',
      week: 2,
      location: 'at',
      opponent: 'Los Angeles Chargers'
    });

    expect(internals.parseTeamsFromGameSlug('eagles-at-49ers-2026-reg-17')).toEqual({
      seasonType: 'REG',
      week: 17,
      location: 'vs',
      opponent: 'Philadelphia Eagles'
    });
  });

  test('getGameKey differentiates preseason and regular weeks', () => {
    expect(internals.getGameKey({ seasonType: 'PRE', week: 1 })).toBe('PRE-1');
    expect(internals.getGameKey({ seasonType: 'REG', week: 1 })).toBe('REG-1');
  });

  test('parseNflSchedulePage extracts game date and network from schedule HTML', () => {
    const html = `
      <a href="/games/49ers-at-rams-2026-reg-1"><span>View</span></a>
      <time dateTime="2026-09-11T00:35:00.000Z"></time>
      <img alt="NETFLIX network logo" />
      <a href="/games/49ers-at-chargers-2026-pre-2"><span>View</span></a>
      <time dateTime="2026-08-21T02:00:00.000Z"></time>
      <span>LOCAL</span>
    `;

    const games = internals.parseNflSchedulePage(html);
    expect(games.length).toBe(2);

    const pre = games.find((g) => g.seasonType === 'PRE' && g.week === 2);
    const reg = games.find((g) => g.seasonType === 'REG' && g.week === 1);

    expect(pre).toBeTruthy();
    expect(pre.channel).toBe('LOCAL');
    expect(pre.date).toBe('2026-08-21T02:00:00.000Z');

    expect(reg).toBeTruthy();
    expect(reg.channel).toBe('NETFLIX');
    expect(reg.date).toBe('2026-09-11T00:35:00.000Z');
  });

  test('validateScheduleData reports duplicates and invalid fields', () => {
    const issues = internals.validateScheduleData([
      {
        seasonType: 'REG',
        week: 1,
        opponent: 'Los Angeles Rams',
        date: '2026-09-11T00:35:00.000Z',
        location: 'at',
        channel: 'NETFLIX',
        logo: 'https://static.www.nfl.com/f_auto,h_80,dpr_2.0,q_auto,w_80/league/api/clubs/logos/LA'
      },
      {
        seasonType: 'REG',
        week: 1,
        opponent: 'Los Angeles Rams',
        date: 'bad-date',
        location: '',
        channel: 'NETFLIX',
        logo: 'https://example.com/logo.svg'
      }
    ]);

    expect(issues.some((i) => i.includes('Duplicate game key'))).toBe(true);
    expect(issues.some((i) => i.includes('Invalid or missing date'))).toBe(true);
    expect(issues.some((i) => i.includes('Non-official or missing logo'))).toBe(true);
    expect(issues.some((i) => i.includes('Missing required fields'))).toBe(true);
  });

  test('offseason label is current year season', () => {
    const label = internals.getOffseasonSeasonLabel();
    expect(label).toMatch(/^\d{4} Season$/);
  });

  test('counts a game tomorrow as one calendar day away', () => {
    const now = new Date(2026, 7, 12, 20, 0);
    const gameDate = new Date(2026, 7, 13, 18, 0);

    expect(internals.getCalendarDayDifference(now, gameDate)).toBe(1);
  });
});
