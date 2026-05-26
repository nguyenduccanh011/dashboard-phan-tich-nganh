#!/usr/bin/env python3
"""Export detailed API response data for analysis"""

import json
from pathlib import Path

def load_har(har_path: str):
    with open(har_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_responses(har_path: str):
    data = load_har(har_path)
    entries = data.get('log', {}).get('entries', [])

    # Group by API endpoint
    api_data = {}

    for entry in entries:
        url = entry.get('request', {}).get('url', '')
        method = entry.get('request', {}).get('method', 'GET')
        status = entry.get('response', {}).get('status', 0)
        content = entry.get('response', {}).get('content', {})
        text = content.get('text', '')

        # Skip non-API and static files
        if any(ext in url for ext in ['.css', '.js', '.woff', '.png', '.svg', '_next/static']):
            continue

        # Extract endpoint
        endpoint = url.split('?')[0].split('/')[-1] if '/' in url else url

        if endpoint not in api_data:
            api_data[endpoint] = {
                'full_urls': set(),
                'responses': [],
                'status_codes': set(),
                'data_samples': []
            }

        api_data[endpoint]['full_urls'].add(url)
        api_data[endpoint]['status_codes'].add(status)

        # Store response sample (first 2 of each endpoint)
        if len(api_data[endpoint]['responses']) < 1 and text:
            api_data[endpoint]['responses'].append({
                'url': url,
                'status': status,
                'size': len(text),
                'content': text[:500]
            })

            # Try to parse
            try:
                resp_json = json.loads(text)
                api_data[endpoint]['data_samples'].append(resp_json)
            except:
                pass

    # Output grouped by category
    print("=" * 150)
    print("FINDICATOR API DATA STRUCTURE ANALYSIS")
    print("=" * 150)

    # Enterprise APIs
    print("\n[ENTERPRISE FINANCE APIs]")
    enterprise_keywords = ['finance', 'corp', 'manufacturing', 'dividend', 'profit', 'revenue']
    for endpoint in sorted(api_data.keys()):
        if any(kw in endpoint.lower() for kw in enterprise_keywords):
            info = api_data[endpoint]
            print(f"\n{endpoint}:")
            print(f"  URLs: {len(info['full_urls'])}")
            print(f"  Status: {sorted(info['status_codes'])}")
            if info['data_samples']:
                sample = info['data_samples'][0]
                if isinstance(sample, dict) and 'data' in sample:
                    print(f"  Data structure: dict with 'data' key")
                    data_list = sample['data']
                    if isinstance(data_list, list) and data_list:
                        print(f"    - Contains {len(data_list)} items")
                        print(f"    - Item keys: {list(data_list[0].keys())}")
                        print(f"    - Sample item: {json.dumps(data_list[0], ensure_ascii=False)[:150]}")
                else:
                    print(f"  Response: {json.dumps(sample, ensure_ascii=False)[:100]}")

    # Electricity APIs
    print("\n\n[ELECTRICITY APIs]")
    for endpoint in sorted(api_data.keys()):
        if 'electricity' in endpoint.lower() or any(x in endpoint.lower() for x in ['enso', 'lake', 'output', 'input', 'resource', 'policy']):
            info = api_data[endpoint]
            print(f"\n{endpoint}:")
            print(f"  URLs: {len(info['full_urls'])}")
            print(f"  Status: {sorted(info['status_codes'])}")
            if info['data_samples']:
                sample = info['data_samples'][0]
                if isinstance(sample, dict):
                    print(f"  Keys: {list(sample.keys())}")
                    if 'data' in sample:
                        print(f"  Sample: {json.dumps(sample['data'][:1] if isinstance(sample['data'], list) else sample['data'], ensure_ascii=False)[:150]}")

    # Steel APIs
    print("\n\n[STEEL APIs]")
    for endpoint in sorted(api_data.keys()):
        if 'steel' in endpoint.lower():
            info = api_data[endpoint]
            print(f"\n{endpoint}:")
            print(f"  URLs: {len(info['full_urls'])}")
            print(f"  Status: {sorted(info['status_codes'])}")

    # Missing/Potential APIs
    print("\n\n[POTENTIALLY USEFUL APIs NOT DEEPLY ANALYZED]")
    print("\nLooking for comparison/ranking related endpoints in findicator...")

    # Check for hidden APIs in responses
    for entry in entries:
        url = entry.get('request', {}).get('url', '')
        content = entry.get('response', {}).get('content', {})
        text = content.get('text', '')

        if text and 'api.findicator' in url:
            try:
                resp_json = json.loads(text)
                if isinstance(resp_json, dict):
                    # Look for references to other APIs
                    json_str = json.dumps(resp_json, ensure_ascii=False)
                    if any(keyword in json_str.lower() for keyword in ['api/', 'endpoint', 'url', 'link']):
                        print(f"  Possible API reference in: {url}")
            except:
                pass


if __name__ == '__main__':
    har_path = r"C:\Users\DUC CANH PC\Downloads\findicator.vn5.har"
    analyze_responses(har_path)
