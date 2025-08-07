import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSmsRequest {
  phoneNumbers: string[];
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumbers, message }: SendSmsRequest = await req.json();
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      throw new Error('Phone numbers array is required');
    }
    
    if (!message || typeof message !== 'string') {
      throw new Error('Message text is required');
    }

    const SMS_RU_API_KEY = Deno.env.get('SMS_RU_API_KEY');
    if (!SMS_RU_API_KEY) {
      throw new Error('SMS_RU_API_KEY is not configured');
    }

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
          `https://sms.ru/sms/send?api_id=${SMS_RU_API_KEY}&to=${formattedPhone}&msg=${encodedMessage}&json=1`, 
          { method: 'GET' }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`SMS API response for ${phone}:`, data);
        
        // Check if SMS was sent successfully
        if (data.status === "OK") {
          const smsStatus = data.sms[formattedPhone]?.status;
          console.log(`SMS status for ${phone} (${formattedPhone}):`, smsStatus);
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
    
    console.log(`SMS sending complete. Sent: ${sentCount}, Failed: ${failedCount}`);
    
    // Success indicator - if at least one message was sent successfully
    const hasSuccessfulSends = sentCount > 0;
    console.log(`Has successful sends: ${hasSuccessfulSends}`);
    
    const result = {
      success: hasSuccessfulSends,
      sent: sentCount,
      failed: failedCount
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        sent: 0,
        failed: 0
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);