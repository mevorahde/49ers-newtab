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

function fetchWeatherData(latitude, longitude) {
  console.log(`Fetching weather for coords: ${latitude}, ${longitude}`);
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;

  // Fetch weather data
  fetch(weatherUrl)
    .then((res) => res.json())
    .then((weatherData) => {
      const tempC = weatherData.current.temperature_2m;
      const temp = Math.round((tempC * 9) / 5 + 32);
      const weatherCode = weatherData.current.weather_code;
      const info = weatherInfo[weatherCode] || { label: "Unknown", icon: "❔" };

      document.getElementById("weather-icon").textContent = info.icon;
      document.getElementById("weather-temp").textContent = `${temp}°`;
      document.getElementById("weather-desc").textContent = info.label;
    })
    .catch((error) => {
      console.error("Weather fetch failed:", error);
      document.getElementById("weather-temp").textContent = "--°";
      document.getElementById("weather-desc").textContent = "N/A";
    });

  // Fetch location data using Nominatim reverse geocoding
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
        document.getElementById("weather-location").textContent = locationText;
      } else {
        document.getElementById("weather-location").textContent = "Location unavailable";
      }
    })
    .catch((error) => {
      console.error("Location fetch failed:", error);
      document.getElementById("weather-location").textContent = "Location unavailable";
    });
}

function getWeatherByIP() {
  // Use IP-based geolocation via ipapi.co
  console.log("Using IP-based geolocation");
  fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .then((data) => {
      console.log("IP geolocation data:", data);
      if (data.latitude && data.longitude) {
        fetchWeatherData(data.latitude, data.longitude);
      } else {
        document.getElementById("weather-location").textContent = "Location unavailable";
      }
    })
    .catch((error) => {
      console.error("IP geolocation failed:", error);
      document.getElementById("weather-location").textContent = "Location unavailable";
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
        fetchWeatherData(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error code:", error.code, "message:", error.message);
        console.log("Falling back to IP-based geolocation");
        getWeatherByIP();
      },
      {
        timeout: 5000,
        enableHighAccuracy: false,
        maximumAge: 3600000 // Cache location for 1 hour
      }
    );
  } else {
    console.log("Geolocation API not available, using IP fallback");
    getWeatherByIP();
  }
}
getWeather();

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
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
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
  const defaults = getDefaultFavorites();

  if (!stored) return defaults;

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return defaults;

    const merged = [...parsed];
    defaults.forEach((defaultSite) => {
      const exists = merged.some(
        (site) => site.url === defaultSite.url || site.name === defaultSite.name
      );
      if (!exists) merged.push(defaultSite);
    });

    return merged;
  } catch {
    return defaults;
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

function renderFavorites() {
  favoritesContainer.innerHTML = "";

  favorites.forEach((site, index) => {
    const link = document.createElement("a");
    link.className = "fav-item";
    link.href = site.url;
    link.dataset.index = index;
    link.innerHTML = `<img class="fav-icon" src="${getFavicon(site.url)}" alt="${site.name}"><span>${site.name}</span>`;
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
  const index = e.target.dataset.index;

  if (e.target.classList.contains("todo-text")) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
  }

  if (e.target.classList.contains("delete-btn")) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
});

function renderTasks() {
  todoList.innerHTML = "";

  tasks.forEach((task, i) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (task.completed ? " completed" : "");
    li.draggable = true;
    li.dataset.index = i;

    li.innerHTML = `
      <span class="todo-text" data-index="${i}">${task.text}</span>
      <button class="delete-btn" data-index="${i}">✖</button>
    `;

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
    const originalSrc = img.src.split("?")[0];
    const timestamp = Date.now();
    img.src = `${originalSrc}?t=${timestamp}`;
  });
}

// Refresh favicons every 5 minutes (300000 ms)
setInterval(refreshFavicons, 5 * 60 * 1000);


