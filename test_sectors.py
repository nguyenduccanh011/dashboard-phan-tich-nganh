#!/usr/bin/env python3
"""Test all sector endpoints and check data availability"""
import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"
SECTORS = [
    "electricity", "steel", "cement", "pig", "chemistry", "bank",
    "stock", "textile", "rubber", "food-and-beverage", "real-estate",
    "transport", "shrimp", "pangasius", "aviation", "industry",
    "plastics", "insurance", "oilgas", "gold", "coffee", "wood",
    "pharma", "logistics", "rice", "pepper", "technology"
]

def test_sector(sector):
    """Test a sector endpoint and report status"""
    url = f"{BASE_URL}/api/sector/{sector}/cache"
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            sector_name = data.get('sector_name', sector)
            tickers = data.get('tickers', [])
            updated_at = data.get('updated_at', 'N/A')
            keys = list(data.keys())

            print(f"[OK] {sector:20s} | {sector_name:15s} | Tickers: {len(tickers):2d} | Keys: {len(keys)}")
            print(f"     Updated: {updated_at}")
            print(f"     Data blocks: {[k for k in keys if k.startswith('block_')]}")
            return True
        else:
            print(f"[FAIL] {sector:20s} | Status {resp.status_code}")
            return False
    except Exception as e:
        print(f"[ERROR] {sector:20s} | {str(e)[:60]}")
        return False

print("Testing all sector endpoints...")
print("=" * 100)

success = 0
for sector in SECTORS:
    if test_sector(sector):
        success += 1
    print()

print("=" * 100)
print(f"Summary: {success}/{len(SECTORS)} sectors working")
