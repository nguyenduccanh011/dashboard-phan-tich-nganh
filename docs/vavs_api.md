# Tài liệu nhanh VAVS / Vnstock API

> Cập nhật theo tài liệu chính thức Vnstock, truy cập ngày 2026-05-16.  
> Ghi chú: Trong docs không thấy thuật ngữ riêng `VAVS`; tài liệu này hiểu theo nghĩa API Vnstock/Vnstock Unified UI để lấy dữ liệu chứng khoán, tài chính, thị trường và hàng hóa.

## 1. Mục đích sử dụng

Vnstock là thư viện Python giúp truy xuất và chuẩn hóa dữ liệu chứng khoán Việt Nam, dữ liệu tài chính doanh nghiệp, thị trường, hàng hóa, tỷ giá và một số tài sản khác. Dữ liệu trả về chủ yếu là `pandas.DataFrame`, phù hợp để:

- Lấy giá hiện tại, OHLCV, thanh khoản.
- Lấy báo cáo tài chính và chỉ số định giá.
- Tra cứu thông tin doanh nghiệp, cổ đông, ban lãnh đạo, sự kiện.
- Làm dữ liệu đầu vào cho báo cáo phân tích cổ phiếu, bản tin thị trường, infographic.

## 2. Cài đặt và import cơ bản

```bash
pip install vnstock --upgrade
```

```python
from vnstock import Reference, Fundamental, Retail, show_api, show_doc
from vnstock.ui import Market

ref = Reference()
mkt = Market()
fun = Fundamental()
ret = Retail()
```

Helper nên dùng khi quên cú pháp:

```python
show_api()                  # Xem cây API đầy đủ
show_api(ref)               # Xem API trong một nhóm
show_doc("Reference.company")  # Xem tài liệu nhanh cho một node
```

## 3. Nhóm Reference - dữ liệu tham chiếu

### 3.1 Danh sách cổ phiếu

```python
stocks = ref.equity.list()
by_exchange = ref.equity.list_by_exchange()
by_industry = ref.equity.list_by_industry()
vn30 = ref.equity.list_by_group(group="VN30")
```

Ý nghĩa:

| Hàm | Dùng để làm gì |
|---|---|
| `ref.equity.list()` | Danh sách mã cổ phiếu niêm yết |
| `ref.equity.list_by_exchange()` | Phân loại theo HOSE/HNX/UPCOM |
| `ref.equity.list_by_industry()` | Phân loại theo ngành ICB |
| `ref.equity.list_by_group(group="VN30")` | Danh sách theo rổ chỉ số/nhóm |

### 3.2 Chỉ số thị trường

```python
indices = ref.index.list()
groups = ref.index.groups()
members = ref.index.members(symbol="VN30")
```

### 3.3 Thông tin doanh nghiệp

```python
info = ref.company("VCB").info()
shareholders = ref.company("VCB").shareholders()
officers = ref.company("VCB").officers()
subsidiaries = ref.company("VCB").subsidiaries()
ownership = ref.company("VCB").ownership()
insider = ref.company("VCB").insider_trading()
capital = ref.company("VCB").capital_history()
news = ref.company("VCB").news()
events = ref.company("VCB").events()
```

Hàm quan trọng cho báo cáo phân tích:

| Hàm | Ứng dụng |
|---|---|
| `info()` | Tổng quan doanh nghiệp, ngành, vốn hóa nếu có |
| `shareholders()` | Cơ cấu cổ đông lớn |
| `officers()` | Ban lãnh đạo |
| `subsidiaries()` | Công ty con/liên kết |
| `events()` | Cổ tức, ĐHĐCĐ, sự kiện doanh nghiệp |
| `news()` | Tin tức liên quan |

### 3.4 Tìm kiếm mã

```python
symbols = ref.search.symbol("ngân hàng")
```

## 4. Nhóm Market - dữ liệu thị trường

### 4.1 Cổ phiếu

