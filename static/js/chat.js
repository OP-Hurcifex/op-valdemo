let Unit = '';
let Week = '';
let currentVersion = ''; // Переменная для текущей версии
const currentUser = sessionStorage.getItem('username');

// Функция для показа модального окна
function showUpdateModal() {
    const modal = document.getElementById('updateModal');
    modal.style.display = 'flex'; // Показываем модальное окно
}

// Закрытие модального окна
function closeUpdateModal() {
    const modal = document.getElementById('updateModal');
    modal.style.display = 'none'; // Скрываем модальное окно
}

// Проверка версии сайта
function checkSiteVersion(newVersion) {
    const savedVersion = localStorage.getItem('siteVersion'); // Извлекаем версию из localStorage
    console.log(`Saved version: ${savedVersion}, Current version: ${newVersion}`); // Лог для отладки

    if (savedVersion === null || savedVersion !== newVersion) {
        // Если версия не найдена или версии не совпадают, показываем модальное окно
        showUpdateModal();
        localStorage.setItem('siteVersion', newVersion); // Сохраняем новую версию в localStorage
    }
}

// Функция перезагрузки сайта и сохранения новой версии в localStorage
function reloadSite() {
    // Перезагружаем страницу
    location.reload();
}

// Проверяем версию при загрузке страницы
window.onload = () => {
    // Получаем текущую версию от сервера при подключении
    socket.emit('getVersion', {}, (response) => {
        currentVersion = response.version; // Устанавливаем текущую версию
        checkSiteVersion(currentVersion); // Проверяем версию после получения данных от сервера
    });
};


const socket = io();
const messagesDiv = document.getElementById('messages');
const skeletonLoader = document.getElementById('skeleton-loader');
const fileUploadButton = document.getElementById('file-upload-button');
const fileInput = document.getElementById('file-input');
const passwordModal = document.getElementById('passwordModal');
const closeButton = document.querySelector('.close-button');
const passwordForm = document.getElementById('password-form');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const statusContainer = document.getElementById('status-container');
const updatePasswordButton = document.getElementById('update-password-button');
const audioModal = document.getElementById('audioModal');
const audioPlayer = document.getElementById('audioPlayer');
const closeAudioModal = document.getElementById('closeAudioModal');
const audioTrackName = document.getElementById('audioTrackName');
const audioSource = document.getElementById('audioSource');
const musicPackOption = document.getElementById('music-pack-option');
const musicModal = document.getElementById('music-modal');
const playerModal = document.getElementById('player-modal');
const closeMusicModal = document.getElementById('close-music-modal');
const closePlayerModal = document.getElementById('close-player-modal');
const musicList = document.getElementById('music-list');
const audioElement = document.getElementById('audio-element');
const playPauseButton = document.getElementById('play-pause');
const progressBar = document.getElementById('progress-bar');
const progressBarContainer = document.getElementById('progress-bar-container');
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');
let currentTrackIndex = 0;
let tracks = [];  // Массив для хранения треков

// Открытие модального окна списка музыки
if (musicPackOption && musicModal && musicList) {
    musicPackOption.addEventListener('click', () => {
        musicModal.classList.remove('hidden');
        musicModal.classList.add('show');
        loadMusicList();
    });
}

// Закрытие модального окна списка музыки
if (closeMusicModal && musicModal) {
    closeMusicModal.addEventListener('click', () => {
        musicModal.classList.remove('show');
        musicModal.classList.add('hidden');
        // Сброс содержимого списка музыки при закрытии
        setTimeout(() => {
            musicList.innerHTML = '';
        }, 300); // Учитываем время анимации закрытия
    });
}

// Загрузка списка музыки с имитацией загрузки
function loadMusicList() {
    musicList.innerHTML = ` 
        <div class="skeleton-loader">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line"></div>
        </div>`;

    // Имитация задержки загрузки
    setTimeout(() => {
        fetchTracks();  // Запрашиваем треки с сервера
    }, 2000); // Задержка 2 секунды
}

// Получаем список треков с сервера

async function fetchTracks() {
    try {
        const response = await fetch('/api/tracks');  // Указываем путь к API сервера Flask
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const tracksData = await response.json();  // Получаем данные в формате JSON
        tracks = tracksData;  // Сохраняем полученные треки в массив tracks
        updateMusicList(tracks);  // Обновляем список музыки на странице
    } catch (error) {
        console.error('Error fetching tracks:', error);
    }
}

// Обновляем список треков на странице
function updateMusicList(tracksData) {
    musicList.innerHTML = '';  // Очистить лоадер

    tracksData.forEach((track, index) => {
        const trackElement = document.createElement('div');
        trackElement.classList.add('track-item-music');
        trackElement.innerHTML = `
            <span>${track.title}</span>
            <button class="play-button-music" data-index="${index}">▶</button>
        `;
        musicList.appendChild(trackElement);
    });
    attachPlayButtons();  // Привязываем кнопки воспроизведения
}

// Функция для привязки кнопок воспроизведения к каждому треку
function attachPlayButtons() {
    const playButtons = document.querySelectorAll('.play-button-music');
    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            const trackIndex = button.getAttribute('data-index');
            playTrack(trackIndex);
        });
    });
}

// Функция для воспроизведения трека
function playTrack(index) {
    if (index < 0 || index >= tracks.length) {
        console.warn("The index of the track is out of range.");
        showToastNotification("The index of the track is out of range.", 'error');
        return;
    }

    currentTrackIndex = index; // Сохраняем индекс текущего трека
    const track = tracks[index]; // Получаем трек по индексу

    // Обновляем источник для аудио
    audioElement.src = track.url;

    // Воспроизводим трек
    audioElement.play();

    // Обновляем UI плеера
    updatePlayerUI(track.title);

    // Отображаем модальное окно плеера
    playerModal.classList.add('active');
}


// Обновление UI плеера
function updatePlayerUI(title) {
    document.getElementById('player-title').textContent = `${title}`;
    playPauseButton.textContent = '<i class="fas fa-play"></i>'; // Восстанавливаем иконку воспроизведения
}

// Форматирование времени
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateProgressBar(e) {
    const rect = progressBarContainer.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = (offsetX / progressBarContainer.offsetWidth) * 100;
    progressBar.style.width = `${percentage}%`; // Обновляем визуальную ширину прогресс-бара

    // Изменяем currentTime аудио в зависимости от места клика на прогресс-баре
    audioElement.currentTime = (percentage / 100) * audioElement.duration;
}

function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

const accountIcon = document.getElementById('account-icon');
const accountMenu = document.getElementById('account-menu');
const changePasswordOption = document.getElementById('change-password-option');
const logoutOption = document.getElementById('logout-option');


function showToastNotification(message, type = 'success', duration = 5000) {
    const icons = {
      success: 'fa-check',
      error:   'fa-exclamation-triangle',
      warning: 'fa-exclamation-circle',
      info:    'fa-info-circle'
    };

    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.setProperty('--hide-delay', `${(duration/1000).toFixed(2)}s`);
	
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
    closeBtn.onclick = () => toast.remove();

    toast.append(icon, msg, closeBtn);
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('active'));

    setTimeout(() => toast.remove(), duration + 400);
  }


accountIcon.addEventListener('click', () => {
    if (accountMenu.classList.contains('show')) {
        // Удаляем класс "show" для запуска анимации скрытия
        accountMenu.classList.remove('show');
        setTimeout(() => {
            accountMenu.style.display = 'none'; // После завершения анимации скрываем элемент
        }, 300); // Должно совпадать с длительностью transition
    } else {
        accountMenu.style.display = 'block'; // Отображаем элемент перед добавлением анимации
        setTimeout(() => {
            accountMenu.classList.add('show'); // Добавляем класс "show" для появления
        }, 10); // Небольшая задержка для срабатывания анимации
    }
});

document.getElementById('logout-option').addEventListener('click', function() {
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to log out. Response status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                sessionStorage.removeItem('username');
                window.location.href = '/login';
            } else {
                throw new Error('Logout failed: Server did not confirm success.');
            }
        })
        .catch(error => {
            console.error('Error logging out:', error);
            alert('Ошибка выхода! Попробуйте еще раз.');
        });
});

// Открыть окно смены пароля
changePasswordOption.addEventListener('click', () => {
    passwordModal.style.display = 'flex';
    accountMenu.style.display = 'none'; // Закрыть меню после клика
});

// Close the modal
closeButton.addEventListener('click', () => {
    passwordModal.style.display = 'none';
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    statusContainer.innerHTML = ''; // Clear status messages
});

// Handle form submission
passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;

    // Show skeleton loading animation
    statusContainer.innerHTML = '<div class="skeleton"></div>';

    // Simulate server request
    fetch('/change_password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            currentPassword,
            newPassword
        })
    })
        .then(response => response.json())
        .then(data => {
            // Remove skeleton animation
            statusContainer.innerHTML = '';
            if (data.error) {
                statusContainer.innerHTML = `<div class="status-message error">${data.error}</div>`;
                showToastNotification(data.error, 'error');
            } else {
                statusContainer.innerHTML = `<div class="status-message success">${data.message}</div>`;
                showToastNotification(data.message, 'success');
                // Clear form fields after success
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
            }
        })
        .catch(error => {
            statusContainer.innerHTML = `<div class="status-message error">An error occurred. Please try again.</div>`;
            console.error('Error:', error);
        });
});

// Обработка обновления версии
socket.on('updateReleased', (data) => {
    const newVersion = data.version;
    console.log('New version released:', newVersion);

    // Если версия изменилась, показываем модальное окно с обновлением
    if (newVersion !== localStorage.getItem('siteVersion')) {
        showUpdateModal();
        localStorage.setItem('siteVersion', newVersion); // Сохраняем новую версию
    }
});

socket.on('load_messages', (loadedMessages) => {
    skeletonLoader.style.display = 'none';

    if (loadedMessages.length === 0) {
        const noMessages = document.createElement('div');
        noMessages.classList.add('no-messages');

        const animationContainer = document.createElement('div');
        animationContainer.classList.add('animation-container');

        noMessages.appendChild(animationContainer);

        lottie.loadAnimation({
            container: animationContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/static/animations/NoMessages.json'
        });

        messagesDiv.appendChild(noMessages);
    } else {
        loadedMessages.forEach((message) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');

            const header = document.createElement('div');
            header.classList.add('message-header');

            // Контейнер для аватарки
            const avatarContainer = document.createElement('div');
            avatarContainer.classList.add('avatar-container');

            const username = message.username;

            // Показать первую букву имени сразу, если аватарки нет
            const avatarPlaceholder = document.createElement('div');
            avatarPlaceholder.classList.add('avatar-placeholder');
            avatarPlaceholder.textContent = username.charAt(0).toUpperCase();
            avatarContainer.appendChild(avatarPlaceholder);

            // Загрузить аватарку пользователя
            fetch(`/get_avatar/${username}`)
                .then(response => response.json())
                .then(data => {
                    if (data.avatar_url) {
                        // Если аватарка существует, заменяем её
                        const avatarImg = document.createElement('img');
                        avatarImg.src = data.avatar_url;
                        avatarImg.alt = username;
                        avatarImg.classList.add('avatar-image');
                        avatarContainer.innerHTML = ''; // Очищаем контейнер от placeholder
                        avatarContainer.appendChild(avatarImg);
                    } else {
                        // Если аватарки нет, оставляем первую букву
                        avatarContainer.innerHTML = ''; // Очищаем контейнер от placeholder
                        avatarContainer.appendChild(avatarPlaceholder);
                    }
                })
                .catch(error => {
                    console.error("Ошибка загрузки аватара:", error);
                    // В случае ошибки тоже показываем первую букву имени
                    avatarContainer.innerHTML = ''; // Очищаем контейнер от placeholder
                    avatarContainer.appendChild(avatarPlaceholder);
                });

            const usernameElement = document.createElement('span');
            usernameElement.classList.add('message-username');
            usernameElement.textContent = username;

            const timestampElement = document.createElement('span');
            timestampElement.classList.add('message-timestamp');
            timestampElement.textContent = message.timestamp;

            header.appendChild(avatarContainer);
            header.appendChild(usernameElement);
            header.appendChild(timestampElement);

            const content = document.createElement('div');
            content.classList.add('message-content');

            if (message.type === 'text') {
                content.textContent = message.text;
            } else if (message.type === 'file') {
                if (message.filename.match(/\.(jpeg|jpg|gif|png)$/i)) {
                    // Создаем обертку для изображения
                    const imageWrapper = document.createElement('div');
                    imageWrapper.classList.add('image-wrapper');

                    // Создаем блок для анимации спиннера
                    const imgLoadingSpinner = document.createElement('div');
                    imgLoadingSpinner.classList.add('lds-dual-ring'); // Применяем новый класс для спиннера
                    content.appendChild(imgLoadingSpinner); // Добавляем спиннер в message-content

                    // Создаем само изображение
                    const image = document.createElement('img');
                    image.src = message.url;
                    image.alt = message.filename;
                    image.classList.add('message-image');

                    // Скрываем изображение до того, как оно загрузится
                    image.style.display = 'none';

                    // Когда изображение загружено, скрываем спиннер и показываем изображение
                    image.onload = () => {
                        imgLoadingSpinner.style.display = 'none'; // Скрываем спиннер
                        image.style.display = 'block'; // Показываем изображение
                    };

                    // Если ошибка при загрузке изображения
                    image.onerror = () => {
                        imgLoadingSpinner.style.display = 'none'; // Скрыть спиннер
                        content.innerHTML = 'Ошибка загрузки изображения'; // Показать ошибку
                    };

                    // Добавляем изображение в обертку
                    imageWrapper.appendChild(image);
                    content.appendChild(imageWrapper); // Добавляем обертку в message-content
                } else if (message.type === 'file' && message.filename.match(/\.(mp4|webm|ogg)$/i)) {
                    // Создаем кастомный видеоплеер
                    const customPlayer = createCustomVideoPlayer(message.url);
                    content.appendChild(customPlayer);
                } else if (message.filename.match(/\.(mp3)$/i)) {
                    const audioWrapper = document.createElement('div');
                    audioWrapper.classList.add('audio-wrapper');

                    const playIcon = document.createElement('span');
                    playIcon.classList.add('play-icon');
                    playIcon.innerHTML = '▶';

                    const trackName = document.createElement('span');
                    trackName.classList.add('track-name');
                    trackName.textContent = message.filename;

                    const audioElement = document.createElement('audio');
                    audioElement.src = message.url;
                    audioElement.classList.add('message-audio');
                    audioElement.controls = false;

                    playIcon.addEventListener('click', () => {
                        openAudioModal(message.url);
                    });

                    audioWrapper.appendChild(playIcon);
                    audioWrapper.appendChild(trackName);
                    audioWrapper.appendChild(audioElement);
                    content.appendChild(audioWrapper);
                } else {
                    content.innerHTML = `<a href="${message.url}" target="_blank">${message.filename}</a>`;
                }
            }

            messageElement.appendChild(header);
            messageElement.appendChild(content);
            messagesDiv.appendChild(messageElement);
        });
    }
    scrollToBottom();
});



const changeAvatarOption = document.getElementById("change-avatar-option");
const avatarModal = document.getElementById("avatar-modal");
const avatarUploadInput = document.getElementById("avatar-upload-input");
const uploadAvatarButton = document.getElementById("upload-avatar-button");
const closeAvatarModal = document.getElementById("close-avatar-modal");

// Handling the avatar change option
changeAvatarOption.addEventListener("click", () => {
    avatarModal.style.display = "flex"; // Show the avatar upload modal
    accountMenu.style.display = "none"; // Hide the account menu
});

// Handling the avatar upload button
// Обработчик события для кнопки загрузки аватара
uploadAvatarButton.addEventListener("click", () => {
    const file = avatarUploadInput.files[0];
    if (file) {
        // Вызываем функцию uploadAvatar, передавая имя пользователя и файл
        uploadAvatar(currentUser, file);
    } else {
        alert("Пожалуйста, выберите аватар для загрузки.");
    }
});

// Функция загрузки аватара
function uploadAvatar(username, file) {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("file", file);

    fetch("/upload_avatar", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.avatar_url) {
                // Убираем строку, которая обновляла аватар на странице
                // document.getElementById("user-avatar").src = data.avatar_url;
                showToastNotification('<b>Successfully uploaded photo</b> <span> Update page to see new photo. </span>', "success", 4000);

            } else {
                showToastNotification("Failed : " + data.error);
            }
        })
        .catch(error => showToastNotification("Ошибка: " + error));
}


// Close the avatar upload modal
closeAvatarModal.addEventListener("click", () => {
    avatarModal.style.display = "none"; // Hide the avatar modal
    accountMenu.style.display = "block"; // Show the account menu again
});

// Handling the password change option
changePasswordOption.addEventListener("click", () => {
    passwordModal.style.display = 'flex'; // Show the password change modal
    accountMenu.style.display = 'none'; // Close the account menu
});

let messageTimestamps = []; // Массив для хранения времени отправки сообщений
const maxMessages = 3; // Максимальное количество сообщений за промежуток времени
const timeFrame = 9000; // Промежуток времени в миллисекундах (5 секунд)
const cooldownTime = 30; // Время блокировки в секундах
const blockScreen = document.getElementById("block-screen");
const timerElement = document.getElementById("timer");
let isBlocked = false; // Флаг блокировки


// Функция отправки сообщения
function sendMessage() {
    let countBlocks = localStorage.getItem('countBlocks') ? parseInt(localStorage.getItem('countBlocks')) : 0;

    if (isBlocked) {
        alert("You are temporarily blocked from sending messages.");
        return; // Блокируем отправку, если пользователь уже заблокирован
    }

    const now = Date.now();
    messageTimestamps.push(now);

    // Удаляем старые записи, которые выходят за пределы заданного времени
    messageTimestamps = messageTimestamps.filter(
        (timestamp) => now - timestamp <= timeFrame
    );

    if (messageTimestamps.length > maxMessages) {
        ++countBlocks;
        blockUser(currentUser, 30 * countBlocks); // Блокируем пользователя
        localStorage.setItem('countBlocks', countBlocks); // Сохраняем обновленное значение в localStorage

        // Информируем пользователя о блокировке
        alert(`You have been blocked for ${30 * countBlocks} minutes due to spamming.`);
    } else {
        console.log("Message sent"); // Здесь код отправки сообщения

        // (Опционально) Если у тебя есть логика отправки сообщения, вызови её здесь:
        // sendToServer(message);
    }

    // Сбрасываем высоту message input после отправки
    const textarea = document.getElementById("message-input");
    textarea.value = ""; // Очищаем текст
    textarea.style.height = "auto"; // Сбрасываем высоту

    // Обновляем высоту, чтобы она не растягивалась за пределы
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
}

const backgroundMusic = new Audio('/static/music/Masha.mp3');
backgroundMusic.loop = false; // Зацикливаем музыку

// Функция для воспроизведения музыки
function playSpecialMusic() {
    backgroundMusic.play();
    console.log('Music started');
}

// Функция для остановки музыки
function stopSpecialMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0; // Сброс к началу трека
    console.log('Music stopped');
}

// Клиент слушает событие, которое сервер отправит в ответ
socket.on('tempBanUser', (data) => {
  console.log("Received tempBanUser event:", data);
  blockUser(data.username, data.duration);
});

// Клиент слушает событие unblockUser
socket.on('unblockUser', (data) => {
  console.log("Received unblockUser event:", data);
  unblockUsername(data.username);
});

const blockStates = new Map(); // { username: { isBlocked, timerInterval, blockEndTime } }

// Функция для форматирования времени в формате MM:SS
function formatTimeBlock(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Функция для запуска таймера блокировки
function startBlockTimer(username, duration, userState, timerElement) {
  let timeLeft = duration;
  timerElement.textContent = formatTimeBlock(timeLeft);

  userState.timerInterval = setInterval(() => {
    timeLeft--;
    timerElement.textContent = formatTimeBlock(timeLeft);

    // Если время истекло, разблокируем пользователя
    if (timeLeft <= 0) {
      clearInterval(userState.timerInterval);
      userState.timerInterval = null;
      unblockUsername(username);
      blockStates.delete(username);
      try {
        localStorage.removeItem(`blockEndTime_${username}`);
      } catch (err) {
        console.error(`Failed to remove blockEndTime from localStorage for ${username}: ${err.message}`);
      }
    }
  }, 1000);

  blockStates.set(username, userState);
}

// Функция для блокировки пользователя по username
function blockUser(username, duration) {
  // Проверяем валидность duration
  if (!Number.isInteger(duration) || duration <= 0) {
    console.log(`Invalid duration: ${duration}. Duration must be a positive integer.`);
    return;
  }

  // Получаем текущего пользователя
  const currentUser = getCurrentUser();
  if (username !== currentUser) {
    return;
  }

  // Инициализируем или получаем состояние блокировки
  const userState = blockStates.get(username) || { isBlocked: false, timerInterval: null, blockEndTime: null };

  // Показываем экран блокировки
  blockScreen.classList.remove('hidden');
  blockScreen.classList.add('visible');

  // Если пользователь уже заблокирован, сбрасываем таймер с задержкой
  if (userState.isBlocked) {
    clearInterval(userState.timerInterval);
    userState.timerInterval = null;
    timerElement.textContent = '00:00'; // Сбрасываем таймер до 00:00
    timerElement.classList.add('timer-pulse'); // Добавляем анимацию пульсации

    // Задержка 1 секунда перед установкой нового времени
    setTimeout(() => {
      timerElement.classList.remove('timer-pulse'); // Удаляем анимацию
      const blockEndTime = Date.now() + duration * 1000;
      userState.isBlocked = true;
      userState.blockEndTime = blockEndTime;
      try {
        localStorage.setItem(`blockEndTime_${username}`, blockEndTime);
      } catch (err) {
       // console.error(`Failed to save blockEndTime to localStorage for ${username}: ${err.message}`);
      }
      startBlockTimer(username, duration, userState, timerElement);
    }, 3000);
    return;
  }

  // Запускаем специальную музыку (закомментировано, как в оригинале)
  // playSpecialMusic();

  // Блокируем взаимодействие с элементами страницы
  document.body.style.pointerEvents = 'none';
  disableMessageInput();

  // Обновляем состояние блокировки
  userState.isBlocked = true;
  const blockEndTime = Date.now() + duration * 1000;
  userState.blockEndTime = blockEndTime;
  try {
    localStorage.setItem(`blockEndTime_${username}`, blockEndTime);
  } catch (err) {
    console.error(`Failed to save blockEndTime to localStorage for ${username}: ${err.message}`);
  }

  // Запускаем таймер
  startBlockTimer(username, duration, userState, timerElement);
}

function unblockUser() {
  // Очищаем все таймеры для всех пользователей
  blockStates.forEach((state, username) => {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      state.isBlocked = false;
      blockStates.set(username, state);
      localStorage.removeItem(`blockEndTime_${username}`);
    }
  });

  // Сбрасываем глобальные флаги и состояние
  document.body.style.pointerEvents = 'auto';
  stopSpecialMusic();
  enableMessageInput();
  localStorage.removeItem("blockEndTime"); // Удаляем глобальную блокировку из localStorage
  blockScreen.classList.remove("visible"); // Скрываем экран блокировки
  messageTimestamps = []; // Сбрасываем историю сообщений
  timerElement.textContent = ''; // Сбрасываем отображение таймера

  // Очищаем Map, так как разблокировка глобальная
  blockStates.clear();
}

// Функция для разблокировки пользователя по username
function unblockUsername(username) {
  const userState = blockStates.get(username);
  if (!userState || !userState.isBlocked) {
    console.log(`User ${username} is not blocked.`);
    return;
  }

  // Очищаем таймер, если он активен
  if (userState.timerInterval) {
    clearInterval(userState.timerInterval);
    userState.timerInterval = null;
  }

  // Сбрасываем состояние блокировки
  userState.isBlocked = false;
  blockStates.set(username, userState);

  // Восстанавливаем взаимодействие с элементами
  document.body.style.pointerEvents = 'auto';
  stopSpecialMusic();
  enableMessageInput();

  // Удаляем данные из localStorage
  localStorage.removeItem(`blockEndTime_${username}`);

  // Скрываем экран блокировки
  blockScreen.classList.remove("visible");
  messageTimestamps = []; // Сбрасываем историю сообщений
  timerElement.textContent = ''; // Сбрасываем отображение таймера

  // Удаляем состояние пользователя из Map
  blockStates.delete(username);
}

// Форматирование времени в MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Проверка при загрузке страницы (если пользователь был заблокирован)
document.addEventListener("DOMContentLoaded", () => {
    const currentUser = getCurrentUser(); // Предполагается, что эта функция возвращает имя текущего пользователя
    if (!currentUser) {
        console.log("No current user found on page load.");
        return;
    }

    const blockEndTimeKey = `blockEndTime_${currentUser}`;
    const blockEndTime = localStorage.getItem(blockEndTimeKey);

    if (blockEndTime) {
        const remainingTime = Math.max(0, Math.floor((blockEndTime - Date.now()) / 1000));

        if (remainingTime > 0) {
            blockUser(currentUser, remainingTime); // Продолжить блокировку для конкретного пользователя
        } else {
            localStorage.removeItem(blockEndTimeKey); // Если время истекло, очистить запись
            blockStates.delete(currentUser); // Удаляем состояние из Map
        }
    }
});

