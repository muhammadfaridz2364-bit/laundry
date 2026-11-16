async function request(path, { method = 'GET', body } = {}) {
  const options = {
    method,
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch {
    throw new Error('Tidak bisa menghubungi server.');
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error ?? 'Terjadi kesalahan.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  me: () => request('/auth/me'),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  products: (params = {}) => request(`/products?${new URLSearchParams(params)}`),
  createProduct: (payload) => request('/products', { method: 'POST', body: payload }),
  updateProduct: (id, payload) =>
    request(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteProduct: (id) => request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  orders: () => request('/orders'),
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  setOrderStatus: (id, status) =>
    request(`/orders/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } }),

  users: () => request('/users'),
  updateUser: (id, payload) =>
    request(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }),

  settings: () => request('/settings'),
  saveSettings: (payload) => request('/settings', { method: 'PUT', body: payload }),
};
