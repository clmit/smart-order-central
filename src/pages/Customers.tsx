
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  PhoneCall,
  Mail,
  Edit,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getCustomers, updateCustomer } from '@/lib/api';
import { Customer } from '@/types';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'totalOrders' | 'totalSpent'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const customersPerPage = 10;
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      email: '',
    },
  });

  // Load customers data
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error('Failed to load customers:', error);
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

  // Handle sorting
  const handleSort = (field: 'name' | 'totalOrders' | 'totalSpent') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Navigate to customer orders
  const handleNavigateToCustomerOrders = (phone: string) => {
    navigate(`/orders?customerPhone=${encodeURIComponent(phone)}`);
  };

  // Navigate to messaging
  const handleNavigateToMessaging = (phone: string) => {
    navigate(`/messaging?phone=${encodeURIComponent(phone)}`);
  };

  // Open edit dialog
  const handleEditCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    form.reset({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      email: customer.email || '',
    });
    setEditDialogOpen(true);
  };

  // Submit edit form
  const onSubmit = async (data: { name: string; phone: string; address: string; email: string }) => {
    if (!currentCustomer) return;
    
    try {
      const updatedCustomer = await updateCustomer(currentCustomer.id, {
        ...data,
      });
      
      if (updatedCustomer) {
        // Update the customer in the local state
        setCustomers(prevCustomers => 
          prevCustomers.map(c => 
            c.id === updatedCustomer.id ? updatedCustomer : c
          )
        );
        
        toast({
          title: 'Успех',
          description: 'Данные клиента успешно обновлены',
        });
        
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить данные клиента',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Клиенты</h1>
          <p className="text-muted-foreground">Управление клиентами и их заказами</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск по имени или телефону..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список клиентов</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Загрузка клиентов...</div>
          ) : currentCustomers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th 
                        className="text-left font-medium py-2 cursor-pointer hover:text-primary"
                        onClick={() => handleSort('name')}
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
                        onClick={() => handleSort('totalOrders')}
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
                        onClick={() => handleSort('totalSpent')}
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
                    {currentCustomers.map((customer) => (
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleNavigateToMessaging(customer.phone)}
                          >
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Send Message</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleNavigateToCustomerOrders(customer.phone)}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">Orders</span>
                          </Button>
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
                    onClick={() => setCurrentPage(currentPage - 1)}
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
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Нет клиентов, соответствующих запросу
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактирование клиента</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Адрес</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)} 
                  type="button"
                >
                  Отмена
                </Button>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Customers;
