
import { Customer, Order, OrderItem, DailyMetric, SourceMetric, CustomerMetric } from '../types';

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Иван Петров',
    phone: '+7 (921) 123-4567',
    address: 'г. Москва, ул. Тверская, д. 1, кв. 10',
    email: 'ivan@example.com',
    createdAt: '2023-01-15T12:00:00Z',
    totalOrders: 5,
    totalSpent: 25000
  },
  {
    id: '2',
    name: 'Елена Смирнова',
    phone: '+7 (905) 987-6543',
    address: 'г. Санкт-Петербург, Невский пр., д. 78, кв. 42',
    createdAt: '2023-02-20T14:30:00Z',
    totalOrders: 3,
    totalSpent: 12000
  },
  {
    id: '3',
    name: 'Алексей Иванов',
    phone: '+7 (916) 555-1234',
    address: 'г. Казань, ул. Баумана, д. 14, кв. 27',
    email: 'alexey@example.com',
    createdAt: '2023-03-10T09:15:00Z',
    totalOrders: 7,
    totalSpent: 35000
  },
  {
    id: '4',
    name: 'Мария Кузнецова',
    phone: '+7 (903) 777-8888',
    address: 'г. Новосибирск, ул. Ленина, д. 5, кв. 15',
    createdAt: '2023-04-05T16:45:00Z',
    totalOrders: 2,
    totalSpent: 8000
  }
];

export const mockOrderItems: Record<string, OrderItem[]> = {
  '1': [
    {
      id: '101',
      name: 'Смартфон XPhone 13',
      description: 'Последняя модель, 128GB',
      price: 79990,
      quantity: 1,
      photoUrl: 'https://via.placeholder.com/150'
    },
    {
      id: '102',
      name: 'Защитное стекло',
      description: 'Закаленное стекло с олеофобным покрытием',
      price: 1990,
      quantity: 1
    }
  ],
  '2': [
    {
      id: '201',
      name: 'Ноутбук ProBook',
      description: 'i7, 16GB RAM, 512GB SSD',
      price: 89990,
      quantity: 1,
      photoUrl: 'https://via.placeholder.com/150'
    }
  ],
  '3': [
    {
      id: '301',
      name: 'Беспроводные наушники SoundPlus',
      price: 12990,
      quantity: 1,
      photoUrl: 'https://via.placeholder.com/150'
    },
    {
      id: '302',
      name: 'Чехол для наушников',
      price: 990,
      quantity: 1
    }
  ],
  '4': [
    {
      id: '401',
      name: 'Умные часы FitTrack',
      description: 'С измерением пульса и давления',
      price: 15990,
      quantity: 1,
      photoUrl: 'https://via.placeholder.com/150'
    }
  ],
  '5': [
    {
      id: '501',
      name: 'Кофемашина BaristaPro',
      description: 'Автоматическая, с капучинатором',
      price: 45990,
      quantity: 1,
      photoUrl: 'https://via.placeholder.com/150'
    }
  ],
};

export const mockOrders: Order[] = [
  {
    id: '1',
    customerId: '1',
    date: '2023-05-10T10:20:00Z',
    source: 'website',
    items: mockOrderItems['1'],
    status: 'completed',
    totalAmount: 81980
  },
  {
    id: '2',
    customerId: '2',
    date: '2023-05-11T14:15:00Z',
    source: 'phone',
    items: mockOrderItems['2'],
    status: 'completed',
    totalAmount: 89990
  },
  {
    id: '3',
    customerId: '3',
    date: '2023-05-12T11:30:00Z',
    source: 'store',
    items: mockOrderItems['3'],
    status: 'processing',
    totalAmount: 13980
  },
  {
    id: '4',
    customerId: '1',
    date: '2023-05-12T16:45:00Z',
    source: 'website',
    items: mockOrderItems['4'],
    status: 'processing',
    totalAmount: 15990
  },
  {
    id: '5',
    customerId: '4',
    date: new Date().toISOString(),
    source: 'referral',
    items: mockOrderItems['5'],
    status: 'new',
    totalAmount: 45990
  }
];

// Generate daily metrics for the past 30 days
export const generateDailyMetrics = (): DailyMetric[] => {
  const metrics: DailyMetric[] = [];
  const today = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Generate random data with some patterns
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseOrders = isWeekend ? 15 : 10;
    const orders = Math.floor(baseOrders + Math.random() * 10);
    const avgOrderValue = 5000 + Math.random() * 3000;
    const revenue = Math.floor(orders * avgOrderValue);
    
    metrics.push({
      date: date.toISOString().split('T')[0],
      orders,
      revenue
    });
  }
  
  return metrics;
};

export const mockDailyMetrics = generateDailyMetrics();

// Source metrics
export const mockSourceMetrics: SourceMetric[] = [
  { source: 'website', orders: 120, revenue: 640000 },
  { source: 'phone', orders: 85, revenue: 480000 },
  { source: 'store', orders: 65, revenue: 390000 },
  { source: 'referral', orders: 40, revenue: 220000 },
  { source: 'other', orders: 25, revenue: 130000 }
];

// Top customer metrics
export const mockCustomerMetrics: CustomerMetric[] = [
  { customerId: '3', customerName: 'Алексей Иванов', orders: 7, revenue: 35000 },
  { customerId: '1', customerName: 'Иван Петров', orders: 5, revenue: 25000 },
  { customerId: '2', customerName: 'Елена Смирнова', orders: 3, revenue: 12000 },
  { customerId: '4', customerName: 'Мария Кузнецова', orders: 2, revenue: 8000 }
];

// Helper function to get today's metrics
export const getTodayMetrics = () => {
  const todayOrders = mockOrders.filter(
    order => new Date(order.date).toDateString() === new Date().toDateString()
  );
  
  return {
    orders: todayOrders.length,
    revenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  };
};

// Helper function to get yesterday's metrics
export const getYesterdayMetrics = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const yesterdayOrders = mockOrders.filter(
    order => new Date(order.date).toDateString() === yesterday.toDateString()
  );
  
  return {
    orders: yesterdayOrders.length,
    revenue: yesterdayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  };
};

// Helper function to get monthly metrics
export const getMonthlyMetrics = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const monthlyOrders = mockOrders.filter(
    order => new Date(order.date) >= firstDayOfMonth && new Date(order.date) <= today
  );
  
  return {
    orders: monthlyOrders.length,
    revenue: monthlyOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  };
};

export const getOrdersWithCustomers = () => {
  return mockOrders.map(order => ({
    ...order,
    customer: mockCustomers.find(customer => customer.id === order.customerId)
  }));
};
