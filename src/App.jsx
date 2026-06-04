import React, { useState, useEffect, useCallback } from 'react'
import { supabase, configured } from './supabase.js'
import Dashboard from './pages/Dashboard.jsx'
import Narudzbe from './pages/Narudzbe.jsx'
import Proizvodi from './pages/Proizvodi.jsx'
import Materijali from './pages/Materijali.jsx'
import Troskovi from './pages/Troskovi.jsx'

const I = {
  dash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  nar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v5h5M8 13h8M8 17h6"/></svg>,
  prod: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7.5 12 3 3 7.5 12 12l9-4.5z"/><path d="M3 7.5v9L12 21l9-4.5v-9M12 12v9"/></svg>,
  mat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18M3 12h18M3 17h18"/><circle cx="7" cy="7" r="0.5"/></svg>,
  tro: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
}
const TABS = [
  { id: 'dash', label: 'Pregled' },
  { id: 'nar', label: 'Narudžbe' },
  { id: 'prod', label: 'Proizvodi' },
  { id: 'mat', label: 'Lager' },
  { id: 'tro', label: 'Troškovi' },
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
    } catch (e) { setErr(e.message || String(e)) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  if (!configured) {
    return (
      <div style={{ padding: 24, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <div className="banner">Nije podešena veza sa bazom. Na Vercel-u dodaj <b>VITE_SUPABASE_URL</b> i <b>VITE_SUPABASE_ANON_KEY</b>, pa redeploy.</div>
      </div>
    )
  }
  const props = { data, reload: load, loading }
  const Nav = ({ mobile }) => (
    <>
      {TABS.map(t => (
        <button key={t.id} className={'navit' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
          <span className="navic">{I[t.id]}</span>
          <span className="navlbl">{t.label}</span>
        </button>
      ))}
    </>
  )

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">3D</span><span className="brand-name">3DM</span></div>
        <div className="navgroup"><Nav /></div>
        <div className="side-foot">Operativni sistem · v1</div>
      </aside>

      <main className="content">
        {err && <div className="banner">Greška: {err}</div>}
        {loading && <div className="empty">Učitavam…</div>}
        {!loading && tab === 'dash' && <Dashboard {...props} />}
        {!loading && tab === 'nar' && <Narudzbe {...props} />}
        {!loading && tab === 'prod' && <Proizvodi {...props} />}
        {!loading && tab === 'mat' && <Materijali {...props} />}
        {!loading && tab === 'tro' && <Troskovi {...props} />}
      </main>

      <nav className="mobnav"><Nav mobile /></nav>
    </div>
  )
}
