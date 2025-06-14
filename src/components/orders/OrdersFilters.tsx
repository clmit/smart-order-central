
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrdersFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

export const OrdersFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: OrdersFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск по имени, телефону или ID заказа..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Select
        value={statusFilter}
        onValueChange={setStatusFilter}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Статус заказа" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все статусы</SelectItem>
          <SelectItem value="new">Новые</SelectItem>
          <SelectItem value="processing">В обработке</SelectItem>
          <SelectItem value="completed">Завершенные</SelectItem>
          <SelectItem value="cancelled">Отмененные</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
