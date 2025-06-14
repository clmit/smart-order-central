
import { supabase } from '@/integrations/supabase/client';

export interface BasicStatistics {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
}

// Получение базовой статистики через пагинацию для всех данных
export const getBasicStatistics = async (): Promise<BasicStatistics> => {
  try {
    // Получаем все заказы через пагинацию
    let allOrders: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;
      
      if (!orders || orders.length === 0) break;
      
      allOrders = [...allOrders, ...orders];
      
      if (orders.length < pageSize) break;
      
      page++;
    }

    console.log(`Basic statistics: Fetched ${allOrders.length} orders`);

    // Получаем общее количество клиентов
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (customersError) throw customersError;

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue,
      totalCustomers: totalCustomers || 0,
      averageOrderValue
    };
  } catch (error) {
    console.error('Error fetching basic statistics:', error);
    return {
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      averageOrderValue: 0
    };
  }
};
