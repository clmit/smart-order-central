
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateData()) {
      return;
    }

    setIsLoading(true);

    try {
      // Подготовка данных для Edge Function
      const orderData = {
        customerName, 
        customerPhone,
        customerEmail: customerEmail || undefined,
        customerAddress: customerAddress || '',
        source: orderSource,
        items: items.map(item => ({
          name: item.name,
          description: item.description || '',
          price: Number(item.price),
          quantity: Number(item.quantity),
          photoUrl: null
        }))
      };

      console.log('Preparing order data:', orderData);
      
      // Отправляем данные напрямую через URL без кодирования
      // Преобразуем в строку JSON
      const jsonString = JSON.stringify(orderData);
      console.log('JSON string length:', jsonString.length);
      console.log('JSON string:', jsonString);
      
      // Проверка того, что мы можем успешно парсить наш JSON обратно
      try {
        JSON.parse(jsonString);
      } catch (error) {
        console.error('Invalid JSON:', error);
        throw new Error('Ошибка в формате данных заказа');
      }

      // Перенаправляем на страницу создания заказа с данными
      console.log('Navigating to create order with data');
      navigate(`/api/create-order?data=${jsonString}`);
    } catch (error) {
      console.error('Error preparing order:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать заказ. Пожалуйста, попробуйте снова.',
        variant: 'destructive',
      });
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
