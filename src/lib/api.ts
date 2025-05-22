import { supabase } from '@/integrations/supabase/client';
import { Customer, Order, OrderItem } from '@/types';
import { toast } from '@/hooks/use-toast';

// These functions are imported from supabaseApi and directly re-exported
import { 
  getCustomers,
  getCustomerById, 
  getCustomerByPhone, 
  createCustomer, 
  updateCustomer,
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
} from './supabaseApi';

// Export all functions that we want to expose from this API layer
export {
  getCustomers,
  getCustomerById,
  getCustomerByPhone,
  createCustomer,
  updateCustomer,
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
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
      description: 'Не удалось обработать внешний заказ: ' + (error as Error).message,
      variant: 'destructive',
    });
    throw error;
  }
};
