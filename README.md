# David's New Tab - 49ers Themed Browser Extension

A beautiful, fully-featured Chrome/Brave extension that replaces your new tab page with a personalized 49ers-themed dashboard.

## Features

- **Personalized Welcome Header** - "WELCOME BACK, DAVID" in custom 49ers font
- **Real-Time Date & Time** - Auto-updating with large, easy-to-read display (28px)
- **49ers Game Countdown** - Displays days until the next 49ers game
  - Includes **preseason + regular season** next-game logic
  - Shows detailed game card when kickoff is within 7 days
  - Shows a week badge (`PRESEASON WEEK X` / `WEEK X`) on the game card
  - Shows `YYYY Season` in offseason/unknown-next-game periods
- **Dynamic Weather Widget** - Current temperature, conditions, and your location
  - Uses geolocation when available
  - Falls back to IP-based location detection
  - Real-time weather from Open-Meteo API
  - Location reverse-geocoding via Nominatim
- **Quick Search** - DuckDuckGo search directly from the new tab
- **Favorites Grid** - One-click access to your most-visited sites
  - **Right-click to edit or delete** - Context menu for managing favorites
  - **Add new sites** - Plus button to add custom shortcuts
  - **Auto-refresh favicons** - Dynamically fetches site icons
  - **Persistent storage** - Favorites saved to local storage
  - **Undo deletions** - Toast notification with undo option
- **Interactive To-Do List** - Full CRUD operations with persistent storage
  - **Drag-and-drop reordering** - Click and drag to reorganize tasks
  - Click to mark complete/incomplete
  - Local storage persistence across sessions
  - **Inline editing** - Click a task to edit it in place; a small hint appears when editing is available

## Installation

1. **Clone or download this repository** to your computer
2. **Open your browser** (Chrome or Brave)
3. Navigate to `chrome://extensions/` or `brave://extensions/`
4. **Enable "Developer mode"** (toggle in top right)
5. Click **"Load unpacked"**
6. Select this project folder
7. Open a new tab to see your new dashboard!

## Customization

### Update Schedule Data

Primary baseline schedule data lives in [game-schedule.json](game-schedule.json):
- Supports `seasonType` (`PRE`/`REG`)
- Includes opponent, kickoff date/time, location, channel, and logo

At runtime, schedule data flows as:
1. Load versioned cache from localStorage (if valid)
2. Fetch baseline JSON from GitHub (`game-schedule.json`)
3. Weekly (or when gaps/issues are detected), merge from official NFL team schedule HTML

Source + health diagnostics are logged in console as:
- `[schedule] source=... games=... issues=... updated=...`

### Change Theme Colors

Edit hex color values in [style.css](style.css):
- **Primary Red** (`#b30000`) - Headers, accents
- **Dark Red** (`#7a0a0a`) - Text content
- **Background** (`#faf6f0`) - Light beige
- **Todo Box** (`#fff8f2`) - Off-white background

### Manage Favorites

Favorites are managed through the UI with a right-click context menu:
1. **Add sites** - Click the "+" button to add a new favorite
2. **Edit sites** - Right-click any favorite and select "Edit site"
3. **Delete sites** - Right-click and select "Delete site" (undo available)

Default favorites are defined in [script.js](script.js). You can modify this array to change the default shortcuts.

Recent behavior and fixes:
- **Favorites persistence fix**: favorites are now authoritative from the user's saved localStorage value. The code no longer re-merges the saved list with the built-in defaults on every load, so deletions now persist.
- **Favicons**: favicon loading was made more robust to support sites (like some GitHub Pages) that host favicons at page-specific paths. The loader attempts several locations (page `/favicon.ico`, origin `/favicon.ico`, then provider services) and falls back to an inline SVG when needed.
- **Favicon refresh fix**: the favicon refresher now preserves existing query parameters and appends/updates a cache-busting `t=` timestamp parameter so icons refresh without breaking original URLs.
- **Schedule resilience**: countdown now supports preseason + regular season, merges official NFL schedule updates, and validates schedule integrity (duplicate keys, invalid dates/logos, missing fields).
- **Cache invalidation**: schedule cache is now versioned so incompatible/stale cache payloads are automatically discarded.
- **Optional debug logs**: set `localStorage.debugMode = "true"` in DevTools to enable verbose weather/favicon logs.

### Personalize the Welcome Message

