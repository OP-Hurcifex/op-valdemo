const candInput = document.getElementById('candidate-number');
  const dobInput = document.getElementById('dob');
  const nameInput = document.getElementById('name');
  const continueBtn = document.getElementById('continue');

  const formCard = document.getElementById('form-card');
  const rulesCard = document.getElementById('rules-card');
  const listeningCard = document.getElementById('listening-card');

  const rulesContinue = document.getElementById('rules-continue');
  const startListening = document.getElementById('start-listening');

  let candidateID = ''; // сюда сохраним ID

  function startSkeleton() {
    dobInput.classList.add('skeleton');
    nameInput.classList.add('skeleton');
    dobInput.value = '';
    nameInput.value = '';
    dobInput.placeholder = '';
    nameInput.placeholder = '';
    continueBtn.disabled = true;
  }

  function stopSkeleton(dob = '', name = '') {
    dobInput.classList.remove('skeleton');
    nameInput.classList.remove('skeleton');
    dobInput.value = dob;
    nameInput.value = name;
    dobInput.placeholder = '—';
    nameInput.placeholder = '—';
    continueBtn.disabled = !(dob && name);
  }

  candInput.addEventListener('input', async () => {
    const val = candInput.value.trim();
    if (val.length === 8) {
      startSkeleton();
      try {
        const res = await fetch(`/api/candidate/id?id=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (res.ok) stopSkeleton(data.dob, data.name);
        else stopSkeleton();
      } catch (err) {
        console.error("API error", err);
        stopSkeleton();
      }
    } else {
      stopSkeleton();
    }
  });

  document.getElementById('candidate-form').addEventListener('submit', (e) => {
    e.preventDefault();
    formCard.classList.add('hidden');
    rulesCard.classList.remove('hidden');
  });

  rulesContinue.addEventListener('click', () => {
    candidateID = candInput.value.trim(); // сохраняем ID
    rulesCard.classList.add('hidden');
    listeningCard.classList.remove('hidden');
    console.log("Candidate ID saved:", candidateID);
  });

const header = document.querySelector("header");
const startListeningBtn = document.getElementById("start-listening");

async function fetchSessions() {
  try {
    const res = await fetch("/api/exam-sessions");
    const data = await res.json();
    return data.sessions || [];
  } catch (err) {
    console.error("Failed to load sessions:", err);
    return [];
  }
}

async function fetchServerTime() {
  try {
    const res = await fetch("/api/server-time");
    const data = await res.json();
    return new Date(data.now);
  } catch (err) {
    console.error("Failed to fetch server time:", err);
    return new Date();
  }
}

function createTimerElement() {
  let timerDiv = document.querySelector(".exam-timer");
  if (!timerDiv) {
    timerDiv = document.createElement("div");
    timerDiv.className = "exam-timer";
    timerDiv.innerHTML = `
      <i class="fa-solid fa-clock"></i>
      <span id="countdown">--:--</span>
    `;
    header.appendChild(timerDiv);
  }
}

function startCountdown(endTime, serverNow) {
  const countdownEl = document.getElementById("countdown");

  const end = endTime.getTime();
  const serverStart = serverNow.getTime();
  const clientStart = new Date().getTime();

  function update() {
    const now = new Date().getTime();
    const diff = end - (serverStart + (now - clientStart)); // миллисекунды

    if (diff <= 0) {
      countdownEl.textContent = "00:00";
      clearInterval(interval);
      return;
    }
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    countdownEl.textContent =
      String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  update();
  const interval = setInterval(update, 1000);
}


startListeningBtn.addEventListener("click", async () => {
  // проверяем, есть ли активная listening сессия
  const sessions = await fetchSessions();
  const listeningSession = sessions.find(
    (s) => s.exam_type === "listening" && s.status === "started"
  );

  if (!listeningSession) {
    alert("❌ Exam hasn't started yet");
    return;
  }

  const serverNow = await fetchServerTime();

  // скрываем карточку Listening
  listeningCard.classList.add("hidden");

  // создаём таймер
  createTimerElement();
  loadExam("listening");
  startCountdown(new Date(listeningSession.end_time), serverNow);
});

async function loadExam(examType) {
  try {
    const res = await fetch(`/api/get-exam-files/${examType}`);
    const data = await res.json();

    if (data.error) {
      alert(`❌ ${data.error}`);
      return;
    }

    const examData = data.data; // массив вопросов
    const main = document.querySelector("main");
    main.innerHTML = "";

    // Контейнер
    const container = document.createElement("div");
    container.id = "exam-container";
    main.appendChild(container);

    // Helper: create custom audio markup (matches your todaytasks version)
    function createListeningBlock(audioSrc) {
      const wrapper = document.createElement('div');
      wrapper.className = 'listening-audio';
      wrapper.innerHTML = `
        <div class="custom-audio-player">
          <button class="custom-play-btn"><i class="fas fa-play"></i></button>
          <div class="custom-audio-waves"><div class="progress"></div></div>
          <div class="custom-time-display">0:00</div>
        </div>
        <audio src="${audioSrc}" preload="metadata" style="display:none;"></audio>
      `;
      return wrapper;
    }

    // Helper: create video block (iframe HTML or local-link)
    function createVideoBlock(item) {
      const div = document.createElement('div');
      div.className = 'video-question';
      if (item['link-youtube'] && item['link-youtube'].includes('<iframe')) {
        div.innerHTML = `
          <div class="video-player">
            ${item['link-youtube']}
          </div>`;
      } else if (item['local-link']) {
        div.innerHTML = `
          <div class="video-player">
            <video controls width="100%" preload="metadata">
              <source src="${item['local-link']}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>`;
      } else if (item['link-youtube']) {
        // if it's a raw youtube url, convert to iframe (best-effort)
        const url = item['link-youtube'];
        let videoId = null;
        const m = url.match(/(?:v=|\/embed\/|\.be\/)([A-Za-z0-9_-]{6,})/);
        if (m) videoId = m[1];
        if (videoId) {
          div.innerHTML = `
            <div class="video-player">
              <iframe width="100%" height="360" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
            </div>`;
        }
      }
      return div;
    }

    // Helper: create custom select (for select-options)
    function createCustomSelect(sub) {
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

      const options = (sub.options && sub.options.length) ? sub.options.slice() : [];
      // if there is a pattern like "text (a/b/c) after", sometimes options may be in text; fall back to options
      if (!options.length && typeof sub.text === 'string') {
        const match = sub.text.match(/\(([^)]+)\)/);
        if (match) {
          options.push(...match[1].split('/').map(o => o.trim()));
        }
      }

      const cleanOptions = options.map(opt => opt.replace(/\*\*/g, ''));

      cleanOptions.forEach(optionText => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.textContent = optionText;
        option.onclick = (e) => {
          e.stopPropagation();
          textSpan.textContent = optionText;
          selectWrapper.dataset.selected = optionText;
          selectWrapper.classList.remove('open');
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
      return selectWrapper;
    }

    // Helper: create unscramble block with interactions
    function createUnscrambleBlock(sub) {
      const letters = (sub.text || '').trim().split('').filter(ch => ch !== ' ');
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

      // events
      letterContainer.querySelectorAll('.unscramble-letter').forEach(letterEl => {
        letterEl.addEventListener('click', () => {
          if (letterEl.classList.contains('used')) return;
          const emptySlot = inputContainer.querySelector('.unscramble-input:not(.filled)');
          if (emptySlot) {
            emptySlot.textContent = letterEl.dataset.letter;
            emptySlot.classList.add('filled');
            emptySlot.dataset.letterIndex = letterEl.dataset.index;
            letterEl.classList.add('used');
          }
        });
      });

      inputContainer.querySelectorAll('.unscramble-input').forEach(inputEl => {
        inputEl.addEventListener('click', () => {
          if (!inputEl.classList.contains('filled')) return;
          const idx = inputEl.dataset.letterIndex;
          const letterEl = letterContainer.querySelector(`.unscramble-letter[data-index="${idx}"]`);
          if (letterEl) letterEl.classList.remove('used');
          inputEl.textContent = '';
          inputEl.classList.remove('filled');
          delete inputEl.dataset.letterIndex;
        });
      });

      const wrapper = document.createElement('div');
      wrapper.appendChild(letterContainer);
      wrapper.appendChild(inputContainer);
      return wrapper;
    }

    // Helper: create box-choose group block (multiple blanks + options list)
    function createBoxChooseGroup(groupedBoxChoose, qOptionsFallback = []) {
      const subDiv = document.createElement('div');
      subDiv.className = 'exam-subquestion';
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'box-choose-options';
      let selected = null;

      // gather all possible options from groupedBoxChoose or fallback qOptions
      const allOpts = [...new Set(groupedBoxChoose.flatMap(s => (s.options && s.options.length) ? s.options : qOptionsFallback))];

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

      // attach click handlers after DOM insertion
      setTimeout(() => {
        subDiv.querySelectorAll('.box-choose-blank').forEach(blank => {
          blank.onclick = () => {
            if (blank.classList.contains('filled')) {
              // restore removed option back to optionsDiv
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
            // remove the chosen option from optionsDiv
            optionsDiv.querySelectorAll('.box-choose-option').forEach(optEl => {
              if (optEl.textContent === selected) optEl.remove();
            });
            selected = null;
          };
        });
      }, 0);

      return subDiv;
    }

    // Iterate items and build UI
    examData.forEach((item, index) => {
      // --- Info block ---
      if (item.type === "info") {
        const infoBlock = document.createElement("div");
        infoBlock.className = "exam-info-card";
        infoBlock.innerHTML = `
          <h3>${item.header || "Information"}</h3>
          <p>${item["sub-info"] || ""}</p>
        `;
        container.appendChild(infoBlock);
        return;
      }

      // --- Main question block ---
      const qBlock = document.createElement("div");
      qBlock.className = "exam-question-card";

      // Optional: If item has header/title different from text
      if (item.header) {
        const h = document.createElement('h2');
        h.className = 'exam-item-header';
        h.textContent = item.header;
        qBlock.appendChild(h);
      }

      // Title
      const qTitle = document.createElement("h3");
      qTitle.className = "question-title";
      qTitle.textContent = `${item.sequence_number || index + 1}. ${item.text || ""}`;
      qBlock.appendChild(qTitle);

      // If item has reading text (rich HTML)
      if (item.type === 'reading' && item.text) {
        const rich = document.createElement('div');
        rich.className = 'exam-parent-question';
        rich.innerHTML = item.text;
        qBlock.appendChild(rich);
      }

      // Listening audio at item-level
      if (item.type === 'listening' && item.audio) {
        const audioWrapper = createListeningBlock(item.audio);
        qBlock.appendChild(audioWrapper);
      }

      // Video
      if (item.type === 'video' && (item['link-youtube'] || item['local-link'])) {
        const videoEl = createVideoBlock(item);
        qBlock.appendChild(videoEl);
      }

      // Subquestions handling
      const subList = Array.isArray(item.subquestions) ? item.subquestions : (item.subquestion ? [item.subquestion] : []);
      // If no subquestions but item itself is a single question (legacy), treat item as sub
      if (!subList.length && item.type && ['multiple_choice','true_false','write-in-blank','select-options','box-choose','unscramble','picture','listening'].includes(item.type)) {
        subList.push(Object.assign({}, item, { id: item.sequence_number || (index+1) }));
      }

      // Group certain types
      const groupedSelectOptions = [];
      const groupedWriteIn = [];
      const groupedBoxChoose = [];

      subList.forEach(sub => {
        if (!sub) return;
        if (sub.type === 'select-options') groupedSelectOptions.push(sub);
        else if (sub.type === 'write-in-blank') groupedWriteIn.push(sub);
        else if (sub.type === 'box-choose') groupedBoxChoose.push(sub);
      });

      // First render each sub that is NOT in grouped arrays and not select/write/box
      subList.forEach((sub, subIndex) => {
        if (!sub) return;
        if (['select-options','write-in-blank','box-choose'].includes(sub.type)) return;

        const subDiv = document.createElement('div');
        subDiv.className = 'exam-subquestion';

        // For unscramble we treat differently and avoid default question-text paragraph
        if (sub.type !== 'unscramble') {
          const p = document.createElement('p');
          p.className = 'question-text';
          p.innerHTML = `${sub.id || (subIndex+1)}. ${sub.text || ''}`;
          subDiv.appendChild(p);
        }

        const group = document.createElement('div');
        group.className = 'question-options';

        if (['multiple_choice', 'true_false'].includes(sub.type)) {
          const opts = sub.options && sub.options.length ? sub.options : (sub.type === 'true_false' ? ['True', 'False'] : []);
          opts.forEach((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const id = `opt-${sub.id}-${letter}-${Math.random().toString(36).slice(2,6)}`;
            const label = document.createElement('label');
            label.className = 'option-group';
            label.htmlFor = id;
            label.innerHTML = `
              <input type="radio" name="q${sub.id}" value="${opt}" id="${id}">
              <div class="option-box">
                <span class="option-letter">${letter}</span>
                <span class="option-text">${opt}</span>
              </div>
            `;
            group.appendChild(label);
          });
        } else if (sub.type === 'unscramble') {
          const wrapper = createUnscrambleBlock(sub);
          group.appendChild(wrapper);
        } else if (sub.type === 'picture') {
          if (sub.image) {
            const img = document.createElement('img');
            img.src = sub.image;
            img.alt = 'Image';
            img.className = 'question-image';
            group.appendChild(img);
          }
          const input = document.createElement('input');
          input.type = 'text';
          input.name = `q${sub.id}`;
          input.className = 'image-answer';
          input.placeholder = 'Answer...';
          group.appendChild(input);
        } else if (sub.type === 'listening') {
          const input = document.createElement('input');
          input.type = 'text';
          input.name = `q${sub.id}`;
          input.className = 'listening-input';
          input.placeholder = 'Your answer...';
          group.appendChild(input);
        } else {
          // default fallback: show text + unsupported note
          const p = document.createElement('p');
          p.className = 'question-text';
          p.innerHTML = `${sub.id || ''}. ${(sub.text || '')} ${sub.type ? `<em>(type: ${sub.type})</em>` : ''}`;
          group.appendChild(p);
        }

        subDiv.appendChild(group);
        qBlock.appendChild(subDiv);
      });

      // Now add grouped write-ins (render as inputs in the sentence)
      if (groupedWriteIn.length) {
        const subDiv = document.createElement('div');
        subDiv.className = 'exam-subquestion';
        groupedWriteIn.forEach(sub => {
          const p = document.createElement('p');
          p.className = 'question-text';
          // replace blank marker ____ with input; using text.replace to keep structure
          p.innerHTML = `${sub.id}. ${String(sub.text || '').replace(/____+/g, `<input type="password" class="write-in-blank-input" name="q${sub.id}" autocomplete="off">`)}`;
          subDiv.appendChild(p);
        });
        qBlock.appendChild(subDiv);
      }

      // grouped select-options -> use custom select rendering similar to todaytasks
      if (groupedSelectOptions.length) {
        const subDiv = document.createElement('div');
        subDiv.className = 'exam-subquestion';
        groupedSelectOptions.forEach(sub => {
          const p = document.createElement('p');
          p.className = 'question-text';

          // Try to parse the common pattern: "Before ____ (a/b/c) after"
          const match = (sub.text || '').match(/^(.*?)\((.*?)\)(.*)$/);
          if (!match) {
            // fallback: if sub.options provided, create a simple select
            if (sub.options && sub.options.length) {
              p.innerHTML = `${sub.id}. ${sub.text || ''}`;
              const select = document.createElement('select');
              select.name = `q${sub.id}`;
              select.className = 'question-select';
              select.innerHTML = `<option value="">-- Select --</option>`;
              sub.options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt;
                o.textContent = opt;
                select.appendChild(o);
              });
              subDiv.appendChild(p);
              subDiv.appendChild(select);
              qBlock.appendChild(subDiv);
              return;
            } else {
              console.warn('Invalid select-options format:', sub.text);
              return;
            }
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

          // Build select UI parts
          const idSpan = document.createElement('span');
          idSpan.textContent = `${sub.id}. `;
          p.appendChild(idSpan);

          const beforeSpan = document.createElement('span');
          beforeSpan.textContent = before;
          p.appendChild(beforeSpan);

          // custom select
          const customSelect = createCustomSelect(Object.assign({}, sub, { options: cleanOptions }));
          p.appendChild(customSelect);

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
        qBlock.appendChild(subDiv);
      }

      // grouped box-choose group
      if (groupedBoxChoose.length) {
        const groupBlock = createBoxChooseGroup(groupedBoxChoose, item.options || []);
        qBlock.appendChild(groupBlock);
      }

      container.appendChild(qBlock);
    });

    // Add bottom finish/done buttons and floating finish like in openTodayTaskPage
    // Note: I assume these elements exist in DOM; if not, create basic handlers

    const finishBtn = document.getElementById('finish-tasks-btn');
    if (finishBtn) {
      finishBtn.onclick = () => {
        const btn = document.getElementById('floating-finish-btn');
        if (btn) btn.style.display = 'none';
        // try to infer title/questions from page - but best pass nulls
        showFinishModal(document.querySelector('.question-title') ? document.querySelector('.question-title').textContent : '', examData);
      };
    }

    const doneBtn = document.getElementById('done-tasks-btn');
    if (doneBtn) {
      doneBtn.onclick = () => {
        showPage('today');
        const content = document.getElementById('exam-container');
        if (content) content.innerHTML = '';
        document.getElementById('done-tasks-btn').style.display = 'none';
        const finish = document.getElementById('finish-tasks-btn');
        if (finish) finish.style.display = 'inline-block';
        const floating = document.getElementById('floating-finish-btn');
        if (floating) floating.style.display = 'none';
      };
    }

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
      showFinishModal(document.querySelector('.question-title') ? document.querySelector('.question-title').textContent : '', examData);
    };

    // Init custom audio players if any were created
    if (typeof initCustomAudioPlayers === 'function') {
      initCustomAudioPlayers();
    } else {
      // minimal fallback behaviour for basic audio controls
      document.querySelectorAll('.custom-audio-player').forEach(player => {
        const audio = player.parentElement.querySelector('audio');
        if (!audio) return;
        const btn = player.querySelector('.custom-play-btn');
        const timeDisplay = player.querySelector('.custom-time-display');
        const progress = player.querySelector('.progress');

        btn.onclick = () => {
          if (audio.paused) audio.play();
          else audio.pause();
        };
        audio.ontimeupdate = () => {
          const mm = Math.floor(audio.currentTime / 60);
          const ss = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
          if (timeDisplay) timeDisplay.textContent = `${mm}:${ss}`;
          if (progress) {
            const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
            progress.style.width = pct + '%';
          }
        };
        audio.onplay = () => {
          if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';
        };
        audio.onpause = () => {
          if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
        };
      });
    }

    // scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error("Failed to load exam:", err);
    alert("⚠️ Could not load exam data.");
  }
}




