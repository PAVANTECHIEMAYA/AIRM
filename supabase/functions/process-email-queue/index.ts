import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // Get the send-email function URL
    const functionUrl = Deno.env.get('SUPABASE_URL')!.replace(
      'https://',
      'https://'
    ).replace('.supabase.co', '.supabase.co/functions/v1/send-email')

    // Call the send-email function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
      },
    })

    const result = await response.json()

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' }, status: response.status }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

