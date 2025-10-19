import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Supabase Edge Function: LMS OAuth callback (Google/Canvas)
// Expects query params: code, state (contains org_id & lms_type), provider
// Exchanges code for tokens server-side and stores encrypted in lms_connections

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const KMS_KEY = Deno.env.get("KMS_KEY")!; // used by pg functions encrypt_text/decrypt_text

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
});

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const provider = url.searchParams.get("provider"); // 'google_classroom' | 'canvas'

    if (!code || !state || !provider) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }

    const parsed = JSON.parse(atob(state));
    const { org_id, connection_id, redirect_to } = parsed;

    // Exchange authorization code for tokens (provider-specific)
    let tokenResponse: any = {};

    if (provider === "google_classroom") {
      // You must set GOOGLE_CLIENT_ID / SECRET in environment and redirect URL in Google console
      const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
      const body = new URLSearchParams({
        code,
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        redirect_uri: Deno.env.get("GOOGLE_REDIRECT_URI")!,
        grant_type: "authorization_code",
      });
      const res = await fetch(GOOGLE_TOKEN_URL, { method: "POST", body });
      tokenResponse = await res.json();
    } else if (provider === "canvas") {
      const CANVAS_TOKEN_URL = `${Deno.env.get("CANVAS_BASE_URL")}/login/oauth2/token`;
      const body = new URLSearchParams({
        code,
        client_id: Deno.env.get("CANVAS_CLIENT_ID")!,
        client_secret: Deno.env.get("CANVAS_CLIENT_SECRET")!,
        redirect_uri: Deno.env.get("CANVAS_REDIRECT_URI")!,
        grant_type: "authorization_code",
      });
      const res = await fetch(CANVAS_TOKEN_URL, { method: "POST", body });
      tokenResponse = await res.json();
    }

    if (!tokenResponse.access_token) {
      return new Response(JSON.stringify({ error: "Token exchange failed", tokenResponse }), { status: 500 });
    }

    // Store encrypted tokens in lms_connections
    // Set KMS key for the connection
    await supabase.rpc("set_config", { key: "app.kms_key", value: KMS_KEY });

    const { error: upErr } = await supabase
      .from("lms_connections")
      .update({
        status: "connected",
        access_token: (await encrypt(tokenResponse.access_token)) as any,
        refresh_token: tokenResponse.refresh_token ? (await encrypt(tokenResponse.refresh_token)) : null,
        token_expires_at: tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection_id);

    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });
    }

    return Response.redirect(redirect_to || `${url.origin}/admin/lms?connected=1`, 302);
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

async function encrypt(value: string) {
  // Call RPC to encrypt text in DB context with KMS key set
  const { data, error } = await supabase.rpc("encrypt_text", { value });
  if (error) throw error;
  return data;
}
