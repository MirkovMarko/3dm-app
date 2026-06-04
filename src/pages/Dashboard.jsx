import React, { useState } from 'react'
import { fmt, ymNow } from '../calc.js'

export default function Dashboard({ data }) {
  const [ym, setYm] = useState(ymNow())
  const { narudzbe, troskovi, proizvodi } = data

  const nar = narudzbe.filter(n => (n.datum || '').startsWith(ym))
  const tro = troskovi.filter(t => (t.datum || '').startsWith(ym))

  const preuzete = nar.filter(n => n.status === 'Preuzeto')
  const prihod = preuzete.reduce((s, n) => s + Number(n.cena_lampe || 0), 0)
  const marza = preuzete.reduce((s, n) => s + (Number(n.cena_lampe || 0) - Number(n.cogs_snapshot || 0)), 0)

  const sum = (tip) => tro.filter(t => t.tip === tip).reduce((s, t) => s + Number(t.iznos || 0), 0)
  const reklame = sum('Reklama')
  const opex = reklame + sum('Shopify') + sum('Ostalo')
  const neto = marza - opex
  const nabavka = tro.filter(t => t.kategorija === 'Nabavka').reduce((s, t) => s + Number(t.iznos || 0), 0)

  const cnt = (st) => nar.filter(n => n.status === st).length
  const poslato = cnt('Poslato'), preuz = cnt('Preuzeto'), vrac = cnt('Vraćeno')
  const poslatoUkupno = poslato + preuz + vrac
  const dugKuriru = nar.filter(n => ['Poslato', 'Preuzeto', 'Vraćeno'].includes(n.status))
    .reduce((s, n) => s + Number(n.postarina || 0), 0)
  const roas = reklame ? (prihod / reklame) : null
  const cpa = preuz ? (reklame / preuz) : null
  const stopaVrac = poslatoUkupno ? (vrac / poslatoUkupno * 100) : null

  // profit po proizvodu
  const perProd = proizvodi.map(p => {
    const ns = nar.filter(n => n.proizvod_id === p.id)
    const pu = ns.filter(n => n.status === 'Preuzeto')
    return {
      naziv: p.naziv,
      kom: pu.length,
      prihod: pu.reduce((s, n) => s + Number(n.cena_lampe || 0), 0),
      profit: pu.reduce((s, n) => s + (Number(n.cena_lampe || 0) - Number(n.cogs_snapshot || 0)), 0),
    }
  }).filter(x => x.kom > 0).sort((a, b) => b.profit - a.profit)

  return (
    <div>
      <div className="section-h">
        <h2>Pregled</h2>
        <input type="month" value={ym} onChange={e => setYm(e.target.value)} style={{ width: 'auto' }} />
      </div>

      <div className="grid">
        <div className="kpi big"><div className="l">Neto profit</div>
          <div className={'v ' + (neto < 0 ? 'neg' : 'pos')}>{fmt(neto)}</div></div>
        <div className="kpi"><div className="l">Prihod (preuzeto)</div><div className="v">{fmt(prihod)}</div></div>
        <div className="kpi"><div className="l">Bruto marža</div><div className="v">{fmt(marza)}</div></div>
        <div className="kpi"><div className="l">Reklame</div><div className="v">{fmt(reklame)}</div></div>
        <div className="kpi"><div className="l">Dug kuriru</div><div className="v">{fmt(dugKuriru)}</div></div>
        <div className="kpi"><div className="l">ROAS</div><div className="v">{roas ? roas.toFixed(2) : '–'}</div></div>
        <div className="kpi"><div className="l">CPA (preuzeto)</div><div className="v">{cpa ? fmt(cpa) : '–'}</div></div>
        <div className="kpi"><div className="l">Stopa vraćanja</div>
          <div className={'v ' + (stopaVrac > 5 ? 'neg' : '')}>{stopaVrac != null ? stopaVrac.toFixed(1) + '%' : '–'}</div></div>
        <div className="kpi"><div className="l">Preuzeto / Poslato / Vraćeno</div>
          <div className="v" style={{ fontSize: 18 }}>{preuz} / {poslato} / {vrac}</div></div>
      </div>

      <div className="muted" style={{ margin: '10px 2px' }}>
        Investicija u materijal ovog meseca: <b style={{ color: 'var(--ink)' }}>{fmt(nabavka)}</b> (zaliha, ne oduzima profit)
      </div>

      <div className="section-h"><h2>Profit po proizvodu</h2></div>
      <div className="card">
        {perProd.length === 0 && <div className="empty">Nema preuzetih narudžbi ovog meseca.</div>}
        {perProd.map((x, i) => (
          <div className="li" key={i}>
            <div><div className="main">{x.naziv}</div><div className="meta">{x.kom} kom · prihod {fmt(x.prihod)}</div></div>
            <div className={'main ' + (x.profit < 0 ? 'alarm' : 'ok')}>{fmt(x.profit)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
