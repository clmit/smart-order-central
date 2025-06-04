
export type Customer = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
};

export type OrderItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  photoUrl?: string;
};

export type OrderSource = 'website' | 'phone' | 'store' | 'referral' | 'other';

export type Order = {
  id: string;
  customerId: string;
  customer?: Customer;
  date: string;
  source: OrderSource;
  items: OrderItem[];
  status: 'new' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  orderNumber?: number;
};

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

export interface ExternalOrderData {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerEmail?: string;
  source?: OrderSource;
  date?: string; // Новое поле для даты заказа
  items: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    photoUrl?: string;
  }[];
}
