const API_BASE = 'http://localhost:3001/api';

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
  register: (email, password, role, name, referral_code) =>
    api('POST', '/auth/register', { email, password, role, name, ...(referral_code ? { referral_code } : {}) }),
  login: (email, password) =>
    api('POST', '/auth/login', { email, password }),
  logout: () => { auth.clearToken(); auth.setUser(null); },
};

// Founders
const FoundersAPI = {
  saveProfile: (data) => api('POST', '/founders/profile', data, auth.getToken()),
  getProfile: () => api('GET', '/founders/profile', null, auth.getToken()),
};

// Listings
const ListingsAPI = {
  create: (data) => api('POST', '/listings', data, auth.getToken()),
  getAll: (filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return api('GET', '/listings' + (q ? '?' + q : ''));
  },
  search: (q) => api('GET', '/listings?search=' + encodeURIComponent(q)),
  getMine: () => api('GET', '/listings/me/listings', null, auth.getToken()),
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
  getPending: (status = 'pending') => api('GET', '/admin/listings?status=' + status, null, auth.getToken()),
  approve: (id) => api('PUT', '/admin/listings/' + id + '/approve', {}, auth.getToken()),
  reject: (id, reason) => api('PUT', '/admin/listings/' + id + '/reject', { reason }, auth.getToken()),
  feature: (id) => api('PUT', '/admin/listings/' + id + '/feature', {}, auth.getToken()),
  unfeature: (id) => api('PUT', '/admin/listings/' + id + '/unfeature', {}, auth.getToken()),
  getAnalytics: () => api('GET', '/admin/analytics', null, auth.getToken()),
};

// Providers — own profile (authenticated) + public view
const ProvidersAPI = {
  // Own profile management
  getMyProfile: () => api('GET', '/providers/profile', null, auth.getToken()),
  saveMyProfile: (data) => api('POST', '/providers/profile', data, auth.getToken()),
  // Public provider view (no auth)
  getProfile: (userId) => api('GET', '/providers/' + userId + '/profile'),
  getListings: (userId) => api('GET', '/providers/' + userId + '/listings'),
  getRatings: (userId) => api('GET', '/providers/' + userId + '/ratings'),
  submitRating: (userId, rating, comment, listingId) =>
    api('POST', '/providers/' + userId + '/rate', { rating, comment, listing_id: listingId }, auth.getToken()),
};

// Messages
const MessagesAPI = {
  send: (recipientId, body, listingId) =>
    api('POST', '/messages', { recipient_id: recipientId, body, listing_id: listingId }, auth.getToken()),
  getThreads: () => api('GET', '/messages', null, auth.getToken()),
  getThread: (otherUserId, listingId) =>
    api('GET', '/messages/thread?otherUserId=' + otherUserId + (listingId ? '&listingId=' + listingId : ''), null, auth.getToken()),
  getUnread: () => api('GET', '/messages/unread', null, auth.getToken()),
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
