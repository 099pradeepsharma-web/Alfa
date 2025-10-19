import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { student_id, type, assignments, data } = await req.json();

    if (!student_id) {
      return new Response(JSON.stringify({ error: 'student_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: studentProfile, error: profileError } = await supabase
      .from('student_profiles')
      .select('student_id, name, email, phone, parent_contacts, notification_preferences')
      .eq('student_id', student_id)
      .single();

    if (profileError) throw profileError;

    const notifications = generateNotifications(type, studentProfile, assignments, data);

    const dispatchResults = await Promise.all(
      notifications.map(async (notification) => {
        const res = [];
        try {
          res.push(sendEmailNotification(notification));
          res.push(sendInAppNotification(notification));
          res.push(sendSMSIfEnabled(notification));
        } catch (e) {
          console.error('Notification send error:', e);
        }
        return Promise.allSettled(res);
      })
    );

    return new Response(
      JSON.stringify({ success: true, notificationCount: notifications.length, dispatchResults }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('adaptive_notification_dispatch error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateNotifications(type, student, assignments, data) {
  const notifications = [];

  switch (type) {
    case 'new_assignment':
      notifications.push({
        recipient: student.email,
        subject: `New Learning Assignments for ${student.name}`,
        message: `Dear ${student.name}, you have new assignments.",
        priority: 'high'
      });
      if (student.parent_contacts && student.parent_contacts.length > 0) {
        notifications.push({
          recipient: student.parent_contacts[0].email,
          subject: `Learning Update for ${student.name}`,
          message: `Please support ${student.name}'s learning journey.",
          priority: 'medium'
        });
      }
      break;
    case 'progress_update':
      notifications.push({
        recipient: student.email,
        subject: `Progress Update for ${student.name}`,
        message: `Here's your recent learning progress.",
        priority: 'low'
      });
      break;
  }
  return notifications;
}

async function sendEmailNotification(notification) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Alfanumrik <noreply@alfanumrik.com>',
      to: [notification.recipient],
      subject: notification.subject,
      text: notification.message
    })
  });
  if (!response.ok) throw new Error(`Email send failed: ${response.statusText}`);
}

async function sendInAppNotification(notification) {
  const { error } = await supabase.from('in_app_notifications').insert({
    student_id: notification.student_id,
    title: notification.subject,
    message: notification.message,
    priority: notification.priority,
    read: false,
    created_at: new Date().toISOString()
  });
  if (error) throw error;
}

async function sendSMSIfEnabled(notification) {
  // Add SMS provider integration and respect preferences
  return;
}
