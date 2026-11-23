document.addEventListener("DOMContentLoaded", function () {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalElement = document.getElementById("cart-total");
  const cartCountElement = document.getElementById("cart-count");
  const btnCheckout = document.getElementById("btn-checkout");
  const checkoutResult = document.getElementById("checkout-result");

  // Сообщение хранится в localStorage вместе со временем окончания.
  const MSG_KEY = "checkout_message";
  const MSG_DURATION = 3000; // 3 секунды

  function closeCheckoutMessage() {
    localStorage.removeItem(MSG_KEY);
    if (checkoutResult) checkoutResult.innerHTML = "";
  }

  function renderCheckoutMessage() {
    if (!checkoutResult) return;

    let data = null;
    try {
      data = JSON.parse(localStorage.getItem(MSG_KEY) || "null");
    } catch (e) {}

    // Если время вышло или данных нет — очищаем родной контейнер
    if (!data || Date.now() >= data.until) {
      closeCheckoutMessage();
      return;
    }

    // Возвращаем стилистику сайта: используем родной класс checkout-success
    checkoutResult.innerHTML = `<span class="checkout-success">${data.text}</span>`;
  }

  function showCheckoutMessage(text) {
    localStorage.setItem(
      MSG_KEY,
      JSON.stringify({ text: text, until: Date.now() + MSG_DURATION }),
    );
    renderCheckoutMessage(); // Сразу отрисовываем в checkoutResult
  }

  // Каждые полсекунды проверяем: если сообщение должно висеть, а его нет — вернуть;
  // если время вышло — убрать.
  setInterval(renderCheckoutMessage, 500);

  function saveAndRender() {
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    if (typeof updateCartBadge === "function") {
      updateCartBadge();
    }
  }

  function renderCart() {
    cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-placeholder" style="text-align: center; padding: 3rem 1rem;">
          <span class="empty-icon empty-cart"></span>
          <h2>Корзина пуста</h2>
          <p style="color: var(--text-muted); margin: 1rem 0 2rem;">Добавьте товары из каталога</p>
          <a href="catalog.html" class="button">Перейти в каталог</a>
        </div>
      `;
      if (cartTotalElement) cartTotalElement.textContent = "0 ₽";
      if (cartCountElement) cartCountElement.textContent = "0";
      if (btnCheckout) btnCheckout.disabled = true;
      return;
    }

    if (btnCheckout) btnCheckout.disabled = false;

    let total = 0;
    let totalItems = 0;

    const html = cart
      .map((item) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalItems += item.quantity;

        return `
        <div class="cart-item" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}">
          <div class="cart-item-info">
            <h3><a href="product.html?id=${item.id}">${item.name}</a></h3>
            ${[item.brand, item.category].filter(Boolean).length ? `<p class="cart-item-meta">${[item.brand, item.category].filter(Boolean).join(" · ")}</p>` : ""}
          </div>
          <div class="qty-wrapper">
            <button class="qty-btn btn-decrease" data-id="${item.id}" aria-label="Уменьшить">−</button>
            <input type="number" class="qty-input" value="${item.quantity}" min="1" max="99" data-id="${item.id}">
            <button class="qty-btn btn-increase" data-id="${item.id}" aria-label="Увеличить">+</button>
          </div>
          <div class="cart-item-price">${itemTotal.toLocaleString("ru-RU")} ₽</div>
          <button class="btn-delete" data-id="${item.id}" title="Удалить" aria-label="Удалить">✕</button>
        </div>
      `;
      })
      .join("");

    cartItemsContainer.innerHTML = html;
    if (cartTotalElement)
      cartTotalElement.textContent = total.toLocaleString("ru-RU") + " ₽";
    if (cartCountElement) cartCountElement.textContent = totalItems;
  }

  if (cartItemsContainer) {
    cartItemsContainer.addEventListener("click", function (e) {
      const target = e.target;
      const id = parseInt(target.dataset.id, 10);
      if (!id) return;

      cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const itemIndex = cart.findIndex((i) => i.id === id);
      if (itemIndex === -1) return;

      if (target.classList.contains("btn-decrease")) {
        if (cart[itemIndex].quantity > 1) {
          cart[itemIndex].quantity--;
        } else {
          cart.splice(itemIndex, 1);
        }
        saveAndRender();
      } else if (target.classList.contains("btn-increase")) {
        if (cart[itemIndex].quantity < 99) {
          cart[itemIndex].quantity++;
        }
        saveAndRender();
      } else if (target.classList.contains("btn-delete")) {
        cart.splice(itemIndex, 1);
        saveAndRender();
      }
    });

    cartItemsContainer.addEventListener("change", function (e) {
      if (!e.target.classList.contains("qty-input")) return;

      const id = parseInt(e.target.dataset.id, 10);
      cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const itemIndex = cart.findIndex((i) => i.id === id);
      if (itemIndex === -1) return;

      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) val = cart[itemIndex].quantity;
      if (val < 1) val = 1;
      if (val > 99) val = 99;

      cart[itemIndex].quantity = val;
      saveAndRender();
    });
  }

  if (btnCheckout) {
    btnCheckout.addEventListener("click", async function (e) {
      e.preventDefault(); // Защита от перезагрузки формы

      cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (cart.length === 0) {
        if (checkoutResult) {
          checkoutResult.innerHTML =
            '<span class="checkout-loading" style="color: var(--danger);">Корзина пуста</span>';
        }
        return;
      }

      const userId = localStorage.getItem("user_id");
      if (!userId) {
        window.location.href = "login.html";
        return;
      }

      if (checkoutResult) {
        checkoutResult.innerHTML =
          '<span class="checkout-loading">Оформляем заказ…</span>';
      }
      btnCheckout.disabled = true;

      try {
        const orderData = {
          user_id: parseInt(userId),
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        };

        const response = await fetch("http://localhost:8000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) throw new Error("Ошибка сервера");

        const result = await response.json();
        const totalText = cartTotalElement ? cartTotalElement.textContent : "";

        // Показываем сообщение через нашу надежную функцию (она сама вставит его в checkoutResult)
        showCheckoutMessage(
          `Заказ №${result.order_id} на сумму ${totalText} оформлен!`,
        );

        // Очищаем корзину и перерисовываем
        cart = [];
        localStorage.setItem("cart", "[]");
        renderCart();
        if (typeof updateCartBadge === "function") updateCartBadge();
      } catch (error) {
        if (checkoutResult) {
          checkoutResult.innerHTML = `<span class="checkout-loading" style="color: var(--danger);">Ошибка: ${error.message}</span>`;
        }
        btnCheckout.disabled = false;
      }
    });
  }

  renderCart();
  renderCheckoutMessage(); // Проверяем сообщение при загрузке страницы
});
