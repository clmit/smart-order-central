
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem, Customer } from '@/types';
import { toast } from '@/hooks/use-toast';
import { getAllRecordsPaginated, processBatches } from './utils';
import { getCustomerById, getCustomerByPhone, createCustomer, updateCustomer } from './customers';

const getAllOrdersPaginated = async (): Promise<Order[]> => {
  try {
    console.log('Starting to fetch ALL orders with pagination...');
    
    const allOrders = await getAllRecordsPaginated<any>('orders', '*', { column: 'date', ascending: false });
    
    if (allOrders.length === 0) {
      console.log('No orders found, returning empty array');
      return [];
    }
    
    // Get all customers for these orders through pagination
    const customerIds = [...new Set(allOrders.map(order => order.customer_id))];
    console.log('Unique customer IDs:', customerIds.length);
    
    let customersData = [];
    if (customerIds.length > 0) {
      customersData = await processBatches(
        customerIds,
        100,
        async (batch) => {
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .in('id', batch);
          
          if (error) {
            console.error('Customers query error details:', error);
            throw error;
          }
          return data || [];
        }
      );
      console.log('Customers fetched:', customersData.length);
    }
    
    const customersMap = customersData.reduce((acc, customer) => {
      acc[customer.id] = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email || undefined,
        createdAt: customer.created_at,
        totalOrders: customer.total_orders,
        totalSpent: Number(customer.total_spent)
      };
      return acc;
    }, {} as Record<string, Customer>);
    
    // Get all order_items through pagination
    const orderIds = allOrders.map(order => order.id);
    console.log('Order IDs for items lookup:', orderIds.length);
    
    let itemsData = [];
    if (orderIds.length > 0) {
      itemsData = await processBatches(
        orderIds,
        50,
        async (batch) => {
          const { data, error } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', batch);
          
          if (error) {
            console.error('Order items query error details:', error);
            throw error;
          }
          return data || [];
        }
      );
      console.log('Order items fetched:', itemsData.length);
    }
    
    // Group items by order_id
    const itemsByOrder = itemsData.reduce((acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = [];
      }
      acc[item.order_id].push({
        id: item.id,
        name: item.name,
        description: item.description || undefined,
        price: Number(item.price),
        quantity: item.quantity,
        photoUrl: item.photo_url || undefined
      });
      return acc;
    }, {} as Record<string, OrderItem[]>);
    
    // Assemble final orders
    const finalOrders = allOrders.map(order => ({
      id: order.id,
      customerId: order.customer_id,
      customer: customersMap[order.customer_id],
      date: order.date,
      source: order.source as any,
      items: itemsByOrder[order.id] || [],
      status: order.status as any,
      totalAmount: Number(order.total_amount),
      orderNumber: order.order_number
    }));
    
    console.log('Successfully processed all orders:', finalOrders.length);
    return finalOrders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось загрузить заказы',
      variant: 'destructive',
    });
    return [];
  }
};

export const getOrders = async (): Promise<Order[]> => {
  return getAllOrdersPaginated();
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
  try {
    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (orderError) throw orderError;
    if (!order) return undefined;
    
    // Get the customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', order.customer_id)
      .maybeSingle();
    
    if (customerError) throw customerError;
    
    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);
    
    if (itemsError) throw itemsError;
    
    const orderItems = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      price: Number(item.price),
      quantity: item.quantity,
      photoUrl: item.photo_url || undefined
    }));
    
    return {
      id: order.id,
      customerId: order.customer_id,
      customer: customer ? {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email || undefined,
        createdAt: customer.created_at,
        totalOrders: customer.total_orders,
        totalSpent: Number(customer.total_spent)
      } : undefined,
      date: order.date,
      source: order.source as any,
      items: orderItems,
      status: order.status as any,
      totalAmount: Number(order.total_amount),
      orderNumber: order.order_number
    };
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return undefined;
  }
};

