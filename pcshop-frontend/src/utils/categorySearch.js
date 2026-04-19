export const SLUG_ALIASES = {
  cpu:         ['procesor','procesoare','cpu','i3','i5','i7','i9','ryzen 3','ryzen 5','ryzen 7','ryzen 9','intel core','amd ryzen'],
  gpu:         ['placa video','placi video','gpu','geforce','radeon','rtx','gtx','nvidia','grafica','placa grafica'],
  ram:         ['ram','memorie','memorii','ddr4','ddr5','memorie ram'],
  motherboard: ['placa de baza','placi de baza','motherboard','mainboard','placa mama'],
  storage:     ['ssd','hdd','stocare','nvme','m.2','hard disk','hard','disc'],
  psu:         ['sursa','surse','psu','alimentator','alimentare'],
  case:        ['carcasa','carcase','tower','cabinet'],
  cooler:      ['cooler','coolere','racire','ventilator','aio'],
  monitor:     ['monitor','monitoare','ecran','display','144hz','4k','ips'],
  keyboard:    ['tastatura','tastaturi','keyboard','mecanica','membrana'],
  mouse:       ['mouse','mice','gaming mouse'],
  headset:     ['casti','headset','headphones','casca'],
}

export function detectSlug(query) {
  const q = query.toLowerCase().trim()
  for (const [slug, terms] of Object.entries(SLUG_ALIASES)) {
    if (slug === q) return slug
    if (terms.some(t => q === t || q.includes(t) || t.includes(q))) return slug
  }
  return null
}