// Обработчик для нового сообщения
socket.on('new_message', (message) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    // Создание контейнера для имени пользователя и времени
    const header = document.createElement('div');
    header.classList.add('message-header');

    const usernameElement = document.createElement('span');
    usernameElement.classList.add('message-username');
    usernameElement.textContent = message.username;

    const timestampElement = document.createElement('span');
    timestampElement.classList.add('message-timestamp');
    timestampElement.textContent = message.timestamp;

    header.appendChild(usernameElement);
    header.appendChild(timestampElement);

    // Создание контейнера для аватарки
    const avatarContainer = document.createElement('div');
    avatarContainer.classList.add('avatar-container');

    // Загрузка аватарки пользователя
    fetch(`/get_avatar/${message.username}`)
        .then(response => response.json())
        .then(data => {
            const avatarPlaceholder = document.createElement('div');
            avatarPlaceholder.classList.add('avatar-placeholder');
            avatarPlaceholder.textContent = message.username.charAt(0).toUpperCase(); // Первая буква

            if (data.avatar_url) {
                const avatarImg = document.createElement('img');
                avatarImg.src = data.avatar_url;
                avatarImg.alt = message.username;
                avatarImg.classList.add('avatar-image');
                avatarContainer.innerHTML = ''; // Очищаем контейнер от placeholder
                avatarContainer.appendChild(avatarImg);
            } else {
                avatarContainer.innerHTML = ''; // Очищаем контейнер от placeholder
                avatarContainer.appendChild(avatarPlaceholder);
            }
        })
        .catch(error => {
            console.error("Ошибка загрузки аватара:", error);
            const avatarPlaceholder = document.createElement('div');
            avatarPlaceholder.classList.add('avatar-placeholder');
            avatarPlaceholder.textContent = message.username.charAt(0).toUpperCase(); // Первая буква
            avatarContainer.innerHTML = ''; // Очищаем контейнер от placeholder
            avatarContainer.appendChild(avatarPlaceholder);
        });

    // Добавляем аватарку в header
    header.insertBefore(avatarContainer, usernameElement);

    // Создание содержимого сообщения
    const content = document.createElement('div');
    content.classList.add('message-content');

    if (message.type === 'text') {
        content.textContent = message.text;
    } else if (message.type === 'file') {
        if (message.filename.match(/\.(jpeg|jpg|gif|png)$/i)) {
            // Создаем обертку для изображения
            const imageWrapper = document.createElement('div');
            imageWrapper.classList.add('image-wrapper');

            // Создаем блок для анимации спиннера
            const imgLoadingSpinner = document.createElement('div');
            imgLoadingSpinner.classList.add('lds-dual-ring'); // Применяем новый класс для спиннера
            content.appendChild(imgLoadingSpinner); // Добавляем спиннер в message-content

            // Создаем само изображение
            const image = document.createElement('img');
            image.src = message.url;
            image.alt = message.filename;
            image.classList.add('message-image');

            // Скрыть изображение до его загрузки
            image.style.display = 'none';

            // Когда изображение загружено, скрыть спиннер и показать изображение
            image.onload = () => {
                imgLoadingSpinner.style.display = 'none'; // Скрыть спиннер
                image.style.display = 'block'; // Показать изображение
            };

            // Если ошибка при загрузке изображения
            image.onerror = () => {
                imgLoadingSpinner.style.display = 'none'; // Скрыть спиннер
                content.innerHTML = 'Ошибка загрузки изображения'; // Показать ошибку
            };

            imageWrapper.appendChild(image);
            content.appendChild(imageWrapper); // Добавляем обертку с изображением в message-content
        }
        else if (message.type === 'file' && message.filename.match(/\.(mp4|webm|ogg)$/i)) {
            // Создаем кастомный видеоплеер
            const customPlayer = createCustomVideoPlayer(message.url);
            content.appendChild(customPlayer);
        }
        else if (message.filename.match(/\.(mp3)$/i)) {
            const audioWrapper = document.createElement('div');
            audioWrapper.classList.add('audio-wrapper');

            const playIcon = document.createElement('span');
            playIcon.classList.add('play-icon');
            playIcon.innerHTML = '▶'; // Иконка play (треугольник)

            const trackName = document.createElement('span');
            trackName.classList.add('track-name');
            trackName.textContent = message.filename; // Имя трека

            const audioElement = document.createElement('audio');
            audioElement.src = message.url;
            audioElement.classList.add('message-audio');
            audioElement.controls = false;

            playIcon.addEventListener('click', () => {
                openAudioModal(message.url);
            });

            audioWrapper.appendChild(playIcon);
            audioWrapper.appendChild(trackName);
            audioWrapper.appendChild(audioElement);
            content.appendChild(audioWrapper);
        } else {
            content.innerHTML = `<a href="${message.url}" target="_blank">${message.filename}</a>`;
        }
    }

    messageElement.appendChild(header);
    messageElement.appendChild(content);

    messagesDiv.appendChild(messageElement);
    scrollToBottom();
});

function createCustomVideoPlayer(videoUrl) {
    const player = document.createElement('div');
    player.classList.add('custom-video-player');

    const video = document.createElement('video');
    video.classList.add('video-element');
    video.src = videoUrl;
    video.preload = 'none'; // Отменить предварительную загрузку

    const controls = document.createElement('div');
    controls.classList.add('controls');

    const playBtn = document.createElement('button');
    playBtn.classList.add('play-btn');
    playBtn.innerHTML = '<i class="fas fa-play"></i>';  // Иконка воспроизведения

    const progressBar = document.createElement('input');
    progressBar.type = 'range';
    progressBar.classList.add('progress-bar');
    progressBar.value = 0;

    const timeDisplay = document.createElement('span');
    timeDisplay.classList.add('time');
    timeDisplay.textContent = '00:00';

    // Добавляем кнопки для перемотки
    const rewindBtn = document.createElement('button');
    rewindBtn.classList.add('seek-btn');
    rewindBtn.innerHTML = '<i class="fas fa-backward"></i>'; // Иконка перемотки назад

    const forwardBtn = document.createElement('button');
    forwardBtn.classList.add('seek-btn');
    forwardBtn.innerHTML = '<i class="fas fa-forward"></i>'; // Иконка перемотки вперед

    // Кнопка полноэкранного режима
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.classList.add('fullscreen-btn');
    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>'; // Иконка полноэкранного режима

    controls.appendChild(playBtn);
    controls.appendChild(rewindBtn);
    controls.appendChild(forwardBtn);
    controls.appendChild(progressBar);
    controls.appendChild(timeDisplay);
    controls.appendChild(fullscreenBtn);

    player.appendChild(video);
    player.appendChild(controls);

    // Вставляем плеер в DOM
    document.body.appendChild(player);

    // Спиннер для загрузки
    const loadingSpinner = document.createElement('div');
    loadingSpinner.classList.add('lds-ring');
    for (let i = 0; i < 4; i++) {
        const spinnerElement = document.createElement('div');
        loadingSpinner.appendChild(spinnerElement);
    }
    player.appendChild(loadingSpinner);
    loadingSpinner.style.display = 'none'; // Скрыть спиннер изначально

    let hideControlsTimeout;
    function resetControlsTimeout() {
        clearTimeout(hideControlsTimeout);
        controls.style.opacity = '1';
        hideControlsTimeout = setTimeout(() => {
            controls.style.opacity = '0';
        }, 3000);
    }

    player.addEventListener('mousemove', resetControlsTimeout);
    player.addEventListener('click', resetControlsTimeout);
    video.addEventListener('play', resetControlsTimeout);
    video.addEventListener('pause', resetControlsTimeout);

    resetControlsTimeout();

    // Воспроизведение и пауза
    playBtn.addEventListener('click', () => {
        if (video.paused) {
            // Загружаем видео только после нажатия на play
            video.load();
            video.play();
            playBtn.innerHTML = '<i class="fas fa-pause"></i>'; // Иконка паузы
            loadingSpinner.style.display = 'none'; // Скрыть спиннер после начала воспроизведения
        } else {
            video.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>'; // Иконка воспроизведения
        }
    });

    // Перемотка на -5 секунд
    rewindBtn.addEventListener('click', () => {
        video.currentTime = Math.max(video.currentTime - 5, 0); // Не даем перемотать в отрицательное время
    });

    // Перемотка на +5 секунд
    forwardBtn.addEventListener('click', () => {
        video.currentTime = Math.min(video.currentTime + 5, video.duration); // Не даем перемотать за конец видео
    });

    // Полноэкранный режим
    fullscreenBtn.addEventListener('click', () => {
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.mozRequestFullScreen) { // Для Firefox
            video.mozRequestFullScreen();
        } else if (video.webkitRequestFullscreen) { // Для Chrome и Safari
            video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) { // Для Internet Explorer
            video.msRequestFullscreen();
        }
    });

    // Обновление прогресса видео
    video.addEventListener('timeupdate', () => {
        const progress = (video.currentTime / video.duration) * 100;
        progressBar.value = progress;

        const currentMinutes = Math.floor(video.currentTime / 60);
        const currentSeconds = Math.floor(video.currentTime % 60);
        timeDisplay.textContent = `${String(currentMinutes).padStart(2, '0')}:${String(currentSeconds).padStart(2, '0')}`;
    });

    // Изменение времени видео при перемещении прогресс-бара
    progressBar.addEventListener('input', () => {
        video.currentTime = (progressBar.value / 100) * video.duration;
    });

    // Показываем спиннер, если видео загружается (событие waiting)
    video.addEventListener('waiting', () => {
        playBtn.innerHTML = '<div class="lds-ring"><div></div><div></div><div></div></div>'; // Показываем спиннер
    });

    // Скрываем спиннер, когда видео начнется воспроизводиться
    video.addEventListener('playing', () => {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>'; // Возвращаем иконку паузы
    });

    return player;
}


function openAudioModal(audioUrl, trackName) {
    audioTrackName.textContent = trackName; // Устанавливаем имя трека
    audioSource.src = audioUrl; // Устанавливаем источник для аудио
    audioPlayer.load(); // Перезагружаем плеер
    audioModal.style.display = 'block'; // Показываем модальное окно
}

// Закрытие модального окна
closeAudioModal.onclick = function() {
    audioModal.style.display = 'none';
    audioPlayer.pause(); // Останавливаем аудио при закрытии
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    if (event.target === audioModal) {
        audioModal.style.display = 'none';
        audioPlayer.pause();
    }
}

// Send text message
document.getElementById('message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    const text = input.value;
    if (text.trim() !== '') {
        sendMessage();
        socket.emit('send_message', { text });
        input.value = '';
    }
});

const uploadStatus = document.getElementById('upload-status');
const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');
const progressText = document.getElementById('progress-text');

fileUploadButton.addEventListener('click', () => {
    fileInput.click(); // Открыть окно выбора файла
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        // Показать прогресс-бар с анимацией
        uploadStatus.classList.remove('hidden');
        uploadStatus.style.opacity = '1';
        uploadStatus.style.transform = 'translateY(0)';

        // Обновлять прогресс
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                progressFill.style.width = `${percentComplete}%`;
                progressPercent.textContent = `${percentComplete}%`;
                progressText.textContent = `${percentComplete}%`; // Текст внутри прогресс-бара
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.error) {
                    showToastNotification(response.error, 'error');
                } else {
                    showToastNotification('File uploaded successfully!', 'success');
                }
            } else {
                showToastNotification('Failed to upload the file.', 'error');
            }
            // Скрыть прогресс-бар с анимацией
            setTimeout(() => {
                uploadStatus.style.opacity = '0';
                uploadStatus.style.transform = 'translateY(-20px)';
                setTimeout(() => uploadStatus.classList.add('hidden'), 300);
            }, 1000);
            progressFill.style.width = '0%';
            progressPercent.textContent = '0%';
            progressText.textContent = '';
        };

        xhr.onerror = () => {
            showToastNotification('An error occurred during file upload.', 'error');
            uploadStatus.style.opacity = '0';
            uploadStatus.style.transform = 'translateY(-20px)';
            setTimeout(() => uploadStatus.classList.add('hidden'), 300);
        };

        xhr.send(formData);
    }
});


/*
// Logout functionality
document.getElementById('logout-button').addEventListener('click', () => {
    fetch('/logout')
        .then(() => {
            window.location.href = '/';
        })
        .catch((error) => console.error('Error during logout:', error));
});
*/

// Получить элемент message-input
const messageInput = document.getElementById('message-input');

// Функция для отключения messageInput
function disableMessageInput() {
    messageInput.disabled = true; // Отключает элемент
    messageInput.style.opacity = 0.5; // Для визуального эффекта
    messageInput.style.cursor = "not-allowed"; // Указывает, что элемент неактивен
}

// Функция для включения messageInput
function enableMessageInput() {
    messageInput.disabled = false; // Включает элемент
    messageInput.style.opacity = 1; // Возвращает нормальный вид
    messageInput.style.cursor = "text"; // Указывает, что можно вводить текст
}

// Пример вызова
disableMessageInput(); // Отключить
setTimeout(enableMessageInput, 0700); // Включить через 2 секунд


document.addEventListener("DOMContentLoaded", () => {

    const sessionUsername = sessionStorage.getItem('username'); // Получаем имя пользователя из sessionStorage

    // Проверяем, существует ли session 'username' и соответствует ли currentUser
    if (!sessionUsername || sessionUsername !== currentUser) {
        // Если нет сессии или пользователь не совпадает, перенаправляем на страницу логина
        window.location.href = '/login';
    } else {
        console.log(`Access granted for user: ${sessionUsername}`);
        // Продолжаем загрузку чата (можно добавить другие действия, если нужно)
    }

    /* Убедитесь, что экран блокировки скрыт при загрузке
    if (!isBlocked) {
        blockScreen.classList.add("hidden");
    }*/
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    const blockEndTime = localStorage.getItem("blockEndTime");

    if (blockEndTime) {
        const timeLeft = Math.floor((blockEndTime - Date.now()) / 1000);

        if (timeLeft > 0) {
            // Если блокировка еще активна, восстановить ее
            blockUser(currentUser,timeLeft);
        } else {
            // Если время блокировки истекло, удалить запись
            localStorage.removeItem("blockEndTime");
        }
    }
});

showToastNotification('<b>Welcome ' + currentUser + '</b> <span>Glad to see you back!</span>', 'success', 5000);

document.getElementById('sessionsButton').addEventListener('click', function() {
  // Делаем запрос на сервер для получения информации о сессиях
  fetch('/sessions')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json();
    })
    .then(data => {
      const sessionModal = document.getElementById('sessionsModal');
      const sessionsList = document.getElementById('sessionsList');

      // Очищаем список сессий перед добавлением новых
      sessionsList.innerHTML = '';

      if (data.sessions && data.sessions.length > 0) {
        data.sessions.forEach(session => {
          const listItem = document.createElement('li');
          listItem.classList.add('session-item');

          // Пример структуры для сессии (адаптируйте поля под ваши данные)
          // Здесь предполагается, что в объекте session есть:
          //   deviceType, os, location, lastSeen, ipAddress
          // Если их нет, замените/уберите нужные поля
          listItem.innerHTML = `
            <div class="session-row">
              <div class="session-icon">
                <i class="fa fa-desktop"></i> <!-- Можно менять иконку под тип устройства -->
              </div>
              <div class="session-info">
                <div class="session-title">
                  ${session.deviceType || 'Desktop app'} on ${session.os || 'Unknown OS'}
                </div>
                <div class="session-subtitle">
                  ${session.location || 'Unknown location'}${
                    session.ipAddress ? ` — ${session.ipAddress}` : ''
                  }
                </div>
                <div class="session-last-seen">
                  Last seen ${session.lastSeen || 'N/A'}
                </div>
              </div>
            </div>
          `;
          sessionsList.appendChild(listItem);
        });
      } else {
        // Если сессий нет, показываем сообщение
        const listItem = document.createElement('li');
        listItem.textContent = 'No active sessions found.';
        sessionsList.appendChild(listItem);
      }

      // Показываем модальное окно с сессиями
      sessionModal.style.display = 'flex';
    })
    .catch(error => {
      console.error('Error fetching sessions:', error);
    });
});


const coinDisplay = document.getElementById('coinDisplay');
const coinBalance = document.getElementById('coinBalance');
const coinIcon = document.getElementById('coinIcon');

function updateCoinBalance(newBalance) {
    const coinBalance = document.getElementById('coinBalance');
    const goingUpIcon = document.getElementById('goingUpIcon');

    if (!coinBalance) return;

    const currentBalance = parseInt(coinBalance.textContent, 10) || 0;

    if (newBalance > currentBalance) {
        goingUpIcon.style.display = 'inline-block';
    } else {
        goingUpIcon.style.display = 'none';
    }

    coinBalance.classList.add('updated');

    const duration = 3000; // Длительность анимации в мс
    const stepTime = 100; // Интервал обновления в мс
    const steps = duration / stepTime;
    const increment = (newBalance - currentBalance) / steps;

    let animatedBalance = currentBalance;
    let count = 0;

    const interval = setInterval(() => {
        animatedBalance += increment;
        count++;

        if (count >= steps) {
            clearInterval(interval);
            animatedBalance = newBalance;
            coinBalance.classList.remove('updated');
            goingUpIcon.style.display = 'none';
        }

        coinBalance.textContent = Math.round(animatedBalance);
    }, stepTime);
}


// Функция для показа контейнера с монетами
function showCoinDisplay() {
    if (coinDisplay) {
        coinDisplay.classList.add('show');
    }
}

// Запрашиваем баланс при загрузке страницы
socket.emit('get_balance', currentUser); // Пример имени пользователя

// Слушаем ответ от сервера
// В событии получения баланса
socket.on('balance', (data) => {
    console.log('Received balance:', data);
    if (data.success) {
        updateCoinBalance(data.coins);
        currentBalance = data.coins;
        showCoinDisplay();
    } else {
        console.error(data.message);
    }
});

socket.on('coins_added', (data) => {
    console.log('Coins added response:', data);

    // Проверяем, соответствует ли имя пользователя
    if (data.username === currentUser) {
        if (data.success) {
            updateCoinBalance(data.coins); // Обновляем баланс только для текущего пользователя
        } else {
            console.error('Failed to add coins:', data.message);
        }
    } else {
        console.log(`Balance update ignored for ${data.username}, not the current user.`);
    }
});

socket.on('bought_themes', (data) => {
    if (data.success) {
        const boughtThemes = data.themes;
        const themeItems = document.querySelectorAll('.theme-item');  // Все элементы с темами

        themeItems.forEach(item => {
            const themeName = item.getAttribute('data-theme');

            // Если тема уже куплена, показываем, что её можно применить без траты монет
            if (boughtThemes.includes(themeName)) {
                item.classList.add('purchased');
                item.textContent = `${themeName} (Purchased)`;
            }
        });
    } else {
        console.error('Error:', data.message);
    }
});

// Получаем элементы
const banStatusModal = document.getElementById('ban-status-modal');
const violationsCountElement = document.getElementById('violations-count');
const remainingTimeElement = document.getElementById('remaining-time');
const payBanButton = document.getElementById('pay-ban');
const closeBanModalButton = document.getElementById('close-ban-modal');

// Функция для открытия модального окна и отображения информации
function openBanStatusModal() {
    const countBlocks = parseInt(localStorage.getItem('countBlocks')) || 0;
    const remainingTime = countBlocks * 30;  // Например, 30 секунд на одно нарушение

    // Отображаем количество нарушений и оставшееся время
    violationsCountElement.textContent = countBlocks;
    remainingTimeElement.textContent = remainingTime;

    // Открываем модальное окно
    banStatusModal.classList.add('active');
}

// Закрытие модального окна
closeBanModalButton.addEventListener('click', () => {
    banStatusModal.classList.remove('active');
});

// Открываем модальное окно при клике на пункт "My Ban Status"
document.getElementById('my-ban-status-option').addEventListener('click', openBanStatusModal);

// Слушаем событие на успешное списание монет и обновление countBlocks
socket.on('ban_reduction_success', (data) => {
    if (data.success) {
        // Обновляем countBlocks в localStorage
        localStorage.setItem('countBlocks', data.new_count_blocks);

        // Обновляем UI
        violationsCountElement.textContent = data.new_count_blocks;
        remainingTimeElement.textContent = data.new_count_blocks * 30;

        showToastNotification(`Successfully reduced ban. New violation count: ${data.new_count_blocks}`);
    } else {
        alert('Failed to reduce ban.');
    }
});

// Слушаем событие на ошибку списания монет
socket.on('ban_reduction_failed', (data) => {
    if (!data.success) {
        showToastNotification(data.message || 'Error occurred while reducing ban.');
    }
});

// Слушаем клик по кнопке "Pay" для списания монет и уменьшения нарушений
payBanButton.addEventListener('click', () => {
    const User = currentUser; // Имя текущего пользователя
    const countBlocks = parseInt(localStorage.getItem('countBlocks')) || 0;

    if (countBlocks > 0) {
        // Отправляем событие на сервер для списания монет
        socket.emit('pay_for_ban_reduction', { username: User, countBlocks });

        // Закрываем модальное окно после отправки
        banStatusModal.classList.remove('active');
    } else {
        showToastNotification('No violations to pay for.', 'error');
    }
});

function updatePing() {
    const pingIcon = document.getElementById('ping-icon');
    const pingValue = document.getElementById('ping-value');

    const start = performance.now();

    fetch('/ping', { cache: 'no-store' })
        .then(() => {
            const latency = Math.round(performance.now() - start);

            pingValue.textContent = latency;

            if (latency < 100) {
                pingIcon.className = 'fas fa-signal';
                pingIcon.style.color = '#00ff88';
                pingIcon.style.filter = 'drop-shadow(0 0 8px rgba(0, 255, 136, 0.5))';
            } else if (latency < 200) {
                pingIcon.className = 'fas fa-tachometer-alt';
                pingIcon.style.color = '#ffd700';
                pingIcon.style.filter = 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))';
            } else {
                pingIcon.className = 'fas fa-exclamation-triangle';
                pingIcon.style.color = '#ff4d4d';
                pingIcon.style.filter = 'drop-shadow(0 0 8px rgba(255, 77, 77, 0.5))';
            }

            animatePingValue(pingValue);
        })
        .catch(() => {
            pingValue.textContent = 'Err';
            pingIcon.className = 'fas fa-times-circle';
            pingIcon.style.color = '#ff4d4d';
            pingIcon.style.filter = 'drop-shadow(0 0 8px rgba(255, 77, 77, 0.6))';
        });
}

function animatePingValue(element) {
    element.style.transform = 'scale(1.2)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 300);
}


// Обновляем пинг каждые 5 секунд
setInterval(updatePing, 30000);

// Обновляем сразу после загрузки страницы
updatePing();

socket.on('user_banned', (data) => {
    if (data.success) {
        if (data.username === currentUser) {
            window.location.href = '/';
        }
    }
});

async function checkBanStatus(username) {  // Передаем имя пользователя в функцию
    try {
        const response = await fetch('/api/check-ban-status', {
            method: 'POST',  // Указываем метод POST
            headers: {
                'Content-Type': 'application/json'  // Указываем тип контента
            },
            body: JSON.stringify({ username: username })  // Отправляем имя пользователя в теле запроса
        });

        if (!response.ok) {
            const errorData = await response.json();  // Получаем JSON с ошибкой с сервера
            throw new Error(`${response.status}: ${errorData.error}`);  // Генерируем ошибку с сообщением с сервера
        }

        const data = await response.json();
        return data.banned;  // Возвращаем true, если пользователь заблокирован, и false, если нет

    } catch (error) {
        console.error('Error checking ban status:', error);
        return false;  // Возвращаем false в случае ошибки
    }
}

// Пример использования:
const usernameToCheck = currentUser;  // Или любое другое имя пользователя
checkBanStatus(usernameToCheck)
    .then(isBanned => {
        if (isBanned) {
            console.log(`${usernameToCheck} is banned`);
            window.location.href = '/';  // Перенаправляем на главную страницу
        } else {
            // console.log(`${usernameToCheck} is not banned`);
            // Продолжаем работу
        }
    });


// Универсальная функция для обработки ошибок
function handleError(errorMessage) {
    const examContainer = document.getElementById('examQuestions');
    const examHeader = document.getElementById('examTitle');
    const finishExamButton = document.getElementById('finishExam');

    examHeader.style.display = 'none';
    finishExamButton.style.display = 'none';
    examContainer.innerHTML = `
        <div class="no-exams">
            <i class="fas fa-exclamation-circle"></i> ${errorMessage}
        </div>
    `;
}

// Делегирование события для обновления стилей при выборе радио
document.getElementById('examQuestions').addEventListener('change', function(event) {
    if (event.target && event.target.type === 'radio') {
        // Получаем имя текущего вопроса
        const questionName = event.target.name;

        // Находим все элементы label для этого вопроса
        const labels = document.querySelectorAll(`input[name="${questionName}"] + label`);

        // Убираем стили с предыдущего выбранного варианта
labels.forEach(label => {
    label.style.borderColor = 'rgb(100, 100, 100)';       // средне-тёмный серый
    label.style.backgroundColor = 'rgb(120, 120, 120)';   // тёмный серый фон
    label.style.color = 'rgb(230, 230, 230)';             // почти белый текст для контраста
});

        // Находим label, связанный с выбранным радио
        const selectedRadio = event.target;
        const selectedLabel = document.querySelector(`label[for="${selectedRadio.id}"]`);

        if (selectedLabel) {
            // Применяем стили только к выбранному варианту
            selectedLabel.style.borderColor = '#4CAF50';
            selectedLabel.style.backgroundColor = '#4CAF50';
            selectedLabel.style.color = 'white';
        }
    }
});

