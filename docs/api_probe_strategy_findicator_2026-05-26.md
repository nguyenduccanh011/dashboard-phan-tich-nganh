# Chiến lược probe API Findicator theo ngành

Ngày chạy: 2026-05-26

## Chiến lược

1. Lấy danh sách ngành từ collectors hiện có và `docs/sector_hub_plan.md`.
2. Với mỗi ngành, thử các pattern endpoint phổ biến:
   - `{slug}/legend`, `{slug}/legends`
   - `{slug}/enterprise-corp-name`
   - `{slug}/overview/{slug}-data`
   - `{slug}/values`, `{slug}/values-year-over-year`
3. Thêm endpoint chuyên biệt đã xuất hiện trong docs/code, ví dụ `steel/enterprise-domestic-market-share`, `real-estate/company-project`, `stock/enterprise-stock-revenue`, `transport/values`.
4. Probe thêm lớp enterprise dùng chung cho từng ticker đại diện:
   - `enterprise/corp-profile`
   - `enterprise/overview-dividend`
   - `enterprise/report-data-prediction`
   - `enterprise/manufactoring-revenue`
   - `enterprise/manufactoring-profit-after-tax`
   - endpoint riêng cho bank, securities, insurance.
5. Phân loại kết quả thành OK có data, OK rỗng, 400 sai params, 404 không tồn tại, lỗi auth/network.

## Phát hiện kỹ thuật

- `collectors.base` trước đây không tự load `.env`; khi chạy collector/probe trực tiếp bằng `python -m ...`, endpoint cần auth bị lỗi email/password rỗng. Đã sửa bằng `load_dotenv()` trong `collectors/base.py`.
- Một số endpoint bị 400 không phải endpoint chết, mà cần params đúng enum/string. Ví dụ `transport/values` cần `macroIds`, `aviation/flight-company-data` cần `tickets` + `period`, `food-and-beverage/values` cần `repo/period/macroIds`.
- Nhiều ngành không có sector dashboard riêng, nhưng vẫn khai thác tốt qua macro + enterprise.

## Endpoint sector có dữ liệu mạnh

| Ngành | Endpoint đáng khai thác | Kết quả probe |
|---|---|---|
| Transport | `transport/values` | 9,235 rows với freight index, tàu hàng rời, tanker, container routes |
| Chemistry | `chemistry/fertilizer-product-price` | 4,544 rows giá phân bón global/VN |
| Cement | `cement/coal-price`, `average-export-price`, `internal-cement-price` | 1,308 / 60 / 52 rows |
| Steel | `domestic-market-share`, `enterprise-domestic-market-share`, `enterprise-quantity-structure`, `demand-export-status` | 940 / 180 / 120 / 4 series |
| Securities | `stock/enterprise-stock-revenue`, `enterprise-stock-asset`, `enterprise-stock-debt`, `money-flow` | 100 / 100 / 60 / 13 rows |
| Industry | `fdi-sector-by-province`, `region-land`, `province-factory`, `company-approval` | 50 / 36 / 16 / 20 rows |
| Real estate | `real-estate/company-project`, `core-index-valuation`, `laws`, `legends` | project + valuation + law data |
| Electricity | `electric-output-plant`, `output-resource-by-proportion`, `lake-name`, `policy-resource` | strong sector data |
| Shrimp | `enterprise-export-status`, `enterprise-export-price-to-markets`, `overview/shrimp-data` | per-DN export data |
| Textile/F&B/Rubber/Pig/Aviation/Pangasius | legends/overview endpoints | useful sector metadata and selected series |

## Enterprise endpoints dùng để so sánh vị thế doanh số/tỷ trọng

Các endpoint này hoạt động trên hầu hết ticker sản xuất/dịch vụ đã thử:

| Endpoint | Dùng cho |
|---|---|
| `enterprise/manufactoring-revenue?ticket=&period=quarter&year=All` | Doanh thu lịch sử dài để tính thị phần doanh thu trong ngành |
| `enterprise/manufactoring-profit-after-tax?ticket=&period=quarter&year=All` | LNST lịch sử dài để tính tỷ trọng lợi nhuận |
| `enterprise/overview-dividend?ticket=&year=All` | Cổ tức tiền mặt/cổ phiếu |
| `enterprise/report-data-prediction?ticket=` | Dự báo real/predict data |
| `enterprise/corp-profile?ticket=` | Vốn hóa, P/E, P/B, EPS, BVPS, mô tả DN |
| `enterprise/bank-*` | Cấu trúc thu nhập/tài sản/nợ/nợ xấu/LNST ngân hàng |
| `enterprise/stock-revenue` | Cơ cấu doanh thu công ty chứng khoán |
| `enterprise/insurance-revenue` | Phí bảo hiểm gốc theo quý |

## File kết quả chi tiết

- `docs/api_probe_sector_findicator_2026-05-26.md`
- `docs/api_probe_sector_findicator_2026-05-26.json`
- `docs/api_probe_enterprise_findicator_2026-05-26.md`
- `docs/api_probe_enterprise_findicator_2026-05-26.json`
