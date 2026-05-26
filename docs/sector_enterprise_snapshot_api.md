# Sector enterprise snapshot API

Ngày cập nhật: 2026-05-26

## Endpoint nội bộ

```http
GET /api/sector/{code}/enterprise-snapshot?limit=6
```

`code` là mã ngành đang dùng ở URL `/sector/{code}`. Endpoint đọc `cache/sector_{code}.json`, lấy danh sách `tickers`, sau đó gọi live các API Findicator enterprise bổ sung.

## Findicator endpoints được gọi

Endpoint dùng chung:

| Endpoint | Params | Mục đích |
|---|---|---|
| `enterprise/corp-profile` | `ticket` | Giá, vốn hóa, PE/PB, EPS/BVPS, mô tả doanh nghiệp |
| `enterprise/overview-dividend` | `ticket`, `year=All` | Lịch sử cổ tức tiền mặt/cổ phiếu |
| `enterprise/report-data-prediction` | `ticket` | Dữ liệu real/predict phục vụ mở rộng dự báo |

Endpoint doanh thu/LNST theo loại ngành:

| Ngành | Doanh thu | LNST |
|---|---|---|
| Sản xuất, dịch vụ, BĐS, điện, vận tải... | `enterprise/manufactoring-revenue?period=quarter&year=All` | `enterprise/manufactoring-profit-after-tax?period=quarter&year=All` |
| Ngân hàng | `enterprise/bank-revenue?period=quarter&year=5Y` | `enterprise/bank-profit-after-tax?period=quarter&year=5Y` |
| Chứng khoán | `enterprise/stock-revenue?period=quarter&year=5Y` | Chưa có endpoint LNST chuyên biệt trong lớp snapshot |
| Bảo hiểm | `enterprise/insurance-revenue?period=quarter&year=5Y` | Chưa có endpoint LNST chuyên biệt trong lớp snapshot |

Ngân hàng còn gọi thêm `enterprise/bank-bad-debt-ratio` để giữ raw payload cho giao diện nâng cao sau này.

## Response

```json
{
  "sector": "steel",
  "sector_name": "Thép",
  "updated_at": "2026-05-26T10:30:00",
  "tickers": ["HPG", "HSG"],
  "rows": [
    {
      "ticker": "HPG",
      "close_price": 28000,
      "market_cap": 170000000000000,
      "pe": 14.2,
      "pb": 1.6,
      "latest_revenue": 35000000000000,
      "latest_revenue_period": "Q1/2026",
      "latest_profit": 3200000000000,
      "latest_profit_period": "Q1/2026",
      "latest_dividend_year": 2025,
      "cash_dividend": 0.05,
      "stock_dividend": 0.2,
      "revenue_share": 0.48,
      "profit_share": 0.55,
      "market_cap_share": 0.62,
      "errors": {}
    }
  ],
  "enterprises": {
    "HPG": {
      "profile": {},
      "dividends": [],
      "prediction": {},
      "revenue": [],
      "profit_after_tax": []
    }
  }
}
```

`rows` là dữ liệu đã tóm tắt cho UI. `enterprises` giữ raw payload theo ticker để có thể mở thêm chart chi tiết mà không đổi API.

## Giao diện

`static/js/sector-enterprise.js` tự chạy trên mọi trang `/sector/{code}` và render khối G nếu endpoint trả dữ liệu:

- Card KPI theo ticker: giá, PE/PB, doanh thu, LNST.
- Chart tỷ trọng vốn hóa, doanh thu và LNST trong nhóm ticker đang hiển thị.
- Bảng cổ tức gần nhất.
- Bảng snapshot enterprise kèm trạng thái lỗi API theo ticker.

Giới hạn mặc định `limit=6` để không làm trang ngành chậm do gọi quá nhiều endpoint live cùng lúc.
