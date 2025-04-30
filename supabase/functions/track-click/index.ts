
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse request body
    const { referralCode } = await req.json();
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    console.log(`Processing click for referral code: ${referralCode}, IP: ${ipAddress}`);
    
    if (!referralCode) {
      return new Response(
        JSON.stringify({ error: "Referral code is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the referrer user
    const { data: referrer, error: referrerError } = await supabaseClient
      .from('users')
      .select('id, referred_by')
      .eq('partner_code', referralCode)
      .single();

    if (referrerError || !referrer) {
      return new Response(
        JSON.stringify({ error: "Invalid referral code" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for recent clicks from this IP to prevent spam
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data: recentClicks, error: clickCheckError } = await supabaseClient
      .from('clicks')
      .select('created_at')
      .eq('user_id', referrer.id)
      .eq('ip_address', ipAddress)
      .eq('type', 'direct')
      .gte('created_at', oneDayAgo.toISOString());
    
    if (clickCheckError) {
      console.error("Error checking recent clicks:", clickCheckError);
    }
    
    // If there's a recent click from the same IP, don't register another one
    if (recentClicks && recentClicks.length > 0) {
      return new Response(
        JSON.stringify({ message: "Click already recorded recently" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Register the direct click
    const { error: insertError } = await supabaseClient
      .from('clicks')
      .insert({
        user_id: referrer.id,
        type: 'direct',
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (insertError) {
      throw insertError;
    }

    // If the referrer was referred by someone, potentially add bonus click to upline
    if (referrer.referred_by) {
      // 20% chance of generating a bonus click
      if (Math.random() < 0.2) {
        const { data: upline, error: uplineError } = await supabaseClient
          .from('users')
          .select('id')
          .eq('partner_code', referrer.referred_by)
          .single();

        if (!uplineError && upline) {
          await supabaseClient
            .from('clicks')
            .insert({
              user_id: upline.id,
              source_user_id: referrer.id,
              type: 'bonus',
              ip_address: ipAddress,
              user_agent: 'BONUS_FROM_DOWNLINE'
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Click registered successfully" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing click:", error.message);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
