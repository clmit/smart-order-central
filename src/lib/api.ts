
// Export all functions from the refactored API modules
export {
  getCustomers,
  getCustomerById,
  getCustomerByPhone,
  createCustomer,
  updateCustomer
} from './api/customers';

export {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
} from './api/orders';

export {
  sendSms,
  handleExternalOrderCreate
} from './api/external';
