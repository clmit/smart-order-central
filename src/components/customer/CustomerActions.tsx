
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types';

interface CustomerActionsProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
}

export function CustomerActions({ customer, onEdit }: CustomerActionsProps) {
  const navigate = useNavigate();
  
  const handleNavigateToMessaging = (phone: string) => {
    navigate(`/messaging?phone=${encodeURIComponent(phone)}`);
  };

  const handleNavigateToCustomerOrders = (phone: string) => {
    navigate(`/orders?customerPhone=${encodeURIComponent(phone)}`);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(customer)}
      >
        <Edit className="h-4 w-4" />
        <span className="sr-only">Edit</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleNavigateToMessaging(customer.phone)}
      >
        <Mail className="h-4 w-4" />
        <span className="sr-only">Send Message</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleNavigateToCustomerOrders(customer.phone)}
      >
        <FileText className="h-4 w-4" />
        <span className="sr-only">Orders</span>
      </Button>
    </>
  );
}
