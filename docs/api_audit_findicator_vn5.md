# Audit API Findicator từ HAR `findicator.vn5.har`

Ngày rà soát: 2026-05-26  
Nguồn HAR: `C:\Users\DELL\Downloads\findicator.vn5.har`  
Phạm vi HAR thực tế: phiên này chủ yếu đi qua `/electricity`, một lượt `/steel`, và các endpoint nền `enterprise/*`. Không đủ request live để xác nhận toàn bộ 27 ngành; các ngành còn lại được đối chiếu bằng code collector + `docs/sector_hub_plan.md`.

## 1. Lỗi / dữ liệu trống đã xác nhận

| Nhóm | Endpoint / vị trí | Tình trạng | Xử lý |
|---|---|---|---|
| Auth | `GET /api/auth?deviceId=...` | Có 1 request 401 trước khi session/device được xác nhận. Các request sau OK. | Không phải lỗi API ngành; cần giữ cố định `deviceId` + `token` trong `data/secrets/findicator_creds.json`. |
| Điện | `electricity/enso-nearest-date` | HAR trả `list[str]`, không phải dict. Collector cũ không gọi được `enso-forecast`, làm chart forecast trống. | Đã sửa `collectors/electricity_collector.py` để lấy phần tử đầu tiên của list. |
| Điện | `electricity/output-resource-by-proportion` | Response dùng key `name_id`; JS cũ đọc `resourceId`, làm chart cơ cấu nguồn toàn `null`. | Đã sửa `static/js/sector-electricity.js`. |
| Điện | `electricity/lake-name` | Field tên hồ là `lakename`; JS cũ đọc `name/lakeName`, nên chỉ hiện `Hồ {id}`. | Đã sửa `static/js/sector-electricity.js`. |
| Điện + các API nested | `input-price-trend`, `output-price`, `lake-level`, `output-resource-by-value` | Nhiều endpoint trả nested array `[[{date,value}], ...]`; helper cũ chỉ parse array phẳng nên chart có thể trống. | Đã sửa `parseFindicatorSeries()` trong `static/js/charts.js` để flatten. |
| Tài chính DN | `enterprise/v2/finance-ticket-data` thiếu `date` | Client cũ tự dùng quý hiện tại; dễ gọi vào quý chưa công bố và trả rỗng. HAR cũng có trường hợp `PC1` trả `{}` ở `01/01/2026`. | Đã sửa `collectors/base.py`: trước khi gọi dữ liệu sẽ hỏi `finance-data-range` để lấy `maxYear/maxQuarter`. |

## 2. Endpoint HAR xác nhận hữu ích nhưng chưa khai thác đầy đủ trên giao diện

| Endpoint | Dữ liệu | Gợi ý hiển thị |
|---|---|---|
| `enterprise/corp-profile?ticket=` | Snapshot giá, vốn hóa, P/E, P/B, EPS, BVPS, website, mô tả DN | Khối E: card định giá nhanh cho từng DN trong mọi ngành. |
| `enterprise/overview-dividend?year=All&ticket=` | Lịch sử cổ tức tiền mặt/cổ phiếu | Khối E: chart cổ tức hoặc yield lịch sử. |
| `enterprise/manufactoring-revenue?year=All&period=quarter&ticket=` | Doanh thu dài lịch sử theo quý | Khối F: so sánh vị thế doanh số các DN trong ngành. |
| `enterprise/manufactoring-profit-after-tax?year=All&period=quarter&ticket=` | LNST dài lịch sử theo quý | Khối F: biên lợi nhuận, chu kỳ lợi nhuận, rank DN. |
| `enterprise/finance-label?corpType=4&tableName=CASH_FLOW_*` | Mapping account dòng tiền | Bổ sung CFO/FCF/capex cho DN sản xuất, KCN, BĐS, điện. |
| `enterprise/v2/finance-data-range` | Quý/năm mới nhất có dữ liệu theo ticker/table | Nên dùng chung cho mọi collector để tránh data rỗng do sai kỳ. |
| `enterprise/corp-list` / `corp-search` | 1.8k DN, sector, ICB, market cap | Tạo bảng universe theo ngành và tỷ trọng vốn hóa. |

