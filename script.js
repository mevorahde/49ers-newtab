// -------------------------
// WEATHER
// -------------------------
const weatherInfo = {
  0: { label: "Clear", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Foggy", icon: "🌫️" },
  51: { label: "Drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Drizzle", icon: "🌧️" },
  61: { label: "Rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Rain", icon: "🌧️" },
  71: { label: "Snow", icon: "❄️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Snow", icon: "❄️" },
  80: { label: "Showers", icon: "🌦️" },
  81: { label: "Showers", icon: "🌦️" },
  82: { label: "Rain showers", icon: "🌧️" },
  95: { label: "Thunder", icon: "⛈️" },
  96: { label: "Thunder", icon: "⛈️" },
  99: { label: "Thunder", icon: "⛈️" }
};

// Configuration: how to resolve location for weather queries.
// Options:
// - 'precise' : use the exact browser geolocation coordinates (default high-accuracy)
// - 'city'    : resolve to the city/town center (closer to what OS-level widgets show)
// - 'ip'      : use IP-based coords (less accurate)
const weatherLocationMode = "city";

const debugMode = (() => {
  try {
    return localStorage.getItem("debugMode") === "true";
  } catch {
    return false;
  }
})();

function debugLog(...args) {
  if (debugMode) {
    console.log(...args);
  }
}

function debugTrace(...args) {
  if (debugMode) {
    console.debug(...args);
  }
}

function fetchWeatherData(latitude, longitude, displayName) {
  debugLog(`Fetching weather for coords: ${latitude}, ${longitude}`);
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

  // Fetch weather data
  fetch(weatherUrl)
    .then((res) => res.json())
    .then((weatherData) => {
      debugLog("Weather API response:", weatherData);
      
      if (!weatherData.current_weather || !weatherData.daily) {
        throw new Error("Incomplete weather data in response");
      }
      
      const current = weatherData.current_weather;
      const temp = Math.round(current.temperature);
      const weatherCode = current.weathercode;
      const info = weatherInfo[weatherCode] || { label: "Unknown", icon: "❔" };

      document.getElementById("weather-icon").textContent = info.icon;
      document.getElementById("weather-temp").textContent = `${temp}°`;
      document.getElementById("weather-desc").textContent = info.label;

      // If caller provided a display name (city-level), prefer that over reverse geocoding
      if (displayName) {
        document.getElementById("weather-location").textContent = displayName;
      }
      
      debugLog(`Weather updated: ${info.label} ${info.icon}`);
    })
    .catch((error) => {
      console.error("Weather fetch failed:", error);
      document.getElementById("weather-temp").textContent = "--°";
      document.getElementById("weather-desc").textContent = "Error";
      document.getElementById("weather-icon").textContent = "❌";
    });

  // Only reverse-geocode if caller didn't provide a display name
  if (!displayName) {
    const locationUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    debugLog(`Fetching location from: ${locationUrl}`);
    fetch(locationUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })
      .then((res) => res.json())
      .then((locationData) => {
        debugLog("Location data received:", locationData);
        const address = locationData.address;
        if (address) {
          // Try to get the most specific city-level location
          const city = address.city || address.town || address.village || address.county || "Unknown";
          const state = address.state || "";
          const locationText = state ? `${city}, ${state}` : city;
          debugLog(`Location set to: ${locationText}`);
          document.getElementById("weather-location").textContent = locationText;
        } else {
          console.warn("No address data in location response");
          document.getElementById("weather-location").textContent = "Location unavailable";
        }
      })
      .catch((error) => {
        console.error("Location fetch failed:", error);
        document.getElementById("weather-location").textContent = "Location unavailable";
      });
  }
}

// Resolve coordinates according to `weatherLocationMode`.
// Returns a promise that resolves to { latitude, longitude, displayName }
function resolveLocationCoords(latitude, longitude) {
  if (weatherLocationMode === "precise") {
    return Promise.resolve({ latitude, longitude, displayName: null });
  }

  if (weatherLocationMode === "city") {
    // Reverse first to get the city name, then search for the canonical city center
    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    return fetch(reverseUrl, { headers: { 'Accept': 'application/json' } })
      .then((res) => res.json())
      .then((locationData) => {
        const address = locationData.address || {};
        const city = address.city || address.town || address.village || address.county;
        const state = address.state || "";
        if (!city) return { latitude, longitude, displayName: null };
        const query = state ? `${city}, ${state}` : city;
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        return fetch(searchUrl, { headers: { 'Accept': 'application/json' } })
          .then((r) => r.json())
          .then((results) => {
            if (results && results[0]) {
              return {
                latitude: parseFloat(results[0].lat),
                longitude: parseFloat(results[0].lon),
                displayName: `${city}${state ? ', ' + state : ''}`
              };
            }
            return { latitude, longitude, displayName: `${city}${state ? ', ' + state : ''}` };
          })
          .catch(() => ({ latitude, longitude, displayName: `${city}${state ? ', ' + state : ''}` }));
      })
      .catch(() => ({ latitude, longitude, displayName: null }));
  }

  // default: return input coords
  return Promise.resolve({ latitude, longitude, displayName: null });
}

