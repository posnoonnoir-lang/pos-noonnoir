# 🍷 POS Noonnoir — Noon & Noir Wine Alley

> *"drink slowly · laugh quietly · stay longer"*

Hệ thống POS chuyên biệt cho Wine Bar, hỗ trợ bán ly thông minh, ký gửi, và quản lý vận hành toàn diện.

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
| **ORM** | Prisma v7 (33 models, schema synced) | ✅ |
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
├── prisma/
│   ├── schema.prisma          # 33 models, full schema (synced with Supabase)
│   ├── seed.ts                # Database seeder
│   └── reset.ts               # Database reset utility
├── src/
│   ├── actions/               # Server Actions (100% Prisma — no mock data)
│   │   ├── menu.ts            #   Category & Product CRUD
│   │   ├── tables.ts          #   Table management + stats
│   │   ├── orders.ts          #   Order lifecycle + COGS + addItemsToOrder
│   │   ├── reports.ts         #   Analytics & dashboard data
│   │   ├── staff.ts           #   Staff CRUD + PIN + updateStaff
│   │   ├── inventory.ts       #   Inventory management (goods)
│   │   ├── procurement.ts     #   PO, Suppliers, Goods Receipt, FIFO
│   │   ├── assets.ts          #   NPL, CCDC, Recipes, Depreciation
│   │   ├── finance.ts         #   COGS (FIFO), P&L, Expense breakdown
│   │   ├── tabs.ts            # ⭐ Customer Tab (open/close/add items)
│   │   ├── wine.ts            # ⭐ Wine glass/bottle tracking (FIFO)
│   │   ├── consignment.ts     # ⭐ Consignment + createConsignment
│   │   ├── shifts.ts          # ⭐ Shift open/close, cash counting
│   │   ├── customers.ts       # ⭐ CRM, loyalty tiers, wine prefs
│   │   ├── promotions.ts      # ⭐ Promotions CRUD, Happy Hour, combos
│   │   ├── daily-pnl.ts       # ⭐ Daily P&L auto-report
│   │   ├── notifications.ts   # ⭐ Real-time alerts & rules
│   │   ├── qr-payment.ts      # ⭐ VietQR + updateBankConfig
│   │   ├── operational.ts     # ⭐ Table transfer, 86, service charge, discount auth
│   │   ├── serving-notes.ts   # ⭐ Wine serving notes & tasting
│   │   ├── tax.ts             #   VAT/Tax configuration
│   │   ├── shift-targets.ts   # 🆕 V2: Shift KPI targets & evaluation
│   │   ├── forecast.ts        # 🆕 V2: Demand forecast (WMA algorithm)
│   │   ├── inventory-alerts.ts # 🆕 V2: 9-type inventory alerts
│   │   ├── push-sale.ts       # 🆕 V2: Push sale items (oxidation/low/slow)
│   │   └── feedback.ts        # 🆕 V2: QR customer feedback system
│   ├── app/
│   │   ├── (dashboard)/       # Admin pages (expanded sidebar)
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # Dashboard Home
│   │   │       ├── tables/            # Table Management
│   │   │       ├── menu/categories/   # Category CRUD
│   │   │       ├── menu/products/     # Product CRUD
│   │   │       ├── reports/           # ⭐ Daily P&L Report
│   │   │       ├── staff/             # Staff Management
│   │   │       ├── procurement/       # PO & Suppliers
│   │   │       ├── inventory/         # Goods + NPL + CCDC (3 tabs)
│   │   │       ├── finance/           # COGS FIFO + P&L
│   │   │       ├── customers/         # ⭐ CRM Dashboard
│   │   │       ├── promotions/        # ⭐ Promotions Manager
│   │   │       ├── wine-guide/        # ⭐ Wine Serving Notes
│   │   │       ├── settings/          # Settings + Tax Config
│   │   │       ├── alerts/            # 🆕 V2: Inventory Alerts (9 types)
│   │   │       ├── forecast/          # 🆕 V2: Demand Forecast
│   │   │       └── feedback/          # 🆕 V2: Customer Feedback Dashboard
│   │   ├── (pos)/             # POS pages (compact sidebar)
│   │   │   └── pos/
│   │   │       ├── page.tsx           # POS Terminal + Push Sale Sidebar + Wine Guide
│   │   │       ├── kitchen/           # Kitchen Display
│   │   │       └── orders/            # Order History + Receipt
│   │   ├── feedback/[token]/  # 🆕 V2: Public Feedback Page (QR)
│   │   └── login/             # PIN Login
│   ├── components/
│   │   ├── layout/            # Sidebar (19 nav items)
│   │   ├── pos/               # Receipt component
│   │   └── ui/                # shadcn/ui base components
│   ├── lib/
│   │   ├── mock-data.ts       # Legacy (no longer imported by actions)
│   │   ├── staff-constants.ts # Role/status label maps
│   │   └── utils.ts           # cn() utility
│   └── stores/
│       ├── auth-store.ts      # Auth + PIN (Zustand persist)
│       └── cart-store.ts      # Cart state management
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
| **Staff Management** | `/dashboard/staff` | 6 staff cards, role badges, PIN reset, add form, **edit staff** | ✅ Done |
| **Procurement** | `/dashboard/procurement` | PO CRUD, 5 NCC, goods receipt, FIFO batch, Create Supplier | ✅ Done |
| **Inventory** | `/dashboard/inventory` | 3 tabs: Hàng bán + NPL + CCDC, auto depreciation | ✅ Done |
| **Finance/COGS** | `/dashboard/finance` | P&L, COGS FIFO, expense breakdown, per-product margin | ✅ Done |
| **Settings** | `/dashboard/settings` | 9 sections: Store, Tax, **Service Charge**, **QR Payment**, Receipt, Notification, Display, **Operational**, System | ✅ Done |
| **Receipt** | Overlay | Thermal-style bill, print button | ✅ Done |
| **POS → NPL** | Checkout flow | Auto deduct NPL ingredients, stock warnings, COGS tracking | ✅ Done |
| **POS Table Orders** 🆕 | POS `/pos` | **View occupied table orders**, **add items to existing order**, order detail panel | ✅ Done |
| **Customer Tab** ⭐ | POS `/pos` | Open tab VIP, set limit, add items, close tab, tab badge | ✅ Done |
| **Wine Tracking** ⭐ | POS `/pos` | Glass tracking (5/8 ly), FIFO bottle open, sell glass/bottle | ✅ Done |
| **Consignment** ⭐ | `/dashboard/consignment` | Ký gửi NCC, settlement flow, **create consignment form** | ✅ Done |
| **Shift Management** ⭐ | POS top bar | Open/close shift, cash counting, shift timer, expenses | ✅ Done |
| **CRM** ⭐ | `/dashboard/customers` | Customer profiles, loyalty tiers (Silver/Gold/Platinum), wine prefs | ✅ Done |
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

