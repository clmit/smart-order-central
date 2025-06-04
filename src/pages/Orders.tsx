import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getOrders } from '@/lib/api';
import { Order } from '@/types';
import { formatOrderId } from '@/lib/orderUtils';

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract customerPhone from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const customerPhoneParam = queryParams.get('customerPhone');

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
  }, [customerPhoneParam]);

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
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, orders]);

  // Get current orders for pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Format order date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
  };

  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center text-crm-green">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            <span>Завершен</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center text-crm-blue">
            <Clock className="h-4 w-4 mr-1" />
            <span>В обработке</span>
          </div>
        );
      case 'new':
        return (
          <div className="flex items-center text-amber-500">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Новый</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center text-crm-red">
            <XCircle className="h-4 w-4 mr-1" />
            <span>Отменен</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Заказы</h1>
          <p className="text-muted-foreground">Управление заказами клиентов</p>
        </div>
        <Button onClick={() => navigate('/orders/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Новый заказ
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск по имени, телефону или ID заказа..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Статус заказа" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="processing">В обработке</SelectItem>
            <SelectItem value="completed">Завершенные</SelectItem>
            <SelectItem value="cancelled">Отмененные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show customer info if filter by customer is active */}
      {customerPhoneParam && (
        <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Отображаются заказы клиента с номером: {decodeURIComponent(customerPhoneParam)}</p>
          </div>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            navigate('/orders');
          }}>
            Отменить фильтр
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Загрузка заказов...</div>
          ) : currentOrders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium py-2">ID</th>
                      <th className="text-left font-medium py-2">Дата</th>
                      <th className="text-left font-medium py-2">Клиент</th>
                      <th className="text-left font-medium py-2">Товары</th>
                      <th className="text-left font-medium py-2">Сумма</th>
                      <th className="text-left font-medium py-2">Источник</th>
                      <th className="text-left font-medium py-2">Статус</th>
                      <th className="text-right font-medium py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <td className="py-3 text-sm font-mono">{formatOrderId(order.orderNumber || 0)}</td>
                        <td className="py-3 text-sm">{formatDate(order.date)}</td>
                        <td className="py-3">
                          <div className="font-medium">{order.customer?.name || 'Неизвестно'}</div>
                          <div className="text-sm text-muted-foreground">{order.customer?.phone}</div>
                        </td>
                        <td className="py-3 text-sm">{order.items.length} позиций</td>
                        <td className="py-3 font-medium">{formatCurrency(order.totalAmount)}</td>
                        <td className="py-3 text-sm capitalize">
                          {order.source === 'website' ? 'Сайт' : 
                           order.source === 'phone' ? 'Телефон' : 
                           order.source === 'store' ? 'Магазин' :
                           order.source === 'referral' ? 'Реферал' : 'Другое'}
                        </td>
                        <td className="py-3 text-sm">{getStatusBadge(order.status)}</td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${order.id}`);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">View</span>
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
              Нет заказов, соответствующих фильтрам
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Orders;
