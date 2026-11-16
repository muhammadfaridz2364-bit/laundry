import { $, esc, heroArt, illustrationFor, isSafeUrl, renderMessage, rupiah, SHOP_NAME } from './utils.js';
import { api } from './api.js';
import { notify, state } from './store.js';

let pending = null;

export function init() {
  $('#q').addEventListener('input', (event) => {
    state.filters.q = event.target.value;
    renderGrid();
  });

  $('#cat').addEventListener('change', (event) => {
    state.filters.kategori = event.target.value;
    renderGrid();
  });

  $('#sort').addEventListener('change', (event) => {
    state.filters.sort = event.target.value;
    renderGrid();
  });

  for (const selector of ['#grid', '#recommend-grid']) {
    $(selector).addEventListener('click', (event) => {
      const button = event.target.closest('button[data-order]');
      if (button) openOrder(button.dataset.order);
    });
  }

  $('#order-cancel').addEventListener('click', () => $('#dlg-order').close());
  $('#order-done').addEventListener('click', () => $('#dlg-order').close());
  $('#form-order').addEventListener('submit', submitOrder);
}

export function render() {
  $('#hero-art').innerHTML = heroArt();
  $('#catalog-demo-note').hidden = !state.productsUsingDemoData;
  renderCategories();
  renderGrid();
  renderRecommend();
}

function renderRecommend() {
  // Layanan didahulukan, lalu stok terbanyak sebagai gambaran produk yang
  // paling sering dipakai pelanggan.
  const categoryRank = { Layanan: 0, 'Perawatan Khusus': 1, Perlengkapan: 2 };
  const picks = state.products
    .filter((product) => product.unggulan && product.stok > 0)
    .sort(
      (a, b) =>
        (categoryRank[a.kategori] ?? 3) - (categoryRank[b.kategori] ?? 3) ||
        b.stok - a.stok ||
        a.nama.localeCompare(b.nama, 'id'),
    )
    .slice(0, 4);
  $('#recommend').hidden = picks.length === 0;
  $('#recommend-grid').innerHTML = picks.map(cardHTML).join('');
}

function visibleProducts() {
  const term = state.filters.q.trim().toLowerCase();
  const sorters = {
    'name-asc': (a, b) => a.nama.localeCompare(b.nama, 'id'),
    'price-asc': (a, b) => a.harga - b.harga || a.nama.localeCompare(b.nama, 'id'),
    'price-desc': (a, b) => b.harga - a.harga || a.nama.localeCompare(b.nama, 'id'),
    'stock-desc': (a, b) => b.stok - a.stok || a.nama.localeCompare(b.nama, 'id'),
  };

  return state.products
    .filter(
      (product) =>
        (!state.filters.kategori || product.kategori === state.filters.kategori) &&
        (!term ||
          product.nama.toLowerCase().includes(term) ||
          product.deskripsi.toLowerCase().includes(term)),
    )
    .sort(sorters[state.filters.sort] ?? sorters['name-asc']);
}

function renderCategories() {
  const categories = [...new Set(state.products.map((product) => product.kategori))].sort((a, b) =>
    a.localeCompare(b, 'id'),
  );

  if (state.filters.kategori && !categories.includes(state.filters.kategori)) {
    state.filters.kategori = '';
  }

  $('#cat').innerHTML =
    '<option value="">Semua kategori</option>' +
    categories.map((category) => `<option value="${esc(category)}">${esc(category)}</option>`).join('');
  $('#cat').value = state.filters.kategori;
  $('#sort').value = state.filters.sort;
}

function waLinkFor(product) {
  const text = renderMessage(state.settings.waTemplate, {
    toko: SHOP_NAME,
    produk: product.nama,
    jumlah: 1,
    total: rupiah(product.harga),
    kode: '-',
    catatan: '-',
  });
  return `https://wa.me/${state.settings.waNumber}?text=${encodeURIComponent(text)}`;
}

function cardHTML(product) {
  const habis = product.stok === 0;
  const image = product.imageUrl && isSafeUrl(product.imageUrl) ? product.imageUrl : illustrationFor(product);
  const role = state.user?.role;

  let action;
  if (state.productsUsingDemoData) {
    action = '<button class="primary" type="button" disabled>Contoh, belum bisa dipesan</button>';
  } else if (habis) {
    action = '<button class="primary" type="button" disabled>Stok habis</button>';
  } else if (role === 'buyer') {
    action = `<button class="primary" type="button" data-order="${esc(product.id)}">Pesan via WhatsApp</button>`;
  } else if (!state.user) {
    action = '<a class="primary" href="#/auth">Masuk untuk memesan</a>';
  } else {
    action = `<a class="primary" href="${esc(waLinkFor(product))}" target="_blank" rel="noopener noreferrer">Buka WhatsApp</a>`;
  }

  return `<article class="card">
    <img src="${esc(image)}" alt="${esc(product.nama)}" loading="lazy">
    <div class="body">
      <div>
        ${state.productsUsingDemoData ? '<span class="badge warn">Data contoh</span>' : ''}
        ${product.unggulan ? '<span class="badge">⭐ Unggulan</span>' : ''}
        <span class="badge ${habis ? 'warn' : ''}">${habis ? 'Stok habis' : `Stok: ${product.stok}`}</span>
      </div>
      <h3>${esc(product.nama)}</h3>
      <div class="muted">${esc(product.kategori)}</div>
      <p class="muted" style="margin:0">${esc(product.deskripsi)}</p>
      <div class="price">${esc(rupiah(product.harga))}</div>
      <div style="margin-top:auto">${action}</div>
    </div>
  </article>`;
}

function renderGrid() {
  const list = visibleProducts();
  $('#count').textContent = `Menampilkan ${list.length} dari ${state.products.length} produk`;
  $('#grid').innerHTML = list.map(cardHTML).join('');
  $('#empty').hidden = list.length > 0;
}

function openOrder(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  pending = product;
  const form = $('#form-order');
  form.hidden = false;
  $('#order-success').hidden = true;
  $('#dlg-order-title').textContent = `Pesan ${product.nama}`;
  $('#order-info').innerHTML = `<strong>${esc(product.nama)}</strong><br>${esc(rupiah(product.harga))} · stok ${product.stok}`;
  form.elements.jumlah.value = '1';
  form.elements.jumlah.max = String(product.stok);
  form.elements.catatan.value = '';
  $('#order-err').textContent = '';
  $('#dlg-order').showModal();
  form.elements.jumlah.focus();
}

async function submitOrder(event) {
  event.preventDefault();
  if (!pending) return;

  const form = event.currentTarget;
  const jumlah = Number(form.elements.jumlah.value);
  $('#order-err').textContent = '';

  try {
    const result = await api.createOrder({
      productId: pending.id,
      jumlah,
      catatan: form.elements.catatan.value.trim(),
    });

    // Tautan WhatsApp dibuka lewat klik pengguna agar tidak diblokir popup
    // dan halaman katalog tidak ikut berpindah.
    $('#order-success-text').innerHTML =
      `Kode <strong>${esc(result.order.kode)}</strong> · ${esc(result.order.namaProduk)} ×${result.order.jumlah} · ` +
      `${esc(rupiah(result.order.total))}. Buka WhatsApp untuk mengirim pesanan ke penjual.`;
    $('#order-wa').href = result.waUrl;

    form.hidden = true;
    $('#order-success').hidden = false;
    pending = null;
    notify(`Pesanan ${result.order.kode} dibuat.`, 'success');
  } catch (error) {
    $('#order-err').textContent = error.message;
  }
}
