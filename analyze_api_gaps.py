#!/usr/bin/env python3
"""
Phan tich chi tiet API gaps:
1. Macro items dang duoc su dung
2. Macro items tiem nang chua duoc su dung
3. Kiem tra data trong cac ticker
4. Tim API loi va recommendations
"""
import json
import sys
from pathlib import Path
from collections import defaultdict

if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HAR_FILE = Path(r"C:\Users\DUC CANH PC\Downloads\findicator.vn5.har")

# Macro items mapping tu findicator_api.md
MACRO_ITEMS = {
    1: "GDP tangtruong", 2: "GDP danh nghia", 3: "GDP so sanh",
    4: "CPI", 6: "PMI", 7: "IIP", 8: "Sanpham CN", 9: "Chi so gia NVL",
    10: "PPI", 12: "Chi so tieu thu", 13: "Chi so ton kho", 15: "FDI theo nganh",
    16: "FDI theo quoc gia", 17: "FDI theo dia phuong", 18: "FDI von thuc hien",
    20: "Capital NSNN", 21: "Capital xa hoi", 23: "Ban le", 25: "XK hang hoa",
    26: "NK hang hoa", 27: "XNK dich vu", 29: "Van chuyen HK", 30: "Van chuyen hh",
    31: "Luan chuyen hanh khach", 32: "Luan chuyen hang hoa", 33: "Gia van tai",
    35: "Hang hoa (commodities)", 47: "Tin dung", 46: "Tong PTTT", 48: "Lai suat huy dong",
    49: "Lai suat TT2", 50: "OMO", 52: "Ty gia USD/VND", 53: "Ty gia khac",
    54: "Trai phieu", 55: "Du tru ngoai hoi", 56: "Can can thanh toan",
    58: "Ngan sach NN", 61: "Khach quoc te", 134: "TTCK VN", 135: "XK NK theo tinh",
    136: "XK NK theo tinh", 140: "Can can TM hang hoa",
    70: "CPI My", 71: "PPI My", 72: "GDP My", 73: "GDP My theo nganh",
    75: "PCE My", 76: "Lao dong My", 78: "PMI My", 79: "IIP My theo SP",
    74: "GDP My theo tinh bang", 80: "IIP My theo nganh", 81: "Production Index My",
    84: "Doanh so ban le My", 87: "XNK My", 99: "Tai chinh cong My",
    100: "Ton kho ban le My", 103: "Can can TT My", 104: "Dong von ngoai My",
    138: "US Treasury", 139: "GDPNow Fed Atlanta", 96: "Lai suat FED",
    97: "Tong TS FED", 98: "CĐKT NHTM My", 95: "Cung tien My",
    107: "CPI Trung Quoc", 108: "CPI thanh thi TQ", 109: "CPI nong thon TQ",
    110: "PPI NXS TQ", 112: "PPI TQ", 115: "PMI TQ", 116: "Sanpham CN TQ",
    119: "San luong NL TQ", 121: "BDS phat trien TQ", 122: "BDS dien tich TQ",
    123: "BDS doanh thu TQ", 125: "Dau tu TS co dinh TQ", 126: "Ban le TQ",
    127: "XNK TQ", 131: "Tai khoa TQ", 132: "Cung tien TQ"
}

SECTOR_ENDPOINTS = {
    'electricity': ['lake-level', 'enso-forecast', 'enso-nearest-date', 'enso-history',
                    'latest-input-price', 'output-resource-by-value', 'output-resource-by-proportion',
                    'electric-output-plant', 'manufacturing-revenue-by-company'],
    'steel': ['overview', 'legend', 'market-share'],
    'cement': ['overview', 'legend'],
    'pig': ['overview', 'legend'],
    'chemistry': ['overview', 'legend'],
    'bank': ['overview', 'legend'],
    'stock': ['overview', 'legend', 'brokerage-market-share-companies'],
    'textile': ['overview', 'legend'],
    'rubber': ['overview', 'legend'],
    'food-and-beverage': ['overview', 'legend'],
    'real-estate': ['overview', 'legend'],
    'transport': ['overview', 'legend'],
    'shrimp': ['overview', 'legend', 'export-status', 'export-price-to-markets'],
    'pangasius': ['export-status', 'export-price-to-markets']
}

