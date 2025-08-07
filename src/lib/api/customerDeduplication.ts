import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types';
import { getAllRecordsPaginated } from './utils';

export interface DuplicateGroup {
  normalizedPhone: string;
  customers: Customer[];
  primaryCustomer: Customer;
  duplicateCustomers: Customer[];
  proposedChanges: {
    primaryCustomerUpdates: Partial<Customer>;
    ordersToTransfer: number;
    customersToDelete: string[];
  };
}

// Нормализация номера телефона для сравнения
const normalizePhoneNumber = (phone: string): string => {
  // Убираем все нецифровые символы
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  
  // Заменяем 8 на 7 в начале (российские номера)
  if (digitsOnly.startsWith('8') && digitsOnly.length === 11) {
    return '7' + digitsOnly.slice(1);
  }
  
  // Добавляем 7 если номер начинается с 9 и имеет 10 цифр
  if (digitsOnly.startsWith('9') && digitsOnly.length === 10) {
    return '7' + digitsOnly;
  }
  
  return digitsOnly;
};

// Форматирование номера телефона в формат 8900...
const formatPhoneFor8Format = (phone: string): string => {
  // Убираем все нецифровые символы
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  
  // Заменяем 7 на 8 в начале (российские номера)
  if (digitsOnly.startsWith('7') && digitsOnly.length === 11) {
    return '8' + digitsOnly.slice(1);
  }
  
  // Добавляем 8 если номер начинается с 9 и имеет 10 цифр
  if (digitsOnly.startsWith('9') && digitsOnly.length === 10) {
    return '8' + digitsOnly;
  }
  
  // Если уже начинается с 8, возвращаем как есть
  if (digitsOnly.startsWith('8') && digitsOnly.length === 11) {
    return digitsOnly;
  }
  
  return phone; // Возвращаем оригинал если не удалось обработать
};

// Получение заказов клиента
const getCustomerOrdersCount = async (customerId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('customer_id', customerId);
  
  if (error) {
    console.error('Error fetching customer orders:', error);
    return 0;
  }
  
  return data?.length || 0;
};

// Поиск дубликатов клиентов
export const findDuplicateCustomers = async (): Promise<DuplicateGroup[]> => {
  try {
    // Получаем всех клиентов
    const customers = await getAllRecordsPaginated<any>('customers');
    
    const customerData: Customer[] = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      email: customer.email || undefined,
      createdAt: customer.created_at,
      totalOrders: customer.total_orders,
      totalSpent: Number(customer.total_spent)
    }));
    
    // Группируем по нормализованному номеру телефона
    const phoneGroups: Record<string, Customer[]> = {};
    
    customerData.forEach(customer => {
      const normalizedPhone = normalizePhoneNumber(customer.phone);
      if (!phoneGroups[normalizedPhone]) {
        phoneGroups[normalizedPhone] = [];
      }
      phoneGroups[normalizedPhone].push(customer);
    });
    
    // Находим группы с дубликатами
    const duplicateGroups: DuplicateGroup[] = [];
    
    for (const [normalizedPhone, groupCustomers] of Object.entries(phoneGroups)) {
      if (groupCustomers.length > 1) {
        // Сортируем по дате создания (старейший становится основным)
        const sortedCustomers = groupCustomers.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        const primaryCustomer = sortedCustomers[0];
        const duplicateCustomers = sortedCustomers.slice(1);
        
        // Получаем актуальное количество заказов для каждого дубликата
        const duplicateOrdersCounts = await Promise.all(
          duplicateCustomers.map(customer => getCustomerOrdersCount(customer.id))
        );
        
        const totalOrdersToTransfer = duplicateOrdersCounts.reduce((sum, count) => sum + count, 0);
        
        // Определяем какие поля нужно обновить в основном клиенте
        const primaryCustomerUpdates: Partial<Customer> = {};
        
        // Переносим адрес, если его нет в основном клиенте
        if (!primaryCustomer.address) {
          const customerWithAddress = duplicateCustomers.find(c => c.address);
          if (customerWithAddress?.address) {
            primaryCustomerUpdates.address = customerWithAddress.address;
          }
        }
        
        // Переносим email, если его нет в основном клиенте
        if (!primaryCustomer.email) {
          const customerWithEmail = duplicateCustomers.find(c => c.email);
          if (customerWithEmail?.email) {
            primaryCustomerUpdates.email = customerWithEmail.email;
          }
        }
        
        // Обрабатываем имя: если основной клиент - "Неизвестный клиент", ищем лучшее имя
        if (primaryCustomer.name === 'Неизвестный клиент') {
          const customerWithRealName = duplicateCustomers.find(c => c.name && c.name !== 'Неизвестный клиент');
          if (customerWithRealName?.name) {
            primaryCustomerUpdates.name = customerWithRealName.name;
          }
        }
        
        // Форматируем номер телефона в формат 8900...
        const formattedPhone = formatPhoneFor8Format(primaryCustomer.phone);
        if (formattedPhone !== primaryCustomer.phone) {
          primaryCustomerUpdates.phone = formattedPhone;
        }
        
        // Обновляем количество заказов и общую сумму
        if (totalOrdersToTransfer > 0) {
          primaryCustomerUpdates.totalOrders = primaryCustomer.totalOrders + totalOrdersToTransfer;
          
          // Вычисляем общую сумму заказов дубликатов
          const totalSpentFromDuplicates = duplicateCustomers.reduce(
            (sum, customer) => sum + customer.totalSpent, 
            0
          );
          primaryCustomerUpdates.totalSpent = primaryCustomer.totalSpent + totalSpentFromDuplicates;
        }
        
        duplicateGroups.push({
          normalizedPhone,
          customers: groupCustomers,
          primaryCustomer,
          duplicateCustomers,
          proposedChanges: {
            primaryCustomerUpdates,
            ordersToTransfer: totalOrdersToTransfer,
            customersToDelete: duplicateCustomers.map(c => c.id)
          }
        });
      }
    }
    
    return duplicateGroups;
  } catch (error) {
    console.error('Error finding duplicate customers:', error);
    throw error;
  }
};

