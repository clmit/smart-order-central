
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OrdersHeader = () => {
  const navigate = useNavigate();

  return (
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
  );
};