def analyze_har():
    print("[ANALYZING] Dang phan tich HAR file chi tiet...")
    with open(HAR_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    entries = data['log']['entries']

    # Track all API calls
    macro_calls = defaultdict(int)
    sector_calls = defaultdict(list)
    error_endpoints = []
    empty_responses = []
    ticker_calls = defaultdict(int)

    for entry in entries:
        try:
            req = entry.get('request', {})
            resp = entry.get('response', {})

            url = req.get('url', '')
            status = resp.get('status', 0)
            resp_size = resp.get('content', {}).get('size', 0)

            # Track macro items
            if 'macroItemId=' in url:
                import re
                match = re.search(r'macroItemId=(\d+)', url)
                if match:
                    macro_id = int(match.group(1))
                    macro_calls[macro_id] += 1

            # Track sector endpoints
            for sector, endpoints in SECTOR_ENDPOINTS.items():
                if f'api.findicator.vn/api/{sector}/' in url:
                    for endpoint in endpoints:
                        if endpoint in url:
                            sector_calls[sector].append({
                                'endpoint': endpoint,
                                'status': status,
                                'size': resp_size,
                                'url': url[:200]
                            })

            # Track tickers
            if 'ticket=' in url:
                import re
                match = re.search(r'ticket=([^&]+)', url)
                if match:
                    ticker = match.group(1).replace('%22', '').strip('[]')
                    if ticker and len(ticker) < 10:
                        ticker_calls[ticker] += 1

            # Track errors
            if status >= 400:
                error_endpoints.append({
                    'url': url[:150],
                    'status': status
                })

            # Track empty responses
            if status == 200 and resp_size < 100:
                empty_responses.append({
                    'url': url[:150],
                    'size': resp_size
                })

        except Exception as e:
            pass

    return macro_calls, sector_calls, error_endpoints, empty_responses, ticker_calls

# Main analysis
macro_calls, sector_calls, error_endpoints, empty_responses, ticker_calls = analyze_har()

print("\n" + "=" * 80)
print("[MACRO] MACRO ITEMS DUOC SU DUNG")
print("=" * 80)

if macro_calls:
    for macro_id in sorted(macro_calls.keys()):
        name = MACRO_ITEMS.get(macro_id, "Unknown")
        count = macro_calls[macro_id]
        print(f"  [{macro_id:3d}] {name:30s} - {count} calls")
else:
    print("  [INFO] Khong co macro items trong HAR")

print("\n" + "=" * 80)
print("[MACRO] MACRO ITEMS TIEm NANG (CHUA SU DUNG)")
print("=" * 80)

unused = set(MACRO_ITEMS.keys()) - set(macro_calls.keys())
print(f"  Tong: {len(unused)} macro items tiem nang")
print("\n  VN Macro (tiem nang):")
for macro_id in sorted([m for m in unused if 1 <= m <= 140]):
    name = MACRO_ITEMS.get(macro_id, "")
    print(f"    [{macro_id:3d}] {name}")

print("\n  US/China Macro (tiem nang):")
for macro_id in sorted([m for m in unused if m > 140]):
    name = MACRO_ITEMS.get(macro_id, "")
    print(f"    [{macro_id:3d}] {name}")

print("\n" + "=" * 80)
print("[SECTOR] SECTOR ENDPOINTS SU DUNG")
print("=" * 80)

for sector, calls in sorted(sector_calls.items()):
    if calls:
        endpoints = set(c['endpoint'] for c in calls)
        print(f"  [{sector}] {len(calls)} calls")
        for endpoint in sorted(endpoints):
            count = len([c for c in calls if c['endpoint'] == endpoint])
            errors = len([c for c in calls if c['endpoint'] == endpoint and c['status'] >= 400])
            print(f"    - {endpoint} ({count} calls, {errors} errors)")

print("\n" + "=" * 80)
print("[TICKER] TOP TICKERS DUOC QUERY")
print("=" * 80)

for ticker, count in sorted(ticker_calls.items(), key=lambda x: x[1], reverse=True)[:15]:
    print(f"  {ticker:10s} - {count:3d} calls")

print("\n" + "=" * 80)
print("[ERRORS] LOI DETECTED")
print("=" * 80)

if error_endpoints:
    print(f"  Tong: {len(error_endpoints)} loi\n")
    for err in error_endpoints[:5]:
        print(f"  [{err['status']}] {err['url']}")
else:
    print("  [OK] Khong co loi")

print("\n" + "=" * 80)
print("[EMPTY] EMPTY RESPONSES")
print("=" * 80)

if empty_responses:
    print(f"  Tong: {len(empty_responses)} responses trong\n")
    for item in empty_responses[:5]:
        print(f"  [{item['size']} bytes] {item['url']}")
else:
    print("  [OK] Khong co response trong")

print("\n[SUCCESS] Analysis complete!")
