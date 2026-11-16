import { $, esc, formatDate, roleLabel } from './utils.js';
import { api } from './api.js';
import { notify, state } from './store.js';

const ROLES = ['admin', 'seller', 'buyer'];

export function init() {
  const body = $('#users-body');

  body.addEventListener('change', async (event) => {
    const select = event.target.closest('select[data-user-role]');
    if (!select) return;
    await updateUser(Number(select.dataset.userRole), { role: select.value });
  });

  body.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-toggle-user]');
    if (!button) return;
    await updateUser(Number(button.dataset.toggleUser), { aktif: button.dataset.aktif !== '1' });
  });
}

async function updateUser(id, payload) {
  try {
    await api.updateUser(id, payload);
    notify('Pengguna diperbarui.', 'success', 3000);
  } catch (error) {
    notify(error.message, 'error');
  }
  await render();
}

export async function render() {
  const { users } = await api.users();

  $('#users-body').innerHTML = users
    .map((user) => {
      const isSelf = user.id === state.user.id;
      const options = ROLES.map(
        (role) => `<option value="${role}"${user.role === role ? ' selected' : ''}>${roleLabel(role)}</option>`,
      ).join('');

      return `<tr>
        <td>
          <strong>${esc(user.nama)}</strong>
          <div class="muted">${esc(user.email)}</div>
        </td>
        <td>
          <select data-user-role="${user.id}" aria-label="Peran ${esc(user.nama)}"${isSelf ? ' disabled' : ''}>
            ${options}
          </select>
        </td>
        <td>${user.jumlahProduk ?? 0}</td>
        <td><span class="badge">${user.aktif ? 'Aktif' : 'Nonaktif'}</span></td>
        <td>${esc(formatDate(user.dibuatPada))}</td>
        <td>
          <button class="ghost" type="button" data-toggle-user="${user.id}" data-aktif="${user.aktif ? '1' : '0'}"${isSelf ? ' disabled' : ''}>
            ${user.aktif ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </td>
      </tr>`;
    })
    .join('');
}
