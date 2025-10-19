import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Supabase Edge Function: LMS Dry-Run Sync
// Inputs: { connection_id: string, limit?: number }
// Output: summary of courses/users/enrollments without writing to DB

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

serve(async (req) => {
  try {
    const { connection_id, limit = 50 } = await req.json();
    if (!connection_id) return new Response(JSON.stringify({ error: 'connection_id required' }), { status: 400 });

    const { data: conn, error } = await supabase.from('lms_connections').select('*').eq('id', connection_id).single();
    if (error || !conn) return new Response(JSON.stringify({ error: 'connection not found' }), { status: 404 });

    // NOTE: In production you should decrypt tokens via RPC with KMS key set
    // Here we just return a stub structure for scaffolding

    const summary = {
      lms_type: conn.lms_type,
      org_id: conn.org_id,
      sample: {
        courses: [{ id: 'sample-course-1', name: 'Mathematics 9A' }],
        users: [{ id: 'student-1', name: 'Aarav Sharma', role: 'student' }],
        enrollments: [{ user_id: 'student-1', course_id: 'sample-course-1' }],
      },
      counts: { courses: 1, users: 1, enrollments: 1 }
    };

    // Log dry-run
    await supabase.from('lms_sync_logs').insert({
      connection_id,
      job_type: 'dry_run',
      status: 'success',
      details: summary
    });

    return new Response(JSON.stringify(summary), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