export const createOrder = async (orderData: Omit<Order, 'id'>): Promise<Order> => {
  try {
    // Check for customer information
    let customerId = orderData.customerId;
    let customer;
    
    // Don't try to fetch customer with an empty ID
    if (customerId && customerId.trim() !== '') {
      customer = await getCustomerById(customerId);
    }
    
    // If no valid customer ID or customer not found, check by phone
    if (!customer && orderData.customer) {
      // Check if a customer with the same phone exists
      const existingCustomer = await getCustomerByPhone(orderData.customer.phone);
      
      if (existingCustomer) {
        // Use existing customer
        customerId = existingCustomer.id;
        customer = existingCustomer;
      } else {
        // Create a new customer
        const newCustomer = await createCustomer({
          name: orderData.customer.name,
          phone: orderData.customer.phone,
          address: orderData.customer.address || '',
          email: orderData.customer.email
        });
        customerId = newCustomer.id;
        customer = newCustomer;
      }
    }
    
    if (!customerId) {
      throw new Error('Не удалось определить ID клиента');
    }
    
    // Calculate total amount
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    
    // Use provided date or current date
    const orderDate = orderData.date || new Date().toISOString();
    
    // Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        date: orderDate,
        source: orderData.source || 'other',
        status: orderData.status || 'new',
        total_amount: totalAmount
      })
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    // Add order items
    const orderItems = orderData.items.map(item => ({
      order_id: newOrder.id,
      name: item.name,
      description: item.description || null,
      price: item.price,
      quantity: item.quantity,
      photo_url: item.photoUrl || null
    }));
    
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();
    
    if (itemsError) throw itemsError;
    
    // Update customer metrics
    if (customer) {
      await updateCustomer(customer.id, {
        totalOrders: (customer.totalOrders || 0) + 1,
        totalSpent: (customer.totalSpent || 0) + totalAmount
      });
    }
    
    // Return the complete order
    return {
      id: newOrder.id,
      customerId,
      customer,
      date: newOrder.date,
      source: newOrder.source as any,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || undefined,
        price: Number(item.price),
        quantity: item.quantity,
        photoUrl: item.photo_url || undefined
      })),
      status: newOrder.status as any,
      totalAmount: Number(newOrder.total_amount),
      orderNumber: newOrder.order_number
    };
  } catch (error) {
    console.error('Error creating order:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось создать заказ: ' + (error as Error).message,
      variant: 'destructive',
    });
    throw error;
  }
};

export const updateOrder = async (id: string, orderData: Partial<Order>): Promise<Order | undefined> => {
  try {
    const updateData: any = {};
    
    if (orderData.customerId) updateData.customer_id = orderData.customerId;
    if (orderData.date) updateData.date = orderData.date;
    if (orderData.source) updateData.source = orderData.source;
    if (orderData.status) updateData.status = orderData.status;
    
    // If items are being updated, recalculate total
    if (orderData.items) {
      updateData.total_amount = orderData.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );
      
      // First delete existing items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);
      
      if (deleteError) throw deleteError;
      
      // Then insert new items
      const orderItems = orderData.items.map(item => ({
        order_id: id,
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        photo_url: item.photoUrl
      }));
      
      const { error: insertError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (insertError) throw insertError;
    }
    
    // Update order
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Return updated order
    return getOrderById(id);
  } catch (error) {
    console.error('Error updating order:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось обновить заказ',
      variant: 'destructive',
    });
    return undefined;
  }
};

export const deleteOrder = async (id: string): Promise<boolean> => {
  try {
    // First delete all order items
    const { error: itemsDeleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);
    
    if (itemsDeleteError) throw itemsDeleteError;
    
    // Then delete the order itself
    const { error: orderDeleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (orderDeleteError) throw orderDeleteError;
    
    return true;
  } catch (error) {
    console.error('Error deleting order:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось удалить заказ',
      variant: 'destructive',
    });
    return false;
  }
};
