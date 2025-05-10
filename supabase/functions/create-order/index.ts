
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://dzuyeaqwdkpegosfhooz.supabase.co'
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const requestData = await req.json()
    
    // Validate required fields
    const { customerName, customerPhone, items } = requestData
    
    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
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
      return new Response(JSON.stringify({ error: 'Failed to check existing customer' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    let customerId
    
    if (existingCustomer) {
      // Use existing customer
      customerId = existingCustomer.id
    } else {
      // Create a new customer
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
        return new Response(JSON.stringify({ error: 'Failed to create customer' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      customerId = newCustomer.id
      existingCustomer = newCustomer
    }
    
    // Calculate total amount
    const totalAmount = requestData.items.reduce(
      (sum: number, item: any) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)),
      0
    )
    
    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        date: new Date().toISOString(),
        source: requestData.source || 'other',
        status: 'new',
        total_amount: totalAmount
      })
      .select()
      .single()
    
    if (orderError) {
      console.error('Error creating order:', orderError)
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Create order items
    const orderItems = requestData.items.map((item: any) => ({
      order_id: order.id,
      name: item.name,
      description: item.description || null,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      photo_url: item.photoUrl || null
    }))
    
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()
    
    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      return new Response(JSON.stringify({ error: 'Failed to create order items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Update customer metrics
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
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        quantity: item.quantity,
        photoUrl: item.photo_url
      })),
      totalAmount: Number(order.total_amount)
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