function getWeatherByIP() {
  // Use IP-based geolocation via ipapi.co
  debugLog("Using IP-based geolocation");
  fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .then((data) => {
      debugLog("IP geolocation data:", data);
      if (data.latitude && data.longitude) {
        debugLog(`IP geolocation successful: ${data.latitude}, ${data.longitude}`);
        resolveLocationCoords(data.latitude, data.longitude).then((resolved) => {
          fetchWeatherData(resolved.latitude, resolved.longitude, resolved.displayName);
        });
      } else {
        console.warn("IP geolocation data missing coordinates");
        document.getElementById("weather-location").textContent = "Location unavailable";
      }
    })
    .catch((error) => {
      console.error("IP geolocation failed:", error);
      document.getElementById("weather-location").textContent = "Location unavailable";
      document.getElementById("weather-desc").textContent = "Error";
    });
}

function getWeather() {
  debugLog("Starting weather fetch");
  // Try geolocation first, but fall back to IP immediately if unavailable
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        debugLog("Geolocation successful:", position.coords);
        const { latitude, longitude } = position.coords;
        resolveLocationCoords(latitude, longitude).then((resolved) => {
          fetchWeatherData(resolved.latitude, resolved.longitude, resolved.displayName);
        });
      },
      (error) => {
        console.error("Geolocation error code:", error.code, "message:", error.message);
        debugLog("Falling back to IP-based geolocation");
        getWeatherByIP();
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,  // FORCE HIGH ACCURACY - ignores cached data
        maximumAge: 0  // NO CACHE - always fetch fresh location
      }
    );
  } else {
    debugLog("Geolocation API not available, using IP fallback");
    getWeatherByIP();
  }
}
getWeather();
// Refresh weather every 30 minutes
setInterval(getWeather, 30 * 60 * 1000);

// -------------------------
// DATE & TIME
// -------------------------
function updateDateTime() {
  const now = new Date();

  const dateOptions = {
    weekday: "short",
    month: "short",
    day: "numeric"
  };
  document.getElementById("date").textContent =
    now.toLocaleDateString("en-US", dateOptions);

  const timeOptions = {
    hour: "numeric",
    minute: "2-digit"
  };
  document.getElementById("time").textContent =
    now.toLocaleTimeString("en-US", timeOptions);
}

updateDateTime();
setInterval(updateDateTime, 1000);

// -------------------------
// COUNTDOWN TO NEXT GAME
// -------------------------
const scheduleSource = {
  season: 2026,
  jsonUrl: "https://raw.githubusercontent.com/mevorahde/49ers-newtab/main/game-schedule.json",
  officialNflTeamScheduleUrl: "https://www.nfl.com/schedules/2026/by-team/san-francisco-49ers",
  cacheKey: "scheduleCache",
  cacheVersion: 2,
  lastCheckedKey: "scheduleLastChecked",
  weeklyCheckMs: 7 * 24 * 60 * 60 * 1000,
  expectedRegularGameCount: 17,
  expectedPreseasonGameCount: 3
};

function nflClubLogo(code) {
  return `https://static.www.nfl.com/f_auto,h_80,dpr_2.0,q_auto,w_80/league/api/clubs/logos/${code}`;
}

const teamLogoMap = {
  "Los Angeles Rams": nflClubLogo("LA"),
  "Miami Dolphins": nflClubLogo("MIA"),
  "Arizona Cardinals": nflClubLogo("AZ"),
  "Denver Broncos": nflClubLogo("DEN"),
  "Seattle Seahawks": nflClubLogo("SEA"),
  "Washington Commanders": nflClubLogo("WAS"),
  "Atlanta Falcons": nflClubLogo("ATL"),
  "Las Vegas Raiders": nflClubLogo("LV"),
  "Dallas Cowboys": nflClubLogo("DAL"),
  "Minnesota Vikings": nflClubLogo("MIN"),
  "New York Giants": nflClubLogo("NYG"),
  "Philadelphia Eagles": nflClubLogo("PHI"),
  "Los Angeles Chargers": nflClubLogo("LAC"),
  "Kansas City Chiefs": nflClubLogo("KC"),
  "Tennessee Titans": nflClubLogo("TEN")
};

