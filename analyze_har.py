#!/usr/bin/env python3
"""Analyze HAR file for API issues, empty data, and missing opportunities"""

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple

class HARAnalyzer:
    def __init__(self, har_path: str):
        self.har_path = Path(har_path)
        self.data = self._load_har()
        self.entries = self.data.get('log', {}).get('entries', [])

        # Track findings
        self.sectors = defaultdict(lambda: {
            'apis': defaultdict(dict),
            'errors': [],
            'empty_data': [],
            'potential_apis': set(),
            'issues': []
        })

    def _load_har(self) -> Dict:
        """Load HAR file"""
        print(f"Loading HAR file: {self.har_path}")
        with open(self.har_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _extract_sector(self, url: str) -> str:
        """Extract sector from URL"""
        patterns = [
            r'/(?:stock|sector)/([a-zA-Z0-9_]+)',
            r'\.([a-zA-Z0-9_]+)\.',
            r'/(?:api|data)/([a-zA-Z0-9_]+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                return match.group(1).lower()

        if 'findicator' in url.lower():
            return 'findicator'
        elif 'cafef' in url.lower():
            return 'cafef'
        elif 'vdsc' in url.lower():
            return 'vdsc'
        elif 'sstock' in url.lower():
            return 'sstock'
        elif 'vavs' in url.lower():
            return 'vavs'
        elif 'simplize' in url.lower():
            return 'simplize'

        return 'other'

    def _get_api_endpoint(self, url: str) -> str:
        """Extract API endpoint from full URL"""
        if '?' in url:
            url = url.split('?')[0]

        match = re.search(r'https?://[^/]+(/[^?#]*)', url)
        if match:
            return match.group(1)
        return url

    def _check_response_status(self, entry: Dict) -> Tuple[int, bool, str]:
        """Check response status"""
        try:
            status = entry.get('response', {}).get('status', 0)
            reason = entry.get('response', {}).get('statusText', '')
            is_error = status >= 400 or status == 0
            return status, is_error, reason
        except:
            return 0, True, 'Unknown error'

    def _check_response_content(self, entry: Dict) -> Tuple[bool, str, int]:
        """Check if response has content"""
        try:
            content = entry.get('response', {}).get('content', {})
            text = content.get('text', '')
            mime_type = content.get('mimeType', '')
            size = content.get('size', 0)

            is_empty = not text or len(text.strip()) == 0
            return is_empty, mime_type, size
        except:
            return True, '', 0

    def _extract_response_data(self, entry: Dict) -> Dict[str, Any]:
        """Try to parse response as JSON"""
        try:
            content = entry.get('response', {}).get('content', {})
            text = content.get('text', '')
            if text:
                return json.loads(text)
        except:
            pass
        return {}

    def _analyze_request_params(self, entry: Dict) -> Dict[str, str]:
        """Extract query parameters and body"""
        params = {}
        url = entry.get('request', {}).get('url', '')

        if '?' in url:
            query_string = url.split('?')[1]
            for param in query_string.split('&'):
                if '=' in param:
                    key, value = param.split('=', 1)
                    params[key] = value

        return params

    def analyze(self):
        """Analyze all entries"""
        print(f"\nAnalyzing {len(self.entries)} requests...")

        for i, entry in enumerate(self.entries):
            if (i + 1) % 100 == 0:
                print(f"  Processed {i + 1}/{len(self.entries)}")

            url = entry.get('request', {}).get('url', '')
            method = entry.get('request', {}).get('method', 'GET')

            sector = self._extract_sector(url)
            endpoint = self._get_api_endpoint(url)
            status, is_error, reason = self._check_response_status(entry)
            is_empty, mime_type, size = self._check_response_content(entry)

            api_key = f"{method} {endpoint}"

            if api_key not in self.sectors[sector]['apis']:
                self.sectors[sector]['apis'][api_key] = {
                    'url': url,
                    'method': method,
                    'endpoint': endpoint,
                    'calls': 0,
                    'errors': 0,
                    'empty_responses': 0,
                    'status_codes': set(),
                    'mime_types': set(),
                    'params': set(),
                }

            api_info = self.sectors[sector]['apis'][api_key]
            api_info['calls'] += 1
            api_info['status_codes'].add(status)
            api_info['mime_types'].add(mime_type)

            if is_error:
                api_info['errors'] += 1
                self.sectors[sector]['errors'].append({
                    'api': api_key,
                    'status': status,
                    'reason': reason,
                    'url': url
                })

            if is_empty and status == 200:
                api_info['empty_responses'] += 1
                self.sectors[sector]['empty_data'].append({
                    'api': api_key,
                    'url': url,
                    'size': size
                })

            params = self._analyze_request_params(entry)
            for param_key in params.keys():
                api_info['params'].add(param_key)

    def generate_report(self) -> str:
        """Generate analysis report"""
        report = []
        report.append("=" * 100)
        report.append("HAR FILE ANALYSIS REPORT")
        report.append("=" * 100)
        report.append(f"Total Requests: {len(self.entries)}")
        report.append(f"Sectors Found: {len(self.sectors)}")
        report.append("")

        for sector in sorted(self.sectors.keys()):
            sector_data = self.sectors[sector]
            apis = sector_data['apis']

            report.append("\n" + "=" * 100)
            report.append(f"SECTOR: {sector.upper()}")
            report.append("=" * 100)

            total_apis = len(apis)
            total_calls = sum(api['calls'] for api in apis.values())
            total_errors = sum(api['errors'] for api in apis.values())
            total_empty = sum(api['empty_responses'] for api in apis.values())

            report.append(f"Total Unique APIs: {total_apis}")
            report.append(f"Total API Calls: {total_calls}")
            report.append(f"Failed Calls (4xx, 5xx): {total_errors}")
            report.append(f"Empty Responses (200 but no data): {total_empty}")
            report.append("")

            if sector_data['errors']:
                report.append("ERRORS:")
                report.append("-" * 100)
                error_apis = defaultdict(list)
                for error in sector_data['errors']:
                    error_apis[error['api']].append(error['status'])

                for api, statuses in sorted(error_apis.items()):
                    status_summary = ", ".join(str(s) for s in sorted(set(statuses)))
                    count = len(statuses)
                    report.append(f"  {api}")
                    report.append(f"    Status Codes: {status_summary} ({count} times)")
                report.append("")

            if sector_data['empty_data']:
                report.append("EMPTY RESPONSES:")
                report.append("-" * 100)
                for empty in sector_data['empty_data'][:10]:
                    report.append(f"  {empty['api']}")
                report.append("")

            report.append("ALL APIs:")
            report.append("-" * 100)
            for api_key in sorted(apis.keys(), key=lambda x: -apis[x]['calls']):
                api = apis[api_key]
                status_str = ", ".join(str(s) for s in sorted(api['status_codes']))
                report.append(f"{api['endpoint']} | Calls: {api['calls']} | Errors: {api['errors']} | Status: {status_str}")
            report.append("")

        return "\n".join(report)

    def save_report(self, output_path: str = None):
        """Save report to file"""
        if output_path is None:
            output_path = str(self.har_path).replace('.har', '_analysis.txt')

        report = self.generate_report()
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)

        print(f"Report saved to: {output_path}")
        return output_path


if __name__ == '__main__':
    import sys

    har_path = r"C:\Users\DUC CANH PC\Downloads\findicator.vn5.har"
    if len(sys.argv) > 1:
        har_path = sys.argv[1]

    analyzer = HARAnalyzer(har_path)
    analyzer.analyze()
    analyzer.save_report()

    print(analyzer.generate_report())
