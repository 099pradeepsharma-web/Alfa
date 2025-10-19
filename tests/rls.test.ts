import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Row-Level Security Tests', () => {
  const testUsers = [
    { email: 'user1@example.com', password: 'Password1!' },
    { email: 'user2@example.com', password: 'Password2!' }
  ];

  let userSessions: any[] = [];

  beforeAll(async () => {
    for (const user of testUsers) {
      // Sign up or sign in test users
      const { user: signedInUser } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });
      userSessions.push(signedInUser);
    }
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  test('Users access their own mastery data only', async () => {
    for (const sessionUser of userSessions) {
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { 'Authorization': `Bearer ${sessionUser.access_token}` } }
      });
      
      const { data, error } = await userSupabase
        .from('student_skill_mastery')
        .select('*')
        .eq('student_id', sessionUser.id);

      expect(error).toBeNull();
      expect(data?.every((record: any) => record.student_id === sessionUser.id)).toBe(true);

      // Try to access data of another student - should return empty array
      const { data: unauthorizedData } = await userSupabase
        .from('student_skill_mastery')
        .select('*')
        .neq('student_id', sessionUser.id);

      expect(unauthorizedData).toHaveLength(0);
    }
  });
});
