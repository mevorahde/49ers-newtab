const fs = require('fs');
const path = require('path');

describe('game-schedule.json quality', () => {
  const schedulePath = path.resolve(__dirname, '../../game-schedule.json');
  const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));

  test('has unique seasonType-week keys', () => {
    const keys = schedule.map((g) => `${(g.seasonType || 'REG').toUpperCase()}-${g.week}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('uses NFL static logo urls', () => {
    for (const game of schedule) {
      expect(game.logo).toMatch(/^https:\/\/static\.www\.nfl\.com\//i);
    }
  });

  test('contains preseason and regular season baseline entries', () => {
    const preCount = schedule.filter((g) => (g.seasonType || '').toUpperCase() === 'PRE').length;
    const regCount = schedule.filter((g) => (g.seasonType || '').toUpperCase() === 'REG').length;

    expect(preCount).toBeGreaterThanOrEqual(3);
    // Baseline JSON can ship with 16 known REG games while late flex/TBD games fill from NFL live refresh.
    expect(regCount).toBeGreaterThanOrEqual(16);
  });
});
