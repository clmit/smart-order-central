
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  change?: number;
  compareText?: string;
}

export function MetricsCard({
  title,
  value,
  subtitle,
  icon,
  change,
  compareText
}: MetricsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-5 w-5 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(subtitle || change !== undefined) && (
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            {change !== undefined && (
              <span
                className={cn(
                  "flex items-center mr-1",
                  isPositive && "text-crm-green",
                  isNegative && "text-crm-red"
                )}
              >
                {isPositive ? <ArrowUp className="h-4 w-4 mr-1" /> : isNegative ? <ArrowDown className="h-4 w-4 mr-1" /> : null}
                {Math.abs(change)}%
              </span>
            )}
            {subtitle && <span>{compareText || subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MetricsCard;
