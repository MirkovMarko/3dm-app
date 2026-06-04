import React, { useState } from 'react'
import { supabase } from '../supabase.js'
import { fmt, prikazStanje } from '../calc.js'

export default function Materijali({ data, reload }) {
  const { materijali } = data
  const [open, setOpen] = useState(null)
  const [restock, setRestock] = useState(null)
  const blank = { naziv: '', vrsta: 'filament', jedinica: 'g', cenaKg: '', cena: '', na_stanju: '', min_prag: '' }
  const [form, setForm] = useState(blank)
  const [rsKol, setRsKol] = useState('')
  const [rsIznos, setRsIznos] = useState('')
  const [busy, setBusy] = useState(false)

  function otvori(m) {
    if (m === 'new') { setForm(blank); setOpen('new') }
    else {
      setForm({
        naziv: m.naziv, vrsta: m.vrsta, jedinica: m.jedinica,
        cenaKg: m.vrsta === 'filament' ? Number(m.cena) * 1000 : '',
        cena: m.vrsta === 'filament' ? '' : Number(m.cena),
        na_stanju: m.vrsta === 'filament' ? Number(m.na_stanju) / 1000 : Number(m.na_stanju),
        min_prag: m.vrsta === 'filament' ? Number(m.min_prag) / 1000 : Number(m.min_prag),
      })
      setOpen(m)
    }
  }

  async function sacuvaj() {
    if (!form.naziv) return
    setBusy(true)
    const isFil = form.vrsta === 'filament'
    const rec = {
      naziv: form.naziv, vrsta: form.vrsta,
      jedinica: isFil ? 'g' : form.jedinica,
      cena: isFil ? Number(form.cenaKg || 0) / 1000 : Number(form.cena || 0),
      na_stanju: isFil ? Number(form.na_stanju || 0) * 1000 : Number(form.na_stanju || 0),
      min_prag: isFil ? Number(form.min_prag || 0) * 1000 : Number(form.min_prag || 0),
    }
    if (open === 'new') await supabase.from('materijali').insert(rec)
    else await supabase.from('materijali').update(rec).eq('id', open.id)
    setBusy(false); setOpen(null); reload()
  }

  async function obrisi(m) {
    if (!confirm('Obrisati ' + m.naziv + '?')) return
    await supabase.from('materijali').delete().eq('id', m.id); reload()
  }

  // nabavka: digne lager + upise trosak
  async function nabavi() {
    const m = restock
    const isFil = m.vrsta === 'filament'
    const dodato = isFil ? Number(rsKol || 0) * 1000 : Number(rsKol || 0) // kol u kg za filament
    setBusy(true)
    await supabase.from('materijali').update({ na_stanju: Number(m.na_stanju) + dodato }).eq('id', m.id)
    await supabase.from('troskovi').insert({
      datum: new Date().toISOString().slice(0, 10),
      tip: isFil ? 'Filament' : 'Materijal',
      opis: 'Nabavka: ' + m.naziv + ' (' + rsKol + (isFil ? ' kg' : ' ' + m.jedinica) + ')',
      iznos: Number(rsIznos || 0), materijal_id: m.id, kolicina: dodato,
    })
    setBusy(false); setRestock(null); setRsKol(''); setRsIznos(''); reload()
  }

  const low = materijali.filter(m => Number(m.na_stanju) <= Number(m.min_prag))

  return (
    <div>
      <div className="section-h"><h2>Lager</h2>
        <button className="btn amber sm" onClick={() => otvori('new')}>+ Dodaj</button></div>

      {low.length > 0 && (
        <div className="banner">⚠️ Naruči: {low.map(m => m.naziv).join(', ')}</div>
      )}

      <div className="card">
        {materijali.length === 0 && <div className="empty">Dodaj materijale (filament, USB, traka, kutija…).</div>}
        {materijali.map(m => {
          const lowItem = Number(m.na_stanju) <= Number(m.min_prag)
          return (
            <div className="li" key={m.id}>
              <div onClick={() => otvori(m)} style={{ flex: 1, cursor: 'pointer' }}>
                <div className="main">{m.naziv}</div>
                <div className="meta">{m.vrsta} · {m.vrsta === 'filament' ? (Number(m.cena) * 1000).toLocaleString('sr-RS') + ' din/kg' : fmt(m.cena) + '/' + m.jedinica}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={'main ' + (lowItem ? 'alarm' : 'ok')}>{prikazStanje(m)}</div>
                <button className="btn sm" style={{ marginTop: 4 }} onClick={() => { setRestock(m); setRsKol(''); setRsIznos('') }}>+ nabavka</button>
              </div>
            </div>
          )
        })}
      </div>

      {open && (
        <div className="mask" onClick={e => { if (e.target.className === 'mask') setOpen(null) }}>
          <div className="sheet">
            <h3>{open === 'new' ? 'Nov materijal' : 'Uredi materijal'}</h3>
            <label>Naziv</label>
            <input value={form.naziv} onChange={e => setForm({ ...form, naziv: e.target.value })} placeholder="PLA Crna / USB kabl" />
            <label>Vrsta</label>
            <select value={form.vrsta} onChange={e => setForm({ ...form, vrsta: e.target.value })}>
              <option value="filament">filament</option><option value="komponenta">komponenta</option>
            </select>
            {form.vrsta === 'filament' ? (
              <>
                <div className="f3">
                  <div><label>Cena din/kg</label><input type="number" value={form.cenaKg} onChange={e => setForm({ ...form, cenaKg: e.target.value })} placeholder="1900" /></div>
                  <div><label>Stanje (kg)</label><input type="number" value={form.na_stanju} onChange={e => setForm({ ...form, na_stanju: e.target.value })} /></div>
                  <div><label>Min (kg)</label><input type="number" value={form.min_prag} onChange={e => setForm({ ...form, min_prag: e.target.value })} placeholder="1" /></div>
                </div>
                <div className="muted" style={{ marginTop: 6 }}>Recept koristi grame; cena se interno deli na gram.</div>
              </>
            ) : (
              <>
                <label>Jedinica</label>
                <select value={form.jedinica} onChange={e => setForm({ ...form, jedinica: e.target.value })}>
                  <option value="kom">kom</option><option value="m">m</option>
                </select>
                <div className="f3">
                  <div><label>Cena/{form.jedinica}</label><input type="number" value={form.cena} onChange={e => setForm({ ...form, cena: e.target.value })} /></div>
                  <div><label>Stanje</label><input type="number" value={form.na_stanju} onChange={e => setForm({ ...form, na_stanju: e.target.value })} /></div>
                  <div><label>Min</label><input type="number" value={form.min_prag} onChange={e => setForm({ ...form, min_prag: e.target.value })} /></div>
                </div>
              </>
            )}
            <div className="actions">
              {open !== 'new' && <button className="btn ghost" onClick={() => obrisi(open)} style={{ color: 'var(--red)' }}>Obriši</button>}
              <button className="btn ghost" onClick={() => setOpen(null)}>Otkaži</button>
              <button className="btn amber" disabled={busy} onClick={sacuvaj}>{busy ? '...' : 'Sačuvaj'}</button>
            </div>
          </div>
        </div>
      )}

      {restock && (
        <div className="mask" onClick={e => { if (e.target.className === 'mask') setRestock(null) }}>
          <div className="sheet">
            <h3>Nabavka — {restock.naziv}</h3>
            <div className="muted">Digne lager i upiše trošak (nabavka).</div>
            <div className="f2">
              <div><label>Količina ({restock.vrsta === 'filament' ? 'kg' : restock.jedinica})</label><input type="number" value={rsKol} onChange={e => setRsKol(e.target.value)} /></div>
              <div><label>Iznos (din)</label><input type="number" value={rsIznos} onChange={e => setRsIznos(e.target.value)} /></div>
            </div>
            <div className="actions">
              <button className="btn ghost" onClick={() => setRestock(null)}>Otkaži</button>
              <button className="btn amber" disabled={busy} onClick={nabavi}>{busy ? '...' : 'Dodaj na lager'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
