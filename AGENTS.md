# 49ers New Tab Extension - Agent Guide

## Project Overview
A Chrome extension that replaces the new tab page with a 49ers-themed dashboard featuring:
- Personalized welcome header
- Current date/time display
- Countdown to the next 49ers game (updated from game date)
- Interactive to-do list with local storage persistence

## Architecture
- **Manifest**: `manifest.json` (Manifest v3, defines extension metadata and overrides)
- **Entry Point**: `index.html` (single-page new tab page)
- **Styling**: `style.css` (49ers color scheme with custom NinersBlock font)
- **Logic**: `script.js` (date/time updates, countdown, todo CRUD operations)
- **Assets**: `fonts/sf-sports-night.ttf` (custom 49ers font), `icon.png`

## Design Conventions

### Color Scheme
- **Primary Red**: `#b30000` (49ers brand color, used for titles/accents)
- **Dark Red**: `#7a0a0a` (text color, used for main content)
- **Background**: `#faf6f0` (light beige)
- **Todo Box**: `#fff8f2` (off-white background for contrast)

### Typography
- **Custom Font**: "NinersBlock" (SF Sports Night font) for display text
- **Font Sizes**: Header 48px, date/time 40px, countdown 60px, titles 36px
- **Letter Spacing**: Headers use increased letter-spacing (2-3px) for impact

### Layout Patterns
- All content is centered (`text-align: center`)
- Vertical spacing uses consistent 60px margins between sections
- Todo list is contained in a bordered box (3px #b30000 border, 10px border-radius)
- Flexbox is used for input controls alignment

## Key Implementation Details

### JavaScript Modules
1. **updateDateTime()**: Runs every 1000ms to keep time/date current
2. **updateCountdown()**: Runs every hour, calculates days to game date (line 31: `new Date("2026-09-10T13:00:00")`)
3. **Todo List**: Uses `localStorage` with key "tasks" to persist across sessions

### Todo Data Structure
```javascript
{
  text: "task description",
  completed: false  // toggle via click on .todo-text
}
```

### Event Listeners
- Add button: click event on `#add-btn`
- Enter key: keydown on `#todo-input`
- Toggle/delete: click delegation on `#todo-list` targeting `.todo-text` or `.delete-btn`

## Common Tasks

### Updating the Game Date
- Edit the date string in `script.js` line 31
- Format: `"YYYY-MM-DDTHH:mm:ss"` (UTC timezone)

### Changing Theme Colors
- Modify hex values in `style.css` (search for `#b30000` or `#7a0a0a`)
- Ensure sufficient contrast for accessibility

### Adding Features
- New DOM elements should be added to `index.html`
- New styles go in `style.css` (maintain NinersBlock font usage)
- New JavaScript goes in `script.js` at the end or in appropriately named sections

### Testing in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. Test new tab behavior

## Known Issues / Warnings
- `style.css` contains duplicate rules (lines 107+ duplicate earlier content) — these should be cleaned up
- Manual correction needed if CSS file becomes corrupted
