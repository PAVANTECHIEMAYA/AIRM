// Supabase Edge Function for sending notification emails via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "notifications@yourdomain.com";

// Email templates
const emailTemplates = {
  issueAssigned: (data: any) => ({
    subject: `🎯 New Issue Assigned: ${data.issue_title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .issue-card { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            .label { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin: 5px 5px 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Issue Assigned</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${data.assignee_name}</strong>,</p>
              <p>A new issue has been assigned to you by <strong>${data.assigned_by_name}</strong>.</p>
              
              <div class="issue-card">
                <h2>${data.issue_title}</h2>
                <p><strong>Priority:</strong> <span class="label">${data.priority || 'Medium'}</span></p>
                <p><strong>Status:</strong> <span class="label">${data.status || 'Open'}</span></p>
                ${data.description ? `<p><strong>Description:</strong><br/>${data.description}</p>` : ''}
                ${data.due_date ? `<p><strong>Due Date:</strong> ${new Date(data.due_date).toLocaleDateString()}</p>` : ''}
              </div>
              
              <p>Please review the issue and start working on it at your earliest convenience.</p>
              
              <a href="${data.app_url}/issues/${data.issue_id}" class="button">View Issue Details</a>
              
              <div class="footer">
                <p>TechieMaya Timesheet Application</p>
                <p>This is an automated notification. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  issueComment: (data: any) => ({
    subject: `💬 New Comment on Issue: ${data.issue_title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .comment-card { background: white; padding: 20px; border-left: 4px solid #f5576c; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .author { color: #f5576c; font-weight: bold; }
            .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            .timestamp { color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 New Comment</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${data.assignee_name}</strong>,</p>
              <p><span class="author">${data.commenter_name}</span> commented on the issue assigned to you:</p>
              
              <div class="comment-card">
                <h3>${data.issue_title}</h3>
                <p class="timestamp">${new Date(data.created_at).toLocaleString()}</p>
                <p style="margin-top: 15px; padding: 15px; background: #f5f5f5; border-radius: 5px;">${data.comment}</p>
              </div>
              
              <p>Click below to view the full conversation and respond:</p>
              
              <a href="${data.app_url}/issues/${data.issue_id}" class="button">View Issue & Reply</a>
              
              <div class="footer">
                <p>TechieMaya Timesheet Application</p>
                <p>This is an automated notification. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  leaveRequest: (data: any) => ({
    subject: `📅 New Leave Request from ${data.employee_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .leave-card { background: white; padding: 20px; border-left: 4px solid #4facfe; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
            .button { display: inline-block; background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .button.approve { background: #28a745; }
            .button.reject { background: #dc3545; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            .urgent { background: #fff3cd; border-left-color: #ffc107; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Leave Request Pending</h1>
            </div>
            <div class="content">
              <p>Hi Admin,</p>
              <p>A new leave request requires your approval:</p>
              
              <div class="leave-card ${data.is_urgent ? 'urgent' : ''}">
                <h2>${data.employee_name}'s Leave Request</h2>
                
                <div class="info-row">
                  <strong>Leave Type:</strong>
                  <span>${data.leave_type}</span>
                </div>
                
                <div class="info-row">
                  <strong>Start Date:</strong>
                  <span>${new Date(data.start_date).toLocaleDateString()}</span>
                </div>
                
                <div class="info-row">
                  <strong>End Date:</strong>
                  <span>${new Date(data.end_date).toLocaleDateString()}</span>
                </div>
                
                <div class="info-row">
                  <strong>Total Days:</strong>
                  <span>${data.total_days} day(s)</span>
                </div>
                
                ${data.reason ? `
                  <div style="margin-top: 15px;">
                    <strong>Reason:</strong>
                    <p style="padding: 15px; background: #f5f5f5; border-radius: 5px; margin-top: 10px;">${data.reason}</p>
                  </div>
                ` : ''}
                
                <div style="margin-top: 15px;">
                  <strong>Submitted:</strong> ${new Date(data.created_at).toLocaleString()}
                </div>
              </div>
              
              <p style="text-align: center;">
                <a href="${data.app_url}/leave-calendar?request=${data.request_id}" class="button approve">✓ Approve Request</a>
                <a href="${data.app_url}/leave-calendar?request=${data.request_id}" class="button reject">✗ Reject Request</a>
              </p>
              
              <div class="footer">
                <p>TechieMaya Timesheet Application</p>
                <p>This is an automated notification. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", { 
        headers: { 
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
        } 
      });
    }

    const { type, data } = await req.json();

    // Validate required fields
    if (!type || !data) {
      throw new Error("Missing type or data in request");
    }

    // Get email template
    const template = emailTemplates[type as keyof typeof emailTemplates];
    if (!template) {
      throw new Error(`Unknown email type: ${type}`);
    }

    const { subject, html } = template(data);

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: data.to_email,
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    const result = await resendResponse.json();

    // Log notification in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from("email_notifications").insert({
      notification_type: type,
      recipient_email: data.to_email,
      subject,
      status: "sent",
      resend_id: result.id,
      metadata: data,
    });

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        status: 500,
      }
    );
  }
});