async function addCoins(username, coins) {
    try {
        const response = await fetch('/add_coins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, coins })
        });

        const data = await response.json();
        if (data.success) {
            console.log(`✅ ${username} получил(а) ${coins} монет. Новый баланс: ${data.coins}`);
        } else {
            console.error("Ошибка:", data.error);
        }
    } catch (error) {
        console.error("Ошибка запроса:", error);
    }
}

let violationCount = 0;
const maxViolations = 0;

function incrementViolation() {
    violationCount++;
    showInformModal(`Violation ${violationCount}/${maxViolations}`);
    if (violationCount >= maxViolations) {
        // Ban user for 3 minutes (180 seconds)
        blockUser(currentUser,180);
        // Reset the violation counter
        violationCount = 0;
    }
}

function showInformModal(text) {
  const modal = document.getElementById('informModal');
  const modalTitle = document.getElementById('informModalTitle');
  const modalText = document.getElementById('informModalText');

  // Принудительно добавляем фиксированный текст, затем то, что пришло в аргументе.
  // При желании используем перенос строки <br> или другое оформление:
  
  modalText.innerHTML = `Iltimos, qoidalarni buzmaslikka harakat qiling.<br>${text}`;

  modal.style.display = 'flex'; // Показываем модалку
}


// Закрытие модалки при клике на "OK"
document.getElementById('informModalOkBtn').addEventListener('click', () => {
  document.getElementById('informModal').style.display = 'none';
});


function handleVisibilityChange() {
    if (document.hidden) {
        incrementViolation();
    }
}

function onCopy(event) {
    event.preventDefault();
    incrementViolation();
}

function onPaste(event) {
    event.preventDefault();
    incrementViolation();
}

function onContextMenu(event) {
    event.preventDefault();
    incrementViolation();
}

// Function to initialize or disable the exam security system
function initExamSecurity(enable = true) {
    if (enable) {
        // Activate security: disable copy, paste, right-click and monitor visibility change
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('copy', onCopy);
        document.addEventListener('paste', onPaste);
    } else {
        // Remove restrictions
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('copy', onCopy);
        document.removeEventListener('paste', onPaste);
        document.removeEventListener('contextmenu', onContextMenu);
    }
}

document.getElementById('closeExamModal').addEventListener('click', function() {
    document.getElementById('examModal').style.display = 'none';
});


let rulesModalResolve = null;

function toggleRulesModal(action) {
  const rulesModal = document.getElementById('rulesModal');
  const modalContent = rulesModal.querySelector('.rules-modal-content');
  
  if (action === 'open') {
    // Открываем модалку и сбрасываем состояние
    rulesModal.classList.add('show');
    modalContent.classList.remove('closing');
    currentSlide = 0;
    showSlide(currentSlide);
    
    // Создаем промис, который будет разрешён при закрытии модалки
    return new Promise((resolve) => {
      rulesModalResolve = resolve;
      
      // Если в модалке есть кнопка закрытия (например, с классом .close-btn),
      // можно также повесить обработчик для закрытия:
      const closeBtn = rulesModal.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', async function onClose() {
          closeBtn.removeEventListener('click', onClose);
          // Закрываем модальное окно
          await toggleRulesModal('close');
          // Разрешаем внешний промис
          if (rulesModalResolve) {
            //rulesModalResolve();
            rulesModalResolve = null;
          }
        });
      }
    });
  } else if (action === 'close') {
    // Возвращаем промис, который разрешится после завершения анимации закрытия
    return new Promise((resolve) => {
      modalContent.classList.add('closing');
      modalContent.addEventListener('animationend', () => {
        rulesModal.classList.remove('show');
        modalContent.classList.remove('closing');
        resolve();
      }, { once: true });
    });
  }
}


// Массив идентификаторов контейнеров для Lottie-анимаций
const lottieIds = ['lottie1', 'lottie2', 'lottie3', 'lottie4'];
const lottieAnimations = {};

// Загружаем Lottie-анимацию для каждого контейнера
lottieIds.forEach(id => {
  const animationContainer = document.getElementById(id);
  // Устанавливаем размеры контейнера через JS (если нужно)
  animationContainer.style.width = '80px';
  animationContainer.style.height = '80px';

  lottieAnimations[id] = lottie.loadAnimation({
    container: animationContainer,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: '/static/animations/Rules.json'
  });
});


/*********************************************
 * СЛАЙДЕР ПРАВИЛ
 *********************************************/

// Находим все слайды
const slides = document.querySelectorAll('.rule-slide');
let currentSlide = 0;

// Точки (dots)
const dots = document.querySelectorAll('.dot');

// Для анимации круга: вычислим длину окружности (circumference)
const progressCircle = document.querySelector('.progress-ring__progress');
const radius = 30; // радиус круга (r="30" в SVG)
const circumference = 2 * Math.PI * radius;

// Установим длину штриха (stroke-dasharray) = длине окружности
progressCircle.style.strokeDasharray = `${circumference}`;
// Начальное смещение (полностью не заполнен)
progressCircle.style.strokeDashoffset = circumference;

// Пример, как можно анимировать "до места"
function showSlide(index) {
  // Скрываем все слайды, показываем нужный
  slides.forEach(slide => slide.classList.remove('active'));
  slides[index].classList.add('active');

  // Обновляем точки (dots)
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  // Вычисляем прогресс от 0 до 1
  const maxIndex = slides.length - 1;
  const progressPercent = index / maxIndex; // 0..1

  // strokeDashoffset = полная_длина - (прогресс * полная_длина)
  // (Это и есть «до места», соответствующего текущему index)
  const newOffset = circumference - progressPercent * circumference;

  // -- ВАЖНО: transition в CSS анимирует изменение от старого значения к новому --
  // Просто меняем strokeDashoffset, и всё анимируется автоматически
  progressCircle.style.strokeDashoffset = newOffset;

  // Меняем текст кнопки на "Continue exam" если это последний слайд
  const nextBtn = document.getElementById('nextRuleBtn');
  if (index === slides.length - 1) {
    nextBtn.innerHTML = `
      <div class="circular-progress">
        <svg class="progress-ring" width="70" height="70">
          <circle
            class="progress-ring__background"
            cx="35"
            cy="35"
            r="30"
          />
          <circle
            class="progress-ring__progress"
            cx="35"
            cy="35"
            r="30"
            style="stroke-dasharray:${circumference}; stroke-dashoffset:0;"
          />
        </svg>
        <span class="arrows"><i class="fas fa-arrow-right"></i></span>
      </div>
    `;
  } else {
    // Если не последний, возвращаем вид стрелки (учитывая текущий offset)
    nextBtn.innerHTML = `
      <div class="circular-progress">
        <svg class="progress-ring" width="70" height="70">
          <circle
            class="progress-ring__background"
            cx="35"
            cy="35"
            r="30"
          />
          <circle
            class="progress-ring__progress"
            cx="35"
            cy="35"
            r="30"
            style="stroke-dasharray:${circumference}; stroke-dashoffset:${newOffset};"
          />
        </svg>
        <span class="arrows"><i class="fas fa-arrow-right"></i></span>
      </div>
    `;
  }
}


/*********************************************
 * ОБРАБОТЧИКИ СОБЫТИЙ
 *********************************************/

// Крестик (закрыть окно)
document.getElementById('closeRulesModal').addEventListener('click', () => {
  toggleRulesModal('close');
});

document.getElementById('nextRuleBtn').addEventListener('click', async () => {
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    showSlide(currentSlide);
  } else {
    // Если последний слайд, закрываем модальное окно и, после завершения анимации, разрешаем внешний промис
    await toggleRulesModal('close');
    if (rulesModalResolve) {
      rulesModalResolve();
      rulesModalResolve = null;
    }
  }
});

