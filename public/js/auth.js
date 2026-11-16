import { $, $$ } from './utils.js';
import { api } from './api.js';
import { notify, state } from './store.js';

export function init() {
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
  $('#form-login').addEventListener('submit', login);
  $('#form-register').addEventListener('submit', register);
  $('#form-register').addEventListener('click', togglePassword);
}

/** Tombol mata: menampilkan/menyembunyikan isi kolom password. */
function togglePassword(event) {
  const button = event.target.closest('button[data-password-toggle]');
  if (!button) return;
  event.preventDefault();

  const input = event.currentTarget.elements[button.dataset.passwordToggle];
  if (!input) return;

  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(show));
  button.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
  input.focus();
}

export function render() {
  showTab(state.authTab === 'register' ? 'register' : 'login');
  $('#login-err').textContent = '';
  $('#register-err').textContent = '';
}

function showTab(name) {
  $$('.tab').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.tab === name)));
  $('#form-login').hidden = name !== 'login';
  $('#form-register').hidden = name !== 'register';
  const field = (name === 'login' ? $('#form-login') : $('#form-register')).elements[0];
  field?.focus();
}

async function login(event) {
  event.preventDefault();
  const form = event.currentTarget;
  $('#login-err').textContent = '';

  try {
    const { user } = await api.login(form.elements.email.value.trim(), form.elements.password.value);
    state.user = user;
    form.reset();
    notify(`Selamat datang, ${user.nama}.`, 'success', 3000);
    window.dispatchEvent(new Event('session:changed'));
  } catch (error) {
    $('#login-err').textContent = error.message;
  }
}

async function register(event) {
  event.preventDefault();
  const form = event.currentTarget;
  $('#register-err').textContent = '';

  if (form.elements.password.value !== form.elements.password2.value) {
    $('#register-err').textContent = 'Konfirmasi password tidak cocok.';
    form.elements.password2.focus();
    return;
  }

  try {
    const { user } = await api.register({
      nama: form.elements.nama.value.trim(),
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
      telepon: form.elements.telepon.value.trim(),
      role: form.elements.role.value,
    });
    state.user = user;
    form.reset();
    notify(`Akun dibuat. Selamat datang, ${user.nama}.`, 'success', 4000);
    window.dispatchEvent(new Event('session:changed'));
  } catch (error) {
    $('#register-err').textContent = error.message;
  }
}
