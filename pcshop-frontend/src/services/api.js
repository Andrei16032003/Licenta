import axios from 'axios'
import useAuthStore from '../store/authStore'

// Instanta axios cu baza URL-ului backend
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

// Adauga token-ul JWT din localStorage la fiecare request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// La raspuns 401 (token expirat/invalid), reseteaza starea Zustand si redirecteaza la login
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Grupuri de endpoint-uri ───────────────────────────────────

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
}

export const productsAPI = {
  getAll: (params) => API.get('/products/', { params }),
  getById: (id) => API.get(`/products/${id}`),
  getCategories: () => API.get('/products/categories/all'),
  getFilters: (categorySlug) => API.get(`/products/categories/${categorySlug}/filters`),
  seedFilters: () => API.post('/products/admin/seed-filters'),
}

export const cartAPI = {
  get: (userId) => API.get(`/cart/${userId}`),
  add: (data) => API.post('/cart/', data),
  update: (itemId, data) => API.put(`/cart/${itemId}`, data),
  remove: (itemId) => API.delete(`/cart/${itemId}`),
  clear: (userId) => API.delete(`/cart/clear/${userId}`),
}

export const ordersAPI = {
  create: (data) => API.post('/orders/', data),
  getUserOrders: (userId) => API.get(`/orders/user/${userId}`),
  getById: (id) => API.get(`/orders/${id}`),
  getAll: () => API.get('/orders/admin/all'),
  updateStatus: (orderId, status) => API.put(`/orders/${orderId}/status?status=${status}`),
  payCard: (orderId, cardData) => API.post(`/orders/${orderId}/pay-card`, cardData),
  confirmTransfer: (orderId) => API.post(`/orders/${orderId}/confirm-transfer`),
  getInvoice: (orderId) => API.get(`/orders/${orderId}/invoice`),
  updateTracking: (id, tracking) => API.patch('/orders/' + id + '/tracking', { tracking_number: tracking }),
  revenueTimeline:  (period = 'day') => API.get(`/orders/marketing/revenue-timeline?period=${period}`),
  clientSegments:   ()               => API.get('/orders/marketing/client-segments'),
}

export const reviewsAPI = {
  getByProduct: (productId) => API.get(`/reviews/product/${productId}`),
  add: (data) => API.post('/reviews/', data),
  getAll: () => API.get('/reviews/admin/all'),
  approve: (id, isVerified = false) => API.put(`/reviews/${id}/approve`, { is_verified: isVerified }),
  reject: (id, reason) => API.put(`/reviews/${id}/reject`, { reason }),
  remove: (id) => API.delete(`/reviews/${id}`),
}

export const profileAPI = {
  getAddresses: (userId) => API.get(`/profile/${userId}/addresses`),
  addAddress: (userId, data) => API.post(`/profile/${userId}/addresses`, data),
  deleteAddress: (userId, addressId) => API.delete(`/profile/${userId}/addresses/${addressId}`),
  getPaymentMethods: (userId) => API.get(`/profile/${userId}/payment-methods`),
  addPaymentMethod: (userId, data) => API.post(`/profile/${userId}/payment-methods`, data),
}

export const wishlistAPI = {
  get: (userId) => API.get(`/wishlist/${userId}`),
  add: (data) => API.post('/wishlist/', data),
  remove: (userId, productId) => API.delete(`/wishlist/${userId}/${productId}`),
}

export const retururiAPI = {
  get: (userId) => API.get(`/retururi/user/${userId}`),
  create: (data) => API.post('/retururi', data),
  getAll: () => API.get('/retururi/admin/all'),
  updateStatus: (id, status) => API.patch('/retururi/' + id + '/status', { status }),
  setPriority: (id, priority) => API.patch('/retururi/' + id + '/priority', { priority }),
}

export const serviceAPI = {
  get: (userId) => API.get(`/service/user/${userId}`),
  create: (data) => API.post('/service', data),
  getAll: () => API.get('/service/admin/all'),
  updateStatus: (id, status) => API.patch('/service/' + id + '/status', { status }),
  setPriority: (id, priority) => API.patch('/service/' + id + '/priority', { priority }),
}

export const productsAdminAPI = {
  update:          (id, data)      => API.put(`/products/${id}`, data),
  delete:          (id)            => API.delete(`/products/${id}`),
  toggleFeatured:  (id)            => API.put(`/products/${id}/featured`),
  getImages:       (id)            => API.get(`/products/${id}/images`),
  uploadImage:     (id, formData)  => API.post(`/products/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage:     (imageId)       => API.delete(`/products/images/${imageId}`),
  marketingStats:  ()              => API.get('/products/marketing/stats'),
  applyDiscount:   (id, data)      => API.put(`/products/${id}/discount`, data),
  removeDiscount:  (id)            => API.delete(`/products/${id}/discount`),
}

export const vouchersAPI = {
  getMy:    (userId) => API.get(`/vouchers/my/${userId}`),
  claim:    (data)   => API.post('/vouchers/claim', data),
  validate: (data)   => API.post('/vouchers/validate', data),
  adminAll:    ()          => API.get('/vouchers/admin/all'),
  adminCreate: (data)      => API.post('/vouchers/admin/create', data),
  adminUpdate: (id, data)  => API.put(`/vouchers/admin/${id}`, data),
  adminDelete: (id)        => API.delete(`/vouchers/admin/${id}`),
  adminAssign: (data)      => API.post('/vouchers/admin/assign', data),
}

export const configuratorAPI = {
  check: (data) => API.post('/configurator/check', data),
  save: (data) => API.post('/configurator/save', data),
  addToCart: (data) => API.post('/configurator/add-to-cart', data),
}


export const chatAPI = {
  suggest: (data) => API.post('/chat/suggest', data),
  message: (data) => API.post('/chat/message', data),
  minPrice: () => API.get('/chat/min-price'),
}
export const teamAPI = {
  list:   ()          => API.get('/team/'),
  create: (data)      => API.post('/team/', data),
  update: (id, data)  => API.put(`/team/${id}`, data),
  remove: (id)        => API.delete(`/team/${id}`),
}

export const supportAPI = {
  getNotes:  (entityType, entityId) => API.get(`/support/notes/${entityType}/${entityId}`),
  addNote:   (data)                 => API.post('/support/notes', data),
}

export const clientsAPI = {
  history: (userId) => API.get(`/auth/clients/${userId}/history`),
}

export const contactAPI = {
  send:        (data)   => API.post('/contact/send', data),
  getMessages: ()       => API.get('/contact/messages'),
  resolve:     (id)     => API.patch(`/contact/messages/${id}/resolve`),
  addNote:     (id, data) => API.post(`/contact/messages/${id}/notes`, data),
}

export default API