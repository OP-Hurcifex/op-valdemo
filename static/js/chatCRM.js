        const socket = io(); // Подключаемся к серверу через Socket.IO
        const releaseUpdateButton = document.getElementById('releaseUpdateButton');
        const currentVersionElement = document.getElementById('currentVersion');
        const modal = document.getElementById('updateModal');
        const modalVersionElement = document.getElementById('modalVersion');
        const closeModalButton = document.getElementById('closeModalButton');

const navItems = document.querySelectorAll('.nav-item'); // Все элементы навигации
const contentSections = document.querySelectorAll('.content-section'); // Все секции контента

// Получаем элементы для спиннера и iframe
const chatSpinner = document.getElementById('chatSpinner');
const chatIframe = document.getElementById('chatIframe');

const addCoinsButton = document.getElementById('addCoinsButton');
const getBalanceButton = document.getElementById('getBalanceButton');
const usernameInput = document.getElementById('username');
const coinsInput = document.getElementById('coins');
const balanceUsernameInput = document.getElementById('balanceUsername');
const coinsMessage = document.getElementById('coinsMessage');
const balanceMessage = document.getElementById('balanceMessage');
const currentBalanceElement = document.getElementById('currentBalance');

// Обработка нажатия кнопки "Add Coins"
addCoinsButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const coins = parseInt(coinsInput.value);

    if (username && coins > 0) {
        // Отправляем запрос на сервер через Socket.IO
        socket.emit('add_coins', { username, coins });

        // Анимация на кнопке
        addCoinsButton.classList.add('clicked');

        // Скрыть сообщение баланса и показать сообщение об успешном добавлении
        balanceMessage.style.display = 'none';
        coinsMessage.style.display = 'inline-block';

        // Сброс поля ввода
        usernameInput.value = '';
        coinsInput.value = '';
    } else {
        alert("Please enter a valid username and coin amount.");
    }
});

// Обработка нажатия кнопки "Get Balance"
getBalanceButton.addEventListener('click', () => {
    const username = balanceUsernameInput.value.trim();

    if (username) {
        // Отправляем запрос на сервер через Socket.IO
        socket.emit('get_balance', username);

        // Скрываем сообщение об успешном добавлении и показываем сообщение о балансе
        coinsMessage.style.display = 'none';
        balanceMessage.style.display = 'inline-block';
    } else {
        alert("Please enter a valid username.");
    }
});

socket.on('coins_added', (data) => {
    if (data.success) {
        coinsMessage.textContent = `Coins added successfully to ${data.username}!`;

        // После успешного добавления монет обновляем баланс пользователя
        currentBalanceElement.textContent = data.coins;
        balanceMessage.style.display = 'inline-block';
    } else {
        coinsMessage.textContent = `Error: ${data.message}`;
    }
});

// Обработка ответа от сервера для получения баланса
socket.on('balance', (data) => {
    if (data.success) {
        balanceMessage.style.display = 'inline-block';
        currentBalanceElement.textContent = data.coins;
    } else {
        alert('User not found.');
    }
});


navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Снимаем "active" с предыдущей активной кнопки
        document.querySelector('.nav-item.active').classList.remove('active');
        item.classList.add('active');

        // Снимаем active класс с текущей активной секции
        const currentActiveSection = document.querySelector('.content-section.active');
        if (currentActiveSection) {
            currentActiveSection.classList.remove('active');
        }

        const targetSection = document.getElementById(item.dataset.section);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        if (item.dataset.section === "chat") {
            chatSpinner.style.display = 'inline-block';
            chatIframe.style.display = 'none';

            chatIframe.src = "/chat";

            // Обработчик события onload для iframe
            chatIframe.onload = () => {
                chatSpinner.style.display = 'none';
                chatIframe.style.display = 'block';
                chatIframe.onload = null; // Отключаем обработчик, чтобы не сработал повторно
            };
        } else if (item.dataset.section === "ban") {
            coinsMessage.style.display = 'none';
            balanceMessage.style.display = 'none';
            banMessage.style.display = 'none';
        }
    });
});
const banUsernameInput = document.getElementById('banUsername');
const banButton = document.getElementById('banButton');
const banMessage = document.getElementById('banMessage');

