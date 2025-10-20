import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const confirmLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm your email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
            <div style="padding: 40px 32px; text-align: center;">
              <h1 style="color: #18181b; font-size: 28px; margin: 0 0 16px 0; font-weight: 700;">Confirm your email</h1>
              <p style="color: #71717a; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                Thanks for signing up for <strong>FounderFlow</strong>!
              </p>
              <p style="color: #71717a; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                Please confirm your email address (${user.email}) by clicking the button below:
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

    const { error } = await resend.emails.send({
      from: "FounderFlow <onboarding@resend.dev>",
      to: [user.email],
      subject: "Confirm your email - FounderFlow",
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Confirmation email sent successfully to:", user.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
