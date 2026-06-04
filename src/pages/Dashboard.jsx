import React, { useState } from 'react'
import { fmt, ymNow, MESEC_NAZIV } from '../calc.js'

// ---- mali SVG grafikoni (bez biblioteke) ----
function TrendChart({ rows }) {
  const W = 600, H = 220, PADL = 10, PADR = 10, PADT = 18, PADB = 30
  const innerW = W - PADL - PADR, innerH = H - PADT - PADB
  const maxV = Math.max(1, ...rows.map(r => Math.max(r.prihod, r.profit)))
  const n = rows.length
  const xAt = i => n <= 1 ? PADL + innerW / 2 : PADL + (i * innerW) / (n - 1)
  const yAt = v => PADT + innerH - (Math.max(0, v) / maxV) * innerH
  const line = key => rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(r[key]).toFixed(1)}`).join(' ')
  const area = `M${xAt(0).toFixed(1)},${(PADT + innerH).toFixed(1)} ` +
    rows.map((r, i) => `L${xAt(i).toFixed(1)},${yAt(r.prihod).toFixed(1)}`).join(' ') +
    ` L${xAt(n - 1).toFixed(1)},${(PADT + innerH).toFixed(1)} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0.5, 1].map((g, i) => (
        <line key={i} x1={PADL} x2={W - PADR} y1={PADT + innerH - g * innerH} y2={PADT + innerH - g * innerH}
          stroke="#ece7df" strokeWidth="1" />
      ))}
      <path d={area} fill="#ef6c2f" opacity="0.10" />
      <path d={line('prihod')} fill="none" stroke="#ef6c2f" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={line('profit')} fill="none" stroke="#1f9d6b" strokeWidth="2.5" strokeLinejoin="round" />
      {rows.map((r, i) => (
        <g key={i}>
          <circle cx={xAt(i)} cy={yAt(r.prihod)} r="3" fill="#ef6c2f" />
          <circle cx={xAt(i)} cy={yAt(r.profit)} r="3" fill="#1f9d6b" />
          <text x={xAt(i)} y={H - 9} textAnchor="middle" fontSize="13" fill="#928c83" fontFamily="Plus Jakarta Sans">{r.label}</text>
        </g>
      ))}
    </svg>
  )
}

function Bars({ items }) {
  const max = Math.max(1, ...items.map(i => Math.abs(i.value)))
  return (
    <div>
      {items.length === 0 && <div className="empty">Nema podataka.</div>}
      {items.map((it, i) => {
        const neg = it.value < 0
        const w = (Math.abs(it.value) / max) * 100
        return (
          <div key={i} style={{ padding: '9px 0', borderBottom: i < items.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>
              <span>{it.label}</span>
              <span className={neg ? 'alarm' : 'ok'}>{fmt(it.value)}</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: w + '%', height: '100%', background: neg ? 'var(--red)' : 'var(--accent)', borderRadius: 99 }} />
            </div>
            {it.sub && <div className="muted" style={{ marginTop: 4 }}>{it.sub}</div>}
          </div>
        )
      })}
    </div>
  )
}

function StatusBars({ preuz, poslato, vrac }) {
  const tot = Math.max(1, preuz + poslato + vrac)
  const items = [
    { l: 'Preuzeto', v: preuz, c: 'var(--green)' },
    { l: 'Poslato', v: poslato, c: '#e8a33d' },
    { l: 'Vraćeno', v: vrac, c: 'var(--red)' },
  ]
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--line)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>
            <span>{it.l}</span><span>{it.v}</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: (it.v / tot * 100) + '%', height: '100%', background: it.c, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

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
  const dugKuriru = nar.filter(n => ['Poslato', 'Preuzeto', 'Vraćeno'].includes(n.status)).reduce((s, n) => s + Number(n.postarina || 0), 0)
  const roas = reklame ? (prihod / reklame) : null
  const cpa = preuz ? (reklame / preuz) : null
  const stopaVrac = poslatoUkupno ? (vrac / poslatoUkupno * 100) : null

  // trend: 6 meseci do izabranog
  const [yy, mm] = ym.split('-').map(Number)
  const trendRows = []
  for (let k = 5; k >= 0; k--) {
    const d = new Date(yy, mm - 1 - k, 1)
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    const mn = narudzbe.filter(n => (n.datum || '').startsWith(key) && n.status === 'Preuzeto')
    const tn = troskovi.filter(t => (t.datum || '').startsWith(key))
    const pr = mn.reduce((s, n) => s + Number(n.cena_lampe || 0), 0)
    const mz = mn.reduce((s, n) => s + (Number(n.cena_lampe || 0) - Number(n.cogs_snapshot || 0)), 0)
    const op = tn.filter(t => ['Reklama', 'Shopify', 'Ostalo'].includes(t.tip)).reduce((s, t) => s + Number(t.iznos || 0), 0)
    trendRows.push({ label: MESEC_NAZIV[d.getMonth()], prihod: pr, profit: mz - op })
  }

  const perProd = proizvodi.map(p => {
    const pu = nar.filter(n => n.proizvod_id === p.id && n.status === 'Preuzeto')
    return {
      label: p.naziv, value: pu.reduce((s, n) => s + (Number(n.cena_lampe || 0) - Number(n.cogs_snapshot || 0)), 0),
      sub: pu.length + ' kom · prihod ' + fmt(pu.reduce((s, n) => s + Number(n.cena_lampe || 0), 0)),
    }
  }).filter(x => x.sub && nar.some(n => n.proizvod_id && proizvodi.find(p => p.naziv === x.label))).filter(x => x.value !== 0 || nar.find(n => proizvodi.find(p => p.id === n.proizvod_id && p.naziv === x.label)))
    .filter(x => nar.some(n => { const p = proizvodi.find(pp => pp.id === n.proizvod_id); return p && p.naziv === x.label && n.status === 'Preuzeto' }))
    .sort((a, b) => b.value - a.value)

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
          <div className="v" style={{ fontSize: 20 }}>{preuz} / {poslato} / {vrac}</div></div>
      </div>

      <div className="muted" style={{ margin: '12px 2px' }}>
        Investicija u materijal ovog meseca: <b style={{ color: 'var(--ink)' }}>{fmt(nabavka)}</b> (zaliha, ne oduzima profit)
      </div>

      <div className="section-h"><h2>Kretanje (6 meseci)</h2></div>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 6, fontSize: 12.5, fontWeight: 700 }}>
          <span style={{ color: 'var(--accent)' }}>● Prihod</span>
          <span style={{ color: 'var(--green)' }}>● Profit</span>
        </div>
        <TrendChart rows={trendRows} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginTop: 14 }}>
        <div>
          <div className="section-h"><h2 style={{ fontSize: 18 }}>Status paketa</h2></div>
          <div className="card" style={{ padding: 18 }}><StatusBars preuz={preuz} poslato={poslato} vrac={vrac} /></div>
        </div>
        <div>
          <div className="section-h"><h2 style={{ fontSize: 18 }}>Profit po proizvodu</h2></div>
          <div className="card" style={{ padding: 18 }}><Bars items={perProd} /></div>
        </div>
      </div>
    </div>
  )
}
