/* ===============================
   LOAD QUOTES FROM config.json
================================ */

let CONFIG = {};
let quoteIndex = 0;

fetch("../config.json")
  .then(r => r.json())
  .then(cfg => {
    CONFIG = cfg;
    initQuotes();
  })
  .catch(err => console.error("Quote load failed:", err));

function initQuotes() {
  const quoteBox = document.getElementById("quote");
  if (!quoteBox || !CONFIG.quotes?.length) return;

  // start on random quote
  quoteIndex = Math.floor(Math.random() * CONFIG.quotes.length);
  quoteBox.textContent = CONFIG.quotes[quoteIndex];

  setInterval(() => {
    quoteIndex = (quoteIndex + 1) % CONFIG.quotes.length;
    quoteBox.textContent = CONFIG.quotes[quoteIndex];
  }, 4000);
}

/* ===============================
   USERNAME
================================ */

let username = localStorage.getItem("chatName");

if (!username) {
  username = prompt("Enter a username:") || "Anonymous";
  localStorage.setItem("chatName", username);
}

/* ===============================
   LOAD CONFIG + FIREBASE
================================ */

fetch("../config.json")
.then(r => r.json())
.then(cfg => {
  firebase.initializeApp(cfg.firebase);
  initChat();
});


/* ===============================
   TIME FORMATTER
================================ */

function formatTime(ts) {
  return new Date(ts).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

/* ===============================
   CHAT ENGINE
================================ */

function initChat() {
  const db = firebase.database();
  const messagesRef = db.ref("messages");

  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("message");
  const sendBtn = document.getElementById("send-btn");

  messagesRef.limitToLast(150).on("child_added", snap => {
    const msg = snap.val();
    const mine = msg.user === username;

    const div = document.createElement("div");
    div.className = `msg ${mine ? "mine" : ""}`;

    div.innerHTML = `
      <div class="avatar">${msg.user[0].toUpperCase()}</div>
      <div class="bubble">
        <div class="user">${msg.user}</div>
        <div>${msg.text}</div>
        <div class="time">${formatTime(msg.time)}</div>
      </div>
    `;

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    messagesRef.push({
      user: username,
      text,
      time: Date.now()
    });

    input.value = "";
  }

  sendBtn.onclick = sendMessage;

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}
