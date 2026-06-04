import React, { useState } from 'react'
import { supabase } from '../supabase.js'
import { fmt } from '../calc.js'

const TIPOVI = ['Reklama', 'Shopify', 'Filament', 'Materijal', 'Ostalo']

export default function Troskovi({ data, reload }) {
  const { troskovi } = data
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const blank = { datum: new Date().toISOString().slice(0, 10), tip: 'Reklama', opis: '', iznos: '' }
  const [form, setForm] = useState(blank)

  async function dodaj() {
    if (!form.iznos) return
    setBusy(true)
    await supabase.from('troskovi').insert({ datum: form.datum, tip: form.tip, opis: form.opis || null, iznos: Number(form.iznos) })
    setBusy(false); setOpen(false); setForm(blank); reload()
  }
  async function obrisi(t) {
    if (!confirm('Obrisati trošak?')) return
    await supabase.from('troskovi').delete().eq('id', t.id); reload()
  }

  return (
    <div>
      <div className="section-h"><h2>Troškovi</h2>
        <button className="btn amber sm" onClick={() => setOpen(true)}>+ Dodaj</button></div>
      <div className="muted" style={{ margin: '0 2px 10px' }}>Filament i Materijal najlakše dodaj preko „+ nabavka" u Lageru — tamo digne i zalihu.</div>

      <div className="card">
        {troskovi.length === 0 && <div className="empty">Nema troškova.</div>}
        {troskovi.map(t => (
          <div className="li" key={t.id}>
            <div style={{ flex: 1 }}>
              <div className="main">{t.tip} · {fmt(t.iznos)}</div>
              <div className="meta">{t.datum} · {t.kategorija} · {t.opis || ''}</div>
            </div>
            <button className="x" onClick={() => obrisi(t)}>×</button>
          </div>
        ))}
      </div>

      {open && (
        <div className="mask" onClick={e => { if (e.target.className === 'mask') setOpen(false) }}>
          <div className="sheet">
            <h3>Nov trošak</h3>
            <div className="f2">
              <div><label>Datum</label><input type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })} /></div>
              <div><label>Tip</label><select value={form.tip} onChange={e => setForm({ ...form, tip: e.target.value })}>{TIPOVI.map(t => <option key={t}>{t}</option>)}</select></div>
            </div>
            <label>Opis</label>
            <input value={form.opis} onChange={e => setForm({ ...form, opis: e.target.value })} placeholder="FB kampanja Partizan" />
            <label>Iznos (din)</label>
            <input type="number" value={form.iznos} onChange={e => setForm({ ...form, iznos: e.target.value })} />
            <div className="actions">
              <button className="btn ghost" onClick={() => setOpen(false)}>Otkaži</button>
              <button className="btn amber" disabled={busy} onClick={dodaj}>{busy ? '...' : 'Sačuvaj'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
