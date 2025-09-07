document.addEventListener("DOMContentLoaded", () => {
  hideGlobalLoader();
  const loginContainer = document.querySelector(".login-container");
  const loginForm = document.getElementById("login-form");
  const accountSwitcher = document.getElementById("account-switcher");
  const manageToggle = document.querySelector(".login-header .close-btn");
  const closeAccount = document.getElementById("closeAccount");
  const accountList = document.getElementById("account-list");
  const addBtn = document.getElementById("add-account-btn");
  const manageAccountsBtn = document.getElementById("manage-accounts-btn");
  const manageModal = document.getElementById("manage-modal");
  const closeModal = document.getElementById("close-modal");
  const manageAccountList = document.getElementById("manage-account-list");
  const deleteAllBtn = document.getElementById("delete-all-btn");

  let accounts = JSON.parse(localStorage.getItem("savedAccounts") || "[]");

  function renderAccounts() {
    accountList.innerHTML = "";
    manageAccountList.innerHTML = "";
    accounts.forEach((acc, index) => {
      const div = document.createElement("div");
      div.className = "account-item";
      div.innerHTML = `
        <i class="fas fa-user fa-3d"></i>
        <span>${acc.username}<br><small>${acc.email}</small></span>
      `;
      div.addEventListener("click", () => {
        document.querySelector("input[name='username']").value = acc.email;
        document.querySelector("input[name='password']").value = acc.password || "";
        accountSwitcher.classList.remove("active");
        loginForm.dispatchEvent(new Event("submit"));
      });
      accountList.appendChild(div);

      const manageDiv = document.createElement("div");
      manageDiv.className = "account-item";
      manageDiv.innerHTML = `
        <span>${acc.username}</span>
        <button data-index="${index}"><i class="fas fa-trash fa-3d"></i></button>
      `;
      manageDiv.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON" && !e.target.classList.contains("fa-trash")) {
          document.querySelector("input[name='username']").value = acc.email;
          document.querySelector("input[name='password']").value = acc.password || "";
          accountSwitcher.classList.remove("active");
          loginForm.dispatchEvent(new Event("submit"));
        }
      });
      manageDiv.querySelector("button").addEventListener("click", () => {
        accounts.splice(index, 1);
        localStorage.setItem("savedAccounts", JSON.stringify(accounts));
        renderAccounts();
      });
      manageAccountList.appendChild(manageDiv);
    });
  }

  renderAccounts();

  manageToggle.addEventListener("click", () => {
    accountSwitcher.classList.add("active");
  });

  closeAccount.addEventListener("click", () => {
    accountSwitcher.classList.remove("active");
  });

  manageAccountsBtn.addEventListener("click", () => {
    manageModal.classList.remove("hidden");
    renderAccounts();
  });

  closeModal.addEventListener("click", () => {
    manageModal.classList.add("hidden");
  });

  deleteAllBtn.addEventListener("click", () => {
    accounts = [];
    localStorage.setItem("savedAccounts", JSON.stringify(accounts));
    renderAccounts();
    manageModal.classList.add("hidden");
  });



