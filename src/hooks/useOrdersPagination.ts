
import { useState, useEffect } from 'react';
import { Order } from '@/types';

export const useOrdersPagination = (orders: Order[], ordersPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when orders change
  useEffect(() => {
    setCurrentPage(1);
  }, [orders]);

  // Get current orders for pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  return {
    currentOrders,
    currentPage,
    setCurrentPage,
    totalPages
  };
};
