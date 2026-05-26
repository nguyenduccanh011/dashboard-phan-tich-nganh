# Kế hoạch Refactor Sector Hub — Frontend JS

**Ngày lập:** 25/05/2026  
**Cập nhật:** 25/05/2026  
**Phạm vi:** `static/js/sector-*.js` + `static/js/charts.js` + `collectors/base.py`  
**Mục tiêu:** Loại bỏ code trùng lặp, chuẩn hoá contract cache↔JS, ngăn bug tái phát

---

## 1. Phân tích hiện trạng

### Quy mô
- 27 sector JS files, tổng ~9.000 dòng
- `charts.js` helper: 270 dòng
- 27 cache JSON files tương ứng

### Các pattern lặp lại trong 100% file (27/27)

| Pattern | Số file | Dòng ước tính | Vấn đề |
|---|---|---|---|
| `renderBlockF` (BCTC chart) | 27 | ~25 dòng/file = **675 dòng** | Copy-paste, một số sai `period`, một số sai nested dict |
| `renderBlockE` (valuation table) | 27 | ~50 dòng/file = **1.350 dòng** | Copy-paste, 20+ file sai `analyst` access |
| `getTickerRows` pattern | 24 | ~3 dòng/file | Tự viết mỗi nơi, sai ~6 file |
| `period || year+quarter` fallback | 27 | ~2 dòng/file | Thiếu ở nhiều file gây chart trống |

**Kết luận:** ~2.000/9.000 dòng (~22%) là code trùng lặp có thể extract.

### Nguyên nhân gốc
1. **Không có contract** giữa collector Python và renderer JS — mỗi sector tự đoán cấu trúc cache
2. **Template copy-paste** mà không verify cache thực tế
3. **Không có shared helper** cho các pattern dùng chung (BCTC, table, analyst)
4. **Im lặng khi lỗi** — chart trống không có warning, không có validation

---

## 2. Kiến trúc đề xuất

```
static/js/
├── charts.js          (hiện tại: Highcharts helpers)
├── sector-utils.js    (MỚI: shared helpers cho sector pages)
└── sector-*.js        (giữ nguyên, đơn giản hoá)

collectors/
└── base.py            (thêm normalize_block_f, normalize_block_e)
```

`sector-utils.js` export các hàm dùng chung, `sector-*.js` gọi thay vì tự implement.

---

## 3. Chi tiết từng Phase

> **Thứ tự quan trọng:** Phase 0 (Python) → Phase 1 (helpers) → Phase 2 (renderers) → Phase 3 (validator) → Phase 4 (migrate).  
> Làm Phase 0 trước để JS helpers chỉ cần handle 1 format, không phải 2.

---

### Phase 0 — Chuẩn hoá Collector Output (Python)

**Thời gian ước tính:** 1 ngày  
**Lý do làm trước:** Nếu JS migrate xong mà Python vẫn trả format cũ → `getTickerRows` phải handle 2 format mãi mãi.

**Quy tắc output bắt buộc cho collector:**

```python
# Block F (BCTC) — LUÔN trả về format này:
block_f = {
    "VCB": {
        "VCB": [
            {"year": 2026, "quarter": 1, "accountId": 1, "value": 123456}
        ]
    }
}
# Không được trả về flat list, không được dùng "period" string

# Block E — LUÔN trả về format này:
block_e = {
    "VCB": {
        "trailing": {"VCB": [{"accountId": 57, "value": 0.342}]},
        "analyst": [{"recommend": "BUY", "upside": 15.2, "targetPrice": 85000}]
    }
}
# analyst LUÔN là list (dù 1 item), field LUÔN là "recommend" (không phải "recommendation")
```

Thêm vào `collectors/base.py`:
```python
@staticmethod
def normalize_block_f(raw: dict, ticker: str) -> dict:
    """Đảm bảo output luôn là {ticker: {ticker: [rows]}}"""
    rows = raw.get(ticker, [])
    if isinstance(rows, list):
        return {ticker: {ticker: rows}}
    return {ticker: rows}  # đã đúng format

@staticmethod
def normalize_block_e_analyst(analyst_raw) -> list:
    """Đảm bảo analyst luôn là list với field 'recommend'"""
    if analyst_raw is None:
        return []
    item = analyst_raw[0] if isinstance(analyst_raw, list) else analyst_raw
    # Normalize field name
    if 'recommendation' in item and 'recommend' not in item:
        item['recommend'] = item.pop('recommendation')
    return [item] if not isinstance(analyst_raw, list) else analyst_raw
```

