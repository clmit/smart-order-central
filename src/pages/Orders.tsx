
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrders } from '@/lib/api';
import { Order } from '@/types';
import { OrdersHeader } from '@/components/orders/OrdersHeader';
import { OrdersFilters } from '@/components/orders/OrdersFilters';
import { CustomerFilter } from '@/components/orders/CustomerFilter';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrdersPagination } from '@/components/orders/OrdersPagination';
import { useOrdersFilters } from '@/hooks/useOrdersFilters';
import { useOrdersPagination } from '@/hooks/useOrdersPagination';

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  
  // Extract customerPhone from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const customerPhoneParam = queryParams.get('customerPhone');

  const {
    filteredOrders,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter
  } = useOrdersFilters(orders);

  const {
    currentOrders,
    currentPage,
    setCurrentPage,
    totalPages
  } = useOrdersPagination(filteredOrders);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getOrders();
        // Sort orders by date in descending order (newest first)
        const sortedOrders = [...data].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setOrders(sortedOrders);

        // If customerPhone is in the URL, set it as the initial search term
        if (customerPhoneParam) {
          setSearchTerm(decodeURIComponent(customerPhoneParam));
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
  }, [customerPhoneParam, setSearchTerm]);

  return (
    <div className="space-y-6">
      <OrdersHeader />

      <OrdersFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <CustomerFilter
        customerPhoneParam={customerPhoneParam}
        setSearchTerm={setSearchTerm}
      />

      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={currentOrders} isLoading={isLoading} />
          <OrdersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Orders;
