let username = localStorage.getItem("chatName");
if (!username) {
  username = prompt("Enter a username:") || "Anonymous";
  localStorage.setItem("chatName", username);
}

/* ===============================
   TITLE + FAVICON SYNC
================================ */
fetch("../presets.json")
  .then(r => r.json())
  .then(presets => {
    const active = localStorage.getItem("activePreset") || "united";
    const p = presets[active];
    if (!p) return;

    document.title = p.title;

    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = p.favicon;
  })
  .catch(() => {});

/* ===============================
   FIREBASE
================================ */
fetch("firebase.json")
  .then(r => r.json())
  .then(cfg => {
    firebase.initializeApp(cfg);
    initChat();
  });

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function initChat() {
  const db = firebase.database();
  const messagesRef = db.ref("messages");

  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("message");
  const sendBtn = document.getElementById("send-btn");

  messagesRef.limitToLast(150).on("child_added", snap => {
    const msg = snap.val();
    const isMine = msg.user === username;

    const div = document.createElement("div");
    div.className = `msg ${isMine ? "mine" : ""}`;

    div.innerHTML = `
      <div class="avatar">${msg.user[0].toUpperCase()}</div>
      <div class="bubble">
        <div class="user">${msg.user}</div>
        <div class="text">${msg.text}</div>
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