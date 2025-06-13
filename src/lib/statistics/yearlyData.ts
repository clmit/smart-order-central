
import { supabase } from '@/integrations/supabase/client';
import { YearlyData } from './types';

// Получение статистики по годам
export const getYearlyData = async (): Promise<YearlyData[]> => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('date, total_amount')
      .order('date', { ascending: true });

    if (error) throw error;

    const yearlyData: Record<number, { orders: number; revenue: number }> = {};
    
    orders.forEach(order => {
      const year = new Date(order.date).getFullYear();
      if (!yearlyData[year]) {
        yearlyData[year] = { orders: 0, revenue: 0 };
      }
      yearlyData[year].orders += 1;
      yearlyData[year].revenue += Number(order.total_amount);
    });

    return Object.entries(yearlyData)
      .map(([year, data]) => ({
        year: parseInt(year),
        orders: data.orders,
        revenue: Math.round(data.revenue)
      }))
      .sort((a, b) => b.year - a.year);
  } catch (error) {
    console.error('Error fetching yearly data:', error);
    return [];
  }
};
