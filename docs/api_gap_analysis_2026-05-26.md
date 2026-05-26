# Phân tích Gap API - findicator.chungkhoan

## 📊 Tổng quan

**HAR file scope**: findicator.chungkhoan (Stock Dashboard) - **16 API endpoints**

**Documented scope**: Toàn bộ findicator.vn - **100+ endpoints** 

Trang stock hiện tại chỉ dùng **16 API** từ tổng **100+ API có sẵn**.

---

## ✅ API đang được dùng (16 endpoints)

Từ HAR analysis (2026-05-26):

| Endpoint | Method | Loại | Ghi chú |
|----------|--------|------|---------|
| /api/auth | GET | Auth | Dùng để lấy thông tin auth |
| /api/stock/legends | GET | Dashboard | Metadata chứng khoán |
| /api/stock/brokerage-market-share-companies | GET | Dashboard | Thị phần môi giới 35 CTCK |
| /api/stock/gross-profit-structure | GET | Dashboard | Cơ cấu LN gộp per CTCK |
| /api/stock/vn-interest-value | GET | Dashboard | Lãi suất huy động (15 entries) |
| /api/stock/vn-interest-metadata | GET | Dashboard | Metadata lãi suất |
| /api/stock/vn-currency-value | GET | Dashboard | Tỷ giá tiền tệ |
| /api/stock/vn-currency-metadata | GET | Dashboard | Metadata tỷ giá |
| /api/stock/vn-stock-metadata | GET | Dashboard | Metadata chỉ số chứng khoán |
| /api/stock/money-flow | GET | Dashboard | Dòng tiền ròng |
| /api/stock/user-preferences | GET | Config | Tuỳ chọn người dùng |
| /api/stock/values-by-account-ids | GET | Dashboard | Time-series theo account ID |
| /api/stock/values-by-macro-ids | GET | Dashboard | Time-series theo macro ID |
| /api/stock/global-stock-metadata | GET | Dashboard | Metadata chỉ số toàn cầu |
| /api/enterprise/corp-search | GET | Enterprise | Tìm kiếm doanh nghiệp |
| Google Analytics | POST | Analytics | Tracking |

---

## ⛔ API trong Tài liệu nhưng CHƯA sử dụng

### Nhóm 1: Authentication & Authorization (2 endpoints)

Các endpoint auth khác ngoài `/api/auth`:

| Endpoint | Purpose | Importance |
|----------|---------|-----------|
| `/api/auth/login-user` | Đăng nhập với email/password + device ID | 🔴 Critical |
| `/api/auth/device/check` | Xác nhận/đăng ký device | 🟠 Important |

**Ghi chú**: HAR chỉ dùng `/api/auth` (GET), không dùng `login-user` (POST). Có thể đã login trước và dùng token cached.

---

### Nhóm 2: Macro Indicators (4 endpoints) ⭐ HIGH VALUE

Các endpoint vĩ mô VN + quốc tế - **CRITICAL gap**:

| Endpoint | macroItemIds coverage | Importance |
|----------|--------|-----------|
| `/api/macro/metric-data` | **35+ macro categories**: GDP, CPI, IIP, FDI, XK/NK, Tín dụng, Lãi suất, Trái phiếu, Tỷ giá, Bán lẻ, Transport, Shrimp, Commodity prices (107 items), US/China macros | 🔴 Critical |
| `/api/macro/menu-macro` | Registry 105 chỉ số macro + factTable mapping | 🟠 Important |
| `/api/macro/get-label-v2` | Legend tree (dim_comdty, CPI sub-nameId, IIP sub-nameId, v.v.) | 🟠 Important |

**Data richness**: 
- Hàng hoá (107 loại): Năng lượng, kim loại, nông sản, tài chính, container routes
- Vĩ mô VN: GDP, CPI, PMI, IIP, FDI, BĐS, tín dụng, lãi suất, tỷ giá, trái phiếu
- Vĩ mô US: CPI, PMI, GDP, FED rates, US labor, Treasury yields
- Vĩ mô Trung Quốc: PMI, CPI, PPI, investment, real-estate

