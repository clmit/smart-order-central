import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, Users, ArrowRight } from 'lucide-react';
import { DuplicateGroup, findDuplicateCustomers, executeDuplication } from '@/lib/api/customerDeduplication';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerDeduplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function CustomerDeduplicationDialog({ 
  open, 
  onOpenChange, 
  onComplete 
}: CustomerDeduplicationDialogProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [step, setStep] = useState<'initial' | 'preview' | 'completed'>('initial');

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const groups = await findDuplicateCustomers();
      setDuplicateGroups(groups);
      setStep(groups.length > 0 ? 'preview' : 'completed');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось проанализировать клиентов',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      await executeDuplication(duplicateGroups);
      setStep('completed');
      toast({
        title: 'Успех',
        description: `Обработано ${duplicateGroups.length} групп дубликатов`,
      });
      onComplete?.();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить дедупликацию',
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleClose = () => {
    setStep('initial');
    setDuplicateGroups([]);
    onOpenChange(false);
  };

  const formatPhone = (phone: string) => {
    return phone.length > 15 ? phone.substring(0, 15) + '...' : phone;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Дедупликация клиентов
          </DialogTitle>
          <DialogDescription>
            Поиск и объединение клиентов с одинаковыми номерами телефонов в разных форматах
          </DialogDescription>
        </DialogHeader>

        {step === 'initial' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Функция найдет клиентов с одинаковыми номерами телефонов (например, "8900..." и "+7 900..."), 
              объединит их данные в одну запись и удалит дубликаты.
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <strong>Внимание:</strong> Операция необратима. Сначала будет показан предварительный просмотр изменений.
                </div>
              </div>
            </div>

            {loading && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
          </div>
        )}

        {step === 'preview' && duplicateGroups.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Найдено дубликатов: {duplicateGroups.length} групп</h3>
                <p className="text-sm text-muted-foreground">
                  Предварительный просмотр изменений
                </p>
              </div>
              <Badge variant="outline">
                {duplicateGroups.reduce((sum, group) => sum + group.duplicateCustomers.length, 0)} клиентов будет удалено
              </Badge>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {duplicateGroups.map((group, index) => (
                <Card key={index} className="border-amber-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Группа {index + 1}: {group.normalizedPhone}
                    </CardTitle>
                    <CardDescription>
                      {group.customers.length} клиентов с одинаковыми номерами
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Основной клиент */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">Основной клиент</Badge>
                        <span className="text-sm text-muted-foreground">
                          (старейший, создан {new Date(group.primaryCustomer.createdAt).toLocaleDateString()})
                        </span>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="font-medium">{group.primaryCustomer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatPhone(group.primaryCustomer.phone)}
                          {group.primaryCustomer.address && ` • ${group.primaryCustomer.address}`}
                          {group.primaryCustomer.email && ` • ${group.primaryCustomer.email}`}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Заказов: {group.primaryCustomer.totalOrders}, Сумма: {group.primaryCustomer.totalSpent}₽
                        </div>
                      </div>
                    </div>

                    {/* Предлагаемые изменения */}
                    {Object.keys(group.proposedChanges.primaryCustomerUpdates).length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Будет обновлено:</div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm space-y-1">
                          {group.proposedChanges.primaryCustomerUpdates.address && (
                            <div>• Адрес: {group.proposedChanges.primaryCustomerUpdates.address}</div>
                          )}
                          {group.proposedChanges.primaryCustomerUpdates.email && (
                            <div>• Email: {group.proposedChanges.primaryCustomerUpdates.email}</div>
                          )}
                          {group.proposedChanges.primaryCustomerUpdates.totalOrders && (
                            <div>• Заказов: {group.primaryCustomer.totalOrders} → {group.proposedChanges.primaryCustomerUpdates.totalOrders}</div>
                          )}
                          {group.proposedChanges.primaryCustomerUpdates.totalSpent && (
                            <div>• Сумма: {group.primaryCustomer.totalSpent}₽ → {group.proposedChanges.primaryCustomerUpdates.totalSpent}₽</div>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Дубликаты */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive">Дубликаты (будут удалены)</Badge>
                      </div>
                      <div className="space-y-2">
                        {group.duplicateCustomers.map((customer, customerIndex) => (
                          <div key={customerIndex} className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatPhone(customer.phone)}
                              {customer.address && ` • ${customer.address}`}
                              {customer.email && ` • ${customer.email}`}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Заказов: {customer.totalOrders}, Сумма: {customer.totalSpent}₽
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 'completed' && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="font-medium">
                {duplicateGroups.length > 0 ? 'Дедупликация завершена!' : 'Дубликаты не найдены'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {duplicateGroups.length > 0 
                  ? `Обработано ${duplicateGroups.length} групп дубликатов`
                  : 'В базе данных нет клиентов с дублирующимися номерами телефонов'
                }
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'initial' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Отмена
              </Button>
              <Button onClick={handleAnalyze} disabled={loading}>
                {loading ? 'Анализ...' : 'Найти дубликаты'}
              </Button>
            </>
          )}
          
          {step === 'preview' && duplicateGroups.length > 0 && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Отмена
              </Button>
              <Button onClick={handleExecute} disabled={executing}>
                {executing ? 'Выполнение...' : 'Выполнить дедупликацию'}
              </Button>
            </>
          )}
          
          {step === 'completed' && (
            <Button onClick={handleClose}>
              Закрыть
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}