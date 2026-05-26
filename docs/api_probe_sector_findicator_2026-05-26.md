# Findicator sector API probe - 2026-05-26

Total candidates: 352

## aviation
OK=3 empty=0 404=4 err=6

- aviation/legend n=8 keys=macroDimInternationlvisitor,macroDimTransCarriedPassenger,macroDimTransTrafficPassenger,companyFlights,macroDimTransCarriedFreight
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## bank
OK=4 empty=0 404=4 err=3

- bank/legends n=10 keys=macroGlobalDimUnitedStates,macroVnDimInterestRateCentralBank,macroVnDimInterestRateCommercialBank,macroGlobalDimExchangeRate,macroVnDimExchangeRateUsd
- bank/overview/bank-data n=3 keys=casaAndCof,yeaAndNpl,crWRA
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## cement
OK=6 empty=0 404=4 err=6

- cement/legend n=4 keys=macroDimComdtyCementLegends,macroVnDimComdtyCementLegends,macroVnDimPrdIndustrialProductCementLegends,macroVnDimEximExcomdtyCementLegends
- cement/coal-price n=1308 keys=id,period,date,name_id,value
- cement/average-export-price n=60 keys=id,period,date,name_id,unit
- cement/internal-cement-price n=52 keys=id,period,date,name_id,value
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## chemistry
OK=7 empty=0 404=5 err=3

- chemistry/legends n=5 keys=macroDimComdty,macroDimComdtyVN,macroVnDimPrdIndustrialProduct,macroVnDimMoitIndustrialProduct,countries
- chemistry/overview/fertilizer-data n=3 keys=ureaCoal,ureaGas,phosphate
- chemistry/overview/caustic-soda-data n=2 keys=costStructure,application
- chemistry/overview/phosphorus-data n=2 keys=volumeAparitGlobal,yellowPhosphorus
- chemistry/fertilizer-product-price n=4544 keys=id,period,date,name_id,value
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## coffee
OK=2 empty=0 404=6 err=3

- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## electricity
OK=8 empty=0 404=6 err=3

- electricity/electric-output-plant n=36 keys=id,name,sortIndex,data
- electricity/output-resource-by-proportion n=406 keys=id,period,date,unit,value
- electricity/output-resource-by-value n=3 keys=date,unit,value
- electricity/lake-name n=40 keys=id,lakename,province,region,level_avg
- electricity/policy-resource n=56 keys=id,period,date,unit,value
- electricity/output-price n=3 keys=date,value
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## food-beverage
OK=5 empty=0 404=3 err=6

- food-and-beverage/legends n=4 keys=macroDimComdty,macroDimComdtyVN,macroVnDimPrdIndustrialProduct,macroVnDimEximComdty
- food-and-beverage/overview/beer-data n=4 keys=beerCostStructure,beerConsumptionByProduct,beerConsumptionByCountry,beerConsumptionByChannel
- food-and-beverage/overview/milk-data n=3 keys=milkDomesticCows,milkMarketShare,milkProductStructure
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## gold
OK=2 empty=0 404=6 err=3

- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## industry
OK=9 empty=0 404=6 err=5

- industry/prd-pmi n=60 keys=date,unit,value
- industry/prd-iip n=60 keys=date,unit,value
- industry/fdi-sector-by-province n=50 keys=date,label_id,label_name_legend,month_yoy_value,month_yoy_value_unit
- industry/fdi-status n=2 keys=fdi_realized,fdi_sector
- industry/region-land n=36 keys=id,period,date,region,price
- industry/province-factory n=16 keys=id,period,date,province,priceMin
- industry/company-approval n=20 keys=id,period,date,ticket,type
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## insurance
OK=2 empty=0 404=6 err=4

- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## logistics
OK=2 empty=0 404=6 err=3

- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## oilgas
OK=2 empty=0 404=6 err=3

- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## pangasius
OK=6 empty=0 404=4 err=6

- pangasius/legend n=7 keys=id,name,sortIndex,levelIndex,nameLegend
- pangasius/overview/pangasius-data n=2 keys=pangasiusCostStructure,pangasiusMarketStructure
- pangasius/export-year-over-year n=3 keys=date,turnover,quantity
- pangasius/export-quantity-to-markets n=4 keys=country_id,country_name,data
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## pepper
OK=0 empty=0 404=6 err=0


