
import { getAllRecordsPaginated } from '@/lib/api/utils';

export interface BasicStatistics {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
}

// Get basic statistics through pagination for all data
export const getBasicStatistics = async (): Promise<BasicStatistics> => {
  try {
    // Get all orders through pagination
    const allOrders = await getAllRecordsPaginated<any>('orders', 'total_amount');

    console.log(`Basic statistics: Fetched ${allOrders.length} orders`);

    // Get total number of customers
    const allCustomers = await getAllRecordsPaginated<any>('customers', 'id');

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue,
      totalCustomers: allCustomers.length,
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
