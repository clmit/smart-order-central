
import { supabase } from '@/integrations/supabase/client';
import { CustomerData } from './types';

// Получение данных по топ клиентам
export const getTopCustomersData = async (metricType: string): Promise<CustomerData[]> => {
  try {
    // Используем join для получения данных за один запрос
    const { data, error } = await supabase
      .from('orders')
      .select(`
        customer_id,
        total_amount,
        customers!inner(name)
      `)
      .limit(5000); // Ограничиваем для производительности

    if (error) throw error;

    const customerData: Record<string, { name: string; orders: number; revenue: number }> = {};
    
    data.forEach((order: any) => {
      if (!order.customer_id || !order.customers) return;
      
      const customerId = order.customer_id;
      if (!customerData[customerId]) {
        customerData[customerId] = {
          name: order.customers.name,
          orders: 0,
          revenue: 0
        };
      }
      
      customerData[customerId].orders += 1;
      customerData[customerId].revenue += Number(order.total_amount);
    });

    return Object.values(customerData)
      .sort((a, b) => 
        metricType === 'orders' 
          ? b.orders - a.orders 
          : b.revenue - a.revenue
      )
      .slice(0, 10)
      .map(customer => ({
        name: customer.name,
        value: metricType === 'orders' ? customer.orders : Math.round(customer.revenue / 1000)
      }));
  } catch (error) {
    console.error('Error fetching top customers data:', error);
    return [];
  }
};
