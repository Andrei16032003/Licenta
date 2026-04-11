import { create } from 'zustand'

// Store global pentru cosul de cumparaturi — sincronizat cu raspunsul API dupa fiecare operatie
const useCartStore = create((set) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,

  // Suprascrie tot cosul cu datele primite de la server
  setCart: (cartData) => set({
    items: cartData.items,
    totalItems: cartData.total_items,
    totalPrice: cartData.total_price,
  }),

  // Goleste cosul local (fara request API)
  clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
}))

export default useCartStore