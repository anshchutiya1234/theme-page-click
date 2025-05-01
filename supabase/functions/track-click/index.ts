
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { code } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: "No referral code provided" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Processing click tracking for referral code: ${code}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this is a duplicate click from the same IP within a short time window
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    
    // Get current timestamp minus 1 minute
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
    
    // Get user ID for this referral code
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('partner_code', code)
      .single();
      
    if (userError) {
      console.error(`Error finding user with code ${code}: ${userError.message}`);
      throw userError;
    }
    
    if (!userData) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid referral code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }
    
    // Check for recent click from same IP
    const { count, error: countError } = await supabase
      .from('clicks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.id)
      .eq('ip_address', ip)
      .eq('type', 'direct')
      .gt('created_at', oneMinuteAgo.toISOString());
      
    if (countError) {
      console.error(`Error checking for recent clicks: ${countError.message}`);
    } else if (count && count > 0) {
      console.log(`Skipping duplicate click from IP ${ip} within the last minute`);
      return new Response(
        JSON.stringify({ success: true, registered: false, reason: "Duplicate click" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Call the register_click function
    const { data, error } = await supabase.rpc("register_click", {
      referrer_code: code,
    });

    if (error) {
      console.error(`Error registering click: ${error.message}`);
      throw error;
    }

    console.log(`Click registration result: ${data ? 'successful' : 'failed'}`);

    return new Response(
      JSON.stringify({ success: true, registered: data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`Unexpected error in track-click: ${error.message}`);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
