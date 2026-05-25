# Tài liệu API simplize.vn (Reverse-engineered)

> Cập nhật: 2026-05-16
> Nguồn: https://simplize.vn/_next/data/{buildId}/analysis-report.json

## 1. Tổng quan

simplize.vn dùng **Next.js SSG + ISR**. Các trang được pre-render và data được serve qua `_next/data/{buildId}/*.json` mà KHÔNG cần auth.

| Thành phần | Giá trị |
|---|---|
| Base URL | `https://simplize.vn` |
| Auth | **Không cần** |
| buildId | Thay đổi mỗi deploy — phải auto-resolve |

### 1.1 Auto-resolve buildId

```python
import re, requests

r = requests.get("https://simplize.vn/", headers={"User-Agent": UA}, timeout=15)
m = re.search(r'"buildId":"([^"]+)"', r.text)
build_id = m.group(1) if m else None
```

`buildId` được embed trong `<script id="__NEXT_DATA__">` ở mọi page. Vd 2026-05-16: `AydqzyHaT0z5hROyridYq`.

---

## 2. Endpoints

### 2.1 Global — báo cáo phân tích mới nhất (toàn TT)

```
GET https://simplize.vn/_next/data/{buildId}/analysis-report.json
```

Trả `pageProps.data[]` — **15 báo cáo mới nhất across all tickers**. Không hỗ trợ filter theo ticker hoặc paging (đã thử `?ticker=`, `?page=`, `?pageSize=`, `?skip=&take=`, `?from=&size=` — tất cả trả nguyên 15 items).

Fields: `id, ticker, tickerName, reportType, source, issueDate (dd/MM/yyyy), issueDateTimeAgo, title, attachedLink (PDF), fileName, targetPrice (int VND), recommend (enum)`.

**Sample item:**
```json
{
  "id": 5917191, "ticker": "DCM", "reportType": 1,
  "source": "YUANTA",
  "issueDate": "15/05/2026", "issueDateTimeAgo": "1 ngày",
  "title": "Ấn tượng tích cực",
  "attachedLink": "https://cdn.simplize.vn/simplizevn/report/DCM/An_tuong_tich_cuc.pdf",
  "fileName": "An_tuong_tich_cuc.pdf",
  "targetPrice": 47700,
  "recommend": "TRUNG LẬP"
}
```

### 2.2 Per-ticker — báo cáo phân tích CTCK + báo cáo nội bộ DN

```
GET https://simplize.vn/_next/data/{buildId}/co-phieu/{TICKER}/bao-cao.json
```

Trả `pageProps` với 4 keys:

| Key | Mô tả |
|---|---|
| `ticker` | Mã CK (echo) |
| `summary` | 74 fields về công ty (xem 2.2.1) |
| `analysisReports` | 10 báo cáo CTCK gần nhất (xem 2.2.2) |
| `report` | `{BCTC, BCTN, NQDHCD, BCB}` — báo cáo nội bộ DN (xem 2.2.3) |

#### 2.2.1 `summary` (74 fields)

Một số field độc đáo (không có ở sstock/VDSC):

| Field | Mô tả |
|---|---|
| `freeFloatRate` | % free float thực |
| `valuationPoint`, `growthPoint`, `passPerformancePoint`, `financialHealthPoint`, `dividendPoint` | Điểm 1-5 từng tiêu chí |
| `overallRiskLevel` | "low" / "medium" / "high" |
| `companyQuality` | Điểm quality 1-5 |
| `qualityValuation` | "-1" / "0" / "1" — quality-adjusted valuation flag |
| `taSignal1d` | Signal TA: "bullish" / "bearish" / "neutral" |
| `watchlistCount` | Số user đang follow |
| `beta5y` | Beta 5 năm |
| `pricePctChg7d/30d/ytd/1y/3y/5y` | % thay đổi giá |
| `revenue5yGrowth/netIncome5yGrowth` | CAGR 5 năm |
| `revenueLtmGrowth/netIncomeLtmGrowth` | LTM growth |
| `revenueGrowthQoq/netIncomeGrowthQoq` | QoQ growth |
| `evEbitdaRatio` | EV/EBITDA |
| `noOfRecommendations` | Số khuyến nghị CTCK đang active |
| `website` | URL website chính thức công ty |

