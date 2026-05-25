# OCBS VVIP — Style Guide tổng hợp
> Lock 2026-05-21 v5.0 · Dùng cho mọi HTML output OCBS (VVIP report + Sector Hub dashboard)  
> Nguồn gốc: `prompts/_vvip_design_rules.md` + `templates/VVIP_canonical_v4.html`

---

## 1. Bảng màu (CSS Variables — paste nguyên vào `:root`)

```css
:root {
  /* === Brand core === */
  --green:       #008C44;
  --green-900:   #004B2C;
  --green-800:   #006633;
  --green-100:   #E8F5EE;

  --gold:        #E4A025;
  --gold-100:    #FFF4DA;

  /* === Surfaces === */
  --paper:       #FAFAF7;   /* nền trang mặc định */
  --paper-2:     #F2F4EF;   /* section xen kẽ, CHỈ điểm gradient */
  --white:       #FFFFFF;   /* card, chart-card, thesis-card */

  /* === Ink === */
  --ink:         #161616;   /* body text */
  --muted:       #5F6460;   /* caption, sub-text (= --ink-soft) */

  /* === Semantic === */
  --red:         #B84B43;   /* risk, warning */
  --red-100:     #FCEDEC;

  /* === Borders & Shadow === */
  --line:        rgba(22,22,22,.10);
  --line-strong: rgba(22,22,22,.18);
  --shadow:      0 14px 42px rgba(0,0,0,.07);
  --shadow-soft: 0 8px 24px rgba(0,0,0,.05);
}
```

### Quy tắc dùng màu

| Surface | Variable | Áp dụng |
|---|---|---|
| Nền trang | `var(--paper)` `#FAFAF7` | `<body>`, section thường |
| Card / chart | `var(--white)` `#FFFFFF` | `.metric`, `.thesis`, `.decision-card`, `.media-card` |
| Section xen | `var(--paper-2)` `#F2F4EF` | `#thesis/#visuals`, `#valuation/#risk/#deep` — gradient endpoint hoặc section tối sau dark |
| Dark band | `var(--ink)` `#161616` | stat-band, CTA band, `.footer`, `.action-plan` dark |

**CẤM**: `#F5F2EA` · `#F4F6F2` · `#F5F5F0` · mọi shade cream ngoài `--paper`.  
**CẤM 2 dark section liền kề**: sau section tối phải có ≥ 1 section sáng.

### Màu chữ — chỉ 4 vai

| Vai | Variable | Dùng cho |
|---|---|---|
| Body | `var(--ink)` | nội dung chính |
| Caption/muted | `var(--muted)` | nhãn nhỏ, footnote, meta |
| Accent xanh | `var(--green)` | heading, kicker, label, link active |
| Accent cam | `var(--gold)` `#E4A025` / `#7A4C00` (trên nền sáng) | số focal, badge event, `.when` timeline |

`--red` CHỈ cho risk. CẤM màu chữ literal ngoài palette (cấm `#9c6b18`, `#7fd99e`...).

---

## 2. Typography

