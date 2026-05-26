# Findicator enterprise extensions wired into Sector Hub

Ngày cập nhật: 2026-05-26

## Mục tiêu

Bổ sung các endpoint enterprise đã được probe nhưng chưa có lớp dùng chung trên giao diện. Thay vì sửa từng sector collector, Sector Hub hiện có route live:

```http
GET /api/sector/{code}/enterprise-snapshot?limit=6
```

Route này dùng danh sách ticker trong cache sector hiện có và gọi Findicator theo đúng nhóm ngành.

## Endpoint đã triển khai

| Nhóm | Endpoint | Tình trạng |
|---|---|---|
| Hồ sơ DN | `enterprise/corp-profile?ticket=` | Đã nối vào API nội bộ và UI khối G |
| Cổ tức | `enterprise/overview-dividend?ticket=&year=All` | Đã nối vào bảng cổ tức khối G |
| Dự báo | `enterprise/report-data-prediction?ticket=` | Đã trả raw payload trong response để mở rộng chart sau |
| Sản xuất/dịch vụ | `enterprise/manufactoring-revenue?ticket=&period=quarter&year=All` | Đã dùng cho doanh thu dài hạn |
| Sản xuất/dịch vụ | `enterprise/manufactoring-profit-after-tax?ticket=&period=quarter&year=All` | Đã dùng cho LNST dài hạn |
| Ngân hàng | `enterprise/bank-revenue`, `enterprise/bank-profit-after-tax`, `enterprise/bank-bad-debt-ratio` | Đã nối theo sector `bank` |
| Chứng khoán | `enterprise/stock-revenue?ticket=&period=quarter&year=5Y` | Đã nối theo sector `securities` |
| Bảo hiểm | `enterprise/insurance-revenue?ticket=&period=quarter&year=5Y` | Đã nối theo sector `insurance` |

## Lưu ý dữ liệu

- `overview-dividend.value` là tỷ lệ dạng thập phân: `0.05` tương ứng 5%.
- `manufactoring-*`, `bank-*`, `stock-revenue`, `insurance-revenue` trả `{year, quarter, date, type, value}`.
- `corp-profile.marketCap` được hiển thị dạng số lớn trên UI; đơn vị thực tế phụ thuộc payload Findicator.
- Chứng khoán và bảo hiểm hiện chỉ có doanh thu chuyên ngành trong snapshot; LNST vẫn lấy từ các block BCTC sector cũ nếu cần chart chi tiết.
- `limit` nên giữ 6-8 trên UI để tránh nhiều request live khi mở trang.

## Files liên quan

| File | Vai trò |
|---|---|
| `routers/sector.py` | API `/enterprise-snapshot` |
| `static/sector.html` | Thêm khối G |
| `static/js/sector-enterprise.js` | Render card, chart tỷ trọng, bảng cổ tức/snapshot |
| `static/css/main.css` | Style responsive cho khối G |
| `docs/sector_enterprise_snapshot_api.md` | Contract API nội bộ |
