#!/usr/bin/env python3
"""Query and filter API analysis data by sector"""

import json
import sys
from pathlib import Path

def load_analysis():
    json_path = r"f:\PROJECTS\sector-hub\API_SECTOR_ANALYSIS.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def show_sector(sector_name, data):
    """Show detailed info for a sector"""
    if sector_name not in data['sectors']:
        print(f"Sector '{sector_name}' not found")
        return

    sector = data['sectors'][sector_name]
    print("=" * 100)
    print(f"SECTOR: {sector['category'].upper()}")
    print("=" * 100)

    # Active APIs
    print(f"\n[ACTIVE] APIs ({len(sector['active_apis'])} endpoints):")
    for api in sector['active_apis']:
        print(f"\n  {api['endpoint']}")
        print(f"    Calls: {api['calls']} | Status: {api['status']}")
        if api.get('parameters'):
            print(f"    Parameters: {', '.join(api['parameters'].keys())}")
        if api.get('issues'):
            print(f"    [ISSUE] Issues: {len(api['issues'])} found")

    # Missing APIs
    print(f"\n\n[MISSING] APIs ({len(sector['missing_apis'])} endpoints):")
    for api in sector['missing_apis']:
        priority = api['priority'].upper()
        print(f"\n  {api['endpoint']}")
        print(f"    Priority: {priority}")
        print(f"    Purpose: {api['purpose']}")

    # Recommendations
    print(f"\n\n[RECOMMENDATIONS]:")
    for i, rec in enumerate(sector['recommendations'], 1):
        print(f"  {i}. {rec}")

def show_critical_issues(data):
    """Show critical issues"""
    print("=" * 100)
    print("CRITICAL ISSUES")
    print("=" * 100)

    for issue in data['critical_issues']:
        print(f"\n[{issue['severity'].upper()}] {issue['type'].upper()}")
        print(f"  Endpoint: {issue['endpoint']}")
        if issue.get('status_code'):
            print(f"  Status: {issue['status_code']}")
        print(f"  Issue: {issue['description']}")
        print(f"  Fix: {issue['fix']}")

def show_summary(data):
    """Show summary statistics"""
    print("=" * 100)
    print("API ANALYSIS SUMMARY")
    print("=" * 100)

    meta = data['report_meta']
    print(f"\nTotal Requests: {meta['total_requests']}")
    print(f"Unique Endpoints: {meta['unique_endpoints']}")
    print(f"Sectors Found: {meta['sectors_found']}")

    print("\n\nAPI Calls by Sector:")
    for sector, calls in data['api_usage_stats']['by_sector'].items():
        print(f"  {sector:20} {calls:3} calls")

    print("\n\nTop Used Endpoints:")
    for i, ep in enumerate(data['api_usage_stats']['top_endpoints'][:5], 1):
        print(f"  {i}. {ep['endpoint']:50} ({ep['calls']} calls)")

    print(f"\n\nCritical Issues: {len(data['critical_issues'])}")
    print(f"Immediate Actions: {len(data['action_items']['immediate'])}")

if __name__ == '__main__':
    data = load_analysis()

    if len(sys.argv) < 2:
        show_summary(data)
        print("\n\nUsage:")
        print("  python query_api.py summary         - Show summary statistics")
        print("  python query_api.py issues          - Show critical issues")
        print("  python query_api.py enterprise_finance  - Show enterprise finance sector")
        print("  python query_api.py electricity_energy  - Show electricity sector")
        print("  python query_api.py steel_commodities   - Show steel sector")
    elif sys.argv[1] == 'summary':
        show_summary(data)
    elif sys.argv[1] == 'issues':
        show_critical_issues(data)
    elif sys.argv[1] in data['sectors']:
        show_sector(sys.argv[1], data)
    else:
        print(f"Unknown option: {sys.argv[1]}")
        print("Available sectors: enterprise_finance, electricity_energy, steel_commodities")