```python
price = mkt.equity("VCB").quote()
ohlcv = mkt.equity("FPT").ohlcv(
    start="2024-01-01",
    end="2024-12-31",
    interval="1D"
)
ticks = mkt.equity("FPT").trades()
```

Tham số chính của `ohlcv()`:

| Tham số | Ý nghĩa |
|---|---|
| `start`, `end` | Ngày bắt đầu/kết thúc, định dạng `YYYY-MM-DD` |
| `interval` | Khung thời gian: `1m`, `5m`, `15m`, `30m`, `1h`, `1D`, `1W` |
| `count` | Số nến cần lấy nếu không truyền `start` |

### 4.2 Lấy bảng giá nhanh

```python
one = mkt.quote("VCB")
watchlist = mkt.quote(["VCB", "HPG", "FPT"])
```

### 4.3 Chỉ số

```python
vnindex = mkt.index("VNINDEX").ohlcv(
    start="2024-01-01",
    end="2024-12-31"
)
vn30_quote = mkt.index("VN30").quote()
```

### 4.4 Tài sản khác

```python
usd_vnd = mkt.forex("USDVND").ohlcv(start="2024-01-01", end="2024-12-31")
btc = mkt.crypto("BTC").ohlcv(start="2024-01-01", end="2024-12-31")
gold_global = mkt.commodity("GC=F").ohlcv(start="2024-01-01", end="2024-12-31")
```

Các nhóm Market trong docs gồm: `equity`, `index`, `etf`, `futures`, `warrant`, `forex`, `crypto`, `commodity`, `fund`.

## 5. Nhóm Fundamental - báo cáo tài chính và chỉ số

```python
income = fun.equity("VCB").income_statement(period="year", orient="report")
balance = fun.equity("VCB").balance_sheet(period="year", orient="report")
cashflow = fun.equity("VCB").cash_flow(period="year", orient="report")
ratio = fun.equity("VCB").ratio(orient="report")
```

Tham số quan trọng:

| Tham số | Giá trị | Ý nghĩa |
|---|---|---|
| `period` | `"year"` | Báo cáo theo năm |
| `period` | `"quarter"` | Báo cáo theo quý |
| `orient` | `"report"` | Dòng là chỉ tiêu, cột là kỳ báo cáo; dễ đọc |
| `orient` | `"time_series"` | Dòng là kỳ báo cáo, cột là chỉ tiêu; tiện tính toán/vẽ chart |

Các chỉ số `ratio()` thường cần cho báo cáo:

| Cột/chỉ số | Ý nghĩa |
|---|---|
| `priceToEarning` | P/E |
| `priceToBook` | P/B |
| `roe` | ROE |
| `roa` | ROA |
| `ticker`, `quarter`, `year` | Mã và kỳ dữ liệu |

Ví dụ lấy dữ liệu quý để phân tích tăng trưởng:

```python
income_q = fun.equity("FPT").income_statement(period="quarter", orient="time_series")
cashflow_q = fun.equity("FPT").cash_flow(period="quarter", orient="time_series")
ratio_q = fun.equity("FPT").ratio(orient="time_series")
```

## 6. Nhóm Retail - vàng và tỷ giá

```python
gold_sjc = ret.gold(source="sjc")
gold_btmc = ret.gold(source="btmc")
fx = ret.exchange_rate()
fx_date = ret.exchange_rate(date="2026-05-16")
```

| Hàm | Tham số | Dữ liệu trả về |
|---|---|---|
| `ret.gold(source="sjc", date=None)` | `source`: `sjc` hoặc `btmc`; `date`: `YYYY-MM-DD` | Giá mua/bán, loại vàng, thời gian cập nhật |
| `ret.exchange_rate(date="")` | `date`: để trống hoặc `YYYY-MM-DD` | Mã tiền tệ, mua tiền mặt, mua chuyển khoản, bán ra |

## 7. Vẽ biểu đồ nhanh

