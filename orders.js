const API_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", function () {
  const userId = localStorage.getItem("user_id");
  const container = document.getElementById("orders-container");

  // 1. Если пользователь не вошел, отправляем его на страницу входа
  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  // 2. Запрашиваем заказы с сервера
  fetch(`${API_URL}/api/my-orders?user_id=${userId}`)
    .then((response) => {
      if (!response.ok) throw new Error("Не удалось загрузить заказы");
      return response.json();
    })
    .then((orders) => {
      container.innerHTML = ""; // Очищаем индикатор загрузки

      // 3. Если заказов нет
      if (orders.length === 0) {
        container.innerHTML = `
          <div class="empty-orders">
            <span class="empty-icon empty-orders-ic"></span>
            <h2>У вас пока нет заказов</h2>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">
              Самое время собрать свой идеальный ПК!
            </p>
            <a href="catalog.html" class="button">Перейти в каталог</a>
          </div>
        `;
        return;
      }

      // 4. Если заказы есть, рисуем карточки
      orders.forEach((order) => {
        // Форматируем дату из "2026-11-21 15:30:00" в "21.11.2026, 15:30"
        const dateObj = new Date(order.created_at);
        const formattedDate = dateObj.toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Создаем HTML для списка товаров внутри заказа
        const itemsHtml = order.items
          .map(
            (item) => `
  <li class="order-item">
    <a href="product.html?id=${item.product_id}" class="order-item-name">${item.name}</a>
    <span class="order-item-qty">${item.quantity} шт.</span>
    <span class="order-item-price">${item.total.toLocaleString("ru-RU")} ₽</span>
  </li>
`,
          )
          .join("");

        // Создаем карточку заказа
        const card = document.createElement("div");
        card.className = "order-card fade-in";
        card.innerHTML = `
          <div class="order-header">
            <span class="order-id">Заказ №${order.order_id}</span>
            <span class="order-date">${formattedDate}</span>
          </div>
          <ul class="order-items">
            ${itemsHtml}
          </ul>
          <div class="order-total">
            Итого: <span>${order.total.toLocaleString("ru-RU")} ₽</span>
          </div>
        `;

        container.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Ошибка:", error);
      container.innerHTML = `
        <div class="empty-orders" style="border-color: var(--danger);">
          <span class="empty-icon empty-alert"></span>
          <h2 style="color: var(--danger);">Ошибка загрузки</h2>
          <p>Не удалось получить историю заказов. Попробуйте позже.</p>
        </div>
      `;
    });
});
