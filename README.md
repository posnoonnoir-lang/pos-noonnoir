# 🍷 POS Noonnoir — Noon & Noir Wine Alley

> *"drink slowly · laugh quietly · stay longer"*

Hệ thống POS chuyên biệt cho Wine Bar, hỗ trợ bán ly thông minh, theo dõi chai mở, ký gửi, và quản lý vận hành toàn diện.

---

> [!IMPORTANT]
> ## 🔴 QUY TẮC BẮT BUỘC — ĐỌC TRƯỚC KHI LÀM
>
> **Mọi lần bắt đầu phiên làm việc (session), AI/Developer PHẢI:**
>
> 1. **Đọc file README.md này** trước tiên để nắm toàn bộ cấu trúc và trạng thái hiện tại
> 2. **Đọc các docs liên quan** trước khi implement bất kỳ tính năng nào
> 3. **Cập nhật docs** ngay sau khi có thay đổi (tính năng mới, schema change, API change)
>
> ### Quy tắc cập nhật docs:
>
> | Khi nào | Cập nhật file nào |
> |---------|------------------|
> | Thêm tính năng mới | `01-PRD.md` (user story) → `02-SRS.md` (FR) → docs liên quan |
> | Thay đổi DB schema | `04-DATABASE-DESIGN.md` + `04a-DATA-DICTIONARY.md` |
> | Thêm/sửa API | `05-API-SPECIFICATION.md` |
> | Thay đổi UI | `06-UI-UX-GUIDELINES.md` |
> | Thay đổi timeline | `07-PROJECT-PLAN.md` |
> | Thay đổi deploy flow | `09-DEPLOYMENT-GUIDE.md` |
> | **Mọi thay đổi** | Cập nhật **Changelog** ở cuối file này |
>
> ❌ **TUYỆT ĐỐI KHÔNG** implement mà chưa đọc docs liên quan.
> ❌ **TUYỆT ĐỐI KHÔNG** thay đổi tính năng/schema mà không cập nhật docs.

---

## 🛠️ Tech Stack

| Layer | Technology | Status |
|-------|-----------|:------:|
| **Framework** | Next.js 16.1.6 (Turbopack, App Router, TypeScript) | ✅ |
| **Database** | PostgreSQL (Supabase) | ✅ Connected |
| **ORM** | Prisma v7 (36 models, schema synced) | ✅ |
| **UI** | shadcn/ui + Tailwind CSS v4 | ✅ |
| **State** | Zustand (persist) | ✅ |
| **Auth** | PIN Login (mock, Supabase planned) | ✅ |
| **Icons** | Lucide React | ✅ |
| **Charts** | CSS-only (no external library) | ✅ |
| **Toast** | Sonner | ✅ |
| **Data** | Server Actions → Prisma (100% kết nối Supabase) | ✅ |
| **Deploy** | Vercel (auto-deploy from GitHub) | ✅ |

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Setup .env (Supabase credentials)
# DATABASE_URL="postgresql://..."
# DIRECT_URL="postgresql://..."

# 3. Sync DB & Generate Client
npx prisma db push
npx prisma generate

