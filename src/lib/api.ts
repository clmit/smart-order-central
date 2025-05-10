
import { Customer, Order, OrderItem } from "../types";
import { mockCustomers, mockOrders, mockOrderItems } from "./mockData";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 10);

// In-memory data storage (simulating a database)
let customers = [...mockCustomers];
let orders = [...mockOrders];
let orderItems = { ...mockOrderItems };

// Customer API
export const getCustomers = async (): Promise<Customer[]> => {
  return [...customers];
};

export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
  return customers.find(customer => customer.id === id);
};

export const getCustomerByPhone = async (phone: string): Promise<Customer | undefined> => {
  return customers.find(customer => customer.phone === phone);
};

export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpent'>): Promise<Customer> => {
  const newCustomer: Customer = {
    ...customerData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    totalOrders: 0,
    totalSpent: 0
  };
  
  customers.push(newCustomer);
  return newCustomer;
};

export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer | undefined> => {
  const index = customers.findIndex(customer => customer.id === id);
  if (index === -1) return undefined;
  
  const updatedCustomer = { ...customers[index], ...customerData };
  customers[index] = updatedCustomer;
  return updatedCustomer;
};

// Order API
export const getOrders = async (): Promise<Order[]> => {
  return [...orders].map(order => ({
    ...order,
    customer: customers.find(customer => customer.id === order.customerId)
  }));
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
  const order = orders.find(order => order.id === id);
  if (!order) return undefined;
  
  return {
    ...order,
    customer: customers.find(customer => customer.id === order.customerId)
  };
};

export const createOrder = async (orderData: Omit<Order, 'id'>): Promise<Order> => {
  // Check if customer exists, if not create a new one
  let customerId = orderData.customerId;
  let customer = await getCustomerById(customerId);
  
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
        address: orderData.customer.address,
        email: orderData.customer.email
      });
      customerId = newCustomer.id;
      customer = newCustomer;
    }
  }
  
  // Calculate total amount
  const totalAmount = orderData.items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );
  
  // Create the order
  const newOrder: Order = {
    ...orderData,
    id: generateId(),
    customerId,
    totalAmount,
    customer
  };
  
  // Store the order items
  const orderItemsWithIds = orderData.items.map(item => ({
    ...item,
    id: item.id || generateId()
  }));
  
  orderItems[newOrder.id] = orderItemsWithIds;
  newOrder.items = orderItemsWithIds;
  
  // Update customer metrics
  if (customer) {
    await updateCustomer(customer.id, {
      totalOrders: (customer.totalOrders || 0) + 1,
      totalSpent: (customer.totalSpent || 0) + totalAmount
    });
  }
  
  orders.push(newOrder);
  return newOrder;
};

export const updateOrder = async (id: string, orderData: Partial<Order>): Promise<Order | undefined> => {
  const index = orders.findIndex(order => order.id === id);
  if (index === -1) return undefined;
  
  // If items are being updated, recalculate total
  let totalAmount = orders[index].totalAmount;
  if (orderData.items) {
    totalAmount = orderData.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    orderItems[id] = orderData.items;
  }
  
  const updatedOrder = {
    ...orders[index],
    ...orderData,
    totalAmount: orderData.totalAmount || totalAmount
  };
  
  orders[index] = updatedOrder;
  
  return {
    ...updatedOrder,
    customer: customers.find(customer => customer.id === updatedOrder.customerId)
  };
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

// API endpoint for external order creation
// This simulates what would be an external API endpoint
export const handleExternalOrderCreate = async (data: any): Promise<Order> => {
  // Validate required fields
  if (!data.customerName || !data.customerPhone || !data.items || !Array.isArray(data.items)) {
    throw new Error("Missing required fields");
  }
  
  // Check for existing customer by phone
  const existingCustomer = await getCustomerByPhone(data.customerPhone);
  
  // Prepare customer data
  let customer: Customer;
  if (existingCustomer) {
    customer = existingCustomer;
  } else {
    customer = await createCustomer({
      name: data.customerName,
      phone: data.customerPhone,
      address: data.customerAddress || "",
      email: data.customerEmail
    });
  }
  
  // Format order items
  const items: OrderItem[] = data.items.map((item: any) => ({
    id: generateId(),
    name: item.name,
    description: item.description,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    photoUrl: item.photoUrl
  }));
  
  // Create the order
  return createOrder({
    customerId: customer.id,
    date: new Date().toISOString(),
    source: data.source || "other",
    status: "new",
    items,
    totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    customer
  });
};
