/* ---------- TITLE + FAVICON PRESETS ---------- */
const PRESET_KEY = "activePreset";
let presetData = {};

fetch("presets.json")
  .then(r => r.json())
  .then(data => {
    presetData = data;

    // Apply saved preset or default
    const saved = localStorage.getItem(PRESET_KEY) || "united";
    applyPreset(saved);

    // Populate settings dropdown if present
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

  // Title
  document.title = p.title;

  // Favicon
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = p.favicon;

  localStorage.setItem(PRESET_KEY, name);
}

// Apply button (settings page)
document.getElementById("apply-preset")?.addEventListener("click", () => {
  const val = document.getElementById("preset-select").value;
  applyPreset(val);
});


/* ---------- QUOTES ---------- */
const quotes = [
  "scared mustache 445",
  "ms gandhi bad as hell icl put me onto her",
  "built by us for us",
  "i have a hole in my shoes",
  "use responsibly or not, we arent ur dad",
  "iker's ms czerwonka's story is interesting",
  "i wish ms havnoonian could just take off her shirt",
  "ms velasquez deserves this adicktion",
  "Dr Chaves is prob mad tight",
  "Ms Mustain should lwk just start twerking during class",
  "fuck zahirs treecko",
  "damn thats nice",
  "fuck the nigs",
  "welcome to the revival boys",
  "made by angle"
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
      // data is an array of filenames
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
  // If clicking the same card that's already playing → STOP
  if (audio && currentCard === card) {
    audio.pause();
    audio.currentTime = 0;
    card.classList.remove("playing");
    audio = null;
    currentCard = null;
    return;
  }

  // Otherwise stop whatever was playing
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  document.querySelectorAll(".card.playing")
    .forEach(c => c.classList.remove("playing"));

  // Start new sound
  const src = `sounds/${encodeURIComponent(file)}`;
  audio = new Audio(src);
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
document.querySelectorAll(".game-card").forEach(card => {
  card.addEventListener("click", () => {
    const win = window.open("about:blank", "_blank");
    fetch(card.dataset.game)
      .then(r => r.text())
      .then(html => win.document.write(html));
  });

  
  /* ---------- OPEN CURRENT PAGE IN about:blank ---------- */
  const blankLink = document.getElementById("open-blank");

  if (blankLink) {
    blankLink.addEventListener("click", (e) => {
      e.preventDefault();

      const win = window.open("about:blank", "_blank");
      if (!win) return;

      // Clone the entire current document
      const doc = win.document;
      doc.open();
      doc.write("<!DOCTYPE html>");
      doc.write(document.documentElement.outerHTML);
      doc.close();

      // Fix relative paths (critical)
      const base = doc.createElement("base");
      base.href = window.location.href;
      doc.head.prepend(base);
    });
  }
});