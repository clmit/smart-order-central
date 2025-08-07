
import { Order } from '@/types';
import { toast } from '@/hooks/use-toast';
import { createOrder } from './orders';

// SMS sending via Supabase Edge Function
export const sendSms = async (phoneNumbers: string[], message: string): Promise<{ success: boolean, sent: number, failed: number }> => {
  console.log(`Sending SMS to ${phoneNumbers.length} recipients: "${message}"`);
  
  try {
    const response = await fetch('https://dzuyeaqwdkpegosfhooz.supabase.co/functions/v1/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumbers,
        message
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('SMS function result:', result);
    
    return {
      success: result.success || false,
      sent: result.sent || 0,
      failed: result.failed || 0
    };
  } catch (error) {
    console.error('Error calling SMS function:', error);
    return {
      success: false,
      sent: 0,
      failed: 1
    };
  }
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
