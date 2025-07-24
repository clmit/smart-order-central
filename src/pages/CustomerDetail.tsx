import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Phone, Mail, MapPin, Calendar, ShoppingBag, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getCustomerById, updateCustomer, getOrders } from '@/lib/api';
import { Customer, Order } from '@/types';
import { formatOrderId } from '@/lib/orderUtils';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    const loadCustomerData = async () => {
      if (!id) return;

      try {
        const customerData = await getCustomerById(id);
        if (customerData) {
          setCustomer(customerData);
          setEditForm({
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email || '',
            address: customerData.address || ''
          });
          
          // Load customer's orders
          const orders = await getOrders();
          const customerOrders = orders.filter(order => order.customerId === id);
          setCustomerOrders(customerOrders);
        } else {
          toast({
            title: "Ошибка",
            description: "Клиент не найден",
            variant: "destructive"
          });
          navigate('/customers');
        }
      } catch (error) {
        console.error('Failed to load customer data:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные клиента",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, [id, navigate, toast]);

  const handleSaveCustomer = async () => {
    if (!customer || !id) return;

    setIsSubmitting(true);
    try {
      const updatedCustomer = await updateCustomer(id, {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email || undefined,
        address: editForm.address || undefined
      });

      if (updatedCustomer) {
        setCustomer(updatedCustomer);
        setIsEditing(false);
        toast({
          title: "Клиент обновлен",
          description: "Изменения успешно сохранены"
        });
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные клиента",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'processing': return 'secondary';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'processing': return 'В обработке';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Загрузка данных клиента...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Клиент не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between bg-card rounded-lg px-6 py-4 border">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <Badge variant="outline">
            <ShoppingBag className="h-4 w-4 mr-1" />
            {customer.totalOrders} заказов
          </Badge>
          <Badge variant="outline">
            <DollarSign className="h-4 w-4 mr-1" />
            {formatCurrency(customer.totalSpent)}
          </Badge>
        </div>
        <div className="flex gap-2 mt-4 lg:mt-0">
          <Button variant="outline" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email || '',
                    address: customer.address || ''
                  });
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Отменить
              </Button>
              <Button onClick={handleSaveCustomer} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Информация о клиенте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Имя</Label>
                {isEditing ? (
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Имя клиента"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">{customer.name}</span>
                  </div>
                )}
              </div>

              <div>
                <Label>Телефон</Label>
                {isEditing ? (
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Номер телефона"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{customer.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <Label>Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email адрес"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{customer.email || 'Не указано'}</span>
                  </div>
                )}
              </div>

              <div>
                <Label>Адрес</Label>
                {isEditing ? (
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Адрес клиента"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{customer.address || 'Не указано'}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label>Дата регистрации</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatDate(customer.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>История заказов ({customerOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {customerOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  У этого клиента пока нет заказов
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium">
                            {formatOrderId(order.orderNumber || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(order.date)}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.items.length} товаров
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetail;