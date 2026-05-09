# David's New Tab - 49ers Themed Browser Extension

A beautiful, fully-featured Chrome/Brave extension that replaces your new tab page with a personalized 49ers-themed dashboard.

## Features

- **Personalized Welcome Header** - "WELCOME BACK, DAVID" in custom 49ers font
- **Real-Time Date & Time** - Auto-updating with large, easy-to-read display (28px)
- **49ers Game Countdown** - Displays days until the next 49ers game
- **Dynamic Weather Widget** - Current temperature, conditions, and your location
  - Uses geolocation when available
  - Falls back to IP-based location detection
  - Real-time weather from Open-Meteo API
  - Location reverse-geocoding via Nominatim
- **Quick Search** - Google search directly from the new tab
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

## Installation

1. **Clone or download this repository** to your computer
2. **Open your browser** (Chrome or Brave)
3. Navigate to `chrome://extensions/` or `brave://extensions/`
4. **Enable "Developer mode"** (toggle in top right)
5. Click **"Load unpacked"**
6. Select this project folder
7. Open a new tab to see your new dashboard!

## Customization

### Update the Game Date

Edit the game date in [script.js](script.js#L128):
```javascript
const gameDate = new Date("2026-09-10T13:00:00");
```
Change the date string to your desired game date (format: `YYYY-MM-DDTHH:mm:ss`).

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

Default favorites are defined in [script.js](script.js#L219-L234). You can modify this array to change the default shortcuts.

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
| `updateCountdown()` | Calculates days to next 49ers game |
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