## 3. Điện: endpoint tốt đã có trong HAR

| Endpoint | Kết quả HAR | Ghi chú triển khai |
|---|---|---|
| `electricity/lake-name` | 40 hồ, có `id`, `lakename`, `province`, `region`, `level_avg`, `ticket` | Có thể nhóm theo `region` và ticker. |
| `electricity/lake-level?lakeId=` | Nested time-series mực nước hồ | Dùng top hồ theo `level_avg` hoặc theo ticker. |
| `electricity/output-resource-by-proportion?year=5Y/10Y/All` | 406-491 rows, key `name_id` | Chart cơ cấu nguồn điện theo %. |
| `electricity/output-resource-by-value?resourceId=` | Nested monthly series | Chart sản lượng tuyệt đối theo nguồn. |
| `electricity/electric-output-plant` | 36 nhà máy | Có thể thêm view “nhà máy / doanh nghiệp / nguồn”. |
| `electricity/input-price-trend?nameId=` | Nested 2024-2026 | Giá đầu vào than/dầu/khí. |
| `electricity/latest-input-price?nameId=` | 2 điểm mới nhất | KPI latest + thay đổi gần nhất. |
| `electricity/output-price` | Nested giá bán điện bình quân | Cần flatten trước khi render. |
| `electricity/policy-resource` | 56 dòng quy hoạch công suất | Có thể pivot theo năm và loại nguồn. |
| `electricity/policy-renewable` | 15 dòng FiT | Dữ liệu chính sách tĩnh. |
| `electricity/enso-history` / `enso-forecast` | Lịch sử 915 rows, forecast 9 rows | Collector đã sửa cách lấy forecast date. |

## 4. Rà soát từng ngành theo code hiện tại