const defaultSchedule = [
  {
    week: 1,
    opponent: "Los Angeles Rams",
    date: "2026-09-10T17:35:00-07:00",
    location: "at",
    channel: "Netflix",
    logo: teamLogoMap["Los Angeles Rams"]
  },
  {
    week: 2,
    opponent: "Miami Dolphins",
    date: "2026-09-20T13:25:00-07:00",
    location: "vs",
    channel: "Fox",
    logo: teamLogoMap["Miami Dolphins"]
  },
  {
    week: 3,
    opponent: "Arizona Cardinals",
    date: "2026-09-27T13:05:00-07:00",
    location: "vs",
    channel: "TBD",
    logo: teamLogoMap["Arizona Cardinals"]
  },
  {
    week: 4,
    opponent: "Denver Broncos",
    date: "2026-10-04T13:25:00-07:00",
    location: "vs",
    channel: "CBS",
    logo: teamLogoMap["Denver Broncos"]
  },
  {
    week: 5,
    opponent: "Seattle Seahawks",
    date: "2026-10-11T13:25:00-07:00",
    location: "at",
    channel: "Fox",
    logo: teamLogoMap["Seattle Seahawks"]
  },
  {
    week: 6,
    opponent: "Washington Commanders",
    date: "2026-10-19T17:15:00-07:00",
    location: "vs",
    channel: "ESPN/ABC",
    logo: teamLogoMap["Washington Commanders"]
  },
  {
    week: 7,
    opponent: "Atlanta Falcons",
    date: "2026-10-25T10:00:00-07:00",
    location: "at",
    channel: "Fox",
    logo: teamLogoMap["Atlanta Falcons"]
  },
  {
    week: 9,
    opponent: "Las Vegas Raiders",
    date: "2026-11-08T13:05:00-08:00",
    location: "vs",
    channel: "CBS",
    logo: teamLogoMap["Las Vegas Raiders"]
  },
  {
    week: 10,
    opponent: "Dallas Cowboys",
    date: "2026-11-15T13:25:00-08:00",
    location: "at",
    channel: "Fox",
    logo: teamLogoMap["Dallas Cowboys"]
  },
  {
    week: 11,
    opponent: "Minnesota Vikings",
    date: "2026-11-22T17:20:00-08:00",
    location: "vs",
    channel: "NBC",
    logo: teamLogoMap["Minnesota Vikings"]
  },
  {
    week: 12,
    opponent: "Seattle Seahawks",
    date: "2026-11-29T13:25:00-08:00",
    location: "vs",
    channel: "Fox",
    logo: teamLogoMap["Seattle Seahawks"]
  },
  {
    week: 13,
    opponent: "New York Giants",
    date: "2026-12-06T10:00:00-08:00",
    location: "at",
    channel: "Fox",
    logo: teamLogoMap["New York Giants"]
  },
  {
    week: 14,
    opponent: "Los Angeles Rams",
    date: "2026-12-13T13:25:00-08:00",
    location: "vs",
    channel: "Fox",
    logo: teamLogoMap["Los Angeles Rams"]
  },
  {
    week: 15,
    opponent: "Los Angeles Chargers",
    date: "2026-12-17T17:15:00-08:00",
    location: "at",
    channel: "Prime Video",
    logo: teamLogoMap["Los Angeles Chargers"]
  },
  {
    week: 16,
    opponent: "Kansas City Chiefs",
    date: "2026-12-27T13:25:00-08:00",
    location: "at",
    channel: "CBS",
    logo: teamLogoMap["Kansas City Chiefs"]
  },
  {
    week: 17,
    opponent: "Philadelphia Eagles",
    date: "2027-01-03T17:20:00-08:00",
    location: "vs",
    channel: "NBC",
    logo: teamLogoMap["Philadelphia Eagles"]
  }
];

let schedule = [];
let scheduleLoaded = false;
let scheduleMeta = {
  source: "unknown",
  issues: [],
  lastUpdated: null
};

function parsePST(dateString) {
  const date = new Date(dateString);
  const pstOptions = {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  };
  return date.toLocaleTimeString("en-US", pstOptions);
}

function formatGameDate(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "short",
    month: "short",
    day: "numeric"
  };
  return date.toLocaleDateString("en-US", options);
}

function teamLogoUrl(opponent) {
  return teamLogoMap[opponent] || "";
}