banButton.addEventListener('click', () => {
    const username = banUsernameInput.value.trim();

    if (username) {
        socket.emit('ban_user', username);
        banUsernameInput.value = ''; // Очищаем поле ввода
        coinsMessage.style.display = 'none';
        balanceMessage.style.display = 'none';
        banMessage.style.display = 'block';
    } else {
        alert("Please enter a username to ban.");
    }
});

 document.addEventListener('DOMContentLoaded', function() {
      const sliderContainer = document.getElementById('startExamSliderContainer');
      const sliderHandle = document.getElementById('startExamSliderHandle');
      const sliderText = document.getElementById('sliderText');

      let isDragging = false;
      let sliderStartX = 0;
      let handleStartX = 0;

      // Начало перетаскивания
      sliderHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        sliderStartX = sliderContainer.getBoundingClientRect().left;
        handleStartX = e.clientX - sliderHandle.offsetLeft;
        // Отключаем плавный переход, чтобы ручка двигалась без задержки
        sliderHandle.style.transition = 'none';
      });

      // Процесс перетаскивания
      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const containerWidth = sliderContainer.offsetWidth;
        const handleWidth = sliderHandle.offsetWidth;
        let newPosition = e.clientX - sliderStartX - handleStartX;

        // Не даём выйти за границы
        if (newPosition < 0) newPosition = 0;
        if (newPosition > containerWidth - handleWidth) {
          newPosition = containerWidth - handleWidth;
        }

        sliderHandle.style.left = newPosition + 'px';
      });

      // Окончание перетаскивания
      document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;

        // Включаем анимацию возврата/завершения
        sliderHandle.style.transition = 'left 0.4s ease';

        const containerWidth = sliderContainer.offsetWidth;
        const handleWidth = sliderHandle.offsetWidth;
        const slideThreshold = (containerWidth - handleWidth) * 0.8;

        // Если перетянули достаточно вправо – засчитываем «подтверждение»
        if (sliderHandle.offsetLeft >= slideThreshold) {
          sliderContainer.classList.add('active');
          sliderHandle.classList.add('active');
          sliderHandle.style.left = (containerWidth - handleWidth) + 'px';

          // Сначала плавно убираем старый текст
          sliderText.classList.remove('fade-in');
          sliderText.classList.add('fade-out');

          // По окончании анимации fadeOut меняем текст на "Confirmed!" и анимируем появление
          setTimeout(() => {
            sliderText.innerText = 'Confirmed!';
			initializeExamTime();
            sliderText.classList.remove('fade-out');
            sliderText.classList.add('fade-in');

            // Меняем иконку на галочку
            const icon = sliderHandle.querySelector('i');
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-check');

            // Пример запроса (если нужно что-то вызывать)
            fetch('/api/start-exam', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
            })
            .then(response => response.json())
            .then(data => {
			  showToastNotification('<b>Successfully exam started</b> <span>Time to shine! ✨</span>', "success", 4000);
              fetchAndRenderExamQuestions();
            })
            .catch(error => {
              showToastNotification('<b>Oops! Something went wrong</b> <span>' + (error.message || 'Please try again later.') + '</span>', 'error', 5000);
              // При ошибке тоже сброс
              resetSlider();
            });
          }, 300); // Ждём окончания fadeOut (0.3s)

        } else {
          // Иначе – сбрасываем слайдер в исходное положение
          resetSlider();
        }
      });


    });
	
	      // Функция сброса слайдера в исходное состояние
      function resetSlider() {
        sliderHandle.style.left = '0';
        sliderContainer.classList.remove('active');
        sliderHandle.classList.remove('active');

        // Убираем текущую анимацию
        sliderText.classList.remove('fade-in', 'fade-out');

        // Запускаем анимацию исчезновения (если хотим красиво скрыть)
        sliderText.classList.add('fade-out');
        setTimeout(() => {
          // Возвращаем текст
          sliderText.innerText = 'Slide to start the exam';
          sliderText.classList.remove('fade-out');
          // Анимируем появление
          sliderText.classList.add('fade-in');

          // Возвращаем иконку стрелочки
          const icon = sliderHandle.querySelector('i');
          icon.classList.remove('fa-check');
          icon.classList.add('fa-chevron-right');
        }, 300);
      }
	
