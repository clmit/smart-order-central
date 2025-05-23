
import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Customer } from '@/types';
import { updateCustomer } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface CustomerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCustomer: Customer | null;
  onCustomerUpdated: (updatedCustomer: Customer) => void;
}

export function CustomerEditDialog({ 
  open, 
  onOpenChange, 
  currentCustomer, 
  onCustomerUpdated 
}: CustomerEditDialogProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      email: '',
    },
  });

  // Reset form when customer changes
  React.useEffect(() => {
    if (currentCustomer) {
      form.reset({
        name: currentCustomer.name,
        phone: currentCustomer.phone,
        address: currentCustomer.address || '',
        email: currentCustomer.email || '',
      });
    }
  }, [currentCustomer, form]);

  const onSubmit = async (data: { name: string; phone: string; address: string; email: string }) => {
    if (!currentCustomer) return;
    
    try {
      const updatedCustomer = await updateCustomer(currentCustomer.id, {
        ...data,
      });
      
      if (updatedCustomer) {
        onCustomerUpdated(updatedCustomer);
        
        toast({
          title: 'Успех',
          description: 'Данные клиента успешно обновлены',
        });
        
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить данные клиента',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактирование клиента</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Адрес</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                type="button"
              >
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
