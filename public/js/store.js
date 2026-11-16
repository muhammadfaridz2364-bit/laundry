import { esc } from './utils.js';
import { api } from './api.js';

export const state = {
  user: null,
  products: [],
  categories: [],
  settings: { waNumber: '', waTemplate: '' },
  filters: { q: '', kategori: '', sort: 'name-asc' },
  route: 'katalog',
  authTab: 'login',
};

let noticeTimer;

export function notify(message, tone = 'info', duration = 5000) {
  const host = document.querySelector('#notice');
  clearTimeout(noticeTimer);
  if (!message) {
    host.innerHTML = '';
    return;
  }
  host.innerHTML = `<div class="notice notice-${esc(tone)}" role="status">${esc(message)}</div>`;
  noticeTimer = setTimeout(() => {
    host.innerHTML = '';
  }, duration);
}

export async function refreshSession() {
  const data = await api.me();
  state.user = data.user;
}

export async function refreshProducts() {
  const data = await api.products();
  state.products = data.products;
  state.categories = data.categories;
}

export async function refreshSettings() {
  state.settings = await api.settings();
}

export function populateCategoryDatalist() {
  const list = document.querySelector('#kategori-list');
  if (!list) return;
  const categories = [...new Set(['Layanan', 'Perawatan Khusus', 'Perlengkapan', ...state.categories])];
  list.innerHTML = categories.map((category) => `<option value="${esc(category)}"></option>`).join('');
}
