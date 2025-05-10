
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getCustomers, sendSms } from '@/lib/api';
import { Customer } from '@/types';

export function Messaging() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialPhone = searchParams.get('phone') || '';
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(initialPhone ? [initialPhone] : []);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'orders' | 'amount'>('all');
  const [filterValue, setFilterValue] = useState('3');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to load customers:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список клиентов",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCustomers();
  }, [toast]);
  
  const filteredCustomers = () => {
    switch (filter) {
      case 'orders':
        return customers.filter(c => c.totalOrders >= parseInt(filterValue));
      case 'amount':
        return customers.filter(c => c.totalSpent >= parseInt(filterValue) * 1000);
      default:
        return customers;
    }
  };

  const selectedCustomersData = customers.filter(c => selectedCustomers.includes(c.phone));

  const handleToggleAll = () => {
    const filtered = filteredCustomers();
    if (selectedCustomers.length === filtered.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filtered.map(c => c.phone));
    }
  };

  const handleToggleCustomer = (phone: string) => {
    if (selectedCustomers.includes(phone)) {
      setSelectedCustomers(selectedCustomers.filter(p => p !== phone));
    } else {
      setSelectedCustomers([...selectedCustomers, phone]);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Нет текста",
        description: "Введите текст сообщения",
        variant: "destructive"
      });
      return;
    }

    if (selectedCustomers.length === 0) {
      toast({
        title: "Нет получателей",
        description: "Выберите хотя бы одного клиента",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const result = await sendSms(selectedCustomers, message);
      
      toast({
        title: "Сообщения отправлены",
        description: `Успешно отправлено: ${result.sent}, не доставлено: ${result.failed}`,
        variant: result.success ? "default" : "destructive"
      });
      
      if (result.success) {
        setMessage('');
      }
    } catch (error) {
      console.error('Failed to send messages:', error);
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить сообщения",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Рассылка</h1>
          <p className="text-muted-foreground">Отправка SMS сообщений клиентам</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Фильтры клиентов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="filter-type">Фильтровать по</Label>
                <Select
                  value={filter}
                  onValueChange={(value: 'all' | 'orders' | 'amount') => setFilter(value)}
                >
                  <SelectTrigger id="filter-type">
                    <SelectValue placeholder="Выберите критерий" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все клиенты</SelectItem>
                    <SelectItem value="orders">Количеству заказов</SelectItem>
                    <SelectItem value="amount">Сумме заказов</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filter !== 'all' && (
                <div>
                  <Label htmlFor="filter-value">
                    {filter === 'orders' ? 'Минимальное число заказов' : 'Минимальная сумма (тыс. ₽)'}
                  </Label>
                  <Input
                    id="filter-value"
                    type="number"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  />
                </div>
              )}

              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Выбрано клиентов: {selectedCustomers.length}</p>
                {selectedCustomers.length > 0 ? (
                  <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                    {selectedCustomersData.map(customer => (
                      <div key={customer.id} className="text-sm mb-1 flex justify-between">
                        <span>{customer.name}</span>
                        <span className="text-muted-foreground">{customer.phone}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Не выбрано ни одного клиента</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Текст сообщения</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Введите текст сообщения..."
                className="resize-none min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {message.length} / 160 символов
                </span>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSending || message.trim() === '' || selectedCustomers.length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Отправить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Список клиентов</span>
                <Button variant="outline" size="sm" onClick={handleToggleAll}>
                  {selectedCustomers.length === filteredCustomers().length ? 'Снять все' : 'Выбрать все'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Загрузка списка клиентов...</div>
              ) : filteredCustomers().length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {filteredCustomers().map(customer => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`customer-${customer.id}`}
                          checked={selectedCustomers.includes(customer.phone)}
                          onCheckedChange={() => handleToggleCustomer(customer.phone)}
                        />
                        <div>
                          <Label
                            htmlFor={`customer-${customer.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {customer.name}
                          </Label>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </div>
                      </div>
                      <div className="text-sm text-right">
                        <div>{customer.totalOrders} заказов</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('ru-RU', { 
                            style: 'currency', 
                            currency: 'RUB',
                            maximumFractionDigits: 0
                          }).format(customer.totalSpent)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  По выбранным критериям нет клиентов
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Messaging;
