// PC Build — каталог: загрузка с сервера, поиск, фильтры, сортировка, пресеты

const API_URL =
  location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(location.hostname) &&
    location.port !== "8000")
    ? "http://localhost:8000" // сайт открыт отдельно (Live Server / файл) – API на порту 8000
    : ""; // сайт и API на одном адресе (Docker, хостинг) – относительные пути
let allProducts = []; // Сюда загрузятся товары с сервера

// ====== ПРЕСЕТЫ СБОРОК (объявляем СРАЗУ, чтобы не было TDZ-ошибки) ======
const buildPresets = {
  office: {
    categories: [
      "Процессоры",
      "Материнские платы",
      "Оперативная память",
      "Накопители",
      "Блоки питания",
    ],
    sort: "price-asc",
  },
  gaming: {
    categories: [
      "Процессоры",
      "Видеокарты",
      "Оперативная память",
      "Накопители",
      "Блоки питания",
      "Корпуса",
      "Охлаждение",
    ],
    sort: "price-asc",
  },
  render: {
    categories: [
      "Процессоры",
      "Видеокарты",
      "Оперативная память",
      "Накопители",
      "Блоки питания",
      "Корпуса",
      "Охлаждение",
      "Мониторы",
    ],
    sort: "price-desc",
  },
};

document.addEventListener("DOMContentLoaded", async function () {
  const grid = document.getElementById("products-grid");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const platformFilter = document.getElementById("platform-filter");
  const sortSelect = document.getElementById("sort-select");
  const applyBtn = document.getElementById("apply-filters");
  const resetBtn = document.getElementById("reset-filters");
  const countSpan = document.getElementById("products-count");

  // Индикатор загрузки
  if (grid) {
    grid.innerHTML =
      '<div class="catalog-message" style="grid-column: 1/-1; text-align: center; padding: 2rem;"><span class="spinner"></span>Загрузка товаров с сервера...</div>';
  }

  try {
    const response = await fetch(`${API_URL}/api/products`);

    if (!response.ok) {
      throw new Error(`Сервер вернул ошибку: ${response.status}`);
    }

    allProducts = await response.json();

    // Применяем начальный вид (пресет или все товары)
    applyInitialView();
  } catch (error) {
    console.error("Не удалось загрузить товары:", error);
    if (grid) {
      grid.innerHTML = `
        <div class="grid-error" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--danger);">
          <h3>Не удалось подключиться к серверу</h3>
          <p>Убедитесь, что сервер запущен командой <code>python main.py</code> в папке server/</p>
          <p>Техническая деталь: ${error.message}</p>
        </div>
      `;
    }
    if (countSpan) countSpan.textContent = "0";
  }

  // ====== ФУНКЦИИ ======

  function applyInitialView() {
    const urlParams = new URLSearchParams(window.location.search);
    const buildType = urlParams.get("build");

    if (buildType && buildPresets[buildType]) {
      const preset = buildPresets[buildType];
      let filtered = allProducts.filter((p) =>
        preset.categories.includes(p.category),
      );

      if (preset.sort === "price-asc")
        filtered.sort((a, b) => a.price - b.price);
      else if (preset.sort === "price-desc")
        filtered.sort((a, b) => b.price - a.price);

      const minPrice = Math.min(...filtered.map((p) => p.price));
      const maxPrice = Math.max(...filtered.map((p) => p.price));
      const message = `Показано ${filtered.length} компонентов для сборки. Цены: от ${minPrice.toLocaleString(
        "ru-RU",
      )} до ${maxPrice.toLocaleString("ru-RU")} ₽`;

      if (sortSelect) sortSelect.value = preset.sort;
      renderProducts(filtered, message);
    } else {
      renderProducts(allProducts);
    }
  }

  function renderProducts(items, message) {
    if (!grid) return;
    grid.innerHTML = "";
    if (countSpan) countSpan.textContent = items.length;

    if (message) {
      const msgDiv = document.createElement("div");
      msgDiv.className = "catalog-message";
      msgDiv.style.cssText =
        "grid-column: 1/-1; background: var(--surface); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; border: 1px solid var(--primary);";
      msgDiv.textContent = message;
      grid.appendChild(msgDiv);
    }

    if (items.length === 0) {
      grid.innerHTML =
        '<div class="grid-placeholder" style="grid-column: 1/-1; text-align: center; padding: 2rem;"><span class="empty-icon empty-search"></span>Ничего не найдено<br><small style="color: var(--text-muted)">Измените запрос или сбросьте фильтры</small></div>';
      return;
    }

    items.forEach((product) => {
      const div = document.createElement("div");
      div.className = "card fade-in";
      const subtext = product.brand || product.platform || product.category;
      div.innerHTML = `
        <a href="product.html?id=${product.id}">
          <img class="zoomable" src="${product.image}" alt="${product.name}" title="Нажмите, чтобы увеличить" />
          <h3 class="card-title">${product.name}</h3>
          <p>${subtext}</p>
          <p style="color: var(--accent); font-weight: 700; margin-top: 0.5rem;">
            ${product.price.toLocaleString("ru-RU")} ₽
          </p>
        </a>
      `;
      grid.appendChild(div);
    });
  }

  // ====== МОДАЛЬНОЕ ОКНО ФОТО ======
  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");
  const modalClose = document.getElementById("image-modal-close");

  function openModal(src, alt) {
    if (!modal || !modalImage) return;
    modalImage.src = src;
    modalImage.alt = alt;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ====== ФИЛЬТРАЦИЯ И СОРТИРОВКА ======
  function searchByName(items, query) {
    if (!query) return items;
    const q = query.toLowerCase().trim();
    return items.filter((p) => p.name.toLowerCase().includes(q));
  }

  function applyFilters() {
    let filtered = [...allProducts];

    if (searchInput) {
      filtered = searchByName(filtered, searchInput.value.toLowerCase().trim());
    }

    if (categoryFilter && categoryFilter.value) {
      filtered = filtered.filter((p) => p.category === categoryFilter.value);
    }

    if (platformFilter && platformFilter.value) {
      filtered = filtered.filter(
        (p) =>
          (p.brand &&
            p.brand.toLowerCase() === platformFilter.value.toLowerCase()) ||
          (p.platform &&
            p.platform.toLowerCase() === platformFilter.value.toLowerCase()),
      );
    }

    if (sortSelect) {
      const sort = sortSelect.value;
      if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
      else if (sort === "price-desc")
        filtered.sort((a, b) => b.price - a.price);
      else if (sort === "name")
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderProducts(filtered);
  }

  function resetFilters() {
    if (searchInput) searchInput.value = "";
    if (categoryFilter) categoryFilter.value = "";
    if (platformFilter) platformFilter.value = "";
    if (sortSelect) sortSelect.value = "popular";
    renderProducts(allProducts);
  }

  // ====== ОБРАБОТЧИКИ СОБЫТИЙ ======

  // 1. МГНОВЕННЫЙ ПОИСК — срабатывает сразу при вводе
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  // 2. Остальные фильтры — только по кнопке "Применить"
  if (applyBtn) {
    applyBtn.addEventListener("click", applyFilters);
  }

  // 3. Сброс фильтров
  if (resetBtn) {
    resetBtn.addEventListener("click", resetFilters);
  }
});
