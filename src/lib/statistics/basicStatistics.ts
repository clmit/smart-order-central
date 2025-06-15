
import { supabase } from '@/integrations/supabase/client';
import { StatisticsMetrics } from './types';

// Get basic statistics for the Statistics page
export const getBasicStatistics = async (): Promise<StatisticsMetrics> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Get orders for different periods
    const { data: allOrders, error } = await supabase
      .from('orders')
      .select('date, total_amount')
      .order('date', { ascending: false });

    if (error) throw error;

    const orders = allOrders || [];

    // Calculate statistics
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= today;
    });

    const yesterdayOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= yesterday && orderDate < today;
    });

    const weekOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= weekAgo;
    });

    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= monthAgo;
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Get unique customers for repeat rate calculation
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('total_orders');

    if (customersError) throw customersError;

    const repeatCustomers = customers?.filter(c => c.total_orders > 1).length || 0;
    const totalCustomers = customers?.length || 0;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    return {
      today: todayOrders.length,
      yesterday: yesterdayOrders.length,
      lastWeek: weekOrders.length,
      lastMonth: monthOrders.length,
      avgOrderValue,
      conversion: 2.8, // Static value as before
      repeatOrders: Math.round(repeatRate),
      avgLtv: avgOrderValue * 2.5 // Estimated LTV
    };
  } catch (error) {
    console.error('Error fetching basic statistics:', error);
    return {
      today: 0,
      yesterday: 0,
      lastWeek: 0,
      lastMonth: 0,
      avgOrderValue: 0,
      conversion: 2.8,
      repeatOrders: 0,
      avgLtv: 0
    };
  }
};