function normalizeLogoUrl(logo, opponent) {
  const fallback = teamLogoUrl(opponent);
  if (!logo) return fallback;
  if (/^https:\/\/static\.www\.nfl\.com\//i.test(logo)) return logo;
  if (/upload\.wikimedia\.org/i.test(logo)) return fallback || logo;
  return logo;
}

function decodeHtmlEntities(value) {
  return (value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function teamSlugToName(teamSlug) {
  const map = {
    "cardinals": "Arizona Cardinals",
    "falcons": "Atlanta Falcons",
    "ravens": "Baltimore Ravens",
    "bills": "Buffalo Bills",
    "panthers": "Carolina Panthers",
    "bears": "Chicago Bears",
    "bengals": "Cincinnati Bengals",
    "browns": "Cleveland Browns",
    "cowboys": "Dallas Cowboys",
    "broncos": "Denver Broncos",
    "lions": "Detroit Lions",
    "packers": "Green Bay Packers",
    "texans": "Houston Texans",
    "colts": "Indianapolis Colts",
    "jaguars": "Jacksonville Jaguars",
    "chiefs": "Kansas City Chiefs",
    "raiders": "Las Vegas Raiders",
    "chargers": "Los Angeles Chargers",
    "rams": "Los Angeles Rams",
    "dolphins": "Miami Dolphins",
    "vikings": "Minnesota Vikings",
    "patriots": "New England Patriots",
    "saints": "New Orleans Saints",
    "giants": "New York Giants",
    "jets": "New York Jets",
    "eagles": "Philadelphia Eagles",
    "steelers": "Pittsburgh Steelers",
    "seahawks": "Seattle Seahawks",
    "buccaneers": "Tampa Bay Buccaneers",
    "titans": "Tennessee Titans",
    "commanders": "Washington Commanders",
    "arizona-cardinals": "Arizona Cardinals",
    "atlanta-falcons": "Atlanta Falcons",
    "baltimore-ravens": "Baltimore Ravens",
    "buffalo-bills": "Buffalo Bills",
    "carolina-panthers": "Carolina Panthers",
    "chicago-bears": "Chicago Bears",
    "cincinnati-bengals": "Cincinnati Bengals",
    "cleveland-browns": "Cleveland Browns",
    "dallas-cowboys": "Dallas Cowboys",
    "denver-broncos": "Denver Broncos",
    "detroit-lions": "Detroit Lions",
    "green-bay-packers": "Green Bay Packers",
    "houston-texans": "Houston Texans",
    "indianapolis-colts": "Indianapolis Colts",
    "jacksonville-jaguars": "Jacksonville Jaguars",
    "kansas-city-chiefs": "Kansas City Chiefs",
    "las-vegas-raiders": "Las Vegas Raiders",
    "los-angeles-chargers": "Los Angeles Chargers",
    "los-angeles-rams": "Los Angeles Rams",
    "miami-dolphins": "Miami Dolphins",
    "minnesota-vikings": "Minnesota Vikings",
    "new-england-patriots": "New England Patriots",
    "new-orleans-saints": "New Orleans Saints",
    "new-york-giants": "New York Giants",
    "new-york-jets": "New York Jets",
    "philadelphia-eagles": "Philadelphia Eagles",
    "pittsburgh-steelers": "Pittsburgh Steelers",
    "san-francisco-49ers": "San Francisco 49ers",
    "seattle-seahawks": "Seattle Seahawks",
    "tampa-bay-buccaneers": "Tampa Bay Buccaneers",
    "tennessee-titans": "Tennessee Titans",
    "washington-commanders": "Washington Commanders"
  };
  return map[teamSlug] || teamSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseTeamsFromGameSlug(gameSlug) {
  const gameTail = new RegExp(`-${scheduleSource.season}-(pre|reg)-(\\d+)$`);
  const weekMatch = gameSlug.match(gameTail);
  if (!weekMatch) return null;

  const seasonType = weekMatch[1].toUpperCase();
  const week = parseInt(weekMatch[2], 10);
  const teamsPart = gameSlug.replace(gameTail, "");

  if (teamsPart.startsWith("49ers-at-")) {
    const opponentSlug = teamsPart.replace("49ers-at-", "");
    return { seasonType, week, location: "at", opponent: teamSlugToName(opponentSlug) };
  }

  if (teamsPart.endsWith("-at-49ers")) {
    const opponentSlug = teamsPart.replace(/-at-49ers$/, "");
    return { seasonType, week, location: "vs", opponent: teamSlugToName(opponentSlug) };
  }

  return null;
}

function getGameKey(game) {
  const seasonType = (game.seasonType || "REG").toUpperCase();
  return `${seasonType}-${game.week}`;
}

function getGameSortValue(game) {
  if (game.date) {
    const parsed = new Date(game.date).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  const seasonRank = {
    PRE: 1,
    REG: 2,
    POST: 3
  };
  const rank = seasonRank[(game.seasonType || "REG").toUpperCase()] || 9;
  return scheduleSource.season * 1000000 + rank * 1000 + (game.week || 0);
}

function validateScheduleData(games) {
  const issues = [];
  const seen = new Set();

  (games || []).forEach((game) => {
    const seasonType = (game.seasonType || "REG").toUpperCase();
    const key = `${seasonType}-${game.week}`;

    if (seen.has(key)) {
      issues.push(`Duplicate game key: ${key}`);
    } else {
      seen.add(key);
    }

    if (!game.week || !game.opponent || !game.location) {
      issues.push(`Missing required fields for game key: ${key}`);
    }

    if (!game.date || Number.isNaN(new Date(game.date).getTime())) {
      issues.push(`Invalid or missing date for game key: ${key}`);
    }

    if (!game.logo || !/^https:\/\/static\.www\.nfl\.com\//i.test(game.logo)) {
      issues.push(`Non-official or missing logo for game key: ${key}`);
    }
  });

  return issues;
}

function logScheduleMeta() {
  const issueCount = scheduleMeta.issues.length;
  console.info(
    `[schedule] source=${scheduleMeta.source} games=${schedule.length} issues=${issueCount} updated=${scheduleMeta.lastUpdated || "n/a"}`
  );
  if (issueCount) {
    console.warn("[schedule] validation issues:", scheduleMeta.issues);
  }
}

function loadCachedSchedule() {
  try {
    const cachedText = localStorage.getItem(scheduleSource.cacheKey);
    if (!cachedText) return null;
    const cached = JSON.parse(cachedText);
    if (
      cached &&
      cached.version === scheduleSource.cacheVersion &&
      cached.season === scheduleSource.season &&
      Array.isArray(cached.games)
    ) {
      scheduleMeta.source = cached.source || "cache";
      scheduleMeta.issues = Array.isArray(cached.issues) ? cached.issues : [];
      scheduleMeta.lastUpdated = cached.updatedAt || null;
      return cached.games;
    }

    // stale cache shape/version, clear it so we rebuild from canonical sources
    localStorage.removeItem(scheduleSource.cacheKey);
  } catch {
    // ignore
  }
  return null;
}

function saveCachedSchedule() {
  try {
    localStorage.setItem(
      scheduleSource.cacheKey,
      JSON.stringify({
        version: scheduleSource.cacheVersion,
        season: scheduleSource.season,
        source: scheduleMeta.source,
        issues: scheduleMeta.issues,
        updatedAt: new Date().toISOString(),
        games: schedule
      })
    );
  } catch {
    console.warn("Unable to cache schedule locally.");
  }
}

function applyScheduleData(games) {
  if (Array.isArray(games) && games.length > 0) {
    schedule = games
      .map((game) => ({
        ...game,
        seasonType: (game.seasonType || "REG").toUpperCase(),
        logo: normalizeLogoUrl(game.logo, game.opponent)
      }))
      .sort((a, b) => getGameSortValue(a) - getGameSortValue(b));

    scheduleMeta.issues = validateScheduleData(schedule);
    scheduleMeta.lastUpdated = new Date().toISOString();
    scheduleLoaded = true;
    logScheduleMeta();
    return true;
  }
  return false;
}

function mergeScheduleData(newGames) {
  const existingByWeek = Object.fromEntries(schedule.map((game) => [getGameKey(game), game]));
  let changed = false;

  newGames.forEach((incoming) => {
    const normalizedIncoming = {
      ...incoming,
      seasonType: (incoming.seasonType || "REG").toUpperCase(),
      logo: normalizeLogoUrl(incoming.logo, incoming.opponent)
    };
    const gameKey = getGameKey(normalizedIncoming);
    const existing = existingByWeek[gameKey];
    if (!existing) {
      existingByWeek[gameKey] = normalizedIncoming;
      changed = true;
      return;
    }

    const merged = { ...existing };
    ["opponent", "date", "location", "channel", "logo"].forEach((field) => {
      if (normalizedIncoming[field] && normalizedIncoming[field] !== "TBD" && normalizedIncoming[field] !== merged[field]) {
        merged[field] = normalizedIncoming[field];
      }
    });

    if (JSON.stringify(merged) !== JSON.stringify(existing)) {
      existingByWeek[gameKey] = merged;
      changed = true;
    }
  });

  schedule = Object.values(existingByWeek).sort((a, b) => getGameSortValue(a) - getGameSortValue(b));
  return changed;
}

function loadSchedule() {
  const cached = loadCachedSchedule();
  if (cached) {
    scheduleMeta.source = scheduleMeta.source || "cache";
    applyScheduleData(cached);
  }

  return fetch(scheduleSource.jsonUrl)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Schedule JSON failed: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      if (applyScheduleData(data)) {
        scheduleMeta.source = "json";
        saveCachedSchedule();
      }
    })
    .catch((error) => {
      console.warn("Failed to load schedule JSON, using fallback or cache.", error);
      if (!schedule.length) {
        scheduleMeta.source = "default";
        applyScheduleData(defaultSchedule);
        saveCachedSchedule();
      }
      scheduleLoaded = true;
    });
}

function hasScheduleGaps() {
  const contentMissing = schedule.some(
    (game) => !game.week || !game.opponent || !game.date || !game.location || !game.channel || !game.logo
  );
  const regularCount = schedule.filter((game) => (game.seasonType || "REG").toUpperCase() === "REG").length;
  const preseasonCount = schedule.filter((game) => (game.seasonType || "REG").toUpperCase() === "PRE").length;
  const countMissing =
    regularCount < scheduleSource.expectedRegularGameCount ||
    preseasonCount < scheduleSource.expectedPreseasonGameCount;
  const preseasonMissing = !schedule.some((game) => (game.seasonType || "REG").toUpperCase() === "PRE");
  const hasValidationIssues = scheduleMeta.issues.length > 0;
  return contentMissing || countMissing || preseasonMissing || hasValidationIssues;
}

function shouldRefreshSchedule() {
  const lastChecked = parseInt(localStorage.getItem(scheduleSource.lastCheckedKey), 10) || 0;
  const now = Date.now();
  return hasScheduleGaps() || now - lastChecked >= scheduleSource.weeklyCheckMs;
}

function parseNflSchedulePage(htmlText) {
  const html = decodeHtmlEntities(htmlText);
  const gameHrefRegex = /href="\/games\/([a-z0-9-]+-(pre|reg)-\d+)"/gi;
  const hits = [...html.matchAll(gameHrefRegex)];
  const gamesByWeek = {};

  hits.forEach((hit, index) => {
    const gameSlug = hit[1];
    const parsed = parseTeamsFromGameSlug(gameSlug);
    if (!parsed) return;

    const start = hit.index || 0;
    const end = index + 1 < hits.length ? (hits[index + 1].index || html.length) : html.length;
    const section = html.slice(start, Math.min(end, start + 14000));

    const dateMatch = section.match(/dateTime="([^"]+)"/i);
    const date = dateMatch ? new Date(dateMatch[1]).toISOString() : null;

    const networkMatch = section.match(/alt="([^\"]+?) network logo"/i);
    const hasLocalLabel = /\bLOCAL\b/i.test(section);
    const channel = networkMatch ? networkMatch[1].trim() : hasLocalLabel ? "LOCAL" : "TBD";

    const logo = teamLogoUrl(parsed.opponent);
    const gameKey = `${parsed.seasonType}-${parsed.week}`;

    gamesByWeek[gameKey] = {
      seasonType: parsed.seasonType,
      week: parsed.week,
      opponent: parsed.opponent,
      date,
      location: parsed.location,
      channel,
      logo
    };
  });

  return Object.values(gamesByWeek).sort((a, b) => getGameSortValue(a) - getGameSortValue(b));
}

function fetchOfficialSchedule() {
  return fetch(scheduleSource.officialNflTeamScheduleUrl, { headers: { Accept: "text/html" } })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Official schedule fetch failed: ${res.status}`);
      }
      return res.text();
    })
    .then(parseNflSchedulePage)
    .then((officialGames) => {
      if (officialGames.length && mergeScheduleData(officialGames)) {
        scheduleMeta.source = "nfl-live";
        scheduleMeta.issues = validateScheduleData(schedule);
        scheduleMeta.lastUpdated = new Date().toISOString();
        logScheduleMeta();
        saveCachedSchedule();
      }
      return officialGames;
    })
    .catch((error) => {
      console.warn("Official schedule fetch failed.", error);
      return [];
    });
}

function checkScheduleUpdates() {
  if (!shouldRefreshSchedule()) {
    return Promise.resolve();
  }

  return fetchOfficialSchedule().finally(() => {
    localStorage.setItem(scheduleSource.lastCheckedKey, Date.now().toString());
  });
}

function getNextGame() {
  const now = new Date();
  return (
    schedule
      .filter((game) => game.date)
      .sort((a, b) => getGameSortValue(a) - getGameSortValue(b))
      .find((game) => getCalendarDayDifference(now, new Date(game.date)) >= 0) || null
  );
}

function getOffseasonSeasonLabel() {
  return `${new Date().getFullYear()} Season`;
}

function getGameWeekLabel(game) {
  const week = game.week || "?";
  const seasonType = (game.seasonType || "REG").toUpperCase();
  if (seasonType === "PRE") {
    return `PRESEASON WEEK ${week}`;
  }
  if (seasonType === "POST") {
    return `POSTSEASON WEEK ${week}`;
  }
  return `WEEK ${week}`;
}

function getCalendarDayDifference(startDate, endDate) {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function getCountdownLabel(days) {
  return days === 0 ? "Today is gameday!" : `${days} DAYS`;
}

function updateCountdown() {
  const countdownElement = document.getElementById("countdown");
  const gameCard = document.getElementById("game-card");

  if (!scheduleLoaded) {
    countdownElement.textContent = "LOADING...";
    gameCard.classList.add("hidden");
    return;
  }

  const nextGame = getNextGame();
  if (!nextGame) {
    countdownElement.textContent = getOffseasonSeasonLabel();
    gameCard.classList.add("hidden");
    return;
  }

  const now = new Date();
  const gameDate = new Date(nextGame.date);
  const diff = gameDate - now;
  const calendarDays = getCalendarDayDifference(now, gameDate);
  const days = Math.max(0, calendarDays);

  countdownElement.textContent = getCountdownLabel(days);

  const showDetails = calendarDays <= 7 && calendarDays >= 0;
  if (showDetails) {
    document.getElementById("game-logo").src = nextGame.logo;
    document.getElementById("game-logo").alt = `${nextGame.opponent} logo`;
    document.getElementById("game-week-badge").textContent = getGameWeekLabel(nextGame);
    document.getElementById("game-opponent").textContent = nextGame.opponent;
    document.getElementById("game-meta").textContent = `${nextGame.location.toUpperCase()} • ${parsePST(nextGame.date)} PST • ${nextGame.channel || "TBD"}`;
    document.getElementById("game-date").textContent = formatGameDate(nextGame.date);
    gameCard.classList.remove("hidden");
  } else {
    gameCard.classList.add("hidden");
  }
}

loadSchedule()
  .then(() => checkScheduleUpdates())
  .finally(updateCountdown);

setInterval(updateCountdown, 60 * 60 * 1000);
setInterval(() => {
  checkScheduleUpdates().then(updateCountdown);
}, scheduleSource.weeklyCheckMs);

if (typeof window !== "undefined") {
  window.__scheduleInternals = {
    decodeHtmlEntities,
    teamSlugToName,
    parseTeamsFromGameSlug,
    getGameKey,
    getGameSortValue,
    parseNflSchedulePage,
    validateScheduleData,
    getOffseasonSeasonLabel,
    getCalendarDayDifference,
    getCountdownLabel
  };
}

// -------------------------
// SEARCH LOGIC
// -------------------------
document.getElementById("search-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const query = e.target.value.trim();
    if (query) {
      window.open(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, "_blank");
      e.target.value = "";
    }
  }
});

const favoritesKey = "favorites";
let favorites = loadFavorites();
let editingIndex = null;
let deletedFavorite = null;
let toastTimeout = null;

const favoritesContainer = document.getElementById("favorites");
const contextMenu = document.getElementById("context-menu");
const editSiteBtn = document.getElementById("edit-site-btn");
const deleteSiteBtn = document.getElementById("delete-site-btn");
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const siteNameInput = document.getElementById("site-name");
const siteUrlInput = document.getElementById("site-url");
const cancelSiteBtn = document.getElementById("cancel-site-btn");
const saveSiteBtn = document.getElementById("save-site-btn");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");
const undoBtn = document.getElementById("undo-btn");
const toastClose = document.getElementById("toast-close");

function loadFavorites() {
  const stored = localStorage.getItem(favoritesKey);

  if (!stored) return getDefaultFavorites();

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return getDefaultFavorites();
    return parsed;
  } catch {
    return getDefaultFavorites();
  }
}

function getDefaultFavorites() {
  return [
    { name: "The Athletic - Bay Area", url: "https://theathletic.com/bayarea/" },
    { name: "SF Standard", url: "https://sfstandard.com/" },
    { name: "TWIVG", url: "https://thisweekinvideogames.com/" },
    { name: "MLB.TV", url: "https://mlb.tv" },
    { name: "NBA League Pass", url: "https://www.nba.com/games" },
    { name: "YouTube", url: "https://youtube.com" },
    { name: "YouTube Music", url: "https://music.youtube.com/" },
    { name: "Audible", url: "https://www.audible.com/" },
    { name: "GitHub", url: "https://github.com" },
    { name: "Free Code Camp", url: "https://www.freecodecamp.org/" },
    { name: "Free Code Camp Forum", url: "https://forum.freecodecamp.org/" },
    { name: "Python Tutor", url: "http://pythontutor.com/visualize.html#mode=edit" },
    { name: "Git Cheat Sheet", url: "https://mevorahde.github.io/Git_Cheat_Sheet/" },
    { name: "Python Virtual Env", url: "https://mevorahde.github.io/venv_guide/" }
  ];
}

function saveFavorites() {
  localStorage.setItem(favoritesKey, JSON.stringify(favorites));
}

function domainFromUrl(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function getFavicon(url) {
  const domain = domainFromUrl(url);
  return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(domain)}`;
}

function populateFavicon(img, siteUrl) {
  const domain = domainFromUrl(siteUrl);
  const sources = [];
  try {
    const parsedUrl = new URL(siteUrl);
    const origin = parsedUrl.origin;
    const pathname = parsedUrl.pathname;
    // Project sites can use a named SVG instead of favicon.ico. Prefer the
    // cookbook's own icon before the shared GitHub Pages domain's personal logo.
    if (origin === 'https://mevorahde.github.io' &&
        (pathname === '/family-recipes' || pathname.startsWith('/family-recipes/'))) {
      sources.push(`${origin}/family-recipes/cookbook.svg`);
    }
    // Try page-path specific favicon first (e.g., /Git_Cheat_Sheet/favicon.ico)
    const pageFavicon = `${origin}${pathname.replace(/\/$/, '')}/favicon.ico`;
    sources.push(pageFavicon);
    // Then try the site's root favicon
    sources.push(`${origin}/favicon.ico`);
    // Then try common third-party providers
    sources.push(`https://www.google.com/s2/favicons?sz=64&domain=${domain}`);
    sources.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    sources.push(`https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(siteUrl)}`);
  } catch {
    sources.push(`https://www.google.com/s2/favicons?sz=64&domain=${domain}`);
  }

  // Small inline SVG fallback (simple globe) as data URL
  const svgFallback = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">' +
    '<circle cx="12" cy="12" r="10" fill="%23fff8f2" stroke="%23b30000" stroke-width="1"/>' +
    '</svg>'
  );

  let i = 0;
  function trySrc() {
    if (i >= sources.length) {
      img.src = svgFallback;
      return;
    }
    const src = sources[i++];
    debugTrace(`Favicon: trying ${src} for ${domain}`);
    // set a temporary handler to try next on error
    img.onerror = function () {
      // prevent infinite loop
      console.warn(`Favicon load failed for ${src} (domain: ${domain})`);
      img.onerror = null;
      trySrc();
    };
    img.onload = function () {
      // loaded successfully, clear error handler
      img.onerror = null;
      debugTrace(`Favicon loaded: ${src} for ${domain}`);
      try { img.title = `favicon:${src}` } catch(e){}
    };
    img.src = src;
  }

  trySrc();
}

function renderFavorites() {
  favoritesContainer.innerHTML = "";

  favorites.forEach((site, index) => {
    const link = document.createElement("a");
    link.className = "fav-item";
    link.href = site.url;
    link.dataset.index = index;

    const img = document.createElement("img");
    img.className = "fav-icon";
    img.alt = site.name;
    // populate favicon with robust fallbacks
    populateFavicon(img, site.url);

    const span = document.createElement("span");
    span.textContent = site.name;

    link.appendChild(img);
    link.appendChild(span);

    link.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      showContextMenu(event.pageX, event.pageY, index);
    });

    favoritesContainer.appendChild(link);
  });

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "fav-item fav-add";
  addButton.innerHTML = `<span class="add-icon">+</span><span>Add site</span>`;
  addButton.addEventListener("click", () => openSiteModal("add"));
  favoritesContainer.appendChild(addButton);
}

