
import { useState } from 'react';
import { Users } from 'lucide-react';
import { Customer } from '@/types';
import { CustomerCard } from '@/components/customer/CustomerCard';
import { CustomerFilters } from '@/components/customer/CustomerFilters';
import { CustomerEditDialog } from '@/components/customer/CustomerEditDialog';
import { useCustomers } from '@/hooks/useCustomers';

export function Customers() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  
  const {
    currentCustomers,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDirection,
    handleSort,
    isLoading,
    currentPage,
    setCurrentPage,
    totalPages,
    updateCustomerInState
  } = useCustomers();

  // Open edit dialog
  const handleEditCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Клиенты</h1>
          <p className="text-muted-foreground">Управление клиентами и их заказами</p>
        </div>
      </div>

      <CustomerFilters 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
      />

      <CustomerCard 
        customers={currentCustomers}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onEditCustomer={handleEditCustomer}
        isLoading={isLoading}
      />

      <CustomerEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentCustomer={currentCustomer}
        onCustomerUpdated={updateCustomerInState}
      />
    </div>
  );
}

export default Customers;
