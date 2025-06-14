
import { supabase } from '@/integrations/supabase/client';
import { MonthlyData } from './types';

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Получение статистики по месяцам для конкретного года
export const getMonthlyData = async (year: number): Promise<MonthlyData[]> => {
  try {
    console.log(`Fetching monthly data for year: ${year}`);
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    // Получаем все заказы за год с большим лимитом
    const { data: orders, error } = await supabase
      .from('orders')
      .select('date, total_amount')
      .gte('date', startDate.toISOString())
      .lt('date', endDate.toISOString())
      .limit(10000) // Устанавливаем большой лимит
      .order('date', { ascending: true });

    if (error) throw error;

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
      revenue: Math.round(data.revenue)
    }));
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    return [];
  }
};
