import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com'

interface EmailData {
  id: string
  recipient_email: string
  subject: string
  body_html: string
  notification_type: string
  related_id: string | null
}

serve(async (req) => {
  try {
    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get pending emails from queue
    const { data: emails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('sent', false)
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      throw new Error(`Failed to fetch emails: ${fetchError.message}`)
    }

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No emails to send', count: 0 }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const results = []

    // Process each email
    for (const email of emails as EmailData[]) {
      try {
        // Send email via Resend
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email.recipient_email,
            subject: email.subject,
            html: email.body_html,
          }),
        })

        const result = await response.json()

        if (response.ok) {
          // Mark email as sent
          await supabase
            .from('email_queue')
            .update({
              sent: true,
              sent_at: new Date().toISOString(),
            })
            .eq('id', email.id)

          results.push({ id: email.id, status: 'sent', resend_id: result.id })
        } else {
          // Increment retry count and log error
          await supabase
            .from('email_queue')
            .update({
              retry_count: email.retry_count + 1,
              error_message: JSON.stringify(result),
            })
            .eq('id', email.id)

          results.push({ id: email.id, status: 'failed', error: result })
        }
      } catch (emailError) {
        // Handle individual email errors
        await supabase
          .from('email_queue')
          .update({
            retry_count: email.retry_count + 1,
            error_message: emailError.message,
          })
          .eq('id', email.id)

        results.push({ id: email.id, status: 'error', error: emailError.message })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Email processing complete',
        processed: results.length,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

