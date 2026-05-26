import os
import asyncio
import logging
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

load_dotenv()

from routers import sector, macro, stock, enterprise, admin
from collectors import (
    steel_collector, bank_collector, cement_collector, pangasius_collector,
    shrimp_collector, aviation_collector, rubber_collector, pig_collector,
    chemistry_collector, textile_collector, industry_collector, realestate_collector,
    transport_collector, securities_collector, food_beverage_collector, electricity_collector,
    plastics_collector, insurance_collector, oilgas_collector, gold_collector,
    coffee_collector, wood_collector, pharma_collector, logistics_collector,
    rice_collector, pepper_collector, technology_collector,
    macro_collector, enterprise_collector, overview_collector,
)

logger = logging.getLogger(__name__)

app = FastAPI(title="Sector Hub")
app.include_router(sector.router, prefix="/api/sector")
app.include_router(macro.router, prefix="/api/macro")
app.include_router(stock.router, prefix="/api/stock")
app.include_router(enterprise.router, prefix="/api/enterprise")
app.include_router(admin.router, prefix="/api/admin")
app.mount("/static", StaticFiles(directory="static"), name="static")

scheduler = AsyncIOScheduler(timezone="Asia/Ho_Chi_Minh")

@app.on_event("startup")
async def startup():
    # Cron 7:30 sáng hàng ngày
    scheduler.add_job(refresh_all_caches, "cron", hour=7, minute=30)
    scheduler.start()

async def refresh_all_caches():
    """Chạy tất cả collectors song song, log lỗi từng collector riêng."""
    collectors = [
        ("macro",        macro_collector.collect),
        ("enterprise",   enterprise_collector.collect),
        ("overview",     overview_collector.collect),
        ("steel",        steel_collector.collect),
        ("bank",         bank_collector.collect),
        ("cement",       cement_collector.collect),
        ("pangasius",    pangasius_collector.collect),
        ("shrimp",       shrimp_collector.collect),
        ("aviation",     aviation_collector.collect),
        ("rubber",       rubber_collector.collect),
        ("pig",          pig_collector.collect),
        ("chemistry",    chemistry_collector.collect),
        ("textile",      textile_collector.collect),
        ("industry",     industry_collector.collect),
        ("realestate",   realestate_collector.collect),
        ("transport",    transport_collector.collect),
        ("securities",   securities_collector.collect),
        ("food_bev",     food_beverage_collector.collect),
        ("electricity",  electricity_collector.collect),
        ("plastics",     plastics_collector.collect),
        ("insurance",    insurance_collector.collect),
        ("oilgas",       oilgas_collector.collect),
        ("gold",         gold_collector.collect),
        ("coffee",       coffee_collector.collect),
        ("wood",         wood_collector.collect),
        ("pharma",       pharma_collector.collect),
        ("logistics",    logistics_collector.collect),
        ("rice",         rice_collector.collect),
        ("pepper",       pepper_collector.collect),
        ("technology",   technology_collector.collect),
    ]

    async def run_one(name, fn):
        try:
            await fn()
        except Exception as e:
            logger.error(f"[{name}] collector failed: {e}")

    await asyncio.gather(*[run_one(name, fn) for name, fn in collectors])

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/sector/{code}")
async def sector_page(code: str):
    return FileResponse("static/sector.html")

@app.get("/macro")
async def macro_page():
    return FileResponse("static/macro.html")
