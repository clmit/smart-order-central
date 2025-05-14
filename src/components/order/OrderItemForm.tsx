
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Minus } from 'lucide-react';

interface OrderItem {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

interface OrderItemFormProps {
  item: OrderItem;
  index: number;
  updateItem: (index: number, field: string, value: string | number) => void;
  removeItem: (index: number) => void;
  canRemove: boolean;
}

export const OrderItemForm = ({
  item,
  index,
  updateItem,
  removeItem,
  canRemove
}: OrderItemFormProps) => {
  return (
    <div className="space-y-2 border p-4 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Товар {index + 1}</h3>
        {canRemove && (
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
  );
};

export default OrderItemForm;