let tempUsernameUntilLog = ""; // глобальная переменная для хранения введённого username

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showGlobalLoader();

  const usernameInput = loginForm.querySelector("input[name='username']");
  const passwordInput = loginForm.querySelector("input[name='password']");
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // сохраняем username в переменную
  tempUsernameUntilLog = username;

  if (!username || !password) {
    hideGlobalLoader();
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

    if (response.status === 200 && response.headers.get("content-length") === "0") {
      const otpKey = `otpVerifiedUntil_${username}`;
      const otpUntil = parseInt(localStorage.getItem(otpKey) || "0");
      const alreadyVerified = otpUntil > Date.now();

      if (alreadyVerified) {
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

        hideGlobalLoader();
        window.location.href = "/app";
        return;
      }

      const otpRes = await fetch("/send-2fa-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });

      const otpData = await otpRes.json();
      hideGlobalLoader();

      if (otpRes.ok) {
        showOtpUI(otpData.masked_email);
      } else {
        showToastNotification(otpData.error || "Failed to send OTP", "error");
      }
    } else {
      hideGlobalLoader();
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const banNotice = doc.querySelector(".ban-notice");

      if (banNotice) {
        document.body.innerHTML = html;
        const reactivateBtn = document.getElementById('reactivate-btn');

        if (reactivateBtn) {
          reactivateBtn.addEventListener('click', async () => {
            // берём username из глобальной переменной, а не из data-username
            const username = tempUsernameUntilLog || sessionStorage.getItem("tempUsername");

            if (!username) {
              return showToastNotification("Username not found.", "error");
            }
            if (!document.getElementById('agree-terms').checked) {
              return showToastNotification("Please agree to the Terms of Use.", "error");
            }

            try {
              const reactivateRes = await fetch(`/banned-user-reactivate/${username}`, { method: 'POST' });
              const data = await reactivateRes.json();
              if (data.status === 'success') {
                const tempUsername = sessionStorage.getItem("tempUsername");
                const tempPassword = sessionStorage.getItem("tempPassword");

                if (tempUsername && tempPassword) {
                  const retry = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: tempUsername, password: tempPassword })
                  });

                  if (retry.status === 200 && retry.headers.get("content-length") === "0") {
                    sessionStorage.removeItem("tempUsername");
                    sessionStorage.removeItem("tempPassword");
                    window.location.href = "/app";
                  } else {
                    showToastNotification("Login failed after reactivation.", "error");
                    location.reload();
                  }
                } else {
                  location.reload();
                }
              } else {
                showToastNotification(data.message, "error");
              }
            } catch (err) {
              showToastNotification("Reactivation failed. Please try again.", "error");
            }
          });
        }
      } else {
        const errorMatch = html.match(/<div class="error-message">(.*?)<\/div>/);
        showToastNotification(errorMatch ? errorMatch[1] : "Login failed. Please try again.", "error");
      }
    }
  } catch (err) {
    hideGlobalLoader();
    console.error("Login error:", err);
    showToastNotification("Login failed. Please check your connection.", "error");
  }
});



function showOtpUI(maskedEmail) {
  const username = sessionStorage.getItem("tempUsername");
  const password = sessionStorage.getItem("tempPassword");

  if (!username || !password) {
    showToastNotification("Session expired. Please login again.", "error");
    return;
  }

  const otpKey = `otpVerifiedUntil_${username}`;
  const otpUntil = parseInt(localStorage.getItem(otpKey) || "0");
  const alreadyVerified = otpUntil > Date.now();

  if (alreadyVerified) {
    // ✅ Skip OTP and finalize login directly (no extra /login)
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
    return; // ⛔ No OTP UI shown
  }

  // ❌ Show OTP input modal
  const existing = document.getElementById("otp-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "otp-modal";
  modal.className = "otp-modal-overlay";
  modal.innerHTML = `
    <div class="otp-modal-content">
      <h2>OTP Code Verification</h2>
      <p>We’ve sent a 6-digit code to <b>${maskedEmail}</b></p>
      <div class="otp-inputs" id="otp-inputs">
        ${Array(6).fill("").map(() => `<input type="text" maxlength="1" class="otp-digit" />`).join("")}
      </div>
      <button id="verify-btn">Verify</button>
      <p class="otp-resend" id="otp-resend">Didn't receive code? <br><span id="resend-text">Resend in <span id="countdown">59</span>s</span></p>
    </div>
  `;
  document.body.appendChild(modal);

  setupOtpInputs();
  startCountdown();

  document.getElementById("verify-btn").addEventListener("click", verifyOtp);
  document.getElementById("otp-resend").addEventListener("click", resendOtp);
}



function setupOtpInputs() {
  const inputs = document.querySelectorAll(".otp-digit");

  inputs.forEach((input, idx) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && input.value === "" && idx > 0) {
        inputs[idx - 1].focus();
      }
    });
  });

  inputs[0].focus();
}

async function verifyOtp() {
  const digits = Array.from(document.querySelectorAll(".otp-digit"))
    .map(i => i.value.trim())
    .join("");

  if (digits.length !== 6) {
    showToastNotification("Please enter the 6-digit code.", "error");
    return;
  }

  try {
    const verifyResponse = await fetch("/verify-2fa-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: digits })
    });

    showGlobalLoader();

    const verifyData = await verifyResponse.json();

    if (verifyResponse.ok && verifyData.success) {
      hideGlobalLoader();

      const username = sessionStorage.getItem("tempUsername");
      const password = sessionStorage.getItem("tempPassword");

      if (!username || !password) {
        showToastNotification("Missing credentials. Please login again.", "error");
        return;
      }

      // ✅ Mark OTP as verified for this username
      const otpKey = `otpVerifiedUntil_${username}`;
      const expiration = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
      localStorage.setItem(otpKey, expiration.toString());

      // ✅ Save account locally (no second /login request)
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

      // ✅ Finalize login state
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("password", password);
      sessionStorage.removeItem("tempUsername");
      sessionStorage.removeItem("tempPassword");

      // ✅ Redirect to app
      window.location.href = "/app";
    } else {
      hideGlobalLoader();
      showToastNotification(verifyData.error || "Invalid code.", "error");
    }
  } catch (err) {
    hideGlobalLoader();
    showToastNotification("Verification failed. Try again.", "error");
  }
}


