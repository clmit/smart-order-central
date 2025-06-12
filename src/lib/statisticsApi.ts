
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StatisticsMetrics {
  today: number;
  yesterday: number;
  lastWeek: number;
  lastMonth: number;
  avgOrderValue: number;
  conversion: number;
  repeatOrders: number;
  avgLtv: number;
}

export interface TimeSeriesData {
  date: string;
  заказы: number;
  выручка: number;
}

export interface SourceData {
  name: string;
  value: number;
}

export interface CustomerData {
  name: string;
  value: number;
}

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

    // Запрос на количество заказов по периодам
    const { data: ordersCount, error: ordersError } = await supabase
      .rpc('get_orders_statistics', {
        today_date: today.toISOString(),
        yesterday_date: yesterday.toISOString(),
        week_date: lastWeek.toISOString(),
        month_date: lastMonth.toISOString()
      });

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

// Получение данных по источникам
export const getSourceData = async (metricType: string): Promise<SourceData[]> => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('source, total_amount')
      .limit(10000); // Ограничиваем для производительности

    if (error) throw error;

    const sourceData: Record<string, { orders: number; revenue: number }> = {};
    
    orders.forEach(order => {
      const source = order.source;
      if (!sourceData[source]) {
        sourceData[source] = { orders: 0, revenue: 0 };
      }
      sourceData[source].orders += 1;
      sourceData[source].revenue += Number(order.total_amount);
    });

    return Object.entries(sourceData).map(([source, data]) => {
      const sourceName = source === 'website' ? 'Сайт' :
                         source === 'phone' ? 'Телефон' :
                         source === 'store' ? 'Магазин' :
                         source === 'referral' ? 'Реферал' : 'Другое';
      
      return {
        name: sourceName,
        value: metricType === 'orders' ? data.orders : Math.round(data.revenue / 1000)
      };
    });
  } catch (error) {
    console.error('Error fetching source data:', error);
    return [];
  }
};

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
