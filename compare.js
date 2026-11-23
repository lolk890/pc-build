// PC Build — сравнение товаров: таблица, группы характеристик, модальное подтверждение

// ====== Модальное окно подтверждения ======
const confirmOverlay = document.getElementById("confirm-overlay");
const confirmTitle = document.getElementById("confirm-title");
const confirmMessage = document.getElementById("confirm-message");
const confirmYesBtn = document.getElementById("confirm-yes");
const confirmNoBtn = document.getElementById("confirm-no");
let confirmCallback = null;

function showConfirm(message, callback, title, yesText) {
  if (!confirmTitle) return;
  confirmTitle.textContent = title || "Подтверждение";
  confirmMessage.textContent = message;
  confirmYesBtn.textContent = yesText || "Убрать";
  confirmNoBtn.textContent = "Оставить";
  confirmCallback = callback;
  confirmOverlay.classList.add("active");
  if (confirmNoBtn) confirmNoBtn.focus(); // Enter случайно не удалит
}

function hideConfirm() {
  confirmOverlay.classList.remove("active");
  confirmCallback = null;
}

if (confirmYesBtn)
  confirmYesBtn.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    hideConfirm();
  });
if (confirmNoBtn) confirmNoBtn.addEventListener("click", hideConfirm);
if (confirmOverlay)
  confirmOverlay.addEventListener("click", (e) => {
    if (e.target === confirmOverlay) hideConfirm();
  });
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    confirmOverlay &&
    confirmOverlay.classList.contains("active")
  )
    hideConfirm();
});

