
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
  getBasicStatistics,
  getTimeSeriesData,
  getSourceData,
  getTopCustomersData,
  StatisticsMetrics,
  TimeSeriesData,
  SourceData,
  CustomerData
} from '@/lib/statisticsApi';

export function Statistics() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [metricType, setMetricType] = useState('orders');
  
  const [statistics, setStatistics] = useState<StatisticsMetrics>({
    today: 0,
    yesterday: 0,
    lastWeek: 0,
    lastMonth: 0,
    avgOrderValue: 0,
    conversion: 2.8,
    repeatOrders: 0,
    avgLtv: 0
  });
  
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [sourceChartData, setSourceChartData] = useState<SourceData[]>([]);
  const [customerChartData, setCustomerChartData] = useState<CustomerData[]>([]);
  
  // Загружаем базовую статистику отдельно от графиков
  useEffect(() => {
    const loadBasicStats = async () => {
      console.log('Loading basic statistics...');
      const stats = await getBasicStatistics();
      if (stats) {
        setStatistics(stats);
      }
    };
    
    loadBasicStats();
  }, []);
  
  // Загружаем данные для графиков отдельно
  useEffect(() => {
    const loadChartData = async () => {
      setIsLoading(true);
      console.log('Loading chart data...');
      
      try {
        // Загружаем данные параллельно для лучшей производительности
        const [timeData, sourceData, customerData] = await Promise.all([
          getTimeSeriesData(period, metricType),
          getSourceData(metricType),
          getTopCustomersData(metricType)
        ]);
        
        setTimeSeriesData(timeData);
        setSourceChartData(sourceData);
        setCustomerChartData(customerData);
      } catch (error) {
        console.error('Error loading chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChartData();
  }, [period, metricType]);

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
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <>
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
