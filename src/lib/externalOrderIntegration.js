
/**
 * Функция для отправки заказа в CRM на основе данных формы
 * @param {Object} formData - Данные формы с полями title, quan, name, tel, add, promo
 * @returns {Promise<Object>} - Результат создания заказа
 */
export async function sendOrderToCRM(formData) {
  try {
    // Подготавливаем данные для CRM API
    const orderData = {
      customerName: formData.name,
      customerPhone: formData.tel,
      customerAddress: formData.add || "",
      source: "website",
      items: [
        {
          name: formData.title,
          description: formData.promo ? `Промокод: ${formData.promo}` : "",
          price: 0, // Цену нужно будет указать в зависимости от товара
          quantity: parseInt(formData.quan) || 1
        }
      ]
    };

    // Кодируем данные для передачи через URL (как в примере из Settings)
    const encodedData = encodeURIComponent(JSON.stringify(orderData));
    
    // Определяем базовый URL (автоматически определяется от текущего домена)
    const baseUrl = window.location.origin;
    
    // Отправляем запрос к API CRM
    const response = await fetch(`${baseUrl}/api/orders/create?data=${encodedData}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Заказ успешно создан в CRM:', result);
    
    return {
      success: true,
      order: result,
      message: 'Заказ успешно создан'
    };

  } catch (error) {
    console.error('Ошибка при создании заказа в CRM:', error);
    return {
      success: false,
      error: error.message,
      message: 'Ошибка при создании заказа'
    };
  }
}

/**
 * Комбинированная функция для отправки в Telegram И в CRM
 * @param {Object} formData - Данные формы
 * @returns {Promise<Object>} - Результаты обеих операций
 */
export async function sendOrderToTelegramAndCRM(formData) {
  const results = {
    telegram: { success: false },
    crm: { success: false }
  };

  try {
    // Отправляем в Telegram (ваш существующий код)
    const tlgText = 'https://api.telegram.org/bot5810184722:AAHi5zY4APb_s6G5W6OO7tWJZRWoEjzIQLo/sendMessage?chat_id=423648&text=' + 
      formData.title + ', пар: ' + formData.quan + 
      '%0AИмя: ' + formData.name + 
      '%0AТелефон: ' + formData.tel + 
      '%0AAдрес: ' + formData.add + 
      '%0AПромокод: ' + formData.promo;

    const telegramResponse = await fetch(tlgText);
    results.telegram = {
      success: telegramResponse.ok,
      response: await telegramResponse.json()
    };

    // Отправляем в CRM
    results.crm = await sendOrderToCRM(formData);

    return results;

  } catch (error) {
    console.error('Ошибка при отправке заказа:', error);
    return results;
  }
}
