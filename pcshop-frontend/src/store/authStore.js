import { create } from 'zustand'

// Store global pentru autentificare — starea este hidratata din localStorage la pornire
const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  // Salveaza token-ul si datele userului dupa autentificare reusita
  login: (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    set({ user: userData, token, isAuthenticated: true })
  },

  // Sterge datele din localStorage si reseteaza starea
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

export default useAuthStore