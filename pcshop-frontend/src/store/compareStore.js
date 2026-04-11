import { create } from 'zustand'

// Preia cheia categoriei din produs; folosita pentru a restrictiona comparatia la o singura categorie
const getCatKey = (product) => product.category_slug || product.category || null

// Store global pentru comparare produse — maxim 3 produse din aceeasi categorie
const useCompareStore = create((set) => ({
  items: [],
  categorySlug: null,

  // Adauga un produs la comparare; ignora duplicatele, limita de 3 si categorii diferite
  add: (product) => set(state => {
    if (state.items.find(p => p.id === product.id)) return state
    if (state.items.length >= 3) return state
    const catKey = getCatKey(product)
    if (state.categorySlug && catKey !== state.categorySlug) return state
    return {
      items: [...state.items, product],
      categorySlug: state.categorySlug || catKey,
    }
  }),

  remove: (productId) => set(state => {
    const newItems = state.items.filter(p => p.id !== productId)
    return { items: newItems, categorySlug: newItems.length === 0 ? null : state.categorySlug }
  }),

  clear: () => set({ items: [], categorySlug: null }),
}))

export default useCompareStore