#### 2.2.2 `analysisReports[]` — báo cáo phân tích CTCK (Tier 2)

10 báo cáo gần nhất cho ticker. Schema giống 2.1 nhưng filter theo `ticker`.

**Sample (MWG):**
```json
{
  "id": 5859072, "ticker": "MWG", "reportType": 1,
  "source": "PHS", "issueDate": "13/05/2026", "issueDateTimeAgo": "3 ngày",
  "title": "Sẵn sàng cho mùa hè nóng bỏng",
  "attachedLink": "https://cdn.simplize.vn/simplizevn/report/MWG/San_sang_cho_mua_he_nong_bong.pdf",
  "targetPrice": 115600,         // ← INT VND structured ⭐
  "recommend": "MUA"             // ← enum structured ⭐
}
```

**Recommend enum:** `MUA`, `TÍCH LŨY`, `TRUNG LẬP`, `KHẢ QUAN`, `KHÁC`, `GIẢM`, `BÁN`.

**Source — brokers điển hình (verified MWG):** PHS, SHINHAN, VPBS, SSI, ABS, ACBS, MAS, KBSV, MBS.

#### 2.2.3 `report.{BCTC,BCTN,NQDHCD,BCB}[]` — báo cáo nội bộ DN (Tier 1)

PDF links trực tiếp từ vietstock CDN + simplize CDN. Thay thế nhu cầu cào website công ty.

| Key | Nội dung | Số file thường có |
|---|---|---|
| `BCTC` | Báo cáo tài chính (kiểm toán năm + quý gần nhất) | 3 |
| `BCTN` | Báo cáo thường niên (Annual Report) | 3 |
| `NQDHCD` | Nghị quyết ĐHCĐ thường niên | 3 |
| `BCB` | Bản cáo bạch niêm yết | 1 |

Mỗi item: `{id, ticker, title, attachedLink, fileName, issueDate}`.

**Lưu ý:** `issueDate` thường là `21/01/1970` (placeholder epoch) → bỏ qua, lấy năm từ `title` / `fileName`.

---

## 2.3 Định giá ngành (P/E + P/B benchmark)

### Industry tree root (10 ngành cấp 1)

```
GET https://simplize.vn/_next/data/{buildId}/co-phieu/nganh.json
```

Trả `pageProps.parentIndustryGroups[10]` — mỗi item: `{name, id, slug, peRatio, pbRatio, marketCap, totalTicker, pricePctChg*}`. Và `pageProps.summary` chứa aggregate toàn TT (1,616 mã).

### Cấp 2 (economic sector) + sub-industries

```
GET https://simplize.vn/_next/data/{buildId}/co-phieu/nganh/{ec_slug}.json
```

Trả `pageProps.summary` (cấp 2 aggregate) + `pageProps.sectorList[]` (danh sách cấp 3 sub-industries dưới cấp 2 đó). Slug ví dụ: `hang-hoa-khong-thiet-yeu`, `bat-dong-san`, `tai-chinh`.

### Cấp 3 (sub-industry) — endpoint chính dùng cho benchmark

```
GET https://simplize.vn/_next/data/{buildId}/co-phieu/nganh/{ec_slug}/{ig_slug}.json
```

Trả:

| Key | Mô tả |
|---|---|
| `pageProps.industry` | Aggregate cấp 3 — `peRatio, pbRatio, marketCapVnd, totalTicker, industryName, industryNameSlug, industryId` |
| `pageProps.sector` | Aggregate cấp 2 (parent) — cùng schema |
| `pageProps.dataFilter[]` | Danh sách công ty trong sub-industry (~30 mã) với 100+ fields (P/E, P/B, marginOfSafety, valuationPoint, consensusTargetPriceMean, …) |

