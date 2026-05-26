#!/usr/bin/env python3
"""Deep analysis of HAR entries - check for data issues and missing opportunities"""

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Any

def load_har(har_path: str) -> Dict:
    with open(har_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_deep(har_path: str):
    data = load_har(har_path)
    entries = data.get('log', {}).get('entries', [])

    # Focus on findicator APIs (the main sector)
    api_issues = []
    potential_apis = []
    empty_data_apis = []
    auth_issues = []

    print("=" * 120)
    print("DEEP API ANALYSIS")
    print("=" * 120)

    for entry in entries:
        url = entry.get('request', {}).get('url', '')
        method = entry.get('request', {}).get('method', 'GET')
        status = entry.get('response', {}).get('status', 0)
        content = entry.get('response', {}).get('content', {})
        text = content.get('text', '')
        mime_type = content.get('mimeType', '')

        # Skip CSS, JS, static files
        if any(ext in url for ext in ['.css', '.js', '.woff', '.png', '.svg', '_next/static', '_next/data']):
            continue

        # Parse as JSON if possible
        response_json = None
        if text:
            try:
                response_json = json.loads(text)
            except:
                response_json = None

        # Check auth issues
        if 'auth' in url.lower():
            if status >= 400:
                auth_issues.append({
                    'url': url,
                    'method': method,
                    'status': status,
                    'issue': 'Authentication failure'
                })
            print(f"\n[AUTH] {method} {url}")
            print(f"  Status: {status}")
            if response_json:
                print(f"  Response: {json.dumps(response_json, ensure_ascii=False)[:200]}")

        # Check for empty or suspicious responses
        if status == 200 and (not text or len(text.strip()) < 10):
            empty_data_apis.append({
                'url': url,
                'method': method,
                'size': len(text)
            })
            print(f"\n[EMPTY DATA] {method} {url}")
            print(f"  Response size: {len(text)} bytes")
            print(f"  Content: {text[:100]}")

        # Analyze response structure for data issues
        if response_json and status == 200:
            # Check for missing keys or malformed data
            if isinstance(response_json, dict):
                # Check for error messages in response
                for key in ['error', 'errors', 'message', 'msg']:
                    if key in response_json:
                        api_issues.append({
                            'url': url,
                            'method': method,
                            'issue': f'Error in response: {response_json[key]}'
                        })
                        print(f"\n[ERROR IN RESPONSE] {method} {url}")
                        print(f"  Error: {response_json[key]}")

            # Look for comprehensive comparison APIs
            url_lower = url.lower()
            if any(keyword in url_lower for keyword in ['compare', 'ranking', 'ratio', 'proportion', 'statistic', 'benchmark', 'vs', 'metric', 'financial', 'sector']):
                potential_apis.append({
                    'url': url,
                    'method': method,
                    'potential_use': 'Comparison/Ranking feature'
                })
                print(f"\n[POTENTIAL API] {method} {url}")
                print(f"  Use case: Comparison/Ranking")

    # Check what data is available
    print("\n" + "=" * 120)
    print("SECTOR DATA AVAILABLE IN RESPONSES")
    print("=" * 120)

    for entry in entries:
        url = entry.get('request', {}).get('url', '')
        content = entry.get('response', {}).get('content', {})
        text = content.get('text', '')

        if not text or 'findicator' not in url.lower():
            continue
        if any(ext in url for ext in ['.css', '.js', '.woff', '.png', '.svg', '_next']):
            continue

        try:
            response_json = json.loads(text)
            if isinstance(response_json, dict):
                # Sample response
                if 'data' in response_json:
                    data_sample = response_json['data']
                    if isinstance(data_sample, list) and len(data_sample) > 0:
                        print(f"\n[{url.split('/')[-1]}] Sample response structure:")
                        print(f"  Keys: {list(data_sample[0].keys()) if isinstance(data_sample[0], dict) else type(data_sample[0])}")
                        print(f"  Sample: {json.dumps(data_sample[0], ensure_ascii=False)[:150]}")
        except:
            pass

    # Summary
    print("\n" + "=" * 120)
    print("SUMMARY")
    print("=" * 120)
    print(f"Authentication Issues: {len(auth_issues)}")
    print(f"API Issues/Errors: {len(api_issues)}")
    print(f"Empty Data APIs: {len(empty_data_apis)}")
    print(f"Potential Comparison APIs: {len(potential_apis)}")


if __name__ == '__main__':
    har_path = r"C:\Users\DUC CANH PC\Downloads\findicator.vn5.har"
    analyze_deep(har_path)
