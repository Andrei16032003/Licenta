const BACKEND = 'http://127.0.0.1:8000'

// Returneaza URL-ul complet al imaginii.
// Daca URL-ul e deja absolut (http/https), il returneaza ca atare.
// Daca e relativ (upload local), adauga adresa backend-ului.
export function imgUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${BACKEND}${url}`
}
