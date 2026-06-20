## Testing Setup

1. Install dev dependencies:

```bash
npm install
npx playwright install
```

2. Run unit tests (Jest):

```bash
npm run test:unit
```

3. Run e2e tests (Playwright):

```bash
npm run test:e2e
```

4. Run full suite:

```bash
npm run test:all
```

## Test Coverage

### Unit tests (`tests/unit/`)

- `helpers.test.js`
	- URL normalization/domain extraction/favicon URL builder
- `schedule.test.js`
	- slug parsing (`PRE`/`REG`)
	- game-key uniqueness behavior (`PRE-1` vs `REG-1`)
	- NFL HTML parser extraction (date/network)
	- schedule validation failures (duplicate key, bad date/logo/missing fields)
	- offseason `YYYY Season` label behavior
- `schedule-data.test.js`
	- `game-schedule.json` quality checks
	- unique `seasonType-week` keys
	- official NFL logo URL format
	- baseline preseason and regular-season entry presence

### E2E tests (`tests/e2e/`)

- `smoke.spec.js`
	- page loads and core UI sections render
	- deterministic weather/favicons via network mocking
- `schedule-states.spec.js`
	- preseason countdown + game card behavior
	- game-card week badge text (`PRESEASON WEEK X` and `WEEK X`)
	- offseason fallback label (`YYYY Season`) when no future games
	- above-the-fold visibility checks for search/favorites/todo input on laptop and monitor viewports

## Determinism Strategy

E2E tests run `index.html` from filesystem and intercept external requests:
- weather APIs
- geolocation fallbacks
- JSON schedule fetch
- official NFL schedule fetch

This keeps tests stable for CI and local runs.

## Manual Schedule Verification

When validating schedule behavior in browser:

1. Open new tab page DevTools Console
2. Check schedule diagnostics log:

```text
[schedule] source=... games=... issues=... updated=...
```

3. Reset cache if needed:

```js
localStorage.removeItem("scheduleCache");
location.reload();
```

## Troubleshooting

- If `npm` is unavailable in your shell, install Node.js and reopen terminal.
- If Playwright browsers are missing, run `npx playwright install`.
- If e2e tests fail due to browser launch on CI, use Playwright's default headless mode and ensure sandbox prerequisites are available.
