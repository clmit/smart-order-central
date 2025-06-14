
export interface StatisticsMetrics {
  today: number;
  yesterday: number;
  lastWeek: number;
  lastMonth: number;
  avgOrderValue: number;
  conversion: number;
  repeatOrders: number;
  avgLtv: number;
}

export interface TimeSeriesData {
  date: string;
  заказы: number;
  выручка: number;
}

export interface SourceData {
  name: string;
  value: number;
}

export interface CustomerData {
  name: string;
  value: number;
}

// Type for RPC function response
export interface OrdersStatisticsRPC {
  today_orders: number;
  yesterday_orders: number;
  week_orders: number;
  month_orders: number;
  avg_order_value: number;
  repeat_rate: number;
  avg_ltv: number;
}

// Новые типы для годовой и месячной статистики
export interface YearlyData {
  year: number;
  orders: number;
  revenue: number;
  avgCheck: number;
}

export interface MonthlyData {
  year: number;
  month: number;
  monthName: string;
  orders: number;
  revenue: number;
  avgCheck: number;
}
