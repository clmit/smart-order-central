import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem, Customer } from '@/types';
import { toast } from '@/hooks/use-toast';
import { getCustomerById, getCustomerByPhone, createCustomer, updateCustomer } from './customers';

export interface PaginatedOrdersResponse {
  orders: Order[];
  total: number;
  totalPages: number;
}

// Optimized function to get orders with server-side pagination
export const getOrdersPaginated = async (
  page: number = 1, 
  limit: number = 10,
  searchTerm?: string,
  statusFilter?: string
): Promise<PaginatedOrdersResponse> => {
  try {
    console.log(`Fetching orders page ${page} with limit ${limit}`);
    
    let query = supabase
      .from('orders')
      .select('*, customers(*)', { count: 'exact' })
      .order('date', { ascending: false });

    // Apply filters
    if (searchTerm && searchTerm.trim() !== '') {
      console.log('Search term:', searchTerm);
      
      // Use RPC function for phone-normalized search
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_orders_by_phone', { search_term: searchTerm })
        .range((page - 1) * limit, page * limit - 1);
      
      if (searchError) {
        console.error('Search error:', searchError);
        throw searchError;
      }
      
      console.log('Search results:', searchResults);
      
      if (!searchResults || searchResults.length === 0) {
        return { orders: [], total: 0, totalPages: 0 };
      }
      
      // Transform the RPC results to match the expected format
      const orders = searchResults.map((row: any) => ({
        id: row.order_id,
        customerId: row.customer_id,
        customer: {
          id: row.customer_id,
          name: row.customer_name,
          phone: row.customer_phone,
          address: row.customer_address,
          email: row.customer_email || undefined,
          createdAt: row.date, // We'll need to get the actual customer created_at if needed
          totalOrders: 0, // These would need additional queries if needed
          totalSpent: 0
        },
        date: row.date,
        source: row.source as any,
        items: [], // Items will be fetched below
        status: row.status as any,
        totalAmount: Number(row.total_amount),
        orderNumber: row.order_number
      }));
      
      // Get order items for the search results
      const orderIds = orders.map(order => order.id);
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);
      
      if (itemsError) {
        console.error('Order items query error:', itemsError);
        throw itemsError;
      }
      
      // Group items by order_id
      const itemsByOrder = (items || []).reduce((acc, item) => {
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
      
      // Add items to orders
      orders.forEach(order => {
        order.items = itemsByOrder[order.id] || [];
      });
      
      // Get total count for pagination (run the search again with count)
      const { count: totalCount } = await supabase
        .rpc('search_orders_by_phone', { search_term: searchTerm }, { count: 'exact', head: true });
      
      const total = totalCount || 0;
      const totalPages = Math.ceil(total / limit);
      
      console.log(`Search completed: ${orders.length} orders found, total: ${total}`);
      
      return { orders, total, totalPages };
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: ordersData, error, count } = await query;

    if (error) {
      console.error('Orders query error:', error);
      throw error;
    }

    if (!ordersData) {
      return { orders: [], total: 0, totalPages: 0 };
    }

    // Get order items for the current page orders
    const orderIds = ordersData.map(order => order.id);
    let itemsData = [];
    
    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);
      
      if (itemsError) {
        console.error('Order items query error:', itemsError);
        throw itemsError;
      }
      itemsData = items || [];
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

    // Build final orders
    const orders = ordersData.map(order => ({
      id: order.id,
      customerId: order.customer_id,
      customer: order.customers ? {
        id: order.customers.id,
        name: order.customers.name,
        phone: order.customers.phone,
        address: order.customers.address,
        email: order.customers.email || undefined,
        createdAt: order.customers.created_at,
        totalOrders: order.customers.total_orders,
        totalSpent: Number(order.customers.total_spent)
      } : undefined,
      date: order.date,
      source: order.source as any,
      items: itemsByOrder[order.id] || [],
      status: order.status as any,
      totalAmount: Number(order.total_amount),
      orderNumber: order.order_number
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    console.log(`Successfully fetched ${orders.length} orders from page ${page}, total: ${total}`);
    
    return { orders, total, totalPages };
  } catch (error) {
    console.error('Error fetching paginated orders:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось загрузить заказы',
      variant: 'destructive',
    });
    return { orders: [], total: 0, totalPages: 0 };
  }
};

// Keep the old function for backward compatibility but make it use pagination internally
export const getOrders = async (): Promise<Order[]> => {
  const result = await getOrdersPaginated(1, 50); // Get first 50 orders for compatibility
  return result.orders;
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
    if (orderData.orderNumber !== undefined) updateData.order_number = orderData.orderNumber;
    
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
        description: item.description || null,
        price: item.price,
        quantity: item.quantity,
        photo_url: item.photoUrl || null
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
