# DuiZhang - AI 对账协作工具

两个生意人，扫一扫就能对账。极简对账工具，AI 帮你找出差异。

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Mobile Testing (LAN)

Start the dev server on all network interfaces:

```bash
npx next dev --hostname 0.0.0.0 --port 3000
```

Find your Mac's LAN IP:

```bash
ipconfig getifaddr en0
```

Then open `http://<YOUR_LAN_IP>:3000` on your phone's browser (same WiFi network).

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui
- **DB & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: DeepSeek API (text understanding) + PaddleOCR (image recognition)
- **i18n**: next-intl (zh/en)
- **PWA**: @serwist/next
- **Deploy**: Vercel (overseas) / custom domain for China access

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DEEPSEEK_API_KEY` - DeepSeek API key
- `DEEPSEEK_BASE_URL` - DeepSeek API base URL
- `PADDLE_OCR_ENDPOINT` - PaddleOCR service endpoint
- `NEXT_PUBLIC_APP_URL` - Public app URL

## China Access Solutions

`.vercel.app` domains are DNS-polluted in mainland China. Three solutions:

### Option A: Custom Domain + Cloudflare (Recommended, no ICP required)

1. Purchase a domain (e.g. `duizhang.com`)
2. Add the domain to Cloudflare (free plan)
3. In Vercel Dashboard > Settings > Domains, add your custom domain
4. In Cloudflare DNS, add a CNAME record: `@` -> `cname.vercel-dns.com` (Proxied)
5. Cloudflare has China-accessible edge nodes that bypass the `.vercel.app` block
6. Access via `https://yourdomain.com`

### Option B: Deploy to China Cloud (Most stable, requires ICP)

1. Purchase a domain and complete ICP filing (7-15 business days)
2. Deploy to Tencent Cloud / Aliyun using Docker or serverless functions
3. Best for production use targeting mainland China users
4. Required if integrating WeChat Pay or WeChat Mini Program

### Option C: Local LAN Testing (Zero cost, immediate)

1. Run `npx next dev --hostname 0.0.0.0 --port 3000` on your Mac
2. Connect your phone to the same WiFi network
3. Run `ipconfig getifaddr en0` to find your Mac's LAN IP
4. Open `http://<LAN_IP>:3000` in your phone's browser
5. All features work including auth, OCR, and reconciliation

> Options A and B require a custom domain. Option C is for development/testing only.

## Project Structure

```
src/
  app/
    [locale]/           # i18n locale segment
      (auth)/            # login, callback
      (main)/            # transactions, reconciliations, settings
      (public)/          # guest reconciliation confirmation
    api/                 # API routes
  components/
    ui/                  # shadcn/ui components
    layout/              # header, sidebar, bottom-nav
    business/            # photo-capture, recon-match-table
  hooks/                 # useTransactions, useReconciliations
  i18n/                  # routing, navigation, request config
  lib/
    supabase/            # client, server, middleware, admin
    ai/                  # deepseek, ocr
  messages/              # zh.json, en.json
  types/                 # transaction, reconciliation, database
```

## Build

```bash
npm run build
```
