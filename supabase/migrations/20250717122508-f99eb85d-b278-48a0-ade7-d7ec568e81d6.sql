-- Fix function to handle partial phone search correctly
CREATE OR REPLACE FUNCTION search_orders_by_phone(search_term TEXT)
RETURNS TABLE (
  order_id UUID,
  customer_id UUID,
  date TIMESTAMPTZ,
  total_amount NUMERIC,
  order_number INTEGER,
  source TEXT,
  status TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_email TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  digits_only TEXT;
  is_full_number BOOLEAN;
BEGIN
  -- Extract only digits from search term
  digits_only := regexp_replace(search_term, '[^0-9]', '', 'g');
  
  -- Check if this looks like a full phone number (starts with 7 or 8 and has 10+ digits)
  is_full_number := (digits_only ~ '^[78]' AND length(digits_only) >= 10);
  
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.customer_id,
    o.date,
    o.total_amount,
    o.order_number,
    o.source,
    o.status,
    c.name as customer_name,
    c.phone as customer_phone,
    c.address as customer_address,
    c.email as customer_email
  FROM orders o
  JOIN customers c ON o.customer_id = c.id
  WHERE
    CASE 
      WHEN is_full_number THEN
        -- For full numbers, normalize both sides and compare
        regexp_replace(
          regexp_replace(c.phone, '[^0-9]', '', 'g'),
          '^8', '7'
        ) = regexp_replace(digits_only, '^8', '7')
      ELSE
        -- For partial searches, just look for the digits in the normalized phone
        regexp_replace(
          regexp_replace(c.phone, '[^0-9]', '', 'g'),
          '^8', '7'
        ) LIKE '%' || digits_only || '%'
    END
    OR
    -- Also search by customer name
    c.name ILIKE '%' || search_term || '%'
    OR
    -- Search by order ID
    o.id::text ILIKE '%' || search_term || '%';
END;
$$;