---

### Phase 1 — Shared Helpers

**Thời gian ước tính:** 1 ngày  
**File mới:** `static/js/sector-utils.js`

#### Bước đầu tiên: Thêm script tag vào base template

Trước khi dùng được `sector-utils.js`, cần load nó trong HTML. Tìm base template (thường là `templates/base.html` hoặc `layout.html`) và thêm:

```html
<script src="/static/js/sector-utils.js"></script>
<script src="/static/js/charts.js"></script>
<!-- sector-*.js load sau -->
```

#### 1.1 `showEmpty(containerId, message)`

Dùng trong tất cả renderers khi data rỗng — thay vì chart trống không giải thích.

```js
function showEmpty(containerId, message = 'Không có dữ liệu') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="empty-chart">${message}</div>`;
}
```

#### 1.2 `getTickerRows(blockData, ticker)`

Giải quyết bug phổ biến nhất: `block_f` trả về `{VCB: [...]}` hoặc `{VCB: {VCB: [...]}}`.  
Sau Phase 0, collector luôn trả `{VCB: {VCB: [...]}}`, nhưng helper vẫn handle cả 2 để an toàn trong transition.

```js
function getTickerRows(blockData, ticker) {
  const v = (blockData || {})[ticker];
  if (!v) return [];
  return v[ticker] || (Array.isArray(v) ? v : []);
}
```

#### 1.3 `getAnalystRec(blockE_ticker)`

Giải quyết bug analyst ở 20+ file.

```js
// Hiện tại (sai ở nhiều file):
const rec = analyst?.recommendation;      // sai — field là 'recommend'

// Sau:
const rec = getAnalystRec(blockE[t]);
```

```js
function getAnalystRec(blockE_ticker) {
  const analyst = blockE_ticker?.analyst;
  return Array.isArray(analyst) ? analyst[0] : (analyst || null);
}
```

#### 1.4 `getQuarterRows(rows, n)`

```js
function getQuarterRows(rows, n = 8) {
  const label = r => r.period || `${r.year}Q${r.quarter}`;
  const quarters = [...new Set(rows.map(label))].sort().slice(-n);
  const getQ = (accId) => quarters.map(q => {
    const r = rows.find(x => label(x) === q && x.accountId === accId);
    return r?.value ?? null;
  });
  return { quarters, getQ };
}
```

---

### Phase 2 — Extract Shared Renderers

**Thời gian ước tính:** 2–3 ngày  
**Giảm:** ~2.000 dòng → ~400 dòng (trong 27 files)

#### 2.1 `renderBctcChart(containerId, ticker, blockF, opts)`

Thay thế 27 bản copy `renderBlockF` giống nhau.

> **Lưu ý trước khi implement:** Verify `accId` mapping với cache thực tế của ít nhất 3 sectors khác nhau (bank, shrimp, steel). accountId cho "Biên gộp %" cần confirm — nếu là ratio tính từ 2 account thì không có accId trực tiếp.

```js
function renderBctcChart(containerId, ticker, blockF, opts = {}) {
  const rows = getTickerRows(blockF, ticker);
  if (!rows.length) { showEmpty(containerId, 'Chưa có dữ liệu BCTC'); return; }
  const { quarters, getQ } = getQuarterRows(rows);
  const defaultSeries = [
    { name: 'Doanh thu',   accId: 24, type: 'column', color: HC_COLORS[0] },
    { name: 'LN gộp',      accId: 28, type: 'column', color: HC_COLORS[2] },
    { name: 'LNST',        accId: 43, type: 'column', color: HC_COLORS[3] },
    { name: 'Biên gộp %',  accId: null, type: 'line', color: HC_COLORS[1], yAxis: 1,
      tooltip: { valueSuffix: '%' } },  // accId: null → cần confirm từ cache thực tế
  ];
  const series = (opts.series || defaultSeries)
    .filter(s => s.accId !== null)
    .map(s => ({ ...s, data: getQ(s.accId) }));
  createChart(containerId, {
    chart: { type: 'column' },
    xAxis: { categories: quarters },
    yAxis: [
      { title: { text: opts.yLabel || 'Tỷ VNĐ' } },
      { title: { text: 'Biên gộp %' }, opposite: true, labels: { format: '{value}%' } },
    ],
    series,
  });
}
```

Sector dùng accountId khác (ví dụ bank):
```js
renderBctcChart('chart-bctc', ticker, blockF, {
  yLabel: 'Tỷ VNĐ',
  series: [
    { name: 'NII',  accId: 1,  type: 'column', color: HC_COLORS[0] },
    { name: 'TOI',  accId: 46, type: 'column', color: HC_COLORS[2] },
    { name: 'LNTT', accId: 17, type: 'line',   color: HC_COLORS[1], yAxis: 1 },
  ],
});
```

#### 2.2 `renderValuationTable(containerId, blockE, opts)`

Thay thế 27 bản copy `renderBlockE` (~50 dòng HTML template string mỗi file).

```js
const DEFAULT_ACCOUNT_MAP = {
  marketCap: 85, pe: 89, pb: 90, grossMargin: 29, roe: 67, dtGrowth: 61,
};

