
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function CreateOrder() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOrder = async () => {
      try {
        // Получаем параметры из URL
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        
        // Проверяем наличие необходимых параметров
        if (!params.has('data')) {
          toast({
            title: 'Ошибка',
            description: 'Отсутствуют данные для создания заказа',
            variant: 'destructive',
          });
          navigate('/orders');
          return;
        }
        
        // Пытаемся декодировать данные
        const encodedData = params.get('data') || '';
        console.log('Encoded data:', encodedData);
        
        const orderData = JSON.parse(decodeURIComponent(encodedData));
        console.log('Decoded order data:', orderData);
        
        // Отправляем запрос к Supabase Edge Function
        const response = await fetch(`https://dzuyeaqwdkpegosfhooz.functions.supabase.co/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dXllYXF3ZGtwZWdvc2Zob296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzYxNjEsImV4cCI6MjA2MjQxMjE2MX0.ZWjpNN7kVc7d8D8H4hSYyHlKu2TRSXEK9L172mX49Bg'}`
          },
          body: JSON.stringify(orderData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.error || 'Ошибка при создании заказа');
        }
        
        const createdOrder = await response.json();
        console.log('Created order:', createdOrder);
        
        if (!createdOrder || !createdOrder.id) {
          throw new Error('Заказ не найден в ответе сервера');
        }
        
        toast({
          title: 'Успешно',
          description: `Заказ #${createdOrder.id.substring(0, 6)} создан`,
        });
        
        // Перенаправляем на страницу заказа
        navigate(`/orders/${createdOrder.id}`);
      } catch (error) {
        console.error('Error creating order:', error);
        setError(error instanceof Error ? error.message : 'Не удалось создать заказ');
        toast({
          title: 'Ошибка',
          description: error instanceof Error ? error.message : 'Не удалось создать заказ',
          variant: 'destructive',
        });
        navigate('/orders');
      } finally {
        setIsLoading(false);
      }
    };
    
    handleOrder();
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-2">Создание заказа...</h2>
        <p className="text-muted-foreground">Пожалуйста, подождите</p>
        {isLoading && (
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="mt-4 text-red-500">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateOrder;
