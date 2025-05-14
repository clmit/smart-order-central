
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import OrderItemForm from './OrderItemForm';

interface OrderItem {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

interface OrderItemsSectionProps {
  items: OrderItem[];
  addItem: () => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: string, value: string | number) => void;
  calculateTotal: () => number;
}

export const OrderItemsSection = ({
  items,
  addItem,
  removeItem,
  updateItem,
  calculateTotal,
}: OrderItemsSectionProps) => {
  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-bold">Товары</h2>
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" /> Добавить товар
        </Button>
      </div>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <OrderItemForm
            key={index}
            item={item}
            index={index}
            updateItem={updateItem}
            removeItem={removeItem}
            canRemove={items.length > 1}
          />
        ))}

        <div className="flex justify-end">
          <div className="text-right">
            <div className="text-muted-foreground">Итого:</div>
            <div className="text-xl font-bold">
              {new Intl.NumberFormat('ru-RU', { 
                style: 'currency', 
                currency: 'RUB', 
                maximumFractionDigits: 0 
              }).format(calculateTotal())}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderItemsSection;