const DEFAULT_PCT_FIELDS = new Set(['grossMargin', 'roe', 'dtGrowth']);

function renderValuationTable(containerId, blockE, opts = {}) {
  const accountMap = opts.accountMap || DEFAULT_ACCOUNT_MAP;
  const columns    = opts.columns    || Object.keys(accountMap);
  const pctFields  = new Set(opts.pctFields || [...DEFAULT_PCT_FIELDS]);
  const tickers    = Object.keys(blockE || {});

  if (!tickers.length) { showEmpty(containerId, 'Chưa có dữ liệu định giá'); return; }

  const getValue = (tickerData, field) => {
    const accId = accountMap[field];
    const rows  = tickerData?.trailing?.[Object.keys(tickerData.trailing || {})[0]] || [];
    const row   = rows.find(r => r.accountId === accId);
    return row?.value ?? null;
  };

  const fmt = (val, field) => {
    if (val === null || val === undefined) return '—';
    if (pctFields.has(field)) return `${(val * 100).toFixed(1)}%`;
    return val.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  };

  const headers = columns.map(c => `<th>${c}</th>`).join('');
  const rows = tickers.map(t => {
    const rec  = getAnalystRec(blockE[t]);
    const cells = columns.map(c => `<td>${fmt(getValue(blockE[t], c), c)}</td>`).join('');
    const recCell = rec
      ? `<td class="rec-${rec.recommend?.toLowerCase()}">${rec.recommend} (${rec.upside?.toFixed(1)}%)</td>`
      : '<td>—</td>';
    return `<tr><td>${t}</td>${cells}${recCell}</tr>`;
  }).join('');

  document.getElementById(containerId).innerHTML = `
    <table class="valuation-table">
      <thead><tr><th>Ticker</th>${headers}<th>Analyst</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
```

Bank override với cột đặc thù:
```js
renderValuationTable('block-e-table', blockE, {
  accountMap: { vonHoa: 85, pe: 89, pb: 90, roe: 67, roa: 68, nim: 60, npl: 62 },
  columns: ['vonHoa', 'pe', 'pb', 'roe', 'roa', 'nim', 'npl'],
  pctFields: ['roe', 'roa', 'nim', 'npl'],
});
```

---

### Phase 3 — Cache Contract (Ngăn bug tái phát)

**Thời gian ước tính:** 1 ngày  
**Mục tiêu:** Khi collector thay đổi format → phát hiện ngay, không im lặng

#### 3.1 Stale data detection tự động

```js
function checkDataFreshness(series, label, warnDays = 60) {
  if (!series.length) return;
  const latest = Math.max(...series.map(p => p[0]));
  const daysSince = (Date.now() - latest) / 86400000;
  if (daysSince > warnDays) {
    console.warn(`[${label}] data stale: ${Math.round(daysSince)} ngày kể từ điểm cuối`);
    return daysSince;
  }
  return 0;
}
```

#### 3.2 Dev-mode cache schema validator

Chỉ chạy khi `localhost`:
```js
if (location.hostname === 'localhost') {
  validateSectorCache(data, SECTOR_SCHEMAS['bank']);
}
```

Schema ví dụ:
```js
const SECTOR_SCHEMAS = {
  bank: {
    block_a: {
      lnh: { type: 'object', required: ['chart'], nested: { chart: { required: ['series'] } } },
      tpcp: { type: 'array', minLength: 1, rowFields: ['name_id', 'date', 'value'] },
    },
    block_f: { type: 'tickerDict', rowFields: ['year', 'quarter', 'accountId', 'value'] },
    block_e: { type: 'tickerDict', required: ['trailing', 'analyst'] },
  },
};

function validateSectorCache(data, schema) {
  for (const [block, blockSchema] of Object.entries(schema)) {
    const blockData = data[block];
    if (!blockData) { console.error(`[SCHEMA] missing: ${block}`); continue; }
    for (const [key, rule] of Object.entries(blockSchema)) {
      const val = blockData[key];
      if (rule.type === 'array' && !Array.isArray(val))
        console.error(`[SCHEMA] ${block}.${key}: expected array, got ${typeof val}`);
      if (rule.required && !val)
        console.error(`[SCHEMA] ${block}.${key}: required but missing`);
    }
  }
}
```

---

### Phase 4 — Migrate 27 files

**Thời gian ước tính:** 3–4 ngày  
**Cách làm:** Từng file một, không làm bulk để dễ review

Thứ tự ưu tiên (theo traffic/tầm quan trọng):
1. bank, realestate, oilgas, shrimp (high traffic)
2. industry, securities, transport, insurance
3. Còn lại

Checklist mỗi file:
- [ ] Thay `renderBlockF` → `renderBctcChart(...)`
- [ ] Thay `renderBlockE` → `renderValuationTable(...)`
- [ ] Thay `blockF[t]?.[t] || ...` → `getTickerRows(blockF, t)`
- [ ] Thay `analyst` access → `getAnalystRec(blockE[t])`
- [ ] Thay `r.period || \`${r.year}Q${r.quarter}\`` → `getQuarterRows(rows)`
- [ ] Kiểm tra tất cả `parseFindicatorSeries` calls có đúng `dateField`, `valueField`
- [ ] Mở trang trong browser, kiểm tra chart render đúng, không có lỗi console

---

## 4. Tóm tắt Timeline

| Phase | Nội dung | Effort | Rủi ro |
|---|---|---|---|
| **0** | Chuẩn hoá collector output (Python) | 1 ngày | Thấp |
| **1** | Tạo `sector-utils.js` với helpers + `showEmpty` + script tag | 1 ngày | Thấp |
| **2** | Extract `renderBctcChart` + `renderValuationTable` | 2–3 ngày | Trung bình |
| **3** | Cache schema validator (dev mode) | 1 ngày | Thấp |
| **4** | Migrate 27 sector files | 3–4 ngày | Trung bình |
| **Tổng** | | **~8–10 ngày** | |

---

## 5. Kết quả kỳ vọng

| Metric | Hiện tại | Sau refactor |
|---|---|---|
| Tổng dòng JS (27 files) | ~9.000 dòng | ~5.500 dòng (−40%) |
| `renderBlockF` copies | 27 | 1 |
| `renderBlockE` copies | 27 | 1 |
| Thời gian debug bug mới | Giờ | Phút (schema validator + showEmpty) |
| Khi thêm sector mới | ~300 dòng copy-paste | ~150 dòng config + gọi shared helpers |
| Lỗi im lặng (chart trống) | Phổ biến | Hiển thị message + console.warn |

---

## 6. Không nên làm (out of scope)

- **TypeScript migration** — overhead quá lớn so với benefit, dự án chưa có build pipeline
- **Frontend framework (React/Vue)** — thay đổi architecture quá lớn, không cần thiết
- **Unit test toàn bộ** — test fixtures cho 27 sectors mất nhiều thời gian, ROI thấp

Thay vào đó: dev-mode schema validator (Phase 3) + `showEmpty` (Phase 1) cho 80% benefit với 20% effort.

---

## 7. Điểm cần verify trước Phase 2

- [ ] **accId mapping cho "Biên gộp %"** — kiểm tra cache thực tế của bank, shrimp, steel để xác nhận accountId. Nếu là ratio tính từ 2 account thì cần tính thủ công, không có accId trực tiếp.
- [ ] **`getValue` logic trong `renderValuationTable`** — cần test với cache thực tế, `trailing` có thể có structure khác nhau theo sector.
- [ ] **Base template location** — xác định file HTML cần thêm `<script src="sector-utils.js">`.
