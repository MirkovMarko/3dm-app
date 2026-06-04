import React, { useState } from 'react'
import { supabase } from '../supabase.js'
import { cogsProizvoda, fmt } from '../calc.js'

export default function Proizvodi({ data, reload }) {
  const { proizvodi, recepti, materijali } = data
  const [open, setOpen] = useState(null) // null | 'new' | proizvod
  const [naziv, setNaziv] = useState('')
  const [pers, setPers] = useState(false)
  const [rows, setRows] = useState([]) // {materijal_id, kolicina}
  const [busy, setBusy] = useState(false)

  function otvori(p) {
    if (p === 'new') { setNaziv(''); setPers(false); setRows([]); setOpen('new') }
    else {
      setNaziv(p.naziv); setPers(!!p.personalizovan)
      setRows(recepti.filter(r => r.proizvod_id === p.id).map(r => ({ materijal_id: r.materijal_id, kolicina: r.kolicina })))
      setOpen(p)
    }
  }

  async function sacuvaj() {
    if (!naziv) return
    setBusy(true)
    let pid
    if (open === 'new') {
      const { data: ins, error } = await supabase.from('proizvodi').insert({ naziv, personalizovan: pers }).select().single()
      if (error) { alert(error.message); setBusy(false); return }
      pid = ins.id
    } else {
      pid = open.id
      await supabase.from('proizvodi').update({ naziv, personalizovan: pers }).eq('id', pid)
      await supabase.from('recepti').delete().eq('proizvod_id', pid)
    }
    const valid = rows.filter(r => r.materijal_id && r.kolicina)
    if (valid.length) {
      await supabase.from('recepti').insert(valid.map(r => ({ proizvod_id: pid, materijal_id: Number(r.materijal_id), kolicina: Number(r.kolicina) })))
    }
    setBusy(false); setOpen(null); reload()
  }

  async function obrisi(p) {
    if (!confirm('Obrisati ' + p.naziv + '?')) return
    await supabase.from('proizvodi').delete().eq('id', p.id); reload()
  }

  const previewCogs = () => {
    let t = 0
    for (const r of rows) {
      const m = materijali.find(x => x.id === Number(r.materijal_id))
      if (m && r.kolicina) t += Number(r.kolicina) * Number(m.cena)
    }
    return t
  }

  return (
    <div>
      <div className="section-h"><h2>Proizvodi</h2>
        <button className="btn amber sm" onClick={() => otvori('new')}>+ Dodaj</button></div>

      <div className="card">
        {proizvodi.length === 0 && <div className="empty">Dodaj prvi proizvod i njegov recept.</div>}
        {proizvodi.map(p => (
          <div className="li" key={p.id}>
            <div onClick={() => otvori(p)} style={{ flex: 1, cursor: 'pointer' }}>
              <div className="main">{p.naziv} {p.personalizovan ? '✎' : ''}</div>
              <div className="meta">COGS {fmt(cogsProizvoda(p.id, recepti, materijali))} · gotovo na stanju: {p.gotovo_na_stanju || 0}</div>
            </div>
            <button className="btn sm ghost" onClick={() => otvori(p)}>Uredi</button>
          </div>
        ))}
      </div>

      {open && (
        <div className="mask" onClick={e => { if (e.target.className === 'mask') setOpen(null) }}>
          <div className="sheet">
            <h3>{open === 'new' ? 'Nov proizvod' : 'Uredi proizvod'}</h3>
            <label>Naziv</label>
            <input value={naziv} onChange={e => setNaziv(e.target.value)} placeholder="Lampa Partizan" />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none' }}>
              <input type="checkbox" checked={pers} onChange={e => setPers(e.target.checked)} style={{ width: 'auto' }} />
              Personalizovan (vraćen se NE reusuje)
            </label>

            <label style={{ marginTop: 14 }}>Recept (materijali + količina)</label>
            {rows.map((r, i) => (
              <div className="recipe-row" key={i}>
                <select value={r.materijal_id} onChange={e => { const c = [...rows]; c[i].materijal_id = e.target.value; setRows(c) }}>
                  <option value="">— materijal —</option>
                  {materijali.map(m => <option key={m.id} value={m.id}>{m.naziv} ({m.jedinica})</option>)}
                </select>
                <input type="number" value={r.kolicina} placeholder="kol." onChange={e => { const c = [...rows]; c[i].kolicina = e.target.value; setRows(c) }} />
                <button className="x" onClick={() => setRows(rows.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            <button className="add-link" onClick={() => setRows([...rows, { materijal_id: '', kolicina: '' }])}>+ dodaj materijal</button>

            <div className="muted" style={{ marginTop: 10 }}>COGS (procena): <b style={{ color: 'var(--amber)' }}>{fmt(previewCogs())}</b></div>

            <div className="actions">
              {open !== 'new' && <button className="btn ghost" onClick={() => obrisi(open)} style={{ color: 'var(--red)' }}>Obriši</button>}
              <button className="btn ghost" onClick={() => setOpen(null)}>Otkaži</button>
              <button className="btn amber" disabled={busy} onClick={sacuvaj}>{busy ? '...' : 'Sačuvaj'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
