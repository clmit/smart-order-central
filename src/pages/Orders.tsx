
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrdersHeader } from '@/components/orders/OrdersHeader';
import { OrdersFilters } from '@/components/orders/OrdersFilters';
import { CustomerFilter } from '@/components/orders/CustomerFilter';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrdersPagination } from '@/components/orders/OrdersPagination';
import { useOrdersFilters } from '@/hooks/useOrdersFilters';
import { useOrdersPagination } from '@/hooks/useOrdersPagination';

export function Orders() {
  const location = useLocation();
  
  // Extract customerPhone from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const customerPhoneParam = queryParams.get('customerPhone');

  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    statusFilter,
    setStatusFilter
  } = useOrdersFilters();

  const {
    orders,
    currentPage,
    setCurrentPage,
    totalPages,
    total,
    isLoading
  } = useOrdersPagination(debouncedSearchTerm, statusFilter);

  // Set initial search term from URL parameter
  useEffect(() => {
    if (customerPhoneParam) {
      setSearchTerm(decodeURIComponent(customerPhoneParam));
    }
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
          <CardTitle>
            Список заказов 
            {!isLoading && total > 0 && (
              <span className="text-muted-foreground font-normal ml-2">
                ({total} всего)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={orders} isLoading={isLoading} />
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
