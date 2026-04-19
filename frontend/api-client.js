const API_BASE = 'http://localhost:3001/api';

// Token management
const auth = {
  getToken: () => localStorage.getItem('access_token'),
  setToken: (t) => localStorage.setItem('access_token', t),
  clearToken: () => localStorage.removeItem('access_token'),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  setUser: (u) => localStorage.setItem('user', JSON.stringify(u)),
};

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || data.message || 'Request failed'), { status: res.status, data });
  return data;
}

// Auth
const AuthAPI = {
  register: (email, password, role, name) =>
    api('POST', '/auth/register', { email, password, role, name }),
  login: (email, password) =>
    api('POST', '/auth/login', { email, password }),
  logout: () => { auth.clearToken(); auth.setUser(null); },
};

// Listings
const ListingsAPI = {
  create: (data) => api('POST', '/listings', data, auth.getToken()),
  getAll: (filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return api('GET', '/listings' + (q ? '?' + q : ''));
  },
  getById: (id) => api('GET', '/listings/' + id),
  update: (id, data) => api('PUT', '/listings/' + id, data, auth.getToken()),
  delete: (id) => api('DELETE', '/listings/' + id, null, auth.getToken()),
};

// Radar
const RadarAPI = {
  getResults: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api('GET', '/radar' + (q ? '?' + q : ''), null, auth.getToken());
  },
};

// Admin
const AdminAPI = {
  getPending: () => api('GET', '/admin/listings/pending', null, auth.getToken()),
  approve: (id) => api('PUT', '/admin/listings/' + id + '/approve', {}, auth.getToken()),
  reject: (id, reason) => api('PUT', '/admin/listings/' + id + '/reject', { reason }, auth.getToken()),
};

// Helpers
function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}
function showSuccess(el, msg) {
  el.textContent = msg;
  el.style.color = 'green';
  el.style.display = 'block';
}
function redirectIfNotLoggedIn() {
  if (!auth.getToken()) window.location.href = 'auth.html';
}
