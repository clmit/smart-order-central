
import React from 'react';
import { ChevronLeft, ChevronRight, PhoneCall, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types';
import { CustomerActions } from './CustomerActions';

interface CustomerListProps {
  customers: Customer[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortField: 'name' | 'totalOrders' | 'totalSpent';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'totalOrders' | 'totalSpent') => void;
  onEditCustomer: (customer: Customer) => void;
  isLoading: boolean;
}

export function CustomerList({
  customers,
  currentPage,
  totalPages,
  onPageChange,
  sortField,
  sortDirection,
  onSort,
  onEditCustomer,
  isLoading
}: CustomerListProps) {
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка клиентов...</div>;
  }

  if (customers.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">
      Нет клиентов, соответствующих запросу
    </div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th 
                className="text-left font-medium py-2 cursor-pointer hover:text-primary"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center">
                  Имя
                  {sortField === 'name' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="text-left font-medium py-2">Контакты</th>
              <th className="text-left font-medium py-2">Дата регистрации</th>
              <th 
                className="text-left font-medium py-2 cursor-pointer hover:text-primary"
                onClick={() => onSort('totalOrders')}
              >
                <div className="flex items-center">
                  Заказов
                  {sortField === 'totalOrders' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="text-left font-medium py-2 cursor-pointer hover:text-primary"
                onClick={() => onSort('totalSpent')}
              >
                <div className="flex items-center">
                  Сумма покупок
                  {sortField === 'totalSpent' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="text-right font-medium py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="border-b hover:bg-muted/50"
              >
                <td className="py-3">
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">ID: {customer.id.substring(0, 6)}</div>
                </td>
                <td className="py-3">
                  <div className="flex items-center mb-1">
                    <PhoneCall className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`tel:${customer.phone}`} className="text-sm hover:underline">{customer.phone}</a>
                  </div>
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`mailto:${customer.email}`} className="text-sm hover:underline">{customer.email}</a>
                    </div>
                  )}
                </td>
                <td className="py-3 text-sm">{formatDate(customer.createdAt)}</td>
                <td className="py-3 text-sm font-medium">{customer.totalOrders}</td>
                <td className="py-3 font-medium">{formatCurrency(customer.totalSpent)}</td>
                <td className="py-3 text-right">
                  <CustomerActions customer={customer} onEdit={onEditCustomer} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Страница {currentPage} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
