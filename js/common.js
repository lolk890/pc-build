// PC Build — общие функции для всех страниц

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartLink = document.querySelector('a[href="cart.html"]');

  if (!cartLink) return;

  const oldBadge = cartLink.querySelector(".cart-badge");
  if (oldBadge) oldBadge.remove();

  if (totalItems > 0) {
    const badge = document.createElement("span");
    badge.className = "cart-badge pop";
    badge.textContent = totalItems > 99 ? "99+" : totalItems;
    cartLink.appendChild(badge);
  }
}

function updateCompareBadge() {
  const compareList = JSON.parse(localStorage.getItem("compare") || "[]");
  const compareLink = document.querySelector('a[href="compare.html"]');

  if (!compareLink) return;

  const oldBadge = compareLink.querySelector(".compare-badge");
  if (oldBadge) oldBadge.remove();

  if (compareList.length > 0) {
    const badge = document.createElement("span");
    badge.className = "compare-badge";
    badge.textContent = compareList.length > 9 ? "9+" : compareList.length;
    compareLink.appendChild(badge);
  }
}

// ====== УПРАВЛЕНИЕ АВТОРИЗАЦИЕЙ В ШАПКЕ ======
function updateAuthUI() {
  const username = localStorage.getItem("username");
  const header = document.querySelector(".site-header");
  if (!header) return;

  const loginLink = header.querySelector(".btn-login");
  const userMenu = header.querySelector(".user-menu");

  const userIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>`;

  const arrowSvg = `<svg class="user-arrow" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 6px; vertical-align: middle;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  const displayName =
    username && username.length > 6
      ? username.substring(0, 6) + "..."
      : username;
  const fullHtml = userIconSvg + displayName + arrowSvg;

  if (username) {
    if (loginLink) loginLink.remove();

    if (userMenu) {
      const nameSpan = userMenu.querySelector(".user-name");
      if (nameSpan) nameSpan.innerHTML = fullHtml;
      return;
    }

    const menu = document.createElement("div");
    menu.className = "user-menu";

    const nameEl = document.createElement("span");
    nameEl.className = "user-name";
    nameEl.innerHTML = fullHtml;

    const dropdown = document.createElement("div");
    dropdown.className = "user-dropdown";
    dropdown.innerHTML = `
      <a href="orders.html" class="dropdown-item">Мои заказы</a>
      <a href="#" class="dropdown-item dropdown-logout">Выйти</a>
    `;

    menu.appendChild(nameEl);
    menu.appendChild(dropdown);
    header.appendChild(menu);

    // Клик по кнопке — переключить ОБОА класса
    nameEl.addEventListener("click", function (e) {
      e.stopPropagation();
      const isOpen = menu.classList.contains("open");
      menu.classList.toggle("open", !isOpen);
      dropdown.classList.toggle("active", !isOpen);
    });

    // Клик вне — закрыть ОБОА класса (В ЭТОМ БЫЛ БАГ)
    document.addEventListener("click", function () {
      menu.classList.remove("open");
      dropdown.classList.remove("active");
    });

    dropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    const logoutBtn = dropdown.querySelector(".dropdown-logout");
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("user_id");
      localStorage.removeItem("username");
      window.location.reload();
    });
  } else {
    if (userMenu) userMenu.remove();

    if (!loginLink) {
      const btn = document.createElement("a");
      btn.href = "login.html";
      btn.className = "btn-login";
      btn.textContent = "Войти";
      header.appendChild(btn);
    }
  }
}

// Инициализация при загрузке любой страницы
document.addEventListener("DOMContentLoaded", function () {
  updateCartBadge();
  updateCompareBadge();
  updateAuthUI();
});
