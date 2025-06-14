
import { useState, useEffect } from 'react';
import { Order } from '@/types';
import { formatOrderId } from '@/lib/orderUtils';

export const useOrdersFilters = (orders: Order[]) => {
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Apply filters
    let result = [...orders];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        order => 
          order.customer?.name?.toLowerCase().includes(term) || 
          order.customer?.phone?.includes(term) ||
          order.id.includes(term) ||
          formatOrderId(order.orderNumber || 0).toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
  }, [searchTerm, statusFilter, orders]);

  return {
    filteredOrders,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter
  };
};