## pharma
OK=2 empty=0 404=6 err=3

- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## pig
OK=3 empty=0 404=5 err=6

- pig/legend n=4 keys=macroDimComdty,macroDimComdtyVN,pigDimFarmingGlobal,macroGlobalDimImportComdty
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## plastics
OK=2 empty=0 404=6 err=3

- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## realestate
OK=6 empty=0 404=5 err=3

- real-estate/legends n=8 keys=realEstateDimInterestRate,realEstateDimOpinions,realEstateDimFunding,realEstateType,macroVnDimStateRevenuesTaxation
- real-estate/laws n=19 keys=2006,2008,2009,2010,2011
- real-estate/core-index-valuation n=1 keys=ticket,min,max,latest,latest_date
- real-estate/company-project n=14 keys=id,date,ticket,project_name,ownership
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## rice
OK=2 empty=0 404=6 err=3

- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## rubber
OK=5 empty=1 404=2 err=5

- rubber/legends n=4 keys=macroDimComdty,macroVnDimEximExcomdty,macroGlobalDimImportComdty,macroGlobalDimExportComdty
- rubber/overview/rubber-data n=4 keys=rubberOverall,rubberApplication,country,rubberFarming
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## securities
OK=10 empty=0 404=4 err=3

- stock/legends n=12 keys=macroGlobalDimStock,macroGlobalDimBond,macroGlobalDimExchangeRate,macroGlobalDimCrypto,macroVnDimStock
- stock/overview/stock-data n=2 keys=securityBondCorporate,securityGrossProfit
- stock/brokerage-market-share-companies n=35 keys=ticket,corp_name,value
- stock/gross-profit-structure n=5 keys=year,quarter,type,value,date
- stock/enterprise-stock-revenue n=100 keys=year,quarter,type,value,date
- stock/enterprise-stock-asset n=100 keys=year,quarter,date,type,value
- stock/enterprise-stock-debt n=60 keys=year,quarter,date,type,value
- stock/money-flow n=13 keys=name_id,month,start_date,value
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## shrimp
OK=7 empty=0 404=3 err=6

- shrimp/legends n=3 keys=macroDimComdty,macroDimComdtyVN,countries
- shrimp/enterprise-corp-name n=3 keys=id,ticket,floor,corp_type_id,corp_name
- shrimp/overview/shrimp-data n=8 keys=shrimpFarmingVolumeEcuador,shrimpFarmingVolumeAsia,shrimpCostStructure,shrimpVolumeAreaVietNam,shrimpVolumeAreaIndia
- shrimp/enterprise-export-status n=5 keys=date,turnover,quantity
- shrimp/enterprise-export-price-to-markets n=4 keys=country_id,country_name,data
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## steel
OK=9 empty=0 404=2 err=5

- steel/legend n=4 keys=macroDimComdty,macroDimComdtyVN,corpNames,steelCNDimOverall
- steel/enterprise-corp-name n=4 keys=id,ticket,floor,corp_type_id,corp_name
- steel/overview/steel-data n=4 keys=steelOverviewDim,steelOverviewImportValue,steelManufacturingCountryData,steelManufacturingCountry
- steel/domestic-market-share n=940 keys=id,period,date,ticket,name_id
- steel/enterprise-domestic-market-share n=180 keys=id,period,date,ticket,name_id
- steel/enterprise-quantity-structure n=120 keys=id,period,date,ticket,market
- steel/demand-export-status n=4 keys=name_id,data
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## technology
OK=2 empty=0 404=6 err=3

- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## textile
OK=4 empty=0 404=3 err=5

- textile/legends n=7 keys=macroDimComdty,macroDimComdtyVN,macroVnDimEximComdty,macroGlobalDimExportComdty,macroVnDimLabourIndex
- textile/overview/textile-data n=4 keys=country,textileExportOverall,textileApplication,textileExportCountry
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## transport
OK=4 empty=0 404=4 err=4

- transport/legends n=1 keys=macroDimComdty
- transport/values n=9235 keys=id,period,date,name_id,value
- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData

## wood
OK=2 empty=0 404=6 err=3

- enterprise/corp-profile n=20 keys=id,tradingDate,ticket,closePrice,priceChange
- enterprise/report-data-prediction n=2 keys=realData,predictData