Vnstock tích hợp `.viz` cho DataFrame/Series.

```python
ohlcv["close"].viz.timeseries(
    figsize=(10, 6),
    title="Giá đóng cửa FPT",
    ylabel="Giá",
    xlabel="Thời gian",
    color_palette="vnstock"
)

ohlcv.viz.combo(
    bar_data="volume",
    line_data="close",
    title="Giá và khối lượng FPT",
    left_ylabel="Volume",
    right_ylabel="Price",
    figsize=(10, 6)
)
```

Các chart thường dùng:

| Hàm `.viz` | Dùng cho |
|---|---|
| `timeseries()` | Chuỗi thời gian |
| `combo()` | Giá + khối lượng |
| `bar()` | Doanh thu/LNST theo năm/quý |
| `heatmap()` | Ma trận so sánh |
| `table()` | Xuất bảng đẹp |
| `pie()`, `treemap()` | Cơ cấu cổ đông/doanh thu |
| `hist()`, `boxplot()` | Phân phối dữ liệu |
| `scatter()`, `pairplot()` | Tương quan |

## 8. Mẫu workflow lấy dữ liệu cho báo cáo cổ phiếu

```python
from vnstock import Reference, Fundamental
from vnstock.ui import Market

symbol = "FPT"

ref = Reference()
mkt = Market()
fun = Fundamental()

# 1. Giá và thanh khoản
quote = mkt.equity(symbol).quote()
price_1y = mkt.equity(symbol).ohlcv(
    start="2025-01-01",
    end="2026-05-16",
    interval="1D"
)

# 2. Hồ sơ doanh nghiệp và cổ đông
company = ref.company(symbol).info()
shareholders = ref.company(symbol).shareholders()
officers = ref.company(symbol).officers()
events = ref.company(symbol).events()

# 3. Tài chính
income_y = fun.equity(symbol).income_statement(period="year", orient="time_series")
balance_y = fun.equity(symbol).balance_sheet(period="year", orient="time_series")
cashflow_y = fun.equity(symbol).cash_flow(period="year", orient="time_series")
ratio_y = fun.equity(symbol).ratio(orient="time_series")

# 4. Dữ liệu quý
income_q = fun.equity(symbol).income_statement(period="quarter", orient="time_series")
cashflow_q = fun.equity(symbol).cash_flow(period="quarter", orient="time_series")
```

## 9. Checklist kiểm chứng trước khi dùng số liệu

- Kiểm tra ngày cập nhật của giá hiện tại.
- Kiểm tra đơn vị trong báo cáo tài chính: đồng, triệu đồng, tỷ đồng.
- Với BCTC, đối chiếu thêm báo cáo gốc nếu số liệu dùng để kết luận đầu tư.
- Với định giá, không chỉ dùng P/E/P/B hiện tại; cần kiểm tra EPS/BVPS forward hoặc normalized.
- Với dữ liệu thị trường realtime/intraday, ghi rõ thời điểm tham chiếu.
- Không dùng dữ liệu chưa kiểm chứng để đưa ra khuyến nghị mua/bán.

## 10. Nguồn chính thức

- Tài liệu Vnstock: https://vnstocks.com/docs
- Vnstock API Free: https://vnstocks.com/docs/vnstock
- Kiến trúc Unified UI: https://vnstocks.com/docs/vnstock-data/kien-truc-thu-vien
- Reference: https://vnstocks.com/docs/vnstock/tra-cuu-thong-tin-tham-chieu-reference
- Market: https://vnstocks.com/docs/vnstock/du-lieu-thi-truong-market
- Fundamental: https://vnstocks.com/docs/vnstock/phan-tich-co-ban-fundamental
- Retail/Vàng/Tỷ giá: https://vnstocks.com/docs/vnstock/du-lieu-thi-truong-hang-hoa-retail
- Visualization: https://vnstocks.com/docs/vnstock/bieu-dien-du-lieu
