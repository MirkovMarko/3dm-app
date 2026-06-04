// ---- pomocne racunice ----

// COGS proizvoda iz recepata + materijala (filament cena je po GRAMU)
export function cogsProizvoda(proizvodId, recepti, materijali) {
  const recs = recepti.filter(r => r.proizvod_id === proizvodId)
  let total = 0
  for (const r of recs) {
    const m = materijali.find(x => x.id === r.materijal_id)
    if (m) total += Number(r.kolicina) * Number(m.cena)
  }
  return total
}

export function fmt(n) {
  const v = Number(n || 0)
  return Math.round(v).toLocaleString('sr-RS') + ' din'
}

export function fmt2(n) {
  return (Number(n || 0)).toLocaleString('sr-RS', { maximumFractionDigits: 2 })
}

// prikaz stanja: filament u kg, ostalo kako jeste
export function prikazStanje(m) {
  if (m.vrsta === 'filament') return (Number(m.na_stanju) / 1000).toLocaleString('sr-RS', { maximumFractionDigits: 2 }) + ' kg'
  return Number(m.na_stanju).toLocaleString('sr-RS') + ' ' + m.jedinica
}

export const MESEC_NAZIV = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Avg','Sep','Okt','Nov','Dec']

export function ymNow() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}