function showContextMenu(x, y, index) {
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.remove("hidden");
  editingIndex = index;
}

function closeContextMenu() {
  contextMenu.classList.add("hidden");
}

function openSiteModal(mode) {
  modalTitle.textContent = mode === "edit" ? "Edit site" : "Add site";

  if (mode === "edit" && editingIndex !== null) {
    const site = favorites[editingIndex];
    siteNameInput.value = site.name;
    siteUrlInput.value = site.url;
  } else {
    siteNameInput.value = "";
    siteUrlInput.value = "";
    editingIndex = null;
  }

  modalOverlay.classList.remove("hidden");
  siteNameInput.focus();
}

function closeSiteModal() {
  modalOverlay.classList.add("hidden");
}

function normalizeUrl(value) {
  if (!value) return "";
  const trimmed = value.trim();
  try {
    return new URL(trimmed).href;
  } catch {
    try {
      return new URL(`https://${trimmed}`).href;
    } catch {
      return "";
    }
  }
}

function handleSaveSite() {
  const name = siteNameInput.value.trim();
  const url = normalizeUrl(siteUrlInput.value);

  if (!name || !url) {
    alert("Please enter a valid site name and URL.");
    return;
  }

  if (editingIndex !== null && favorites[editingIndex]) {
    favorites[editingIndex] = { name, url };
  } else {
    favorites.push({ name, url });
  }

  saveFavorites();
  renderFavorites();
  closeSiteModal();
  closeContextMenu();
}

