// Browser Supabase client with typed Database generics
// Updated to include SHA from previous version

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../types/database.types';

export function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createBrowserClient<Database>(url, anon);
}

export default getBrowserSupabase;
