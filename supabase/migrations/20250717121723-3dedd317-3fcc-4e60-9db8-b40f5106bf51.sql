-- Update function to support partial phone search
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
  normalized_search TEXT;
BEGIN
  -- Normalize search term
  normalized_search := regexp_replace(
    regexp_replace(search_term, '[^0-9]', '', 'g'),
    '^8', '7'
  );
  
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
    -- Exact match for normalized full phone numbers
    regexp_replace(
      regexp_replace(c.phone, '[^0-9]', '', 'g'),
      '^8', '7'
    ) = normalized_search
    OR
    -- Partial match in normalized phone numbers
    regexp_replace(
      regexp_replace(c.phone, '[^0-9]', '', 'g'),
      '^8', '7'
    ) LIKE '%' || normalized_search || '%'
    OR
    -- Search by customer name
    c.name ILIKE '%' || search_term || '%'
    OR
    -- Search by order ID
    o.id::text ILIKE '%' || search_term || '%';
END;
$$;