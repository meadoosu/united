/* ===============================

   LOAD CONFIG + INIT FIREBASE

================================ */



let CONFIG = {};

let username = null;

let uid = null;



fetch("../config.json")

  .then(r => {

    if (!r.ok) throw new Error("Failed to load config");

    return r.json();

  })

  .then(cfg => {

    CONFIG = cfg;



    if (!CONFIG.firebase) {

      throw new Error("Firebase config missing");

    }



    firebase.initializeApp(CONFIG.firebase);



    applyPreset();

    initQuotes();

    startAuthFlow();

  })

  .catch(err => {

    console.error("Initialization error:", err);

    alert("Failed to load configuration. Please refresh the page.");

  });







/* ===============================

   TITLE + FAVICON SYNC

================================ */



function applyPreset() {

  const active =

    localStorage.getItem("activePreset") ||

    Object.keys(CONFIG.presets)[0];



  const preset = CONFIG.presets[active];

  if (!preset) return;



  document.title = preset.title;



  let link = document.querySelector("link[rel='icon']");

  if (!link) {

    link = document.createElement("link");

    link.rel = "icon";

    document.head.appendChild(link);

  }



  link.href = "../" + preset.favicon;

}







/* ===============================

   QUOTES

================================ */



let quoteIndex = 0;



function initQuotes() {

  const box = document.getElementById("quote");

  if (!box || !CONFIG.quotes?.length) return;



  quoteIndex = Math.floor(Math.random() * CONFIG.quotes.length);

  box.textContent = CONFIG.quotes[quoteIndex];



  setInterval(() => {

    box.classList.remove("show");



    setTimeout(() => {

      quoteIndex =

        (quoteIndex + 1) % CONFIG.quotes.length;

      box.textContent = CONFIG.quotes[quoteIndex];

      box.classList.add("show");

    }, 400);



  }, 4000);

}







/* ===============================

   LOGIN / REGISTER FLOW

================================ */



function startAuthFlow() {



  const saved = localStorage.getItem("chatUser");



  if (saved) {

    const data = JSON.parse(saved);

    username = data.username;

    uid = data.uid;

    initChat();

    return;

  }



  let choice = prompt("welcome to united \n\n[1] Register\n[2] Login\n[case sensitive!]");



  if (choice === "1") {

    register();

  } else if (choice === "2") {

    login();

  } else {

    startAuthFlow();

  }

}



function register() {



  const user = prompt("Username? (max 19 characters)");

  const pass = prompt("Password?");



  if (!user || !pass) {

    alert("Username and password are required!");

    return register();

  }



  // Trim whitespace

  const trimmedUser = user.trim();

  const trimmedPass = pass.trim();



  if (trimmedUser.length === 0 || trimmedPass.length === 0) {

    alert("Username and password cannot be empty!");

    return register();

  }



  if (trimmedUser.length > 19) {

    alert("Username must be 19 characters or less!");

    return register();

  }



  // Check for invalid characters

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUser)) {

    alert("Username can only contain letters, numbers, underscores, and hyphens!");

    return register();

  }



  const db = firebase.database();

  const uidGen = "uid-" + Date.now();



  // Check if username already exists

  db.ref("accounts").orderByChild("username").equalTo(trimmedUser).once("value")

    .then(snapshot => {

      if (snapshot.exists()) {

        alert("Username already taken! Please choose another.");

        return register();

      }



      // Create account

      return db.ref("accounts/" + trimmedUser + "-" + uidGen).set({

        username: trimmedUser,

        password: trimmedPass,

        uid: uidGen,

        lastLogin: Date.now()

      });

    })

    .then(() => {

      localStorage.setItem("chatUser", JSON.stringify({

        username: trimmedUser,

        uid: uidGen

      }));



      username = trimmedUser;

      uid = uidGen;



      initChat();

    })

    .catch(err => {

      console.error("Registration error:", err);

      alert("Registration failed. Please try again.");

      register();

    });

}



