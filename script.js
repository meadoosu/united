/* ===============================
   LOAD CONFIG.JSON
================================ */
let CONFIG = {};

fetch("config.json")
  .then(r => r.json())
  .then(cfg => {
    CONFIG = cfg;
    initPresets();
    initQuotes();
    initSounds();
    initGames();
  })
  .catch(err => console.error("Config failed:", err));

/* ===============================
   PRESETS (TAB CLOAK)
================================ */
function initPresets() {
  const select = document.getElementById("preset-select");
  const applyBtn = document.getElementById("apply-preset");

  if (select && CONFIG.presets) {
    select.innerHTML = "";
    Object.keys(CONFIG.presets).forEach(key => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = CONFIG.presets[key].name;
      select.appendChild(opt);
    });

    applyBtn?.addEventListener("click", () => {
      const key = select.value;
      localStorage.setItem("activePreset", key);
      applyPreset(key);
    });
  }

  // Auto-apply saved preset
  const saved = localStorage.getItem("activePreset") || (CONFIG.presets && Object.keys(CONFIG.presets)[0]);
  if (saved) {
    if (select) select.value = saved;
    applyPreset(saved);
  }
}

function applyPreset(key) {
  if (!CONFIG.presets || !CONFIG.presets[key]) return;
  const p = CONFIG.presets[key];

  document.title = p.title;

  let icon = document.querySelector("link[rel='icon']");
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.href = p.favicon;
}

/* ===============================
   QUOTES
================================ */
let quoteIndex = 0;
function initQuotes() {
  const quoteBox = document.getElementById("quote");
  if (!quoteBox || !CONFIG.quotes?.length) return;

  quoteIndex = Math.floor(Math.random() * CONFIG.quotes.length);
  quoteBox.textContent = CONFIG.quotes[quoteIndex];

  setInterval(() => {
    quoteIndex = (quoteIndex + 1) % CONFIG.quotes.length;
    quoteBox.textContent = CONFIG.quotes[quoteIndex];
  }, 4000);
}

/* ===============================
   SOUNDBOARD
================================ */
let sounds = [];
let page = 0;
const PER_PAGE = 24;
let currentAudio = null;
let currentCard = null;

function initSounds() {
  if (!document.getElementById("soundboard")) return;
  sounds = CONFIG.sounds || [];
  renderSounds();
}

function renderSounds() {
  const board = document.getElementById("soundboard");
  if (!board) return;
  board.innerHTML = "";

  const start = page * PER_PAGE;
  const end = start + PER_PAGE;

  sounds.slice(start, end).forEach(file => {
    const name = file.replace(/\.[^/.]+$/, "");
    const card = document.createElement("div");
    card.className = "card";

    const icon = document.createElement("div");
    icon.className = "play-icon";
    icon.textContent = "▶";

    const label = document.createElement("span");
    label.textContent = name;

    card.appendChild(icon);
    card.appendChild(label);

    const audio = new Audio(`sounds/${file}`);

    card.addEventListener("click", () => {
      if (currentAudio === audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        icon.textContent = "▶";
        card.classList.remove("playing");
        currentAudio = null;
        return;
      }

      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        document.querySelectorAll(".card").forEach(c => {
          c.classList.remove("playing");
          const i = c.querySelector(".play-icon");
          if(i) i.textContent = "▶";
        });
      }

      audio.play();
      icon.textContent = "❚❚";
      card.classList.add("playing");
      currentAudio = audio;

      audio.onended = () => {
        icon.textContent = "▶";
        card.classList.remove("playing");
        currentAudio = null;
      };
    });
    board.appendChild(card);
  });

  const info = document.getElementById("page-info");
  if (info) {
    info.textContent = `Page ${page + 1} / ${Math.max(1, Math.ceil(sounds.length / PER_PAGE))}`;
  }
}

/* ===============================
   PAGINATION
================================ */
document.getElementById("prev")?.addEventListener("click", () => {
  if (page > 0) { page--; renderSounds(); }
});

document.getElementById("next")?.addEventListener("click", () => {
  if ((page + 1) * PER_PAGE < sounds.length) { page++; renderSounds(); }
});

/* ===============================
   GAMES (ABOUT:BLANK CLOAK)
================================ */
function openInBlank(url) {
  const win = window.open("about:blank");
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Loading...</title>
      <style>
        html, body { margin: 0; width: 100%; height: 100%; background: black; }
        iframe { width: 100%; height: 100%; border: none; }
      </style>
    </head>
    <body><iframe src="${url}" allowfullscreen></iframe></body>
    </html>
  `);
  win.document.close();
}

function initGames() {
  document.querySelectorAll(".game-card").forEach(card => {
    card.addEventListener("click", () => {
      const url = card.classList.contains("ds-game") 
        ? `/emulator.html?rom=${encodeURIComponent(card.dataset.rom)}`
        : card.dataset.game;

      if (url) openInBlank(url);
    });
  });
}