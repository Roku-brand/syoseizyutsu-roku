import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const ADMIN_EMAIL = 'tsubasa00928@gmail.com';
const supabase = createClient(
  'https://otwnmfoubxdenqkrkxmx.supabase.co',
  'sb_publishable_cEI9jtk6n0S01-2dGaPn3A_MLT28InS',
);

const loginPanel = document.querySelector('#mypage-login');
const accountPanel = document.querySelector('#mypage-account');
const adminPanel = document.querySelector('#mypage-admin');
const emailOutput = document.querySelector('#mypage-user-email');
const message = document.querySelector('#mypage-message');

const isAdminEmail = (email = '') => email.trim().toLowerCase() === ADMIN_EMAIL;

const renderSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const signedIn = Boolean(session);
  loginPanel?.classList.toggle('is-hidden', signedIn);
  accountPanel?.classList.toggle('is-hidden', !signedIn);
  adminPanel?.classList.toggle('is-hidden', !isAdminEmail(session?.user?.email));
  if (emailOutput) {
    emailOutput.textContent = session?.user?.email || '';
  }
};

document.querySelector('#mypage-login-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.querySelector('#mypage-email')?.value.trim();
  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: new URL('mypage.html', window.location.href).href },
  });

  if (message) {
    message.classList.remove('is-hidden');
    message.textContent = error
      ? error.message
      : 'ログイン用メールを送信しました。メール内のリンクを開いてください。';
  }
  if (submitButton) submitButton.disabled = false;
});

document.querySelector('#mypage-logout')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  await renderSession();
});

supabase.auth.onAuthStateChange(() => {
  window.setTimeout(renderSession, 0);
});

await renderSession();