function login() {



  const user = prompt("Username? (max 19 characters)");

  const pass = prompt("Password?");



  if (!user || !pass) {

    alert("Username and password are required!");

    return login();

  }



  // Trim whitespace

  const trimmedUser = user.trim();

  const trimmedPass = pass.trim();



  if (trimmedUser.length === 0 || trimmedPass.length === 0) {

    alert("Username and password cannot be empty!");

    return login();

  }



  if (trimmedUser.length > 19) {

    alert("Username must be 19 characters or less!");

    return login();

  }



  const db = firebase.database();



  db.ref("accounts").once("value").then(snapshot => {



    let found = false;



    snapshot.forEach(child => {

      const data = child.val();



      if (data.username === trimmedUser &&

          data.password === trimmedPass) {



        found = true;



        db.ref("accounts/" + child.key)

          .update({ lastLogin: Date.now() })

          .catch(err => console.error("Failed to update lastLogin:", err));



        localStorage.setItem("chatUser", JSON.stringify({

          username: data.username,

          uid: data.uid

        }));



        username = data.username;

        uid = data.uid;



        initChat();

      }

    });



    if (!found) {

      alert("Invalid username or password!");

      login();

    }



  }).catch(err => {

    console.error("Login error:", err);

    alert("Login failed. Please try again.");

    login();

  });

}







/* ===============================

   GIPHY INTEGRATION

================================ */



