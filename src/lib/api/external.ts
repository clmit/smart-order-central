
import { Order } from '@/types';
import { toast } from '@/hooks/use-toast';
import { createOrder } from './orders';

// Real API for SMS messaging using SMS.ru
export const sendSms = async (phoneNumbers: string[], message: string): Promise<{ success: boolean, sent: number, failed: number }> => {
  console.log(`Sending SMS to ${phoneNumbers.length} recipients: "${message}"`);
  
  let sentCount = 0;
  let failedCount = 0;
  
  // Process each phone number individually
  for (const phone of phoneNumbers) {
    try {
      // Format the phone number: remove any non-digit characters and ensure it starts with 7
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('8')) {
        formattedPhone = '7' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('7')) {
        formattedPhone = '7' + formattedPhone;
      }
      
      // URL encode the message
      const encodedMessage = encodeURIComponent(message);
      
      // Make API request to SMS.ru
      const response = await fetch(
        `https://sms.ru/sms/send?api_id=460979D6-5A0D-B421-DD96-47CFD391B63E&to=${formattedPhone}&msg=${encodedMessage}&json=1`, 
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Fix: Only consider it a failure if the overall API status is not "OK"
      // or if the specific SMS status is not "OK"
      if (data.status === "OK") {
        const smsStatus = data.sms[formattedPhone]?.status;
        if (smsStatus === "OK") {
          sentCount++;
          console.log(`Successfully sent SMS to ${phone}`);
        } else {
          failedCount++;
          console.error(`Failed to send SMS to ${phone}:`, data.sms[formattedPhone]?.status_text);
        }
      } else {
        failedCount++;
        console.error(`SMS.ru API error:`, data.status_text);
      }
    } catch (error) {
      failedCount++;
      console.error(`Error sending SMS to ${phone}:`, error);
    }
  }
  
  // Success indicator - if at least one message was sent successfully
  const hasSuccessfulSends = sentCount > 0;
  
  return {
    success: hasSuccessfulSends,
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
