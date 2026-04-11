import { create } from 'zustand'

// Store global pentru PC Builder — retine componentele selectate pe durata sesiunii
const useBuildStore = create((set) => ({
  components: {}, // { cpu: product, gpu: product, ... }

  // Adauga sau inlocuieste o componenta dupa cheie (ex: 'cpu', 'gpu')
  addComponent: (key, product) => set(state => ({
    components: { ...state.components, [key]: product },
  })),

  // Elimina o componenta din build
  removeComponent: (key) => set(state => {
    const next = { ...state.components }
    delete next[key]
    return { components: next }
  }),

  // Reseteaza complet build-ul curent
  clear: () => set({ components: {} }),
}))

export default useBuildStore
