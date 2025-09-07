document.addEventListener("DOMContentLoaded", () => {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  if (!togglePassword || !passwordInput) return;
  const icon = togglePassword.querySelector("i");

  if (window.__passwordToggleInitialized) return;
  window.__passwordToggleInitialized = true;

  try {
    passwordInput.type = 'password';
    passwordInput.setAttribute('type', 'password');
  } catch (e) { /* ignore */ }

  const GRACE_MS = 500;
  const graceDeadline = Date.now() + GRACE_MS;

  let isApplying = false;

  function applyType(newType, source = 'internal') {
    if (isApplying) return;
    isApplying = true;
    try {
      passwordInput.type = newType;
      passwordInput.setAttribute('type', newType);
      if (icon) {
        if (newType === 'text') {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }

      if (source === 'user') {
        if (newType === 'text') {
          passwordInput.dataset.userToggled = 'true';
          clearTimeout(passwordInput._userToggledTimeout);
          passwordInput._userToggledTimeout = setTimeout(() => {
            delete passwordInput.dataset.userToggled;
          }, 60000);
        } else {
          delete passwordInput.dataset.userToggled;
          clearTimeout(passwordInput._userToggledTimeout);
        }
      }
    } finally {
      setTimeout(() => { isApplying = false; }, 0);
    }
  }

  togglePassword.addEventListener("click", (e) => {
    e.preventDefault();
    const nowIsPassword = passwordInput.type === 'password';
    const targetType = nowIsPassword ? 'text' : 'password';
    applyType(targetType, 'user');
  });

  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.attributeName !== 'type') continue;
      if (m.target !== passwordInput) continue;
      if (isApplying) continue;

      const newType = passwordInput.getAttribute('type') || passwordInput.type;

      if (Date.now() < graceDeadline) {
        if (newType !== 'password') {
          applyType('password', 'internal');
        }
        continue;
      }

      if (passwordInput.dataset.userToggled === 'true' && newType === 'password') {
        applyType('text', 'internal');
        continue;
      }

      if (newType === 'text') {
        applyType('text', 'internal');
      } else {
        delete passwordInput.dataset.userToggled;
        applyType('password', 'internal');
      }
    }
  });
  mo.observe(passwordInput, { attributes: true });
});

