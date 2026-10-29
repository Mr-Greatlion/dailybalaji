# Daily Balaji - one-shot deploy script (Windows PowerShell)
# Run from the project folder:  C:\Users\PK\Downloads\dailybalaji\dailybalaji
#   powershell -ExecutionPolicy Bypass -File .\deploy.ps1

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host "`n=== 1/8 Vercel CLI ===" -ForegroundColor Cyan
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) { npm install -g vercel }
vercel whoami 2>$null
if ($LASTEXITCODE -ne 0) { vercel login }

Write-Host "`n=== 2/8 Link project ===" -ForegroundColor Cyan
vercel link --yes --project dailybalaji

Write-Host "`n=== 3/8 Patch DB client (works with Neon or Prisma Postgres) ===" -ForegroundColor Cyan
@'
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Prefer a plain postgres:// URL. Prisma Postgres sets DATABASE_URL as prisma+postgres://, with POSTGRES_URL as the direct one. */
function connectionString() {
  const candidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.POSTGRES_PRISMA_URL, process.env.DATABASE_URL_UNPOOLED];
  return candidates.find((u) => u && /^postgres(ql)?:\/\//.test(u)) || process.env.DATABASE_URL;
}

function createClient() {
  const adapter = new PrismaPg({ connectionString: connectionString(), max: 5 });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
'@ | Set-Content -Encoding utf8 .\src\lib\prisma.ts

Write-Host "`n=== 4/8 Environment variables ===" -ForegroundColor Cyan
$vars = [ordered]@{
  AUTH_SECRET                 = "db7f4c1e9a2b6d8f3c5e7a9b1d4f6c8e2a5b7d9f1c3e5a7b9d2f4c6e8a1b3d5f7"
  NEXT_PUBLIC_SITE_URL        = "https://dailybalaji.com"
  NEXT_PUBLIC_SITE_NAME       = "Daily Balaji"
  SMTP_HOST                   = "smtp.gmail.com"
  SMTP_PORT                   = "465"
  SMTP_USER                   = "pradeepkumar34299@gmail.com"
  SMTP_PASS                   = "PASTE_GMAIL_APP_PASSWORD_NO_SPACES"
  SMTP_FROM                   = "Daily Balaji <pradeepkumar34299@gmail.com>"
  ADMIN_NOTIFY_EMAIL          = "pradeepkumar34299@gmail.com"
  NEXT_PUBLIC_RAZORPAY_KEY_ID = ""
  RAZORPAY_KEY_SECRET         = ""
}
foreach ($k in $vars.Keys) {
  $v = $vars[$k]
  if ([string]::IsNullOrWhiteSpace($v)) { continue }
  foreach ($target in @("production", "preview", "development")) {
    $v | vercel env add $k $target --force 2>$null
  }
  Write-Host "  set $k"
}

Write-Host "`n=== 5/8 Blob store (product images) ===" -ForegroundColor Cyan
vercel blob store add dailybalaji-images 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "  CLI could not create Blob store. Do it once in the dashboard: Project -> Storage -> Create -> Blob -> Connect. Then re-run this script." -ForegroundColor Yellow
}

Write-Host "`n=== 6/8 Pull env + create tables + seed admin ===" -ForegroundColor Cyan
vercel env pull .env.local --environment=production --yes
Add-Content .env.local "`nADMIN_EMAIL=`"pradeepkumar34299@gmail.com`""
Add-Content .env.local "ADMIN_PASSWORD=`"Balaji@2026`""
npx dotenv -e .env.local -- npx prisma db push --accept-data-loss
npx dotenv -e .env.local -- npm run db:seed

Write-Host "`n=== 7/8 Commit + push to GitHub ===" -ForegroundColor Cyan
git add .
git commit -m "Deploy config: DB client fallback" 2>$null
git push

Write-Host "`n=== 8/8 Production deploy ===" -ForegroundColor Cyan
vercel --prod --yes

Write-Host "`nDONE. Admin login: https://dailybalaji.vercel.app/login?admin=1" -ForegroundColor Green
Write-Host "Email: pradeepkumar34299@gmail.com   Password: Balaji@2026  (change it in Admin -> Settings)" -ForegroundColor Green
Write-Host "Still manual: Gmail App Password (SMTP_PASS), Razorpay keys, IOB account number in Settings, domain nameservers at DomainRacer." -ForegroundColor Yellow