**Stock dashboard hiện tại thiếu**: Cảnh báo các chỉ số vĩ mô ảnh hưởng đến thị trường (GDP/CPI/lãi suất/FDI)

---

### Nhóm 3: Enterprise — Sector Dashboards (100+ endpoints) ⭐⭐ HUGE GAP

**Sector dashboards** — mỗi sector có 5-15 endpoints riêng:

| Sector | # endpoints | Key features | Status |
|--------|-----------|-----------|--------|
| **steel** | 8 | DN: HPG/HSG/NKG/TVDUC; thị phần nội địa; sản lượng; giá NVL; quặng sắt/HRC/than cốc | 📋 Doc |
| **cement** | 6 | Giá xi măng nội địa; giá đầu vào; sản lượng; XK clinker | 📋 Doc |
| **electricity** | 12 | 9 DN (HND/REE/PC1/POW/QTP/ASM/GEG/HDG/NT2); 36 nhà máy; mực nước hồ; ENSO; giá đầu vào | 📋 Doc |
| **bank** | 14 | 30 NH; tín dụng vs trần NHNN; CASA/CoF/NPL; cấu trúc TS/TN/vốn; lãi suất huy động | 📋 Doc |
| **pig** | 3 | Giá heo VN/TQ; ngô; đậu nành; đàn heo | 📋 Doc |
| **aviation** | 4 | VJC/HVN/BAV; số chuyến bay; khách quốc tế | 📋 Doc |
| **transport** | 2 | 28 freight index (Supramax/Capesize/Aframax/Suezmax/VLGC/container routes) | 📋 Doc |
| **stock** | 9 | 35 CTCK; thị phần môi giới; cơ cấu TS/TN/DT; lãi suất; dòng tiền; chỉ số VN | ✅ HAR covered |
| **chemistry** | 7 | Giá phân bón; cơ cấu chi phí SX (Urea/DAP/Kali) | 📋 Doc |
| **rubber** | 3 | Cơ cấu ứng dụng; diện tích trồng; giá cao su | 📋 Doc |
| **textile** | 4 | XK dệt may; NK NVL; cơ cấu ứng dụng; so sánh đối thủ (TQ/Bangladesh/Ấn Độ) | 📋 Doc |
| **real-estate** | 3 | Danh sách dự án; định giá; chính sách pháp lý 2006-2026 | 📋 Doc |
| **food-and-beverage** | 2 | Bia: tiêu thụ theo SP/quốc gia/kênh; cơ cấu CP | 📋 Doc |
| **shrimp** | 7 | CMX/FMC/MPC; XK tôm thẻ/tôm sú; giá theo thị trường; so sánh với XK toàn cầu | 📋 Doc |
| **pangasius** | 5 | ABT/ACL/ANV/IDI/VHC; XK theo thị trường (Mỹ/TQ/EU/ĐNÁ); giá ASP; YoY | 📋 Doc |
| **industry** | 6 | KCN: 12 DN; giá đất KCN; giá thuê NM; FDI by sector/province | 📋 Doc |

**Gap analysis**: Stock dashboard **KHÔNG có bất kỳ sector nào khác** ← Cơ hội lớn để bổ sung

---

### Nhóm 4: Enterprise — Finance Endpoints (50+ endpoints)

Các endpoint tài chính doanh nghiệp (cơ bản + so sánh):

