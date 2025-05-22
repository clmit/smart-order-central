
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { OrderSource } from '@/types';
import CustomerInfoForm from '@/components/order/CustomerInfoForm';
import OrderItemsSection from '@/components/order/OrderItemsSection';
import { createOrder } from '@/lib/supabaseApi';

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

  const validateData = () => {
    if (!customerName || !customerPhone) {
      toast({
        title: 'Ошибка',
        description: 'Имя и телефон клиента обязательны',
        variant: 'destructive',
      });
      return false;
    }

    if (items.some(item => !item.name || item.price <= 0)) {
      toast({
        title: 'Ошибка',
        description: 'Все товары должны иметь название и цену',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateData()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare order data
      const orderData = {
        customerId: '',
        customer: {
          id: '',
          name: customerName,
          phone: customerPhone,
          address: customerAddress || '',
          email: customerEmail || undefined,
          createdAt: '',
          totalOrders: 0,
          totalSpent: 0
        },
        date: new Date().toISOString(),
        source: orderSource,
        items: items.map(item => ({
          id: '',
          name: item.name,
          description: item.description || '',
          price: Number(item.price),
          quantity: Number(item.quantity),
          photoUrl: undefined
        })),
        status: 'new' as 'new' | 'processing' | 'completed' | 'cancelled',
        totalAmount: calculateTotal()
      };

      console.log('Creating order with data:', orderData);
      
      // Use the imported API function to create the order
      const createdOrder = await createOrder(orderData);
      
      toast({
        title: 'Успешно',
        description: `Заказ #${createdOrder.id.substring(0, 6)} создан`,
      });
      
      // Navigate to the order details page
      navigate(`/orders/${createdOrder.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать заказ. Пожалуйста, попробуйте снова.',
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
