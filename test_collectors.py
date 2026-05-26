"""
Chạy tất cả collectors (30 files: 3 base + 27 sectors) để test API calls.
Log: success/fail, timing, cache file size.
"""
import asyncio
import time
from pathlib import Path
from datetime import datetime

collectors = [
    "macro_collector",
    "enterprise_collector",
    "overview_collector",
    "steel_collector",
    "bank_collector",
    "cement_collector",
    "electricity_collector",
    "pig_collector",
    "aviation_collector",
    "transport_collector",
    "chemistry_collector",
    "rubber_collector",
    "textile_collector",
    "shrimp_collector",
    "pangasius_collector",
    "food_beverage_collector",
    "realestate_collector",
    "securities_collector",
    "insurance_collector",
    "plastics_collector",
    "oilgas_collector",
    "gold_collector",
    "coffee_collector",
    "wood_collector",
    "pharma_collector",
    "logistics_collector",
    "rice_collector",
    "pepper_collector",
    "technology_collector",
    "industry_collector",
]


async def run_collector(module_name):
    """Import and run a single collector."""
    try:
        start = time.time()
        module = __import__(f"collectors.{module_name}", fromlist=["collect"])
        await module.collect()
        elapsed = time.time() - start

        cache_files = list(Path("cache").glob("*.json"))
        cache_sizes = {f.stem: f.stat().st_size for f in cache_files}

        status = "✓"
        message = f"✓ {elapsed:.2f}s"
        return (module_name, status, elapsed, message)
    except Exception as e:
        elapsed = time.time() - start
        status = "✗"
        message = f"✗ {elapsed:.2f}s — {str(e)[:60]}"
        return (module_name, status, elapsed, message)


async def main():
    print(f"Running {len(collectors)} collectors at {datetime.now().isoformat()}")
    print("-" * 80)

    results = []
    for module_name in collectors:
        result = await run_collector(module_name)
        results.append(result)
        print(f"{result[0]:<30} {result[3]}")

    print("-" * 80)
    passed = sum(1 for r in results if r[1] == "✓")
    failed = sum(1 for r in results if r[1] == "✗")
    total_time = sum(r[2] for r in results)

    print(f"\nSummary: {passed} passed, {failed} failed, {total_time:.2f}s total")

    if failed > 0:
        print("\nFailed collectors:")
        for r in results:
            if r[1] == "✗":
                print(f"  {r[3]}")


if __name__ == "__main__":
    asyncio.run(main())
