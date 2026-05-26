#!/usr/bin/env python3
"""
Analyze findicator.vn5.har để:
1. Tìm tất cả endpoint API được gọi
2. Kiểm tra status code, dữ liệu trống
3. Tìm API tiêm năng chưa được sử dụng
4. Kiểm tra lỗi key/data
"""
import json
import re
import sys
from pathlib import Path
from collections import defaultdict
from urllib.parse import urlparse, parse_qs

# Set output encoding
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HAR_FILE = Path(r"C:\Users\DUC CANH PC\Downloads\findicator.vn5.har")

def analyze_har():
    print("[ANALYZING] Dang phan tich HAR file...")
    with open(HAR_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    entries = data['log']['entries']
    print(f"[STATS] Tong requests: {len(entries)}\n")

    api_calls = defaultdict(list)
    errors = []
    empty_data = []

    for idx, entry in enumerate(entries):
        try:
            req = entry.get('request', {})
            resp = entry.get('response', {})

            url = req.get('url', '')
            method = req.get('method', '')
            status = resp.get('status', 0)

            # Chỉ quan tâm API findicator
            if 'api.findicator' not in url and 'findicator.vn' not in url:
                continue

            # Parse URL
            parsed = urlparse(url)
            path = parsed.path
            params = parse_qs(parsed.query)

            # Extract endpoint
            if '/api/' in path:
                endpoint = path.split('/api/')[-1] if '/api/' in path else path
            else:
                endpoint = path

            # Kiểm tra response
            resp_content = resp.get('content', {})
            resp_size = resp_content.get('size', 0)

            api_calls[endpoint].append({
                'status': status,
                'method': method,
                'params': dict(params),
                'size': resp_size,
                'url': url[:200]
            })

            # Tìm lỗi
            if status >= 400:
                errors.append({
                    'endpoint': endpoint,
                    'status': status,
                    'url': url[:150]
                })

            # Tìm response trống
            if status == 200 and resp_size < 100:
                empty_data.append({
                    'endpoint': endpoint,
                    'size': resp_size,
                    'url': url[:150]
                })

        except Exception as e:
            print(f"[WARNING] Loi parsing entry {idx}: {e}")

    # In ket qua
    print("=" * 80)
    print("[ENDPOINTS] API DA GOI (tu HAR)")
    print("=" * 80)

    sorted_endpoints = sorted(api_calls.items(), key=lambda x: len(x[1]), reverse=True)
    for endpoint, calls in sorted_endpoints[:30]:
        statuses = set(c['status'] for c in calls)
        print(f"\n[OK] {endpoint}")
        print(f"  Calls: {len(calls)} | Status: {statuses}")
        if calls:
            print(f"  Sample: {calls[0]['url'][:100]}...")

    print("\n" + "=" * 80)
    print("[ERRORS] LOI (HTTP 400+)")
    print("=" * 80)
    if errors:
        for err in errors[:10]:
            print(f"  [{err['status']}] {err['endpoint']}")
            print(f"       {err['url']}")
    else:
        print("  [OK] Khong co loi HTTP")

    print("\n" + "=" * 80)
    print("[EMPTY] DU LIEU TRONG (size < 100 bytes, 200 OK)")
    print("=" * 80)
    if empty_data:
        for item in empty_data[:10]:
            print(f"  [{item['size']} bytes] {item['endpoint']}")
            print(f"       {item['url']}")
    else:
        print("  [OK] Khong co response trong")

    print("\n" + "=" * 80)
    print("[SUMMARY] THONG KE")
    print("=" * 80)
    print(f"Total unique endpoints: {len(api_calls)}")
    print(f"Total errors: {len(errors)}")
    print(f"Total empty responses: {len(empty_data)}")

    return api_calls, errors, empty_data

if __name__ == '__main__':
    api_calls, errors, empty_data = analyze_har()

    # Save to file
    report = {
        'total_unique_endpoints': len(api_calls),
        'total_errors': len(errors),
        'total_empty_responses': len(empty_data),
        'endpoints': {k: len(v) for k, v in api_calls.items()},
        'errors': errors[:20],
        'empty_responses': empty_data[:20]
    }

    with open('har_analysis_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print("\n[SUCCESS] Report saved to har_analysis_report.json")
