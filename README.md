# 3DM — Operativni sistem (Faza 1)

React + Vite app povezan na Supabase. Narudžbe, proizvodi/recepti, lager (auto-skidanje), profit dashboard.

## Postavljanje (jednom)

1. **Baza** — u Supabase pusti `3dm_schema.sql` (već urađeno).
2. **GitHub** — napravi repo, ubaci ceo ovaj folder.
3. **Vercel** — New Project → import repo (Framework: Vite).
4. **Env varijable** (Vercel → Settings → Environment Variables):
   - `VITE_SUPABASE_URL` = Supabase → Settings → API → Project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase → Settings → API → anon public key
5. Redeploy.

## Lokalno
```
npm install
cp .env.example .env   # popuni svoje vrednosti
npm run dev
```

## Kako se koristi
- **Lager** → prvo dodaj materijale (filament din/kg, USB, traka, kutija). „+ nabavka" diže zalihu i upisuje trošak.
- **Proizvodi** → dodaj proizvod + recept (materijal + količina). COGS se računa sam.
- **Narudžbe** → „+ Dodaj" (ručno, npr. Instagram). Status „Poslato" skida lager po receptu (ili uzima iz gotovih ako ima vraćenih). „Preuzeto" knjiži prihod. „Vraćeno" vraća sklopljenu lampu na stanje (ako nije personalizovana).
- **Pregled** → izaberi mesec: neto profit, ROAS, CPA, dug kuriru, profit po proizvodu.

Shopify i Facebook auto-povlačenje dolaze u Fazi 3.