**Lấy slug từ ticker:** trong per-ticker JSON (mục 2.2.1), `summary.bcEconomicSectorSlug` = ec_slug, `summary.bcIndustryGroupSlug` = ig_slug.

**Ví dụ:**
- MWG: ec=`hang-hoa-khong-thiet-yeu`, ig=`ban-le-chuyen-dung` → cấp 3 PE=14.79 PB=3.33 (19 mã)
- VCB: ec=`tai-chinh`, ig=`tai-chinh-ngan-hang` → cấp 3 PE=9.72 PB=1.67 (29 mã)
- KDH: ec=`bat-dong-san`, ig=`quan-ly-va-phat-trien-bat-dong-san` → cấp 3 = cấp 2 (parent chỉ có 1 sub)

### Edge case — parent có 1 sub-industry duy nhất

Khi `bat-dong-san` chỉ có 1 sub `quan-ly-va-phat-trien-bat-dong-san` → cấp 3 và cấp 2 trả cùng giá trị (cùng `industryId=55` hoặc cùng aggregate). Collector vẫn hiển thị cả 2 dòng để AI nhận diện trường hợp này.

---

## 2.4 Chỉ số thị trường (VNINDEX P/E + P/B)

```
GET https://simplize.vn/_next/data/{buildId}/chi-so/VNINDEX.json
```

Trả `pageProps.summary` (33 fields) — quan trọng:

| Field | Mô tả |
|---|---|
| `peRatio`, `pbRatio` | P/E + P/B toàn TT HOSE |
| `priceClose` | Giá đóng cửa VNINDEX |
| `indexHigh`, `indexLow` | Cao/thấp phiên |
| `close52wHigh`, `close52wLow` | 52W high/low |
| `marketCapVnd` | Vốn hóa HOSE |
| `volume`, `volAvg90d` | Volume |
| `pricePctChg7d/30d/ytd/1y/3y/5y` | % thay đổi giai đoạn |

**Lưu ý:** Endpoint trả CURRENT values (real-time intraday hoặc EOD). KHÔNG có history endpoint cho P/E lịch sử của VNINDEX qua simplize — nếu cần historical P/E (vd P/E TT 1 năm trước để so sánh) phải tìm nguồn khác.

Slug khác cũng có thể thử: `/chi-so/VN30`, `/chi-so/HNX-INDEX`, `/chi-so/UPCOM-INDEX` (chưa verify).

---

## 3. Auth & rate limit

- Auth: **Không cần**. Mọi endpoint trên đều public.
- Rate limit: Chưa thấy 429 nào trong các test (5-10 req/phút OK).
- User-Agent: bắt buộc set browser UA, nếu thiếu một số trang sẽ trả HTML thay JSON.

---

## 4. So với sstock /analysis-report

| Tiêu chí | Simplize | sstock |
|---|---|---|
| Auth | None | better-auth login |
| `targetPrice` | INT VND structured | Phải regex từ content |
| `recommend` | Enum structured | Phải regex từ title+content |
| Số báo cáo per-ticker | 10 | 10 |
| Broker coverage (MWG) | 9 | 6 |
| Báo cáo nội bộ DN (BCTC/BCTN/NQDHCD/BCB) | ✅ direct PDF | ❌ |
| Company summary fields | 74 (rich quality scores) | ~15 (chỉ ratios) |
| Pagination/filter | ❌ (fixed 10 per ticker) | ❌ |

**Khuyến nghị tích hợp:** Simplize làm nguồn ưu tiên cho Consensus CTCK (vì structured); sstock + cafef bổ sung để mở rộng broker coverage; dedup theo `(broker, date, title)` ở collector.
