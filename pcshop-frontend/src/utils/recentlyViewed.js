const KEY = 'rv_products'
const MAX = 8

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function addRecentlyViewed(product) {
  const { id, name, price, old_price, image_url, category, stock } = product
  const entry = { id, name, price, old_price, image_url, category, stock }
  const list = getRecentlyViewed().filter(p => p.id !== id)
  list.unshift(entry)
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
}

export function clearRecentlyViewed() {
  localStorage.removeItem(KEY)
}