// Выполнение дедупликации (реальное изменение данных)
export const executeDuplication = async (duplicateGroups: DuplicateGroup[]): Promise<void> => {
  try {
    for (const group of duplicateGroups) {
      const { primaryCustomer, duplicateCustomers, proposedChanges } = group;
      
      // 1. Переносим все заказы дубликатов к основному клиенту
      for (const duplicateCustomer of duplicateCustomers) {
        await supabase
          .from('orders')
          .update({ customer_id: primaryCustomer.id })
          .eq('customer_id', duplicateCustomer.id);
      }
      
      // 2. Обновляем основного клиента
      if (Object.keys(proposedChanges.primaryCustomerUpdates).length > 0) {
        const updateData: any = {};
        if (proposedChanges.primaryCustomerUpdates.address) {
          updateData.address = proposedChanges.primaryCustomerUpdates.address;
        }
        if (proposedChanges.primaryCustomerUpdates.email) {
          updateData.email = proposedChanges.primaryCustomerUpdates.email;
        }
        if (proposedChanges.primaryCustomerUpdates.totalOrders !== undefined) {
          updateData.total_orders = proposedChanges.primaryCustomerUpdates.totalOrders;
        }
        if (proposedChanges.primaryCustomerUpdates.totalSpent !== undefined) {
          updateData.total_spent = proposedChanges.primaryCustomerUpdates.totalSpent;
        }
        if (proposedChanges.primaryCustomerUpdates.name) {
          updateData.name = proposedChanges.primaryCustomerUpdates.name;
        }
        if (proposedChanges.primaryCustomerUpdates.phone) {
          updateData.phone = proposedChanges.primaryCustomerUpdates.phone;
        }
        
        await supabase
          .from('customers')
          .update(updateData)
          .eq('id', primaryCustomer.id);
      }
      
      // 3. Удаляем дубликаты
      for (const customerId of proposedChanges.customersToDelete) {
        await supabase
          .from('customers')
          .delete()
          .eq('id', customerId);
      }
    }
  } catch (error) {
    console.error('Error executing deduplication:', error);
    throw error;
  }
};