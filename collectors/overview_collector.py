"""
Overview Collector — thị trường tổng quát và tin tức.
Output: cache/overview_market.json

Coverage:
  - 66 live prices + metadata (legend)
  - 7 overview tabs (lãi suất/lạm phát/PMI/VN macro/XK/NK)
  - News feed search
"""
import asyncio, json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, transform_keys

CACHE_FILE = Path("cache/overview_market.json")


async def collect():
    """Thu thập dữ liệu tổng quan thị trường."""

    legend = await _collect_legend()
    overview_tabs = await _collect_overview_tabs()
    news = await _collect_news()

    cache = {
        "sector": "overview",
        "updated_at": datetime.now().isoformat(),
        "legend": legend,
        "overview_tabs": overview_tabs,
        "news": news,
    }

    CACHE_FILE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"[overview] cache saved → {CACHE_FILE}")


async def _collect_legend():
    """66 live prices + metadata."""
    try:
        legend = await findicator.get_overview_legend()
        return legend
    except Exception as e:
        print(f"[overview] legend error: {e}")
        return {}


async def _collect_overview_tabs():
    """7 overview tabs (lãi suất/lạm phát/PMI/VN macro/XK/NK/BĐS)."""
    tabs = {}

    # Tab indices: 1=lãi suất, 2=lạm phát, 3=PMI, 4=VN macro, 5=XK/NK, 6=BĐS, 7=khác
    tab_ids = ["1", "2", "3", "4", "5", "6", "7"]
    tab_names = ["interest_rate", "inflation", "pmi", "vn_macro", "trade", "real_estate", "other"]

    for tab_id, tab_name in zip(tab_ids, tab_names):
        try:
            data = await findicator.get_overview_data(tab_id=tab_id)
            tabs[tab_name] = {
                "tab_id": tab_id,
                "data": data,
            }
        except Exception as e:
            print(f"[overview] tab {tab_name}/{tab_id} error: {e}")
            tabs[tab_name] = {"error": str(e), "tab_id": tab_id}

    return tabs


async def _collect_news():
    """News feed."""
    news_data = {}

    # Global news
    try:
        global_news = await findicator.get_news(limit=100)
        news_data["global"] = global_news
    except Exception as e:
        print(f"[overview] news global error: {e}")
        news_data["global"] = {"error": str(e)}

    # News per-major ticker (sample: 5 banks + 5 securities + 3 enterprises)
    major_tickers = ["VCB", "ACB", "VPB", "MBB", "TPB", "SSI", "AAS", "MAS", "VNS", "VCS", "VIC", "FPT", "VHM"]

    ticker_news = {}
    for ticker in major_tickers:
        try:
            news = await findicator.get_news(ticket=ticker, limit=20)
            ticker_news[ticker] = news
        except Exception as e:
            print(f"[overview] news/{ticker} error: {e}")
            ticker_news[ticker] = {"error": str(e)}

    news_data["by_ticker"] = ticker_news

    return news_data


if __name__ == "__main__":
    asyncio.run(collect())
