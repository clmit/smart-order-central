
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  photoUrl?: string;
}

export type OrderSource = 'website' | 'phone' | 'store' | 'referral' | 'other';

export interface Order {
  id: string;
  customerId: string;
  customer?: Customer;
  date: string;
  source: OrderSource;
  items: OrderItem[];
  status: 'new' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
}

export interface DailyMetric {
  date: string;
  orders: number;
  revenue: number;
}

export interface SourceMetric {
  source: OrderSource;
  orders: number;
  revenue: number;
}

export interface CustomerMetric {
  customerId: string;
  customerName: string;
  orders: number;
  revenue: number;
}
