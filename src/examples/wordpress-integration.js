
/**
 * Готовый код для интеграции с WordPress или другими CMS
 * Вставьте этот код в ваши темы или плагины
 */

// Конфигурация
const CRM_CONFIG = {
    baseUrl: 'https://your-crm.lovable.app', // Замените на URL вашей CRM
    telegramBotToken: '5810184722:AAHi5zY4APb_s6G5W6OO7tWJZRWoEjzIQLo',
    telegramChatId: '423648'
};

/**
 * Отправка заказа в CRM
 */
async function sendOrderToCRM(orderData) {
    try {
        const crmData = {
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            customerAddress: orderData.customerAddress || "",
            customerEmail: orderData.customerEmail || "",
            source: "website",
            items: orderData.items || [
                {
                    name: orderData.productName || orderData.title,
                    description: orderData.description || (orderData.promo ? `Промокод: ${orderData.promo}` : ""),
                    price: parseFloat(orderData.price) || 0,
                    quantity: parseInt(orderData.quantity) || 1
                }
            ]
        };

        const encodedData = encodeURIComponent(JSON.stringify(crmData));
        
        const response = await fetch(`${CRM_CONFIG.baseUrl}/api/orders/create?data=${encodedData}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return { success: true, data: result };

    } catch (error) {
        console.error('Ошибка отправки в CRM:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Отправка в Telegram
 */
async function sendToTelegram(orderData) {
    try {
        const message = `
Новый заказ:
📦 Товар: ${orderData.productName || orderData.title}
👤 Имя: ${orderData.customerName}
📞 Телефон: ${orderData.customerPhone}
📍 Адрес: ${orderData.customerAddress || 'Не указан'}
🎟️ Промокод: ${orderData.promo || 'Нет'}
📊 Количество: ${orderData.quantity || 1}
        `.trim();

        const telegramUrl = `https://api.telegram.org/bot${CRM_CONFIG.telegramBotToken}/sendMessage?chat_id=${CRM_CONFIG.telegramChatId}&text=${encodeURIComponent(message)}`;
        
        const response = await fetch(telegramUrl);
        return { success: response.ok };
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Универсальная функция обработки заказа
 */
async function processOrder(formElement) {
    // Извлекаем данные из формы
    const formData = new FormData(formElement);
    const orderData = {
        customerName: formData.get('name') || formData.get('customer_name'),
        customerPhone: formData.get('phone') || formData.get('tel'),
        customerAddress: formData.get('address') || formData.get('add'),
        customerEmail: formData.get('email'),
        productName: formData.get('product') || formData.get('title'),
        quantity: formData.get('quantity') || formData.get('quan') || 1,
        price: formData.get('price') || 0,
        promo: formData.get('promo') || formData.get('promocode'),
        description: formData.get('description')
    };

    console.log('Обрабатываем заказ:', orderData);

    // Отправляем в обе системы параллельно
    const [crmResult, telegramResult] = await Promise.all([
        sendOrderToCRM(orderData),
        sendToTelegram(orderData)
    ]);

    return {
        crm: crmResult,
        telegram: telegramResult,
        success: crmResult.success || telegramResult.success
    };
}

/**
 * Автоматическая привязка к формам на странице
 */
document.addEventListener('DOMContentLoaded', function() {
    // Ищем формы заказов по классу или ID
    const orderForms = document.querySelectorAll('.order-form, #order-form, .checkout-form');
    
    orderForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Показываем индикатор загрузки
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            const originalText = submitBtn.textContent || submitBtn.value;
            submitBtn.textContent = 'Отправляем...';
            submitBtn.disabled = true;

            try {
                const result = await processOrder(form);
                
                if (result.success) {
                    alert('Заказ успешно отправлен!');
                    form.reset();
                } else {
                    alert('Ошибка при отправке заказа. Попробуйте еще раз.');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при отправке заказа.');
            } finally {
                // Возвращаем кнопку в исходное состояние
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    });
});

// Экспортируем функции для глобального использования
window.CRMIntegration = {
    sendOrderToCRM,
    sendToTelegram,
    processOrder,
    config: CRM_CONFIG
};
