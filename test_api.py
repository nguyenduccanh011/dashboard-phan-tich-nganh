#!/usr/bin/env python3
import httpx
import json

async def test_api():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get("http://localhost:8000/api/sector/electricity/cache")
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                print(f"✅ API trả về dữ liệu thành công")
                print(f"   Sector: {data.get('sector_name')}")
                print(f"   Updated: {data.get('updated_at')}")
                print(f"   Tickers: {data.get('tickers', [])[:3]}...")
                print(f"   block_a keys: {list(data.get('block_a', {}).keys())[:3]}...")
            else:
                print(f"❌ API trả về lỗi: {resp.status_code}")
                print(resp.text[:500])
        except Exception as e:
            print(f"❌ Không thể kết nối: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_api())
