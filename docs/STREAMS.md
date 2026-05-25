# Sector Hub — Master Stream Index
> Hướng dẫn phân phối công việc cho nhiều luồng thực thi độc lập  
> Cập nhật: 2026-05-24

---

## Cách đọc tài liệu này

Mỗi **luồng (stream)** là một tập công việc có thể giao cho 1 agent/người thực hiện độc lập.  
Luồng 0 phải hoàn thành trước. Luồng 1/2/3 chạy song song sau khi Luồng 0 xong.

```
         ┌─────────────────────────────────┐
         │  LUỒNG 0: Foundation (bắt buộc) │
         └────────────────┬────────────────┘
                          │ unlock
         ┌────────────────┼───────────────────────┐
         ▼                ▼                        ▼
  LUỒNG 1            LUỒNG 2                 LUỒNG 3
  Sectors có         Sectors không           Macro
  Findicator         có Findicator           Dashboard
  dashboard          dashboard
  (16 ngành)         (11 ngành)              (1 trang)
```

---

## Tổng quan nhanh

| Luồng | File tài liệu | Số ngành | Phụ thuộc |
|---|---|---|---|
| 0 — Foundation | [stream-0-foundation.md](stream-0-foundation.md) | — | Không |
| 1 — Findicator sectors | [stream-1-findicator.md](stream-1-findicator.md) | 16 | Luồng 0 |
| 2 — Macro-only sectors | [stream-2-macro-only.md](stream-2-macro-only.md) | 11 | Luồng 0 |
| 3 — Macro dashboard | [stream-3-macro.md](stream-3-macro.md) | 1 trang | Luồng 0 |

---

## Files cần đọc khi bắt đầu một luồng

### Bất kỳ luồng nào đều cần đọc trước:
1. `docs/STREAMS.md` — file này (overview)
2. `docs/stream-{N}-*.md` — tài liệu luồng tương ứng

### Luồng 0:
- `docs/ocbs_style_guide.md` — design system (màu, font, spacing)
- `docs/sector_hub_plan.md` §1–§4 (tổng quan, tech stack, layout 6 khối)

### Luồng 1 (Findicator sectors):
- `docs/stream-0-foundation.md` — xác nhận foundation đã xong
- `docs/sector_hub_plan.md` §5.1–§5.16 — mapping dữ liệu ngành cần làm
- `docs/findicator_api.md` — auth + endpoint patterns
- `static/js/charts.js` — base theme + factory functions (do Luồng 0 tạo)
- `static/sector.html` — template 6 khối (do Luồng 0 tạo)

### Luồng 2 (Macro-only sectors):
- `docs/stream-0-foundation.md` — xác nhận foundation đã xong
- `docs/sector_hub_plan.md` §5.17–§5.27 — mapping dữ liệu ngành cần làm
- `docs/findicator_api.md` — macroItemId patterns
- `docs/sstock_api.md` — sstock chart endpoints
- `static/js/charts.js` — base theme + factory functions (do Luồng 0 tạo)

### Luồng 3 (Macro dashboard):
- `docs/stream-0-foundation.md` — xác nhận foundation đã xong
- `docs/sector_hub_plan.md` §5.1 Khối A (macro items) + §4b (per-chart year options)
- `docs/findicator_api.md` — macroItemId list
- `static/macro.html` — template (do Luồng 0 tạo skeleton)

---

## Nguyên tắc chung cho mọi luồng

1. **Không tự tạo CSS inline** — dùng classes từ `main.css` (do Luồng 0 định nghĩa)
2. **Không tự init Highcharts trực tiếp** — dùng `createChart()` / `createStockChart()` từ `charts.js`
3. **Không hardcode màu** — dùng `HC_COLORS[index]` từ `charts.js`
4. **Stale data** — backend set `stale: true` trong JSON cache, frontend gọi `setStaleBadge()`
5. **Per-chart year buttons** — dùng `data-year-options` attribute + `initYearButtons()`, KHÔNG global filter
6. **Dual axis** — tất cả chart có 2 đơn vị tiền tệ phải dùng `yAxis: [{}, { opposite: true }]`
7. **Empty/null data** — luôn check trước khi render, hiển thị placeholder nếu rỗng

---

## Checklist hoàn thành một ngành

- [ ] Collector: `collectors/{sector}_collector.py` — fetch + save cache JSON
- [ ] Router: endpoint trong `routers/sector.py` phục vụ cache JSON
- [ ] Frontend: `static/js/sector-{code}.js` — render 6 khối A–F
- [ ] Test: mở `/sector/{code}` → 6 khối hiển thị, không lỗi console
- [ ] Stale badges: hiển thị đúng với nguồn có vấn đề (xem §4b sector_hub_plan.md)
- [ ] Year buttons: đúng options theo `data-year-options` từng chart

---

## Trạng thái triển khai

> Cập nhật thủ công khi hoàn thành từng hạng mục

| Hạng mục | Trạng thái | Người/Agent |
|---|---|---|
| Luồng 0 — Foundation | ⬜ Chưa bắt đầu | — |
| L1: Steel | ⬜ | — |
| L1: Bank | ⬜ | — |
| L1: Cement | ⬜ | — |
| L1: Pangasius | ⬜ | — |
| L1: Shrimp | ⬜ | — |
| L1: Aviation | ⬜ | — |
| L1: Rubber | ⬜ | — |
| L1: Pig | ⬜ | — |
| L1: Chemistry | ⬜ | — |
| L1: Textile | ⬜ | — |
| L1: Industry (KCN) | ⬜ | — |
| L1: Real Estate | ⬜ | — |
| L1: Transport | ⬜ | — |
| L1: Securities | ⬜ | — |
| L1: Food & Beverage | ⬜ | — |
| L1: Electricity | ⬜ | — |
| L2: Plastics | ⬜ | — |
| L2: Insurance | ⬜ | — |
| L2: Oil & Gas | ⬜ | — |
| L2: Gold | ⬜ | — |
| L2: Coffee | ⬜ | — |
| L2: Wood | ⬜ | — |
| L2: Pharma | ⬜ | — |
| L2: Logistics | ⬜ | — |
| L2: Rice | ⬜ | — |
| L2: Pepper | ⬜ | — |
| L2: Technology | ⬜ | — |
| L3: Macro Dashboard | ⬜ | — |
