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
  if (!select || !CONFIG.presets) return;

  select.innerHTML = "";

  Object.keys(CONFIG.presets).forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = CONFIG.presets[key].name;
    select.appendChild(opt);
  });

  document.getElementById("apply-preset")?.addEventListener("click", () => {
    const key = select.value;
    localStorage.setItem("activePreset", key);
    applyPreset(key);
  });

  const saved =
    localStorage.getItem("activePreset") ||
    Object.keys(CONFIG.presets)[0];

  select.value = saved;
  applyPreset(saved);
}

function applyPreset(key) {
  const p = CONFIG.presets[key];
  if (!p) return;

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
   QUOTES (FIXED ROTATION)
================================ */

let quoteIndex = 0;

function initQuotes() {
  const quoteBox = document.getElementById("quote");
  if (!quoteBox || !CONFIG.quotes?.length) return;

  quoteIndex = Math.floor(Math.random() * CONFIG.quotes.length);
  quoteBox.textContent = CONFIG.quotes[quoteIndex];

  setInterval(() => {
    quoteIndex++;

    if (quoteIndex >= CONFIG.quotes.length) {
      quoteIndex = 0;
    }

    quoteBox.textContent = CONFIG.quotes[quoteIndex];
  }, 4000);
}



/* ===============================
   SOUNDBOARD (27 PER PAGE)
================================ */

let sounds = [];
let page = 0;
const PER_PAGE = 24;

let currentAudio = null;
let currentCard = null;

function initSounds() {
  const board = document.getElementById("soundboard");
  if (!board) return;

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

      /* CLICK SAME SOUND = STOP */
      if (currentAudio === audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        icon.textContent = "▶";
        card.classList.remove("playing");
        currentAudio = null;
        currentCard = null;
        return;
      }

      /* STOP OTHER SOUND */
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;

        if (currentCard) {
          currentCard.classList.remove("playing");
          currentCard.querySelector(".play-icon").textContent = "▶";
        }
      }

      /* PLAY NEW */
      audio.play();
      icon.textContent = "❚❚";
      card.classList.add("playing");

      currentAudio = audio;
      currentCard = card;

      audio.onended = () => {
        icon.textContent = "▶";
        card.classList.remove("playing");
        currentAudio = null;
        currentCard = null;
      };
    });

    board.appendChild(card);
  });

  const info = document.getElementById("page-info");
  if (info) {
    info.textContent =
      `Page ${page + 1} / ${Math.max(1, Math.ceil(sounds.length / PER_PAGE))}`;
  }
}



/* ===============================
   PAGINATION
================================ */

document.getElementById("prev")?.addEventListener("click", () => {
  if (page > 0) {
    page--;
    renderSounds();
  }
});

document.getElementById("next")?.addEventListener("click", () => {
  if ((page + 1) * PER_PAGE < sounds.length) {
    page++;
    renderSounds();
  }
});




/* ===============================
   GAMES (HTML + EMULATED)
================================ */

function initGames() {
  const cards = document.querySelectorAll(".game-card");
  if (!cards.length) return;

  cards.forEach(card => {
    card.style.cursor = "pointer";

    card.addEventListener("click", () => {

      /* CASE 1: EMULATED GAME (DS / ROM) */
      if (card.classList.contains("ds-game")) {
        const rom = card.dataset.rom;

        if (!rom) {
          console.warn("Missing data-rom on emulated card:", card);
          return;
        }

        window.location.href =
          `/emulator.html?rom=${encodeURIComponent(rom)}`;
        return;
      }

      /* CASE 2: NORMAL HTML GAME */
      const link = card.dataset.game;

      if (!link) {
        console.warn("Missing data-game on card:", card);
        return;
      }

      window.location.href = link;
    });
  });
}



