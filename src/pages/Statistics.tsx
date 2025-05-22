
import { useState, useEffect } from 'react';
import { BarChart2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChartCard from '@/components/charts/ChartCard';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getOrders } from '@/lib/api';
import { Order } from '@/types';

export function Statistics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [metricType, setMetricType] = useState('orders');
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [sourceChartData, setSourceChartData] = useState<any[]>([]);
  const [customerChartData, setCustomerChartData] = useState<any[]>([]);
  const [statistics, setStatistics] = useState({
    today: 0,
    yesterday: 0,
    lastWeek: 0,
    lastMonth: 0,
    avgOrderValue: 0,
    conversion: 2.8, // Примерное значение для конверсии
    repeatOrders: 0,
    avgLtv: 0
  });
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getOrders();
        setOrders(data);
        calculateMetrics(data, period, metricType);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  useEffect(() => {
    if (orders.length > 0) {
      calculateMetrics(orders, period, metricType);
    }
  }, [period, metricType, orders]);
  
  const calculateMetrics = (ordersData: Order[], selectedPeriod: string, selectedMetricType: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate time periods for filtering
    const getDateBefore = (days: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() - days);
      return date;
    };
    
    let startDate: Date;
    let daysToShow: number;
    
    // Set start date based on selected period
    switch (selectedPeriod) {
      case 'week':
        startDate = getDateBefore(7);
        daysToShow = 7;
        break;
      case 'month':
        startDate = getDateBefore(30);
        daysToShow = 30;
        break;
      case 'quarter':
        startDate = getDateBefore(90);
        daysToShow = 90;
        break;
      default:
        startDate = getDateBefore(7);
        daysToShow = 7;
    }
    
    // Calculate orders for statistics
    const todayOrders = ordersData.filter(o => new Date(o.date) >= today);
    const yesterdayOrders = ordersData.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= getDateBefore(1) && orderDate < today;
    });
    const lastWeekOrders = ordersData.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= getDateBefore(7);
    });
    const lastMonthOrders = ordersData.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= getDateBefore(30);
    });
    
    // Calculate summary statistics
    const totalRevenue = ordersData.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgOrderValue = ordersData.length ? Math.round(totalRevenue / ordersData.length) : 0;
    
    // Calculate repeat purchases
    const customerOrders: Record<string, number> = {};
    ordersData.forEach(order => {
      if (order.customerId) {
        customerOrders[order.customerId] = (customerOrders[order.customerId] || 0) + 1;
      }
    });
    
    const repeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    const repeatRate = ordersData.length > 0 
      ? Math.round((repeatCustomers / Object.keys(customerOrders).length) * 100) 
      : 0;
    
    // Calculate average LTV (Lifetime Value)
    const customerLTV: Record<string, number> = {};
    ordersData.forEach(order => {
      if (order.customerId) {
        customerLTV[order.customerId] = (customerLTV[order.customerId] || 0) + order.totalAmount;
      }
    });
    
    const avgLtv = Object.keys(customerLTV).length 
      ? Math.round(Object.values(customerLTV).reduce((sum, val) => sum + val, 0) / Object.keys(customerLTV).length) 
      : 0;
    
    setStatistics({
      today: todayOrders.length,
      yesterday: yesterdayOrders.length,
      lastWeek: lastWeekOrders.length,
      lastMonth: lastMonthOrders.length,
      avgOrderValue: avgOrderValue,
      conversion: 2.8, // Фиксированное значение, так как реальную конверсию сложно вычислить
      repeatOrders: repeatRate,
      avgLtv: avgLtv
    });
    
    // Generate time series data for selected period
    const days = Array.from({ length: daysToShow }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return date;
    });
    
    const timeSeriesDataCalculated = days.map(date => {
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayOrders = ordersData.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= dayStart && orderDate < dayEnd;
      });
      
      return {
        date: formattedDate,
        заказы: dayOrders.length,
        выручка: Math.round(dayOrders.reduce((sum, o) => sum + o.totalAmount, 0) / 1000) // в тысячах
      };
    });
    
    setTimeSeriesData(timeSeriesDataCalculated);
    
    // Calculate source distribution
    const sourceDistribution = ordersData.reduce((acc: Record<string, any>, order) => {
      const source = order.source;
      if (!acc[source]) {
        acc[source] = { orders: 0, revenue: 0 };
      }
      acc[source].orders += 1;
      acc[source].revenue += order.totalAmount;
      return acc;
    }, {});
    
    const sourceChartDataCalculated = Object.entries(sourceDistribution).map(([source, data]: [string, any]) => {
      const sourceName = source === 'website' ? 'Сайт' :
                         source === 'phone' ? 'Телефон' :
                         source === 'store' ? 'Магазин' :
                         source === 'referral' ? 'Реферал' : 'Другое';
      
      return {
        name: sourceName,
        value: selectedMetricType === 'orders' ? data.orders : Math.round(data.revenue / 1000)
      };
    });
    
    setSourceChartData(sourceChartDataCalculated);
    
    // Calculate customer data for bar chart
    const customerData = ordersData.reduce((acc: Record<string, any>, order) => {
      if (!order.customer) return acc;
      
      const customerId = order.customerId;
      if (!customerId) return acc;
      
      if (!acc[customerId]) {
        acc[customerId] = {
          name: order.customer.name,
          orders: 0,
          revenue: 0
        };
      }
      
      acc[customerId].orders += 1;
      acc[customerId].revenue += order.totalAmount;
      
      return acc;
    }, {});
    
    const customerChartDataCalculated = Object.values(customerData)
      .sort((a: any, b: any) => 
        selectedMetricType === 'orders' 
          ? b.orders - a.orders 
          : b.revenue - a.revenue
      )
      .slice(0, 10)
      .map((customer: any) => ({
        name: customer.name,
        value: selectedMetricType === 'orders' ? customer.orders : Math.round(customer.revenue / 1000)
      }));
    
    setCustomerChartData(customerChartDataCalculated);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Статистика</h1>
              <p className="text-muted-foreground">Аналитика заказов и продаж</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select value={metricType} onValueChange={setMetricType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Тип метрики" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orders">Заказы</SelectItem>
                  <SelectItem value="revenue">Выручка</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Неделя</SelectItem>
                  <SelectItem value="month">Месяц</SelectItem>
                  <SelectItem value="quarter">Квартал</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard 
              title={`${metricType === 'orders' ? 'Заказы' : 'Выручка'} по дням`}
              subtitle={period === 'week' ? 'За неделю' : period === 'month' ? 'За месяц' : 'За квартал'}
              type="line"
              data={timeSeriesData}
              dataKey="date"
              valueKey={metricType === 'orders' ? 'заказы' : 'выручка'}
              colors={[metricType === 'orders' ? '#0066CC' : '#00B77E']}
            />
            
            <ChartCard 
              title={`${metricType === 'orders' ? 'Заказы' : 'Выручка'} по источникам`}
              subtitle="Распределение по каналам"
              type="pie"
              data={sourceChartData}
              valueKey="value"
              nameKey="name"
            />
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {metricType === 'orders' ? 'Топ клиентов по количеству заказов' : 'Топ клиентов по сумме заказов'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartCard 
                title=""
                type="bar"
                data={customerChartData}
                dataKey="name"
                valueKey="value"
                colors={[metricType === 'orders' ? '#0066CC' : '#00B77E']}
              />
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Динамика заказов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Сегодня</span>
                    </div>
                    <div className="font-bold">{statistics.today} {getOrderText(statistics.today)}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Вчера</span>
                    </div>
                    <div className="font-bold">{statistics.yesterday} {getOrderText(statistics.yesterday)}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>За последнюю неделю</span>
                    </div>
                    <div className="font-bold">{statistics.lastWeek} {getOrderText(statistics.lastWeek)}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>За последний месяц</span>
                    </div>
                    <div className="font-bold">{statistics.lastMonth} {getOrderText(statistics.lastMonth)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Метрики</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <BarChart2 className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Средний чек</span>
                    </div>
                    <div className="font-bold">{formatCurrency(statistics.avgOrderValue)}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <BarChart2 className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Конверсия</span>
                    </div>
                    <div className="font-bold">{statistics.conversion}%</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <BarChart2 className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Повторные заказы</span>
                    </div>
                    <div className="font-bold">{statistics.repeatOrders}%</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <BarChart2 className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Средний LTV</span>
                    </div>
                    <div className="font-bold">{formatCurrency(statistics.avgLtv)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Функция для форматирования валюты
function formatCurrency(value: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
}

// Функция для получения правильного склонения слова "заказ"
function getOrderText(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'заказ';
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'заказа';
  } else {
    return 'заказов';
  }
}

export default Statistics;
