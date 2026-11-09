import { $, action, notice } from '../ui/shell.js';
import { supabase } from '../services/client.js';

const form = $('#auth');
const button = form.querySelector('button');
if (!supabase) {
  button.disabled = true;
  notice('Входът и регистрацията ще са достъпни след свързване със Supabase. Редакторът и PNG експортът са достъпни без профил.');
}
form.addEventListener('submit', action(button, async () => {
  const values = new FormData(form);
  const credentials = { email: values.get('email').trim(), password: values.get('password') };
  const loginUrl = new URL('./login.html', location.href).href;
  const { data, error } = form.hasAttribute('data-register')
    ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: loginUrl } })
    : await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  if (data.session) location.href = './collection.html';
  else notice('Провери имейла си за връзка за потвърждение.');
}));