| Ngành | Có sector API Findicator riêng | Rủi ro / gap chính | API nên ưu tiên bổ sung |
|---|---:|---|---|
| Steel | Có | HAR chỉ xác nhận `legend`; code đã có thị phần tổng và export, chưa chắc đã hiển thị hết per-DN. | `steel/enterprise-domestic-market-share`, `enterprise/corp-profile`, `overview-dividend`. |
| Bank | Có | Nhiều endpoint bank đã gọi; cần kiểm key account ngân hàng riêng. | `bank/loan-structure-by-sector` từ sstock nếu cần dư nợ theo ngành; `corp-profile`. |
| Cement | Có | Cần live check `year=MAX`/series dài. | `manufactoring-revenue`, `profit-after-tax`, `corp-profile`. |
| Pangasius | Có | Có export market/price; cần chuẩn hóa thị phần DN. | `enterprise/corp-list` để map DN, `corp-profile`, dividend. |
| Shrimp | Có | Có export price/status; cần kiểm endpoint theo market/product có trống không. | `shrimp/export-price-by-product`, long revenue/profit. |
| Aviation | Có | Tài liệu ghi `aviation/flight-company-data year=MAX` trả null. | Dùng `year=5Y`; thêm `visitor-come-to-vn`, jet fuel proxy. |
| Rubber | Có | Tài liệu ghi `rubber/values year=MAX` trả null. | Dùng `year=5Y`; thêm export YoY và DN revenue/profit. |
| Pig | Có | Có API riêng; cần kiểm mapping nameId heo hơi/chi phí. | `pig/macro-comdty-vn`, `pig_farming_global`. |
| Chemistry | Có | Một phần dùng `chart/general-data-series`; cần kiểm endpoint này không thuộc base `/api`. | Fertilizer/caustic/phosphorus overview + finance. |
| Textile | Không rõ sector dashboard riêng | Chủ yếu macro xuất khẩu, FDI, retail. | US apparel retail, Bangladesh/China/India/Turkey export. |
| Industry | Có | Có nhiều endpoint KCN, cần thêm so sánh dự án/quỹ đất. | `industry/company-land`, `company-approval`, `filter-company`. |
| Real estate | Có một số API chuyên biệt, không có full sector dashboard | Live check 2026-05-26: `real-estate/laws` OK, `core-index-valuation` OK, `company-project` rất giàu dữ liệu: VHM 14, NVL 16, PDR 21, DXG 15, KDH 14 dự án. Không tồn tại: `legend`, `supply-demand`, `overview/real-estate-data`, `values`, `values-year-over-year`. | `real-estate/company-project`, `real-estate/core-index-valuation`, `real-estate/laws`, cộng thêm `corp-profile`, `overview-dividend`, finance range. |
| Transport | Có | Tài liệu ghi `transport/values year=MAX` trả null. | Dùng `year=5Y`; thêm Aframax/Suezmax, container routes. |
| Securities | Có dưới slug `stock` | Endpoint tiền ròng chỉ nameId 1/2 có data. | `stock/money-flow`, margin, brokerage share. |
| Food & beverage | Có | Cần kiểm `values` theo group có đầy đủ DN không. | Beer/milk overview + corp profile/dividend. |
| Electricity | Có | Đã xác nhận nhiều lỗi parse/key từ HAR. | Đã sửa; tiếp theo thêm pivot nhà máy/DN/nguồn. |
| Plastics | Không có sector dashboard | Dựa macro giá hạt nhựa + nhập khẩu + BCTC. | `sstock/chart/general-data-series`, `enterprise/*`. |
| Insurance | Không có sector dashboard | Cần kiểm `enterprise/insurance-revenue` trả đủ doanh nghiệp. | Thêm bond yield, premium, corp profile. |
| Oilgas | Không có sector dashboard | Chủ yếu commodity + BCTC; cần thêm revenue/profit dài. | `manufactoring-revenue`, `manufactoring-profit-after-tax`, tanker rates. |
| Gold | Không có sector dashboard | Không phải ngành DN mạnh; chủ yếu macro giá vàng. | `corp-profile` cho PNJ/SJC proxy nếu cần. |
| Coffee | Không có sector dashboard | Dựa COMDTY + XK cà phê; cần tách value/volume/yoy. | `macroItemId=25 nameId=6`, revenue/profit. |
| Wood | Không có sector dashboard | Dựa XK/NK/FDI/IIP; thiếu dữ liệu dự án/DN. | `macroItemId=25/26`, FDI sector, corp profile. |
| Pharma | Không có sector dashboard | Cần import thuốc/NPL + CPI y tế; không có hub riêng. | `macroItemId=26 nameId=62/63`, CPI nameId 5/16. |
| Logistics | Không có sector dashboard | Không gọi được `{slug}/legend`; dùng macro vận tải/XNK. | Container routes, BDI/WCI, FDI logistics. |
| Rice | Không có sector dashboard | Dựa XK gạo + phân bón/nhiên liệu. | `macroItemId=25 nameId=9`, overview-data tab export. |
| Pepper | Không có sector dashboard | Dựa XK hồ tiêu + commodity. | `macroItemId=25 nameId=8`, USD/VND. |
| Technology | Không có sector dashboard | Dựa XK điện tử/điện thoại + macro Mỹ/Trung. | `macroItemId=25 nameId=43/44`, FDI tech, retail US/CN. |

## 5. Việc cần làm tiếp

1. Chạy live collector từng ngành sau khi có network/auth để phân loại endpoint thành: OK, empty hợp lệ, empty bất thường, HTTP lỗi, decrypt lỗi.
2. Thêm audit tự động đọc cache JSON sau mỗi lần collect: đếm số row theo `block_*`, cảnh báo field rỗng, và ghi report.
3. Bổ sung Khối E/F dùng chung: `corp-profile`, `overview-dividend`, `manufactoring-revenue`, `manufactoring-profit-after-tax`, `finance-data-range`.
4. Tạo bảng “vị thế trong ngành”: doanh thu, LNST, vốn hóa, thị phần doanh thu, thị phần LNST, tỷ trọng vốn hóa theo sector universe từ `corp-list`.
