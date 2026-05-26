// static/js/sector-rubber.js
// Render trang ngành Cao su — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)
// Lưu ý: WiChart cao_su stale ~15 tháng → hiển thị badge cảnh báo

(async function SectorRubber() {
  let data;
  try {
    const res = await fetch('/api/sector/rubber/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Cao su — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Cao su';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Cao su — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c, data.block_f);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Cao su = khai thác, đầu vào là chi phí tĩnh.
  // Theo dõi Brent (logistics + máy thu hoạch) + WTI làm tham chiếu
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Giá dầu (chi phí thu hoạch & logistics)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-oil"></div>
    </div>
  `);
  const cardOil = container.lastElementChild;
  const seriesBrent = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 65));
  const seriesWti   = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 67));
  function renderOil(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-oil', {
      yAxis: [{ title: { text: 'USD/Bbl' } }],
      series: [
        { name: 'Brent (USD/Bbl)', data: seriesBrent.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'WTI (USD/Bbl)', data: seriesWti.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(cardOil, renderOil);
  renderOil('1Y');

  // USD/VND
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-usdvnd"></div>
    </div>
  `);
  const cardUsd = container.lastElementChild;
  const usdData = parseFindicatorSeries(blockA.usd_vnd);
  function renderUsd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-usdvnd', {
      yAxis: [{ title: { text: 'VND/USD' } }],
      series: [{ name: 'USD/VND', data: usdData.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(cardUsd, renderUsd);
  renderUsd('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Tổng quan ngành — diện tích, ứng dụng (tĩnh)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Cơ cấu ứng dụng cao su tự nhiên (%)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-application"></div>
    </div>
  `);
  const overview = blockB.overview;
  const appData = overview?.rubberApplication;
  if (appData && Array.isArray(appData) && appData.length) {
    createChart('chart-application', {
      chart: { type: 'pie' },
      series: [{
        name: 'Ứng dụng',
        data: appData.map(r => ({ name: r.name || r.category, y: r.value || r.percent })),
      }],
    });
  } else {
    showEmpty('chart-application');
  }

  // Chart 2: Sản lượng cao su VN theo năm
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Sản lượng cao su VN theo năm</span>
      </div>
      <div class="chart-container chart-sm" id="chart-production"></div>
    </div>
  `);
  const overallData = overview?.rubberOverall;
  if (overallData && Array.isArray(overallData) && overallData.length) {
    const years = overallData.map(r => r.year || r.name || '');
    const vals  = overallData.map(r => r.value || r.production || 0);
    createChart('chart-production', {
      chart: { type: 'column' },
      xAxis: { categories: years },
      series: [{ name: 'Sản lượng (Nghìn tấn)', data: vals, color: HC_COLORS[0] }],
    });
  } else {
    showEmpty('chart-production');
  }

  // Chart 3: XK cao su VN YoY
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK cao su VN YoY (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-export-yoy"></div>
    </div>
  `);
  const cardYoy = container.lastElementChild;
  const exportYoyData = parseFindicatorSeries(blockB.export_yoy);
  function renderYoy(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-export-yoy', {
      series: [{ name: 'XK YoY (%)', data: exportYoyData.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(cardYoy, renderYoy);
  renderYoy('1Y');

  // Diện tích canh tác cao su theo quốc gia
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Diện tích canh tác cao su (nghìn ha, năm mới nhất)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-farming"></div>
    </div>
  `);
  const farmData = overview?.rubberFarming;
  if (farmData && Array.isArray(farmData) && farmData.length) {
    const byCountry = {};
    farmData.forEach(r => {
      const name = r.country?.country || r.country || 'Khác';
      if (!byCountry[name] || r.year > byCountry[name].year) byCountry[name] = r;
    });
    const entries = Object.entries(byCountry).sort((a, b) => b[1].value - a[1].value);
    createChart('chart-farming', {
      chart: { type: 'bar' },
      xAxis: { categories: entries.map(([k]) => k) },
      yAxis: { title: { text: 'Nghìn ha' } },
      series: [{
        name: 'Diện tích (nghìn ha)',
        data: entries.map(([, r]) => parseFloat((r.value / 1000).toFixed(0))),
        color: HC_COLORS[0],
      }],
    });
  } else {
    showEmpty('chart-farming');
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  // Chart 1: JPX (JPY/Kg) — data-year-options="1Y,3Y,5Y" (MAX → null)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá cao su JPX (JPY/Kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-jpx"></div>
    </div>
  `);
  const cardJpx = container.lastElementChild;
  const jpxData = parseFindicatorSeries(blockC.jpx);
  function renderJpx(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-jpx', {
      yAxis: [{ title: { text: 'JPY/Kg' } }],
      series: [{ name: 'JPX (JPY/Kg)', data: jpxData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(cardJpx, renderJpx);
  renderJpx('1Y');

  // Chart 2: Singapore TSR20 (USD Cents/Kg) + WiChart (stale badge)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Cao su Singapore TSR20 (USD Cents/Kg)</span>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="stale-badge" style="display:none"></span>
          <div class="year-btns"></div>
        </div>
      </div>
      <div class="chart-container" id="chart-sgx"></div>
    </div>
  `);
  const cardSgx = container.lastElementChild;
  const sgxData = parseFindicatorSeries(blockC.singapore);

  // WiChart backup — stale ~15 tháng, set badge
  const wiData = parseFindicatorSeries(blockC.wichart_cao_su?.data || blockC.wichart_cao_su);
  if (blockC.wichart_cao_su?.stale) {
    setStaleBadge(cardSgx, 'warn', blockC.wichart_cao_su.stale_reason || 'Dữ liệu đến 02/2025');
  }

  function renderSgx(year) {
    const cutoff = yearToCutoff(year);
    const series = [];
    if (sgxData.length) {
      series.push({ name: 'TSR20 Findicator (USd/Kg)', data: sgxData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] });
    }
    if (wiData.length) {
      series.push({ name: 'WiChart (stale 02/2025)', data: wiData.filter(p => p[0] >= cutoff), color: HC_COLORS[2], dashStyle: 'Dot' });
    }
    if (series.length) {
      createStockChart('chart-sgx', { series });
    } else {
      showEmpty('chart-sgx');
    }
  }
  initYearButtons(cardSgx, renderSgx);
  renderSgx('1Y');
}


function _quarterLabelToTs(label) {
  // "2024Q1" format
  const m = label.match(/(\d{4})Q(\d)/);
  if (m) return new Date(parseInt(m[1]), (parseInt(m[2]) - 1) * 3, 1).getTime();
  // fallback ISO
  const d = new Date(label);
  return isNaN(d) ? null : d.getTime();
}

function renderBlockD(blockA, blockC, blockF) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá TSR20 vs Biên gộp DN (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-lg" id="chart-spread"></div>
    </div>
  `);
  const card = container.lastElementChild;

  const tsr20Data = parseFindicatorSeries(blockC.singapore);

  // Tính biên gộp theo quý cho từng DN
  const TICKERS_D = ['DPR', 'PHR', 'TRC'];
  const marginSeries = [];
  TICKERS_D.forEach((ticker, i) => {
    const rows = getTickerRows(blockF, ticker);
    const { quarters, getQ } = getQuarterRows(rows, 16);
    const revenue = getQ(24);
    const gp      = getQ(28);
    const data = quarters.map((q, idx) => {
      const rev = revenue[idx], gross = gp[idx];
      if (!rev || !gross || rev === 0) return null;
      const ts = _quarterLabelToTs(q);
      return ts ? [ts, parseFloat((gross / rev * 100).toFixed(1))] : null;
    }).filter(Boolean);
    if (data.length) {
      marginSeries.push({
        name: `Biên gộp ${ticker} (%)`,
        data,
        color: HC_COLORS[i + 1],
        type: 'line',
        yAxis: 1,
        step: 'left',
        tooltip: { valueSuffix: '%' },
      });
    }
  });

  function renderSpread(year) {
    const cutoff = yearToCutoff(year);
    const series = [];
    if (tsr20Data.length) {
      series.push({
        name: 'TSR20 (USD Cents/Kg)',
        data: tsr20Data.filter(p => p[0] >= cutoff),
        color: HC_COLORS[0],
        yAxis: 0,
      });
    }
    marginSeries.forEach(s => series.push({ ...s, data: s.data.filter(p => p[0] >= cutoff) }));
    if (series.length) {
      createStockChart('chart-spread', {
        yAxis: [
          { title: { text: 'USD Cents/Kg' } },
          { title: { text: 'Biên gộp %' }, opposite: true, labels: { format: '{value}%' } },
        ],
        series,
      });
    } else {
      showEmpty('chart-spread', 'Chưa có dữ liệu');
    }
  }
  initYearButtons(card, renderSpread);
  renderSpread('1Y');
}


function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE);
}
function renderBlockF(blockF) {
  const container = document.getElementById('block-f-charts');
  Object.keys(blockF || {}).forEach(ticker => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">BCTC ${ticker} — 8 quý</span></div>
        <div class="chart-container chart-lg" id="chart-bctc-${ticker}"></div>
      </div>
    `);
    renderBctcChart(`chart-bctc-${ticker}`, ticker, blockF);
  });
}