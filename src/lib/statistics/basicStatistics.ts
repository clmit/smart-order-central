import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { StatisticsMetrics, OrdersStatisticsRPC } from './types';

// Получение базовой статистики с агрегацией на уровне БД
export const getBasicStatistics = async (): Promise<StatisticsMetrics | null> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    // Запрос на количество заказов по периодам с правильной типизацией
    const { data: ordersCount, error: ordersError } = await supabase
      .rpc('get_orders_statistics', {
        today_date: today.toISOString(),
        yesterday_date: yesterday.toISOString(),
        week_date: lastWeek.toISOString(),
        month_date: lastMonth.toISOString()
      }) as { data: OrdersStatisticsRPC | null; error: any };

    if (ordersError) {
      console.log('RPC function not available, falling back to client-side calculation');
      return await getBasicStatisticsFallback();
    }

    // Если RPC функция недоступна, используем fallback
    if (!ordersCount) {
      return await getBasicStatisticsFallback();
    }

    return {
      today: ordersCount.today_orders || 0,
      yesterday: ordersCount.yesterday_orders || 0,
      lastWeek: ordersCount.week_orders || 0,
      lastMonth: ordersCount.month_orders || 0,
      avgOrderValue: Math.round(ordersCount.avg_order_value || 0),
      conversion: 2.8, // Фиксированное значение
      repeatOrders: Math.round(ordersCount.repeat_rate || 0),
      avgLtv: Math.round(ordersCount.avg_ltv || 0)
    };
  } catch (error) {
    console.error('Error fetching basic statistics:', error);
    return await getBasicStatisticsFallback();
  }
};

// Fallback функция для получения статистики через обычные запросы
const getBasicStatisticsFallback = async (): Promise<StatisticsMetrics | null> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    // Получаем только необходимые поля и с ограничениями
    const { data: orders, error } = await supabase
      .from('orders')
      .select('date, total_amount, customer_id')
      .gte('date', lastMonth.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;

    const todayOrders = orders.filter(o => new Date(o.date) >= today);
    const yesterdayOrders = orders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= yesterday && orderDate < today;
    });
    const lastWeekOrders = orders.filter(o => new Date(o.date) >= lastWeek);
    const lastMonthOrders = orders.filter(o => new Date(o.date) >= lastMonth);

    // Вычисляем средний чек
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const avgOrderValue = orders.length ? Math.round(totalRevenue / orders.length) : 0;

    // Вычисляем повторные покупки (упрощенно)
    const customerOrders: Record<string, number> = {};
    orders.forEach(order => {
      if (order.customer_id) {
        customerOrders[order.customer_id] = (customerOrders[order.customer_id] || 0) + 1;
      }
    });

    const repeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    const repeatRate = Object.keys(customerOrders).length > 0 
      ? Math.round((repeatCustomers / Object.keys(customerOrders).length) * 100) 
      : 0;

    // Вычисляем средний LTV (упрощенно)
    const customerLTV: Record<string, number> = {};
    orders.forEach(order => {
      if (order.customer_id) {
        customerLTV[order.customer_id] = (customerLTV[order.customer_id] || 0) + Number(order.total_amount);
      }
    });

    const avgLtv = Object.keys(customerLTV).length 
      ? Math.round(Object.values(customerLTV).reduce((sum, val) => sum + val, 0) / Object.keys(customerLTV).length) 
      : 0;

    return {
      today: todayOrders.length,
      yesterday: yesterdayOrders.length,
      lastWeek: lastWeekOrders.length,
      lastMonth: lastMonthOrders.length,
      avgOrderValue,
      conversion: 2.8,
      repeatOrders: repeatRate,
      avgLtv
    };
  } catch (error) {
    console.error('Error in fallback statistics:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось загрузить статистику',
      variant: 'destructive',
    });
    return null;
  }
};
