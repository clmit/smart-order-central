
import { useEffect, useState } from 'react';
import { ChartBar, Calendar, Users, CreditCard, TrendingUp, Target } from 'lucide-react';
import MetricsCard from '@/components/charts/MetricsCard';
import ChartCard from '@/components/charts/ChartCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getTimeSeriesData, getSourceData } from '@/lib/statistics';
import { Order } from '@/types';

export function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    today: { orders: 0, revenue: 0 },
    yesterday: { orders: 0, revenue: 0 },
    month: { orders: 0, revenue: 0 },
    year: { orders: 0, revenue: 0 },
    allTime: { orders: 0, revenue: 0 }
  });
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [sourceMetrics, setSourceMetrics] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  
  // Функция для получения всех заказов через пагинацию
  const getAllOrdersForDashboard = async () => {
    let allOrders: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_id,
          date,
          source,
          status,
          total_amount,
          order_number,
          customers (
            id,
            name,
            phone,
            address,
            email,
            created_at,
            total_orders,
            total_spent
          ),
          order_items (
            id,
            name,
            description,
            price,
            quantity,
            photo_url
          )
        `)
        .order('date', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;
      
      if (!orders || orders.length === 0) break;
      
      allOrders = [...allOrders, ...orders];
      
      // Если получили меньше записей чем размер страницы, значит это последняя страница
      if (orders.length < pageSize) break;
      
      page++;
    }
    
    console.log(`Fetched ${allOrders.length} orders for dashboard through pagination`);
    
    // Преобразуем данные в нужный формат
    return allOrders.map(order => ({
      id: order.id,
      customerId: order.customer_id,
      customer: order.customers ? {
        id: order.customers.id,
        name: order.customers.name,
        phone: order.customers.phone,
        address: order.customers.address,
        email: order.customers.email || undefined,
        createdAt: order.customers.created_at,
        totalOrders: order.customers.total_orders,
        totalSpent: Number(order.customers.total_spent)
      } : undefined,
      date: order.date,
      source: order.source as any,
      items: order.order_items?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || undefined,
        price: Number(item.price),
        quantity: item.quantity,
        photoUrl: item.photo_url || undefined
      })) || [],
      status: order.status as any,
      totalAmount: Number(order.total_amount),
      orderNumber: order.order_number
    }));
  };
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем данные параллельно для лучшей производительности
        const [ordersData, weeklyData, sourcesData] = await Promise.all([
          getAllOrdersForDashboard(),
          getTimeSeriesData('week', 'orders'),
          getSourceData('orders')
        ]);
        
        setOrders(ordersData);
        calculateMetrics(ordersData);
        
        // Используем оптимизированные данные для графиков
        setDailyMetrics(weeklyData);
        setSourceMetrics(sourcesData);
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const calculateMetrics = (ordersData: Order[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    const todayOrders = ordersData.filter(o => new Date(o.date) >= today);
    const yesterdayOrders = ordersData.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= yesterday && orderDate < today;
    });
    const monthOrders = ordersData.filter(o => new Date(o.date) >= monthStart);
    const yearOrders = ordersData.filter(o => new Date(o.date) >= yearStart);
    
    const todayMetrics = {
      orders: todayOrders.length,
      revenue: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
    
    const yesterdayMetrics = {
      orders: yesterdayOrders.length,
      revenue: yesterdayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
    
    const monthlyMetrics = {
      orders: monthOrders.length,
      revenue: monthOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
    
    const yearlyMetrics = {
      orders: yearOrders.length,
      revenue: yearOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
    
    // Правильные общие показатели - теперь используем ВСЕ заказы
    const allTimeMetrics = {
      orders: ordersData.length,
      revenue: ordersData.reduce((sum, o) => sum + o.totalAmount, 0)
    };
    
    setMetrics({
      today: todayMetrics,
      yesterday: yesterdayMetrics,
      month: monthlyMetrics,
      year: yearlyMetrics,
      allTime: allTimeMetrics
    });
    
    // Calculate daily metrics for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });
    
    const dailyData = last7Days.map(date => {
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayOrders = ordersData.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= dayStart && orderDate < dayEnd;
      });
      
      return {
        date: formattedDate,
        Заказы: dayOrders.length,
        Выручка: Math.round(dayOrders.reduce((sum, o) => sum + o.totalAmount, 0) / 1000)
      };
    });
    
    setDailyMetrics(dailyData);
    
    // Calculate orders by source
    const ordersBySources = ordersData.reduce((acc: any, order) => {
      const source = order.source;
      if (!acc[source]) {
        acc[source] = { orders: 0, revenue: 0 };
      }
      acc[source].orders += 1;
      acc[source].revenue += order.totalAmount;
      return acc;
    }, {});
    
    const sourceData = Object.entries(ordersBySources).map(([source, data]: [string, any]) => ({
      source: source === 'website' ? 'Сайт' :
              source === 'phone' ? 'Телефон' :
              source === 'store' ? 'Магазин' :
              source === 'referral' ? 'Реферал' : 'Другое',
      Заказы: data.orders,
      Выручка: Math.round(data.revenue / 1000)
    }));
    
    setSourceMetrics(sourceData);
    
    // Get top customers
    const customerOrders = ordersData.reduce((acc: Record<string, any>, order) => {
      if (!order.customer) return acc;
      
      const customerId = order.customer.id;
      if (!customerId) return acc;
      
      if (!acc[customerId]) {
        acc[customerId] = { 
          customerId, 
          customerName: order.customer.name, 
          orders: 0, 
          revenue: 0 
        };
      }
      acc[customerId].orders += 1;
      acc[customerId].revenue += order.totalAmount;
      return acc;
    }, {});
    
    const topCustomersData = Object.values(customerOrders)
      .sort((a: any, b: any) => b.orders - a.orders)
      .slice(0, 5);
    
    setTopCustomers(topCustomersData);
  };
  
  // Calculate changes for metrics
  const orderChange = metrics.yesterday.orders > 0
    ? Math.round((metrics.today.orders - metrics.yesterday.orders) / metrics.yesterday.orders * 100)
    : 0;
  
  const revenueChange = metrics.yesterday.revenue > 0
    ? Math.round((metrics.today.revenue - metrics.yesterday.revenue) / metrics.yesterday.revenue * 100)
    : 0;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
  };

  // Recent orders for the dashboard
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Заказы сегодня"
          value={metrics.today.orders}
          icon={<ChartBar className="h-5 w-5" />}
          change={orderChange}
          compareText="по сравнению со вчера"
        />
        <MetricsCard
          title="Выручка сегодня"
          value={formatCurrency(metrics.today.revenue)}
          icon={<CreditCard className="h-5 w-5" />}
          change={revenueChange}
          compareText="по сравнению со вчера"
        />
        <MetricsCard
          title="Заказы за месяц"
          value={metrics.month.orders}
          icon={<Calendar className="h-5 w-5" />}
        />
        <MetricsCard
          title="Выручка за месяц"
          value={formatCurrency(metrics.month.revenue)}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Заказы за год"
          value={metrics.year.orders}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricsCard
          title="Выручка за год"
          value={formatCurrency(metrics.year.revenue)}
          icon={<Target className="h-5 w-5" />}
        />
        <MetricsCard
          title="Заказы за все время"
          value={metrics.allTime.orders}
          icon={<ChartBar className="h-5 w-5" />}
        />
        <MetricsCard
          title="Выручка за все время"
          value={formatCurrency(metrics.allTime.revenue)}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Заказы и выручка за неделю"
          subtitle="Последние 7 дней"
          type="bar"
          data={dailyMetrics}
          dataKey="date"
        />
        <ChartCard
          title="Заказы по источникам"
          subtitle="Распределение по каналам"
          type="pie"
          data={sourceMetrics}
          valueKey="value"
          nameKey="name"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Недавние заказы</CardTitle>
            <CardDescription>Последние 5 заказов</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Загрузка данных...</p>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{order.customer?.name || 'Клиент не указан'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.date).toLocaleDateString('ru-RU')} · {order.items.length} поз.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                          order.status === 'completed'
                            ? 'bg-crm-green-light text-crm-green'
                            : order.status === 'processing'
                            ? 'bg-crm-blue-light text-crm-blue'
                            : order.status === 'cancelled'
                            ? 'bg-crm-red-light text-crm-red'
                            : 'bg-crm-gray-light text-crm-gray-dark'
                        }`}
                      >
                        {order.status === 'new' ? 'Новый' : 
                         order.status === 'processing' ? 'В обработке' :
                         order.status === 'completed' ? 'Завершен' : 'Отменен'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Нет данных о заказах</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Лучшие клиенты</CardTitle>
            <CardDescription>По количеству заказов</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Загрузка данных...</p>
            ) : topCustomers.length > 0 ? (
              <div className="space-y-4">
                {topCustomers.map((customer) => (
                  <div key={customer.customerId} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{customer.customerName}</p>
                      <p className="text-sm text-muted-foreground">{customer.orders} заказов</p>
                    </div>
                    <div>
                      <p className="font-medium">{formatCurrency(customer.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Нет данных о клиентах</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
