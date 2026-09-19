# David's New Tab

David's New Tab is a personal Chrome and Brave extension that replaces the
browser's new-tab page with a San Francisco 49ers-themed dashboard. It combines
a game countdown, weather, search, editable favorites, and a persistent to-do
list in a dependency-free browser interface.

The extension is distributed as source for manual installation; it is not
published in a browser extension store.

## Features

- Personalized welcome, current date, and continuously updated clock.
- Preseason and regular-season 49ers game countdown with game details near
  kickoff.
- Weather from Open-Meteo using browser geolocation or an IP-based fallback.
- DuckDuckGo search from the new-tab page.
- Editable favorites with favicon lookup, reordering, deletion, and undo.
- To-do creation, inline editing, completion, deletion, and drag-and-drop
  ordering.
- Versioned schedule caching with validation and refresh diagnostics.
- Local persistence for favorites, tasks, and schedule data.

## Install locally

1. Clone or download this repository.
2. Open `chrome://extensions/` in Chrome or `brave://extensions/` in Brave.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the repository directory.
5. Open a new tab.

After changing extension files, use the extension page's reload control. Do not
remove and reinstall the extension unless you intend to clear its extension
storage.

## Privacy and network access

Favorites and tasks remain in the browser's extension-local `localStorage`.
The extension does not provide an account or synchronize that data between
devices.

The dashboard can make requests to:

- Open-Meteo for weather and geocoding;
- Nominatim for reverse geocoding;
- ipapi.co when browser geolocation is unavailable or denied;
- this repository's raw `game-schedule.json` file;
- the official NFL team schedule page for schedule updates; and
- favicon sources for favorite-site icons.

Granting geolocation is optional. Denying it causes the weather feature to try
the IP-based fallback, which shares the requester's IP address with that
provider. Review `manifest.json` before installation for the complete extension
permission and host-permission list.

## Schedule data

The tracked baseline lives in [`game-schedule.json`](game-schedule.json). Each
entry identifies its season type, opponent, kickoff time, location, channel,
and logo. At runtime the extension validates cached data, loads the baseline,
and periodically attempts to merge official schedule updates.

Schedule diagnostics use this console format:

```text
[schedule] source=... games=... issues=... updated=...
```

To discard only the schedule cache while troubleshooting, run this in the
new-tab page's developer console:

```javascript
localStorage.removeItem("scheduleCache");
location.reload();
```

## Personalization

- Change the welcome text in `index.html`.
- Change the built-in favorite shortcuts in `script.js`.
- Change the tracked baseline schedule in `game-schedule.json`.
- Change theme colors and layout in `style.css`.

Favorites edited through the interface become authoritative in local storage;
the extension does not re-add deleted built-in favorites on every load.

## Development and testing

Install the locked development dependencies:

```bash
npm ci
npx playwright install
```

Run the unit tests, browser tests, or both:

```bash
npm run test:unit
npm run test:e2e
npm run test:all
```

Unit tests cover helpers, schedule behavior, and baseline schedule quality.
Playwright tests use deterministic network mocks for startup, schedule states,
weather, favorites, to-do behavior, and representative viewport layouts. See
[`TESTING.md`](TESTING.md) for the detailed test inventory.

## Project structure

```text
49ers-newtab/
|-- manifest.json          Extension metadata and permissions
|-- index.html             New-tab document
|-- style.css              Layout and theme
|-- script.js              Dashboard and persistence behavior
|-- helpers.js             Testable utility functions
|-- game-schedule.json     Versioned baseline schedule
|-- tests/unit/            Jest tests
|-- tests/e2e/             Playwright tests
|-- fonts/                 Local display font
|-- icon.png               Extension icon
`-- background.png         Dashboard artwork
```

## Known limitations

- Chrome and Brave are the manually supported browsers. Edge may work but is
  not part of the documented test target; Firefox and Safari require platform
  adaptation.
- Schedule updates depend on the structure and availability of third-party
  pages and may require a tracked baseline update.
- Weather and favicon providers can be unavailable, rate-limited, or return
  results that differ from another weather or icon service.
- Browser-local data can be lost if extension storage is cleared or the
  extension is removed.
- The extension is a personal fan project and is not affiliated with or
  endorsed by the San Francisco 49ers or the NFL.

## License status

This repository does not currently include an open-source license. Public
source availability permits review but does not grant general reuse or
redistribution rights.
