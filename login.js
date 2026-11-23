const API_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", function () {
  const panels = document.querySelectorAll(".auth-panel");
  const switches = document.querySelectorAll(".auth-switch");
  const authMessage = document.getElementById("auth-message");

  function switchPanel(name) {
    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === name);
    });
    authMessage.textContent = "";
    authMessage.style.color = "var(--text)";
    clearAllFieldErrors();
  }

  switches.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      switchPanel(btn.dataset.switch);
    });
  });

  function showMessage(text, isError = false) {
    authMessage.textContent = text;
    authMessage.style.color = isError ? "var(--danger)" : "var(--accent)";
  }

  // ====== ПОЛЕВЫЕ ОШИБКИ ======
  function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorSpan = document.getElementById("err-" + inputId);
    if (input) input.classList.add("input-error");
    if (errorSpan) errorSpan.textContent = message;
  }

  function clearAllFieldErrors() {
    document
      .querySelectorAll(".field-error")
      .forEach((el) => (el.textContent = ""));
    document
      .querySelectorAll(".input-error")
      .forEach((el) => el.classList.remove("input-error"));
  }

  // Убираем ошибку при начале ввода
  document.querySelectorAll(".auth-panel input").forEach((input) => {
    input.addEventListener("input", function () {
      this.classList.remove("input-error");
      const errSpan = document.getElementById("err-" + this.id);
      if (errSpan) errSpan.textContent = "";
    });
  });
  // =============================

  // ====== 1. ВХОД ======
  const loginForm = document.getElementById("login-panel");
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearAllFieldErrors();

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    let hasError = false;

    if (!username) {
      showFieldError("login-username", "Введите имя пользователя");
      hasError = true;
    }
    if (!password) {
      showFieldError("login-password", "Введите пароль");
      hasError = true;
    }

    if (hasError) return;

    showMessage("Проверяем данные...");

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", data.username);
        showMessage("Вход выполнен! Перенаправление...");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 800);
      } else {
        showMessage(data.detail || "Неверный логин или пароль", true);
      }
    } catch (error) {
      showMessage("Сервер недоступен. Запусти python main.py", true);
    }
  });

  // ====== 2. РЕГИСТРАЦИЯ ======
  const registerForm = document.getElementById("register-panel");
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearAllFieldErrors();

    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    let hasError = false;

    if (!username) {
      showFieldError("reg-username", "Введите имя пользователя");
      hasError = true;
    } else if (username.length < 2) {
      showFieldError("reg-username", "Имя должно быть не короче 2 символов");
      hasError = true;
    } else if (username.length > 12) {
      showFieldError("reg-username", "Имя не должно быть длиннее 12 символов");
      hasError = true;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ0-9_]+$/.test(username)) {
      showFieldError(
        "reg-username",
        "Имя может содержать только буквы, цифры и _",
      );
      hasError = true;
    }

    if (!email) {
      showFieldError("reg-email", "Введите email");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError("reg-email", "Проверьте адрес e-mail");
      hasError = true;
    }

    if (!password) {
      showFieldError("reg-password", "Введите пароль");
      hasError = true;
    } else if (password.length < 6) {
      showFieldError("reg-password", "Пароль должен быть не короче 6 символов");
      hasError = true;
    }

    if (hasError) return;

    showMessage("Создаём аккаунт...");

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage("Аккаунт создан! Теперь войдите.");
        registerForm.reset();
        document.getElementById("login-username").value = username;
        setTimeout(() => switchPanel("login"), 1000);
      } else {
        showMessage(data.detail || "Ошибка регистрации", true);
      }
    } catch (error) {
      showMessage("Сервер недоступен. Запусти python main.py", true);
    }
  });

  // ====== 3. ВОССТАНОВЛЕНИЕ ПАРОЛЯ ======
  const forgotForm = document.getElementById("forgot-panel");
  forgotForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearAllFieldErrors();

    const email = document.getElementById("forgot-email").value.trim();
    let hasError = false;

    if (!email) {
      showFieldError("forgot-email", "Введите email");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError("forgot-email", "Проверьте адрес e-mail");
      hasError = true;
    }

    if (hasError) return;

    showMessage("Отправляем код...");

    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(data.message || "Если email существует, код отправлен.");
        forgotForm.reset();
      } else {
        showMessage(data.detail || "Ошибка", true);
      }
    } catch (error) {
      showMessage("Сервер недоступен", true);
    }
  });
});
