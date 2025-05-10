
import { useEffect, useState } from 'react';
import { ChartBar, Calendar, Users, CreditCard } from 'lucide-react';
import MetricsCard from '@/components/charts/MetricsCard';
import ChartCard from '@/components/charts/ChartCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayMetrics, getYesterdayMetrics, getMonthlyMetrics, mockDailyMetrics, mockSourceMetrics, mockCustomerMetrics } from '@/lib/mockData';
import { getOrders } from '@/lib/api';
import { Order } from '@/types';

export function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
  }, []);
  
  const todayMetrics = getTodayMetrics();
  const yesterdayMetrics = getYesterdayMetrics();
  const monthlyMetrics = getMonthlyMetrics();
  
  // Calculate daily changes for metrics
  const orderChange = yesterdayMetrics.orders > 0 
    ? Math.round((todayMetrics.orders - yesterdayMetrics.orders) / yesterdayMetrics.orders * 100)
    : 0;
  
  const revenueChange = yesterdayMetrics.revenue > 0
    ? Math.round((todayMetrics.revenue - yesterdayMetrics.revenue) / yesterdayMetrics.revenue * 100)
    : 0;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
  };

  // Prepare chart data
  const last7DaysData = mockDailyMetrics.slice(-7).map(day => ({
    date: day.date.substring(5), // Extract MM-DD format
    Заказы: day.orders,
    Выручка: Math.round(day.revenue / 1000) // Convert to thousands
  }));

  const sourceData = mockSourceMetrics.map(src => ({
    source: src.source === 'website' ? 'Сайт' :
            src.source === 'phone' ? 'Телефон' :
            src.source === 'store' ? 'Магазин' :
            src.source === 'referral' ? 'Реферал' : 'Другое',
    Заказы: src.orders,
    Выручка: Math.round(src.revenue / 1000) // Convert to thousands
  }));
  
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
          value={todayMetrics.orders}
          icon={<ChartBar className="h-5 w-5" />}
          change={orderChange}
          compareText="по сравнению со вчера"
        />
        <MetricsCard
          title="Выручка сегодня"
          value={formatCurrency(todayMetrics.revenue)}
          icon={<CreditCard className="h-5 w-5" />}
          change={revenueChange}
          compareText="по сравнению со вчера"
        />
        <MetricsCard
          title="Заказы за месяц"
          value={monthlyMetrics.orders}
          icon={<Calendar className="h-5 w-5" />}
        />
        <MetricsCard
          title="Выручка за месяц"
          value={formatCurrency(monthlyMetrics.revenue)}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Заказы и выручка за неделю"
          subtitle="Последние 7 дней"
          type="bar"
          data={last7DaysData}
          dataKey="date"
        />
        <ChartCard
          title="Заказы по источникам"
          subtitle="Распределение по каналам"
          type="pie"
          data={sourceData}
          valueKey="Заказы"
          nameKey="source"
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
            <div className="space-y-4">
              {mockCustomerMetrics.map((customer) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
