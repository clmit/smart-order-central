
# Инструкция по интеграции с CRM из внешних источников

## Быстрый старт

### 1. Для простых HTML сайтов
Скопируйте код из `external-integration-example.html` и замените URL CRM на ваш.

### 2. Для WordPress
1. Скопируйте код из `wordpress-integration.js`
2. Замените `CRM_CONFIG.baseUrl` на URL вашей CRM системы
3. Добавьте код в файл `functions.php` вашей темы или создайте плагин

### 3. Универсальное использование

```javascript
// Подключите файл externalOrderIntegration.js
import { sendOrderToCRM } from './externalOrderIntegration.js';

// Данные заказа
const orderData = {
    name: "Иван Петров",
    tel: "+7 (999) 123-45-67", 
    add: "Москва, ул. Примерная, 1",
    email: "ivan@example.com",
    title: "Nike Air Max",
    quan: "2",
    price: "5000",
    promo: "SALE2024"
};

// URL вашей CRM системы
const crmUrl = "https://your-crm.lovable.app";

// Отправка заказа
const result = await sendOrderToCRM(orderData, crmUrl);

if (result.success) {
    console.log('Заказ создан:', result.order);
} else {
    console.error('Ошибка:', result.error);
}
```

## Формат данных

Ваша форма должна содержать следующие поля:

### Обязательные поля:
- `name` - Имя клиента
- `tel` - Телефон клиента
- `title` - Название товара
- `price` - Цена товара

### Необязательные поля:
- `add` - Адрес доставки
- `email` - Email клиента  
- `quan` - Количество (по умолчанию 1)
- `promo` - Промокод

## Примеры HTML форм

### Минимальная форма:
```html
<form class="order-form">
    <input name="name" placeholder="Имя" required>
    <input name="tel" placeholder="Телефон" required>
    <input name="title" placeholder="Товар" required>
    <input name="price" placeholder="Цена" required>
    <button type="submit">Заказать</button>
</form>
```

### Полная форма:
```html
<form class="order-form">
    <input name="name" placeholder="Имя" required>
    <input name="tel" placeholder="Телефон" required>
    <input name="email" placeholder="Email">
    <textarea name="add" placeholder="Адрес доставки"></textarea>
    <input name="title" placeholder="Название товара" required>
    <input name="quan" type="number" placeholder="Количество" value="1">
    <input name="price" type="number" placeholder="Цена" required>
    <input name="promo" placeholder="Промокод">
    <button type="submit">Отправить заказ</button>
</form>
```

## Настройка

1. **Замените URL CRM**: В коде замените `https://your-crm.lovable.app` на актуальный URL вашей CRM системы
2. **Настройте Telegram** (если нужно): Замените токен бота и chat_id в конфигурации
3. **Тестирование**: Используйте `external-integration-example.html` для тестирования интеграции

## Проверка работы

1. Откройте консоль браузера (F12)
2. Отправьте тестовый заказ
3. Проверьте логи в консоли
4. Проверьте, появился ли заказ в вашей CRM системе

## Поддержка

Если возникают ошибки:
1. Проверьте URL CRM системы
2. Убедитесь, что все обязательные поля заполнены
3. Проверьте консоль браузера на наличие ошибок
4. Убедитесь, что CRM система доступна
