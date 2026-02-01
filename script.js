/* =========================
   GLOBAL SETTINGS
========================= */

function applySettings() {
  const title = localStorage.getItem('siteTitle');
  const favicon = localStorage.getItem('siteFavicon');

  if (title) document.title = title;

  if (favicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = favicon;
  }
}

applySettings();

/* =========================
   ABOUT:BLANK CLONE
========================= */

function openBlank() {
  const tab = window.open('about:blank', '_blank');
  if (!tab) return;
  tab.document.write(document.documentElement.outerHTML);
  tab.document.close();
}

/* =========================
   SOUNDBOARD
========================= */

const SOUNDS_PER_PAGE = 65;
const SOUND_FOLDER = 'sounds/';

let sounds = [];
let currentPage = 0;
let currentAudio = null;
let currentFile = null;

const grid = document.getElementById('soundGrid');
const nextBtn = document.getElementById('nextPage');
const prevBtn = document.getElementById('prevPage');
const indicator = document.getElementById('pageIndicator');

async function loadSounds() {
  if (!grid) return;

  const res = await fetch(SOUND_FOLDER + 'index.json');
  sounds = await res.json();
  renderPage();
}

function renderPage() {
  grid.innerHTML = '';

  const totalPages = Math.ceil(sounds.length / SOUNDS_PER_PAGE);
  const start = currentPage * SOUNDS_PER_PAGE;
  const pageSounds = sounds.slice(start, start + SOUNDS_PER_PAGE);

  indicator.textContent = `Page ${currentPage + 1} of ${totalPages}`;
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage >= totalPages - 1;

  pageSounds.forEach(file => {
    const card = document.createElement('div');
    card.className = 'sound-card';

    const icon = document.createElement('div');
    icon.className = 'control';
    icon.textContent = '▶';

    const name = document.createElement('div');
    name.className = 'sound-name';
    name.textContent = file.replace('.mp3', '');

    card.append(icon, name);
    card.onclick = () => toggleSound(file, icon);

    grid.appendChild(card);
  });
}

function toggleSound(file, icon) {
  if (currentAudio && currentFile === file) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    currentFile = null;
    icon.textContent = '▶';
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    document.querySelectorAll('.control').forEach(i => i.textContent = '▶');
  }

  currentAudio = new Audio(SOUND_FOLDER + file);
  currentFile = file;
  currentAudio.play();
  icon.textContent = '■';

  currentAudio.onended = () => {
    icon.textContent = '▶';
    currentAudio = null;
    currentFile = null;
  };
}

if (nextBtn && prevBtn) {
  nextBtn.onclick = () => { currentPage++; renderPage(); };
  prevBtn.onclick = () => { currentPage--; renderPage(); };
}

loadSounds();