// ====== Основная логика сравнения ======
document.addEventListener("DOMContentLoaded", function () {
  const compareContent = document.getElementById("compare-content");
  if (!compareContent) return;

  // Теперь compareList содержит ПОЛНЫЕ объекты товаров (как мы сделали в product.js)
  const compareList = JSON.parse(localStorage.getItem("compare") || "[]");

  const importantSpecs = [
    "Количество ядер",
    "Количество потоков",
    "Базовая частота",
    "Boost частота",
    "Кэш L2",
    "Кэш L3",
    "TDP",
    "Сокет",
    "Поддержка памяти",
    "Объём памяти",
    "Шина памяти",
    "Пропускная способность памяти",
    "CUDA-ядра",
    "RT-ядра",
    "Tensor-ядра",
    "Частота",
    "Объём комплекта",
    "Скорость чтения",
    "Скорость записи",
    "Мощность",
    "Диагональ",
    "Разрешение",
    "Частота обновления",
    "Тип матрицы",
  ];

  const keyAliases = {
    "Производитель чипа": "Производитель",
    "Производитель карты": "Производитель",
    Производитель: "Производитель",
    Разъемы: "Разъёмы",
    "Разъем питания": "Разъём питания",
    "Объем памяти": "Объём памяти",
    "Объем комплекта": "Объём комплекта",
    "Макс. объем памяти": "Макс. объём памяти",
  };

  const specGroups = {
    Общие: [
      "Производитель",
      "Страна производства",
      "Артикул",
      "Гарантия",
      "Модель",
      "Стандарт",
      "Сертификат",
      "Форм-фактор",
      "Материал",
      "Цвет",
      "Технология",
      "Контроллер",
      "Тип памяти",
    ],
    Процессор: [
      "Количество ядер",
      "Количество потоков",
      "Базовая частота",
      "Boost частота",
      "Кэш L2",
      "Кэш L3",
      "Техпроцесс",
      "Сокет",
      "Поддержка памяти",
      "TDP",
      "Интегрированная графика",
    ],
    Видеокарта: [
      "Производитель чипа",
      "Производитель карты",
      "Объём памяти",
      "Шина памяти",
      "Пропускная способность памяти",
      "CUDA-ядра",
      "RT-ядра",
      "Tensor-ядра",
      "Вычислительные блоки",
      "Поддержка API",
      "Разъёмы",
      "Разъём питания",
      "Рекомендуемый блок питания",
    ],
    "Материнская плата": [
      "Чипсет",
      "Система питания",
      "Слоты памяти",
      "Макс. объём памяти",
      "Макс. частота памяти",
      "Слоты PCIe",
      "M.2 слоты",
      "SATA порты",
      "USB порты",
      "Сеть",
      "Аудио",
    ],
    "Оперативная память": [
      "Тип памяти",
      "Форм-фактор",
      "Объём комплекта",
      "Частота",
      "Тайминги",
      "Напряжение",
      "Поддержка XMP",
      "Подсветка",
      "Материал радиатора",
      "Высота модуля",
    ],
    Накопитель: [
      "Интерфейс",
      "Объём",
      "Тип памяти",
      "Скорость чтения",
      "Скорость записи",
      "Случайное чтение (4K)",
      "Случайная запись (4K)",
      "Ресурс TBW",
      "Скорость вращения",
      "Кэш",
      "Среднее время поиска",
      "Уровень шума",
      "Нагрузка (рабочая)",
    ],
    "Блок питания": [
      "Мощность",
      "Модульность",
      "Вентилятор",
      "Скорость вентилятора",
      "Конденсаторы",
      "Защиты",
    ],
    Корпус: [
      "Материнские платы",
      'Отсеки 3.5"',
      'Отсеки 2.5"',
      "Слоты расширения",
      "Передние вентиляторы",
      "Верхние вентиляторы",
      "Задний вентилятор",
      "Боковой вентилятор",
      "Радиаторы",
      "Макс. длина видеокарты",
      "Макс. высота кулера",
    ],
    Охлаждение: [
      "Тип",
      "Высота",
      "Вентиляторы",
      "Скорость вентиляторов",
      "Уровень шума",
      "Воздушный поток",
      "Тепловые трубки",
      "Совместимость Intel",
      "Совместимость AMD",
      "Материал радиатора",
    ],
    Монитор: [
      "Диагональ",
      "Разрешение",
      "Соотношение сторон",
      "Тип матрицы",
      "Покрытие экрана",
      "Частота обновления",
      "Время отклика",
      "Яркость",
      "Контрастность",
      "Цветовой охват",
      "Поддержка HDR",
      "Адаптивная синхронизация",
      "Регулировка подставки",
      "VESA",
    ],
    Другое: [],
  };

  function normalizeKey(key) {
    return keyAliases[key] || key;
  }

  function findGroup(key) {
    const normalized = normalizeKey(key);
    for (const [groupName, keys] of Object.entries(specGroups)) {
      if (groupName === "Другое") continue;
      if (keys.includes(normalized) || keys.includes(key)) return groupName;
    }
    return "Другое";
  }

  if (compareList.length === 0) {
    compareContent.innerHTML = `
      <div class="compare-empty">
        <span class="empty-icon empty-compare"></span>
        <h2>Список сравнения пуст</h2>
        <p class="compare-empty-text">
          Добавьте товары для сравнения, нажав кнопку «Сравнить» на странице товара
        </p>
        <a href="catalog.html" class="button">Перейти в каталог</a>
      </div>`;
    return;
  }

  // ГЛАВНОЕ ИЗМЕНЕНИЕ: compareList уже содержит полные объекты товаров!
  // Больше не нужно искать их в products.js
  const compareProducts = compareList;

  if (compareProducts.length === 0) {
    compareContent.innerHTML = `
      <div class="compare-empty">
        <h2>Товары не найдены</h2>
        <a href="catalog.html" class="button">Перейти в каталог</a>
      </div>`;
    return;
  }

  const allKeysSet = new Set();
  compareProducts.forEach((p) => {
    if (p.specs) {
      Object.keys(p.specs).forEach((key) => allKeysSet.add(normalizeKey(key)));
    }
  });

  const keyDataMap = new Map();
  allKeysSet.forEach((normalizedKey) => {
    const values = compareProducts.map((p) => {
      if (!p.specs) return undefined;
      for (const [origKey, alias] of Object.entries(keyAliases)) {
        if (alias === normalizedKey && p.specs[origKey] !== undefined)
          return p.specs[origKey];
      }
      return p.specs[normalizedKey];
    });
    keyDataMap.set(normalizedKey, values);
  });

  const filteredKeys = [];
  keyDataMap.forEach((values, key) => {
    const nonEmptyCount = values.filter(
      (v) => v !== undefined && v !== "",
    ).length;
    if (nonEmptyCount >= 2) filteredKeys.push(key);
  });

  const groupedKeys = {};
  Object.keys(specGroups).forEach((g) => {
    groupedKeys[g] = [];
  });
  filteredKeys.forEach((key) => {
    const group = findGroup(key);
    if (!groupedKeys[group]) groupedKeys[group] = [];
    groupedKeys[group].push(key);
  });

  const groupOrder = [
    "Общие",
    "Процессор",
    "Видеокарта",
    "Материнская плата",
    "Оперативная память",
    "Накопитель",
    "Блок питания",
    "Корпус",
    "Охлаждение",
    "Монитор",
    "Другое",
  ];

  let html = "";
  const N = compareProducts.length;

  // Десктопная таблица
  html += '<div class="compare-desktop"><table class="compare-table">';
  html += "<thead><tr><th>Характеристика</th>";
  compareProducts.forEach((p) => {
    html += `
      <th>
        <img src="${p.image}" alt="${p.name}" class="compare-product-img">
        <div class="compare-product-name"><a href="product.html?id=${p.id}">${p.name}</a></div>
        <div class="compare-product-price">${p.price.toLocaleString("ru-RU")} ₽</div>
        <button class="btn-remove-compare" data-id="${p.id}">Убрать</button>
      </th>`;
  });
  html += "</tr></thead><tbody>";

  groupOrder.forEach((groupName) => {
    const keys = groupedKeys[groupName];
    if (!keys || keys.length === 0) return;
    html += `<tr class="compare-group-header"><td colspan="${N + 1}">${groupName}</td></tr>`;
    keys.forEach((key) => {
      const values = keyDataMap.get(key);
      const isImportant = importantSpecs.includes(key);
      html += `<tr class="${isImportant ? "important" : ""}"><td>${key}</td>`;
      values.forEach((v) => {
        html +=
          v === undefined || v === ""
            ? '<td><span class="empty-value">—</span></td>'
            : `<td>${v}</td>`;
      });
      html += "</tr>";
    });
  });
  html += "</tbody></table></div>";

  // Мобильная версия: grid с горизонтальным скроллом
  html += '<div class="compare-mobile-grid">';
  html += '<div class="compare-grid-wrapper">';
  html += `<div class="compare-grid cols-${N}">`;
  html += '<div class="compare-grid-cell corner">Характеристика</div>';
  compareProducts.forEach((p) => {
    html += `
      <div class="compare-grid-cell row-header">
        <img src="${p.image}" alt="${p.name}">
        <div class="g-name"><a href="product.html?id=${p.id}">${p.name}</a></div>
        <div class="g-price">${p.price.toLocaleString("ru-RU")} ₽</div>
        <button class="btn-remove-compare" data-id="${p.id}">Убрать</button>
      </div>`;
  });

  groupOrder.forEach((groupName) => {
    const keys = groupedKeys[groupName];
    if (!keys || keys.length === 0) return;
    html += `<div class="compare-grid-cell group-header col-label">${groupName}</div>`;
    for (let i = 0; i < N; i++) {
      html += '<div class="compare-grid-cell group-header"></div>';
    }
    keys.forEach((key) => {
      const values = keyDataMap.get(key);
      const isImportant = importantSpecs.includes(key);
      html += `<div class="compare-grid-cell col-label ${isImportant ? "important-label" : ""}">${key}</div>`;
      values.forEach((v) => {
        html +=
          v === undefined || v === ""
            ? '<div class="compare-grid-cell"><span class="empty-value">—</span></div>'
            : `<div class="compare-grid-cell ${isImportant ? "important-value" : ""}">${v}</div>`;
      });
    });
  });
  html += "</div></div></div>";

  html += `
    <div class="compare-actions">
      <a href="catalog.html" class="button-reset">Вернуться в каталог</a>
      <button id="btn-clear-compare" class="button">Очистить сравнение</button>
    </div>`;

  compareContent.innerHTML = html;

  // Кнопки "Убрать" у отдельных товаров
  document.querySelectorAll(".btn-remove-compare").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = parseInt(this.dataset.id, 10);
      // ГЛАВНОЕ ИЗМЕНЕНИЕ: ищем товар прямо в compareProducts
      const product = compareProducts.find((p) => p.id === id);
      const name = product ? product.name : "этот товар";
      showConfirm(
        `«${name}» исчезнет из списка сравнения. Добавить его снова можно со страницы товара.`,
        () => {
          let list = JSON.parse(localStorage.getItem("compare") || "[]");
          list = list.filter((item) => item.id !== id);
          localStorage.setItem("compare", JSON.stringify(list));
          location.reload();
        },
        "Убрать из сравнения?",
        "Убрать",
      );
    });
  });

  // Кнопка "Очистить сравнение"
  const clearBtn = document.getElementById("btn-clear-compare");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      showConfirm(
        "Все товары уйдут из списка сравнения. Добавить их снова можно из каталога.",
        () => {
          localStorage.removeItem("compare");
          location.reload();
        },
        "Очистить сравнение?",
        "Очистить",
      );
    });
  }
});