function handleDeleteSite() {
  if (editingIndex === null || editingIndex < 0 || editingIndex >= favorites.length) return;

  deletedFavorite = {
    item: favorites[editingIndex],
    index: editingIndex
  };

  favorites.splice(editingIndex, 1);
  saveFavorites();
  renderFavorites();
  closeContextMenu();
  showToast("Top site removed");
}

function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.remove("hidden");

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    hideToast();
  }, 5000);
}

function hideToast() {
  toast.classList.add("hidden");
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
}

function undoDelete() {
  if (!deletedFavorite) return;

  favorites.splice(deletedFavorite.index, 0, deletedFavorite.item);
  saveFavorites();
  renderFavorites();
  deletedFavorite = null;
  hideToast();
}

document.addEventListener("click", (event) => {
  if (!event.target.closest("#context-menu")) {
    closeContextMenu();
  }
});

editSiteBtn.addEventListener("click", () => {
  openSiteModal("edit");
});

deleteSiteBtn.addEventListener("click", handleDeleteSite);

cancelSiteBtn.addEventListener("click", () => {
  closeSiteModal();
});

saveSiteBtn.addEventListener("click", handleSaveSite);
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    closeSiteModal();
  }
});

undoBtn.addEventListener("click", undoDelete);
toastClose.addEventListener("click", hideToast);

