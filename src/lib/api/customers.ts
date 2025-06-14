
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types';
import { toast } from '@/hooks/use-toast';
import { getAllRecordsPaginated } from './utils';

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const data = await getAllRecordsPaginated<any>('customers');
    
    return data.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      email: customer.email || undefined,
      createdAt: customer.created_at,
      totalOrders: customer.total_orders,
      totalSpent: Number(customer.total_spent)
    }));
  } catch (error) {
    console.error('Error fetching customers:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось загрузить список клиентов',
      variant: 'destructive',
    });
    return [];
  }
};

export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return undefined;
    
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      address: data.address,
      email: data.email || undefined,
      createdAt: data.created_at,
      totalOrders: data.total_orders,
      totalSpent: Number(data.total_spent)
    };
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    return undefined;
  }
};

export const getCustomerByPhone = async (phone: string): Promise<Customer | undefined> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return undefined;
    
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      address: data.address,
      email: data.email || undefined,
      createdAt: data.created_at,
      totalOrders: data.total_orders,
      totalSpent: Number(data.total_spent)
    };
  } catch (error) {
    console.error('Error fetching customer by phone:', error);
    return undefined;
  }
};

export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpent'>): Promise<Customer> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        email: customerData.email
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      address: data.address,
      email: data.email || undefined,
      createdAt: data.created_at,
      totalOrders: data.total_orders,
      totalSpent: Number(data.total_spent)
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось создать клиента',
      variant: 'destructive',
    });
    throw error;
  }
};

export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer | undefined> => {
  try {
    const updateData: any = {};
    if (customerData.name) updateData.name = customerData.name;
    if (customerData.phone) updateData.phone = customerData.phone;
    if (customerData.address) updateData.address = customerData.address;
    if (customerData.email !== undefined) updateData.email = customerData.email;
    if (customerData.totalOrders !== undefined) updateData.total_orders = customerData.totalOrders;
    if (customerData.totalSpent !== undefined) updateData.total_spent = customerData.totalSpent;
    
    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      address: data.address,
      email: data.email || undefined,
      createdAt: data.created_at,
      totalOrders: data.total_orders,
      totalSpent: Number(data.total_spent)
    };
  } catch (error) {
    console.error('Error updating customer:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось обновить данные клиента',
      variant: 'destructive',
    });
    return undefined;
  }
};
