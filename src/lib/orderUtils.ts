
export const formatOrderId = (id: string): string => {
  // Extract the last 5 characters from the UUID and convert to uppercase
  const numericPart = id.replace(/-/g, '').slice(-5).toUpperCase();
  return `CL${numericPart}`;
};

export const getShortOrderId = (id: string): string => {
  // For backwards compatibility, also provide a 6-character version
  return id.substring(0, 6);
};
