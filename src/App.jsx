import React, { useState, useEffect, useCallback } from 'react'
import { supabase, configured } from './supabase.js'
import Dashboard from './pages/Dashboard.jsx'
import Narudzbe from './pages/Narudzbe.jsx'
import Proizvodi from './pages/Proizvodi.jsx'
import Materijali from './pages/Materijali.jsx'
import Troskovi from './pages/Troskovi.jsx'

const TABS = [
  { id: 'dash', label: 'Pregled', ic: '▣' },
  { id: 'nar', label: 'Narudžbe', ic: '▤' },
  { id: 'prod', label: 'Proizvodi', ic: '◈' },
  { id: 'mat', label: 'Lager', ic: '▦' },
  { id: 'tro', label: 'Troškovi', ic: '▽' },
]

export default function App() {
  const [tab, setTab] = useState('dash')
  const [data, setData] = useState({ proizvodi: [], materijali: [], recepti: [], narudzbe: [], troskovi: [] })
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = useCallback(async () => {
    if (!configured) { setLoading(false); return }
    setLoading(true)
    try {
      const [p, m, r, n, t] = await Promise.all([
        supabase.from('proizvodi').select('*').order('naziv'),
        supabase.from('materijali').select('*').order('naziv'),
        supabase.from('recepti').select('*'),
        supabase.from('narudzbe').select('*').order('datum', { ascending: false }),
        supabase.from('troskovi').select('*').order('datum', { ascending: false }),
      ])
      const e = p.error || m.error || r.error || n.error || t.error
      if (e) throw e
      setData({ proizvodi: p.data, materijali: m.data, recepti: r.data, narudzbe: n.data, troskovi: t.data })
      setErr(null)
    } catch (e) {
      setErr(e.message || String(e))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (!configured) {
    return (
      <div className="app">
        <div className="top"><div className="logo">3<b>DM</b></div></div>
        <div className="banner">
          Nije podešena veza sa bazom. Na Vercel-u (Settings → Environment Variables) dodaj:
          <br /><b>VITE_SUPABASE_URL</b> i <b>VITE_SUPABASE_ANON_KEY</b>, pa redeploy.
        </div>
      </div>
    )
  }

  const props = { data, reload: load, loading }

  return (
    <div className="app">
      <div className="top">
        <div className="logo">3<b>DM</b></div>
        <div className="sub">Operativni sistem</div>
      </div>

      {err && <div className="banner">Greška: {err}</div>}
      {loading && <div className="empty">Učitavam…</div>}

      {!loading && tab === 'dash' && <Dashboard {...props} />}
      {!loading && tab === 'nar' && <Narudzbe {...props} />}
      {!loading && tab === 'prod' && <Proizvodi {...props} />}
      {!loading && tab === 'mat' && <Materijali {...props} />}
      {!loading && tab === 'tro' && <Troskovi {...props} />}

      <nav className="tabs"><div className="row">
        {TABS.map(t => (
          <button key={t.id} className={'tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
            <span className="ic">{t.ic}</span>{t.label}
          </button>
        ))}
      </div></nav>
    </div>
  )
}
