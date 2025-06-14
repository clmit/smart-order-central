
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface OrderStatusBadgeProps {
  status: string;
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  switch (status) {
    case 'completed':
      return (
        <div className="flex items-center text-crm-green">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          <span>Завершен</span>
        </div>
      );
    case 'processing':
      return (
        <div className="flex items-center text-crm-blue">
          <Clock className="h-4 w-4 mr-1" />
          <span>В обработке</span>
        </div>
      );
    case 'new':
      return (
        <div className="flex items-center text-amber-500">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>Новый</span>
        </div>
      );
    case 'cancelled':
      return (
        <div className="flex items-center text-crm-red">
          <XCircle className="h-4 w-4 mr-1" />
          <span>Отменен</span>
        </div>
      );
    default:
      return null;
  }
};
