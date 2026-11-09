import { $, action, notice } from '../ui/shell.js';
import { supabase } from '../services/client.js';

const login = $('#login-panel');
const panel = $('#recovery-panel');
const request = $('#request-recovery');
const change = $('#change-password');
const requestButton = request.querySelector('button');
const changeButton = change.querySelector('button');

function showRecovery(fromEmail) {
  login.hidden = true;
  panel.hidden = false;
  request.hidden = fromEmail;
  change.hidden = !fromEmail;
  (fromEmail ? change : request).querySelector('input').focus();
}

$('#forgot-password').addEventListener('click', event => {
  event.preventDefault();
  request.elements.email.value = $('#auth').elements.email.value;
  showRecovery(false);
  if (!supabase) notice('Възстановяването на парола изисква връзка със Supabase.', true);
});

requestButton.disabled = !supabase;
changeButton.disabled = true;

if (supabase) {
  const callback = new URLSearchParams(location.hash.slice(1));
  const query = new URLSearchParams(location.search);
  if (callback.has('error_code') || query.has('error_code')) {
    history.replaceState(null, '', location.pathname);
    notice('Линкът е невалиден или е изтекъл. Ако възстановяваш парола, поискай нов линк.', true);
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' && session) {
      changeButton.disabled = false;
      showRecovery(true);
    }
  });

  request.addEventListener('submit', action(requestButton, async () => {
    const redirectTo = new URL('./login.html', location.href).href;
    const { error } = await supabase.auth.resetPasswordForEmail(
      request.elements.email.value.trim(),
      { redirectTo },
    );
    if (error) throw error;
    notice('Ако има акаунт с този имейл, ще получиш линк за задаване на нова парола.');
  }));

  change.addEventListener('submit', action(changeButton, async () => {
    const { password, confirmation } = change.elements;
    if (password.value !== confirmation.value) {
      confirmation.focus();
      throw new Error('Двете пароли трябва да съвпадат.');
    }
    const { error } = await supabase.auth.updateUser({ password: password.value });
    if (error) throw error;
    change.reset();
    location.replace('./collection.html');
  }));
}
