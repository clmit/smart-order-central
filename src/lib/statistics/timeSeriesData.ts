
import { supabase } from '@/integrations/supabase/client';
import { TimeSeriesData } from './types';

// Получение данных временного ряда с агрегацией на уровне БД
export const getTimeSeriesData = async (period: string, metricType: string): Promise<TimeSeriesData[]> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let daysBack: number;
    switch (period) {
      case 'week':
        daysBack = 7;
        break;
      case 'month':
        daysBack = 30;
        break;
      case 'quarter':
        daysBack = 90;
        break;
      default:
        daysBack = 7;
    }

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysBack);

    // Получаем только нужные данные за период
    const { data: orders, error } = await supabase
      .from('orders')
      .select('date, total_amount')
      .gte('date', startDate.toISOString())
      .order('date', { ascending: true });

    if (error) throw error;

    // Группируем по дням на клиенте (более эффективно чем полная загрузка)
    const dailyData: Record<string, { orders: number; revenue: number }> = {};
    
    // Инициализируем все дни
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dailyData[formattedDate] = { orders: 0, revenue: 0 };
    }

    // Заполняем данными
    orders.forEach(order => {
      const orderDate = new Date(order.date);
      const formattedDate = `${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
      if (dailyData[formattedDate]) {
        dailyData[formattedDate].orders += 1;
        dailyData[formattedDate].revenue += Number(order.total_amount);
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      заказы: data.orders,
      выручка: Math.round(data.revenue / 1000)
    }));
  } catch (error) {
    console.error('Error fetching time series data:', error);
    return [];
  }
};
