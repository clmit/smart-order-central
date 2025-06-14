
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CustomerFilterProps {
  customerPhoneParam: string | null;
  setSearchTerm: (value: string) => void;
}

export const CustomerFilter = ({ customerPhoneParam, setSearchTerm }: CustomerFilterProps) => {
  const navigate = useNavigate();

  if (!customerPhoneParam) return null;

  return (
    <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
      <div>
        <p className="font-medium">Отображаются заказы клиента с номером: {decodeURIComponent(customerPhoneParam)}</p>
      </div>
      <Button variant="outline" onClick={() => {
        setSearchTerm('');
        navigate('/orders');
      }}>
        Отменить фильтр
      </Button>
    </div>
  );
};