renderFavorites();

// -------------------------
// TO‑DO LIST LOGIC
// -------------------------
const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let editingTodoIndex = null;
renderTasks();

addBtn.addEventListener("click", () => {
  const text = todoInput.value.trim();
  if (text === "") return;

  tasks.push({ text, completed: false });
  todoInput.value = "";
  saveTasks();
  renderTasks();
});

todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addBtn.click();
});

todoList.addEventListener("click", (e) => {
  const todoItem = e.target.closest(".todo-item");
  if (!todoItem) return;

  const index = parseInt(todoItem.dataset.index, 10);

  if (e.target.closest(".edit-btn")) {
    startEditingTask(index);
    return;
  }

  if (e.target.closest(".delete-btn")) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    return;
  }

  if (e.target.closest(".todo-edit-input")) {
    return;
  }

  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  renderTasks();
});

function startEditingTask(index) {
  editingTodoIndex = index;
  renderTasks();
  setTimeout(() => {
    const input = document.querySelector(".todo-edit-input");
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function finishEditingTask(index, newText) {
  if (index < 0 || index >= tasks.length) return;

  const updatedText = newText.trim();
  if (updatedText) {
    tasks[index].text = updatedText;
    saveTasks();
  }

  editingTodoIndex = null;
  renderTasks();
}

function cancelEditingTask() {
  editingTodoIndex = null;
  renderTasks();
}

function renderTasks() {
  todoList.innerHTML = "";

  tasks.forEach((task, i) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (task.completed ? " completed" : "");
    li.draggable = true;
    li.dataset.index = i;

    if (editingTodoIndex === i) {
      const input = document.createElement("input");
      input.className = "todo-edit-input";
      input.dataset.index = i;
      input.value = task.text;
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          finishEditingTask(i, input.value);
        }
        if (e.key === "Escape") {
          cancelEditingTask();
        }
      });
      input.addEventListener("blur", () => {
        finishEditingTask(i, input.value);
      });

      const actions = document.createElement("div");
      actions.className = "todo-actions";
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.dataset.index = i;
      deleteBtn.textContent = "✖";
      actions.appendChild(deleteBtn);

      li.appendChild(input);
      li.appendChild(actions);
    } else {
      const textSpan = document.createElement("span");
      textSpan.className = "todo-text";
      textSpan.dataset.index = i;
      textSpan.textContent = task.text;

      const actions = document.createElement("div");
      actions.className = "todo-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.dataset.index = i;
      editBtn.textContent = "✎";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.dataset.index = i;
      deleteBtn.textContent = "✖";

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(textSpan);
      li.appendChild(actions);
    }

    // Drag event listeners
    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);
    li.addEventListener("dragleave", handleDragLeave);

    todoList.appendChild(li);
  });
}

