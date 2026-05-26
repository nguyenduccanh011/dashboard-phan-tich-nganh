# Findicator enterprise API probe - 2026-05-26

Sau khi `collectors.base` t? `load_dotenv()`, c?c endpoint enterprise auth ho?t ??ng khi ch?y collector/probe tr?c ti?p.

## aviation
- `enterprise/overview-dividend` params={'ticket': 'HVN', 'year': 'All'} -> n=20 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'HVN'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'HVN', 'period': 'quarter', 'year': 'All'} -> n=44 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'HVN', 'period': 'quarter', 'year': 'All'} -> n=44 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'HVN'} -> n=2 keys=yearList,quarterList

## bank
- `enterprise/overview-dividend` params={'ticket': 'VCB', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'VCB'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'VCB'} -> n=2 keys=yearList,quarterList
- `enterprise/bank-revenue` params={'ticket': 'VCB', 'period': 'quarter', 'year': '5Y'} -> n=100 keys=year,quarter,date,type,value
- `enterprise/bank-profit-after-tax` params={'ticket': 'VCB', 'period': 'quarter', 'year': '5Y'} -> n=20 keys=year,quarter,date,type,value
- `enterprise/bank-bad-debt-ratio` params={'ticket': 'VCB', 'period': 'quarter', 'year': '5Y'} -> n=40 keys=year,quarter,date,type,value
- `enterprise/bank-loan-over-time` params={'ticket': 'VCB', 'period': 'quarter', 'year': '5Y'} -> n=40 keys=year,quarter,date,type,value
- `enterprise/bank-client-debt` params={'ticket': 'VCB', 'period': 'quarter', 'year': '5Y'} -> n=10 keys=year,quarter,date,type,value
- `enterprise/bank-asset` params={'ticket': 'VCB', 'period': 'quarter', 'year': '5Y'} -> n=100 keys=year,quarter,date,type,value
- `enterprise/bank-debt` params={'ticket': 'VCB', 'period': 'quarter', 'year': '5Y'} -> n=100 keys=year,quarter,date,type,value

## cement
- `enterprise/overview-dividend` params={'ticket': 'HT1', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'HT1'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'HT1', 'period': 'quarter', 'year': 'All'} -> n=77 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'HT1', 'period': 'quarter', 'year': 'All'} -> n=77 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'HT1'} -> n=2 keys=yearList,quarterList

## chemistry
- `enterprise/overview-dividend` params={'ticket': 'DGC', 'year': 'All'} -> n=24 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'DGC'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'DGC', 'period': 'quarter', 'year': 'All'} -> n=52 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'DGC', 'period': 'quarter', 'year': 'All'} -> n=52 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'DGC'} -> n=2 keys=yearList,quarterList

## coffee
- `enterprise/overview-dividend` params={'ticket': 'VCF', 'year': 'All'} -> n=32 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'VCF'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'VCF', 'period': 'quarter', 'year': 'All'} -> n=67 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'VCF', 'period': 'quarter', 'year': 'All'} -> n=67 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'VCF'} -> n=2 keys=yearList,quarterList

## electricity
- `enterprise/overview-dividend` params={'ticket': 'POW', 'year': 'All'} -> n=20 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'POW'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'POW', 'period': 'quarter', 'year': 'All'} -> n=37 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'POW', 'period': 'quarter', 'year': 'All'} -> n=37 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'POW'} -> n=2 keys=yearList,quarterList

## food-beverage
- `enterprise/overview-dividend` params={'ticket': 'VNM', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'VNM'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'VNM', 'period': 'quarter', 'year': 'All'} -> n=85 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'VNM', 'period': 'quarter', 'year': 'All'} -> n=85 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'VNM'} -> n=2 keys=yearList,quarterList

## gold
- `enterprise/overview-dividend` params={'ticket': 'PNJ', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'PNJ'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'PNJ', 'period': 'quarter', 'year': 'All'} -> n=74 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'PNJ', 'period': 'quarter', 'year': 'All'} -> n=74 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'PNJ'} -> n=2 keys=yearList,quarterList

## industry
- `enterprise/overview-dividend` params={'ticket': 'BCM', 'year': 'All'} -> n=20 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'BCM'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'BCM', 'period': 'quarter', 'year': 'All'} -> n=34 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'BCM', 'period': 'quarter', 'year': 'All'} -> n=34 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'BCM'} -> n=2 keys=yearList,quarterList

## insurance
- `enterprise/overview-dividend` params={'ticket': 'BVH', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'BVH'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'BVH'} -> n=2 keys=yearList,quarterList
- `enterprise/insurance-revenue` params={'ticket': 'BVH', 'period': 'quarter', 'year': '5Y'} -> n=20 keys=year,quarter,date,type,value

## logistics
- `enterprise/overview-dividend` params={'ticket': 'GMD', 'year': 'All'} -> n=30 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'GMD'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'GMD', 'period': 'quarter', 'year': 'All'} -> n=78 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'GMD', 'period': 'quarter', 'year': 'All'} -> n=78 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'GMD'} -> n=2 keys=yearList,quarterList

