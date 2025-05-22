import { supabase } from '@/integrations/supabase/client';
import { Customer, Order, OrderItem } from '@/types';
import { toast } from '@/hooks/use-toast';

// Customer API
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*');
    
    if (error) throw error;
    
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

// Order API with Supabase
export const getOrders = async (): Promise<Order[]> => {
  try {
    // First get all orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) throw ordersError;
    
    // Get all customers for these orders
    const customerIds = [...new Set(ordersData.map(order => order.customer_id))];
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .in('id', customerIds);
    
    if (customersError) throw customersError;
    
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
    
    // Get order items
    const orderIds = ordersData.map(order => order.id);
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);
    
    if (itemsError) throw itemsError;
    
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
    
    // Combine all data
    return ordersData.map(order => ({
      id: order.id,
      customerId: order.customer_id,
      customer: customersMap[order.customer_id],
      date: order.date,
      source: order.source as any,
      items: itemsByOrder[order.id] || [],
      status: order.status as any,
      totalAmount: Number(order.total_amount)
    }));
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
      totalAmount: Number(order.total_amount)
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
    
    // Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        date: orderData.date || new Date().toISOString(),
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
      totalAmount: Number(newOrder.total_amount)
    };
  } catch (error) {
    console.error('Error creating order:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось создать заказ: ' + error.message,
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

// Mock API for SMS messaging
export const sendSms = async (phoneNumbers: string[], message: string): Promise<{ success: boolean, sent: number, failed: number }> => {
  console.log(`Sending SMS to ${phoneNumbers.length} recipients: "${message}"`);
  
  // In a real implementation, this would connect to an SMS API
  // Here we just simulate success with a small random failure rate
  const failedCount = Math.floor(phoneNumbers.length * Math.random() * 0.1); // 0-10% failure rate
  const sentCount = phoneNumbers.length - failedCount;
  
  return {
    success: true,
    sent: sentCount,
    failed: failedCount
  };
};

// API endpoint for external order creation via Edge Function
export const handleExternalOrderCreate = async (data: any): Promise<Order> => {
  const { customerId, customerName, customerPhone, customerAddress, customerEmail, items, source } = data;
  
  try {
    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Отсутствуют обязательные поля');
    }
    
    // Calculate the total amount from the items
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)),
      0
    );
    
    // Create the formatted data with all required fields for the Order type
    const formattedData: Omit<Order, 'id'> = {
      customerId: customerId || "", // Will be replaced by createOrder if empty
      customer: {
        id: "", // This will be replaced by createOrder
        name: customerName,
        phone: customerPhone,
        address: customerAddress || "",
        email: customerEmail,
        createdAt: new Date().toISOString(),
        totalOrders: 0,
        totalSpent: 0
      },
      items: items.map((item: any) => ({
        id: "", // Will be replaced when created
        name: item.name,
        description: item.description || "",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        photoUrl: item.photoUrl
      })),
      date: new Date().toISOString(),
      source: source || "other",
      status: "new",
      totalAmount: totalAmount
    };
    
    // Call the create order method
    const createdOrder = await createOrder(formattedData);
    return createdOrder;
  } catch (error) {
    console.error("Error creating external order:", error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось обработать внешний заказ: ' + error.message,
      variant: 'destructive',
    });
    throw error;
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
