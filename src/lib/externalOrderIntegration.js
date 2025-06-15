
/**
 * Универсальная функция для отправки заказа в CRM из внешнего источника
 * @param {Object} formData - Данные формы с полями title, quan, name, tel, add, promo
 * @param {string} crmBaseUrl - URL вашей CRM системы (например, "https://your-crm.lovable.app")
 * @returns {Promise<Object>} - Результат создания заказа
 */
export async function sendOrderToCRM(formData, crmBaseUrl) {
  try {
    // Подготавливаем данные для CRM API в правильном формате
    const orderData = {
      customerName: formData.name,
      customerPhone: formData.tel,
      customerAddress: formData.add || "",
      customerEmail: formData.email || "",
      source: "website",
      items: [
        {
          name: formData.title,
          description: formData.promo ? `Промокод: ${formData.promo}` : "",
          price: parseFloat(formData.price) || 0,
          quantity: parseInt(formData.quan) || 1
        }
      ]
    };

    console.log('Отправляем заказ в CRM:', orderData);

    // Кодируем данные для передачи через URL
    const encodedData = encodeURIComponent(JSON.stringify(orderData));
    
    // Отправляем запрос к API CRM
    const response = await fetch(`${crmBaseUrl}/api/orders/create?data=${encodedData}`, {
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
      message: 'Заказ успешно создан в CRM'
    };

  } catch (error) {
    console.error('Ошибка при создании заказа в CRM:', error);
    return {
      success: false,
      error: error.message,
      message: 'Ошибка при создании заказа в CRM'
    };
  }
}

/**
 * Функция для отправки в Telegram И в CRM одновременно
 * @param {Object} formData - Данные формы
 * @param {string} crmBaseUrl - URL вашей CRM системы
 * @returns {Promise<Object>} - Результаты обеих операций
 */
export async function sendOrderToTelegramAndCRM(formData, crmBaseUrl) {
  const results = {
    telegram: { success: false },
    crm: { success: false }
  };

  try {
    // Отправляем в Telegram (ваш существующий код)
    const tlgText = 'https://api.telegram.org/bot5810184722:AAHi5zY4APb_s6G5W6OO7tWJZRWoEjzIQLo/sendMessage?chat_id=423648&text=' + 
      encodeURIComponent(formData.title + ', пар: ' + formData.quan + 
      '\nИмя: ' + formData.name + 
      '\nТелефон: ' + formData.tel + 
      '\nАдрес: ' + formData.add + 
      '\nПромокод: ' + formData.promo);

    const telegramResponse = await fetch(tlgText);
    results.telegram = {
      success: telegramResponse.ok,
      response: await telegramResponse.json()
    };

    // Отправляем в CRM
    results.crm = await sendOrderToCRM(formData, crmBaseUrl);

    return results;

  } catch (error) {
    console.error('Ошибка при отправке заказа:', error);
    return results;
  }
}

/**
 * Простая функция для быстрой интеграции - только в CRM
 * @param {Object} orderDetails - Объект с данными заказа
 * @param {string} crmUrl - URL CRM системы
 */
export async function quickSendToCRM(orderDetails, crmUrl) {
  const formData = {
    name: orderDetails.customerName,
    tel: orderDetails.customerPhone,
    add: orderDetails.customerAddress || '',
    email: orderDetails.customerEmail || '',
    title: orderDetails.productName,
    quan: orderDetails.quantity || 1,
    price: orderDetails.price || 0,
    promo: orderDetails.promoCode || ''
  };

  return await sendOrderToCRM(formData, crmUrl);
}