function showModalStatus(text) {
  // Проверяем, существует ли уже модальное окно, иначе создаём его
  let modal = document.getElementById('statusModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'statusModal';
    modal.className = 'status-modal';
    // Внутренняя разметка модального окна
    modal.innerHTML = `
      <div class="status-modal-content">
        <!-- Контейнер для Lottie-анимации -->
        <div id="statusAnimation" class="lottie-animation"></div>
        
        <!-- Основной текст -->
        <p id="statusText" class="status-text"></p>
        
        <!-- Дополнительный подзаголовок / текст (если нужно) -->
        <p class="status-subtext">Success</p>
        
        <!-- Кнопка OK для закрытия модалки -->
        <button id="statusOkBtn" class="status-modal-btn">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  // Обновляем основной текст в модальном окне
  document.getElementById('statusText').textContent = text;
  
  // Загружаем Lottie-анимацию
  const animationContainer = document.getElementById('statusAnimation');
  // Очищаем предыдущую анимацию (если была)
  animationContainer.innerHTML = '';
  
  lottie.loadAnimation({
    container: animationContainer,
    renderer: 'svg',
    loop: false,       // проигрываем один раз
    autoplay: true,
    path: '/static/animations/success.json'
  });
  
  // Отображаем модальное окно
  modal.style.display = 'flex';
  
  // Обработчик для кнопки "Back to home" (OK) — закрываем окно
  const okBtn = document.getElementById('statusOkBtn');
  okBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

document.getElementById('examTaskOption').addEventListener('click', async function() {
    await toggleRulesModal('open');
    const examModal = document.getElementById('examModal');
    const examContainer = document.getElementById('examQuestions');
    const examHeader = document.getElementById('examTitle');
    const finishExamButton = document.getElementById('finishExam');
    const examTimer = document.getElementById('exam-timer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const loadingFinishExam = document.getElementById('loadingFinishExam');
    const wrapper = document.getElementById('progressExamLengthWrapper');
    const progressBar = document.getElementById('progressExamLength');
    const progressLabel = document.getElementById('progressExamLengthLabel');
    const checkAnswerModal = document.getElementById('checkAnswerModal');
    const approveCheckAnswerBtn = document.getElementById('approveCheckAnswer');
    const cancelCheckAnswerBtn = document.getElementById('cancelCheckAnswer');
    let questionToCheck = null;

    function showCheckAnswerModal(questionElement, correctAnswer) {
      questionToCheck = { element: questionElement, correct: correctAnswer };
      checkAnswerModal.style.display = 'flex';
    }

    approveCheckAnswerBtn.addEventListener('click', async function() {
      if (!questionToCheck) return;
      try {
        const transactionRes = await fetch('/api/add_transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser,
            amount: -100,
            description: 'Check single answer'
          })
        });
        const transactionData = await transactionRes.json();

        if (!transactionRes.ok || transactionData.error) {
          showToastNotification(transactionData.error || 'Not enough coins!');
        } else {
          checkSingleAnswer(questionToCheck.element, questionToCheck.correct);
        }
      } catch (err) {
        console.error(err);
        showToastNotification('Error while processing transaction.');
      } finally {
        checkAnswerModal.style.display = 'none';
      }
    });

    cancelCheckAnswerBtn.addEventListener('click', function() {
      checkAnswerModal.style.display = 'none';
    });

    function checkSingleAnswer(questionElement, correctAnswer) {
        let userAnswer = null;
        const radios = questionElement.querySelectorAll('input[type="radio"]');
        if (radios.length > 0) {
            const checkedRadio = [...radios].find(r => r.checked);
            userAnswer = checkedRadio ? checkedRadio.value : null;
        } else {
            const unscrambleInputs = questionElement.querySelectorAll('.unscramble-input');
            if (unscrambleInputs.length > 0) {
                const sortedInputs = Array.from(unscrambleInputs).sort((a, b) => 
                    parseInt(a.dataset.index) - parseInt(b.dataset.index)
                );
                userAnswer = sortedInputs
                    .map(input => input.textContent.trim())
                    .filter(char => char !== '')
                    .join('');
            } else {
                const blank = questionElement.querySelector(`.box-choose-blank[data-question-id="${questionElement.dataset.questionId}"]`);
                if (blank && blank.textContent.trim() && blank.textContent !== '____') {
                    userAnswer = blank.textContent.trim();
                } else {
                    const input = questionElement.querySelector('input[type="text"]');
                    if (input) {
                        userAnswer = input.value.trim();
                    }
                }
            }
        }

        if (!userAnswer || userAnswer.length === 0) {
            showToastNotification('<b>You did not select/enter an answer!</b> <span>Please try again before continuing.</span>', 'warning', 5000);
            return;
        }

        if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
            showModalStatus("Correct answer Good Job!");
            questionElement.style.backgroundColor = '#1b5e20';
        } else {
            showModalStatus(`Incorrect! Correct answer: ${correctAnswer}`);
            questionElement.style.backgroundColor = '#b71c1c';
        }
    }

    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    examHeader.style.display = 'none';
    finishExamButton.style.display = 'none';
    examTimer.style.display = 'none';
    loadingSpinner.style.display = 'block';
    wrapper.style.display = 'none';
    hideExamTitle();

    examModal.style.display = 'flex';
    examContainer.innerHTML = '';
    enableFinishButton();

    const url = `/get_exam_questions?username=${currentUser}`;

    try {
        const response = await fetch(url);
        const data = await (response.ok
            ? response.json()
            : response.json().then(err => { throw new Error(err.error || 'Unknown error'); }));

        if (data.error) {
            handleError(data.error);
            loadingSpinner.style.display = 'none';
            return;
        }

        loadingSpinner.style.display = 'none';
        examHeader.style.display = 'none';
        finishExamButton.style.display = 'block';
        examTimer.style.display = 'flex';
        wrapper.style.display = 'flex';
        initExamSecurity(true);

        const questionTemplate = document.getElementById('questionTemplate');
        let questionCounter = 0;
        const fragment = document.createDocumentFragment();

        function getInstructionForType(type) {
            switch (type) {
                case "true_false": return `<p><i class="fas fa-exclamation-circle"></i> Choose True or False.</p>`;
                case "multiple_choice": return `<p><i class="fas fa-check-circle"></i> Select the correct answer.</p>`;
                case "write-in-blank": return `<p><i class="fas fa-pencil-alt"></i> Write the missing word in the blank.</p>`;
                case "unscramble": return `<p><i class="fas fa-random"></i> Unscramble the letters or gaps.</p>`;
                case "reading": return `<p><i class="fas fa-book"></i> Read the text and answer the question.</p>`;
                case "listening": return `<p><i class="fas fa-headphones"></i> Listen to the audio and enter the missing word.</p>`;
                case "question": return `<p><i class="fas fa-question-circle"></i> Answer the question below.</p>`;
                case "picture": return `<p><i class="fas fa-image"></i> Look at the image and answer the following questions.</p>`;
                case "box-choose": return `<p><i class="fas fa-box"></i> Complete the questions with words/phrases from the box.</p>`;
                default: return "";
            }
        }

        function shuffleArray(array) {
            return array.slice().sort(() => Math.random() - 0.5);
        }

        let selectedOption = null;

        data.questions.forEach((question) => {
            const parentContainer = document.createElement('div');
            parentContainer.className = 'exam-parent-question';

            if (question.type === 'listening') {
                if (question.text) {
                    parentContainer.innerHTML = `<p class="parent-text">${question.text}</p>`;
                }
                parentContainer.innerHTML += `
                  <div class="custom-audio-player">
                    <button class="custom-play-btn"><i class="fas fa-play"></i></button>
                    <div class="custom-audio-waves" data-audio-src="${question.audio}"></div>
                    <span class="custom-time-display">0:00 / 0:00</span>
                  </div>
                `;
                if (question.subquestions && Array.isArray(question.subquestions)) {
                    const writeInBlankSubquestions = question.subquestions.filter(subq => subq.type === 'write-in-blank');
                    const otherSubquestions = question.subquestions.filter(subq => subq.type !== 'write-in-blank');

                    if (writeInBlankSubquestions.length > 0) {
                        questionCounter++;
                        const instruction = getInstructionForType('write-in-blank');
                        const questionNode = document.importNode(questionTemplate.content, true);
                        const examQuestionDiv = questionNode.querySelector('.exam-question');

                        questionNode.querySelector('.question-instruction').innerHTML = instruction;

                        let combinedText = '<div class="write-in-blank-questions">';
                        writeInBlankSubquestions.forEach((subq, index) => {
                            const textWithInput = subq.text.replace('____', `<input type="text" name="q${subq.id}" class="write-in-blank-input" autocomplete="off" spellcheck="false">`);
                            combinedText += `
                                <div class="write-in-blank-subquestion">
                                    <span class="subquestion-number">${subq.id}:</span>
                                    <span class="subquestion-text">${textWithInput}</span>
                                </div>
                            `;
                        });
                        combinedText += '</div>';

                        questionNode.querySelector('.question-text').innerHTML = combinedText;

                        let optionsContainer = questionNode.querySelector('.question-options');
                        optionsContainer.innerHTML = '';

                        // Removed check answer button for write-in-blank subquestions
                        // No check button added here

                        examQuestionDiv.dataset.questionId = writeInBlankSubquestions[0].id;
                        parentContainer.appendChild(questionNode);
                    }

                    otherSubquestions.forEach((subq) => {
                        questionCounter++;
                        const instruction = getInstructionForType(subq.type);
                        const questionNode = document.importNode(questionTemplate.content, true);
                        const examQuestionDiv = questionNode.querySelector('.exam-question');

                        if (subq.type === 'write-in-blank') {
                            const textWithInput = subq.text.replace('____', `<input type="text" name="q${subq.id}" class="write-in-blank-input" autocomplete="off" spellcheck="false">`);
                            questionNode.querySelector('.question-text').innerHTML = `${subq.id}: ${textWithInput}`;
                        } else {
                            questionNode.querySelector('.question-text').innerHTML = `${subq.id}: ${subq.text}`;
                        }
                        questionNode.querySelector('.question-instruction').innerHTML = instruction;

                        let optionsContainer = questionNode.querySelector('.question-options');
                        if (subq.type === 'true_false') {
                            optionsContainer.innerHTML = `
                                <input type="radio" name="q${subq.id}" value="True" id="true${subq.id}">
                                <label for="true${subq.id}">True</label>
                                <input type="radio" name="q${subq.id}" value="False" id="false${subq.id}">
                                <label for="false${subq.id}">False</label>
                            `;
                        } else if (subq.type === 'multiple_choice' && Array.isArray(subq.options)) {
                            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                            let html = '';
                            const shuffledOptions = shuffleArray(subq.options);
                            shuffledOptions.forEach((option, index) => {
                                const letter = letters[index] || '?';
                                const optionId = `${letter.replace(/\s+/g, '')}${subq.id}`;
                                html += `
                                  <div class="option-group">
                                    <input type="radio" name="q${subq.id}" value="${option}" id="${optionId}">
                                    <label for="${optionId}">
                                      <span class="option-letter">${letter}</span>
                                      <span class="option-text">${option}</span>
                                    </label>
                                  </div>
                                `;
                            });
                            optionsContainer.innerHTML = html;
                        } else if (subq.type !== 'write-in-blank') {
                            optionsContainer.innerHTML = `<input type="text" name="q${subq.id}" autocomplete="off" spellcheck="false">`;
                        } else {
                            optionsContainer.innerHTML = '';
                        }

                        if (subq.correct) {
                            const checkBtn = document.createElement('button');
                            checkBtn.className = 'check-answer-btn';
                            checkBtn.textContent = 'Check my answer';
                            checkBtn.addEventListener('click', () => {
                                showCheckAnswerModal(examQuestionDiv, subq.correct);
                            });
                            optionsContainer.appendChild(checkBtn);
                        }

                        examQuestionDiv.dataset.questionId = subq.id;
                        parentContainer.appendChild(questionNode);
                    });
                }
            } else if (question.type === 'picture') {
                if (question.text) {
                    parentContainer.innerHTML = `<p class="parent-text">${question.text}</p>`;
                }
                if (Array.isArray(question.images) && question.images.length > 0) {
                    const imagesContainer = document.createElement('div');
                    imagesContainer.className = 'exam-images-grid';
                    question.images.forEach(imgSrc => {
                        const imgElem = document.createElement('img');
                        imgElem.src = imgSrc;
                        imgElem.alt = 'Exam image';
                        imgElem.className = 'exam-question-image';
                        imagesContainer.appendChild(imgElem);
                    });
                    parentContainer.appendChild(imagesContainer);
                } else if (question.image) {
                    parentContainer.innerHTML += `<img src="${question.image}" alt="Exam image" class="exam-question-image" style="max-width:100%; height:auto; margin-bottom: 10px;">`;
                }

                if (question.subquestions && Array.isArray(question.subquestions)) {
                    const writeInBlankSubquestions = question.subquestions.filter(subq => subq.type === 'write-in-blank');
                    const otherSubquestions = question.subquestions.filter(subq => subq.type !== 'write-in-blank');

                    if (writeInBlankSubquestions.length > 0) {
                        questionCounter++;
                        const instruction = getInstructionForType('write-in-blank');
                        const questionNode = document.importNode(questionTemplate.content, true);
                        const examQuestionDiv = questionNode.querySelector('.exam-question');

                        questionNode.querySelector('.question-instruction').innerHTML = instruction;

                        let combinedText = '<div class="write-in-blank-questions">';
                        writeInBlankSubquestions.forEach((subq, index) => {
                            const textWithInput = subq.text.replace('____', `<input type="text" name="q${subq.id}" class="write-in-blank-input" autocomplete="off" spellcheck="false">`);
                            combinedText += `
                                <div class="write-in-blank-subquestion">
                                    <span class="subquestion-number">${subq.id}:</span>
                                    <span class="subquestion-text">${textWithInput}</span>
                                </div>
                            `;
                        });
                        combinedText += '</div>';

                        questionNode.querySelector('.question-text').innerHTML = combinedText;

                        let optionsContainer = questionNode.querySelector('.question-options');
                        optionsContainer.innerHTML = '';

                        // Removed check answer button for write-in-blank subquestions
                        // No check button added here

                        examQuestionDiv.dataset.questionId = writeInBlankSubquestions[0].id;
                        parentContainer.appendChild(questionNode);
                    }

                    otherSubquestions.forEach((subq) => {
                        questionCounter++;
                        const instruction = getInstructionForType(subq.type);
                        const questionNode = document.importNode(questionTemplate.content, true);
                        const examQuestionDiv = questionNode.querySelector('.exam-question');

                        if (subq.type === 'write-in-blank') {
                            const textWithInput = subq.text.replace('____', `<input type="text" name="q${subq.id}" class="write-in-blank-input" autocomplete="off" spellcheck="false">`);
                            questionNode.querySelector('.question-text').innerHTML = `${subq.id}: ${textWithInput}`;
                        } else {
                            questionNode.querySelector('.question-text').innerHTML = `${subq.id}: ${subq.text}`;
                        }
                        questionNode.querySelector('.question-instruction').innerHTML = instruction;

                        let optionsContainer = questionNode.querySelector('.question-options');
                        if (subq.type === 'true_false') {
                            optionsContainer.innerHTML = `
                                <input type="radio" name="q${subq.id}" value="True" id="true${subq.id}">
                                <label for="true${subq.id}">True</label>
                                <input type="radio" name="q${subq.id}" value="False" id="false${subq.id}">
                                <label for="false${subq.id}">False</label>
                            `;
                        } else if (subq.type === 'multiple_choice' && Array.isArray(subq.options)) {
                            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                            let html = '';
                            const shuffledOptions = shuffleArray(subq.options);
                            shuffledOptions.forEach((option, index) => {
                                const letter = letters[index] || '?';
                                const optionId = `${letter.replace(/\s+/g, '')}${subq.id}`;
                                html += `
                                  <div class="option-group">
                                    <input type="radio" name="q${subq.id}" value="${option}" id="${optionId}">
                                    <label for="${optionId}">
                                      <span class="option-letter">${letter}</span>
                                      <span class="option-text">${option}</span>
                                    </label>
                                  </div>
                                `;
                            });
                            optionsContainer.innerHTML = html;
                        } else if (subq.type !== 'write-in-blank') {
                            optionsContainer.innerHTML = `<input type="text" name="q${subq.id}" autocomplete="off" spellcheck="false">`;
                        } else {
                            optionsContainer.innerHTML = '';
                        }

                        if (subq.correct) {
                            const checkBtn = document.createElement('button');
                            checkBtn.className = 'check-answer-btn';
                            checkBtn.textContent = 'Check my answer';
                            checkBtn.addEventListener('click', () => {
                                showCheckAnswerModal(examQuestionDiv, subq.correct);
                            });
                            optionsContainer.appendChild(checkBtn);
                        }

                        examQuestionDiv.dataset.questionId = subq.id;
                        parentContainer.appendChild(questionNode);
                    });
                }
            } else if (question.subquestions && Array.isArray(question.subquestions)) {
                if (question.text) {
                    parentContainer.innerHTML = `<p class="parent-text">${question.text}</p>`;
                }

                if (question.type === 'box-choose' && Array.isArray(question.options)) {
                    let optionsHtml = '<div class="box-choose-options">';
                    question.options.forEach((option, index) => {
                        optionsHtml += `<span class="box-choose-option" data-value="${option}" data-index="${index}">${option}</span>`;
                    });
                    optionsHtml += '</div>';
                    parentContainer.insertAdjacentHTML('beforeend', optionsHtml);
                }

                const subquestionNodes = [];

                if (question.type === 'box-choose') {
                    const instruction = getInstructionForType(question.type);
                    const questionNode = document.importNode(questionTemplate.content, true);
                    const examQuestionDiv = questionNode.querySelector('.exam-question');

                    questionNode.querySelector('.question-instruction').innerHTML = instruction;

                    let combinedText = '<div class="box-choose-questions">';
                    question.subquestions.forEach((subq, index) => {
                        questionCounter++;
                        const questionNumber = index + 1;
                        const textWithBlank = subq.text.replace('____', `<span class="box-choose-blank" data-question-id="${subq.id}">____</span>`);
                        combinedText += `
                            <div class="box-choose-subquestion">
                                <span class="subquestion-number">${questionNumber}.</span>
                                <span class="subquestion-text">${textWithBlank}</span>
                            </div>
                        `;
                        subquestionNodes.push({ examQuestionDiv, subqId: subq.id });
                    });
                    combinedText += '</div>';

                    questionNode.querySelector('.question-text').innerHTML = combinedText;

                    let optionsContainer = questionNode.querySelector('.question-options');
                    optionsContainer.innerHTML = '';

                    question.subquestions.forEach((subq) => {
                        if (subq.correct && subq.type !== 'box-choose' && subq.type !== 'write-in-blank') {
                            const checkBtn = document.createElement('button');
                            checkBtn.className = 'check-answer-btn';
                            checkBtn.textContent = `Check answer ${subq.id}`;
                            checkBtn.addEventListener('click', () => {
                                const tempDiv = examQuestionDiv.cloneNode(true);
                                tempDiv.dataset.questionId = subq.id;
                                showCheckAnswerModal(tempDiv, subq.correct);
                            });
                            optionsContainer.appendChild(checkBtn);
                        }
                    });

                    examQuestionDiv.dataset.questionId = question.subquestions[0].id;
                    parentContainer.appendChild(questionNode);
                } else {
                    const writeInBlankSubquestions = question.subquestions.filter(subq => subq.type === 'write-in-blank');
                    const otherSubquestions = question.subquestions.filter(subq => subq.type !== 'write-in-blank');

                    if (writeInBlankSubquestions.length > 0) {
                        questionCounter++;
                        const instruction = getInstructionForType('write-in-blank');
                        const questionNode = document.importNode(questionTemplate.content, true);
                        const examQuestionDiv = questionNode.querySelector('.exam-question');

                        questionNode.querySelector('.question-instruction').innerHTML = instruction;

                        let combinedText = '<div class="write-in-blank-questions">';
                        writeInBlankSubquestions.forEach((subq, index) => {
                            const textWithInput = subq.text.replace('____', `<input type="text" name="q${subq.id}" class="write-in-blank-input" autocomplete="off" spellcheck="false">`);
                            combinedText += `
                                <div class="write-in-blank-subquestion">
                                    <span class="subquestion-number">${subq.id}:</span>
                                    <span class="subquestion-text">${textWithInput}</span>
                                </div>
                            `;
                        });
                        combinedText += '</div>';

                        questionNode.querySelector('.question-text').innerHTML = combinedText;

                        let optionsContainer = questionNode.querySelector('.question-options');
                        optionsContainer.innerHTML = '';

                        // Removed check answer button for write-in-blank subquestions
                        // No check button added here

                        examQuestionDiv.dataset.questionId = writeInBlankSubquestions[0].id;
                        parentContainer.appendChild(questionNode);
                    }

                    otherSubquestions.forEach((subq) => {
                        questionCounter++;
                        const instruction = getInstructionForType(subq.type);
                        const questionNode = document.importNode(questionTemplate.content, true);
                        const examQuestionDiv = questionNode.querySelector('.exam-question');

                        if (subq.type !== 'unscramble') {
                            questionNode.querySelector('.question-text').innerHTML = `${subq.id}: ${subq.text}`;
                        } else {
                            questionNode.querySelector('.question-text').innerHTML = `${subq.id}:`;
                        }
                        questionNode.querySelector('.question-instruction').innerHTML = instruction;

                        let optionsContainer = questionNode.querySelector('.question-options');
                        if (subq.type === 'true_false') {
                            optionsContainer.innerHTML = `
                                <input type="radio" name="q${subq.id}" value="True" id="true${subq.id}">
                                <label for="true${subq.id}">True</label>
                                <input type="radio" name="q${subq.id}" value="False" id="false${subq.id}">
                                <label for="false${subq.id}">False</label>
                            `;
                        } else if (subq.type === 'multiple_choice' && Array.isArray(subq.options)) {
                            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                            let html = '';
                            const shuffledOptions = shuffleArray(subq.options);
                            shuffledOptions.forEach((option, index) => {
                                const letter = letters[index] || '?';
                                const optionId = `${letter.replace(/\s+/g, '')}${subq.id}`;
                                html += `
                                  <div class="option-group">
                                    <input type="radio" name="q${subq.id}" value="${option}" id="${optionId}">
                                    <label for="${optionId}">
                                      <span class="option-letter">${letter}</span>
                                      <span class="option-text">${option}</span>
                                    </label>
                                  </div>
                                `;
                            });
                            optionsContainer.innerHTML = html;
                        } else if (subq.type === 'unscramble') {
                            const letters = subq.text.split(' ').filter(letter => letter !== '');
                            const shuffledLetters = shuffleArray([...letters]);
                            let lettersHtml = '<div class="unscramble-letters">';
                            shuffledLetters.forEach((letter, index) => {
                                lettersHtml += `<span class="unscramble-letter" data-letter="${letter}" data-index="${index}">${letter}</span>`;
                            });
                            lettersHtml += '</div>';

                            let inputsHtml = '<div class="unscramble-inputs">';
                            letters.forEach((_, index) => {
                                inputsHtml += `<span class="unscramble-input" data-index="${index}"></span>`;
                            });
                            inputsHtml += '</div>';

                            optionsContainer.innerHTML = lettersHtml + inputsHtml;

                            const letterElements = optionsContainer.querySelectorAll('.unscramble-letter');
                            const inputElements = optionsContainer.querySelectorAll('.unscramble-input');

                            letterElements.forEach(letterEl => {
                                letterEl.addEventListener('click', () => {
                                    if (letterEl.classList.contains('used')) return;
                                    const emptyInput = Array.from(inputElements).find(input => !input.textContent);
                                    if (emptyInput) {
                                        emptyInput.textContent = letterEl.dataset.letter;
                                        emptyInput.classList.add('filled');
                                        letterEl.classList.add('used');
                                        emptyInput.dataset.letterIndex = letterEl.dataset.index;
                                    }
                                });
                            });

                            inputElements.forEach(inputEl => {
                                inputEl.removeEventListener('click', handleInputClick);
                                inputEl.addEventListener('click', handleInputClick);
                            });

                            function handleInputClick() {
                                const inputEl = this;
                                if (!inputEl.classList.contains('filled')) return;
                                const letterIndex = inputEl.dataset.letterIndex;
                                const letterEl = optionsContainer.querySelector(`.unscramble-letter[data-index="${letterIndex}"]`);
                                if (letterEl) {
                                    letterEl.classList.remove('used');
                                }
                                inputEl.textContent = '';
                                inputEl.classList.remove('filled');
                                delete inputEl.dataset.letterIndex;
                            }
                        } else {
                            optionsContainer.innerHTML = `<input type="text" name="q${subq.id}" autocomplete="off" spellcheck="false">`;
                        }

                        if (subq.correct) {
                            const checkBtn = document.createElement('button');
                            checkBtn.className = 'check-answer-btn';
                            checkBtn.textContent = 'Check my answer';
                            checkBtn.addEventListener('click', () => {
                                showCheckAnswerModal(examQuestionDiv, subq.correct);
                            });
                            optionsContainer.appendChild(checkBtn);
                        }

                        examQuestionDiv.dataset.questionId = subq.id;
                        parentContainer.appendChild(questionNode);
                        subquestionNodes.push({ examQuestionDiv, subqId: subq.id });
                    });
                }

                if (question.type === 'box-choose') {
                    const optionElements = parentContainer.querySelectorAll('.box-choose-option');
                    const blankElements = parentContainer.querySelectorAll('.box-choose-blank');

                    optionElements.forEach(optionEl => {
                        optionEl.addEventListener('click', () => {
                            if (optionEl.classList.contains('used')) return;
                            optionElements.forEach(el => el.classList.remove('selected'));
                            optionEl.classList.add('selected');
                            selectedOption = optionEl;
                        });
                    });

                    blankElements.forEach(blankEl => {
                        blankEl.addEventListener('click', () => {
                            if (blankEl.textContent !== '____' && blankEl.dataset.optionIndex) {
                                const optionIndex = blankEl.dataset.optionIndex;
                                const optionEl = parentContainer.querySelector(`.box-choose-option[data-index="${optionIndex}"]`);
                                if (optionEl) {
                                    optionEl.classList.remove('used');
                                    optionEl.classList.remove('selected');
                                }
                                blankEl.textContent = '____';
                                delete blankEl.dataset.optionIndex;
                                selectedOption = null;
                                return;
                            }

                            if (!selectedOption) {
                                showToastNotification('<b>Please select an option first!</b>', 'warning', 5000);
                                return;
                            }

                            blankEl.textContent = selectedOption.dataset.value;
                            blankEl.dataset.optionIndex = selectedOption.dataset.index;
                            selectedOption.classList.add('used');
                            selectedOption.classList.remove('selected');
                            selectedOption = null;
                        });
                    });
                }
            } else {
                questionCounter++;
                const instruction = getInstructionForType(question.type);
                const questionNode = document.importNode(questionTemplate.content, true);
                const examQuestionDiv = questionNode.querySelector('.exam-question');
                const qId = question.id ? question.id : questionCounter;

                if (question.type !== 'unscramble' && question.type !== 'write-in-blank') {
                    if (question.type === 'box-choose') {
                        const textWithBlank = question.text.replace('____', `<span class="box-choose-blank" data-question-id="${qId}">____</span>`);
                        questionNode.querySelector('.question-text').innerHTML = `${qId}. ${textWithBlank}`;
                    } else {
                        questionNode.querySelector('.question-text').innerHTML = `${qId}. ${question.text}`;
                    }
                } else if (question.type === 'write-in-blank') {
                    const textWithInput = question.text.replace('____', `<input type="text" name="q${qId}" class="write-in-blank-input" autocomplete="off" spellcheck="false">`);
                    questionNode.querySelector('.question-text').innerHTML = `${qId}. ${textWithInput}`;
                } else {
                    questionNode.querySelector('.question-text').innerHTML = `${qId}.`;
                }
                questionNode.querySelector('.question-instruction').innerHTML = instruction;

                let optionsContainer = questionNode.querySelector('.question-options');
                if (question.type === 'true_false') {
                    optionsContainer.innerHTML = `
                        <input type="radio" name="q${qId}" value="True" id="true${qId}">
                        <label for="true${qId}">True</label>
                        <input type="radio" name="q${qId}" value="False" id="false${qId}">
                        <label for="false${qId}">False</label>
                    `;
                } else if (question.type === 'multiple_choice' && Array.isArray(question.options)) {
                    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                    let html = '';
                    const shuffledOptions = shuffleArray(question.options);
                    shuffledOptions.forEach((option, index) => {
                        const letter = letters[index] || '?';
                        const optionId = `${letter.replace(/\s+/g, '')}${qId}`;
                        html += `
                            <div class="option-group">
                              <input type="radio" name="q${qId}" value="${option}" id="${optionId}">
                              <label for="${optionId}">
                                <span class="option-letter">${letter}</span>
                                <span class="option-text">${option}</span>
                              </label>
                            </div>
                        `;
                    });
                    optionsContainer.innerHTML = html;
                } else if (question.type === 'unscramble') {
                    const letters = question.text.split(' ').filter(letter => letter !== '');
                    const shuffledLetters = shuffleArray([...letters]);
                    let lettersHtml = '<div class="unscramble-letters">';
                    shuffledLetters.forEach((letter, index) => {
                        lettersHtml += `<span class="unscramble-letter" data-letter="${letter}" data-index="${index}">${letter}</span>`;
                    });
                    lettersHtml += '</div>';

                    let inputsHtml = '<div class="unscramble-inputs">';
                    letters.forEach((_, index) => {
                        inputsHtml += `<span class="unscramble-input" data-index="${index}"></span>`;
                    });
                    inputsHtml += '</div>';

                    optionsContainer.innerHTML = lettersHtml + inputsHtml;

                    const letterElements = optionsContainer.querySelectorAll('.unscramble-letter');
                    const inputElements = questionNode.querySelectorAll('.unscramble-input');

                    letterElements.forEach(letterEl => {
                        letterEl.addEventListener('click', () => {
                            if (letterEl.classList.contains('used')) return;
                            const emptyInput = Array.from(inputElements).find(input => !input.textContent);
                            if (emptyInput) {
                                emptyInput.textContent = letterEl.dataset.letter;
                                emptyInput.classList.add('filled');
                                letterEl.classList.add('used');
                                emptyInput.dataset.letterIndex = letterEl.dataset.index;
                            }
                        });
                    });

                    inputElements.forEach(inputEl => {
                        inputEl.removeEventListener('click', handleInputClick);
                        inputEl.addEventListener('click', handleInputClick);
                    });

                    function handleInputClick() {
                        const inputEl = this;
                        if (!inputEl.classList.contains('filled')) return;
                        const letterIndex = inputEl.dataset.letterIndex;
                        const letterEl = optionsContainer.querySelector(`.unscramble-letter[data-index="${letterIndex}"]`);
                        if (letterEl) {
                            letterEl.classList.remove('used');
                        }
                        inputEl.textContent = '';
                        inputEl.classList.remove('filled');
                        delete inputEl.dataset.letterIndex;
                    }
                } else if (question.type === 'box-choose' && Array.isArray(question.options)) {
                    let optionsHtml = '<div class="box-choose-options">';
                    question.options.forEach((option, index) => {
                        optionsHtml += `<span class="box-choose-option" data-value="${option}" data-index="${index}">${option}</span>`;
                    });
                    optionsHtml += '</div>';
                    optionsContainer.innerHTML = '';

                    const blank = questionNode.querySelector('.box-choose-blank');
                    const optionElements = parentContainer.querySelectorAll('.box-choose-option');

                    optionElements.forEach(optionEl => {
                        optionEl.addEventListener('click', () => {
                            if (optionEl.classList.contains('used')) return;
                            optionElements.forEach(el => el.classList.remove('selected'));
                            optionEl.classList.add('selected');
                            selectedOption = optionEl;
                            showToastNotification('<b>Option selected! Now click the blank to insert it.</b>', 'info', 5000);
                        });
                    });

                    blank.addEventListener('click', () => {
                        if (blank.textContent !== '____' && blank.dataset.optionIndex) {
                            const optionIndex = blank.dataset.optionIndex;
                            const optionEl = optionsContainer.querySelector(`.box-choose-option[data-index="${optionIndex}"]`);
                            if (optionEl) {
                                optionEl.className = 'box-choose-option';
                            }
                            blank.textContent = '____';
                            delete blank.dataset.optionIndex;
                            selectedOption = null;
                            return;
                        }

                        if (!selectedOption) {
                            showToastNotification('<b>Please select an option first!</b>', 'warning', 5000);
                            return;
                        }

                        blank.textContent = selectedOption.dataset.value;
                        blank.dataset.optionIndex = selectedOption.dataset.index;
                        selectedOption.classList.add('used');
                        selectedOption.classList.remove('selected');
                        selectedOption = null;
                    });
                } else if (question.type !== 'write-in-blank') {
                    optionsContainer.innerHTML = `<input type="text" name="q${qId}" autocomplete="off" spellcheck="false">`;
                } else {
                    optionsContainer.innerHTML = '';
                }

                if (question.correct && question.type !== 'write-in-blank') {
                    const checkBtn = document.createElement('button');
                    checkBtn.className = 'check-answer-btn';
                    checkBtn.textContent = 'Check my answer';
                    checkBtn.addEventListener('click', () => {
                        showCheckAnswerModal(examQuestionDiv, question.correct);
                    });
                    optionsContainer.appendChild(checkBtn);
                }

                examQuestionDiv.dataset.questionId = qId;
                parentContainer.appendChild(questionNode);
            }
            fragment.appendChild(parentContainer);
        });

        examContainer.appendChild(fragment);

        const timeResponse = await fetch('/get_remaining_time');
        const timeData = await (timeResponse.ok
            ? timeResponse.json()
            : timeResponse.json().then(err => { throw new Error(err.error || 'Unknown error'); }));

        if (timeData.remaining_time) {
            let remainingTime = timeData.remaining_time * 1000;

            function updateTimer() {
                if (remainingTime <= 0) {
                    finishExam();
                    return;
                }

                const totalSeconds = Math.floor(remainingTime / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                animateNumber(hoursEl, hours);
                animateNumber(minutesEl, minutes);
                animateNumber(secondsEl, seconds);

                if (remainingTime <= 60000) {
                    examTimer.classList.add('warning-red');
                    examTimer.classList.remove('warning-yellow');
                    changeTextColor('#FF0000');
                } else if (remainingTime <= 300000) {
                    examTimer.classList.add('warning-yellow');
                    examTimer.classList.remove('warning-red');
                    changeTextColor('black');
                } else {
                    examTimer.classList.remove('warning-yellow', 'warning-red');
                    changeTextColor('#007AFF');
                }

                remainingTime -= 1000;
            }

            function animateNumber(element, newValue) {
                const currentValue = parseInt(element.textContent, 10);
                if (currentValue !== newValue) {
                    const oldValue = element.textContent;
                    element.textContent = newValue;
                    element.classList.remove('animate');
                    void element.offsetWidth;
                    element.classList.add('animate');
                    createOldValueAnimation(element, oldValue);
                }
            }

            function createOldValueAnimation(element, oldValue) {
                const oldValueElement = document.createElement('span');
                oldValueElement.textContent = oldValue;
                oldValueElement.classList.add('old-value');
                element.appendChild(oldValueElement);

                setTimeout(() => {
                    oldValueElement.remove();
                }, 500);
            }

            function changeTextColor(color) {
                const timerNumbers = document.querySelectorAll('.timer-number');
                timerNumbers.forEach((num) => {
                    num.style.color = color;
                });
            }

            const timerInterval = setInterval(updateTimer, 1000);

            function finishExam() {
                loadingFinishExam.style.display = 'flex';
                clearInterval(timerInterval);
                showToastNotification('<b>Time is up! The exam will be automatically submitted.</b> <span>Please make sure you have reviewed all your answers.</span>', 'warning', 5000);
                finishExamButton.click();
            }

            finishExamButton.addEventListener('click', function handleFinishClick() {
                if (remainingTime > 0) {
                    loadingFinishExam.style.display = 'flex';
                    showSubmitConfirmation();
                } else {
                    clearInterval(timerInterval);
                    submitExamResults();
                }
            });

            function showSubmitConfirmation() {
                const existingModal = document.querySelector('.leaderboard-modal');
                if (existingModal) {
                    existingModal.remove();
                }
                const modal = document.createElement('div');
                modal.className = 'leaderboard-modal';
                modal.innerHTML = `
                  <div class="leaderboard-content">
                    <h2><i class="fas fa-exclamation-triangle"></i> Confirm Submission</h2>
                    <p>You are about to submit your exam. This action cannot be undone. Please review your answers.</p>
                    <button class="submit-button confirm-submit">
                      <span class="text-skeleton" data-text="Submit Exam">Submit Exam</span>
                    </button>
                    <button class="cancel-button cancel-submit">Cancel</button>
                  </div>
                `;
                document.body.appendChild(modal);

                modal.querySelector('.confirm-submit').addEventListener('click', function() {
                    clearInterval(timerInterval);
                    submitExamResults();
                    loadingFinishExam.style.display = 'flex';
                    modal.remove();
                });
                modal.querySelector('.cancel-submit').addEventListener('click', function() {
                    loadingFinishExam.style.display = 'none';
                    modal.remove();
                });
            }
        }

        let scrollTimeout;
        examContainer.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const totalScrollHeight = examContainer.scrollHeight - examContainer.clientHeight;
                const currentScrollTop = examContainer.scrollTop;
                let percentage = totalScrollHeight > 0 ? (currentScrollTop / totalScrollHeight) * 100 : 0;
                progressBar.style.width = percentage + '%';
                progressLabel.textContent = Math.round(percentage) + '%';
            }, 100);
        });

        initAllWavePlayers();

    } catch (error) {
        initExamSecurity(0);
        console.error('Error:', error.message);
        handleError(error.message);
        loadingSpinner.style.display = 'none';
    }
});

// Функция открытия модального окна
function openMyExamResultsModal(userData) {
    buildExamResultsUI(userData); // формируем UI с данными
    const modal = document.getElementById('myExamResultsModal');
    modal.style.display = 'flex'; // показываем модальное окно
}

// Функция закрытия модального окна по клику на крестик
document.getElementById('closeMyExamResultsModal').addEventListener('click', function() {
    stopAllAudio();
    document.getElementById('myExamResultsModal').style.display = 'none';
});

document.getElementById('myExamResultsOption').addEventListener('click', async function() {
    try {
        // Запрос времени экзамена
        const timeResponse = await fetch('/api/get_exam_times');
        if (!timeResponse.ok) throw new Error("Failed to fetch exam times");

        const { current_time, exam_start_time, exam_end_time } = await timeResponse.json();

        // Если экзамен ещё идёт, показываем заглушку
        if (current_time >= exam_start_time && current_time <= exam_end_time) {
            showExamSkeletonLoading();
            return;
        }

        // Если экзамен завершён, загружаем результаты
        const response = await fetch('/api/get_exam_results');
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Error fetching exam results");
        }
        const allResults = await response.json();

        const userData = allResults[currentUser];
        if (!userData) {
            throw new Error(`No results found for user ${currentUser}`);
        }

        openMyExamResultsModal(userData);
    } catch (error) {
        console.error("Failed to fetch exam results:", error.message);
        //showToastNotification("Failed to load exam results " + error.message,'error');
        showToastNotification('<b>Failed to load exam results</b> <span>' + error.message + '</span>', 'error', 5000);
    }
});

function showExamSkeletonLoading() {
    const modal = document.getElementById('myExamResultsModal');
    const musicPlayer = new Audio('/static/music/onmyway.mp3');
    musicPlayer.loop = true;
    musicPlayer.volume = 1;

    // Проверяем наличие сохраненного времени
    let savedTime = localStorage.getItem('musicTime');
    if (savedTime && !isNaN(savedTime)) {
        savedTime = parseFloat(savedTime);
        musicPlayer.addEventListener('loadedmetadata', () => {
            if (savedTime < musicPlayer.duration) {
                musicPlayer.currentTime = savedTime;
            }
        });
    }

    // Попытка воспроизведения при взаимодействии пользователя
    function tryPlay() {
        musicPlayer.play().catch(err => console.log('Ошибка воспроизведения:', err));
        document.removeEventListener('click', tryPlay);
    }

    tryPlay();

    // Сохраняем текущую позицию каждые 2 секунды
    setInterval(() => {
        if (!isNaN(musicPlayer.currentTime)) {
            localStorage.setItem('musicTime', musicPlayer.currentTime);
        }
    }, 2000);
    const loadingTexts = [
        "Your exam is still in progress...",
        "Please wait until the exam is completed...",
        "Results will be available after the exam ends...",
        "Your exam session is not yet finished...",
        "Stay patient! The results will be shown soon..."
    ];
    const randomText = loadingTexts[Math.floor(Math.random() * loadingTexts.length)];

    // Формируем содержимое с контейнером для Lottie-анимации и сообщением, центрируя контент по горизонтали и вертикали
    const modalContent = `
    <div id="skeletonContent" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
      <div id="animationContainer" style="width: 100px; height: 100px;"></div>
      <div class="text-skeleton" data-text="${randomText}" style="margin-top: 10px;">${randomText}</div>
    </div>
  `;

    // Обновляем контейнер с динамическим содержимым (без кнопки OK)
    document.getElementById('modalBody').innerHTML = modalContent;
    modal.style.display = 'flex';

    // Инициализируем Lottie-анимацию
    lottie.loadAnimation({
        container: document.getElementById('animationContainer'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/static/animations/ExamLoading.json'
    });
}


/*// Закрытие модального окна по нажатию на кнопку "X"
document.getElementById('closeMyExamResultsModal').addEventListener('click', function() {
  stopAllAudio();
  document.getElementById('myExamResultsModal').style.display = 'none';
});
*/

function buildExamResultsUI(data) {
    // Приводим Accuracy к числу и округляем до двух знаков после запятой
    const accuracy = parseFloat(data.correct_percentage).toFixed(2);

    // Header elements
    const examTitleElem = document.getElementById('examTitle');
    const examDateInfoElem = document.getElementById('examDateInfo');
    const examAccuracyElem = document.getElementById('examAccuracy');
    const examPointsElem = document.getElementById('examPoints');
    const examAnsweredElem = document.getElementById('examAnswered');

    // Container elements
    const statusSquaresContainer = document.getElementById('examStatusSquares');
    const summaryRowContainer = document.getElementById('examSummaryRow');
    const detailsContainer = document.getElementById('examDetails');

    // Clear old content
    statusSquaresContainer.innerHTML = '';
    summaryRowContainer.innerHTML = '';
    detailsContainer.innerHTML = '';

    // ----- Populate the Header -----
    examTitleElem.textContent = data.exam_title || 'Final Exam';
    examDateInfoElem.textContent = `Finished at ${data.time_finished} - ${data.total_questions} Questions`;
    examAccuracyElem.textContent = `${accuracy}%`;
    examPointsElem.textContent = data.points || '0';
    examAnsweredElem.textContent = `${data.total_questions - data.skipped}/${data.total_questions}`;

    // ----- Generate the question status squares -----
    data.results.forEach((result, index) => {
        let squareClass = 'square-incorrect';
        if (result.user_answer === null) {
            squareClass = 'square-skipped';
        } else if (result.is_correct) {
            squareClass = 'square-correct';
        } else if (result.is_partial) {
            squareClass = 'square-partial';
        }

        const square = document.createElement('div');
        square.classList.add('question-status-square', squareClass);
        square.textContent = (index + 1).toString();
        statusSquaresContainer.appendChild(square);
    });

    // ----- Build the summary row (like "Correct 24 - 72%", etc.) -----
    const correctRate = ((data.correct / data.total_questions) * 100).toFixed(2);
    const incorrectRate = ((data.incorrect / data.total_questions) * 100).toFixed(2);
    const skippedRate = ((data.skipped / data.total_questions) * 100).toFixed(2);

    const correctSummary = `<div class="summary-item correct">Correct ${data.correct} - ${correctRate}%</div>`;
    const incorrectSummary = `<div class="summary-item incorrect">Incorrect ${data.incorrect} - ${incorrectRate}%</div>`;
    const skippedSummary = `<div class="summary-item skipped">Skipped ${data.skipped} - ${skippedRate}%</div>`;

    summaryRowContainer.innerHTML = correctSummary + incorrectSummary + skippedSummary;

    // ----- Detailed Questions List -----
    data.results.forEach((result, index) => {
        let statusClass = '';
        let statusText = 'Incorrect';
        if (result.user_answer === null) {
            statusClass = 'skipped';
            statusText = 'Skipped';
        } else if (result.is_correct) {
            statusClass = 'correct';
            statusText = 'Correct';
        } else if (result.is_partial) {
            statusClass = 'partial';
            statusText = 'Half Correct';
        }

        const questionHtml = `
      <div class="question-result">
        <div class="question-top-row">
          <div class="question-title">
            <span class="question-number">Question ${index + 1}</span>
            <span class="question-type">${result.question_type || 'Multiple Choice'}</span>
            <span class="question-time">${result.time_spent || 'N/A'}s</span>
            <span class="question-points">${result.points || 1} point</span>
          </div>
          <div class="question-status ${statusClass}">${statusText}</div>
        </div>
        <div class="question-text"><strong>Q:</strong> ${result.question}</div>
        <div class="question-user-answer">
          <strong>Your answer:</strong> ${result.user_answer !== null
                ? result.user_answer
                : '<em>no answer</em>'
            }
        </div>
      </div>
    `;
        detailsContainer.innerHTML += questionHtml;
    });
}


function initAllWavePlayers() {
  let currentAudio = null;
  let currentPlayBtn = null;

  const popupBar = document.getElementById("popupBar");
  const stopBtn = document.getElementById("stopBtn");
  const playPauseBtn = document.getElementById("playPauseBtn");

  function showPopupBar() {
    popupBar.style.display = "flex";
  }
  function hidePopupBar() {
    popupBar.style.display = "none";
  }

  function showSpinner() {
    if (!popupBar.querySelector(".lds-ring")) {
      const spinner = document.createElement("div");
      spinner.className = "lds-ring";
      spinner.innerHTML = '<div></div><div></div><div></div>';
      popupBar.appendChild(spinner);
    }
  }

  function hideSpinner() {
    const spinner = popupBar.querySelector(".lds-ring");
    if (spinner) {
      popupBar.removeChild(spinner);
    }
  }

  stopBtn.onclick = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      hidePopupBar();
      hideSpinner();
      if (currentPlayBtn) currentPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  };

  playPauseBtn.onclick = () => {
    if (!currentAudio) return;
    if (currentAudio.paused) {
      currentAudio.play();
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      if (currentPlayBtn) currentPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      currentAudio.pause();
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      if (currentPlayBtn) currentPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  };

  document.querySelectorAll(".custom-audio-waves").forEach(container => {
    const audioSrc = container.getAttribute("data-audio-src");
    if (!audioSrc) return;

    container.innerHTML = '';

    const audioEl = document.createElement("audio");
    audioEl.src = audioSrc;
    audioEl.controls = false;
    container.appendChild(audioEl);

    const progress = document.createElement("div");
    progress.className = "progress";
    container.appendChild(progress);

    const playBtn = container.parentElement.querySelector(".custom-play-btn");
    const timeDisplay = container.parentElement.querySelector(".custom-time-display");

    playBtn.replaceWith(playBtn.cloneNode(true));
    const newPlayBtn = container.parentElement.querySelector(".custom-play-btn");

    newPlayBtn.onclick = () => {
      if (!audioEl) return;

      if (currentAudio && currentAudio !== audioEl) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentPlayBtn) currentPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
      }

      if (audioEl.paused) {
        audioEl.play();
        newPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
        currentAudio = audioEl;
        currentPlayBtn = newPlayBtn;
        showPopupBar();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        audioEl.pause();
        newPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    };

    audioEl.addEventListener("timeupdate", () => {
      if (audioEl.duration) {
        const percent = (audioEl.currentTime / audioEl.duration) * 100;
        progress.style.width = `${percent}%`;
        // Показываем только текущее время
        timeDisplay.textContent = formatTime(audioEl.currentTime);
      }
    });

    audioEl.addEventListener("loadedmetadata", () => {
      // При старте тоже только текущее время (начинается с 0:00)
      timeDisplay.textContent = "0:00";
    });

    container.onclick = (e) => {
      if (e.target.closest(".custom-play-btn")) return;
      const rect = container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * audioEl.duration;
      audioEl.currentTime = newTime;
    };

    audioEl.addEventListener("waiting", showSpinner);
    audioEl.addEventListener("playing", hideSpinner);
    audioEl.addEventListener("pause", () => {
      newPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
    audioEl.addEventListener("ended", () => {
      newPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      hidePopupBar();
      hideSpinner();
    });
  });

  makeElementDraggable(popupBar);
}

// Форматирование времени
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Улучшенное перетаскивание с ограничением по окну
function makeElementDraggable(el) {
  let startX, startY, initialLeft, initialTop;

  function onStart(e) {
    if (e.target.closest('.popup-btn')) return;

    e.preventDefault();
    if (e.type === "touchstart") {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd, { passive: false });
    } else {
      startX = e.clientX;
      startY = e.clientY;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onEnd);
    }
    const computedStyle = window.getComputedStyle(el);
    initialLeft = parseInt(computedStyle.left, 10) || 0;
    initialTop = parseInt(computedStyle.top, 10) || 0;
    el.style.cursor = "grabbing";
  }

  function onMove(e) {
    e.preventDefault();
    let clientX, clientY;
    if (e.type === "touchmove") {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const dx = clientX - startX;
    const dy = clientY - startY;
    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    // Ограничиваем внутри окна
    const rect = el.getBoundingClientRect();
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    newLeft = Math.max(0, Math.min(newLeft, winWidth - rect.width));
    newTop = Math.max(0, Math.min(newTop, winHeight - rect.height));

    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
  }

  function onEnd(e) {
    if (e.type === "touchend") {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    } else {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
    }
    el.style.cursor = "grab";
  }

  el.addEventListener("mousedown", onStart);
  el.addEventListener("touchstart", onStart, { passive: false });
}




// Пример функции formatTime
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}




// Function to fetch exam questions (result)
function fetchExamQuestions() {
    return fetch('/get_exam_questions_result')
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                console.error(result.error);
                showToastNotification(result.error);
                return null;
            }
            return result.questions;
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
            showToastNotification('Failed to fetch questions. Please try again.');
            return null;
        });
}

function stopAllAudio() {
    // Остановить все HTML5 аудио и видео элементы
    document.querySelectorAll('audio, video').forEach(media => {
        media.pause();
        media.currentTime = 0;
    });

    // Остановить все Audio объекты
    if (window.audioPlayers) {
        window.audioPlayers.forEach(player => {
            player.pause();
            player.currentTime = 0;
        });
        window.audioPlayers = [];
    }

    // Остановить все Web Audio API потоки
    if (window.audioContexts) {
        window.audioContexts.forEach(context => {
            if (context.state !== 'closed') {
                context.suspend(); // Приостанавливаем (чтобы можно было возобновить)
            }
        });
    }
}

// Перехват создания Audio объектов, чтобы их тоже можно было остановить
(function() {
    const originalAudio = window.Audio;
    window.audioPlayers = [];

    window.Audio = function(...args) {
        const audioInstance = new originalAudio(...args);
        window.audioPlayers.push(audioInstance);
        return audioInstance;
    };
})();


function submitExamResults() {
    stopAllAudio();
    const answers = {};
    const examResultsHtml = [];
    const finishExamButton = document.getElementById('finishExam');
    const loadingFinishExam = document.getElementById('loadingFinishExam');

    document.querySelectorAll('.exam-question, .exam-subquestion').forEach((questionElem) => {
        let qKey = questionElem.dataset.questionId;

        // Handle box-choose type with multiple subquestions
        const isBoxChoose = questionElem.querySelector('.box-choose-blank') !== null;
        if (isBoxChoose) {
            const blanks = questionElem.querySelectorAll('.box-choose-blank');
            blanks.forEach(blank => {
                const subqId = blank.dataset.questionId;
                let userAnswer = '';
                if (blank && blank.textContent.trim() && blank.textContent !== '____') {
                    userAnswer = blank.textContent.trim();
                }
                if (subqId && userAnswer) {
                    answers[`q${subqId}`] = userAnswer;
                }
            });
        } else {
            // Handle write-in-blank subquestions (e.g., under listening)
            const isWriteInBlank = questionElem.querySelector('.write-in-blank-questions') !== null;
            if (isWriteInBlank) {
                const inputs = questionElem.querySelectorAll('.write-in-blank-input');
                inputs.forEach(input => {
                    const subqId = input.name.replace('q', ''); // Extract ID from name (e.g., q2.1 -> 2.1)
                    let userAnswer = input.value.trim();
                    if (subqId && userAnswer) {
                        answers[`q${subqId}`] = userAnswer;
                    }
                });
            } else {
                // Handle other question types
                let userAnswer = '';
                // Check if the question is of type "unscramble"
                const isUnscramble = questionElem.querySelector('.unscramble-input') !== null;

                if (isUnscramble) {
                    // For unscramble type, collect letters from .unscramble-input elements
                    const unscrambleInputs = questionElem.querySelectorAll('.unscramble-input');
                    if (unscrambleInputs.length > 0) {
                        // Sort inputs by data-index to ensure correct order
                        const sortedInputs = Array.from(unscrambleInputs).sort((a, b) => 
                            parseInt(a.dataset.index) - parseInt(b.dataset.index)
                        );
                        userAnswer = sortedInputs
                            .map(input => input.textContent.trim())
                            .filter(char => char !== '') // Exclude empty inputs
                            .join('');
                    }
                } else {
                    // For other question types (e.g., multiple_choice, true_false)
                    const selectedOption =
                        questionElem.querySelector('input:checked') ||
                        questionElem.querySelector('input[type="text"]');
                    if (selectedOption && selectedOption.value) {
                        userAnswer = selectedOption.value.trim();
                    }
                }

                if (qKey && userAnswer) {
                    answers[`q${qKey}`] = userAnswer;
                }
            }
        }
    });

    window.examAnswers = answers;

    fetchExamQuestions().then((examQuestions) => {
        if (!examQuestions) return;

        window.examQuestionsData = examQuestions;

        fetch('/submit_exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser, answers: answers }),
        })
            .then((response) => response.json())
            .then((result) => {
                loadingFinishExam.style.display = 'none';
                finishExamButton.disabled = false;
                document.removeEventListener('visibilitychange', handleVisibilityChange);

                if (result.error) {
                    showToastNotification(`<b>Error</b> <span>${result.error}</span>`, 'error', 5000);
                    return;
                }

                const totalQuestions = result.correct + result.incorrect + result.skipped;
                const percentage = totalQuestions > 0 ? (result.correct / totalQuestions) * 100 : 0;

                let progressIncrease;
                let maxAllowedProgress;
                if (Unit === '6.3' || Unit === '12.3') {
                    const maxExamProgress = 30;
                    progressIncrease = (percentage / 100) * maxExamProgress;
                    updateExamHistory("finalExam", progressIncrease);
                    maxAllowedProgress = 100;
                } else if (
                    Unit.endsWith('.1') &&
                    parseFloat(Unit) >= 2.1 &&
                    parseFloat(Unit) <= 12.1
                ) {
                    progressIncrease = 5.83 * (percentage / 100);
                    updateExamHistory("weeklyExams", progressIncrease);
                    maxAllowedProgress = 70;
                } else {
                    progressIncrease = 0;
                    maxAllowedProgress = 100;
                }

                fetch(`/api/get-student-progress?username=${currentUser}`)
                    .then((res) => res.json())
                    .then((data) => {
                        let currentProgress = parseFloat(data.progress) || 0;
                        let newProgress = Math.min(maxAllowedProgress, currentProgress + progressIncrease);

                        return fetch('/api/update-student-progress-exam', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: currentUser, progress: newProgress }),
                        });
                    })
                    .catch((error) => {
                        console.error('Error updating progress:', error);
                        showToastNotification('Failed to update progress.');
                    });

                // Progress bar animation
                const progressBar = document.getElementById('progressBar');
                const progressText = document.getElementById('progressText');

                const prevWidth = parseFloat(getComputedStyle(progressBar).width);
                const containerWidth = progressBar.parentElement.offsetWidth;
                const currentPercentage = (prevWidth / containerWidth) * 100;

                progressBar.style.transition = 'none';
                progressBar.style.width = `${currentPercentage}%`;

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        progressBar.style.transition = 'width 1s ease-in-out';
                        progressBar.style.width = `${percentage}%`;
                    });
                });

                let currentText = parseInt(progressText.textContent.replace('%', '')) || 0;
                const targetText = Math.round(percentage);
                const increment = percentage > currentText ? 1 : -1;

                const interval = setInterval(() => {
                    if (currentText !== targetText) {
                        currentText += increment;
                        progressText.textContent = `${currentText}%`;
                    } else {
                        clearInterval(interval);
                    }
                }, 20);

                // Determine reward
                let motivationText = 'Keep up the good work!';
                let iconClass = 'fa-smile';
                let pointsText = '';

                if (percentage >= 80) {
                    iconClass = 'fa-trophy';
                    pointsText = 'Points: 170';
                    addTransaction(170, "Exam between 80 and 100");
                    motivationText = 'Excellent! You scored 80% or above! 🎉';
                    new Audio('/static/music/Coins_Rewarded.mp3').play().catch(console.log);
                } else if (percentage >= 50) {
					addTransaction(50, "Exam between 50 and 79");
                    motivationText = 'Good job! Aim for 80% next time!';
                    iconClass = 'fa-smile';
                } else {
					addTransaction(-150, "Fail the exam");
                    motivationText = "Don't give up! Keep practicing!";
                    iconClass = 'fa-sad-cry';
                }

                document.getElementById('resultIcon').className = `fa-solid ${iconClass}`;
                document.getElementById('examSubtitle').textContent = motivationText;
                document.getElementById('examPoints').textContent = pointsText;

                const resultsContainer = document.querySelector('.results-container');
                if (resultsContainer) {
                    resultsContainer.classList.remove('results-yellow', 'results-red');
                    if (percentage < 50) {
                        resultsContainer.classList.add('results-red');
                    } else if (percentage < 80) {
                        resultsContainer.classList.add('results-yellow');
                    }
                }

                // Build HTML for exam results
                examQuestions.forEach((question, index) => {
                    const questionType = question.type ? question.type : 'multiple_choice';

                    if (question.subquestions && Array.isArray(question.subquestions)) {
                        let subCorrectCount = 0;
                        question.subquestions.forEach((subq) => {
                            const userAnswer = window.examAnswers ? window.examAnswers[`q${subq.id}`] || '' : '';
                            const isCorrect = userAnswer.trim().toLowerCase() === subq.correct.trim().toLowerCase();
                            if (isCorrect) subCorrectCount++;
                        });
                        const aggregatedScore = `${subCorrectCount}/${question.subquestions.length}`;
                        const questionBlock = `
                            <div class="collapsible-question" data-type="${questionType}">
                                <div class="question-header">
                                    <span>Question ${question.id}</span>
                                    <span class="question-type-label">${questionType.replace('_', ' ')}</span>
                                </div>
                                <div class="question-right-section">
                                    <i class="fas fa-eye" onclick="openQuestionModal('${question.id}', event)"></i>
                                    <span class="score-badge">${aggregatedScore}</span>
                                </div>
                            </div>`;
                        examResultsHtml.push(questionBlock);
                    } else {
                        const qId = question.id ? question.id : (index + 1);
                        const userAnswer = window.examAnswers ? window.examAnswers[`q${qId}`] || '' : '';
                        const isCorrect = userAnswer.trim().toLowerCase() === question.correct.trim().toLowerCase();
                        const questionScore = isCorrect ? '1/1' : '0/1';

                        const questionBlock = `
                            <div class="collapsible-question" data-type="${questionType}">
                                <div class="question-header">
                                    <span>Question ${qId}</span>
                                    <span class="question-type-label">${questionType.replace('_', ' ')}</span>
                                </div>
                                <div class="question-right-section">
                                    <i class="fas fa-eye" onclick="openQuestionModal('${qId}', event)"></i>
                                    <span class="score-badge">${questionScore}</span>
                                </div>
                            </div>`;
                        examResultsHtml.push(questionBlock);
                    }
                });

                const examResultsModal = document.getElementById('ExamResultsModal');
                if (examResultsModal) {
                    examResultsModal.style.display = 'flex';
                    document.getElementById('examResultsContainer').innerHTML = examResultsHtml.join('');
                } else {
                    console.error("Exam results modal not found.");
                }
            })
            .catch((error) => {
                console.error('Error submitting exam:', error);
                showToastNotification('An error occurred. Please try again.');
                loadingFinishExam.style.display = 'none';
                finishExamButton.disabled = false;
            });
    });

    socket.emit('submitted_exam');
}


function openQuestionModal(qKey, event) {
    event?.stopPropagation();

    // Remove any existing modal
    document.querySelector('.detailed-questions-review')?.remove();

    const modal = document.createElement('div');
    modal.className = 'detailed-questions-review';

    let parentQuestion = null;
    window.examQuestionsData.forEach((question) => {
        if (question.subquestions && String(question.id) === String(qKey)) {
            parentQuestion = question;
        }
    });

    let headerHtml = `
        <div class="detailed-questions-reviewHeader">
            <span class="back-btn" onclick="detailedQuestionReviewClose(this.closest('.detailed-questions-review'))">
                <i class="fas fa-arrow-left"></i> Back
            </span>
            <h2><i class="fas fa-question-circle"></i> Question ${qKey}</h2>
        </div>
    `;

    if (parentQuestion) {
        const typeHtml = parentQuestion.type ? `<div class="type-label">Type: ${parentQuestion.type}</div>` : '';
        const passageHtml = parentQuestion.type === 'reading' && parentQuestion.text ? `<div class="passage-text">${parentQuestion.text}</div>` : '';
        const instructionHtml = parentQuestion.text && parentQuestion.type !== 'reading' ? `<div class="instruction">${parentQuestion.text}</div>` : '';

        let questionsHtml = '<div class="questions-container">';
        if (parentQuestion.type === 'box-choose') {
            let combinedText = '<div class="box-choose-questions">';
            parentQuestion.subquestions.forEach((subq, index) => {
                const userAnswer = window.examAnswers?.[`q${subq.id}`] ?? '';
                const isCorrect = userAnswer.trim().toLowerCase() === subq.correct.trim().toLowerCase();
                const questionNumber = index + 1;
                const displayText = subq.text.replace('____', `<span class="box-choose-blank ${isCorrect ? 'correct' : 'incorrect'}">${userAnswer || '____'}</span>`);
                combinedText += `
                    <div class="box-choose-subquestion">
                        <span class="main-question-number">${questionNumber}</span>
                        <span class="subquestion-text">${displayText}</span>
                    </div>
                `;
            });
            combinedText += '</div>';

            questionsHtml += `
                <div class="question-item">
                    <div class="question-text">${combinedText}</div>
                </div>
            `;
        } else {
            parentQuestion.subquestions.forEach((subq, index) => {
                const userAnswer = window.examAnswers?.[`q${subq.id}`] ?? '';
                const isCorrect = userAnswer.trim().toLowerCase() === subq.correct.trim().toLowerCase();
                const questionNumber = index + 1;

                if (subq.type === 'write-in-blank') {
                    const inputClass = isCorrect ? 'write-in-blank-input write-in-blank-correct' : 'write-in-blank-input write-in-blank-incorrect';
                    const displayText = subq.text.replace('____', `<input type="text" class="${inputClass}" value="${userAnswer || ''}" disabled>`);
                    questionsHtml += `
                        <div class="question-item">
                            <div class="question-header">
                                <span class="main-question-number">${questionNumber}</span>
                                <div class="question-text">${displayText}</div>
                            </div>
                        </div>
                    `;
                } else {
                    questionsHtml += `
                        <div class="question-item">
                            <div class="question-header">
                                <span class="main-question-number">${questionNumber}</span>
                                <div class="question-text">${subq.text}</div>
                            </div>
                            ${renderAnswerInput(subq, userAnswer, isCorrect)}
                        </div>
                    `;
                }
            });
        }
        questionsHtml += '</div>';

        modal.innerHTML = headerHtml + typeHtml + passageHtml + instructionHtml + questionsHtml;
    } else {
        let foundQuestion = null;
        window.examQuestionsData.forEach((question) => {
            if (question.subquestions) {
                question.subquestions.forEach((subq) => {
                    if (String(subq.id) === String(qKey)) {
                        foundQuestion = subq;
                    }
                });
            } else if (String(question.id) === String(qKey)) {
                foundQuestion = question;
            }
        });
        if (!foundQuestion) return;

        const typeHtml = foundQuestion.type ? `<div class="type-label">Type: ${foundQuestion.type}</div>` : '';
        const passageHtml = foundQuestion.type === 'reading' && foundQuestion.text ? `<div class="passage-text">${foundQuestion.text}</div>` : '';
        const instructionHtml = foundQuestion.text && foundQuestion.type !== 'reading' ? `<div class="instruction">${foundQuestion.text}</div>` : '';
        const userAnswer = window.examAnswers?.[`q${qKey}`] ?? '';
        const isCorrect = userAnswer.trim().toLowerCase() === foundQuestion.correct.trim().toLowerCase();

        if (foundQuestion.type === 'write-in-blank') {
            const inputClass = isCorrect ? 'write-in-blank-input write-in-blank-correct' : 'write-in-blank-input write-in-blank-incorrect';
            const displayText = foundQuestion.text.replace('____', `<input type="text" class="${inputClass}" value="${userAnswer || ''}" disabled>`);
            const questionsHtml = `
                <div class="questions-container">
                    <div class="question-item">
                        <div class="question-text">${displayText}</div>
                    </div>
                </div>
            `;
            modal.innerHTML = headerHtml + typeHtml + passageHtml + instructionHtml + questionsHtml;
        } else {
            const questionsHtml = `
                <div class="questions-container">
                    <div class="question-item">
                        <div class="question-text">${foundQuestion.text}</div>
                        ${renderAnswerInput(foundQuestion, userAnswer, isCorrect)}
                    </div>
                </div>
            `;
            modal.innerHTML = headerHtml + typeHtml + passageHtml + instructionHtml + questionsHtml;
        }
    }

    document.body.appendChild(modal);
}

// Function to handle modal closing with animation (renamed)
function detailedQuestionReviewClose(modal) {
    modal.classList.add('closing');
    modal.addEventListener('animationend', () => {
        modal.remove();
    }, { once: true });
}

function renderAnswerInput(question, userAnswer, isCorrect) {
    const correctnessTag = isCorrect ? 'detailed-question-correct' : 'detailed-question-incorrect';
    const safeUserAnswer = userAnswer || '';

    if (question.type === 'true_false') {
        return `
            <div class="options">
                <input type="radio" id="true-option" ${safeUserAnswer === 'True' ? 'checked' : ''} disabled class="${correctnessTag}">
                <label for="true-option" class="${safeUserAnswer === 'True' ? correctnessTag : ''}">True</label>
                <input type="radio" id="false-option" ${safeUserAnswer === 'False' ? 'checked' : ''} disabled class="${correctnessTag}">
                <label for="false-option" class="${safeUserAnswer === 'False' ? correctnessTag : ''}">False</label>
            </div>
        `;
    } else if (question.type === 'multiple_choice' && Array.isArray(question.options)) {
        return `
            <div class="options">
                ${question.options.map((option, index) => `
                    <input type="radio" id="option-${index}" ${safeUserAnswer === option ? 'checked' : ''} disabled class="${safeUserAnswer === option ? correctnessTag : ''}">
                    <label for="option-${index}" class="${safeUserAnswer === option ? correctnessTag : ''}">${option}</label>
                `).join('')}
            </div>
        `;
    } else if (question.type === 'unscramble') {
        const userLetters = safeUserAnswer ? safeUserAnswer.split('') : [];
        let lettersHtml = '<div class="unscramble-letters-review">';
        userLetters.forEach(letter => {
            lettersHtml += `<span class="unscramble-letter ${correctnessTag}">${letter}</span>`;
        });
        lettersHtml += '</div>';

        return `
            <div class="answer-container">
                ${lettersHtml}
            </div>
        `;
    } else if (question.type === 'box-choose') {
        return '';
    } else if (question.type === 'write-in-blank') {
        return `
            <div style="display: flex; align-items: center;">
                <input class="write-in-blank-input ${isCorrect ? 'write-in-blank-correct' : 'write-in-blank-incorrect'}" type="text" disabled value="${safeUserAnswer}">
            </div>
        `;
    } else if (['fill_gaps', 'reading', 'listening', 'question'].includes(question.type)) {
        return `
            <div style="display: flex; align-items: center;">
                <input class="filled-answer ${correctnessTag}" type="text" disabled value="${safeUserAnswer}">
            </div>
        `;
    }
    return '';
}




document.addEventListener('DOMContentLoaded', () => {
  // Выполняем только если инициирован переход из /app
  if (localStorage.getItem('openExamTask') === 'true') {
    // Триггерим клик по нужной опции сразу
    document.getElementById('examTaskOption')?.click();

    // Навешиваем хэндлер на кнопку Done
    const doneBtn = document.getElementById('ResultDone');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        // Скрываем модалки
        document.getElementById('ExamResultsModal').style.display = 'none';
        document.getElementById('examModal').style.display = 'none';
        
        // Убираем флаг
        localStorage.removeItem('openExamTask');

        // Редирект обратно в /app
        window.location.href = '/app';
      });
    }
  }
});




// Function to return instruction text based on question type
function getInstructionForType(type) {
    switch (type) {
        case 'true_false':
            return 'Choose True or False.';
        case 'multiple_choice':
            return 'Select the correct answer.';
        case 'fill_gaps':
            return 'Fill in the blank.';
        case 'unscramble':
            return 'Unscramble the letters.';
        case 'reading':
            return 'Read the text and answer.';
        case 'listening':
            return 'Listen to the audio and enter the missing word.';
        default:
            return '';
    }
}

// Functions to disable/enable the "Finish Task" button
function disableFinishButton() {
    document.getElementById('finishExam').setAttribute('disabled', 'true');
}

function enableFinishButton() {
    document.getElementById('finishExam').removeAttribute('disabled');
}


socket.on('exam_started', function(data) {
    showToastNotification('<b>' + data.message + '</b> <span>Get ready to do your best!</span>', 'info', 5000);
});

function updateExamHistory(updateType, progressIncrease) {
  const username = getCurrentUser();
  // Округляем значение до двух знаков
  const roundedIncrease = Math.round(progressIncrease * 100) / 100;
  
  fetch('/api/update-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      updateType: updateType,        // 'finalExam' или 'today'
      progressIncrease: roundedIncrease
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || 'Failed to update history');
      });
    }
    return response.json();
  })
  .then(data => {
    console.log('Update successful:', data.message);
    // Обновляем UI, например, перезагружаем последние данные
    loadLatestProgress();
  })
  .catch(error => {
    console.error('Error updating history:', error);
    // Можно добавить обработку ошибок на UI (например, вывести сообщение)
  });
}

// Функция для получения имени пользователя
function getCurrentUser() {
    return currentUser;  // Используем глобальную переменную currentUser, переданную из Flask
}

function getNextExamDate(unit, startDate, studyDays) {
    const currentDate = new Date();
    let baseDate = startDate ? new Date(startDate) : currentDate;

    // 🔹 Каждый Unit состоит из 3 учебных дней
    const daysPerUnit = 3;

    // 🔹 Mid Exam — после 6.3 (6 недель × 3 дня = 18 учебных дней)
    const midExamUnit = { week: 6, day: 3, totalDays: 18 };
    // 🔹 Final Exam — после 12.3 (12 недель × 3 дня = 36 учебных дней)
    const finalExamUnit = { week: 12, day: 3, totalDays: 36 };

    // 🔹 Разбираем `unit` (например, "6.3" → week = 6, day = 3)
    const [currentWeek, currentDay] = unit.split('.').map(Number);

    // 🔹 Считаем пройденные учебные дни
    const currentStudyDays = (currentWeek - 1) * daysPerUnit + currentDay;

    // 🔹 Функция для вычисления даты экзамена
    function calculateExamDate(targetStudyDays) {
        const examDate = new Date(baseDate);
        let studyDaysElapsed = 0;
        let tempDate = new Date(baseDate);

        // 🔹 Разрешённые учебные дни
        const oddDays = [1, 3, 5];  // Понедельник, Среда, Пятница
        const evenDays = [2, 4, 6]; // Вторник, Четверг, Суббота
        const allowedDays = studyDays === "even" ? evenDays : oddDays;

        // 🔹 Ищем первый учебный день курса
        while (!allowedDays.includes(tempDate.getDay())) {
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // 🔹 Считаем, когда наступит нужное число учебных дней
        while (studyDaysElapsed < targetStudyDays) {
            if (allowedDays.includes(tempDate.getDay())) {
                studyDaysElapsed++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }

        return tempDate.toISOString().split('T')[0]; // Возвращаем дату в формате "YYYY-MM-DD"
    }

    if (currentStudyDays < midExamUnit.totalDays) {
        return calculateExamDate(midExamUnit.totalDays); // Mid Exam
    } else if (currentStudyDays < finalExamUnit.totalDays) {
        return calculateExamDate(finalExamUnit.totalDays); // Final Exam
    }

    return "No upcoming exams"; // Если курс закончен
}


document.addEventListener("DOMContentLoaded", function() {
    fetchStudentProgress();
});

function fetchStudentProgress() {
  const username = getCurrentUser();
  const errorMessageEl = document.getElementById("error-message");
  const loadingEl = document.getElementById("loading");
  const progressContainerEl = document.getElementById("progress-container");
  const leaderboardTable = document.getElementById("leaderboard-table-body");

  // Скрываем сообщение об ошибке и показываем загрузку
  errorMessageEl.style.display = "none";
  loadingEl.style.display = "flex";
  progressContainerEl.style.display = "none";

  // Отображаем спиннер в таблице лидеров
  leaderboardTable.innerHTML = `
    <tr>
      <td colspan="3" class="loading-spinner">
        <div class="lds-spinner">
          <div></div><div></div><div></div><div></div>
          <div></div><div></div><div></div><div></div>
          <div></div><div></div><div></div><div></div>
        </div>
      </td>
    </tr>
  `;

  // 1. Получаем данные общего прогресса
  const progressPromise = fetch(`/api/get-student-progress?username=${username}`)
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => { throw new Error(data.error); });
      }
      return response.json();
    });

  // 2. Получаем сводные данные для блоков My Progress
  const progressHistoryPromise = fetch(`/api/get-student-progress-history?username=${username}`)
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => { throw new Error(data.error); });
      }
      return response.json();
    });

  Promise.all([progressPromise, progressHistoryPromise])
    .then(([progressData, progressHistoryData]) => {

      // Извлекаем данные для текущего пользователя
      const progressInfo = progressData[username] || {};
      // summaryInfo содержит данные для блоков My Progress (в виде строк с процентами)
      const summaryInfo = progressHistoryData[username] || {};

      // Обновляем поля для блоков My Progress, отдавая приоритет summaryInfo
      progressInfo.finalExam = summaryInfo.finalExam !== undefined ? summaryInfo.finalExam : (progressInfo.finalExam ?? 0);
      progressInfo.weeklyExams = summaryInfo.weeklyExams !== undefined ? summaryInfo.weeklyExams : (progressInfo.weeklyExams ?? 0);
      progressInfo.totalScore = summaryInfo.totalScore !== undefined ? summaryInfo.totalScore : (progressInfo.totalScore ?? 0);

      const { progress = 0, start_date, study_days = "odd", finalExam, weeklyExams } = progressInfo;
      if (!start_date) throw new Error("Start date is missing");

      // 1. Вычисляем процент завершения курса (90 дней)
      const currentDate = new Date();
      currentDate.setHours(23, 59, 59, 999);
      const totalCourseDays = 90;
      const courseStartDate = new Date(start_date);
      const daysElapsed = Math.floor((currentDate - courseStartDate) / (1000 * 60 * 60 * 24)) + 1;
      const completionPercentage = Math.round(Math.min((daysElapsed / totalCourseDays) * 100, 100));

      // 2. Подсчет учебных дней для расчёта юнита и недели
      const oddDays = [1, 3, 5];   // понедельник, среда, пятница
      const evenDays = [2, 4, 6];    // вторник, четверг, суббота
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

      // 3. Определяем текущую неделю и день недели (при 3 учебных днях в неделю)
      const studyWeeksElapsed = Math.floor((studyDaysElapsed - 1) / 3);
      const dayInWeek = ((studyDaysElapsed - 1) % 3) + 1;
      const unit = `${studyWeeksElapsed + 1}.${dayInWeek}`;
      const weekNumber = studyWeeksElapsed + 1;

      Unit = unit;
      Week = weekNumber;

      // 4. Получаем дату следующего экзамена (функция getNextExamDate должна быть определена)
      const nextExamDate = getNextExamDate(unit, start_date, study_days);

      // Обновляем блоки My Progress
      const totalScore = parseFloat(progress).toFixed(2);
      document.getElementById("progress-score").textContent = `Total Score: ${totalScore}%`;
      document.getElementById("progress-bar-fill").style.width = `${totalScore}%`;

      // Блок Final Exam (максимум 30)
      const finalExamVal = parseFloat(finalExam || 0);
      const finalExamPercent = ((finalExamVal / 30) * 100).toFixed(2);
      document.getElementById("finalExamLabel").textContent = `${finalExamVal} / 30 (${finalExamPercent}%)`;
      const finalExamBar = document.getElementById("progressFinalExamBar");
      if (finalExamBar) {
        finalExamBar.style.width = `${finalExamPercent}%`;
      }

      // Блок Weekly Exams (максимум 70)
      const weeklyExamsVal = parseFloat(weeklyExams || 0);
      const weeklyExamsPercent = ((weeklyExamsVal / 70) * 100).toFixed(2);
      document.getElementById("weeklyExamsLabel").textContent = `${weeklyExamsVal} / 70 (${weeklyExamsPercent}%)`;
      const weeklyExamsBar = document.getElementById("progressWeeklyExamsBar");
      if (weeklyExamsBar) {
        weeklyExamsBar.style.width = `${weeklyExamsPercent}%`;
      }

      // Обновляем блок с датой экзамена
      let examMessage, examIcon;
      if (weekNumber <= 6) {
        examMessage = `Mid Term Exam: ${nextExamDate}`;
        examIcon = '<i class="fas fa-calendar-day"></i>';
      } else {
        examMessage = `Final Exam: ${nextExamDate}`;
        examIcon = '<i class="fas fa-calendar-check"></i>';
      }
      document.getElementById("exam-date").innerHTML = `${examIcon} ${examMessage}`;

      document.getElementById("current-unit").textContent = `Unit ${unit}`;
      document.getElementById("current-week").textContent = `Week ${weekNumber}`;
      document.getElementById("course-completion").textContent = `${completionPercentage}% Completed`;

      // Добавляем кнопку "Weekly Exam", если условия соблюдены
      if (weekNumber >= 2 && dayInWeek === 1 && !document.querySelector('.weekly-exam-button')) {
        const weeklyExamButton = document.createElement("button");
        weeklyExamButton.textContent = "Soon";
        weeklyExamButton.classList.add("weekly-exam-button");
        weeklyExamButton.addEventListener('click', () => showModal());
        progressContainerEl.appendChild(weeklyExamButton);
      }

      // Переходим к Leaderboard – здесь будем работать с данными из API get-student-progress
      return fetch('/api/get-leaderboard')
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch leaderboard');
          return response.json();
        })
        .then(leaderboardData => ({ leaderboardData }));
    })
    // Затем получаем историю для сравнения (API get-history) – API возвращает массив напрямую
    .then(({ leaderboardData }) => {
      return fetch(`/api/get-history?username=${username}`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch history');
          return response.json();
        })
        .then(historyData => ({ leaderboardData, historyData: historyData || [] }));
    })
    .then(({ leaderboardData, historyData }) => {
      console.log('🏅 Leaderboard Data:', leaderboardData);
      console.log('📜 Exam History Data:', historyData);
      // Сортируем студентов по убыванию progress (реальное значение из API get-student-progress)
      const sortedLeaderboard = Object.entries(leaderboardData)
        .sort(([, a], [, b]) => b.progress - a.progress);
      leaderboardTable.innerHTML = "";
      let rank = 1;
      sortedLeaderboard.forEach(([student, studentInfo]) => {
        const row = document.createElement('tr');
        // Форматируем progress для отображения (реальное значение progress)
        const formattedProgress = parseFloat(studentInfo.progress).toFixed(2);
        let progressHtml = `${formattedProgress}%`;

        // Если это текущий пользователь, используем историю (API get-history) для сравнения значений weeklyExams
        if (student === username && historyData.length >= 2) {
          // Фильтруем записи, где есть weeklyExams
          const weeklyHistory = historyData.filter(item => item.weeklyExams !== undefined);
          if (weeklyHistory.length >= 2) {
            // Сортируем по дате в порядке убывания (самые свежие записи – первыми)
            weeklyHistory.sort((a, b) => b.date.localeCompare(a.date));
            // Берём первые две записи с уникальными датами
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
  // Используем основной progress, полученный из API get-student-progress
  // (formattedProgress определён ранее как основной процент progress)
  if (currentWeekly > previousWeekly) {
    progressHtml = `<span class="up-percentage"><i class="fas fa-arrow-up up-icon"></i> ${formattedProgress}%</span>`;
  } else if (currentWeekly < previousWeekly) {
    progressHtml = `<span class="down-percentage"><i class="fas fa-arrow-down down-icon"></i> ${formattedProgress}%</span>`;
  } else {
    progressHtml = `${formattedProgress}%`;
  }
}

          }
        }

        row.innerHTML = `
          <td><div class="student-avatar">${rank}</div></td>
          <td class="student-name">${student}</td>
          <td>${progressHtml}</td>
        `;
        leaderboardTable.appendChild(row);
        rank++;
      });
    })
    .catch(error => {
      console.error('⚠️ Error:', error);
	  errorMessageEl.textContent = "You are not an active student";
	  errorMessageEl.style.cssText = `
    color: #ff4d4d;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    margin: 20px 0;
    padding: 15px;
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid #ff4d4d;
    border-radius: 10px;
	`;
errorMessageEl.style.display = "block";

    })
    .finally(() => {
      loadingEl.style.display = "none";
      progressContainerEl.style.display = "block";
    });
}


function loadLatestProgress() {
  const username = getCurrentUser();
  fetch(`/api/get-student-progress-history?username=${username}`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to get student progress');
      return res.json();
    })
    .then(data => {
      console.log('Latest progress data:', data);
      const userHistory = data[username];
      let finalExam = 0;
      let weeklyExams = 0;

      if (Array.isArray(userHistory) && userHistory.length > 0) {
        // Просуммировать все значения weeklyExams
        weeklyExams = userHistory.reduce((sum, record) => sum + (record.weeklyExams || 0), 0);
        // Если в API появится finalExam, можно сделать аналогично:
        finalExam = userHistory.reduce((sum, record) => sum + (record.finalExam || 0), 0);
      }

    })
    .catch(err => {
      console.error(err);
    });
}


function openHistoryModal(type) {
  // 1. Ставим заголовок модального окна в соответствии с типом
  document.getElementById("historyTitle").textContent =
    (type === 'finalExam') ? "Final Exam History" : "Weekly Exams History";
  
  // 2. Временно ставим в содержимое модального окна спиннер (пока данные грузятся)
  document.getElementById("historyContent").innerHTML = `
    <div class="lds-spinner">
      <div></div><div></div><div></div><div></div>
      <div></div><div></div><div></div><div></div>
      <div></div><div></div><div></div><div></div>
    </div>
  `;
  
  // 3. Показываем модальное окно (сейчас там только спиннер)
  document.getElementById("historyModal").style.display = "block";

  // 4. Начинаем загрузку данных
  const username = getCurrentUser();
  fetch(`/api/get-history?username=${username}`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to get history');
      return res.json();
    })
    .then(historyArray => {
      // Фильтруем записи по выбранному типу
      const filteredHistory = historyArray.filter(item => item[type] !== undefined);

      // Сортируем по дате (по убыванию)
      filteredHistory.sort((a, b) => b.date.localeCompare(a.date));

      let html = "";
      if (filteredHistory.length === 0) {
        html = `<p>No history available for ${type}.</p>`;
      } else {
        filteredHistory.forEach(item => {
          // Получаем числовое значение
          let value = parseFloat(item[type]) || 0;
          // Определяем максимум (30 для finalExam, 5.83 для weeklyExams)
          let max = (type === 'finalExam') ? 30 : 5.83;
          
          // Считаем процент с двумя знаками после запятой
          const percent = ((value / max) * 100).toFixed(2);

          // Форматируем дату
          const dateStr = formatDate(item.date); 
          
          // Формируем HTML для иконки с условием для finalExam
          let iconHtml = "";
          if (type === 'finalExam') {
            // Для finalExam используем другую иконку и красный фон
            iconHtml = `<div class="history-icon" style="background-color: red;">
                          <i class="fas fa-trophy"></i>
                        </div>`;
          } else {
            iconHtml = `<div class="history-icon">
                          <i class="fas fa-graduation-cap"></i>
                        </div>`;
          }

          // Формируем HTML для каждого элемента
          html += `
            <div class="history-item">
              ${iconHtml}
              <div class="history-date">${dateStr}</div>
              <div class="history-progress">${percent}%</div>
            </div>
          `;
        });
      }

      // 5. Заменяем содержимое модального окна на итоговый HTML
      document.getElementById("historyContent").innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      // Если произошла ошибка, выводим сообщение об ошибке
      document.getElementById("historyContent").innerHTML = `<p>Error: ${err.message}</p>`;
    });
}




/**
 * Пример форматирования даты "YYYY-MM-DD" в "Tuesday, March 11, 2025"
 */
function formatDate(isoDateStr) {
  const dateObj = new Date(isoDateStr + "T00:00:00");
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
}


/**
 * Закрыть модалку
 */
function closeHistoryModal() {
  document.getElementById("historyModal").style.display = "none";
}

// При загрузке страницы получить последние данные
window.addEventListener('DOMContentLoaded', loadLatestProgress);


const messagesContainer = document.getElementById("messages");

let typingTimeout;
let isTyping = false;

// Функция для показа индикатора
function showTyping() {
    if (!isTyping) {
        socket.emit("typing", { user: currentUser });
        isTyping = true;
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit("stop_typing", { user: currentUser });
        isTyping = false;
    }, 2000);
}

// Отслеживаем ввод текста
messageInput.addEventListener("input", showTyping);

// Получаем событие "user_typing"
socket.on("user_typing", (data) => {
    let typingIndicator = document.getElementById("typing-indicator");

    if (!typingIndicator) {
        typingIndicator = document.createElement("div");
        typingIndicator.id = "typing-indicator";
        typingIndicator.classList.add("message");
        messagesContainer.appendChild(typingIndicator);
    }

    typingIndicator.innerHTML = `<span class="text-skeleton" data-text="${data.user} is typing...">${data.user} is typing...</span>`;
    typingIndicator.classList.add("show");

    // Всегда перемещаем в самый низ
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Получаем "user_stopped_typing"
socket.on("user_stopped_typing", () => {
    let typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
        typingIndicator.classList.remove("show");

        // Удаляем его из DOM через 300 мс (чтобы плавно исчез)
        setTimeout(() => {
            if (typingIndicator.parentNode) {
                typingIndicator.parentNode.removeChild(typingIndicator);
            }
        }, 300);
    }
});


// Получаем событие "user_typing"
socket.on("user_typing", (data) => {
    typingIndicator.innerHTML = `<span class="text-skeleton" data-text="${data.user} печатает...">${data.user} печатает...</span>`;
    typingIndicator.classList.add("show");

    // Всегда оставляем индикатор внизу
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Получаем "user_stopped_typing"
socket.on("user_stopped_typing", () => {
    typingIndicator.classList.remove("show");
});

// Show modal and attach event listeners
function showModal() {
    let modal = document.querySelector('.leaderboard-modal');

    // Check if modal already exists, if not create it
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'leaderboard-modal';
        modal.innerHTML = `
            <div class="leaderboard-content">
                <h2><i class="fas fa-exclamation-triangle"></i> Confirm </h2>
                <p>Do you want to start the exam?</p>
                <button id="confirm" class="submit-button">
                    <span class="text-skeleton" data-text="Start Exam">Start Exam</span>
                </button>
                <button id="cancel" class="cancel-button">Cancel</button>
            </div>
        `;

        // Append the modal to the progress container
        const progressContainer = document.getElementById("progress-container");
        if (progressContainer) {
            progressContainer.appendChild(modal);
        } else {
            console.error('Progress container not found.');
        }

        // Attach event listeners for confirm and cancel buttons
        const confirmButton = modal.querySelector('#confirm');
        const cancelButton = modal.querySelector('#cancel');

        // Remove previous listeners before adding new ones
        if (confirmButton) {
            confirmButton.removeEventListener('click', handleConfirm);
            confirmButton.addEventListener('click', handleConfirm);
        }

        if (cancelButton) {
            cancelButton.removeEventListener('click', handleCancel);
            cancelButton.addEventListener('click', handleCancel);
        }
    }

    // Display the modal
    modal.style.display = 'block';
}

// Handle confirm button click
function handleConfirm() {
    loadExamQuestions(Unit);
    const modal = document.querySelector('.progress-modal');
    modal.style.display = 'none';
    closeModalCONFIRM();
    document.getElementById('examTaskOption').click();  // Trigger examTaskOption
}

// Handle cancel button click
function handleCancel() {
    closeModalCONFIRM();
}

// Close the modal
function closeModalCONFIRM() {
    const modal = document.querySelector('.leaderboard-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function loadExamQuestions(unit) {
    // Determine the correct JSON file based on the unit number
    const examQuestionsUrl = `/static/weekly_exam/Unit${unit}.json`;

    fetch(examQuestionsUrl)
        .then(response => response.json())
        .then(examQuestions => {
            console.log("Exam Questions:", examQuestions);
            // Send the questions to the server via API call
            sendQuestionsToServer(examQuestions);
        })
        .catch(error => {
            console.error("Error fetching exam questions:", error);
            alert("There was an error loading the exam questions.");
        });
}

function sendQuestionsToServer(examQuestions) {
    fetch('/create_exam', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            questions: examQuestions
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Exam has been created successfully!");
            } else {
                alert(`Error creating exam: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error sending exam questions to server:", error);
            alert("There was an error processing the exam.");
        });
}


