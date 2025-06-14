
import { supabase } from '@/integrations/supabase/client';
import { MonthlyData } from './types';

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Функция для получения всех заказов за год через пагинацию
const getAllOrdersForYear = async (year: number) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);
  
  let allOrders: any[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('date, total_amount')
      .gte('date', startDate.toISOString())
      .lt('date', endDate.toISOString())
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

// Получение статистики по месяцам для конкретного года
export const getMonthlyData = async (year: number): Promise<MonthlyData[]> => {
  try {
    console.log(`Fetching monthly data for year: ${year}`);
    
    // Получаем все заказы за год через пагинацию
    const orders = await getAllOrdersForYear(year);

    console.log(`Orders fetched for year ${year}:`, orders?.length || 0);

    const monthlyData: Record<number, { orders: number; revenue: number }> = {};
    
    // Инициализируем все месяцы
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = { orders: 0, revenue: 0 };
    }

    orders.forEach(order => {
      const month = new Date(order.date).getMonth();
      monthlyData[month].orders += 1;
      monthlyData[month].revenue += Number(order.total_amount);
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      year,
      month: parseInt(month) + 1,
      monthName: monthNames[parseInt(month)],
      orders: data.orders,
      revenue: Math.round(data.revenue),
      avgCheck: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0
    }));
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    return [];
  }
};
