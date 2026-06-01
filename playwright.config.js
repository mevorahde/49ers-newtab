// Playwright config for e2e tests only.
// Limits discovery to the `tests/e2e` directory so Jest unit tests are not picked up.
module.exports = {
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  retries: 0,
  reporter: [['list']],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
};
