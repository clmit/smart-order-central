
export const formatOrderId = (orderNumber: number): string => {
  // Format order number as CL followed by 5-digit padded number
  return `CL${orderNumber.toString().padStart(5, '0')}`;
};

export const getShortOrderId = (id: string): string => {
  // For backwards compatibility, also provide a 6-character version
  return id.substring(0, 6);
};
