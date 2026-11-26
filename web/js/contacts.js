// PC Build — контакты: валидация + toast по центру экрана

// ====== Карта: адрес -> координаты (Nominatim) -> карта OpenStreetMap (Leaflet) ======
const SHOP_ADDRESS = "Санкт-Петербург, Невский проспект, 114";
const SHOP_TITLE = "PC Build — Невский проспект, 114";

async function loadShopMap() {
  const status = document.getElementById("map-status");
  const mapBox = document.getElementById("map");

  if (!status || !mapBox) return;

  // Защита от повторной инициализации (лаги при переходе между вкладками)
  if (mapBox._leaflet_id) {
    status.hidden = true;
    return;
  }

  status.hidden = false;
  status.classList.remove("map-error");
  status.textContent = "Загружаем карту…";

  try {
    if (typeof L === "undefined") {
      throw new Error("библиотека Leaflet не подключена в HTML");
    }

    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
      encodeURIComponent(SHOP_ADDRESS);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PCBuildStudentProject/1.0 (contact@pcbuild.ru)",
      },
    });

    if (!response.ok) {
      throw new Error("сервер вернул ошибку " + response.status);
    }

    const results = await response.json();
    if (!results || !results.length) {
      throw new Error("адрес не найден в базе карт");
    }

    const lat = parseFloat(results[0].lat);
    const lon = parseFloat(results[0].lon);

    // ГЛАВНЫЙ ФИКС: отключаем зум колесом мыши.
    // Теперь скролл страницы работает как обычно, даже когда курсор над картой.
    const map = L.map(mapBox, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([lat, lon], 16);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Попап открывается только по клику на маркер, а не висит постоянно.
    // Это убирает перекрытие соседних блоков при прокрутке.
    L.marker([lat, lon]).addTo(map).bindPopup(SHOP_TITLE);

    // Пересчитываем размеры контейнера (лечит «карта уезжает вверх» после загрузки)
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    status.hidden = true;
  } catch (error) {
    console.error("Ошибка загрузки карты:", error);
    status.classList.add("map-error");
    status.textContent = "Не удалось загрузить карту. Адрес: " + SHOP_ADDRESS;
  }
}

document.addEventListener("DOMContentLoaded", loadShopMap);

// Вызываем ТОЛЬКО ОДИН РАЗ при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  loadShopMap();

  const form = document.getElementById("contact-form");
  if (!form) {
    console.error("Форма #contact-form НЕ НАЙДЕНА!");
    return;
  }
  console.log("Форма найдена, вешаем обработчик");

  function showToast(message, isError) {
    console.log("Показываем toast:", message);

    const oldToast = document.querySelector(".toast-notification");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className =
      "toast-notification " + (isError ? "toast-error" : "toast-success");
    toast.textContent = message;
    document.body.appendChild(toast);
    console.log("Toast добавлен в DOM");

    setTimeout(() => {
      toast.classList.add("toast-hide");
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 300);
    }, 3000);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("Форма отправлена");

    const name = document.getElementById("field-name");
    const email = document.getElementById("field-email");
    const message = document.getElementById("field-message");

    if (!name || !email || !message) {
      console.error("Поля формы не найдены");
      showToast("Ошибка формы", true);
      return;
    }

    let isValid = true;

    const errName = document.getElementById("error-name");
    const errEmail = document.getElementById("error-email");
    const errMessage = document.getElementById("error-message");

    if (name.value.trim().length < 2) {
      if (errName) errName.textContent = "Введите имя (минимум 2 символа)";
      name.classList.add("invalid");
      isValid = false;
    } else {
      if (errName) errName.textContent = "";
      name.classList.remove("invalid");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.value.trim())) {
      if (errEmail) errEmail.textContent = "Введите корректный email";
      email.classList.add("invalid");
      isValid = false;
    } else {
      if (errEmail) errEmail.textContent = "";
      email.classList.remove("invalid");
    }

    if (message.value.trim().length < 10) {
      if (errMessage) errMessage.textContent = "Минимум 10 символов";
      message.classList.add("invalid");
      isValid = false;
    } else {
      if (errMessage) errMessage.textContent = "";
      message.classList.remove("invalid");
    }

    if (!isValid) {
      showToast("Проверьте поля формы", true);
      return;
    }

    showToast("Сообщение отправлено!", false);
    form.reset();
  });
});
