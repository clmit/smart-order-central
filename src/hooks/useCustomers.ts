import { useState, useEffect } from 'react';
import { Customer } from '@/types';
import { getAllRecordsPaginated } from '@/lib/api/utils';
import { toast } from '@/hooks/use-toast';

// Function for getting all customers through pagination
const getAllCustomers = async (): Promise<Customer[]> => {
  const allCustomers = await getAllRecordsPaginated<any>('customers');
  
  console.log(`Fetched ${allCustomers.length} customers through pagination`);
  
  return allCustomers.map(customer => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    email: customer.email || undefined,
    createdAt: customer.created_at,
    totalOrders: customer.total_orders,
    totalSpent: Number(customer.total_spent)
  }));
};

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'totalOrders' | 'totalSpent'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

  // Load customers data
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await getAllCustomers();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error('Failed to load customers:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить список клиентов',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCustomers();
  }, []);

  // Apply filtering and sorting
  useEffect(() => {
    // Apply search filter
    let result = [...customers];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        customer => 
          customer.name.toLowerCase().includes(term) || 
          customer.phone.includes(term) ||
          (customer.address && customer.address.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const aValue = a[sortField];
        const bValue = b[sortField];
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
    
    setFilteredCustomers(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, customers, sortField, sortDirection]);

  // Get current customers for pagination
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  // Handle sorting
  const handleSort = (field: 'name' | 'totalOrders' | 'totalSpent') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Update customer in local state
  const updateCustomerInState = (updatedCustomer: Customer) => {
    setCustomers(prevCustomers => 
      prevCustomers.map(c => 
        c.id === updatedCustomer.id ? updatedCustomer : c
      )
    );
  };

  return {
    customers,
    currentCustomers,
    filteredCustomers,
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
  };
}
