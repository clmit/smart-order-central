
// Пример использования функций интеграции заказов

import { sendOrderToCRM, sendOrderToTelegramAndCRM } from '../lib/externalOrderIntegration.js';

// Пример данных формы (как в вашем коде)
const exampleFormData = {
  title: "Nike Air Max",
  quan: "2", 
  name: "Иван Иванов",
  tel: "+7 (999) 123-45-67",
  add: "Москва, ул. Примерная, д. 1",
  promo: "SALE2024"
};

// Пример 1: Отправка только в CRM
async function sendToCRMOnly() {
  console.log('Отправляем заказ в CRM...');
  const result = await sendOrderToCRM(exampleFormData);
  
  if (result.success) {
    console.log('✅ Заказ успешно создан в CRM:', result.order);
  } else {
    console.log('❌ Ошибка при создании заказа:', result.message);
  }
}

// Пример 2: Отправка и в Telegram, и в CRM
async function sendToBoth() {
  console.log('Отправляем заказ в Telegram и CRM...');
  const results = await sendOrderToTelegramAndCRM(exampleFormData);
  
  console.log('Результат Telegram:', results.telegram.success ? '✅ Успех' : '❌ Ошибка');
  console.log('Результат CRM:', results.crm.success ? '✅ Успех' : '❌ Ошибка');
  
  if (results.crm.success) {
    console.log('Данные заказа:', results.crm.order);
  }
}

// Пример интеграции в существующую форму
function integrateWithExistingForm() {
  // Предположим, у вас есть форма с данными в this.form
  const formData = {
    title: this.form.title,
    quan: this.form.quan,
    name: this.form.name,
    tel: this.form.tel,
    add: this.form.add,
    promo: this.form.promo
  };

  // Вместо только отправки в Telegram:
  // let tlgText = 'https://api.telegram.org/...' 
  
  // Теперь отправляем и в Telegram, и в CRM:
  sendOrderToTelegramAndCRM(formData)
    .then(results => {
      if (results.telegram.success && results.crm.success) {
        alert('Заказ успешно отправлен!');
      } else {
        alert('Произошла ошибка при отправке заказа');
      }
    })
    .catch(error => {
      console.error('Ошибка:', error);
      alert('Произошла ошибка при отправке заказа');
    });
}

// Экспортируем примеры для использования
export { sendToCRMOnly, sendToBoth, integrateWithExistingForm };