### Font-load (duy nhất — KHÔNG thêm font khác)

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,800;1,400;1,600&family=Playfair+Display:wght@900&display=swap" rel="stylesheet"/>
```

- **Inter** `400 · 600 · 800` upright + `400 · 600` italic (italic CHỈ 2 slogan OCBS)
- **Playfair Display** CHỈ `900` upright (KHÔNG italic)
- CẤM Inter `300 / 500 / 700 / 900` — 700 = faux bold

### Type scale (CSS variables — paste nguyên)

```css
:root {
  --fs-label:      11px;   /* badge, meta, timestamp, stat-label, footer label */
  --fs-caption:    13px;   /* chart-sub, footnote, broker-chip, footer body */
  --fs-body:       15px;   /* thesis-intro, risk-text, timeline-impact */
  --fs-lead:       18px;   /* reco-thesis, timeline-what, company-name */
  --fs-title:      22px;   /* chart-title, val-info h3, pc-spot */
  --fs-metric:     30px;   /* scenario-value, .metric .value */
  --fs-decorative: 80px;   /* ghost number (thesis-index, action-percent) */

  /* Display / responsive */
  --fs-section:    clamp(34px, 4.5vw, 52px);
  --fs-pullquote:  clamp(26px, 3vw, 34px);
  --fs-display:    clamp(44px, 6vw, 80px);
  --fs-mega:       clamp(64px, 10vw, 120px);
  --fs-stat:       clamp(36px, 4vw, 48px);
}
```

**Cấm tuyệt đối** `font-size:` literal số trên class / CSS body (trừ 3 ngoại lệ: `.pullquote-mark` 100px · mobile override · SVG `<text>`).  
Cấm half-pixel: `11.5 / 12.5 / 13.5 / 14.5 / 16.5 / 19 / 20`.  
Cấm SVG `font-size` < 11 và cấm `opacity` trên SVG `<text>` (dùng background pill thay thế).

### Line-height (3 cấp)

```css
:root {
  --lh-tight:   1.25;   /* headings, display number */
  --lh-body:    1.55;   /* body, list, caption */
  --lh-relaxed: 1.70;   /* footer disclaimer, data-sources */
}
```

Cấm `1.3 / 1.35 / 1.4 / 1.5 / 1.6 / 1.65`. Ngoại lệ: `line-height:1` cho số không có descender.

### Section padding token

```css
:root { --sp: 100px 8%; --sp-lg: 120px 8%; }
/* Responsive */
@media (max-width:900px) { section { padding: 70px 6%; } }
```

---

## 3. Brand OCBS — Topbar

```html
<a class="brand" href="#top">
  <span class="brand-mark">
    <img alt="OCBS" src="https://ocbs.com.vn/images/logo.png" style="height:32px"/>
    <em class="brand-slogan">Dẫn lối thịnh vượng bền vững</em>
  </span>
  <span class="brand-divider" aria-hidden="true"></span>
  <span class="brand-copy">
    <strong>OCBS · Trung tâm KD HCM 02</strong>
    <span>{Tên trang} · {DD/MM/YYYY}</span>
  </span>
