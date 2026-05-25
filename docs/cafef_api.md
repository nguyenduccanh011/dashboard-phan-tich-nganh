# Tài liệu API cafef.vn (Reverse-engineered)

> Cập nhật: 2026-05-16
> Nguồn: https://cafef.vn/du-lieu/phan-tich-bao-cao.chn

## 1. Tổng quan

cafef.vn dùng **ASP.NET** server-side rendering. Báo cáo phân tích được load qua `.ashx` AJAX handler.

| Thành phần | Giá trị |
|---|---|
| Base URL | `https://cafef.vn` |
| Auth | **Không cần** |
| Referer | Khuyến nghị `Referer: https://cafef.vn/du-lieu/phan-tich-bao-cao.chn` |

---

## 2. Endpoint chính — báo cáo phân tích

```
GET https://cafef.vn/du-lieu/Ajax/PageNew/baocaophantich.ashx
    ?Symbol={TICKER}
    &PageIndex=1
    &PageSize=20
```

**Tham số:**
- `Symbol`: **BẮT BUỘC** — không có Symbol → trả 62 bytes `{"Data":[],"Success":true}` rỗng.
- `PageIndex`, `PageSize`: optional, default = top báo cáo gần nhất.

**Response:**
```json
{
  "Data": [
    {
      "ID": "6a068afa0c16ac472bbb2d0f",
      "Symbol": "MWG",
      "DateDeploy": "/Date(1778544000000)/",      // .NET format → parse epoch ms
      "Title": "MWG - SẴN SÀNG CHO MÙA HÈ NÓNG BỎNG",
      "Body": "Sử dụng phương pháp SOTP và DCF, chúng tôi ước tính giá hợp lý...",
      "FileName": "MWG_20260515...",
      "IsHot": 1,
      "CategoryIDs": "347,",
      "SourceID": 132,                            // numeric — chưa có endpoint mapping
      "CatID": 3,
      "views": 0,
      "LinkDetail": "/report/mwg-...-693632...c3c.chn",  // relative URL
      "ReportType": null
    }
  ],
  "Message": null,
  "Success": true
}
```

### Field quan trọng

| Field | Mô tả | Ghi chú |
|---|---|---|
| `Title` | Tiêu đề báo cáo | Thường chứa khuyến nghị + giá MT |
| `Body` | Tóm tắt báo cáo | Chứa giá MT + khuyến nghị + giả định định giá dạng text |
| `DateDeploy` | Ngày phát hành | `.NET /Date(timestamp_ms)/` → parse: `datetime.utcfromtimestamp(ms/1000)` |
| `SourceID` | ID nguồn CTCK | Numeric — chưa biết endpoint mapping (vd 66, 157, 149, 69, 9, 155, 5, 6…) |
| `CatID` | Category ID | 3 = báo cáo doanh nghiệp |
| `LinkDetail` | URL chi tiết (relative) | Prepend `https://cafef.vn` để có full URL — dẫn tới HTML report (không phải PDF direct) |

---

## 3. Endpoints khác (đã probe)

| Endpoint | Status | Ghi chú |
|---|---|---|
| `/du-lieu/Ajax/PageNew/baocaophantich.ashx?Symbol=` | ✅ 200 | Endpoint chính (mục 2) |
| `/du-lieu/Ajax/PageNew/baocaophantich.ashx` (không Symbol) | 200 nhưng rỗng | Không dùng được làm "all-ticker" |
| `/du-lieu/Ajax/PageNew/Data_BaoCaoPhanTich.ashx` | ❌ 404 | Endpoint cũ, đã dọn |
| `/du-lieu/phan-tich-bao-cao.chn?Symbol=MWG` | ❌ 404 | Không hỗ trợ query string ở page chính |
| `/du-lieu/phan-tich-bao-cao/{sub}.chn` | ✅ 200 (HTML) | Sub-categories: bao-cao-doanh-nghiep, bao-cao-nganh, bao-cao-vi-mo, bao-cao-chien-luoc, ban-tin-etf, cap-nhat-doanh-nghiep-khuyen-nghi |
| `/du-lieu/Ajax/PageNew/RealtimePricesHeader.ashx?symbols=` | ✅ 200 | Giá realtime header — không liên quan báo cáo |

---

## 4. SourceID → tên CTCK (chưa biết mapping)

Đã thấy các SourceID sau (chưa biết tên CTCK tương ứng):

| SourceID | Quan sát từ context (MWG) |
|---|---|
| 5 | Báo cáo SSI? — title đề cập "KHẢ QUAN, Giá mục tiêu" — likely SSI |
| 6 | Tiêu đề "Báo cáo Cập nhật ĐHĐCĐ" |
| 9 | Báo cáo cập nhật |
| 66 | Trùng nội dung với PHS (có thể PHS) |
| 69 | Báo cáo phân tích kĩ thuật |
| 132 | PHS (verified — trùng nội dung "SẴN SÀNG CHO MÙA HÈ NÓNG BỎNG") |
| 149 | Tiêu đề "Gặt hái thành quả" — likely SSI / Shinhan |
| 155 | Tiêu đề "KHỞI ĐẦU CHU KỲ TĂNG TRƯỞNG MỚI" (Vikkibank) |
| 157 | Trùng với NHSV "Lợi nhuận lập đỉnh" |

→ **Cần probe thêm:** Có thể tìm endpoint `/Source/List.ashx` hoặc tương tự để lấy mapping. Hiện collector hiển thị `SID<n>` cho dedup.

---

## 5. Cách collector dùng

`stock_collector.py` gọi endpoint chính với `Symbol=<TICKER>&PageIndex=1&PageSize=20` → ~20 báo cáo. Regex parse `targetPrice` và `recommend` từ `Title + Body` (giống sstock). Hợp nhất với sstock + simplize → mục 13 unified consensus.

---

## 6. So với simplize + sstock

| Tiêu chí | Cafef | Simplize | sstock |
|---|---|---|---|
| Auth | None | None | Login |
| Số báo cáo per-ticker | ~20 | 10 | 10 |
| Field giá MT structured | ❌ regex `Body` | ✅ `targetPrice` int | ❌ regex `content` |
| Field khuyến nghị structured | ❌ regex `Body` | ✅ `recommend` enum | ❌ regex |
| Broker name | ❌ `SourceID` numeric | ✅ `source` text | ✅ `reporter` text |
| PDF direct? | ❌ HTML report → tải PDF từ trang | ✅ direct | ✅ direct |
| Bao gồm báo cáo TA? | ✅ (CatID phân biệt được) | ✅ | ✅ |

**Khuyến nghị:** Cafef là nguồn bổ sung mở rộng coverage broker (cafef có nhiều CTCK nhỏ mà simplize/sstock không có). Khi merge → dedup theo `(broker, date, title)`, nhưng `broker=SID<n>` của cafef thường tạo "broker mới" trong consensus. AI khi tổng hợp consensus cần lọc thủ công: nếu row cafef trùng title+date với row simplize/sstock → bỏ row cafef (duplicate); chỉ giữ row cafef nếu là báo cáo unique không có nguồn khác.
