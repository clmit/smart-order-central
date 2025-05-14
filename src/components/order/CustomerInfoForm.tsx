
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderSource } from '@/types';

interface CustomerInfoFormProps {
  customerName: string;
  setCustomerName: (value: string) => void;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
  customerEmail: string;
  setCustomerEmail: (value: string) => void;
  customerAddress: string;
  setCustomerAddress: (value: string) => void;
  orderSource: OrderSource;
  setOrderSource: (value: OrderSource) => void;
}

export const CustomerInfoForm = ({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  customerAddress,
  setCustomerAddress,
  orderSource,
  setOrderSource,
}: CustomerInfoFormProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="customerName">Имя клиента *</Label>
        <Input 
          id="customerName" 
          value={customerName} 
          onChange={(e) => setCustomerName(e.target.value)} 
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerPhone">Телефон *</Label>
        <Input 
          id="customerPhone" 
          value={customerPhone} 
          onChange={(e) => setCustomerPhone(e.target.value)}
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerEmail">Email</Label>
        <Input 
          id="customerEmail" 
          type="email"
          value={customerEmail} 
          onChange={(e) => setCustomerEmail(e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerAddress">Адрес</Label>
        <Input 
          id="customerAddress" 
          value={customerAddress} 
          onChange={(e) => setCustomerAddress(e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="orderSource">Источник заказа</Label>
        <Select 
          value={orderSource} 
          onValueChange={(value) => setOrderSource(value as OrderSource)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="website">Сайт</SelectItem>
            <SelectItem value="phone">Телефон</SelectItem>
            <SelectItem value="store">Магазин</SelectItem>
            <SelectItem value="referral">Реферал</SelectItem>
            <SelectItem value="other">Другое</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CustomerInfoForm;
