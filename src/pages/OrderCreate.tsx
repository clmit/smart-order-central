import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createOrder } from '@/lib/supabaseApi';
import { toast } from '@/components/ui/use-toast';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { OrderSource } from '@/types';

export function OrderCreate() {
  const navigate = useNavigate();
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Имя клиента *</Label>
                  <Input 
                    id="customerName" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Телефон *</Label>
                  <Input 
                    id="customerPhone" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input 
                    id="customerEmail" 
                    type="email"
                    value={customerEmail} 
                    onChange={(e) => setCustomerEmail(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Адрес</Label>
                  <Input 
                    id="customerAddress" 
                    value={customerAddress} 
                    onChange={(e) => setCustomerAddress(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderSource">Источник заказа</Label>
                  <Select 
                    value={orderSource} 
                    onValueChange={(value) => setOrderSource(value as OrderSource)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Сайт</SelectItem>
                      <SelectItem value="phone">Телефон</SelectItem>
                      <SelectItem value="store">Магазин</SelectItem>
                      <SelectItem value="referral">Реферал</SelectItem>
                      <SelectItem value="other">Другое</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Товары</CardTitle>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" /> Добавить товар
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="space-y-2 border p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Товар {index + 1}</h3>
                    {items.length > 1 && (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeItem(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Название *</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Описание</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        rows={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Цена *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Количество</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-muted-foreground">Итого:</div>
                  <div className="text-xl font-bold">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(calculateTotal())}</div>
                </div>
              </div>
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