document.addEventListener('DOMContentLoaded', () => {
  initializeExamTime();
});

function initializeExamTime() {
  // Кэширование элементов DOM
  const examResultsDisplay = document.getElementById('examResultsDisplay');
  const timeValue = document.getElementById('timeValue');
  let localRemainingSeconds = 0;
  let timerInterval = null;

  // Запуск всех необходимых процессов
  fetchExamResults();
  initializeRemainingTime();

  // Если интервал уже установлен, очищаем его чтобы избежать дублирования
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerInterval = setInterval(decrementTime, 1000);
  
socket.on('update-results', function() {
fetchExamResults();
});

async function fetchExamResults() {
  try {
    // Показать скелетон до загрузки
examResultsDisplay.innerHTML = `
  <table class="exam-results-skeleton">
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Score</th>
        <th>Grade</th>
      </tr>
    </thead>
    <tbody>
      ${Array(5).fill(`
        <tr>
          <td><div class="skeleton name"></div></td>
          <td><div class="skeleton status"></div></td>
          <td><div class="skeleton score"></div></td>
          <td><div class="skeleton grade"></div></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
`;


    const response = await fetch('/api/get_exam_results');
    const data = await response.json();

    if (data.error) {
      console.error(`Error: ${data.error}`);
      examResultsDisplay.innerHTML = '<p>Error loading exam results.</p>';
      return;
    }

    if (Object.entries(data).length === 0) {
      examResultsDisplay.innerHTML = '<p>No one has passed the exam yet.</p>';
      return;
    }

    const tableHeader = `
      <table class="exam-results-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Score</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
    `;

    const tableRows = Object.entries(data)
      .map(([userName, userInfo]) => {
        const grade =
          userInfo.correct_percentage >= 80
            ? 'Excellent'
            : userInfo.correct_percentage >= 51
            ? 'Average'
            : 'Poor';
        const status = userInfo.correct_percentage >= 80 ? 'Passed' : 'Failed';
        const formattedPercentage = userInfo.correct_percentage.toFixed(2);

        return `
          <tr>
            <td>${userName}</td>
            <td><span class="status ${status.toLowerCase()}">${status}</span></td>
            <td>${userInfo.correct}/${userInfo.total_questions} (${formattedPercentage}%)</td>
            <td>${grade}</td>
          </tr>
        `;
      })
      .join('');

    const tableFooter = `
        </tbody>
      </table>
    `;

    // Заменить скелетон на реальные данные
    examResultsDisplay.innerHTML = tableHeader + tableRows + tableFooter;
  } catch (error) {
    console.error('Error fetching exam results:', error);
    examResultsDisplay.innerHTML = '<p>Error loading exam results.</p>';
  }
}

  async function initializeRemainingTime() {
    try {
      const response = await fetch('/get_remaining_time');
      const data = await response.json();

      if (data.remaining_time !== undefined) {
        localRemainingSeconds = Math.floor(data.remaining_time);
        updateTimerDisplayFromSeconds(localRemainingSeconds);
      } else if (data.error) {
        timeValue.textContent = data.error;
      }
    } catch (error) {
      console.error('Error fetching remaining time:', error);
    }
  }

  function decrementTime() {
    if (localRemainingSeconds > 0) {
      localRemainingSeconds--;
      updateTimerDisplayFromSeconds(localRemainingSeconds);
    }
  }

  function updateTimerDisplayFromSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
	
	if (totalSeconds === 0) {
    resetSlider();
	}
	
    timeValue.innerHTML = `
      <div class="timer-container">
        <div class="timer-box"><span class="time">${hours}</span><span class="label">Hours</span></div>
        <div class="timer-box"><span class="time">${minutes}</span><span class="label">Minutes</span></div>
        <div class="timer-box"><span class="time">${seconds}</span><span class="label">Seconds</span></div>
      </div>
    `;
  }
}


  /* ===== Пример простой логики для слайдера (если нужна) ===== */
  const sliderContainer = document.getElementById('startExamSliderContainer');
  const sliderHandle = document.getElementById('startExamSliderHandle');
  let isDragging = false;

  sliderHandle.addEventListener('mousedown', () => {
    isDragging = true;
    sliderContainer.classList.add('active');
    sliderHandle.classList.add('active');
  });
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      // Возвращаем ручку в начальное положение
      sliderHandle.style.left = '0px';
      sliderContainer.classList.remove('active');
      sliderHandle.classList.remove('active');
    }
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const containerRect = sliderContainer.getBoundingClientRect();
    let newLeft = e.clientX - containerRect.left - (sliderHandle.offsetWidth / 2);
    // Ограничиваем перемещение ручки
    newLeft = Math.max(0, Math.min(newLeft, containerRect.width - sliderHandle.offsetWidth));
    sliderHandle.style.left = newLeft + 'px';
  });

const timeline = document.getElementById('timeline');

// Функция для добавления версии в временную шкалу
function addVersionToTimeline(version, date, description, isActive = false) {
    const timelineItem = document.createElement('div');
    timelineItem.classList.add('timeline-item');

    if (isActive) {
        timelineItem.classList.add('active');
    }

    // Добавление элементов в временной шкале
    const versionTitle = document.createElement('div');
    versionTitle.classList.add('version-title');
    versionTitle.textContent = version;

    const versionDate = document.createElement('div');
    versionDate.classList.add('version-date');
    versionDate.textContent = date;

    const versionDesc = document.createElement('div');
    versionDesc.classList.add('version-desc');
    versionDesc.textContent = description;

    // Составляем элемент временной шкалы
    timelineItem.appendChild(versionTitle);
    timelineItem.appendChild(versionDate);
    timelineItem.appendChild(versionDesc);

    // Делаем старые элементы неактивными
    const items = timeline.querySelectorAll('.timeline-item');
    items.forEach(item => {
        item.classList.remove('active');
        item.classList.add('inactive');
    });

    // Добавляем новый элемент с анимацией
    timelineItem.style.opacity = '0';
    timeline.appendChild(timelineItem);

    setTimeout(() => {
        timelineItem.style.opacity = '1';
        timelineItem.style.transform = 'translateY(0)';
    }, 100);
}

// Обработка нажатия кнопки "Release Update"
releaseUpdateButton.addEventListener('click', () => {
    fetch('/release-update', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentVersionElement.textContent = data.version;
                console.log(`Update released: ${data.version}`);

                // Добавляем новую версию в временную шкалу
                addVersionToTimeline(
                    data.version,
                    new Date().toLocaleDateString(),
                    data.description || 'No additional information',
                    true
                );
            }
        })
        .catch(err => console.error('Error releasing update:', err));
});

// Получение текущей версии при подключении
socket.on('currentVersion', (data) => {
    currentVersionElement.textContent = data.version;

    // Очищаем временную шкалу и добавляем все версии
    timeline.innerHTML = '';
    data.versions.forEach(({ version, date, description }) => {
        addVersionToTimeline(
            version,
            date || new Date().toLocaleDateString(),
            description || 'No additional information',
            version === data.version
        );
    });
});

// Функция для обновления select с правильными ответами
function updateCorrectAnswerSelect(questionBlock) {
    const optionsInputs = questionBlock.querySelectorAll('.option');
    const correctAnswerSelect = questionBlock.querySelector('.correct-answer');

    correctAnswerSelect.innerHTML = `<option value='' disabled selected>Select correct answer</option>`;

    optionsInputs.forEach(input => {
        input.addEventListener('input', function () {
            correctAnswerSelect.innerHTML = `<option value='' disabled selected>Select correct answer</option>`;
            optionsInputs.forEach(opt => {
                if (opt.value.trim() !== '') {
                    let optionElement = document.createElement('option');
                    optionElement.value = opt.value;
                    optionElement.innerText = opt.value;
                    correctAnswerSelect.appendChild(optionElement);
                }
            });
        });
    });
}

// Clear the exam creation form
function clearExamForm() {
    document.getElementById('exam-form').innerHTML = '';
    document.getElementById('question-type').value = 'multiple_choice'; // Reset to default
}

document.querySelector(".nav-item[data-section='exam-results']").addEventListener('click', function() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContainer = document.getElementById('examResultsContainer');
    loadingIndicator.style.display = 'block';  // Показываем индикатор
    resultsContainer.style.display = 'none';
    
    fetch('/api/get_exam_results', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        const resultsContainer = document.getElementById('examResultsContainer');
        resultsContainer.innerHTML = ''; // Clear previous results

        // Iterate through the user results (e.g. sdsda, etc.)
        for (let username in data) {
            if (data.hasOwnProperty(username)) {
                const result = data[username]; // Get results for each user

                const resultElement = document.createElement('div');
                resultElement.classList.add('exam-result');
                resultElement.innerHTML = `
    <div class="exam-result-summary">
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Correct Answers:</strong> ${result.correct}</p>
        <p><strong>Incorrect Answers:</strong> ${result.incorrect}</p>
        <p><strong>Skipped Answers:</strong> ${result.skipped}</p>
        <p><strong>Total Questions:</strong> ${result.total_questions}</p>
        <p><strong>Correct Percentage:</strong> ${result.correct_percentage}%</p>
        <p><strong>Rewarded:</strong> ${result.rewarded ? 'Yes' : 'No'}</p>
        <p><strong>Coins:</strong> ${result.coins}</p>
        <button class="toggle-details"><span class="icon">⬇️</span> Show Details</button>
        <div class="details" style="display: none;">
            <h3>Details of Results:</h3>
        </div>
    </div>
    <hr/>
`;

                // Add the detailed results for each question
                result.results.forEach((questionResult, index) => {
                    let questionHtml = `<p><strong>Question:</strong> ${questionResult.question}</p>`;

                    const userAnswer = questionResult.user_answer;
                    const correctAnswer = questionResult.correct_answer;
                    const isCorrect = questionResult.is_correct;
                    let resultClass = isCorrect ? 'correct' : 'incorrect';

                    if (questionResult.question_type === 'true_false') {
                        questionHtml += `
                            <input type="radio" name="q${index}" value="True" id="true${index}" ${userAnswer === 'True' ? 'checked' : ''}>
                            <label for="true${index}">True</label>
                            <input type="radio" name="q${index}" value="False" id="false${index}" ${userAnswer === 'False' ? 'checked' : ''}>
                            <label for="false${index}">False</label>
                        `;
                    } else if (questionResult.question_type === 'multiple_choice' && Array.isArray(questionResult.options)) {
                        // For multiple choice, show the selected answer as an input
                        questionHtml += `
                            <input type="text" value="${userAnswer || ''}" style="pointer-events: none;" readonly/>
                        `;
                    } else if (['fill_gaps', 'unscramble', 'reading', 'listening'].includes(questionResult.question_type)) {
                        questionHtml += `
                            <input type="text" name="q${index}" style="pointer-events: none;" autocomplete="off" spellcheck="false" value="${userAnswer || ''}">
                        `;
                    }

                    // Add a result indicator for each question
                    questionHtml += `
                        <p class="${resultClass}">Your answer: ${userAnswer || 'No answer provided'} ${isCorrect ? '(Correct)' : '(Incorrect)'}</p>
                        <p><strong>Correct Answer:</strong> ${correctAnswer}</p>
                    `;

                    // Add the question HTML to the results container
                    resultElement.querySelector('.details').innerHTML += `
                        <div class="question-result">
                            ${questionHtml}
                        </div>
                    `;
                });

                // Add toggle functionality for details
                resultElement.querySelector('.toggle-details').addEventListener('click', function() {
                    const details = resultElement.querySelector('.details');
                    const button = resultElement.querySelector('.toggle-details');
                    const icon = button.querySelector('.icon');
                    if (details.style.display === 'none') {
                        details.style.display = 'block';
                        button.textContent = 'Hide Details';
                    } else {
                        details.style.display = 'none';
                        button.textContent = 'Show Details';
                    }
                });

                // Append the user result to the container
                resultsContainer.appendChild(resultElement);
            }
        }

        // If no results, show a message
        if (resultsContainer.innerHTML === '') {
            resultsContainer.innerHTML = '<p>No results available.</p>';
        }
        loadingIndicator.style.display = 'none';
        resultsContainer.style.display = 'block';
    })
    .catch(error => console.error('Error fetching exam results:', error));
});




// Обработчик для добавления события клика на каждый элемент навигации
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener('click', function() {
        // Убираем активный класс у всех элементов
        document.querySelectorAll(".nav-item").forEach(navItem => navItem.classList.remove('active'));
        
        // Добавляем активный класс к выбранному элементу
        item.classList.add('active');

        // Сохраняем выбранную секцию в localStorage
        localStorage.setItem('selectedSection', item.getAttribute('data-section'));
    });
});

// При загрузке страницы восстанавливаем выбранную секцию и симулируем клик
window.addEventListener('load', () => {
    const savedSection = localStorage.getItem('selectedSection');
    
    if (savedSection) {
        // Находим элемент по data-section и делаем его активным
        const activeNavItem = document.querySelector(`.nav-item[data-section='${savedSection}']`);
        if (activeNavItem) {
            // Симулируем клик по восстановленному элементу
            activeNavItem.classList.add('active'); // добавляем активный класс вручную
            activeNavItem.click(); // искусственный клик
        }
    }
});

const updateProgressButton = document.getElementById('update-progress-button');
const studentNameInput = document.getElementById('student-name');
const progressInput = document.getElementById('progress-input');
const startDateInput = document.getElementById('start-date-input'); // Reference to start date input field

// Обработчик клика по кнопке обновления прогресса
updateProgressButton.addEventListener('click', () => {
    const username = studentNameInput.value.trim();
    const progress = parseInt(progressInput.value);
    const startDate = startDateInput.value; // Get the start date value from input field

    if (username && !isNaN(progress)) {
        const requestBody = { username, progress };
        
        // Если start_date не пустое, добавляем его в тело запроса
        if (startDate) {
            requestBody.start_date = startDate;
        }

        fetch('/api/update-student-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody) // Отправляем только то, что есть
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Progress updated successfully!');
            } else {
                alert('Error updating progress');
            }
        })
        .catch(error => console.error('Error updating progress:', error));
    } else {
        alert('Please enter a valid username and progress');
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    const studentSelect = document.getElementById("student-select");
    const tableBody = document.querySelector("#roadmap-table tbody");

    async function fetchStudents() {
        try {
            const response = await fetch("/api/get-student-names");
            const data = await response.json();

            studentSelect.innerHTML = '<option value="">🎓 Select Student</option>';
            data.students.forEach(student => {
                studentSelect.innerHTML += `<option value="${student}">${student}</option>`;
            });
        } catch (error) {
            console.error("Error loading students:", error);
        }
    }

    async function fetchStudentProgress(username) {
        try {
            const response = await fetch(`/api/get-student-progress?username=${username}`);
            const data = await response.json();
            return data[username] || null;
        } catch (error) {
            console.error("Error fetching progress:", error);
            return null;
        }
    }

    function calculateExamDate(startDate, studyDays, targetUnit) {
        let tempDate = new Date(startDate);
        const oddDays = [1, 3, 5];
        const evenDays = [2, 4, 6];
        const allowedDays = studyDays === "even" ? evenDays : oddDays;

        // Устанавливаем первый учебный день
        while (!allowedDays.includes(tempDate.getDay())) {
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // Рассчитываем общее количество учебных дней до целевого юнита
        const [targetWeek, targetDay] = targetUnit.split('.').map(Number);
        const targetStudyDays = (targetWeek - 1) * 3 + targetDay;

        let studyDaysElapsed = 0;
        while (studyDaysElapsed < targetStudyDays) {
            if (allowedDays.includes(tempDate.getDay())) {
                studyDaysElapsed++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }

        return tempDate.toISOString().split('T')[0];
    }

    function generateRoadmap(startDate, studyDays) {
        let units = [];
        let tempDate = new Date(startDate);
        const oddDays = [1, 3, 5];
        const evenDays = [2, 4, 6];
        const allowedDays = studyDays === "even" ? evenDays : oddDays;

        // Устанавливаем первый учебный день
        while (!allowedDays.includes(tempDate.getDay())) {
            tempDate.setDate(tempDate.getDate() + 1);
        }

        for (let week = 1; week <= 12; week++) {
            for (let day = 1; day <= 3; day++) {
                const unitName = `${week}.${day}`;
                const unitDate = new Date(tempDate);
                const formattedDate = unitDate.toISOString().split('T')[0];
                const isPast = unitDate < new Date() ? `<i class="fa-solid fa-check-circle completed"></i>` : "";

                units.push({ 
                    unit: unitName, 
                    lesson_date: formattedDate, 
                    status: isPast, 
                    week: week, 
                    progress: isPast ? "Completed" : "Pending" 
                });

                // Переход к следующему разрешённому дню
                do {
                    tempDate.setDate(tempDate.getDate() + 1);
                } while (!allowedDays.includes(tempDate.getDay()));
            }
        }

        return units;
    }

async function updateRoadmap(username) {
    const loader = document.getElementById("loader");
    const roadmapTable = document.getElementById("roadmap-table");
    const tableBody = roadmapTable.querySelector("tbody");

    // Показываем загрузку, скрываем таблицу
    loader.style.display = "block";
    roadmapTable.style.display = "none";

    tableBody.innerHTML = "";
    const studentData = await fetchStudentProgress(username);
    if (!studentData) {
        loader.style.display = "none";
        return;
    }

    const { start_date, study_days } = studentData;
    const roadmap = generateRoadmap(start_date, study_days);

    roadmap.forEach(entry => {
        const row = `<tr>
            <td><i class="fa-solid fa-book"></i> ${entry.unit}</td>
            <td><i class="fa-solid fa-calendar-days"></i> ${entry.lesson_date} ${entry.status}</td>
            <td>${entry.week}</td>
            <td>${entry.progress}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    const midExamDate = calculateExamDate(start_date, study_days, "6.3");
    const finalExamDate = calculateExamDate(start_date, study_days, "12.3");

    tableBody.innerHTML += `
        <tr class="exam-row"><td colspan="4"><i class="fa-solid fa-pen"></i> Mid Exam: ${midExamDate}</td></tr>
        <tr class="exam-row"><td colspan="4"><i class="fa-solid fa-graduation-cap"></i> Final Exam: ${finalExamDate}</td></tr>
    `;

    // Скрываем загрузку, показываем таблицу
    loader.style.display = "none";
    roadmapTable.style.display = "table";
}


    studentSelect.addEventListener("change", function () {
        if (this.value) {
            updateRoadmap(this.value);
        }
    });

    fetchStudents();
});