let draggedItem = null;

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = "move";
  
  if (this !== draggedItem) {
    this.classList.add("drag-over");
  }
  return false;
}

function handleDragLeave(e) {
  this.classList.remove("drag-over");
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedItem !== this) {
    const allItems = Array.from(todoList.children);
    const draggedIndex = parseInt(draggedItem.dataset.index);
    const targetIndex = parseInt(this.dataset.index);
    
    // Reorder tasks array
    const [movedTask] = tasks.splice(draggedIndex, 1);
    tasks.splice(targetIndex, 0, movedTask);
    
    saveTasks();
    renderTasks();
  }

  return false;
}

function handleDragEnd(e) {
  this.classList.remove("dragging");
  document.querySelectorAll(".todo-item").forEach(item => {
    item.classList.remove("drag-over");
  });
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// -------------------------
// FAVICON REFRESH
// -------------------------
function refreshFavicons() {
  const favIcons = document.querySelectorAll(".fav-icon");
  favIcons.forEach((img) => {
    try {
      const url = new URL(img.src);
      url.searchParams.delete("t");
      url.searchParams.set("t", Date.now().toString());
      img.src = url.toString();
    } catch {
      const originalSrc = img.src.split("?")[0];
      img.src = `${originalSrc}?t=${Date.now()}`;
    }
  });
}

// Refresh favicons every 5 minutes (300000 ms)
setInterval(refreshFavicons, 5 * 60 * 1000);


