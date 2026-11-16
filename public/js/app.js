import { $, $$, esc, placeholderFor, roleLabel } from './utils.js';
import { api } from './api.js';
import { notify, refreshProducts, refreshSession, refreshSettings, state } from './store.js';
import * as catalogView from './catalog.js';
import * as dashboardView from './dashboard.js';
import * as ordersView from './orders.js';
import * as usersView from './users.js';
import * as authView from './auth.js';

const ROUTES = {
  katalog: {
    label: 'Katalog',
    view: '#view-katalog',
    roles: ['guest', 'buyer', 'seller', 'admin'],
    render: catalogView.render,
  },
  pesanan: {
    label: 'Pesanan',
    view: '#view-pesanan',
    roles: ['buyer', 'seller', 'admin'],
    render: ordersView.render,
  },
  dashboard: {
    label: 'Dashboard',
    view: '#view-dashboard',
    roles: ['seller', 'admin'],
    render: dashboardView.render,
  },
  pengguna: {
    label: 'Pengguna',
    view: '#view-pengguna',
    roles: ['admin'],
    render: usersView.render,
  },
  auth: {
    label: 'Masuk',
    view: '#view-auth',
    roles: ['guest'],
    render: authView.render,
  },
};

const currentRole = () => state.user?.role ?? 'guest';

function requestedRoute() {
  const raw = location.hash.replace(/^#\/?/, '').split('?')[0];
  return Object.hasOwn(ROUTES, raw) ? raw : 'katalog';
}

/** `#/auth?tab=daftar` membuka form pembuatan akun, selain itu form masuk. */
function requestedAuthTab() {
  const query = location.hash.split('?')[1] ?? '';
  return new URLSearchParams(query).get('tab') === 'daftar' ? 'register' : 'login';
}

function renderNav() {
  const role = currentRole();
  $('#nav').innerHTML = Object.entries(ROUTES)
    .filter(([key, route]) => key !== 'auth' && route.roles.includes(role))
    .map(
      ([key, route]) =>
        `<button type="button" data-route="${key}"${state.route === key ? ' aria-current="page"' : ''}>${route.label}</button>`,
    )
    .join('');
}

function renderAuthArea() {
  const area = $('#auth-area');

  if (state.user) {
    area.innerHTML = `
      <span class="chip">
        <strong>${esc(state.user.nama)}</strong>
        <span class="role role-${esc(state.user.role)}">${esc(roleLabel(state.user.role))}</span>
      </span>
      <button type="button" class="ghost" id="btn-logout">Keluar</button>`;
    $('#btn-logout').addEventListener('click', logout);
  } else {
    area.innerHTML = `
      <a class="ghost" href="#/auth">Masuk</a>
      <a class="primary cta" href="#/auth?tab=daftar">Daftar</a>`;
  }
}

function renderChrome() {
  renderNav();
  renderAuthArea();
}

async function applyRoute() {
  const key = requestedRoute();
  const route = ROUTES[key];
  const role = currentRole();

  if (!route.roles.includes(role)) {
    notify('Halaman itu tidak tersedia untuk peran Anda.', 'error', 3500);
    if (location.hash !== '#/katalog') {
      location.hash = '#/katalog';
      return;
    }
  }

  state.route = key;
  state.authTab = requestedAuthTab();
  $$('.view').forEach((view) => {
    view.hidden = true;
  });
  $(ROUTES[key].view).hidden = false;
  renderNav();

  try {
    await ROUTES[key].render();
  } catch (error) {
    notify(error.message, 'error', 6000);
  }
}

async function logout() {
  try {
    await api.logout();
  } catch {
    /* sesi tetap dihapus di klien */
  }
  state.user = null;
  notify('Anda sudah keluar.', 'info', 3000);
  location.hash = '#/katalog';
  renderChrome();
  await applyRoute();
}

function onNavClick(event) {
  const button = event.target.closest('button[data-route]');
  if (button) location.hash = `#/${button.dataset.route}`;
}

function onImageError(event) {
  const image = event.target;
  if (image instanceof HTMLImageElement && !image.dataset.fallback) {
    image.dataset.fallback = '1';
    image.src = placeholderFor(image.alt);
  }
}

async function boot() {
  document.addEventListener('error', onImageError, true);
  $('#nav').addEventListener('click', onNavClick);

  catalogView.init();
  dashboardView.init();
  ordersView.init();
  usersView.init();
  authView.init();

  try {
    await Promise.all([refreshSession(), refreshProducts(), refreshSettings()]);
  } catch (error) {
    notify(`Gagal memuat data: ${error.message}`, 'error', 8000);
  }

  renderChrome();
  await applyRoute();
}

window.addEventListener('hashchange', () => {
  applyRoute();
});

window.addEventListener('session:changed', async () => {
  try {
    await Promise.all([refreshProducts(), refreshSettings()]);
  } catch (error) {
    notify(error.message, 'error');
  }
  renderChrome();

  if (location.hash !== '#/katalog') {
    location.hash = '#/katalog';
  } else {
    await applyRoute();
  }
});

boot();
