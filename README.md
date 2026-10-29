# Daily Balaji — dailybalaji.com

Grocery / dairy e-commerce + full admin back office for **Balaji Agencies**, Shenoy Nagar, Chennai.

Next.js 15 (App Router) · React 19 · Tailwind · Prisma 6 + Neon Postgres · Vercel Blob · Razorpay · Gmail SMTP

## What's inside

**Storefront (mobile-first)**
- Home with categories, featured products, B2B signup CTA
- Shop with search, category filter, sorting, pagination · Product pages with gallery
- Cart (persists on device) · Checkout with Razorpay / Cash-UPI on delivery / Bank transfer
- Business checkout: GSTIN + company → GST tax invoice
- Customer accounts: register, login, OTP-to-email password reset, profile, order tracking, invoices
- WhatsApp floating button, About / Contact / Terms / Privacy pages

**Admin panel `/admin`** (works on phone)
- Dashboard: pending orders, sales, unpaid bills, low stock
- Orders: status flow (Pending → Confirmed → Packed → Shipped → Delivered / Cancelled) with customer emails, payment status, one-click GST or non-GST invoice from an order
- Billing: new GST tax invoice / non-GST bill of supply, customer search or add-on-the-spot, product search with engine prices, CGST/SGST or IGST auto by state, round-off, amount in words, print / save PDF / share
- Products: photos from phone camera, HSN, unit/pack, **pricing engine** with live preview, per-product margin or manual override, featured/hidden
- Categories · Vendors (dealers, saved once) · Customers (retail + business, saved once; auto-created from online orders)
- Purchases: enter the dealer bill → stock in + dealer price & sell price auto-updated
- Inventory: stock on hand, cost/sale value, low-stock alerts, quick ± adjustments, full stock ledger
- Settings: company/GST/FSSAI/bank details, margin %, delivery charge, free-delivery threshold, store texts, admin password

## Pricing engine (as decided)

```
sell price = dealer price (incl. GST)
           + profit        = dealer price × margin%   (default 5%)
           + GST on profit = profit × GST rate
Example: ₹100 dealer, 5% GST → 100 + 5.00 + 0.25 = ₹105.25
```
On the GST tax invoice the sell price is split as taxable value + GST on the full value (as the law requires). Because dealer GST is input credit, net GST payable = GST on the profit only.
Changing the global margin in Settings recalculates every auto-priced product.

---

## Deploy (GitHub → Vercel) — step by step

### 1. Push to GitHub
```bash
cd dailybalaji
git init && git add . && git commit -m "Daily Balaji e-commerce + admin"
gh repo create Mr-Greatlion/dailybalaji --private --source=. --push
```
(or create the repo on github.com and `git remote add origin … && git push -u origin main`)

### 2. Vercel project
1. vercel.com → Add New → Project → import `Mr-Greatlion/dailybalaji`
2. Framework: Next.js (auto). Do NOT deploy yet — add storage and env first.
3. **Storage → Create Database → Neon (Postgres)** → connect to the project. This adds `DATABASE_URL` automatically.
4. **Storage → Create → Blob** → connect. This adds `BLOB_READ_WRITE_TOKEN`.
5. **Settings → Environment Variables** — add these (all environments):

| Key | Value |
|---|---|
| `AUTH_SECRET` | long random string — `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | `https://dailybalaji.com` |
| `NEXT_PUBLIC_SITE_NAME` | `Daily Balaji` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | from Razorpay dashboard (Settings → API Keys) |
| `RAZORPAY_KEY_SECRET` | from Razorpay dashboard |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASS` | Gmail **App Password** (16 chars, remove spaces) |
| `SMTP_FROM` | `Daily Balaji <yourgmail@gmail.com>` |
| `ADMIN_NOTIFY_EMAIL` | where new-order alerts go |

6. Deploy.

### 3. Create tables + seed admin (one time, from your PC)
```bash
npm install
# copy DATABASE_URL from Vercel → Storage → Neon → .env.local  (use the non-pooled/direct URL for push)
echo 'DATABASE_URL="postgresql://..."' > .env.local
echo 'ADMIN_EMAIL="pradeepkumar34299@gmail.com"' >> .env.local
echo 'ADMIN_PASSWORD="YourStrongPassword"' >> .env.local

npx dotenv -e .env.local -- npx prisma db push     # creates all tables
npx dotenv -e .env.local -- npm run db:seed        # admin user + Balaji Agencies settings + categories + Parag vendor
```
(if `dotenv` is missing: `npm i -D dotenv-cli`)

Login at `https://dailybalaji.com/login?admin=1` with ADMIN_EMAIL / ADMIN_PASSWORD. Change the password in Admin → Settings.

### 4. Domain (DomainRacer → Vercel)
Vercel → Project → Settings → Domains → add `dailybalaji.com` and `www.dailybalaji.com`.
Easiest: at DomainRacer → Manage Nameservers → set `ns1.vercel-dns.com` and `ns2.vercel-dns.com`.
(If you use DomainRacer email on this domain, re-add the MX/SPF records inside Vercel DNS after switching, exactly like fusiontrendds.com.)

### 5. Razorpay
Razorpay dashboard → Settings → Website & app settings → add `https://dailybalaji.com`. Use **test keys** first, place a test order, then switch to live keys in Vercel env and redeploy.

---

## Loading products from the dealer bill

Admin → **Purchases → New purchase entry**: pick vendor (Parag Milk Foods), enter each item's qty and per-piece rate (GST-inclusive, from the bill), GST %. Save → stock added, dealer price stored, sell price computed with the margin. Products must exist first (Admin → Products → Add product, photo from phone).

## Local development
```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL etc.
npx prisma db push && npm run db:seed
npm run dev                  # http://localhost:3000
```

## Health check
`GET /api/health` → `{ ok: true, db: "up" }`
