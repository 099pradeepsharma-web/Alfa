// Browser Supabase client for Next.js App Router
// Uses @supabase/ssr for proper cookie handling on the client

import { createBrowserClient } from '@supabase/ssr';

export function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createBrowserClient(url, anon);
}

export default getBrowserSupabase;
