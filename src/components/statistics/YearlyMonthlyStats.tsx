
import { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  getYearlyData,
  getMonthlyData,
  YearlyData,
  MonthlyData
} from '@/lib/statistics';

export function YearlyMonthlyStats() {
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<Record<number, MonthlyData[]>>({});
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await getYearlyData();
        setYearlyData(data);
      } catch (error) {
        console.error('Error loading yearly data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleYear = async (year: number) => {
    const newExpanded = new Set(expandedYears);
    
    if (expandedYears.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
      
      // Загружаем месячные данные если их еще нет
      if (!monthlyData[year]) {
        try {
          const monthly = await getMonthlyData(year);
          setMonthlyData(prev => ({ ...prev, [year]: monthly }));
        } catch (error) {
          console.error('Error loading monthly data:', error);
        }
      }
    }
    
    setExpandedYears(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Статистика по годам и месяцам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p>Загрузка данных...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Статистика по годам и месяцам
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Период</TableHead>
              <TableHead className="text-right">Заказы</TableHead>
              <TableHead className="text-right">Выручка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {yearlyData.map((yearData) => (
              <>
                <TableRow key={yearData.year} className="font-medium">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => toggleYear(yearData.year)}
                    >
                      {expandedYears.has(yearData.year) ? (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-1" />
                      )}
                      {yearData.year} год
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    {yearData.orders}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(yearData.revenue)}
                  </TableCell>
                </TableRow>
                
                {expandedYears.has(yearData.year) && monthlyData[yearData.year] && (
                  monthlyData[yearData.year].map((monthData) => (
                    <TableRow key={`${yearData.year}-${monthData.month}`} className="bg-muted/30">
                      <TableCell className="pl-8">
                        {monthData.monthName}
                      </TableCell>
                      <TableCell className="text-right">
                        {monthData.orders}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(monthData.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </>
            ))}
          </TableBody>
        </Table>
        
        {yearlyData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Нет данных для отображения
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default YearlyMonthlyStats;
