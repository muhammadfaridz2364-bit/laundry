import { $, esc, formatDate, rupiah, statusLabel } from './utils.js';
import { api } from './api.js';
import { notify, state } from './store.js';

const STATUSES = [
  ['baru', 'Baru'],
  ['diproses', 'Diproses'],
  ['selesai', 'Selesai'],
  ['dibatalkan', 'Dibatalkan'],
];

const HINTS = {
  buyer: 'Pesanan yang Anda buat dari katalog.',
  seller: 'Pesanan masuk untuk produk Anda. Perbarui status setelah diproses.',
  admin: 'Seluruh pesanan dari semua penjual.',
};

export function init() {
  $('#orders-body').addEventListener('change', async (event) => {
    const select = event.target.closest('select[data-order-status]');
    if (!select) return;

    try {
      await api.setOrderStatus(Number(select.dataset.orderStatus), select.value);
      notify('Status pesanan diperbarui.', 'success', 3000);
    } catch (error) {
      notify(error.message, 'error');
    }
    await render();
  });
}

export async function render() {
  const role = state.user.role;
  const { orders } = await api.orders();

  $('#orders-hint').textContent = HINTS[role] ?? '';

  const columns = ['Kode', 'Produk'];
  if (role !== 'buyer') columns.push('Pembeli');
  if (role !== 'seller') columns.push('Penjual');
  columns.push('Jumlah', 'Total', 'Status', 'Tanggal');
  if (role !== 'buyer') columns.push('Aksi');

  $('#orders-head').innerHTML = `<tr>${columns
    .map((column) => `<th scope="col">${esc(column)}</th>`)
    .join('')}</tr>`;

  if (!orders.length) {
    $('#orders-body').innerHTML = `<tr><td colspan="${columns.length}" class="muted">Belum ada pesanan.</td></tr>`;
    return;
  }

  $('#orders-body').innerHTML = orders
    .map((order) => {
      const cells = [
        `<td><strong>${esc(order.kode)}</strong></td>`,
        `<td>${esc(order.namaProduk)}${order.catatan ? `<div class="muted">${esc(order.catatan)}</div>` : ''}</td>`,
      ];
      if (role !== 'buyer') cells.push(`<td>${esc(order.pembeli)}</td>`);
      if (role !== 'seller') cells.push(`<td>${esc(order.penjual)}</td>`);
      cells.push(`<td>${order.jumlah}</td>`, `<td>${esc(rupiah(order.total))}</td>`);
      cells.push(`<td><span class="status status-${esc(order.status)}">${esc(statusLabel(order.status))}</span></td>`);
      cells.push(`<td>${esc(formatDate(order.dibuatPada))}</td>`);

      if (role !== 'buyer') {
        const options = STATUSES.map(
          ([value, label]) => `<option value="${value}"${order.status === value ? ' selected' : ''}>${label}</option>`,
        ).join('');
        cells.push(
          `<td><select data-order-status="${order.id}" aria-label="Status pesanan ${esc(order.kode)}">${options}</select></td>`,
        );
      }

      return `<tr>${cells.join('')}</tr>`;
    })
    .join('');
}
