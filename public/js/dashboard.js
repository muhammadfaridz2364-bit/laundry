import { $, esc, illustrationFor, isSafeUrl, renderMessage, rupiah } from './utils.js';
import { api } from './api.js';
import { notify, populateCategoryDatalist, refreshProducts, state } from './store.js';

const PLACEHOLDER_WA = '6200000000000';

let items = [];
let sellers = [];
let editingId = null;

export function init() {
  $('#btn-add').addEventListener('click', () => openForm(null));
  $('#product-cancel').addEventListener('click', () => $('#dlg-product').close());
  $('#form-product').addEventListener('input', updatePreview);
  $('#form-product').addEventListener('submit', saveProduct);
  $('#products-body').addEventListener('click', onRowAction);
  $('#wa-form').addEventListener('submit', saveWaNumber);
  $('#wa-template').addEventListener('input', updateWaPreview);
}

export async function render() {
  const isSeller = state.user.role === 'seller';
  const data = await api.products(isSeller ? { mine: '1' } : {});
  items = data.products;

  renderStats();
  renderTable();
  renderSettings();
  populateCategoryDatalist();

  if (state.user.role === 'admin') await loadSellers();
}

function renderStats() {
  $('#stat-total').textContent = items.length;
  $('#stat-stok').textContent = items.reduce((sum, product) => sum + product.stok, 0);
  $('#stat-kat').textContent = new Set(items.map((product) => product.kategori)).size;
}

function imageSrc(product) {
  return product.imageUrl && isSafeUrl(product.imageUrl) ? product.imageUrl : illustrationFor(product);
}

function renderTable() {
  const body = $('#products-body');
  if (!items.length) {
    body.innerHTML = '<tr><td colspan="7" class="muted">Belum ada produk. Tambahkan produk baru.</td></tr>';
    return;
  }

  body.innerHTML = items
    .map(
      (product) => `<tr>
        <td>
          <div class="name-cell">
            <img class="thumb" src="${esc(imageSrc(product))}" alt="${esc(product.nama)}" loading="lazy">
            <div>
              <strong>${esc(product.nama)}</strong>
              <div class="muted">${esc(product.deskripsi.slice(0, 60))}</div>
            </div>
          </div>
        </td>
        <td>${esc(product.penjual)}</td>
        <td>${esc(product.kategori)}</td>
        <td>${esc(rupiah(product.harga))}</td>
        <td>${product.stok}</td>
        <td>${product.unggulan ? 'Ya' : 'Tidak'}</td>
        <td>
          <div class="row-actions">
            <button class="ghost" type="button" data-act="edit" data-id="${esc(product.id)}">Ubah</button>
            <button class="danger" type="button" data-act="delete" data-id="${esc(product.id)}">Hapus</button>
          </div>
        </td>
      </tr>`,
    )
    .join('');
}

function renderSettings() {
  const panel = $('#shop-settings');
  const isAdmin = state.user.role === 'admin';
  panel.hidden = !isAdmin;
  if (!isAdmin) return;

  $('#wa-current').textContent = `Nomor aktif: +${state.settings.waNumber}`;
  $('#wa-number').value = state.settings.waNumber;
  $('#wa-template').value = state.settings.waTemplate;
  $('#wa-note').hidden = state.settings.waNumber !== PLACEHOLDER_WA;
  $('#wa-err').textContent = '';
  updateWaPreview();
}

async function loadSellers() {
  const data = await api.users();
  sellers = data.users
    .filter((user) => user.role === 'seller' && user.aktif)
    .map((user) => ({ id: user.id, nama: user.nama }));
}

