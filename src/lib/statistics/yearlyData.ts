
import { supabase } from '@/integrations/supabase/client';
import { YearlyData } from './types';

// Функция для получения всех заказов через пагинацию
const getAllOrders = async () => {
  let allOrders: any[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('date, total_amount')
      .order('date', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    
    if (!orders || orders.length === 0) break;
    
    allOrders = [...allOrders, ...orders];
    
    // Если получили меньше записей чем размер страницы, значит это последняя страница
    if (orders.length < pageSize) break;
    
    page++;
  }
  
  return allOrders;
};

// Получение статистики по годам
export const getYearlyData = async (): Promise<YearlyData[]> => {
  try {
    console.log('Fetching yearly data...');
    
    // Сначала получаем общее количество заказов
    const { count: totalOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    console.log(`Total orders in database: ${totalOrdersCount}`);

    // Получаем ВСЕ заказы через пагинацию
    const orders = await getAllOrders();

    console.log('Total orders fetched for yearly analysis:', orders?.length || 0);
    
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
        revenue: Math.round(data.revenue),
        avgCheck: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0
      }))
      .sort((a, b) => b.year - a.year);

    console.log('Final yearly data result:', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching yearly data:', error);
    return [];
  }
};