# 4. Run
npx next dev --port 3001
```

Open [http://localhost:3001](http://localhost:3001) → Login PIN: **1234** (Owner)

> **Note:** Tất cả Server Actions đã kết nối Supabase qua Prisma ORM. Không còn mock data.

---

## 📁 Project Structure

```
pos-noonnoir/
├── vercel.json                    # Vercel config — regions: sin1 (Singapore)
├── prisma/
│   ├── schema.prisma          # 36 models, full schema (synced with Supabase)
│   ├── seed.ts                # Database seeder
│   └── reset.ts               # Database reset utility
├── src/
│   ├── actions/               # Server Actions (100% Prisma — no mock data)
│   │   ├── menu.ts            #   Category & Product CRUD
│   │   ├── tables.ts          #   Table management + stats
│   │   ├── orders.ts          #   Order lifecycle + COGS + addItemsToOrder
│   │   ├── reports.ts         #   Analytics & dashboard data
│   │   ├── staff.ts           #   Staff CRUD + PIN + updateStaff + detail
│   │   ├── attendance.ts      # 🆕 Attendance check-in/out, history
│   │   ├── payroll.ts         # 🆕 Monthly payroll calculation + CSV
│   │   ├── schedule.ts        # 🆕 Weekly shift schedule management
│   │   ├── hr-config.ts       # 🆕 HR settings (shifts/attendance/payroll/leave/roles)
│   │   ├── inventory.ts       #   Inventory management (goods)
│   │   ├── procurement.ts     #   PO, Suppliers, Phiếu nhập hàng, BQGQ (Weighted Avg Cost)
│   │   ├── assets.ts          #   NPL, CCDC, Recipes, Depreciation
│   │   ├── finance.ts         #   COGS, P&L, Expense breakdown, Daily revenue chart, Top products
│   │   ├── tabs.ts            # ⭐ Customer Tab (open/close/add items)
│   │   ├── wine.ts            # ⭐ Wine glass/bottle tracking (FIFO)
│   │   ├── consignment.ts     # ⭐ Consignment + createConsignment
│   │   ├── shifts.ts          # ⭐ Shift open/close, cash counting
│   │   ├── customers.ts       # ⭐ CRM, loyalty tiers, RFM analysis, favorite products
│   │   ├── promotions.ts      # ⭐ Promotions CRUD, Happy Hour, combos
│   │   ├── daily-pnl.ts       # ⭐ Daily P&L auto-report
│   │   ├── notifications.ts   # ⭐ Real-time alerts & rules
│   │   ├── qr-payment.ts      # ⭐ VietQR + updateBankConfig
│   │   ├── operational.ts     # ⭐ Table transfer, 86, service charge, discount auth
│   │   ├── serving-notes.ts   # ⭐ Wine serving notes & tasting
│   │   ├── tax.ts             #   VAT/Tax configuration
│   │   ├── shift-targets.ts   # 🆕 V2: Shift KPI targets & evaluation
│   │   ├── forecast.ts        # 🆕 V2: Demand forecast (8-week WMA + trend/season)
│   │   ├── inventory-alerts.ts # 🆕 V2: 9-type inventory alerts
│   │   ├── push-sale.ts       # 🆕 V2: Push sale items (oxidation/low/slow)
│   │   ├── feedback.ts        # 🆕 V2: QR customer feedback system
│   │   ├── waste.ts           # 🆕 Waste/spoilage tracking with P&L integration
│   │   ├── analytics.ts       # 🆕 Zone heatmap, hourly heatmap, staff leaderboard
│   │   ├── wine-advisor.ts    # 🆕 Smart wine recommendations + getAllWineStock()
│   │   ├── kpi.ts             # 🆕 KPI targets system (metrics, targets, cascade, overview)
│   │   ├── pos-loader.ts      # ⚡ Consolidated POS SSR loader (1 call → all data)
│   │   ├── dashboard-loader.ts # ⚡ Consolidated Dashboard SSR loader
│   │   └── analytics-loader.ts # ⚡ Consolidated Analytics SSR loader (10 queries parallel)
│   ├── app/
│   │   ├── (dashboard)/       # Unified layout (collapsible sidebar, persistent state)
│   │   │   ├── layout.tsx            # Single layout — sidebar 220px↔60px, 6 nav groups
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx           # Dashboard Home
│   │   │   │   ├── analytics/         # 📊 Analytics (zone heatmap, hourly)
│   │   │   │   ├── finance/           # 💰 COGS FIFO + P&L
│   │   │   │   ├── tables/            # Table Management
│   │   │   │   ├── menu/              # Menu (categories, products, recipes)
│   │   │   │   ├── reports/           # ⭐ Daily P&L Report
│   │   │   │   ├── staff/             # Staff Management (4 tabs + detail)
│   │   │   │   │   └── [id]/          # Staff Detail (4 sub-tabs)
│   │   │   │   ├── procurement/       # PO & Suppliers
│   │   │   │   ├── inventory/         # Goods + NPL + CCDC (3 tabs)
│   │   │   │   ├── consignment/       # ⭐ Consignment management
│   │   │   │   ├── customers/         # ⭐ CRM Dashboard
│   │   │   │   ├── promotions/        # ⭐ Promotions Manager
│   │   │   │   ├── wine-guide/        # 🍷 Wine Serving Notes
│   │   │   │   ├── bottle-tracking/   # 🍷 By-Glass Sales Tracking
│   │   │   │   ├── reservations/      # 📅 Reservation management
│   │   │   │   ├── settings/          # ⚙️ Settings (3 groups, 11 sections)
│   │   │   │   ├── alerts/            # ⚠️ Inventory Alerts (9 types)
│   │   │   │   ├── forecast/          # 📈 Demand Forecast
│   │   │   │   ├── waste/             # 🗑️ Waste/Spoilage Tracking
│   │   │   │   ├── feedback/          # 💬 Customer Feedback Dashboard
│   │   │   │   └── kpi/               # 🎯 KPI Targets Dashboard (3 tabs)
│   │   │   └── pos/                   # POS pages (same layout!)
│   │   │       ├── page.tsx           # POS Terminal + Push Sale + Wine Guide
│   │   │       ├── kitchen/           # Kitchen Display (Kanban 3-column)
│   │   │       └── orders/            # Order History + Receipt
│   │   ├── feedback/[token]/  # V2: Public Feedback Page (QR)
│   │   ├── offline/           # PWA: Offline fallback page
│   │   ├── api/
│   │   │   ├── export/receipt/ # Thermal receipt export
│   │   │   ├── export/report/  # CSV report export
│   │   │   └── public/menu/    # Public menu API (CDN cached)
│   │   └── login/             # PIN Login
│   ├── components/
│   │   ├── pos/               # Receipt component
│   │   └── ui/                # shadcn/ui base components
│   ├── lib/
│   │   ├── staff-constants.ts # Role/status label maps
│   │   ├── customer-tiers.ts  # CustomerTier type + calculateTier
│   │   ├── shift-types.ts     # Shared SHIFT_TYPES constant
│   │   ├── parallel-limit.ts  # Parallel async helper
│   │   └── utils.ts           # cn() utility
│   ├── hooks/
│   │   └── use-pos-shortcuts.tsx  # POS keyboard shortcuts (F1-F12)
│   ├── components/pwa/
│   │   └── service-worker-registration.tsx  # PWA SW + offline queue
│   └── stores/
│       ├── auth-store.ts      # Auth + PIN (Zustand persist)
│       ├── cart-store.ts      # Cart state management
│       ├── prefetch-store.ts  # SSR prefetch cache
│       └── sidebar-store.ts   # 🆕 Sidebar collapsed state (Zustand persist)
├── public/
│   ├── sw.js                  # Service Worker (cache + offline queue)
│   ├── manifest.json          # PWA Web App Manifest
│   └── icons/                 # PWA app icons (192/512)
├── docs/                      → ../docs/ (SDLC documentation)
└── README.md                  # ← BẠN ĐANG Ở ĐÂY
```

---

## 📋 Tài Liệu SDLC

Tất cả tài liệu nằm trong folder [`../docs/`](../docs/)

| # | Tài Liệu | File | Version | Mô Tả |
|---|----------|------|:-------:|--------|
| 1 | Product Requirements | [`01-PRD.md`](../docs/01-PRD.md) | v1.1 | 8 Epics, 18 User Stories |
| 2 | Software Requirements | [`02-SRS.md`](../docs/02-SRS.md) | v1.1 | 36+ FRs, 25+ NFRs |
| 3 | System Architecture | [`03-ARCHITECTURE.md`](../docs/03-ARCHITECTURE.md) | v1.0 | Kiến trúc, RBAC, modules |
| 4 | Database Design | [`04-DATABASE-DESIGN.md`](../docs/04-DATABASE-DESIGN.md) | v1.1 | ERD, 29 tables, 8 RPCs |
| 4a | Data Dictionary | [`04a-DATA-DICTIONARY.md`](../docs/04a-DATA-DICTIONARY.md) | v1.1 | Column-level detail |
| 5 | API Specification | [`05-API-SPECIFICATION.md`](../docs/05-API-SPECIFICATION.md) | v1.1 | 50+ Server Actions |
| 6 | UI/UX Guidelines | [`06-UI-UX-GUIDELINES.md`](../docs/06-UI-UX-GUIDELINES.md) | v1.2 | Brand design system |
| 7 | Project Plan | [`07-PROJECT-PLAN.md`](../docs/07-PROJECT-PLAN.md) | v1.1 | 7 phases, 15.5 tuần |
| 8 | Testing Strategy | [`08-TESTING-STRATEGY.md`](../docs/08-TESTING-STRATEGY.md) | v1.0 | Test pyramid, QA |
| 9 | Deployment Guide | [`09-DEPLOYMENT-GUIDE.md`](../docs/09-DEPLOYMENT-GUIDE.md) | v1.0 | CI/CD, monitoring |
| 10 | User Manual | [`10-USER-MANUAL.md`](../docs/10-USER-MANUAL.md) | v1.0 | Hướng dẫn sử dụng (VN) |
| 11 | Phase 1 Plan | [`11-PHASE1-PLAN.md`](../docs/11-PHASE1-PLAN.md) | v1.0 | Implementation plan |

---

## 🏗️ Tổng Quan Tính Năng

### ✅ Đã Implement (MVP+ Full Features — Mock Data)

| Module | Route | Tính năng chính | Status |
|--------|-------|----------------|:------:|
| **Login** | `/login` | PIN keypad, 5 staff roles, Zustand persist | ✅ Done |
| **POS Terminal** | `/pos` | Menu grid, search, category filter, cart, **table order view**, payment, **🔔 notification bell**, **QR modal** | ✅ Done |
| **Kitchen Display** | `/pos/kitchen` | Live order cards, status update (Pending→Preparing→Ready) | ✅ Done |
| **Order History** | `/pos/orders` | Search, filter, order detail, receipt print | ✅ Done |
| **Dashboard Home** | `/dashboard` | KPIs, 7-day chart, table stats, recent orders, top 5, quick links | ✅ Done |
| **Table Management** | `/dashboard/tables` | Zone filter, 12 tables, status cards, **CRUD bàn + khu vực** | ✅ Done |
| **Menu/Categories** | `/dashboard/menu/categories` | CRUD, toggle active, product count | ✅ Done |
| **Menu/Products** | `/dashboard/menu/products` | CRUD, category filter, price, availability | ✅ Done |
| **Staff Management** | `/dashboard/staff` | 4 tabs (Danh sách + Chấm công + Bảng lương + Lịch ca), **edit staff**, detail page | ✅ Done |
| **Staff Detail** 🆕 | `/dashboard/staff/[id]` | Profile header, 4 sub-tabs (Overview, Attendance, Shifts, Performance) | ✅ Done |
| **Payroll** 🆕 | `/dashboard/staff` (tab) | Monthly salary calc (base + OT 1.5x + bonus 1% DT), CSV export | ✅ Done |
| **Schedule** 🆕 | `/dashboard/staff` (tab) | Weekly grid, 4 shift types (Sáng/Chiều/Tối/Cả ngày), copy week | ✅ Done |
| **Procurement** | `/dashboard/procurement` | PO, NCC, **📥 Phiếu nhập hàng (BQGQ)**, lịch sử nhập, Create Supplier | ✅ Done |
| **Inventory** | `/dashboard/inventory` | 3 tabs: Hàng bán + NPL + CCDC, auto depreciation, **accurate stock deduction** | ✅ Done |
| **Finance/COGS** | `/dashboard/finance` | P&L, COGS, expense breakdown, per-product margin, **📊 30-day revenue chart**, **🏆 Top products** | ✅ Done |
| **Settings** | `/dashboard/settings` | 3 grouped categories (Cửa hàng, Thanh toán & Tài chính, Hệ thống & Giao diện), 11 sections | ✅ Done |
| **Receipt** | Overlay | Thermal-style bill, print button | ✅ Done |
| **POS → NPL** | Checkout flow | Auto deduct NPL ingredients, stock warnings, COGS tracking | ✅ Done |
| **POS Table Orders** 🆕 | POS `/pos` | **View occupied table orders**, **add items to existing order**, order detail panel | ✅ Done |
| **Customer Tab** ⭐ | POS `/pos` | Open tab VIP, set limit, add items, close tab, tab badge | ✅ Done |
| **Wine Tracking** ⭐ | POS `/pos` | Glass tracking (5/8 ly), FIFO bottle open, sell glass/bottle | ✅ Done |
| **Consignment** ⭐ | `/dashboard/consignment` | Ký gửi NCC, settlement flow, **create consignment form** | ✅ Done |
| **Shift Management** ⭐ | POS top bar | Open/close shift, cash counting, shift timer, expenses | ✅ Done |
| **CRM** ⭐ | `/dashboard/customers` | Customer profiles, loyalty tiers, **RFM segmentation**, **favorite products**, **lazy-loaded profile**, **real order history** | ✅ Done |
| **Promotions** ⭐ | `/dashboard/promotions` | Happy Hour, % off, combo, fixed amount, **create CTKM form**, delete | ✅ Done |
| **Daily P&L** ⭐ | `/dashboard/reports` | Waterfall P&L, payment breakdown, top products, 7-day trend | ✅ Done |
| **Notifications** ⭐ | POS 🔔 bell | Low stock, expiry, shift alerts, revenue, customer birthday | ✅ Done |
| **QR Payment** ⭐ | POS modal | VietQR API, dynamic QR, bank info, confirm/cancel flow | ✅ Done |
| **Wine Guide** ⭐ | `/dashboard/wine-guide` | Serving temp, glass type, decant, tasting notes, food pairing | ✅ Done |
| **VAT/Tax** ⭐ | `/settings` | Multi-rate VAT (0/5/8/10%), input/output tax, toggle system | ✅ Done |
| **Wine Info Display** 🆕 | POS `/pos` | Inline wine info (alcohol%, region, country), Wine Guide Modal in cart | ✅ Done |
| **Shift Targets** 🆕 | POS `/pos` | Auto-suggest KPIs, manager approval, end-of-shift evaluation 🟢🟡🔴 | ✅ Done |
| **Forecast** 🆕 | `/dashboard/forecast` | Demand prediction (WMA), confidence scores, accept/dismiss workflow | ✅ Done |
| **Inventory Alerts** 🆕 | `/dashboard/alerts` | 9 alert types (3 severities), auto-refresh, suggested actions | ✅ Done |
| **QR Feedback** 🆕 | `/feedback/[token]` + dashboard | Per-item star ratings, ambience/service/visit scores, review feed | ✅ Done |
| **Push Sale Sidebar** 🆕 | POS `/pos` | Always-visible: oxidation risk, low glasses, slow-moving, quick discount | ✅ Done |
| **Wine Advisor** 🆕 | POS `/pos` | Smart wine recommendations: ABV/acidity/body filter, out-of-stock alternatives | ✅ Done |
| **By-Glass Tracking** 🆕 | `/dashboard/bottle-tracking` | Bottle Selector modal, open/pour tracking, oxidation monitoring, P&L per bottle | ✅ Done |
| **By-Glass Setup** 🆕 | `/dashboard/menu/products` | Configurable: glasses/bottle, oxidation hours, glass price, margin calc | ✅ Done |
| **Waste Tracking** 🆕 | `/dashboard/waste` | Record waste/spoilage, auto P&L expense, monthly trend chart, form options | ✅ Done |
| **Report Export** 🆕 | `GET /api/export/report` | CSV export: revenue, consignment, waste, inventory, forecast | ✅ Done |
| **Public Menu API** 🆕 | `GET /api/public/menu` | Categories, products, wine details, stock, 86 status, CDN cached | ✅ Done |
| **Keyboard Shortcuts** 🆕 | POS `/pos` | F1-F12 category switch, Ctrl+F/B/P/H/K/D, Escape, Delete | ✅ Done |
| **PWA Offline** 🆕 | Root layout | Service Worker, offline queue, auto-replay on reconnect, installable app | ✅ Done |
| **Zone Heatmap** 🆕 | `/dashboard/analytics` | Zone × table revenue heatmap, 7-day × 14-hour hourly heatmap | ✅ Done |

### 📋 Planned (Phase 3+)

| Module | Tính năng chính | Priority |
|--------|----------------|:--------:|
| **Supabase Auth** | Replace PIN mock → Supabase Auth with RLS | P1 |
| **Telegram Bot** | Low-rating alerts, oxidation alerts, shift reports | P2 |
| **VNPay/MoMo** | Auto-confirm payment via bank webhook | P2 |
| **GrabFood Webhook** | Receive orders from GrabFood | P3 |

---

## 🔄 Quy Trình Implement Feature

```
1. 📖 Đọc README.md     → xác định feature thuộc module nào
2. 📋 Đọc PRD           → hiểu YÊU CẦU (user story)
3. 📐 Đọc SRS           → hiểu CHI TIẾT kỹ thuật (FR)
4. 🗄️ Đọc DB Design     → biết schema, tables liên quan
5. 🔌 Đọc API Spec      → biết actions cần implement
6. 🎨 Đọc UI/UX         → biết design tokens & components
7. 💻 IMPLEMENT
8. ✅ Cập nhật docs nếu có thay đổi
9. 📝 Ghi changelog ở README.md
```

---

## 📌 Document Control

| Field | Value |
|-------|-------|
| **Project** | POS Noonnoir Wine Bar |
| **Version** | 13.0 |
| **Created** | March 10, 2026 |
| **Last Updated** | March 14, 2026 |
| **Author** | Noonnoir Dev Team |
| **Repository** | [github.com/posnoonnoir-lang/pos-noonnoir](https://github.com/posnoonnoir-lang/pos-noonnoir) |
| **Status** | **🎯 KPI System + Push Sale Fix** — multi-level KPI targets, push sale interactivity, menu SSR perf |

---

## 📝 Changelog

| Date | Version | Thay đổi |
|------|---------|----------|
| 2026-03-10 | v1.0 | Tạo bộ docs SDLC (12 files): PRD, SRS, Architecture, DB, API, UI/UX, Plan, Testing, Deployment, Manual |
| 2026-03-10 | v1.1 | **Product Owner Review** — thêm 6 tính năng: Customer Tab, Wine Flight, Waste Tracking, Serving Notes, Auto P&L, Telegram Notifications. Timeline 14→15.5 tuần |
| 2026-03-10 | v1.2 | **Brand Identity Update** — UI/UX theo phong cách Noon & Noir thực tế. Cream palette, forest green, Playfair Display + Caveat fonts. **Project setup**: Next.js + Prisma schema + globals.css |
| 2026-03-10 | v1.3 | **Phase 1 Step 1** — Auth & Layout Shell: PIN Login, Sidebar, POS Layout, Auth guard |
| 2026-03-10 | v1.4 | **Phase 1 Step 2** — POS Terminal, Menu Grid, Cart, Table Selector, Payment flow, Admin Dashboard (Categories, Products CRUD), Table Management |
| 2026-03-10 | v1.5 | **Phase 1 Step 3** — Kitchen Display (KDS), Order History page, full order lifecycle (POS→Kitchen→Complete) |
| 2026-03-10 | v1.6 | **Phase 1 Step 4** — Reports & Analytics (KPIs, weekly chart, top products, staff perf, hourly heatmap), Receipt component (thermal-style + print overlay) |
| 2026-03-10 | v1.7 | **Phase 1 Step 5** — Staff Management (6 staff, role badges, PIN reset, add form), Dashboard Home upgrade (live data) |
| 2026-03-10 | **v2.0** | **🎉 MVP Complete** — Inventory Management (10 SKUs, stock adjust, movement history), Settings page (5 sections: store, receipt, notifications, display, system). **17 routes, 0 build errors** |
| 2026-03-10 | **v3.0** | **🚀 MVP+ ERP Modules** — (1) Procurement: PO CRUD, 4 suppliers, goods receipt, FIFO batch tracking. (2) NPL: 10 nguyên liệu, 3 recipes, stock adjust. (3) CCDC: 8 thiết bị, phân bổ khấu hao, depreciation history. (4) Finance: COGS FIFO, P&L statement, expense breakdown, per-product margin. **19 routes, 16 modules** |
| 2026-03-10 | **v3.1** | **🔧 UX Overhaul + Features** — Layout Fix (Grid→Table), Create PO Modal, FIFO Batches Tab, Auto NPL Deduction Logic, Suppliers Table |
| 2026-03-10 | **v3.2** | **🔗 POS → NPL Integration** — `processOrderWithCOGS()` wire, recipe productId mapping fix, floating point fix, Toast notifications for stock warnings |
| 2026-03-10 | **v3.3** | **🏢 CCDC Depreciation + Supplier CRUD** — Auto Monthly Depreciation, Create Supplier Modal |
| 2026-03-10 | **v3.4** | **🧾 VAT/Tax System** — Multi-rate VAT (0/5/8/10%), input/output tax management, toggle on/off, Tax Report page in Settings |
| 2026-03-10 | **v3.5** | **🍷 Wine Intelligence** — (1) **Customer Tab** (US-1.7): open/close tab, tab limit, add items, tab badge on POS. (2) **Wine Glass/Bottle Tracking** (US-1.1/2.1): sell glass → auto FIFO deduct, sell bottle, glass status on POS |
| 2026-03-10 | **v3.6** | **📦 Consignment** (US-2.2): Ký gửi NCC, settlement flow, consignment items. **Shift Management** (US-4.1): Open/close shift with cash counting, shift timer, shift expense logging |
| 2026-03-10 | **v3.7** | **👥 CRM & Promotions** — (1) **CRM** (US-3.1): Customer profiles, loyalty tiers (REGULAR→SILVER→GOLD→PLATINUM), wine preferences, order history, stats. (2) **Promotions** (US-6.1): Happy Hour, % off, combo, fixed amount, auto-apply, usage limits, real-time active indicator |
| 2026-03-10 | **v3.8** | **📊 Daily P&L Report** (US-4.4): Waterfall breakdown (Revenue→COGS→Gross→Expenses→Net), payment method analysis, top products, 7-day trend chart with day selection |
| 2026-03-10 | **v3.9** | **🔔 Notifications & Alerts** (US-5.1): 10 mock alerts, 3 priorities (CRITICAL/WARNING/INFO), 5 categories, bell icon with unread badge on POS, dropdown panel, alert rules |
| 2026-03-10 | **v4.0** | **🎉 Full Feature Complete** — (1) **QR Payment** (US-8.1): VietQR API integration, dynamic QR code generation, bank info display, confirm/cancel flow, 10-min expiry. (2) **Wine Serving Notes** (US-2.5): 5 wines with tasting profiles, serving temp/glass/decant, food pairing, staff tips, upsell suggestions. **22 routes, 27 modules, 10 User Stories** |
| 2026-03-10 | **v4.1** | **🔧 Setup Audit + POS Table Orders** — Table/Zone CRUD, Promotion CRUD, Settings 3 new sections, Consignment Create, Staff updateStaff, POS Table Order Management |
| 2026-03-10 | **v4.2** | **✨ UX Polish + Staff Edit + 86 Toggle** — POS Table Order UX, Mock order data, Staff Edit Modal, 86 Out of Stock Toggle, GitHub repo |
| 2026-03-11 | **v5.0** | **🚀 V2 Features** — (1) Wine Info Display + Wine Guide Modal. (2) Shift Target System (auto-suggest, approval, evaluation). (3) Forecast Module (WMA, confidence, accept/dismiss). (4) Inventory Alerts (9 types, 3 severities). (5) QR Feedback (public + dashboard). (6) Push Sale Sidebar. Schema: 5 new models. Vercel deployed. **25 routes, 33 modules** |
| 2026-03-11 | **v6.0** | **🗄️ Full Prisma Migration** — Toàn bộ 17 server action files chuyển từ mock data → Prisma ORM. (1) **P0**: wine.ts, operational.ts, reservations.ts — WineBottle FIFO, AuditLog, Reservation model. (2) **P1**: feedback.ts, notifications.ts, reports.ts, daily-pnl.ts, qr-payment.ts — Live aggregation từ Order/Payment. (3) **P2**: forecast.ts, push-sale.ts, shift-targets.ts, inventory-alerts.ts, serving-notes.ts — Dynamic queries. (4) **P3**: promotions.ts, assets.ts — 3 new models (Promotion, Equipment, DepreciationEntry) + 4 new enums. **Schema: 33 models. 0 mock data. 0 delay() calls. Build: 0 TS errors.** |
| 2026-03-11 | **v7.0** | **🍷 Wine By-Glass Sales System** — (1) Wine Guide tích hợp POS cards + setup dashboard. (2) Tax/CTKM hiển thị đầy đủ. (3) Wine Advisor: gợi ý theo ABV/acidity/body + alternatives. (4) Bottle Selector modal: chọn chai rót ly, oxidation tracking. (5) Bottle Tracking Dashboard: KPIs, opened bottles monitoring, P&L history. (6) By-Glass Product Setup: toggle, glasses/bottle, oxidation hours, margin calc. **27 routes, 34 modules.** |
| 2026-03-11 | **v8.0** | **👥 Full HR Management** — (1) **Staff Audit & Fix**: sửa bug ₫undefined, thêm lương vào card + modal. (2) **Attendance**: check-in/out, nghỉ phép, summary KPIs (8 server actions). (3) **Staff Detail Page**: profile + 4 sub-tabs (Overview, Attendance, Shifts, Performance). (4) **Payroll**: tính lương tháng = Base ÷ days × worked + OT(1.5x) + bonus(1% DT nếu >5M), CSV export. (5) **Schedule**: weekly grid 7 ngày × N staff, 4 loại ca (Sáng/Chiều/Tối/Cả ngày), assign/remove/copy week. (6) **HR Settings**: 5 sub-tabs (Ca làm, Chấm công, Lương, Nghỉ phép, Vai trò & Thang lương). Schema: +2 models (StaffSchedule, SystemSetting). **28 routes, 37 modules, 34 Prisma models. 0 TS errors.** |
| 2026-03-12 | **v9.0** | **⚡ SSR Performance + Build Compliance** — (1) **SSR Conversion**: 7 pages chuyển sang Server Components (Dashboard, Analytics, Reports, Tables, Customers, Reservations, Staff) — data hiển thị lập tức, không loading spinner. (2) **"use server" Compliance Fix**: sửa 3 action files vi phạm quy tắc Next.js (chỉ cho export async functions từ `"use server"` files): `customers.ts` (xóa re-export `calculateTier`/`TIER_THRESHOLDS`), `schedule.ts` (extract `SHIFT_TYPES` → `@/lib/shift-types.ts`), `tax.ts` (convert `export const` alias → async function wrapper). (3) **Shared Lib Extraction**: tạo `@/lib/shift-types.ts`, `@/lib/customer-tiers.ts` cho runtime constants dùng chung. **Build: 0 TS errors, next build exit 0. Deploy-ready.** |
| 2026-03-12 | **v9.1** | **⚡ SSR Full Coverage + POS Bug Fix** — (1) **SSR Conversion (7 thêm)**: Promotions, Wine Guide, Feedback, Alerts, Forecast, Bottle Tracking, Consignment — tất cả chuyển sang Server Components, data hiển thị lập tức không loading spinner. Pattern: `page.tsx` (SSR fetch) → `*-client.tsx` (accept initial props). (2) **Procurement+Consignment SSR**: fetch song song `getConsignments()` + `getSettlements()` / procurement data server-side. (3) **POS Occupied Table Fix**: sửa bug `getActiveOrderByTable()` thiếu status `PENDING` + `READY` → click bàn OCCUPIED không hiện đơn hàng. Thêm đủ 5 statuses: `OPEN`, `PENDING`, `PREPARING`, `READY`, `SERVED`. **Tổng: 14 SSR pages. 0 loading spinners. 0 TS errors.** |
| 2026-03-13 | **v10.0** | **📊 Analytics & COGS Enhancements** — Purchase Receipts (BQGQ), RFM customer segmentation, Finance charts, accurate stock deduction. |
| 2026-03-13 | **v11.0** | **🔍 Spec Compliance Sprint** — Audit đặc tả vs code (78%→93%). (1) **Waste Tracking**: `waste.ts` recordWaste + getWasteReport + P&L integration, `/dashboard/waste` page. (2) **Forecast v2**: 8-week weighted average, trend/season factors, ForecastConfig, confidence scoring. (3) **Report Export API**: `GET /api/export/report` — 5 report types CSV. (4) **Public Menu API**: `GET /api/public/menu` — categories+products+wine+stock, CDN cached. (5) **Keyboard Shortcuts**: F1-F12 category, Ctrl+F/B/P/H/K/D, `use-pos-shortcuts.tsx`. (6) **PWA Offline**: Service Worker + manifest + offline POST queue + auto-replay on reconnect + installable app. (7) **Zone Heatmap**: already existed (analytics ZonesTab). **0 TS errors. 16 files. Git pushed.** |
| 2026-03-13 | **v11.1** | **⚡ SSR Performance Sprint** — Tối ưu tốc độ load 3 trang chính. (1) **POS**: Gom ~20 API calls → 1 `getPOSInitialData()` duy nhất. Thay N+1 `getProductStock()` loop bằng `getAllWineStock()` groupBy (1 query thay 40+). Batch 3+4 load song song: wineStock, glassStatus, tabs, held orders, notifications, push sale, reservations, POS config. **Giảm 95% network roundtrips.** (2) **Analytics**: Gom 5 sequential Promise.all batches → 1 batch song song. Tạo `analytics-loader.ts` — 10 queries parallel. **~5× nhanh hơn SSR.** (3) **Dashboard**: Đã nhanh sẵn (SSR + 1 batch), không cần đổi. Fix missing `ClipboardList` import. **3 trang load tức thì, không skeleton flash.** |
| 2026-03-13 | **v11.2** | **⚡ Deep Perf + UX** — (1) **$transaction batching**: POS loader gom 8 Prisma queries → 1 `$transaction` (1 DB roundtrip thay 8). Wine queries + function calls chạy đồng thời — tất cả 3 nhóm parallel, 0 sequential wait. (2) **Vercel Singapore**: `vercel.json {"regions": ["sin1"]}` — cùng region với Supabase, giảm latency ~200ms→~5ms/roundtrip. (3) **Connection pool warm-up**: `pool.connect()` khi import Prisma — bỏ 500ms-1s cold start penalty. Pool max 3→10, idle timeout 10s→30s. (4) **Collapsible sidebar**: Dashboard sidebar 220px↔60px toggle thủ công bằng nút mũi tên. Icons giữ nguyên cả 2 trạng thái. Tooltip on hover khi collapsed. Animation 300ms ease-out. |
| 2026-03-14 | **v12.0** | **🏗️ Layout Unification + Navigation Redesign** — (1) **Unified Layout**: Xoá `(pos)` route group riêng, merge vào `(dashboard)`. Toàn bộ app dùng 1 layout duy nhất với collapsible sidebar. (2) **Persistent Sidebar**: `useSidebarStore` (Zustand + localStorage) — sidebar state giữ nguyên khi chuyển trang, reload. (3) **Navigation Reorganize**: 6 nhóm nghiệp vụ (Tổng quan, Bán hàng, Kho & Nhập hàng, Sản phẩm & Rượu, Khách & Marketing, Nội bộ). Di chuyển Alerts/Forecast/Waste từ "V2" → "Kho & Nhập hàng". Thêm Finance (P&L) vào sidebar. (4) **Settings Redesign**: Nav phẳng 11 items → 3 nhóm (Cửa hàng, Thanh toán & Tài chính, Hệ thống & Giao diện). (5) **Kitchen Display Unified**: Xoá bản dark cũ, thống nhất Kanban 3-column. (6) **Dashboard Pages Enhanced**: Alerts, Forecast, Waste — full-width 2-column layout + analytics sidebar. **0 TS errors. Git pushed.** |
| 2026-03-14 | **v13.0** | **🎯 KPI System + Push Sale + Menu Perf** — (1) **KPI Targets System**: Schema `KpiMetric` + `KpiTarget` (36 models). 6 default metrics (doanh thu, đơn, khách, TB/đơn, chai wine, ly wine). Owner set chỉ tiêu tháng → auto cascade chia tuần (÷4~5). Dashboard `/dashboard/kpi` 3 tabs: Tổng quan (progress cards + 6-month history charts), Đặt chỉ tiêu (bulk input + cascade), Quản lý chỉ số (add/toggle/delete custom KPIs). (2) **KPI Toggle**: On/off trong Settings → Vận hành POS, persist via `SystemSetting`. (3) **Push Sale Fix**: Items giờ clickable → add product trực tiếp vào cart. Thêm nút "+ Giỏ" xanh bên cạnh "Giảm giá". Cursor pointer + hover shadow + active scale feedback. (4) **Menu Page Speed**: Thay redirect `/dashboard/menu` → `/dashboard/menu/categories` bằng direct SSR render (bỏ extra server roundtrip). **Schema: 36 models. 0 TS errors. Git pushed.** |

---

*Last updated: March 14, 2026 — KPI System + Push Sale + Menu Perf v13.0*