function initGifModal() {

  const modal = document.getElementById("gif-modal");

  const gifBtn = document.getElementById("gif-btn");

  const closeBtn = document.getElementById("gif-close");

  const searchBtn = document.getElementById("gif-search-btn");

  const searchInput = document.getElementById("gif-search");

  const gifGrid = document.getElementById("gif-grid");



  // Open modal

  gifBtn.addEventListener("click", () => {

    modal.classList.add("active");

    // Small delay to help with CORS issues on some platforms

    setTimeout(() => {

      loadTrendingGifs();

    }, 100);

  });



  // Close modal

  closeBtn.addEventListener("click", () => {

    modal.classList.remove("active");

  });



  // Close on backdrop click

  modal.addEventListener("click", (e) => {

    if (e.target === modal) {

      modal.classList.remove("active");

    }

  });



  // Search GIFs

  searchBtn.addEventListener("click", () => {

    const query = searchInput.value.trim();

    if (query) {

      searchGifs(query);

    } else {

      loadTrendingGifs();

    }

  });



  // Search on Enter key

  searchInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

      e.preventDefault();

      const query = searchInput.value.trim();

      if (query) {

        searchGifs(query);

      } else {

        loadTrendingGifs();

      }

    }

  });



  // Load trending GIFs on init

  function loadTrendingGifs() {

    const apiKey = typeof CONFIG.giphy === 'string' ? CONFIG.giphy : CONFIG.giphy?.apiKey || CONFIG.giphy?.key;

    if (!apiKey) {

      console.error("Giphy API key not found in config");

      gifGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">API key not configured</div>';

      return;

    }

    const url = `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=6&rating=g`;



    gifGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">Loading...</div>';



    fetch(url, {

      mode: 'cors',

      cache: 'no-cache'

    })

      .then(r => {

        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        return r.json();

      })

      .then(data => {

        if (data.data && data.data.length > 0) {

          displayGifs(data.data);

        } else {

          gifGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">No GIFs found</div>';

        }

      })

      .catch(err => {

        console.error("Error loading trending GIFs:", err);

        gifGrid.innerHTML = `

          <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">

            Unable to load trending GIFs<br>

            <button onclick="document.querySelector('#gif-search-btn').click()" style="margin-top: 10px; background: #9f5bff; border: none; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer;">

              Try searching instead

            </button>

          </div>

        `;

      });

  }



  // Search GIFs

  function searchGifs(query) {

    const apiKey = typeof CONFIG.giphy === 'string' ? CONFIG.giphy : CONFIG.giphy?.apiKey || CONFIG.giphy?.key;

    if (!apiKey) {

      console.error("Giphy API key not found in config");

      gifGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">API key not configured</div>';

      return;

    }

    const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=6&rating=g`;



    gifGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">Searching...</div>';



    fetch(url, {

      mode: 'cors',

      cache: 'no-cache'

    })

      .then(r => {

        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        return r.json();

      })

      .then(data => {

        if (data.data && data.data.length > 0) {

          displayGifs(data.data);

        } else {

          gifGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">No GIFs found for "' + query + '"</div>';

        }

      })

      .catch(err => {

        console.error("Error searching GIFs:", err);

        gifGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">Search failed. Please try again.</div>';

      });

  }



  // Display GIFs in grid

  function displayGifs(gifs) {

    gifGrid.innerHTML = "";



    gifs.forEach(gif => {

      const item = document.createElement("div");

      item.className = "gif-item";



      const img = document.createElement("img");

      img.src = gif.images.fixed_height.url;

      img.alt = gif.title;



      item.appendChild(img);



      item.addEventListener("click", () => {

        sendGif(gif.images.fixed_height.url);

        modal.classList.remove("active");

      });



      gifGrid.appendChild(item);

    });

  }



  // Send GIF as message

  function sendGif(gifUrl) {

    // Validate GIF URL

    if (!gifUrl || typeof gifUrl !== 'string') {

      console.error("Invalid GIF URL");

      return;

    }



    // Only allow giphy URLs for security

    if (!gifUrl.startsWith('https://media.giphy.com/') && 

        !gifUrl.startsWith('https://media0.giphy.com/') &&

        !gifUrl.startsWith('https://media1.giphy.com/') &&

        !gifUrl.startsWith('https://media2.giphy.com/') &&

        !gifUrl.startsWith('https://media3.giphy.com/') &&

        !gifUrl.startsWith('https://media4.giphy.com/')) {

      console.error("Invalid GIF source");

      return;

    }



    const db = firebase.database();

    const messagesRef = db.ref("messages");



    messagesRef.push({

      user: username,

      text: "",

      gifUrl: gifUrl,

      time: Date.now()

    }).catch(err => {

      console.error("Failed to send GIF:", err);

      alert("Failed to send GIF. Please try again.");

    });

  }

}







/* ===============================

   CHAT + PRESENCE

================================ */



function initChat() {



  const db = firebase.database();

  const messagesRef = db.ref("messages");

  const presenceRef = db.ref("presence");



  const chatBox = document.getElementById("chat-box");

  const input = document.getElementById("message");

  const sendBtn = document.getElementById("send-btn");



  // Initialize GIF modal

  initGifModal();



  /* ---- PRESENCE ---- */



  const userRef = presenceRef.child(username);



  firebase.database().ref(".info/connected")

    .on("value", snap => {



      if (snap.val() === true) {



        userRef.onDisconnect().set({

          online: false

        });



        userRef.set({

          online: true

        });

      }

    });



  // Heartbeat to keep presence alive (every 30 seconds)

  setInterval(() => {

    userRef.set({

      online: true,

      lastSeen: Date.now()

    });

  }, 30000);



  /* SHOW ALL USERS (ONLINE + OFFLINE) - DYNAMIC */



  const onlineDiv = document.getElementById("online-users");

  const offlineDiv = document.getElementById("offline-users");



  // Function to update user lists

  function updateUserLists() {

    firebase.database().ref("accounts").once("value").then(accountsSnap => {

      firebase.database().ref("presence").once("value").then(presenceSnap => {



        const presenceData = presenceSnap.val() || {};



        onlineDiv.innerHTML = "";

        offlineDiv.innerHTML = "";



        accountsSnap.forEach(acc => {

          const accData = acc.val();



          // Validate account data

          if (!accData || !accData.username) {

            console.warn("Invalid account data:", acc.key);

            return;

          }



          const isOnline = presenceData[accData.username]?.online;



          const wrapper = document.createElement("div");

          wrapper.style.display = "flex";

          wrapper.style.alignItems = "center";

          wrapper.style.gap = "8px";



          const avatar = document.createElement("div");

          avatar.style.width = "28px";

          avatar.style.height = "28px";

          avatar.style.borderRadius = "50%";

          avatar.style.background = "#9f5bff";

          avatar.style.display = "flex";

          avatar.style.alignItems = "center";

          avatar.style.justifyContent = "center";

          avatar.style.fontSize = "13px";

          avatar.textContent = accData.username[0].toUpperCase();



          const name = document.createElement("span");

          name.textContent = accData.username;



          wrapper.appendChild(avatar);

          wrapper.appendChild(name);



          if (isOnline) {

            onlineDiv.appendChild(wrapper);

          } else {

            offlineDiv.appendChild(wrapper);

          }

        });

      }).catch(err => {

        console.error("Failed to load presence data:", err);

      });

    }).catch(err => {

      console.error("Failed to load accounts:", err);

    });

  }



  // Listen for presence changes

  presenceRef.on("value", () => {

    updateUserLists();

  });



  // Listen for new accounts

  firebase.database().ref("accounts").on("child_added", () => {

    updateUserLists();

  });



  // Initial load

  updateUserLists();







  /* ---- LOAD MESSAGES ---- */



  messagesRef.limitToLast(100)

    .on("child_added", snap => {



      const msg = snap.val();



      // Validate message data

      if (!msg || !msg.user || !msg.time) {

        console.warn("Invalid message data:", snap.key);

        return;

      }



      const isMine = msg.user === username;



      const div = document.createElement("div");

      div.className = "msg " + (isMine ? "mine" : "");



      // Build message content

      let messageContent = "";

      if (msg.text) {

        messageContent = `<div>${msg.text}</div>`;

      }

      if (msg.gifUrl) {

        // Validate GIF URL before displaying

        if (msg.gifUrl.startsWith('https://media') && msg.gifUrl.includes('giphy.com')) {

          messageContent += `<img src="${msg.gifUrl}" alt="GIF" onerror="this.style.display='none'">`;

        }

      }



      div.innerHTML = `

        <div class="avatar">

          ${msg.user[0].toUpperCase()}

        </div>

        <div class="bubble">

          <div class="user">${msg.user}</div>

          ${messageContent}

          <div class="time">

            ${new Date(msg.time).toLocaleString()}

          </div>

        </div>

      `;



      chatBox.appendChild(div);

      chatBox.scrollTop = chatBox.scrollHeight;

    }, err => {

      console.error("Failed to load messages:", err);

    });







  /* ---- SEND MESSAGE ---- */



  let lastMessageTime = 0;

  const MESSAGE_COOLDOWN = 500; // 500ms between messages



  function sendMessage() {

    const text = input.value.trim();

    if (!text) return;



    // Rate limiting

    const now = Date.now();

    if (now - lastMessageTime < MESSAGE_COOLDOWN) {

      return; // Silently prevent spam

    }

    lastMessageTime = now;



    // Limit message length

    if (text.length > 1000) {

      alert("Message is too long! Maximum 1000 characters.");

      return;

    }



    // Basic XSS prevention - escape HTML

    const sanitizedText = text

      .replace(/&/g, "&amp;")

      .replace(/</g, "&lt;")

      .replace(/>/g, "&gt;")

      .replace(/"/g, "&quot;")

      .replace(/'/g, "&#039;");



    messagesRef.push({

      user: username,

      text: sanitizedText,

      time: Date.now()

    }).catch(err => {

      console.error("Failed to send message:", err);

      alert("Failed to send message. Please try again.");

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