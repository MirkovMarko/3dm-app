import React, { useState } from 'react'
import { supabase } from '../supabase.js'
import { cogsProizvoda, fmt } from '../calc.js'

const STATUSI = ['Nova', 'Poslato', 'Preuzeto', 'Vraćeno']
const IZVORI = ['Shopify', 'Instagram', 'Facebook', 'Ostalo']
const chipCls = { Nova: 'nova', Poslato: 'poslato', Preuzeto: 'preuzeto', 'Vraćeno': 'vraceno' }

export default function Narudzbe({ data, reload }) {
  const { narudzbe, proizvodi, recepti, materijali } = data
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const blank = { broj: '', datum: new Date().toISOString().slice(0, 10), izvor: 'Shopify', kupac: '', proizvod_id: '', naplaceno: '', postarina: 390 }
  const [form, setForm] = useState(blank)

  const prodName = (id) => (proizvodi.find(p => p.id === id) || {}).naziv || '—'

  async function dodaj() {
    if (!form.proizvod_id || !form.naplaceno) return
    setBusy(true)
    await supabase.from('narudzbe').insert({
      broj: form.broj || null, datum: form.datum, izvor: form.izvor, kupac: form.kupac || null,
      proizvod_id: Number(form.proizvod_id), naplaceno: Number(form.naplaceno), postarina: Number(form.postarina || 0),
      status: 'Nova',
    })
    setBusy(false); setOpen(false); setForm(blank); reload()
  }

  async function promeniStatus(n, novi) {
    if (novi === n.status) return
    const prod = proizvodi.find(p => p.id === n.proizvod_id)
    const shipped = ['Poslato', 'Preuzeto', 'Vraćeno']

    // NOVA -> POSLATO : skini lager ili uzmi iz zalihe
    if (novi === 'Poslato' && n.status === 'Nova') {
      if (prod && prod.gotovo_na_stanju > 0) {
        await supabase.from('proizvodi').update({ gotovo_na_stanju: prod.gotovo_na_stanju - 1 }).eq('id', prod.id)
        await supabase.from('narudzbe').update({ status: novi, iz_zalihe: true, cogs_snapshot: 0 }).eq('id', n.id)
      } else {
        const recs = recepti.filter(r => r.proizvod_id === n.proizvod_id)
        for (const r of recs) {
          const m = materijali.find(x => x.id === r.materijal_id)
          if (m) await supabase.from('materijali').update({ na_stanju: Number(m.na_stanju) - Number(r.kolicina) }).eq('id', m.id)
        }
        const cogs = cogsProizvoda(n.proizvod_id, recepti, materijali)
        await supabase.from('narudzbe').update({ status: novi, iz_zalihe: false, cogs_snapshot: cogs }).eq('id', n.id)
      }
    }
    // -> VRACENO : sklopljena lampa nazad na stanje (ako nije personalizovana)
    else if (novi === 'Vraćeno' && shipped.includes(n.status)) {
      if (prod && !prod.personalizovan) {
        await supabase.from('proizvodi').update({ gotovo_na_stanju: (prod.gotovo_na_stanju || 0) + 1 }).eq('id', prod.id)
      }
      await supabase.from('narudzbe').update({ status: novi }).eq('id', n.id)
    }
    else {
      await supabase.from('narudzbe').update({ status: novi }).eq('id', n.id)
    }
    reload()
  }

  return (
    <div>
      <div className="section-h">
        <h2>Narudžbe</h2>
        <button className="btn amber sm" onClick={() => setOpen(true)}>+ Dodaj</button>
      </div>

      <div className="card">
        {narudzbe.length === 0 && <div className="empty">Još nema narudžbi. Klikni „+ Dodaj".</div>}
        {narudzbe.map(n => {
          const cena = Number(n.naplaceno || 0) - Number(n.postarina || 0)
          const profit = n.status === 'Preuzeto' ? cena - Number(n.cogs_snapshot || 0) : null
          return (
            <div className="li" key={n.id}>
              <div style={{ flex: 1 }}>
                <div className="main">{n.broj || '—'} · {prodName(n.proizvod_id)} {n.iz_zalihe ? '♻︎' : ''}</div>
                <div className="meta">{n.datum} · {n.izvor} · {n.kupac || ''} · lampa {fmt(cena)}{profit != null ? ' · profit ' + fmt(profit) : ''}</div>
              </div>
              <select value={n.status} onChange={e => promeniStatus(n, e.target.value)} style={{ width: 'auto' }}>
                {STATUSI.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          )
        })}
      </div>

      {open && (
        <div className="mask" onClick={e => { if (e.target.className === 'mask') setOpen(false) }}>
          <div className="sheet">
            <h3>Nova narudžba</h3>
            <div className="f2">
              <div><label>Broj</label><input value={form.broj} onChange={e => setForm({ ...form, broj: e.target.value })} placeholder="#1398 / IG-02" /></div>
              <div><label>Datum</label><input type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })} /></div>
            </div>
            <label>Izvor</label>
            <select value={form.izvor} onChange={e => setForm({ ...form, izvor: e.target.value })}>{IZVORI.map(i => <option key={i}>{i}</option>)}</select>
            <label>Kupac (ime/prezime)</label>
            <input value={form.kupac} onChange={e => setForm({ ...form, kupac: e.target.value })} />
            <label>Proizvod</label>
            <select value={form.proizvod_id} onChange={e => setForm({ ...form, proizvod_id: e.target.value })}>
              <option value="">— izaberi —</option>
              {proizvodi.map(p => <option key={p.id} value={p.id}>{p.naziv}</option>)}
            </select>
            <div className="f2">
              <div><label>Naplaćeno (sa pošt.)</label><input type="number" value={form.naplaceno} onChange={e => setForm({ ...form, naplaceno: e.target.value })} placeholder="2890" /></div>
              <div><label>Poštarina</label><input type="number" value={form.postarina} onChange={e => setForm({ ...form, postarina: e.target.value })} /></div>
            </div>
            <div className="muted" style={{ marginTop: 8 }}>Cena lampe = {fmt((Number(form.naplaceno || 0)) - Number(form.postarina || 0))}</div>
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
