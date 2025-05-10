
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
import { 
  mockDailyMetrics, 
  mockSourceMetrics, 
  mockCustomerMetrics 
} from '@/lib/mockData';

export function Statistics() {
  const [period, setPeriod] = useState('week');
  const [metricType, setMetricType] = useState('orders');
  
  // Format data for charts
  const prepareTimeSeriesData = () => {
    let filteredData;
    
    // Filter by period
    switch (period) {
      case 'week':
        filteredData = mockDailyMetrics.slice(-7);
        break;
      case 'month':
        filteredData = mockDailyMetrics.slice(-30);
        break;
      case 'quarter':
        filteredData = mockDailyMetrics.slice(-90);
        break;
      default:
        filteredData = mockDailyMetrics;
    }
    
    // Format for chart
    return filteredData.map(day => ({
      date: day.date.substring(5), // Extract MM-DD format
      заказы: day.orders,
      выручка: Math.round(day.revenue / 1000) // Convert to thousands
    }));
  };

  // Source data for pie chart
  const sourceChartData = mockSourceMetrics.map(src => {
    const value = metricType === 'orders' ? src.orders : Math.round(src.revenue / 1000);
    return {
      name: src.source === 'website' ? 'Сайт' :
            src.source === 'phone' ? 'Телефон' :
            src.source === 'store' ? 'Магазин' :
            src.source === 'referral' ? 'Реферал' : 'Другое',
      value
    };
  });

  // Customer data for bar chart
  const customerChartData = mockCustomerMetrics.map(customer => {
    return {
      name: customer.customerName,
      value: metricType === 'orders' ? customer.orders : Math.round(customer.revenue / 1000)
    };
  });

  const timeSeriesData = prepareTimeSeriesData();

  return (
    <div className="space-y-6">
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
              {/* Mock statistics content */}
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Сегодня</span>
                </div>
                <div className="font-bold">5 заказов</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Вчера</span>
                </div>
                <div className="font-bold">3 заказа</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Неделю назад</span>
                </div>
                <div className="font-bold">18 заказов</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Прошлый месяц</span>
                </div>
                <div className="font-bold">82 заказа</div>
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
                <div className="font-bold">5 400 ₽</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Конверсия</span>
                </div>
                <div className="font-bold">2.8%</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Повторные заказы</span>
                </div>
                <div className="font-bold">42%</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Средний LTV</span>
                </div>
                <div className="font-bold">12 800 ₽</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Statistics;
