
import { supabase } from '@/integrations/supabase/client';
import { SourceData } from './types';

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
