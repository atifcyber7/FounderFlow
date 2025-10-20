import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Received email request:", payload);

    const { user, email_data } = payload;
    const { token_hash, redirect_to, email_action_type } = email_data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const confirmLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
            <div style="padding: 40px 32px; text-align: center;">
              <h1 style="color: #18181b; font-size: 28px; margin: 0 0 16px 0; font-weight: 700;">Confirm your email</h1>
              <p style="color: #71717a; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                Thanks for signing up for <strong>FounderFlow</strong>!
              </p>
              <p style="color: #71717a; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                Please confirm your email address by clicking the button below:
              </p>
              <a href="${confirmLink}" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Verify Email
              </a>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 20px; margin: 32px 0 0 0;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
            <div style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                &copy; ${new Date().getFullYear()} FounderFlow. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FounderFlow <onboarding@resend.dev>",
        to: [user.email],
        subject: "Confirm your email - FounderFlow",
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(resendData.message || "Failed to send email");
    }

    console.log("Email sent successfully to:", user.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
