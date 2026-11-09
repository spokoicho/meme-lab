import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server-side environment.');
}
if (Boolean(ADMIN_EMAIL) !== Boolean(ADMIN_PASSWORD)) throw new Error('Set both admin variables or omit both.');
if (ADMIN_PASSWORD && ADMIN_PASSWORD.length < 16) throw new Error('Use at least 16 characters for the admin password.');
if (ADMIN_EMAIL?.trim().toLowerCase() === 'demo@example.com') throw new Error('Demo and admin must be separate accounts.');

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
async function createUser(email, password) {
  const { data, error } = await client.auth.admin.createUser({ email, password, email_confirm: true });
  if (error?.code !== 'email_exists') {
    if (error) throw error;
    return data.user;
  }
  for (let page = 1; ; page++) {
    const { data: listed, error: listError } = await client.auth.admin.listUsers({ page, perPage: 100 });
    if (listError) throw listError;
    const user = listed.users.find(user => user.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (listed.users.length < 100) throw error;
  }
}
if (ADMIN_EMAIL) {
  const admin = await createUser(ADMIN_EMAIL.trim(), ADMIN_PASSWORD);
  const { error } = await client.from('user_roles').update({ role: 'admin' }).eq('user_id', admin.id).select('user_id').single();
  if (error) throw error;
  console.log('Administrator role configured. Existing passwords were preserved.');
}
await createUser('demo@example.com', 'MemeLab2026!');
console.log('Demo account configured. Existing passwords were preserved.');
