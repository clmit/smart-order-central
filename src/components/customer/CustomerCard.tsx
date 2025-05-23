
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerList } from './CustomerList';
import { Customer } from '@/types';

interface CustomerCardProps {
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

export function CustomerCard({
  customers,
  currentPage,
  totalPages,
  onPageChange,
  sortField,
  sortDirection,
  onSort,
  onEditCustomer,
  isLoading
}: CustomerCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Список клиентов</CardTitle>
      </CardHeader>
      <CardContent>
        <CustomerList
          customers={customers}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          onEditCustomer={onEditCustomer}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
