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

function fetchWeatherData(latitude, longitude, displayName) {
  console.log(`Fetching weather for coords: ${latitude}, ${longitude}`);
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

  // Fetch weather data
  fetch(weatherUrl)
    .then((res) => res.json())
    .then((weatherData) => {
      console.log("Weather API response:", weatherData);
      
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
      
      console.log(`Weather updated: ${info.label} ${info.icon}`);
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
    console.log(`Fetching location from: ${locationUrl}`);
    fetch(locationUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })
      .then((res) => res.json())
      .then((locationData) => {
        console.log("Location data received:", locationData);
        const address = locationData.address;
        if (address) {
          // Try to get the most specific city-level location
          const city = address.city || address.town || address.village || address.county || "Unknown";
          const state = address.state || "";
          const locationText = state ? `${city}, ${state}` : city;
          console.log(`Location set to: ${locationText}`);
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
  console.log("Using IP-based geolocation");
  fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .then((data) => {
      console.log("IP geolocation data:", data);
      if (data.latitude && data.longitude) {
        console.log(`IP geolocation successful: ${data.latitude}, ${data.longitude}`);
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
  console.log("Starting weather fetch");
  // Try geolocation first, but fall back to IP immediately if unavailable
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Geolocation successful:", position.coords);
        const { latitude, longitude } = position.coords;
        resolveLocationCoords(latitude, longitude).then((resolved) => {
          fetchWeatherData(resolved.latitude, resolved.longitude, resolved.displayName);
        });
      },
      (error) => {
        console.error("Geolocation error code:", error.code, "message:", error.message);
        console.log("Falling back to IP-based geolocation");
        getWeatherByIP();
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,  // FORCE HIGH ACCURACY - ignores cached data
        maximumAge: 0  // NO CACHE - always fetch fresh location
      }
    );
  } else {
    console.log("Geolocation API not available, using IP fallback");
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
function updateCountdown() {
  const gameDate = new Date("2026-09-10T13:00:00");
  const now = new Date();
  const diff = gameDate - now;

  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  document.getElementById("countdown").textContent = `${days} DAYS`;
}

updateCountdown();
setInterval(updateCountdown, 60 * 60 * 1000);

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
    const origin = new URL(siteUrl).origin;
    const pathname = new URL(siteUrl).pathname;
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
    console.debug(`Favicon: trying ${src} for ${domain}`);
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
      console.debug(`Favicon loaded: ${src} for ${domain}`);
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
  const index = parseInt(e.target.dataset.index, 10);

  if (e.target.classList.contains("todo-text")) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
  }

  if (e.target.classList.contains("edit-btn")) {
    startEditingTask(index);
  }

  if (e.target.classList.contains("delete-btn")) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
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