function startCountdown() {
  let counter = 59;
  const countdown = document.getElementById("countdown");
  const resendText = document.getElementById("resend-text");

  resendText.textContent = `Resend in ${counter}s`;
  countdown.textContent = counter;

  const interval = setInterval(() => {
    counter--;
    countdown.textContent = counter;
    resendText.textContent = `Resend in ${counter}s`;
    if (counter <= 0) {
      clearInterval(interval);
      resendText.textContent = "Resend Code";
    }
  }, 1000);
}

});


const globalLottieLoader = document.getElementById("global-lottie-loader");
const globalLottieAnimation = document.getElementById("global-lottie-animation");

const loadingAnimation = lottie.loadAnimation({
  container: globalLottieAnimation,
  renderer: 'svg',
  loop: true,
  autoplay: false,
  path: 'static/animations/login.json'
});

function showGlobalLoader() {
  globalLottieLoader.style.display = "flex";
  loadingAnimation.play();
}

function hideGlobalLoader() {
  loadingAnimation.stop();
  globalLottieLoader.style.display = "none";
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

var canvasDots = function() {
    var canvas = document.querySelector('canvas'),
        ctx = canvas.getContext('2d'),
        colorDot = '#CECECE',
        color = '#CECECE';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    ctx.fillStyle = colorDot;
    ctx.lineWidth = .1;
    ctx.strokeStyle = color;

    var mousePosition = {
        x: 30 * canvas.width / 100,
        y: 30 * canvas.height / 100
    };

    var dots = {
        nb: 600,
        distance: 60,
        d_radius: 100,
        array: []
    };

    function Dot(){
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;

        this.vx = -.5 + Math.random();
        this.vy = -.5 + Math.random();

        this.radius = Math.random();
    }

    Dot.prototype = {
        create: function(){
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fill();
        },

        animate: function(){
            for(i = 0; i < dots.nb; i++){

                var dot = dots.array[i];

                if(dot.y < 0 || dot.y > canvas.height){
                    dot.vx = dot.vx;
                    dot.vy = - dot.vy;
                }
                else if(dot.x < 0 || dot.x > canvas.width){
                    dot.vx = - dot.vx;
                    dot.vy = dot.vy;
                }
                dot.x += dot.vx;
                dot.y += dot.vy;
            }
        },

        line: function(){
            for(i = 0; i < dots.nb; i++){
                for(j = 0; j < dots.nb; j++){
                    i_dot = dots.array[i];
                    j_dot = dots.array[j];

                    if((i_dot.x - j_dot.x) < dots.distance && (i_dot.y - j_dot.y) < dots.distance && (i_dot.x - j_dot.x) > - dots.distance && (i_dot.y - j_dot.y) > - dots.distance){
                        if((i_dot.x - mousePosition.x) < dots.d_radius && (i_dot.y - mousePosition.y) < dots.d_radius && (i_dot.x - mousePosition.x) > - dots.d_radius && (i_dot.y - mousePosition.y) > - dots.d_radius){
                            ctx.beginPath();
                            ctx.moveTo(i_dot.x, i_dot.y);
                            ctx.lineTo(j_dot.x, j_dot.y);
                            ctx.stroke();
                            ctx.closePath();
                        }
                    }
                }
            }
        }
    };

    function createDots(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for(i = 0; i < dots.nb; i++){
            dots.array.push(new Dot());
            dot = dots.array[i];

            dot.create();
        }

        dot.line();
        dot.animate();
    }

    window.onmousemove = function(parameter) {
        mousePosition.x = parameter.pageX;
        mousePosition.y = parameter.pageY;
    }

    mousePosition.x = window.innerWidth / 2;
    mousePosition.y = window.innerHeight / 2;

    setInterval(createDots, 1000/30);
};

window.onload = function() {
    canvasDots();
};