function showBanNoticePage(banData) {
  // удаляем старую модалку, если есть
  const old = document.getElementById("ban-modal");
  if (old) old.remove();

  // создаём оверлей
  const overlay = document.createElement("div");
  overlay.id = "ban-modal";
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.style.zIndex = 9999;

  // формируем разметку — используем SVG-чекбокс с id="agree-terms"
  overlay.innerHTML = `
    <div class="modal ban-modal-content" role="document" aria-labelledby="ban-title">
      <h2 id="ban-title" class="modal-title">Your account has been deactivated.</h2>
      <p class="modal-subtitle">Our moderation team has determined that your activity on Horizon violated our Community Guidelines.</p>
      <p class="muted">Reviewed: ${banData.reviewed_date || ""} (CT)</p>
      <p class="muted">Moderator Note: Horizon does not permit behavior that goes against our Terms of Use and Community Guidelines.</p>

      <div class="ban-details">
        <p><strong>Reason:</strong> ${banData.reason || "Unknown"}</p>
        ${banData.offensive_item ? `<p><strong>Offensive item:</strong> ${banData.offensive_item}</p>` : ""}
        <p><strong>Banned Until:</strong> ${banData.ban_end_date || "—"}</p>
      </div>

      ${banData.expired ? `
        <div class="ban-action-row" style="display:flex;align-items:center;gap:12px;margin-top:14px;">
          <div class="checkbox-wrapper-31" aria-hidden="true">
            <input id="agree-terms" type="checkbox" />
            <svg viewBox="0 0 35.6 35.6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <circle class="background" cx="17.8" cy="17.8" r="17.8"></circle>
              <circle class="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
              <polyline class="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
            </svg>
          </div>
          <label for="agree-terms" class="agree-label" style="color:#cfcfd6;cursor:pointer;font-size:14px;">I agree to the Terms of Use</label>
        </div>

        <button id="reactivate-btn" class="btn btn-blue" disabled style="margin-top:14px;padding:10px 12px;border-radius:8px;border:none;font-weight:600;cursor:pointer;">
          Re-activate My Account
        </button>
      ` : `
        <p class="ban-info" style="margin-top:14px;color:#d1d5df;">You may re-activate your account by agreeing to our Terms of Use after the ban has expired.</p>
      `}

    </div>
  `;

  // прикрепляем оверлей в body
  document.body.appendChild(overlay);

  // закрытие при клике вне контента
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) overlay.remove();
  });

  // если бан истёк — вешаем логику чекбокса/кнопки
  if (banData.expired) {
    const agreeEl = document.getElementById("agree-terms");
    const reactivateBtn = document.getElementById("reactivate-btn");

    // safety
    if (!agreeEl || !reactivateBtn) return;

    // включаем/отключаем кнопку по чекбоксу
    agreeEl.addEventListener("change", () => {
      reactivateBtn.disabled = !agreeEl.checked;
      // краткая визуальная подсветка
      if (!reactivateBtn.disabled) {
        reactivateBtn.classList.add("ready");
      } else {
        reactivateBtn.classList.remove("ready");
      }
    });

    // обработчик реактивации — берём username из #username input
    reactivateBtn.addEventListener("click", async () => {
      // защищаем от повторных кликов
      if (reactivateBtn.disabled) return;

      const usernameInput = document.getElementById("username") || document.querySelector("input[name='username']");
      const username = usernameInput ? (usernameInput.value || "").trim() : "";

      if (!username) {
        showToastNotification("Username not found. Please enter your username in the login form.", "error");
        return;
      }

      // UI: показать состояние
      reactivateBtn.disabled = true;
      const prevText = reactivateBtn.textContent;
      reactivateBtn.textContent = "Reactivating..";

      try {
        const resp = await fetch(`/banned-user-reactivate/${encodeURIComponent(username)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        const data = await resp.json();

        if (resp.ok && data.status === "success") {
          showToastNotification(data.message || "Account reactivated.", "success");

          // Удалим модал и, при желании, можно инициировать автоматический повторный логин.
          overlay.remove();

          // Если в sessionStorage есть сохранённые temp credentials — попробуем авторизовать автоматически
          const tempU = sessionStorage.getItem("tempUsername");
          const tempP = sessionStorage.getItem("tempPassword");
if (tempU && tempP) {
  try {
    sessionStorage.removeItem("tempUsername");
    sessionStorage.removeItem("tempPassword");
    window.location.href = "/app";
    return;
  } catch (err) {
    // ignore — user will sign in manually
  }
}

        } else {
          showToastNotification(data.message || "Error re-activating account.", "error");
          reactivateBtn.disabled = false;
          reactivateBtn.textContent = prevText;
        }
      } catch (err) {
        console.error("reactivate error:", err);
        showToastNotification("Server error. Please try again.", "error");
        reactivateBtn.disabled = false;
        reactivateBtn.textContent = prevText;
      }
    });
  }
}



// login.js — адаптированный для вашей HTML (работает без DOMContentLoaded)
// Поддерживает форму с id="login-form" или классом .login-form,
// ищет input по name или id, использует класс .loading на кнопке (CSS управляет спиннером).
// login.js — адаптированный для вашей HTML (работает без DOMContentLoaded)
// Поддерживает форму с id="login-form" или классом .login-form,
// ищет input по name или id, использует класс .loading на кнопке (CSS управляет спиннером).
let tempUsernameUntilLog = "";
let __loginInitialized = false;

function initLoginIfReady() {
  if (__loginInitialized) return true;

  // Найти форму: сначала по id, затем по классу
  const loginForm = document.getElementById("login-form") || document.querySelector(".login-form");
  if (!loginForm) return false;

  // Найти кнопку отправки внутри формы
  const submitBtn = loginForm.querySelector("button[type='submit']") ||
                    document.getElementById("login-btn") ||
                    loginForm.querySelector(".login-btn");
  if (!submitBtn) {
    console.warn("Кнопка отправки не найдена внутри формы (ожидалась button[type='submit'] или .login-btn).");
    return false;
  }

  __loginInitialized = true;

  // Toggle для показа/скрытия спиннера (CSS: .login-btn.loading .btn-text / .spinner)
  function showButtonLoading() {
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");
  }
  function hideButtonLoading() {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
  }

  // Toggle видимости пароля с заменой иконки (использует Font Awesome)
  const toggleBtn = loginForm.querySelector("#togglePassword") || loginForm.querySelector(".toggle-password");
  const passwordInputForToggle = loginForm.querySelector("input[name='password']") || loginForm.querySelector("#password");
  if (toggleBtn && passwordInputForToggle) {
    toggleBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const input = passwordInputForToggle;
      const icon = toggleBtn.querySelector("i");
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        if (icon) {
          icon.classList.remove("fa-eye");
          icon.classList.add("fa-eye-slash");
        }
      } else {
        input.type = "password";
        if (icon) {
          icon.classList.remove("fa-eye-slash");
          icon.classList.add("fa-eye");
        }
      }
    });
  }

// Основная логика submit
async function handleSubmit(e) {
  e.preventDefault();
  showButtonLoading();

  const usernameInput = loginForm.querySelector("input[name='username']") || loginForm.querySelector("#username");
  const passwordInput = loginForm.querySelector("input[name='password']") || loginForm.querySelector("#password");
  const username = usernameInput ? (usernameInput.value || "").trim() : "";
  const password = passwordInput ? (passwordInput.value || "").trim() : "";

  tempUsernameUntilLog = username;

  if (!username || !password) {
    hideButtonLoading();
    showToastNotification("Please provide username and password.", "error");
    return;
  }

  sessionStorage.setItem("tempUsername", username);
  sessionStorage.setItem("tempPassword", password);

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      data = {};
    }

    // Не прячет loading здесь — мы держим его включённым пока не решим исход:
    if (response.ok && data.success) {
      const otpKey = `otpVerifiedUntil_${username}`;
      const otpUntil = parseInt(localStorage.getItem(otpKey) || "0", 10);
      const alreadyVerified = otpUntil > Date.now();

      if (alreadyVerified) {
        // Пользователь уже верифицирован — можно завершить загрузку и перейти в приложение
        let storedAccounts = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
        const exists = storedAccounts.find(acc =>
          acc.username === username &&
          acc.email === username &&
          acc.password === password
        );
        if (!exists) {
          storedAccounts.push({ username, email: username, password });
          localStorage.setItem("savedAccounts", JSON.stringify(storedAccounts));
        }

        sessionStorage.setItem("username", username);
        sessionStorage.setItem("password", password);
        sessionStorage.removeItem("tempUsername");
        sessionStorage.removeItem("tempPassword");

        hideButtonLoading();
        window.location.href = "/app";
        return;
      }

      // Нужно 2FA — отправляем запрос на отправку письма и держим loading до результата
      try {
        const otpRes = await fetch("/send-2fa-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username })
        });

        let otpData;
        try {
          otpData = await otpRes.json();
        } catch (e) {
          otpData = {};
        }

        if (otpRes.ok) {
          // OTP успешно отправлен — можно убрать индикатор загрузки и показать UI для ввода OTP
          hideButtonLoading();
          if (typeof showOtpUI === "function") {
            showOtpUI(otpData.masked_email);
          } else {
            showToastNotification("OTP sent: " + (otpData.masked_email || ""), "info");
          }
        } else {
          // Ошибка при отправке OTP — скрываем загрузку и показываем ошибку
          hideButtonLoading();
          showToastNotification(otpData.error || "Failed to send OTP", "error");
        }
      } catch (otpErr) {
        hideButtonLoading();
        console.error("OTP send error:", otpErr);
        showToastNotification("Failed to send OTP. Please check your connection.", "error");
      }
    } else if (data.ban_notice) {
      // Use the ban_notice directly from JSON
      hideButtonLoading();
      const banData = data.ban_notice;
      showBanNoticePage(banData);
    } else {
      hideButtonLoading();
      showToastNotification(
        data.error || "Login failed. Please try again.",
        "error"
      );
    }
  } catch (err) {
    hideButtonLoading();
    console.error("Login error:", err);
    showToastNotification("Login failed. Please check your connection.", "error");
  }
}


  // Привязываем обработчик submit
  loginForm.removeEventListener("submit", handleSubmit);
  loginForm.addEventListener("submit", handleSubmit);

  return true;
}

// Попытка инициализации сразу
if (!initLoginIfReady()) {
  const checkInterval = setInterval(() => {
    if (initLoginIfReady()) clearInterval(checkInterval);
  }, 80);
  setTimeout(() => clearInterval(checkInterval), 12000); // safety timeout
}

let __otpCountdownInterval = null;
let __otpRemaining = 59; // стартовое значение (s)

/**
 * showOtpUI(maskedEmail)
 * создает модал с OTP, инициализирует инпуты, таймер и повешает обработчики Verify / Resend
 */
function showOtpUI(maskedEmail) {
  const username = sessionStorage.getItem("tempUsername");
  const password = sessionStorage.getItem("tempPassword");

  if (!username || !password) {
    showToastNotification("Session expired. Please login again.", "error");
    return;
  }

  const otpKey = `otpVerifiedUntil_${username}`;
  const otpUntil = parseInt(localStorage.getItem(otpKey) || "0", 10);
  const alreadyVerified = otpUntil > Date.now();

  if (alreadyVerified) {
    // Skip OTP and finalize login
    let storedAccounts = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
    const exists = storedAccounts.find(acc =>
      acc.username === username &&
      acc.email === username &&
      acc.password === password
    );
    if (!exists) {
      storedAccounts.push({ username, email: username, password });
      localStorage.setItem("savedAccounts", JSON.stringify(storedAccounts));
    }

    sessionStorage.setItem("username", username);
    sessionStorage.setItem("password", password);
    sessionStorage.removeItem("tempUsername");
    sessionStorage.removeItem("tempPassword");

    window.location.href = "/app";
    return;
  }

  // remove existing modal if any
  const existing = document.getElementById("otp-modal");
  if (existing) existing.remove();

  // create modal
  const modal = document.createElement("div");
  modal.id = "otp-modal";
  modal.className = "otp-modal-overlay";
  modal.innerHTML = `
    <div class="otp-modal-content" role="dialog" aria-modal="true" aria-labelledby="otp-title">
      <button class="close-otp" id="close-otp" aria-label="Close">&times;</button>
      <h2 id="otp-title">OTP Code Verification</h2>
      <p>We’ve sent a 6-digit code to <b>${maskedEmail}</b></p>
      <div class="otp-inputs" id="otp-inputs">
        ${Array(6).fill("").map(() => `<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-digit" />`).join("")}
      </div>
      <button id="verify-btn" class="verify-btn"><span class="btn-text">Verify</span></button>
      <p class="otp-resend resend-code" id="otp-resend">Didn't receive code? <br>
        <span id="resend-text">Resend in <span id="countdown">${__otpRemaining}</span>s</span>
      </p>
    </div>
  `;
  document.body.appendChild(modal);

  // attach close handler (optional)
  const closeBtn = document.getElementById("close-otp");
  if (closeBtn) {
    closeBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      teardownOtpModal();
    });
  }

  setupOtpInputs();
  startCountdown();

  const verifyBtn = document.getElementById("verify-btn");
  const resendEl = document.getElementById("otp-resend");

  if (verifyBtn) verifyBtn.addEventListener("click", verifyOtp);
  if (resendEl) resendEl.addEventListener("click", resendOtp);
}

/**
 * setupOtpInputs - автофокус и перемещение между полями
 */
function setupOtpInputs() {
  const inputs = Array.from(document.querySelectorAll(".otp-digit"));
  inputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      const v = input.value;
      // keep only digits
      if (v && /\D/.test(v)) {
        input.value = v.replace(/\D/g, "").slice(0, 1);
      }
      if (input.value.length === 1 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && input.value === "" && idx > 0) {
        inputs[idx - 1].focus();
      }
      // allow arrows
      if (e.key === "ArrowLeft" && idx > 0) {
        inputs[idx - 1].focus();
      }
      if (e.key === "ArrowRight" && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }
    });

    // prevent paste of long strings into one field
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
      const digits = paste.replace(/\D/g, '').slice(0, 6);
      if (!digits.length) return;
      const all = Array.from(document.querySelectorAll(".otp-digit"));
      for (let i = 0; i < all.length; i++) {
        all[i].value = digits[i] || "";
      }
      const firstEmpty = document.querySelector(".otp-digit:not([value])") || all[all.length - 1];
      (firstEmpty).focus();
    });
  });

  // focus first
  const first = document.querySelector(".otp-digit");
  if (first) first.focus();
}

/**
 * startCountdown(seconds = 59)
 * - надёжно запускает таймер
 * - обновляет __otpRemaining
 * - ставит класс 'resend-ready' на модал, когда таймер = 0
 */
function startCountdown(seconds = 59) {
  clearInterval(__otpCountdownInterval);
  __otpRemaining = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 59;

  const modal = document.getElementById("otp-modal");
  const resendTextEl = modal ? modal.querySelector("#resend-text") : null;
  const countdownSpan = document.getElementById("countdown"); // может быть в другом месте

  // Безопасно инициализируем UI (только если элементы есть)
  if (countdownSpan) countdownSpan.textContent = String(__otpRemaining);
  if (resendTextEl) {
    resendTextEl.innerHTML = __otpRemaining > 0
      ? `Resend in <span id="countdown">${__otpRemaining}</span>s`
      : `Resend code`;
  }
  if (modal) modal.classList.toggle("resend-ready", __otpRemaining <= 0);

  if (__otpRemaining <= 0) {
    clearInterval(__otpCountdownInterval);
    __otpCountdownInterval = null;
    return;
  }

  __otpCountdownInterval = setInterval(() => {
    __otpRemaining = Math.max(0, __otpRemaining - 1);

    const currModal = document.getElementById("otp-modal");
    const currResendText = currModal ? currModal.querySelector("#resend-text") : null;
    const currCountdownSpan = document.getElementById("countdown");

    if (currCountdownSpan) {
      currCountdownSpan.textContent = String(__otpRemaining);
    } else if (currResendText) {
      // если #countdown вдруг отсутствует, обновляем общий текст
      currResendText.innerHTML = `Resend in <span id="countdown">${__otpRemaining}</span>s`;
    }

    if (__otpRemaining <= 0) {
      if (currModal) currModal.classList.add("resend-ready");
      if (currResendText) currResendText.innerHTML = `Resend code`;
      clearInterval(__otpCountdownInterval);
      __otpCountdownInterval = null;
    }
  }, 1000);
}

// ---- Обновлённый resendOtp (только спиннер, без текста "Sending...") ----
async function resendOtp(e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();

  const modal = document.getElementById("otp-modal");
  if (!modal) return;

  const resendEl = modal.querySelector("#otp-resend"); // контейнер .resend-code
  const resendTextEl = modal.querySelector("#resend-text"); // текст/контейнер
  const countdownSpan = modal.querySelector("#countdown");

  // Проверка готовности к ресенду
  const domReady = modal.classList.contains("resend-ready");
  const textReady = resendTextEl && /resend\s*code$/i.test(resendTextEl.textContent.trim());
  const timerReady = typeof __otpRemaining === "number" && __otpRemaining <= 0;

  if (!timerReady && !domReady && !textReady) {
    // fallback: прочитать из DOM #countdown
    let wait = null;
    if (countdownSpan) {
      const parsed = parseInt(countdownSpan.textContent.replace(/\D/g, ""), 10);
      if (!Number.isNaN(parsed) && parsed > 0) wait = parsed;
    } else if (typeof __otpRemaining === "number" && __otpRemaining > 0) {
      wait = __otpRemaining;
    }
    showToastNotification(wait ? `Please wait ${wait}s before resending.` : "Please wait before resending.", "info");
    return;
  }

  if (!resendTextEl) return;
  if (resendEl.classList.contains("resending")) return; // защита от двойного клика

  // Сохраняем исходный HTML (если ещё не сохранён)
  if (!resendTextEl.dataset.origHtml) {
    resendTextEl.dataset.origHtml = resendTextEl.innerHTML;
  }

  // Маленький спиннер (только он — без слова "Sending...")
  const smallSpinner = `
    <span class="resend-spinner" aria-hidden="true">
      <span class="spinner-blade"></span><span class="spinner-blade"></span><span class="spinner-blade"></span>
      <span class="spinner-blade"></span><span class="spinner-blade"></span><span class="spinner-blade"></span>
      <span class="spinner-blade"></span><span class="spinner-blade"></span><span class="spinner-blade"></span>
      <span class="spinner-blade"></span><span class="spinner-blade"></span><span class="spinner-blade"></span>
    </span>`;

  // Показать состояние отправки — только спиннер
  resendEl.classList.add("resending");
  resendTextEl.innerHTML = smallSpinner;

  const username = sessionStorage.getItem("tempUsername");
  if (!username) {
    // восстановим UI и выйдем
    resendTextEl.innerHTML = resendTextEl.dataset.origHtml || `Resend code`;
    resendEl.classList.remove("resending");
    showToastNotification("Session expired. Please login again.", "error");
    return;
  }

  try {
    const res = await fetch("/send-2fa-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });

    const data = await res.json();

    if (res.ok) {
      showToastNotification("OTP resent.", "info");
      // после успеха — показать "Resend code" и перезапустить таймер
      if (resendTextEl) resendTextEl.innerHTML = `Resend code`;
      if (modal) modal.classList.remove("resend-ready");
      startCountdown(59);
    } else {
      showToastNotification(data.error || "Failed to resend OTP.", "error");
      // восстановим исходный HTML или поставим Resend code
      resendTextEl.innerHTML = resendTextEl.dataset.origHtml || `Resend code`;
      startCountdown(5); // короткий кулдаун
    }
  } catch (err) {
    console.error("resendOtp error:", err);
    showToastNotification("Network error. Try again.", "error");
    resendTextEl.innerHTML = resendTextEl.dataset.origHtml || `Resend code`;
    startCountdown(5);
  } finally {
    resendEl.classList.remove("resending");
    resendEl.removeAttribute("aria-disabled");
  }
}


/**
 * verifyOtp - собирает код, показывает спиннер в кнопке Verify (в центре), отправляет верификацию,
 *             и на успех фиксирует OTP и завершает логин, на ошибку показывает уведомление.
 */
async function verifyOtp(e) {
  if (e) e.preventDefault();

  const verifyBtn = document.getElementById("verify-btn");
  if (!verifyBtn) return;

  // collect digits
  const digits = Array.from(document.querySelectorAll(".otp-digit"))
    .map(i => (i.value || "").trim())
    .join("");

  if (digits.length !== 6) {
    showToastNotification("Please enter the 6-digit code.", "error");
    return;
  }

  // show spinner inside verify button
  const originalVerifyHTML = verifyBtn.innerHTML;
  verifyBtn.disabled = true;
  verifyBtn.classList.add("loading");
  verifyBtn.innerHTML = `
    <div class="spinner center" aria-hidden="true" style="margin:0 auto;">
      <div class="spinner-blade"></div><div class="spinner-blade"></div><div class="spinner-blade"></div>
      <div class="spinner-blade"></div><div class="spinner-blade"></div><div class="spinner-blade"></div>
      <div class="spinner-blade"></div><div class="spinner-blade"></div><div class="spinner-blade"></div>
      <div class="spinner-blade"></div><div class="spinner-blade"></div><div class="spinner-blade"></div>
    </div>`;

  try {
    const verifyResponse = await fetch("/verify-2fa-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: digits })
    });

    const verifyData = await verifyResponse.json();

    if (verifyResponse.ok && verifyData.success) {
      // finalize login (same logic as earlier)
      const username = sessionStorage.getItem("tempUsername");
      const password = sessionStorage.getItem("tempPassword");
      if (!username || !password) {
        showToastNotification("Missing credentials. Please login again.", "error");
        restoreVerifyButton();
        return;
      }

      const otpKey = `otpVerifiedUntil_${username}`;
      const expiration = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
      localStorage.setItem(otpKey, expiration.toString());

      let storedAccounts = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
      const exists = storedAccounts.find(acc =>
        acc.username === username &&
        acc.email === username &&
        acc.password === password
      );
      if (!exists) {
        storedAccounts.push({ username, email: username, password });
        localStorage.setItem("savedAccounts", JSON.stringify(storedAccounts));
      }

      sessionStorage.setItem("username", username);
      sessionStorage.setItem("password", password);
      sessionStorage.removeItem("tempUsername");
      sessionStorage.removeItem("tempPassword");

      // success -> redirect
      // small delay so user sees success (optional)
      setTimeout(() => {
        teardownOtpModal();
        window.location.href = "/app";
      }, 300);
    } else {
      showToastNotification(verifyData.error || "Invalid code.", "error");
      restoreVerifyButton();
      // optional visual shake (if you add CSS .shake)
      const content = document.querySelector(".otp-modal-content");
      if (content) {
        content.classList.remove("shake");
        void content.offsetWidth;
        content.classList.add("shake");
        setTimeout(() => content.classList.remove("shake"), 600);
      }
    }
  } catch (err) {
    console.error("verifyOtp error:", err);
    showToastNotification("Verification failed. Try again.", "error");
    restoreVerifyButton();
  }

  function restoreVerifyButton() {
    verifyBtn.disabled = false;
    verifyBtn.classList.remove("loading");
    verifyBtn.innerHTML = originalVerifyHTML;
  }
}

/**
 * teardownOtpModal - удаляет модал и сбрасывает таймер
 */
function teardownOtpModal() {
  const modal = document.getElementById("otp-modal");
  if (modal) modal.remove();
  clearInterval(__otpCountdownInterval);
  __otpCountdownInterval = null;
  __otpRemaining = 59;
}



function startCountdown(seconds = 59) {
  let counter = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 59;

  const resendText = document.getElementById("resend-text");
  if (!resendText) return; // если элементов нет — тихо выходим

  // первый рендер
  resendText.innerHTML = `Resend in <span id="countdown">${counter}</span>s`;

  const interval = setInterval(() => {
    counter = Math.max(0, counter - 1);

    const countdown = document.getElementById("countdown"); // может уже быть
    if (countdown) countdown.textContent = counter;

    resendText.innerHTML = counter > 0
      ? `Resend in <span id="countdown">${counter}</span>s`
      : `Resend Code`;

    if (counter <= 0) clearInterval(interval);
  }, 1000);
}

function showToastNotification(message, type = 'success', duration = 5000) {
  const icons = {
    success: 'fa-check',
    error: 'fa-exclamation-triangle',
    warning: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };

  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.setProperty('--hide-delay', `${(duration / 1000).toFixed(2)}s`);
  
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
  closeBtn.innerHTML = '×';
  closeBtn.onclick = () => toast.remove();

  toast.append(icon, msg, closeBtn);
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('active'));

  setTimeout(() => toast.remove(), duration + 400);
}

// js — при загрузке страницы и при изменении размера
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setVh);
window.addEventListener('load', setVh);
setVh();
