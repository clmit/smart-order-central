
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    console.log('Edge function: create-order started')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://dzuyeaqwdkpegosfhooz.supabase.co'
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const requestText = await req.text()
    console.log('Received raw request data:', requestText)
    
    let requestData
    try {
      requestData = JSON.parse(requestText)
    } catch (parseError) {
      console.error('Error parsing request data:', parseError)
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('Parsed request data:', JSON.stringify(requestData, null, 2))
    
    // Validate required fields
    const { customerName, customerPhone, items } = requestData
    
    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields', data: requestData }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Check for existing customer by phone
    let { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', customerPhone)
      .maybeSingle()
    
    if (customerError) {
      console.error('Error fetching customer:', customerError)
      return new Response(JSON.stringify({ error: 'Failed to check existing customer', details: customerError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    let customerId
    
    if (existingCustomer) {
      // Use existing customer
      customerId = existingCustomer.id
      console.log('Found existing customer:', customerId)
    } else {
      // Create a new customer
      console.log('Creating new customer')
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          name: customerName,
          phone: customerPhone,
          address: requestData.customerAddress || '',
          email: requestData.customerEmail || null
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating customer:', createError)
        return new Response(JSON.stringify({ error: 'Failed to create customer', details: createError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      customerId = newCustomer.id
      existingCustomer = newCustomer
      console.log('Created new customer with ID:', customerId)
    }
    
    // Calculate total amount
    const totalAmount = requestData.items.reduce(
      (sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)),
      0
    )
    console.log('Calculated total amount:', totalAmount)
    
    // Determine order date - use provided date or current date
    const orderDate = requestData.date ? new Date(requestData.date).toISOString() : new Date().toISOString()
    console.log('Order date:', orderDate)
    
    // Create the order
    console.log('Creating order')
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        date: orderDate,
        source: requestData.source || 'other',
        status: 'new',
        total_amount: totalAmount
      })
      .select()
      .single()
    
    if (orderError) {
      console.error('Error creating order:', orderError)
      return new Response(JSON.stringify({ error: 'Failed to create order', details: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('Order created:', order.id)
    
    // Create order items
    const orderItems = requestData.items.map((item) => ({
      order_id: order.id,
      name: item.name,
      description: item.description || null,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      photo_url: item.photoUrl || null
    }))
    
    console.log('Creating order items:', orderItems.length)
    const { data: orderItemsData, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()
    
    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      return new Response(JSON.stringify({ error: 'Failed to create order items', details: itemsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Update customer metrics
    console.log('Updating customer metrics')
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        total_orders: (existingCustomer.total_orders || 0) + 1,
        total_spent: (existingCustomer.total_spent || 0) + totalAmount
      })
      .eq('id', customerId)
    
    if (updateError) {
      console.error('Error updating customer metrics:', updateError)
      // We don't want to fail the whole request if just this update fails
    }
    
    // Format response
    const response = {
      id: order.id,
      customerId: customerId,
      customer: {
        id: existingCustomer.id,
        name: existingCustomer.name,
        phone: existingCustomer.phone,
        address: existingCustomer.address,
        email: existingCustomer.email,
        createdAt: existingCustomer.created_at,
        totalOrders: (existingCustomer.total_orders || 0) + 1,
        totalSpent: (existingCustomer.total_spent || 0) + totalAmount
      },
      date: order.date,
      source: order.source,
      status: order.status,
      items: orderItemsData.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        quantity: item.quantity,
        photoUrl: item.photo_url
      })),
      totalAmount: Number(order.total_amount),
      orderNumber: order.order_number
    }
    
    console.log('Successfully created order:', order.id)
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