function openForm(id) {
  if (state.user.role === 'admin' && sellers.length === 0) {
    notify('Belum ada penjual aktif. Buat akun penjual terlebih dahulu.', 'error');
    return;
  }

  editingId = id;
  const product = id ? items.find((item) => item.id === id) : null;
  const form = $('#form-product');
  form.reset();
  form.elements.sellerId.innerHTML = '';

  $('#dlg-product-title').textContent = product ? 'Ubah produk' : 'Tambah produk';
  $('#product-err').textContent = '';

  if (product) {
    form.elements.nama.value = product.nama;
    form.elements.kategori.value = product.kategori;
    form.elements.harga.value = product.harga;
    form.elements.stok.value = product.stok;
    form.elements.deskripsi.value = product.deskripsi;
    form.elements.imageUrl.value = product.imageUrl;
    form.elements.unggulan.checked = product.unggulan;
  } else if (state.filters.kategori) {
    form.elements.kategori.value = state.filters.kategori;
  }

  const sellerField = $('#seller-field');
  if (state.user.role === 'admin') {
    sellerField.hidden = false;
    form.elements.sellerId.innerHTML = sellers
      .map((seller) => `<option value="${seller.id}">${esc(seller.nama)}</option>`)
      .join('');
    form.elements.sellerId.value = String(product ? product.sellerId : sellers[0].id);
  } else {
    sellerField.hidden = true;
  }

  updatePreview();
  $('#dlg-product').showModal();
  form.elements.nama.focus();
}

function updatePreview() {
  const form = $('#form-product');
  const url = form.elements.imageUrl.value.trim();
  const nama = form.elements.nama.value.trim();
  const kategori = form.elements.kategori.value.trim();
  const preview = $('#product-preview');

  preview.alt = nama || 'Pratinjau';
  preview.src = url && isSafeUrl(url) ? url : illustrationFor({ nama, kategori });
}

async function saveProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const fields = form.elements;
  const payload = {
    nama: fields.nama.value.trim(),
    kategori: fields.kategori.value.trim(),
    harga: fields.harga.value,
    stok: fields.stok.value,
    deskripsi: fields.deskripsi.value.trim(),
    imageUrl: fields.imageUrl.value.trim(),
    unggulan: fields.unggulan.checked,
  };

  if (state.user.role === 'admin' && fields.sellerId.value) {
    payload.sellerId = Number(fields.sellerId.value);
  }

  try {
    const editing = Boolean(editingId);
    if (editing) await api.updateProduct(editingId, payload);
    else await api.createProduct(payload);

    $('#dlg-product').close();
    $('#product-err').textContent = '';
    editingId = null;
    notify(editing ? 'Produk diperbarui.' : 'Produk ditambahkan.', 'success', 3000);

    await refreshProducts();
    await render();
  } catch (error) {
    $('#product-err').textContent = error.message;
  }
}

async function onRowAction(event) {
  const button = event.target.closest('button[data-act]');
  if (!button) return;

  const product = items.find((item) => item.id === button.dataset.id);
  if (!product) return;

  if (button.dataset.act === 'edit') {
    openForm(product.id);
    return;
  }

  if (!window.confirm(`Hapus produk "${product.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;

  try {
    await api.deleteProduct(product.id);
    notify('Produk dihapus.', 'success', 3000);
    await refreshProducts();
    await render();
  } catch (error) {
    notify(error.message, 'error');
  }
}

const WA_PREVIEW_SAMPLE = {
  order: {
    toko: 'Laundry Zahra',
    produk: 'Cuci Setrika Reguler',
    jumlah: '2',
    total: 'Rp 14.000',
    kode: 'LZ-CONTOH01',
    catatan: 'Antar sore',
  },
  quick: {
    toko: 'Laundry Zahra',
    produk: 'Cuci Setrika Reguler',
    jumlah: '1',
    total: 'Rp 7.000',
    kode: '-',
    catatan: '-',
  },
};

function updateWaPreview() {
  // Dua konteks: pesanan lengkap dan tautan cepat katalog. Keduanya memakai
  // fungsi render yang sama dengan tautan WhatsApp asli.
  const raw = $('#wa-template').value;
  $('#wa-preview-order').textContent = renderMessage(raw, WA_PREVIEW_SAMPLE.order);
  $('#wa-preview-quick').textContent = renderMessage(raw, WA_PREVIEW_SAMPLE.quick);
}

async function saveWaNumber(event) {
  event.preventDefault();
  try {
    const result = await api.saveSettings({
      waNumber: $('#wa-number').value.trim(),
      waTemplate: $('#wa-template').value,
    });
    state.settings = { waNumber: result.waNumber, waTemplate: result.waTemplate };
    renderSettings();
    notify(`Pengaturan WhatsApp disimpan (+${result.waNumber}).`, 'success', 4000);
  } catch (error) {
    $('#wa-err').textContent = error.message;
  }
}
