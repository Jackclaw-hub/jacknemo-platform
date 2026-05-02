const API_BASE = window.location.origin + "/api";

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
  // K-80: Change password (authenticated)
  changePassword: (current_password, new_password) =>
    api('POST', '/auth/change-password', { current_password, new_password }, auth.getToken()),
};

// Founders
const FoundersAPI = {
  getFeed: () => api('GET', '/founders/feed', null, auth.getToken()),
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
  contact: (id, message, subject) => api('POST', '/listings/' + id + '/contact', { message, subject }, auth.getToken()),
  publish: (id) => api('PATCH', '/listings/' + id + '/publish', {}, auth.getToken()),
  pause: (id) => api('PATCH', '/listings/' + id + '/pause', {}, auth.getToken()),
  resume: (id) => api('PATCH', '/listings/' + id + '/resume', {}, auth.getToken()),
  renew: (id) => api('PATCH', '/listings/' + id + '/renew', {}, auth.getToken()),
  duplicate: (id) => api('POST', '/listings/' + id + '/duplicate', {}, auth.getToken()),
};

// K-50: Notifications
const NotificationsAPI = {
  getAll: () => api('GET', '/notifications', null, auth.getToken()),
  markAllRead: () => api('PATCH', '/notifications/read-all', {}, auth.getToken()),
  markRead: (id) => api('PATCH', '/notifications/' + id + '/read', {}, auth.getToken()),
};

// K-48: Bookmarks
const BookmarksAPI = {
  save: (listing_id) => api('POST', '/founders/bookmarks', { listing_id }, auth.getToken()),
  getAll: () => api('GET', '/founders/bookmarks', null, auth.getToken()),
  remove: (listing_id) => api('DELETE', '/founders/bookmarks/' + listing_id, null, auth.getToken()),
  assignCollection: (listing_id, collection_id) => api('PATCH', '/founders/bookmarks/' + listing_id + '/collection', { collection_id }, auth.getToken()),
};

// K-158: Bookmark collections
const CollectionsAPI = {
  getAll: () => api('GET', '/founders/collections', null, auth.getToken()),
  create: (name) => api('POST', '/founders/collections', { name }, auth.getToken()),
};

// K-161: Recently viewed listings
const RecentViewsAPI = {
  record: (listing_id, title, type) => api('POST', '/founders/recently-viewed', { listing_id, title, type }, auth.getToken()),
  getAll: () => api('GET', '/founders/recently-viewed', null, auth.getToken()),
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
  getListings: (filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return api('GET', '/admin/listings' + (q ? '?' + q : ''), null, auth.getToken());
  },
  approve: (id) => api('PUT', '/admin/listings/' + id + '/approve', {}, auth.getToken()),
  reject: (id, reason) => api('PUT', '/admin/listings/' + id + '/reject', { reason }, auth.getToken()),
  feature: (id) => api('PUT', '/admin/listings/' + id + '/feature', {}, auth.getToken()),
  unfeature: (id) => api('PUT', '/admin/listings/' + id + '/unfeature', {}, auth.getToken()),
  bulkAction: (ids, action, reason) => api('POST', '/admin/listings/bulk-action', { ids, action, reason }, auth.getToken()),
  getAnalytics: () => api('GET', '/admin/analytics', null, auth.getToken()),
  // K-65: User management
  getUsers: (filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return api('GET', '/admin/users' + (q ? '?' + q : ''), null, auth.getToken());
  },
  disableUser: (id) => api('PATCH', '/admin/users/' + id + '/disable', {}, auth.getToken()),
  enableUser: (id) => api('PATCH', '/admin/users/' + id + '/enable', {}, auth.getToken()),
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
  // K-164: Availability
  saveAvailability: (blocked, lead_time_days) =>
    api('POST', '/providers/availability', { blocked, lead_time_days }, auth.getToken()),
  getAvailability: (userId) =>
    api('GET', '/providers/' + userId + '/availability'),
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

// K-68: Message templates
const TemplatesAPI = {
  getAll: () => api('GET', '/providers/templates', null, auth.getToken()),
  create: (name, body) => api('POST', '/providers/templates', { name, body }, auth.getToken()),
  delete: (id) => api('DELETE', '/providers/templates/' + id, null, auth.getToken()),
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