function handleTempBanClick(event) {
  event.preventDefault(); // Если кнопка находится в форме, предотвращает отправку

  const username = document.getElementById("tempBanUsername").value.trim();
  const duration = parseInt(document.getElementById("tempBanDuration").value, 10) || 30;
  const tempBanMessage = document.getElementById("tempBanMessage");

  if (!username) {
    tempBanMessage.textContent = "Please enter a username for temporary ban.";
    tempBanMessage.style.display = "block";
    return;
  }
  tempBanMessage.style.display = "none";

  // Отправляем через socket событие временного бана
socket.emit("tempBanUser", { username, duration });
  
  // Для тестирования можно вызвать функцию blockUser напрямую:
  // blockUser(duration);
  
  console.log(`Temporary ban triggered for ${username} for ${duration} seconds`);
}

document.getElementById("tempBanButton").addEventListener("click", handleTempBanClick);

// Обработчик клика для отправки события разблокировки через socket
function handleUnblockClick(event) {
  event.preventDefault();
  // Отправляем запрос на разблокировку через socket
  socket.emit("unblockUserRequest", {});
  console.log("Unblock request sent to server.");
}

// Добавляем обработчик на кнопку разблокировки
document.getElementById("unblockButton").addEventListener("click", handleUnblockClick);

// Функция для форматирования времени (секунды в формат мм:сс)
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${sec}`;
}

// Функция инициализации аудиоплееров
function initAudioPlayers() {
  const audioPlayers = document.querySelectorAll('.custom-audio-player');
  audioPlayers.forEach(player => {
    const audioSrc = player.getAttribute('data-audio-src');
    
    // Создаем кнопку воспроизведения и устанавливаем для неё id
    const playBtn = document.createElement('button');
    playBtn.id = "custom-play-btn"; // установка id для применения стилей #custom-play-btn
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    
    // Создаем контейнер для полосы прогресса (волны)
    const wavesContainer = document.createElement('div');
    wavesContainer.classList.add('custom-audio-waves');
    wavesContainer.setAttribute('data-audio-src', audioSrc);
    
    // Создаем дисплей времени
    const timeDisplay = document.createElement('span');
    timeDisplay.classList.add('custom-time-display');
    timeDisplay.textContent = '0:00';
    
    // Очищаем содержимое плеера и вставляем созданные элементы
    player.innerHTML = ''; 
    player.appendChild(playBtn);
    player.appendChild(wavesContainer);
    player.appendChild(timeDisplay);

    // Создаем аудио элемент
    const audioEl = document.createElement('audio');
    audioEl.src = audioSrc;
    audioEl.controls = false;
    wavesContainer.appendChild(audioEl);

    // Создаем элемент для прогресса
    const progressEl = document.createElement('div');
    progressEl.className = 'progress';
    wavesContainer.appendChild(progressEl);

    // Инициализация дисплея времени
    audioEl.addEventListener('loadedmetadata', () => {
      timeDisplay.textContent = '0:00';
    });

    // Обработчик кнопки воспроизведения
    playBtn.addEventListener('click', () => {
      if (audioEl.paused) {
        audioEl.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        audioEl.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    });

    // Обновление прогресса и времени
    audioEl.addEventListener('timeupdate', () => {
      if (audioEl.duration) {
        const progressPercent = (audioEl.currentTime / audioEl.duration) * 100;
        progressEl.style.width = `${progressPercent}%`;
        timeDisplay.textContent = formatTime(audioEl.currentTime);
      }
    });

    // Перемотка при клике по полосе
    wavesContainer.addEventListener('click', (e) => {
      // Если кликнули по кнопке, не обрабатываем
      if (e.target.closest('#custom-play-btn')) return;
      const rect = wavesContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * audioEl.duration;
      audioEl.currentTime = newTime;
    });

    // По окончании трека возвращаем кнопку в состояние "play"
    audioEl.addEventListener('ended', () => {
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
  });
}


// Функция для отрисовки вопросов экзамена – показываем только вопросы с audio_Exam и выводим только ID
function renderExamQuestions(questions) {
  const container = document.getElementById('examQuestionsContainer');
  container.innerHTML = '';

  questions.forEach(question => {
    // Если у вопроса отсутствует audio_Exam, пропускаем его
    if (!question.audio_Exam) return;

    // Создаем контейнер для вопроса
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('exam-question');

    // Выводим только ID вопроса с использованием соответствующего класса для стилизации
    const idDisplay = document.createElement('div');
    idDisplay.classList.add('exam-question-id');
    idDisplay.textContent = question.id;
    questionDiv.appendChild(idDisplay);

    // Добавляем аудиоплеер для данного вопроса
    const audioPlayer = document.createElement('div');
    audioPlayer.classList.add('custom-audio-player');
    audioPlayer.setAttribute('data-audio-src', question.audio_Exam);
    audioPlayer.innerHTML = `
      <button class="custom-play-btn"><i class="fas fa-play"></i></button>
      <div class="custom-audio-waves" data-audio-src="${question.audio_Exam}"></div>
      <span class="custom-time-display">0:00</span>
    `;
    questionDiv.appendChild(audioPlayer);

    container.appendChild(questionDiv);
  });

  // Инициализируем аудиоплееры после отрисовки
  initAudioPlayers();
}

// Функция для запроса данных с API и отрисовки вопросов
function fetchAndRenderExamQuestions() {
  fetch('/get_exam_questions')
    .then(response => response.json())
    .then(data => {
      if (data.questions) {
        renderExamQuestions(data.questions);
      } else if (data.error) {
        document.getElementById('examQuestionsContainer').innerHTML = `<p>${data.error}</p>`;
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

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

