
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
    const url = new URL(req.url);
    const code = url.pathname.split('/').pop();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "No short code provided" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Processing redirect for short code: ${code}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the target URL and user_id from short_urls
    const { data: urlData, error: urlError } = await supabase
      .from('short_urls')
      .select('user_id, target_url')
      .eq('short_code', code)
      .single();

    if (urlError || !urlData) {
      console.error(`Error fetching URL data: ${urlError?.message || 'No data found'}`);
      return new Response(
        JSON.stringify({ error: "Invalid short code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    console.log(`Found target URL: ${urlData.target_url} for user: ${urlData.user_id}`);

    // Register the click
    const { error: clickError } = await supabase.from('clicks').insert({
      user_id: urlData.user_id,
      type: 'direct',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0',
      user_agent: req.headers.get('user-agent') || 'Unknown'
    });

    if (clickError) {
      console.error(`Error recording click: ${clickError.message}`);
    } else {
      console.log(`Successfully recorded click for user: ${urlData.user_id}`);
    }

    // Also call register_click RPC to handle bonus clicks if applicable
    const referrerCode = new URL(urlData.target_url).searchParams.get('ref');
    if (referrerCode) {
      const { error: rpcError } = await supabase.rpc('register_click', { referrer_code: referrerCode });
      if (rpcError) {
        console.error(`Error calling register_click: ${rpcError.message}`);
      } else {
        console.log(`Successfully called register_click for code: ${referrerCode}`);
      }
    }

    // Redirect to the target URL
    console.log(`Redirecting to: ${urlData.target_url}`);
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Location": urlData.target_url,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      status: 302,
    });
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
