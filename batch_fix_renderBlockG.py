"""Batch fix renderBlockG calls in all sector JS files."""
import re
from pathlib import Path

files = [
    ("aviation", "aviation"),
    ("bank", "bank"),
    ("cement", "cement"),
    ("chemistry", "chemistry"),
    ("coffee", "coffee"),
    ("electricity", "electricity"),
    ("food_beverage", "food-beverage"),
    ("industry", "industry"),
    ("insurance", "insurance"),
    ("logistics", "logistics"),
    ("oilgas", "oilgas"),
    ("pangasius", "pangasius"),
    ("pig", "pig"),
    ("plastics", "plastics"),
    ("realestate", "realestate"),
    ("rice", "rice"),
    ("rubber", "rubber"),
    ("securities", "securities"),
    ("shrimp", "shrimp"),
    ("textile", "textile"),
    ("transport", "transport"),
]

js_dir = Path("static/js")

for name, filename in files:
    file = js_dir / f"sector-{filename}.js"
    if not file.exists():
        print(f"[WARN] {name}: file not found")
        continue

    content = file.read_text(encoding='utf-8')

    # Replace renderBlockG with window.renderBlockG
    old_pattern = r'renderBlockG\(data\.block_g'
    new_pattern = r'window.renderBlockG(data.block_g'

    if re.search(old_pattern, content):
        new_content = re.sub(old_pattern, new_pattern, content)
        file.write_text(new_content, encoding='utf-8')
        print(f"[OK] {name}: fixed")
    else:
        print(f"[--] {name}: already fixed or pattern not found")