// Открытие и закрытие модального окна
const progressModal = document.getElementById("progress_modal");
const progressOption = document.getElementById("my-progress-option");

progressOption.addEventListener("click", function() {
    progressModal.style.display = "flex";
    fetchStudentProgress(); // Получаем прогресс при открытии модалки
});

const closeModal = document.getElementById("progress_modal_close");

// Закрытие модального окна при клике на "X"
closeModal.addEventListener("click", function() {
    progressModal.style.display = "none"; // Скрываем модальное окно
});
// Закрыть модалку, если пользователь кликает вне модального окна
window.addEventListener("click", function(event) {
    if (event.target === progressModal) {
        progressModal.style.display = "none";
    }
});

document.getElementById("leaderboard-option").addEventListener("click", function() {
    // Добавление скелетона загрузки
    let loadingHTML = `<div id="leaderboard_loading" class="leaderboard-loading">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-list"></div>
        <div class="skeleton skeleton-list"></div>
        <div class="skeleton skeleton-list"></div>
    </div>`;
    showLeaderboardModal(loadingHTML);

    fetch('/api/leaderboard')
        .then(response => response.json())
        .then(async data => {
            let leaderboardHTML = `<div class="leaderboard">
                <h2>Leaderboard</h2>
                <div class="top-3">`;

            // Иконки медалей
            const medalIcons = [
                "<i class='fas fa-crown' style='color: gold;'></i>",
                "<i class='fas fa-medal' style='color: silver;'></i>",
                "<i class='fas fa-award' style='color: #cd7f32;'></i>"
            ];

            // Генерация топ-3 игроков
            for (let i = 0; i < data.top_3.length; i++) {
                let player = data.top_3[i];
                let avatar = await fetchAvatar(player.name);
                let rankClass = ["gold", "silver", "bronze"][i] || "";

                leaderboardHTML += `
                    <div class="top-player ${rankClass}">
                        <div class="rank-number">${i + 1}${getRankSuffix(i + 1)}</div>
                        <div class="leaderboard-avatar">${avatar}</div>
                        <p>${medalIcons[i]} ${player.name} - ${player.coins} <i class="fas fa-star"></i></p>
                    </div>`;
            }

            leaderboardHTML += `</div><h3></h3><ul class="leaderboard-list">`;

            // Генерация списка остальных игроков
            let rank = 4;
            for (let player of data.others) {
                let avatar = await fetchAvatar(player.name);
                leaderboardHTML += `
                    <li class="leaderboard-item">
                        <div class="leaderboard-avatar">${avatar}</div>
                        <span class="leaderboard-name">${player.name}</span> 
                        <span class="rank-badge">${rank}${getRankSuffix(rank)}</span>
                        <span class="leaderboard-rank">${player.coins} <i class="fas fa-star"></i></span>
                    </li>`;
                rank++;
            }

            leaderboardHTML += "</ul></div>";

            // Обновление содержимого модального окна
            updateLeaderboardModal(leaderboardHTML);
        })
        .catch(error => {
            console.error("Error fetching leaderboard:", error);
            updateLeaderboardModal("<p>Error loading leaderboard. Please try again later.</p>");
        });
});

