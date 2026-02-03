/* ---------- TITLE + FAVICON PRESETS ---------- */
const PRESET_KEY = "activePreset";
let presetData = {};

fetch("presets.json")
  .then(r => r.json())
  .then(data => {
    presetData = data;

    const saved = localStorage.getItem(PRESET_KEY) || "united";
    applyPreset(saved);

    const select = document.getElementById("preset-select");
    if (select) {
      Object.keys(presetData).forEach(key => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = key;
        select.appendChild(opt);
      });
      select.value = saved;
    }
  });

function applyPreset(name) {
  const p = presetData[name];
  if (!p) return;

  document.title = p.title;

  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = p.favicon;

  localStorage.setItem(PRESET_KEY, name);
}

document.getElementById("apply-preset")?.addEventListener("click", () => {
  const val = document.getElementById("preset-select").value;
  applyPreset(val);
});


/* ---------- QUOTES ---------- */
const quotes = [
  "scared mustache 445"
];

const quoteEl = document.getElementById("quote");
if (quoteEl) {
  let i = 0;
  quoteEl.textContent = quotes[0];
  setInterval(() => {
    i = (i + 1) % quotes.length;
    quoteEl.textContent = quotes[i];
  }, 4000);
}


/* ---------- SOUNDBOARD ---------- */
const board = document.getElementById("soundboard");
const perPage = 27;

let sounds = [];
let page = 0;
let audio = null;
let currentCard = null;

if (board) {
  fetch("sounds/index.json")
    .then(res => res.json())
    .then(data => {
      sounds = data;
      render();
    });
}

function render() {
  board.innerHTML = "";

  const start = page * perPage;
  const end = start + perPage;
  const slice = sounds.slice(start, end);

  slice.forEach(file => {
    const displayName = file.replace(/\.mp3$/i, "");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div>▶</div><span>${displayName}</span>`;

    card.addEventListener("click", () => toggleSound(card, file));
    board.appendChild(card);
  });

  const pageInfo = document.getElementById("page-info");
  if (pageInfo) {
    pageInfo.textContent =
      `Page ${page + 1} / ${Math.max(1, Math.ceil(sounds.length / perPage))}`;
  }
}

function toggleSound(card, file) {
  if (audio && currentCard === card) {
    audio.pause();
    audio.currentTime = 0;
    card.classList.remove("playing");
    audio = null;
    currentCard = null;
    return;
  }

  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  document.querySelectorAll(".card.playing")
    .forEach(c => c.classList.remove("playing"));

  audio = new Audio(`sounds/${encodeURIComponent(file)}`);
  currentCard = card;

  card.classList.add("playing");
  audio.play();

  audio.onended = () => {
    card.classList.remove("playing");
    audio = null;
    currentCard = null;
  };
}


/* ---------- PAGINATION ---------- */
document.getElementById("prev")?.addEventListener("click", () => {
  if (page > 0) {
    page--;
    render();
  }
});

document.getElementById("next")?.addEventListener("click", () => {
  if ((page + 1) * perPage < sounds.length) {
    page++;
    render();
  }
});


/* ---------- GAMES ---------- */

/* Web games (HTML files) */
document.querySelectorAll(".game-card[data-game]").forEach(card => {
  card.addEventListener("click", () => {
    const gamePath = card.dataset.game;
    if (!gamePath) return;

    window.open(gamePath, "_blank");
  });
});

/* DS games (EmulatorJS) */
document.querySelectorAll(".ds-game").forEach(card => {
  card.addEventListener("click", () => {
    const rom = card.dataset.rom;
    if (!rom) return;

    const url = `games/ds.html?rom=${encodeURIComponent("../" + rom)}`;
    window.open(url, "_blank");
  });
});