</a>
```

CSS brand:
```css
.brand { gap: 18px; }
.brand-mark { display:flex; flex-direction:column; gap:3px; }
.brand-mark img { height: 32px; }
.brand-slogan { font-style:italic; font-weight:400; font-size:10.5px; color:#7A4C00; white-space:nowrap; }
.brand-divider { width:1px; height:36px; background:var(--line); }
.topbar-inner { height: 82px; }
/* Mobile ≤900px */
@media (max-width:900px) { .brand-divider { display:none; } }
```

Slogan = **italic THẬT** Inter 400 (1 trong 2 vị trí italic được phép).  
Footerslogan `.brand-slogan-footer` = Inter italic 400 12px `#FFD37A` opacity .86 (italic THẬT slot #2).

---

## 4. Logo URL cố định

```
https://ocbs.com.vn/images/logo.png
```

Kích thước chuẩn: `height:32px` (topbar) · `height:32px` (footer).

---

## 5. Component patterns key

### Card cơ bản

```css
background: var(--white);
border: 1px solid var(--line);
border-radius: 24px;          /* nhỏ: 18px · thường: 24px · lớn: 32px */
padding: 22px;
box-shadow: var(--shadow-soft);
```

### Gradient bar (valuation ladder / thesis top border)

```css
/* Thesis top accent */
background: linear-gradient(90deg, var(--green), var(--gold));
/* Bear fill */
background: linear-gradient(90deg, #A7B0A9, var(--red));
/* Bull fill */
background: linear-gradient(90deg, var(--green), #00B85A);
```

### Section dark (CTA, action, footer)

```css
background: linear-gradient(180deg, var(--green-800), var(--green-900));
color: white;
```

### Severity chip

```css
.severity.high { background:var(--red-100);   color:var(--red); }
.severity.mid  { background:var(--gold-100);  color:#7A4C00; }
.severity.low  { background:var(--green-100); color:var(--green); }
```

### Tag / chip

```css
.tag        { border:1px solid var(--line); border-radius:999px; padding:8px 12px; font-size:12px; font-weight:800; color:var(--muted); }
.tag.green  { color:var(--green); background:var(--green-100); border-color:rgba(0,140,68,.18); }
.tag.gold   { color:#7A4C00; background:var(--gold-100); border-color:rgba(228,160,37,.28); }
```

### Section label (kicker xanh với line)

```css
.section-label { color:var(--green); font-size:11px; font-weight:900; letter-spacing:.16em; text-transform:uppercase; }
.section-label::before { content:""; width:30px; height:2px; background:var(--green); }
```

### Progress bar (top of page)

```css
.progress { position:fixed; top:0; left:0; height:3px; background:linear-gradient(90deg,var(--green),var(--gold)); z-index:2000; }
```

### Utility classes BẮT BUỘC khai báo

```css
.ts-stamp    { font-size:var(--fs-label); font-weight:600; opacity:0.55; margin-left:4px; letter-spacing:0.2px; }
.unit        { font-size:var(--fs-caption); color:var(--muted); font-weight:600; margin-left:2px; }
.v.highlight { color:var(--gold)!important; }
.v.down      { color:var(--red)!important; }
```

---

## 6. Responsive — 5 breakpoint BẮT BUỘC

| Breakpoint | Áp dụng | Hành vi chính |
|---|---|---|
| `max-width:1100px` | iPad landscape, laptop nhỏ | hero stack, cockpit center, 2-col |
| `max-width:900px` | tablet, iPad portrait | brand column, grid → 1-col, chart overflow-x |
| `max-width:640px` | mobile lớn (iPhone 14 Pro Max) | topbar compact, ẩn `.top-actions`, caption position-static |
| `max-width:480px` | mobile thường | thesis/metrics/cockpit-grid → 1-col |
| `max-width:380px` | iPhone SE | font nhỏ hơn, btn compact |

**CSS mobile 640px bắt buộc:**

```css
@media (max-width:640px) {
  .top-actions { display:none!important; }
  .topbar-inner { height:auto; min-height:54px; flex-direction:row; align-items:center; padding:10px 14px; gap:10px; }
  .brand-divider { display:none; }
  .anchor { top:56px!important; }
  html { scroll-padding-top:120px; }

  /* Grid collapse */
  div[style*="grid-template-columns:repeat(2,minmax(0,1fr))"] { grid-template-columns:1fr!important; }
  div[style*="grid-template-columns:repeat(3,minmax(0,1fr))"] { grid-template-columns:1fr!important; }

  /* Hero stage */
  .hero-stage { display:flex; flex-direction:column; min-height:0; aspect-ratio:auto; }
  .hero-stage img { position:relative; width:100%; height:auto; aspect-ratio:16/10; display:block; }
  .hero-stage::after { display:none; }
  .hero-stage .caption { position:static; background:linear-gradient(135deg,#0B2618,#052016); padding:18px 20px 20px; color:#fff; max-width:none; }
}
```

**Inline-style grid — cú pháp NHẤT QUÁN** (attribute selector phải match):
```
repeat(3,1fr)   ← ĐÚNG (không space sau dấu phẩy)
repeat(3, 1fr)  ← SAI (space → attribute selector fail → mobile vẫn 3 cột)
```

**JS chart auto-scroll-to-latest** (paste vào `<script>`):
```javascript
function autoScrollToLatest() {
  document.querySelectorAll('.chart-wrap, .consensus-chart-wrap').forEach(wrap => {
    if (wrap.scrollWidth > wrap.clientWidth) {
      wrap.scrollLeft = wrap.scrollWidth - wrap.clientWidth;
    }
  });
}
requestAnimationFrame(() => requestAnimationFrame(autoScrollToLatest));
window.addEventListener('load', autoScrollToLatest);
```

---

## 7. Inline style — quy tắc

**CẤM** `style="..."` cho: layout (padding/margin/display/grid), typography (font-size/font-family/font-weight/color), background.

**3 ngoại lệ được phép:**
1. CSS custom property override: `style="--conv-pct:62%"`
2. `data-width` attribute trên bar-fill
3. `style="aspect-ratio:4/3|16/9|21/9"` trên cinematic-img

Style lặp ≥ 2 lần → phải thành CSS class. Tổng `style="` target ≤ 10.

---

## 8. VND — Format chuẩn

| Loại | ĐÚNG | SAI |
|---|---|---|
| Giá CP | `15.550 đ` (space trước `đ`) | `15.550đ` · `15.550 đồng` · `15.550 VND` |
| Vùng giá | `14.800 – 15.300 đ` | `14800-15300đ` |
| Tỷ/triệu | `1.469 tỷ` · `210 triệu CP` | `1.469 tỷ đ` · `1.469tỷ` |

Markup chuẩn: `<span class="v">18.000</span> <span class="unit">đ</span>`

---

## 9. Ngôn ngữ — Phong cách VVIP OCBS

**Đối tượng**: Khách hàng Elite · VVIP · C-suite.  
**Phong cách**: Cao cấp · điềm tĩnh · định lượng · có chính kiến · **KHÔNG hô hào**.  
**Test**: "Câu này đọc trước Investment Committee có mất uy tín không?"

### Bảng từ cấm / từ thay thế

| CẤM (retail / hô hào) | DÙNG (institutional) |
|---|---|
| gom mua · gom thêm · ôm hàng | nâng sở hữu · tăng tỷ trọng cá nhân |
| đặt cược · cú đặt cược | định vị danh mục · cam kết vốn |
| bắt đáy · khúc đáy · vùng đáy | vùng giá thấp nhất chu kỳ · vùng định giá chiết khấu |
| cửa sổ tích lũy hẹp | khoảng tham gia cô đặc |
| Trigger chính · Game changer | Yếu tố then chốt · Mốc xác nhận |
| sóng tăng · nhịp điều chỉnh | chu kỳ tăng · đợt điều chỉnh |
| đu lệnh · bứt phá · hot · nóng | **CẤM TUYỆT ĐỐI** |
| FOMO · all-in · tất tay · x2/x3 · kèo | **CẤM TUYỆT ĐỐI** |
| lướt sóng · trade ngắn hạn · đảo hàng | **CẤM** — VVIP không tư duy lướt sóng |
| khóa mắt · soi · canh · rình · săn | theo dõi · kiểm chứng · quan sát |

### Action verb lexicon

**Dùng**: Tích lũy · Nâng tỷ trọng · Hạ tỷ trọng · Quan sát · Mở vị thế · Đóng vị thế  
**Cấm**: Vào hàng · Đu · Đặt cược · All-in · Bắt đáy · Chốt lời

### Thuật ngữ tài chính — Whitelist (giữ tiếng Anh)

`P/E · P/B · ROE · EPS · BVPS · α · NPL · CASA · NIM · LNTT · LNST · CAR · LDR · LLR · FOL · NII · ESOP · IPO · YoY · QoQ · TTM · CAGR · bps · catalyst · moat · peer · Big4 · M&A · NAV · R/R · HĐQT · BCTC · KQKD · VĐL · CP · HOSE · HNX · VN-INDEX · NHNN · FY`

### Bảng dịch chuẩn

| EN (cấm) | VN (chuẩn) |
|---|---|
| fair value | giá hợp lý |
| upside / downside | tiềm năng tăng / tiềm năng giảm |
| spot | giá hiện tại |
| re-rating | tái định giá |
| bear / base / bull case | kịch bản Xấu / Cơ sở / Tốt |
| consensus | đồng thuận |
| ramp / ramp-up | vận hành tăng tốc |
| backlog / presales | đơn hàng tồn / doanh số mở bán |
| breakeven | hòa vốn |
| pricing power | sức định giá |
| free float | lượng CP tự do |
| insider buying | mua nội bộ |

---

## 10. Emoji — CẤM TUYỆT ĐỐI

**Không emoji** trong HTML output: `📞 🌐 📍 ✉️ 📧 🏢` và mọi Unicode emoji.  
Footer contact icons → SVG inline `width:12px; height:12px; stroke="currentColor"`.

---

## 11. Disclaimer — Template chuẩn

```
Tài liệu tham khảo — không phải khuyến nghị mua bán chứng khoán; quyết định đầu tư thuộc về nhà đầu tư. Nguồn: BCTC & CBTT {TICKER} · CafeF · FireAnt · CTCK (4 tháng gần nhất) · ocbs.com.vn / sieucophieu.vn.
```

- Giới hạn ≤ 60 từ
- Hyperlink `ocbs.com.vn` + `sieucophieu.vn` (gold `#FFD37A` trên nền tối)
- CẤM: "Trung tâm KD HCM 02 tổng hợp" · "Bản gửi khách hàng" · liệt kê tên từng CTCK

---

## 12. Chart / SVG

- **Mọi SVG** chuỗi thời gian PHẢI bọc trong `<div class="chart-wrap">` — `overflow-x:auto` + mobile auto-scroll
- SVG `<text font-size="10|11|12">` — cấm `< 11`
- Cấm `opacity` trên SVG `<text>` — dùng background pill `<rect fill="#FFFFFF" fill-opacity="0.92" rx="3">`
- Chart-note label: **luôn dùng `<strong>Hàm ý:</strong>`** — CẤM "Điểm đọc nhanh" / "Điểm chính" / "Insight"
- Auto-scroll JS cho chart timeline (xem §6)

---

## 13. Footer structure

```html
<footer class="footer">
  <div class="footer-inner">
    <!-- Cột 1: Brand -->
    <div>
      <div class="brand-row">
        <img alt="OCBS" src="https://ocbs.com.vn/images/logo.png" style="height:32px"/>
        <div class="version-pill">TRUNG TÂM KD HCM 02</div>
      </div>
      <em class="brand-slogan-footer">Dẫn lối thịnh vượng bền vững</em>
    </div>
    <!-- Cột 2: Thông tin báo cáo -->
    <!-- Cột 3: Liên hệ (hyperlink gold) -->
    <!-- Disclaimer -->
  </div>
</footer>
```

CSS footer:
```css
.footer { background:var(--ink); color:rgba(255,255,255,.75); }
.footer .brand-row { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
.footer .brand-row img { height:32px; }
.footer .version-pill { color:#FFD37A; }  /* gold sáng trên nền tối */
.brand-slogan-footer { font-style:italic; font-weight:400; font-size:12px; color:#FFD37A; opacity:.86; margin-top:10px; display:block; }
.footer li a { color:rgba(255,255,255,0.75); text-decoration:underline; text-underline-offset:3px; }
```

---

## 14. Nội dung — Nguyên tắc biên tập CIO

### Lõi vs vỏ

| GIỮ (lõi) | LOẠI (vỏ) |
|---|---|
| Số định lượng có ngưỡng + timeframe | Tính từ chung không có số ("mạnh", "tốt") |
| Sự kiện verified + nguồn + ngày | Tin đồn, "dự kiến sẽ" không có CBTT |
| 1 thông điệp đắt mỗi khối | 3–5 ý nhỏ trải đều |
| Quan điểm đối ngược có data | Liệt kê pros-cons không trọng số |

### 6 noise cần loại

1. **Preamble fluff**: "Trong bối cảnh thị trường biến động..." → CẮT
2. **Adjective stacking**: "xuất sắc, vững mạnh, dẫn đầu" → giữ 1 adjective định lượng
3. **Liệt kê không trọng số**: chọn 2–3 trọng số cao nhất + lý do bỏ
4. **Lặp số cross-block**: 1 số tối đa 2 lần xuyên suốt trang
5. **Recap kiểu giáo trình**: "Tóm lại...", "Như vậy có thể thấy..." → CẮT
6. **Instructional meta sentences**: "Biểu đồ này giúp nhà đầu tư nhìn nhanh..." → CẮT hoàn toàn

### Word-cap per component

| Component | Giới hạn |
|---|---|
| Summary item | ≤ 22 từ/ô |
| Decision card | ≤ 22 từ/card |
| Evidence sub-row | ≤ 18 từ/dòng |
| Review card (góc phản biện) | ≤ 30 từ/card |
| Section sub | ≤ 180 ký tự |
| Risk text | ≤ 280 ký tự |

**CIO quote**: *"Đừng kể tất cả gì anh biết, kể điều tôi cần biết để ra quyết định."*

---

## 15. Quick checklist trước khi ship

```
☐ 5 breakpoint có mặt (1100/900/640/480/380px)
☐ .top-actions{display:none} trong @media 640px
☐ Không có emoji trong body
☐ Không có: "gom mua" / "bắt đáy" / "FOMO" / "kèo" / retail-ban
☐ Không có: font-weight:700 / font-style:italic > 2 chỗ
☐ Không có: "Điểm đọc nhanh" / "Biểu đồ giúp nhìn nhanh..."
☐ VND format: có space trước "đ" cho giá CP
☐ Disclaimer ≤ 60 từ, có link ocbs.com.vn
☐ Mọi SVG timeline trong chart-wrap
☐ JS autoScrollToLatest có mặt
☐ Inline style ≤ 10 chỗ (chỉ aspect-ratio + custom property)
☐ Grid inline-style không có space sau dấu phẩy: repeat(3,1fr) ✓
```