function showLeaderboardModal(content) {
    const modal = document.querySelector(".leaderboard-modal");
    modal.innerHTML = content;
    modal.style.display = "block";
}

function updateLeaderboardModal(content) {
    const modal = document.querySelector(".leaderboard-modal");
    modal.innerHTML = content;
}


// Функция для показа модального окна
function showLeaderboardModal(content) {
    const modal = document.createElement("div");
    modal.classList.add("leaderboard-modal");
    modal.innerHTML = `
        <div class="leaderboard-content">
            <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <div id="leaderboard-container">${content}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Функция для обновления модального окна
function updateLeaderboardModal(content) {
    document.getElementById("leaderboard-container").innerHTML = content;
}

// Функция загрузки аватарки
async function fetchAvatar(username) {
    try {
        let response = await fetch(`/get_avatar/${username}`);
        let data = await response.json();

        if (data.avatar_url) {
            return `<img src="${data.avatar_url}" alt="Avatar" class="leaderboard-img">`;
        } else {
            return getAvatarPlaceholder(username);
        }
    } catch (error) {
        console.error("Error fetching avatar:", error);
        return getAvatarPlaceholder(username);
    }
}

// Функция для генерации первой буквы имени
function getAvatarPlaceholder(username) {
    return `<div class='avatar-placeholder'>${username.charAt(0).toUpperCase()}</div>`;
}

// Функция для добавления суффиксов рангов (1st, 2nd, 3rd, 4th и т.д.)
function getRankSuffix(rank) {
    if (rank === 1) return "st";
    if (rank === 2) return "nd";
    if (rank === 3) return "rd";
    return "th";
}

document.addEventListener("DOMContentLoaded", function() {
    // Убедитесь, что currentUser - это объект, а не строка.
    const username = currentUser; // Присваиваем только имя пользователя

    fetch('/api/leaderboard')
        .then(response => {
            return response.json();
        })
        .then(data => {

            const leaderboardOption = document.getElementById("leaderboard-option");
            if (!leaderboardOption) {
                console.log("Leaderboard option not found.");
                return;
            }

            // Проверяем, существует ли username
            if (!username) {
                console.error("Current user is not defined or does not have a name.");
                return;
            }

            // Собираем полный список игроков (топ-3 + остальные)
            let allPlayers = [...data.top_3, ...data.others];

            // Приводим имя текущего пользователя и имена игроков к нижнему регистру для точного сравнения
            let userRank = allPlayers.findIndex(player => player.name.toLowerCase() === username.toLowerCase()) + 1;

            // Если пользователь найден, обновляем текст на кнопке
            if (userRank > 0) {
                // Добавляем иконку для "Leaderboard"
                leaderboardOption.innerHTML = `<i class="fas fa-trophy" style="margin-right: 8px;"></i>Leaderboard #${userRank}`;
            } else {
                leaderboardOption.innerText = `Leaderboard #?`; // Если не нашли
            }
        })
        .catch(error => {
            console.error("Error fetching leaderboard:", error);
        });
});

