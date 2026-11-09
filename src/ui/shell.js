import 'bootstrap/dist/css/bootstrap.min.css';
import '../style.css';
import { currentUser, isAdmin, supabase } from '../services/client.js';

export const $ = selector => document.querySelector(selector);
export function notice(message, error = false) {
  const status = $('#status');
  status.textContent = message;
  status.className = 'notice ' + (error ? 'error' : '');
  status.hidden = !message;
}
export function action(button, task) {
  return async event => {
    event.preventDefault();
    if (button.disabled) return;
    button.disabled = true;
    notice('');
    try { await task(); }
    catch (error) { notice(error.message || 'Възникна грешка. Опитай отново.', true); }
    finally { button.disabled = false; }
  };
}

const pages = [['index', 'Начало'], ['editor', 'Редактор'], ['gallery', 'Галерия']];
const active = location.pathname.split('/').pop()?.replace('.html', '') || 'index';
function link(page, label) {
  const element = document.createElement('a');
  element.href = page === 'index' ? './' : './' + page + '.html';
  element.textContent = label;
  if (active === page) element.setAttribute('aria-current', 'page');
  return element;
}

const header = document.querySelector('header');
header.innerHTML = '<div class="container topbar"><a class="brand" href="./"><span class="brand-mark">M<span>.</span></span>Meme<span>Lab</span></a><nav aria-label="Основна навигация"></nav><div class="session"></div></div>';
const nav = $('nav');
pages.forEach(([page, label]) => nav.append(link(page, label)));
const session = $('.session');
session.append(link('login', 'Вход'));
document.querySelector('footer').innerHTML = '<div class="container footer-inner"><b>Meme Lab<span>.</span></b><span>Студио за мемета · 2026</span></div>';

export const userReady = currentUser();
userReady.then(async user => {
  if (!user) return;
  nav.append(link('collection', 'Моите мемета'));
  const logout = document.createElement('button');
  logout.className = 'quiet';
  logout.textContent = 'Изход';
  logout.onclick = action(logout, async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    location.href = './';
  });
  session.replaceChildren(logout);
  if (await isAdmin()) nav.append(link('admin', 'Админ'));
}).catch(error => notice(error.message, true));
