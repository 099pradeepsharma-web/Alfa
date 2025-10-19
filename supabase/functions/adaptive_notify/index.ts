import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function sendNotification(to: string, msg: string) {
  // Replace this with your real notification infrastructure
  console.log(`Notification to ${to}: ${msg}`);
}

serve(async () => {
  try {
    const { data: pending, error } = await supabase.from('notification_queue').select('*').eq('status', 'pending').limit(10);
    if (error) throw error;
    if (!pending || pending.length === 0) return new Response('No notifications to send.', { status: 200 });

    for (const note of pending) {
      await sendNotification(note.recipient, note.message);
      await supabase.from('notification_queue').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', note.id);
    }
    return new Response(`Sent ${pending.length} notifications.`, { status: 200 });
  } catch (error) {
    console.error('adaptive_notify error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