| Category | Endpoints | Data | Stock dashboard dùng |
|----------|-----------|------|---------|
| **Public data** | corp-list, corp-search, corp-profile, report-data-prediction, report-analysis | Snapshot 930KB; lịch sử OHLC 3 năm; 749 rows | ❌ Không dùng |
| **Valuation** | overview-valuation, overview-dividend, overview-shareholder | PE/PB forward+trailing; cổ tức; cổ đông lớn | ❌ Chỉ dùng legends |
| **Manufacturing** | manufactoring-revenue, manufactoring-profit-after-tax | DT/LNST per quý per-DN (corpType=4) | ❌ Không dùng |
| **Stock enterprises** | stock-revenue, stock-ohlc, enterprise-stock-asset/debt/revenue | Cấu trúc DT/TS/nợ per-CTCK (corpType=3) | ❌ Chỉ dùng legends |
| **Bank** | bank-revenue, bank-asset, bank-bad-debt-ratio, bank-debt, bank-profit-after-tax, bank-loan-over-time | Per-bank quarterly (30 NH, corpType=1) | ❌ Chỉ dùng legends |
| **Finance comparison (PUBLIC)** | finance-label, v2/finance-data-range, v2/finance-ticket-data, custom-tickets-same-period | **54 TRAILING metrics** (PE/PB/ROE/ROA/margins/vòng quay/thanh khoản/EVs) | ❌ Không dùng |

**Insight**: Stock dashboard dùng `/api/stock/legends` để lấy metadata, nhưng **KHÔNG khai thác**:
- Per-CTCK financial structure (cấu trúc DT/TS/nợ)
- CTCK OHLC historical (3 năm)
- Valuation snapshot per-CTCK (PE/PB trailing)
- Dividend history (cổ tức lịch sử)
- Analyst reports (báo cáo broker)

---

### Nhóm 5: Overview & News (3 endpoints)

| Endpoint | Features | Stock dashboard dùng |
|----------|----------|---------|
| `/api/overview/legend` | 66 live prices (currency/bond/stock/comdty/crypto); 15 dim tables | ❌ Không |
| `/api/overview/overview-data` | 7 tabs macro (lãi suất/lạm phát/thất nghiệp/PMI/VN macro/XK YoY/NK YoY) | ❌ Không |
| `/api/news` | ~10,901 tin; filter theo ticket/full-text search | ❌ Không |

---

## 📈 Các API "Hot" chưa dùng (Top 10 Priority)

| Priority | Endpoint | Dùng cho | Value-add | Est. effort |
|----------|----------|----------|-----------|-------------|
| 🔴 **P1** | `/api/macro/metric-data` + filters | Thêm macro context tabs (GDP/CPI/PMI/FDI/XK/tín dụng/lãi suất) | Giúp trader hiểu tác động vĩ mô → cổ phiếu | 3-5 days |
| 🔴 | `/api/enterprise/overview-valuation` | Valuation heatmap per-CTCK (PE/PB trailing+forward) | Quick overview thị trường overvalued/undervalued | 2-3 days |
| 🔴 | `/api/overview/overview-data` | Macro backdrop tabs (GDP/CPI/PMI/tín dụng VN + global) | Market context snapshot | 2-3 days |
| 🟠 **P2** | `/api/steel/*` (8 endpoints) | Steel sector dashboard | Thị phần HPG/HSG/NKG, giá NVL, tồn kho | 1 week |
| 🟠 | `/api/bank/*` (14 endpoints) | Bank sector dashboard | Credit growth vs cap, CASA, NPL per-bank (30 NH) | 1 week |
| 🟠 | `/api/electricity/*` (12 endpoints) | Electricity sector dashboard | Sản lượng 36 NM, mực nước hồ, ENSO | 1 week |
| 🟠 | `/api/enterprise/stock-ohlc` | 3-year OHLC history per-CTCK | Thay thế/bổ sung `report-data-prediction` realData | 2-3 days |
| 🟠 | `/api/enterprise/overview-dividend` | Dividend timeline per-CTCK | Div yield, history, payout ratio | 1-2 days |
| 🟠 | `/api/transport/values` | Transport sector dashboard | Charter rates 28 routes (Supramax/Aframax/VLGC) | 1 week |
| 🟠 | `/api/news` | News feed per-CTCK | Tin tức impact trực tiếp thị trường | 2-3 days |

---

## 🎯 Khuyến nghị triển khai

### Giai đoạn 1: Quick wins (1-2 tuần) — Macro context + Valuation

