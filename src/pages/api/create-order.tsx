
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export function CreateOrder() {
  const navigate = useNavigate();

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
        const orderData = JSON.parse(decodeURIComponent(params.get('data') || '{}'));
        
        // Отправляем запрос к Supabase Edge Function
        const response = await fetch(`https://dzuyeaqwdkpegosfhooz.functions.supabase.co/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка при создании заказа');
        }
        
        const createdOrder = await response.json();
        
        toast({
          title: 'Успешно',
          description: `Заказ #${createdOrder.id.substring(0, 6)} создан`,
        });
        
        // Перенаправляем на страницу заказа
        navigate(`/orders/${createdOrder.id}`);
      } catch (error) {
        console.error('Error creating order:', error);
        toast({
          title: 'Ошибка',
          description: error instanceof Error ? error.message : 'Не удалось создать заказ',
          variant: 'destructive',
        });
        navigate('/orders');
      }
    };
    
    handleOrder();
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-2">Создание заказа...</h2>
        <p className="text-muted-foreground">Пожалуйста, подождите</p>
      </div>
    </div>
  );
}

export default CreateOrder;
