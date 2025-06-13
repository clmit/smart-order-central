
import { supabase } from '@/integrations/supabase/client';
import { YearlyData } from './types';

// Получение статистики по годам
export const getYearlyData = async (): Promise<YearlyData[]> => {
  try {
    console.log('Fetching yearly data...');
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('date, total_amount')
      .limit(50000) // Увеличиваем лимит для получения всех заказов
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }

    console.log('Total orders fetched:', orders?.length || 0);
    
    if (!orders || orders.length === 0) {
      console.log('No orders found in database');
      return [];
    }

    // Логируем примеры дат для диагностики
    console.log('Sample order dates:');
    orders.slice(0, 10).forEach((order, index) => {
      const orderDate = new Date(order.date);
      console.log(`Order ${index + 1}: ${order.date} -> Year: ${orderDate.getFullYear()}`);
    });

    const yearlyData: Record<number, { orders: number; revenue: number }> = {};
    
    orders.forEach(order => {
      const orderDate = new Date(order.date);
      const year = orderDate.getFullYear();
      
      if (!yearlyData[year]) {
        yearlyData[year] = { orders: 0, revenue: 0 };
      }
      yearlyData[year].orders += 1;
      yearlyData[year].revenue += Number(order.total_amount);
    });

    console.log('Yearly data aggregated:', yearlyData);

    const result = Object.entries(yearlyData)
      .map(([year, data]) => ({
        year: parseInt(year),
        orders: data.orders,
        revenue: Math.round(data.revenue)
      }))
      .sort((a, b) => b.year - a.year);

    console.log('Final yearly data result:', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching yearly data:', error);
    return [];
  }
};
