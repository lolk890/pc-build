// Загрузка страницы товара
async function loadProductPage() {
  try {
    const response = await fetch("products.json");
    const products = await response.json();

    // Получаем ID из URL (product.html?id=1)
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get("id"));

    // Если ID нет, показываем первый товар
    const product = productId
      ? products.find((p) => p.id === productId)
      : products[0];

    if (product) {
      // Заполняем шаблон данными
      document.getElementById("product-image").src = product.image;
      document.getElementById("product-image").alt = product.name;
      document.getElementById("product-category").innerHTML = product.category;
      document.getElementById("product-title").innerHTML = product.name;
      document.getElementById("product-brand").innerHTML = product.brand;
      document.getElementById("product-price").innerHTML =
        product.price.toLocaleString("ru-RU") + " ₽";
      document.getElementById("product-description").innerHTML =
        product.description;

      // Заполняем характеристики
      const specsContainer = document.getElementById("product-specs");
      specsContainer.innerHTML = "";
      for (const [key, value] of Object.entries(product.specs)) {
        const dt = document.createElement("dt");
        dt.innerHTML = key;
        const dd = document.createElement("dd");
        dd.innerHTML = value;
        specsContainer.appendChild(dt);
        specsContainer.appendChild(dd);
      }

      // Меняем title страницы
      document.title = product.name + " — PC Build";
    }
  } catch (error) {
    console.error("Ошибка загрузки товара:", error);
  }
}

// Запускаем при загрузке страницы
if (document.body.querySelector("#product-title")) {
  loadProductPage();
}