1. **Macro indicators tab** (`/api/macro/metric-data`):
   - Hiển thị: GDP/CPI YoY, PMI VN, Tín dụng YoY, Lãi suất NHNN, FED rate, US 10Y yield
   - Update: Daily
   - Chart: Line chart time-series 1Y + color-coded badge (↑ green / ↓ red)

2. **Valuation heatmap** (`/api/enterprise/overview-valuation`):
   - Grid heatmap 35 CTCK (columns: PE, PB, P/S, EV/EBITDA)
   - Color scale: <1Q median = green, >1Q median = red
   - Update: Daily EOD

3. **News widget** (`/api/news`):
   - "Tin tức mới nhất" widget per-CTCK (top 3 most recent)
   - Full-text search integration

### Giai đoạn 2: Sector dashboards (4-6 tuần) — Ưu tiên steel, bank, electricity

4. **Steel sector dashboard** (`/api/steel/*`):
   - Per-DN: HPG/HSG/NKG TVDUC market share, production, export
   - Input prices: Quặng sắt, HRC, than cốc
   - Charts: 5-7 charts, update monthly

5. **Bank sector dashboard** (`/api/bank/*`):
   - 30 NH comparison: Credit growth vs cap, CASA ratio, NPL ratio
   - Per-bank: Deposit structure, ROE/ROA trailing
   - Charts: 8-10 charts, update quarterly

6. **Electricity sector dashboard** (`/api/electricity/*`):
   - Per-DN: 9 DN output + 36 plant production
   - Hydro level + ENSO forecast
   - Input prices: Coal, gas, oil
   - Charts: 10-12 charts, update monthly

### Giai đoạn 3: Enterprise deep-dives (2-3 tuần) — Finance comparison

7. **Finance comparison** (`/api/enterprise/v2/finance-ticket-data` + TRAILING):
   - Multi-ticker valuation: PE/PB/PS/EV/ROE/ROA comparison
   - Waterfall: DT → LNST breakdown via `manufactoring-revenue-to-profit-ratio`
   - Charts: 5-6 financial comparisons

### Giai đoạn 4: Polish (ongoing) — Additional sectors + News

8. **Additional sector dashboards** (textile, cement, rubber, transport, food, shrimp):
   - 1 sector per 1-2 weeks

9. **Enhanced news/research**:
   - Analyst reports (`/api/enterprise/report-analysis`)
   - News sentiment analysis
   - Earnings season calendar

---

## 📊 API Coverage Summary

```
Total Findicator API endpoints: 160+
├─ Documented: 100+
├─ Currently using (HAR): 16 (16%)
└─ Remaining to implement: 84+ (84%)

By category:
  Auth:                   2 endpoints  (1 used)    — 50% gap
  Macro data:             4 endpoints  (0 used)    — 100% gap ⚠️
  Sector dashboards:      100+ endpoints (0 used)  — 100% gap ⚠️
  Enterprise finance:     50+ endpoints (1 used)   — 98% gap ⚠️
  Overview/news:          3 endpoints  (0 used)    — 100% gap
```

---

## 💡 Quick Implementation Checklist

- [ ] **Week 1**: Macro metrics (GDP/CPI/PMI/lãi suất) + Valuation heatmap
- [ ] **Week 2**: Dividend history + News widget
- [ ] **Week 3-4**: Steel sector dashboard
- [ ] **Week 5-6**: Bank sector dashboard
- [ ] **Week 7-8**: Electricity sector dashboard
- [ ] **Week 9+**: Additional sectors (textile, cement, rubber, transport, food, shrimp)

---

## 📌 Notes

- **HAR verified**: 16 APIs confirmed dùng trên 2026-05-26
- **Documentation**: findicator_api.md covers 100+ endpoints (v4, 2026-05-24)
- **Sector coverage**: 16 sectors documented (stock hiện tại chỉ cover 1 sector = stock/CTCK)
- **Macro richness**: 35+ macroItemId + 160+ sub-indicators (hàng hoá, vĩ mô VN/US/TQ)