## oilgas
- `enterprise/overview-dividend` params={'ticket': 'GAS', 'year': 'All'} -> n=30 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'GAS'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'GAS', 'period': 'quarter', 'year': 'All'} -> n=59 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'GAS', 'period': 'quarter', 'year': 'All'} -> n=59 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'GAS'} -> n=2 keys=yearList,quarterList

## pangasius
- `enterprise/overview-dividend` params={'ticket': 'VHC', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'VHC'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'VHC', 'period': 'quarter', 'year': 'All'} -> n=75 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'VHC', 'period': 'quarter', 'year': 'All'} -> n=75 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'VHC'} -> n=2 keys=yearList,quarterList

## pharma
- `enterprise/overview-dividend` params={'ticket': 'DHG', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'DHG'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'DHG', 'period': 'quarter', 'year': 'All'} -> n=82 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'DHG', 'period': 'quarter', 'year': 'All'} -> n=82 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'DHG'} -> n=2 keys=yearList,quarterList

## pig
- `enterprise/overview-dividend` params={'ticket': 'DBC', 'year': 'All'} -> n=32 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'DBC'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'DBC', 'period': 'quarter', 'year': 'All'} -> n=73 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'DBC', 'period': 'quarter', 'year': 'All'} -> n=73 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'DBC'} -> n=2 keys=yearList,quarterList

## plastics
- `enterprise/overview-dividend` params={'ticket': 'BMP', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'BMP'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'BMP', 'period': 'quarter', 'year': 'All'} -> n=85 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'BMP', 'period': 'quarter', 'year': 'All'} -> n=85 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'BMP'} -> n=2 keys=yearList,quarterList

## realestate
- `enterprise/overview-dividend` params={'ticket': 'VHM', 'year': 'All'} -> n=20 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'VHM'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'VHM', 'period': 'quarter', 'year': 'All'} -> n=34 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'VHM', 'period': 'quarter', 'year': 'All'} -> n=34 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'VHM'} -> n=2 keys=yearList,quarterList

## rice
- `enterprise/overview-dividend` params={'ticket': 'LTG', 'year': 'All'} -> n=20 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'LTG'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'LTG', 'period': 'quarter', 'year': 'All'} -> n=31 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'LTG', 'period': 'quarter', 'year': 'All'} -> n=31 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'LTG'} -> n=2 keys=yearList,quarterList

## rubber
- `enterprise/overview-dividend` params={'ticket': 'DPR', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'DPR'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'DPR', 'period': 'quarter', 'year': 'All'} -> n=77 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'DPR', 'period': 'quarter', 'year': 'All'} -> n=77 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'DPR'} -> n=2 keys=yearList,quarterList

## securities
- `enterprise/overview-dividend` params={'ticket': 'SSI', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'SSI'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'SSI'} -> n=2 keys=yearList,quarterList
- `enterprise/stock-revenue` params={'ticket': 'SSI', 'period': 'quarter', 'year': '5Y'} -> n=100 keys=year,quarter,type,value,date

## shrimp
- `enterprise/overview-dividend` params={'ticket': 'FMC', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'FMC'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'FMC', 'period': 'quarter', 'year': 'All'} -> n=81 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'FMC', 'period': 'quarter', 'year': 'All'} -> n=81 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'FMC'} -> n=2 keys=yearList,quarterList

## steel
- `enterprise/overview-dividend` params={'ticket': 'HPG', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'HPG'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'HPG', 'period': 'quarter', 'year': 'All'} -> n=77 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'HPG', 'period': 'quarter', 'year': 'All'} -> n=77 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'HPG'} -> n=2 keys=yearList,quarterList

## technology
- `enterprise/overview-dividend` params={'ticket': 'FPT', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'FPT'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'FPT', 'period': 'quarter', 'year': 'All'} -> n=80 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'FPT', 'period': 'quarter', 'year': 'All'} -> n=80 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'FPT'} -> n=2 keys=yearList,quarterList

## textile
- `enterprise/overview-dividend` params={'ticket': 'TCM', 'year': 'All'} -> n=34 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'TCM'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'TCM', 'period': 'quarter', 'year': 'All'} -> n=75 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'TCM', 'period': 'quarter', 'year': 'All'} -> n=75 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'TCM'} -> n=2 keys=yearList,quarterList

## transport
- `enterprise/overview-dividend` params={'ticket': 'HAH', 'year': 'All'} -> n=24 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'HAH'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'HAH', 'period': 'quarter', 'year': 'All'} -> n=51 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'HAH', 'period': 'quarter', 'year': 'All'} -> n=51 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'HAH'} -> n=2 keys=yearList,quarterList

## wood
- `enterprise/overview-dividend` params={'ticket': 'PTB', 'year': 'All'} -> n=32 keys=year,type,value
- `enterprise/report-data-prediction` params={'ticket': 'PTB'} -> n=2 keys=realData,predictData
- `enterprise/manufactoring-revenue` params={'ticket': 'PTB', 'period': 'quarter', 'year': 'All'} -> n=66 keys=year,quarter,date,type,value
- `enterprise/manufactoring-profit-after-tax` params={'ticket': 'PTB', 'period': 'quarter', 'year': 'All'} -> n=66 keys=year,quarter,date,type,value
- `enterprise/manufactoring-revenue-to-profit-ratio-metadata` params={'ticket': 'PTB'} -> n=2 keys=yearList,quarterList
