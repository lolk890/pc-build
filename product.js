const API_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  const main = document.getElementById("product-page");
  if (!main) return;

  if (!productId) {
    showNotFound(main, "Не указан ID товара в адресной строке.");
    return;
  }

  main.innerHTML = `
    <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
      <p><span class="spinner"></span>Загрузка товара...</p>
    </div>
  `;

  try {
    const response = await fetch(`${API_URL}/api/products/${productId}`);
    if (!response.ok)
      throw new Error(`Сервер вернул ошибку: ${response.status}`);
    const product = await response.json();
    renderProduct(main, product);
  } catch (error) {
    console.error("Ошибка загрузки товара:", error);
    showNotFound(
      main,
      "Не удалось загрузить данные о товаре. Убедитесь, что сервер запущен.",
    );
  }
});

function renderProduct(main, product) {
  document.title = `${product.name} — PC Build`;

  const specs = product.specs || {};
  const highlightKeys = Object.keys(specs).slice(0, 4);
  const highlightsHTML = highlightKeys
    .map(
      (key) => `
    <div class="highlight-item">
      <span class="highlight-icon">✓</span>
      <span>${escapeHtml(key)}: ${escapeHtml(String(specs[key]))}</span>
    </div>
  `,
    )
    .join("");

  const specsHTML = Object.entries(specs)
    .map(
      ([key, value]) => `
    <dt>${escapeHtml(key)}</dt>
    <dd>${escapeHtml(String(value))}</dd>
  `,
    )
    .join("");

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartItem = cart.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const compareList = JSON.parse(localStorage.getItem("compare")) || [];
  const isInCompare = compareList.some((item) => item.id === product.id);

  main.innerHTML = `
    <div class="product-top">
      <a href="catalog.html" class="back-link" aria-label="Назад в каталог">Назад</a>
      <div class="product-image">
        <img src="${product.image}" alt="${escapeHtml(product.name)}" />
      </div>
      <div class="product-info-header">
        <div class="tagline">${escapeHtml(product.category)}</div>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="brand-name">${escapeHtml(product.brand)}</div>
      </div>
      <div class="product-info-footer">
        <div class="product-highlights">${highlightsHTML}</div>
        <div class="price">${product.price.toLocaleString("ru-RU")} ₽</div>
        <div class="product-actions">
          ${quantity > 0 ? renderCartButton(product.id, quantity) : `<button class="button" id="add-to-cart-btn">Добавить в сборку</button>`}
          <button class="button-secondary ${isInCompare ? "in-compare" : ""}" id="compare-btn" data-product-id="${product.id}">
            ${isInCompare ? "В сравнении" : "Сравнить"}
          </button>
        </div>
      </div>
    </div>

    <section class="description-section">
      <h2>Характеристики</h2>
      <dl class="specs">${specsHTML}</dl>
    </section>

    <section class="description-section">
      <h2>Описание</h2>
      <div class="product-description">${product.description}</div>
    </section>
  `;
  // ... (выше идет генерация HTML) ...

  setupCartButton(product);
  setupCompareButton(product);
} // <-- Закрывающая скобка функции renderProduct
function renderCartButton(productId, quantity) {
  return `
    <div class="cart-qty-wrapper" data-product-id="${productId}">
      <button class="qty-btn" data-action="decrease" aria-label="Уменьшить">−</button>
      <div class="qty-display">
        <div class="qty-number">${quantity}</div>
        <div class="qty-label">В корзине</div>
      </div>
      <button class="qty-btn" data-action="increase" aria-label="Увеличить">+</button>
    </div>
  `;
}

function setupCartButton(product) {
  const cartBtn = document.getElementById("add-to-cart-btn");
  const cartQtyWrapper = document.querySelector(".cart-qty-wrapper");

  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      addToCart(product, 1);
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const cartItem = cart.find((item) => item.id === product.id);
      const quantity = cartItem ? cartItem.quantity : 0;

      cartBtn.outerHTML = renderCartButton(product.id, quantity);
      setupCartButton(product);
    });
  }

  if (cartQtyWrapper) {
    const decreaseBtn = cartQtyWrapper.querySelector(
      '[data-action="decrease"]',
    );
    const increaseBtn = cartQtyWrapper.querySelector(
      '[data-action="increase"]',
    );

    // === ИСПРАВЛЕНИЕ ЗДЕСЬ ===
    decreaseBtn.addEventListener("click", () => {
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      const cartItem = cart.find((item) => item.id === product.id);

      if (cartItem) {
        cartItem.quantity -= 1;

        if (cartItem.quantity <= 0) {
          cart = cart.filter((item) => item.id !== product.id);
          localStorage.setItem("cart", JSON.stringify(cart));

          const actionsDiv = document.querySelector(".product-actions");
          const compareBtn = document.getElementById("compare-btn");
          actionsDiv.innerHTML = `<button class="button" id="add-to-cart-btn">Добавить в сборку</button>`;
          actionsDiv.appendChild(compareBtn);
          setupCartButton(product);
        } else {
          localStorage.setItem("cart", JSON.stringify(cart));
          const qtyNumber = cartQtyWrapper.querySelector(".qty-number");
          qtyNumber.textContent = cartItem.quantity;
        }

        // !!! ГЛАВНОЕ: обновляем цифру в шапке при уменьшении !!!
        if (typeof updateCartBadge === "function") {
          updateCartBadge();
        }
      }
    });

    increaseBtn.addEventListener("click", () => {
      addToCart(product, 1); // addToCart уже вызывает updateCartBadge()
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const cartItem = cart.find((item) => item.id === product.id);
      const qtyNumber = cartQtyWrapper.querySelector(".qty-number");
      if (qtyNumber && cartItem) qtyNumber.textContent = cartItem.quantity;
    });
  }
}

function setupCompareButton(product) {
  const compareBtn = document.getElementById("compare-btn");
  if (!compareBtn) return;

  compareBtn.addEventListener("click", () => {
    let compareList = JSON.parse(localStorage.getItem("compare")) || [];
    const index = compareList.findIndex((item) => item.id === product.id);

    if (index === -1) {
      compareList.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        platform: product.platform,
        price: product.price,
        image: product.image,
        shortDesc: product.shortDesc,
        specs: product.specs,
      });
      compareBtn.textContent = "В сравнении";
      compareBtn.classList.add("in-compare");
    } else {
      compareList.splice(index, 1);
      compareBtn.textContent = "Сравнить";
      compareBtn.classList.remove("in-compare");
    }

    localStorage.setItem("compare", JSON.stringify(compareList));
    if (typeof updateCompareBadge === "function") updateCompareBadge();
  });
}

function addToCart(product, quantity = 1) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      brand: product.brand,
      category: product.category,
      image: product.image,
      quantity: quantity,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  if (typeof updateCartBadge === "function") updateCartBadge();
}

function showNotFound(main, message) {
  main.innerHTML = `
    <div style="text-align: center; padding: 4rem 2rem;">
      <h1>Товар не найден</h1>
      <p style="color: var(--text-muted); margin: 1rem 0 2rem;">${message}</p>
      <a href="catalog.html" class="button">Вернуться в каталог</a>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
