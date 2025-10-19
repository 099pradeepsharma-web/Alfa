import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../src/services/supabase';

// Handles magic-link / OAuth redirects and finalizes session
export async function GET(req: NextRequest) {
  try {
    const supabase = getServerSupabase();
    // Touch session to ensure cookies are set/refreshed
    const { data: { session } } = await supabase.auth.getSession();
    const url = new URL(req.url);
    const redirect = url.searchParams.get('redirect') || '/';

    // Optionally fetch profile and route by role
    // const { data: profile } = await supabase.from('profiles').select('role').single();

    return NextResponse.redirect(new URL(redirect, req.url));
  } catch (e) {
    return NextResponse.redirect(new URL('/?error=auth_callback_failed', req.url));
  }
}
