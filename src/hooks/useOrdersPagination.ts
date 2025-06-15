
import { useState, useEffect } from 'react';
import { getOrdersPaginated, PaginatedOrdersResponse } from '@/lib/api/orders';
import { Order } from '@/types';

export const useOrdersPagination = (
  searchTerm: string,
  statusFilter: string,
  ordersPerPage: number = 10
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Fetch orders when page or filters change
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const result = await getOrdersPaginated(
          currentPage,
          ordersPerPage,
          searchTerm,
          statusFilter === 'all' ? undefined : statusFilter
        );
        
        setOrders(result.orders);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
        setTotalPages(0);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, ordersPerPage]);

  return {
    orders,
    currentPage,
    setCurrentPage,
    totalPages,
    total,
    isLoading
  };
};
