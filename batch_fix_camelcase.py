"""Batch fix all snake_case field names to camelCase in sector JS files."""
from pathlib import Path

replacements = {
    'deposit_rate': 'depositRate',
    'fed_rate': 'fedRate',
    'usd_vnd': 'usdVnd',
    'balance_of_payments': 'balanceOfPayments',
    'name_legend': 'nameLegend',
    'forex_reserve': 'forexReserve',
    'macro_35': 'macro35',
    'export_status': 'exportStatus',
    'credit_growth': 'creditGrowth',
    'credit_system': 'creditSystem',
    'global_export_price': 'globalExportPrice',
    'global_by_product': 'globalByProduct',
    'global_export_yoy': 'globalExportYoy',
    'retail_food_us': 'retailFoodUs',
    'export_price_tom_the': 'exportPriceTomThe',
    'export_price_tom_su': 'exportPriceTomSu',
    'pepper_price': 'pepperPrice',
    'iip_wood': 'iipWood',
    'timber_price': 'timberPrice',
    'xk_wood': 'xkWood',
    'nk_wood': 'nkWood',
    'fdi_wood': 'fdiWood',
    'stale_badge': 'staleBadge',
    'nk_pharma': 'nkPharma',
    'cpi_pharma': 'cpiPharma',
    'iip_pharma': 'iipPharma',
    'fdi_health': 'fdiHealth',
    'xk_overview': 'xkOverview',
    'xk_computer': 'xkComputer',
    'xk_phone': 'xkPhone',
    'pmi_china': 'pmiChina',
    'us_retail': 'usRetail',
    'china_retail': 'chinaRetail',
    'pepper_yoy': 'pepperYoy',
    'xk_pepper': 'xkPepper',
}

js_dir = Path("static/js")

for file in js_dir.glob("sector-*.js"):
    content = file.read_text(encoding='utf-8')
    original = content

    for snake_case, camel_case in replacements.items():
        # Replace both blockX.snake_case and just .snake_case patterns
        content = content.replace(f'.{snake_case}', f'.{camel_case}')

    if content != original:
        file.write_text(content, encoding='utf-8')
        print(f"[OK] {file.name}")
    else:
        print(f"[--] {file.name}")

print("\nDone!")
