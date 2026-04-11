import { create } from 'zustand'

// Store global pentru favorite (wishlist) — utilizat in Navbar pentru preview
const useFavoriteStore = create((set) => ({
  items: [],
  totalItems: 0,

  setFavorites: (items) => set({
    items,
    totalItems: items.length,
  }),

  clearFavorites: () => set({ items: [], totalItems: 0 }),
}))

export default useFavoriteStore
