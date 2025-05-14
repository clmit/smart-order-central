
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createOrder } from '@/lib/supabaseApi';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { OrderSource } from '@/types';
import CustomerInfoForm from '@/components/order/CustomerInfoForm';
import OrderItemsSection from '@/components/order/OrderItemsSection';

export function OrderCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderSource, setOrderSource] = useState<OrderSource>('phone');
  const [items, setItems] = useState([
    { name: '', description: '', price: 0, quantity: 1 }
  ]);

  const addItem = () => {
    setItems([...items, { name: '', description: '', price: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerPhone) {
      toast({
        title: 'Ошибка',
        description: 'Имя и телефон клиента обязательны',
        variant: 'destructive',
      });
      return;
    }

    if (items.some(item => !item.name || item.price <= 0)) {
      toast({
        title: 'Ошибка',
        description: 'Все товары должны иметь название и цену',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Подготовка данных для создания заказа
      const orderData = {
        customerId: '', // Будет назначено серверной частью
        date: new Date().toISOString(),
        source: orderSource,
        status: 'new' as const,
        totalAmount: calculateTotal(),
        items: items.map(item => ({
          id: '', // Будет назначено серверной частью
          name: item.name,
          description: item.description,
          price: Number(item.price),
          quantity: Number(item.quantity),
        })),
        customer: {
          id: '', // Будет назначено серверной частью
          name: customerName,
          phone: customerPhone,
          email: customerEmail || undefined,
          address: customerAddress || '',
          createdAt: new Date().toISOString(), // Это поле будет заменено серверной частью
          totalOrders: 0, // Будет обновлено серверной частью
          totalSpent: 0  // Будет обновлено серверной частью
        }
      };

      console.log('Submitting order data:', orderData);
      const createdOrder = await createOrder(orderData);
      
      if (!createdOrder || !createdOrder.id) {
        throw new Error('Не удалось создать заказ - ID заказа не возвращен');
      }
      
      toast({
        title: 'Заказ создан',
        description: `Номер заказа: #${createdOrder.id.substring(0, 6)}`,
      });
      
      navigate(`/orders/${createdOrder.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать заказ. Пожалуйста, попробуйте снова.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Новый заказ</h1>
        <p className="text-muted-foreground">Создание заказа для клиента</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация о клиенте</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerInfoForm
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
                customerAddress={customerAddress}
                setCustomerAddress={setCustomerAddress}
                orderSource={orderSource}
                setOrderSource={setOrderSource}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Товары</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsSection
                items={items}
                addItem={addItem}
                removeItem={removeItem}
                updateItem={updateItem}
                calculateTotal={calculateTotal}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/orders')}
            >
              Отмена
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Создать заказ
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default OrderCreate;