// Open modal
document.getElementById('coinDisplay').addEventListener('click', async function() {
    document.getElementById('balanceModal').style.display = 'block';
    await updateBalanceUI();
});

// Close modal
document.getElementById('closeBalanceModal').addEventListener('click', function() {
    document.getElementById('balanceModal').style.display = 'none';
});

// Tab switching
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(tab => tab.style.display = 'none');
        button.classList.add('active');
        document.getElementById(button.dataset.tab).style.display = 'block';
    });
});

// Fetch balance and transactions, then populate the UI
async function updateBalanceUI() {
    try {
        const data = await fetchBalanceAndTransactions(currentUser);

        // Update balance
        const balanceAmountEl = document.getElementById('balanceAmount');
        balanceAmountEl.textContent = `$${Number(data.balance).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

        // Separate transactions
        const allTab = document.getElementById('allTab');
        const receivedTab = document.getElementById('receivedTab');
        const sentTab = document.getElementById('sentTab');
        allTab.innerHTML = "";
        receivedTab.innerHTML = "";
        sentTab.innerHTML = "";

        let allCount = 0;
        let receivedCount = 0;
        let sentCount = 0;

        data.transactions.forEach(tx => {
            const row = createTransactionRow(tx);
            // Always append to allTab
            allTab.appendChild(row.cloneNode(true));
            allCount++;

            if (tx.amount > 0) {
                receivedTab.appendChild(row);
                receivedCount++;
            } else {
                sentTab.appendChild(row);
                sentCount++;
            }
        });

        // Update tab counts
        document.getElementById('allCount').textContent = allCount;
        document.getElementById('receivedCount').textContent = receivedCount;
        document.getElementById('sentCount').textContent = sentCount;

        // If no transactions in a category, show a placeholder message
        if (receivedCount === 0) {
            receivedTab.innerHTML = "<p>No received transactions yet.</p>";
        }
        if (sentCount === 0) {
            sentTab.innerHTML = "<p>No sent transactions yet.</p>";
        }

    } catch (error) {
        console.error(error);
    }
}

// Example: create a transaction row
function createTransactionRow(tx) {
    // tx object: { amount, description, time, method, status, etc. }
    const row = document.createElement('div');
    row.classList.add('transaction-row');

    const sign = tx.amount < 0 ? 'sent' : 'received';
    const arrowIcon = sign === 'sent' ? 'fa-arrow-up' : 'fa-arrow-down';

    row.innerHTML = `
    <div class="transaction-info">
      <div class="transaction-arrow ${sign}">
        <i class="fa-solid ${arrowIcon}"></i>
      </div>
      <div class="transaction-details">
        <div class="transaction-amount">
          ${sign === 'sent' ? '-' : '+'}$${Math.abs(tx.amount).toLocaleString()}
        </div>
        <div class="transaction-method">
          ${tx.method || 'Unknown method'}
        </div>
      </div>
    </div>
    <div class="transaction-status">
      <span class="status success">Success</span>
      <div class="transaction-description">
        ${tx.description || ''}
      </div>
    </div>
  `;

    return row;
}

// Example: mock function that fetches data
async function fetchBalanceAndTransactions(username) {
    const response = await fetch(`/api/get_balance/${username}`);
    if (!response.ok) throw new Error('Failed to fetch balance');
    return response.json(); // { balance: number, transactions: array }
}



// Example function to add a transaction with a description
async function addTransaction(amount, description) {
    try {
        const response = await fetch('/api/add_transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser, // currentUser must be defined globally
                amount: amount,
                description: description
            })
        });
        if (!response.ok) {
            throw new Error(`Error adding transaction: ${response.status}`);
        }
        const data = await response.json();
        console.log('Transaction added:', data.message);
        // Update balance UI after adding a transaction
        await updateBalanceUI();
    } catch (error) {
        console.error(error.message);
    }
}

// Example usage:
// Add an expense transaction (e.g., Paying services -200 USD)
// addTransaction(-200, "Paying services");

// Add a revenue transaction (e.g., Salary +512 USD)
// addTransaction(512, "Salary");

// Update balance UI on page load
document.addEventListener('DOMContentLoaded', () => {
    updateBalanceUI();
});

const textarea = document.getElementById("message-input");

textarea.addEventListener("input", () => {
    textarea.style.height = "auto";

    // вычисляем scrollHeight и устанавливаем высоту
    const maxHeight = 240;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = newHeight + "px";
});

messageInput.addEventListener('input', function () {
    // Если контент больше текущей высоты поля, активируем анимацию на увеличение
    if (messageInput.scrollHeight > messageInput.clientHeight) {
        messageInput.classList.add('expanded');
        messageInput.classList.remove('collapsed');
    } else {
        // Если контент уменьшился, активируем анимацию на уменьшение
        messageInput.classList.add('collapsed');
        messageInput.classList.remove('expanded');
    }
});

// Предполагается, что глобальная переменная Unit уже определена, например:
// var Unit = "2.1";

const totalUnits = 12; // Общее количество юнитов

document.getElementById('vocabulary-option').addEventListener('click', function () {
  document.getElementById('vocabulary-modal').style.display = 'flex';
  document.getElementById('vocabulary-units').style.display = 'block';
  document.getElementById('vocabulary-words').style.display = 'none';

  const vocabularyList = document.getElementById('vocabulary-list');
  const loader = document.getElementById('sceleton-loader-vocabulary');

  loader.style.display = 'flex';
  vocabularyList.innerHTML = '';

  const userGlobalUnit = parseInt(parseFloat(Unit), 10);

  // Убираем setTimeout, сразу загружаем данные
  loader.style.display = 'none';

  for (let i = 1; i <= totalUnits; i++) {
    let status = '';
    if (i < userGlobalUnit) status = 'Unlocked';
    else if (i === userGlobalUnit) status = 'In progress';
    else status = 'Locked';

    const unitDiv = document.createElement('div');
    unitDiv.classList.add('unit-item');
    if (status === 'Locked') unitDiv.classList.add('locked');
    else if (status === 'Unlocked') unitDiv.classList.add('unlocked');
    else if (status === 'In progress') unitDiv.classList.add('inprogress');

    // Добавление иконки и текста статуса
    const unitText = document.createElement('span');
    unitText.innerHTML = `
      <i class="fas ${
        status === 'Unlocked' ? 'fa-unlock' :
        status === 'In progress' ? 'fa-hourglass-half' :
        'fa-lock'
      }" style="margin-right: 8px;"></i>
      Unit ${i} - ${status}
    `;
    unitDiv.appendChild(unitText);

    // Кнопка для открытия юнита
    if (status !== 'Locked') {
      const btn = document.createElement('button');
      btn.classList.add('icon-button');
      btn.title = 'Open Unit';
      btn.innerHTML = '<i class="fas fa-chevron-right"></i>';

      btn.addEventListener('click', () => {
        // Сохраняем исходную иконку для последующего восстановления
        const originalIcon = '<i class="fas fa-chevron-right"></i>';

        // Заменяем содержимое кнопки на спиннер с новым классом open-unit-loader
        btn.innerHTML = '<div class="open-unit-loader"><div></div><div></div><div></div></div>';

        fetch(`/vocabulary/${i}`)
          .then(resp => resp.json())
          .then(wordsData => {
            document.getElementById('vocabulary-units').style.display = 'none';
            document.getElementById('vocabulary-words').style.display = 'block';
            document.getElementById('word-header').textContent = `Unit ${i} Words`;
            renderWords(wordsData.words);

            // Возвращаем исходную иконку после загрузки
            btn.innerHTML = originalIcon;
          })
          .catch(err => {
            console.error(err);
            // При возникновении ошибки также возвращаем исходную иконку
            btn.innerHTML = originalIcon;
          });
      });

      unitDiv.appendChild(btn);
    }

    vocabularyList.appendChild(unitDiv);
  }
});

let selectedVoice = null;

window.speechSynthesis.onvoiceschanged = () => {
  const voices = speechSynthesis.getVoices();

  // Пробуем найти Microsoft David
  selectedVoice = voices.find(v =>
    v.name === 'Microsoft David - English (United States)'
  );

  // Если David не найден — fallback на любой английский
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith('en')) || null;
  }
};

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = selectedVoice;
  utterance.lang = 'en-US';
  utterance.rate = 0.95; // немного медленнее, можно изменить
  speechSynthesis.speak(utterance);
}


function renderWords(words) {
  const wordsContainer = document.getElementById('words-container');
  const searchInput = document.getElementById('word-search');

  if (!searchInput) return; // safety

  // 👇 Функция рендера по отфильтрованному массиву
  function displayWords(filteredWords) {
    wordsContainer.innerHTML = '';

    if (!filteredWords || filteredWords.length === 0) {
      wordsContainer.innerHTML = '<p class="no-exams">No matching words found.</p>';
      return;
    }

    filteredWords.forEach(wordObj => {
      const wordDiv = document.createElement('div');
      wordDiv.classList.add('word-item');

      const speakBtn = document.createElement('button');
      speakBtn.classList.add('speak-button');
      speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      speakBtn.title = `Play pronunciation for "${wordObj.en}"`;
      speakBtn.addEventListener('click', () => speak(wordObj.en));
      wordDiv.appendChild(speakBtn);

      const enWord = document.createElement('div');
      enWord.classList.add('word-en');
      enWord.textContent = wordObj.en;
      wordDiv.appendChild(enWord);

      const ruWord = document.createElement('div');
      ruWord.classList.add('word-ru');
      ruWord.textContent = wordObj.ru;
      wordDiv.appendChild(ruWord);

      if (wordObj.definition) {
        const definition = document.createElement('div');
        definition.classList.add('word-definition');
        definition.textContent = `Definition: ${wordObj.definition}`;
        wordDiv.appendChild(definition);
      }

      wordsContainer.appendChild(wordDiv);
    });

    // ======= Блок теста (внизу) =======
    const quizPrompt = document.createElement('div');
    quizPrompt.classList.add('unit-item', 'unlocked');

    const promptText = document.createElement('span');
    promptText.innerHTML = `
      <i class="fas fa-brain" style="margin-right: 8px;"></i>
      Do you want to test yourself?
    `;
    quizPrompt.appendChild(promptText);

    const quizBtn = document.createElement('button');
    quizBtn.classList.add('icon-button');
    quizBtn.title = 'Start Quiz';
    quizBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

    quizBtn.addEventListener('click', () => {
      document.getElementById('vocabulary-words').style.display = 'none';
      document.getElementById('vocabulary-quiz').style.display = 'flex';
      startQuiz(words);
    });

    quizPrompt.appendChild(quizBtn);
    wordsContainer.appendChild(quizPrompt);
  }

  // ⌨️ Слушаем изменения в поиске
  searchInput.addEventListener('input', e => {
    const query = e.target.value.toLowerCase();
    const filtered = words.filter(
      w =>
        w.en.toLowerCase().includes(query) ||
        w.ru.toLowerCase().includes(query)
    );
    displayWords(filtered);
  });

  // 🔃 Первоначальный рендер
  displayWords(words);
}



let quizState = {};

function startQuiz(words) {
  quizState.words = words.slice(); // copy
  quizState.current = 0;
  quizState.correct = 0;

  document.getElementById('vocabulary-words').style.display = 'none';
  document.getElementById('vocabulary-quiz').style.display = 'flex';

  showQuizQuestion();
}

function showQuizQuestion() {
  const { words, current } = quizState;
  const wordObj = words[current];

  const wordEl = document.getElementById('quiz-word');
  const ansInput = document.getElementById('quiz-answer');
  const submitBtn = document.getElementById('quiz-submit');
  const feedback = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('quiz-next');

  // Reset UI
  feedback.innerHTML = '';
  feedback.className = 'quiz-feedback';
  ansInput.value = '';
  ansInput.disabled = false;
  submitBtn.disabled = false;
  nextBtn.style.display = 'none';

  wordEl.textContent = wordObj.en;

  // Убираем текст, оставляем иконки на кнопках
  submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
  submitBtn.onclick = () => {
    const guess = ansInput.value.trim().toLowerCase();
    const correct = wordObj.ru.trim().toLowerCase();

    if (guess === correct) {
      feedback.innerHTML = '<i class="fas fa-check-circle" style="color: white;"></i> Correct!';
      feedback.classList.add('correct');
      quizState.correct++;
    } else {
      feedback.innerHTML = `<i class="fas fa-times-circle" style="color: white;"></i> Incorrect. Correct answer: "<strong>${wordObj.ru}</strong>"`;
      feedback.classList.add('incorrect');
    }

    ansInput.disabled = true;
    submitBtn.disabled = true;

    nextBtn.innerHTML = quizState.current < words.length - 1
      ? '<i class="fas fa-arrow-right"></i>'
      : '<i class="fas fa-flag-checkered"></i>';

    nextBtn.style.display = 'inline-flex';
  };

  nextBtn.onclick = () => {
    quizState.current++;
    if (quizState.current < words.length) {
      showQuizQuestion();
    } else {
      finishQuiz();
    }
  };
}

function finishQuiz() {
  const { correct, words } = quizState;

  const feedback = document.getElementById('quiz-feedback');
  const scoreEl = document.getElementById('quiz-score');
  const nextBtn = document.getElementById('quiz-next');
  const restart = document.getElementById('quiz-restart');
  const submitBtn = document.getElementById('quiz-submit');
  const ansInput = document.getElementById('quiz-answer');

  submitBtn.style.display = 'none';
  ansInput.style.display = 'none';
  nextBtn.style.display = 'none';

  // Выводим результат в белом цвете с более ярким шрифтом
  scoreEl.innerHTML = `<i class="fas fa-star"></i> You got <strong>${correct}</strong> out of <strong>${words.length}</strong> correct!`;
  scoreEl.style.display = 'block';

  // Добавляем кнопку для завершения теста
  restart.innerHTML = '<i class="fas fa-undo"></i> End Quiz';
  restart.style.display = 'inline-flex';
  restart.onclick = () => {
    // Back to word list
    document.getElementById('vocabulary-quiz').style.display = 'none';
    document.getElementById('vocabulary-words').style.display = 'block';

    // Reset quiz view
    submitBtn.style.display = 'inline-flex';
    ansInput.style.display = 'block';
    scoreEl.style.display = 'none';
    restart.style.display = 'none';
  };
}


// Назад к юнитам
document.getElementById('back-to-units').addEventListener('click', function () {
  document.getElementById('vocabulary-units').style.display = 'block';
  document.getElementById('vocabulary-words').style.display = 'none';
});

// Закрытие модального окна
document.getElementById('vocabulary-modal-close').addEventListener('click', function () {
  document.getElementById('vocabulary-modal').style.display = 'none';
});

window.addEventListener('click', function (event) {
  const modal = document.getElementById('vocabulary-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// Общее количество юнитов
const totalHomeworkUnits = 12;
// Ожидаем, что глобальная переменная Unit = "1.2" или "3.1" и т.п.
const [maxMajor] = Unit.split('.').map(Number);

const hwOption = document.getElementById('homework-option');
const hwModal  = document.getElementById('homework-modal');
const closeBtn = document.getElementById('homework-modal-close');
const unitsDiv = document.getElementById('homework-units');
const listDiv  = document.getElementById('homework-list');
const loader   = document.getElementById('loader-homework');
const preview  = document.getElementById('homework-preview');
const backBtn  = document.getElementById('back-to-homework-units');
const titleH2  = document.getElementById('homework-title');
const contentD = document.getElementById('homework-content');
const testBtn  = document.getElementById('take-test-button');

hwOption.addEventListener('click', () => {
  hwModal.style.display = 'flex';
  unitsDiv.style.display = 'block';
  preview.style.display = 'none';

  listDiv.innerHTML = '';
  loader.style.display = 'flex';

  // Получаем major часть из Unit ("7.1" -> 7)
  const [maxMajor] = Unit.split('.').map(Number);

  loader.style.display = 'none';

  for (let i = 1; i <= totalHomeworkUnits; i++) {
    const unitStatus =
      i < maxMajor ? 'Done' :
      i === maxMajor ? 'In progress' :
      'Locked';

    const div = document.createElement('div');
    
    // Replace space with hyphen for valid class names
    const statusClass = unitStatus.toLowerCase().replace(' ', '-');  // Fix here

    div.classList.add('unit-item', statusClass);
    div.innerHTML = ` 
      <span>
        <i class="fas ${
          unitStatus === 'Done' ? 'fa-unlock' :
          unitStatus === 'In progress' ? 'fa-hourglass-half' :
          'fa-lock'
        }"></i>
        Unit ${i} - ${unitStatus}
      </span>
    `;

    if (unitStatus !== 'Locked') {
      const btn = document.createElement('button');
      btn.classList.add('icon-button');
      btn.innerHTML = '<i class="fas fa-chevron-right"></i>';
      btn.addEventListener('click', () => openHomeworkUnit(i));
      div.appendChild(btn);
    }

    listDiv.appendChild(div);
  }
});



closeBtn.addEventListener('click', () => {
  hwModal.style.display = 'none';
});
backBtn.addEventListener('click', () => {
  unitsDiv.style.display = 'block';
  preview.style.display = 'none';
});


function openHomeworkUnit(unit) {
  unitsDiv.style.display = 'none';
  preview.style.display = 'block';
  titleH2.textContent = `Unit ${unit}`;

  testBtn.disabled = true;
  testBtn.innerHTML = `
    <div class="open-unit-loader">
      <div></div><div></div><div></div>
    </div>`;

  // Показываем спиннер внутри unit-content
  contentD.innerHTML = `
    <div class="tab-title">Loading Unit ${unit}...</div>
    <div class="unit-content">
      <div class="loading-spinner">
        <div class="lds-spinner">
          <div></div><div></div><div></div><div></div>
          <div></div><div></div><div></div><div></div>
          <div></div><div></div><div></div><div></div>
        </div>
      </div>
    </div>
  `;

  // Проверка статуса выполнения задания
  fetch(`/check_homework_status?username=${currentUser}&unit=${unit}`)
    .then(res => res.json())
    .then(data => {
      const isCompleted = data.isCompleted;

      if (isCompleted) {
        testBtn.disabled = true;
        testBtn.textContent = 'Test completed';
      } else {
        testBtn.disabled = false;
        testBtn.textContent = 'Take a test';
      }

      // Загружаем превью задания
      fetch(`/static/homework/task_preview/Unit${unit}.html`)
        .then(r => r.text())
        .then(html => {
          const titleMatch   = html.match(/<!-- tab-title -->([\s\S]*?)<!-- \/tab-title -->/);
          const contentMatch = html.match(/<!-- content -->([\s\S]*?)<!-- \/content -->/);

          const tabTitle    = titleMatch   ? titleMatch[1].trim()   : `Unit ${unit}`;
          const contentHTML = contentMatch ? contentMatch[1].trim() : html;

          contentD.innerHTML = `
            <div class="tab-title">${tabTitle}</div>
            <div class="unit-content">${contentHTML}</div>
          `;

          if (!isCompleted) {
            testBtn.onclick = () => openHomeworkExam(unit);
          }
        })
        .catch(err => {
          console.error(err);
          contentD.innerHTML = `
            <div class="tab-title">Unit ${unit}</div>
            <div class="unit-content">
              <p class="error">Failed to load preview.</p>
            </div>
          `;
          testBtn.disabled = false;
          testBtn.textContent = 'Take a test';
          testBtn.onclick = () => openHomeworkExam(unit);
        });
    })
    .catch(err => {
      console.error(err);
      testBtn.disabled = false;
      testBtn.textContent = 'Take a test';
      testBtn.onclick = () => openHomeworkExam(unit);
    });
}

async function loadHomeworkQuestions(unit) {
  // Generate a new API key each time, without storing it
  async function generateApiKey() {
    const keyResponse = await fetch('/generate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser })  // Use current user for generating key
    });

    if (!keyResponse.ok) {
      throw new Error('Failed to generate API key');
    }

    const keyData = await keyResponse.json();
    return keyData.api_key;  // Return the newly generated key
  }

  // Function to fetch the homework questions
  async function fetchHomework(apiKey) {
    const response = await fetch(`/api/homework/${unit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    return response;
  }

  let apiKey = await generateApiKey();  // Get a fresh API key

  // Make the initial fetch request
  let response = await fetchHomework(apiKey);

  // Handle expired token
  if (response.status === 401) {
    const data = await response.json();
    if (data.error === 'Token expired') {
      response = await fetchHomework(await generateApiKey());  // Get a new key and retry the request
    }
  }

  // Check for any other errors
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to load questions: ${errorData.error || response.statusText}`);
  }

  return response.json();
}


// — POST them to create_homework_exam instead —
function sendHomeworkExamToServer(questions) {
  return fetch('/create_homework_exam', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ questions })
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) throw new Error(data.error || "Server error");
  });
}

function openHomeworkExam(unit) {
  // 1) Hide the units list, show preview (as before)
  unitsDiv.style.display   = 'none';
  preview.style.display    = 'block';
  titleH2.textContent      = `Unit ${unit}`;

  // 2) Load + send questions
  loadHomeworkQuestions(unit)
    .then(questions => sendHomeworkExamToServer(questions))
    .then(() => showHomeworkExamModal(unit))
    .catch(err => {
      console.error(err);
        showToastNotification(
    `<b>Failed to start test</b> <span style="color:red;">${err || 'Unknown error'}</span>`,
    'error'
  );
    });
}

/**
 * Render one question object into the given container.
 * question: { id, text, type, options?, correct }
 * container: DOM node to append into
 */
function renderQuestion(question, container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'exam-question';
  wrapper.dataset.questionId = question.id;

  // Заголовок (с секцией)
  const title = document.createElement('p');
  const isMainQuestion = Number.isInteger(Number(question.id));
  const titleHTML = isMainQuestion
    ? `<strong class="main-question-number">${question.id}</strong> ${question.text}`
    : `<strong>${question.id}.</strong> ${question.text}`;
  title.innerHTML = titleHTML;
  wrapper.appendChild(title);

  // Вопрос с аудио (listening)
  if (question.type === 'listening') {
    const parentContainer = document.createElement('div');
    parentContainer.className = 'exam-parent-question';

    if (question.text) {
      parentContainer.innerHTML = `<p class="parent-text">${question.text}</p>`;
    }

    parentContainer.innerHTML += `
      <div class="custom-audio-player">
        <button class="custom-play-btn"><i class="fas fa-play"></i></button>
        <div class="custom-audio-waves" data-audio-src="${question.audio}"></div>
        <span class="custom-time-display">0:00 / 0:00</span>
      </div>
    `;

    wrapper.appendChild(parentContainer);
  }

  // Если это секция с под-вопросами
  if (question.subquestions && Array.isArray(question.subquestions)) {
    question.subquestions.forEach((subq) => {
      const subDiv = document.createElement('div');
      subDiv.className = 'exam-subquestion';
      subDiv.dataset.questionId = subq.id;

      const subP = document.createElement('p');
      subP.innerHTML = `<strong>${subq.id}.</strong> ${subq.text}`;
      subDiv.appendChild(subP);

      const instr = document.createElement('div');
      instr.innerHTML = getInstructionForType(subq.type);
      subDiv.appendChild(instr);

      const opts = document.createElement('div');
      opts.className = 'question-options';

      if (subq.type === 'true_false') {
        opts.innerHTML = `
          <input type="radio" name="q${subq.id}" id="true${subq.id}" value="True">
          <label for="true${subq.id}">True</label>
          <input type="radio" name="q${subq.id}" id="false${subq.id}" value="False">
          <label for="false${subq.id}">False</label>
        `;
      }
      else if (subq.type === 'multiple_choice' && Array.isArray(subq.options)) {
        opts.innerHTML = subq.options.map((opt, i) => {
          const optId = `q${subq.id}_opt${i}`;
          return `
            <div class="option-group">
              <input type="radio" name="q${subq.id}" id="${optId}" value="${opt}">
              <label for="${optId}">${opt}</label>
            </div>`;
        }).join('');
      }
      else {
        opts.innerHTML = `<input type="text" name="q${subq.id}" autocomplete="off">`;
      }

      subDiv.appendChild(opts);
      wrapper.appendChild(subDiv);
    });
  } else {
    // Одиночный вопрос
    const instr = document.createElement('div');
    instr.innerHTML = getInstructionForType(question.type);
    wrapper.appendChild(instr);

    const opts = document.createElement('div');
    opts.className = 'question-options';

    if (question.type === 'true_false') {
      opts.innerHTML = `
        <input type="radio" name="q${question.id}" id="true${question.id}" value="True">
        <label for="true${question.id}">True</label>
        <input type="radio" name="q${question.id}" id="false${question.id}" value="False">
        <label for="false${question.id}">False</label>
      `;
    }
    else if (question.type === 'multiple_choice' && Array.isArray(question.options)) {
      opts.innerHTML = question.options.map((opt, i) => {
        const optId = `q${question.id}_opt${i}`;
        return `
          <div class="option-group">
            <input type="radio" name="q${question.id}" id="${optId}" value="${opt}">
            <label for="${optId}">${opt}</label>
          </div>`;
      }).join('');
    }
    else {
      opts.innerHTML = `<input type="text" name="q${question.id}" autocomplete="off">`;
    }

    wrapper.appendChild(opts);
  }

  initAllWavePlayers();
  container.appendChild(wrapper);
}


// Function to hide #examTitle
function hideExamTitle() {
  const examTitle = document.getElementById('examTitles');
  examTitle.classList.add('hidden'); // Add 'hidden' class to hide
}

// Function to show #examTitle
function showExamTitle() {
  const examTitle = document.getElementById('examTitles');
  examTitle.classList.remove('hidden'); // Remove 'hidden' class to show
}

let ChoseUnit = '';

function showHomeworkExamModal(unit) {
  const examModal     = document.getElementById('examModal');
  const examContainer = document.getElementById('examQuestions');
  const finishBtn     = document.getElementById('finishExam');
  const examTimer     = document.getElementById('exam-timer');
  const examHeader    = document.getElementById('examTitle');
  const wrapper = document.getElementById('progressExamLengthWrapper');
	wrapper.style.display = 'none';
	ChoseUnit = unit;

  // Обновляем заголовок экзамена
  const examSubtitle = document.querySelector('.examTitle .exam-subtitle');
  const examTitle = document.querySelector('.examTitle .exam-main-title');
  showExamTitle();

  if (examSubtitle) {
    // Обновляем текст в subtitle
    examSubtitle.textContent = `Unit ${unit}`;
  }

  if (examTitle) {
    // Обновляем текст в main title
    examTitle.textContent = 'Homework';
  }


  // Прячем таймер
  examTimer.style.display = 'none';

  // Очищаем предыдущие вопросы
  examContainer.innerHTML = '';

  // Назначаем обработчик кнопки завершения
  finishBtn.onclick = submitHomeworkAnswers;
  finishBtn.style.display = 'block';

  // Загружаем вопросы с сервера
  fetch(`/get_homework_questions?username=${currentUser}`)
    .then(r => r.json())
    .then(data => {
      if (data.error) throw new Error(data.error);

      initExamSecurity(false); // отключаем античит

      data.questions.forEach(q => renderQuestion(q, examContainer));

      // Показываем модалку
      examModal.style.display = 'flex';

      // Инициализируем все аудиоплееры
      initAllWavePlayers();
    })
    .catch(err => {
      console.error(err);
      alert("Ошибка при загрузке вопросов.");
    });
}
function submitHomeworkAnswers() {
  stopAllAudio();
  backBtn.click();

  const answers = {};
  const finishBtn = document.getElementById('finishExam');
  const loadingSpinner = document.getElementById('loadingFinishExam');

  // Disable button and show spinner
  finishBtn.disabled = true;
  loadingSpinner.style.display = 'block';

  // 1. Сбор всех ответов
  document.querySelectorAll('.exam-question, .exam-subquestion').forEach((questionElem) => {
    let qKey = questionElem.dataset.questionId;
    if (!qKey) {
      const inputElem = questionElem.querySelector('input');
      if (inputElem && inputElem.name && inputElem.name.startsWith('q')) {
        qKey = inputElem.name.substring(1);
      }
    }
    const selectedOption =
      questionElem.querySelector('input:checked') ||
      questionElem.querySelector('input[type="text"]');
    if (qKey && selectedOption && selectedOption.value) {
      answers[`q${qKey}`] = selectedOption.value.trim();
    }
  });

  // Save for review modal
  window.examAnswers = answers;

  // 2. Получаем оригинальные вопросы
  fetch('/get_homework_questions?username=' + currentUser)
    .then(res => res.json())
    .then(data => {
      if (!data.questions) throw new Error('No homework questions found.');

      const examQuestions = data.questions;
      window.examQuestionsData = examQuestions;

      let correct = 0, incorrect = 0, skipped = 0;
      const resultHTML = [];

      // 3. Обработка вопросов и под-вопросов
      examQuestions.forEach((question) => {
        const type = question.type || 'unknown';

        if (question.subquestions && Array.isArray(question.subquestions)) {
          let subCorrect = 0;

          question.subquestions.forEach((subq) => {
            const qid = subq.id;
            const userAns = (answers[`q${qid}`] || '').trim().toLowerCase();
            const correctAns = subq.correct.trim().toLowerCase();

            if (!userAns) {
              skipped++;
            } else if (userAns === correctAns) {
              correct++;
              subCorrect++;
            } else {
              incorrect++;
            }
          });

          resultHTML.push(`
            <div class="collapsible-question" data-type="${type}">
              <div class="question-header">
                <span>Question ${question.id}</span>
                <span class="question-type-label">${type.replace('_', ' ')}</span>
              </div>
              <div class="question-right-section">
                <span class="score-badge">${subCorrect}/${question.subquestions.length}</span>
              </div>
            </div>
          `);
        } else {
          const qid = question.id;
          const userAns = (answers[`q${qid}`] || '').trim().toLowerCase();
          const correctAns = (question.correct || '').trim().toLowerCase();

          let isCorrect = false;
          if (!userAns) {
            skipped++;
          } else if (userAns === correctAns) {
            correct++;
            isCorrect = true;
          } else {
            incorrect++;
          }

          resultHTML.push(`
            <div class="collapsible-question" data-type="${type}">
              <div class="question-header">
                <span>Question ${qid}</span>
                <span class="question-type-label">${type.replace('_', ' ')}</span>
              </div>
              <div class="question-right-section">
                <span class="score-badge">${isCorrect ? '1/1' : '0/1'}</span>
              </div>
              <div class="user-answer">
                <p><strong>Your Answer:</strong> ${userAns || 'No answer'}</p>
                <p><strong>Correct Answer:</strong> ${correctAns}</p>
              </div>
            </div>
          `);
        }
      });

      // 4. Показываем модалку результатов
      const modal = document.getElementById('ExamResultsModal');
      const icon = document.getElementById('resultIcon');
      const subtitle = document.getElementById('examSubtitle');
      const points = document.getElementById('examPoints');
      const container = document.getElementById('examResultsContainer');
      const progressRow = document.querySelector('.progress-row');
      const progressBar = document.getElementById('progressBar');
      const progressText = document.getElementById('progressText');

      const total = correct + incorrect + skipped;
      const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

      icon.className = 'fa-solid fa-graduation-cap';
      subtitle.textContent = `You got ${correct}/${total} correct`;
      points.textContent = ''; // No coins for homework

      // Add detailed results to the modal
      container.innerHTML = resultHTML.join('');
      if (progressRow) progressRow.style.display = 'flex';

      // 5. Анимация прогресс-бара
      progressBar.style.width = '0%';
      progressBar.offsetHeight; // trigger a reflow to reset the width
      progressBar.style.transition = 'none';
      setTimeout(() => {
        progressBar.style.transition = 'width 1s ease-in-out';
        progressBar.style.width = `${percent}%`;
      }, 50);

      let currentText = parseInt(progressText.textContent.replace('%', '')) || 0;
      const interval = setInterval(() => {
        if (currentText < percent) {
          currentText++;
          progressText.textContent = `${currentText}%`;
        } else {
          clearInterval(interval);
        }
      }, 20);

      // Show results modal
      modal.style.display = 'flex';
      loadingSpinner.style.display = 'none';
      finishBtn.disabled = false;

      // 6. Отправка результатов на сервер для сохранения
      const requestData = {
        answers: answers,
        username: currentUser,  // assuming currentUser is globally defined
        unit: ChoseUnit        // use ChoseUnit for the unit
      };

      fetch('/submit_homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }

        // Do something with the response (you can update UI, etc.)
        console.log('Homework submitted successfully', data);
      })
      .catch(err => {
        console.error(err);
        showToastNotification("Error: " + err.message, 'error'); // Show error notification
        loadingSpinner.style.display = 'none';
        finishBtn.disabled = false;
      });

    })
    .catch(err => {
      console.error(err);
      showToastNotification("Error: " + err.message, 'error'); // Show error notification
      loadingSpinner.style.display = 'none';
      finishBtn.disabled = false;
    });
}

// ---- speaking-exam-modal.js ----
function showRecordingStatus(show = true) {
  const overlay = document.querySelector('.microphone-overlay');
  if (!overlay) return;

  // Удалим старую строку, если она есть
  const existingLine = overlay.querySelector('.recording-info-line');
  if (existingLine) existingLine.remove();

  if (show) {
    // Создаем и вставляем строку записи после кнопки микрофона
    const line = document.createElement('div');
    line.className = 'recording-info-line';
    line.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Now your voice is recording.';

    // Вставить строку после кнопки, если она есть
    const recordBtn = overlay.querySelector('.record-btn');
    if (recordBtn) {
      recordBtn.insertAdjacentElement('afterend', line);
    } else {
      overlay.appendChild(line);
    }
  }
}


// Основная функция
const API_BASE = '/api';
const EXAM_STATUS = {
  STARTED: 'started',
  COMPLETED: 'completed',
};
const TOAST_TYPES = {
  ERROR: 'error',
  SUCCESS: 'success',
};

const getModalSkeletonHTML = () => `
  <div class="speaking-header">
    <div>
      <div class="title"><div class="speaking-exam-skeleton skeleton-header-title"></div></div>
      <div class="progress-info"><div class="speaking-exam-skeleton" style="width: 100px; height: 16px; margin-top: 6px; border-radius: 6px;"></div></div>
      <div class="speaking-progress-container" style="margin-top: 12px;">
        <div class="speaking-progress">
          <div class="bar" style="width: 0%;"></div>
        </div>
        <div class="speaking-exam-skeleton" style="width: 40px; height: 16px; border-radius: 6px;"></div>
      </div>
    </div>
    <div style="width: 100px; height: 40px;"><div class="speaking-exam-skeleton" style="width: 100%; height: 100%; border-radius: 12px;"></div></div>
  </div>
  <div class="speaking-body">
    <div class="speaking-exam-skeleton skeleton-body-photo"></div>
  </div>
