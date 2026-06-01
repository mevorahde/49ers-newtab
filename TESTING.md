Testing setup

1) Install dev dependencies:

```bash
npm install
npx playwright install
```

2) Run unit tests (Jest):

```bash
npm test
```

3) Run e2e smoke tests (Playwright):

```bash
npm run test:e2e
```

Notes
- The Playwright test loads `index.html` from the filesystem — if your page depends on extension APIs this may differ from running as an unpacked extension.
- If tests fail due to network calls (weather fetch), consider disabling those calls during tests or mocking network responses.
