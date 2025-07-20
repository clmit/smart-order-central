
import { useNavigate } from 'react-router-dom';
import { FileText, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Order } from '@/types';
import { formatOrderId } from '@/lib/orderUtils';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
}

export const OrdersTable = ({ orders, isLoading }: OrdersTableProps) => {
  const navigate = useNavigate();

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

  if (isLoading) {
    return <div className="text-center py-8">Загрузка заказов...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Нет заказов, соответствующих фильтрам
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Клиент</TableHead>
            <TableHead>Товары</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Источник</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <TableCell className="font-mono">{formatOrderId(order.orderNumber || 0)}</TableCell>
              <TableCell>{formatDate(order.date)}</TableCell>
              <TableCell>
                <div className="font-medium">{order.customer?.name || 'Неизвестно'}</div>
                <div className="text-sm text-muted-foreground">{order.customer?.phone}</div>
              </TableCell>
              <TableCell>{order.items.length} позиций</TableCell>
              <TableCell className="font-medium">{formatCurrency(order.totalAmount)}</TableCell>
              <TableCell className="capitalize">
                {order.source === 'website' ? 'Сайт' : 
                 order.source === 'phone' ? 'Телефон' : 
                 order.source === 'store' ? 'Магазин' :
                 order.source === 'referral' ? 'Реферал' : 'Другое'}
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/orders/${order.id}`);
                    }}
                    title="Просмотр заказа"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">Просмотр</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/orders/${order.id}?edit=true`);
                    }}
                    title="Редактировать заказ"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Редактировать</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