### 📋 Planned (Phase 3+)

| Module | Tính năng chính | Priority |
|--------|----------------|:--------:|
| ~~**Real DB Queries**~~ | ~~Connect mock → real Prisma queries~~ | ~~P1~~ ✅ Done |
| **Seed Data** | Populate DB with initial data (prisma/seed.ts) | P1 |
| **Supabase Auth** | Replace PIN mock → Supabase Auth with RLS | P1 |
| **Telegram Bot** | Low-rating alerts, oxidation alerts, shift reports | P2 |
| **QR Code Generator** | Auto-print QR on receipt for feedback | P2 |
| **Wine Flight** | Tasting portions, flight packages | P3 |
| **Integrations** | GrabFood webhook, website public API | P3 |
| **Export** | Excel/PDF export for reports | P3 |

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
| **Version** | 6.0 |
| **Created** | March 10, 2026 |
| **Last Updated** | March 11, 2026 |
| **Author** | Noonnoir Dev Team |
| **Repository** | [github.com/posnoonnoir-lang/pos-noonnoir](https://github.com/posnoonnoir-lang/pos-noonnoir) |
| **Status** | **🚀 Full Prisma Migration Complete** — 25 routes, 33 modules, 17 server action files migrated, 33 Prisma models, 0 mock data |

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

---

*Last updated: March 11, 2026 — Full Prisma Migration v6.0*