Edit the welcome text in [index.html](index.html#L17):
```html
<div class="welcome">WELCOME BACK, DAVID</div>
```

## Project Structure

```
49ers-newtab/
├── manifest.json          # Extension configuration (Manifest v3)
├── index.html             # Main new tab page HTML
├── style.css              # 49ers color scheme & layout
├── script.js              # JavaScript logic for all features
├── fonts/
│   └── sf-sports-night.ttf # Custom NinersBlock font
├── icon.png               # Extension icon
├── AGENTS.md              # Development guidelines
└── README.md              # This file

## Recent Changes (summary)

- Switched quick search from Google to DuckDuckGo for privacy-focused searches. See `index.html` and `script.js`.
- Fixed favorites deletion persistence so user deletions are retained across reloads.
- Improved favicon loading logic to try multiple sources (page path, origin root, Google s2/DuckDuckGo providers) and added console diagnostics for debugging favicon loading.
- Fixed favicon refresh logic to preserve existing URL params and append a cache-busting timestamp parameter.
- Added inline editing to the todo list with a small UI hint when editing is available.
- Weather provider/location behavior: implemented a "city-center" resolution option that resolves to a canonical city center (when enabled) and requests temperatures in Fahrenheit directly from Open-Meteo to reduce discrepancies with OS widgets.
- Test scaffolding: added unit tests (Jest) and Playwright e2e tests with deterministic network mocks so schedule/weather tests do not rely on external services.

## Testing & Development

This project now includes a small test scaffold for deterministic unit and e2e tests.

Install dependencies and Playwright browsers:

```bash
npm install
npx playwright install
```

Run unit tests (Jest):

```bash
npm test
# or
npm run test:unit
```

Run Playwright e2e smoke tests:

```bash
npm run test:e2e
```

Run all tests:

```bash
npm run test:all
```

Notes about the tests:
- Unit tests live under `tests/unit/`:
  - `helpers.test.js` for generic helpers
  - `schedule.test.js` for parser/key/sort/validation/offseason behavior
  - `schedule-data.test.js` for `game-schedule.json` quality checks (unique keys, NFL logo URLs, PRE/REG presence)
- Playwright e2e tests live under `tests/e2e/`:
  - `smoke.spec.js` basic page boot + weather/favorites rendering
  - `schedule-states.spec.js` preseason/regular week badge text, offseason `YYYY Season`, and above-the-fold layout checks for laptop/monitor viewports
- E2E tests intercept weather/schedule requests and return canned responses for deterministic runs.
- If you prefer to run the extension in a browser for manual testing, load the folder from `chrome://extensions` as described in the Installation section.

Files of interest for developers:
- `script.js` — core logic and recent fixes
- `helpers.js` — small exported helpers used by unit tests
- `game-schedule.json` — baseline schedule data (`PRE`/`REG` entries)
- `tests/unit/` — Jest unit tests
- `tests/e2e/` — Playwright smoke test with network mocks
- `package.json` — test scripts: `test`, `test:unit`, `test:e2e`, `test:all`

If you want me to add CI config (GitHub Actions) to run these tests automatically, I can scaffold that for you.
```

## Technical Details

### Architecture

- **Manifest V3** - Modern Chrome extension standard with security-first design
- **Vanilla JavaScript** - No frameworks or build tools needed
- **Local Storage** - Todo items persist across browser sessions
- **Third-Party APIs**:
  - [Open-Meteo](https://open-meteo.com/) - Weather data (no API key required)
  - [Nominatim](https://nominatim.org/) - Reverse geocoding for location names
  - [ipapi.co](https://ipapi.co/) - IP-based geolocation fallback

### Key Functions

| Function | Purpose |
|----------|---------|
| `getWeather()` | Fetches geolocation and weather data |
| `updateDateTime()` | Updates date/time display every second |
| `updateCountdown()` | Calculates and renders next-game countdown/card |
| `parseNflSchedulePage()` | Parses official NFL by-team schedule HTML |
| `checkScheduleUpdates()` | Handles weekly refresh/merge and cache updates |
| `validateScheduleData()` | Detects duplicate/invalid schedule entries |
| `renderTasks()` | Displays todo list with drag-and-drop support |
| `saveTasks()` | Persists todo list to localStorage |

### Permissions Required

- **geolocation** - Fetches user's GPS coordinates (falls back to IP if denied)
- **host_permissions** - Access to weather and geocoding APIs

### Data Storage

Todo items are stored in browser's `localStorage` under the key `"tasks"`:
```javascript
[
  { text: "Task description", completed: false },
  { text: "Another task", completed: true }
]
```

Schedule cache is stored in localStorage under `scheduleCache` with:
- `version`
- `season`
- `source`
- `issues`
- `updatedAt`
- `games`

## Drag-and-Drop Todo Reordering

Fully implemented with visual feedback:
- **Hover** - Todo items show a lighter background
- **Grab cursor** - Indicates the item is draggable
- **Dragging** - Item becomes semi-transparent (50% opacity)
- **Drop target** - Shows red highlight where the item will land
- **Auto-save** - New order is saved to localStorage automatically

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Brave
- ⚠️ Edge (should work, but not officially tested)
- ❌ Firefox (requires WebExtensions conversion)
- ❌ Safari (requires Safari App Extension conversion)

## Troubleshooting

### Weather Shows "Location Unavailable"

1. Check browser console (F12 > Console tab)
2. Verify geolocation permission is enabled in site settings
3. Extension will automatically fall back to IP-based location
4. Nominatim API may need a moment to reverse-geocode

### Todo Items Not Persisting

- Clear browser cache and reload extension
- Check that localStorage is enabled in your browser
- Verify you're on the actual new tab page (not a bookmarked version)

### Font Not Displaying Correctly

- Ensure `fonts/sf-sports-night.ttf` exists in the project folder
- Reload the extension from `chrome://extensions/`

### Schedule Looks Stale or Wrong

1. Open DevTools Console on the new tab page
2. Check `[schedule] source=... issues=...` log line
3. Clear schedule cache and reload:

```js
localStorage.removeItem("scheduleCache");
location.reload();
```

## Development

The extension is production-ready and requires minimal maintenance:
- Auto-updating weather fetches every hour
- Favicon icons refresh every 5 minutes
- Game countdown updates every hour

### To Modify:

1. Edit files locally
2. Go to `chrome://extensions/`
3. Click the refresh icon for "David's New Tab"
4. Open a new tab to see changes

No build process or compilation needed!

## Font Information

Uses **SF Sports Night** ("NinersBlock" alias) custom font for authentic 49ers branding. Font file included in `fonts/` directory.

## Future Enhancement Ideas

- [ ] Weather forecast (5-day)
- [ ] Customizable shortcuts/favorites limit
- [ ] Dark mode toggle
- [ ] Recent browsing history
- [ ] Notes section
- [ ] Calendar integration
- [ ] Stock ticker
- [ ] Custom background images

## License

Personal project - feel free to modify for your own use!

---

**Created for 49ers fans** ⚫🔴 • Built with vanilla JavaScript • Made with ❤️