`;

const getModalContentHTML = ({ gradeIcon, progressText, progressBarWidth, percentageText, closeButtonHtml, recordBtnDisabled }) => `
  <div class="speaking-header">
    <div>
      <div class="title" id="speaking-modal-title">${gradeIcon}Final Exam</div>
      <div class="progress-info">${progressText}</div>
      <div class="speaking-progress-container">
        <div class="speaking-progress">
          <div class="bar" style="width: ${progressBarWidth};"></div>
        </div>
        ${percentageText}
      </div>
    </div>
    ${closeButtonHtml}
  </div>
  <div class="speaking-body">
    <div class="microphone-overlay">
      <button class="record-btn" aria-label="Start or stop recording" ${recordBtnDisabled}>
        <i class="fas fa-microphone fancy-icon"></i>
        <span class="sr-only">Start or stop recording</span>
      </button>
    </div>
    <div class="photo-container">
      <div class="speaking-exam-skeleton skeleton-body-photo"></div>
    </div>
  </div>
`;

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err.name === 'AbortError' ? new Error('Request timed out') : err;
  }
}

// Утилитная функция для конвертации WebM → MP3
async function convertToMP3(chunks) {
  return new Promise((resolve, reject) => {
    if (!window.lamejs) {
      return reject(new Error('lamejs library not loaded'));
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result;
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        const channelData = decoded.getChannelData(0);
        const sampleRate = decoded.sampleRate;

        const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
        const samplesPerFrame = 1152;
        const mp3Data = [];

        for (let i = 0; i < channelData.length; i += samplesPerFrame) {
          const frame = channelData.subarray(i, i + samplesPerFrame);
          const int16 = new Int16Array(frame.length);
          for (let j = 0; j < frame.length; j++) {
            int16[j] = Math.max(-32768, Math.min(32767, frame[j] * 32767));
          }
          const mp3buf = mp3encoder.encodeBuffer(int16);
          if (mp3buf.length) mp3Data.push(mp3buf);
        }
        const tail = mp3encoder.flush();
        if (tail.length) mp3Data.push(tail);

        resolve(new Blob(mp3Data, { type: 'audio/mp3' }));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsArrayBuffer(new Blob(chunks, { type: 'audio/webm' }));
  });
}

async function openSpeakingExamModal() {
  await toggleRulesModal('open');
  const userId = getCurrentUser();
  if (!userId) return showToastNotification('User not logged in', TOAST_TYPES.ERROR);

  document.querySelector('.detailed-questions-review-speaking')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'detailed-questions-review-speaking speaking-exam';
  const modal = document.createElement('div');
  modal.className = 'speaking-exam-modal';
  overlay.appendChild(modal);
  document.getElementById('speaking-exam-details').appendChild(overlay);

  modal.innerHTML = getModalSkeletonHTML();

  // --- статус экзамена ---
  let stJson;
  try {
    const stRes = await fetchWithTimeout(`${API_BASE}/get-status-sp-exam/${userId}`);
    if (!stRes.ok) throw new Error('Failed to fetch exam status');
    stJson = await stRes.json();
  } catch (err) {
    overlay.remove();
    return showToastNotification(`Failed to fetch exam status: ${err.message}`, TOAST_TYPES.ERROR);
  }
  if (stJson.status !== EXAM_STATUS.STARTED && stJson.status !== EXAM_STATUS.COMPLETED) {
    overlay.remove();
    return showToastNotification('Exam not started or completed', TOAST_TYPES.ERROR);
  }

  initExamSecurity(true);
  const isCompleted = stJson.status === EXAM_STATUS.COMPLETED;

  // --- финальная разметка ---
  let gradeIcon = '', progressText = 'Done 0 of 1 parts', progressBarWidth = '0%', percentageText = '';
  let closeButtonHtml = `<button class="finish-btn" aria-label="Finish test">Finish</button>`;
  if (isCompleted) {
    // получили результат
    try {
      initExamSecurity(false);
      const scoreRes = await fetchWithTimeout(`${API_BASE}/get-score-sp-exam/${userId}`);
      if (!scoreRes.ok) throw new Error('Failed to fetch score');
      const { score = 100 } = await scoreRes.json();
      progressText = 'Done 1 of 1 parts';
      progressBarWidth = `${score}%`;
      percentageText = `<span class="percentage">${score}%</span>`;
      closeButtonHtml = `<button class="finish-btn close-btn" aria-label="Close modal"><i class="fas fa-times"></i></button>`;

      const gradeMap = {
        'A+': { icon: 'fas fa-star', class: 'grade-a-plus' },
        'A':  { icon: 'fas fa-thumbs-up', class: 'grade-a' },
        'B':  { icon: 'fas fa-check-circle', class: 'grade-b' },
        'C':  { icon: 'fas fa-exclamation-circle', class: 'grade-c' },
        'D':  { icon: 'fas fa-times-circle', class: 'grade-d' },
      };
      let grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';
      const { icon, class: gradeClass } = gradeMap[grade];
      gradeIcon = `<span class="grade-icon ${gradeClass}" aria-label="Grade ${grade}"><i class="${icon}"></i> ${grade}</span>`;
    } catch (err) {
      initExamSecurity(false);
      showToastNotification(`Failed to fetch score: ${err.message}`, TOAST_TYPES.ERROR);
    }
  }

  modal.innerHTML = getModalContentHTML({
    gradeIcon,
    progressText,
    progressBarWidth,
    percentageText,
    closeButtonHtml,
    recordBtnDisabled: isCompleted ? 'disabled' : ''
  });

  const header = modal.querySelector('.speaking-header');
  const body   = modal.querySelector('.speaking-body');
  const recordBtn = modal.querySelector('.record-btn');
  const finishBtn = modal.querySelector('.finish-btn');

  let recorder = null;
  let audioChunks = [];

  function showRecordingStatus(isRecording) {
    const overlayEl = modal.querySelector('.microphone-overlay');
    let info = overlayEl.querySelector('.recording-info-line');
    if (info) info.remove();
    if (isRecording) {
      info = document.createElement('div');
      info.className = 'recording-info-line';
      info.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Now your voice is recording.';
      recordBtn.insertAdjacentElement('afterend', info);
    }
  }

  // === Image load ===
  (async () => {
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/get-sp-details/${userId}`);
      if (!resp.ok) throw new Error();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Exam photo';
      img.classList.add('loaded');
      img.onclick = () => openMediaViewer(img);
      img.onload = () => URL.revokeObjectURL(url);
      body.querySelector('.skeleton-body-photo').replaceWith(img);
    } catch {
      body.querySelector('.skeleton-body-photo').outerHTML = '<p>Photo not available</p>';
    }
  })();

  // === Recording ===
  const startRecording = async () => {
    if (recorder?.state === 'recording') {
      return showToastNotification('Recording already in progress', TOAST_TYPES.ERROR);
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return showToastNotification('Audio recording not supported', TOAST_TYPES.ERROR);
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorder.ondataavailable = e => audioChunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        recordBtn.classList.remove('recording');
        showRecordingStatus(false);
      };
      recorder.start();
      recordBtn.classList.add('recording');
      showRecordingStatus(true);
    } catch {
      showToastNotification('Could not start recording', TOAST_TYPES.ERROR);
    }
  };

  if (!isCompleted) {
    recordBtn.onclick = startRecording;
    recordBtn.ontouchstart = e => { e.preventDefault(); startRecording(); };
    await startRecording();
    recordBtn.focus();
  } else {
    const closeBtn = modal.querySelector('.close-btn');
if (closeBtn) {
  closeBtn.onclick = () => overlay.remove();
}
    document.addEventListener('keydown', e => e.key === 'Escape' && overlay.remove(), { once: true });
  }

  // === Finish & upload ===
  if (!isCompleted) {
    finishBtn.onclick = async () => {
      if (!confirm('Are you sure you want to submit the exam?')) return;
      if (recorder?.state === 'recording') {
        initExamSecurity(false);
        recorder.stop();
        await new Promise(res => recorder.addEventListener('stop', res, { once: true }));
      }
      if (!audioChunks.length) return showToastNotification('No recording made', TOAST_TYPES.ERROR);

      // Lottie animation
      const animationContainer = document.createElement('div');
      animationContainer.className = 'lottie-container speaking-exam';
      const animationBox = document.createElement('div');
      animationBox.className = 'lottie-box';
      animationContainer.appendChild(animationBox);
      document.body.appendChild(animationContainer);
      finishBtn.style.display = 'none';
      let animation = null;
      try {
        animation = lottie.loadAnimation({
          container: animationBox,
          renderer: 'svg',
          loop:   true,
          autoplay:true,
          path:   '/static/animations/Speaking-Loading.json'
        });
      } catch {
        animationContainer.remove();
        finishBtn.style.display = 'flex';
        return showToastNotification('Error loading animation', TOAST_TYPES.ERROR);
      }

      try {
        // конвертация
        const mp3Blob = await convertToMP3(audioChunks);
        const fd = new FormData();
        fd.append('file', mp3Blob, `${userId}.mp3`);

        const up = await fetchWithTimeout(`${API_BASE}/upload-speaking/${userId}`, {
          method: 'POST',
          body: fd
        });
        if (!up.ok) throw new Error('Upload failed');

        // получить счёт
        const scoreRes = await fetchWithTimeout(`${API_BASE}/get-score-sp-exam/${userId}`);
        if (!scoreRes.ok) throw new Error('Failed to fetch score');
        const { score = 100 } = await scoreRes.json();

        header.querySelector('.progress-info').textContent = 'Done 1 of 1 parts';
        header.querySelector('.speaking-progress-container').innerHTML = `
          <div class="speaking-progress">
            <div class="bar" style="width: ${score}%;"></div>
          </div>
          <span class="percentage">${score}%</span>
        `;

        animation.destroy();
        animationContainer.remove();

        const closeBtnNew = document.createElement('button');
        closeBtnNew.className = 'finish-btn close-btn';
        closeBtnNew.innerHTML = '<i class="fas fa-times"></i>';
        closeBtnNew.setAttribute('aria-label','Close modal');
        header.replaceChild(closeBtnNew, finishBtn);
        closeBtnNew.onclick = () => overlay.remove();

        showToastNotification('Speaking exam submitted', TOAST_TYPES.SUCCESS);
        initExamSecurity(false);

      } catch (err) {
        animation?.destroy();
        animationContainer.remove();
        finishBtn.style.display = 'flex';
        showToastNotification(`Error: ${err.message}`, TOAST_TYPES.ERROR);
      }
    };
  }

  overlay.addEventListener('remove', () => {
    if (recorder?.state === 'recording') {
      recorder.stop();
      initExamSecurity(false);
    }
    document.querySelector('.lottie-container')?.remove();
  });
}

// Привязываем к кнопке Speaking где нужно
document.querySelectorAll('.btn-view-photo').forEach(btn => {
  btn.addEventListener('click', openSpeakingExamModal);
});

// После того, как openSpeakingExamModal определена и подключена:
document.getElementById('speakingExamOption').addEventListener('click', () => {
  openSpeakingExamModal();
});

function openMediaViewer(imgElement) {
  const pictureContainer = imgElement.closest('.picture-images');
  let images, currentIndex;

  if (pictureContainer && pictureContainer.dataset.images) {
    // галерея
    images = JSON.parse(pictureContainer.dataset.images);
    currentIndex = parseInt(imgElement.dataset.index, 10);
  } else {
    // одиночное фото
    images = [imgElement.src];
    currentIndex = 0;
  }

  // Create Media Viewer modal
  const viewer = document.createElement('div');
  viewer.className = 'media-viewer';
  viewer.innerHTML = `
    <button class="close-btn"><i class="fas fa-times"></i></button>
    <button class="nav-btn prev-btn" style="display: ${images.length > 1 ? 'block' : 'none'}">
      <i class="fas fa-chevron-left"></i>
    </button>
    <button class="nav-btn next-btn" style="display: ${images.length > 1 ? 'block' : 'none'}">
      <i class="fas fa-chevron-right"></i>
    </button>
    <img src="${images[currentIndex]}" alt="Media view">
    ${images.length > 1
      ? `<div class="image-counter">${currentIndex + 1} / ${images.length}</div>`
      : ''}
  `;
  document.body.appendChild(viewer);

  // Close
  viewer.querySelector('.close-btn').onclick = () => viewer.remove();

  const navigate = dir => {
    currentIndex = (currentIndex + dir + images.length) % images.length;
    const img = viewer.querySelector('img');
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = images[currentIndex];
      img.style.opacity = '1';
    }, 200);
    const counter = viewer.querySelector('.image-counter');
    if (counter) counter.textContent = `${currentIndex + 1} / ${images.length}`;
  };
  viewer.querySelector('.prev-btn').onclick = () => navigate(-1);
  viewer.querySelector('.next-btn').onclick = () => navigate(1);

  const onKey = e => {
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'Escape') viewer.remove();
  };
  document.addEventListener('keydown', onKey);
  viewer.addEventListener('remove', () => document.removeEventListener('keydown', onKey));
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('openExamTask') === 'true') {
    // Тригерим клик по нужной опции
    document.getElementById('examTaskOption')?.click();
  }
});
